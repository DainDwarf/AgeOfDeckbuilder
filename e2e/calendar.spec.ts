import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { cardName, text } from '../src/ui/text';
import {
  campaignWith,
  chronicleOf,
  dragOut,
  offeredOn,
  openSaved,
  paidInHand,
  playedAtNothing,
  readings,
  restedOnDeal,
  standing,
  take,
  watch,
} from './chronicle-screen';

/** The card that deals the top of the draw pile. */
const CALENDAR = 'calendar';

/** A new campaign with a copy of the card added to its deck. */
const CAMPAIGN = campaignWith([CALENDAR]);

test('the calendar played raises the deal window under its name, dealing the cards the rules deal, and a left click on one leaves the chronicle the take leaves', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = paidInHand(CALENDAR, CAMPAIGN);
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
