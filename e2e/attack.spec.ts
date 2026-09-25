import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { entered, unitKind } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { charted } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { standsOn, type Unit, unitAt } from '../src/rules/units';
import {
  budget,
  chronicleOf,
  cityTileOf,
  dragTiles,
  firstSeed,
  openSaved,
  playersOf,
  ringedTile,
  settledOn,
  standing,
  watch,
} from './chronicle-screen';

/**
 * The first seed's turn 1 with a warrior of the player's entered on the city's tile and one enemy of
 * the camp's unit kind entered with the raider script on a tile beside it, and that enemy's tile.
 */
function besieged(): { chronicle: Chronicle; warrior: Unit; enemy: TileCoords } {
  return firstSeed('stands an enemy beside its city', (seed) => {
    const settled = settledOn(NOMADIC, seed);
    const city = cityTileOf(settled);
    const guarded = entered(NOMADIC, settled, { type: 'warrior', faction: 'player', tile: city });
    const kind = unitKind(NOMADIC, NOMADIC.camp.unit);
    const enemy = neighbours(city).find(
      (tile) =>
        standsOn(NOMADIC, kind, tileAt(guarded.chronicle.tiles, tile)) &&
        unitAt(guarded.chronicle.units, tile) === undefined,
    );
    if (enemy === undefined) return undefined;
    const beset = entered(NOMADIC, guarded.chronicle, {
      type: NOMADIC.camp.unit,
      faction: 'enemy',
      tile: enemy,
      script: NOMADIC.camp.scripts.raider,
    });
    const chronicle = charted(NOMADIC, beset.chronicle);
    const [warrior] = playersOf(chronicle);
    return { chronicle, warrior, enemy };
  });
}

/** The unit standing on a tile of the chronicle the screen holds, and nothing where none stands. */
async function unitOn(page: Page, tile: TileCoords): Promise<Unit | undefined> {
  return unitAt((await chronicleOf(page)).units, tile);
}

test('a warrior dragged onto an enemy attacks it, and its spent action refuses a second attack', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, warrior, enemy } = besieged();
  const target = unitAt(chronicle.units, enemy);
  if (target === undefined) throw new Error(`no enemy stands on ${tileKey(enemy)}`);
  const attacked = outcome(
    apply(NOMADIC, chronicle, { type: 'attack', unit: warrior.id, tile: enemy }),
  );

  await openSaved(page, chronicle);

  // The attack: the warrior is dragged onto the enemy, the target on the tile making it an attack.
  await dragTiles(page, warrior.tile, enemy);
  await expect
    .poll(async () => (await unitOn(page, enemy))?.stats.health)
    .toBe(target.stats.health - warrior.stats.damage);

  expect(await chronicleOf(page)).toEqual(attacked);
  const [struck] = playersOf(attacked);
  expect(struck.tile).toEqual(warrior.tile);
  expect(struck.action).toBe(0);
  expect(struck.movePoints).toBe(0);
  // Nothing left to spend: the warrior stands dimmed, and the enemy it struck never is.
  await expect.poll(() => standing(page, `unit-dim-${tileKey(warrior.tile)}`)).toBe(true);
  expect(await standing(page, `unit-dim-${tileKey(enemy)}`)).toBe(false);
  // The warrior is selected again where it stands, so one more press is its next command.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(warrior.tile));

  // Its action is spent, so the enemy's tile is no target of the warrior's and the drag changes nothing.
  await dragTiles(page, warrior.tile, enemy);

  expect(await chronicleOf(page)).toEqual(attacked);
  expect(problems).toEqual([]);
});
