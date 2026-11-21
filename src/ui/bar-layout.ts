/** Where a bar along the top stands its readings: one row, its ends standing off the first and the last. */

/** How far apart two readings in a row stand. */
export const BETWEEN = 16;

/** How far a zone reaches past the row's first reading and its last. */
export const WELL_MARGIN = 10;

/** How far a zone reaches into a gap beside its reading: half of it, less 2 of daylight, so no press lands on both neighbours. */
const INTO_THE_GAP = (BETWEEN - 2) / 2;

export type Zone = { readonly x: number; readonly width: number };

/** A reading in the row: where its content starts, and the zone its press and its well cover. */
export type Placed = { readonly at: number; readonly zone: Zone };

/** A row laid out from its left end: how wide it stands, and each of its readings. */
export type ReadingRow = { readonly width: number; readonly readings: readonly Placed[] };

/**
 * Readings of those content widths in the order handed, `BETWEEN` apart, the row's ends `end` off the
 * first and the last. A zone reaches into each gap beside its reading, and as far as a well past the
 * row's first and last reading.
 */
export function layOutReadings(readings: readonly number[], end: number): ReadingRow {
  const placed: Placed[] = [];
  let x = end;
  for (const [index, span] of readings.entries()) {
    if (index > 0) x += BETWEEN;
    const left = index === 0 ? WELL_MARGIN : INTO_THE_GAP;
    const right = index === readings.length - 1 ? WELL_MARGIN : INTO_THE_GAP;
    placed.push({ at: x, zone: { x: x - left, width: span + left + right } });
    x += span;
  }
  return { width: x + end, readings: placed };
}
