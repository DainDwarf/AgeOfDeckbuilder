import { expect, test } from 'vitest';
import { CATALOGUE, CLEARING, REGION } from './fixtures';
import {
  CENTRE,
  type Corner,
  cornerKey,
  dealtBiomes,
  distance,
  generateMap,
  MOVE_POINT,
  neighbours,
  pathCosts,
  type River,
  riversAlong,
  type Tile,
  tileAt,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
  water,
} from './map';
import { biomeKind, buildingKind, featureKind, type MapContent, regionOf } from './map-kinds';
import { seedRng } from './rng';

const SEEDS = [0, 1, 1234, 0xdeadbeef | 0, 424242];

/** The composition every map here is dealt from. */
const DISC = regionOf(CATALOGUE, REGION);

function mapOf(seed: number): Tile[] {
  return generateMap(CATALOGUE, REGION, seedRng(seed)).tiles;
}

function riversOf(seed: number): River[] {
  return generateMap(CATALOGUE, REGION, seedRng(seed)).rivers;
}

/** The camps a map was dealt, in the order its tiles list them. */
function campsOf(tiles: Tile[]): Tile[] {
  return tiles.filter((tile) => tile.building === CATALOGUE.camp.building);
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

/** The one way an edge is named here, the way its river runs it. */
function edgeKey({ from, to }: { from: Corner; to: Corner }): string {
  return `${cornerKey(from)}|${cornerKey(to)}`;
}

/** The tiles of a map so many steps from the centre: a stand-in for the tiles a chronicle has charted. */
function within(seed: number, steps: number): Set<string> {
  return new Set(
    mapOf(seed)
      .filter((tile) => distance(CENTRE, tile) <= steps)
      .map(tileKey),
  );
}

/** Whether the run is a stretch of the river, corner for corner, exactly as the river runs it. */
function stretchOf(river: River, run: River): boolean {
  return river.some((_, at) =>
    run.every(
      (corner, step) =>
        river[at + step] !== undefined && cornerKey(river[at + step]) === cornerKey(corner),
    ),
  );
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

test('the map is a hexagonal disc around its centre, every tile once', () => {
  const { radius } = DISC;
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    expect(tiles).toHaveLength(3 * radius * radius + 3 * radius + 1);
    expect(new Set(tiles.map(({ q, r }) => `${q},${r}`)).size).toBe(tiles.length);
    for (const { q, r } of tiles) {
      expect(Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))).toBeLessThanOrEqual(radius);
    }
  }
});

test('the generator puts urban on no tile, and the centre tile is its biome’s origin terrain', () => {
  const origin = biomeKind(CATALOGUE, DISC.centreBiome).origin;
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    expect(tiles.filter((tile) => tile.terrain === 'urban')).toEqual([]);
    expect(tileAt(tiles, CENTRE)?.terrain).toBe(origin);
  }
});

test('the map hands out its centre part: every tile within the region’s reach of the disc’s centre, and no other', () => {
  for (const seed of SEEDS) {
    const { tiles, centre } = generateMap(CATALOGUE, REGION, seedRng(seed));

    expect(centre.map(tileKey).sort()).toEqual(
      tiles
        .filter((tile) => distance(tile, CENTRE) <= DISC.centre)
        .map(tileKey)
        .sort(),
    );
  }
});

test('every tile carries a terrain one of the biomes can produce', () => {
  const known = new Set<string>();
  for (const biome of Object.values(CATALOGUE.biomes)) {
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

test('a biome dealt to a size holds at least that many tiles, and no more over it than the tiles it rings', () => {
  const { growth } = biomeKind(CATALOGUE, 'clearing');
  const size = growth.kind === 'size' ? growth.size : Number.NaN;
  for (const seed of SEEDS) {
    const { tiles } = generateMap(CATALOGUE, CLEARING, seedRng(seed));
    const glades = tiles.filter((tile) => tile.terrain === 'glade');
    const ringed = glades.filter((glade) =>
      neighbours(glade).every((coord) => {
        const beside = tileAt(tiles, coord);
        return beside === undefined || beside.terrain === 'glade';
      }),
    );

    expect(glades.length).toBeGreaterThanOrEqual(size);
    expect(glades.length - size).toBeLessThanOrEqual(ringed.length);
  }
});

test('a tile no biome reaches because a sized biome closed it off belongs to that biome', () => {
  const clearing = biomeKind(CATALOGUE, 'clearing');
  const hollow: MapContent = {
    ...CATALOGUE,
    biomes: { ...CATALOGUE.biomes, clearing: { ...clearing, growth: { kind: 'size', size: 6 } } },
    regions: {
      hollow: {
        ...regionOf(CATALOGUE, CLEARING),
        radius: 1,
        tilesPerBiome: 7,
        biomeShares: [],
        camps: 0,
      },
    },
  };

  for (const seed of SEEDS) {
    const { tiles } = generateMap(hollow, 'hollow', seedRng(seed));

    expect(tiles.map((tile) => tile.terrain)).toEqual(Array(7).fill('glade'));
  }
});

test('a biome kind of a greater compactness grows rounder, its tiles nearer its origin', () => {
  const compacted = (compactness: number): MapContent => ({
    ...CATALOGUE,
    biomes: { ...CATALOGUE.biomes, clearing: { ...CATALOGUE.biomes.clearing, compactness } },
  });
  const reachOf = (content: MapContent): number => {
    const glades = SEEDS.flatMap(
      (seed) => generateMap(content, CLEARING, seedRng(seed)).tiles,
    ).filter((tile) => tile.terrain === 'glade');
    return glades.reduce((total, glade) => total + distance(glade, CENTRE), 0) / glades.length;
  };

  expect(reachOf(compacted(4))).toBeLessThan(reachOf(compacted(0)));
});

test('a biome kind of a greater growth weight grows larger', () => {
  const seaWeighing = (weight: number): MapContent => ({
    ...CATALOGUE,
    biomes: {
      ...CATALOGUE.biomes,
      sea: { ...CATALOGUE.biomes.sea, growth: { kind: 'weight', weight } },
    },
  });
  const waterOn = (content: MapContent): number =>
    SEEDS.flatMap((seed) => generateMap(content, REGION, seedRng(seed)).tiles).filter((tile) =>
      water(content, tile.terrain),
    ).length;

  expect(waterOn(seaWeighing(4))).toBeGreaterThan(waterOn(seaWeighing(1 / 4)));
});

test('a sea is rimmed with coast, the terrain no biome scatters over its interior', () => {
  for (const seed of SEEDS) {
    expect(mapOf(seed).some((tile) => tile.terrain === 'coast')).toBe(true);
  }
});

test('every map is dealt a share of every feature, so none of them is ever missing', () => {
  for (const seed of SEEDS) {
    const tiles = mapOf(seed);
    for (const { feature } of DISC.featureShares) {
      expect(tiles.some((tile) => tile.feature === feature)).toBe(true);
    }
  }
});

test('a feature lies on the terrain it belongs to', () => {
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) {
      if (tile.feature === undefined) continue;
      expect(tile.terrain).toBe(featureKind(CATALOGUE, tile.feature).terrain);
    }
  }
});

test('the generator improves nothing: every tile of a fresh map is bare of improvements', () => {
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) expect(tile.improvements).toEqual([]);
  }
});

test('a range dealt clear of the water runs the two rivers it is worth, whole courses both', () => {
  const ranges = dealtBiomes(DISC).filter((biome) => biome === DISC.rivers.source).length;
  const rivers = riversOf(0);

  expect(rivers).toHaveLength(DISC.rivers.perRange * ranges);
  for (const river of rivers) {
    expect(edgesOf(river).length).toBeGreaterThanOrEqual(DISC.rivers.leastEdges);
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
      const sea = tilesOn(tiles, mouth).some((tile) => water(CATALOGUE, tile.terrain));
      expect(sea || met).toBe(true);
    }
  }
});

test('every river runs along at least six edges: a trickle is thrown away', () => {
  for (const seed of SEEDS) {
    for (const river of riversOf(seed)) {
      expect(edgesOf(river).length).toBeGreaterThanOrEqual(DISC.rivers.leastEdges);
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
        expect(count).toBeLessThanOrEqual(DISC.rivers.edgesPerTile);
      }
    }
  }
});

test('a map holds at most two rivers for every mountain range it is dealt', () => {
  const ranges = dealtBiomes(DISC).filter((biome) => biome === DISC.rivers.source).length;
  for (const seed of SEEDS) {
    expect(riversOf(seed).length).toBeLessThanOrEqual(DISC.rivers.perRange * ranges);
  }
});

test('the same seed runs the same rivers, and a different seed runs others', () => {
  for (const seed of SEEDS) expect(riversOf(seed)).toEqual(riversOf(seed));
  expect(riversOf(1234)).not.toEqual(riversOf(1235));
});

test('a river runs along the tiles named exactly where an edge of it has one of them on a side', () => {
  for (const seed of SEEDS) {
    const near = within(seed, 3);
    const along = (edge: { from: Corner; to: Corner }): boolean =>
      tilesOfEdge(edge.from, edge.to).some((coord) => near.has(tileKey(coord)));

    const kept = new Set(riversAlong(riversOf(seed), near).flatMap(edgesOf).map(edgeKey));
    for (const river of riversOf(seed)) {
      for (const edge of edgesOf(river)) expect(kept.has(edgeKey(edge))).toBe(along(edge));
    }
    for (const run of riversAlong(riversOf(seed), near)) {
      expect(riversOf(seed).some((river) => stretchOf(river, run))).toBe(true);
    }
  }
});

test('a river running out of the tiles named and back answers as two runs, joined by nothing', () => {
  const river = riversOf(0)[0];
  const edges = edgesOf(river);
  const ends = new Set(
    [edges[0], edges[edges.length - 1]].flatMap(({ from, to }) =>
      tilesOfEdge(from, to).map(tileKey),
    ),
  );

  const runs = riversAlong([river], ends);

  expect(runs).toHaveLength(2);
  expect(runs[0][0]).toEqual(river[0]);
  expect(runs[1][runs[1].length - 1]).toEqual(river[river.length - 1]);
});

test('with every tile of the map named, the rivers answer whole', () => {
  for (const seed of SEEDS) {
    expect(riversAlong(riversOf(seed), new Set(mapOf(seed).map(tileKey)))).toEqual(riversOf(seed));
  }
});

test('with no tile named, no river answers at all', () => {
  for (const seed of SEEDS) expect(riversAlong(riversOf(seed), new Set())).toEqual([]);
});

test('the rivers of a map survive JSON and come back the same', () => {
  const rivers = riversOf(1234);
  expect(JSON.parse(JSON.stringify(rivers))).toEqual(rivers);
});

test('every map is dealt its camps, each keeping its distance from the centre and from the others', () => {
  const { camps, campFromCentre, campsApart } = DISC;
  for (const seed of SEEDS) {
    const placed = campsOf(mapOf(seed));
    expect(placed).toHaveLength(camps);
    for (const camp of placed) {
      expect(distance(camp, CENTRE)).toBeGreaterThanOrEqual(campFromCentre);
      for (const other of placed) {
        if (tileKey(other) === tileKey(camp)) continue;
        expect(distance(camp, other)).toBeGreaterThanOrEqual(campsApart);
      }
    }
  }
});

test('a camp stands where the ground runs to the centre, never across the water', () => {
  for (const seed of SEEDS) {
    const map = generateMap(CATALOGUE, REGION, seedRng(seed));
    const walked = pathCosts(
      CATALOGUE,
      map.tiles,
      map.rivers,
      CENTRE,
      { kind: 'whole-map', move: MOVE_POINT },
      () => false,
    );
    for (const camp of campsOf(map.tiles)) expect(walked.has(tileKey(camp))).toBe(true);
  }
});

test('the generator fills a building slot with a camp and with nothing else', () => {
  const ground = buildingKind(CATALOGUE, CATALOGUE.camp.building).terrains;
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) {
      if (tile.building === undefined) continue;
      expect(tile.building).toBe(CATALOGUE.camp.building);
      expect(ground).toContain(tile.terrain);
    }
  }
});
