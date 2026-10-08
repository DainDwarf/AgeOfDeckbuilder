import {
  ageOf,
  type CampScript,
  type Catalogue,
  type EnemyAct,
  type Entering,
  type EveryCampScript,
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
import { nextRng, pickWeighted } from './rng';
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

/** An attack on the unit, and nothing where there is none to attack. */
export function attackOrNone(target: Unit | undefined): EnemyAct {
  return target === undefined ? { act: 'none' } : { act: 'attack', target };
}

/**
 * The tile as a pillage leaves it, everything the player built on it removed — every improvement, and
 * a building that is neither the city nor a camp — and nothing where it would take nothing.
 */
export function pillaged(catalogue: Catalogue, chronicle: Chronicle, tile: Tile): Tile | undefined {
  if (chronicle.city !== undefined && tileKey(tile) === tileKey(chronicle.city)) return undefined;
  const camp = ageOf(catalogue, chronicle.age).camp.building;
  const building = tile.building === camp ? camp : undefined;
  if (tile.improvements.length === 0 && building === tile.building) return undefined;
  return { ...tile, improvements: [], building };
}

/**
 * What an enemy's prepare lands as at the next enemy phase: the city's capture on the city's tile, a
 * pillage on any other; nothing for a unit that has prepared nothing.
 */
export function preparedAs(
  chronicle: Pick<Chronicle, 'city'>,
  unit: Unit,
): 'capture' | 'pillage' | undefined {
  if (unit.faction !== 'enemy' || !unit.prepared) return undefined;
  const { city } = chronicle;
  return city !== undefined && tileKey(unit.tile) === tileKey(city) ? 'capture' : 'pillage';
}

/** An enemy entered or not yet: its stats, and whether it stands embarked. */
type Walking = Pick<Unit, 'stats' | 'embarked'>;

/**
 * The move an enemy has once it embarks or disembarks: embarking, its age's camp's embarked move, and
 * none where the camp names none; disembarking, its kind's own.
 */
function steppedMove(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemy: Walking,
): number | undefined {
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
export function enemyMoves(catalogue: Catalogue, chronicle: Chronicle, enemy: Walking): Moves {
  const stepped = steppedMove(catalogue, chronicle, enemy);
  return enemy.embarked
    ? { embarked: enemy.stats.move, ashore: stepped }
    : { ashore: enemy.stats.move, embarked: stepped };
}

/**
 * An enemy of the kind, of the chronicle's age's camp, entering on the tile with the script the camp
 * names for it, and nothing where the camp names no such script.
 */
export function campUnit(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kind: string,
  tile: TileCoords,
  script: EveryCampScript,
): Entering;
export function campUnit(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kind: string,
  tile: TileCoords,
  script: CampScript,
): Entering | undefined;
export function campUnit(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kind: string,
  tile: TileCoords,
  script: CampScript,
): Entering | undefined {
  const named = ageOf(catalogue, chronicle.age).camp.scripts[script];
  return named === undefined ? undefined : { type: kind, faction: 'enemy', tile, script: named };
}

/** An enemy entered or not yet: its kind's stats, and its moves ashore and embarked. */
type Entrant = { readonly stats: UnitStats; readonly moves: Moves };

function entrantOf(catalogue: Catalogue, chronicle: Chronicle, kind: string): Entrant {
  const stats = unitKind(catalogue, kind);
  return { stats, moves: enemyMoves(catalogue, chronicle, { stats, embarked: false }) };
}

/** A kind drawn among these by their weights from the chronicle's generator; one alone draws nothing. */
function kindDrawn(
  chronicle: Chronicle,
  kinds: readonly (readonly [string, number])[],
): { readonly kind: string; readonly chronicle: Chronicle } {
  if (kinds.length === 1) return { kind: kinds[0][0], chronicle };
  const { picked, rng } = pickWeighted(chronicle.rng, kinds);
  return { kind: picked, chronicle: { ...chronicle, rng } };
}

/** The kinds of that many enemies of the chronicle's age's camp, drawn one after another. */
function kindsDrawn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemies: number,
): { readonly kinds: readonly string[]; readonly chronicle: Chronicle } {
  const weighed = Object.entries(ageOf(catalogue, chronicle.age).camp.unitKinds);
  const kinds: string[] = [];
  let drawing = chronicle;
  for (let enemy = 0; enemy < enemies; enemy++) {
    const drawn = kindDrawn(drawing, weighed);
    kinds.push(drawn.kind);
    drawing = drawn.chronicle;
  }
  return { kinds, chronicle: drawing };
}

/**
 * An enemy of the chronicle's age's camp entering on the camp's tile with the script named, its kind
 * drawn among the camp's kinds that stand on that tile ashore; none enters where none of them does,
 * and a script the camp names none of is a `runtime-error`.
 */
export function enteredOnCamp(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camp: TileCoords,
  script: CampScript,
): Landed {
  const tile = tileAt(chronicle.tiles, camp);
  const standing = Object.entries(ageOf(catalogue, chronicle.age).camp.unitKinds).filter(([kind]) =>
    standsOn(catalogue, unitKind(catalogue, kind), false, tile),
  );
  if (standing.length === 0) return unchanged(chronicle);
  const drawn = kindDrawn(chronicle, standing);
  const entering = campUnit(catalogue, drawn.chronicle, drawn.kind, camp, script);
  if (entering === undefined) return landedAs(change('runtime-error', chronicle));
  return entered(catalogue, drawn.chronicle, entering);
}

/** Whether the entrant stands on the tile, embarked or ashore as named, on the move its moves name. */
export function standsAs(
  catalogue: Catalogue,
  { stats, moves }: Entrant,
  tile: Tile | undefined,
  embarked: boolean,
): boolean {
  const move = embarked ? moves.embarked : moves.ashore;
  return move !== undefined && standsOn(catalogue, { ...stats, move }, embarked, tile);
}

/**
 * The tiles the entrant stands on the way a walk over the whole map on its moves reaches them from
 * the tile, standing on it embarked or ashore as named, never the city's.
 */
function reached(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entrant: Entrant,
  from: TileCoords,
  embarked: boolean,
): Tile[] {
  const city =
    chronicle.city ?? refuse(catalogue, 'an enemy entered while the city stands nowhere');
  const { tiles, rivers } = chronicle;
  const routes = routesFrom(catalogue, tiles, rivers, from, embarked, entrant.moves);
  return tiles.filter(
    (tile) =>
      tileKey(tile) !== tileKey(city) &&
      [false, true].some(
        (standsEmbarked) =>
          (standsEmbarked ? routes.embarked : routes.ashore).has(tileKey(tile)) &&
          standsAs(catalogue, entrant, tile, standsEmbarked),
      ),
  );
}

/** Whether the entrant stands on the tile embarked and not ashore. */
function embarkedOnly(catalogue: Catalogue, entrant: Entrant, tile: Tile | undefined): boolean {
  return !standsAs(catalogue, entrant, tile, false) && standsAs(catalogue, entrant, tile, true);
}

/**
 * The tiles the entrant enters on around a door: those the door's own ground runs to, or, where it
 * stands on the door embarked only, those its own water runs to, entered on that move.
 */
function aroundDoor(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entrant: Entrant,
  door: TileCoords,
): { readonly reach: Tile[]; readonly embarkedMove: number | undefined } {
  const { ashore, embarked } = entrant.moves;
  return embarkedOnly(catalogue, entrant, tileAt(chronicle.tiles, door))
    ? {
        reach: reached(catalogue, chronicle, { ...entrant, moves: { embarked } }, door, true),
        embarkedMove: embarked,
      }
    : {
        reach: reached(catalogue, chronicle, { ...entrant, moves: { ashore } }, door, false),
        embarkedMove: undefined,
      };
}

/**
 * Enemies of these kinds, in order, entering with the script named, each on the nearest free tile
 * its kind enters on around the tile as a door; the ones no free tile is left for enter nowhere, and
 * each a script the camp names none of is a `runtime-error`.
 */
function enteredAs(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  kinds: readonly string[],
  script: CampScript,
): Landed {
  const doors = new Map<string, ReturnType<typeof aroundDoor>>();
  const doorOf = (kind: string): ReturnType<typeof aroundDoor> => {
    const known = doors.get(kind);
    if (known !== undefined) return known;
    const walked = aroundDoor(catalogue, chronicle, entrantOf(catalogue, chronicle, kind), around);
    doors.set(kind, walked);
    return walked;
  };

  let landing = unchanged(chronicle);
  for (const kind of kinds) {
    const { reach, embarkedMove } = doorOf(kind);
    const standing = landing.chronicle;
    const free = reach.filter((stood) => unitAt(standing.units, stood) === undefined);
    if (free.length === 0) continue;
    const nearest = Math.min(...free.map((stood) => distance(stood, around)));
    const equal = free.filter((stood) => distance(stood, around) === nearest);

    const drawn = equal.length === 1 ? undefined : nextRng(standing.rng);
    const { q, r } = drawn === undefined ? equal[0] : equal[Math.floor(drawn.value * equal.length)];
    landing = followed(landing, (left) => {
      const entering = campUnit(catalogue, left, kind, { q, r }, script);
      if (entering === undefined) return landedAs(change('runtime-error', left));
      return entered(catalogue, drawn === undefined ? left : { ...left, rng: drawn.rng }, {
        ...entering,
        embarkedMove,
      });
    });
  }
  return landing;
}

/**
 * That many enemies of the chronicle's age's camp entering with the script named around the tile as
 * a door, every one's kind drawn before any enters; a count below one is a `runtime-error`.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  enemies: number,
  script: CampScript,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const drawn = kindsDrawn(catalogue, chronicle, enemies);
  return enteredAs(catalogue, drawn.chronicle, around, drawn.kinds, script);
}

/**
 * Whether a free tile stands around a door for the entrant, each reach walked once for every door on
 * one medium it holds: a walk reaches back every tile it reaches.
 */
function roomyDoors(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entrant: Entrant,
): (door: TileCoords) => boolean {
  const walked: {
    readonly embarked: boolean;
    readonly keys: Set<string>;
    readonly roomy: boolean;
  }[] = [];
  return (door) => {
    const embarked = embarkedOnly(catalogue, entrant, tileAt(chronicle.tiles, door));
    const known = walked.find(
      (reach) => reach.embarked === embarked && reach.keys.has(tileKey(door)),
    );
    if (known !== undefined) return known.roomy;
    const { reach } = aroundDoor(catalogue, chronicle, entrant, door);
    const roomy = reach.some((tile) => unitAt(chronicle.units, tile) === undefined);
    walked.push({ embarked, keys: new Set(reach.map(tileKey)), roomy });
    return roomy;
  };
}

/**
 * The tile a raid enters around, read on its first enemy's kind: drawn from the generator among the
 * doors with a free tile around them for that kind, a side holding none dropping out of the draw;
 * nothing drawn at all where no door has one.
 */
function raidEntry(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kind: string,
): { readonly entry: TileCoords; readonly chronicle: Chronicle } | undefined {
  const city = chronicle.city ?? refuse(catalogue, 'a raid landed while the city stands nowhere');
  const { camp } = ageOf(catalogue, chronicle.age);
  const entrant = entrantOf(catalogue, chronicle, kind);
  const roomy = roomyDoors(catalogue, chronicle, entrant);
  const camps = chronicle.tiles.filter((tile) => tile.building === camp.building && roomy(tile));
  // The chronicle holds no radius: the disc's edge is read off its tiles, which the generator deals
  // around `CENTRE`.
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, CENTRE)));
  const ring = reached(catalogue, chronicle, entrant, city, false).filter(
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

/**
 * A raid of that many enemies of the chronicle's age's camp, raiders all: every one's kind drawn,
 * then its door drawn for the first, and every one entering around it. A raid of none, or one with
 * no door with a free tile around it for its first, draws nothing and is a `runtime-error`.
 */
export function raided(catalogue: Catalogue, chronicle: Chronicle, enemies: number): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const drawn = kindsDrawn(catalogue, chronicle, enemies);
  const door = raidEntry(catalogue, drawn.chronicle, drawn.kinds[0]);
  if (door === undefined) return landedAs(change('runtime-error', chronicle));
  return enteredAs(catalogue, door.chronicle, door.entry, drawn.kinds, 'raider');
}
