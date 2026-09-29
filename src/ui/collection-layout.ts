/** What the collection screen computes before it draws: the order its stacks stand in. */

import type { CampaignCard } from '../rules/campaign';
import { CARD_KINDS } from '../rules/cards';
import { type Catalogue, cardAge, cardOf } from '../rules/catalogue';
import type { CardId } from '../rules/state';

/** A card of the collection, standing once, and how many copies of it the collection holds. */
export type CollectionStack = { readonly id: CardId; readonly copies: number };

/**
 * Every card of the collection once, with its copies: by age in the order of history, then by kind in
 * the kinds' declared order, then by the name the player reads it by; cards alike in all three in
 * the catalogue's order. A card the catalogue does not hold is refused.
 */
export function stacksOf(
  catalogue: Catalogue,
  collection: readonly CampaignCard[],
  nameOf: (card: CardId) => string,
): CollectionStack[] {
  const copies = new Map<CardId, number>();
  for (const { id } of collection) copies.set(id, (copies.get(id) ?? 0) + 1);
  const ages = Object.keys(catalogue.ages);
  const listed = Object.keys(catalogue.cards);
  return [...copies]
    .map(([id, held]) => ({
      stack: { id, copies: held },
      age: ages.indexOf(cardAge(catalogue, id)),
      kind: CARD_KINDS.indexOf(cardOf(catalogue, id).kind),
      name: nameOf(id),
      listed: listed.indexOf(id),
    }))
    .sort(
      (a, b) =>
        a.age - b.age || a.kind - b.kind || a.name.localeCompare(b.name) || a.listed - b.listed,
    )
    .map(({ stack }) => stack);
}
