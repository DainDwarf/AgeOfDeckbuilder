import { enteredFromCamp } from './enemies';
import { nextRng, pickWeighted, type Rng } from './rng';
import type { Chronicle, EventId } from './state';

/**
 * One entry of the schedule: what it weighs on a turn, nothing at all on a turn it may not land on,
 * what its rules entry reads of the turn it is dealt on, and what it does to the chronicle it lands
 * on. A draw of its own steps the generator that chronicle carries.
 */
export type ScheduledEvent = {
  readonly weight: (turn: number) => number;
  readonly reads: (chronicle: Chronicle) => Record<string, number>;
  readonly lands: (chronicle: Chronicle) => Chronicle;
};

/** How many of the schedule's entries a due turn deals, for the player to take one of. */
const DEAL = 2;

/** The least and the most a span of turns rolls, both ends included. */
type Span = readonly [number, number];

/** The age's schedule: how far apart its events land, and every entry it draws from. */
export const SCHEDULE: {
  readonly spacing: Span;
  readonly events: Record<EventId, ScheduledEvent>;
} = {
  spacing: [3, 7],
  events: {
    PH_Raid: {
      weight: () => 1,
      reads: (chronicle) => ({ warriors: raiders(chronicle.turn) }),
      lands: (chronicle) => raid(chronicle, raiders(chronicle.turn)),
    },
    PH_Famine: {
      weight: () => 1,
      reads: () => ({}),
      lands: (chronicle) => ({
        ...chronicle,
        drawPile: ['PH_Hunger', ...chronicle.drawPile],
      }),
    },
  },
};

/**
 * The generator and the turn the first event is due, as the founding lays them on the chronicle it
 * opens: the roll is taken before that chronicle's first events phase runs.
 */
export function scheduled(rng: Rng): { rng: Rng; nextEvent: number } {
  const rolled = withinSpan(rng, SCHEDULE.spacing);
  return { rng: rolled.rng, nextEvent: rolled.turns };
}

/**
 * The events phase: a turn the schedule has nothing due on, and one no entry weighs anything on,
 * change nothing and draw nothing, so the end of turn raises no stage for either. On the due turn
 * the entries weighing anything are drawn one after another, never the same one twice, and the
 * chronicle carries the deal in the order dealt; a turn fewer of them weigh anything on deals what
 * there is. Nothing lands until one of them is taken.
 */
export function events(chronicle: Chronicle): Chronicle {
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
 * One dealt entry taken: it lands on the chronicle the deal stood on, which is left with no deal,
 * and the turn the next event is due is rolled — deal, land, roll, in that order, which a replay of
 * the chronicle pins.
 */
export function taken(chronicle: Chronicle, event: EventId): Chronicle {
  const landed = SCHEDULE.events[event].lands({ ...chronicle, deal: [] });
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
function raid(chronicle: Chronicle, warriors: number): Chronicle {
  let standing = chronicle;
  for (let warrior = 0; warrior < warriors; warrior++) standing = enteredFromCamp(standing);
  return standing;
}
