import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  counted,
  dragOut,
  dragUnit,
  endTurn,
  firstSeed,
  marksIn,
  open,
  riverRuns,
  standing,
  watch,
} from './chronicle-screen';

/** One tile of each of the three states, on the chronicle a worker's step out and back leaves. */
type Run = {
  readonly seed: number;
  readonly turn: number;
  /** The tile the worker steps onto and off again; the city holds it, so it stays in sight. */
  readonly out: TileCoords;
  readonly fog: TileCoords;
  readonly uncharted: TileCoords;
};

/**
 * The first seed with a turn in its first eight whose worker, stepping one tile off the city and
 * back again, leaves the map showing all three states at once: the tile it stepped onto in sight,
 * a tile it saw from there and no longer does in fog, and one it never saw uncharted.
 */
function fogRun(): Run {
  return firstSeed(
    'opens a turn on a worker whose step out and back leaves a tile in fog',
    (seed) => {
      let chronicle = beginChronicle(seed, DECKS.PH_Deck);
      for (let turn = 1; turn <= 8; turn++) {
        const stepped = steppedThisTurn(chronicle);
        if (stepped !== undefined) return { seed, turn, ...stepped };
        chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
      }
      return undefined;
    },
  );
}

/** What this hand's worker leaves behind it when it steps one tile off the city and back again. */
function steppedThisTurn(chronicle: Chronicle): Omit<Run, 'seed' | 'turn'> | undefined {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  const entered = outcome(apply(chronicle, { type: 'play', index: at, aim: 'none' }));
  if (entered.units.length !== 1) return undefined;

  for (const out of neighbours(entered.city)) {
    const stepped = outcome(apply(entered, { type: 'move', unit: 1, tile: out }));
    if (stepped === entered) continue;
    const back = outcome(apply(stepped, { type: 'move', unit: 1, tile: entered.city }));
    if (back === stepped) continue;

    const seen = inSight(back);
    const charted = new Set(back.snapshots.map(tileKey));
    const fog = back.snapshots.find((snapshot) => !seen.has(tileKey(snapshot)));
    const uncharted = back.tiles.find((tile) => !charted.has(tileKey(tile)));
    if (fog === undefined || uncharted === undefined) continue;
    return { out, fog: { q: fog.q, r: fog.r }, uncharted: { q: uncharted.q, r: uncharted.r } };
  }
  return undefined;
}

/** The turn a worker's one step charts a river the map was drawing nothing of. */
type Charting = {
  readonly seed: number;
  readonly turn: number;
  /** The tile the worker steps onto: a river runs along it, and no river was charted before. */
  readonly out: TileCoords;
};

/**
 * The first seed with a turn in its first eight whose worker, stepping one tile off the city, charts
 * a tile a river runs along, on a map whose rivers all lie between uncharted tiles until then.
 */
function riverCharting(): Charting {
  return firstSeed('opens a turn on a worker whose step charts a river', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const charted = chartedThisTurn(chronicle);
      if (charted !== undefined) return { seed, turn, out: charted };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    return undefined;
  });
}

/** Where this hand's worker steps to chart a river, on a chronicle whose map draws none yet. */
function chartedThisTurn(chronicle: Chronicle): TileCoords | undefined {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  if (chronicle.rivers.length === 0 || riverRuns(chronicle) > 0) return undefined;
  const entered = outcome(apply(chronicle, { type: 'play', index: at, aim: 'none' }));
  if (entered.units.length !== 1) return undefined;

  for (const out of neighbours(entered.city)) {
    const stepped = outcome(apply(entered, { type: 'move', unit: 1, tile: out }));
    if (stepped !== entered && riverRuns(stepped) > 0) return out;
  }
  return undefined;
}

test('the map draws a tile in sight live, a tile in fog under its scrim, and an uncharted tile not at all', async ({
  page,
}) => {
  const problems = watch(page);
  const run = fogRun();
  // The run's ends of turn, and the two steps the worker takes on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // Before the worker steps out, the tile it will see from there is uncharted like any other.
  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(false);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.out);
  await dragUnit(page, run.out, entered.city);

  expect(await standing(page, `tile-${tileKey(run.out)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.out)}`)).toBe(false);

  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.fog)}`)).toBe(true);

  expect(await standing(page, `tile-${tileKey(run.uncharted)}`)).toBe(false);
  expect(await standing(page, `fog-${tileKey(run.uncharted)}`)).toBe(false);

  // The map draws a face for every tile it has ever seen, and one scrim for each of them in fog.
  const stood = await chronicleOf(page);
  const seen = inSight(stood);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);
  expect(await marksIn(page, 'fog')).toBe(
    stood.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length,
  );

  expect(problems).toEqual([]);
});

test('the map draws no river between two uncharted tiles, and draws one along a tile just charted', async ({
  page,
}) => {
  const problems = watch(page);
  const run = riverCharting();
  // The run's ends of turn, and the step the worker takes on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // The map runs rivers, and every edge of them lies between two tiles nobody has charted yet.
  const opened = await chronicleOf(page);
  expect(opened.rivers.length).toBeGreaterThan(0);
  expect(riverRuns(opened)).toBe(0);
  expect(await counted(page, 'river')).toBe(0);

  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.out);

  const stepped = await chronicleOf(page);
  expect(riverRuns(stepped)).toBeGreaterThan(0);
  expect(await counted(page, 'river')).toBe(riverRuns(stepped));

  expect(problems).toEqual([]);
});
