import type { Box } from './design-space';

/** How wide and how tall each button at the corner stands. */
const SQUARE = 40;

/** The gap between each button at the corner and the one right of it. */
const APART = 8;

/**
 * How tall one row of the summary stands, how far its panel reaches over its first row and under its
 * last, and how tall it stands, two rows whatever it reads.
 */
export const SUMMARY_ROW = 22;
export const SUMMARY_PAD_Y = 8;
export const SUMMARY_HEIGHT = 2 * SUMMARY_PAD_Y + 2 * SUMMARY_ROW;

/** How far under the Menu button the summary's top stands, and how far under its foot a mode's chip stands. */
const UNDER_THE_MENU = 14;
const UNDER_THE_SUMMARY = 8;

/** A top right corner: how far across its right edge stands, and how far down its top. */
export type TopRight = { readonly right: number; readonly top: number };

/** The buttons at the screen's top right corner. */
export type CornerButton = 'menu' | 'icons' | 'signs' | 'hexGrid';

/** Where the buttons at the screen's top right corner stand, the summary under them, and a mode's chip under that. */
export type CornerLayout = Readonly<Record<CornerButton, Box>> & {
  /** Where the summary's top right corner stands. */
  readonly summary: TopRight;
  /** Where a mode's chip's top right corner stands, whether a summary stands or not. */
  readonly chip: TopRight;
};

/**
 * The Menu button at the top right corner of a screen that wide, `margin` in from its right edge and
 * level with the middle of a strip that tall along its top, the other buttons in a row left of it,
 * the summary's place and a mode's chip's under it, their right edges on its own.
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
  const right = menu.x + menu.width;
  const summary = { right, top: menu.y + menu.height + UNDER_THE_MENU };
  return {
    menu,
    icons,
    signs,
    hexGrid: leftOf(signs),
    summary,
    chip: { right, top: summary.top + SUMMARY_HEIGHT + UNDER_THE_SUMMARY },
  };
}
