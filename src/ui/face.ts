import { type CardKind, playedByNothing } from '../rules/cards';
import {
  bonusOf,
  type Captured,
  type Card,
  type Catalogue,
  captureOf,
  cardMade,
  cardOf,
  costOf,
  fullHealth,
  inCanoe,
  influenceOf,
  type Placing,
  placingOf,
  standsOnWaterAlone,
  unitKind,
} from '../rules/catalogue';
import type { PreparedAs } from '../rules/enemies';
import {
  type FeatureId,
  groundCost,
  type ImprovementId,
  MOVE_POINT,
  movementCost,
  type River,
  riversAlong,
  runsAlong,
  type Terrain,
  type Tile,
  type TilesBeside,
  tileKey,
  tilesAtCorner,
} from '../rules/map';
import {
  type BuildingKind,
  buildingKind,
  featureKind,
  improvementKind,
  type LayerKind,
  terrainKind,
} from '../rules/map-kinds';
import { RESOURCES, type Resource, type Resources, summed } from '../rules/resources';
import type { CardId, Chronicle, Cost, MadeCard } from '../rules/state';
import type { Faction, Unit } from '../rules/units';
import { type YieldPart, yieldParts } from '../rules/yields';
import { type ArtThing, buildingGroundOf, type CardArt, cardArtOf, unitGroundOf } from './art-box';
import {
  buildingName,
  cardName,
  cardRules,
  featureName,
  terrainName,
  text,
  unitName,
} from './text';
import { nameWritten, type Reference } from './text-run';

/**
 * What the label at a face's foot reads, and what its tooltip says: an action's names the worker, the
 * one unit content plays an action through.
 */
export type FaceKind = Exclude<CardKind, 'action'> | 'worker-action' | 'terrain' | 'feature';

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

/** The colour a front is turned to: a card kind's, or a terrain's face's. */
export type FrontColour = CardKind | 'terrain';

/** The colours the decorated front is turned to: the settle cards', and a terrain's face's. */
export type DecoratedColour = Extract<FrontColour, 'settle' | 'terrain'>;

/** The front a face wears: a plain one in its colour through one of its windows, or the decorated one in its colour. */
export type CardFront =
  | { readonly front: 'plain'; readonly colour: FrontColour; readonly window: FrontWindow }
  | { readonly front: 'decorated'; readonly colour: DecoratedColour };

/**
 * A card's front: the decorated one in the settle cards' colour on the card whose play places the
 * city, else the plain one in its kind's colour, the oval window on a card whose play places a thing
 * and the arched on the rest.
 */
export function cardFront(card: Card): CardFront {
  const placing = placingOf(card);
  if (placing?.thing === 'city') return { front: 'decorated', colour: 'settle' };
  return { front: 'plain', colour: card.kind, window: placing === undefined ? 'arched' : 'oval' };
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

/**
 * A tile inspected as its terrain's face holds it in its window: its place and what lies on it but its
 * building, the rivers running along it as far as the map draws them, and whether the discs of its
 * row stand.
 */
export type InspectedTile = {
  readonly kind: 'inspected';
  readonly tile: Pick<Tile, 'q' | 'r' | 'terrain' | 'feature' | 'improvements'>;
  readonly rivers: readonly River[];
  readonly discs: boolean;
};

/** The picture a card's art box holds: the window it fills, the terrain of its ground, and what stands on it. */
export type ArtPicture = {
  readonly window: FrontWindow;
  readonly ground: Terrain;
  readonly holds: ArtThing | InspectedTile;
};

/**
 * What stands in a card's art box where it holds what its play places: its unit, its building, its
 * improvement, or the building of the city section it is drawn under, and nothing under none; a card
 * placing nothing is refused.
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
      return { kind: 'improvement', improvement: placing.improvement };
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

/**
 * What the tooltip of a stat a unit's card reads says, or of the movement cost a terrain's face
 * reads: its name, over its sentence.
 */
export function statTooltip(stat: CardStat | 'movement-cost'): {
  readonly name: string;
  readonly sentence: string;
} {
  return { name: text(`label.${stat}`), sentence: text(`tooltip.${stat}`) };
}

/**
 * What entering a terrain is read to cost, out of what entering costs a unit embarked or ashore: the
 * cost ashore, or, where none is, the cost embarked; nothing where nothing crosses it.
 */
function movementCostRead(cost: (embarked: boolean) => number | undefined): number | undefined {
  return cost(false) ?? cost(true);
}

/**
 * A unit a face's window holds as the map paints it: its kind, whose it is, whether it stands in his
 * canoe, and what its prepare lands as where it has prepared.
 */
export type PaintedUnit = {
  readonly type: string;
  readonly faction: Faction;
  readonly canoed: boolean;
  readonly prepares: PreparedAs | undefined;
};

/** A mark of what a card's thing goes on: a terrain, a feature or a building, or the river. */
export type GoesOn =
  | Extract<Reference, { readonly kind: 'terrain' | 'feature' | 'building' }>
  | { readonly kind: 'river' };

/**
 * What the disc at a face's foot's right corner reads where no influence stands there: a symbol's
 * glyph beside its reading.
 */
export type FootDisc = { readonly symbol: 'range' | 'move'; readonly reading: string };

/**
 * What a face reads; `id` is what it stands, for whoever reads that back off the object it is drawn
 * on, and an influence of nought is none.
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
  /** The range a building gives over, or what entering a terrain costs; nothing on any other face. */
  readonly footDisc: FootDisc | undefined;
  /**
   * What each stat reads of the unit the card places, its kind's, or of the unit the face reads; and
   * nothing on a face reading no unit.
   */
  readonly stats: Readonly<Record<CardStat, string>> | undefined;
  /** The picture its art box holds, and nothing where it shows its kind's colour, pale. */
  readonly art: ArtPicture | undefined;
  /** The unit its window holds over its picture, and nothing on a face holding none. */
  readonly unit: PaintedUnit | undefined;
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
type PlacedReading = Pick<Face, 'goesOn' | 'gives' | 'takes' | 'footDisc'> & {
  readonly leads?: string;
};

const NOTHING_PLACED: PlacedReading = { goesOn: [], gives: [], takes: [], footDisc: undefined };

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
  return placed === undefined ? NOTHING_PLACED : thingReading(placed);
}

/** What a face reads of a thing on the ground of that kind, built over the building `over` names. */
function thingReading({
  kind,
  over,
}: {
  readonly kind: BuildingKind;
  readonly over?: string;
}): PlacedReading {
  const goesOn = goesOnOf(kind, over);
  const takes = onePerPoint(kind.upkeep ?? {});
  if (kind.givesBeside === undefined) {
    return { goesOn, gives: onePerPoint(kind.yields), takes, footDisc: undefined };
  }
  const values = {
    gives: numbersRun('gives', onePerPoint(kind.givesBeside.yields)),
    terrain: kind.givesBeside.terrain,
  };
  const leads =
    takes.length === 0
      ? text('face.in-range', values)
      : text('face.in-range-taking', { ...values, takes: numbersRun('takes', takes) });
  return {
    goesOn,
    gives: [],
    takes: [],
    footDisc: { symbol: 'range', reading: String(BESIDE_RANGE) },
    leads,
  };
}

/** The stats a card reads of the unit it places, its kind's, and nothing for a card placing none. */
export function cardStats(catalogue: Catalogue, card: Card): Face['stats'] {
  const placing = placingOf(card);
  if (placing?.thing !== 'unit') return undefined;
  const { damage, health, move, action, range, sight } = unitKind(catalogue, placing.unit);
  return {
    damage: statReading('damage', damage),
    health: statReading('health', health),
    move: statReading('move', move),
    action: statReading('action', action),
    range: statReading('range', range),
    sight: statReading('sight', sight),
  };
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
  return {
    id: card.id,
    name: cardName(card.id),
    kind: labelledKind(content),
    front: cardFront(content),
    rules: ledBy(leads, cardRules(card)),
    costs: costOf(catalogue, card.id),
    influence: influenceOf(content) ?? 0,
    playedByNothing: playedByNothing(content),
    ...placed,
    stats: cardStats(catalogue, content),
    art: artPictureOf(catalogue, card.id, cardArtOf(card.id), city),
    unit: undefined,
  };
}

/** A face's text: the text its thing leads with, on a line over its sentence, either alone where the other is none. */
function ledBy(leads: string | undefined, sentence: string): string {
  return leads === undefined || sentence === '' ? (leads ?? sentence) : `${leads}\n${sentence}`;
}

/** The face a card is drawn as when its content makes it, at the counters it starts with. */
export function cardFaceAtStart(catalogue: Catalogue, id: CardId, city: string | undefined): Face {
  return cardFace(catalogue, cardMade(catalogue, id), city);
}

/**
 * What a building's face is: the card whose play places it, drawn under the city section it is where
 * that card places the city; or, where no card places it, what it is in its age's content.
 */
export type BuildingFacing =
  | ({ readonly wears: 'card' } & PlacedBy)
  | { readonly wears: 'own'; readonly captured: Captured };

/** The card whose play places a building, and the city section it is drawn under. */
type PlacedBy = { readonly card: CardId; readonly city: string | undefined };

/**
 * The one card whose play `places` holds of, and nothing where none does; a thing two cards place is
 * refused, `thing` naming it.
 */
function placedByOne(
  catalogue: Catalogue,
  thing: string,
  places: (placing: Placing, card: Card) => boolean,
): CardId | undefined {
  const placing = Object.entries(catalogue.cards).flatMap(([id, card]) => {
    const placed = placingOf(card);
    return placed !== undefined && places(placed, card) ? [id] : [];
  });
  if (placing.length > 1) throw new Error(`${thing} is placed by both ${placing.join(' and ')}`);
  return placing[0];
}

/**
 * What the building's face is; a building two cards place is refused, and so is one no card places
 * that no age holds as its camp, a site or its neutral's city.
 */
export function buildingFacing(catalogue: Catalogue, building: string): BuildingFacing {
  const cities = citySectionBuildings(catalogue);
  const card = placedByOne(catalogue, `the building ${building}`, (places) =>
    placesBuilding(places, building, cities),
  );
  if (card !== undefined) {
    const city = placingOf(cardOf(catalogue, card))?.thing === 'city' ? building : undefined;
    return { wears: 'card', card, city };
  }
  for (const age of Object.keys(catalogue.ages)) {
    const capture = captureOf(catalogue, age, building);
    if (capture !== undefined) return { wears: 'own', captured: capture.takes };
  }
  throw new Error(
    `no card places the building ${building}, and no age holds it as its camp, a site or its neutral's city`,
  );
}

/**
 * Whether a play placing that places the building: as a building of its own, or, placing the city,
 * as the building of one of the city sections `cities` holds.
 */
function placesBuilding(places: Placing, building: string, cities: readonly string[]): boolean {
  switch (places.thing) {
    case 'building':
      return places.building === building;
    case 'city':
      return cities.includes(building);
    case 'unit':
    case 'improvement':
      return false;
  }
}

/**
 * The face a building wears: the face of the card whose play places it, as its content makes it, the
 * city's card holding the building; or, where no card places it, a face of its own, the building
 * card's front and window, reading what it is, what it stands on and what it gives and takes.
 */
export function buildingFace(catalogue: Catalogue, building: string): Face {
  const facing = buildingFacing(catalogue, building);
  switch (facing.wears) {
    case 'card':
      return cardFaceAtStart(catalogue, facing.card, facing.city);
    case 'own':
      return ownFace(catalogue, building, facing.captured);
  }
}

/**
 * A face of its own, of a thing no card places: what it is, its front, its text and its picture, and
 * what it reads of the thing on the ground, no cost, no influence and no stats.
 */
function ownFaceOf(
  own: Pick<Face, 'id' | 'name' | 'kind' | 'front' | 'rules' | 'art'>,
  placed: Omit<PlacedReading, 'leads'> = NOTHING_PLACED,
): Face {
  return {
    ...own,
    costs: [],
    influence: 0,
    playedByNothing: false,
    ...placed,
    stats: undefined,
    unit: undefined,
  };
}

/** The face of its own a building no card places wears, what it is in its age's content. */
function ownFace(catalogue: Catalogue, building: string, captured: Captured): Face {
  const { leads, ...placed } = thingReading({ kind: buildingKind(catalogue, building) });
  const ground = buildingGroundOf(building);
  return ownFaceOf(
    {
      id: building,
      name: buildingName(building),
      kind: 'building',
      front: { front: 'plain', colour: 'building', window: 'oval' },
      rules: ledBy(leads, text(`face.${captured}`)),
      art:
        ground === undefined
          ? undefined
          : { window: 'oval', ground, holds: { kind: 'building', building } },
    },
    placed,
  );
}

/**
 * What a terrain's face reads of a tile of it: what the tile gives at income, the things its text
 * names, what entering it costs, and what its window's middle tile holds.
 */
export type TerrainReading = {
  readonly terrain: Terrain;
  readonly gives: Partial<Resources>;
  readonly names: readonly Reference[];
  readonly movementCost: number | undefined;
  readonly middle: { readonly kind: 'tile'; readonly feature: undefined } | InspectedTile;
};

/** A bare tile of the terrain as its face reads it: nothing on it or beside it adds to it. */
export function bareTerrain(catalogue: Catalogue, terrain: Terrain): TerrainReading {
  return {
    terrain,
    gives: terrainKind(catalogue, terrain).yields,
    names: [],
    movementCost: movementCostRead((embarked) => groundCost(catalogue, terrain, embarked)),
    middle: { kind: 'tile', feature: undefined },
  };
}

/** What a face read off a tile names of a part of its yield: nothing of its terrain's or its building's. */
function namedPart(part: YieldPart): Reference[] {
  switch (part.kind) {
    case 'terrain':
    case 'building':
      return [];
    case 'feature':
      return [{ kind: 'feature', id: part.feature }];
    case 'improvement':
      return [{ kind: 'improvement', id: part.improvement }];
    case 'beside':
      return [{ kind: 'building', id: part.building }];
  }
}

/**
 * The tile as its terrain's face reads it: its yield but its building's part, the things giving it
 * that part but its terrain named in the order `yieldParts` reads them, what entering it costs, and
 * its window holding it as the map draws it, the discs of its row standing where `discs` says.
 */
export function terrainOnTile(
  catalogue: Catalogue,
  chronicle: Pick<Chronicle, 'turn' | 'timeline' | 'rivers'>,
  tile: Tile,
  beside: TilesBeside,
  discs: boolean,
): TerrainReading {
  const parts = yieldParts(catalogue, chronicle, tile, beside).filter(
    ({ kind }) => kind !== 'building',
  );
  const along = chronicle.rivers.filter((river) => runsAlong([river], tile));
  const drawn = along
    .flat()
    .flatMap(tilesAtCorner)
    .filter((coord) => beside(coord) !== undefined);
  const { q, r, terrain, feature, improvements } = tile;
  return {
    terrain,
    gives: summed(parts.map(({ yields }) => yields)),
    names: parts.flatMap(namedPart),
    movementCost: movementCostRead((embarked) => movementCost(catalogue, tile, embarked)),
    middle: {
      kind: 'inspected',
      tile: { q, r, terrain, feature, improvements },
      rivers: riversAlong(along, new Set(drawn.map(tileKey))),
      discs,
    },
  };
}

/**
 * The face a terrain wears, reading a tile of it: what the tile gives in its row, the things it names
 * in its text over Impassable where nothing crosses it, what entering it costs on its disc, and its
 * window's middle tile.
 */
export function terrainFace({
  terrain,
  gives,
  names,
  movementCost: cost,
  middle,
}: TerrainReading): Face {
  const named = names.length === 0 ? undefined : names.map(nameWritten).join(', ');
  return ownFaceOf(
    {
      id: terrain,
      name: terrainName(terrain),
      kind: 'terrain',
      front: { front: 'plain', colour: 'terrain', window: 'oval' },
      rules: ledBy(named, cost === undefined ? text('face.impassable') : ''),
      art: { window: 'oval', ground: terrain, holds: middle },
    },
    {
      goesOn: [],
      gives: onePerPoint(gives),
      takes: [],
      footDisc: {
        symbol: 'move',
        reading: cost === undefined ? text('face.no-movement-cost') : inMovePoints(cost),
      },
    },
  );
}

/** The face a feature wears, its window holding its terrain's tile carrying it. */
export function featureFace(catalogue: Catalogue, feature: FeatureId): Face {
  const { terrain, yields } = featureKind(catalogue, feature);
  return ownFaceOf(
    {
      id: feature,
      name: featureName(feature),
      kind: 'feature',
      front: { front: 'decorated', colour: 'terrain' },
      rules: '',
      art: { window: 'oval', ground: terrain, holds: { kind: 'tile', feature } },
    },
    { goesOn: [], gives: onePerPoint(yields), takes: [], footDisc: undefined },
  );
}

/**
 * The card whose play places the improvement; an improvement no card places is refused, and so is one
 * two cards place.
 */
export function improvementFacing(catalogue: Catalogue, improvement: ImprovementId): CardId {
  const card = placedByOne(
    catalogue,
    `the improvement ${improvement}`,
    (places) => places.thing === 'improvement' && places.improvement === improvement,
  );
  if (card === undefined) throw new Error(`no card places the improvement ${improvement}`);
  return card;
}

/** The face an improvement wears: the face of the card whose play places it, as its content makes it. */
export function improvementFace(catalogue: Catalogue, improvement: ImprovementId): Face {
  return cardFaceAtStart(catalogue, improvementFacing(catalogue, improvement), undefined);
}

/** What a unit kind's face is: the face of the one unit card whose play places it, or its own. */
export type UnitFacing =
  | { readonly wears: 'card'; readonly card: CardId }
  | { readonly wears: 'own' };

/**
 * What the unit kind's face is: its own where no unit card places it, a settle card placing it
 * counting for nothing; a kind two unit cards place is refused.
 */
export function unitFacing(catalogue: Catalogue, kind: string): UnitFacing {
  const card = placedByOne(
    catalogue,
    `the unit kind ${kind}`,
    (places, content) => content.kind === 'unit' && places.thing === 'unit' && places.unit === kind,
  );
  return card === undefined ? { wears: 'own' } : { wears: 'card', card };
}

/**
 * A unit as its face reads it: a unit on the map, one a snapshot kept as it stood, or one fresh of its
 * kind; the damage its attack removes, what its prepare lands as where it has prepared, and whether it
 * is the neutral's while it is hostile.
 */
export type UnitReading = Pick<Unit, 'stats' | 'faction' | 'movePoints' | 'action' | 'embarked'> & {
  readonly damage: number;
  readonly prepares: PreparedAs | undefined;
  readonly hostile: boolean;
};

/**
 * A unit fresh of its kind, of the faction named: its stats its kind's, its move points and its
 * action full, ashore, or embarked where its kind stands on the water alone.
 */
export function freshUnit(catalogue: Catalogue, kind: string, faction: Faction): UnitReading {
  const stats = unitKind(catalogue, kind);
  return {
    stats,
    faction,
    movePoints: stats.move,
    action: stats.action,
    embarked: standsOnWaterAlone(catalogue, kind),
    damage: stats.damage,
    prepares: undefined,
    hostile: false,
  };
}

/**
 * The face a unit wears, its kind's, reading the unit as it stands: its window holding it on that
 * face's ground, or the coast where it is embarked, its text Hostile where it is the neutral's while
 * hostile.
 */
export function unitFace(catalogue: Catalogue, unit: UnitReading): Face {
  const worn = unitKindFace(catalogue, unit.stats.type);
  return {
    ...worn,
    rules: unit.hostile ? text('face.hostile') : worn.rules,
    stats: unitStats(catalogue, unit),
    art:
      worn.art === undefined
        ? undefined
        : {
            window: worn.art.window,
            ground: unit.embarked ? 'coast' : worn.art.ground,
            holds: { kind: 'nothing' },
          },
    unit: {
      type: unit.stats.type,
      faction: unit.faction,
      canoed: inCanoe(catalogue, unit),
      prepares: unit.prepares,
    },
  };
}

/** The face a unit fresh of the kind wears, of the faction named. */
export function freshUnitFace(catalogue: Catalogue, kind: string, faction: Faction): Face {
  return unitFace(catalogue, freshUnit(catalogue, kind, faction));
}

/** The face a unit kind wears before it reads a unit: its unit card's, or its own. */
function unitKindFace(catalogue: Catalogue, kind: string): Face {
  const facing = unitFacing(catalogue, kind);
  switch (facing.wears) {
    case 'card':
      return cardFaceAtStart(catalogue, facing.card, undefined);
    case 'own':
      return ownUnitFace(catalogue, kind);
  }
}

/**
 * The face of its own a unit kind no card places wears: the unit card's front and window, its kind's
 * name, its ground, and a text saying the bonus it carries where it carries one.
 */
function ownUnitFace(catalogue: Catalogue, kind: string): Face {
  const bonus = bonusOf(catalogue, unitKind(catalogue, kind));
  const ground = unitGroundOf(kind);
  return ownFaceOf({
    id: kind,
    name: unitName(kind),
    kind: 'unit',
    front: { front: 'plain', colour: 'unit', window: 'oval' },
    rules: bonus > 0 ? text('face.bonus', { count: bonus }) : '',
    art: ground === undefined ? undefined : { window: 'oval', ground, holds: { kind: 'nothing' } },
  });
}

/**
 * What a unit's face reads of it as it stands: the health, the move and the action it holds over its
 * kind's own, the damage its attack removes with the bonus it carries after a plus sign, its range and
 * its sight; embarked, a damage and a range of nought.
 */
export function unitStats(catalogue: Catalogue, unit: UnitReading): NonNullable<Face['stats']> {
  const { stats, embarked } = unit;
  const over = (held: string, own: string): string =>
    text('reading.over', { count: held, over: own });
  const carried = unit.damage - stats.damage;
  const damage = statReading('damage', embarked ? 0 : stats.damage);
  return {
    damage:
      embarked || carried === 0 ? damage : `${damage}${text('reading.plus', { count: carried })}`,
    health: over(
      statReading('health', stats.health),
      statReading('health', fullHealth(catalogue, stats)),
    ),
    move: over(statReading('move', unit.movePoints), statReading('move', stats.move)),
    action: over(statReading('action', unit.action), statReading('action', stats.action)),
    range: statReading('range', embarked ? 0 : stats.range),
    sight: statReading('sight', stats.sight),
  };
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

/**
 * The face a name shows of the thing it names, in a text read as `reading`: a card's as that text
 * makes it, a unit kind's of a unit fresh of it of the faction the name names, and the face any other
 * thing wears.
 */
export function namedFace(
  catalogue: Catalogue,
  reference: Reference,
  reading: AnswerReading,
): Face {
  switch (reference.kind) {
    case 'card':
      return namedCardFace(catalogue, reference.id, reading);
    case 'building':
      return buildingFace(catalogue, reference.id);
    case 'player':
    case 'enemy':
      return freshUnitFace(catalogue, reference.id, reference.kind);
    case 'terrain':
      return terrainFace(bareTerrain(catalogue, reference.id));
    case 'feature':
      return featureFace(catalogue, reference.id);
    case 'improvement':
      return improvementFace(catalogue, reference.id);
  }
}
