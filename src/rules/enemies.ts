import {
  ageOf,
  type CampScript,
  type Catalogue,
  type Entering,
  entered,
  unitKind,
} from './catalogue';
import {
  CENTRE,
  distance,
  type Moves,
  routesFrom,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { type MapContent, refuse } from './map-kinds';
import { nextRng } from './rng';
import { inOwnSight } from './sight';
import { change, followed, type Landed, landedAs, unchanged } from './stages';
import type { Chronicle } from './state';
import { canAttack, standsOn, type Unit, type UnitStats, unitAt } from './units';

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

/**
 * The move an enemy has once it embarks or disembarks: embarking, its age's camp's embarked move, and
 * none where the camp names none; disembarking, its kind's own.
 */
function steppedMove(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): number | undefined {
  return enemy.embarked
    ? unitKind(catalogue, enemy.stats.type).move
    : ageOf(catalogue, chronicle.age).camp.embarkedMove;
}

/**
 * The move an enemy embarks or disembarks onto the tile with, through no card, and nothing where it
 * cannot: the tile beside where the enemy stands, no other unit on it, one it stands on once stepped,
 * and the enemy holding action.
 */
export function stepMove(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemy: Unit,
  to: TileCoords,
): number | undefined {
  const move = steppedMove(catalogue, chronicle, enemy);
  if (move === undefined || enemy.action <= 0 || distance(enemy.tile, to) !== 1) return undefined;
  const there = unitAt(chronicle.units, to);
  if (there !== undefined && there.id !== enemy.id) return undefined;
  const tile = tileAt(chronicle.tiles, to);
  return standsOn(catalogue, { ...enemy.stats, move }, !enemy.embarked, tile) ? move : undefined;
}

/**
 * The moves an enemy's walk over the whole map weighs its steps against: its own, embarked or
 * ashore as it stands, and the one an embark or a disembark would give it.
 */
export function enemyMoves(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Moves {
  const stepped = steppedMove(catalogue, chronicle, enemy);
  return enemy.embarked
    ? { embarked: enemy.stats.move, ashore: stepped }
    : { ashore: enemy.stats.move, embarked: stepped };
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

/** The chronicle's age's camp's unit: its kind's stats, and its moves ashore and embarked. */
type Walker = { readonly stats: UnitStats; readonly moves: Moves };

function campWalker(catalogue: Catalogue, chronicle: Chronicle): Walker {
  const { camp } = ageOf(catalogue, chronicle.age);
  const stats = unitKind(catalogue, camp.unit);
  return { stats, moves: { ashore: stats.move, embarked: camp.embarkedMove } };
}

/** Whether the walker stands on the tile, embarked or ashore as named, on the move its moves name. */
function standsAs(
  catalogue: Catalogue,
  { stats, moves }: Walker,
  tile: Tile | undefined,
  embarked: boolean,
): boolean {
  const move = embarked ? moves.embarked : moves.ashore;
  return move !== undefined && standsOn(catalogue, { ...stats, move }, embarked, tile);
}

/**
 * The tiles the walker stands on the way a walk over the whole map on its moves reaches them from
 * the tile, standing on it embarked or ashore as named, never the city's.
 */
function reached(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Walker,
  from: TileCoords,
  embarked: boolean,
): Tile[] {
  const city =
    chronicle.city ?? refuse(catalogue, 'an enemy entered while the city stands nowhere');
  const { tiles, rivers } = chronicle;
  const routes = routesFrom(catalogue, tiles, rivers, from, embarked, walker.moves);
  return tiles.filter(
    (tile) =>
      tileKey(tile) !== tileKey(city) &&
      [false, true].some(
        (standsEmbarked) =>
          (standsEmbarked ? routes.embarked : routes.ashore).has(tileKey(tile)) &&
          standsAs(catalogue, walker, tile, standsEmbarked),
      ),
  );
}

/** Whether the walker stands on the tile embarked and not ashore. */
function afloat(catalogue: Catalogue, walker: Walker, tile: Tile | undefined): boolean {
  return !standsAs(catalogue, walker, tile, false) && standsAs(catalogue, walker, tile, true);
}

/**
 * The tiles the camp's unit enters on around a door: those the door's own ground runs to, or, where
 * the unit stands on the door embarked only, those its own water runs to, entered on that move.
 */
function aroundDoor(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Walker,
  door: TileCoords,
): { readonly reach: Tile[]; readonly embarkedMove: number | undefined } {
  const { ashore, embarked } = walker.moves;
  return afloat(catalogue, walker, tileAt(chronicle.tiles, door))
    ? {
        reach: reached(catalogue, chronicle, { ...walker, moves: { embarked } }, door, true),
        embarkedMove: embarked,
      }
    : {
        reach: reached(catalogue, chronicle, { ...walker, moves: { ashore } }, door, false),
        embarkedMove: undefined,
      };
}

/**
 * That many of the camp's unit entering with the script named, each on the nearest free tile around
 * the tile as a door; the ones no free tile is left for enter nowhere, and a count below one is a
 * `runtime-error`.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  enemies: number,
  script: CampScript,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const walker = campWalker(catalogue, chronicle);
  const { reach, embarkedMove } = aroundDoor(catalogue, chronicle, walker, around);

  let landing = unchanged(chronicle);
  for (let enemy = 0; enemy < enemies; enemy++) {
    const standing = landing.chronicle;
    const free = reach.filter((stood) => unitAt(standing.units, stood) === undefined);
    if (free.length === 0) break;
    const nearest = Math.min(...free.map((stood) => distance(stood, around)));
    const equal = free.filter((stood) => distance(stood, around) === nearest);

    const drawn = equal.length === 1 ? undefined : nextRng(standing.rng);
    const { q, r } = drawn === undefined ? equal[0] : equal[Math.floor(drawn.value * equal.length)];
    landing = followed(landing, (left) =>
      entered(catalogue, drawn === undefined ? left : { ...left, rng: drawn.rng }, {
        ...campUnit(catalogue, left, { q, r }, script),
        embarkedMove,
      }),
    );
  }
  return landing;
}

/**
 * Whether a free tile stands around a door, each reach walked once for every door on one medium it
 * holds: a walk reaches back every tile it reaches.
 */
function roomyDoors(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Walker,
): (door: TileCoords) => boolean {
  const walked: {
    readonly embarked: boolean;
    readonly keys: Set<string>;
    readonly roomy: boolean;
  }[] = [];
  return (door) => {
    const embarked = afloat(catalogue, walker, tileAt(chronicle.tiles, door));
    const known = walked.find(
      (reach) => reach.embarked === embarked && reach.keys.has(tileKey(door)),
    );
    if (known !== undefined) return known.roomy;
    const { reach } = aroundDoor(catalogue, chronicle, walker, door);
    const roomy = reach.some((tile) => unitAt(chronicle.units, tile) === undefined);
    walked.push({ embarked, keys: new Set(reach.map(tileKey)), roomy });
    return roomy;
  };
}

/**
 * The tile a raid enters around, drawn from the generator among the doors with a free tile around
 * them, a side holding none dropping out of the draw; nothing drawn at all where no door has one.
 */
export function raidEntry(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly entry: TileCoords; readonly chronicle: Chronicle } | undefined {
  const city = chronicle.city ?? refuse(catalogue, 'a raid landed while the city stands nowhere');
  const { camp } = ageOf(catalogue, chronicle.age);
  const walker = campWalker(catalogue, chronicle);
  const roomy = roomyDoors(catalogue, chronicle, walker);
  const camps = chronicle.tiles.filter((tile) => tile.building === camp.building && roomy(tile));
  // The chronicle holds no radius: the disc's edge is read off its tiles, which the generator deals
  // around `CENTRE`.
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, CENTRE)));
  const ring = reached(catalogue, chronicle, walker, city, false).filter(
    (tile) => distance(tile, CENTRE) === edge && roomy(tile),
  );
  if (camps.length === 0 && ring.length === 0) return undefined;

  const side = nextRng(chronicle.rng);
  const drawn = side.value < camp.raidCampOdds ? camps : ring;
  const entries = drawn.length > 0 ? drawn : drawn === camps ? ring : camps;
  const which = nextRng(side.rng);
  const { q, r } = entries[Math.floor(which.value * entries.length)];
  return { entry: { q, r }, chronicle: { ...chronicle, rng: which.rng } };
}
