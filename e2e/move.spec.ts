import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { movementCost, neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  cityTileOf,
  click,
  dragUnit,
  firstSeed,
  openSaved,
  playedOut,
  playersOf,
  ringedTile,
  settledOn,
  watch,
} from './chronicle-screen';

/** What entering a tile of this chronicle costs; the search steps onto tiles a unit enters at all. */
function costOf(chronicle: Chronicle, coord: TileCoords): number {
  const cost = movementCost(CATALOGUE, tileAt(chronicle.tiles, coord));
  if (cost === undefined) throw new Error(`nothing crosses onto ${tileKey(coord)}`);
  return cost;
}

/**
 * The first seed's turn 1 with the first worker entered on the city's tile, and the two tiles that
 * worker crosses to, one step at a time.
 */
function stepped(): { chronicle: Chronicle; first: TileCoords; second: TileCoords } {
  return firstSeed('crosses its first worker two tiles in two steps', (seed) => {
    const chronicle = settledOn(seed, ['first-worker']);
    const [worker] = playersOf(chronicle);
    const city = cityTileOf(chronicle);
    for (const first of neighbours(city)) {
      const once = outcome(
        apply(CATALOGUE, chronicle, { type: 'move', unit: worker.id, tile: first }),
      );
      if (once === chronicle) continue;
      for (const second of neighbours(first)) {
        if (tileKey(second) === tileKey(city)) continue;
        const again = { type: 'move', unit: worker.id, tile: second } as const;
        if (outcome(apply(CATALOGUE, once, again)) !== once) return { chronicle, first, second };
      }
    }
    return undefined;
  });
}

test('a unit crosses two tiles in two steps', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const { chronicle, first, second } = stepped();
  const [worker] = playersOf(chronicle);
  const city = cityTileOf(chronicle);
  const once = outcome(apply(CATALOGUE, chronicle, { type: 'move', unit: worker.id, tile: first }));
  const twice = outcome(apply(CATALOGUE, once, { type: 'move', unit: worker.id, tile: second }));

  await openSaved(page, chronicle);

  // The first step: the unit is clicked, then the tile the map lights under it.
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  await click(page, `tile-${tileKey(first)}`);
  await playedOut(page);
  await expect
    .poll(async () => tileKey(playersOf(await chronicleOf(page))[0].tile))
    .toBe(tileKey(first));

  expect(await chronicleOf(page)).toEqual(once);
  expect(playersOf(once)[0].movePoints).toBe(worker.stats.move - costOf(chronicle, first));
  // The unit is selected again where it landed, so one more click is the next step.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(first));

  // The second step: the unit is dragged onto the tile it lands on.
  await dragUnit(page, first, second);

  expect(await chronicleOf(page)).toEqual(twice);
  expect(playersOf(twice)[0].movePoints).toBe(
    worker.stats.move - costOf(chronicle, first) - costOf(chronicle, second),
  );
  expect(problems).toEqual([]);
});
