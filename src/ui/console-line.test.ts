import { describe, expect, it } from 'vitest';
import { runLine } from './console-line';
import type { Layers } from './map';

/** Both layers standing, as a chronicle opens on them. */
const STANDING: Layers = { uncharted: true, fog: true };

/** The layers a switch already thrown once leaves: the uncharted layer off, the fog standing. */
function uncharted(): Layers {
  return runLine('uncharted', STANDING).layers;
}

describe('a line run at the console', () => {
  it('takes the uncharted layer off, and says so', () => {
    const ran = runLine('uncharted', STANDING);
    expect(ran.layers).toEqual({ uncharted: false, fog: true });
    expect(ran.answer).toBe('uncharted layer: off');
  });

  it('puts a layer back where a second run of its switch finds it off', () => {
    const ran = runLine('uncharted', uncharted());
    expect(ran.layers).toEqual(STANDING);
    expect(ran.answer).toBe('uncharted layer: on');
  });

  it('takes the fog layer off without touching the other', () => {
    const ran = runLine('fog', uncharted());
    expect(ran.layers).toEqual({ uncharted: false, fog: false });
    expect(ran.answer).toBe('fog layer: off');
  });

  it('answers a word it holds no entry for with the word, and leaves the layers standing', () => {
    const ran = runLine('sight', uncharted());
    expect(ran.answer).toBe('no such entry: sight');
    expect(ran.layers).toEqual(uncharted());
  });

  it('answers nothing at all for an empty line', () => {
    for (const line of ['', '   ']) {
      const ran = runLine(line, STANDING);
      expect(ran.answer).toBeUndefined();
      expect(ran.layers).toEqual(STANDING);
    }
  });

  it('runs a switch the spaces around it are trimmed off', () => {
    expect(runLine('  fog  ', STANDING).answer).toBe('fog layer: off');
  });

  it('leaves the layers it was given as they were', () => {
    runLine('uncharted', STANDING);
    runLine('fog', STANDING);
    expect(STANDING).toEqual({ uncharted: true, fog: true });
  });
});
