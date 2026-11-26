import { describe, expect, it } from 'vitest';
import { type CityPanelMeasured, DISC, layOutCityPanel } from './city-panel-layout';

/** What a panel of the test's own reads: a short name, two readings of a few digits, three counts. */
const SHORT: CityPanelMeasured = {
  name: 90,
  close: 30,
  cells: [
    { reading: 70, turns: 20 },
    { reading: 64, turns: 0 },
  ],
  counts: [24, 18, 18],
};

describe('city mode’s panel', () => {
  const short = layOutCityPanel(SHORT);

  it('stands the name’s middle on the panel’s, the disc at the first line’s left end and Close at its right end, apart from the name', () => {
    expect(short.name).toBe(short.width / 2);
    const nameLeft = short.name - SHORT.name / 2;
    const nameRight = short.name + SHORT.name / 2;
    expect(short.disc - DISC / 2).toBeGreaterThan(0);
    expect(short.disc + DISC / 2).toBeLessThan(nameLeft);
    expect(short.close.x).toBeGreaterThan(nameRight);
    expect(short.close.x + short.close.width).toBeLessThan(short.width);
    expect(short.width - (short.close.x + short.close.width)).toBe(short.disc - DISC / 2);
  });

  it('stands Close as wide as its word with room each side, as tall as the first line, its middle on the line’s', () => {
    expect(short.close.width).toBeGreaterThan(SHORT.close);
    expect(short.close.y + short.close.height / 2).toBe(short.firstLine);
    expect(short.close.y).toBeGreaterThan(0);
  });

  it('stands the second line under the first, the bars under the readings, and the panel’s foot under both', () => {
    expect(short.secondLine).toBeGreaterThan(short.close.y + short.close.height);
    expect(short.readings).toBeGreaterThan(short.secondLine);
    expect(short.bars).toBeGreaterThan(short.readings);
    expect(short.height).toBeGreaterThan(short.secondLine + short.secondLineHeight);
  });

  it('stands the two cells of one width, apart, food’s first, and the counts after them in order, apart, none over another', () => {
    const [food, culture] = short.cells;
    expect(culture).toBeGreaterThan(food + short.cell);
    let right = culture + short.cell;
    for (const [index, middle] of short.counts.entries()) {
      const half = SHORT.counts[index] / 2;
      expect(middle - half).toBeGreaterThan(right);
      right = middle + half;
    }
    expect(short.width).toBeGreaterThan(right);
  });

  it('keeps a cell at one width whatever a reading that fits in it asks', () => {
    const wider = layOutCityPanel({
      ...SHORT,
      cells: [
        { reading: 80, turns: 30 },
        { reading: 40, turns: 10 },
      ],
    });
    expect(wider.cell).toBe(short.cell);
    expect(wider.width).toBe(short.width);
  });

  it('widens both cells together, and the panel with them, for a reading that asks for more, its turns left among it', () => {
    const wide = layOutCityPanel({
      ...SHORT,
      cells: [
        { reading: short.cell, turns: 30 },
        { reading: 40, turns: 10 },
      ],
    });
    expect(wide.cell).toBeGreaterThan(short.cell + 30);
    expect(wide.width - short.width).toBe(2 * (wide.cell - short.cell));
    expect(wide.cells[1] - wide.cells[0]).toBe(
      short.cells[1] - short.cells[0] + wide.cell - short.cell,
    );
  });

  it('widens the panel for a name its first line cannot hold between the disc and Close', () => {
    const named = layOutCityPanel({ ...SHORT, name: short.width });
    expect(named.width).toBeGreaterThan(short.width);
    expect(named.disc + DISC / 2).toBeLessThan(named.name - short.width / 2);
    expect(named.close.x).toBeGreaterThan(named.name + short.width / 2);
  });

  it('stands as tall whatever it reads', () => {
    const named = layOutCityPanel({ ...SHORT, name: short.width });
    expect(named.height).toBe(short.height);
  });
});
