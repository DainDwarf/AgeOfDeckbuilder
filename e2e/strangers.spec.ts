import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { answerOf } from '../src/rules/schedule';
import { idle } from '../src/rules/state';
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

test('the strangers deal their answers, and taking them in brings idle population and adds Misunderstandings to the discard pile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = firstDealtAlone(STRANGERS, campaign);
  const brought = answerOf(CATALOGUE, STRANGERS, TAKE_THEM_IN).reads(CATALOGUE, dealt).population;
  const at = offeredOn(dealt).indexOf(TAKE_THEM_IN);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idle(after)).toBe(idle(dealt) + brought);
  expect(idsOf(after.discardPile)).toContain(MISUNDERSTANDINGS);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, STRANGERS, ['reading-idle-value']);
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
