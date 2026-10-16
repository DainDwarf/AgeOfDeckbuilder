import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import { LOOK } from '../src/ui/look';
import {
  budget,
  chronicleOf,
  cityTileOf,
  consoleKey,
  endedTurn,
  endTurn,
  enter,
  hungry,
  neutralCampaign,
  openSaved,
  readings,
  rested,
  settledOn,
  textOf,
  watch,
} from './chronicle-screen';

/** The name a city's badge stands under on the map, by its city's tile key, and its number's. */
function badgeOn(key: string): { pill: string; number: string } {
  const pill = `population-${key}`;
  return { pill, number: `${pill}-number` };
}

test('the player’s city wears a badge in the civilization’s colour reading its population, and once the turn whose strike takes one has ended it reads the population the turn left', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const struck = hungry();
  const ended = endedTurn(struck);
  const badge = badgeOn(tileKey(cityTileOf(struck)));
  expect(ended.population).toBeLessThan(struck.population);

  await openSaved(page, struck);
  const before = await readings(page, [badge.pill, badge.number]);
  expect(before(badge.pill).fill).toBe(LOOK.civilization);
  expect(before(badge.number).text).toBe(String(struck.population));

  await endTurn(page);
  await rested(page);
  expect(await chronicleOf(page)).toEqual(ended);
  expect(await textOf(page, badge.number)).toBe(String(ended.population));

  expect(problems).toEqual([]);
});

test('the neutral’s city tile, uncharted, wears no badge, nor drawn under fog with the uncharted veil off; with the fog veil off too it wears one in the neutral’s colour reading the neutral’s population', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = neutralCampaign();
  const opened = settledOn(1, [], campaign);
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const key = tileKey(neutral.city);
  const theirs = badgeOn(key);
  const ours = badgeOn(tileKey(cityTileOf(opened)));
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

  const fogged = await readings(page, [`tile-${key}`, `fog-${key}`, theirs.pill]);
  expect(fogged(`tile-${key}`).standing).toBe(true);
  expect(fogged(`fog-${key}`).standing).toBe(true);
  expect(fogged(theirs.pill).standing).toBe(false);

  await consoleKey(page);
  await enter(page, 'fog');
  await consoleKey(page);
  await rested(page);

  const unveiled = await readings(page, [theirs.pill, theirs.number]);
  expect(unveiled(theirs.pill).fill).toBe(LOOK.neutral);
  expect(unveiled(theirs.number).text).toBe(String(neutral.population));

  expect(problems).toEqual([]);
});
