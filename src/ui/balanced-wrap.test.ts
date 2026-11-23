import { describe, expect, it } from 'vitest';
import { balancedLines } from './balanced-wrap';

/** One unit to the character. */
const characters = (line: string): number => line.length;

describe('a text broken into balanced lines', () => {
  it('takes the fewest lines its room allows, those lines as near one length as its words allow', () => {
    expect(balancedLines('aaa bbb ccc ddd e', characters, 15)).toEqual(['aaa bbb', 'ccc ddd e']);
  });

  it('keeps a text that holds on one line on one line', () => {
    expect(balancedLines('aaa bbb ccc', characters, 11)).toEqual(['aaa bbb ccc']);
  });

  it('stands a word wider than the room on a line of its own', () => {
    expect(balancedLines('aa bbbbbbbb cc', characters, 5)).toEqual(['aa', 'bbbbbbbb', 'cc']);
  });
});
