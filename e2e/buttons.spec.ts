import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  canvasOf,
  chronicleOf,
  click,
  cursorAt,
  DESIGN_WINDOW,
  endTurnChip,
  type Frame,
  firstSeed,
  launchedAs,
  onScreen,
  openSaved,
  pieceOnScreen,
  pieceWorn,
  readings,
  resizedTo,
  settledOn,
  standing,
  tooltipLines,
  tooltipUp,
  WIDE,
  watch,
} from './chronicle-screen';

/** A turn of the first seed whose end deals nothing, so the next turn stands on the screen alone. */
function dealingNothing(): Chronicle {
  return firstSeed('deals nothing as its first turn ends', (seed) => {
    const chronicle = settledOn(seed);
    return chronicle.timeline.next > chronicle.turn + 1 ? chronicle : undefined;
  });
}

/** Where the named tooltip's bubble stands on the page. */
async function bubbleOf(page: Page, name: string): Promise<Frame> {
  return (await readings(page, [name]))(name).boundsOnScreen;
}

/** The name the rest on the end-turn button raises, its bubble's foot over `over`. */
async function endTurnNamed(page: Page, reads: string, over: number): Promise<void> {
  const button = await onScreen(page, 'end-turn');
  expect(await cursorAt(page, button)).toBe('pointer');
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([{ text: reads, bold: false }]);
  const bubble = await bubbleOf(page, 'tooltip-ui');
  expect(bubble.y + bubble.height).toBeLessThan(over);
}

test('End turn reads the turn on its chip and the next once it ticks, a click on the chip ending it; on the settle phase it wears none', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = dealingNothing();
  const next = outcome(apply(CATALOGUE, opened, { type: 'end-turn' }));

  await openSaved(page, opened);
  expect(await endTurnChip(page)).toBe(String(opened.turn));

  const square = await pieceOnScreen(page, 'end-turn');
  const chip = await pieceOnScreen(page, 'end-turn-count-chip');
  const onChip = { x: chip.x + chip.width / 2, y: chip.y + chip.height / 4 };
  expect(onChip.y).toBeLessThan(square.y);
  await page.mouse.click(onChip.x, onChip.y);
  await expect.poll(() => chronicleOf(page)).toEqual(next);
  await expect.poll(() => endTurnChip(page)).toBe(String(next.turn));

  await openSaved(page, launchedAs(1));
  expect(await endTurnChip(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('End turn names itself on the rest over its chip on a turn', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const chip = await pieceOnScreen(page, 'end-turn-count-chip');
  await endTurnNamed(page, text('button.end-turn'), chip.y);

  expect(problems).toEqual([]);
});

test('End turn, dead on the settle phase, names the phase’s end on the rest over its square, the pointer the hand on it', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, launchedAs(1));
  const square = await pieceOnScreen(page, 'end-turn');
  await endTurnNamed(page, text('button.end-settle-phase'), square.y);

  expect(problems).toEqual([]);
});

test('End turn stands over the exhaust pile on the smallest window, its right edge on the pile’s, and in the bottom right corner clear of the band on a wide one', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, settledOn(1));
  const smallest = await pieceOnScreen(page, 'end-turn');
  const exhaust = await pieceOnScreen(page, 'exhaust-pile-round');
  expect(smallest.x + smallest.width).toBeCloseTo(exhaust.x + exhaust.width, 1);
  expect(smallest.y + smallest.height).toBeLessThan(exhaust.y);

  await resizedTo(page, WIDE);
  const wide = await pieceOnScreen(page, 'end-turn');
  const band = await pieceOnScreen(page, 'band');
  const fromRight = WIDE.width - (wide.x + wide.width);
  expect(fromRight).toBeGreaterThan(0);
  expect(WIDE.height - (wide.y + wide.height)).toBeCloseTo(fromRight, 1);
  expect(wide.x).toBeGreaterThan(band.x + band.width);

  expect(problems).toEqual([]);
});

test('the Icons button stands left of the Menu button and level with it, sunk in its well while the discs are shown and standing once they are hidden, and each names itself on the rest under it', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const menu = await pieceOnScreen(page, 'menu-button');
  const icons = await pieceOnScreen(page, 'icons-button');
  expect(icons.x + icons.width).toBeLessThan(menu.x);
  expect(icons.y + icons.height / 2).toBeCloseTo(menu.y + menu.height / 2, 1);
  expect((await pieceWorn(page, 'icons-button')).piece).toBe('tab');

  const iconsAt = await onScreen(page, 'icons-button');
  await page.mouse.move(iconsAt.x, iconsAt.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
    { text: text('button.icons'), bold: false },
  ]);
  expect((await bubbleOf(page, 'tooltip-ui')).y).toBeGreaterThan(icons.y + icons.height);

  await click(page, 'icons-button');
  await expect.poll(async () => (await pieceWorn(page, 'icons-button')).piece).toBe('silver');

  const menuAt = await onScreen(page, 'menu-button');
  await page.mouse.move(menuAt.x, menuAt.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-menu')).toBe(true);
  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);
  expect(await tooltipLines(page, 'tooltip-menu')).toEqual([
    { text: text('menu.menu'), bold: false },
  ]);
  const bubble = await bubbleOf(page, 'tooltip-menu');
  expect(bubble.y).toBeGreaterThan(menu.y + menu.height);
  expect(bubble.x + bubble.width).toBeLessThanOrEqual((await canvasOf(page)).right);

  expect(problems).toEqual([]);
});

test('a scrim of the menu rising takes the Menu button’s name down', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(menu.x, menu.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-menu')).toBe(true);

  await page.mouse.click(menu.x, menu.y);
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await expect.poll(() => tooltipUp(page, 'tooltip-menu')).toBe(false);

  expect(problems).toEqual([]);
});
