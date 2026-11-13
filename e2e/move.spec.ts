import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { unitKind } from '../src/rules/catalogue';
import { anythingByHand, apply, byHand, outcome } from '../src/rules/chronicle';
import { movementCost, neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { type Unit, unitAt, unitOf } from '../src/rules/units';
import { darkeningOf, LOOK, multiplied } from '../src/ui/look';
import {
  budget,
  chronicleOf,
  click,
  dragUnit,
  firstSeed,
  freeFor,
  openSaved,
  playedOut,
  playerCityTile,
  playersOf,
  ringedTile,
  settledOn,
  unitEntered,
  unitMarksOn,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** What entering a tile of this chronicle costs; the search steps onto tiles a unit enters at all. */
function costOf(chronicle: Chronicle, coord: TileCoords): number {
  const cost = movementCost(CATALOGUE, tileAt(chronicle.tiles, coord), false);
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
    const city = playerCityTile(chronicle);
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

/**
 * The first landing the rules offer a unit that spends its last move points and leaves it, and each
 * unit numbered in `idle`, with nothing to do by hand, and the chronicle the step leaves; nothing
 * where no landing does.
 */
function spentOn(
  chronicle: Chronicle,
  unit: Unit,
  idle: readonly number[],
): { to: TileCoords; after: Chronicle } | undefined {
  for (const { tile, cost } of byHand(CATALOGUE, chronicle, unit).landings) {
    if (cost !== unit.movePoints) continue;
    const after = outcome(apply(CATALOGUE, chronicle, { type: 'move', unit: unit.id, tile }));
    const stuck = [unit.id, ...idle].every((id) => {
      const standing = unitOf(after.units, id);
      return standing !== undefined && !anythingByHand(CATALOGUE, after, standing, false);
    });
    if (stuck) return { to: tile, after };
  }
  return undefined;
}

/**
 * The first seed's turn 1 with the first worker on the city's tile and a warrior entered beside it,
 * the warrior's landing then the worker's, each step spending the unit's last move points and leaving
 * both with nothing to do by hand, and the chronicle both steps leave.
 */
function spentOut(): {
  chronicle: Chronicle;
  warrior: Unit;
  worker: Unit;
  warriorTo: TileCoords;
  workerTo: TileCoords;
  both: Chronicle;
} {
  return firstSeed('spends the last move points of a worker and of a warrior beside it', (seed) => {
    const settled = settledOn(seed, ['first-worker']);
    const [worker] = playersOf(settled);
    for (const beside of neighbours(playerCityTile(settled))) {
      if (!freeFor(settled, unitKind(CATALOGUE, WARRIOR), beside)) continue;
      const chronicle = unitEntered(settled, { type: WARRIOR, faction: 'player', tile: beside });
      const warrior = unitAt(chronicle.units, beside);
      if (warrior === undefined) continue;
      const warriorSpent = spentOn(chronicle, warrior, []);
      if (warriorSpent === undefined) continue;
      const workerSpent = spentOn(warriorSpent.after, worker, [warrior.id]);
      if (workerSpent === undefined) continue;
      return {
        chronicle,
        warrior,
        worker,
        warriorTo: warriorSpent.to,
        workerTo: workerSpent.to,
        both: workerSpent.after,
      };
    }
    return undefined;
  });
}

test('a warrior that spends its last move points with no unit in its attack’s reach stands dimmed, and a worker that spends its last holding its action stands lit', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const { chronicle, warrior, worker, warriorTo, workerTo, both } = spentOut();

  await openSaved(page, chronicle);

  await dragUnit(page, warrior.tile, warriorTo);
  await dragUnit(page, worker.tile, workerTo);

  expect(await chronicleOf(page)).toEqual(both);
  expect(unitOf(both.units, worker.id)?.action).toBeGreaterThan(0);
  const dim = darkeningOf(LOOK.unitDim);
  await expect
    .poll(() => unitMarksOn(page, [warriorTo, workerTo]))
    .toEqual([
      { halo: multiplied(LOOK.civilization, dim), painting: dim },
      { halo: LOOK.civilization, painting: undefined },
    ]);
  expect(problems).toEqual([]);
});

test('a unit crosses two tiles in two steps', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const { chronicle, first, second } = stepped();
  const [worker] = playersOf(chronicle);
  const city = playerCityTile(chronicle);
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
