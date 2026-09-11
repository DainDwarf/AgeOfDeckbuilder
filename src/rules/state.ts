import { type River, type Tile, type TileCoords, tileKey } from './map';
import type { Resource, Resources } from './resources';
import type { Rng } from './rng';
import { type EnemyScriptId, type Faction, UNIT_STATS, type Unit, type UnitTypeId } from './units';

/** What took the city: an enemy captured it, or it was left without population. */
export type DefeatCause = 'capture' | 'population';

/** The city's fall, recorded on the chronicle it ended: what took it, and the turn it fell on. */
export type Defeat = { readonly cause: DefeatCause; readonly turn: number };

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type EventId = 'PH_Raid' | 'PH_Famine';

/** `PH_` marks a stand-in: none of these is authored content, and every one of them goes. */
export type CardId =
  | 'PH_Worker'
  | 'PH_Warrior'
  | 'PH_Farm'
  | 'PH_March'
  | 'PH_Harvest'
  | 'PH_Mine'
  | 'PH_Road'
  | 'PH_Urbanisation'
  | 'PH_Recall'
  | 'PH_Spoils'
  | 'PH_Hunger';

/** What a snapshot keeps of the unit that stood on the tile: what its mark is drawn from. */
export type SnapshotUnit = { readonly type: UnitTypeId; readonly faction: Faction };

/**
 * One tile as it was last in sight, and the unit standing on it then. The player's own units carry
 * sight with them and are never stale, so none of them is ever kept here.
 */
export type Snapshot = TileCoords & { readonly tile: Tile; readonly unit?: SnapshotUnit };

/** Everything one city's story is made of, and the generator every later draw comes from. */
export type Chronicle = {
  readonly seed: number;
  readonly rng: Rng;
  readonly tiles: Tile[];
  /**
   * Every tile that has been in sight, as it was last seen: what the map draws of a tile in fog. A
   * tile absent from it is uncharted. Rivers never move, so no snapshot keeps one.
   */
  readonly snapshots: Snapshot[];
  /** The rivers the generator ran, each the corners it passes through along the edges between tiles. */
  readonly rivers: River[];
  readonly city: TileCoords;
  readonly held: TileCoords[];
  readonly turn: number;
  /**
   * The turn the schedule's next event is due, rolled at the founding and again each time one lands:
   * the events phase draws on that turn and on no other.
   */
  readonly nextEvent: number;
  /**
   * The entries the events phase dealt, in the order dealt, and none at all while no deal stands.
   * While one does the chronicle waits on the take: it has no hand, and every other command is
   * refused.
   */
  readonly deal: readonly EventId[];
  readonly resources: Resources;
  readonly population: number;
  /** The tiles an inhabitant stands on, at most one to a tile; every other inhabitant is idle. */
  readonly assigned: TileCoords[];
  readonly units: Unit[];
  /**
   * The number the next unit to enter is named by. It only counts up, so a killed unit's number is
   * never dealt again, and the first unit of a chronicle is one — never zero.
   */
  readonly nextUnit: number;
  readonly drawPile: CardId[];
  readonly hand: CardId[];
  readonly discardPile: CardId[];
  readonly defeat?: Defeat;
};

/**
 * What a card's aim has against one tile: no worker of the player's standing there, the tile
 * outside the border, the wrong terrain, the building slot filled, the improvement already laid, no
 * unit of the player's standing there, its move points full.
 */
export type TileBlock = 'worker' | 'border' | 'terrain' | 'slot' | 'improvement' | 'unit' | 'move';

/**
 * What the city or the map has against a card or a claim the cost alone would let through: the city
 * down to the last inhabitant it keeps, no inhabitant idle to turn into a unit or to stand on a
 * tile, a unit already on the city tile, an empty discard pile with no card to come back out of it,
 * and every reason an aim turns a tile down.
 */
export type Block = 'population' | 'idle' | 'city' | 'discard-pile' | TileBlock;

/** What one thing asks for of one resource: a card's cost line by line, a claim's culture. */
export type Cost = { readonly resource: Resource; readonly amount: number };

/** Everything standing between the city and a card or a claim: what it cannot pay, and the map. */
export type Refusal = {
  readonly unaffordable: readonly Resource[];
  readonly blocked: readonly Block[];
};

/** What a card outside the hand is drawn as: nothing refuses it. */
export const NO_REFUSAL: Refusal = { unaffordable: [], blocked: [] };

export function playable(refusal: Refusal): boolean {
  return refusal.unaffordable.length === 0 && refusal.blocked.length === 0;
}

/** The resources a cost outruns; empty means the city can pay it. */
export function unaffordable(chronicle: Chronicle, costs: readonly Cost[]): Resource[] {
  return costs
    .filter(({ resource, amount }) => amount > chronicle.resources[resource])
    .map(({ resource }) => resource);
}

/** Whether the tile is inside the city's border: what a card's aim and a city-mode click both ask. */
export function holds(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.held.some((coord) => tileKey(coord) === tileKey(tile));
}

/**
 * Whether an inhabitant stands on the tile: what an assign, both ends of a drag in city mode and the
 * mark the map puts on a tile all ask.
 */
export function assignedTo(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.assigned.some((coord) => tileKey(coord) === tileKey(tile));
}

/** The inhabitants on no tile: what a unit card takes, and what an assign has to give a tile. */
export function idle(chronicle: Chronicle): number {
  return chronicle.population - chronicle.assigned.length;
}

/** What a unit entering the map is: its kind, the tile it stands on, and who it acts for. */
export type Entering = { readonly type: UnitTypeId; readonly tile: TileCoords } & (
  | { readonly faction: 'player' }
  | { readonly faction: 'enemy'; readonly script: EnemyScriptId }
);

/**
 * The one way a unit enters the map: it takes the next number off the chronicle's counter, carries
 * its own copy of its kind's stats, and stands with its move points and its action full.
 */
export function entered(chronicle: Chronicle, entering: Entering): Chronicle {
  const stats = { ...UNIT_STATS[entering.type] };
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
