import { expect, test } from '@playwright/test';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import {
  budget,
  chronicleOf,
  click,
  endTurn,
  open,
  readNames,
  rested,
  standing,
  watch,
} from './chronicle-screen';

test('a chronicle reopened on the bare address stands where it stood, under its capstone’s window', async ({
  page,
}) => {
  test.setTimeout(budget(1));
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await endTurn(page);
  const stood = await chronicleOf(page);

  await page.goto('/');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await rested(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  expect(await chronicleOf(page)).toEqual(stood);

  expect(problems).toEqual([]);
});

test('a save that cannot be read is dropped, the console says why, and the launch page boots', async ({
  page,
}) => {
  const problems = watch(page);
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await readNames(page);
  await page.addInitScript((entry) => {
    window.localStorage.setItem(entry, 'no save');
  }, SAVE_ENTRY);

  await page.goto('/');

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await page.evaluate((entry) => window.localStorage.getItem(entry), SAVE_ENTRY)).toBe(null);
  expect(warnings).toContainEqual(expect.stringContaining('the save is not JSON'));

  expect(problems).toEqual([]);
});
