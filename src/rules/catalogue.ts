import { BUILDINGS, type TileCoords } from './map';
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
 * script an enemy can carry, and the unit a camp enters with the script it carries. A unit and a
 * script are named by their key.
 */
export type Catalogue = {
  readonly version: string;
  readonly units: Readonly<Record<string, UnitStats>>;
  readonly scripts: Readonly<Record<string, EnemyScript>>;
  readonly camp: { readonly unit: string; readonly script: string };
};

/**
 * The one way a catalogue is built, refused whole where it does not hold together: every unit kind
 * names itself by its key, the camp's unit and script are held, and the camp's unit stands on every
 * terrain a camp lies on.
 */
export function catalogued(content: Catalogue): Catalogue {
  for (const [id, kind] of Object.entries(content.units)) {
    if (kind.type !== id) refuse(content, `the unit kind ${id} names itself ${kind.type}`);
  }
  const campUnit = unitKind(content, content.camp.unit);
  enemyScript(content, content.camp.script);
  for (const terrain of BUILDINGS.PH_Camp.terrains) {
    if (!standsOn(campUnit, { q: 0, r: 0, terrain, improvements: [] })) {
      refuse(content, `the camp's unit ${content.camp.unit} cannot stand on ${terrain}`);
    }
  }
  return content;
}

/** The stats a unit of that kind enters the map with; a kind the catalogue does not hold is refused. */
export function unitKind(catalogue: Catalogue, id: string): UnitStats {
  if (!Object.hasOwn(catalogue.units, id)) refuse(catalogue, `no unit kind is named ${id}`);
  return catalogue.units[id];
}

/** The script an enemy names; a script the catalogue does not hold is refused. */
export function enemyScript(catalogue: Catalogue, id: string): EnemyScript {
  if (!Object.hasOwn(catalogue.scripts, id)) refuse(catalogue, `no enemy script is named ${id}`);
  return catalogue.scripts[id];
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

/** Every refusal of the content goes through here, its message opening with the version refusing. */
function refuse(catalogue: Catalogue, reason: string): never {
  throw new Error(`${catalogue.version}: ${reason}`);
}
