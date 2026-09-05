import { describe, expect, it } from 'vitest';
import { type Bar, BETWEEN, layOutBar, type Measured, WELL_MARGIN, type Zone } from './bar-layout';

/** A bar whose font leaves the row room to spare, as the design was measured in. */
const ROOMY: Measured = {
  readings: [92, 134, 112, 104, 116, 110, 132],
  menu: 70,
  width: 1280,
  margin: 24,
};

/** The same bar under a font that measures wider, which is every browser the game did not open in. */
function inAWiderFont(measured: Measured, by: number): Measured {
  return {
    ...measured,
    readings: measured.readings.map((span) => span * by),
    menu: measured.menu * by,
  };
}

/** Every zone the bar presses, in the order they stand: the seven readings, then the Menu button. */
function zones(bar: Bar): Zone[] {
  return [...bar.readings.map((placed) => placed.zone), bar.menu];
}

/** What each zone leaves between itself and the next; a press lands on two of them where it is not positive. */
function daylight(zones: readonly Zone[]): number[] {
  return zones.slice(1).map((next, index) => next.x - (zones[index].x + zones[index].width));
}

/** The gap before each thing after the first: the six between readings, then the one before Menu. */
function gaps(measured: Measured): number[] {
  const bar = layOutBar(measured);
  const ends = bar.readings.map((placed, index) => placed.at + measured.readings[index]);
  const starts = [...bar.readings.slice(1).map((placed) => placed.at), bar.menu.x];
  return starts.map((start, index) => start - ends[index]);
}

describe('a bar with room to spare', () => {
  it('stands the readings apart, and the Menu button one gap after the last of them', () => {
    expect(layOutBar(ROOMY).readings[0].at).toBe(ROOMY.margin);
    expect(gaps(ROOMY)).toEqual([
      BETWEEN,
      BETWEEN,
      BETWEEN,
      BETWEEN,
      expect.any(Number),
      BETWEEN,
      BETWEEN,
    ]);
  });

  it('spends what is left over in the one gap between the left group and the right one', () => {
    expect(gaps(ROOMY)[4]).toBeGreaterThan(BETWEEN);
  });

  it('lets no press land on two readings, nor on a reading and the Menu button', () => {
    for (const light of daylight(zones(layOutBar(ROOMY)))) expect(light).toBeGreaterThan(0);
  });

  it('reaches a press as far past a reading as its well is drawn', () => {
    const [food] = layOutBar(ROOMY).readings;
    expect(food.at - food.zone.x).toBe(WELL_MARGIN);
    expect(food.zone.width).toBe(ROOMY.readings[0] + 2 * WELL_MARGIN);
  });
});

describe('a bar under a font that measures wider', () => {
  const WIDER = inAWiderFont(ROOMY, 4 / 3);

  it('closes every gap by the same amount, rather than running the groups into each other', () => {
    const closed = gaps(WIDER);
    expect(closed[0]).toBeGreaterThan(0);
    expect(closed[0]).toBeLessThan(BETWEEN);
    for (const gap of closed) expect(gap).toBeCloseTo(closed[0]);
  });

  it('lets no press land on two readings, nor on a reading and the Menu button', () => {
    for (const light of daylight(zones(layOutBar(WIDER)))) expect(light).toBeGreaterThan(0);
  });

  it('keeps the first reading at the margin', () => {
    expect(layOutBar(WIDER).readings[0].at).toBe(ROOMY.margin);
  });
});

describe('a bar under a font too wide for the row', () => {
  const CRUSHED = inAWiderFont(ROOMY, 2);

  it('closes the gaps between the readings to nothing and shrinks no reading', () => {
    const closed = gaps(CRUSHED);
    expect(closed.slice(0, -1)).toEqual(new Array(CRUSHED.readings.length - 1).fill(0));
    const laid = layOutBar(CRUSHED).readings;
    for (const [index, placed] of laid.entries()) {
      expect(placed.zone.width).toBeGreaterThanOrEqual(CRUSHED.readings[index]);
    }
  });

  it('runs the row under the Menu button rather than shrinking what will not fit', () => {
    expect(gaps(CRUSHED).at(-1)).toBeLessThan(0);
  });

  it('still lets no press land on two readings', () => {
    const readings = layOutBar(CRUSHED).readings.map((placed) => placed.zone);
    for (const light of daylight(readings)) expect(light).toBeGreaterThanOrEqual(0);
  });
});
