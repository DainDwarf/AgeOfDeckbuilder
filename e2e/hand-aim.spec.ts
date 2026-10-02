import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf } from '../src/rules/cards';
import { cardOf, civilizationOf, firstCivilization } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import { cardName, text } from '../src/ui/text';
import {
  aimLine,
  chronicleOf,
  firstSeed,
  inHand,
  onScreen,
  openSaved,
  playedOut,
  rested,
  selected,
  settledOn,
  standing,
  watch,
} from './chronicle-screen';

/** The card of the catalogue aimed at the hand. */
const AIMED = (() => {
  const found = Object.keys(CATALOGUE.cards).find(
    (id) => aimOf(cardOf(CATALOGUE, id)).aim === 'hand',
  );
  if (found === undefined) throw new Error('no card of the catalogue is aimed at the hand');
  return found;
})();

/**
 * The first seed's turn 1, its city settled bare, on the first civilization with one copy of the card
 * aimed at the hand in its deck, whose hand holds that card and the city can play it; where it lies,
 * and where the first other card of the hand lies.
 */
function aimableAtHand(): { opened: Chronicle; card: number; other: number } {
  const first = civilizationOf(CATALOGUE, firstCivilization(CATALOGUE));
  const civilization = { ...first, cards: [...first.cards, AIMED] };
  return firstSeed('opens turn 1 on the card aimed at the hand, playable', (seed) => {
    const opened = settledOn(seed, [], civilization);
    const card = inHand(opened, ({ aim, playable }) => aim === 'hand' && playable);
    if (card === -1) return undefined;
    return { opened, card, other: card === 0 ? 1 : 0 };
  });
}

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
  expect(await aimLine(page)).toBe(text('aim.hand', { card: cardName(AIMED) }));
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
