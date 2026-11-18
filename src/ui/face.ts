import { type CardKind, playedByNothing } from '../rules/cards';
import {
  type Card,
  type Catalogue,
  cardMade,
  cardOf,
  costOf,
  influenceOf,
  type Placing,
  placingOf,
  unitKind,
} from '../rules/catalogue';
import { MOVE_POINT, type Terrain } from '../rules/map';
import {
  type BuildingKind,
  buildingKind,
  improvementKind,
  type LayerKind,
} from '../rules/map-kinds';
import { RESOURCES, type Resource, type Resources } from '../rules/resources';
import type { CardId, Cost, MadeCard } from '../rules/state';
import { type ArtThing, type CardArt, cardArtOf } from './art-box';
import { cardName, cardRules, text } from './text';
import type { Reference } from './text-run';

/**
 * What the label at a face's foot reads, and what its tooltip says: an action's names the worker, the
 * one unit content plays an action through.
 */
export type FaceKind = Exclude<CardKind, 'action'> | 'worker-action';

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
      return 'worker-action';
    case 'settle':
    case 'unit':
    case 'building':
    case 'improvement':
    case 'instant':
    case 'hazard':
    case 'trophy':
    case 'challenge':
      return card.kind;
  }
}

/** The two windows a plain front is drawn with. */
export type FrontWindow = 'arched' | 'oval';

/** The front a card wears: a plain one in its kind's colour through one of its windows, or the decorated one. */
export type CardFront =
  | { readonly front: 'plain'; readonly kind: CardKind; readonly window: FrontWindow }
  | { readonly front: 'decorated' };

/**
 * A card's front: the decorated one on the card whose play places the city, else the plain one in its
 * kind's colour, the oval window on a card whose play places a thing and the arched on the rest.
 */
export function cardFront(card: Card): CardFront {
  const placing = placingOf(card);
  if (placing?.thing === 'city') return { front: 'decorated' };
  return { front: 'plain', kind: card.kind, window: placing === undefined ? 'arched' : 'oval' };
}

/** The window a front is drawn with: the decorated front's is the plain oval one's. */
export function frontWindowOf(front: CardFront): FrontWindow {
  switch (front.front) {
    case 'plain':
      return front.window;
    case 'decorated':
      return 'oval';
  }
}

/** The picture a card's art box holds: the window it fills, the terrain of its ground, and what stands on it. */
export type ArtPicture = {
  readonly window: FrontWindow;
  readonly ground: Terrain;
  readonly holds: ArtThing;
};

/**
 * What stands in a card's art box where it holds what its play places: its unit, its building, or the
 * building of the city section it is drawn under, and nothing under none; a card placing anything
 * else is refused.
 */
function placedThingOf(
  catalogue: Catalogue,
  id: CardId,
  city: string | undefined,
): ArtThing | undefined {
  const placing = placingOf(cardOf(catalogue, id));
  if (placing === undefined) throw new Error(`the card ${id} places nothing its art box can hold`);
  switch (placing.thing) {
    case 'unit':
      return { kind: 'unit', type: unitKind(catalogue, placing.unit).type };
    case 'building':
      return { kind: 'building', building: placing.building };
    case 'city':
      return city === undefined ? undefined : { kind: 'building', building: city };
    case 'improvement':
      throw new Error(`no painting holds the improvement the card ${id} places`);
  }
}

/**
 * The picture a card's art box holds under `city`, the building of the city section it is drawn
 * under, as `art` names it; nothing where it names none, and nothing for the city's card under no
 * city section.
 */
export function artPictureOf(
  catalogue: Catalogue,
  id: CardId,
  art: CardArt | undefined,
  city: string | undefined,
): ArtPicture | undefined {
  if (art === undefined) return undefined;
  const holds = art.holds === 'placed' ? placedThingOf(catalogue, id, city) : art.holds;
  if (holds === undefined) return undefined;
  return { window: frontWindowOf(cardFront(cardOf(catalogue, id))), ground: art.ground, holds };
}

/** Every building a city section holds: each civilization's, and each a technology unlocks. */
export function citySectionBuildings(catalogue: Catalogue): string[] {
  return [
    ...Object.values(catalogue.civilizations).map(({ city }) => city.building),
    ...Object.values(catalogue.technologies).flatMap(({ unlocks }) =>
      unlocks.city === undefined ? [] : [unlocks.city.building],
    ),
  ];
}

/** The numbers an answer's text or the capstone's reads of the chronicle, by name. */
export type AnswerReading = Readonly<Record<string, number>>;

/** The stats a unit's card reads of its unit on badges at its foot, the left corner's first. */
export const BADGE_STATS = ['damage', 'health'] as const;

export type BadgeStat = (typeof BADGE_STATS)[number];

/** The stats a unit's card reads of its unit in its text box, row by row and each row left to right. */
export const BOX_STATS = [
  ['move', 'action'],
  ['range', 'sight'],
] as const;

export type BoxStat = (typeof BOX_STATS)[number][number];

/** A stat a unit's card reads of its unit. */
export type CardStat = BadgeStat | BoxStat;

/** A count of hundredths as the move points it is worth: what every card reads one by. */
export function inMovePoints(hundredths: number): string {
  return (hundredths / MOVE_POINT).toString();
}

/** What a stat a unit's card reads reads: its number, the move in move points. */
export function statReading(stat: CardStat, amount: number): string {
  switch (stat) {
    case 'move':
      return inMovePoints(amount);
    case 'damage':
    case 'health':
    case 'action':
    case 'range':
    case 'sight':
      return String(amount);
  }
}

/** What the tooltip of a stat a unit's card reads says: the stat's name, over its sentence. */
export function statTooltip(stat: CardStat): { readonly name: string; readonly sentence: string } {
  return { name: text(`label.${stat}`), sentence: text(`tooltip.${stat}`) };
}

/** A mark of what a card's thing goes on: a terrain, a feature or a building, or the river. */
export type GoesOn =
  | Extract<Reference, { readonly kind: 'terrain' | 'feature' | 'building' }>
  | { readonly kind: 'river' };

/**
 * What a face reads; `id` is what it stands, for whoever reads that back off the object it is drawn
 * on, and an influence or a range of nought is none.
 */
export type Face = {
  readonly id: string;
  readonly name: string;
  readonly kind: FaceKind;
  readonly front: CardFront;
  readonly rules: string;
  readonly costs: readonly Cost[];
  readonly influence: number;
  readonly playedByNothing: boolean;
  /** What the thing the card places goes on. */
  readonly goesOn: readonly GoesOn[];
  /** One resource to each point that thing gives at income, and to each it takes as its upkeep. */
  readonly gives: readonly Resource[];
  readonly takes: readonly Resource[];
  readonly range: number;
  /** The stats of the unit the card places, its kind's, and nothing on a card that places none. */
  readonly stats: Readonly<Record<CardStat, number>> | undefined;
  /** The picture its art box holds, and nothing where it shows its kind's colour, pale. */
  readonly art: ArtPicture | undefined;
};

/** The range a building that gives to the tiles beside it gives over. */
const BESIDE_RANGE = 1;

/** One resource to each point of the amounts, in the order the resource bar reads. */
function onePerPoint(amounts: Partial<Resources>): Resource[] {
  return RESOURCES.flatMap((resource) => Array<Resource>(amounts[resource] ?? 0).fill(resource));
}

/**
 * The thing a play places on the ground, as the content holds it, and the building it is built over
 * where it is; nothing for a unit, and nothing for the city section's building under no city section.
 */
function placedOf(
  catalogue: Catalogue,
  placing: Placing,
  city: string | undefined,
): { readonly kind: BuildingKind; readonly over?: string } | undefined {
  switch (placing.thing) {
    case 'unit':
      return undefined;
    case 'building':
      return { kind: buildingKind(catalogue, placing.building), over: placing.over };
    case 'city':
      return city === undefined ? undefined : { kind: buildingKind(catalogue, city) };
    case 'improvement':
      return { kind: improvementKind(catalogue, placing.improvement) };
  }
}

/**
 * What a thing goes on: the building it is built over, else the features it names, else its
 * terrains, and the river last where it asks for one.
 */
function goesOnOf({ terrains, features, river }: LayerKind, over: string | undefined): GoesOn[] {
  if (over !== undefined) return [{ kind: 'building', id: over }];
  const ground: GoesOn[] =
    features !== undefined && features.length > 0
      ? features.map((id) => ({ kind: 'feature', id }))
      : terrains.map((id) => ({ kind: 'terrain', id }));
  return river === true ? [...ground, { kind: 'river' }] : ground;
}

/** What a face reads of the thing its card places on the ground, and the text that leads its own. */
type PlacedReading = Pick<Face, 'goesOn' | 'gives' | 'takes' | 'range'> & {
  readonly leads?: string;
};

const NOTHING_PLACED: PlacedReading = { goesOn: [], gives: [], takes: [], range: 0 };

/**
 * What a card's face reads of the thing it places on the ground: what it goes on, and what it gives
 * and takes, or for a building giving to the tiles beside it the one text saying so and its range.
 */
export function placedReading(
  catalogue: Catalogue,
  card: Card,
  city: string | undefined,
): PlacedReading {
  const placing = placingOf(card);
  const placed = placing === undefined ? undefined : placedOf(catalogue, placing, city);
  if (placed === undefined) return NOTHING_PLACED;
  const { kind, over } = placed;
  const goesOn = goesOnOf(kind, over);
  const takes = onePerPoint(kind.upkeep ?? {});
  if (kind.givesBeside === undefined) {
    return { goesOn, gives: onePerPoint(kind.yields), takes, range: 0 };
  }
  const values = {
    gives: numbersRun('gives', onePerPoint(kind.givesBeside.yields)),
    terrain: kind.givesBeside.terrain,
  };
  const leads =
    takes.length === 0
      ? text('face.in-range', values)
      : text('face.in-range-taking', { ...values, takes: numbersRun('takes', takes) });
  return { goesOn, gives: [], takes: [], range: BESIDE_RANGE, leads };
}

/** The stats a card reads of the unit it places, its kind's, and nothing for a card placing none. */
export function cardStats(catalogue: Catalogue, card: Card): Face['stats'] {
  const placing = placingOf(card);
  if (placing?.thing !== 'unit') return undefined;
  const { damage, health, move, action, range, sight } = unitKind(catalogue, placing.unit);
  return { damage, health, move, action, range, sight };
}

/** Numbers as a text runs them: the sign, then one glyph to each point. */
export function numbersRun(sign: 'gives' | 'takes', points: readonly Resource[]): string {
  return `${text(`face.${sign}`)}${points.map((resource) => `[${resource}]`).join('')}`;
}

/**
 * The face a card is drawn as under `city`, the building of the city section it is drawn under, a
 * chronicle's or a civilization's: its text the one a building giving in its range reads, over its
 * rules entry read at the counters the card carries.
 */
export function cardFace(catalogue: Catalogue, card: MadeCard, city: string | undefined): Face {
  const content = cardOf(catalogue, card.id);
  const { leads, ...placed } = placedReading(catalogue, content, city);
  const sentence = cardRules(card);
  return {
    id: card.id,
    name: cardName(card.id),
    kind: labelledKind(content),
    front: cardFront(content),
    rules: leads === undefined || sentence === '' ? (leads ?? sentence) : `${leads}\n${sentence}`,
    costs: costOf(catalogue, card.id),
    influence: influenceOf(content) ?? 0,
    playedByNothing: playedByNothing(content),
    ...placed,
    stats: cardStats(catalogue, content),
    art: artPictureOf(catalogue, card.id, cardArtOf(card.id), city),
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
