import { expect, test } from '@playwright/test';
import { STAND_IN, STAND_IN_SCHEDULE } from '../src/content/stand-in';
import { scheduleOf } from '../src/rules/catalogue';
import { CENTRE } from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  budget,
  cardOnFace,
  click,
  onScreen,
  openOnCapstone,
  settle,
  standing,
  titleOf,
  watch,
} from './chronicle-screen';

/** The capstone the schedule the spec opens on names. */
const CAPSTONE = scheduleOf(STAND_IN, STAND_IN_SCHEDULE).capstone.event;

test('the chronicle’s opening announces the capstone, once', async ({ page }) => {
  const problems = watch(page);
  // The settle's turn ended to prove the window does not come back.
  test.setTimeout(budget(0));

  await openOnCapstone(page, 1, 'PH_Deck');
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(CAPSTONE);

  const card = await onScreen(page, 'capstone-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(CAPSTONE);
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

  await settle(page, CENTRE, 'bare');
  expect(await standing(page, 'capstone')).toBe(false);

  expect(problems).toEqual([]);
});
