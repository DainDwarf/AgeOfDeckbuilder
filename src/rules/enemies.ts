import { type CampScript, type Catalogue, type Entering, entered, unitKind } from './catalogue';
import { CENTRE, distance, groundRunsTo, type Tile, type TileCoords, tileKey } from './map';
import { refuse } from './map-kinds';
import { nextRng } from './rng';
import { change, followed, type Landed, landedAs, unchanged } from './stages';
import type { Chronicle } from './state';
import { standsOn, unitAt } from './units';

/** The camp's unit, entering on the tile with the script the camp names for it. */
export function campUnit(catalogue: Catalogue, tile: TileCoords, script: CampScript): Entering {
  return {
    type: catalogue.camp.unit,
    faction: 'enemy',
    tile,
    script: catalogue.camp.scripts[script],
  };
}

function raidGround(catalogue: Catalogue, chronicle: Chronicle): Tile[] {
  const { city } = chronicle;
  if (city === undefined) refuse(catalogue, 'a raid landed while the city stands nowhere');
  const reached = groundRunsTo(catalogue, chronicle.tiles, chronicle.rivers, city);
  const stats = unitKind(catalogue, catalogue.camp.unit);
  return chronicle.tiles.filter(
    (tile) =>
      standsOn(catalogue, stats, tile) &&
      reached.has(tileKey(tile)) &&
      tileKey(tile) !== tileKey(city),
  );
}

/**
 * That many of the camp's unit entering around the tile with the script named, each on the nearest
 * free tile of the raid's ground, ties drawn from the generator and nothing drawn where one tile is
 * nearest; where none is free, the ones left enter nowhere. A count of none or fewer draws nothing
 * and is a `runtime-error`.
 */
export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entry: TileCoords,
  enemies: number,
  script: CampScript,
): Landed {
  if (enemies <= 0) return landedAs(change('runtime-error', chronicle));
  const ground = raidGround(catalogue, chronicle);
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
        campUnit(catalogue, { q, r }, script),
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
  const camps = chronicle.tiles.filter((tile) => tile.building === catalogue.camp.building);
  // The chronicle holds no radius: the disc's edge is read off its tiles, which the generator deals
  // around `CENTRE`.
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, CENTRE)));
  const ring = ground.filter((tile) => distance(tile, CENTRE) === edge);
  if (camps.length === 0 && ring.length === 0) return undefined;

  const side = nextRng(chronicle.rng);
  const drawn = side.value < catalogue.camp.raidCampOdds ? camps : ring;
  const entries = drawn.length > 0 ? drawn : drawn === camps ? ring : camps;
  const which = nextRng(side.rng);
  const { q, r } = entries[Math.floor(which.value * entries.length)];
  return { entry: { q, r }, chronicle: { ...chronicle, rng: which.rng } };
}
