import { describe, expect, it } from 'vitest';
import {
  type Bind,
  type Bindings,
  bound,
  type Control,
  DEFAULTS,
  keyLabel,
  keyPressed,
  parseBindings,
  serialiseBindings,
} from './bindings';

/** A press, as the browser reports one: the place the key stands on, and what that key printed. */
function press(code: string, printed: string): Bind {
  return keyPressed({ code, key: printed });
}

/** What one slot reads on the Controls window; a control standing on no key there reads nothing. */
function reads(bindings: Bindings, control: Control, slot: number): string {
  const bind = bindings[control][slot];
  if (bind === undefined) throw new Error(`${control} stands on no key in slot ${slot}`);
  return keyLabel(bind);
}

/** The bindings a player has already moved a key on, so a second move has something to take. */
function rebound(): Bindings {
  return bound(DEFAULTS, 'pan-left', 0, press('KeyW', 'w'));
}

describe('binding a key', () => {
  it('takes the key away from the slot that held it', () => {
    const after = rebound();
    expect(after['pan-left'][0]).toEqual({ code: 'KeyW', printed: 'W' });
    expect(after['pan-up'][0]).toBeUndefined();
    expect(after['pan-up'][1]).toEqual({ code: 'ArrowUp' });
  });

  it('takes the key away from the other slot of the same control', () => {
    const after = bound(DEFAULTS, 'pan-up', 1, press('KeyW', 'w'));
    expect(after['pan-up']).toEqual([undefined, { code: 'KeyW', printed: 'W' }]);
  });

  it('leaves a control with no key at all bindable again', () => {
    const emptied = rebound();
    const filled = bound(emptied, 'pan-up', 0, press('KeyK', 'k'));
    expect(reads(filled, 'pan-up', 0)).toBe('K');
    expect(reads(filled, 'pan-up', 1)).toBe('↑');
    expect(reads(filled, 'pan-left', 0)).toBe('W');
  });

  it('binds the back key like any other, and moves it off the control that had it', () => {
    const after = bound(DEFAULTS, 'pan-down', 1, press('Escape', 'Escape'));
    expect(after.back).toEqual([undefined, undefined]);
    expect(reads(after, 'pan-down', 0)).toBe('S');
    expect(reads(after, 'pan-down', 1)).toBe('Escape');
  });

  it('opens the inspection key on I, with a slot free beside it', () => {
    expect(reads(DEFAULTS, 'inspect', 0)).toBe('I');
    expect(DEFAULTS.inspect[1]).toBeUndefined();
  });

  it('binds a wheel notch like any other key, and moves it off the zoom that had it', () => {
    const after = bound(DEFAULTS, 'pan-up', 1, { code: 'WheelUp' });
    expect(after['zoom-in']).toEqual([undefined, undefined]);
    expect(reads(after, 'zoom-out', 0)).toBe('Wheel down');
    expect(reads(after, 'pan-up', 0)).toBe('W');
    expect(reads(after, 'pan-up', 1)).toBe('Wheel up');
  });

  it('fills a zoom that stands on one key alone', () => {
    const after = bound(DEFAULTS, 'zoom-in', 1, press('KeyE', 'e'));
    expect(reads(after, 'zoom-in', 0)).toBe('Wheel up');
    expect(reads(after, 'zoom-in', 1)).toBe('E');
  });

  it('reads a key in either case as the one key', () => {
    expect(bound(DEFAULTS, 'back', 1, press('KeyK', 'K')).back[1]).toEqual(
      bound(DEFAULTS, 'back', 1, press('KeyK', 'k')).back[1],
    );
  });

  it('binds the place a key stands on, whatever that key prints', () => {
    const after = bound(DEFAULTS, 'pan-left', 0, press('KeyW', 'z'));
    expect(after['pan-up'][0]).toBeUndefined();
    expect(reads(after, 'pan-left', 0)).toBe('Z');
  });

  it('holds two places that print alike as two keys', () => {
    const after = bound(
      bound(DEFAULTS, 'city', 0, press('Digit1', '1')),
      'yields',
      0,
      press('Numpad1', '1'),
    );
    expect(reads(after, 'city', 0)).toBe('1');
    expect(reads(after, 'yields', 0)).toBe('1');
  });

  it('binds a key that prints nothing, which then reads by its place', () => {
    const after = bound(DEFAULTS, 'city', 1, press('BracketLeft', 'Dead'));
    expect(reads(after, 'city', 1)).toBe('[');
  });

  it('reads a key never rebound by the US keycap of its place', () => {
    expect(reads(DEFAULTS, 'pan-down', 0)).toBe('S');
    expect(reads(DEFAULTS, 'pan-down', 1)).toBe('↓');
    expect(reads(DEFAULTS, 'yields', 0)).toBe('Tab');
    expect(reads(DEFAULTS, 'back', 0)).toBe('Escape');
  });

  it('leaves the defaults standing, so they are there to be put back', () => {
    bound(bound(DEFAULTS, 'pan-up', 0, press('KeyK', 'k')), 'back', 0, press('KeyB', 'b'));
    expect(DEFAULTS['pan-up']).toEqual([{ code: 'KeyW' }, { code: 'ArrowUp' }]);
    expect(DEFAULTS.back).toEqual([{ code: 'Escape' }, undefined]);
  });
});

describe('the bindings kept in the browser', () => {
  it('come back as they were left', () => {
    const kept = bound(rebound(), 'back', 1, press('KeyB', 'b'));
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

  it('are the defaults when what was kept holds keys by their label and not by their place', () => {
    expect(parseBindings('{"pan-up":["K",null]}')).toEqual(DEFAULTS);
  });

  it('leave the slot empty where what was kept is a button that presses the chronicle screen', () => {
    const parsed = parseBindings(
      '{"back":[{"code":"Escape"},{"code":"Mouse2"}],"city":[{"code":"Mouse0"},{"code":"KeyC"}]}',
    );
    expect(parsed.back).toEqual([{ code: 'Escape' }, undefined]);
    expect(parsed.city).toEqual([undefined, { code: 'KeyC' }]);
  });

  it('stand at their default for every control the kept bindings do not cover', () => {
    const parsed = parseBindings(
      '{"pan-up":[{"code":"KeyK","printed":"K"},null],"pan-left":[{"code":"KeyA"},false]}',
    );
    expect(parsed['pan-up']).toEqual([{ code: 'KeyK', printed: 'K' }, undefined]);
    expect(parsed['pan-left']).toEqual(DEFAULTS['pan-left']);
    expect(parsed.back).toEqual(DEFAULTS.back);
  });
});
