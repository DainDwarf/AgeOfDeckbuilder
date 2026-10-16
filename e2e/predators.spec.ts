import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { featurePlaced, featureRemoved, gained, terraformed } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { featureKind, terrainKind } from '../src/rules/map-kinds';
import { answerCost, answerOf } from '../src/rules/schedule';
import { charted, inSight } from '../src/rules/sight';
import { followed, type Stage, unchanged, walked } from '../src/rules/stages';
import { type Chronicle, holderOf, holds } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import {
  barReadingOn,
  budget,
  chronicleOf,
  playerCityTile,
  dealtAloneOn,
  eventDealRead,
  firstDealtAlone,
  firstSeed,
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
const PREDATORS = 'predators';

/** The answer of the event that removes the herds near the city. */
const ABANDON_A_HERD = 'abandon-a-herd';

/** The answer of the event that pays military. */
const DEFEND_THE_HERDS = 'defend-the-herds';

/** The feature the spec places. */
const DEER = 'deer';

/** The features the wolves take. */
const HERDS = ['deer', 'cattle'];

/** The place the deal standing on the chronicle offers the answer in. */
function placeOf(chronicle: Chronicle, answer: string): number {
  return offeredOn(chronicle).indexOf(answer);
}

/**
 * The first seed's turn 1 from the campaign, settled bare, whose first deal is the event alone,
 * stopped on the deal; then what defending the herds costs gained.
 */
function defensible(campaign: Campaign): Chronicle {
  const dealt = firstDealtAlone(PREDATORS, campaign);
  const defence = answerOf(CATALOGUE, PREDATORS, DEFEND_THE_HERDS);
  let paid = unchanged(dealt);
  for (const { resource, amount } of answerCost(CATALOGUE, dealt, defence)) {
    paid = followed(paid, (left) => gained(left, { [resource]: amount }));
  }
  return paid.chronicle;
}

/**
 * `firstDealtAlone`'s chronicle with every deer and cattle removed, and deer placed, its terrain made
 * where needed, on the first free land tile in the city's sight outside its border: the one herd.
 */
function strayed(campaign: Campaign): Chronicle {
  const dealt = firstDealtAlone(PREDATORS, campaign);
  const { terrain } = featureKind(CATALOGUE, DEER);
  let readied = unchanged(dealt);
  for (const { q, r, feature } of dealt.tiles) {
    if (feature === undefined || !HERDS.includes(feature)) continue;
    readied = followed(readied, (left) => featureRemoved(CATALOGUE, left, { q, r }));
  }
  const seen = inSight(CATALOGUE, dealt);
  const stray = dealt.tiles.find(
    (tile) =>
      seen.has(tileKey(tile)) &&
      holderOf(dealt, tile) === undefined &&
      tile.building === undefined &&
      !terrainKind(CATALOGUE, tile.terrain).water &&
      unitAt(dealt.units, tile) === undefined,
  );
  if (stray === undefined)
    throw new Error('no land tile stands in the city’s sight outside its border');
  const at = { q: stray.q, r: stray.r };
  if (stray.terrain !== terrain) {
    readied = followed(readied, (left) => terraformed(CATALOGUE, left, at, terrain));
  }
  readied = followed(readied, (left) => featurePlaced(CATALOGUE, left, at, DEER));
  return charted(CATALOGUE, readied.chronicle);
}

/** The tiles the stages retiled, in the order they retiled them. */
function retiledBy(stages: readonly Stage[]): TileCoords[] {
  return [...walked(stages)].flatMap((stage) =>
    stage.kind === 'change' && stage.name === 'retiled' ? [stage.tile] : [],
  );
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
      const dealt = dealtAloneOn(seed, PREDATORS, campaign, (settled) => {
        const city = playerCityTile(settled);
        const ground =
          tileAt(settled.tiles, city)?.terrain === terrain
            ? unchanged(settled)
            : terraformed(CATALOGUE, settled, city, terrain);
        return followed(ground, (left) => featurePlaced(CATALOGUE, left, city, DEER)).chronicle;
      });
      if (dealt === undefined) return undefined;
      const city = playerCityTile(dealt);
      const at = placeOf(dealt, ABANDON_A_HERD);
      const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
      return tileAt(after.tiles, city)?.feature === undefined ? { dealt, city } : undefined;
    },
  );
}

test('abandoning a herd with none inside the border takes the one standing outside it: the deer gone from the tile the landing names, and the deal closed', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = strayed(campaign);
  const at = placeOf(dealt, ABANDON_A_HERD);
  const stages = apply(CATALOGUE, dealt, { type: 'take', at });
  const after = outcome(stages);
  const [taken, ...others] = retiledBy(stages);
  expect(others).toEqual([]);
  expect(holds(dealt, taken)).toBe(false);
  expect([tileAt(dealt.tiles, taken)?.feature, tileAt(after.tiles, taken)?.feature]).toEqual([
    DEER,
    undefined,
  ]);
  const mark = `feature-${tileKey(taken)}`;

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  expect(await standing(page, mark)).toBe(true);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', mark]);
  expect([left('deal').standing, left(mark).standing]).toEqual([false, false]);

  expect(problems).toEqual([]);
});

test('defending the herds pays the military the rules price', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const dealt = defensible(campaign);
  const defend = placeOf(dealt, DEFEND_THE_HERDS);
  const [price] = answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, PREDATORS, DEFEND_THE_HERDS));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: defend }));
  const stock = `reading-${price.resource}-value`;
  expect(after.resources[price.resource]).toBe(dealt.resources[price.resource] - price.amount);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, PREDATORS, [stock]);
  expect(shown(stock).text).toBe(barReadingOn(dealt, price.resource));

  await take(page, defend);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', stock]);
  expect([left('deal').standing, left(stock).text]).toEqual([
    false,
    barReadingOn(after, price.resource),
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
  await restedOnDeal(page);
  expect(await standing(page, mark)).toBe(true);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', mark]);
  expect([left('deal').standing, left(mark).standing]).toEqual([false, false]);

  expect(problems).toEqual([]);
});
