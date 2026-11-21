import { describe, expect, it } from 'vitest';
import { BETWEEN, layOutReadings, type ReadingRow, WELL_MARGIN, type Zone } from './bar-layout';

/** Seven readings of widths of their own, as a bar's rooms are. */
const READINGS = [78, 87, 87, 87, 87, 78, 102];

const END = 16;

/** What each zone leaves between itself and the next; a press lands on two of them where it is not positive. */
function daylight(zones: readonly Zone[]): number[] {
  return zones.slice(1).map((next, index) => next.x - (zones[index].x + zones[index].width));
}

/** The gap before each reading after the first. */
function gaps(row: ReadingRow, readings: readonly number[]): number[] {
  return row.readings
    .slice(1)
    .map((placed, index) => placed.at - (row.readings[index].at + readings[index]));
}

describe('a row of readings', () => {
  const row = layOutReadings(READINGS, END);

  it('stands the readings in the order handed, each two the same gap apart', () => {
    expect(gaps(row, READINGS)).toEqual(READINGS.slice(1).map(() => BETWEEN));
  });

  it('stands its ends as far off the first reading and the last', () => {
    const last = row.readings.length - 1;
    expect(row.readings[0].at).toBe(END);
    expect(row.width - (row.readings[last].at + READINGS[last])).toBe(END);
  });

  it('is as wide as its readings, their gaps and its two ends', () => {
    const content = READINGS.reduce((total, span) => total + span, 0);
    expect(row.width).toBe(content + (READINGS.length - 1) * BETWEEN + 2 * END);
  });

  it('lets no press land on two readings', () => {
    for (const light of daylight(row.readings.map((placed) => placed.zone))) {
      expect(light).toBeGreaterThan(0);
    }
  });

  it('reaches a press as far past its first and last reading as a well is drawn', () => {
    const first = row.readings[0];
    const last = row.readings[row.readings.length - 1];
    expect(first.at - first.zone.x).toBe(WELL_MARGIN);
    expect(last.zone.x + last.zone.width - (last.at + READINGS[READINGS.length - 1])).toBe(
      WELL_MARGIN,
    );
  });
});

describe('a row of one reading', () => {
  it('reaches a press as far as a well on both sides of it', () => {
    const [only] = layOutReadings([120], 24).readings;
    expect(only.at).toBe(24);
    expect(only.zone).toEqual({ x: 24 - WELL_MARGIN, width: 120 + 2 * WELL_MARGIN });
  });
});
