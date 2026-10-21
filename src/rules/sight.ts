import type { Catalogue } from './catalogue';
import {
  discAround,
  distance,
  elevation,
  sameTile,
  type Tile,
  type TileCoords,
  type TilesBeside,
  tileAt,
  tileKey,
  tilesBeside,
} from './map';
import { type MapContent, refuse } from './map-kinds';
import { type Chronicle, holderOf, onSettlePhase, type Snapshot } from './state';
import { type Unit, unitAt } from './units';

/** A tile in the cube coordinates a line is drawn in: `x` is its q, `z` its r, and the three sum to nought. */
type Cube = { readonly x: number; readonly y: number; readonly z: number };

/**
 * What takes a line off the exact edge two tiles share, so a point landing on one falls to a side
 * instead of standing a tie. It moves every point of the line alike, which is what makes the line
 * between two tiles run over the same tiles whichever of the two it is drawn from.
 */
const NUDGE: Cube = { x: 1e-6, y: 2e-6, z: -3e-6 };

function cubeOf({ q, r }: TileCoords): Cube {
  return { x: q, y: -q - r, z: r };
}

/** The tile a point on a line lies on: the one coordinate furthest off a whole number gives way. */
function rounded({ x, y, z }: Cube): TileCoords {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) return { q: -ry - rz, r: rz };
  if (dy > dz) return { q: rx, r: rz };
  return { q: rx, r: -rx - ry };
}

/** The tiles the line from one tile to another runs over, nudged one way or the other, the ends left out. */
function between(from: TileCoords, to: TileCoords, way: 1 | -1): TileCoords[] {
  const steps = distance(from, to);
  const a = cubeOf(from);
  const b = cubeOf(to);
  const over: TileCoords[] = [];
  for (let step = 1; step < steps; step++) {
    const along = step / steps;
    over.push(
      rounded({
        x: a.x + (b.x - a.x) * along + way * NUDGE.x,
        y: a.y + (b.y - a.y) * along + way * NUDGE.y,
        z: a.z + (b.z - a.z) * along + way * NUDGE.z,
      }),
    );
  }
  return over;
}

/**
 * Whether a tile is seen from another: the line between them meets no tile that is raised and
 * stands at least as high as the tile it is seen from. A line running along the edge two tiles
 * share has two ways to go, and either one clear is enough.
 */
function seenFrom(
  catalogue: MapContent,
  beside: TilesBeside,
  from: TileCoords,
  to: TileCoords,
): boolean {
  const standing = elevation(catalogue, beside(from)?.terrain);
  const clear = (way: 1 | -1): boolean =>
    between(from, to, way).every((coord) => {
      const crossed = elevation(catalogue, beside(coord)?.terrain);
      return crossed === 0 || crossed < standing;
    });
  return clear(1) || clear(-1);
}

/** What sees: the tile it sees from, and how far. */
type Watcher = { readonly from: TileCoords; readonly sight: number };

/** Every tile of the map the watcher sees added to `seen`, a tile `seen` already holds left unread. */
function watched(
  catalogue: MapContent,
  beside: TilesBeside,
  { from, sight }: Watcher,
  seen: Set<string>,
): Set<string> {
  for (const coord of discAround(from, sight)) {
    const key = tileKey(coord);
    if (seen.has(key) || beside(coord) === undefined) continue;
    if (seenFrom(catalogue, beside, from, coord)) seen.add(key);
  }
  return seen;
}

/** Every tile a unit sees with its own eyes from the tile it stands on, whatever else sees it. */
export function inOwnSight(
  catalogue: MapContent,
  tiles: readonly Tile[],
  watcher: Unit,
): ReadonlySet<string> {
  const seeing = { from: watcher.tile, sight: watcher.stats.sight };
  return watched(catalogue, tilesBeside(tiles), seeing, new Set());
}

function watchersOf(chronicle: Chronicle): Watcher[] {
  const watching =
    chronicle.city === undefined
      ? []
      : [{ from: chronicle.city, sight: chronicle.citySection.sight }];
  for (const unit of chronicle.units) {
    if (unit.faction === 'player') watching.push({ from: unit.tile, sight: unit.stats.sight });
  }
  return watching;
}

function sameTiles(one: readonly TileCoords[], other: readonly TileCoords[]): boolean {
  return (
    one === other ||
    (one.length === other.length && one.every((tile, at) => sameTile(tile, other[at])))
  );
}

/** Whether two chronicles agree on everything what is in sight is read off. */
function sameSight(was: Chronicle, now: Chronicle): boolean {
  if (was.tiles !== now.tiles || onSettlePhase(was) !== onSettlePhase(now)) return false;
  if (onSettlePhase(now)) return sameTiles(was.centre, now.centre);
  const watching = watchersOf(was);
  const watchers = watchersOf(now);
  return (
    sameTiles(was.held, now.held) &&
    watching.length === watchers.length &&
    watching.every(
      (watcher, at) =>
        watcher.sight === watchers[at].sight && sameTile(watcher.from, watchers[at].from),
    )
  );
}

/** What is in sight on a chronicle, the chronicle it answers for, and that one's tiles keyed. */
export type SightReading = {
  readonly chronicle: Chronicle;
  readonly beside: TilesBeside;
  readonly inSight: ReadonlySet<string>;
};

/**
 * What is in sight on the chronicle: the kept reading where the chronicle differs from the one it
 * answers for in nothing the sight reads, its tiles' lookup where they are the same tiles.
 */
export function sightReading(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kept?: SightReading,
): SightReading {
  if (kept?.chronicle === chronicle) return kept;
  if (kept !== undefined && sameSight(kept.chronicle, chronicle)) return { ...kept, chronicle };
  const beside =
    kept?.chronicle.tiles === chronicle.tiles ? kept.beside : tilesBeside(chronicle.tiles);
  if (onSettlePhase(chronicle)) {
    return { chronicle, beside, inSight: new Set(chronicle.centre.map(tileKey)) };
  }
  const seen = new Set(chronicle.held.map(tileKey));
  for (const watcher of watchersOf(chronicle)) watched(catalogue, beside, watcher, seen);
  return { chronicle, beside, inSight: seen };
}

export function inSight(catalogue: Catalogue, chronicle: Chronicle): ReadonlySet<string> {
  return sightReading(catalogue, chronicle).inSight;
}

/**
 * Whether a snapshot already records what the tile, the city holding it and whoever stands on it now
 * show. A tile whose layers did not change is the very object it was: every path that layers a tile
 * over rebuilds that one tile and leaves the others as they stand.
 */
function records(kept: Snapshot | undefined, snapshot: Snapshot): boolean {
  return (
    kept !== undefined &&
    kept.tile === snapshot.tile &&
    kept.holder === snapshot.holder &&
    kept.unit?.type === snapshot.unit?.type &&
    kept.unit?.faction === snapshot.unit?.faction &&
    kept.unit?.embarked === snapshot.unit?.embarked
  );
}

/**
 * The snapshot a tile is charted as: the tile as it stands, the city holding it, and the unit
 * standing on it, nobody where nobody stands and nobody where the unit is the player's own.
 */
function taken(chronicle: Chronicle, tile: Tile): Snapshot {
  const standing = unitAt(chronicle.units, tile);
  const at: Snapshot = { q: tile.q, r: tile.r, tile, holder: holderOf(chronicle, tile) };
  if (standing === undefined || standing.faction === 'player') return at;
  const { stats, faction, embarked } = standing;
  return { ...at, unit: { type: stats.type, faction, embarked } };
}

/** The chronicle with a snapshot taken of every tile in sight, as `chartedEach` takes them. */
export function charted(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  return chartedEach(chronicle, inSight(catalogue, chronicle));
}

/**
 * The chronicle with a snapshot taken of every tile of the map the keys name, over whatever it was
 * last seen as. A chronicle the snapshots already answer for is handed straight back, so a command
 * that charted nothing answers the very chronicle it was given.
 */
export function chartedEach(chronicle: Chronicle, named: ReadonlySet<string>): Chronicle {
  const kept = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  let charting = false;

  for (const tile of chronicle.tiles) {
    if (!named.has(tileKey(tile))) continue;
    const snapshot = taken(chronicle, tile);
    if (records(kept.get(tileKey(tile)), snapshot)) continue;
    kept.set(tileKey(tile), snapshot);
    charting = true;
  }

  return charting ? { ...chronicle, snapshots: [...kept.values()] } : chronicle;
}

/**
 * The chronicle with one tile charted, whatever sees it: its snapshot taken as the tile stands and
 * whoever stands on it, put where the tile had none and over the one it had. Nothing else changes,
 * so the tile is in fog from there on unless something sees it. A tile the map does not hold is
 * refused.
 */
export function chartedAt(catalogue: Catalogue, chronicle: Chronicle, at: TileCoords): Chronicle {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined)
    refuse(catalogue, `${tileKey(at)} was charted, a tile the map does not hold`);
  const key = tileKey(at);
  const kept = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  const snapshot = taken(chronicle, tile);
  if (records(kept.get(key), snapshot)) return chronicle;
  kept.set(key, snapshot);
  return { ...chronicle, snapshots: [...kept.values()] };
}

/**
 * Each snapshot keeps the very tile object it held: `records` compares tiles by identity, and a
 * rebuilt tile would be charted anew on every tile in sight.
 */
export function unitsGone(snapshots: Snapshot[]): Snapshot[] {
  if (snapshots.every((snapshot) => snapshot.unit === undefined)) return snapshots;
  return snapshots.map(({ unit, ...kept }) => kept);
}
