/**
 * What is computed before cards stand in the collection's order: the collection screen's stacks, a
 * deck's rows, a civilization's browse and a chronicle pile's, and what a civilization counts.
 */

import { type Campaign, type CampaignCivilization, civilizationIn } from '../rules/campaign';
import { CARD_KINDS } from '../rules/cards';
import { type Catalogue, cardAge, cardOf } from '../rules/catalogue';
import type { CardId, ChronicleCard } from '../rules/state';

/** A card standing once, and how many copies of it are held where it stands. */
export type CollectionStack = { readonly id: CardId; readonly copies: number };

/** Where a card stands in the collection's order, read once for every card sorted. */
type Place = {
  readonly age: number;
  readonly kind: number;
  readonly name: string;
  readonly listed: number;
};

/**
 * Where each card stands in the collection's order: by age in the order of history, then by kind in
 * the kinds' declared order, then by the name the player reads it by; cards alike in all three in
 * the catalogue's order. A card the catalogue does not hold is refused.
 */
function placesOf(catalogue: Catalogue, nameOf: (card: CardId) => string): (id: CardId) => Place {
  const ages = Object.keys(catalogue.ages);
  const listed = Object.keys(catalogue.cards);
  return (id) => ({
    age: ages.indexOf(cardAge(catalogue, id)),
    kind: CARD_KINDS.indexOf(cardOf(catalogue, id).kind),
    name: nameOf(id),
    listed: listed.indexOf(id),
  });
}

function byPlace(a: Place, b: Place): number {
  return a.age - b.age || a.kind - b.kind || a.name.localeCompare(b.name) || a.listed - b.listed;
}

/** Every card of the cards handed once, with its copies, in the collection's order. */
export function stacksOf(
  catalogue: Catalogue,
  collection: readonly { readonly id: CardId }[],
  nameOf: (card: CardId) => string,
): CollectionStack[] {
  const copies = new Map<CardId, number>();
  for (const { id } of collection) copies.set(id, (copies.get(id) ?? 0) + 1);
  const placeOf = placesOf(catalogue, nameOf);
  return [...copies]
    .map(([id, held]) => ({ stack: { id, copies: held }, place: placeOf(id) }))
    .sort((a, b) => byPlace(a.place, b.place))
    .map(({ stack }) => stack);
}

/** A card of a chronicle's pile standing once, and how many copies that read the same the pile holds. */
export type PileStack = { readonly card: ChronicleCard; readonly copies: number };

/**
 * Every card of a chronicle's pile once for each reading of its counters, with the copies that read
 * so, in the collection's order; the stacks of one card by their counters, the smaller first, read in
 * the order the card declares them. Where a card lies in the pile is read nowhere.
 */
export function pileStacksOf(
  catalogue: Catalogue,
  pile: readonly ChronicleCard[],
  nameOf: (card: CardId) => string,
): PileStack[] {
  const byCounters = (a: ChronicleCard, b: ChronicleCard): number => {
    for (const counter of Object.keys(cardOf(catalogue, a.id).counters ?? {})) {
      const apart = a.counters[counter] - b.counters[counter];
      if (apart !== 0) return apart;
    }
    return 0;
  };
  const stacks: { card: ChronicleCard; copies: number }[] = [];
  for (const card of pile) {
    const alike = stacks.find(
      (stack) => stack.card.id === card.id && byCounters(stack.card, card) === 0,
    );
    if (alike === undefined) stacks.push({ card, copies: 1 });
    else alike.copies += 1;
  }
  const placeOf = placesOf(catalogue, nameOf);
  return stacks
    .map((stack) => ({ stack, place: placeOf(stack.card.id) }))
    .sort((a, b) => byPlace(a.place, b.place) || byCounters(a.stack.card, b.stack.card))
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

/** What a civilization's browse stands: the count of every card it holds, and each card once with its copies. */
export type Browse = { readonly count: number; readonly stacks: readonly CollectionStack[] };

/**
 * The browse of the campaign's civilization of that name: the city section's card first, then the
 * settle section, then the deck, each section in the collection's order. A name the campaign does
 * not hold is refused.
 */
export function browseOf(
  catalogue: Catalogue,
  campaign: Campaign,
  civilization: string,
  nameOf: (card: CardId) => string,
): Browse {
  const { city } = civilizationIn(catalogue, campaign, civilization);
  const { settle, cards } = deckRowsOf(catalogue, campaign, civilization, nameOf);
  const stacks = [{ id: city.card, copies: 1 }, ...settle, ...cards];
  return { count: stacks.reduce((held, { copies }) => held + copies, 0), stacks };
}

/**
 * The rows that stood, in the order they stood, each reading the copies the deck holds of its card
 * now, a card it no longer holds among them at none.
 */
export function standingIn(stood: DeckRows, deck: DeckRows): DeckRows {
  const now = (rows: readonly CollectionStack[]): CollectionStack[] =>
    rows.map(({ id }) => ({ id, copies: heldIn(deck, id) }));
  return { settle: now(stood.settle), cards: now(stood.cards) };
}

/** How many copies of the card the stacks hold together, and none where no stack is of it. */
export function copiesIn(stacks: readonly CollectionStack[], card: CardId): number {
  return stacks.filter(({ id }) => id === card).reduce((held, { copies }) => held + copies, 0);
}

/** How many copies of the card the deck holds, its settle section and the rest together. */
export function heldIn(deck: DeckRows, card: CardId): number {
  return copiesIn([...deck.settle, ...deck.cards], card);
}

/** What a civilization counts: its cards, and its settle cards with the city section's card among them. */
export function countsOf(owned: CampaignCivilization): {
  readonly cards: number;
  readonly settle: number;
} {
  return { cards: owned.cards.length, settle: owned.settle.length + 1 };
}
