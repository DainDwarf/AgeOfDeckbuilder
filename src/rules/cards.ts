import type { Resources } from './chronicle';

export type CardKind = 'unit' | 'building' | 'order' | 'action';

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
