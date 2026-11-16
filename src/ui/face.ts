import { type CardKind, playedByNothing } from '../rules/cards';
import {
  type Aim,
  actionGoesTo,
  type Card,
  type Catalogue,
  cardMade,
  cardOf,
  costOf,
  influenceOf,
  type PlacedThing,
  placedBy,
} from '../rules/catalogue';
import type { CardId, Cost, MadeCard } from '../rules/state';
import { cardName, cardRules, text } from './text';

/** What the label at a face's foot reads, and what its tooltip says. */
export type FaceKind = CardKind | 'worker-action';

/** What the label at a face's foot reads. */
export function kindLabel(kind: FaceKind): string {
  return text(`kind.${kind}`);
}

/** What the tooltip of a face's kind label says. */
export function kindTooltip(kind: FaceKind): string {
  return text(`kind-tooltip.${kind}`);
}

/** The kind a card's face is labelled by. */
export function labelledKind(card: Card): FaceKind {
  switch (card.kind) {
    case 'action':
      return actionLabelled(card);
    case 'settle':
    case 'unit':
    case 'building':
    case 'instant':
    case 'hazard':
    case 'trophy':
    case 'challenge':
      return card.kind;
  }
}

/** The kind an action card's face is labelled by: naming the worker where it is played through one. */
function actionLabelled(aim: Aim): FaceKind {
  switch (actionGoesTo(aim)) {
    case 'worker':
      return 'worker-action';
    case 'any':
    case 'none':
      return 'action';
  }
}

/** The family a card's frame wears the colour of. */
export type CardFamily = PlacedThing | 'thing-done' | 'hazard' | 'challenge' | 'trophy';

/** A card's family: what its play places, and its kind where it places nothing. */
export function familyOf(card: Card): CardFamily {
  const placed = placedBy(card);
  if (placed !== undefined) return placed;
  switch (card.kind) {
    case 'hazard':
    case 'challenge':
    case 'trophy':
      return card.kind;
    case 'settle':
    case 'unit':
    case 'building':
    case 'action':
    case 'instant':
      return 'thing-done';
  }
}

/** The numbers an answer's text or the capstone's reads of the chronicle, by name. */
export type AnswerReading = Readonly<Record<string, number>>;

/**
 * What a face reads: what it stands, for whoever reads that back off the object it is drawn on; its
 * name, kind label, family and rules entry; its costs in the resource bar's order; the influence it
 * gains, none on a face that gains none; and whether nothing plays its card.
 */
export type Face = {
  readonly id: string;
  readonly name: string;
  readonly kind: FaceKind;
  readonly family: CardFamily;
  readonly rules: string;
  readonly costs: readonly Cost[];
  readonly influence: number;
  readonly playedByNothing: boolean;
};

/**
 * The face a card is drawn as, its rules entry reading the counters it carries and `city`, the
 * building of the city section it is drawn under: a chronicle's, or a civilization's.
 */
export function cardFace(catalogue: Catalogue, card: MadeCard, city: string | undefined): Face {
  const content = cardOf(catalogue, card.id);
  return {
    id: card.id,
    name: cardName(card.id),
    kind: labelledKind(content),
    family: familyOf(content),
    rules: cardRules(card, city),
    costs: costOf(catalogue, card.id),
    influence: influenceOf(content) ?? 0,
    playedByNothing: playedByNothing(content),
  };
}

/** The face a card is drawn as when its content makes it, at the counters it starts with. */
export function cardFaceAtStart(catalogue: Catalogue, id: CardId, city: string | undefined): Face {
  return cardFace(catalogue, cardMade(catalogue, id), city);
}

/**
 * The card a text names, made at the counters that text's reading hands under the names the card
 * declares, and at its start under every other.
 */
export function namedCardMade(catalogue: Catalogue, id: CardId, reading: AnswerReading): MadeCard {
  const declared = cardOf(catalogue, id).counters ?? {};
  const set = Object.fromEntries(
    Object.entries(reading).filter(([counter]) => Object.hasOwn(declared, counter)),
  );
  return cardMade(catalogue, id, set);
}

/**
 * The face a card a text names is drawn as: the card `namedCardMade` makes of that text's reading,
 * under no city section.
 */
export function namedCardFace(catalogue: Catalogue, id: CardId, reading: AnswerReading): Face {
  return cardFace(catalogue, namedCardMade(catalogue, id, reading), undefined);
}
