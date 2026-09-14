import { expect, test } from '@playwright/test';
import { SCHEDULE } from '../src/rules/schedule';
import { text } from '../src/ui/text';
import {
  budget,
  cardOnFace,
  click,
  endTurn,
  onScreen,
  openOnCapstone,
  standing,
  titleOf,
  watch,
} from './chronicle-screen';

test('the founding announces the capstone, once', async ({ page }) => {
  const problems = watch(page);
  // The turn ended to prove the window does not come back.
  test.setTimeout(budget(1));

  await openOnCapstone(page, 1, 'PH_Deck');
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(SCHEDULE.capstone.event);

  const card = await onScreen(page, 'capstone-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(SCHEDULE.capstone.event);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);

  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  await endTurn(page);
  expect(await standing(page, 'capstone')).toBe(false);

  expect(problems).toEqual([]);
});
