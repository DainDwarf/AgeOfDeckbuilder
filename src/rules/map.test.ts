import { expect, test } from 'vitest';
import {
  BIOME_TERRAINS,
  CITY_TERRAIN,
  CITY_TILE,
  FEATURES,
  generateMap,
  MAP_COMPOSITION,
  type Tile,
  tileKey,
} from './map';
import { seedRng } from './rng';

const SEEDS = [0, 1, 1234, 0xdeadbeef | 0, 424242];

function mapOf(seed: number): Tile[] {
  return generateMap(seedRng(seed)).tiles;
}

function at(tiles: Tile[], { q, r }: { q: number; r: number }): Tile | undefined {
  return tiles.find((tile) => tile.q === q && tile.r === r);
}

test('the same seed generates the same map', () => {
  for (const seed of SEEDS) expect(mapOf(seed)).toEqual(mapOf(seed));
});

test('different seeds generate different maps', () => {
  expect(mapOf(1234)).not.toEqual(mapOf(1235));
});

test('a map survives JSON and comes back the same', () => {
  const tiles = mapOf(1234);
  expect(JSON.parse(JSON.stringify(tiles))).toEqual(tiles);
});

test('the map is a hexagonal disc around the city, every tile once', () => {
  const { radius } = MAP_COMPOSITION;
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    expect(tiles).toHaveLength(3 * radius * radius + 3 * radius + 1);
    expect(new Set(tiles.map(({ q, r }) => `${q},${r}`)).size).toBe(tiles.length);
    for (const { q, r } of tiles) {
      expect(Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))).toBeLessThanOrEqual(radius);
    }
  }
});

test('the city stands on its tile', () => {
  for (const seed of SEEDS) expect(at(mapOf(seed), CITY_TILE)?.terrain).toBe(CITY_TERRAIN);
});

test('every tile carries a terrain one of the biomes can scatter', () => {
  const known = new Set<string>([CITY_TERRAIN]);
  for (const table of Object.values(BIOME_TERRAINS)) {
    for (const terrain of Object.keys(table)) known.add(terrain);
  }
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) expect(known).toContain(tile.terrain);
  }
});

test('every map has water, because sea is dealt and never diced', () => {
  for (const seed of SEEDS) {
    expect(mapOf(seed).some((tile) => tile.terrain === 'water')).toBe(true);
  }
});

test('every map is dealt a share of every feature, so none of them is ever missing', () => {
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    for (const { feature } of MAP_COMPOSITION.featureShares) {
      expect(tiles.some((tile) => tile.feature === feature)).toBe(true);
    }
  }
});

test("a feature lies on the terrain it belongs to, and never on the city's tile", () => {
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) {
      if (tile.feature === undefined) continue;
      expect(tile.terrain).toBe(FEATURES[tile.feature].terrain);
      expect(tileKey(tile)).not.toBe(tileKey(CITY_TILE));
    }
  }
});

test('the generator improves nothing: every tile of a fresh map is bare of improvements', () => {
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) expect(tile.improvements).toEqual([]);
  }
});
