import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { deckOf } from '../src/rules/catalogue';
import {
  campaignShown,
  chronicleButton,
  chronicleOf,
  click,
  consoleKey,
  firstsOf,
  idsOf,
  readNames,
  rested,
  standing,
  watch,
} from './chronicle-screen';

/** What the address names past the path: nothing on the bare address. */
function named(page: Page): string {
  return new URL(page.url()).search;
}

test('an address naming a deck boots into the chronicle, stays as it was, and logs nothing', async ({
  page,
}) => {
  const problems = watch(page);

  const address = `?deck=${firstsOf().deck}`;
  await page.goto(`/${address}`);

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);

  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  expect(named(page)).toBe(address);
  expect((await chronicleOf(page)).age).toBe(firstsOf().age);

  expect(problems).toEqual([]);
});

test('the bare address with no save boots the campaign screen, whose menu lists no Campaign, and logs nothing', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');

  await campaignShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await standing(page, 'launch')).toBe(false);

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await rested(page);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'menu-settings')).toBe(true);
  expect(await standing(page, 'menu-campaign')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('the console over the launch page takes its digits and its Enter', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
  await page.keyboard.type('12');

  await consoleKey(page);
  await page.keyboard.type('345');
  await page.keyboard.press('Enter');
  await rested(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  await consoleKey(page);

  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  expect((await chronicleOf(page)).seed).toBe(12);

  expect(problems).toEqual([]);
});

test('Launch opens the chronicle on the firsts, and the address stays bare through Chronicle, Launch, Campaign, Chronicle and Launch again', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
  expect(named(page)).toBe('');
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);

  const launched = await chronicleOf(page);
  const firsts = firstsOf();
  const deck = deckOf(CATALOGUE, firsts.deck);
  expect(named(page)).toBe('');
  expect(launched.content).toBe(CATALOGUE.version);
  expect(launched.age).toBe(firsts.age);
  expect(idsOf([...launched.drawPile, ...launched.hand, ...launched.discardPile]).sort()).toEqual(
    [deck.city.card, ...deck.cards, ...deck.settle].sort(),
  );

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
  await click(page, 'menu-campaign');
  await campaignShown(page);
  expect(named(page)).toBe('');
  await chronicleButton(page);
  expect(named(page)).toBe('');
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(async () => (await chronicleOf(page)).seed).not.toBe(launched.seed);
  expect(named(page)).toBe('');

  expect(problems).toEqual([]);
});
