import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { NOMADIC } from '../src/content/nomadic';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import {
  chronicleOf,
  click,
  consoleKey,
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

/** The faces of the launch page's content row, left to right, by version and whether each is chosen. */
function contentRow(page: Page): Promise<{ version: string; chosen: boolean }[]> {
  return page.evaluate(() => {
    const root = window.named?.('launch')?.object as Phaser.GameObjects.Container | undefined;
    if (root === undefined) throw new Error('there is no launch page');
    const prefix = 'launch-content-';
    return (root.list as Phaser.GameObjects.Rectangle[])
      .filter(({ name }) => name.startsWith(prefix) && !name.endsWith('-label'))
      .sort((one, other) => one.x - other.x)
      .map((face) => ({
        version: face.name.slice(prefix.length),
        chosen: face.getData('chosen') as boolean,
      }));
  });
}

test('an address naming a deck boots into the chronicle, stays as it was, and logs nothing', async ({
  page,
}) => {
  const problems = watch(page);

  const address = `?content=${STAND_IN.version}&deck=PH_Deck`;
  await page.goto(`/${address}`);

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);

  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  expect(named(page)).toBe(address);

  expect(problems).toEqual([]);
});

test('the bare address boots the launch page and logs nothing', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await rested(page);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'menu-settings')).toBe(true);
  expect(await standing(page, 'menu-new-chronicle')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test("the bare address's launch page lists the ages' content alone", async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await contentRow(page)).toEqual([{ version: NOMADIC.version, chosen: true }]);

  expect(problems).toEqual([]);
});

test('an address naming content the page does not list and no deck opens the page with it listed and chosen', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto(`/?content=${STAND_IN.version}`);

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await contentRow(page)).toEqual([
    { version: NOMADIC.version, chosen: false },
    { version: STAND_IN.version, chosen: true },
  ]);

  await rested(page);
  await click(page, `launch-content-${NOMADIC.version}`);
  await expect
    .poll(() => contentRow(page))
    .toEqual([
      { version: NOMADIC.version, chosen: true },
      { version: STAND_IN.version, chosen: false },
    ]);
  await rested(page);
  await click(page, `launch-content-${STAND_IN.version}`);
  await expect
    .poll(() => contentRow(page))
    .toEqual([
      { version: NOMADIC.version, chosen: false },
      { version: STAND_IN.version, chosen: true },
    ]);

  expect(problems).toEqual([]);
});

test('the console over the launch page takes its digits and its Enter', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await expect.poll(() => standing(page, 'launch')).toBe(true);
  await rested(page);
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

test('Launch opens the chronicle on the defaults, and the address stays bare through Launch and New chronicle', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);

  const launched = await chronicleOf(page);
  const deck = deckOf(NOMADIC, 'nomadic');
  expect(named(page)).toBe('');
  expect(launched.content).toBe(NOMADIC.version);
  expect(idsOf([...launched.drawPile, ...launched.hand, ...launched.discardPile]).sort()).toEqual(
    [...deck.cards, ...deck.settle].sort(),
  );

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-new-chronicle');
  await expect.poll(async () => (await chronicleOf(page)).seed).not.toBe(launched.seed);
  expect(named(page)).toBe('');

  expect(problems).toEqual([]);
});
