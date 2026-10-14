import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { featurePlaced, featureRemoved, gained, terraformed } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { featureKind } from '../src/rules/map-kinds';
import { answerCost, answerOf, answerRefusal, offered } from '../src/rules/schedule';
import { followed, unchanged } from '../src/rules/stages';
import { type Chronicle, holds, playable } from '../src/rules/state';
import { eventLore } from '../src/ui/lore';
import { refused } from '../src/ui/refusal-lines';
import { eventName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  cityTileOf,
  click,
  dealtAlone,
  firstSeed,
  openSaved,
  readings,
  refusalLines,
  rested,
  ringed,
  settledOn,
  standing,
  stoppedOnDeal,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const PREDATORS = 'predators';

/** The answer of the event that removes the herds inside the border. */
const ABANDON_A_HERD = 'abandon-a-herd';

/** The answer of the event that pays military. */
const DEFEND_THE_HERDS = 'defend-the-herds';

/** The feature the spec places on the city's tile. */
const DEER = 'deer';

/** Whether nothing refuses the answer of the event on the chronicle. */
function answerable(chronicle: Chronicle, answer: string): boolean {
  return playable(answerRefusal(CATALOGUE, chronicle, PREDATORS, answer));
}

/** What the deal standing on the chronicle offers, in the order dealt. */
function offeredOn(chronicle: Chronicle): readonly string[] {
  const [deal] = chronicle.deals;
  if (deal === undefined) throw new Error(`turn ${chronicle.turn} deals nothing`);
  return offered(CATALOGUE, deal);
}

/** The place the deal standing on the chronicle offers the answer in. */
function placeOf(chronicle: Chronicle, answer: string): number {
  return offeredOn(chronicle).indexOf(answer);
}

/**
 * The first seed's turn 1 from the campaign, settled bare, whose first deal is the event alone,
 * stopped on the deal; then every feature inside its border removed, and what defending the herds
 * costs gained.
 */
function unherded(campaign: Campaign): Chronicle {
  const dealt = firstSeed('deals the predators alone first', (seed) => {
    const stopped = stoppedOnDeal(settledOn(seed, [], campaign));
    return dealtAlone(stopped, PREDATORS) ? stopped : undefined;
  });
  let cleared = unchanged(dealt);
  for (const { q, r, feature } of dealt.tiles) {
    if (feature === undefined || !holds(dealt, { q, r })) continue;
    cleared = followed(cleared, (left) => featureRemoved(CATALOGUE, left, { q, r }));
  }
  const defence = answerOf(CATALOGUE, PREDATORS, DEFEND_THE_HERDS);
  for (const { resource, amount } of answerCost(CATALOGUE, cleared.chronicle, defence)) {
    cleared = followed(cleared, (left) => gained(left, { [resource]: amount }));
  }
  return cleared.chronicle;
}

/**
 * The first seed's turn 1 from the campaign, settled bare, deer placed on its city's tile, whose
 * first deal is the event alone and abandoning a herd takes those deer: that chronicle stopped on
 * the deal, and the city's tile.
 */
function herdedAtHome(campaign: Campaign): { dealt: Chronicle; city: TileCoords } {
  const { terrain } = featureKind(CATALOGUE, DEER);
  return firstSeed(
    'deals the predators alone first, taking the deer on the city’s tile',
    (seed) => {
      const settled = settledOn(seed, [], campaign);
      const city = cityTileOf(settled);
      const ground =
        tileAt(settled.tiles, city)?.terrain === terrain
          ? unchanged(settled)
          : terraformed(CATALOGUE, settled, city, terrain);
      const herded = followed(ground, (left) => featurePlaced(CATALOGUE, left, city, DEER));
      const dealt = stoppedOnDeal(herded.chronicle);
      if (!dealtAlone(dealt, PREDATORS)) return undefined;
      const at = placeOf(dealt, ABANDON_A_HERD);
      const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
      return tileAt(after.tiles, city)?.feature === undefined ? { dealt, city } : undefined;
    },
  );
}

test('abandoning a herd is refused while no herd stands inside the border and says why over the card, and defending the herds pays the military the rules price', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = unherded(campaign);
  const answers = offeredOn(dealt);
  const abandon = placeOf(dealt, ABANDON_A_HERD);
  const defend = placeOf(dealt, DEFEND_THE_HERDS);
  expect([answerable(dealt, ABANDON_A_HERD), answerable(dealt, DEFEND_THE_HERDS)]).toEqual([
    false,
    true,
  ]);
  const said = refused(
    answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, PREDATORS, ABANDON_A_HERD)),
    answerRefusal(CATALOGUE, dealt, PREDATORS, ABANDON_A_HERD),
  );
  const [price] = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, PREDATORS, DEFEND_THE_HERDS));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: defend }));
  const stock = `reading-${price.resource}-value`;
  expect(after.resources[price.resource]).toBe(dealt.resources[price.resource] - price.amount);

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  const faces = answers.map((_, place) => `deal-card-${place}`);
  const shown = await readings(page, ['deal-title', 'deal-lore', stock, ...faces]);
  expect(shown('deal-title').text).toBe(eventName(PREDATORS));
  expect(shown('deal-lore').text).toBe(eventLore(PREDATORS));
  expect(faces.map((face) => shown(face).card)).toEqual(answers);
  expect(shown(stock).text).toBe(String(dealt.resources[price.resource]));

  await click(page, `deal-card-${abandon}`);
  await expect.poll(() => ringed(page, `deal-card-${abandon}`)).toBe(true);
  await click(page, `deal-card-${abandon}`);

  await expect.poll(() => refusalLines(page)).toEqual(said);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  await take(page, defend);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([
    false,
    String(after.resources[price.resource]),
  ]);

  expect(problems).toEqual([]);
});

test('abandoning a herd removes the deer standing on the city’s tile', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { dealt, city } = herdedAtHome(campaign);
  const at = placeOf(dealt, ABANDON_A_HERD);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const mark = `feature-${tileKey(city)}`;

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  expect(await standing(page, mark)).toBe(true);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', mark]);
  expect([left('deal').standing, left(mark).standing]).toEqual([false, false]);

  expect(problems).toEqual([]);
});
