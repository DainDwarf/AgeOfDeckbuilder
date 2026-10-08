import { describe, expect, it } from 'vitest';
import { runLine, type Screen, type UnitReads } from './console-line';
import { VEILS_ON, type Veils } from './veils';

/** A screen holding `seed`, reading a chronicle's seed, the two switches, and no `unit`. */
const LAUNCHING: Screen = { seed: { reads: -42 }, switches: true, unit: undefined };

/** A screen holding `seed` alone, reading a chronicle's seed, and no switch. */
const SEEDING: Screen = { seed: { reads: 42 }, switches: false, unit: undefined };

/** A screen holding no entry. */
const BARE: Screen = { seed: undefined, switches: false, unit: undefined };

/** The tile the screen holding `unit` has selected. */
const SELECTED = { q: 2, r: -1 };

/**
 * A screen holding `unit` alone, on a chronicle running, `SELECTED` selected: its content holds the
 * kinds `scout` and `boat` and the script `raider`, and every tile refuses a `boat` for its terrain.
 */
function unitScreen(reads: Partial<UnitReads> = {}): Screen {
  return {
    seed: undefined,
    switches: false,
    unit: {
      ended: false,
      selected: SELECTED,
      holdsKind: (kind) => kind === 'scout' || kind === 'boat',
      holdsScript: (script) => script === 'raider',
      refusal: (kind) => (kind === 'boat' ? 'wrong-terrain' : undefined),
      ...reads,
    },
  };
}

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
    expect(ran.next).toBeUndefined();
  });

  it('answers nothing at all for an empty line', () => {
    for (const line of ['', '   ']) {
      const ran = runLine(line, VEILS_ON, LAUNCHING);
      expect(ran.answer).toBeUndefined();
      expect(ran.veils).toEqual(VEILS_ON);
      expect(ran.next).toBeUndefined();
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
    expect(ran.next).toBeUndefined();
    expect(ran.veils).toBe(VEILS_ON);
  });

  it('answers that there is no chronicle where the screen reads no seed', () => {
    const screen: Screen = { seed: { reads: undefined }, switches: false, unit: undefined };
    expect(runLine('seed', VEILS_ON, screen).answer).toBe('no chronicle');
  });

  it('launches on the seed typed after it, answering nothing and leaving the veils standing', () => {
    const veils = uncharted();
    const ran = runLine('  seed   1234  ', veils, LAUNCHING);
    expect(ran.next).toEqual({ kind: 'launch', seed: 1234 });
    expect(ran.answer).toBeUndefined();
    expect(ran.veils).toBe(veils);
  });

  it('launches on a seed at either end of what a seed holds, and on one with a minus', () => {
    for (const seed of [-2147483648, 2147483647, -17]) {
      expect(runLine(`seed ${seed}`, VEILS_ON, LAUNCHING).next).toEqual({ kind: 'launch', seed });
    }
  });

  it('launches on zero where zero is typed with a minus', () => {
    expect(runLine('seed -0', VEILS_ON, LAUNCHING).next).toEqual({ kind: 'launch', seed: 0 });
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
      expect(ran.next).toBeUndefined();
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
    expect(runLine('seed 5', VEILS_ON, SEEDING).next).toEqual({ kind: 'launch', seed: 5 });
  });

  it('still refuses what is not a seed where the screen holds seed and no switch', () => {
    const ran = runLine('seed abc', VEILS_ON, SEEDING);
    expect(ran.answer).toBe('not a seed: abc');
    expect(ran.next).toBeUndefined();
  });

  it('answers every line as no entry on a screen holding none, and launches and enters nothing', () => {
    for (const line of [
      'seed',
      'seed 3',
      '  seed abc ',
      'fog',
      'uncharted',
      'unit',
      'unit scout',
    ]) {
      const ran = runLine(line, VEILS_ON, BARE);
      expect(ran.answer).toBe(`no such entry: ${line.trim()}`);
      expect(ran.next).toBeUndefined();
      expect(ran.veils).toBe(VEILS_ON);
    }
  });
});

describe('unit run at the console', () => {
  /** What the line answers, having entered nothing and left the veils as they were. */
  function refusal(line: string, screen: Screen): string | undefined {
    const veils = uncharted();
    const ran = runLine(line, veils, screen);
    expect(ran.next).toBeUndefined();
    expect(ran.veils).toBe(veils);
    return ran.answer;
  }

  it('enters a unit of the player kind named on the tile selected where no script is named, and says the kind', () => {
    const veils = uncharted();
    const ran = runLine('unit scout', veils, unitScreen());
    expect(ran.next).toEqual({
      kind: 'enter',
      entering: { type: 'scout', tile: SELECTED, faction: 'player' },
    });
    expect(ran.answer).toBe('entered: scout');
    expect(ran.veils).toBe(veils);
  });

  it('enters an enemy on the script named, the spaces around the words trimmed, and says the kind and the script', () => {
    const ran = runLine('  unit   scout   raider ', VEILS_ON, unitScreen());
    expect(ran.next).toEqual({
      kind: 'enter',
      entering: { type: 'scout', tile: SELECTED, faction: 'enemy', script: 'raider' },
    });
    expect(ran.answer).toBe('entered: scout (raider)');
  });

  it('refuses an ended chronicle before it reads anything else', () => {
    const ended = unitScreen({ ended: true, selected: undefined });
    for (const line of ['unit', 'unit dragon', 'unit scout raider', 'unit a b c']) {
      expect(refusal(line, ended)).toBe('the chronicle has ended');
    }
  });

  it('says what it takes where nothing or more than a kind and a script stands after the word', () => {
    const unselected = unitScreen({ selected: undefined });
    expect(refusal('unit', unselected)).toBe('unit: <kind> [<script>]');
    expect(refusal('unit scout raider raider', unselected)).toBe('unit: <kind> [<script>]');
  });

  it('refuses where no tile is selected before it reads the kind', () => {
    expect(refusal('unit dragon', unitScreen({ selected: undefined }))).toBe('no tile selected');
  });

  it('refuses a kind the content does not hold before it reads the script', () => {
    expect(refusal('unit dragon nobody', unitScreen())).toBe('no such unit kind: dragon');
  });

  it('refuses a script the content does not hold before it asks the tile', () => {
    expect(refusal('unit boat nobody', unitScreen())).toBe('no such script: nobody');
  });

  it('refuses where the tile refuses the kind, in the refusal the tile raises', () => {
    expect(refusal('unit boat raider', unitScreen())).toBe('Wrong terrain');
    const standing = unitScreen({
      refusal: (_kind, tile) => (tile === SELECTED ? 'unit-standing' : undefined),
    });
    expect(refusal('unit scout', standing)).toBe('A unit already stands here');
  });
});
