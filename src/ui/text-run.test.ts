import { describe, expect, it } from 'vitest';
import { layOutRun, type Metrics, namedOnce, type Reference, type Run } from './text-run';

/** A font of five to the character, spaces included, so a width reads as a count of characters. */
const measure = (content: string): number => 5 * content.length;

const METRICS: Metrics = { width: 50, glyph: 10, bearing: 5, space: 5 };

/** The things the runs below name, by kind and id: one card in several words, one id of two kinds. */
const NAMES: Record<string, string> = {
  'card:short': 'Aaa',
  'card:long': 'Bbb ccc ddd',
  'building:short': 'Eee',
};

function nameOf(reference: Reference): string {
  const name = NAMES[`${reference.kind}:${reference.id}`];
  if (name === undefined) throw new Error(`no ${reference.kind} ${reference.id}`);
  return name;
}

function laid(entry: string): Run {
  return layOutRun(entry, measure, METRICS, nameOf);
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
    expect(run.names).toEqual([]);
  });
});

describe('a run with glyphs in it', () => {
  it('never breaks a word between its number and its glyph', () => {
    const run = laid('aaaaaa 10[food]');
    expect(linesOf(run)[0]).toBe('aaaaaa');
    expect(linesOf(run)[1].trimEnd()).toBe('10');
    expect(run.glyphs).toEqual([
      {
        symbol: 'food',
        x: expect.any(Number),
        line: 1,
        number: { reads: '10', from: expect.any(Number), to: expect.any(Number) },
      },
    ]);
  });

  it('reads the number written against a glyph, and the stretch it is drawn across', () => {
    const run = laid('aa 10[food]');
    const { number } = run.glyphs[0];
    expect(number?.reads).toBe('10');
    expect(number?.from).toBe(measure('aa ') - edgeOf(run, 0));
    expect(number && number.to - number.from).toBe(measure('10'));
  });

  it('reads no number against a glyph the run writes none before', () => {
    expect(laid('aa [food]').glyphs[0].number).toBeUndefined();
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
    expect(run.glyphs.map((glyph) => glyph.symbol)).toEqual(['food', 'money']);
  });

  it('marks a symbol of the cast that is no resource as it marks a resource', () => {
    const run = laid('1[population]');
    expect(run.glyphs).toEqual([
      {
        symbol: 'population',
        x: expect.any(Number),
        line: 0,
        number: { reads: '1', from: expect.any(Number), to: expect.any(Number) },
      },
    ]);
  });

  it('refuses a mark that names no symbol of the cast', () => {
    expect(() => laid('10[spoils]')).toThrow('spoils');
  });
});

describe('a run with names in it', () => {
  it('draws the card’s name in brackets where the entry marks it', () => {
    const run = laid('a [card:short] b');
    expect(run.content).toBe('a [Aaa] b');
    expect(run.names.map((name) => name.reference)).toEqual([{ kind: 'card', id: 'short' }]);
  });

  it('draws a thing of another kind by its own kind’s name, and answers it with its kind and id', () => {
    const run = laid('a [building:short] b');
    expect(run.content).toBe('a [Eee] b');
    expect(run.names.map((name) => name.reference)).toEqual([{ kind: 'building', id: 'short' }]);
  });

  it('never breaks a name of several words across lines, however far it runs past the width', () => {
    const run = laid('aaa [card:long]');
    expect(linesOf(run)).toEqual(['aaa', '[Bbb ccc ddd]']);
    expect(run.names).toEqual([
      {
        reference: { kind: 'card', id: 'long' },
        from: expect.any(Number),
        to: expect.any(Number),
        line: 1,
      },
    ]);
  });

  it('reads the number written before a name, and none before a name the run writes none before', () => {
    const run = laid('a 3 [card:short] b [building:short]');
    expect(run.names.map((name) => name.number)).toEqual(['3', undefined]);
  });

  it('reads the number written before a name the run breaks onto the next line', () => {
    const run = laid('aaaaaa 3 [card:short]');
    expect(linesOf(run)).toEqual(['aaaaaa 3', '[Aaa]']);
    expect(run.names.map((name) => name.number)).toEqual(['3']);
  });

  it('answers each thing the names name once, at its first name, in their order', () => {
    const run = laid('[card:short] [building:short] [card:long] [card:short]');
    expect(namedOnce(run.names).map((name) => name.reference)).toEqual([
      { kind: 'card', id: 'short' },
      { kind: 'building', id: 'short' },
      { kind: 'card', id: 'long' },
    ]);
  });

  it('answers the stretch a name is drawn across, both brackets included', () => {
    const run = laid('aa [card:short]');
    const [name] = run.names;
    expect(name.to).toBe(edgeOf(run, 0));
    expect(name.to - name.from).toBe(measure('[Aaa]'));
  });
});
