import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { cardName, text } from '../src/ui/text';
import {
  AIMED_AT_HAND,
  aimableAtHand,
  aimLine,
  chronicleOf,
  onScreen,
  openSaved,
  playedOut,
  rested,
  selected,
  standing,
  watch,
} from './chronicle-screen';

test('a card aimed at the hand is being aimed from its second click, says it is played at a card of the hand, and a click on another card of the hand plays it there', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, card, other } = aimableAtHand();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${card}`);
  const target = await onScreen(page, `hand-${other}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await selected(page, card, home)).toBe(true);
  expect(await standing(page, 'aim-point')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await aimLine(page)).toBe(text('aim.hand', { card: cardName(AIMED_AT_HAND) }));
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(target.x, target.y);
  await playedOut(page);
  await expect
    .poll(() => chronicleOf(page))
    .toEqual(
      outcome(apply(CATALOGUE, opened, { type: 'play', index: card, aim: 'hand', card: other })),
    );
  expect(await aimLine(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
