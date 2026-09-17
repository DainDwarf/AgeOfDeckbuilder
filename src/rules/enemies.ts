import { type Catalogue, entered, unitKind } from './catalogue';
import { CENTRE, distance, groundRunsTo, type Tile, type TileCoords, tileKey } from './map';
import { refuse } from './map-kinds';
import { nextRng } from './rng';
import type { Chronicle } from './state';
import { standsOn, unitAt } from './units';

export function campUnitEntered(
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

export function enteredAround(
  catalogue: Catalogue,
  chronicle: Chronicle,
  entry: TileCoords,
  enemies: number,
): Chronicle {
  const ground = raidGround(catalogue, chronicle);
  let standing = chronicle;
  for (let enemy = 0; enemy < enemies; enemy++) {
    const free = ground.filter((tile) => unitAt(standing.units, tile) === undefined);
    if (free.length === 0) break;
    const nearest = Math.min(...free.map((tile) => distance(tile, entry)));
    const equal = free.filter((tile) => distance(tile, entry) === nearest);

    const step = nextRng(standing.rng);
    const { q, r } = equal[Math.floor(step.value * equal.length)];
    standing = campUnitEntered(catalogue, { ...standing, rng: step.rng }, { q, r });
  }
  return standing;
}

export function raidEntry(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly entry: TileCoords; readonly chronicle: Chronicle } | undefined {
  const ground = raidGround(catalogue, chronicle);
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
