import { CITY_TILE, generateMap, neighbours, type Tile, type TileCoords } from './map';
import type { Rng } from './rng';
import { seedRng } from './rng';

/** Everything one city's story is made of, and the generator every later draw comes from. */
export type Chronicle = {
  readonly seed: number;
  readonly rng: Rng;
  readonly tiles: Tile[];
  readonly city: TileCoords;
  readonly held: TileCoords[];
};

/** The founding: the seed generates the map, and the city holds its tile and the six around it. */
export function beginChronicle(seed: number): Chronicle {
  const { rng, tiles } = generateMap(seedRng(seed));
  return {
    seed,
    rng,
    tiles,
    city: CITY_TILE,
    held: [CITY_TILE, ...neighbours(CITY_TILE)],
  };
}
