import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  aimed,
  browse,
  budget,
  chronicleOf,
  click,
  counted,
  dragOut,
  dragUnit,
  endTurn,
  fallRun,
  firstSeed,
  open,
  ringedTile,
  standing,
  watch,
  workerRun,
} from './chronicle-screen';

/** The first seed that stands its city through three ended turns. */
function standingRun(): number {
  return firstSeed('stands its city through three ended turns', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 0; turn < 3; turn++) {
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return chronicle.defeat === undefined ? seed : undefined;
  });
}

/** Every card the chronicle holds, wherever it stands: the deck it was founded on. */
function deckOf(chronicle: Chronicle): string[] {
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
}

/** Waits for the chronicle screen a new chronicle raised: the menu gone, one hand laid out on it. */
async function raised(page: Page): Promise<void> {
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => counted(page, 'hand-0')).toBe(1);
}

test('the menu walks in to Controls and closes back one step at a time', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
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

  await open(page, 1, 'PH_Deck');

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
  const run = workerRun('PH_Farm', (_, chronicle) => chronicle.hand.includes('PH_March'));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  // The refresh instant admits the tile of a unit that has spent move points, so the worker moves out first.
  const standingStill = await chronicleOf(page);
  await dragUnit(page, standingStill.city, run.tile);

  const entered = await chronicleOf(page);
  await dragOut(page, entered.hand.indexOf('PH_March'));
  await aimed(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(entered.hand);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('the Menu button drops the selected tile before it raises the menu', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const opened = await chronicleOf(page);
  await click(page, `tile-${tileKey(opened.city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(opened.city));

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a new chronicle deals the same deck a fresh seed, on turn 1', async ({ page }) => {
  const problems = watch(page);

  await open(page, standingRun(), 'PH_Deck');
  for (let turn = 0; turn < 3; turn++) await endTurn(page);
  const played = await chronicleOf(page);
  expect(played.turn).toBeGreaterThan(1);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-new-chronicle');
  await raised(page);

  const fresh = await chronicleOf(page);
  expect(fresh.turn).toBe(1);
  expect(fresh.seed).not.toBe(played.seed);
  expect(deckOf(fresh)).toEqual(deckOf(played));

  expect(problems).toEqual([]);
});

test('the menu opens over the defeat screen, and a new chronicle takes the chronicle screen back', async ({
  page,
}) => {
  const problems = watch(page);
  const run = fallRun();
  // The ends of turn the city falls on, and the new chronicle raised over the defeat screen after.
  test.setTimeout(budget(run.turns + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);
  await expect.poll(() => standing(page, 'defeat')).toBe(true);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await click(page, 'menu-new-chronicle');
  await raised(page);

  const fresh = await chronicleOf(page);
  expect(fresh.defeat).toBeUndefined();
  expect(fresh.turn).toBe(1);
  expect(await standing(page, 'defeat')).toBe(false);

  expect(problems).toEqual([]);
});
