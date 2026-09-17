import { terraformed } from './cards';
import {
  type Answer,
  type Catalogue,
  capstoneOf,
  cardOf,
  eventOf,
  type Span,
  scheduleOf,
} from './catalogue';
import { campUnitEntered, enteredAround, raidEntry } from './enemies';
import { distance, groundRunsTo, type TileCoords, tileKey } from './map';
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
import { damaged, unitAt } from './units';

/**
 * A schedule rolled into the timeline a chronicle opens on, the generator handed in its own from then
 * on: the capstone's turn from the window, then the first due turn rolled as from a landing on turn
 * 0. A schedule the catalogue does not hold is refused.
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

/** The next due turn rolled from a landing by the spacing, from the timeline's own generator. */
function rolledFrom(
  catalogue: Catalogue,
  timeline: Omit<Timeline, 'next'>,
  landing: number,
): Timeline {
  const spaced = withinSpan(timeline.rng, scheduleOf(catalogue, timeline.schedule).spacing);
  return { ...timeline, rng: spaced.rng, next: landing + spaced.turns };
}

/**
 * The event drawn on the due turn, from the timeline's own generator, seeded and weighted among the
 * entries weighing anything on that turn whose need the chronicle meets; no event where none does.
 * Where no entry weighs anything on the turn it draws nothing.
 */
function eventDrawn(catalogue: Catalogue, chronicle: Chronicle): { event?: string; rng: Rng } {
  const { timeline, turn } = chronicle;
  const weighing = Object.entries(scheduleOf(catalogue, timeline.schedule).entries)
    .map(([entry, weight]): [string, number] => [entry, weight(turn)])
    .filter(([, weight]) => weight > 0);
  if (weighing.length === 0) return { rng: timeline.rng };

  const dealable = weighing.filter(
    ([entry]) => eventOf(catalogue, entry).needs?.(catalogue, chronicle) ?? true,
  );
  // The step is taken even where no need is met, or the turns a seed deals on would follow the play.
  if (dealable.length === 0) return { rng: nextRng(timeline.rng).rng };
  const { picked, rng } = pickWeighted(timeline.rng, dealable);
  return { event: picked, rng };
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
 * capstone lands on the chronicle as it stands, nothing is dealt whatever was due, and the next due
 * turn is rolled from that turn; on the due turn its event is drawn and dealt behind the deals
 * already standing, nothing landing until one of its answers is taken, or nothing is dealt where no
 * event is drawn, and the next due turn is rolled from that turn; any other turn changes nothing.
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

  if (turn !== timeline.next) return { phase: 'deal', chronicle };
  const { event, rng } = eventDrawn(catalogue, chronicle);
  const rolled = rolledFrom(catalogue, { ...timeline, rng }, turn);
  if (event === undefined) {
    return { phase: 'no-deal', chronicle: { ...chronicle, timeline: rolled } };
  }
  return {
    phase: 'deal',
    chronicle: {
      ...chronicle,
      timeline: rolled,
      deals: [...chronicle.deals, { of: 'event', event }],
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

export function raided(catalogue: Catalogue, chronicle: Chronicle, warriors: number): Chronicle {
  const drawn = raidEntry(catalogue, chronicle);
  if (drawn === undefined) return chronicle;
  return enteredAround(catalogue, drawn.chronicle, drawn.entry, warriors);
}

/**
 * The population working the tile killed: the city's population one fewer and the tile unassigned,
 * and the chronicle untouched where nobody works it.
 */
export function populationKilled(chronicle: Chronicle, at: TileCoords): Chronicle {
  const key = tileKey(at);
  const assigned = chronicle.assigned.filter((coord) => tileKey(coord) !== key);
  if (assigned.length === chronicle.assigned.length) return chronicle;
  return { ...chronicle, population: chronicle.population - 1, assigned };
}

/**
 * The unit standing on the tile, whatever its faction, losing health by the amount and killed at
 * nought, and the chronicle untouched where no unit stands there.
 */
export function unitDamaged(chronicle: Chronicle, at: TileCoords, amount: number): Chronicle {
  const target = unitAt(chronicle.units, at);
  if (target === undefined) return chronicle;
  return { ...chronicle, units: damaged(chronicle.units, target, amount) };
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

/** The tiles of the terrain the fire burns within its distance of the city's tile, in tile order. */
function fireStarts(chronicle: Chronicle, fire: Fire): TileCoords[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  return chronicle.tiles.filter(
    (tile) => tile.terrain === fire.burns && distance(tile, city) <= fire.fromCity,
  );
}

/** Whether the fire has a tile to start on. */
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
  const step = nextRng(chronicle.rng);
  const start = candidates[Math.floor(step.value * candidates.length)];
  const burning = chronicle.tiles
    .filter((tile) => tile.terrain === fire.burns && distance(tile, start) <= fire.around)
    .map(({ q, r }) => ({ q, r }));
  return { burning, rng: step.rng };
}

/**
 * What the fire costs, read before it lands: the tiles burned, the population working them, the
 * player's units standing on them, and the damage each unit takes.
 */
export function fireRead(chronicle: Chronicle, fire: Fire): Record<string, number> {
  const burning = new Set(fireDrawn(chronicle, fire).burning.map(tileKey));
  return {
    tiles: burning.size,
    population: chronicle.assigned.filter((coord) => burning.has(tileKey(coord))).length,
    units: chronicle.units.filter(
      (unit) => unit.faction === 'player' && burning.has(tileKey(unit.tile)),
    ).length,
    damage: fire.damage,
  };
}

/**
 * The fire landed: on every tile it burns, the population working it killed, the tile terraformed
 * into the terrain it leaves, and the unit standing on it damaged, whatever its faction.
 */
export function burned(catalogue: Catalogue, chronicle: Chronicle, fire: Fire): Chronicle {
  const { burning, rng } = fireDrawn(chronicle, fire);
  let landing: Chronicle = { ...chronicle, rng };
  for (const tile of burning) {
    landing = populationKilled(landing, tile);
    landing = terraformed(catalogue, landing, tile, fire.leaves);
    landing = unitDamaged(landing, tile, fire.damage);
  }
  return landing;
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
    standing = campUnitEntered(catalogue, standing, { q, r });
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
): { readonly chronicle: Chronicle; readonly placed: readonly TileCoords[] } {
  const { city } = chronicle;
  if (city === undefined) refuse(catalogue, 'a siege landed while the city stands nowhere');
  const [near, far] = fromCity;
  const camp = catalogue.camp.building;
  const ground = buildingKind(catalogue, camp).terrains;
  const reached = groundRunsTo(catalogue, chronicle.tiles, chronicle.rivers, city);

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
  for (const tile of placed) placing = campUnitEntered(catalogue, placing, tile);
  return { chronicle: placing, placed };
}

/** `besieged` enters the raid's first warrior on the camp it places. */
export function encamped(
  catalogue: Catalogue,
  chronicle: Chronicle,
  fromCity: Span,
  apart: number,
  warriors: number,
): Chronicle {
  const { city } = chronicle;
  if (city === undefined) refuse(catalogue, 'a camp was placed while the city stands nowhere');
  const [near, far] = fromCity;
  const edge = Math.max(...chronicle.tiles.map((tile) => distance(tile, city)));
  for (let widened = far; widened <= Math.max(far, edge); widened++) {
    const { chronicle: placing, placed } = besieged(
      catalogue,
      chronicle,
      1,
      [near, widened],
      apart,
    );
    const [camp] = placed;
    if (camp === undefined) continue;
    return enteredAround(catalogue, placing, camp, warriors - 1);
  }
  return raided(catalogue, chronicle, warriors);
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}
