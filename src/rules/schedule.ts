import { type Answer, type Catalogue, cardOf, eventOf, type Span, scheduleOf } from './catalogue';
import { enteredFromCamp, enteredOnCamp } from './enemies';
import { distance, MOVE_POINT, pathCosts, type TileCoords, tileKey } from './map';
import { buildingKind, held, refuse } from './map-kinds';
import { nextRng, pickWeighted, type Rng } from './rng';
import { type CardId, type Chronicle, costsOf, type Deal, holds, type Timeline } from './state';
import { unitAt } from './units';

/**
 * A schedule rolled into a timeline, every draw from the generator handed in and in this order: the
 * turn the first deal is due, the capstone's turn, and then turn by turn to the capstone's last what
 * the events phase would have drawn. The capstone's turn deals nothing among the deals and rolls the
 * next due turn from itself, whatever was due. A due turn deals one of the entries weighing anything
 * on it and rolls the next due turn from itself; one no entry weighs anything on deals nothing and
 * rolls nothing, so the turn after it is tried. A schedule the catalogue does not hold is refused.
 */
export function timelineOf(
  catalogue: Catalogue,
  id: string,
  rng: Rng,
): { rng: Rng; timeline: Timeline } {
  const schedule = scheduleOf(catalogue, id);
  const first = withinSpan(rng, schedule.spacing);
  const capstone = withinSpan(first.rng, schedule.capstone.window);
  const last = capstone.turns + schedule.capstone.span - 1;

  let drawing = capstone.rng;
  let due = first.turns;
  const deals: Timeline['deals'][number][] = [];
  for (let turn = 1; turn <= last; turn++) {
    if (turn !== capstone.turns) {
      if (turn < due) continue;
      const weighing = Object.entries(schedule.entries)
        .map(([entry, weight]): [string, number] => [entry, weight(turn)])
        .filter(([, weight]) => weight > 0);
      if (weighing.length === 0) continue;

      const drawn = pickWeighted(drawing, weighing);
      drawing = drawn.rng;
      deals.push({ turn, event: drawn.picked });
    }
    const next = withinSpan(drawing, schedule.spacing);
    drawing = next.rng;
    due = turn + next.turns;
  }

  return {
    rng: drawing,
    timeline: {
      deals,
      capstone: { event: schedule.capstone.event, turn: capstone.turns, last },
    },
  };
}

/** Whether the capstone has been stood out: the chronicle is on the last turn of its span. */
export function survived(chronicle: Chronicle): boolean {
  return chronicle.turn === chronicle.timeline.capstone.last;
}

/**
 * The events phase, which draws nothing: the capstone's turn deals the capstone alone, whatever the
 * timeline lists for that turn; a turn the timeline lists a deal for deals its event; any other turn
 * changes nothing, so the end of turn raises no stage for it. The deal waits behind the deals already
 * standing, and nothing lands until one of its answers is taken.
 */
export function events(chronicle: Chronicle): Chronicle {
  const { capstone, deals } = chronicle.timeline;
  const dealt = (event: string): Chronicle => ({
    ...chronicle,
    deals: [...chronicle.deals, { of: 'event', event }],
  });
  if (chronicle.turn === capstone.turn) return dealt(capstone.event);

  const due = deals.find((deal) => deal.turn === chronicle.turn);
  return due === undefined ? chronicle : dealt(due.event);
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
 * An answer taken off the chronicle the deal is popped from: its cost is paid, and it lands on what
 * that leaves.
 */
export function answered(catalogue: Catalogue, chronicle: Chronicle, answer: Answer): Chronicle {
  const resources = { ...chronicle.resources };
  for (const { resource, amount } of costsOf(answer.cost)) resources[resource] -= amount;
  return answer.lands(catalogue, { ...chronicle, resources });
}

/** A reward taken off the chronicle the deal is popped from: it is laid in the discard pile. */
export function rewarded(chronicle: Chronicle, card: CardId): Chronicle {
  return { ...chronicle, discardPile: [...chronicle.discardPile, card] };
}

/**
 * The capstone's second script, on every turn of its span after the one it lands on, and nothing on
 * any other turn or for a capstone that carries none.
 */
export function continued(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const { event, turn, last } = chronicle.timeline.capstone;
  if (chronicle.turn <= turn || chronicle.turn > last) return chronicle;
  return eventOf(catalogue, event).continues?.(catalogue, chronicle) ?? chronicle;
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
