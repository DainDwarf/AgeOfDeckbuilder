import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { movementCost, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  dragUnit,
  endTurn,
  idsOf,
  open,
  playedOut,
  playersOf,
  ringedTile,
  stepRun,
  watch,
} from './chronicle-screen';

/** What entering a tile of this chronicle costs; the run steps onto tiles a unit enters at all. */
function costOf(chronicle: Chronicle, coord: TileCoords): number {
  const cost = movementCost(STAND_IN, tileAt(chronicle.tiles, coord));
  if (cost === undefined) throw new Error(`nothing crosses onto ${tileKey(coord)}`);
  return cost;
}

test('a unit crosses two tiles in two steps, and the turn refreshes what it spent', async ({
  page,
}) => {
  const problems = watch(page);
  const run = stepRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, idsOf(opened.hand).indexOf('PH_Worker'));
  await expect.poll(async () => playersOf(await chronicleOf(page)).length).toBe(1);

  const entered = await chronicleOf(page);
  expect(playersOf(entered)[0].movePoints).toBe(STAND_IN.units.PH_Worker.move);

  // The first step: the unit is clicked, then the tile the map lights under it.
  await click(page, `tile-${tileKey(cityTileOf(entered))}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(cityTileOf(entered)));
  await click(page, `tile-${tileKey(run.first)}`);
  await playedOut(page);
  await expect
    .poll(async () => tileKey(playersOf(await chronicleOf(page))[0].tile))
    .toBe(tileKey(run.first));

  const stepped = await chronicleOf(page);
  expect(playersOf(stepped)[0].movePoints).toBe(
    STAND_IN.units.PH_Worker.move - costOf(entered, run.first),
  );
  // The unit is selected again where it landed, so one more click is the next step.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.first));

  // The second step: the unit is dragged onto the tile it lands on.
  await dragUnit(page, run.first, run.second);

  const twice = await chronicleOf(page);
  expect(tileKey(playersOf(twice)[0].tile)).toBe(tileKey(run.second));
  expect(playersOf(twice)[0].movePoints).toBe(
    STAND_IN.units.PH_Worker.move - costOf(entered, run.first) - costOf(entered, run.second),
  );

  await endTurn(page);

  const ticked = await chronicleOf(page);
  expect(playersOf(ticked)[0].movePoints).toBe(STAND_IN.units.PH_Worker.move);
  expect(problems).toEqual([]);
});
