import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { RESOURCES } from '../src/rules/resources';
import { answerOf } from '../src/rules/schedule';
import {
  barReadingOn,
  budget,
  chronicleOf,
  eventDealRead,
  firstDealtAlone,
  offeredOn,
  openSaved,
  readings,
  restedOnDeal,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const TRAVELLERS = 'travellers';

/**
 * On the first seed's turn 1 from the won campaign, settled bare, whose first deal is the event
 * alone, stopped on the deal: the deal read on screen, the answer taken, and the stock it gains read
 * higher by what the rules read.
 */
async function takenAndGained(page: Page, answer: string): Promise<void> {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = firstDealtAlone(TRAVELLERS, campaign);
  const gift = answerOf(CATALOGUE, TRAVELLERS, answer).reads(CATALOGUE, dealt);
  const resource = RESOURCES.find((named) => gift[named] !== undefined);
  if (resource === undefined) throw new Error(`${answer} reads no resource gained`);
  const at = offeredOn(dealt).indexOf(answer);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const stock = `reading-${resource}-value`;
  expect(after.resources[resource]).toBe(dealt.resources[resource] + gift[resource]);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, TRAVELLERS, [stock]);
  expect(shown(stock).text).toBe(barReadingOn(dealt, resource));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([false, barReadingOn(after, resource)]);

  expect(problems).toEqual([]);
}

test('the travellers deal their answers, and trading with them gains the money the rules read', async ({
  page,
}) => {
  await takenAndGained(page, 'trade-with-them');
});

test('sharing stories with the travellers gains the culture the rules read', async ({ page }) => {
  await takenAndGained(page, 'share-stories');
});
