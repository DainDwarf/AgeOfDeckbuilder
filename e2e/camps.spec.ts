import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle } from '../src/rules/chronicle';
import { MAP_COMPOSITION, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  consoleKey,
  endTurn,
  enter,
  firstSeed,
  marksIn,
  open,
  standing,
  watch,
} from './chronicle-screen';

/** The tiles the generator put a camp on, in the order the map lists them. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === 'PH_Camp')
    .map(({ q, r }) => ({ q, r }));
}

/** The first seed whose map is dealt every camp the composition asks it for. */
function campRun(): { seed: number } {
  return firstSeed('deals a map every camp it is worth', (seed) =>
    campsOf(beginChronicle(seed, DECKS.PH_Deck)).length === MAP_COMPOSITION.camps
      ? { seed }
      : undefined,
  );
}

test('the map draws the camps it was dealt, and the fifth turn’s enemy stands on one', async ({
  page,
}) => {
  const problems = watch(page);
  const run = campRun();
  // The four ends of turn it takes to reach the fifth.
  test.setTimeout(budget(4));

  await open(page, run.seed, 'PH_Deck');

  // Every camp stands beyond the city's sight at the founding: uncharted, and drawn not at all.
  const opened = await chronicleOf(page);
  const camps = campsOf(opened);
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
