import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import {
  anythingByHand,
  apply,
  byHand,
  declaresWar,
  outcome,
  type Step,
} from '../src/rules/chronicle';
import { distance, neighbours, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { pathTo, type Unit, unitAt } from '../src/rules/units';
import { inMovePoints } from '../src/ui/face';
import { darkeningOf, LOOK, multiplied } from '../src/ui/look';
import { CANOE } from '../src/ui/marks';
import {
  campaignWith,
  chronicleOf,
  click,
  embarkedOnRaft,
  endedTurn,
  firstSeed,
  litFor,
  marksIn,
  openSaved,
  paintedOn,
  pathDrawn,
  playedOut,
  playerCityTile,
  pointAt,
  RAFT,
  rafted,
  rested,
  ringedAndLit,
  ringedTile,
  settledOn,
  unitMarksOn,
  WARRIOR,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([RAFT]);

/**
 * What `made` makes of the first seed's turn 1 on a campaign that learned Raft, on the free tile
 * nearest the city that it makes something of, no further south than one row below the city, clear
 * of the line over the hand, each tile beside it it reads cleared the same way.
 */
function nearTheCity<T>(
  complaint: string,
  made: (
    opened: Chronicle,
    water: TileCoords,
    clear: (coord: TileCoords) => boolean,
  ) => T | undefined,
): T {
  return firstSeed(complaint, (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    const city = playerCityTile(opened);
    const clear = (coord: TileCoords): boolean =>
      coord.r <= city.r + 1 && unitAt(opened.units, coord) === undefined;
    const nearest = [...opened.tiles].sort((a, b) => distance(a, city) - distance(b, city));
    for (const { q, r } of nearest) {
      const water = { q, r };
      if (!clear(water)) continue;
      const found = made(opened, water, clear);
      if (found !== undefined) return found;
    }
    return undefined;
  });
}

/** The step a unit takes by hand onto the tile, and nothing where it takes none. */
function stepOnto(chronicle: Chronicle, unit: Unit, tile: TileCoords): Step | undefined {
  return byHand(CATALOGUE, chronicle, unit).steps.find(
    (step) => tileKey(step.tile) === tileKey(tile),
  );
}

test('a warrior beside a raft lights the raft’s tile, and a click there embarks it: its action spent, drawn on the raft’s tile in the canoe, and no mark of the raft’s left', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, unit, water } = nearTheCity(
    `opens turn 1 with a ${WARRIOR} beside a ${RAFT} near its city`,
    (opened, water, clear) => {
      for (const bank of neighbours(water).filter(clear)) {
        const manned = rafted(opened, water, bank, WARRIOR);
        if (manned === undefined) continue;
        const found = stepOnto(manned.chronicle, manned.unit, water);
        if (found !== undefined && found.landing === undefined) {
          return { ...manned, water };
        }
      }
      return undefined;
    },
  );
  const embarked = outcome(
    apply(CATALOGUE, chronicle, { type: 'move', unit: unit.id, tile: water }),
  );
  const { lit } = litFor(chronicle, unit.tile);
  expect(lit).toContain(tileKey(water));
  expect(unitAt(embarked.units, water)).toMatchObject({ id: unit.id, embarked: true, action: 0 });

  await openSaved(page, chronicle, CAMPAIGN);
  const shown = await marksIn(page, 'units');
  await click(page, `tile-${tileKey(unit.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(unit.tile));
  expect((await ringedAndLit(page)).lit).toEqual(lit);

  await click(page, `tile-${tileKey(water)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(embarked);
  const [mark] = await unitMarksOn(page, [water]);
  expect(mark?.paintedAs).toBe(paintedOn(embarked, water));
  expect(mark?.canoe).toBe(CANOE);
  expect(await marksIn(page, 'units')).toBe(shown - 1);
  expect(problems).toEqual([]);
});

test('a warrior on a raft, a turn on, lights the tiles ashore beside it, and a click on one disembarks it there, the raft left on its tile in its halo', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, warrior, water, ashore } = nearTheCity(
    `opens turn 2 on a ${WARRIOR} embarked on a ${RAFT} near its city, beside a tile ashore`,
    (opened, water, clear) => {
      for (const bank of neighbours(water).filter(clear)) {
        const embarked = embarkedOnRaft(opened, water, bank, WARRIOR);
        if (embarked === undefined) continue;
        const ticked = endedTurn(embarked);
        const standing = unitAt(ticked.units, water);
        if (ticked.ending !== undefined || standing?.stats.type !== WARRIOR) continue;
        const off = byHand(CATALOGUE, ticked, standing).steps.find(
          (step) => step.landing === undefined && clear(step.tile),
        );
        if (off !== undefined) {
          return { chronicle: ticked, warrior: standing, water, ashore: off.tile };
        }
      }
      return undefined;
    },
  );
  const landed = outcome(
    apply(CATALOGUE, chronicle, { type: 'move', unit: warrior.id, tile: ashore }),
  );
  const raft = unitAt(landed.units, water);
  if (raft === undefined) throw new Error(`no ${RAFT} stays on ${tileKey(water)}`);
  expect(raft.stats.type).toBe(RAFT);
  expect(unitAt(landed.units, ashore)).toMatchObject({ id: warrior.id, embarked: false });
  const { lit } = litFor(chronicle, water);
  expect(lit).toContain(tileKey(ashore));
  const dim = darkeningOf(LOOK.unitDim);
  const halo = anythingByHand(CATALOGUE, landed, raft, false)
    ? LOOK.civilization
    : multiplied(LOOK.civilization, dim);

  await openSaved(page, chronicle, CAMPAIGN);
  const shown = await marksIn(page, 'units');
  await click(page, `tile-${tileKey(water)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(water));
  expect((await ringedAndLit(page)).lit).toEqual(lit);

  await click(page, `tile-${tileKey(ashore)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(landed);
  const [onShore, onWater] = await unitMarksOn(page, [ashore, water]);
  expect(onShore?.paintedAs).toBe(paintedOn(landed, ashore));
  expect(onShore?.canoe).toBeUndefined();
  expect(onWater?.paintedAs).toBe(paintedOn(landed, water));
  expect(onWater?.halo).toBe(halo);
  expect(await marksIn(page, 'units')).toBe(shown + 1);
  expect(problems).toEqual([]);
});

test('a warrior a walk away from a raft reads its path to the raft’s tile with no move point left, and a click there walks it to the landing the rules name and embarks it', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, unit, water, step } = nearTheCity(
    `opens turn 1 with a ${WARRIOR} a walk away from a ${RAFT} near its city`,
    (opened, water, clear) => {
      const away = opened.tiles.filter((tile) => distance(tile, water) === 2 && clear(tile));
      for (const { q, r } of away) {
        const manned = rafted(opened, water, { q, r }, WARRIOR);
        if (manned === undefined) continue;
        const found = stepOnto(manned.chronicle, manned.unit, water);
        const move = { type: 'move', unit: manned.unit.id, tile: water } as const;
        if (found?.landing === undefined || declaresWar(CATALOGUE, manned.chronicle, move)) {
          continue;
        }
        return { ...manned, water, step: found };
      }
      return undefined;
    },
  );
  const { landing } = step;
  if (landing === undefined) throw new Error(`the ${WARRIOR} walks to no landing`);
  const walk = pathTo(CATALOGUE, chronicle, unit, landing.tile);
  if (walk === undefined) throw new Error(`the ${WARRIOR}'s walk reaches no landing`);
  const stages = apply(CATALOGUE, chronicle, { type: 'move', unit: unit.id, tile: water });
  const embarked = outcome(stages);
  expect(stages[0]).toMatchObject({ name: 'move', from: unit.tile, to: landing.tile });
  expect(unitAt(embarked.units, water)).toMatchObject({ id: unit.id, embarked: true, action: 0 });

  await openSaved(page, chronicle, CAMPAIGN);
  await click(page, `tile-${tileKey(unit.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(unit.tile));
  await rested(page);
  await pointAt(page, water);
  await expect
    .poll(async () => (await pathDrawn(page))?.tiles)
    .toEqual([...walk, water].map(tileKey));
  expect((await pathDrawn(page))?.left.text).toBe(inMovePoints(0));

  await click(page, `tile-${tileKey(water)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(embarked);
  expect(problems).toEqual([]);
});
