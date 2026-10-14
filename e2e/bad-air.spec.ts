import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { apply, outcome } from '../src/rules/chronicle';
import { arrived } from '../src/rules/city';
import { answerOf } from '../src/rules/schedule';
import { type Chronicle, idle } from '../src/rules/state';
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
const BAD_AIR = 'bad-air';

/** The answer of the event that kills population. */
const BURY_THE_DEAD = 'bury-the-dead';

/**
 * The first seed's turn 1 from the campaign, settled bare, one population arrived idle, whose first
 * deal is the event alone with as many idle as burying the dead kills: that chronicle stopped on the
 * deal, and how many it kills.
 */
function sickened(campaign: Campaign): { dealt: Chronicle; killed: number } {
  const { reads } = answerOf(CATALOGUE, BAD_AIR, BURY_THE_DEAD);
  return firstSeed('deals the sickness alone first, the idle enough to bury', (seed) => {
    const grown = arrived(settledOn(seed, [], campaign), 'player').chronicle;
    const dealt = stoppedOnDeal(grown);
    if (!dealtAlone(dealt, BAD_AIR)) return undefined;
    const { population } = reads(CATALOGUE, dealt);
    return idle(dealt) >= population ? { dealt, killed: population } : undefined;
  });
}

test('the sickness deals its answers, and burying the dead kills the idle population', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { dealt, killed } = sickened(campaign);
  const answers = offeredOn(dealt);
  const at = answers.indexOf(BURY_THE_DEAD);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idle(after)).toBe(idle(dealt) - killed);

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  const faces = answers.map((_, place) => `deal-card-${place}`);
  const shown = await readings(page, ['deal-title', 'deal-lore', 'reading-idle-value', ...faces]);
  expect(shown('deal-title').text).toBe(eventName(BAD_AIR));
  expect(shown('deal-lore').text).toBe(eventLore(BAD_AIR));
  expect(faces.map((face) => shown(face).card)).toEqual(answers);
  expect(shown('reading-idle-value').text).toBe(barReadingOn(dealt, 'idle'));

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', 'reading-idle-value']);
  expect([left('deal').standing, left('reading-idle-value').text]).toEqual([
    false,
    barReadingOn(after, 'idle'),
  ]);

  expect(problems).toEqual([]);
});
