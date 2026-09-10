import { expect, test } from 'vitest';
import { apply, growthThreshold, outcome } from './chronicle';
import {
  CAMPS,
  type Carrying,
  camped,
  cityOf,
  enemiesOf,
  field,
  landings,
  NO_GROWTH,
  SCHEDULE_BOUND,
  throughSchedule,
  toFirstRaid,
  withUnits,
  worker,
} from './fixtures';
import { type TileCoords, tileKey } from './map';
import { seedRng } from './rng';
import { scheduled } from './schedule';
import type { Chronicle } from './state';
import { UNIT_STATS } from './units';

/**
 * Every event a seed's schedule landed over thirty turns, the turn it landed on and whether it
 * emptied the food stock. The city holds no camp, so a raid enters nobody and nothing ever reaches
 * the city: what a landing leaves to read is its turn, against the food the plain tile keeps giving.
 */
function scheduleOf(seed: number): { turn: number; emptied: boolean }[] {
  return landings(cityOf(['urban', 'plain'], { ...NO_GROWTH, ...scheduled(seedRng(seed)) })).map(
    (landed) => ({ turn: landed.turn, emptied: landed.resources.food === 0 }),
  );
}

/** The seeds a test over the whole schedule runs: enough of them for both entries to be drawn. */
const SEEDS: readonly number[] = Array.from({ length: 40 }, (_, at) => at + 1);

/** The food stock a city waiting on an event holds: its one tile yields none, so only a famine moves it. */
const STOCKED = 5;

/**
 * The city with camps enough for any raid, holding food it is too many to grow on, standing on the
 * turn before an event is due: one end of turn brings the schedule to it.
 */
function awaiting(due: number, carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    resources: { food: STOCKED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    turn: due - 1,
    nextEvent: due,
    ...carrying,
  });
}

test('an event lands on the third turn to the seventh, and the next three to seven turns after', () => {
  for (const seed of SEEDS) {
    const turns = scheduleOf(seed).map((landed) => landed.turn);

    expect(turns[0]).toBeGreaterThanOrEqual(3);
    expect(turns[0]).toBeLessThanOrEqual(7);
    for (let at = 1; at < turns.length; at++) {
      expect(turns[at] - turns[at - 1]).toBeGreaterThanOrEqual(3);
      expect(turns[at] - turns[at - 1]).toBeLessThanOrEqual(7);
    }
    expect(turns[turns.length - 1]).toBeGreaterThan(SCHEDULE_BOUND - 7);
  }
});

test('the same seed deals the same schedule, and another seed deals a different one', () => {
  expect(scheduleOf(7)).toEqual(scheduleOf(7));
  expect(scheduleOf(7)).not.toEqual(scheduleOf(8));
});

test('the schedule lands nothing before its due turn, and its raid enters a warrior on a camp', () => {
  const camp = { q: 4, r: 0 };
  let chronicle = cityOf(['urban'], { tiles: camped(field(4), [camp]) });
  const due = chronicle.nextEvent;

  for (let turn = 2; turn < due; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(chronicle.turn).toBe(turn);
    expect(chronicle.units).toEqual([]);
  }
  chronicle = outcome(apply(chronicle, { type: 'end-turn' }));

  expect(chronicle.turn).toBe(due);
  expect(chronicle.units).toHaveLength(1);
  expect(chronicle.units[0].faction).toBe('enemy');
  expect(chronicle.units[0].stats).toEqual(UNIT_STATS.PH_Warrior);
  expect(chronicle.units[0].tile).toEqual(camp);
});

test('which camp the raid enters a warrior on is drawn from the seeded generator', () => {
  const disc = camped(field(4), CAMPS);
  const raidOf = (seed: number): TileCoords =>
    toFirstRaid(cityOf(['urban'], { tiles: disc, rng: seedRng(seed) })).units[0].tile;

  expect(raidOf(7)).toEqual(raidOf(7));
  expect(new Set(SEEDS.map((seed) => tileKey(raidOf(seed)))).size).toBeGreaterThan(1);
});

test('the raid enters its warrior on a camp no unit stands on, and on nothing else at all', () => {
  const open = cityOf(['urban'], { tiles: camped(field(4), CAMPS) });
  const [onlyOpen, ...taken] = CAMPS;
  const stoodOn = (camps: TileCoords[]): Chronicle =>
    withUnits(
      open,
      camps.map((camp) => worker(camp)),
    );

  expect(CAMPS.map(tileKey)).toContain(tileKey(toFirstRaid(open).units[0].tile));
  expect(toFirstRaid(stoodOn(taken)).units[taken.length].tile).toEqual(onlyOpen);
  expect(throughSchedule(stoodOn(CAMPS)).units).toHaveLength(CAMPS.length);
});

test('a raid enters one warrior, and one more for every ten turns', () => {
  const raiders = (due: number): number[] =>
    SEEDS.map(
      (seed) =>
        enemiesOf(outcome(apply(awaiting(due, { rng: seedRng(seed) }), { type: 'end-turn' })))
          .length,
    ).filter((entered) => entered > 0);

  for (let due = 3; due <= 9; due++) {
    const early = raiders(due);

    expect(early.length).toBeGreaterThan(0);
    expect([...new Set(early)]).toEqual([1]);
  }
  for (let due = 20; due <= 29; due++) {
    const late = raiders(due);

    expect(late.length).toBeGreaterThan(0);
    expect([...new Set(late)]).toEqual([3]);
  }
});

test('a raid with more warriors than camps to enter on enters what it can', () => {
  const two = CAMPS.slice(0, 2);
  const raiders = SEEDS.map(
    (seed) =>
      enemiesOf(
        outcome(
          apply(awaiting(20, { rng: seedRng(seed), tiles: camped(field(4), two) }), {
            type: 'end-turn',
          }),
        ),
      ).length,
  ).filter((entered) => entered > 0);

  expect(raiders.length).toBeGreaterThan(0);
  expect([...new Set(raiders)]).toEqual([two.length]);
});

test('a famine lands as readily on the third turn as the twentieth, and empties the stock', () => {
  const stocks = (due: number): number[] =>
    SEEDS.map(
      (seed) =>
        outcome(apply(awaiting(due, { rng: seedRng(seed) }), { type: 'end-turn' })).resources.food,
    );

  for (const due of [3, 14, 20]) {
    expect(stocks(due)).toContain(0);
    for (const food of stocks(due)) expect([0, STOCKED]).toContain(food);
  }
});

test('the famine empties the food stock, and leaves the population and its threshold alone', () => {
  const starving = SEEDS.map((seed) => awaiting(15, { rng: seedRng(seed) })).find(
    (city) => outcome(apply(city, { type: 'end-turn' })).resources.food === 0,
  );
  if (starving === undefined) throw new Error('no seed of these lands a famine on the fifteenth');

  const after = outcome(apply(starving, { type: 'end-turn' }));

  expect(after.resources.food).toBe(0);
  expect(after.population).toBe(starving.population);
  expect(growthThreshold(after)).toBe(growthThreshold(starving));
  expect(enemiesOf(after)).toEqual([]);
});
