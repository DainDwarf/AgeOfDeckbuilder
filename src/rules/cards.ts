import type { Resources } from './chronicle';
import type { BuildingTypeId, ImprovementId, Terrain } from './map';
import type { UnitTypeId } from './units';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['unit', 'building', 'order', 'action'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

/** What the player picks to play a card: nothing, a tile, or a unit. */
export type TargetType = 'none' | 'tile' | 'unit';

/**
 * The one effect an action card has: resources into the city's stores, the improvement it improves
 * a tile with, or the terrain it terraforms into the other. A card that takes a tile aims at `tile`
 * and one that lands whole at `none`.
 */
export type ActionEffect =
  | { readonly effect: 'gain'; readonly gain: Partial<Resources> }
  | { readonly effect: 'improve'; readonly improvement: ImprovementId }
  | { readonly effect: 'terraform'; readonly from: Terrain; readonly to: Terrain };

/** An action card: its cost, what it is aimed at, and the one effect it resolves as. */
export type ActionCard = {
  readonly kind: 'action';
  readonly cost: Partial<Resources>;
  readonly target: TargetType;
} & ActionEffect;

/**
 * A unit card names the unit it puts on the map, a building card the building it builds, an action
 * card its one effect; no other kind carries any of them.
 */
export type Card =
  | {
      readonly kind: 'unit';
      readonly cost: Partial<Resources>;
      readonly target: TargetType;
      readonly unitType: UnitTypeId;
    }
  | {
      readonly kind: 'building';
      readonly cost: Partial<Resources>;
      readonly target: TargetType;
      readonly building: BuildingTypeId;
    }
  | ActionCard
  | {
      readonly kind: Exclude<CardKind, 'unit' | 'building' | 'action'>;
      readonly cost: Partial<Resources>;
      readonly target: TargetType;
    };

/** `PH_` marks a stand-in: none of these is authored content, and every one of them goes. */
export type CardId =
  | 'PH_Worker'
  | 'PH_Warrior'
  | 'PH_Farm'
  | 'PH_March'
  | 'PH_Harvest'
  | 'PH_Mine'
  | 'PH_Urbanisation';

export const CARDS: Record<CardId, Card> = {
  PH_Worker: { kind: 'unit', cost: { food: 2 }, target: 'none', unitType: 'PH_Worker' },
  PH_Warrior: { kind: 'unit', cost: { military: 2 }, target: 'none', unitType: 'PH_Warrior' },
  PH_Farm: { kind: 'building', cost: { production: 3 }, target: 'tile', building: 'PH_Farm' },
  PH_March: { kind: 'order', cost: {}, target: 'unit' },
  PH_Harvest: {
    kind: 'action',
    cost: { science: 1 },
    target: 'none',
    effect: 'gain',
    gain: { food: 2 },
  },
  PH_Mine: {
    kind: 'action',
    cost: { production: 3 },
    target: 'tile',
    effect: 'improve',
    improvement: 'PH_Mine',
  },
  PH_Urbanisation: {
    kind: 'action',
    cost: { production: 5 },
    target: 'tile',
    effect: 'terraform',
    from: 'plain',
    to: 'urban',
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
