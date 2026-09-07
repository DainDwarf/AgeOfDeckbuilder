import { describe, expect, it } from 'vitest';
import { runLine } from './console-line';
import { VEILS_ON, type Veils } from './veils';

/** The veils a switch already thrown once leaves: the uncharted veil off, the fog standing. */
function uncharted(): Veils {
  return runLine('uncharted', VEILS_ON).veils;
}

describe('a line run at the console', () => {
  it('takes the uncharted veil off, and says so', () => {
    const ran = runLine('uncharted', VEILS_ON);
    expect(ran.veils).toEqual({ uncharted: false, fog: true });
    expect(ran.answer).toBe('uncharted veil: off');
  });

  it('puts a veil back where a second run of its switch finds it off', () => {
    const ran = runLine('uncharted', uncharted());
    expect(ran.veils).toEqual(VEILS_ON);
    expect(ran.answer).toBe('uncharted veil: on');
  });

  it('takes the fog veil off without touching the other', () => {
    const ran = runLine('fog', uncharted());
    expect(ran.veils).toEqual({ uncharted: false, fog: false });
    expect(ran.answer).toBe('fog veil: off');
  });

  it('answers a word it holds no entry for with the word, and leaves the veils standing', () => {
    const ran = runLine('sight', uncharted());
    expect(ran.answer).toBe('no such entry: sight');
    expect(ran.veils).toEqual(uncharted());
  });

  it('answers nothing at all for an empty line', () => {
    for (const line of ['', '   ']) {
      const ran = runLine(line, VEILS_ON);
      expect(ran.answer).toBeUndefined();
      expect(ran.veils).toEqual(VEILS_ON);
    }
  });

  it('runs a switch the spaces around it are trimmed off', () => {
    expect(runLine('  fog  ', VEILS_ON).answer).toBe('fog veil: off');
  });

  it('leaves the veils it was given as they were', () => {
    runLine('uncharted', VEILS_ON);
    runLine('fog', VEILS_ON);
    expect(VEILS_ON).toEqual({ uncharted: true, fog: true });
  });
});
