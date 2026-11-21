import { describe, expect, it } from 'vitest';
import { layOutCorner } from './corner-layout';

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
});
