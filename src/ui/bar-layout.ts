/**
 * Where the resource bar stands its readings. One flow from the bar's left margin to its right: the
 * seven readings, then the Menu button, with a gap before every one of them after the first. The
 * font the readings are measured in is the browser's, so the flow closes its gaps rather than
 * letting a wide font run one reading into the next.
 */

/** How far apart two things in the bar stand while the row has room for it. */
export const BETWEEN = 22;

/** How far a reading's zone reaches past the reading, where the gap beside it has room for it. */
export const WELL_MARGIN = 10;

/** The daylight two neighbouring zones leave between them, so no press lands on both. */
const DAYLIGHT = 2;

/** How many readings hug the left margin; the rest hug the Menu button, and the slack sits between. */
const LEFT_GROUP = 5;

export type Zone = { readonly x: number; readonly width: number };

/** A reading in the bar: where its content starts, and the zone its press and its well cover. */
export type Placed = { readonly at: number; readonly zone: Zone };

export type Bar = { readonly readings: readonly Placed[]; readonly menu: Zone };

export type Measured = {
  /** The readings' content widths, in the order the bar reads them. */
  readonly readings: readonly number[];
  /** The Menu button, the last thing in the flow. */
  readonly menu: number;
  /** The bar itself, and how far the flow stands off each of its ends. */
  readonly width: number;
  readonly margin: number;
};

/** How far a zone reaches into the gap beside it: half of it, less the daylight, at most the well. */
function reach(gap: number): number {
  return Math.max(0, Math.min(WELL_MARGIN, (gap - DAYLIGHT) / 2));
}

/**
 * Where the Menu button stands: the last thing in the flow, hard against the bar's right margin. The
 * button is drawn on the menu scene, which reads its place from here, as the flow reads what to end
 * before.
 */
export function menuZone(menu: number, width: number, margin: number): Zone {
  return { x: width - margin - menu, width: menu };
}

export function layOutBar({ readings, menu, width, margin }: Measured): Bar {
  const room = width - 2 * margin - menu;
  const content = readings.reduce((total, span) => total + span, 0);
  // One gap before each reading but the first, and one before the Menu button: as many as readings.
  const slack = room - content - readings.length * BETWEEN;
  const even = slack >= 0 ? BETWEEN : Math.max(0, BETWEEN + slack / readings.length);
  const before = (index: number): number => even + (slack > 0 && index === LEFT_GROUP ? slack : 0);

  const placed: Placed[] = [];
  let x = margin;
  for (const [index, span] of readings.entries()) {
    if (index > 0) x += before(index);
    const left = index === 0 ? WELL_MARGIN : reach(before(index));
    placed.push({ at: x, zone: { x: x - left, width: span + left + reach(before(index + 1)) } });
    x += span;
  }
  return { readings: placed, menu: menuZone(menu, width, margin) };
}
