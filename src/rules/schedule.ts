import {
  type Answer,
  type Catalogue,
  capstoneOf,
  cardOf,
  eventOf,
  type Span,
  scheduleOf,
} from './catalogue';
import { enteredFromCamp, enteredOnCamp } from './enemies';
import { distance, MOVE_POINT, pathCosts, type TileCoords, tileKey } from './map';
import { buildingKind, held, refuse } from './map-kinds';
import { nextRng, pickWeighted, type Rng } from './rng';
import {
  type CardId,
  type Chronicle,
  costsOf,
  type Deal,
  holds,
  paid,
  type Refusal,
  type Timeline,
  unaffordable,
} from './state';
import { unitAt } from './units';

/**
 * A schedule rolled into the timeline a chronicle opens on, the generator handed in its own from then
 * on: the capstone's turn from the window, then the first deal rolled as from a landing on turn 0. A
 * schedule the catalogue does not hold is refused.
 */
export function timelineOf(catalogue: Catalogue, id: string, rng: Rng): Timeline {
  const schedule = scheduleOf(catalogue, id);
  const capstone = withinSpan(rng, schedule.capstone.window);
  return rolledFrom(
    catalogue,
    {
      schedule: id,
      rng: capstone.rng,
      capstone: { id: schedule.capstone.id, turn: capstone.turns },
    },
    0,
  );
}

/**
 * The next deal rolled from a landing, every draw from the timeline's own generator: its due turn
 * from the spacing, then one of the entries weighing anything on that turn drawn, or no event where
 * none does, which draws nothing.
 */
function rolledFrom(
  catalogue: Catalogue,
  timeline: Omit<Timeline, 'next'>,
  landing: number,
): Timeline {
  const { spacing, entries } = scheduleOf(catalogue, timeline.schedule);
  const spaced = withinSpan(timeline.rng, spacing);
  const turn = landing + spaced.turns;
  const weighing = Object.entries(entries)
    .map(([entry, weight]): [string, number] => [entry, weight(turn)])
    .filter(([, weight]) => weight > 0);
  if (weighing.length === 0) return { ...timeline, rng: spaced.rng, next: { turn } };

  const drawn = pickWeighted(spaced.rng, weighing);
  return { ...timeline, rng: drawn.rng, next: { turn, event: drawn.picked } };
}

/**
 * Whether the chronicle has passed its capstone: never before the turn the capstone lands on, and
 * from that turn on whenever the capstone's condition holds.
 */
export function passed(catalogue: Catalogue, chronicle: Chronicle): boolean {
  const { id, turn } = chronicle.timeline.capstone;
  return chronicle.turn >= turn && capstoneOf(catalogue, id).passes(catalogue, chronicle);
}

/** Whether the chronicle stands on the last turn of a span of turns begun on the capstone's, or past it. */
export function spanEnded(chronicle: Chronicle, turns: number): boolean {
  return chronicle.turn >= chronicle.timeline.capstone.turn + turns - 1;
}

/**
 * The events phase, which draws nothing from the chronicle's generator: on the capstone's turn the
 * capstone lands on the chronicle as it stands, nothing is dealt whatever deal was ahead, and the
 * next deal is rolled from that turn; on the turn the next deal is due its event is dealt behind the
 * deals already standing, nothing landing until one of its answers is taken, and the next is rolled
 * from that turn; on the turn a next deal with no event is due nothing is dealt, and the next is
 * rolled from that turn; any other turn changes nothing.
 */
export function events(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly phase: 'capstone' | 'deal' | 'no-deal'; readonly chronicle: Chronicle } {
  const { timeline, turn } = chronicle;
  if (turn === timeline.capstone.turn) {
    const landed = capstoneOf(catalogue, timeline.capstone.id).lands(catalogue, chronicle);
    return {
      phase: 'capstone',
      chronicle: { ...landed, timeline: rolledFrom(catalogue, timeline, turn) },
    };
  }

  const { next } = timeline;
  if (turn !== next.turn) return { phase: 'deal', chronicle };
  if (next.event === undefined) {
    return {
      phase: 'no-deal',
      chronicle: { ...chronicle, timeline: rolledFrom(catalogue, timeline, turn) },
    };
  }
  return {
    phase: 'deal',
    chronicle: {
      ...chronicle,
      timeline: rolledFrom(catalogue, timeline, turn),
      deals: [...chronicle.deals, { of: 'event', event: next.event }],
    },
  };
}

/** What a deal offers to be taken, by id, in the order dealt: its event's answers, or the camp's rewards. */
export function offered(catalogue: Catalogue, deal: Deal): readonly string[] {
  switch (deal.of) {
    case 'event':
      return Object.keys(eventOf(catalogue, deal.event).answers);
    case 'camp':
      return deal.rewards;
  }
}

/** The answer an id names among the event's; an answer the event does not deal is refused. */
export function answerOf(catalogue: Catalogue, event: string, answer: string): Answer {
  return held(catalogue, eventOf(catalogue, event).answers, answer, `answer of ${event}`);
}

/**
 * Everything standing between the city and an answer of the event: what it cannot pay. Nothing on
 * the map blocks an answer.
 */
export function answerRefusal(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  answer: string,
): Refusal {
  const costs = costsOf(answerOf(catalogue, event, answer).cost);
  return { unaffordable: unaffordable(chronicle, costs), blocked: [] };
}

/**
 * An answer taken off the chronicle the deal is popped from: its cost is paid, and it lands on what
 * that leaves.
 */
export function answered(catalogue: Catalogue, chronicle: Chronicle, answer: Answer): Chronicle {
  return answer.lands(catalogue, paid(chronicle, costsOf(answer.cost)));
}

/** A reward taken off the chronicle the deal is popped from: it is laid in the discard pile. */
export function rewarded(chronicle: Chronicle, card: CardId): Chronicle {
  return { ...chronicle, discardPile: [...chronicle.discardPile, card] };
}

/**
 * The capstone's second script, on every turn after the one it lands on, and nothing on any other
 * turn or for a capstone that carries none.
 */
export function continued(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const { id, turn } = chronicle.timeline.capstone;
  if (chronicle.turn <= turn) return chronicle;
  return capstoneOf(catalogue, id).continues?.(catalogue, chronicle) ?? chronicle;
}

/**
 * Warriors entering from the camps, one after another: each draws its own camp, so the second sees
 * the camp the first took as taken, and more warriors than free camps enter what they can.
 */
export function raided(catalogue: Catalogue, chronicle: Chronicle, warriors: number): Chronicle {
  let standing = chronicle;
  for (let warrior = 0; warrior < warriors; warrior++) {
    standing = enteredFromCamp(catalogue, standing);
  }
  return standing;
}

/** A card laid on top of the draw pile; a card the catalogue does not hold is refused. */
export function laid(catalogue: Catalogue, chronicle: Chronicle, card: CardId): Chronicle {
  cardOf(catalogue, card);
  return { ...chronicle, drawPile: [card, ...chronicle.drawPile] };
}

/**
 * The camp's unit entering on every camp whose tile is free, in tile order, and on none a unit
 * stands on. It draws nothing.
 */
export function reinforced(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(standing.units, { q, r }) !== undefined) continue;
    standing = enteredOnCamp(catalogue, standing, { q, r });
  }
  return standing;
}

/**
 * Camps placed around the city, drawn one at a time, each uniformly from the tiles of the terrains a
 * camp lies on whose slot is empty, that the ground runs to the city from, within `fromCity` of the
 * city, held by nobody, no unit standing on them, and `apart` at least from every camp standing — the
 * generator's and the ones already drawn here alike; the candidates are filtered again after each.
 * When they run out it places what it can. Then the camp's unit enters on each camp it placed, on
 * that camp and on no other, so the draws of the placement are the only ones.
 */
export function besieged(
  catalogue: Catalogue,
  chronicle: Chronicle,
  camps: number,
  fromCity: Span,
  apart: number,
): Chronicle {
  const { city } = chronicle;
  if (city === undefined) refuse(catalogue, 'a siege landed while the city stands nowhere');
  const [near, far] = fromCity;
  const camp = catalogue.camp.building;
  const ground = buildingKind(catalogue, camp).terrains;
  // Only which tiles the walk reached is read here, never what reaching them cost, so the move a
  // crossing is charged against shows nowhere.
  const reached = pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    city,
    { kind: 'whole-map', move: MOVE_POINT },
    () => false,
  );

  let rng = chronicle.rng;
  const standing: TileCoords[] = chronicle.tiles.filter((tile) => tile.building === camp);
  const placed: TileCoords[] = [];
  for (let drawn = 0; drawn < camps; drawn++) {
    const candidates = chronicle.tiles.filter(
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
    if (candidates.length === 0) break;

    const step = nextRng(rng);
    rng = step.rng;
    const chosen = candidates[Math.floor(step.value * candidates.length)];
    standing.push(chosen);
    placed.push({ q: chosen.q, r: chosen.r });
  }

  const pitched = new Set(placed.map(tileKey));
  let placing: Chronicle = {
    ...chronicle,
    rng,
    tiles: chronicle.tiles.map((tile) =>
      pitched.has(tileKey(tile)) ? { ...tile, building: camp } : tile,
    ),
  };
  for (const tile of placed) placing = enteredOnCamp(catalogue, placing, tile);
  return placing;
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}
