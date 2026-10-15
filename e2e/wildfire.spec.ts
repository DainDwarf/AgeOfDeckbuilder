import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { gained } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { answerOf } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
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

/** The event the spec opens on: the Stone Age's wildfire. */
const WILDFIRE = 'stone-wildfire';

/** The answer of the event that takes food. */
const LET_THE_FIELDS_BURN = 'stone-let-the-fields-burn';

/** The answer of the event that adds its challenge. */
const BURN_THE_FOREST = 'burn-the-forest';

/** The challenge burning the forest adds to the discard pile. */
const EMBERS = 'embers';

/**
 * The first seed's turn 1 from the campaign, settled bare, whose first deal is the event alone,
 * stopped on the deal; then the food letting the fields burn takes gained.
 */
function smoked(campaign: Campaign): Chronicle {
  const dealt = firstDealtAlone(WILDFIRE, campaign);
  const { food } = answerOf(CATALOGUE, WILDFIRE, LET_THE_FIELDS_BURN).reads(CATALOGUE, dealt);
  return gained(dealt, { food }).chronicle;
}

test('the wildfire deals its answers, Let the fields burn reading the food the rules read, and taking it leaves the food stock the rules leave', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = smoked(campaign);
  const at = offeredOn(dealt).indexOf(LET_THE_FIELDS_BURN);
  const reads = answerOf(CATALOGUE, WILDFIRE, LET_THE_FIELDS_BURN).reads(CATALOGUE, dealt);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const stock = 'reading-food-value';
  expect(after.resources.food).toBe(dealt.resources.food - reads.food);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, WILDFIRE, [stock]);
  expect([shown(`deal-card-${at}`).rules, shown(stock).text]).toEqual([
    text(`answer-rules.${LET_THE_FIELDS_BURN}`, reads),
    barReadingOn(dealt, 'food'),
  ]);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([false, barReadingOn(after, 'food')]);

  expect(problems).toEqual([]);
});

test('burning the forest adds Embers to the discard pile', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = firstDealtAlone(WILDFIRE, campaign);
  const at = offeredOn(dealt).indexOf(BURN_THE_FOREST);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idsOf(after.discardPile)).toEqual([...idsOf(dealt.discardPile), EMBERS]);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  expect(await standing(page, 'deal')).toBe(false);

  expect(problems).toEqual([]);
});
