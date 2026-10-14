import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { captureLore } from '../src/ui/lore';
import { buildingName } from '../src/ui/text';
import {
  budget,
  campBeside,
  chronicleOf,
  consoleKey,
  enter,
  loreOf,
  marksIn,
  openSaved,
  restedOnDeal,
  settledOn,
  sitesOf,
  standing,
  stoppedTurn,
  titleOf,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** The tiles the camp's building stands on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  const { building } = ageOf(CATALOGUE, chronicle.age).camp;
  return chronicle.tiles.filter((tile) => tile.building === building).map(({ q, r }) => ({ q, r }));
}

test('the map draws the camps it was dealt once the uncharted veil is off', async ({ page }) => {
  const problems = watch(page);
  const opened = settledOn(1);
  const camps = campsOf(opened);
  expect(camps.length).toBeGreaterThan(0);

  await openSaved(page, opened);

  // Every camp stands beyond the city's sight at the opening: uncharted, and drawn not at all.
  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(false);
  }

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(true);
  }
  // The whole disc drawn, the buildings on it are the camps, the sites and the city's own.
  const sites = sitesOf(opened);
  expect(sites.length).toBeGreaterThan(0);
  expect(await marksIn(page, 'buildings')).toBe(camps.length + sites.length + 1);
  expect(problems).toEqual([]);
});

test('a warrior standing on a camp through the enemy phase captures it, and the capture’s window reads the camp’s name and lore', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, camp } = campBeside((tile) => ({ type: WARRIOR, faction: 'player', tile }));
  const captured = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));

  await openSaved(page, chronicle);
  await stoppedTurn(page);
  await restedOnDeal(page);

  expect(await chronicleOf(page)).toEqual(captured);
  expect(tileAt(captured.tiles, camp)?.building).toBeUndefined();
  const { building } = ageOf(CATALOGUE, captured.age).camp;
  expect(captured.deals[0]).toMatchObject({ of: 'capture', building });
  expect(await titleOf(page, 'deal')).toBe(buildingName(building));
  expect(await loreOf(page, 'deal')).toBe(captureLore(building));
  expect(problems).toEqual([]);
});
