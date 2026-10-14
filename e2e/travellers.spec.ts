import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { RESOURCES } from '../src/rules/resources';
import { answerOf } from '../src/rules/schedule';
import { eventLore } from '../src/ui/lore';
import { eventName } from '../src/ui/text';
import {
  barReadingOn,
  budget,
  chronicleOf,
  dealtAlone,
  firstSeed,
  offeredOn,
  openSaved,
  readings,
  rested,
  settledOn,
  standing,
  stoppedOnDeal,
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
  const dealt = firstSeed('deals the travellers alone first', (seed) => {
    const stopped = stoppedOnDeal(settledOn(seed, [], campaign));
    return dealtAlone(stopped, TRAVELLERS) ? stopped : undefined;
  });
  const gift = answerOf(CATALOGUE, TRAVELLERS, answer).reads(CATALOGUE, dealt);
  const resource = RESOURCES.find((named) => gift[named] !== undefined);
  if (resource === undefined) throw new Error(`${answer} reads no resource gained`);
  const answers = offeredOn(dealt);
  const at = answers.indexOf(answer);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const stock = `reading-${resource}-value`;
  expect(after.resources[resource]).toBe(dealt.resources[resource] + gift[resource]);

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  const faces = answers.map((_, place) => `deal-card-${place}`);
  const shown = await readings(page, ['deal-title', 'deal-lore', stock, ...faces]);
  expect(shown('deal-title').text).toBe(eventName(TRAVELLERS));
  expect(shown('deal-lore').text).toBe(eventLore(TRAVELLERS));
  expect(faces.map((face) => shown(face).card)).toEqual(answers);
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
