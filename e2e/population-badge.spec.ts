import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { reckoned } from '../src/rules/chronicle';
import { claimable, cultureThreshold, growthThreshold } from '../src/rules/city';
import { tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { CITY_BAR_STOCKS, type CityBarStock } from '../src/ui/city-bar';
import { LOOK } from '../src/ui/look';
import {
  budget,
  chronicleOf,
  claimedAt,
  consoleKey,
  endedTurn,
  endTurn,
  enter,
  firstSeed,
  hungry,
  neutralCampaign,
  openSaved,
  playerCityTile,
  readings,
  rested,
  settledOn,
  textOf,
  watch,
} from './chronicle-screen';

/**
 * The names a city's badge stands under on the map, by its city's tile key, its number's, and the
 * names of the player's city's bars there.
 */
function badgeOn(key: string): {
  pill: string;
  number: string;
  bars: Record<CityBarStock, string>;
} {
  const pill = `population-${key}`;
  const bars = { food: `city-bar-food-${key}`, culture: `city-bar-culture-${key}` };
  return { pill, number: `${pill}-number`, bars };
}

/** The threshold the player's city's stock stands against, as `docs/CHRONICLE-SCREEN.md` names it. */
function standsAgainst(chronicle: Chronicle, stock: CityBarStock): number {
  switch (stock) {
    case 'food':
      return growthThreshold(chronicle, 'player');
    case 'culture':
      return cultureThreshold(chronicle, 'player');
  }
}

/** What ending the turn would add to the player's city's stock, or take from it below nothing. */
function turnOn(chronicle: Chronicle, stock: CityBarStock): number {
  const read = reckoned(CATALOGUE, chronicle);
  if (read === undefined) throw new Error(`turn ${chronicle.turn} reads no end of turn`);
  return read.stocks[stock];
}

test('the player’s city wears a bar of each stock, filled in the stock’s colour by the share of its threshold the stock holds, and paler past it by what ending the turn would add', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = neutralCampaign();
  const filling = (chronicle: Chronicle, stock: CityBarStock): boolean => {
    if (reckoned(CATALOGUE, chronicle) === undefined) return false;
    const held = chronicle.resources[stock];
    const turn = turnOn(chronicle, stock);
    return held > 0 && turn > 0 && held + turn <= standsAgainst(chronicle, stock);
  };
  // On thresholds alike, a bar read against the other's threshold reads the same.
  const apart = (chronicle: Chronicle): boolean =>
    standsAgainst(chronicle, 'food') !== standsAgainst(chronicle, 'culture');
  const chronicle = firstSeed(
    'opens a turn adding to every stock a bar reads, short of thresholds apart, once a tile is claimed',
    (seed) => {
      let turn = settledOn(seed, [], campaign);
      for (let ended = 0; ended < 4 && turn.ending === undefined; ended++) {
        const [tile] = claimable(CATALOGUE, turn, 'player');
        const claimed = tile === undefined ? undefined : claimedAt(turn, tile);
        const fits =
          claimed !== undefined &&
          apart(claimed) &&
          CITY_BAR_STOCKS.every((stock) => filling(claimed, stock));
        if (fits) return claimed;
        turn = endedTurn(turn);
      }
      return undefined;
    },
  );
  const { bars } = badgeOn(tileKey(playerCityTile(chronicle)));

  await openSaved(page, chronicle, campaign);
  const read = await readings(page, Object.values(bars));
  for (const stock of CITY_BAR_STOCKS) {
    const threshold = standsAgainst(chronicle, stock);
    const colour = LOOK.reading[stock];
    expect(read(bars[stock]).bar).toEqual({
      filled: {
        share: expect.closeTo(chronicle.resources[stock] / threshold, 6),
        colour,
        strength: 1,
      },
      past: {
        share: expect.closeTo(turnOn(chronicle, stock) / threshold, 6),
        colour,
        strength: LOOK.addedByTurn,
      },
    });
  }

  expect(problems).toEqual([]);
});

test('the player’s city wears a badge in the civilization’s colour reading its population, its food bar standing at the stock alone while the turn would take food, and once the turn whose strike takes one has ended it reads the population the turn left', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const struck = hungry();
  const ended = endedTurn(struck);
  const badge = badgeOn(tileKey(playerCityTile(struck)));
  expect(ended.population).toBeLessThan(struck.population);
  expect(turnOn(struck, 'food')).toBeLessThan(0);

  await openSaved(page, struck);
  const before = await readings(page, [badge.pill, badge.number, badge.bars.food]);
  expect(before(badge.pill).fill).toBe(LOOK.civilization);
  expect(before(badge.number).text).toBe(String(struck.population));
  const { filled, past } = before(badge.bars.food).bar;
  expect(filled.share).toBeCloseTo(struck.resources.food / standsAgainst(struck, 'food'), 6);
  expect(past.share).toBe(0);

  await endTurn(page);
  await rested(page);
  expect(await chronicleOf(page)).toEqual(ended);
  expect(await textOf(page, badge.number)).toBe(String(ended.population));

  expect(problems).toEqual([]);
});

test('the neutral’s city tile, uncharted, wears no badge, nor drawn in fog with the uncharted veil off; with the fog veil off too it wears one in the neutral’s colour reading the neutral’s population, and no bar', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = neutralCampaign();
  const opened = settledOn(1, [], campaign);
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const key = tileKey(neutral.city);
  const theirs = badgeOn(key);
  const ours = badgeOn(tileKey(playerCityTile(opened)));
  expect(inSight(CATALOGUE, opened).has(key)).toBe(false);
  expect(opened.snapshots.some((snapshot) => tileKey(snapshot) === key)).toBe(false);

  await openSaved(page, opened, campaign);
  const veiled = await readings(page, [ours.pill, theirs.pill]);
  expect(veiled(ours.pill).standing).toBe(true);
  expect(veiled(theirs.pill).standing).toBe(false);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);
  await rested(page);

  const fogged = await readings(page, [`tile-${key}`, theirs.pill]);
  expect(fogged(`tile-${key}`).standing).toBe(true);
  expect(fogged(`tile-${key}`).tint).toBe(LOOK.fog);
  expect(fogged(theirs.pill).standing).toBe(false);

  await consoleKey(page);
  await enter(page, 'fog');
  await consoleKey(page);
  await rested(page);

  const unbarred = Object.values(theirs.bars);
  const unveiled = await readings(page, [theirs.pill, theirs.number, ...unbarred]);
  expect(unveiled(theirs.pill).fill).toBe(LOOK.neutral);
  expect(unveiled(theirs.number).text).toBe(String(neutral.population));
  for (const bar of unbarred) expect(unveiled(bar).standing).toBe(false);

  expect(problems).toEqual([]);
});
