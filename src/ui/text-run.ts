/**
 * An entry read as a run: the words it holds, and a resource glyph wherever it marks one. A glyph
 * is marked `[resource]` — `text` substitutes `{name}` from the values it is handed, so a brace
 * here would leave `undefined` on the screen of every caller that hands it none.
 *
 * A run is one string, its glyphs standing in spaces of it, and never a Text for each piece: with a
 * few dozen Texts on the screen at once the renderer starts drawing one of them with another's
 * letters, and a hand of cards is most of that budget already.
 */

import { RESOURCES, type Resource } from '../rules/resources';

/** One glyph of a run: what it marks, and where it stands. */
export type Glyph = {
  readonly resource: Resource;
  /** The middle of the spaces it stands in, from the middle of its own line. */
  readonly x: number;
  /** The line it stands on, counted from the top of the run. */
  readonly line: number;
};

export type Run = {
  /** The run as one Text draws it, centred: its words, and spaces wherever a glyph stands. */
  readonly content: string;
  readonly lines: number;
  readonly glyphs: readonly Glyph[];
};

/** How wide a stretch of the run's own characters draws. */
export type Measure = (content: string) => number;

export type Metrics = {
  /** How far a line may run before the next word starts a new one. */
  readonly width: number;
  /** One glyph, corner to corner. */
  readonly glyph: number;
  /** How far a glyph stands off what adjoins it. */
  readonly bearing: number;
  /** What one space of the font the run draws in advances by. */
  readonly space: number;
};

/** A word as it draws, and where each of its glyphs stands in what is drawn. */
type Marked = {
  readonly drawn: string;
  readonly glyphs: readonly { readonly resource: Resource; readonly at: number }[];
};

const NOTHING: Marked = { drawn: '', glyphs: [] };

const GLYPH_TOKEN = /\[(\w+)\]/;

function resourceOf(key: string): Resource {
  const resource = RESOURCES.find((known) => known === key);
  if (resource === undefined) throw new Error(`${key} is no resource a glyph is drawn for`);
  return resource;
}

function markedOf(word: string, spaces: number): Marked {
  const glyphs: { resource: Resource; at: number }[] = [];
  let drawn = '';
  let rest = word;
  let token = GLYPH_TOKEN.exec(rest);
  while (token !== null) {
    drawn += rest.slice(0, token.index);
    glyphs.push({ resource: resourceOf(token[1]), at: drawn.length });
    drawn += ' '.repeat(spaces);
    rest = rest.slice(token.index + token[0].length);
    token = GLYPH_TOKEN.exec(rest);
  }
  return { drawn: drawn + rest, glyphs };
}

/** The line with one more word on it, a space between them as the entry has it. */
function joined(line: Marked, word: Marked): Marked {
  if (line.drawn.length === 0) return word;
  const after = line.drawn.length + 1;
  return {
    drawn: `${line.drawn} ${word.drawn}`,
    glyphs: [...line.glyphs, ...word.glyphs.map((glyph) => ({ ...glyph, at: glyph.at + after }))],
  };
}

/**
 * The line with the air after a glyph that ends it taken back off: a line is centred on all it
 * draws, and the spaces standing past its last glyph would push what it shows off its middle.
 */
function closed(line: Marked, spaces: number, metrics: Metrics): Marked {
  const last = line.glyphs.at(-1);
  if (last === undefined || last.at + spaces !== line.drawn.length) return line;
  const half = (spaces * metrics.space + metrics.glyph) / (2 * metrics.space);
  return { ...line, drawn: line.drawn.slice(0, last.at + Math.max(1, Math.round(half))) };
}

/**
 * The entry laid out: a word joins the line being filled until the line would run past `width`, and
 * a newline in the entry breaks whatever the line has reached.
 */
export function layOutRun(entry: string, measure: Measure, metrics: Metrics): Run {
  const spaces = Math.max(1, Math.round((metrics.glyph + 2 * metrics.bearing) / metrics.space));
  const lines: Marked[] = [];
  for (const hard of entry.split('\n')) {
    let line = NOTHING;
    for (const word of hard.split(' ')) {
      if (word.length === 0) continue;
      const marked = markedOf(word, spaces);
      const grown = joined(line, marked);
      if (line.drawn.length > 0 && measure(grown.drawn) > metrics.width) {
        lines.push(closed(line, spaces, metrics));
        line = marked;
      } else {
        line = grown;
      }
    }
    lines.push(closed(line, spaces, metrics));
  }

  const glyphs: Glyph[] = [];
  for (const [index, line] of lines.entries()) {
    const width = measure(line.drawn);
    for (const { resource, at } of line.glyphs) {
      const middle = measure(line.drawn.slice(0, at)) + (spaces * metrics.space) / 2;
      glyphs.push({ resource, x: middle - width / 2, line: index });
    }
  }
  return { content: lines.map((line) => line.drawn).join('\n'), lines: lines.length, glyphs };
}
