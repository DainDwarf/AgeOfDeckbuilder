import type { CardKind } from '../rules/cards';
import {
  type Aim,
  actionGoesTo,
  type Card,
  type Catalogue,
  cardMade,
  cardOf,
  costOf,
  influenceOf,
} from '../rules/catalogue';
import { capstoneReading } from '../rules/schedule';
import type { CardId, Chronicle, Cost, MadeCard } from '../rules/state';
import { capstoneName, capstoneRules, cardName, cardRules, text } from './text';

/** What the label at a face's foot reads, and what its tooltip says. */
export type FaceKind = CardKind | 'worker-action' | 'capstone';

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

/** The numbers an answer's text or the capstone's rules entry reads of the chronicle, by name. */
export type AnswerReading = Readonly<Record<string, number>>;

/**
 * What a face reads: what it stands, for whoever reads that back off the object it is drawn on; its
 * name; the kind it is labelled by; its rules entry; what it costs, in the order the resource bar
 * reads the resources; and the influence it gains, none on a face that gains none.
 */
export type Face = {
  readonly id: string;
  readonly name: string;
  readonly kind: FaceKind;
  readonly rules: string;
  readonly costs: readonly Cost[];
  /** What a card named on it is made at: the capstone's reading, and nothing on any other face. */
  readonly reading: AnswerReading;
  readonly influence: number;
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
    rules: cardRules(card, city),
    costs: costOf(catalogue, card.id),
    reading: {},
    influence: influenceOf(content) ?? 0,
  };
}

/** The face a card is drawn as when its content makes it, at the counters it starts with. */
export function cardFaceAtStart(catalogue: Catalogue, id: CardId, city: string | undefined): Face {
  return cardFace(catalogue, cardMade(catalogue, id), city);
}

/**
 * The card a face names, made at the counters that face's reading hands under the names the card
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
 * The face a card named on a face is drawn as: the card `namedCardMade` makes of that face's reading,
 * under no city section.
 */
export function namedCardFace(catalogue: Catalogue, id: CardId, reading: AnswerReading): Face {
  return cardFace(catalogue, namedCardMade(catalogue, id, reading), undefined);
}

/**
 * The face the chronicle's capstone is drawn as: it costs nothing, and its rules entry and the cards
 * it names read the numbers it reads of that chronicle.
 */
export function capstoneFace(catalogue: Catalogue, chronicle: Chronicle): Face {
  const { id } = chronicle.timeline.capstone;
  const reading = capstoneReading(catalogue, chronicle, id);
  return {
    id,
    name: capstoneName(id),
    kind: 'capstone',
    rules: capstoneRules(id, reading),
    costs: [],
    reading,
    influence: 0,
  };
}
