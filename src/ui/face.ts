import type { CardKind } from '../rules/cards';
import { type Catalogue, cardMade, cardOf } from '../rules/catalogue';
import { costOf } from '../rules/chronicle';
import { answerOf } from '../rules/schedule';
import type { CardId, Chronicle, ChronicleCard, Cost } from '../rules/state';
import { answerName, answerRules, capstoneName, capstoneRules, cardName, cardRules } from './text';

/** What the label at a face's foot reads, and what its tooltip says. */
export type FaceKind = CardKind | 'event' | 'capstone';

/** The numbers an answer's rules entry reads of the chronicle it is dealt on, by name. */
export type AnswerReading = Readonly<Record<string, number>>;

/**
 * What a face reads: what it stands, for whoever reads that back off the object it is drawn on; its
 * name; the kind it is labelled by; its rules entry; and what it costs, in the order the resource
 * bar reads the resources.
 */
export type Face = {
  readonly id: string;
  readonly name: string;
  readonly kind: FaceKind;
  readonly rules: string;
  readonly costs: readonly Cost[];
  /** What a card named on it is made at: an answer's reading, and nothing on any other face. */
  readonly reading: AnswerReading;
};

/** The face a card in a chronicle is drawn as, its rules entry reading the counters it carries. */
export function cardFace(catalogue: Catalogue, card: ChronicleCard): Face {
  return {
    id: card.id,
    name: cardName(card.id),
    kind: cardOf(catalogue, card.id).kind,
    rules: cardRules(card),
    costs: costOf(catalogue, card.id),
    reading: {},
  };
}

/** The face a card is drawn as when its content makes it, at the counters it starts with. */
export function cardFaceAtStart(catalogue: Catalogue, id: CardId): Face {
  return cardFace(catalogue, cardMade(catalogue, id));
}

/**
 * The face a card named on a face is drawn as: made at the counters that face's reading hands under
 * the names the card declares, and at its start under every other.
 */
export function namedCardFace(catalogue: Catalogue, id: CardId, reading: AnswerReading): Face {
  const declared = cardOf(catalogue, id).counters ?? {};
  const set = Object.fromEntries(
    Object.entries(reading).filter(([counter]) => Object.hasOwn(declared, counter)),
  );
  return cardFace(catalogue, cardMade(catalogue, id, set));
}

/** The face a capstone is drawn as: it costs nothing, and its rules entry reads no numbers. */
export function capstoneFace(id: string): Face {
  return {
    id,
    name: capstoneName(id),
    kind: 'capstone',
    rules: capstoneRules(id),
    costs: [],
    reading: {},
  };
}

/**
 * The face an answer of an event is drawn as: its rules entry, and the cards it names, read on the
 * chronicle it was dealt on. What the answer costs reads in that entry, so the face wears no chip
 * for it.
 */
export function answerFace(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  id: string,
): Face {
  const reading = answerOf(catalogue, event, id).reads(catalogue, chronicle);
  return {
    id,
    name: answerName(id),
    kind: 'event',
    rules: answerRules(id, reading),
    costs: [],
    reading,
  };
}
