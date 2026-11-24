import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { openingChoices } from '../src/rules/campaign';
import { tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import { type Chronicle, cardsInPiles } from '../src/rules/state';
import {
  aimed,
  bareAimable,
  beforeTheFall,
  browse,
  campaignThenChronicle,
  chronicleOf,
  civilizationOpened,
  click,
  dragOut,
  firstDealt,
  idsOf,
  intoSettings,
  launchedFromScreen,
  mapFrame,
  onScreen,
  openLaunch,
  openSaved,
  PAST_REST,
  pieceWornOf,
  playerCityTile,
  readings,
  rested,
  restedOnDeal,
  ringedTile,
  settledOn,
  standing,
  stoppedTurn,
  tileOnScreen,
  tooltipUp,
  waitGameClock,
  watch,
  windowOnScreen,
} from './chronicle-screen';

/** Every card the chronicle holds, wherever it stands: the cards of the civilization it was begun on. */
function cardsHeld(chronicle: Chronicle): string[] {
  return idsOf(cardsInPiles(chronicle)).sort();
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
  await intoSettings(page);
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
  const city = playerCityTile(await chronicleOf(page));
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
  const city = tileKey(playerCityTile(opened));
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
  const firsts = openingChoices(CATALOGUE, freshCampaign(CATALOGUE));
  const civilization = civilizationOpened();

  await openSaved(page, played);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  expect(await standing(page, 'menu')).toBe(false);
  const options = [
    `launch-age-${firsts.age}`,
    `launch-region-${firsts.region}`,
    `launch-civilization-${firsts.civilization}`,
  ];
  const seen = await readings(page, options);
  for (const option of options) expect(seen(option).selected).toBe(true);

  await launchedFromScreen(page);

  const fresh = await chronicleOf(page);
  expect(fresh.turn).toBe(0);
  expect(fresh.seed).not.toBe(played.seed);
  expect(cardsHeld(fresh)).toEqual(
    [civilization.city.card, ...civilization.cards, ...civilization.settle].sort(),
  );

  expect(problems).toEqual([]);
});

/**
 * The pointer moved onto the Menu button and rested there past a tooltip's rest, and pressed: the
 * button wore no hover look and raised no tooltip on the bubble of the screen it stands on.
 */
async function pressedUnderScrim(page: Page, tooltip = 'tooltip-ui'): Promise<void> {
  const button = await onScreen(page, 'menu-button');
  await page.mouse.move(button.x, button.y);
  await waitGameClock(page, PAST_REST);
  const seen = await readings(page, ['menu-button', tooltip]);
  expect(pieceWornOf(seen('menu-button'))).toEqual({ piece: 'silver', look: 'normal' });
  expect(seen(tooltip).shows).toBe(false);
  await rested(page);
  await page.mouse.click(button.x, button.y);
  await rested(page);
}

test('under a card shown large on the chronicle screen and a civilization’s browse on the launch screen, a press on the Menu button is a press on the scrim: the card comes down, the browse closes, and no menu rises', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const card = await onScreen(page, 'hand-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  await rested(page);
  await pressedUnderScrim(page);
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);

  await openLaunch(page);
  const { civilization } = openingChoices(CATALOGUE, freshCampaign(CATALOGUE));
  const pile = await windowOnScreen(page, `launch-civilization-${civilization}-card`);
  await page.mouse.click(pile.x, pile.y, { button: 'right' });
  await expect.poll(() => standing(page, 'civilization-browse')).toBe(true);
  await rested(page);
  await pressedUnderScrim(page, 'tooltip-launch');
  await expect.poll(() => standing(page, 'civilization-browse')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('under the deal window, a browse and the defeat screen a press on the Menu button is a press on the scrim, the back key raises the menu over the deal window and the defeat screen, and Campaign, Chronicle then Launch take the chronicle screen back', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, firstDealt(1));
  await restedOnDeal(page);
  await pressedUnderScrim(page);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await standing(page, 'menu')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await openSaved(page, beforeTheFall());
  await browse(page, 'draw-pile');
  await rested(page);
  await pressedUnderScrim(page);
  await expect.poll(() => standing(page, 'browse')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'defeat')).toBe(true);
  expect(await standing(page, 'capstone')).toBe(false);
  await pressedUnderScrim(page);
  expect(await standing(page, 'defeat')).toBe(true);
  expect(await standing(page, 'menu')).toBe(false);

  await page.keyboard.press('Escape');
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
