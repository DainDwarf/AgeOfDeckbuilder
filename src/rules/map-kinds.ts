import type { Resources } from './resources';

/**
 * What a tile of a terrain is: what it yields at income, what entering it costs a unit ashore and an
 * embarked one — none named, and none of them crosses it — whether it is water, and its elevation.
 */
export type TerrainKind = {
  readonly yields: Partial<Resources>;
  readonly movementCost?: number;
  readonly embarkedMovementCost?: number;
  readonly water: boolean;
  readonly elevation: number;
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
  /** The features it goes on, any one of them, and goes with, for one that names any. */
  readonly features?: readonly string[];
  /** Whether it names the river: it goes only on a tile a river runs along. */
  readonly river?: boolean;
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
 * `source`: the biome kind rivers rise in, each one of it dealt counting as a range.
 * `curl`: what repeating the last turn multiplies an edge's weight by.
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

/** A kind a region deals in a share, and the kinds each biome of that share keeps away from. */
export type BiomeShare = {
  readonly biome: string;
  readonly share: number;
  readonly keepsAwayFrom?: readonly string[];
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
  readonly biomeShares: readonly BiomeShare[];
  readonly featureShares: readonly { readonly feature: string; readonly share: number }[];
  readonly camps: number;
  readonly campFromCentre: number;
  readonly campsApart: number;
  readonly rivers: RiverFlow;
};

// `map.ts` and `units.ts` read the catalogue through these shapes rather than through `Catalogue`
// and its `Age`: the catalogue's own type reaches them back through the chronicle and the units, and
// the lint refuses an import cycle, a type-only one included.
/**
 * The part of a catalogue the map is read through: the terrains and the layers a tile is made of,
 * and the biomes a map is dealt from.
 */
export type MapContent = {
  readonly version: string;
  readonly terrains: Readonly<Record<string, TerrainKind>>;
  readonly biomes: Readonly<Record<string, BiomeKind>>;
  readonly buildings: Readonly<Record<string, LayerKind>>;
  readonly features: Readonly<Record<string, FeatureKind>>;
  readonly improvements: Readonly<Record<string, LayerKind>>;
};

/**
 * The part of an age a map is dealt from: its regions, the building its camp is, and whether its camp
 * stands across the water.
 */
export type MapAge = {
  readonly regions: Readonly<Record<string, Region>>;
  readonly camp: { readonly building: string; readonly acrossWater?: boolean };
};

/** What a tile of that terrain is; a terrain the catalogue does not hold is refused. */
export function terrainKind(catalogue: MapContent, id: string): TerrainKind {
  return entryOf(catalogue, catalogue.terrains, id, 'terrain');
}

/** What a biome of that kind is made of; a biome the catalogue does not hold is refused. */
export function biomeKind(catalogue: MapContent, id: string): BiomeKind {
  return entryOf(catalogue, catalogue.biomes, id, 'biome');
}

/** What a building of that kind stands on and yields; a building the catalogue does not hold is refused. */
export function buildingKind(catalogue: MapContent, id: string): LayerKind {
  return entryOf(catalogue, catalogue.buildings, id, 'building');
}

/** What a feature of that kind lies on and yields; a feature the catalogue does not hold is refused. */
export function featureKind(catalogue: MapContent, id: string): FeatureKind {
  return entryOf(catalogue, catalogue.features, id, 'feature');
}

/** What an improvement of that kind goes on and yields; one the catalogue does not hold is refused. */
export function improvementKind(catalogue: MapContent, id: string): LayerKind {
  return entryOf(catalogue, catalogue.improvements, id, 'improvement');
}

/** The composition a map of that region is dealt from; a region the age does not hold is refused. */
export function regionOf(catalogue: MapContent, age: MapAge, id: string): Region {
  return entryOf(catalogue, age.regions, id, 'region');
}

/** The entry of one table of the catalogue a key names; a key the table does not hold is refused. */
export function entryOf<T>(
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
  throw new Error(refusal(catalogue, reason));
}

/** A refusal's words, for what is dropped and not thrown: the version refusing, then the reason. */
export function refusal(catalogue: { readonly version: string }, reason: string): string {
  return `${catalogue.version}: ${reason}`;
}
