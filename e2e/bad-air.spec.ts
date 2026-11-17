import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { apply, outcome } from '../src/rules/chronicle';
import { arrived } from '../src/rules/city';
import { answerOf } from '../src/rules/schedule';
import { type Chronicle, idle } from '../src/rules/state';
import { glyphFileOf } from '../src/ui/cast';
import { answerShown } from '../src/ui/event-text';
import { namedCardFace } from '../src/ui/face';
import {
  barReadingOn,
  cardOnFace,
  chronicleOf,
  dealtAloneOn,
  eventDealRead,
  firstSeed,
  namedIn,
  nameOnScreen,
  offeredOn,
  openSaved,
  readIn,
  readings,
  restedOnDeal,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const BAD_AIR = 'bad-air';

/** The answer of the event that kills population. */
const BURY_THE_DEAD = 'bury-the-dead';

/** The answer of the event whose text names the card it adds. */
const LIVE_WITH_IT = 'live-with-it';

/**
 * The first seed's turn 1 from the campaign, settled bare, one population arrived idle, whose first
 * deal is the event alone with as many idle as burying the dead kills: that chronicle stopped on the
 * deal, and how many it kills.
 */
function sickened(campaign: Campaign): { dealt: Chronicle; killed: number } {
  const { reads } = answerOf(CATALOGUE, BAD_AIR, BURY_THE_DEAD);
  return firstSeed('deals the sickness alone first, the idle enough to bury', (seed) => {
    const dealt = dealtAloneOn(
      seed,
      BAD_AIR,
      campaign,
      (settled) => arrived(settled, 'player').chronicle,
    );
    if (dealt === undefined) return undefined;
    const { population } = reads(CATALOGUE, dealt);
    return idle(dealt) >= population ? { dealt, killed: population } : undefined;
  });
}

test('the sickness deals its answers, and burying the dead kills the idle population', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const { dealt, killed } = sickened(campaign);
  const at = offeredOn(dealt).indexOf(BURY_THE_DEAD);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  expect(idle(after)).toBe(idle(dealt) - killed);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, BAD_AIR, ['reading-idle-value']);
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

test('burying the dead reads its number with population’s glyph right after it, and the card Live with it names reads population’s glyph in its text', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const { dealt, killed } = sickened(campaign);
  const [burying, living] = [BURY_THE_DEAD, LIVE_WITH_IT].map(
    (answer) => `deal-card-${offeredOn(dealt).indexOf(answer)}`,
  );
  const { text, reading } = answerShown(CATALOGUE, dealt, BAD_AIR, LIVE_WITH_IT);
  const names = namedIn(text);
  const naming = names.findIndex((reference) => reference.kind === 'card');
  const named = names[naming].id;
  const population = glyphFileOf('population');

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const { answerRead } = (await readings(page, [burying]))(burying);
  const number = answerRead.indexOf(`${killed}`);
  expect(answerRead.slice(number, number + 2)).toEqual([`${killed}`, population]);

  const name = await nameOnScreen(page, living, naming);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);
  const { rulesRead } = (await readings(page, ['small-card-0']))('small-card-0');
  expect(rulesRead).toEqual(readIn(namedCardFace(CATALOGUE, named, reading).rules));
  expect(rulesRead).toContain(population);

  expect(problems).toEqual([]);
});
