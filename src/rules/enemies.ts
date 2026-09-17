import { type Catalogue, entered, unitKind } from './catalogue';
import {
  CENTRE,
  distance,
  MOVE_POINT,
  pathCosts,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { refuse } from './map-kinds';
import { nextRng } from './rng';
import type { Chronicle } from './state';
import { standsOn, unitAt } from './units';

/** The one enemy a camp enters, on the camp's own tile: the unit and script the catalogue names. */
export function enteredOnCamp(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Chronicle {
  return entered(catalogue, chronicle, {
    type: catalogue.camp.unit,
    faction: 'enemy',
    tile,
    script: catalogue.camp.script,
  });
}

/** The tiles the ground runs to the city from, keyed by `tileKey`, whoever stands on them. */
export function groundToCity(
  catalogue: Catalogue,
  chronicle: Chronicle,
  city: TileCoords,
): ReadonlySet<string> {
  // Only which tiles the walk reached is read here, never what reaching them cost, so the move a
  // crossing is charged against shows nowhere.
  const reached = pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    city,
    { kind: 'whole-map', move: MOVE_POINT },
    () => false,
  );
  return new Set(reached.keys());
}

/**
 * The tiles a raid's enemy may enter on, a unit standing there or not: the camp's unit stands on it,
 * the ground runs from it to the city, and it is not the city's tile. A city standing nowhere is
 * refused.
 */
function raidGround(catalogue: Catalogue, chronicle: Chronicle): Tile[] {
  const { city } = chronicle;
  if (city === undefined) refuse(catalogue, 'a raid landed while the city stands nowhere');
  const reached = groundToCity(catalogue, chronicle, city);
  const stats = unitKind(catalogue, catalogue.camp.unit);
  return chronicle.tiles.filter(
    (tile) =>
      standsOn(catalogue, stats, tile) &&
      reached.has(tileKey(tile)) &&
      tileKey(tile) !== tileKey(city),
  );
}

/**
 * A raid of the camp's unit entering together on and around a tile, one enemy after another: each
 * on the nearest tile to it the raid may enter on and no unit stands on, drawn from the seeded
 * generator among tiles equally near, so the tile itself comes first where it is free. A raid larger
 * than the tiles left enters what it can, and draws nothing once none is left.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  door: TileCoords,
  enemies: number,
): Chronicle {
  const ground = raidGround(catalogue, chronicle);
  let standing = chronicle;
  for (let enemy = 0; enemy < enemies; enemy++) {
    const free = ground.filter((tile) => unitAt(standing.units, tile) === undefined);
    if (free.length === 0) break;
    const nearest = Math.min(...free.map((tile) => distance(tile, door)));
    const equal = free.filter((tile) => distance(tile, door) === nearest);

    const step = nextRng(standing.rng);
    const { q, r } = equal[Math.floor(step.value * equal.length)];
    standing = entered(
      catalogue,
      { ...standing, rng: step.rng },
      {
        type: catalogue.camp.unit,
        faction: 'enemy',
        tile: { q, r },
        script: catalogue.camp.script,
      },
    );
  }
  return standing;
}

/**
 * The door a raid enters through, drawn from the seeded generator in two steps: a camp still standing
 * at the catalogue's raid odds and the outer ring otherwise, then one of that side's doors uniformly.
 * The outer ring's doors are the tiles farthest from the disc's centre a raid may enter on. Where the
 * side drawn holds no door the other side's are drawn from without a second roll of the odds; where
 * neither holds one there is no door and nothing is drawn.
 */
export function raidDoor(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly door: TileCoords; readonly chronicle: Chronicle } | undefined {
  const ground = raidGround(catalogue, chronicle);
  const camps = chronicle.tiles.filter((tile) => tile.building === catalogue.camp.building);
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, CENTRE)));
  const ring = ground.filter((tile) => distance(tile, CENTRE) === edge);
  if (camps.length === 0 && ring.length === 0) return undefined;

  const side = nextRng(chronicle.rng);
  const drawn = side.value < catalogue.camp.raidOdds ? camps : ring;
  const doors = drawn.length > 0 ? drawn : drawn === camps ? ring : camps;
  const which = nextRng(side.rng);
  const { q, r } = doors[Math.floor(which.value * doors.length)];
  return { door: { q, r }, chronicle: { ...chronicle, rng: which.rng } };
}
