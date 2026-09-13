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
import {
  type Block,
  type CardId,
  type Chronicle,
  entered,
  holds,
  idle,
  type TileBlock,
} from './state';
import { refreshedMovePoints, spentAction, type UnitTypeId, unitAt } from './units';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['unit', 'building', 'instant', 'hazard'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

/**
 * What a card is played at, and what it does with what it was played at. An aim of `none` lands
 * whole, and names what blocks it where the map or the city can hold it up; a `tile` aim answers the
 * first reason it refuses a tile for and nothing at all on one it admits, and hands its effect the
 * tile that was chosen; a `unit` aim is the same over the tiles a unit of the player's stands on,
 * which it is asked of before its own reasons; a `discard-pile` aim names what blocks it the way an
 * aim of `none` does, and hands its effect where in the discard pile the card that was chosen lies.
 * The effect takes the chronicle the card's cost is paid on.
 */
export type Aim =
  | {
      readonly aim: 'none';
      readonly blocked?: (chronicle: Chronicle) => Block[];
      readonly effect: (paid: Chronicle) => Chronicle;
    }
  | {
      readonly aim: 'tile';
      readonly refuses: (chronicle: Chronicle, tile: Tile) => TileBlock | undefined;
      readonly effect: (paid: Chronicle, at: TileCoords) => Chronicle;
    }
  | {
      readonly aim: 'unit';
      readonly refuses: (chronicle: Chronicle, tile: Tile) => TileBlock | undefined;
      readonly effect: (paid: Chronicle, at: TileCoords) => Chronicle;
    }
  | {
      readonly aim: 'discard-pile';
      readonly blocked: (chronicle: Chronicle) => Block[];
      readonly effect: (paid: Chronicle, at: number) => Chronicle;
    };

/**
 * A card: its kind, which a list of cards sorts and labels by, and its cost. The three kinds the
 * player's deck holds declare the aim and effect they are played through, and the noun such a card
 * names — the unit it puts on the map, the building it builds — is named by its effect and nowhere
 * else. A hazard declares its strike alone, its kind fixing everything else about it.
 */
export type Card = { readonly cost: Partial<Resources> } & (
  | ({
      readonly kind: 'unit' | 'building' | 'instant';
      readonly singleUse?: true;
    } & Aim)
  | {
      readonly kind: 'hazard';
      /** What it does to the chronicle at the end of a turn it is still in the hand. */
      readonly strikes: (chronicle: Chronicle) => Chronicle;
    }
);

/** How a card the player picks a tile for is played: what the hand aims and the map lights for. */
export type AimedCard = Extract<Aim, { readonly aim: 'tile' | 'unit' }>;

/**
 * How a card is played, whatever its kind: what it is aimed at, and what it does with what it was
 * aimed at. A hazard is aimed at nothing and does nothing when it is played.
 */
export function aimOf(card: Card): Aim {
  switch (card.kind) {
    case 'unit':
    case 'building':
    case 'instant':
      return card;
    case 'hazard':
      return { aim: 'none', effect: (paid) => paid };
  }
}

/**
 * Whether a card played leaves the chronicle instead of going to the discard pile: what single use
 * says of the card carrying it, and what paying a hazard is.
 */
export function leavesChronicle(card: Card): boolean {
  switch (card.kind) {
    case 'unit':
    case 'building':
    case 'instant':
      return card.singleUse === true;
    case 'hazard':
      return true;
  }
}

/**
 * The hazards of the hand striking, in hand order, each on the chronicle the one before it left, and
 * the chronicle untouched where the hand holds none.
 */
export function struck(chronicle: Chronicle): Chronicle {
  let standing = chronicle;
  for (const id of chronicle.hand) {
    const card = CARDS[id];
    switch (card.kind) {
      case 'unit':
      case 'building':
      case 'instant':
        break;
      case 'hazard':
        standing = card.strikes(standing);
        break;
    }
  }
  return standing;
}

/**
 * The one reason a card aimed at a tile refuses this one, and nothing at all on a tile it admits:
 * what the aim's kind asks of the tile, then what the card's own aim does. Every path that lights a
 * tile, plays on one or says why it was turned down asks here.
 */
export function refuses(chronicle: Chronicle, card: AimedCard, tile: Tile): TileBlock | undefined {
  switch (card.aim) {
    case 'tile':
      return card.refuses(chronicle, tile);
    case 'unit':
      return firstRefusal(unitThere(chronicle, tile), card.refuses(chronicle, tile));
  }
}

/** The first check that refuses, in the order the aim hands them over: the one reason it answers. */
function firstRefusal(...checks: readonly (TileBlock | undefined)[]): TileBlock | undefined {
  return checks.find((reason) => reason !== undefined);
}

/** A worker of the player's standing on the tile, with action left to spend. */
function worked(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  if (standing?.faction !== 'player' || !standing.stats.worker) return 'worker';
  return standing.action > 0 ? undefined : 'action';
}

/**
 * How a card played through a worker is aimed, the check and the spend as one pair so neither is
 * written without the other: the worker's reasons come before the tile's, and the worker standing on
 * the tile spends one of its action as the card's own effect lands.
 */
function throughWorker(
  refusesTile: (chronicle: Chronicle, tile: Tile) => TileBlock | undefined,
  effect: (paid: Chronicle, at: TileCoords) => Chronicle,
): Aim & { readonly aim: 'tile' } {
  return {
    aim: 'tile',
    refuses: (chronicle, tile) =>
      firstRefusal(worked(chronicle, tile), refusesTile(chronicle, tile)),
    effect: (paid, at) => effect(acted(paid, at), at),
  };
}

/** The unit standing on the tile with one of its action spent. */
function acted(paid: Chronicle, at: TileCoords): Chronicle {
  const acting = unitAt(paid.units, at)?.id;
  return {
    ...paid,
    units: paid.units.map((unit) => (unit.id === acting ? spentAction(unit) : unit)),
  };
}

/** The tile inside the city's border: what a building card asks for and an instant does not. */
function inside(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return holds(chronicle, tile) ? undefined : 'border';
}

/** The terrains a building stands on, an improvement lies on, or a terraform starts from. */
function made(tile: Tile, terrains: readonly Terrain[]): TileBlock | undefined {
  return terrains.includes(tile.terrain) ? undefined : 'terrain';
}

/** A tile's one building slot, free: what a building fills and a terraform needs empty. */
function slotFree(tile: Tile): TileBlock | undefined {
  return tile.building === undefined ? undefined : 'slot';
}

/** No copy of this improvement on the tile: distinct ones stack, the same one never twice. */
function unimproved(tile: Tile, improvement: ImprovementId): TileBlock | undefined {
  return tile.improvements.includes(improvement) ? 'improvement' : undefined;
}

/** A unit of the player's standing on the tile: the whole of what a card aimed at a unit admits. */
function unitThere(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return unitAt(chronicle.units, tile)?.faction === 'player' ? undefined : 'unit';
}

/** Move points a refresh has room to bring back up: a unit that has spent none is already full. */
function movePointsSpent(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  return standing !== undefined && standing.movePoints < standing.stats.move ? undefined : 'move';
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
    effect: (paid) =>
      entered(
        { ...paid, population: paid.population - 1 },
        {
          type,
          faction: 'player',
          tile: paid.city,
        },
      ),
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

/** The move points an instant refreshes, on the unit standing on the tile it was aimed at. */
function refreshed(paid: Chronicle, at: TileCoords): Chronicle {
  const marching = unitAt(paid.units, at)?.id;
  return {
    ...paid,
    units: paid.units.map((unit) => (unit.id === marching ? refreshedMovePoints(unit) : unit)),
  };
}

/** The card a recall brings back: it leaves the discard pile for the back of the hand. */
function recalled(paid: Chronicle, at: number): Chronicle {
  return {
    ...paid,
    hand: [...paid.hand, paid.discardPile[at]],
    discardPile: paid.discardPile.filter((_, index) => index !== at),
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
    ...throughWorker(
      (chronicle, tile) =>
        firstRefusal(
          made(tile, BUILDINGS.PH_Farm.terrains),
          inside(chronicle, tile),
          slotFree(tile),
        ),
      (paid, at) => built(paid, at, 'PH_Farm'),
    ),
  },
  PH_March: {
    kind: 'instant',
    cost: {},
    aim: 'unit',
    refuses: movePointsSpent,
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
    ...throughWorker(
      (_, tile) =>
        firstRefusal(made(tile, IMPROVEMENTS.PH_Mine.terrains), unimproved(tile, 'PH_Mine')),
      (paid, at) => improved(paid, at, 'PH_Mine'),
    ),
  },
  PH_Road: {
    kind: 'instant',
    cost: { production: 2 },
    ...throughWorker(
      (_, tile) =>
        firstRefusal(made(tile, IMPROVEMENTS.PH_Road.terrains), unimproved(tile, 'PH_Road')),
      (paid, at) => improved(paid, at, 'PH_Road'),
    ),
  },
  PH_Urbanisation: {
    kind: 'instant',
    cost: { production: 5 },
    ...throughWorker(
      (_, tile) => firstRefusal(made(tile, ['plain']), slotFree(tile)),
      (paid, at) => terraformed(paid, at, 'urban'),
    ),
  },
  PH_Recall: {
    kind: 'instant',
    cost: { science: 2 },
    aim: 'discard-pile',
    blocked: (chronicle) => (chronicle.discardPile.length === 0 ? ['discard-pile'] : []),
    effect: recalled,
  },
  PH_Spoils: {
    kind: 'instant',
    cost: {},
    singleUse: true,
    aim: 'none',
    effect: (paid) =>
      gained(paid, { food: 10, production: 10, military: 10, money: 10, science: 10 }),
  },
  PH_Hunger: {
    kind: 'hazard',
    cost: { production: 3 },
    strikes: (chronicle) => ({
      ...chronicle,
      resources: { ...chronicle.resources, food: 0 },
    }),
  },
};

export type DeckId = 'PH_Deck' | 'PH_LongDeck';

/** What the decks are built from: a card won on the map joins a chronicle and no deck. */
const FOUNDING_CARDS: readonly CardId[] = [
  'PH_Worker',
  'PH_Warrior',
  'PH_Farm',
  'PH_March',
  'PH_Harvest',
  'PH_Mine',
  'PH_Road',
  'PH_Urbanisation',
  'PH_Recall',
];

/** The decks a chronicle can be founded on: two copies of each card above, or five. */
export const DECKS: Record<DeckId, readonly CardId[]> = {
  PH_Deck: copies(2),
  PH_LongDeck: copies(5),
};

function copies(count: number): readonly CardId[] {
  return FOUNDING_CARDS.flatMap((id) => Array<CardId>(count).fill(id));
}
