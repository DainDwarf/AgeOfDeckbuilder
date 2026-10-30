import { built, featurePlaced, featureRemoved, reaches, terraformed } from './cards';
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
import { buildingTakenOff, costPaid, retiled } from './city';
import { campEnteredAround, rowsDrawn } from './enemies';
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
  holderOf,
  holds,
  keysDealt,
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
 * The events phase, which draws from the chronicle's generator only through the capstone's landing:
 * a due turn's event is drawn from the timeline's own, and nothing lands until an answer is taken.
 */
export function events(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  const { timeline, turn } = chronicle;
  const schedule = scheduleOf(catalogue, chronicle.age, chronicle.region);
  if (turn === timeline.capstone.turn) {
    const rolled = landedAs(
      change('rolled', { ...chronicle, timeline: rolledFrom(schedule, timeline, turn) }, chronicle),
    );
    const { lands } = capstoneOf(catalogue, timeline.capstone.id);
    return grouped(
      { name: 'capstone-landing' },
      followed(rolled, (left) => lands(catalogue, left)),
    );
  }

  if (turn !== timeline.next) return unchanged(chronicle);
  const { picked: event, rng } = pickWeighted(timeline.rng, Object.entries(schedule.entries));
  const rolled = landedAs(
    change(
      'rolled',
      { ...chronicle, timeline: rolledFrom(schedule, { ...timeline, rng }, turn) },
      chronicle,
    ),
  );
  return grouped(
    { name: 'deal' },
    followed(rolled, (left) =>
      landedAs(change('dealt', { ...left, deals: [...left.deals, { of: 'event', event }] }, left)),
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
      landedAs(change('shown', { ...paid, shownTurn: nextLanding(paid) }, paid)),
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

/**
 * The case an answer of the event names on the chronicle as it stands, and nothing for one declaring
 * none; a case it does not declare is refused.
 */
export function answerCase(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  answer: string,
): string | undefined {
  const { cases } = answerOf(catalogue, event, answer);
  if (cases === undefined) return undefined;
  const named = cases.names(catalogue, chronicle);
  if (!cases.declared.includes(named)) {
    refuse(catalogue, `the answer ${answer} names the case ${named}, which it does not declare`);
  }
  return named;
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
  const { cards, nextKey } = keysDealt(chronicle.nextKey, made);
  return landedAs(
    change(
      'added',
      { ...chronicle, nextKey, discardPile: [...chronicle.discardPile, ...cards] },
      chronicle,
    ),
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

/** The numbers the capstone's rules entry reads of the chronicle as it stands, none for one reading none. */
export function capstoneReading(
  catalogue: Catalogue,
  chronicle: Chronicle,
  id: string,
): Record<string, number> {
  return capstoneOf(catalogue, id).reads?.(catalogue, chronicle) ?? {};
}

/** A content defect met in play, followed through as the one change saying so. */
function runtimeError(chronicle: Chronicle): Landed {
  return landedAs(change('runtime-error', chronicle, chronicle));
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
  return landedAs(changeOn(killed ? 'killed' : 'damaged', at, { ...chronicle, units }, chronicle));
}

/**
 * The tile charted, whatever sees it: the one `charted` change, carrying no snapshot of its own — the
 * chronicle's charting takes it.
 */
export function tileCharted(chronicle: Chronicle, at: TileCoords): Landed {
  return landedAs(changeOn('charted', at, chronicle, chronicle));
}

/** How much a tile weighs in a draw near the player's city for each tile it lies from the nearest tile that city holds. */
const NEAR_FALLOFF = 1 / 8;

/** The candidates a draw near the player's city may land on: none for a city nowhere, never the neutral's. */
function drawableNear<Candidate extends TileCoords>(
  chronicle: Chronicle,
  candidates: readonly Candidate[],
): Candidate[] {
  if (chronicle.city === undefined) return [];
  return candidates.filter((candidate) => holderOf(chronicle, candidate) !== 'neutral');
}

/**
 * Of the candidates `drawableNear` admits, one drawn near the player's city in one step of the
 * generator handed in, and the generator it leaves; nothing, and no step, where it admits none.
 */
function drawnNear<Candidate extends TileCoords>(
  chronicle: Chronicle,
  rng: Rng,
  candidates: readonly Candidate[],
): { readonly picked: Candidate; readonly rng: Rng } | undefined {
  const { held } = chronicle;
  const weighed = drawableNear(chronicle, candidates).map(
    (candidate) =>
      [
        candidate,
        NEAR_FALLOFF ** Math.min(...held.map((tile) => distance(candidate, tile))),
      ] as const,
  );
  return weighed.length === 0 ? undefined : pickWeighted(rng, weighed);
}

/**
 * `count` of the candidates drawn near the player's city as `drawnNear` draws one, one after another
 * from the chronicle's generator, each anew among those not yet drawn, fewer where fewer stand; each
 * with the generator its draw leaves.
 */
function countDrawnNear<Candidate extends TileCoords>(
  chronicle: Chronicle,
  candidates: readonly Candidate[],
  count: number,
): { readonly picked: Candidate; readonly rng: Rng }[] {
  let standing = candidates;
  let rng = chronicle.rng;
  const drawn: { readonly picked: Candidate; readonly rng: Rng }[] = [];
  while (drawn.length < count) {
    const step = drawnNear(chronicle, rng, standing);
    if (step === undefined) break;
    rng = step.rng;
    drawn.push(step);
    standing = standing.filter((each) => each !== step.picked);
  }
  return drawn;
}

/** Every improvement standing on the map, once for each tile it stands on, with that tile. */
function improvementsStanding(
  chronicle: Chronicle,
): { readonly q: number; readonly r: number; readonly improvement: string }[] {
  return chronicle.tiles.flatMap(({ q, r, improvements }) =>
    improvements.map((improvement) => ({ q, r, improvement })),
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

/** What `removedNear` takes: improvements, buildings, and the city, one or none. */
export type Removal = {
  readonly improvements: number;
  readonly buildings: number;
  readonly city: number;
};

/** What `removedNear` takes for that count, read before it lands. */
export function removalNear(chronicle: Chronicle, count: number): Removal {
  const improvements = Math.min(
    count,
    drawableNear(chronicle, improvementsStanding(chronicle)).length,
  );
  const buildings = Math.min(count - improvements, buildingsInside(chronicle).length);
  return { improvements, buildings, city: count > improvements + buildings ? 1 : 0 };
}

/**
 * `count` things removed, one at a time: an improvement while one stands, drawn near the player's
 * city; then a building inside the player's border, drawn in one step of the chronicle's generator
 * among those standing; then the city's own building, which is its fall. One `retiled` each.
 */
export function removedNear(chronicle: Chronicle, count: number): Landed {
  let landing = unchanged(chronicle);
  for (let removed = 0; removed < count; removed++) {
    landing = followed(landing, (left) => oneRemovedNear(left));
  }
  return landing;
}

/** The next thing `removedNear` takes. */
function oneRemovedNear(chronicle: Chronicle): Landed {
  const improvement = drawnNear(chronicle, chronicle.rng, improvementsStanding(chronicle));
  if (improvement !== undefined) {
    const { picked, rng } = improvement;
    return retiled({ ...chronicle, rng }, { q: picked.q, r: picked.r }, (tile) => ({
      ...tile,
      improvements: tile.improvements.filter((each) => each !== picked.improvement),
    }));
  }
  const buildings = buildingsInside(chronicle);
  const drawn =
    buildings.length === 0
      ? { picked: chronicle.city, rng: chronicle.rng }
      : pickUniform(chronicle.rng, buildings);
  if (drawn.picked === undefined) return runtimeError(chronicle);
  return buildingTakenOff({ ...chronicle, rng: drawn.rng }, drawn.picked);
}

/** The tiles carrying one of the features; a feature the catalogue does not hold is refused. */
function carryingOneOf(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
): Tile[] {
  for (const feature of features) featureKind(catalogue, feature);
  return chronicle.tiles.filter(
    ({ feature }) => feature !== undefined && features.includes(feature),
  );
}

/** What `featuresRemovedNear` takes for that count, read before it lands: how many of each feature. */
export function featureRemovalNear(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
  count: number,
): Record<FeatureId, number> {
  const drawn = countDrawnNear(chronicle, carryingOneOf(catalogue, chronicle, features), count);
  return Object.fromEntries(
    features.map((feature) => [
      feature,
      drawn.filter(({ picked }) => picked.feature === feature).length,
    ]),
  );
}

/**
 * `count` of the features removed, each drawn near the player's city as `countDrawnNear` draws it and
 * going with every layer that goes with it: one `retiled` each, nothing where none stands.
 */
export function featuresRemovedNear(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
  count: number,
): Landed {
  let landing = unchanged(chronicle);
  for (const { picked, rng } of countDrawnNear(
    chronicle,
    carryingOneOf(catalogue, chronicle, features),
    count,
  )) {
    const at = { q: picked.q, r: picked.r };
    landing = followed(landing, (left) => featureRemoved(catalogue, { ...left, rng }, at));
  }
  return landing;
}

/**
 * `count` of the tiles of the terrains named that a terraform into `to` reaches terraformed into it,
 * each drawn near the player's city as `countDrawnNear` draws it: fewer where fewer stand, nothing
 * where none does. A terrain the catalogue does not hold is refused.
 */
export function terraformedNear(
  catalogue: Catalogue,
  chronicle: Chronicle,
  terrains: readonly Terrain[],
  to: Terrain,
  count: number,
): Landed {
  for (const terrain of [...terrains, to]) terrainKind(catalogue, terrain);
  const reached = chronicle.tiles.filter(
    (tile) => terrains.includes(tile.terrain) && reaches(catalogue, chronicle, tile, to),
  );
  let landing = unchanged(chronicle);
  for (const { picked, rng } of countDrawnNear(chronicle, reached, count)) {
    const at = { q: picked.q, r: picked.r };
    landing = followed(landing, (left) => terraformed(catalogue, { ...left, rng }, at, to));
  }
  return landing;
}

/**
 * One of the features dealt onto a tile carrying none, of the terrain it lies on, drawn near the
 * player's city, and the tile it landed on; a `runtime-error` where no such tile stands. Two features
 * lying on one terrain are refused.
 */
export function featureDealtNear(
  catalogue: Catalogue,
  chronicle: Chronicle,
  features: readonly FeatureId[],
): Landed & { readonly at?: TileCoords } {
  const lyingOn = new Map<Terrain, FeatureId>();
  for (const feature of features) {
    const { terrain } = featureKind(catalogue, feature);
    const other = lyingOn.get(terrain);
    if (other !== undefined)
      refuse(catalogue, `the features ${other} and ${feature} lie on ${terrain}`);
    lyingOn.set(terrain, feature);
  }
  const bare = chronicle.tiles.flatMap(({ q, r, terrain, feature }) => {
    const dealt = feature === undefined ? lyingOn.get(terrain) : undefined;
    return dealt === undefined ? [] : [{ q, r, feature: dealt }];
  });
  const drawn = drawnNear(chronicle, chronicle.rng, bare);
  if (drawn === undefined) return runtimeError(chronicle);
  const { q, r, feature } = drawn.picked;
  const at = { q, r };
  return { ...featurePlaced(catalogue, { ...chronicle, rng: drawn.rng }, at, feature), at };
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
  const { cards, nextKey } = keysDealt(chronicle.nextKey, [cardMade(catalogue, card, set)]);
  return landedAs(
    change(
      'added',
      { ...chronicle, nextKey, drawPile: [...cards, ...chronicle.drawPile] },
      chronicle,
    ),
  );
}

/**
 * The tiles a camp may be placed on: of the terrains a camp lies on, slot empty, the ground running to
 * the player's city from them, three tiles at least from its own tile, held by no city, no unit
 * standing on them, and `apart` at least from every camp standing. None for a city nowhere.
 */
function campTiles(catalogue: Catalogue, chronicle: Chronicle, apart: number): Tile[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const { building } = ageOf(catalogue, chronicle.age).camp;
  const ground = buildingKind(catalogue, building).terrains;
  const reached = groundRunsTo(catalogue, chronicle.tiles, chronicle.rivers, city);
  const camps = chronicle.tiles.filter((tile) => tile.building === building);
  return chronicle.tiles.filter(
    (tile) =>
      tile.building === undefined &&
      ground.includes(tile.terrain) &&
      reached.has(tileKey(tile)) &&
      distance(tile, city) >= 3 &&
      holderOf(chronicle, tile) === undefined &&
      unitAt(chronicle.units, tile) === undefined &&
      camps.every((other) => distance(tile, other) >= apart),
  );
}

export function campPlaceable(catalogue: Catalogue, chronicle: Chronicle, apart: number): boolean {
  return campTiles(catalogue, chronicle, apart).length > 0;
}

/**
 * A camp drawn near the player's city among the tiles a camp may be placed on, and `count` enemies of
 * the kind entered on and around it as the age's camp's guards; a `runtime-error` placing nothing
 * where no tile takes a camp.
 */
export function guardedCampPlaced(
  catalogue: Catalogue,
  chronicle: Chronicle,
  kind: string,
  count: number,
  apart: number,
): Landed {
  if (chronicle.city === undefined) {
    refuse(catalogue, 'a camp was placed while the city stands nowhere');
  }
  const { building, scripts } = ageOf(catalogue, chronicle.age).camp;
  const drawn = drawnNear(chronicle, chronicle.rng, campTiles(catalogue, chronicle, apart));
  if (drawn === undefined) return runtimeError(chronicle);
  const camp = { q: drawn.picked.q, r: drawn.picked.r };
  // The first enemy lands on the camp, where its kind stands on it, only because `campTiles` keeps no
  // tile a unit stands on.
  return followed(built(catalogue, { ...chronicle, rng: drawn.rng }, camp, building), (left) => {
    const rows = rowsDrawn(catalogue, left, [{ kind, script: scripts.guard, weight: 1 }], count);
    return campEnteredAround(catalogue, rows.chronicle, camp, rows.rows);
  });
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}
