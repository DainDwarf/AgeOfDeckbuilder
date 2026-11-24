import { describe, expect, it } from 'vitest';
import { layOutCorner, SUMMARY_HEIGHT } from './corner-layout';

/** The smallest screen's width and a wider one's, and a margin and a strip of the test's own. */
const SMALLEST = 1280;
const WIDER = 1920;
const MARGIN = 20;
const STRIP = 50;

describe('the buttons at the screen’s top right corner', () => {
  const smallest = layOutCorner(SMALLEST, MARGIN, STRIP);
  const wider = layOutCorner(WIDER, MARGIN, STRIP);

  it('stands the Menu button the margin in from the right edge, its middle on the strip’s, on any width', () => {
    for (const [{ menu }, width] of [
      [smallest, SMALLEST],
      [wider, WIDER],
    ] as const) {
      expect(width - (menu.x + menu.width)).toBe(MARGIN);
      expect(menu.y + menu.height / 2).toBe(STRIP / 2);
    }
  });

  it('stands the Icons button left of the Menu button, level with it, of its size and just apart', () => {
    for (const { menu, icons } of [smallest, wider]) {
      expect(icons.y).toBe(menu.y);
      expect(icons.width).toBe(menu.width);
      expect(icons.height).toBe(menu.height);
      const gap = menu.x - (icons.x + icons.width);
      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeLessThan(menu.width);
    }
  });

  it('stands the Faction signs button left of the Icons button, level with it, of its size and as far from it as it stands from the Menu button', () => {
    for (const { menu, icons, signs } of [smallest, wider]) {
      expect(signs.y).toBe(icons.y);
      expect(signs.width).toBe(icons.width);
      expect(signs.height).toBe(icons.height);
      expect(icons.x - (signs.x + signs.width)).toBe(menu.x - (icons.x + icons.width));
    }
  });

  it('stands the Hex grid button left of the Faction signs button, level with it, of its size and as far from it as it stands from the Icons button', () => {
    for (const { icons, signs, hexGrid } of [smallest, wider]) {
      expect(hexGrid.y).toBe(signs.y);
      expect(hexGrid.width).toBe(signs.width);
      expect(hexGrid.height).toBe(signs.height);
      expect(signs.x - (hexGrid.x + hexGrid.width)).toBe(icons.x - (signs.x + signs.width));
    }
  });

  it('stands the summary under the Menu button, its right edge on the button’s, at one height on any width', () => {
    for (const { menu, summary } of [smallest, wider]) {
      expect(summary.right).toBe(menu.x + menu.width);
      expect(summary.top).toBeGreaterThan(menu.y + menu.height);
    }
    expect(wider.summary.top).toBe(smallest.summary.top);
  });

  it('stands a mode’s chip under the summary’s two rows, its right edge on the summary’s', () => {
    for (const { summary, chip } of [smallest, wider]) {
      expect(chip.right).toBe(summary.right);
      expect(chip.top).toBeGreaterThan(summary.top + SUMMARY_HEIGHT);
    }
  });
});
