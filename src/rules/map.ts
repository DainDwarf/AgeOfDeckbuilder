import type { Resource, Resources } from './chronicle';
import { nextRng, type Rng, shuffle } from './rng';

const LAND_TERRAINS = { plain: 0.55, forest: 0.25, hills: 0.2 } as const;

/**
 * What each biome is made of: the terrain its origin tile is outright, the weighted table its
 * interior tiles scatter from, the table the tiles on its rim draw from instead, and the weight of
 * each edge width in tiles, no edge at all first. Land edges on nothing: its widths make every one
 * of its tiles interior, and its edge table is its interior one.
 */
export const BIOMES = {
  land: { origin: 'plain', interior: LAND_TERRAINS, edge: LAND_TERRAINS, edgeWidths: [1] },
  sea: {
    origin: 'deep',
    interior: { deep: 0.92, plain: 0.08 },
    edge: { coast: 1 },
    edgeWidths: [0.2, 0.5, 0.3],
  },
  mountain: {
    origin: 'mountain',
    interior: { mountain: 0.7, hills: 0.3 },
    edge: { hills: 1 },
    edgeWidths: [0.4, 0.6],
  },
} as const satisfies Record<
  string,
  {
    origin: string;
    interior: Readonly<Record<string, number>>;
    edge: Readonly<Record<string, number>>;
    edgeWidths: readonly number[];
  }
>;

export type Biome = keyof typeof BIOMES;

export const CITY_TERRAIN = 'urban';

export type Terrain =
  | {
      [B in Biome]:
        | (typeof BIOMES)[B]['origin']
        | keyof (typeof BIOMES)[B]['interior']
        | keyof (typeof BIOMES)[B]['edge'];
    }[Biome]
  | typeof CITY_TERRAIN;

/** What one tile of each terrain yields at income. */
export const TERRAIN_YIELDS: Record<Terrain, Partial<Resources>> = {
  plain: { food: 2 },
  forest: { food: 1, production: 1 },
  hills: { production: 2 },
  mountain: { production: 1 },
  coast: { food: 1, money: 1 },
  deep: { food: 1 },
  urban: { production: 1, military: 1, money: 1, science: 1, culture: 1 },
};

/** Which terrains a unit crosses and stands on, terrain by terrain. */
const TERRAIN_PASSABLE: Record<Terrain, boolean> = {
  plain: true,
  forest: true,
  hills: true,
  mountain: false,
  coast: false,
  deep: false,
  urban: true,
};

/** Whether a unit can cross a terrain: the one answer every path over the map asks. Off the map is not. */
export function passable(terrain: Terrain | undefined): boolean {
  return terrain !== undefined && TERRAIN_PASSABLE[terrain];
}

/** `PH_` marks a stand-in: none of these is authored content, and all of them go. */
export type BuildingTypeId = 'PH_City' | 'PH_Farm';
export type FeatureId = 'PH_Fertile';
export type ImprovementId = 'PH_Mine';

/** What a building of each kind stands on, and what it yields at income on top of that terrain. */
export const BUILDINGS: Record<
  BuildingTypeId,
  { readonly terrain: Terrain; readonly yields: Partial<Resources> }
> = {
  PH_City: { terrain: 'urban', yields: {} },
  PH_Farm: { terrain: 'plain', yields: { food: 1 } },
};

/** What a feature of each kind lies on, and what it yields at income on top of that terrain. */
export const FEATURES: Record<
  FeatureId,
  { readonly terrain: Terrain; readonly yields: Partial<Resources> }
> = {
  PH_Fertile: { terrain: 'plain', yields: { food: 1 } },
};

/** What terrain an improvement of each kind goes on, and what it yields at income on top of it. */
export const IMPROVEMENTS: Record<
  ImprovementId,
  { readonly terrain: Terrain; readonly yields: Partial<Resources> }
> = {
  PH_Mine: { terrain: 'hills', yields: { production: 1 } },
};

/** How many biomes the map is cut into, which kinds they are dealt, and which features follow. */
export const MAP_COMPOSITION = {
  radius: 8,
  tilesPerBiome: 26,
  minBiomes: 5,
  cityBiome: 'land',
  biomeShares: [
    { biome: 'sea', share: 0.3 },
    { biome: 'mountain', share: 0.1 },
  ],
  featureShares: [{ feature: 'PH_Fertile', share: 1 / 6 }],
} satisfies {
  radius: number;
  tilesPerBiome: number;
  minBiomes: number;
  cityBiome: Biome;
  biomeShares: { biome: Biome; share: number }[];
  featureShares: { feature: FeatureId; share: number }[];
};

export type TileCoords = { readonly q: number; readonly r: number };

/**
 * A tile is its layers: the terrain it is made of, the one feature the generator may have put on
 * it, the improvements it has been improved with — distinct ones, never the same twice — and the
 * one building slot it offers.
 */
export type Tile = TileCoords & {
  readonly terrain: Terrain;
  readonly feature?: FeatureId;
  readonly improvements: readonly ImprovementId[];
  readonly building?: BuildingTypeId;
};

export const CITY_TILE: TileCoords = { q: 0, r: 0 };

/**
 * What a tile's layers give at income, resource by resource: the one answer income and the yield
 * overlay both read. A resource left out is none of it.
 */
export function tileYield(tile: Tile): Partial<Resources> {
  const summed: Partial<Resources> = { ...TERRAIN_YIELDS[tile.terrain] };
  const add = (yields: Partial<Resources>): void => {
    for (const [resource, amount] of Object.entries(yields) as [Resource, number][]) {
      summed[resource] = (summed[resource] ?? 0) + amount;
    }
  };
  if (tile.feature !== undefined) add(FEATURES[tile.feature].yields);
  for (const improvement of tile.improvements) add(IMPROVEMENTS[improvement].yields);
  if (tile.building !== undefined) add(BUILDINGS[tile.building].yields);
  return summed;
}

const DIRECTIONS: readonly TileCoords[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/** The six tiles touching this one, on the map or not. */
export function neighbours({ q, r }: TileCoords): TileCoords[] {
  return DIRECTIONS.map((step) => ({ q: q + step.q, r: r + step.r }));
}

/** How many tiles apart two are, in a straight line over whatever lies between them. */
export function distance(a: TileCoords, b: TileCoords): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - (b.q + b.r))) / 2;
}

/** The tile at a position, if the map reaches that far. */
export function tileAt(tiles: readonly Tile[], coord: TileCoords): Tile | undefined {
  return tiles.find((tile) => tile.q === coord.q && tile.r === coord.r);
}

/** The one way a tile is named in a set or a map keyed by position. */
export function tileKey({ q, r }: TileCoords): string {
  return `${q},${r}`;
}

/** The one weighted draw of the generator: one roll of the seeded generator over the weights given. */
function pickWeighted<T>(
  rng: Rng,
  entries: readonly (readonly [T, number])[],
): { rng: Rng; picked: T } {
  const step = nextRng(rng);
  let roll = step.value * entries.reduce((total, [, weight]) => total + weight, 0);
  let picked = entries[entries.length - 1][0];
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll < 0) {
      picked = id;
      break;
    }
  }
  return { rng: step.rng, picked };
}

function pickTerrain(
  rng: Rng,
  table: Readonly<Record<string, number>>,
): { rng: Rng; picked: Terrain } {
  return pickWeighted(rng, Object.entries(table) as [Terrain, number][]);
}

/**
 * The map of a chronicle: a hexagonal disc of tiles in axial coordinates, the city at its centre,
 * generated in four layers: biomes spread from their origins, an edge marked around every biome
 * that touches a biome of another kind, a terrain scattered from each biome's table — the edge one
 * where the edge reaches — and each feature dealt over a share of the terrain it lies on.
 */
export function generateMap(initial: Rng): { rng: Rng; tiles: Tile[] } {
  const { radius, tilesPerBiome, minBiomes, cityBiome, biomeShares, featureShares } =
    MAP_COMPOSITION;
  let rng = initial;

  const coords: TileCoords[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      coords.push({ q, r });
    }
  }
  const indexOf = new Map(coords.map((coord, index) => [tileKey(coord), index]));
  const cityIndex = coords.findIndex((coord) => tileKey(coord) === tileKey(CITY_TILE));

  const tileBiomes: Biome[] = new Array(coords.length);
  const assigned = new Set<number>();
  const growing: number[] = [];
  const spread = (index: number, biome: Biome): void => {
    tileBiomes[index] = biome;
    assigned.add(index);
    growing.push(index);
  };

  const scattered = shuffle(
    rng,
    coords.map((_, index) => index).filter((index) => index !== cityIndex),
  );
  rng = scattered.rng;
  const elsewhere = scattered.items;

  const biomeCount = Math.max(minBiomes, Math.round(coords.length / tilesPerBiome));
  const dealt: Biome[] = [];
  for (const { biome, share } of biomeShares) {
    const quota = Math.min(Math.round((biomeCount - 1) * share), biomeCount - 1 - dealt.length);
    for (let i = 0; i < quota; i++) dealt.push(biome);
  }
  while (dealt.length < biomeCount - 1) dealt.push(cityBiome);

  const origins = new Set<number>([cityIndex]);
  spread(cityIndex, cityBiome);
  for (let i = 0; i < dealt.length; i++) {
    origins.add(elsewhere[i]);
    spread(elsewhere[i], dealt[i]);
  }

  while (growing.length > 0) {
    const step = nextRng(rng);
    rng = step.rng;
    const slot = Math.floor(step.value * growing.length);
    const from = growing[slot];
    const open = neighbours(coords[from])
      .map((coord) => indexOf.get(tileKey(coord)))
      .filter((index): index is number => index !== undefined && !assigned.has(index));
    if (open.length === 0) {
      growing.splice(slot, 1);
      continue;
    }
    const target = nextRng(rng);
    rng = target.rng;
    spread(open[Math.floor(target.value * open.length)], tileBiomes[from]);
  }

  const edged = new Set<number>();
  for (let index = 0; index < coords.length; index++) {
    const biome = tileBiomes[index];
    const onRim = neighbours(coords[index]).some((coord) => {
      const neighbour = indexOf.get(tileKey(coord));
      return neighbour !== undefined && tileBiomes[neighbour] !== biome;
    });
    if (!onRim) continue;
    const roll = pickWeighted(
      rng,
      BIOMES[biome].edgeWidths.map((weight, width) => [width, weight] as const),
    );
    rng = roll.rng;
    for (let reached = 0; reached < coords.length; reached++) {
      if (tileBiomes[reached] !== biome) continue;
      if (distance(coords[index], coords[reached]) < roll.picked) edged.add(reached);
    }
  }

  const terrains: Terrain[] = new Array(coords.length);
  for (let index = 0; index < coords.length; index++) {
    const biome = BIOMES[tileBiomes[index]];
    if (origins.has(index)) {
      terrains[index] = biome.origin;
      continue;
    }
    const step = pickTerrain(rng, edged.has(index) ? biome.edge : biome.interior);
    rng = step.rng;
    terrains[index] = step.picked;
  }
  terrains[cityIndex] = CITY_TERRAIN;

  const features: (FeatureId | undefined)[] = new Array(coords.length);
  for (const { feature, share } of featureShares) {
    const eligible = coords
      .map((_, index) => index)
      .filter(
        (index) =>
          index !== cityIndex &&
          features[index] === undefined &&
          terrains[index] === FEATURES[feature].terrain,
      );
    const order = shuffle(rng, eligible);
    rng = order.rng;
    for (const index of order.items.slice(0, Math.round(share * eligible.length))) {
      features[index] = feature;
    }
  }

  return {
    rng,
    tiles: coords.map(({ q, r }, index) => ({
      q,
      r,
      terrain: terrains[index],
      feature: features[index],
      improvements: [],
    })),
  };
}
