import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { terraformed } from '../src/rules/cards';
import { ageOf, unitKind } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { enemyEntering } from '../src/rules/enemies';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { charted, inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { standsOn, type Unit, unitAt } from '../src/rules/units';
import {
  budget,
  campKind,
  chronicleOf,
  cityTileOf,
  click,
  dragTiles,
  firstSeed,
  litTiles,
  marksIn,
  openSaved,
  playersOf,
  ringedTile,
  settledOn,
  standing,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The unit kind that attacks over a range. */
const ARCHER = 'archer';

/** The tile two steps off one, straight on through the tile beside it. */
function beyond(from: TileCoords, beside: TileCoords): TileCoords {
  return { q: 2 * beside.q - from.q, r: 2 * beside.r - from.r };
}

/**
 * The first seed's turn 1 with an archer of the player's on the city's tile, a tile beside it made
 * hills, and an enemy of a camp's, on the raider script, two steps off on each of two tiles: one
 * straight on behind the hills, charted and seen by nothing, the other in sight.
 */
function overTheHills(): { chronicle: Chronicle; archer: Unit; seen: Unit; hidden: Unit } {
  return firstSeed('stands an enemy in sight two tiles from its city', (seed) => {
    const settled = settledOn(seed);
    const city = cityTileOf(settled);
    const armed = unitEntered(settled, { type: ARCHER, faction: 'player', tile: city });
    const [archer] = playersOf(armed);
    const kind = campKind(armed);
    const stats = unitKind(CATALOGUE, kind);
    const { raider } = ageOf(CATALOGUE, armed.age).camp.scripts;
    const enemyOn = (chronicle: Chronicle, tile: TileCoords): Chronicle | undefined =>
      standsOn(CATALOGUE, stats, false, tileAt(chronicle.tiles, tile)) &&
      unitAt(chronicle.units, tile) === undefined
        ? unitEntered(chronicle, enemyEntering(kind, raider, tile))
        : undefined;

    for (const ridge of neighbours(city)) {
      const behind = beyond(city, ridge);
      if (!armed.snapshots.some((snapshot) => tileKey(snapshot) === tileKey(behind))) continue;
      const raised = charted(CATALOGUE, terraformed(CATALOGUE, armed, ridge, 'hills').chronicle);
      const walled = enemyOn(raised, behind);
      if (walled === undefined) continue;
      for (const beside of neighbours(city)) {
        const open = beyond(city, beside);
        const chronicle = enemyOn(walled, open);
        if (chronicle === undefined) continue;
        const seen = inSight(CATALOGUE, chronicle);
        if (seen.has(tileKey(behind)) || !seen.has(tileKey(open))) continue;
        const hidden = unitAt(chronicle.units, behind);
        const target = unitAt(chronicle.units, open);
        if (hidden === undefined || target === undefined) continue;
        return { chronicle, archer, seen: target, hidden };
      }
    }
    return undefined;
  });
}

test('an archer dragged onto an enemy two tiles off in sight attacks it, and an enemy behind the hills is neither drawn nor glowed nor attacked', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, archer, seen, hidden } = overTheHills();
  const attacked = outcome(
    apply(CATALOGUE, chronicle, { type: 'attack', unit: archer.id, tile: seen.tile }),
  );
  const inView = inSight(CATALOGUE, chronicle);
  const drawnUnits =
    chronicle.units.filter((unit) => inView.has(tileKey(unit.tile))).length +
    chronicle.snapshots.filter(
      (snapshot) => !inView.has(tileKey(snapshot)) && snapshot.unit !== undefined,
    ).length;

  await openSaved(page, chronicle);

  // The enemy behind the hills stands on a tile in fog, last seen empty: the map draws no mark for it.
  expect(await standing(page, `fog-${tileKey(hidden.tile)}`)).toBe(true);
  expect(await marksIn(page, 'units')).toBe(drawnUnits);

  // The archer selected glows the enemy in sight, and not the one behind the hills.
  await click(page, `tile-${tileKey(archer.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(archer.tile));
  const lit = await litTiles(page);
  expect(lit).toContain(tileKey(seen.tile));
  expect(lit).not.toContain(tileKey(hidden.tile));

  // A drag onto the tile behind the hills commands nothing.
  await dragTiles(page, archer.tile, hidden.tile);
  expect(await chronicleOf(page)).toEqual(chronicle);

  // The drag onto the enemy in sight attacks it over the tile between.
  await dragTiles(page, archer.tile, seen.tile);
  await expect
    .poll(async () => unitAt((await chronicleOf(page)).units, seen.tile)?.stats.health)
    .toBe(seen.stats.health - archer.stats.damage);
  expect(await chronicleOf(page)).toEqual(attacked);

  expect(problems).toEqual([]);
});
