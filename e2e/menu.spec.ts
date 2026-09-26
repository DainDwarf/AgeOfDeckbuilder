import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { deckOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  aimed,
  bareAimable,
  beforeTheFall,
  browse,
  chronicleOf,
  cityTileOf,
  click,
  counted,
  dragOut,
  firstsOf,
  idsOf,
  mapFrame,
  onScreen,
  openSaved,
  rested,
  ringedTile,
  settledOn,
  standing,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** Every card the chronicle holds, wherever it stands: the deck it was begun on. */
function cardsHeld(chronicle: Chronicle): string[] {
  return idsOf([...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile]).sort();
}

/** Waits for the chronicle screen a new chronicle raised: the menu gone, one hand laid out on it. */
async function raised(page: Page): Promise<void> {
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => counted(page, 'hand-0')).toBe(1);
}

test('the menu walks in to Controls and closes back one step at a time', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  expect(await standing(page, 'menu')).toBe(false);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await click(page, 'menu-settings');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  expect(await standing(page, 'menu')).toBe(false);

  await click(page, 'settings-controls');
  await expect.poll(() => standing(page, 'controls')).toBe(true);
  expect(await standing(page, 'settings')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'settings')).toBe(false);
  expect(await standing(page, 'controls')).toBe(false);

  expect(problems).toEqual([]);
});

test('Escape raises the menu on a bare chronicle screen, and backs out of a browse without it', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  await browse(page, 'draw-pile');
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('Escape lets go of the card being aimed before it raises the menu', async ({ page }) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  await dragOut(page, index);
  await aimed(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('a pan dragged onto the Menu button carries the map the whole way, and opens no menu', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const city = cityTileOf(await chronicleOf(page));
  const button = await onScreen(page, 'menu-button');
  const travel = 80 * button.unit;
  // Straight below the button and inside the map's frame, where a press takes hold of the map.
  const from = { x: button.x, y: button.y + travel };
  expect(from.y).toBeGreaterThan((await mapFrame(page)).y);

  const before = await tileOnScreen(page, city);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(button.x, button.y, { steps: 10 });
  await rested(page);
  const carried = await tileOnScreen(page, city);
  await page.mouse.up();
  await rested(page);

  expect(carried.x - before.x).toBeCloseTo(0, 0);
  expect(carried.y - before.y).toBeCloseTo(-travel, 0);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('the selected tile waits under the menu', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const opened = await chronicleOf(page);
  const city = tileKey(cityTileOf(opened));
  await click(page, `tile-${city}`);
  await expect.poll(() => ringedTile(page)).toBe(city);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await ringedTile(page)).toBe(city);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await ringedTile(page)).toBe(city);

  expect(problems).toEqual([]);
});

test('a new chronicle deals the same deck a fresh seed, on the settle phase', async ({ page }) => {
  const problems = watch(page);
  const played = settledOn(1);
  const deck = deckOf(CATALOGUE, firstsOf().deck);

  await openSaved(page, played);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-new-chronicle');
  await raised(page);

  const fresh = await chronicleOf(page);
  expect(fresh.turn).toBe(0);
  expect(fresh.seed).not.toBe(played.seed);
  expect(cardsHeld(fresh)).toEqual([...deck.cards, ...deck.settle].sort());

  expect(problems).toEqual([]);
});

test('the menu opens over the defeat screen, and a new chronicle takes the chronicle screen back', async ({
  page,
}) => {
  const problems = watch(page);
  const fallen = outcome(apply(CATALOGUE, beforeTheFall(), { type: 'end-turn' }));

  await openSaved(page, fallen);
  await expect.poll(() => standing(page, 'defeat')).toBe(true);
  expect(await standing(page, 'capstone')).toBe(false);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await click(page, 'menu-new-chronicle');
  await raised(page);

  const fresh = await chronicleOf(page);
  expect(fresh.ending).toBeUndefined();
  expect(fresh.turn).toBe(0);
  expect(await standing(page, 'defeat')).toBe(false);

  expect(problems).toEqual([]);
});
