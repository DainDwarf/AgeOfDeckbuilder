import type { Resources } from './chronicle';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['unit', 'building', 'order', 'action'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

export type Card = { readonly kind: CardKind; readonly cost: Partial<Resources> };

/** `PH_` marks a stand-in: none of these is authored content, and every one of them goes. */
export type CardId = 'PH_Worker' | 'PH_Warrior' | 'PH_Farm' | 'PH_March' | 'PH_Harvest';

export const CARDS: Record<CardId, Card> = {
  PH_Worker: { kind: 'unit', cost: { food: 2 } },
  PH_Warrior: { kind: 'unit', cost: { military: 2 } },
  PH_Farm: { kind: 'building', cost: { production: 3 } },
  PH_March: { kind: 'order', cost: {} },
  PH_Harvest: { kind: 'action', cost: { science: 1 } },
};

/** The one deck there is: two copies of each card. */
export const DECK: readonly CardId[] = (Object.keys(CARDS) as CardId[]).flatMap((id) => [id, id]);
