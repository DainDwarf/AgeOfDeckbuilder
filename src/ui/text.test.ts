import { describe, expect, it } from 'vitest';
import { filled, text } from './text';

describe('an entry read off the text table', () => {
  it('reads the value handed for its placeholder where the placeholder stood', () => {
    const read = text('browse.draw-pile', { count: 12 });
    expect(read).toContain('12');
    expect(read).not.toContain('{');
  });

  it('reads a zero handed for its placeholder as a value like any other', () => {
    expect(text('browse.draw-pile', { count: 0 })).toContain('0');
  });

  it('refuses a placeholder handed no value, naming it and the entry', () => {
    expect(() => text('browse.draw-pile')).toThrow('no value fills {count} in browse.draw-pile');
  });

  it('refuses a placeholder whose value was handed under another name', () => {
    expect(() => text('browse.draw-pile', { turn: 12 })).toThrow('{count}');
  });

  it('refuses an entry of several placeholders where any one of them is handed no value', () => {
    expect(() => text('reading.over', { count: 1, over: 2 })).not.toThrow();
    expect(() => text('reading.over', { count: 1 })).toThrow('{over}');
  });

  it('reads an entry with no placeholder as it stands, whatever values it is handed', () => {
    expect(text('button.end-turn', { turn: 7 })).toBe(text('button.end-turn'));
    expect(text('button.end-turn')).not.toContain('{');
  });
});

describe('an entry with branches', () => {
  const herd = 'A herd of {sheep|no sheep|# sheep|# sheep}{goats||, # goat|, # goats}';

  it('reads the form its value picks, the value standing for every # in it', () => {
    expect(filled(herd, { sheep: 0, goats: 0 }, 'herd')).toBe('A herd of no sheep');
    expect(filled(herd, { sheep: 1, goats: 1 }, 'herd')).toBe('A herd of 1 sheep, 1 goat');
    expect(filled(herd, { sheep: 3, goats: 2 }, 'herd')).toBe('A herd of 3 sheep, 2 goats');
  });

  it('reads the last form given for a value whose own form is left out', () => {
    expect(filled('{cows|none|some}', { cows: 5 }, 'cows')).toBe('some');
  });

  it('reads a list of the items that read anything, the last two joined by and', () => {
    const pen = 'In the pen: {+{sheep||# sheep}|{goats||# goat|# goats}|{dog||the dog}}';

    expect(filled(pen, { sheep: 2, goats: 0, dog: 0 }, 'pen')).toBe('In the pen: 2 sheep');
    expect(filled(pen, { sheep: 0, goats: 1, dog: 1 }, 'pen')).toBe(
      'In the pen: 1 goat and the dog',
    );
    expect(filled(pen, { sheep: 2, goats: 3, dog: 1 }, 'pen')).toBe(
      'In the pen: 2 sheep, 3 goats and the dog',
    );
  });

  it('refuses a branch handed no value, naming it and the entry', () => {
    expect(() => filled(herd, { sheep: 1 }, 'herd')).toThrow('no value fills {goats} in herd');
  });
});
