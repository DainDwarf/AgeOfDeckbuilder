import { type River, type Tile, type TileCoords, tileKey } from './map';
import type { Resources } from './resources';
import type { Rng } from './rng';
import type { Unit } from './units';

/** What took the city: an enemy captured it, or it was left without population. */
export type DefeatCause = 'capture' | 'population';

/** The city's fall, recorded on the chronicle it ended: what took it, and the turn it fell on. */
export type Defeat = { readonly cause: DefeatCause; readonly turn: number };

/** `PH_` marks a stand-in: none of these is authored content, and every one of them goes. */
export type CardId =
  | 'PH_Worker'
  | 'PH_Warrior'
  | 'PH_Farm'
  | 'PH_March'
  | 'PH_Harvest'
  | 'PH_Mine'
  | 'PH_Urbanisation';

/** Everything one city's story is made of, and the generator every later draw comes from. */
export type Chronicle = {
  readonly seed: number;
  readonly rng: Rng;
  readonly tiles: Tile[];
  /** The rivers the generator ran, each the corners it passes through along the edges between tiles. */
  readonly rivers: River[];
  readonly city: TileCoords;
  readonly held: TileCoords[];
  readonly turn: number;
  readonly resources: Resources;
  readonly population: number;
  /** The tiles an inhabitant stands on, at most one to a tile; every other inhabitant is idle. */
  readonly assigned: TileCoords[];
  readonly units: Unit[];
  readonly drawPile: CardId[];
  readonly hand: CardId[];
  readonly discardPile: CardId[];
  readonly defeat?: Defeat;
};

/**
 * What the city or the map has against a card or a claim the cost alone would let through: the city
 * down to the last inhabitant it keeps, no inhabitant idle to turn into a unit or to stand on a
 * tile, a unit already on the city tile, no tile to aim at, no unit to refresh.
 */
export type Block = 'population' | 'idle' | 'city' | 'tile' | 'unit';

/** Whether the tile is inside the city's border: what a card's aim and a city-mode click both ask. */
export function holds(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.held.some((coord) => tileKey(coord) === tileKey(tile));
}

/** The inhabitants on no tile: what a unit card takes, and what an assign has to give a tile. */
export function idle(chronicle: Chronicle): number {
  return chronicle.population - chronicle.assigned.length;
}
