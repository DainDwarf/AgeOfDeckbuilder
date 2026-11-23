import type { Box } from './design-space';

/** How wide and how tall each button at the corner stands. */
const SQUARE = 40;

/** The gap between each button at the corner and the one right of it. */
const APART = 8;

/** Where the buttons at the screen's top right corner stand. */
export type CornerLayout = {
  readonly menu: Box;
  readonly icons: Box;
  readonly signs: Box;
  readonly hexGrid: Box;
};

/**
 * The Menu button at the top right corner of a screen that wide, `margin` in from its right edge and
 * level with the middle of a strip that tall along its top, and the other buttons left of it in a
 * row, each level with it and just apart from the one right of it.
 */
export function layOutCorner(width: number, margin: number, strip: number): CornerLayout {
  const menu = {
    x: width - margin - SQUARE,
    y: strip / 2 - SQUARE / 2,
    width: SQUARE,
    height: SQUARE,
  };
  const leftOf = (box: Box): Box => ({ ...box, x: box.x - APART - SQUARE });
  const icons = leftOf(menu);
  const signs = leftOf(icons);
  return { menu, icons, signs, hexGrid: leftOf(signs) };
}
