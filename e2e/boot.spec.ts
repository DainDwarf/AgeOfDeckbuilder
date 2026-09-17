import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { chronicleOf, click, readNames, rested, standing, watch } from './chronicle-screen';

/** The seed the address carries, and nothing where it carries none. */
function seedOnAddress(page: Page): number | undefined {
  const seed = new URL(page.url()).searchParams.get('seed');
  return seed === null ? undefined : Number(seed);
}

test('an address naming a deck boots into the chronicle and logs nothing', async ({ page }) => {
  const problems = watch(page);

  await page.goto(`/?content=${STAND_IN.version}&deck=PH_Deck`);

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);

  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);

  expect(problems).toEqual([]);
});

test('the bare address boots the launch page and logs nothing', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await page.evaluate(() => window.game?.scene.isActive('chronicle'))).toBe(false);

  expect(problems).toEqual([]);
});

test('Launch opens the chronicle on the defaults, and the address follows every chronicle begun', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);

  const launched = await chronicleOf(page);
  const deck = deckOf(NOMADIC, 'nomadic');
  await expect.poll(() => seedOnAddress(page)).toBe(launched.seed);
  expect(launched.content).toBe(NOMADIC.version);
  expect([...launched.drawPile, ...launched.hand, ...launched.discardPile].sort()).toEqual(
    [...deck.cards, ...deck.settle].sort(),
  );

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-new-chronicle');
  await expect.poll(async () => (await chronicleOf(page)).seed).not.toBe(launched.seed);

  const fresh = await chronicleOf(page);
  await expect.poll(() => seedOnAddress(page)).toBe(fresh.seed);

  expect(problems).toEqual([]);
});
