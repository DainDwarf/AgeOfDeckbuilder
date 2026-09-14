import type { Catalogue } from './catalogue';
import { distance, elevation, type Terrain, type TileCoords, tileKey } from './map';
import type { Chronicle, Snapshot } from './state';
import { unitAt } from './units';

/** How far the city sees, the way a unit sees on its own sight. */
export const CITY_SIGHT = 2;

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
 * The tiles the city and the units of the player's see, by their keys: every tile the city holds,
 * and every tile within a sight of theirs that a line over the ground reaches. The one answer to
 * what is in sight.
 */
export function inSight(catalogue: Catalogue, chronicle: Chronicle): ReadonlySet<string> {
  const terrains = new Map(chronicle.tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const seen = new Set(chronicle.held.map(tileKey));

  const watching = [{ from: chronicle.city, sight: CITY_SIGHT }];
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
function records(snapshot: Snapshot | undefined, taken: Snapshot): boolean {
  return (
    snapshot !== undefined &&
    snapshot.tile === taken.tile &&
    snapshot.unit?.type === taken.unit?.type &&
    snapshot.unit?.faction === taken.unit?.faction
  );
}

/**
 * The chronicle with a snapshot taken of every tile in sight, over whatever it was last seen as:
 * the one place the map is charted, and every stage a command resolves as goes through it. A tile
 * in sight with nobody on it is recorded with nobody on it, and a unit of the player's is never
 * recorded at all. A chronicle the snapshots already answer for is handed straight back, so a
 * command that charted nothing answers the very chronicle it was given.
 */
export function charted(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const seen = inSight(catalogue, chronicle);
  const kept = new Map(chronicle.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  let charting = false;

  for (const tile of chronicle.tiles) {
    if (!seen.has(tileKey(tile))) continue;
    const standing = unitAt(chronicle.units, tile);
    const at: Snapshot = { q: tile.q, r: tile.r, tile };
    const taken: Snapshot =
      standing === undefined || standing.faction === 'player'
        ? at
        : { ...at, unit: { type: standing.stats.type, faction: standing.faction } };
    if (records(kept.get(tileKey(tile)), taken)) continue;
    kept.set(tileKey(tile), taken);
    charting = true;
  }

  return charting ? { ...chronicle, snapshots: [...kept.values()] } : chronicle;
}
