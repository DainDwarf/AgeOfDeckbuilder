import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
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
  watch,
} from './chronicle-screen';

/** A chronicle whose turn `turn` can enter a worker and step it onto `first` and then `second`. */
type StepRun = {
  readonly seed: number;
  readonly turn: number;
  readonly first: TileCoords;
  readonly second: TileCoords;
};

/** The first seed with a turn in its first eight that opens on such a run. */
function stepRun(): StepRun {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const steps = steppedThisTurn(chronicle);
      if (steps !== undefined) return { seed, turn, ...steps };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on a worker and two steps');
}

/**
 * The two tiles this hand's worker crosses to, one step at a time, and nothing when it cannot. The
 * worker is the only unit on the map, so the chronicle has dealt it the first number of all: one.
 */
function steppedThisTurn(
  chronicle: Chronicle,
): { first: TileCoords; second: TileCoords } | undefined {
  const enter = chronicle.hand.indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(chronicle, { type: 'play', index: enter }));
  if (entered.units.length !== 1) return undefined;

  for (const first of neighbours(entered.city)) {
    const stepped = outcome(apply(entered, { type: 'move', unit: 1, tile: first }));
    if (stepped === entered) continue;
    for (const second of neighbours(first)) {
      if (tileKey(second) === tileKey(entered.city)) continue;
      if (outcome(apply(stepped, { type: 'move', unit: 1, tile: second })) !== stepped) {
        return { first, second };
      }
    }
  }
  return undefined;
}

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
