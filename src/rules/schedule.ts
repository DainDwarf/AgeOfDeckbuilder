import { enteredFromCamp } from './enemies';
import { nextRng, pickWeighted, type Rng } from './rng';
import type { Chronicle } from './state';

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type EventId = 'PH_Raid' | 'PH_Famine';

/**
 * One entry of the schedule: what it weighs on a turn, nothing at all on a turn it may not land on,
 * and what it does to the chronicle it lands on. A draw of its own steps the generator that
 * chronicle carries.
 */
export type ScheduledEvent = {
  readonly weight: (turn: number) => number;
  readonly lands: (chronicle: Chronicle) => Chronicle;
};

/** The least and the most a span of turns rolls, both ends included. */
type Span = readonly [number, number];

/** The age's schedule: how far apart its events land, and every entry it draws from. */
export const SCHEDULE: {
  readonly spacing: { readonly first: Span; readonly next: Span };
  readonly events: Record<EventId, ScheduledEvent>;
} = {
  spacing: { first: [5, 7], next: [3, 7] },
  events: {
    PH_Raid: {
      weight: (turn) => (turn >= 5 ? 1 : 0),
      lands: (chronicle) => raid(chronicle, 1 + Math.floor(chronicle.turn / 10)),
    },
    PH_Famine: {
      weight: (turn) => (turn >= 15 ? 1 : 0),
      lands: (chronicle) => ({
        ...chronicle,
        resources: { ...chronicle.resources, food: 0 },
      }),
    },
  },
};

/**
 * The generator and the turn the first event is due, as the founding lays them on the chronicle it
 * opens: the roll is taken before that chronicle's first events phase runs.
 */
export function scheduled(rng: Rng): { rng: Rng; nextEvent: number } {
  const rolled = withinSpan(rng, SCHEDULE.spacing.first);
  return { rng: rolled.rng, nextEvent: rolled.turns };
}

/**
 * The events phase: a turn the schedule has nothing due on changes nothing and draws nothing, so the
 * end of turn raises no stage for it. On the due turn one entry is drawn among those weighing
 * anything on this turn, it lands, and the turn the next is due is rolled — in that order, which a
 * replay of the chronicle pins.
 */
export function events(chronicle: Chronicle): Chronicle {
  if (chronicle.turn < chronicle.nextEvent) return chronicle;

  const drawn = pickWeighted(chronicle.rng, weighed(chronicle.turn));
  const landed = SCHEDULE.events[drawn.picked].lands({ ...chronicle, rng: drawn.rng });
  const rolled = withinSpan(landed.rng, SCHEDULE.spacing.next);
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

/**
 * The raid's warriors, one after another: each draws its own camp, so the second sees the camp the
 * first took as taken, and a raid with more warriors than free camps enters what it can.
 */
function raid(chronicle: Chronicle, warriors: number): Chronicle {
  let standing = chronicle;
  for (let warrior = 0; warrior < warriors; warrior++) standing = enteredFromCamp(standing);
  return standing;
}
