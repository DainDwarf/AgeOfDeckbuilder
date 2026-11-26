import type { Box } from './design-space';

/** How far the panel reaches past what it holds, sideways, over its first line and under its second. */
const PAD_X = 12;
const PAD_Y = 8;

/** How far under the first line the second stands. */
const BETWEEN_LINES = 4;

/** How tall the first line stands: Close's height. */
const FIRST_LINE = 26;

/** How wide the civilization's disc is. */
export const DISC = 20;

/** How far Close's word stands off its ends. */
const CLOSE_ROOM = 11;

/**
 * The second line: how tall its readings' row stands, how far under it the bars' top stands, how thick
 * a bar is, and how much of the line stands under the bars.
 */
const READINGS_ROW = 25;
const ROW_TO_BAR = 1;
export const BAR_THICKNESS = 8;
const UNDER_THE_BARS = 6;

/**
 * How wide a reading's cell stands at the least, how far apart two cells and the population stand,
 * how far a reading's turns left stand off what it reads at the least, and how far apart two counts.
 */
const CELL = 148;
const APART = 20;
const TO_TURNS = 8;
const COUNTS_APART = 16;

/** What a reading asks of its cell: how far its value and its reckoning reach, and how wide its turns left stand. */
export type CellAsked = { readonly reading: number; readonly turns: number };

/** How wide what the panel reads stands, as the piece measured it. */
export type CityPanelMeasured = {
  readonly name: number;
  /** Close's word. */
  readonly close: number;
  /** Food's reading, then culture's. */
  readonly cells: readonly CellAsked[];
  /** Each count of the population: its number or its glyph, whichever is the wider. */
  readonly counts: readonly number[];
};

/** Where what the panel reads stands, from the top left corner it shows: the hidden part above it is the bar's. */
export type CityPanelLayout = {
  readonly width: number;
  readonly height: number;
  /** The first line's middle, down from the top. */
  readonly firstLine: number;
  /** The middles across of the civilization's disc and of the name. */
  readonly disc: number;
  readonly name: number;
  readonly close: Box;
  /** How far down the second line's top stands, its readings' middle, and its bars' middle. */
  readonly secondLine: number;
  readonly readings: number;
  readonly bars: number;
  /** How tall the second line stands. */
  readonly secondLineHeight: number;
  /** How wide each reading's cell stands, and each one's left end. */
  readonly cell: number;
  readonly cells: readonly number[];
  /** Each count's middle across. */
  readonly counts: readonly number[];
};

/**
 * City mode's panel laid out on what it reads: the name in the middle of the first line, the disc at
 * its left end and Close at its right; the readings' cells, as wide as the widest asks and never
 * narrower than `CELL`, then the counts, along the second; the panel as wide as the wider line asks.
 */
export function layOutCityPanel(measured: CityPanelMeasured): CityPanelLayout {
  const cell = Math.max(
    CELL,
    ...measured.cells.map(({ reading, turns }) => reading + (turns > 0 ? TO_TURNS + turns : 0)),
  );
  const cells = measured.cells.map((_, index) => PAD_X + index * (cell + APART));
  const counts: number[] = [];
  let x = PAD_X + measured.cells.length * (cell + APART);
  for (const [index, count] of measured.counts.entries()) {
    if (index > 0) x += COUNTS_APART;
    counts.push(x + count / 2);
    x += count;
  }
  const closeWidth = measured.close + 2 * CLOSE_ROOM;
  const besideName = Math.max(DISC, closeWidth) + APART;
  const width = Math.max(x + PAD_X, 2 * (PAD_X + besideName) + measured.name);

  const firstLine = PAD_Y + FIRST_LINE / 2;
  const secondLine = PAD_Y + FIRST_LINE + BETWEEN_LINES;
  const secondLineHeight = READINGS_ROW + ROW_TO_BAR + BAR_THICKNESS + UNDER_THE_BARS;
  return {
    width,
    height: secondLine + secondLineHeight + PAD_Y,
    firstLine,
    disc: PAD_X + DISC / 2,
    name: width / 2,
    close: {
      x: width - PAD_X - closeWidth,
      y: firstLine - FIRST_LINE / 2,
      width: closeWidth,
      height: FIRST_LINE,
    },
    secondLine,
    readings: secondLine + READINGS_ROW / 2,
    bars: secondLine + READINGS_ROW + ROW_TO_BAR + BAR_THICKNESS / 2,
    secondLineHeight,
    cell,
    cells,
    counts,
  };
}
