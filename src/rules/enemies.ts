import {
  ageOf,
  type CampScript,
  type Catalogue,
  type Entering,
  entered,
  unitKind,
} from './catalogue';
import { CENTRE, distance, groundRunsTo, type Tile, type TileCoords, tileKey } from './map';
import { type MapContent, refuse } from './map-kinds';
import { nextRng } from './rng';
import { inOwnSight } from './sight';
import { change, followed, type Landed, landedAs, unchanged } from './stages';
import type { Chronicle } from './state';
import { canAttack, standsOn, type Unit, unitAt } from './units';

/**
 * Of the units handed in, every one a unit can attack from the tile it stands on, action aside: one
 * within its range that its own sight reaches, whatever else sees it.
 */
export function targetsInOwnSight(
  catalogue: MapContent,
  tiles: readonly Tile[],
  units: readonly Unit[],
  attacker: Unit,
): Unit[] {
  return units.filter(
    (other) =>
      canAttack(attacker, other, distance(other.tile, attacker.tile)) &&
      inOwnSight(catalogue, tiles, attacker, other.tile),
  );
}

/**
 * What a unit an enemy script attacks: of the units handed in, the one it can attack from where it
 * stands holding the least health, the first of equals, and nothing when it can attack none.
 */
export function leastHealth(
  catalogue: MapContent,
  tiles: readonly Tile[],
  units: readonly Unit[],
  attacker: Unit,
): Unit | undefined {
  let target: Unit | undefined;
  for (const other of targetsInOwnSight(catalogue, tiles, units, attacker)) {
    if (target === undefined || other.stats.health < target.stats.health) target = other;
  }
  return target;
}

/** The unit of the chronicle's age's camp, entering on the tile with the script the camp names for it. */
export function campUnit(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
  script: CampScript,
): Entering {
  const { camp } = ageOf(catalogue, chronicle.age);
  return { type: camp.unit, faction: 'enemy', tile, script: camp.scripts[script] };
}

/** The tiles the camp's unit stands on ashore that the ground runs to the tile from, never the city's. */
function groundTo(
  catalogue: Catalogue,
  chronicle: Chronicle,
  city: TileCoords,
  to: TileCoords,
): Tile[] {
  const reached = groundRunsTo(catalogue, chronicle.tiles, chronicle.rivers, to);
  const stats = unitKind(catalogue, ageOf(catalogue, chronicle.age).camp.unit);
  return chronicle.tiles.filter(
    (tile) =>
      standsOn(catalogue, stats, false, tile) &&
      reached.has(tileKey(tile)) &&
      tileKey(tile) !== tileKey(city),
  );
}

function raidGround(catalogue: Catalogue, chronicle: Chronicle): Tile[] {
  const city = chronicle.city ?? refuse(catalogue, 'a raid landed while the city stands nowhere');
  return groundTo(catalogue, chronicle, city, city);
}

/**
 * That many of the camp's unit entering around the tile with the script named, each on the nearest
 * free tile of the raid's ground; where none is free, the ones left enter nowhere. A count of none or
 * fewer draws nothing and is a `runtime-error`.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entry: TileCoords,
  enemies: number,
  script: CampScript,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  return enteredOn(catalogue, chronicle, raidGround(catalogue, chronicle), entry, enemies, script);
}

/**
 * One guard of the camp's entering around the camp, on the nearest free tile of the ground that runs
 * to the camp, and nowhere where none is free.
 */
export function guardEntered(catalogue: Catalogue, chronicle: Chronicle, camp: TileCoords): Landed {
  const city = chronicle.city ?? refuse(catalogue, 'a guard entered while the city stands nowhere');
  const ground = groundTo(catalogue, chronicle, city, camp);
  return enteredOn(catalogue, chronicle, ground, camp, 1, 'guard');
}

/**
 * That many of the camp's unit entering around the tile on the ground handed in, each on its nearest
 * free tile, ties drawn from the generator and nothing drawn where one tile is nearest.
 */
function enteredOn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  ground: readonly Tile[],
  entry: TileCoords,
  enemies: number,
  script: CampScript,
): Landed {
  let landing = unchanged(chronicle);
  for (let enemy = 0; enemy < enemies; enemy++) {
    const standing = landing.chronicle;
    const free = ground.filter((tile) => unitAt(standing.units, tile) === undefined);
    if (free.length === 0) break;
    const nearest = Math.min(...free.map((tile) => distance(tile, entry)));
    const equal = free.filter((tile) => distance(tile, entry) === nearest);

    const drawn = equal.length === 1 ? undefined : nextRng(standing.rng);
    const { q, r } = drawn === undefined ? equal[0] : equal[Math.floor(drawn.value * equal.length)];
    landing = followed(landing, (left) =>
      entered(
        catalogue,
        drawn === undefined ? left : { ...left, rng: drawn.rng },
        campUnit(catalogue, left, { q, r }, script),
      ),
    );
  }
  return landing;
}

/**
 * The tile a raid enters around, drawn from the generator: nothing drawn at all where no tile of the
 * raid's ground is free for a warrior to enter on.
 */
export function raidEntry(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly entry: TileCoords; readonly chronicle: Chronicle } | undefined {
  const ground = raidGround(catalogue, chronicle);
  if (ground.every((tile) => unitAt(chronicle.units, tile) !== undefined)) return undefined;
  const { camp } = ageOf(catalogue, chronicle.age);
  const camps = chronicle.tiles.filter((tile) => tile.building === camp.building);
  // The chronicle holds no radius: the disc's edge is read off its tiles, which the generator deals
  // around `CENTRE`.
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, CENTRE)));
  const ring = ground.filter((tile) => distance(tile, CENTRE) === edge);
  if (camps.length === 0 && ring.length === 0) return undefined;

  const side = nextRng(chronicle.rng);
  const drawn = side.value < camp.raidCampOdds ? camps : ring;
  const entries = drawn.length > 0 ? drawn : drawn === camps ? ring : camps;
  const which = nextRng(side.rng);
  const { q, r } = entries[Math.floor(which.value * entries.length)];
  return { entry: { q, r }, chronicle: { ...chronicle, rng: which.rng } };
}
