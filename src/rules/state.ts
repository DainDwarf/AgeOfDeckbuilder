import { type River, type Tile, type TileCoords, tileKey } from './map';
import { RESOURCES, type Resource, type Resources } from './resources';
import type { Rng } from './rng';
import type { Faction, Unit } from './units';

/** What took the city: an enemy captured it, or it was left without population. */
export type DefeatCause = 'capture' | 'population';

/**
 * How a chronicle ended and the turn it ended on: in victory, the capstone passed, or in defeat,
 * the city fallen to what the cause names.
 */
export type Ending = { readonly turn: number } & (
  | { readonly outcome: 'victory' }
  | { readonly outcome: 'defeat'; readonly cause: DefeatCause }
);

export type CardId = string;

/**
 * One chronicle's roll of its schedule, from a generator of its own that nothing the player does
 * steps: the schedule it rolls and draws from, the turn the next deal is due on, and the capstone by
 * its id with the turn it lands on.
 */
export type Timeline = {
  readonly schedule: string;
  readonly rng: Rng;
  readonly next: number;
  readonly capstone: { readonly id: string; readonly turn: number };
};

/** One deal waiting on the take: an event, which deals its answers, or a captured camp's rewards. */
export type Deal =
  | { readonly of: 'event'; readonly event: string }
  | { readonly of: 'camp'; readonly rewards: readonly CardId[] };

/** What a snapshot keeps of the unit that stood on the tile: what its mark is drawn from. */
export type SnapshotUnit = { readonly type: string; readonly faction: Faction };

/**
 * One tile as it was last in sight, and the unit standing on it then. The player's own units carry
 * sight with them and are never stale, so none of them is ever kept here.
 */
export type Snapshot = TileCoords & { readonly tile: Tile; readonly unit?: SnapshotUnit };

/** Everything one city's story is made of, and the generator every later draw comes from. */
export type Chronicle = {
  /** The version of the catalogue the chronicle was begun on, and the only one it is played on. */
  readonly content: string;
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
  /** The map's centre part: the whole of what is in sight on the settle phase before the city stands. */
  readonly centre: TileCoords[];
  /** The tile the city stands on, and nothing at all until the settle puts it on one. */
  readonly city?: TileCoords;
  readonly held: TileCoords[];
  readonly turn: number;
  /** The turn the events phase deals next on, and the capstone. */
  readonly timeline: Timeline;
  /**
   * The deals waiting on the take, the one standing first, and none at all while no deal stands.
   * While one does the chronicle waits on the take: it has no hand, and every other command is
   * refused.
   */
  readonly deals: readonly Deal[];
  readonly resources: Resources;
  readonly population: number;
  /**
   * The tiles population stands on, at most one to a tile; the rest of the population is idle. Its
   * order is the order assigned — every writer appends — and one population taken with none idle
   * comes off the last entry.
   */
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
  /** How the chronicle ended, and nothing at all while it runs: an ended one takes no command. */
  readonly ending?: Ending;
};

/** What a card's aim has against one tile. */
export type TileBlock =
  | 'tile-uncharted'
  | 'no-worker'
  | 'worker-spent'
  | 'outside-border'
  | 'inside-border'
  | 'wrong-terrain'
  | 'slot-filled'
  | 'other-faction'
  | 'improvement-laid'
  | 'no-unit'
  | 'unit-standing'
  | 'move-full'
  | 'no-claim';

/**
 * What the city or the map has against a card or a claim the cost alone would let through: the city
 * down to the last population it keeps, no population idle to turn into a unit or to stand on a tile,
 * a unit already on the city tile, an empty discard pile with no card to come back out of it, and
 * every reason an aim turns a tile down.
 */
export type Block = 'population' | 'idle' | 'city' | 'discard-pile' | TileBlock;

/** What one thing asks for of one resource: a card's cost line by line, a claim's culture. */
export type Cost = { readonly resource: Resource; readonly amount: number };

/** A cost, resource by resource, in the order the resource bar reads; an amount of nought costs nothing. */
export function costsOf(cost: Partial<Resources>): Cost[] {
  const entries: Cost[] = [];
  for (const resource of RESOURCES) {
    const amount = cost[resource] ?? 0;
    if (amount !== 0) entries.push({ resource, amount });
  }
  return entries;
}

/** The chronicle with a cost paid out of the city's stocks. */
export function paid(chronicle: Chronicle, costs: readonly Cost[]): Chronicle {
  const resources = { ...chronicle.resources };
  for (const { resource, amount } of costs) resources[resource] -= amount;
  return { ...chronicle, resources };
}

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

/**
 * Whether the chronicle stands on the settle phase, before its first turn: nothing else reads the
 * turn counter's zero.
 */
export function onSettlePhase(chronicle: Chronicle): boolean {
  return chronicle.turn === 0;
}

/** Whether the tile is inside the city's border: what a card's aim and a city-mode click both ask. */
export function holds(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.held.some((coord) => tileKey(coord) === tileKey(tile));
}

/**
 * Whether population stands on the tile: what an assign, both ends of a drag in city mode and the
 * mark the map puts on a tile all ask.
 */
export function assignedTo(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.assigned.some((coord) => tileKey(coord) === tileKey(tile));
}

/** The population on no tile: what a unit card takes, and what an assign has to give a tile. */
export function idle(chronicle: Chronicle): number {
  return chronicle.population - chronicle.assigned.length;
}
