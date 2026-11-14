import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { damageOf, entered, fullHealth } from '../src/rules/catalogue';
import { apply, broughtInRange, byHand, declaresWar, outcome } from '../src/rules/chronicle';
import { MOVE_POINT, sameTile, type TileCoords, tileKey } from '../src/rules/map';
import { unitDamaged } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { type Landing, pathTo, type Unit, unitAt } from '../src/rules/units';
import { darkeningOf, LOOK, multiplied } from '../src/ui/look';
import {
  type AimDrawn,
  aimDrawn,
  type BarShown,
  besideTiles,
  budget,
  campKind,
  chronicleOf,
  click,
  dragTiles,
  enemyBesideCity,
  enemyEnteredOn,
  firstSeed,
  freeGround,
  litFor,
  onScreen,
  openSaved,
  playerCityTile,
  playersOf,
  pointAt,
  rested,
  ringedTile,
  settledOn,
  unitMarksOn,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** The seed's turn 1 with a warrior of the player's entered on the city's tile. */
function guardedOn(seed: number): Chronicle {
  const settled = settledOn(seed);
  const city = playerCityTile(settled);
  return entered(CATALOGUE, settled, { type: WARRIOR, faction: 'player', tile: city }).chronicle;
}

/**
 * The first seed's turn 1 with a warrior of the player's entered on the city's tile and one enemy of
 * the camp's kind entered with the raider script on a tile beside it, and the two units.
 */
function warriorBesideAnEnemy(): { chronicle: Chronicle; warrior: Unit; enemy: Unit } {
  return firstSeed('stands an enemy beside its city', (seed) => {
    const beset = enemyBesideCity(guardedOn(seed));
    if (beset === undefined) return undefined;
    const [warrior] = playersOf(beset.chronicle);
    return { ...beset, warrior };
  });
}

/**
 * As `warriorBesideAnEnemy`, the enemy two tiles from the city where a step brings it in the warrior's
 * range and the attack declares no war; and the landing the attack comes from.
 */
function warriorAStepFromAnEnemy(): {
  chronicle: Chronicle;
  warrior: Unit;
  enemy: Unit;
  landing: Landing;
} {
  return firstSeed('stands an enemy a step out of the range of a warrior on its city', (seed) => {
    const guarded = guardedOn(seed);
    const [warrior] = playersOf(guarded);
    for (const tile of freeGround(guarded, campKind(guarded), 2)) {
      const beset = enemyEnteredOn(guarded, tile);
      if (beset === undefined) continue;
      const { chronicle, enemy } = beset;
      const stepped = broughtInRange(CATALOGUE, chronicle, warrior).find(({ target }) =>
        sameTile(target.tile, tile),
      );
      const attack = { type: 'attack', unit: warrior.id, tile } as const;
      if (stepped === undefined || declaresWar(CATALOGUE, chronicle, attack)) continue;
      return { chronicle, warrior, enemy, landing: stepped.landing };
    }
    return undefined;
  });
}

/** The glyph at a health bar's foot, as `docs/LOOK.md` names it: a heart, and a skull where the attack read would kill. */
const GLYPHS = { heart: 'material-design-icons/heart.svg', skull: 'game-icons/death-skull.svg' };

/**
 * The health bar a unit wears as the rules read it, with the attack of that damage read on it or
 * none: the health it holds and the health the attack would remove, the smaller of the damage and
 * the health held, as shares of its full health, and the skull at its foot where the attack would kill.
 */
function barOf(unit: Unit, damage: number | undefined): Record<keyof BarShown, unknown> {
  const full = fullHealth(CATALOGUE, unit.stats);
  const { health } = unit.stats;
  return {
    held: expect.closeTo(health / full, 6),
    removed: expect.closeTo(Math.min(damage ?? 0, health) / full, 6),
    glyph: damage !== undefined && damage >= health ? GLYPHS.skull : GLYPHS.heart,
  };
}

/**
 * The map reads the attack from one tile on the unit on the other, after the step's path where one is
 * named and with no path where none is: the arrow from the first to the second, its middle between
 * them, and the health bar the attacked unit wears with the attack read on it.
 */
function readsTheAttack(
  drawn: AimDrawn,
  from: string,
  to: string,
  bar: Record<keyof BarShown, unknown>,
  step?: { path: string[]; left: string },
): void {
  expect({ path: drawn.path, left: drawn.left }).toEqual(step ?? { path: [], left: undefined });
  const { attack } = drawn;
  expect(attack?.tiles).toEqual([from, to]);
  if (attack === undefined) return;
  expect(attack.bar).toEqual(bar);
  const [attacker, attacked] = attack.faces;
  const span = { x: attacked.x - attacker.x, y: attacked.y - attacker.y };
  expect(attack.arrow.angle).toBeCloseTo(Math.atan2(span.y, span.x), 6);
  const off = { x: attack.arrow.at.x - attacker.x, y: attack.arrow.at.y - attacker.y };
  const along = (off.x * span.x + off.y * span.y) / (span.x ** 2 + span.y ** 2);
  expect(along).toBeGreaterThan(0);
  expect(along).toBeLessThan(1);
}

/** The unit standing on a tile of the chronicle the screen holds, and nothing where none stands. */
async function unitOn(page: Page, tile: TileCoords): Promise<Unit | undefined> {
  return unitAt((await chronicleOf(page)).units, tile);
}

/** The attack the map reads, by its two tiles, after a drawn frame. */
async function attackRead(page: Page): Promise<string[] | undefined> {
  await rested(page);
  return (await aimDrawn(page)).attack?.tiles;
}

test('a warrior dragged onto an enemy attacks it, the enemy wearing its health bar at the health left it, and its spent action refuses a second attack', async ({
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
  // Nothing left to spend: the warrior stands dimmed, and the enemy it struck never is; the enemy
  // wears its health bar at the health the attack left it.
  const dim = darkeningOf(LOOK.unitDim);
  const hurt = unitAt(attacked.units, enemy.tile);
  if (hurt === undefined) throw new Error(`the attack kills the enemy on ${tileKey(enemy.tile)}`);
  await expect
    .poll(() => unitMarksOn(page, [warrior.tile, enemy.tile]))
    .toEqual([
      { halo: multiplied(LOOK.civilization, dim), painting: dim },
      { halo: LOOK.enemy, painting: undefined, bar: barOf(hurt, undefined) },
    ]);
  // The warrior is selected again where it stands, so one more press is its next command.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(warrior.tile));

  // Its action is spent, so the enemy's tile is no target of the warrior's and the drag changes nothing.
  await dragTiles(page, warrior.tile, enemy.tile);

  expect(await chronicleOf(page)).toEqual(attacked);
  expect(problems).toEqual([]);
});

test('a warrior selected beside an enemy marks it with the attack’s ring; the pointer on it reads the attack, a lit tile takes the path in its place and gives it back, the reading stays beside the tiles and goes on the warrior’s own tile, a drag over the enemy reads the same, and after the attack nothing is marked or read', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, warrior, enemy } = warriorBesideAnEnemy();
  const { landings } = byHand(CATALOGUE, chronicle, warrior);
  const [landing] = landings;
  if (landing === undefined) throw new Error('the warrior lights no tile');
  const [own, foe] = [warrior.tile, enemy.tile].map(tileKey);
  const bar = barOf(enemy, damageOf(CATALOGUE, chronicle.units, warrior));
  const resting: AimDrawn = {
    rings: [own],
    marked: [foe],
    lit: landings.map(({ tile }) => tileKey(tile)).sort(),
    hexagons: [],
    path: [],
    left: undefined,
    attack: undefined,
  };

  await openSaved(page, chronicle);

  await click(page, `tile-${own}`);
  await expect.poll(() => aimDrawn(page)).toEqual(resting);

  await pointAt(page, enemy.tile);
  await expect.poll(() => attackRead(page)).toEqual([own, foe]);
  const read = await aimDrawn(page);
  readsTheAttack(read, own, foe, bar);
  expect({ ...read, attack: undefined }).toEqual(resting);

  // The path takes the reading's place, and the enemy at its full health wears no bar with it gone.
  await pointAt(page, landing.tile);
  await expect
    .poll(async () => (await aimDrawn(page)).path)
    .toEqual(pathTo(CATALOGUE, chronicle, warrior, landing.tile)?.map(tileKey));
  expect((await aimDrawn(page)).attack).toBeUndefined();
  expect((await unitMarksOn(page, [enemy.tile]))[0]?.bar).toBeUndefined();

  await pointAt(page, enemy.tile);
  await expect.poll(() => attackRead(page)).toEqual([own, foe]);
  readsTheAttack(await aimDrawn(page), own, foe, bar);

  const off = await besideTiles(page);
  await page.mouse.move(off.x, off.y);
  expect(await attackRead(page)).toEqual([own, foe]);

  await pointAt(page, warrior.tile);
  await expect.poll(() => aimDrawn(page)).toEqual(resting);

  // Dragged from its own tile onto the enemy, and let go there: the attack.
  await page.mouse.down();
  const onto = await onScreen(page, `tile-${foe}`);
  await page.mouse.move(onto.x, onto.y, { steps: 5 });
  await expect.poll(() => attackRead(page)).toEqual([own, foe]);
  readsTheAttack(await aimDrawn(page), own, foe, bar);
  await page.mouse.up();

  const attacked = outcome(
    apply(CATALOGUE, chronicle, { type: 'attack', unit: warrior.id, tile: enemy.tile }),
  );
  await expect.poll(() => chronicleOf(page)).toEqual(attacked);
  await expect
    .poll(() => aimDrawn(page))
    .toEqual({ ...resting, marked: [], lit: [], path: [], attack: undefined });

  expect(problems).toEqual([]);
});

test('a warrior beside an enemy its attack would kill reads on the enemy’s health bar all the health it holds with a skull at its foot, and the reading gone, the bar stands at that health with its heart', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const beside = warriorBesideAnEnemy();
  const { warrior, enemy } = beside;
  const damage = damageOf(CATALOGUE, beside.chronicle.units, warrior);
  if (enemy.stats.health <= damage)
    throw new Error('the warrior kills the enemy at its full health');
  const chronicle = unitDamaged(
    beside.chronicle,
    enemy.tile,
    enemy.stats.health - damage,
  ).chronicle;
  const worn = unitAt(chronicle.units, enemy.tile);
  if (worn === undefined) throw new Error(`no enemy stands on ${tileKey(enemy.tile)}`);
  const [own, foe] = [warrior.tile, enemy.tile].map(tileKey);

  await openSaved(page, chronicle);

  await click(page, `tile-${own}`);
  await pointAt(page, enemy.tile);
  await expect.poll(() => attackRead(page)).toEqual([own, foe]);
  readsTheAttack(await aimDrawn(page), own, foe, barOf(worn, damage));

  await pointAt(page, warrior.tile);
  await expect.poll(() => attackRead(page)).toBeUndefined();
  expect((await unitMarksOn(page, [enemy.tile]))[0]?.bar).toEqual(barOf(worn, undefined));

  expect(problems).toEqual([]);
});

test('a warrior selected two tiles from an enemy a step brings in its range marks it; the pointer on it reads the path to the landing the rules name, the move points left there, and the attack from there; a click is the step and the attack, and the warrior stays selected where it attacked from', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, warrior, enemy, landing } = warriorAStepFromAnEnemy();
  const [own, foe, from] = [warrior.tile, enemy.tile, landing.tile].map(tileKey);
  const attack = { type: 'attack', unit: warrior.id, tile: enemy.tile } as const;
  const stepped = outcome(
    apply(CATALOGUE, chronicle, { type: 'move', unit: warrior.id, tile: landing.tile }),
  );
  const moved = unitAt(stepped.units, landing.tile);
  if (moved === undefined) throw new Error(`the step leaves no unit on ${from}`);
  const bar = barOf(enemy, damageOf(CATALOGUE, stepped.units, moved));
  const path = pathTo(CATALOGUE, chronicle, warrior, landing.tile)?.map(tileKey) ?? [];
  const left = String((warrior.movePoints - landing.cost) / MOVE_POINT);
  const resting: AimDrawn = {
    rings: [own],
    ...litFor(chronicle, warrior.tile),
    hexagons: [],
    path: [],
    left: undefined,
    attack: undefined,
  };
  expect(resting.marked).toContain(foe);

  await openSaved(page, chronicle);

  await click(page, `tile-${own}`);
  await expect.poll(() => aimDrawn(page)).toEqual(resting);

  await pointAt(page, enemy.tile);
  await expect.poll(() => attackRead(page)).toEqual([from, foe]);
  const read = await aimDrawn(page);
  readsTheAttack(read, from, foe, bar, { path, left });
  expect({ ...read, path: [], left: undefined, attack: undefined }).toEqual(resting);

  await click(page, `tile-${foe}`);

  const attacked = outcome(apply(CATALOGUE, chronicle, attack));
  await expect.poll(() => chronicleOf(page)).toEqual(attacked);
  await expect.poll(() => ringedTile(page)).toBe(from);

  expect(problems).toEqual([]);
});
