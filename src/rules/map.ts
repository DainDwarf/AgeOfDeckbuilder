import {
  type BiomeShare,
  biomeKind,
  buildingKind,
  featureKind,
  improvementKind,
  type LayerKind,
  type MapAge,
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
 * What entering a tile spends of a unit's move points, embarked or ashore: the one answer every path
 * asks. A terrain naming no cost for that unit is not entered by it, and a tile off the map by none.
 * A layer naming the cost outright takes the tile to it, whatever the terrain's, the lowest winning.
 */
export function movementCost(
  catalogue: MapContent,
  tile: Tile | undefined,
  embarked: boolean,
): number | undefined {
  if (tile === undefined) return undefined;
  const ground = groundCost(catalogue, tile.terrain, embarked);
  if (ground === undefined) return undefined;
  const named = layersOf(catalogue, tile).flatMap((layer) =>
    layer.movementCost === undefined ? [] : [layer.movementCost],
  );
  return named.length === 0 ? ground : Math.min(...named);
}

/**
 * What entering a bare tile of the terrain spends of a unit's move points, embarked or ashore, and
 * nothing where the terrain names no cost for that unit.
 */
export function groundCost(
  catalogue: MapContent,
  terrain: Terrain,
  embarked: boolean,
): number | undefined {
  const kind = terrainKind(catalogue, terrain);
  return embarked ? kind.embarkedMovementCost : kind.movementCost;
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
 * it, the improvements placed on it — distinct ones, never the same twice — and the one building
 * slot it offers.
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

/** Where the tiles a tile's yield reads beside it are read from: a tile off the map is none. */
export type TilesBeside = (coord: TileCoords) => Tile | undefined;

/** What gives a tile part of its yield: one of its layers, or a kind of building standing beside it. */
export type YieldSource =
  | { readonly kind: 'terrain'; readonly terrain: Terrain }
  | { readonly kind: 'feature'; readonly feature: FeatureId }
  | { readonly kind: 'improvement'; readonly improvement: ImprovementId }
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'beside'; readonly building: BuildingTypeId };

/** One part of what a tile gives at income, and what gives it. */
export type YieldPart = YieldSource & { readonly yields: Partial<Resources> };

/** Every resource the yields name, summed. A resource left out is none of it. */
function summed(parts: readonly Partial<Resources>[]): Partial<Resources> {
  const total: Partial<Resources> = {};
  for (const yields of parts) {
    for (const [resource, amount] of Object.entries(yields) as [Resource, number][]) {
      total[resource] = (total[resource] ?? 0) + amount;
    }
  }
  return total;
}

/** What a building of that kind gives the tile it stands on: its own yield and what it gives beside it. */
export function builtYield(catalogue: MapContent, building: BuildingTypeId): Partial<Resources> {
  const { yields, givesBeside } = buildingKind(catalogue, building);
  return givesBeside === undefined ? yields : summed([yields, givesBeside.yields]);
}

/**
 * What a tile gives at income, part by part: its terrain, its feature, its building and its
 * improvements, then each kind of building beside it that gives to the tile's terrain, once however
 * many of that kind stand around it, and not at all where the tile's own building is of that kind.
 */
export function yieldParts(catalogue: MapContent, tile: Tile, beside: TilesBeside): YieldPart[] {
  const parts: YieldPart[] = [
    { kind: 'terrain', terrain: tile.terrain, yields: terrainKind(catalogue, tile.terrain).yields },
  ];
  const { feature, building } = tile;
  if (feature !== undefined) {
    parts.push({ kind: 'feature', feature, yields: featureKind(catalogue, feature).yields });
  }
  if (building !== undefined) {
    parts.push({ kind: 'building', building, yields: builtYield(catalogue, building) });
  }
  for (const improvement of tile.improvements) {
    parts.push({
      kind: 'improvement',
      improvement,
      yields: improvementKind(catalogue, improvement).yields,
    });
  }
  const given = new Set(building === undefined ? [] : [building]);
  for (const coord of neighbours(tile)) {
    const around = beside(coord)?.building;
    if (around === undefined || given.has(around)) continue;
    const { givesBeside } = buildingKind(catalogue, around);
    if (givesBeside?.terrain !== tile.terrain) continue;
    given.add(around);
    parts.push({ kind: 'beside', building: around, yields: givesBeside.yields });
  }
  return parts;
}

/** What a tile gives at income, resource by resource. A resource left out is none of it. */
export function tileYield(
  catalogue: MapContent,
  tile: Tile,
  beside: TilesBeside,
): Partial<Resources> {
  return summed(yieldParts(catalogue, tile, beside).map(({ yields }) => yields));
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

/** The tiles beside any tile read out of these, keyed once, so no read searches them all. */
export function tilesBeside(tiles: readonly Tile[]): TilesBeside {
  const byKey = new Map(tiles.map((tile) => [tileKey(tile), tile]));
  return (coord) => byKey.get(tileKey(coord));
}

/** Whether the walker is embarked, and the move points it has left, which a crossing spends every one of. */
export type Walk = { readonly embarked: boolean; readonly points: number };

/**
 * The moves a walk over the whole map weighs its steps against, ashore and embarked: a walk stands
 * on no tile the way its moves name no move above nought for.
 */
export type Moves = { readonly ashore?: number; readonly embarked?: number };

/** What a walk has spent reaching each tile, ashore and embarked apart; a tile it never reached that way is absent. */
export type Routes = {
  readonly ashore: ReadonlyMap<string, number>;
  readonly embarked: ReadonlyMap<string, number>;
};

/** A tile beside another, and whether the walker stands on it embarked. */
export type Stood = { readonly tile: TileCoords; readonly embarked: boolean };

/**
 * A walk over the whole map toward a tile: what the cheapest route to it weighs from every tile,
 * and `next`, the tiles a cheapest route from a tile, standing embarked or ashore, steps onto first.
 */
export type Toward = Routes & {
  readonly next: (tile: TileCoords, embarked: boolean) => Stood[];
};

/**
 * One step between two tiles beside each other, in the order the walk goes: the tile it is at and
 * the one it goes on to, each with whether the walker stands on it embarked, and whether a river edge
 * no bridge spans lies between them.
 */
type Step = {
  readonly at: Tile | undefined;
  readonly atEmbarked: boolean;
  readonly onto: Tile | undefined;
  readonly embarked: boolean;
  readonly river: boolean;
};

/** What a step leaves the walk having spent, and nothing where the walk does not take it. */
type Spends = (paid: number, step: Step) => number | undefined;

/** The map a walk goes over: its tiles by position, and whether a river edge no bridge spans lies between two of them. */
type Ground = {
  readonly at: (coord: TileCoords) => Tile | undefined;
  readonly river: (a: TileCoords, b: TileCoords) => boolean;
};

function groundOf(catalogue: MapContent, tiles: readonly Tile[], rivers: readonly River[]): Ground {
  const byKey = new Map(tiles.map((tile) => [tileKey(tile), tile]));
  const crossings = riverEdges(rivers);
  const at = (coord: TileCoords): Tile | undefined => byKey.get(tileKey(coord));
  return {
    at,
    river: (a, b) =>
      crossings.has(edgeKey(a, b)) && !(bridges(catalogue, at(a)) && bridges(catalogue, at(b))),
  };
}

/** The move the moves name a walker embarked or ashore, and nothing where they name none above nought. */
function moveOf(moves: Moves, embarked: boolean): number | undefined {
  const move = embarked ? moves.embarked : moves.ashore;
  return move !== undefined && move > 0 ? move : undefined;
}

/**
 * What one whole move weighs on a walk over the whole map: every move the walk names divides it, so
 * no step weighs a fraction and two routes of equal moves weigh the same.
 */
export function wholeMove(moves: Moves): number {
  return (moveOf(moves, false) ?? 1) * (moveOf(moves, true) ?? 1);
}

/**
 * How a unit's walk spends: entering a tile its movement cost, and a step over a river edge every
 * move point it has left, taken only where those cover the tile entered in full.
 */
function spends(catalogue: MapContent, walk: Walk): Spends {
  return (paid, { onto, embarked, river }) => {
    const cost = movementCost(catalogue, onto, embarked);
    if (cost === undefined) return undefined;
    if (river) return walk.points - paid >= cost ? walk.points : undefined;
    return paid + cost <= walk.points ? paid + cost : undefined;
  };
}

/**
 * How a walk over the whole map weighs a step in moves, charging the tile the walker enters: `onto`
 * walking from the start, `at` walking toward it, where the walker steps from `onto` onto `at`. A
 * step onto a side the moves name no move for is refused.
 */
function weighs(catalogue: MapContent, moves: Moves, toward: boolean): Spends {
  const whole = wholeMove(moves);
  return (paid, { at, atEmbarked, onto, embarked, river }) => {
    if (moveOf(moves, atEmbarked) === undefined || moveOf(moves, embarked) === undefined) {
      return undefined;
    }
    const stands = movementCost(catalogue, onto, embarked);
    const entered = toward ? movementCost(catalogue, at, atEmbarked) : stands;
    if (stands === undefined || entered === undefined) return undefined;
    if (river || atEmbarked !== embarked) return paid + whole;
    return paid + entered * (moveOf(moves, !embarked) ?? 1);
  };
}

/**
 * What the cheapest route to each tile costs from a start, ashore and embarked apart: `embarks` lets
 * a step embark or disembark.
 */
function cheapestRoutes(
  ground: Ground,
  from: TileCoords,
  embarked: boolean,
  embarks: boolean,
  spending: Spends,
  shut: (coord: TileCoords) => boolean,
): Routes {
  const spent = { ashore: new Map<string, number>(), embarked: new Map<string, number>() };
  const reachedBy = (standsEmbarked: boolean): Map<string, number> =>
    standsEmbarked ? spent.embarked : spent.ashore;
  reachedBy(embarked).set(tileKey(from), 0);

  let front: [TileCoords, boolean, number][] = [[from, embarked, 0]];
  while (front.length > 0) {
    const next: [TileCoords, boolean, number][] = [];
    for (const [at, atEmbarked, paid] of front) {
      // A tile the walk reached again for less stands on the front twice; the dearer one is dropped.
      if (reachedBy(atEmbarked).get(tileKey(at)) !== paid) continue;
      const here = ground.at(at);
      for (const coord of neighbours(at)) {
        if (shut(coord)) continue;
        const key = tileKey(coord);
        const onto = ground.at(coord);
        const river = ground.river(at, coord);
        for (const embarked of embarks ? [atEmbarked, !atEmbarked] : [atEmbarked]) {
          const total = spending(paid, { at: here, atEmbarked, onto, embarked, river });
          if (total === undefined) continue;
          const reached = reachedBy(embarked);
          const before = reached.get(key);
          if (before !== undefined && before <= total) continue;
          reached.set(key, total);
          next.push([coord, embarked, total]);
        }
      }
    }
    front = next;
  }
  return spent;
}

/**
 * What the cheapest route to each tile costs a unit from a start, on the move points it has left,
 * the start nothing and a tile no route reaches absent: `shut` keeps a route off tiles for the
 * mover's own reasons.
 */
export function pathCosts(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  from: TileCoords,
  walk: Walk,
  shut: (coord: TileCoords) => boolean,
): ReadonlyMap<string, number> {
  const ground = groundOf(catalogue, tiles, rivers);
  const routes = cheapestRoutes(ground, from, walk.embarked, false, spends(catalogue, walk), shut);
  return walk.embarked ? routes.embarked : routes.ashore;
}

/**
 * What the cheapest route to each tile weighs from a start, ashore and embarked apart, on a walk over
 * the whole map with these moves: it embarks where the ground ends and disembarks where it begins,
 * wherever the moves name both.
 */
export function routesFrom(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  from: TileCoords,
  embarked: boolean,
  moves: Moves,
): Routes {
  const ground = groundOf(catalogue, tiles, rivers);
  return cheapestRoutes(ground, from, embarked, true, weighs(catalogue, moves, false), () => false);
}

/**
 * What the cheapest route from each tile to a tile reached embarked or ashore weighs, on a walk over
 * the whole map with these moves, and the steps a cheapest route takes first.
 */
export function routesToward(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  to: TileCoords,
  embarked: boolean,
  moves: Moves,
): Toward {
  const ground = groundOf(catalogue, tiles, rivers);
  const spending = weighs(catalogue, moves, true);
  const routes = cheapestRoutes(ground, to, embarked, true, spending, () => false);
  const reachedBy = (standsEmbarked: boolean): ReadonlyMap<string, number> =>
    standsEmbarked ? routes.embarked : routes.ashore;
  const next = (tile: TileCoords, standsEmbarked: boolean): Stood[] => {
    const weight = reachedBy(standsEmbarked).get(tileKey(tile));
    if (weight === undefined) return [];
    return neighbours(tile).flatMap((coord) =>
      [false, true].flatMap((atEmbarked): Stood[] => {
        const there = reachedBy(atEmbarked).get(tileKey(coord));
        if (there === undefined) return [];
        const step = {
          at: ground.at(coord),
          atEmbarked,
          onto: ground.at(tile),
          embarked: standsEmbarked,
          river: ground.river(coord, tile),
        };
        return spending(there, step) === weight ? [{ tile: coord, embarked: atEmbarked }] : [];
      }),
    );
  };
  return { ...routes, next };
}

export function groundRunsTo(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  to: TileCoords,
): ReadonlySet<string> {
  // Only which tiles the walk reached is read, never what reaching them weighed, so the move it is
  // weighed against shows nowhere.
  const reached = routesFrom(catalogue, tiles, rivers, to, false, { ashore: MOVE_POINT });
  return new Set(reached.ashore.keys());
}

/** Every tile a walk over the whole map reaches the tile from, ashore or embarked. */
export function groundAndWaterRunTo(
  catalogue: MapContent,
  tiles: readonly Tile[],
  rivers: readonly River[],
  to: TileCoords,
): ReadonlySet<string> {
  const moves = { ashore: MOVE_POINT, embarked: MOVE_POINT };
  const reached = routesFrom(catalogue, tiles, rivers, to, false, moves);
  return new Set([...reached.ashore.keys(), ...reached.embarked.keys()]);
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
 * The share each biome the region's shares deal comes of, the centre's own aside: the quota each
 * share is worth, dealt as quotas rather than diced one by one, because independent dice deal a map
 * with no sea at all.
 */
export function sharedBiomes(region: Region): BiomeShare[] {
  const count = biomeCount(region);
  const dealt: BiomeShare[] = [];
  for (const share of region.biomeShares) {
    const quota = Math.min(Math.round((count - 1) * share.share), count - 1 - dealt.length);
    for (let i = 0; i < quota; i++) dealt.push(share);
  }
  return dealt;
}

/**
 * Which biomes a map of the region is dealt, the centre's own aside: what its shares deal, and the
 * centre's kind for whatever they leave over.
 */
export function dealtBiomes(region: Region): Biome[] {
  const dealt = sharedBiomes(region).map(({ biome }) => biome);
  while (dealt.length < biomeCount(region) - 1) dealt.push(region.centreBiome);
  return dealt;
}

/**
 * The origins as scattered, the centre's first, once each biome a share keeps away from kinds has
 * taken its own. It draws nothing, or every seed a spec searched would deal another map.
 */
function keptAway(
  coords: readonly TileCoords[],
  kinds: readonly Biome[],
  shared: readonly BiomeShare[],
  scattered: readonly number[],
): number[] {
  const origins = [...scattered];
  const taken = new Set<number>();
  for (const [at, { keepsAwayFrom = [] }] of shared.entries()) {
    const biome = at + 1;
    const from = origins.flatMap((tile, holder) =>
      keepsAwayFrom.includes(kinds[holder]) ? [coords[tile]] : [],
    );
    if (from.length === 0) continue;
    let pick = origins[biome];
    let furthest = -1;
    for (const tile of scattered.slice(1)) {
      if (taken.has(tile)) continue;
      const nearest = Math.min(...from.map((origin) => distance(coords[tile], origin)));
      if (nearest <= furthest) continue;
      pick = tile;
      furthest = nearest;
    }
    const holder = origins.indexOf(pick);
    [origins[holder], origins[biome]] = [origins[biome], pick];
    taken.add(pick);
  }
  return origins;
}

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
    const { elevation } = terrainKind(catalogue, terrains[index]);
    heights[index] = dist[index] + relief * elevation + roughness * step.value;
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
 * The camps placed one at a time, one draw each among the tiles still left to it; where none is left
 * the placing stops, and `generateMap` deals the map again.
 */
function campsOn(
  catalogue: MapContent,
  { building, acrossWater }: MapAge['camp'],
  region: Region,
  initial: Rng,
  tiles: readonly Tile[],
  rivers: readonly River[],
): { rng: Rng; tiles: Tile[]; placed: number } {
  const { camps, campFromCentre, campsApart } = region;
  const ground = buildingKind(catalogue, building).terrains;
  const reached =
    acrossWater === true
      ? groundAndWaterRunTo(catalogue, tiles, rivers, CENTRE)
      : groundRunsTo(catalogue, tiles, rivers, CENTRE);

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
    tiles: tiles.map((tile) => (camped.has(tileKey(tile)) ? { ...tile, building } : tile)),
    placed: placed.length,
  };
}

/**
 * The map a region deals, a disc around `CENTRE` in the seven layers of `docs/MAP.md`. A deal short
 * of the region's camps is thrown away and the next dealt from the generator state it leaves; a
 * tenth one short throws.
 */
export function generateMap(
  catalogue: MapContent,
  age: MapAge,
  regionId: string,
  initial: Rng,
): HexMap & { readonly rng: Rng } {
  const region = regionOf(catalogue, age, regionId);
  let deal = dealMap(catalogue, age.camp, region, initial);
  for (let dealt = 1; deal.placed < region.camps; dealt++) {
    if (dealt === 10) {
      throw new Error(`this map was dealt 10 times and never held ${region.camps} camps`);
    }
    deal = dealMap(catalogue, age.camp, region, deal.rng);
  }
  return { rng: deal.rng, tiles: deal.tiles, rivers: deal.rivers, centre: deal.centre };
}

function dealMap(
  catalogue: MapContent,
  camp: MapAge['camp'],
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
  const originTiles = keptAway(coords, kinds, sharedBiomes(region), [
    centreIndex,
    ...scattered.items.slice(0, dealt.length),
  ]);
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
    if ([...closers].some((by) => weights[by] !== undefined)) {
      throw new Error(
        `the generator left ${tileKey(coords[index])} unreached with a biome that grows by weight beside it`,
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
    camp,
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
