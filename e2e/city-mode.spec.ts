import { expect, type Page, test } from '@playwright/test';
import {
  click,
  onScreen,
  open,
  ringedTile,
  settled,
  shownLayer,
  shows,
  standing,
  watch,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = { name: 'tile-0,-3', key: '0,-3' };

/** Whether the chronicle screen shows city mode is on: both marks stand, or neither does. */
async function inCityMode(page: Page): Promise<boolean> {
  const chip = await shows(page, 'city-chip');
  const frame = await shows(page, 'city-frame');
  expect(frame).toBe(chip);
  return chip;
}

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await settled(page);
  await settled(page);
}

test('the city key enters city mode, where a tile click reads nothing, and the back key leaves it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await inCityMode(page)).toBe(false);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y);
  await answered(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  expect(problems).toEqual([]);
});

test('city mode lets go of the tile being read as it comes on', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a press on culture or population enters city mode, and the chip leaves it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-culture');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, 'reading-population');
  await answered(page);
  expect(await inCityMode(page)).toBe(true);

  await click(page, 'city-chip');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-population');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the city key', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await page.keyboard.press('c');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});
