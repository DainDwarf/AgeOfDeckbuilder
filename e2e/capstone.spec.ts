import { expect, test } from '@playwright/test';
import { STAND_IN, STAND_IN_SCHEDULE } from '../src/content/stand-in';
import { scheduleOf } from '../src/rules/catalogue';
import { CENTRE } from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  budget,
  cardOnFace,
  chronicleOf,
  click,
  onScreen,
  open,
  openOnCapstone,
  playedOut,
  rested,
  settle,
  standing,
  stoppedTurn,
  titleOf,
  watch,
} from './chronicle-screen';

/** The capstone the schedule the spec opens on names. */
const CAPSTONE = scheduleOf(STAND_IN, STAND_IN_SCHEDULE).capstone.id;

/** The schedule whose capstone lands on the second turn. */
const SHORT = 'PH_ShortSchedule';

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

test('the capstone’s landing ends the end of turn on its window, and the hand is drawn once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));

  await open(page, 1, 'PH_Deck', SHORT);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.lands'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(scheduleOf(STAND_IN, SHORT).capstone.id);
  expect((await chronicleOf(page)).hand).toEqual([]);
  expect(await standing(page, 'hand-0')).toBe(false);

  const card = await onScreen(page, 'capstone-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);
  expect(await standing(page, 'hand-0')).toBe(false);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect((await chronicleOf(page)).hand).toHaveLength(5);
  expect(await standing(page, 'hand-0')).toBe(true);

  await rested(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(problems).toEqual([]);
});
