import {
  ageOf,
  type Catalogue,
  captureOf,
  type Entering,
  entered,
  type Neutral,
  neutralScriptOf,
  type ScriptAct,
  type UnitEntryRow,
  type UnitEntryTable,
  unitEntryTableHeld,
  unitKind,
  type Wave,
} from './catalogue';
import {
  CENTRE,
  distance,
  landable,
  type Moves,
  routesFrom,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { type MapContent, refuse } from './map-kinds';
import { nextRng, pickUniform, pickWeighted } from './rng';
import { inOwnSight } from './sight';
import { change, changeOn, followed, type Landed, landedAs, unchanged } from './stages';
import { type Chronicle, type CityFaction, cityOn } from './state';
import {
  canAttack,
  type Faction,
  passageFor,
  relationsOf,
  type ScriptedFaction,
  standsOn,
  type Unit,
  type UnitStats,
  unitAt,
} from './units';

/**
 * Of the units handed in, every one a unit can attack from the tile it stands on, action aside: one
 * within its range that its own sight reaches, whatever else sees it.
 */
export function targetsInOwnSight(
  catalogue: MapContent,
  chronicle: Pick<Chronicle, 'tiles' | 'relations'>,
  units: readonly Unit[],
  attacker: Unit,
): Unit[] {
  const relations = relationsOf(chronicle);
  const inRange = units.filter((other) =>
    canAttack(attacker, other, distance(other.tile, attacker.tile), relations),
  );
  if (inRange.length === 0) return inRange;
  const seen = inOwnSight(catalogue, chronicle.tiles, attacker);
  return inRange.filter((other) => seen.has(tileKey(other.tile)));
}

/**
 * What a unit a script attacks: of the units handed in, the one it can attack from where it
 * stands holding the least health, the first of equals, and nothing when it can attack none.
 */
export function leastHealth(
  catalogue: MapContent,
  chronicle: Pick<Chronicle, 'tiles' | 'relations'>,
  units: readonly Unit[],
  attacker: Unit,
): Unit | undefined {
  let target: Unit | undefined;
  for (const other of targetsInOwnSight(catalogue, chronicle, units, attacker)) {
    if (target === undefined || other.stats.health < target.stats.health) target = other;
  }
  return target;
}

/** An attack on the unit, and nothing where there is none to attack. */
export function attackOrNone(target: Unit | undefined): ScriptAct {
  return target === undefined ? { act: 'none' } : { act: 'attack', target };
}

/**
 * The tile as a pillage leaves it, everything a city built on it removed — every improvement, and a
 * building no capture takes — and nothing on a city's own tile or where it would take nothing.
 */
export function pillaged(catalogue: Catalogue, chronicle: Chronicle, tile: Tile): Tile | undefined {
  if (cityOn(chronicle, tile) !== undefined) return undefined;
  const spared =
    tile.building !== undefined && captureOf(catalogue, chronicle.age, tile.building) !== undefined;
  const building = spared ? tile.building : undefined;
  if (tile.improvements.length === 0 && building === tile.building) return undefined;
  return { ...tile, improvements: [], building };
}

/** The city standing on the tile, and nothing where none does or where it is the faction's own. */
export function otherCityOn(
  chronicle: Pick<Chronicle, 'city' | 'neutral'>,
  tile: TileCoords,
  faction: Faction,
): CityFaction | undefined {
  const city = cityOn(chronicle, tile);
  return city === faction ? undefined : city;
}

/**
 * What a unit's prepare lands as at the next enemy phase: the capture of a city not its own on that
 * city's tile, a pillage on any other; nothing for a unit that has prepared nothing.
 */
export function preparedAs(
  chronicle: Pick<Chronicle, 'city' | 'neutral'>,
  unit: Unit,
): 'capture' | 'pillage' | undefined {
  if (unit.faction === 'player' || !unit.prepared) return undefined;
  switch (otherCityOn(chronicle, unit.tile, unit.faction)) {
    case 'player':
    case 'neutral':
      return 'capture';
    case undefined:
      return 'pillage';
  }
}

/** The camp of an enemy standing ashore: none embarked, none of no camp, none of the player's. */
export function campAshore(unit: Unit): TileCoords | undefined {
  return unit.faction === 'enemy' && !unit.embarked ? unit.camp : undefined;
}

/**
 * What sends a wave: the tile it is sent from, whether a unit is one of its guards, the script its
 * wave leaves with, and the wave.
 */
type WaveOwner = {
  readonly at: TileCoords;
  readonly guards: (unit: Unit) => boolean;
  readonly script: string;
  readonly wave: Wave;
};

/**
 * The waves sent, the camps' in tile order then the neutral's at peace, one `wave-sent` on each
 * owner's tile: where its guards ashore are as many as its wave gathers, as many as it sends take
 * the wave's script, those off its tile first in unit order and the one on it last.
 */
export function wavesSent(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const { camp, neutral } = ageOf(catalogue, chronicle.age);
  const owners: WaveOwner[] = [];
  const { wave } = camp;
  if (wave !== undefined) {
    for (const { q, r, building } of chronicle.tiles) {
      if (building !== camp.building) continue;
      const at = { q, r };
      owners.push({
        at,
        guards: (unit) => {
          if (unit.faction !== 'enemy' || unit.script !== camp.scripts.guard) return false;
          return unit.camp !== undefined && tileKey(unit.camp) === tileKey(at);
        },
        script: camp.scripts.raider,
        wave,
      });
    }
  }
  if (
    neutral?.wave !== undefined &&
    chronicle.neutral !== undefined &&
    relationsOf(chronicle) === 'peace'
  ) {
    owners.push({
      at: chronicle.neutral.city,
      guards: (unit) => unit.faction === 'neutral' && unit.script === neutral.scripts.guard,
      script: neutral.scripts.wave,
      wave: neutral.wave,
    });
  }
  let sending = unchanged(chronicle);
  for (const owner of owners) sending = followed(sending, (left) => waveSent(left, owner));
  return sending;
}

function waveSent(chronicle: Chronicle, { at, guards, script, wave }: WaveOwner): Landed {
  const counted = chronicle.units.filter((unit) => !unit.embarked && guards(unit));
  if (counted.length < wave.gathered) return unchanged(chronicle);
  const onTile = (unit: Unit): boolean => tileKey(unit.tile) === tileKey(at);
  const leaving = new Set(
    [...counted.filter((unit) => !onTile(unit)), ...counted.filter(onTile)]
      .slice(0, wave.sent)
      .map((unit) => unit.id),
  );
  return landedAs(
    changeOn(
      'wave-sent',
      at,
      {
        ...chronicle,
        units: chronicle.units.map((unit) => (leaving.has(unit.id) ? { ...unit, script } : unit)),
      },
      chronicle,
    ),
  );
}

/** A unit acting by its script, entered or not yet: its stats, and whether it stands embarked. */
type Walking = Pick<Unit, 'stats' | 'embarked'>;

/**
 * The move a unit acting by its script has once it embarks or disembarks: embarking, its age's
 * camp's embarked move, and none where the camp names none; disembarking, its kind's own.
 */
function steppedMove(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Walking,
): number | undefined {
  return walker.embarked
    ? unitKind(catalogue, walker.stats.type).move
    : ageOf(catalogue, chronicle.age).camp.embarkedMove;
}

/**
 * The move a unit acting by its script embarks or disembarks onto the tile with, through no card,
 * and nothing where it cannot: the tile beside it, no other unit on it, its faction not shut out of
 * it, one it stands on once stepped, and the unit holding action.
 */
export function stepMove(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
  to: TileCoords,
): number | undefined {
  const move = steppedMove(catalogue, chronicle, unit);
  if (move === undefined || unit.action <= 0 || distance(unit.tile, to) !== 1) return undefined;
  if (!landable(passageFor(chronicle, unit.faction)(to))) return undefined;
  const there = unitAt(chronicle.units, to);
  if (there !== undefined && there.id !== unit.id) return undefined;
  const tile = tileAt(chronicle.tiles, to);
  return standsOn(catalogue, { ...unit.stats, move }, !unit.embarked, tile) ? move : undefined;
}

/**
 * The moves the walk over the whole map of a unit acting by its script weighs its steps against:
 * its own, embarked or ashore as it stands, and the one an embark or a disembark would give it.
 */
export function walkMoves(catalogue: Catalogue, chronicle: Chronicle, walker: Walking): Moves {
  const stepped = steppedMove(catalogue, chronicle, walker);
  return walker.embarked
    ? { embarked: walker.stats.move, ashore: stepped }
    : { ashore: walker.stats.move, embarked: stepped };
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
  return { stats, moves: walkMoves(catalogue, chronicle, { stats, embarked: false }) };
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

/** What one unit acting by a script enters as: its kind and its script. */
export type ScriptedEntry = Pick<UnitEntryRow, 'kind' | 'script'>;

/**
 * What that many enemies enter as, each drawn out of the table one after another, and the
 * chronicle's generator as the draws leave it; a table holding no row, or a row the catalogue does
 * not hold, is refused.
 */
export function rowsDrawn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  table: UnitEntryTable,
  enemies: number,
): { readonly rows: readonly ScriptedEntry[]; readonly chronicle: Chronicle } {
  unitEntryTableHeld(catalogue, table, "a unit entry's table");
  const rows: ScriptedEntry[] = [];
  let drawing = chronicle;
  for (let enemy = 0; enemy < enemies; enemy++) {
    const { picked, chronicle: drawn } = rowDrawn(drawing, table);
    rows.push({ kind: picked.kind, script: picked.script });
    drawing = drawn;
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
 * The tiles the entrant stands on the way a walk over the whole map on its moves and the faction's
 * passage reaches them from the tile, standing on it embarked or ashore as named, never the tile of a
 * city not the faction's own.
 */
function reached(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entrant: Entrant,
  from: TileCoords,
  embarked: boolean,
  faction: ScriptedFaction,
): Tile[] {
  const { tiles, rivers } = chronicle;
  const passage = passageFor(chronicle, faction);
  const routes = routesFrom(catalogue, tiles, rivers, from, embarked, entrant.moves, passage);
  return tiles.filter(
    (tile) =>
      otherCityOn(chronicle, tile, faction) === undefined &&
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
 * The tiles a unit of the faction's of the entrant's kind enters on around a door: those the door's
 * own ground runs to, or, where it stands on the door embarked only, those its own water runs to,
 * entered on that move.
 */
function aroundDoor(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entrant: Entrant,
  door: TileCoords,
  faction: ScriptedFaction,
): { readonly reach: Tile[]; readonly embarkedMove: number | undefined } {
  const { ashore, embarked } = entrant.moves;
  const afloat = embarkedOnly(catalogue, entrant, tileAt(chronicle.tiles, door));
  const moves = afloat ? { embarked } : { ashore };
  return {
    reach: reached(catalogue, chronicle, { ...entrant, moves }, door, afloat, faction),
    embarkedMove: afloat ? embarked : undefined,
  };
}

/** Whose units a door enters: the enemies', a camp's where one is named, or the neutral's. */
type DoorFor =
  | { readonly faction: 'enemy'; readonly camp?: TileCoords }
  | { readonly faction: 'neutral' };

/**
 * Units of these rows, in order, each on the nearest free tile its kind enters on around the tile as
 * a door, made the door's faction's; the ones no free tile is left for enter nowhere.
 */
function enteredAs(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  rows: readonly ScriptedEntry[],
  door: DoorFor,
): Landed {
  const doors = new Map<string, ReturnType<typeof aroundDoor>>();
  const doorOf = (kind: string): ReturnType<typeof aroundDoor> => {
    const known = doors.get(kind);
    if (known !== undefined) return known;
    const entrant = entrantOf(catalogue, chronicle, kind);
    const walked = aroundDoor(catalogue, chronicle, entrant, around, door.faction);
    doors.set(kind, walked);
    return walked;
  };
  const enteringOn = (
    { kind, script }: ScriptedEntry,
    tile: TileCoords,
    embarkedMove: number | undefined,
  ): Entering => {
    switch (door.faction) {
      case 'enemy':
        return { ...enemyEntering(kind, script, tile), embarkedMove, camp: door.camp };
      case 'neutral':
        return { type: kind, faction: 'neutral', script, tile, embarkedMove };
    }
  };

  let landing = unchanged(chronicle);
  for (const row of rows) {
    const { reach, embarkedMove } = doorOf(row.kind);
    const standing = landing.chronicle;
    const free = reach.filter((stood) => unitAt(standing.units, stood) === undefined);
    if (free.length === 0) continue;
    const nearest = Math.min(...free.map((stood) => distance(stood, around)));
    const equal = free.filter((stood) => distance(stood, around) === nearest);

    const drawn = equal.length === 1 ? undefined : pickUniform(standing.rng, equal);
    const { q, r } = drawn === undefined ? equal[0] : drawn.picked;
    landing = followed(landing, (left) =>
      entered(
        catalogue,
        drawn === undefined ? left : { ...left, rng: drawn.rng },
        enteringOn(row, { q, r }, embarkedMove),
      ),
    );
  }
  return landing;
}

/**
 * Enemies of the camp's, one of each row in order, entering around it as a door; no row at all is a
 * `runtime-error`.
 */
export function campEnteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camp: TileCoords,
  rows: readonly ScriptedEntry[],
): Landed {
  if (rows.length === 0) return landedAs(change('runtime-error', chronicle, chronicle));
  return enteredAs(catalogue, chronicle, camp, rows, { faction: 'enemy', camp });
}

/**
 * The units the neutral's opening names, in order, entering around the tile as a door, each under
 * the script its kind carries.
 */
export function neutralEnteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  around: TileCoords,
  neutral: Neutral,
): Landed {
  const rows = neutral.opening.map(
    (kind): ScriptedEntry => ({ kind, script: neutralScriptOf(catalogue, neutral, kind) }),
  );
  return enteredAs(catalogue, chronicle, around, rows, { faction: 'neutral' });
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
    const { reach } = aroundDoor(catalogue, chronicle, entrant, door, 'enemy');
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
  const ring = reached(catalogue, chronicle, entrant, city, false, 'enemy').filter(
    (tile) => distance(tile, CENTRE) === edge && roomy(tile),
  );
  if (camps.length === 0 && ring.length === 0) return undefined;

  const side = nextRng(chronicle.rng);
  const drawn = side.value < camp.raidCampOdds ? camps : ring;
  const entries = drawn.length > 0 ? drawn : drawn === camps ? ring : camps;
  const which = pickUniform(side.rng, entries);
  const { q, r } = which.picked;
  return { entry: { q, r }, chronicle: { ...chronicle, rng: which.rng } };
}

/**
 * A raid, none of its enemies a camp's, one of each row in order: its door drawn for the first row's
 * kind, and every one entering around it. A raid of no row, or one with no door with a free tile
 * around it for its first, draws nothing and is a `runtime-error`.
 */
export function raided(
  catalogue: Catalogue,
  chronicle: Chronicle,
  rows: readonly ScriptedEntry[],
): Landed {
  if (rows.length === 0) return landedAs(change('runtime-error', chronicle, chronicle));
  const door = raidEntry(catalogue, chronicle, rows[0].kind);
  if (door === undefined) return landedAs(change('runtime-error', chronicle, chronicle));
  return enteredAs(catalogue, door.chronicle, door.entry, rows, { faction: 'enemy' });
}
