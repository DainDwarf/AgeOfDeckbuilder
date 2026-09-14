import type { Catalogue } from './catalogue';
import { enteredFromCamp, enteredOnCamp } from './enemies';
import { distance, MOVE_POINT, pathCosts, type TileCoords, tileKey } from './map';
import { buildingKind } from './map-kinds';
import { nextRng, pickWeighted, type Rng } from './rng';
import { type Chronicle, type EventId, holds } from './state';
import { unitAt } from './units';

/**
 * One entry of the schedule: what it weighs on a turn, nothing at all on a turn it may not land on,
 * what its rules entry reads of the turn it is dealt on, and what it does to the chronicle it lands
 * on. A draw of its own steps the generator that chronicle carries.
 */
export type ScheduledEvent = {
  readonly weight: (turn: number) => number;
  readonly reads: (catalogue: Catalogue, chronicle: Chronicle) => Record<string, number>;
  readonly lands: (catalogue: Catalogue, chronicle: Chronicle) => Chronicle;
};

/** How many of the schedule's entries a due turn deals, for the player to take one of. */
const DEAL = 2;

/** The least and the most a span rolls, both ends included. */
type Span = readonly [number, number];

/**
 * 🔧 What the siege lands: how many camps it draws, how far from the city each stands, and how far
 * from every camp standing.
 */
export const SIEGE = { camps: 5, fromCity: [3, 5] as Span, apart: 3 };

/** 🔧 How many turns the siege spans, the turn it lands on the first of them. */
const SIEGE_SPAN = 6;

/**
 * The age's schedule: how far apart its events land, which entry is its capstone and the window of
 * turns the capstone's own turn is rolled from, and every entry it draws from.
 */
export const SCHEDULE: {
  readonly spacing: Span;
  readonly capstone: { readonly event: EventId; readonly window: Span };
  readonly events: Record<EventId, ScheduledEvent>;
} = {
  spacing: [3, 7],
  capstone: { event: 'PH_Siege', window: [27, 33] },
  events: {
    PH_Raid: {
      weight: () => 1,
      reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
      lands: (catalogue, chronicle) => raid(catalogue, chronicle, raiders(chronicle.turn)),
    },
    PH_Famine: {
      weight: () => 1,
      reads: () => ({}),
      lands: (_catalogue, chronicle) => ({
        ...chronicle,
        drawPile: ['PH_Hunger', ...chronicle.drawPile],
      }),
    },
    PH_Siege: {
      // Its own turn is what deals it; the weight of nothing keeps it out of every other deal.
      weight: () => 0,
      reads: () => ({ camps: SIEGE.camps }),
      lands: (catalogue, chronicle) => siege(catalogue, chronicle),
    },
  },
};

/**
 * The generator, the turn the first event is due and the turn the capstone lands on, as the founding
 * lays them on the chronicle it opens: both rolls are taken before that chronicle's first events
 * phase runs.
 */
export function scheduled(rng: Rng): { rng: Rng; nextEvent: number; capstoneTurn: number } {
  const rolled = withinSpan(rng, SCHEDULE.spacing);
  const capstone = withinSpan(rolled.rng, SCHEDULE.capstone.window);
  return { rng: capstone.rng, nextEvent: rolled.turns, capstoneTurn: capstone.turns };
}

/** Whether the deal standing is the capstone's: what the deal window reads its title from. */
export function dealsCapstone(chronicle: Chronicle): boolean {
  return chronicle.deal.includes(SCHEDULE.capstone.event);
}

/**
 * Whether the capstone has been stood out: the chronicle is on the last turn of the siege's span,
 * which no chronicle reaches without the capstone having landed on it.
 */
export function survived(chronicle: Chronicle): boolean {
  return chronicle.turn === chronicle.capstoneTurn + SIEGE_SPAN - 1;
}

/**
 * The events phase: a turn the schedule has nothing due on, and one no entry weighs anything on,
 * change nothing and draw nothing, so the end of turn raises no stage for either. On the due turn
 * the entries weighing anything are drawn one after another, never the same one twice, and the
 * chronicle carries the deal in the order dealt; a turn fewer of them weigh anything on deals what
 * there is. The capstone's turn deals the capstone alone, whatever turn the next event was due, and
 * draws nothing; its take rolls that turn again as any landing does. Nothing lands until one of the
 * entries dealt is taken.
 */
export function events(chronicle: Chronicle): Chronicle {
  if (chronicle.turn === chronicle.capstoneTurn) {
    return { ...chronicle, deal: [SCHEDULE.capstone.event] };
  }

  const weighing = weighed(chronicle.turn);
  if (chronicle.turn < chronicle.nextEvent || weighing.length === 0) return chronicle;

  let rng = chronicle.rng;
  const deal: EventId[] = [];
  while (deal.length < DEAL && weighing.length > 0) {
    const drawn = pickWeighted(rng, weighing);
    rng = drawn.rng;
    deal.push(drawn.picked);
    weighing.splice(
      weighing.findIndex(([id]) => id === drawn.picked),
      1,
    );
  }
  return { ...chronicle, rng, deal };
}

/**
 * 🔧 The siege's reinforcement, on every turn after the one the capstone landed on: a warrior enters
 * on every camp whose tile is free, in tile order, the generator's camps as much as the siege's own,
 * and none at all on a camp a unit stands on. It draws nothing, and must not: every later draw of the
 * chronicle would move with it.
 */
export function reinforced(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  if (chronicle.turn <= chronicle.capstoneTurn) return chronicle;

  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(standing.units, { q, r }) !== undefined) continue;
    standing = enteredOnCamp(catalogue, standing, { q, r });
  }
  return standing;
}

/**
 * One dealt entry taken: it lands on the chronicle the deal stood on, which is left with no deal,
 * and the turn the next event is due is rolled — deal, land, roll, in that order, which a replay of
 * the chronicle pins.
 */
export function taken(catalogue: Catalogue, chronicle: Chronicle, event: EventId): Chronicle {
  const landed = SCHEDULE.events[event].lands(catalogue, { ...chronicle, deal: [] });
  const rolled = withinSpan(landed.rng, SCHEDULE.spacing);
  return { ...landed, rng: rolled.rng, nextEvent: landed.turn + rolled.turns };
}

/** The entries an event may be drawn from on this turn: one weighted nothing cannot land. */
function weighed(turn: number): [EventId, number][] {
  const entries = Object.entries(SCHEDULE.events) as [EventId, ScheduledEvent][];
  return entries
    .map(([id, event]): [EventId, number] => [id, event.weight(turn)])
    .filter(([, weight]) => weight > 0);
}

/** One roll of the generator inside a span of turns, both ends included. */
function withinSpan(rng: Rng, [least, most]: Span): { rng: Rng; turns: number } {
  const step = nextRng(rng);
  return { rng: step.rng, turns: least + Math.floor(step.value * (most - least + 1)) };
}

/** What a raid enters on this turn: one warrior, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/**
 * The raid's warriors, one after another: each draws its own camp, so the second sees the camp the
 * first took as taken, and a raid with more warriors than free camps enters what it can.
 */
function raid(catalogue: Catalogue, chronicle: Chronicle, warriors: number): Chronicle {
  let standing = chronicle;
  for (let warrior = 0; warrior < warriors; warrior++) {
    standing = enteredFromCamp(catalogue, standing);
  }
  return standing;
}

/**
 * The siege the capstone lands: its camps are drawn one at a time, each uniformly from the tiles of
 * the terrains a camp lies on whose slot is empty, that the ground runs to the city from, within the
 * siege's reach of the city, held by nobody, no unit standing on them, and far enough from every
 * camp standing — the generator's and the ones already drawn here alike; the candidates are filtered
 * again after each. When they run out the siege places what it can. Then a warrior enters on each
 * camp it placed, on that camp and on no other, so the draws of the placement are the only ones.
 */
function siege(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const [near, far] = SIEGE.fromCity;
  const camp = catalogue.camp.building;
  const ground = buildingKind(catalogue, camp).terrains;
  // Only which tiles the walk reached is read here, never what reaching them cost, so the move a
  // crossing is charged against shows nowhere.
  const reached = pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    chronicle.city,
    { kind: 'whole-map', move: MOVE_POINT },
    () => false,
  );

  let rng = chronicle.rng;
  const standing: TileCoords[] = chronicle.tiles.filter((tile) => tile.building === camp);
  const placed: TileCoords[] = [];
  for (let drawn = 0; drawn < SIEGE.camps; drawn++) {
    const candidates = chronicle.tiles.filter(
      (tile) =>
        tile.building === undefined &&
        ground.includes(tile.terrain) &&
        reached.has(tileKey(tile)) &&
        distance(tile, chronicle.city) >= near &&
        distance(tile, chronicle.city) <= far &&
        !holds(chronicle, tile) &&
        unitAt(chronicle.units, tile) === undefined &&
        standing.every((other) => distance(tile, other) >= SIEGE.apart),
    );
    if (candidates.length === 0) break;

    const step = nextRng(rng);
    rng = step.rng;
    const chosen = candidates[Math.floor(step.value * candidates.length)];
    standing.push(chosen);
    placed.push({ q: chosen.q, r: chosen.r });
  }

  const camped = new Set(placed.map(tileKey));
  let besieged: Chronicle = {
    ...chronicle,
    rng,
    tiles: chronicle.tiles.map((tile) =>
      camped.has(tileKey(tile)) ? { ...tile, building: camp } : tile,
    ),
  };
  for (const tile of placed) besieged = enteredOnCamp(catalogue, besieged, tile);
  return besieged;
}
