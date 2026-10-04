import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf } from '../src/rules/catalogue';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import {
  campaignShown,
  cardOnFace,
  chronicleButton,
  chronicleOf,
  click,
  consoleKey,
  launchedFromScreen,
  launchedOn,
  loreOf,
  readNames,
  rested,
  shows,
  standing,
  titleOf,
  watch,
} from './chronicle-screen';

/** What the address names past the path: nothing on the bare address. */
function named(page: Page): string {
  return new URL(page.url()).search;
}

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

test('Enter on the launch screen launches nothing, and the back key under the console closes the console and raises no menu', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);

  await page.keyboard.press('Enter');
  await rested(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await standing(page, 'launch-button')).toBe(true);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(true);
  await page.keyboard.press('Escape');
  await rested(page);
  expect(await shows(page, 'console')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('Launch opens the chronicle on the firsts under its capstone’s window, and the address stays bare through Chronicle, Launch, Campaign, Chronicle and Launch again', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
  expect(named(page)).toBe('');
  await launchedFromScreen(page);

  const launched = await chronicleOf(page);
  expect(named(page)).toBe('');
  expect(launched).toEqual(launchedOn(launched.seed));

  const capstone = ageOf(CATALOGUE, launched.age).schedule.capstone.id;
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'opening'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(capstone);

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await rested(page);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);

  await rested(page);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
  await click(page, 'menu-campaign');
  await campaignShown(page);
  expect(named(page)).toBe('');
  await chronicleButton(page);
  expect(named(page)).toBe('');
  await launchedFromScreen(page);
  await expect.poll(async () => (await chronicleOf(page)).seed).not.toBe(launched.seed);
  expect(named(page)).toBe('');

  expect(problems).toEqual([]);
});
