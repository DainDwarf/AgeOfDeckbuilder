import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { scheduleOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { CENTRE, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import {
  aimed,
  budget,
  capstoneClosed,
  cardOnFace,
  chronicleOf,
  click,
  dragOut,
  endedTurn,
  firstsOf,
  loreOf,
  onScreen,
  openNew,
  openSaved,
  playedOut,
  rested,
  settledOn,
  standing,
  stoppedTurn,
  titleOf,
  watch,
} from './chronicle-screen';

/** The capstone the first schedule names. */
const CAPSTONE = scheduleOf(CATALOGUE, firstsOf().schedule).capstone.id;

/** Seed 1's bare turn 1 with its turns ended headlessly up to the turn before the capstone lands. */
function beforeTheCapstone(): Chronicle {
  let chronicle = settledOn(1);
  const landing = chronicle.timeline.capstone.turn;
  while (chronicle.turn < landing - 1 && chronicle.ending === undefined) {
    chronicle = endedTurn(chronicle);
  }
  if (chronicle.ending !== undefined || chronicle.deals.length > 0)
    throw new Error(`seed 1 stands on no open turn before the capstone lands on turn ${landing}`);
  return chronicle;
}

test('the chronicle’s opening announces the capstone, once', async ({ page }) => {
  const problems = watch(page);
  // The settle's turn ended to prove the window does not come back.
  test.setTimeout(budget(0));

  await openNew(page, 1);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(CAPSTONE, 'opening'));
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

  await capstoneClosed(page);

  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);
  await stoppedTurn(page);
  expect(await standing(page, 'capstone')).toBe(false);

  expect(problems).toEqual([]);
});

test('the capstone’s landing holds the end of turn on its window, and the end of turn goes on to draw the hand once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const before = beforeTheCapstone();
  const landed = outcome(apply(CATALOGUE, before, { type: 'end-turn' }));

  await openSaved(page, before);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(CAPSTONE, 'landing'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(CAPSTONE);
  expect((await chronicleOf(page)).hand).toEqual([]);
  expect(await standing(page, 'hand-0')).toBe(false);

  await rested(page);
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
  await expect.poll(() => chronicleOf(page)).toEqual(landed);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(problems).toEqual([]);
});
