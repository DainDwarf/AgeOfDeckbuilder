import type { Catalogue } from './catalogue';
import {
  distance,
  elevation,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { refuse } from './map-kinds';
import type { Chronicle, Snapshot } from './state';
import { unitAt } from './units';

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
  catalogue: Catalogue,
  terrains: ReadonlyMap<string, Terrain>,
  from: TileCoords,
  to: TileCoords,
): boolean {
  const standing = elevation(catalogue, terrains.get(tileKey(from)));
  const clear = (way: 1 | -1): boolean =>
    between(from, to, way).every((coord) => {
      const crossed = elevation(catalogue, terrains.get(tileKey(coord)));
      return crossed === 0 || crossed < standing;
    });
  return clear(1) || clear(-1);
}

/**
 * The tiles in sight, by their keys: on turn 0 the map's centre part and nothing else, since nothing
 * sees before turn 1; from turn 1 every tile the city holds, and every tile within a sight of the
 * city's, once it stands, or of a unit of the player's that a line over the ground reaches. The one
 * answer to what is in sight.
 */
export function inSight(catalogue: Catalogue, chronicle: Chronicle): ReadonlySet<string> {
  if (chronicle.turn === 0) return new Set(chronicle.centre.map(tileKey));
  const terrains = new Map(chronicle.tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const seen = new Set(chronicle.held.map(tileKey));

  const watching =
    chronicle.city === undefined ? [] : [{ from: chronicle.city, sight: catalogue.city.sight }];
  for (const unit of chronicle.units) {
    if (unit.faction === 'player') watching.push({ from: unit.tile, sight: unit.stats.sight });
  }

  for (const { from, sight } of watching) {
    for (const { q, r } of chronicle.tiles) {
      const coord = { q, r };
      if (seen.has(tileKey(coord)) || distance(from, coord) > sight) continue;
      if (seenFrom(catalogue, terrains, from, coord)) seen.add(tileKey(coord));
    }
  }

  return seen;
}

/**
 * Whether a snapshot already records what the tile and whoever stands on it now show. A tile whose
 * layers did not change is the very object it was: every path that layers a tile over rebuilds that
 * one tile and leaves the others as they stand.
 */
function records(kept: Snapshot | undefined, snapshot: Snapshot): boolean {
  return (
    kept !== undefined &&
    kept.tile === snapshot.tile &&
    kept.unit?.type === snapshot.unit?.type &&
    kept.unit?.faction === snapshot.unit?.faction
  );
}

/**
 * The snapshot a tile is charted as: the tile as it stands, with the unit standing on it, nobody
 * where nobody stands and nobody where the unit is the player's own.
 */
function taken(chronicle: Chronicle, tile: Tile): Snapshot {
  const standing = unitAt(chronicle.units, tile);
  const at: Snapshot = { q: tile.q, r: tile.r, tile };
  if (standing === undefined || standing.faction === 'player') return at;
  return { ...at, unit: { type: standing.stats.type, faction: standing.faction } };
}

/**
 * The chronicle with a snapshot taken of every tile in sight, over whatever it was last seen as:
 * the one place what is in sight is charted, and every stage a command resolves as goes through it.
 * A chronicle the snapshots already answer for is handed straight back, so a command that charted
 * nothing answers the very chronicle it was given.
 */
export function charted(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const seen = inSight(catalogue, chronicle);
  const kept = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  let charting = false;

  for (const tile of chronicle.tiles) {
    if (!seen.has(tileKey(tile))) continue;
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
  return snapshots.map(({ q, r, tile }) => ({ q, r, tile }));
}
