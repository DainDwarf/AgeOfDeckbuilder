import {
  type BuildingTypeId,
  type FeatureId,
  type ImprovementId,
  neighbours,
  type Terrain,
  type Tile,
  type TilesBeside,
} from './map';
import {
  buildingKind,
  entryOf,
  featureKind,
  improvementKind,
  type MapContent,
  terrainKind,
} from './map-kinds';
import { RESOURCES, type Resource, type Resources } from './resources';
import { type Chronicle, capstoneLanded } from './state';

/** What gives a tile part of its yield: one of its layers, or a kind of building standing beside it. */
export type YieldSource =
  | { readonly kind: 'terrain'; readonly terrain: Terrain }
  | { readonly kind: 'feature'; readonly feature: FeatureId }
  | { readonly kind: 'improvement'; readonly improvement: ImprovementId }
  | { readonly kind: 'building'; readonly building: BuildingTypeId }
  | { readonly kind: 'beside'; readonly building: BuildingTypeId };

/** One part of what a tile gives at income, and what gives it. */
export type YieldPart = YieldSource & { readonly yields: Partial<Resources> };

/** A rule laid over every tile's yield: what one part of it gives under the rule. */
export type YieldRule = (part: YieldPart) => Partial<Resources>;

/** The content a tile's yield is read on: the map's, and the rule each capstone lays over the yield. */
export type YieldContent = MapContent & {
  readonly capstones: Readonly<Record<string, { readonly yieldRule?: YieldRule }>>;
};

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
 * What a tile gives, part by part: its terrain, feature, building and improvements, then each kind of
 * building beside it giving to its terrain, once a kind and never its own building's; every part
 * under the rule the chronicle's capstone lays over the yield, from the landing on.
 */
export function yieldParts(
  catalogue: YieldContent,
  chronicle: Pick<Chronicle, 'turn' | 'timeline'>,
  tile: Tile,
  beside: TilesBeside,
): YieldPart[] {
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
  const { capstone } = chronicle.timeline;
  const { yieldRule } = entryOf(catalogue, catalogue.capstones, capstone.id, 'capstone');
  if (yieldRule === undefined || !capstoneLanded(chronicle)) return parts;
  return parts.map((part) => ({ ...part, yields: yieldRule(part) }));
}

/** What a tile gives, resource by resource, as `yieldParts` reads it. A resource left out is none of it. */
export function tileYield(
  catalogue: YieldContent,
  chronicle: Pick<Chronicle, 'turn' | 'timeline'>,
  tile: Tile,
  beside: TilesBeside,
): Partial<Resources> {
  return summed(yieldParts(catalogue, chronicle, tile, beside).map(({ yields }) => yields));
}

/** What a yield gives in every resource together, each counted as one. */
export function worthOf(yields: Partial<Resources>): number {
  return RESOURCES.reduce((sum, resource) => sum + (yields[resource] ?? 0), 0);
}
