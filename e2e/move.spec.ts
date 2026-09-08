import { expect, test } from '@playwright/test';
import { tileKey } from '../src/rules/map';
import { UNIT_STATS } from '../src/rules/units';
import {
  chronicleOf,
  click,
  dragOut,
  dragUnit,
  endTurn,
  open,
  playedOut,
  ringedTile,
  stepRun,
  watch,
} from './chronicle-screen';

test('a unit crosses two tiles in two steps, and the turn refreshes what it spent', async ({
  page,
}) => {
  const problems = watch(page);
  const run = stepRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  expect(entered.units[0].movePoints).toBe(UNIT_STATS.PH_Worker.move);

  // The first step: the unit is clicked, then the tile the map lights under it.
  await click(page, `tile-${tileKey(entered.city)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(entered.city));
  await click(page, `tile-${tileKey(run.first)}`);
  await playedOut(page);
  await expect
    .poll(async () => tileKey((await chronicleOf(page)).units[0].tile))
    .toBe(tileKey(run.first));

  const stepped = await chronicleOf(page);
  expect(stepped.units[0].movePoints).toBe(UNIT_STATS.PH_Worker.move - 1);
  // The unit is selected again where it landed, so one more click is the next step.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.first));

  // The second step: the unit is dragged onto the tile it lands on.
  await dragUnit(page, run.first, run.second);

  const twice = await chronicleOf(page);
  expect(tileKey(twice.units[0].tile)).toBe(tileKey(run.second));
  expect(twice.units[0].movePoints).toBe(UNIT_STATS.PH_Worker.move - 2);

  await endTurn(page);

  const ticked = await chronicleOf(page);
  expect(ticked.units[0].movePoints).toBe(UNIT_STATS.PH_Worker.move);
  expect(problems).toEqual([]);
});
