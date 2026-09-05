import { expect, test } from 'vitest';
import {
  BIOMES,
  CITY_TERRAIN,
  CITY_TILE,
  type Corner,
  cornerKey,
  dealtBiomes,
  FEATURES,
  generateMap,
  MAP_COMPOSITION,
  RIVER_FLOW,
  type River,
  type Tile,
  tileAt,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
  water,
} from './map';
import { seedRng } from './rng';

const SEEDS = [0, 1, 1234, 0xdeadbeef | 0, 424242];

function mapOf(seed: number): Tile[] {
  return generateMap(seedRng(seed)).tiles;
}

function riversOf(seed: number): River[] {
  return generateMap(seedRng(seed)).rivers;
}

function at(tiles: Tile[], { q, r }: { q: number; r: number }): Tile | undefined {
  return tiles.find((tile) => tile.q === q && tile.r === r);
}

/** The tiles of the map a corner is a corner of; a corner on the outer ring touches fewer than three. */
function tilesOn(tiles: Tile[], corner: Corner): Tile[] {
  return tilesAtCorner(corner).flatMap((coord) => {
    const tile = tileAt(tiles, coord);
    return tile === undefined ? [] : [tile];
  });
}

/** Every edge a river runs along: the pair of corners each one lies between. */
function edgesOf(river: River): { from: Corner; to: Corner }[] {
  return river.slice(1).map((to, index) => ({ from: river[index], to }));
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

test('every tile carries a terrain one of the biomes can produce', () => {
  const known = new Set<string>([CITY_TERRAIN]);
  for (const biome of Object.values(BIOMES)) {
    known.add(biome.origin);
    for (const terrain of Object.keys(biome.interior)) known.add(terrain);
    for (const terrain of Object.keys(biome.rim)) known.add(terrain);
  }
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) expect(known).toContain(tile.terrain);
  }
});

test('every map has deep water, because a sea is dealt and its origin is deep water outright', () => {
  for (const seed of SEEDS) {
    expect(mapOf(seed).some((tile) => tile.terrain === 'deep')).toBe(true);
  }
});

test('every map has mountain, because a range is dealt and its origin is mountain outright', () => {
  for (const seed of SEEDS) {
    expect(mapOf(seed).some((tile) => tile.terrain === 'mountain')).toBe(true);
  }
});

test('a sea is rimmed with coast, the terrain no biome scatters over its interior', () => {
  for (const seed of SEEDS) {
    expect(mapOf(seed).some((tile) => tile.terrain === 'coast')).toBe(true);
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

test('a range dealt clear of the water runs the two rivers it is worth, whole courses both', () => {
  const ranges = dealtBiomes().filter((biome) => biome === 'mountain').length;
  const rivers = riversOf(0);

  expect(rivers).toHaveLength(RIVER_FLOW.perRange * ranges);
  for (const river of rivers) {
    expect(edgesOf(river).length).toBeGreaterThanOrEqual(RIVER_FLOW.leastEdges);
  }
});

test('a river runs along edges, each one the line two tiles of the map share', () => {
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    for (const river of riversOf(seed)) {
      for (const { from, to } of edgesOf(river)) {
        const between = tilesOfEdge(from, to);
        expect(between).toHaveLength(2);
        for (const coord of between) expect(tileAt(tiles, coord)).toBeDefined();
      }
    }
  }
});

test('a river rises in a mountain range and ends at water or at another river', () => {
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    const rivers = riversOf(seed);
    for (const [index, river] of rivers.entries()) {
      const risen = tilesOn(tiles, river[0]).map((tile) => tile.terrain);
      expect(risen.some((terrain) => terrain === 'mountain' || terrain === 'hills')).toBe(true);

      const mouth = river[river.length - 1];
      const met = rivers.some(
        (other, at) =>
          at !== index && other.some((corner) => cornerKey(corner) === cornerKey(mouth)),
      );
      const sea = tilesOn(tiles, mouth).some((tile) => water(tile.terrain));
      expect(sea || met).toBe(true);
    }
  }
});

test('every river runs along at least six edges: a trickle is thrown away', () => {
  for (const seed of SEEDS) {
    for (const river of riversOf(seed)) {
      expect(edgesOf(river).length).toBeGreaterThanOrEqual(RIVER_FLOW.leastEdges);
    }
  }
});

test('a river runs along no more than four edges of any one tile, so it never rings one', () => {
  for (const seed of SEEDS) {
    for (const river of riversOf(seed)) {
      const along = new Map<string, number>();
      for (const { from, to } of edgesOf(river)) {
        for (const coord of tilesOfEdge(from, to)) {
          along.set(tileKey(coord), (along.get(tileKey(coord)) ?? 0) + 1);
        }
      }
      for (const count of along.values()) {
        expect(count).toBeLessThanOrEqual(RIVER_FLOW.edgesPerTile);
      }
    }
  }
});

test('a map holds at most two rivers for every mountain range it is dealt', () => {
  const ranges = dealtBiomes().filter((biome) => biome === 'mountain').length;
  for (const seed of SEEDS) {
    expect(riversOf(seed).length).toBeLessThanOrEqual(RIVER_FLOW.perRange * ranges);
  }
});

test('the same seed runs the same rivers, and a different seed runs others', () => {
  for (const seed of SEEDS) expect(riversOf(seed)).toEqual(riversOf(seed));
  expect(riversOf(1234)).not.toEqual(riversOf(1235));
});

test('the rivers of a map survive JSON and come back the same', () => {
  const rivers = riversOf(1234);
  expect(JSON.parse(JSON.stringify(rivers))).toEqual(rivers);
});
