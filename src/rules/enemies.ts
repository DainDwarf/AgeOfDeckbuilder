import {
  ageOf,
  type Catalogue,
  type EnemyAct,
  type Entering,
  entered,
  rewardsOf,
  type UnitEntryRow,
  type UnitEntryTable,
  unitEntryTableHeld,
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
import { change, changeOn, followed, type Landed, landedAs, unchanged } from './stages';
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
 * a building that is neither the city, a camp nor a site — and nothing where it would take nothing.
 */
export function pillaged(catalogue: Catalogue, chronicle: Chronicle, tile: Tile): Tile | undefined {
  if (chronicle.city !== undefined && tileKey(tile) === tileKey(chronicle.city)) return undefined;
  const nobodys =
    tile.building !== undefined && rewardsOf(catalogue, chronicle.age, tile.building) !== undefined;
  const building = nobodys ? tile.building : undefined;
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

/** The camp of an enemy standing ashore: none embarked, none of no camp, none of the player's. */
export function campAshore(unit: Unit): TileCoords | undefined {
  return unit.faction === 'enemy' && !unit.embarked ? unit.camp : undefined;
}

/**
 * The camps sending their waves, in tile order, each one `wave-sent` on its tile: where the camp's
 * own guards standing ashore are as many as its wave names, as many as it names leave as its
 * raiders, those off the camp's tile first in unit order and the one on it last.
 */
export function wavesSent(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const { camp } = ageOf(catalogue, chronicle.age);
  const { wave } = camp;
  if (wave === undefined) return unchanged(chronicle);
  const script = camp.scripts.raider;
  let sending = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== camp.building) continue;
    const at = { q, r };
    sending = followed(sending, (left) => {
      const counted = left.units.filter((unit) => {
        if (unit.faction !== 'enemy' || unit.script !== camp.scripts.guard) return false;
        const own = campAshore(unit);
        return own !== undefined && tileKey(own) === tileKey(at);
      });
      if (counted.length < wave.gathered) return unchanged(left);
      const onCamp = (unit: Unit): boolean => tileKey(unit.tile) === tileKey(at);
      const leaving = new Set(
        [...counted.filter((unit) => !onCamp(unit)), ...counted.filter(onCamp)]
          .slice(0, wave.sent)
          .map((unit) => unit.id),
      );
      return landedAs(
        changeOn('wave-sent', at, {
          ...left,
          units: left.units.map((unit) => (leaving.has(unit.id) ? { ...unit, script } : unit)),
        }),
      );
    });
  }
  return sending;
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

/** An enemy of the kind entering on the tile with the script. */
export function enemyEntering(
  kind: string,
  script: string,
  tile: TileCoords,
): Extract<Entering, { readonly faction: 'enemy' }> {
  return { type: kind, faction: 'enemy', tile, script };
}

/** An enemy entered or not yet: its kind's stats, and its moves ashore and embarked. */
type Entrant = { readonly stats: UnitStats; readonly moves: Moves };

function entrantOf(catalogue: Catalogue, chronicle: Chronicle, kind: string): Entrant {
  const stats = unitKind(catalogue, kind);
  return { stats, moves: enemyMoves(catalogue, chronicle, { stats, embarked: false }) };
}

/** One row drawn among these by their weights from the chronicle's generator; one alone draws nothing. */
function rowDrawn(
  chronicle: Chronicle,
  rows: UnitEntryTable,
): { readonly picked: UnitEntryRow; readonly chronicle: Chronicle } {
  if (rows.length === 1) return { picked: rows[0], chronicle };
  const weighed = rows.map((row) => [row, row.weight] as const);
  const { picked, rng } = pickWeighted(chronicle.rng, weighed);
  return { picked, chronicle: { ...chronicle, rng } };
}

/** The rows of that many enemies, drawn out of the table one after another. */
function rowsDrawn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  table: UnitEntryTable,
  enemies: number,
): { readonly rows: readonly UnitEntryRow[]; readonly chronicle: Chronicle } {
  unitEntryTableHeld(catalogue, table, "a unit entry's table");
  const rows: UnitEntryRow[] = [];
  let drawing = chronicle;
  for (let enemy = 0; enemy < enemies; enemy++) {
    const drawn = rowDrawn(drawing, table);
    rows.push(drawn.picked);
    drawing = drawn.chronicle;
  }
  return { rows, chronicle: drawing };
}

/**
 * An enemy of the camp's entering on its tile, its row drawn out of the table among the rows whose
 * kind stands on that tile ashore; none enters where none of them does.
 */
export function enteredOnCamp(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camp: TileCoords,
  table: UnitEntryTable,
): Landed {
  unitEntryTableHeld(catalogue, table, "a unit entry's table");
  const tile = tileAt(chronicle.tiles, camp);
  const standing = table.filter(({ kind }) =>
    standsOn(catalogue, unitKind(catalogue, kind), false, tile),
  );
  if (standing.length === 0) return unchanged(chronicle);
  const { picked, chronicle: drawing } = rowDrawn(chronicle, standing);
  return entered(catalogue, drawing, { ...enemyEntering(picked.kind, picked.script, camp), camp });
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
 * Enemies of these rows, in order, each on the nearest free tile its kind enters on around the tile
 * as a door, the camp's where one is named; the ones no free tile is left for enter nowhere.
 */
function enteredAs(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  rows: readonly UnitEntryRow[],
  camp: TileCoords | undefined,
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
  for (const row of rows) {
    const { reach, embarkedMove } = doorOf(row.kind);
    const standing = landing.chronicle;
    const free = reach.filter((stood) => unitAt(standing.units, stood) === undefined);
    if (free.length === 0) continue;
    const nearest = Math.min(...free.map((stood) => distance(stood, around)));
    const equal = free.filter((stood) => distance(stood, around) === nearest);

    const drawn = equal.length === 1 ? undefined : nextRng(standing.rng);
    const { q, r } = drawn === undefined ? equal[0] : equal[Math.floor(drawn.value * equal.length)];
    landing = followed(landing, (left) =>
      entered(catalogue, drawn === undefined ? left : { ...left, rng: drawn.rng }, {
        ...enemyEntering(row.kind, row.script, { q, r }),
        embarkedMove,
        camp,
      }),
    );
  }
  return landing;
}

/**
 * That many enemies of the camp's entering around it as a door, every one's row drawn out of the
 * table before any enters; a count below one is a `runtime-error`.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camp: TileCoords,
  enemies: number,
  table: UnitEntryTable,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const drawn = rowsDrawn(catalogue, chronicle, table, enemies);
  return enteredAs(catalogue, drawn.chronicle, camp, drawn.rows, camp);
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
 * A raid of that many enemies, none a camp's: every one's row drawn out of the table, then its door
 * drawn for the first, and every one entering around it. A raid of none, or one with no door with a
 * free tile around it for its first, draws nothing and is a `runtime-error`.
 */
export function raided(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemies: number,
  table: UnitEntryTable,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const drawn = rowsDrawn(catalogue, chronicle, table, enemies);
  const door = raidEntry(catalogue, drawn.chronicle, drawn.rows[0].kind);
  if (door === undefined) return landedAs(change('runtime-error', chronicle));
  return enteredAs(catalogue, door.chronicle, door.entry, drawn.rows, undefined);
}
