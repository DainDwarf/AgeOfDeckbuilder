import {
  BUILDINGS,
  type BuildingTypeId,
  IMPROVEMENTS,
  type ImprovementId,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { RESOURCES, type Resources } from './resources';
import { type Block, type CardId, type Chronicle, holds, idle } from './state';
import { refreshedMovePoints, UNIT_STATS, type Unit, type UnitTypeId, unitAt } from './units';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['unit', 'building', 'instant'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

/**
 * What a card is played at, and what it does with what it was played at. An aim of `none` lands
 * whole, and names what blocks it where the map or the city can hold it up; a `tile` or a `unit` aim
 * admits the candidates its predicate lets through, is blocked when it admits none, and hands its
 * effect the one that was chosen. The effect takes the chronicle the card's cost is paid on.
 */
type Aim =
  | {
      readonly aim: 'none';
      readonly blocked?: (chronicle: Chronicle) => Block[];
      readonly effect: (paid: Chronicle) => Chronicle;
    }
  | {
      readonly aim: 'tile';
      readonly admits: (chronicle: Chronicle, tile: Tile) => boolean;
      readonly effect: (paid: Chronicle, at: TileCoords) => Chronicle;
    }
  | {
      readonly aim: 'unit';
      readonly admits: (chronicle: Chronicle, unit: Unit) => boolean;
      readonly effect: (paid: Chronicle, at: number) => Chronicle;
    };

/**
 * A card: its kind, which a list of cards sorts and labels by, its cost, and the aim and effect it
 * is played through. The noun a card names — the unit it puts on the map, the building it builds —
 * is named by its effect and nowhere else.
 */
export type Card = { readonly kind: CardKind; readonly cost: Partial<Resources> } & Aim;

/** A card the player picks something for: what the hand arms and the finder lists candidates for. */
export type AimedCard = Card & { readonly aim: 'tile' | 'unit' };

/** A worker of the player's standing on the tile: what a card played through a worker composes. */
function worked(chronicle: Chronicle, tile: TileCoords): boolean {
  const standing = unitAt(chronicle.units, tile);
  return standing?.faction === 'player' && standing.stats.id === 'PH_Worker';
}

/** Whether a tile's one building slot is free: what a building fills and a terraform needs empty. */
function slotFree(tile: Tile): boolean {
  return tile.building === undefined;
}

/** Where a building of this kind stands: the terrain it is built on, and a slot nothing fills. */
function buildable(tile: Tile, building: BuildingTypeId): boolean {
  return slotFree(tile) && tile.terrain === BUILDINGS[building].terrain;
}

/** Where an improvement of this kind goes: the terrain it lies on, and no copy of it there already. */
function improvable(tile: Tile, improvement: ImprovementId): boolean {
  return (
    tile.terrain === IMPROVEMENTS[improvement].terrain && !tile.improvements.includes(improvement)
  );
}

/**
 * How a unit card enters its unit, the block and the effect as one pair so neither is written
 * without the other: the city keeps its last inhabitant, needs one idle to turn into the unit, and
 * needs its own tile free; then one idle inhabitant becomes the unit, on the city's tile.
 */
function enters(type: UnitTypeId): Aim & { readonly aim: 'none' } {
  return {
    aim: 'none',
    blocked: (chronicle) => {
      const blocks: Block[] = [];
      if (chronicle.population <= 1) blocks.push('population');
      if (idle(chronicle) <= 0) blocks.push('idle');
      if (unitAt(chronicle.units, chronicle.city) !== undefined) blocks.push('city');
      return blocks;
    },
    effect: (paid) => ({
      ...paid,
      population: paid.population - 1,
      units: [
        ...paid.units,
        {
          stats: { ...UNIT_STATS[type] },
          faction: 'player',
          tile: paid.city,
          movePoints: UNIT_STATS[type].move,
          action: UNIT_STATS[type].action,
        },
      ],
    }),
  };
}

/** One tile of the map layered over, every other tile left as it stands. */
function retiled(paid: Chronicle, at: TileCoords, after: (tile: Tile) => Tile): Chronicle {
  const key = tileKey(at);
  return { ...paid, tiles: paid.tiles.map((tile) => (tileKey(tile) === key ? after(tile) : tile)) };
}

/** The building a building card builds: it fills the slot of the tile the card was aimed at. */
function built(paid: Chronicle, at: TileCoords, building: BuildingTypeId): Chronicle {
  return retiled(paid, at, (tile) => ({ ...tile, building }));
}

/** The improvement an instant lays: the tile carries it from now on, and the worker stays put. */
function improved(paid: Chronicle, at: TileCoords, improvement: ImprovementId): Chronicle {
  return retiled(paid, at, (tile) => ({
    ...tile,
    improvements: [...tile.improvements, improvement],
  }));
}

/** The terrain an instant terraforms into: the feature that lay on the old terrain goes with it. */
function terraformed(paid: Chronicle, at: TileCoords, to: Terrain): Chronicle {
  return retiled(paid, at, (tile) => ({ ...tile, terrain: to, feature: undefined }));
}

/** The move points an instant refreshes, on the one unit it was aimed at. */
function refreshed(paid: Chronicle, at: number): Chronicle {
  return {
    ...paid,
    units: paid.units.map((unit, index) => (index === at ? refreshedMovePoints(unit) : unit)),
  };
}

/** The resources an instant gains: they land in the city's stores. */
function gained(paid: Chronicle, gain: Partial<Resources>): Chronicle {
  const resources = { ...paid.resources };
  for (const resource of RESOURCES) resources[resource] += gain[resource] ?? 0;
  return { ...paid, resources };
}

export const CARDS: Record<CardId, Card> = {
  PH_Worker: { kind: 'unit', cost: { food: 2 }, ...enters('PH_Worker') },
  PH_Warrior: { kind: 'unit', cost: { military: 2 }, ...enters('PH_Warrior') },
  PH_Farm: {
    kind: 'building',
    cost: { production: 3 },
    aim: 'tile',
    admits: (chronicle, tile) =>
      holds(chronicle, tile) && buildable(tile, 'PH_Farm') && worked(chronicle, tile),
    effect: (paid, at) => built(paid, at, 'PH_Farm'),
  },
  PH_March: {
    kind: 'instant',
    cost: {},
    aim: 'unit',
    admits: (_chronicle, unit) => unit.faction === 'player' && unit.movePoints < unit.stats.move,
    effect: refreshed,
  },
  PH_Harvest: {
    kind: 'instant',
    cost: { science: 1 },
    aim: 'none',
    effect: (paid) => gained(paid, { food: 2 }),
  },
  PH_Mine: {
    kind: 'instant',
    cost: { production: 3 },
    aim: 'tile',
    admits: (chronicle, tile) => improvable(tile, 'PH_Mine') && worked(chronicle, tile),
    effect: (paid, at) => improved(paid, at, 'PH_Mine'),
  },
  PH_Urbanisation: {
    kind: 'instant',
    cost: { production: 5 },
    aim: 'tile',
    admits: (chronicle, tile) =>
      tile.terrain === 'plain' && slotFree(tile) && worked(chronicle, tile),
    effect: (paid, at) => terraformed(paid, at, 'urban'),
  },
};

export type DeckId = 'PH_Deck' | 'PH_LongDeck';

/** The decks a chronicle can be founded on: two copies of each card, or five. */
export const DECKS: Record<DeckId, readonly CardId[]> = {
  PH_Deck: copies(2),
  PH_LongDeck: copies(5),
};

function copies(count: number): readonly CardId[] {
  return (Object.keys(CARDS) as CardId[]).flatMap((id) => Array<CardId>(count).fill(id));
}
