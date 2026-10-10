import { expect, test } from 'vitest';
import { ageOf, catalogued } from './catalogue';
import {
  AGE,
  agesOver,
  CAMP,
  CATALOGUE,
  CLEARING,
  changed,
  deepBut,
  madeOf,
  NEUTRAL,
  only,
  REGION,
  REGIONS,
  riverBetween,
  SITE,
  SITES,
} from './fixtures';
import {
  CENTRE,
  type Corner,
  cornerKey,
  dealtBiomes,
  distance,
  generateMap,
  type HexMap,
  MOVE_POINT,
  neighbours,
  type River,
  riversAlong,
  routesFrom,
  routesToward,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesAtCorner,
  tilesOfEdge,
  water,
  wholeMove,
} from './map';
import {
  type BiomeShare,
  biomeKind,
  buildingKind,
  featureKind,
  type MapAge,
  type MapContent,
  regionOf,
} from './map-kinds';
import { seedRng } from './rng';

const SEEDS = [0, 1, 1234, 0xdeadbeef | 0, 424242];

/** What the age every map here is dealt in owns. */
const OWNS = ageOf(CATALOGUE, AGE);

/** The composition every map here is dealt from. */
const DISC = regionOf(CATALOGUE, OWNS, REGION);

function mapOf(seed: number): Tile[] {
  return generateMap(CATALOGUE, OWNS, REGION, seedRng(seed)).tiles;
}

function riversOf(seed: number): River[] {
  return generateMap(CATALOGUE, OWNS, REGION, seedRng(seed)).rivers;
}

/** The camps a map was dealt, in the order its tiles list them. */
function campsOf(tiles: Tile[]): Tile[] {
  return tiles.filter((tile) => tile.building === CAMP.building);
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

/** The fixture's content as the catalogue builds it, its clearing grown at that compactness. */
function compacted(compactness: number): MapContent {
  const { clearing } = CATALOGUE.biomes;
  return catalogued(
    changed({ biomes: { ...CATALOGUE.biomes, clearing: { ...clearing, compactness } } }),
  );
}

/** How far the glades of the clearing region's maps lie from the centre, the clearing's origin, on the mean. */
function gladeReach(content: MapContent): number {
  const glades = SEEDS.flatMap(
    (seed) => generateMap(content, OWNS, CLEARING, seedRng(seed)).tiles,
  ).filter((tile) => tile.terrain === 'glade');
  return glades.reduce((total, glade) => total + distance(glade, CENTRE), 0) / glades.length;
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
    const { tiles, centre } = generateMap(CATALOGUE, OWNS, REGION, seedRng(seed));

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
    const { tiles } = generateMap(CATALOGUE, OWNS, CLEARING, seedRng(seed));
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
  };
  const hollowed = {
    ...OWNS,
    regions: {
      hollow: {
        ...regionOf(CATALOGUE, OWNS, CLEARING),
        radius: 1,
        tilesPerBiome: 7,
        biomeShares: [],
        camps: 0,
        neutralFromCentre: undefined,
      },
    },
  };

  for (const seed of SEEDS) {
    const { tiles } = generateMap(hollow, hollowed, 'hollow', seedRng(seed));

    expect(tiles.map((tile) => tile.terrain)).toEqual(Array(7).fill('glade'));
  }
});

test('a biome kind of a greater compactness grows rounder, its tiles nearer its origin', () => {
  expect(gladeReach(compacted(4))).toBeLessThan(gladeReach(compacted(0)));
});

test('a biome kind of a compactness below nought grows in arms, its tiles further from its origin than at nought', () => {
  expect(gladeReach(compacted(-3))).toBeGreaterThan(gladeReach(compacted(0)));
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
    SEEDS.flatMap((seed) => generateMap(content, OWNS, REGION, seedRng(seed)).tiles).filter(
      (tile) => water(content, tile.terrain),
    ).length;

  expect(waterOn(seaWeighing(4))).toBeGreaterThan(waterOn(seaWeighing(1 / 4)));
});

test('a biome a region keeps away from the seas lies further from the water than it does keeping away from nothing', () => {
  const sharing = (clearing: BiomeShare): MapAge => ({
    ...OWNS,
    regions: { glade: { ...DISC, biomeShares: [...DISC.biomeShares, clearing] } },
  });
  const shoreOf = (age: MapAge): number =>
    SEEDS.reduce((total, seed) => {
      const { tiles } = generateMap(CATALOGUE, age, 'glade', seedRng(seed));
      const wet = tiles.filter((tile) => water(CATALOGUE, tile.terrain));
      const glades = tiles.filter((tile) => tile.terrain === 'glade');
      return total + Math.min(...glades.flatMap((glade) => wet.map((at) => distance(glade, at))));
    }, 0);

  expect(
    shoreOf(sharing({ biome: 'clearing', share: 0.15, keepsAwayFrom: ['sea'] })),
  ).toBeGreaterThan(shoreOf(sharing({ biome: 'clearing', share: 0.15 })));
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

test('the generator places no improvement: every tile of a fresh map is bare of improvements', () => {
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

test('a region naming the neutral’s band deals its city on every map, within the band and where the ground runs to the centre, the camps and the sites keeping from it as from their own kind; a region naming none deals none', () => {
  const band = { least: 6, most: 7 };
  const banded: MapAge = { ...OWNS, regions: { [REGION]: { ...DISC, neutralFromCentre: band } } };
  const { campsApart, sitesApart } = DISC;
  for (let seed = 0; seed < 30; seed++) {
    const map = generateMap(CATALOGUE, banded, REGION, seedRng(seed));
    const walked = walkedFrom(map, CENTRE, false);
    const [city, ...others] = map.tiles.filter((tile) => tile.building === NEUTRAL);
    const sites = map.tiles.filter((tile) => tile.building === SITES[SITE].building);

    expect(others).toEqual([]);
    expect(walked.has(tileKey(city))).toBe(true);
    expect(distance(city, CENTRE)).toBeGreaterThanOrEqual(band.least);
    expect(distance(city, CENTRE)).toBeLessThanOrEqual(band.most);
    expect(campsOf(map.tiles)).toHaveLength(DISC.camps);
    for (const camp of campsOf(map.tiles)) {
      expect(distance(camp, city)).toBeGreaterThanOrEqual(campsApart);
    }
    for (const site of sites) expect(distance(site, city)).toBeGreaterThanOrEqual(sitesApart);
  }
  for (const seed of SEEDS) {
    expect(mapOf(seed).filter((tile) => tile.building === NEUTRAL)).toEqual([]);
  }
});

/** Every tile a walk over the whole map from the tile reaches, ashore or embarked. */
function walkedFrom(map: HexMap, from: TileCoords, embarked: boolean): Set<string> {
  const moves = embarked ? { embarked: MOVE_POINT } : { ashore: MOVE_POINT };
  const walked = routesFrom(CATALOGUE, map.tiles, map.rivers, from, embarked, moves);
  return new Set((embarked ? walked.embarked : walked.ashore).keys());
}

/** Every tile a unit comes to from the centre walking ashore and embarked by turns. */
function comesTo(map: HexMap): Set<string> {
  const reached = new Set([tileKey(CENTRE)]);
  const from: TileCoords[] = [CENTRE];
  const walked = { ashore: new Set<string>(), embarked: new Set<string>() };
  for (let at = 0; at < from.length; at++) {
    for (const embarked of [false, true]) {
      const done = embarked ? walked.embarked : walked.ashore;
      if (done.has(tileKey(from[at]))) continue;
      for (const key of walkedFrom(map, from[at], embarked)) {
        done.add(key);
        if (reached.has(key)) continue;
        reached.add(key);
        const [q, r] = key.split(',').map(Number);
        from.push({ q, r });
      }
    }
  }
  return reached;
}

test('a camp stands where the ground runs to the centre, never across the water', () => {
  for (const seed of SEEDS) {
    const map = generateMap(CATALOGUE, OWNS, REGION, seedRng(seed));
    const walked = walkedFrom(map, CENTRE, false);
    for (const camp of campsOf(map.tiles)) expect(walked.has(tileKey(camp))).toBe(true);
  }
});

test('a camp across the water stands on any land a unit comes to from the centre, embarking where the ground ends, keeping its distances, and some stand where the ground does not run', () => {
  const across = agesOver({ ...CAMP, acrossWater: true }, REGIONS)[AGE];
  const { camps, campFromCentre, campsApart } = DISC;
  let island = 0;
  for (let seed = 0; seed < 30; seed++) {
    const map = generateMap(CATALOGUE, across, REGION, seedRng(seed));
    const reached = comesTo(map);
    const ashore = walkedFrom(map, CENTRE, false);
    const placed = campsOf(map.tiles);
    expect(placed).toHaveLength(camps);
    for (const camp of placed) {
      expect(reached.has(tileKey(camp))).toBe(true);
      expect(distance(camp, CENTRE)).toBeGreaterThanOrEqual(campFromCentre);
      for (const other of placed) {
        if (tileKey(other) === tileKey(camp)) continue;
        expect(distance(camp, other)).toBeGreaterThanOrEqual(campsApart);
      }
      if (!ashore.has(tileKey(camp))) island++;
    }
  }
  expect(island).toBeGreaterThan(0);
});

test('a walk over the whole map toward a tile weighs each step in moves: the movement cost of the tile it enters against the move it has there, ashore or embarked, and an embark, a disembark or a river crossing one whole move; a side whose move is none it never stands on', () => {
  const beyond = { q: -1, r: 0 };
  const shore = { q: 0, r: 1 };
  const island = { q: 3, r: 0 };
  const coast = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ];
  const land = [CENTRE, beyond, shore, island];
  const tiles = madeOf(deepBut(only(3, land), [...land, ...coast]), 'forest', [shore]);
  const rivers = [riverBetween(CENTRE, beyond)];
  const moves = { ashore: 2 * MOVE_POINT, embarked: 3 * MOVE_POINT };
  const move = wholeMove(moves);

  const toward = routesToward(CATALOGUE, tiles, rivers, CENTRE, false, moves);
  const ashoreOnly = routesToward(CATALOGUE, tiles, rivers, CENTRE, false, {
    ashore: moves.ashore,
    embarked: 0,
  });

  expect(Object.fromEntries(toward.ashore)).toEqual({
    '0,0': 0,
    '-1,0': move,
    '0,1': move / 2,
    '3,0': move + move / 3 + move,
  });
  expect(Object.fromEntries(toward.embarked)).toEqual({ '1,0': move, '2,0': move / 3 + move });
  expect(toward.next(island, false)).toEqual([{ tile: coast[1], embarked: true }]);
  expect(toward.next(coast[1], true)).toEqual([{ tile: coast[0], embarked: true }]);
  expect(toward.next(coast[0], true)).toEqual([{ tile: CENTRE, embarked: false }]);
  expect([...ashoreOnly.ashore.keys()].sort()).toEqual(['-1,0', '0,0', '0,1']);
  expect(ashoreOnly.embarked.size).toBe(0);
});

test('the generator fills a building slot with a camp or a site and with nothing else, on ground its building names', () => {
  const placed = [CAMP.building, ...DISC.sites.map((site) => OWNS.sites[site].building)];
  for (const seed of SEEDS) {
    for (const tile of mapOf(seed)) {
      if (tile.building === undefined) continue;
      expect(placed).toContain(tile.building);
      expect(buildingKind(CATALOGUE, tile.building).terrains).toContain(tile.terrain);
    }
  }
});

test('every map is dealt each of its sites once, where the ground runs to the centre, each keeping its distance from the centre and from the other sites, never on a camp and some beside one', () => {
  const sited: MapAge = {
    ...OWNS,
    sites: { ...OWNS.sites, PH_Field: { building: 'PH_Farm' } },
    regions: { [REGION]: { ...DISC, sites: [...DISC.sites, 'PH_Field'] } },
  };
  const { campsApart, siteFromCentre, sitesApart } = DISC;
  const buildings = Object.values(sited.sites).map(({ building }) => building);
  let beside = 0;
  for (let seed = 0; seed < 30; seed++) {
    const map = generateMap(CATALOGUE, sited, REGION, seedRng(seed));
    const walked = walkedFrom(map, CENTRE, false);
    const sites = map.tiles.filter((tile) => buildings.includes(tile.building ?? ''));
    const camps = campsOf(map.tiles);

    expect(sites.map((site) => site.building).sort()).toEqual([...buildings].sort());
    expect(camps).toHaveLength(DISC.camps);
    for (const site of sites) {
      expect(walked.has(tileKey(site))).toBe(true);
      expect(distance(site, CENTRE)).toBeGreaterThanOrEqual(siteFromCentre);
      for (const other of sites) {
        if (tileKey(other) === tileKey(site)) continue;
        expect(distance(site, other)).toBeGreaterThanOrEqual(sitesApart);
      }
      if (camps.some((camp) => distance(site, camp) < campsApart)) beside++;
    }
  }
  expect(beside).toBeGreaterThan(0);
});
