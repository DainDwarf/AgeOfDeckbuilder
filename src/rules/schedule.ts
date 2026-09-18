import { terraformed } from './cards';
import {
  type Answer,
  type Catalogue,
  capstoneOf,
  cardOf,
  entered,
  eventOf,
  type Span,
  scheduleOf,
} from './catalogue';
import { campUnit, enteredAround, raidEntry } from './enemies';
import { distance, type FeatureId, groundRunsTo, type Tile, type TileCoords, tileKey } from './map';
import { buildingKind, featureKind, held, refuse } from './map-kinds';
import { nextRng, pickWeighted, type Rng } from './rng';
import {
  change,
  changeFrom,
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
  costsOf,
  type Deal,
  holds,
  idle,
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

/** Whether the turn has ticked past the last of a span of turns begun on the capstone's. */
export function spanEnded(chronicle: Chronicle, turns: number): boolean {
  return chronicle.turn >= chronicle.timeline.capstone.turn + turns;
}

/**
 * The events phase, which draws from the chronicle's generator only through the capstone's landing.
 * On the capstone's turn, one `capstone` group: nothing is dealt whatever was due, the next due turn
 * is rolled from that turn, and the capstone lands on what that leaves. On a due turn, one `deal`
 * group: the next due turn is rolled from that turn, and the event drawn is dealt behind the deals
 * already standing, nothing landing until one of its answers is taken — or, where no event is drawn,
 * a `runtime-error`, and play goes on to the next due turn. Any other turn stages nothing.
 */
export function events(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  const { timeline, turn } = chronicle;
  if (turn === timeline.capstone.turn) {
    const rolled = landedAs(
      change('rolled', { ...chronicle, timeline: rolledFrom(catalogue, timeline, turn) }),
    );
    const { lands } = capstoneOf(catalogue, timeline.capstone.id);
    return grouped(
      { name: 'capstone' },
      followed(rolled, (left) => lands(catalogue, left)),
    );
  }

  if (turn !== timeline.next) return unchanged(chronicle);
  const { event, rng } = eventDrawn(catalogue, chronicle);
  const rolled = landedAs(
    change('rolled', {
      ...chronicle,
      timeline: rolledFrom(catalogue, { ...timeline, rng }, turn),
    }),
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
 * Everything standing between the city and an answer of the event: what it cannot pay. Nothing on
 * the map blocks an answer.
 */
export function answerRefusal(
  catalogue: Catalogue,
  chronicle: Chronicle,
  event: string,
  answer: string,
): Refusal {
  const costs = answerCost(catalogue, chronicle, answerOf(catalogue, event, answer));
  return { unaffordable: unaffordable(chronicle, costs), blocked: [] };
}

/**
 * An answer taken off the chronicle the deal is popped from: its cost paid as one `stock`, none where
 * it costs nothing, and its landing on what that leaves.
 */
export function answered(catalogue: Catalogue, chronicle: Chronicle, answer: Answer): Landed {
  const costs = answerCost(catalogue, chronicle, answer);
  const paidOn =
    costs.length === 0 ? unchanged(chronicle) : landedAs(change('stock', paid(chronicle, costs)));
  return followed(paidOn, (left) => answer.lands(catalogue, left));
}

/** A reward taken off the chronicle the deal is popped from: it is laid in the discard pile. */
export function rewarded(chronicle: Chronicle, card: CardId): Landed {
  return landedAs(
    changeFrom('discarded', [], { ...chronicle, discardPile: [...chronicle.discardPile, card] }),
  );
}

/**
 * The capstone's second script, on every turn after the one it lands on: one `capstone` group over
 * what it raised. Nothing on any other turn, or for a capstone that carries none.
 */
export function continued(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  const { id, turn } = chronicle.timeline.capstone;
  const { continues } = capstoneOf(catalogue, id);
  if (chronicle.turn <= turn || continues === undefined) return unchanged(chronicle);
  return grouped({ name: 'capstone' }, continues(catalogue, chronicle));
}

/** A content defect met in play, followed through as the one change saying so. */
function runtimeError(chronicle: Chronicle): Landed {
  return landedAs(change('runtime-error', chronicle));
}

/**
 * The warriors entering around a door drawn for them; a raid of no warrior, or one with no door or
 * no free tile to enter on, draws nothing and is a `runtime-error`.
 */
export function raided(catalogue: Catalogue, chronicle: Chronicle, warriors: number): Landed {
  if (warriors <= 0) return runtimeError(chronicle);
  const drawn = raidEntry(catalogue, chronicle);
  if (drawn === undefined) return runtimeError(chronicle);
  return enteredAround(catalogue, drawn.chronicle, drawn.entry, warriors);
}

/** The population off the tile and then one fewer. */
function populationLeaving(chronicle: Chronicle, at: TileCoords): Landed {
  const key = tileKey(at);
  return followed(
    landedAs(
      changeOn('assigned', at, {
        ...chronicle,
        assigned: chronicle.assigned.filter((coord) => tileKey(coord) !== key),
      }),
    ),
    (left) => landedAs(change('population', { ...left, population: left.population - 1 })),
  );
}

/**
 * The population working the tile killed: the tile unassigned and the city's population one fewer,
 * and nothing where nobody works it.
 */
export function populationKilled(chronicle: Chronicle, at: TileCoords): Landed {
  const key = tileKey(at);
  const working = chronicle.assigned.find((coord) => tileKey(coord) === key);
  if (working === undefined) return unchanged(chronicle);
  return populationLeaving(chronicle, working);
}

/**
 * One population of the city taken, whichever it is: an idle one where one is idle, and where none
 * is the last assigned tile unassigned first, the city's last no exception; the population one fewer.
 * Nothing where the city has no population at all.
 */
export function populationTaken(chronicle: Chronicle): Landed {
  if (chronicle.population <= 0) return unchanged(chronicle);
  const last = chronicle.assigned[chronicle.assigned.length - 1];
  if (idle(chronicle) > 0 || last === undefined) {
    return landedAs(change('population', { ...chronicle, population: chronicle.population - 1 }));
  }
  return populationLeaving(chronicle, last);
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
  const step = nextRng(chronicle.rng);
  const dealt = candidates[Math.floor(step.value * candidates.length)];
  const key = tileKey(dealt);
  const at = { q: dealt.q, r: dealt.r };
  const landing = landedAs(
    changeOn('retiled', at, {
      ...chronicle,
      rng: step.rng,
      tiles: chronicle.tiles.map((tile) => (tileKey(tile) === key ? { ...tile, feature } : tile)),
    }),
  );
  return { ...landing, at };
}

/** A card laid on top of the draw pile; a card the catalogue does not hold is refused. */
export function laid(catalogue: Catalogue, chronicle: Chronicle, card: CardId): Landed {
  cardOf(catalogue, card);
  return landedAs(change('laid', { ...chronicle, drawPile: [card, ...chronicle.drawPile] }));
}

/**
 * The camp's unit entering on every camp whose tile is free, in tile order, and on none a unit
 * stands on. It draws nothing.
 */
export function reinforced(catalogue: Catalogue, chronicle: Chronicle): Landed {
  let landing = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(landing.chronicle.units, { q, r }) !== undefined) continue;
    landing = followed(landing, (left) => entered(catalogue, left, campUnit(catalogue, { q, r })));
  }
  return landing;
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
  const ground = buildingKind(catalogue, catalogue.camp.building).terrains;
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
  return chronicle.tiles.filter((tile) => tile.building === catalogue.camp.building);
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
  const camp = catalogue.camp.building;

  let rng = chronicle.rng;
  const standing = campsStanding(catalogue, chronicle);
  const placings: { readonly tile: TileCoords; readonly rng: Rng }[] = [];
  for (let drawn = 0; drawn < camps; drawn++) {
    const candidates = campTiles(catalogue, chronicle, fromCity, apart, standing);
    if (candidates.length === 0) break;

    const step = nextRng(rng);
    rng = step.rng;
    const chosen = candidates[Math.floor(step.value * candidates.length)];
    standing.push(chosen);
    placings.push({ tile: { q: chosen.q, r: chosen.r }, rng });
  }
  if (placings.length === 0) return { ...runtimeError(chronicle), placed: [] };

  let landing = unchanged(chronicle);
  for (const placing of placings) {
    const key = tileKey(placing.tile);
    landing = followed(landing, (left) =>
      landedAs(
        changeOn('retiled', placing.tile, {
          ...left,
          rng: placing.rng,
          tiles: left.tiles.map((tile) =>
            tileKey(tile) === key ? { ...tile, building: camp } : tile,
          ),
        }),
      ),
    );
  }
  return { ...landing, placed: placings.map(({ tile }) => tile) };
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}
