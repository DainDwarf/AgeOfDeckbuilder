import { describe, expect, it } from 'vitest';
import {
  type Bindings,
  bound,
  DEFAULTS,
  keyOf,
  parseBindings,
  serialiseBindings,
} from './bindings';

/** The bindings a player has already moved a key on, so a second move has something to take. */
function rebound(): Bindings {
  return bound(DEFAULTS, 'pan-left', 0, 'w');
}

describe('binding a key', () => {
  it('takes the key away from the slot that held it', () => {
    const after = rebound();
    expect(after['pan-left'][0]).toBe('W');
    expect(after['pan-up'][0]).toBeUndefined();
    expect(after['pan-up'][1]).toBe('ArrowUp');
  });

  it('takes the key away from the other slot of the same control', () => {
    const after = bound(DEFAULTS, 'pan-up', 1, 'w');
    expect(after['pan-up']).toEqual([undefined, 'W']);
  });

  it('leaves a control with no key at all bindable again', () => {
    const emptied = rebound();
    const filled = bound(emptied, 'pan-up', 0, 'k');
    expect(filled['pan-up']).toEqual(['K', 'ArrowUp']);
    expect(filled['pan-left'][0]).toBe('W');
  });

  it('binds the back key like any other, and moves it off the control that had it', () => {
    const after = bound(DEFAULTS, 'pan-down', 1, 'Escape');
    expect(after.back).toEqual([undefined, undefined]);
    expect(after['pan-down']).toEqual(['S', 'Escape']);
  });

  it('reads a key in either case as the one key', () => {
    expect(bound(DEFAULTS, 'back', 1, 'k').back[1]).toBe(keyOf('K'));
  });

  it('leaves the defaults standing, so they are there to be put back', () => {
    bound(bound(DEFAULTS, 'pan-up', 0, 'k'), 'back', 0, 'b');
    expect(DEFAULTS['pan-up']).toEqual(['W', 'ArrowUp']);
    expect(DEFAULTS.back).toEqual(['Escape', undefined]);
  });
});

describe('the bindings kept in the browser', () => {
  it('come back as they were left', () => {
    const kept = bound(rebound(), 'back', 1, 'b');
    expect(parseBindings(serialiseBindings(kept))).toEqual(kept);
  });

  it('are the defaults when nothing was kept', () => {
    expect(parseBindings(null)).toEqual(DEFAULTS);
  });

  it('are the defaults when what was kept is not readable', () => {
    for (const kept of ['', 'not json at all', '[]', '"W"', '{"pan-up":7}']) {
      expect(parseBindings(kept)).toEqual(DEFAULTS);
    }
  });

  it('stand at their default for every control the kept bindings do not cover', () => {
    const parsed = parseBindings('{"pan-up":["k",null],"pan-left":["A",false]}');
    expect(parsed['pan-up']).toEqual(['K', undefined]);
    expect(parsed['pan-left']).toEqual(DEFAULTS['pan-left']);
    expect(parsed.back).toEqual(DEFAULTS.back);
  });
});
