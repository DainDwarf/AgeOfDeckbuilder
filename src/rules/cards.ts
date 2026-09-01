import type { Resources } from './chronicle';
import type { BuildingTypeId } from './map';
import type { UnitTypeId } from './units';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['unit', 'building', 'order', 'action'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

/** What the player picks to play a card: nothing, a tile, or a unit and then the tile it goes to. */
export type TargetSort = 'none' | 'tile' | 'unit-tile';

/**
 * A unit card names the unit it puts on the map, a building card the building it builds, an action
 * card the resources it gains; no other kind carries any of them.
 */
export type Card =
  | {
      readonly kind: 'unit';
      readonly cost: Partial<Resources>;
      readonly target: TargetSort;
      readonly unitType: UnitTypeId;
    }
  | {
      readonly kind: 'building';
      readonly cost: Partial<Resources>;
      readonly target: TargetSort;
      readonly building: BuildingTypeId;
    }
  | {
      readonly kind: 'action';
      readonly cost: Partial<Resources>;
      readonly target: TargetSort;
      readonly gain: Partial<Resources>;
    }
  | {
      readonly kind: Exclude<CardKind, 'unit' | 'building' | 'action'>;
      readonly cost: Partial<Resources>;
      readonly target: TargetSort;
    };

/** `PH_` marks a stand-in: none of these is authored content, and every one of them goes. */
export type CardId = 'PH_Worker' | 'PH_Warrior' | 'PH_Farm' | 'PH_March' | 'PH_Harvest';

export const CARDS: Record<CardId, Card> = {
  PH_Worker: { kind: 'unit', cost: { food: 2 }, target: 'none', unitType: 'PH_Worker' },
  PH_Warrior: { kind: 'unit', cost: { military: 2 }, target: 'none', unitType: 'PH_Warrior' },
  PH_Farm: { kind: 'building', cost: { production: 3 }, target: 'tile', building: 'PH_Farm' },
  PH_March: { kind: 'order', cost: {}, target: 'unit-tile' },
  PH_Harvest: { kind: 'action', cost: { science: 1 }, target: 'none', gain: { food: 2 } },
};

/** The one deck there is: two copies of each card. */
export const DECK: readonly CardId[] = (Object.keys(CARDS) as CardId[]).flatMap((id) => [id, id]);
