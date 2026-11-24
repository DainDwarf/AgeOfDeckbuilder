import { describe, expect, it } from 'vitest';
import { text, textAround } from './text';

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

  it('cut at its slots, reads its words and its slots in the order they stand, every other placeholder filled with its value', () => {
    const cut = textAround('log.attack', ['attacker', 'target'], { damage: 3 });
    expect(cut.map((part) => (typeof part === 'string' ? 'words' : part.slot))).toEqual([
      'attacker',
      'words',
      'target',
      'words',
    ]);
    expect(cut.map((part) => (typeof part === 'string' ? part : `<${part.slot}>`)).join('')).toBe(
      text('log.attack', { attacker: '<attacker>', target: '<target>', damage: 3 }),
    );
    expect(() => textAround('log.attack', ['attacker', 'target'])).toThrow('{damage}');
  });

  it('reads an entry with no placeholder as it stands, whatever values it is handed', () => {
    expect(text('button.end-turn', { turn: 7 })).toBe(text('button.end-turn'));
    expect(text('button.end-turn')).not.toContain('{');
  });
});
