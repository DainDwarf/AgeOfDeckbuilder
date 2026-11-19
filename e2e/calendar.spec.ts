import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import { cardName, text } from '../src/ui/text';
import {
  campaignWith,
  chronicleOf,
  dragOut,
  firstSeed,
  idsOf,
  offeredOn,
  openSaved,
  playedAtNothing,
  readings,
  restedOnDeal,
  settledOn,
  standing,
  take,
  watch,
} from './chronicle-screen';

/** The card that deals the top of the draw pile. */
const CALENDAR = 'calendar';

/** A new campaign with a copy of the card added to its deck. */
const CAMPAIGN = campaignWith([CALENDAR]);

/** The first seed's turn 1 whose hand holds the card, its cost gained, and where it lies. */
function inHand(): { opened: Chronicle; index: number } {
  return firstSeed(`opens turn 1 on ${CALENDAR} in hand`, (seed) => {
    const settled = settledOn(seed, [], CAMPAIGN);
    const index = idsOf(settled.hand).indexOf(CALENDAR);
    if (index === -1) return undefined;
    return { opened: gained(settled, cardOf(CATALOGUE, CALENDAR).cost).chronicle, index };
  });
}

test('the calendar played raises the deal window under its name, dealing the cards the rules deal, and a left click on one leaves the chronicle the take leaves', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, index } = inHand();
  const dealt = playedAtNothing(opened, index);
  const offered = offeredOn(dealt);
  const chosen = offered.length - 1;
  const taken = outcome(apply(CATALOGUE, dealt, { type: 'take', at: chosen }));
  const cards = offered.map((_, place) => `deal-card-${place}`);
  const past = `deal-card-${offered.length}`;

  await openSaved(page, opened, CAMPAIGN);
  await dragOut(page, index);
  await restedOnDeal(page);
  const shown = await readings(page, ['deal-title', 'deal-lore', ...cards, past]);

  expect(await chronicleOf(page)).toEqual(dealt);
  expect(shown('deal-title').text).toBe(cardName(CALENDAR));
  expect(shown('deal-lore').text).toBe(text('deal.card'));
  expect(cards.map((name) => shown(name).card)).toEqual(offered);
  expect(shown(past).standing).toBe(false);

  await take(page, chosen);

  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(taken);
  expect(problems).toEqual([]);
});
