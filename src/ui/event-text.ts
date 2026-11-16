import { ageOf, type Catalogue } from '../rules/catalogue';
import { answerCase, answerOf } from '../rules/schedule';
import type { Chronicle } from '../rules/state';
import type { AnswerReading } from './face';
import { withValues } from './text';

/** One line of an answer's text: its sentence, and the number of the answer's it hangs on, where it hangs on one. */
type Line = string | { readonly line: string; readonly while: string };

/** An entry: a name or a text of one line, or a text listing a line to each thing it does. */
type Entry = string | readonly Line[];

/**
 * Every event's name and every answer's name and text, one entry each, kept out of `text.ts`, the
 * file the glossary lint reads: the lint binds neither the names, which are lore, nor the texts.
 */
const EVENT_TEXT: Readonly<Record<string, Entry>> = {
  'event.lean-season': 'Lean season',
  'answer.share': 'Share food',
  'answer-text.share': 'Add [card:hunger] to the top of the draw pile',
  'answer.ration': 'Keep to yourself',
  'answer-text.ration': 'Your [building:{building}] is attacked by {warriors} [enemy:warrior]',
  'event.rival-band': 'A rival band',
  'answer.make-room': 'Make room',
  'answer-text.make-room.camp':
    'A [building:{camp}] with {warriors} [enemy:warrior] is placed near your [building:{building}]',
  'answer-text.make-room.raid':
    'Your [building:{building}] is attacked by {warriors} [enemy:warrior]',
  'answer.show-your-spears': 'Show your spears',
  'answer-text.show-your-spears': 'Pay {military}[military]',
  'event.wildfire': 'Wildfire',
  'answer.let-the-fields-burn': 'Let the fields burn',
  'answer-text.let-the-fields-burn': 'Lose {food}[food]',
  'answer.firebreak': 'Cut a firebreak',
  'answer-text.firebreak': 'Pay {production}[production]',
  'event.stone-wildfire': 'Wildfire',
  'answer.stone-let-the-fields-burn': 'Let the fields burn',
  'answer-text.stone-let-the-fields-burn': 'Lose {food}[food]',
  'answer.stone-firebreak': 'Cut a firebreak',
  'answer-text.stone-firebreak': 'Pay {production}[production]',
  'answer.burn-the-forest': 'Burn the forest',
  'answer-text.burn-the-forest': 'Add [card:embers] to the discard pile',
  'event.departure': 'Departure',
  'answer.let-them-go': 'Let them go',
  'answer-text.let-them-go': 'Lose one population',
  'answer.keep-them': 'Keep them',
  'answer-text.keep-them': 'Pay {culture}[culture]',
  'event.flood': 'Flood',
  'answer.lose-the-fields': 'Lose the fields',
  'answer-text.lose-the-fields': [
    {
      line: 'The flood removes {improvements} improvement near your city',
      while: 'improvements',
    },
    { line: 'The flood removes {buildings} building inside your border', while: 'buildings' },
    { line: 'The flood removes your city', while: 'city' },
  ],
  'answer.settle-the-floodplain': 'Settle the floodplain',
  'answer-text.settle-the-floodplain': 'Add [card:floodplain] to the discard pile',
  'answer.dig-channels': 'Dig channels',
  'answer-text.dig-channels': 'Pay {production}[production]',
  'event.bad-air': 'Bad air and angry spirits',
  'answer.bury-the-dead': 'Bury the dead',
  'answer-text.bury-the-dead': 'Kills {population} population',
  'answer.live-with-it': 'Live with it',
  'answer-text.live-with-it': 'Add [card:sickness] to the discard pile',
  'answer.help-the-healers': 'Help the healers',
  'answer-text.help-the-healers': 'Pay {science}[science]',
  'event.strangers': 'Strangers',
  'answer.take-them-in': 'Take them in',
  'answer-text.take-them-in': [
    'Gain {population} population',
    'Add [card:misunderstandings] to the discard pile',
  ],
  'answer.refuse-them': 'Refuse them',
  'answer-text.refuse-them': [],
  'event.predators': 'Predators',
  'answer.abandon-a-herd': 'Abandon a herd',
  'answer-text.abandon-a-herd': [
    { line: 'The wolves remove {deer} [feature:deer] near your city', while: 'deer' },
    { line: 'The wolves remove {cattle} [feature:cattle] near your city', while: 'cattle' },
  ],
  'answer.let-the-farmers-handle-it': 'Let the farmers handle it',
  'answer-text.let-the-farmers-handle-it': 'Add [card:wolves] to the discard pile',
  'answer.defend-the-herds': 'Defend the herds',
  'answer-text.defend-the-herds': 'Pay {military}[military]',
  'event.drought': 'Drought',
  'answer.rain-dance': 'Rain dance',
  'answer-text.rain-dance': 'Add [card:rain-dance] to the discard pile',
  'answer.rationing': 'Rationing',
  'answer-text.rationing': 'Pay {food}[food]',
  'answer.buy-grain': 'Buy grain',
  'answer-text.buy-grain': 'Pay {money}[money]',
  'event.travellers': 'Travellers',
  'answer.trade-with-them': 'Trade with them',
  'answer-text.trade-with-them': 'Gain {money}[money]',
  'answer.share-stories': 'Share stories',
  'answer-text.share-stories': 'Gain {culture}[culture]',
  'event.grievance': 'A grievance',
  'answer.escalate': 'Escalate',
  'answer-text.escalate.war': 'Declare war',
  'answer-text.escalate.camp':
    'A [building:{camp}] with {warriors} [enemy:warrior] is placed near your [building:{building}]',
  'answer-text.escalate.raid':
    'Your [building:{building}] is attacked by {warriors} [enemy:warrior]',
  'answer.pay-tribute': 'Pay tribute',
  'answer-text.pay-tribute': 'Add [card:tribute] to the discard pile',
  'answer.send-gifts': 'Send gifts',
  'answer-text.send-gifts': 'Pay {culture}[culture]',
  'event.herd': 'The herd',
  'answer.hunt-it': 'Hunt it',
  'answer-text.hunt-it': 'Gain {food}[food]',
  'answer.follow-it': 'Follow it',
  'answer-text.follow-it':
    'Near your city, one [terrain:forest] gains [feature:deer] or one [terrain:plain] gains [feature:cattle]',
  'nothing-happens': 'Nothing happens',
};

/** What an event is named on the screen; an event no entry names is refused. */
export function eventName(event: string): string {
  return nameOf('event', event, 'the event');
}

/** What an answer is named on the screen; an answer no entry names is refused. */
export function answerName(answer: string): string {
  return nameOf('answer', answer, 'the answer');
}

/**
 * What an answer of an event reads on the chronicle it is dealt on: what it stands, for whoever reads
 * that back off the object it is drawn on; its name; its text, of the case it names; and the numbers
 * a card its text names is made at.
 */
export type AnswerShown = {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly reading: AnswerReading;
};

/**
 * What an answer's text is filled with on the chronicle: the numbers it reads, the city's building
 * and the age's camp's.
 */
function valuesOf(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  id: string,
): { reading: AnswerReading; values: Record<string, string | number> } {
  const reading = answerOf(catalogue, event, id).reads(catalogue, chronicle);
  const building = chronicle.citySection.building;
  const camp = ageOf(catalogue, chronicle.age).camp.building;
  return { reading, values: { ...reading, building, camp } };
}

/** An answer of the event as it reads on the chronicle, its text the case's it names there. */
export function answerShown(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  id: string,
): AnswerShown {
  const { reading, values } = valuesOf(catalogue, chronicle, event, id);
  const which = answerCase(catalogue, chronicle, event, id);
  return { id, name: answerName(id), text: answerText(id, values, which), reading };
}

/**
 * Every line of an answer's text read on the chronicle, of the case handed or its one text where
 * none is, those its numbers leave out included.
 */
export function answerLinesOfCase(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  id: string,
  which: string | undefined,
): AnswerLine[] {
  return answerLines(id, valuesOf(catalogue, chronicle, event, id).values, which);
}

/** One line of an answer's text read on its numbers, and whether they keep it on the screen. */
export type AnswerLine = { readonly line: string; readonly kept: boolean };

/**
 * Every line of an answer's text, the case handed's or its one text where none is, each filled with
 * its numbers and kept unless the number it hangs on is nought; an answer, or a case of it, no entry
 * names is refused, and so is a line hanging on a number not handed.
 */
function answerLines(
  answer: string,
  values: Record<string, string | number>,
  which: string | undefined,
): AnswerLine[] {
  const key = `answer-text.${which === undefined ? answer : `${answer}.${which}`}`;
  return linesOf(entryOf(key, `the answer ${answer}`)).map((each) => lineRead(each, values, key));
}

/** A line of the entry held under that key, read on the answer's numbers. */
function lineRead(each: Line, values: Record<string, string | number>, key: string): AnswerLine {
  switch (typeof each) {
    case 'string':
      return { line: withValues(each, values, key), kept: true };
    case 'object': {
      const hung = values[each.while];
      if (hung === undefined) throw new Error(`no value fills ${each.while} in ${key}`);
      return { line: withValues(each.line, values, key), kept: hung !== 0 };
    }
  }
}

/** The lines of an entry: a list's own, or the one line of any other. */
function linesOf(entry: Entry): readonly Line[] {
  switch (typeof entry) {
    case 'string':
      return [entry];
    case 'object':
      return entry;
  }
}

/**
 * What an answer's text reads on the screen: the lines `answerLines` keeps, one under the other, and
 * that nothing happens where it keeps none.
 */
export function answerText(
  answer: string,
  values: Record<string, string | number>,
  which: string | undefined,
): string {
  const kept = answerLines(answer, values, which).filter((each) => each.kept);
  return kept.length === 0
    ? oneLine('nothing-happens', 'nothing happening')
    : kept.map((each) => each.line).join('\n');
}

/** The entry a content id names under its prefix; an id no entry names, or one a list names, is refused. */
function nameOf(prefix: string, id: string, noun: string): string {
  return oneLine(`${prefix}.${id}`, `${noun} ${id}`);
}

/** The entry under that key, one line; a key no entry is held under, or a list, is refused. */
function oneLine(key: string, what: string): string {
  const entry = entryOf(key, what);
  switch (typeof entry) {
    case 'string':
      return entry;
    case 'object':
      throw new Error(`the entry naming ${what} is a list`);
  }
}

/** The entry under that key; a key no entry is held under is refused. */
function entryOf(key: string, what: string): Entry {
  if (!Object.hasOwn(EVENT_TEXT, key)) throw new Error(`no entry names ${what}`);
  return EVENT_TEXT[key];
}
