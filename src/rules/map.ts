import type { Resource, Resources } from './resources';
import { nextRng, type Rng, shuffle } from './rng';

const LAND_TERRAINS = { plain: 0.55, forest: 0.25, hills: 0.2 } as const;

/**
 * What each biome is made of: the terrain its origin tile is outright, the weighted table its
 * interior tiles scatter from, the table the tiles on its rim draw from instead, and the weight of
 * each rim width in tiles, no rim at all first. Land rims on nothing: its widths make every one of
 * its tiles interior, and its rim table is its interior one.
 */
export const BIOMES = {
  land: { origin: 'plain', interior: LAND_TERRAINS, rim: LAND_TERRAINS, rimWidths: [1] },
  sea: {
    origin: 'deep',
    interior: { deep: 0.92, plain: 0.08 },
    rim: { coast: 1 },
    rimWidths: [0.2, 0.5, 0.3],
  },
  mountain: {
    origin: 'mountain',
    interior: { mountain: 0.7, hills: 0.3 },
    rim: { hills: 1 },
    rimWidths: [0.4, 0.6],
  },
} as const satisfies Record<
  string,
  {
    origin: string;
    interior: Readonly<Record<string, number>>;
    rim: Readonly<Record<string, number>>;
    rimWidths: readonly number[];
  }
>;

export type Biome = keyof typeof BIOMES;

export const CITY_TERRAIN = 'urban';

export type Terrain =
  | {
      [B in Biome]:
        | (typeof BIOMES)[B]['origin']
        | keyof (typeof BIOMES)[B]['interior']
        | keyof (typeof BIOMES)[B]['rim'];
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

/** What a river adds to a tile it runs along, terrain by terrain: a terrain left out takes nothing. */
export const RIVER_YIELDS: Partial<Record<Terrain, Partial<Resources>>> = {
  plain: { food: 1 },
  forest: { food: 1 },
};

/** What entering a tile of each terrain costs, terrain by terrain; water names none. */
const TERRAIN_MOVEMENT_COST: Record<Terrain, number | undefined> = {
  plain: 1,
  forest: 2,
  hills: 2,
  mountain: 6,
  coast: undefined,
  deep: undefined,
  urban: 1,
};

/**
 * What entering a tile spends of a unit's move points: the one answer every path over the map asks.
 * Water names no movement cost and is crossed by nothing, and neither is a tile off the map.
 */
export function movementCost(tile: Tile | undefined): number | undefined {
  return tile === undefined ? undefined : TERRAIN_MOVEMENT_COST[tile.terrain];
}

/** Which terrains are water, terrain by terrain. */
const TERRAIN_WATER: Record<Terrain, boolean> = {
  plain: false,
  forest: false,
  hills: false,
  mountain: false,
  coast: true,
  deep: true,
  urban: false,
};

/** Whether a terrain is water: what a river runs to, and what height is measured from. */
export function water(terrain: Terrain | undefined): boolean {
  return terrain !== undefined && TERRAIN_WATER[terrain];
}

/** How high each terrain stands over the ground, terrain by terrain. */
const TERRAIN_ELEVATION: Record<Terrain, number> = {
  plain: 0,
  forest: 1,
  hills: 2,
  mountain: 3,
  coast: 0,
  deep: 0,
  urban: 0,
};

/** How high a terrain stands: what a unit sees over, and what stops it. Off the map is flat. */
export function elevation(terrain: Terrain | undefined): number {
  return terrain === undefined ? 0 : TERRAIN_ELEVATION[terrain];
}

/** How far each terrain stands over the water: what the river layer's relief multiplies. */
const TERRAIN_LIFT: Record<Terrain, number> = {
  plain: 0,
  forest: 0,
  hills: 1,
  mountain: 2,
  coast: 0,
  deep: 0,
  urban: 0,
};

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

/**
 * How the river layer runs. `relief`: how far a hills tile stands above its distance to water,
 * mountain twice that. `roughness`: the most a tile's rolled lift adds to its height. `meander`: an
 * edge's drop is weighted as exp(drop / meander), so a small value makes the steep way near-certain.
 * `curl`: what repeating the last turn multiplies an edge's weight by.
 */
export const RIVER_FLOW = {
  relief: 1.5,
  roughness: 0.5,
  perRange: 2,
  climb: 0.5,
  meander: 1.5,
  curl: 0.75,
  edgesPerTile: 4,
  leastEdges: 6,
  draws: 60,
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
 * What a tile's layers and the river running along it give at income, resource by resource: the one
 * answer income and the yield overlay both read. A resource left out is none of it.
 */
export function tileYield(tile: Tile, rivers: readonly River[]): Partial<Resources> {
  const summed: Partial<Resources> = { ...TERRAIN_YIELDS[tile.terrain] };
  const add = (yields: Partial<Resources>): void => {
    for (const [resource, amount] of Object.entries(yields) as [Resource, number][]) {
      summed[resource] = (summed[resource] ?? 0) + amount;
    }
  };
  if (tile.feature !== undefined) add(FEATURES[tile.feature].yields);
  for (const improvement of tile.improvements) add(IMPROVEMENTS[improvement].yields);
  if (tile.building !== undefined) add(BUILDINGS[tile.building].yields);
  if (runsAlong(rivers, tile)) add(RIVER_YIELDS[tile.terrain] ?? {});
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

/**
 * What bounds a walk over the map and what a step over a river edge costs it. `unit`: the move
 * points a unit has left, which a crossing spends every one of. `whole-map`: the walk a script reads
 * the whole map by, which nothing bounds and a crossing is charged a whole move.
 */
export type Walk =
  | { readonly kind: 'unit'; readonly points: number }
  | { readonly kind: 'whole-map'; readonly move: number };

/**
 * What a step to a neighbouring tile leaves the walk having spent, and nothing where the walk does
 * not take that step: entering a tile spends its movement cost, and a step over an edge a river runs
 * along spends every move point the unit has left, taken only where those cover the tile entered in
 * full. A walk over the whole map has no points to drain, so a crossing is charged a whole move.
 */
function spentOn(walk: Walk, paid: number, cost: number, river: boolean): number | undefined {
  switch (walk.kind) {
    case 'unit':
      if (river) return walk.points - paid >= cost ? walk.points : undefined;
      return paid + cost <= walk.points ? paid + cost : undefined;
    case 'whole-map':
      return paid + (river ? walk.move : cost);
  }
}

/**
 * What the cheapest route to each tile costs from a start, the start itself nothing: every step
 * spends what the walk says, and `shut` keeps a route off the tiles the mover may not cross for
 * reasons of its own. A tile no route reaches is absent from the answer, and so is every tile no
 * movement cost is named for.
 */
export function pathCosts(
  tiles: readonly Tile[],
  rivers: readonly River[],
  from: TileCoords,
  walk: Walk,
  shut: (coord: TileCoords) => boolean,
): Map<string, number> {
  const ground = new Map(tiles.map((tile) => [tileKey(tile), tile]));
  const crossings = riverEdges(rivers);
  const spent = new Map([[tileKey(from), 0]]);

  let front: [TileCoords, number][] = [[from, 0]];
  while (front.length > 0) {
    const next: [TileCoords, number][] = [];
    for (const [at, paid] of front) {
      // A tile the walk reached again for less stands on the front twice; the dearer one is dropped.
      if (spent.get(tileKey(at)) !== paid) continue;
      for (const coord of neighbours(at)) {
        const key = tileKey(coord);
        const cost = movementCost(ground.get(key));
        if (cost === undefined || shut(coord)) continue;
        const total = spentOn(walk, paid, cost, crossings.has(edgeKey(at, coord)));
        if (total === undefined) continue;
        const before = spent.get(key);
        if (before !== undefined && before <= total) continue;
        spent.set(key, total);
        next.push([coord, total]);
      }
    }
    front = next;
  }
  return spent;
}

/**
 * A point where three tiles meet, on a lattice of its own: a tile's middle is (2q + r, 3r) and each
 * of its six corners stands one step off that, so a corner has one identity however it is reached.
 * The line between two corners one step apart is an edge, the line two tiles share.
 */
export type Corner = { readonly x: number; readonly y: number };

/** A river: the corners it runs through in order, one edge between each pair of them. */
export type River = readonly Corner[];

/** The six arms of a tile's middle, in the order its faces turn: each corner stands one arm off it. */
const ARMS: readonly Corner[] = [
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: 0, y: 2 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 0, y: -2 },
];

/** Which three arms a corner carries: the lattice holds two rows of corners, and these are theirs. */
const UP_ARMS: readonly Corner[] = [ARMS[0], ARMS[2], ARMS[4]];
const DOWN_ARMS: readonly Corner[] = [ARMS[1], ARMS[3], ARMS[5]];

/**
 * The three arms of a corner, the row of the lattice it stands in deciding them: taken off the
 * corner they give the middles of its three tiles, added to it the three corners one edge away.
 */
function armsOf({ y }: Corner): readonly Corner[] {
  return ((y % 3) + 3) % 3 === 2 ? UP_ARMS : DOWN_ARMS;
}

/** The one way a corner is named in a set or a map keyed by it. */
export function cornerKey({ x, y }: Corner): string {
  return `${x},${y}`;
}

/** The six corners of a tile, in the order its faces turn. */
export function cornersOf({ q, r }: TileCoords): Corner[] {
  const middle = { x: 2 * q + r, y: 3 * r };
  return ARMS.map(({ x, y }) => ({ x: middle.x + x, y: middle.y + y }));
}

/** The three tiles a corner is a corner of, on the map or not. */
export function tilesAtCorner(corner: Corner): TileCoords[] {
  return armsOf(corner).map((arm) => {
    const r = (corner.y - arm.y) / 3;
    return { q: (corner.x - arm.x - r) / 2, r };
  });
}

/** The three corners one edge away from a corner, wherever those edges lead. */
export function cornersBeside(corner: Corner): Corner[] {
  return armsOf(corner).map((arm) => ({ x: corner.x + arm.x, y: corner.y + arm.y }));
}

/** The two tiles the edge between two corners lies between, on the map or not. */
export function tilesOfEdge(from: Corner, to: Corner): TileCoords[] {
  const beside = new Set(tilesAtCorner(to).map(tileKey));
  return tilesAtCorner(from).filter((coord) => beside.has(tileKey(coord)));
}

/** The one way the edge two tiles share is named in a set, from whichever of the two it is asked. */
function edgeKey(a: TileCoords, b: TileCoords): string {
  const one = tileKey(a);
  const other = tileKey(b);
  return one < other ? `${one}|${other}` : `${other}|${one}`;
}

/**
 * Every edge a river runs along, named by the two tiles it lies between: what a walk asks of a step
 * it takes. A river's corners stand one edge apart, so each consecutive pair of them is one edge.
 */
function riverEdges(rivers: readonly River[]): Set<string> {
  const edges = new Set<string>();
  for (const river of rivers) {
    for (let at = 1; at < river.length; at++) {
      const [one, other] = tilesOfEdge(river[at - 1], river[at]);
      edges.add(edgeKey(one, other));
    }
  }
  return edges;
}

/**
 * Whether one of the rivers runs along the tile. A river's corners stand one edge apart, so two
 * consecutive ones that are both corners of the tile are one of its six edges.
 */
export function runsAlong(rivers: readonly River[], coord: TileCoords): boolean {
  const around = new Set(cornersOf(coord).map(cornerKey));
  return rivers.some((river) =>
    river.some(
      (corner, at) =>
        at > 0 && around.has(cornerKey(river[at - 1])) && around.has(cornerKey(corner)),
    ),
  );
}

/**
 * The rivers cut to the parts running along the tiles named, each part a run of corners of one
 * river: every edge of a run lies between two tiles at least one of which is named, and a river
 * whose middle runs elsewhere answers as one run for each stretch of it that does, so nothing joins
 * two stretches across the gap.
 */
export function riversAlong(rivers: readonly River[], tiles: ReadonlySet<string>): River[] {
  const runs: River[] = [];
  for (const river of rivers) {
    let run: Corner[] = [];
    for (let at = 1; at < river.length; at++) {
      if (tilesOfEdge(river[at - 1], river[at]).some((coord) => tiles.has(tileKey(coord)))) {
        if (run.length === 0) run.push(river[at - 1]);
        run.push(river[at]);
        continue;
      }
      if (run.length > 0) runs.push(run);
      run = [];
    }
    if (run.length > 0) runs.push(run);
  }
  return runs;
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
 * Which biomes a map is dealt, the city's own aside: the quota each share is worth, and the city's
 * kind for whatever is left over. Dealt as quotas rather than diced one by one, because independent
 * dice deal a map with no sea at all.
 */
export function dealtBiomes(tileCount: number): Biome[] {
  const { tilesPerBiome, minBiomes, cityBiome, biomeShares } = MAP_COMPOSITION;
  const biomeCount = Math.max(minBiomes, Math.round(tileCount / tilesPerBiome));

  const dealt: Biome[] = [];
  for (const { biome, share } of biomeShares) {
    const quota = Math.min(Math.round((biomeCount - 1) * share), biomeCount - 1 - dealt.length);
    for (let i = 0; i < quota; i++) dealt.push(biome);
  }
  while (dealt.length < biomeCount - 1) dealt.push(cityBiome);
  return dealt;
}

/**
 * The river layer: every tile takes a height — how far it lies from water, lifted by its relief and
 * roughened by a roll — a corner takes the mean of its tiles', and a river is walked down that field
 * from a corner of the mountain range to the water or to a river already run. A walk that dies
 * inland or comes out short is thrown away and another source drawn.
 */
function flowRivers(
  initial: Rng,
  coords: readonly TileCoords[],
  indexOf: ReadonlyMap<string, number>,
  terrains: readonly Terrain[],
  tileBiomes: readonly Biome[],
  ranges: number,
): { rng: Rng; rivers: River[] } {
  const { relief, roughness, perRange, climb, meander, curl, edgesPerTile, leastEdges, draws } =
    RIVER_FLOW;
  let rng = initial;

  const dist: number[] = new Array(coords.length).fill(Number.POSITIVE_INFINITY);
  let front: number[] = [];
  for (let index = 0; index < coords.length; index++) {
    if (!water(terrains[index])) continue;
    dist[index] = 0;
    front.push(index);
  }
  for (let step = 1; front.length > 0; step++) {
    const next: number[] = [];
    for (const at of front) {
      for (const coord of neighbours(coords[at])) {
        const found = indexOf.get(tileKey(coord));
        if (found === undefined || dist[found] < Number.POSITIVE_INFINITY) continue;
        dist[found] = step;
        next.push(found);
      }
    }
    front = next;
  }

  const heights: number[] = new Array(coords.length);
  for (let index = 0; index < coords.length; index++) {
    const step = nextRng(rng);
    rng = step.rng;
    heights[index] = dist[index] + relief * TERRAIN_LIFT[terrains[index]] + roughness * step.value;
  }

  const onMap = (corner: Corner): number[] =>
    tilesAtCorner(corner)
      .map((coord) => indexOf.get(tileKey(coord)))
      .filter((index): index is number => index !== undefined);

  const heightAt = (corner: Corner): number => {
    const around = onMap(corner);
    return around.reduce((total, index) => total + heights[index], 0) / around.length;
  };

  const touchesWater = (corner: Corner): boolean =>
    onMap(corner).some((index) => dist[index] === 0);

  const pool: { corner: Corner; height: number }[] = [];
  const pooled = new Set<string>();
  for (let index = 0; index < coords.length; index++) {
    if (tileBiomes[index] !== 'mountain') continue;
    for (const corner of cornersOf(coords[index])) {
      const key = cornerKey(corner);
      if (pooled.has(key)) continue;
      pooled.add(key);
      if (onMap(corner).length < 3 || touchesWater(corner)) continue;
      pool.push({ corner, height: heightAt(corner) });
    }
  }

  /** Every corner every river already run passes through: what a walk ends on, and never starts on. */
  const run = new Set<string>();

  const walkFrom = (source: Corner): River | undefined => {
    const path: Corner[] = [source];
    const visited = new Set<string>([cornerKey(source)]);
    const along = new Map<number, number>();
    let turned: number | undefined;

    for (;;) {
      const at = path[path.length - 1];
      // The corner arrived by is already visited, so the two edges ahead are all that is left.
      const arrived = path[path.length - 2];
      const candidates: [{ to: Corner; banks: number[]; turn: number | undefined }, number][] = [];

      for (const to of cornersBeside(at)) {
        if (visited.has(cornerKey(to))) continue;
        const tiles = tilesOfEdge(at, to).map((coord) => indexOf.get(tileKey(coord)));
        if (tiles.some((index) => index === undefined)) continue;
        const banks = tiles as number[];
        if (banks.some((index) => (along.get(index) ?? 0) >= edgesPerTile)) continue;
        const drop = heightAt(at) - heightAt(to);
        if (-drop > climb) continue;
        const turn =
          arrived === undefined
            ? undefined
            : Math.sign((at.x - arrived.x) * (to.y - at.y) - (at.y - arrived.y) * (to.x - at.x));
        const weight =
          Math.exp(drop / meander) * (turn !== undefined && turn === turned ? curl : 1);
        candidates.push([{ to, banks, turn }, weight]);
      }
      if (candidates.length === 0) return undefined;

      const pick = pickWeighted(rng, candidates);
      rng = pick.rng;
      const { to, banks, turn } = pick.picked;
      path.push(to);
      visited.add(cornerKey(to));
      for (const index of banks) along.set(index, (along.get(index) ?? 0) + 1);
      turned = turn;

      if (touchesWater(to) || run.has(cornerKey(to))) {
        return path.length - 1 >= leastEdges ? path : undefined;
      }
    }
  };

  const rivers: River[] = [];
  const wanted = perRange * ranges;
  for (let draw = 0; draw < draws && rivers.length < wanted && pool.length > 0; draw++) {
    const pick = pickWeighted(
      rng,
      pool.map((entry, at) => [at, entry.height] as const),
    );
    rng = pick.rng;
    const [{ corner }] = pool.splice(pick.picked, 1);
    if (run.has(cornerKey(corner))) continue;

    const river = walkFrom(corner);
    if (river === undefined) continue;
    rivers.push(river);
    for (const at of river) run.add(cornerKey(at));
  }

  return { rng, rivers };
}

/**
 * The map of a chronicle: a hexagonal disc of tiles in axial coordinates, the city at its centre,
 * generated in five layers: biomes spread from their origins, a rim marked around every biome that
 * touches a biome of another kind, a terrain scattered from each biome's table — the rim one where
 * the rim reaches — each feature dealt over a share of the terrain it lies on, and rivers walked
 * down from the mountain range along the edges between tiles.
 */
export function generateMap(initial: Rng): { rng: Rng; tiles: Tile[]; rivers: River[] } {
  const { radius, cityBiome, featureShares } = MAP_COMPOSITION;
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

  const dealt = dealtBiomes(coords.length);

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

  const rimmed = new Set<number>();
  for (let index = 0; index < coords.length; index++) {
    const biome = tileBiomes[index];
    const onRim = neighbours(coords[index]).some((coord) => {
      const neighbour = indexOf.get(tileKey(coord));
      return neighbour !== undefined && tileBiomes[neighbour] !== biome;
    });
    if (!onRim) continue;
    const roll = pickWeighted(
      rng,
      BIOMES[biome].rimWidths.map((weight, width) => [width, weight] as const),
    );
    rng = roll.rng;
    for (let reached = 0; reached < coords.length; reached++) {
      if (tileBiomes[reached] !== biome) continue;
      if (distance(coords[index], coords[reached]) < roll.picked) rimmed.add(reached);
    }
  }

  const terrains: Terrain[] = new Array(coords.length);
  for (let index = 0; index < coords.length; index++) {
    const biome = BIOMES[tileBiomes[index]];
    if (origins.has(index)) {
      terrains[index] = biome.origin;
      continue;
    }
    const step = pickTerrain(rng, rimmed.has(index) ? biome.rim : biome.interior);
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

  const flowed = flowRivers(
    rng,
    coords,
    indexOf,
    terrains,
    tileBiomes,
    dealt.filter((biome) => biome === 'mountain').length,
  );
  rng = flowed.rng;

  return {
    rng,
    rivers: flowed.rivers,
    tiles: coords.map(({ q, r }, index) => ({
      q,
      r,
      terrain: terrains[index],
      feature: features[index],
      improvements: [],
    })),
  };
}
