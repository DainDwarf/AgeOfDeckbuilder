/**
 * What the collection screen computes before it draws: the order its stacks and a deck's rows stand
 * in, and what a civilization counts.
 */

import { type Campaign, type CampaignCivilization, civilizationIn } from '../rules/campaign';
import { CARD_KINDS } from '../rules/cards';
import { type Catalogue, cardAge, cardOf } from '../rules/catalogue';
import type { CardId } from '../rules/state';

/** A card standing once, and how many copies of it are held where it stands. */
export type CollectionStack = { readonly id: CardId; readonly copies: number };

/**
 * Every card of the cards handed once, with its copies: by age in the order of history, then by kind
 * in the kinds' declared order, then by the name the player reads it by; cards alike in all three in
 * the catalogue's order. A card the catalogue does not hold is refused.
 */
export function stacksOf(
  catalogue: Catalogue,
  collection: readonly { readonly id: CardId }[],
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

/** A civilization's settle section and its deck, each card once as a row with the copies it holds. */
export type DeckRows = {
  readonly settle: readonly CollectionStack[];
  readonly cards: readonly CollectionStack[];
};

/**
 * The rows of the campaign's civilization of that name, each section in the collection's order, the
 * city section's card in neither. A name the campaign does not hold, and a number naming no card of
 * the collection, are refused.
 */
export function deckRowsOf(
  catalogue: Catalogue,
  campaign: Campaign,
  civilization: string,
  nameOf: (card: CardId) => string,
): DeckRows {
  const { settle, cards } = civilizationIn(catalogue, campaign, civilization);
  const rows = (ids: readonly CardId[]): CollectionStack[] =>
    stacksOf(
      catalogue,
      ids.map((id) => ({ id })),
      nameOf,
    );
  return { settle: rows(settle), cards: rows(cards) };
}

/** How many copies of the card the deck holds, its settle section and the rest together. */
export function heldIn(deck: DeckRows, card: CardId): number {
  return [...deck.settle, ...deck.cards]
    .filter(({ id }) => id === card)
    .reduce((held, { copies }) => held + copies, 0);
}

/** What a civilization counts: its cards, and its settle cards with the city section's card among them. */
export function countsOf(owned: CampaignCivilization): {
  readonly cards: number;
  readonly settle: number;
} {
  return { cards: owned.cards.length, settle: owned.settle.length + 1 };
}
