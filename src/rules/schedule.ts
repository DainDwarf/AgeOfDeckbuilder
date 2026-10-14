import { built, featurePlaced, featureRemoved, retiled, terraformed } from './cards';
import {
  type Aim,
  type Answer,
  ageOf,
  type Catalogue,
  capstoneOf,
  cardMade,
  eventOf,
  type Schedule,
  type Span,
  scheduleOf,
} from './catalogue';
import { costPaid, populationKilled } from './city';
import {
  distance,
  type FeatureId,
  groundRunsTo,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { buildingKind, entryOf, featureKind, refuse, terrainKind } from './map-kinds';
import { nextRng, pickUniform, pickWeighted, type Rng } from './rng';
import {
  change,
  changeOn,
  followed,
  type Group,
  grouped,
  type Landed,
  landedAs,
  type Sequence,
  unchanged,
} from './stages';
import {
  type CardId,
  type Chronicle,
  type Cost,
  type Counters,
  cityOn,
  costsOf,
  type Deal,
  holds,
  type Refusal,
  type Timeline,
  turnShown,
  unaffordable,
} from './state';
import { damaged, unitAt } from './units';

/**
 * A region's schedule rolled into the timeline a chronicle opens on, the generator handed in its own
 * from then on: the capstone drawn among the schedule's, its turn from the window, then the first due
 * turn rolled as from a landing on turn 0. An age or a region the catalogue does not hold is refused.
 */
export function timelineOf(catalogue: Catalogue, age: string, region: string, rng: Rng): Timeline {
  const schedule = scheduleOf(catalogue, age, region);
  const capstone = pickUniform(rng, schedule.capstones);
  const landing = withinSpan(capstone.rng, schedule.window);
  return rolledFrom(
    schedule,
    { rng: landing.rng, capstone: { id: capstone.picked, turn: landing.turns } },
    0,
  );
}

/** The next due turn rolled from a landing by the spacing, from the timeline's own generator. */
function rolledFrom(
  schedule: Schedule,
  timeline: Omit<Timeline, 'next'>,
  landing: number,
): Timeline {
  const spaced = withinSpan(timeline.rng, schedule.spacing);
  return { ...timeline, rng: spaced.rng, next: landing + spaced.turns };
}

/**
 * The event drawn on the due turn, from the timeline's own generator, seeded and weighted among the
 * entries whose need the chronicle meets; no event where none does.
 */
function eventDrawn(
  catalogue: Catalogue,
  schedule: Schedule,
  chronicle: Chronicle,
): { event?: string; rng: Rng } {
  const { timeline } = chronicle;
  const dealable = Object.entries(schedule.entries).filter(
    ([entry]) => eventOf(catalogue, entry).needs?.(catalogue, chronicle) ?? true,
  );
  // The step is taken even where no need is met, or the turns a seed deals on would follow the play.
  if (dealable.length === 0) return { rng: nextRng(timeline.rng).rng };
  const { picked, rng } = pickWeighted(timeline.rng, dealable);
  return { event: picked, rng };
}

/** Whether the turn has ticked past the last of a span of turns begun on the capstone's. */
export function spanEnded(chronicle: Chronicle, turns: number): boolean {
  return chronicle.turn >= chronicle.timeline.capstone.turn + turns;
}

/**
 * The events phase, which draws from the chronicle's generator only through the capstone's landing.
 * On the capstone's turn, one `capstone-landing` group: nothing is dealt whatever was due, the next
 * due turn is rolled from that turn, and the capstone lands on what that leaves. On a due turn, one
 * `deal` group: the next due turn is rolled from that turn, and the event drawn is dealt behind the
 * deals already standing, nothing landing until one of its answers is taken — or, where no event is
 * drawn, a `runtime-error`, and play goes on to the next due turn. Any other turn stages nothing.
 */
export function events(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  const { timeline, turn } = chronicle;
  const schedule = scheduleOf(catalogue, chronicle.age, chronicle.region);
  if (turn === timeline.capstone.turn) {
    const rolled = landedAs(
      change('rolled', { ...chronicle, timeline: rolledFrom(schedule, timeline, turn) }),
    );
    const { lands } = capstoneOf(catalogue, timeline.capstone.id);
    return grouped(
      { name: 'capstone-landing' },
      followed(rolled, (left) => lands(catalogue, left)),
    );
  }

  if (turn !== timeline.next) return unchanged(chronicle);
  const { event, rng } = eventDrawn(catalogue, schedule, chronicle);
  const rolled = landedAs(
    change('rolled', { ...chronicle, timeline: rolledFrom(schedule, { ...timeline, rng }, turn) }),
  );
  return grouped(
    { name: 'deal' },
    followed(rolled, (left) =>
      event === undefined
        ? runtimeError(left)
        : landedAs(change('dealt', { ...left, deals: [...left.deals, { of: 'event', event }] })),
    ),
  );
}

/**
 * The turn of the next landing, read off the timeline: the next due turn, or the capstone's where it
 * has not landed and lands on that turn or before it.
 */
function nextLanding(chronicle: Chronicle): number {
  const { next, capstone } = chronicle.timeline;
  return chronicle.turn < capstone.turn && capstone.turn <= next ? capstone.turn : next;
}

/**
 * How a card shows the turn of the next landing, the block and the effect as one pair so neither is
 * written without the other: blocked while a turn is shown; then the chronicle shows the next one.
 */
export function showsNextLanding(): Aim & { readonly aim: 'none' } {
  return {
    aim: 'none',
    blocked: (_catalogue, chronicle) => (turnShown(chronicle) === undefined ? [] : ['turn-shown']),
    effect: (_catalogue, paid) =>
      landedAs(change('shown', { ...paid, shownTurn: nextLanding(paid) })),
  };
}

/** What a deal offers to be taken, by id, in the order dealt: its event's answers, or a capture's rewards. */
export function offered(catalogue: Catalogue, deal: Deal): readonly string[] {
  switch (deal.of) {
    case 'event':
      return Object.keys(eventOf(catalogue, deal.event).answers);
    case 'capture':
      return Object.keys(deal.rewards);
  }
}

/** The answer an id names among the event's; an answer the event does not deal is refused. */
export function answerOf(catalogue: Catalogue, event: string, answer: string): Answer {
  return entryOf(catalogue, eventOf(catalogue, event).answers, answer, `answer of ${event}`);
}

/** What an answer costs on the chronicle as it stands. */
export function answerCost(catalogue: Catalogue, chronicle: Chronicle, answer: Answer): Cost[] {
  const { cost } = answer;
  switch (typeof cost) {
    case 'function':
      return costsOf(cost(catalogue, chronicle));
    case 'object':
      return costsOf(cost);
  }
}

/** Everything standing between the city and an answer of the event: what it cannot pay, and what blocks it. */
export function answerRefusal(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  answer: string,
): Refusal {
  const asked = answerOf(catalogue, event, answer);
  const costs = answerCost(catalogue, chronicle, asked);
  return {
    unaffordable: unaffordable(chronicle, costs),
    blocked: asked.blocked?.(catalogue, chronicle) ?? [],
  };
}

/**
 * An answer taken off the chronicle the deal is popped from: its cost paid as one `stock`, none where
 * it costs nothing, and its landing on what that leaves.
 */
export function answered(catalogue: Catalogue, chronicle: Chronicle, answer: Answer): Landed {
  const costs = answerCost(catalogue, chronicle, answer);
  return followed(costPaid(chronicle, 'player', costs), (left) => answer.lands(catalogue, left));
}

/**
 * A reward taken off the chronicle the deal is popped from: its copies are made and added to the
 * discard pile, one `added`; a card the catalogue does not hold is refused.
 */
export function rewarded(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: CardId,
  copies: number,
): Landed {
  const made = Array.from({ length: copies }, () => cardMade(catalogue, card));
  return landedAs(
    change('added', { ...chronicle, discardPile: [...chronicle.discardPile, ...made] }),
  );
}

/**
 * The capstone's second script, on every turn after the one it lands on: one `capstone-continued`
 * group over what it raised. Nothing on any other turn, or for a capstone that carries none.
 */
export function continued(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  const { id, turn } = chronicle.timeline.capstone;
  const { continues } = capstoneOf(catalogue, id);
  if (chronicle.turn <= turn || continues === undefined) return unchanged(chronicle);
  return grouped({ name: 'capstone-continued' }, continues(catalogue, chronicle));
}

/** A content defect met in play, followed through as the one change saying so. */
function runtimeError(chronicle: Chronicle): Landed {
  return landedAs(change('runtime-error', chronicle));
}

/**
 * The unit standing on the tile, whatever its faction, losing health by the amount and killed at
 * nought, and nothing where no unit stands there.
 */
export function unitDamaged(chronicle: Chronicle, at: TileCoords, amount: number): Landed {
  const target = unitAt(chronicle.units, at);
  if (target === undefined) return unchanged(chronicle);
  const units = damaged(chronicle.units, target, amount);
  const killed = units.length < chronicle.units.length;
  return landedAs(changeOn(killed ? 'killed' : 'damaged', at, { ...chronicle, units }));
}

/**
 * The tile charted, whatever sees it: the one `charted` change, carrying no snapshot of its own — the
 * chronicle's charting takes it.
 */
export function tileCharted(chronicle: Chronicle, at: TileCoords): Landed {
  return landedAs(changeOn('charted', at, chronicle));
}

/**
 * A fire: the terrain it burns and the terrain it leaves, how far from the city's tile it may start
 * and how far from its start it burns, and the damage a unit on a burned tile takes.
 */
export type Fire = {
  readonly burns: string;
  readonly leaves: string;
  readonly fromCity: number;
  readonly around: number;
  readonly damage: number;
};

function fireStarts(chronicle: Chronicle, fire: Fire): TileCoords[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  return chronicle.tiles.filter(
    (tile) => tile.terrain === fire.burns && distance(tile, city) <= fire.fromCity,
  );
}

export function fireStartable(chronicle: Chronicle, fire: Fire): boolean {
  return fireStarts(chronicle, fire).length > 0;
}

/**
 * The tiles a fire burns, and the chronicle's generator after the one step drawing its start
 * uniformly among the tiles it may start on: every tile of the terrain it burns within its distance
 * of the start, the start included. No tile to start on burns nothing and draws nothing.
 */
function fireDrawn(
  chronicle: Chronicle,
  fire: Fire,
): { readonly burning: readonly TileCoords[]; readonly rng: Rng } {
  const candidates = fireStarts(chronicle, fire);
  if (candidates.length === 0) return { burning: [], rng: chronicle.rng };
  const { picked: start, rng } = pickUniform(chronicle.rng, candidates);
  const burning = chronicle.tiles
    .filter((tile) => tile.terrain === fire.burns && distance(tile, start) <= fire.around)
    .map(({ q, r }) => ({ q, r }));
  return { burning, rng };
}

/**
 * What the fire costs, read before it lands: the tiles burned, the population working them, and the
 * player's units standing on them.
 */
export function fireRead(chronicle: Chronicle, fire: Fire): Record<string, number> {
  const burning = new Set(fireDrawn(chronicle, fire).burning.map(tileKey));
  return {
    tiles: burning.size,
    population: chronicle.assigned.filter((coord) => burning.has(tileKey(coord))).length,
    units: chronicle.units.filter(
      (unit) => unit.faction === 'player' && burning.has(tileKey(unit.tile)),
    ).length,
  };
}

/**
 * The fire landed: on every tile it burns, the population working it killed, the tile terraformed
 * into the terrain it leaves, and the unit standing on it damaged, whatever its faction. A fire that
 * would change nothing draws nothing and is a `runtime-error`.
 */
export function burned(catalogue: Catalogue, chronicle: Chronicle, fire: Fire): Landed {
  const { burning, rng } = fireDrawn(chronicle, fire);
  let landing = unchanged({ ...chronicle, rng });
  for (const tile of burning) {
    landing = followed(landing, (left) => populationKilled(left, tile));
    landing = followed(landing, (left) => terraformed(catalogue, left, tile, fire.leaves));
    landing = followed(landing, (left) => unitDamaged(left, tile, fire.damage));
  }
  return landing.stages.length === 0 ? runtimeError(chronicle) : landing;
}

/**
 * Every improvement standing inside the player's border, the city's own tile included, once for each
 * tile it stands on, with that tile.
 */
function improvementsInside(
  chronicle: Chronicle,
): { readonly at: TileCoords; readonly improvement: string }[] {
  return chronicle.tiles.flatMap((tile) =>
    holds(chronicle, tile)
      ? tile.improvements.map((improvement) => ({ at: { q: tile.q, r: tile.r }, improvement }))
      : [],
  );
}

/** The tiles inside the player's border a building stands on, the city's own tile aside. */
function buildingsInside(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter(
      (tile) =>
        tile.building !== undefined &&
        holds(chronicle, tile) &&
        cityOn(chronicle, tile) !== 'player',
    )
    .map(({ q, r }) => ({ q, r }));
}

/** What a removal inside the player's border takes: improvements, buildings, and the city, one or none. */
export type Removal = {
  readonly improvements: number;
  readonly buildings: number;
  readonly city: number;
};

/** What `removedInside` takes for that count, read before it lands. */
export function removalInside(chronicle: Chronicle, count: number): Removal {
  const improvements = Math.min(count, improvementsInside(chronicle).length);
  const buildings = Math.min(count - improvements, buildingsInside(chronicle).length);
  return { improvements, buildings, city: count > improvements + buildings ? 1 : 0 };
}

/**
 * `count` things inside the player's border removed, one at a time: an improvement while one stands,
 * then a building, each drawn in one step of the chronicle's generator among those standing, then the
 * city's own building, which is its fall. One `retiled` each.
 */
export function removedInside(chronicle: Chronicle, count: number): Landed {
  let landing = unchanged(chronicle);
  for (let removed = 0; removed < count; removed++) {
    landing = followed(landing, (left) => oneRemovedInside(left));
  }
  return landing;
}

/** The next thing inside the player's border `removedInside` takes. */
function oneRemovedInside(chronicle: Chronicle): Landed {
  const improvements = improvementsInside(chronicle);
  if (improvements.length > 0) {
    const { picked, rng } = pickUniform(chronicle.rng, improvements);
    return retiled({ ...chronicle, rng }, picked.at, (tile) => ({
      ...tile,
      improvements: tile.improvements.filter((improvement) => improvement !== picked.improvement),
    }));
  }
  const buildings = buildingsInside(chronicle);
  const drawn =
    buildings.length === 0
      ? { picked: chronicle.city, rng: chronicle.rng }
      : pickUniform(chronicle.rng, buildings);
  if (drawn.picked === undefined) return runtimeError(chronicle);
  return retiled({ ...chronicle, rng: drawn.rng }, drawn.picked, (tile) => ({
    ...tile,
    building: undefined,
  }));
}

/** Every tile inside the player's border the predicate admits, the city's own tile included. */
function tilesInside(chronicle: Chronicle, admits: (tile: Tile) => boolean): Tile[] {
  return chronicle.tiles.filter((tile) => admits(tile) && holds(chronicle, tile));
}

/**
 * `count` of the tiles inside the player's border the predicate admits, fewer where fewer stand,
 * drawn one at a time in one step each of the chronicle's generator among those not yet drawn; each
 * with the generator its draw leaves.
 */
function tilesDrawnInside(
  chronicle: Chronicle,
  admits: (tile: Tile) => boolean,
  count: number,
): { readonly tile: Tile; readonly rng: Rng }[] {
  let standing = tilesInside(chronicle, admits);
  let rng = chronicle.rng;
  const drawn: { readonly tile: Tile; readonly rng: Rng }[] = [];
  while (drawn.length < count && standing.length > 0) {
    const { picked, rng: left } = pickUniform(rng, standing);
    rng = left;
    drawn.push({ tile: picked, rng });
    standing = standing.filter((each) => each !== picked);
  }
  return drawn;
}

/** Whether a tile carries one of the features; a feature the catalogue does not hold is refused. */
function carriesOneOf(
  catalogue: Catalogue,
  features: readonly FeatureId[],
): (tile: Tile) => boolean {
  for (const feature of features) featureKind(catalogue, feature);
  return ({ feature }) => feature !== undefined && features.includes(feature);
}

export function featureInside(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
): boolean {
  return tilesInside(chronicle, carriesOneOf(catalogue, features)).length > 0;
}

/** What `featuresRemovedInside` takes for that count, read before it lands: how many of each feature. */
export function featureRemovalInside(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
  count: number,
): Record<FeatureId, number> {
  const drawn = tilesDrawnInside(chronicle, carriesOneOf(catalogue, features), count);
  return Object.fromEntries(
    features.map((feature) => [
      feature,
      drawn.filter(({ tile }) => tile.feature === feature).length,
    ]),
  );
}

/**
 * `count` of the features inside the player's border removed, each drawn as `tilesDrawnInside` draws
 * it and going with every layer that goes with it: one `retiled` each, nothing where none stands.
 */
export function featuresRemovedInside(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
  count: number,
): Landed {
  let landing = unchanged(chronicle);
  for (const { tile, rng } of tilesDrawnInside(
    chronicle,
    carriesOneOf(catalogue, features),
    count,
  )) {
    const at = { q: tile.q, r: tile.r };
    landing = followed(landing, (left) => featureRemoved(catalogue, { ...left, rng }, at));
  }
  return landing;
}

/**
 * `count` of the tiles inside the player's border of the terrains named terraformed into `to`, each
 * drawn as `tilesDrawnInside` draws it: fewer where fewer stand, nothing where none does. A terrain
 * the catalogue does not hold is refused.
 */
export function terraformedInside(
  catalogue: Catalogue,
  chronicle: Chronicle,
  terrains: readonly Terrain[],
  to: Terrain,
  count: number,
): Landed {
  for (const terrain of [...terrains, to]) terrainKind(catalogue, terrain);
  let landing = unchanged(chronicle);
  for (const { tile, rng } of tilesDrawnInside(
    chronicle,
    ({ terrain }) => terrains.includes(terrain),
    count,
  )) {
    const at = { q: tile.q, r: tile.r };
    landing = followed(landing, (left) => terraformed(catalogue, { ...left, rng }, at, to));
  }
  return landing;
}

/**
 * The tiles near the city a feature may be dealt onto: every tile of the terrain it lies on within
 * that distance of the city's tile carrying no feature, whatever else stands on them. None at all
 * while the city stands nowhere.
 */
function featureTiles(
  catalogue: Catalogue,
  chronicle: Chronicle,
  feature: FeatureId,
  fromCity: number,
): Tile[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const { terrain } = featureKind(catalogue, feature);
  return chronicle.tiles.filter(
    (tile) =>
      tile.terrain === terrain && tile.feature === undefined && distance(tile, city) <= fromCity,
  );
}

export function featureDealable(
  catalogue: Catalogue,
  chronicle: Chronicle,
  feature: FeatureId,
  fromCity: number,
): boolean {
  return featureTiles(catalogue, chronicle, feature, fromCity).length > 0;
}

/**
 * The feature dealt onto one tile near the city, drawn uniformly among the tiles it may be dealt
 * onto in one step of the chronicle's generator, and the tile it landed on. Every other tile is left
 * the object it was. No tile to deal onto deals nothing and draws nothing.
 */
export function featureDealt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  feature: FeatureId,
  fromCity: number,
): Landed & { readonly at?: TileCoords } {
  const candidates = featureTiles(catalogue, chronicle, feature, fromCity);
  if (candidates.length === 0) return unchanged(chronicle);
  const { picked, rng } = pickUniform(chronicle.rng, candidates);
  const at = { q: picked.q, r: picked.r };
  return { ...featurePlaced(catalogue, { ...chronicle, rng }, at, feature), at };
}

/**
 * A card made with the counters set and added to the top of the draw pile; a card the catalogue
 * does not hold, and a counter set that it does not declare, are refused.
 */
export function addedToDrawPileTop(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: CardId,
  set: Counters = {},
): Landed {
  const made = cardMade(catalogue, card, set);
  return landedAs(change('added', { ...chronicle, drawPile: [made, ...chronicle.drawPile] }));
}

/**
 * The tiles a camp may be placed on around the city: of the terrains a camp lies on, slot empty, the
 * ground running to the city from them, within `fromCity` of the city, held by nobody, no unit
 * standing on them, and `apart` at least from every camp in `standing`. None while the city stands
 * nowhere.
 */
function campTiles(
  catalogue: Catalogue,
  chronicle: Chronicle,
  fromCity: Span,
  apart: number,
  standing: readonly TileCoords[],
): Tile[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const [near, far] = fromCity;
  const ground = buildingKind(catalogue, ageOf(catalogue, chronicle.age).camp.building).terrains;
  const reached = groundRunsTo(catalogue, chronicle.tiles, chronicle.rivers, city);
  return chronicle.tiles.filter(
    (tile) =>
      tile.building === undefined &&
      ground.includes(tile.terrain) &&
      reached.has(tileKey(tile)) &&
      distance(tile, city) >= near &&
      distance(tile, city) <= far &&
      !holds(chronicle, tile) &&
      unitAt(chronicle.units, tile) === undefined &&
      standing.every((other) => distance(tile, other) >= apart),
  );
}

function campsStanding(catalogue: Catalogue, chronicle: Chronicle): TileCoords[] {
  const { building } = ageOf(catalogue, chronicle.age).camp;
  return chronicle.tiles.filter((tile) => tile.building === building);
}

export function campPlaceable(
  catalogue: Catalogue,
  chronicle: Chronicle,
  fromCity: Span,
  apart: number,
): boolean {
  return (
    campTiles(catalogue, chronicle, fromCity, apart, campsStanding(catalogue, chronicle)).length > 0
  );
}

/**
 * Camps placed around the city, drawn one at a time, each uniformly from the tiles a camp may be
 * placed on, `apart` from every camp standing — the generator's and the ones already drawn here
 * alike; the candidates are filtered again after each. When they run out it places what it can, and
 * where it can place none it draws nothing and is a `runtime-error`. Each camp placed is its own
 * stage, carrying the draw that placed it. It enters no unit.
 */
export function campsPlaced(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camps: number,
  fromCity: Span,
  apart: number,
): Landed & { readonly placed: readonly TileCoords[] } {
  if (chronicle.city === undefined) {
    refuse(catalogue, 'a camp was placed while the city stands nowhere');
  }
  const { building } = ageOf(catalogue, chronicle.age).camp;

  let rng = chronicle.rng;
  const standing = campsStanding(catalogue, chronicle);
  const placings: { readonly tile: TileCoords; readonly rng: Rng }[] = [];
  for (let drawn = 0; drawn < camps; drawn++) {
    const candidates = campTiles(catalogue, chronicle, fromCity, apart, standing);
    if (candidates.length === 0) break;

    const step = pickUniform(rng, candidates);
    rng = step.rng;
    const chosen = step.picked;
    standing.push(chosen);
    placings.push({ tile: { q: chosen.q, r: chosen.r }, rng });
  }
  if (placings.length === 0) return { ...runtimeError(chronicle), placed: [] };

  let landing = unchanged(chronicle);
  for (const placing of placings) {
    landing = followed(landing, (left) =>
      built(catalogue, { ...left, rng: placing.rng }, placing.tile, building),
    );
  }
  return { ...landing, placed: placings.map(({ tile }) => tile) };
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}
