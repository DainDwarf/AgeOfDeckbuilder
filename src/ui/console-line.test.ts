import { describe, expect, it } from 'vitest';
import { runLine, type Screen } from './console-line';
import { VEILS_ON, type Veils } from './veils';

/** A screen holding every entry: `seed`, reading a chronicle's seed, and the two switches. */
const LAUNCHING: Screen = { seed: { reads: -42 }, switches: true };

/** A screen holding `seed` alone, reading a chronicle's seed, and no switch. */
const SEEDING: Screen = { seed: { reads: 42 }, switches: false };

/** A screen holding no entry. */
const BARE: Screen = { seed: undefined, switches: false };

/** The veils a switch already thrown once leaves: the uncharted veil off, the fog standing. */
function uncharted(): Veils {
  return runLine('uncharted', VEILS_ON, LAUNCHING).veils;
}

describe('a line run at the console', () => {
  it('takes the uncharted veil off, and says so', () => {
    const ran = runLine('uncharted', VEILS_ON, LAUNCHING);
    expect(ran.veils).toEqual({ uncharted: false, fog: true });
    expect(ran.answer).toBe('uncharted veil: off');
  });

  it('puts a veil back where a second run of its switch finds it off', () => {
    const ran = runLine('uncharted', uncharted(), LAUNCHING);
    expect(ran.veils).toEqual(VEILS_ON);
    expect(ran.answer).toBe('uncharted veil: on');
  });

  it('takes the fog veil off without touching the other', () => {
    const ran = runLine('fog', uncharted(), LAUNCHING);
    expect(ran.veils).toEqual({ uncharted: false, fog: false });
    expect(ran.answer).toBe('fog veil: off');
  });

  it('answers a word it holds no entry for with the word, and leaves the veils standing', () => {
    const veils = uncharted();
    const ran = runLine('sight', veils, LAUNCHING);
    expect(ran.answer).toBe('no such entry: sight');
    expect(ran.veils).toBe(veils);
    expect(ran.launch).toBeUndefined();
  });

  it('answers nothing at all for an empty line', () => {
    for (const line of ['', '   ']) {
      const ran = runLine(line, VEILS_ON, LAUNCHING);
      expect(ran.answer).toBeUndefined();
      expect(ran.veils).toEqual(VEILS_ON);
      expect(ran.launch).toBeUndefined();
    }
  });

  it('runs a switch the spaces around it are trimmed off', () => {
    expect(runLine('  fog  ', VEILS_ON, LAUNCHING).answer).toBe('fog veil: off');
  });

  it('leaves the veils it was given as they were', () => {
    runLine('uncharted', VEILS_ON, LAUNCHING);
    runLine('fog', VEILS_ON, LAUNCHING);
    expect(VEILS_ON).toEqual({ uncharted: true, fog: true });
  });

  it('answers a number after a switch as a line it holds no entry for, and throws no switch', () => {
    const ran = runLine('fog 3', VEILS_ON, LAUNCHING);
    expect(ran.answer).toBe('no such entry: fog 3');
    expect(ran.veils).toBe(VEILS_ON);
  });

  it('answers a word that only begins with seed as one it holds no entry for', () => {
    expect(runLine('seeds', VEILS_ON, LAUNCHING).answer).toBe('no such entry: seeds');
  });
});

describe('seed run at the console', () => {
  it('answers the seed the screen reads, the minus included, and launches nothing', () => {
    const ran = runLine('seed', VEILS_ON, LAUNCHING);
    expect(ran.answer).toBe('seed: -42');
    expect(ran.launch).toBeUndefined();
    expect(ran.veils).toBe(VEILS_ON);
  });

  it('answers that there is no chronicle where the screen reads no seed', () => {
    expect(runLine('seed', VEILS_ON, { seed: { reads: undefined }, switches: false }).answer).toBe(
      'no chronicle',
    );
  });

  it('launches on the seed typed after it, answering nothing and leaving the veils standing', () => {
    const veils = uncharted();
    const ran = runLine('  seed   1234  ', veils, LAUNCHING);
    expect(ran.launch).toBe(1234);
    expect(ran.answer).toBeUndefined();
    expect(ran.veils).toBe(veils);
  });

  it('launches on a seed at either end of what a seed holds, and on one with a minus', () => {
    expect(runLine('seed -2147483648', VEILS_ON, LAUNCHING).launch).toBe(-2147483648);
    expect(runLine('seed 2147483647', VEILS_ON, LAUNCHING).launch).toBe(2147483647);
    expect(runLine('seed -17', VEILS_ON, LAUNCHING).launch).toBe(-17);
  });

  it('launches on zero where zero is typed with a minus', () => {
    expect(runLine('seed -0', VEILS_ON, LAUNCHING).launch).toBe(0);
  });

  it('refuses what is not a seed with what stood after the word, and launches nothing', () => {
    for (const typed of [
      'abc',
      '1.5',
      '+3',
      '1 2',
      '-',
      '1e3',
      '0x10',
      '2147483648',
      '-2147483649',
      '99999999999999999999',
    ]) {
      const ran = runLine(`seed ${typed}`, VEILS_ON, LAUNCHING);
      expect(ran.answer).toBe(`not a seed: ${typed}`);
      expect(ran.launch).toBeUndefined();
      expect(ran.veils).toBe(VEILS_ON);
    }
  });
});

describe('a line run on a screen holding some entries', () => {
  it('answers a switch the screen does not hold as no entry, and leaves the veils as they were', () => {
    const veils = uncharted();
    for (const line of ['fog', 'uncharted']) {
      const ran = runLine(line, veils, SEEDING);
      expect(ran.answer).toBe(`no such entry: ${line}`);
      expect(ran.veils).toBe(veils);
    }
  });

  it('reads the seed and launches on one where the screen holds seed and no switch', () => {
    expect(runLine('seed', VEILS_ON, SEEDING).answer).toBe('seed: 42');
    expect(runLine('seed 5', VEILS_ON, SEEDING).launch).toBe(5);
  });

  it('still refuses what is not a seed where the screen holds seed and no switch', () => {
    const ran = runLine('seed abc', VEILS_ON, SEEDING);
    expect(ran.answer).toBe('not a seed: abc');
    expect(ran.launch).toBeUndefined();
  });

  it('answers every line as no entry on a screen holding none, and launches nothing', () => {
    for (const line of ['seed', 'seed 3', '  seed abc ', 'fog', 'uncharted']) {
      const ran = runLine(line, VEILS_ON, BARE);
      expect(ran.answer).toBe(`no such entry: ${line.trim()}`);
      expect(ran.launch).toBeUndefined();
      expect(ran.veils).toBe(VEILS_ON);
    }
  });
});
