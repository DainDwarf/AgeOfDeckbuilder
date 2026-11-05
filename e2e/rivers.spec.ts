import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import {
  cornerKey,
  type River,
  tileAt,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
  water,
} from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  consoleKey,
  counted,
  endTurn,
  enter,
  firstSeed,
  openSaved,
  readings,
  riverRuns,
  settledOn,
  watch,
} from './chronicle-screen';

/** The first seed's turn 1, settled bare, whose opening charts a tile a river runs along. */
function riverCharted(): Chronicle {
  return firstSeed('charts a river from its opening', (seed) => {
    const chronicle = settledOn(seed);
    return riverRuns(chronicle) > 0 ? chronicle : undefined;
  });
}

/** Whether the tile straight ahead of the last edge a river runs is water on the chronicle. */
function intoWater(chronicle: Chronicle, river: River): boolean {
  const end = river[river.length - 1];
  const banks = new Set(tilesOfEdge(river[river.length - 2], end).map(tileKey));
  const ahead = tilesAtCorner(end).find((coord) => !banks.has(tileKey(coord)));
  return ahead !== undefined && water(CATALOGUE, tileAt(chronicle.tiles, ahead)?.terrain);
}

/** The first seed's turn 1, settled bare, one of whose rivers runs into the water. */
function riverMouthed(): Chronicle {
  return firstSeed('runs a river into the water', (seed) => {
    const chronicle = settledOn(seed);
    return chronicle.rivers.some((river) => intoWater(chronicle, river)) ? chronicle : undefined;
  });
}

test('the map draws a piece of river on every corner of the runs along the charted tiles, and an ended turn leaves them', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const opened = riverCharted();

  await openSaved(page, opened);
  expect(await counted(page, 'river')).toBe(riverRuns(opened));

  await endTurn(page);
  const ended = await chronicleOf(page);
  expect(await counted(page, 'river')).toBe(riverRuns(ended));

  expect(problems).toEqual([]);
});

test('with the uncharted veil off the map draws a piece of river on every corner of every river, and a mouth where one runs into the water', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = riverMouthed();

  await openSaved(page, opened);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  const read = await readings(page, ['river', 'river-mouth']);
  expect(read('river').count).toBe(new Set(opened.rivers.flat().map(cornerKey)).size);
  expect(read('river-mouth').count).toBe(
    opened.rivers.filter((river) => intoWater(opened, river)).length,
  );

  expect(problems).toEqual([]);
});
