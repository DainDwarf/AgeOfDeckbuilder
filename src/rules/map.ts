import {
  biomeKind,
  buildingKind,
  featureKind,
  improvementKind,
  type LayerKind,
  type MapContent,
  type Region,
  type RiverFlow,
  regionOf,
  terrainKind,
} from './map-kinds';
import type { Resource, Resources } from './resources';
import { nextRng, pickWeighted, type Rng, shuffle } from './rng';

export type Terrain = string;
export type Biome = string;
export type BuildingTypeId = string;
export type FeatureId = string;
export type ImprovementId = string;

/** One move point, in the hundredths every move stat, move point and movement cost counts in. */
export const MOVE_POINT = 100;

/** The building and the improvements of a tile: the layers a movement cost or a bridge is read off. */
function layersOf(catalogue: MapContent, tile: Tile): LayerKind[] {
  const improvements = tile.improvements.map((improvement) =>
    improvementKind(catalogue, improvement),
  );
  if (tile.building === undefined) return improvements;
  return [buildingKind(catalogue, tile.building), ...improvements];
}

/** Whether a layer of the tile bridges: what a bridge needs on both banks. */
function bridges(catalogue: MapContent, tile: Tile | undefined): boolean {
  return tile !== undefined && layersOf(catalogue, tile).some((layer) => layer.bridge === true);
}

/**
 * What entering a tile spends of a unit's move points: the one answer every path over the map asks.
 * A terrain that names no movement cost is crossed by nothing, and neither is a tile off the map. A
 * layer that names the cost outright takes the tile to it, whatever the terrain's, the lowest named
 * of them winning; the terrain's cost is the tile's only where no layer names one.
 */
export function movementCost(catalogue: MapContent, tile: Tile | undefined): number | undefined {
  if (tile === undefined) return undefined;
  const ground = terrainKind(catalogue, tile.terrain).movementCost;
  if (ground === undefined) return undefined;
  const named = layersOf(catalogue, tile).flatMap((layer) =>
    layer.movementCost === undefined ? [] : [layer.movementCost],
  );
  return named.length === 0 ? ground : Math.min(...named);
}

/** Whether a terrain is water: what a river runs to, and what height is measured from. */
export function water(catalogue: MapContent, terrain: Terrain | undefined): boolean {
  return terrain !== undefined && terrainKind(catalogue, terrain).water;
}

/** How high a terrain stands: what a unit sees over, and what stops it. Off the map is flat. */
export function elevation(catalogue: MapContent, terrain: Terrain | undefined): number {
  return terrain === undefined ? 0 : terrainKind(catalogue, terrain).elevation;
}

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

/** A map: its tiles, the rivers running along the edges between them, and its centre part. */
export type HexMap = {
  readonly tiles: Tile[];
  readonly rivers: River[];
  readonly centre: TileCoords[];
};

/** The middle of the disc the generator deals. */
export const CENTRE: TileCoords = { q: 0, r: 0 };

/**
 * What a tile's layers and the river running along it give at income, resource by resource: the one
 * answer income and the yield overlay both read. A resource left out is none of it.
 */
export function tileYield(
  catalogue: MapContent,
  tile: Tile,
  rivers: readonly River[],
): Partial<Resources> {
  const ground = terrainKind(catalogue, tile.terrain);
  const summed: Partial<Resources> = { ...ground.yields };
  const add = (yields: Partial<Resources>): void => {
    for (const [resource, amount] of Object.entries(yields) as [Resource, number][]) {
      summed[resource] = (summed[resource] ?? 0) + amount;
    }
  };
  if (tile.feature !== undefined) add(featureKind(catalogue, tile.feature).yields);
  for (const improvement of tile.improvements) add(improvementKind(catalogue, improvement).yields);
  if (tile.building !== undefined) add(buildingKind(catalogue, tile.building).yields);
  if (runsAlong(rivers, tile)) add(ground.river ?? {});
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
 * reasons of its own. A river edge with a bridging layer on both banks is a bridge, stepped over as
 * if no river ran there. A tile no route reaches is absent from the answer, and so is every tile no
 * movement cost is named for.
 */
export function pathCosts(
  catalogue: MapContent,
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
      const nearBank = bridges(catalogue, ground.get(tileKey(at)));
      for (const coord of neighbours(at)) {
        const key = tileKey(coord);
        const onto = ground.get(key);
        const cost = movementCost(catalogue, onto);
        if (cost === undefined || shut(coord)) continue;
        const bridged = nearBank && bridges(catalogue, onto);
        const total = spentOn(walk, paid, cost, crossings.has(edgeKey(at, coord)) && !bridged);
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

export function groundRunsTo(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  to: TileCoords,
): ReadonlySet<string> {
  // Only which tiles the walk reached is read, never what reaching them cost, so the move a crossing
  // is charged against shows nowhere.
  const reached = pathCosts(
    catalogue,
    tiles,
    rivers,
    to,
    { kind: 'whole-map', move: MOVE_POINT },
    () => false,
  );
  return new Set(reached.keys());
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

/** How many tiles a disc of that radius holds. */
export function discTiles(radius: number): number {
  return 3 * radius * radius + 3 * radius + 1;
}

/** How many biomes a map of the region is cut into, the centre's own among them. */
function biomeCount({ radius, tilesPerBiome }: Region): number {
  return Math.round(discTiles(radius) / tilesPerBiome);
}

/**
 * The biomes the region's shares deal, the centre's own aside: the quota each share is worth, dealt
 * as quotas rather than diced one by one, because independent dice deal a map with no sea at all.
 */
export function sharedBiomes(region: Region): Biome[] {
  const count = biomeCount(region);
  const dealt: Biome[] = [];
  for (const { biome, share } of region.biomeShares) {
    const quota = Math.min(Math.round((count - 1) * share), count - 1 - dealt.length);
    for (let i = 0; i < quota; i++) dealt.push(biome);
  }
  return dealt;
}

/**
 * Which biomes a map of the region is dealt, the centre's own aside: what its shares deal, and the
 * centre's kind for whatever they leave over.
 */
export function dealtBiomes(region: Region): Biome[] {
  const dealt = sharedBiomes(region);
  while (dealt.length < biomeCount(region) - 1) dealt.push(region.centreBiome);
  return dealt;
}

/**
 * The river layer: every tile takes a height — how far it lies from water, lifted by its relief and
 * roughened by a roll — a corner takes the mean of its tiles', and a river is walked down that field
 * from a corner of the biome its rivers rise in to the water or to a river already run. A walk that dies
 * inland or comes out short is thrown away and another source drawn.
 */
function flowRivers(
  catalogue: MapContent,
  flow: RiverFlow,
  initial: Rng,
  coords: readonly TileCoords[],
  indexOf: ReadonlyMap<string, number>,
  terrains: readonly Terrain[],
  tileBiomes: readonly Biome[],
  ranges: number,
): { rng: Rng; rivers: River[] } {
  const { relief, roughness, perRange, climb, meander, curl, edgesPerTile, leastEdges, draws } =
    flow;
  let rng = initial;

  const dist: number[] = new Array(coords.length).fill(Number.POSITIVE_INFINITY);
  let front: number[] = [];
  for (let index = 0; index < coords.length; index++) {
    if (!water(catalogue, terrains[index])) continue;
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
    const lift = terrainKind(catalogue, terrains[index]).lift;
    heights[index] = dist[index] + relief * lift + roughness * step.value;
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
    if (tileBiomes[index] !== flow.source) continue;
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
 * Where the camps stand, one at a time: each is drawn uniformly from the tiles of the terrains the
 * camp's building lies on that the ground runs to the disc's centre from, far enough from the centre
 * and from every camp already placed, and the candidates are filtered again after each. When they
 * run out the placing stops, and `generateMap` deals the map again. Nothing else on the tile changes.
 */
function campsOn(
  catalogue: MapContent,
  region: Region,
  initial: Rng,
  tiles: readonly Tile[],
  rivers: readonly River[],
): { rng: Rng; tiles: Tile[]; placed: number } {
  const { camps, campFromCentre, campsApart } = region;
  const camp = catalogue.camp.building;
  const ground = buildingKind(catalogue, camp).terrains;
  const reached = groundRunsTo(catalogue, tiles, rivers, CENTRE);

  let rng = initial;
  const placed: TileCoords[] = [];
  for (let drawn = 0; drawn < camps; drawn++) {
    const candidates = tiles.filter(
      (tile) =>
        ground.includes(tile.terrain) &&
        reached.has(tileKey(tile)) &&
        distance(tile, CENTRE) >= campFromCentre &&
        placed.every((other) => distance(tile, other) >= campsApart),
    );
    if (candidates.length === 0) break;

    const step = nextRng(rng);
    rng = step.rng;
    placed.push(candidates[Math.floor(step.value * candidates.length)]);
  }

  const camped = new Set(placed.map(tileKey));
  return {
    rng,
    tiles: tiles.map((tile) => (camped.has(tileKey(tile)) ? { ...tile, building: camp } : tile)),
    placed: placed.length,
  };
}

/**
 * The map a region deals: a hexagonal disc of tiles in axial coordinates around its centre,
 * generated in seven layers: biomes spread from their origins, the centre's among them, a rim marked
 * around every biome that touches a biome of another kind, a terrain scattered from each biome's
 * table — the rim one where the rim reaches — each feature dealt over a share of the terrain it lies
 * on, rivers walked down from the biome they rise in along the edges between tiles, the camps dealt
 * over the ground they name that the centre is walked to from, and the centre part: every tile
 * within the region's reach of the disc's centre, which draws nothing. A deal holding fewer camps
 * than the region asks is thrown away and another dealt from the generator state it leaves; a tenth
 * deal short of them throws.
 */
export function generateMap(
  catalogue: MapContent,
  regionId: string,
  initial: Rng,
): HexMap & { readonly rng: Rng } {
  const region = regionOf(catalogue, regionId);
  let deal = dealMap(catalogue, region, initial);
  for (let dealt = 1; deal.placed < region.camps; dealt++) {
    if (dealt === 10) {
      throw new Error(`this map was dealt 10 times and never held ${region.camps} camps`);
    }
    deal = dealMap(catalogue, region, deal.rng);
  }
  return { rng: deal.rng, tiles: deal.tiles, rivers: deal.rivers, centre: deal.centre };
}

function dealMap(
  catalogue: MapContent,
  region: Region,
  initial: Rng,
): { rng: Rng; tiles: Tile[]; rivers: River[]; centre: TileCoords[]; placed: number } {
  const { radius, centreBiome, featureShares } = region;
  let rng = initial;

  const coords: TileCoords[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      coords.push({ q, r });
    }
  }
  const indexOf = new Map(coords.map((coord, index) => [tileKey(coord), index]));
  const centreIndex = coords.findIndex((coord) => tileKey(coord) === tileKey(CENTRE));

  const around = (index: number): number[] =>
    neighbours(coords[index])
      .map((coord) => indexOf.get(tileKey(coord)))
      .filter((found): found is number => found !== undefined);

  const scattered = shuffle(
    rng,
    coords.map((_, index) => index).filter((index) => index !== centreIndex),
  );
  rng = scattered.rng;

  const dealt = dealtBiomes(region);
  const kinds = [centreBiome, ...dealt];
  const originTiles = [centreIndex, ...scattered.items.slice(0, dealt.length)];
  const origins = new Set(originTiles);

  const owner: (number | undefined)[] = new Array(coords.length);
  const open = kinds.map(() => new Map<number, number>());
  const held = kinds.map(() => 0);
  const take = (index: number, biome: number): void => {
    owner[index] = biome;
    held[biome]++;
    for (const beside of open) beside.delete(index);
    for (const next of around(index)) {
      if (owner[next] === undefined) open[biome].set(next, (open[biome].get(next) ?? 0) + 1);
    }
  };
  const grow = (biome: number): void => {
    const { compactness } = biomeKind(catalogue, kinds[biome]);
    const pick = pickWeighted(
      rng,
      [...open[biome]].map(([index, holds]) => [index, holds ** compactness] as const),
    );
    rng = pick.rng;
    take(pick.picked, biome);
  };
  for (const [biome, tile] of originTiles.entries()) take(tile, biome);

  const weights: (number | undefined)[] = [];
  for (const [biome, kind] of kinds.entries()) {
    const { growth } = biomeKind(catalogue, kind);
    switch (growth.kind) {
      case 'weight':
        weights.push(growth.weight);
        break;
      case 'size':
        weights.push(undefined);
        while (held[biome] < growth.size && open[biome].size > 0) grow(biome);
        break;
    }
  }
  for (;;) {
    const growing = weights.flatMap((weight, biome) =>
      weight !== undefined && open[biome].size > 0 ? [[biome, weight] as const] : [],
    );
    if (growing.length === 0) break;
    const pick = pickWeighted(rng, growing);
    rng = pick.rng;
    grow(pick.picked);
  }

  // A hole two sized biomes closed together goes to the one dealt first.
  const tileBiomes: Biome[] = new Array(coords.length);
  for (let index = 0; index < coords.length; index++) {
    const reached = owner[index];
    if (reached !== undefined) {
      tileBiomes[index] = kinds[reached];
      continue;
    }
    const hole = [index];
    const inHole = new Set(hole);
    const closers = new Set<number>();
    for (let at = 0; at < hole.length; at++) {
      for (const next of around(hole[at])) {
        const by = owner[next];
        if (by !== undefined) closers.add(by);
        else if (!inHole.has(next)) {
          inHole.add(next);
          hole.push(next);
        }
      }
    }
    if (closers.size === 0 || [...closers].some((by) => weights[by] !== undefined)) {
      throw new Error(
        `the generator left ${tileKey(coords[index])} unreached with a biome that grows by weight beside it, or none`,
      );
    }
    const closer = Math.min(...closers);
    for (const tile of hole) owner[tile] = closer;
    tileBiomes[index] = kinds[closer];
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
      biomeKind(catalogue, biome).rimWidths.map((weight, width) => [width, weight] as const),
    );
    rng = roll.rng;
    for (let reached = 0; reached < coords.length; reached++) {
      if (tileBiomes[reached] !== biome) continue;
      if (distance(coords[index], coords[reached]) < roll.picked) rimmed.add(reached);
    }
  }

  const terrains: Terrain[] = new Array(coords.length);
  for (let index = 0; index < coords.length; index++) {
    const biome = biomeKind(catalogue, tileBiomes[index]);
    if (origins.has(index)) {
      terrains[index] = biome.origin;
      continue;
    }
    const step = pickWeighted(rng, Object.entries(rimmed.has(index) ? biome.rim : biome.interior));
    rng = step.rng;
    terrains[index] = step.picked;
  }

  const features: (FeatureId | undefined)[] = new Array(coords.length);
  for (const { feature, share } of featureShares) {
    const lies = featureKind(catalogue, feature).terrain;
    const eligible = coords
      .map((_, index) => index)
      .filter((index) => features[index] === undefined && terrains[index] === lies);
    const order = shuffle(rng, eligible);
    rng = order.rng;
    for (const index of order.items.slice(0, Math.round(share * eligible.length))) {
      features[index] = feature;
    }
  }

  const flowed = flowRivers(
    catalogue,
    region.rivers,
    rng,
    coords,
    indexOf,
    terrains,
    tileBiomes,
    dealt.filter((biome) => biome === region.rivers.source).length,
  );
  rng = flowed.rng;

  const camped = campsOn(
    catalogue,
    region,
    rng,
    coords.map(({ q, r }, index) => ({
      q,
      r,
      terrain: terrains[index],
      feature: features[index],
      improvements: [],
    })),
    flowed.rivers,
  );

  return {
    rng: camped.rng,
    rivers: flowed.rivers,
    tiles: camped.tiles,
    centre: coords.filter((coord) => distance(coord, CENTRE) <= region.centre),
    placed: camped.placed,
  };
}
