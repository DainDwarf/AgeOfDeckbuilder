import type { TileCoords } from './map';
import {
  biomeKind,
  buildingKind,
  featureKind,
  held,
  type MapContent,
  refuse,
  terrainKind,
} from './map-kinds';
import type { Chronicle } from './state';
import { type Landing, standsOn, type Unit, type UnitStats } from './units';

/**
 * What an enemy does in the enemy phase, asked of the enemy itself as the phase stands it. The phase
 * takes one enemy at a time — its move, then an attack for each of its action — and asks again on
 * the chronicle the last answer left; how either is chosen is the script's own business.
 */
export type EnemyScript = {
  /**
   * The landing it moves to, out of the tiles its move points reach and the one it already stands
   * on, which costs it nothing.
   */
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Landing;
  /** The unit it attacks now, and nothing when it attacks none. */
  attacks(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined;
};

/**
 * The content a chronicle is played on: the stats a unit of each kind enters the map with, every
 * script an enemy can carry, the map content, what a camp is and enters, and what the opening puts
 * on the centre tile. Every one of them is named by its key.
 */
export type Catalogue = MapContent & {
  readonly units: Readonly<Record<string, UnitStats>>;
  readonly scripts: Readonly<Record<string, EnemyScript>>;
  readonly camp: { readonly unit: string; readonly script: string; readonly building: string };
  readonly city: { readonly terrain: string; readonly building: string };
};

/**
 * The one way a catalogue is built, refused whole where it does not hold together: every unit kind
 * names itself by its key; every id a biome, a feature, a building, an improvement, a region, the
 * camp and the city name is held; every biome rolls some rim width; the camp's unit stands on every
 * terrain its building names; and the city's building stands on the city's terrain.
 */
export function catalogued(content: Catalogue): Catalogue {
  for (const [id, kind] of Object.entries(content.units)) {
    if (kind.type !== id) refuse(content, `the unit kind ${id} names itself ${kind.type}`);
  }
  for (const [id, biome] of Object.entries(content.biomes)) {
    terrainKind(content, biome.origin);
    for (const terrain of Object.keys(biome.interior)) terrainKind(content, terrain);
    for (const terrain of Object.keys(biome.rim)) terrainKind(content, terrain);
    if (biome.rimWidths.length === 0) refuse(content, `the biome ${id} rolls no rim width`);
  }
  for (const feature of Object.values(content.features)) terrainKind(content, feature.terrain);
  for (const layer of [
    ...Object.values(content.buildings),
    ...Object.values(content.improvements),
  ]) {
    for (const terrain of layer.terrains) terrainKind(content, terrain);
  }
  for (const region of Object.values(content.regions)) {
    biomeKind(content, region.centreBiome);
    biomeKind(content, region.rivers.source);
    for (const { biome } of region.biomeShares) biomeKind(content, biome);
    for (const { feature } of region.featureShares) featureKind(content, feature);
  }

  const campUnit = unitKind(content, content.camp.unit);
  enemyScript(content, content.camp.script);
  for (const terrain of buildingKind(content, content.camp.building).terrains) {
    if (!standsOn(content, campUnit, { q: 0, r: 0, terrain, improvements: [] })) {
      refuse(content, `the camp's unit ${content.camp.unit} cannot stand on ${terrain}`);
    }
  }
  if (!buildingKind(content, content.city.building).terrains.includes(content.city.terrain)) {
    refuse(
      content,
      `the city's building ${content.city.building} does not stand on ${content.city.terrain}`,
    );
  }
  return content;
}

/** The stats a unit of that kind enters the map with; a kind the catalogue does not hold is refused. */
export function unitKind(catalogue: Catalogue, id: string): UnitStats {
  return held(catalogue, catalogue.units, id, 'unit kind');
}

/** The script an enemy names; a script the catalogue does not hold is refused. */
export function enemyScript(catalogue: Catalogue, id: string): EnemyScript {
  return held(catalogue, catalogue.scripts, id, 'enemy script');
}

/** A chronicle founded on any other version of the content than this catalogue's is refused. */
export function checkContent(catalogue: Catalogue, chronicle: Chronicle): void {
  if (chronicle.content === catalogue.version) return;
  refuse(catalogue, `a chronicle founded on ${chronicle.content} is played on no other content`);
}

/** What a unit entering the map is: its kind, the tile it stands on, and who it acts for. */
export type Entering = { readonly type: string; readonly tile: TileCoords } & (
  | { readonly faction: 'player' }
  | { readonly faction: 'enemy'; readonly script: string }
);

/**
 * The one way a unit enters the map: it takes the next number off the chronicle's counter, carries
 * its own copy of its kind's stats, and stands with its move points and its action full.
 */
export function entered(catalogue: Catalogue, chronicle: Chronicle, entering: Entering): Chronicle {
  const stats = { ...unitKind(catalogue, entering.type) };
  const carried = {
    id: chronicle.nextUnit,
    stats,
    tile: entering.tile,
    movePoints: stats.move,
    action: stats.action,
  };
  const dealt = (unit: Unit): Chronicle => ({
    ...chronicle,
    nextUnit: chronicle.nextUnit + 1,
    units: [...chronicle.units, unit],
  });

  switch (entering.faction) {
    case 'player':
      return dealt({ ...carried, faction: 'player' });
    case 'enemy':
      return dealt({ ...carried, faction: 'enemy', script: entering.script });
  }
}
