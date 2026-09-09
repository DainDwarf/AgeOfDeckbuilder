import { expect, test } from '@playwright/test';
import { MAP_COMPOSITION, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  consoleKey,
  endTurn,
  enter,
  marksIn,
  open,
  standing,
  watch,
} from './chronicle-screen';

/** The seed this spec opens on: its map is dealt every camp the composition asks for. */
const SEED = 1;

/** The tiles the generator put a camp on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === 'PH_Camp')
    .map(({ q, r }) => ({ q, r }));
}

test('the map draws the camps it was dealt, and the fifth turn’s enemy stands on one', async ({
  page,
}) => {
  const problems = watch(page);
  // The four ends of turn it takes to reach the fifth.
  test.setTimeout(budget(4));

  await open(page, SEED, 'PH_Deck');

  // Every camp stands beyond the city's sight at the founding: uncharted, and drawn not at all.
  const opened = await chronicleOf(page);
  const camps = campsOf(opened);
  expect(camps).toHaveLength(MAP_COMPOSITION.camps);
  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(false);
  }

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  for (const camp of camps) {
    expect(await standing(page, `building-${tileKey(camp)}`)).toBe(true);
  }
  // The whole disc drawn, the buildings on it are the camps and the city's own wall.
  expect(await marksIn(page, 'buildings')).toBe(camps.length + 1);

  for (let turn = 0; turn < 4; turn++) await endTurn(page);

  const fifth = await chronicleOf(page);
  const enemy = fifth.units.find((unit) => unit.faction === 'enemy');

  expect(fifth.turn).toBe(5);
  expect(enemy).toBeDefined();
  expect(camps.map(tileKey)).toContain(tileKey(enemy?.tile ?? fifth.city));
  expect(problems).toEqual([]);
});
