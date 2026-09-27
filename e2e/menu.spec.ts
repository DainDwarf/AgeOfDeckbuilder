import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { deckOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
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

/** New chronicle pressed on the menu standing, and the page it opens waited for. */
async function newChronicle(page: Page): Promise<void> {
  await click(page, 'menu-new-chronicle');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
}

/** Launch pressed on the page standing, and the chronicle screen it raises waited for, one hand laid out on it. */
async function launchedFromPage(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => counted(page, 'hand-0')).toBe(1);
}

/** Whether the page's face for that option of that row stands chosen. */
function chosen(page: Page, row: string, option: string): Promise<boolean> {
  return page.evaluate(
    (name) => window.named?.(name)?.object.getData('chosen') === true,
    `launch-${row}-${option}`,
  );
}

/** What the page's seed slot reads. */
function seedReads(page: Page): Promise<string | undefined> {
  return page.evaluate(
    () =>
      (window.named?.('launch-seed-label')?.object as Phaser.GameObjects.Text | undefined)?.text,
  );
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

test('New chronicle opens the page on the chronicle’s choices, the seed blank, and Launch there deals the same deck a fresh seed, on the settle phase', async ({
  page,
}) => {
  const problems = watch(page);
  const played = settledOn(1);
  const firsts = firstsOf();
  const deck = deckOf(CATALOGUE, firsts.deck);

  await openSaved(page, played);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await newChronicle(page);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await chosen(page, 'age', firsts.age)).toBe(true);
  expect(await chosen(page, 'region', firsts.region)).toBe(true);
  expect(await chosen(page, 'deck', firsts.deck)).toBe(true);
  expect(await seedReads(page)).toBe(text('launch.fresh'));

  await launchedFromPage(page);

  const fresh = await chronicleOf(page);
  expect(fresh.turn).toBe(0);
  expect(fresh.seed).not.toBe(played.seed);
  expect(cardsHeld(fresh)).toEqual([deck.city.card, ...deck.cards, ...deck.settle].sort());

  expect(problems).toEqual([]);
});

test('the menu opens over the defeat screen, and New chronicle then Launch take the chronicle screen back', async ({
  page,
}) => {
  const problems = watch(page);
  const fallen = outcome(apply(CATALOGUE, beforeTheFall(), { type: 'end-turn' }));

  await openSaved(page, fallen);
  await expect.poll(() => standing(page, 'defeat')).toBe(true);
  expect(await standing(page, 'capstone')).toBe(false);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await newChronicle(page);
  expect(await standing(page, 'defeat')).toBe(false);
  await launchedFromPage(page);

  const fresh = await chronicleOf(page);
  expect(fresh.ending).toBeUndefined();
  expect(fresh.turn).toBe(0);
  expect(await standing(page, 'defeat')).toBe(false);

  expect(problems).toEqual([]);
});
