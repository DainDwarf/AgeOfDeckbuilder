/**
 * An entry read as a run: its words, a glyph wherever it marks `[resource]`, a name wherever it marks
 * `[<kind>:<id>]` — `text` substitutes `{name}` from the values it is handed, so a brace here would
 * leave `undefined` on the screen of every caller that hands it none.
 */

import { RESOURCES, type Resource } from '../rules/resources';

/**
 * What a name names: a card, a terrain, a feature, an improvement, a building, or a unit kind painted
 * for the faction its kind says.
 */
export const REFERENCE_KINDS = [
  'card',
  'terrain',
  'feature',
  'improvement',
  'building',
  'player',
  'enemy',
] as const;

export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

export type Reference = {
  [Kind in ReferenceKind]: { readonly kind: Kind; readonly id: string };
}[ReferenceKind];

/** One glyph of a run: what it marks, and where it stands. */
export type Glyph = {
  readonly resource: Resource;
  /** The middle of the spaces it stands in, from the middle of its own line. */
  readonly x: number;
  /** The line it stands on, counted from the top of the run. */
  readonly line: number;
};

/** One name of a run: what it names, and the stretch it is drawn across, brackets included. */
export type Named = {
  readonly reference: Reference;
  /** Where it starts and where it ends, from the middle of its own line. */
  readonly from: number;
  readonly to: number;
  /** The line it stands on, counted from the top of the run. */
  readonly line: number;
};

export type Run = {
  /** The run as one Text draws it, centred: its words, and spaces wherever a glyph stands. */
  readonly content: string;
  readonly lines: number;
  readonly glyphs: readonly Glyph[];
  readonly names: readonly Named[];
};

/** How wide a stretch of the run's own characters draws. */
export type Measure = (content: string) => number;

/** What the thing a name names is named on the screen. */
export type NameOf = (reference: Reference) => string;

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

/** A word as it draws, and where each of its glyphs and names stands in what is drawn. */
type Marked = {
  readonly drawn: string;
  readonly glyphs: readonly { readonly resource: Resource; readonly at: number }[];
  readonly names: readonly {
    readonly reference: Reference;
    readonly at: number;
    readonly length: number;
  }[];
};

const NOTHING: Marked = { drawn: '', glyphs: [], names: [] };

const MARK = /\[(?:(\w+):([\w-]+)|(\w+))\]/;

function resourceOf(key: string): Resource {
  const resource = RESOURCES.find((known) => known === key);
  if (resource === undefined) throw new Error(`${key} is no resource a glyph is drawn for`);
  return resource;
}

function referenceOf(key: string, id: string): Reference {
  const kind = REFERENCE_KINDS.find((known) => known === key);
  if (kind === undefined) throw new Error(`${key} is no kind of thing a name names`);
  return { kind, id };
}

function markedOf(word: string, spaces: number, nameOf: NameOf): Marked {
  const glyphs: { resource: Resource; at: number }[] = [];
  const names: { reference: Reference; at: number; length: number }[] = [];
  let drawn = '';
  let rest = word;
  let token = MARK.exec(rest);
  while (token !== null) {
    drawn += rest.slice(0, token.index);
    const [, kind, id, resource] = token;
    if (kind !== undefined) {
      const reference = referenceOf(kind, id);
      const name = `[${nameOf(reference)}]`;
      names.push({ reference, at: drawn.length, length: name.length });
      drawn += name;
    } else {
      glyphs.push({ resource: resourceOf(resource), at: drawn.length });
      drawn += ' '.repeat(spaces);
    }
    rest = rest.slice(token.index + token[0].length);
    token = MARK.exec(rest);
  }
  return { drawn: drawn + rest, glyphs, names };
}

/** The line with one more word on it, a space between them as the entry has it. */
function joined(line: Marked, word: Marked): Marked {
  if (line.drawn.length === 0) return word;
  const after = line.drawn.length + 1;
  return {
    drawn: `${line.drawn} ${word.drawn}`,
    glyphs: [...line.glyphs, ...word.glyphs.map((glyph) => ({ ...glyph, at: glyph.at + after }))],
    names: [...line.names, ...word.names.map((name) => ({ ...name, at: name.at + after }))],
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
 * a newline in the entry breaks whatever the line has reached. A name is drawn inside the word its
 * mark stands in, so it never breaks across lines.
 */
export function layOutRun(entry: string, measure: Measure, metrics: Metrics, nameOf: NameOf): Run {
  const spaces = Math.max(1, Math.round((metrics.glyph + 2 * metrics.bearing) / metrics.space));
  const lines: Marked[] = [];
  for (const hard of entry.split('\n')) {
    let line = NOTHING;
    for (const word of hard.split(' ')) {
      if (word.length === 0) continue;
      const marked = markedOf(word, spaces, nameOf);
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
  const names: Named[] = [];
  for (const [index, line] of lines.entries()) {
    // A Text centres each line on its width ceiled to the pixel, so a mark is placed from that.
    const width = Math.ceil(measure(line.drawn));
    for (const { resource, at } of line.glyphs) {
      const middle = measure(line.drawn.slice(0, at)) + (spaces * metrics.space) / 2;
      glyphs.push({ resource, x: middle - width / 2, line: index });
    }
    for (const { reference, at, length } of line.names) {
      names.push({
        reference,
        from: measure(line.drawn.slice(0, at)) - width / 2,
        to: measure(line.drawn.slice(0, at + length)) - width / 2,
        line: index,
      });
    }
  }
  return {
    content: lines.map((line) => line.drawn).join('\n'),
    lines: lines.length,
    glyphs,
    names,
  };
}
