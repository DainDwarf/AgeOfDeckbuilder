import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { apply, outcome } from '../src/rules/chronicle';
import { answerOf, offered } from '../src/rules/schedule';
import { type Chronicle, idle } from '../src/rules/state';
import { eventLore } from '../src/ui/lore';
import { eventName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  dealtAlone,
  firstSeed,
  idsOf,
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
const STRANGERS = 'strangers';

/** The answer of the event that brings population and the challenge. */
const TAKE_THEM_IN = 'take-them-in';

/** The challenge taking them in adds to the discard pile. */
const MISUNDERSTANDINGS = 'misunderstandings';

/**
 * The first seed's turn 1 from the campaign, settled bare, whose first deal is the event alone: that
 * chronicle stopped on the deal, and how many population taking them in brings.
 */
function visited(campaign: Campaign): { dealt: Chronicle; brought: number } {
  const { reads } = answerOf(CATALOGUE, STRANGERS, TAKE_THEM_IN);
  return firstSeed('deals the strangers alone first', (seed) => {
    const dealt = stoppedOnDeal(settledOn(seed, [], campaign));
    if (!dealtAlone(dealt, STRANGERS)) return undefined;
    return { dealt, brought: reads(CATALOGUE, dealt).population };
  });
}

test('the strangers deal their answers, and taking them in brings idle population and adds Misunderstandings to the discard pile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { dealt, brought } = visited(campaign);
  const [deal] = dealt.deals;
  if (deal === undefined) throw new Error(`turn ${dealt.turn} deals nothing`);
  const answers = offered(CATALOGUE, deal);
  const at = answers.indexOf(TAKE_THEM_IN);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idle(after)).toBe(idle(dealt) + brought);
  expect(idsOf(after.discardPile)).toContain(MISUNDERSTANDINGS);

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  const faces = answers.map((_, place) => `deal-card-${place}`);
  const shown = await readings(page, ['deal-title', 'deal-lore', 'reading-idle-value', ...faces]);
  expect(shown('deal-title').text).toBe(eventName(STRANGERS));
  expect(shown('deal-lore').text).toBe(eventLore(STRANGERS));
  expect(faces.map((face) => shown(face).card)).toEqual(answers);
  expect(shown('reading-idle-value').text).toBe(String(idle(dealt)));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', 'reading-idle-value']);
  expect([left('deal').standing, left('reading-idle-value').text]).toEqual([
    false,
    String(idle(after)),
  ]);

  expect(problems).toEqual([]);
});
