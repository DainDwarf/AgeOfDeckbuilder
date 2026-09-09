import { describe, expect, it } from 'vitest';
import { layOutRun, type Metrics, type Run } from './text-run';

/** A font of five to the character, spaces included, so a width reads as a count of characters. */
const measure = (content: string): number => 5 * content.length;

const METRICS: Metrics = { width: 50, glyph: 10, bearing: 5, space: 5 };

function laid(entry: string): Run {
  return layOutRun(entry, measure, METRICS);
}

function linesOf(run: Run): string[] {
  return run.content.split('\n');
}

/** Where a line's ink ends, its middle being the middle of the run. */
function edgeOf(run: Run, line: number): number {
  return measure(linesOf(run)[line]) / 2;
}

describe('a run of words', () => {
  it('fills a line until the next word would run past the width, then starts a new one', () => {
    expect(linesOf(laid('aaa bbb ccc'))).toEqual(['aaa bbb', 'ccc']);
  });

  it('breaks where the entry breaks, whatever the line it was filling had reached', () => {
    expect(linesOf(laid('aaa\nbbb ccc'))).toEqual(['aaa', 'bbb ccc']);
  });

  it('leaves an entry of plain words as it stands, to be drawn in one piece', () => {
    const run = laid('aaa bbb');
    expect(run.content).toBe('aaa bbb');
    expect(run.glyphs).toEqual([]);
  });
});

describe('a run with glyphs in it', () => {
  it('never breaks a word between its number and its glyph', () => {
    const run = laid('aaaaaa 10[food]');
    expect(linesOf(run)[0]).toBe('aaaaaa');
    expect(linesOf(run)[1].trimEnd()).toBe('10');
    expect(run.glyphs).toEqual([{ resource: 'food', x: expect.any(Number), line: 1 }]);
  });

  it('stands a glyph off the number it is written against by its bearing', () => {
    const run = laid('10[food]');
    const number = measure('10') - edgeOf(run, 0);
    expect(run.glyphs[0].x - METRICS.glyph / 2 - number).toBe(METRICS.bearing);
  });

  it('centres a pair on the run’s middle, air after the glyph and all', () => {
    const run = laid('10[food]');
    expect(run.glyphs[0].x + METRICS.glyph / 2).toBe(edgeOf(run, 0));
  });

  it('marks every resource the entry names, in the order it names them', () => {
    const run = laid('10[food] 10[money]');
    expect(run.glyphs.map((glyph) => glyph.resource)).toEqual(['food', 'money']);
  });

  it('refuses a mark that names no resource', () => {
    expect(() => laid('10[spoils]')).toThrow('spoils');
  });
});
