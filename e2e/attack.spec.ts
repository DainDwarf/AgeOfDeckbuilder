import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { entered } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { type Unit, unitAt } from '../src/rules/units';
import { darkeningOf, LOOK, multiplied } from '../src/ui/look';
import {
  budget,
  chronicleOf,
  dragTiles,
  enemyBesideCity,
  firstSeed,
  openSaved,
  playerCityTile,
  playersOf,
  ringedTile,
  settledOn,
  unitMarksOn,
  WARRIOR,
  watch,
} from './chronicle-screen';

/**
 * The first seed's turn 1 with a warrior of the player's entered on the city's tile and one enemy of
 * the camp's kind entered with the raider script on a tile beside it, and the two units.
 */
function warriorBesideAnEnemy(): { chronicle: Chronicle; warrior: Unit; enemy: Unit } {
  return firstSeed('stands an enemy beside its city', (seed) => {
    const settled = settledOn(seed);
    const city = playerCityTile(settled);
    const guarded = entered(CATALOGUE, settled, { type: WARRIOR, faction: 'player', tile: city });
    const beset = enemyBesideCity(guarded.chronicle);
    if (beset === undefined) return undefined;
    const [warrior] = playersOf(beset.chronicle);
    return { ...beset, warrior };
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
  const { chronicle, warrior, enemy } = warriorBesideAnEnemy();
  const attacked = outcome(
    apply(CATALOGUE, chronicle, { type: 'attack', unit: warrior.id, tile: enemy.tile }),
  );

  await openSaved(page, chronicle);

  // The attack: the warrior is dragged onto the enemy, the target on the tile making it an attack.
  await dragTiles(page, warrior.tile, enemy.tile);
  await expect
    .poll(async () => (await unitOn(page, enemy.tile))?.stats.health)
    .toBe(enemy.stats.health - warrior.stats.damage);

  expect(await chronicleOf(page)).toEqual(attacked);
  const [struck] = playersOf(attacked);
  expect(struck.tile).toEqual(warrior.tile);
  expect(struck.action).toBe(0);
  expect(struck.movePoints).toBe(0);
  // Nothing left to spend: the warrior stands dimmed, and the enemy it struck never is.
  const dim = darkeningOf(LOOK.mapDim);
  await expect
    .poll(() => unitMarksOn(page, [warrior.tile, enemy.tile]))
    .toEqual([
      { halo: multiplied(LOOK.civilization, dim), painting: dim },
      { halo: LOOK.enemy, painting: undefined },
    ]);
  // The warrior is selected again where it stands, so one more press is its next command.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(warrior.tile));

  // Its action is spent, so the enemy's tile is no target of the warrior's and the drag changes nothing.
  await dragTiles(page, warrior.tile, enemy.tile);

  expect(await chronicleOf(page)).toEqual(attacked);
  expect(problems).toEqual([]);
});
