import type { Box } from './design-space';

/** How wide and how tall the Menu button and the Icons button stand. */
const SQUARE = 40;

/** The gap between the Icons button and the Menu button. */
const APART = 8;

/** Where the buttons at the screen's top right corner stand. */
export type CornerLayout = { readonly menu: Box; readonly icons: Box };

/**
 * The Menu button at the top right corner of a screen that wide, `margin` in from its right edge and
 * level with the middle of a strip that tall along its top, and the Icons button left of it, level
 * with it and just apart.
 */
export function layOutCorner(width: number, margin: number, strip: number): CornerLayout {
  const menu = {
    x: width - margin - SQUARE,
    y: strip / 2 - SQUARE / 2,
    width: SQUARE,
    height: SQUARE,
  };
  return { menu, icons: { ...menu, x: menu.x - APART - SQUARE } };
}
