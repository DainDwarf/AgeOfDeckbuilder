import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { gained } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { answerCost, answerOf } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import {
  barReadingOn,
  budget,
  chronicleOf,
  eventDealRead,
  firstDealtAlone,
  idsOf,
  offeredOn,
  openSaved,
  readings,
  restedOnDeal,
  standing,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const DROUGHT = 'drought';

/** The answer of the event that adds its challenge, and the challenge it adds, of the same id. */
const RAIN_DANCE = 'rain-dance';

/** The answer of the event that pays food. */
const RATIONING = 'rationing';

/**
 * The first seed's turn 1 from the campaign, settled bare, whose first deal is the event alone,
 * stopped on the deal; then what rationing costs gained.
 */
function parched(campaign: Campaign): Chronicle {
  const dealt = firstDealtAlone(DROUGHT, campaign);
  const costs = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, DROUGHT, RATIONING));
  const gain = Object.fromEntries(costs.map(({ resource, amount }) => [resource, amount]));
  return gained(dealt, gain).chronicle;
}

test('the drought deals its answers, and rationing pays the food the rules price', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = parched(campaign);
  const at = offeredOn(dealt).indexOf(RATIONING);
  const [price] = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, DROUGHT, RATIONING));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const stock = `reading-${price.resource}-value`;
  expect(after.resources[price.resource]).toBe(dealt.resources[price.resource] - price.amount);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, DROUGHT, [stock]);
  expect(shown(stock).text).toBe(barReadingOn(dealt, price.resource));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([
    false,
    barReadingOn(after, price.resource),
  ]);

  expect(problems).toEqual([]);
});

test('the rain dance adds Rain dance to the discard pile', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = parched(campaign);
  const at = offeredOn(dealt).indexOf(RAIN_DANCE);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idsOf(after.discardPile)).toEqual([...idsOf(dealt.discardPile), RAIN_DANCE]);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  expect(await standing(page, 'deal')).toBe(false);

  expect(problems).toEqual([]);
});
