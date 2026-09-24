import type { Resources } from './resources';

/**
 * What a tile of a terrain is: what it yields at income, what entering it costs — none named, and
 * nothing crosses it — whether it is water, its elevation, and what a river running along it adds,
 * nothing where none is named.
 */
export type TerrainKind = {
  readonly yields: Partial<Resources>;
  readonly movementCost?: number;
  readonly water: boolean;
  readonly elevation: number;
  readonly river?: Partial<Resources>;
};

/**
 * How a biome of a kind grows. `weight`: it spreads with the others, drawn by that growth weight.
 * `size`: it is filled first to that many tiles and grows no further.
 */
export type Growth =
  | { readonly kind: 'weight'; readonly weight: number }
  | { readonly kind: 'size'; readonly size: number };

/**
 * What a biome is made of: the terrain its origin tile is outright, the tables its interior and its
 * rim tiles scatter from, the weight of each rim width in tiles, no rim at all first, how it grows,
 * and its compactness: the power an open tile's count of neighbours it holds is raised to.
 */
export type BiomeKind = {
  readonly origin: string;
  readonly interior: Readonly<Record<string, number>>;
  readonly rim: Readonly<Record<string, number>>;
  readonly rimWidths: readonly number[];
  readonly growth: Growth;
  readonly compactness: number;
};

/**
 * What terrains a building or an improvement of a kind goes on, what it yields on top of them, the
 * movement cost it names its tile outright — none named, and it names nothing, unlike a terrain's —
 * and whether it bridges a river edge it stands on both banks of.
 */
export type LayerKind = {
  readonly terrains: readonly string[];
  readonly yields: Partial<Resources>;
  readonly movementCost?: number;
  readonly bridge?: boolean;
};

/** The terrain a feature of a kind lies on, and what it yields at income on top of that terrain. */
export type FeatureKind = {
  readonly terrain: string;
  readonly yields: Partial<Resources>;
};

/**
 * How the river layer runs. `source`: the biome kind rivers rise in, each one of it dealt counting
 * as a range. `relief`: how far a tile stands above its distance to water for each point of its
 * terrain's elevation. `roughness`: the most a tile's roll adds to its height.
 * `meander`: an edge's drop is weighted as exp(drop / meander), so a small value makes the steep way
 * near-certain. `curl`: what repeating the last turn multiplies an edge's weight by.
 */
export type RiverFlow = {
  readonly source: string;
  readonly relief: number;
  readonly roughness: number;
  readonly perRange: number;
  readonly climb: number;
  readonly meander: number;
  readonly curl: number;
  readonly edgesPerTile: number;
  readonly leastEdges: number;
  readonly draws: number;
};

/**
 * One composition of the map: the disc's radius, how many biomes it is cut into and which kinds are
 * dealt in what shares, the share of each feature, how many camps and how far each keeps from the
 * disc's centre and from every camp already placed, how far the centre part reaches from the disc's
 * centre, and how the river layer runs.
 */
export type Region = {
  readonly radius: number;
  readonly centre: number;
  readonly tilesPerBiome: number;
  readonly centreBiome: string;
  readonly biomeShares: readonly { readonly biome: string; readonly share: number }[];
  readonly featureShares: readonly { readonly feature: string; readonly share: number }[];
  readonly camps: number;
  readonly campFromCentre: number;
  readonly campsApart: number;
  readonly rivers: RiverFlow;
};

// `map.ts` and `units.ts` read the catalogue through this shape rather than through `Catalogue`:
// the catalogue's own type reaches them back through the chronicle and the units, and the lint
// refuses an import cycle, a type-only one included.
/**
 * The part of a catalogue the map is read through: the terrains and the layers a tile is made of,
 * the biomes and the regions a map is dealt from, and the building a camp is.
 */
export type MapContent = {
  readonly version: string;
  readonly terrains: Readonly<Record<string, TerrainKind>>;
  readonly biomes: Readonly<Record<string, BiomeKind>>;
  readonly buildings: Readonly<Record<string, LayerKind>>;
  readonly features: Readonly<Record<string, FeatureKind>>;
  readonly improvements: Readonly<Record<string, LayerKind>>;
  readonly regions: Readonly<Record<string, Region>>;
  readonly camp: { readonly building: string };
};

/** What a tile of that terrain is; a terrain the catalogue does not hold is refused. */
export function terrainKind(catalogue: MapContent, id: string): TerrainKind {
  return held(catalogue, catalogue.terrains, id, 'terrain');
}

/** What a biome of that kind is made of; a biome the catalogue does not hold is refused. */
export function biomeKind(catalogue: MapContent, id: string): BiomeKind {
  return held(catalogue, catalogue.biomes, id, 'biome');
}

/** What a building of that kind stands on and yields; a building the catalogue does not hold is refused. */
export function buildingKind(catalogue: MapContent, id: string): LayerKind {
  return held(catalogue, catalogue.buildings, id, 'building');
}

/** What a feature of that kind lies on and yields; a feature the catalogue does not hold is refused. */
export function featureKind(catalogue: MapContent, id: string): FeatureKind {
  return held(catalogue, catalogue.features, id, 'feature');
}

/** What an improvement of that kind goes on and yields; one the catalogue does not hold is refused. */
export function improvementKind(catalogue: MapContent, id: string): LayerKind {
  return held(catalogue, catalogue.improvements, id, 'improvement');
}

/** The composition a map of that region is dealt from; a region the catalogue does not hold is refused. */
export function regionOf(catalogue: MapContent, id: string): Region {
  return held(catalogue, catalogue.regions, id, 'region');
}

/** The entry of one table of the catalogue a key names; a key the table does not hold is refused. */
export function held<T>(
  catalogue: { readonly version: string },
  table: Readonly<Record<string, T>>,
  id: string,
  noun: string,
): T {
  if (!Object.hasOwn(table, id)) refuse(catalogue, `no ${noun} is named ${id}`);
  return table[id];
}

/** Every refusal of the content goes through here, its message opening with the version refusing. */
export function refuse(catalogue: { readonly version: string }, reason: string): never {
  throw new Error(`${catalogue.version}: ${reason}`);
}
