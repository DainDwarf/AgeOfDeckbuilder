import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { civilizationOf } from '../src/rules/catalogue';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  aimed,
  bareAimable,
  beforeTheFall,
  browse,
  budget,
  campaignShown,
  chronicleButton,
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
  stoppedTurn,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** Every card the chronicle holds, wherever it stands: the cards of the civilization it was begun on. */
function cardsHeld(chronicle: Chronicle): string[] {
  return idsOf([...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile]).sort();
}

/**
 * Campaign pressed on the menu standing, the campaign screen it opens waited for, and Chronicle
 * pressed there, the launch screen it opens waited for.
 */
async function campaignThenChronicle(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'menu-campaign');
  await campaignShown(page);
  await chronicleButton(page);
}

/** Launch pressed on the launch screen standing, and the chronicle screen it raises waited for, one hand laid out on it. */
async function launchedFromScreen(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => counted(page, 'hand-0')).toBe(1);
}

/** Whether the launch screen's face for that option of that row stands selected. */
function optionSelected(page: Page, row: string, option: string): Promise<boolean> {
  return page.evaluate(
    (name) => window.named?.(name)?.object.getData('selected') === true,
    `launch-${row}-${option}`,
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

test('a right click on the scrim of the menu steps back one window, as a left click there does', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);

  await openSaved(page, opened);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-settings');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await click(page, 'settings-controls');
  await expect.poll(() => standing(page, 'controls')).toBe(true);

  // The Menu button stands under the scrim, clear of every window's box.
  const scrim = await onScreen(page, 'menu-button');
  await rested(page);
  await page.mouse.click(scrim.x, scrim.y, { button: 'right' });
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  expect(await standing(page, 'controls')).toBe(false);

  await rested(page);
  await page.mouse.click(scrim.x, scrim.y);
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'settings')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

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

test('Campaign opens the campaign screen, Chronicle there the launch screen on the firsts, and Launch deals the first civilization a fresh seed, on the settle phase', async ({
  page,
}) => {
  const problems = watch(page);
  const played = settledOn(1);
  const firsts = firstsOf();
  const civilization = civilizationOf(CATALOGUE, firsts.civilization);

  await openSaved(page, played);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await optionSelected(page, 'age', firsts.age)).toBe(true);
  expect(await optionSelected(page, 'region', firsts.region)).toBe(true);
  expect(await optionSelected(page, 'civilization', firsts.civilization)).toBe(true);

  await launchedFromScreen(page);

  const fresh = await chronicleOf(page);
  expect(fresh.turn).toBe(0);
  expect(fresh.seed).not.toBe(played.seed);
  expect(cardsHeld(fresh)).toEqual(
    [civilization.city.card, ...civilization.cards, ...civilization.settle].sort(),
  );

  expect(problems).toEqual([]);
});

test('the menu opens over the defeat screen, and Campaign, Chronicle then Launch take the chronicle screen back', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));

  await openSaved(page, beforeTheFall());
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'defeat')).toBe(true);
  expect(await standing(page, 'capstone')).toBe(false);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await campaignThenChronicle(page);
  expect(await standing(page, 'defeat')).toBe(false);
  await launchedFromScreen(page);

  const fresh = await chronicleOf(page);
  expect(fresh.ending).toBeUndefined();
  expect(fresh.turn).toBe(0);
  expect(await standing(page, 'defeat')).toBe(false);

  expect(problems).toEqual([]);
});
