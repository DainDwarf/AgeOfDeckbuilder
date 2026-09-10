import { expect, test } from 'vitest';
import { apply, type Command, outcome } from './chronicle';
import { growthThreshold } from './city';
import {
  assignTo,
  CAMPS,
  type Carrying,
  camped,
  cityOf,
  endedTurn,
  enemiesOf,
  field,
  fullDraw,
  landings,
  NO_GROWTH,
  SCHEDULE_BOUND,
  stagedBy,
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
 * Every event a seed's schedule dealt over thirty turns, the turn it was dealt on and whether the
 * entry taken emptied the food stock. The city holds no camp, so a raid enters nobody and nothing
 * ever reaches the city: what a landing leaves to read is its turn, against the food the plain tile
 * keeps giving.
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

/** The same city one end of turn on: the due turn open, and its deal standing. */
function dealtBy(due: number, carrying: Carrying = {}): Chronicle {
  return outcome(apply(awaiting(due, carrying), { type: 'end-turn' }));
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

test('the schedule deals nothing before its due turn, and its raid enters a warrior on a camp', () => {
  const camp = { q: 4, r: 0 };
  let chronicle = cityOf(['urban'], { tiles: camped(field(4), [camp]) });
  const due = chronicle.nextEvent;

  for (let turn = 2; turn < due; turn++) {
    chronicle = endedTurn(chronicle);
    expect(chronicle.turn).toBe(turn);
    expect(chronicle.deal).toEqual([]);
    expect(chronicle.units).toEqual([]);
  }
  chronicle = endedTurn(chronicle, 'PH_Raid');

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
      (seed) => enemiesOf(endedTurn(awaiting(due, { rng: seedRng(seed) }), 'PH_Raid')).length,
    );

  for (let due = 3; due <= 9; due++) expect([...new Set(raiders(due))]).toEqual([1]);
  for (let due = 20; due <= 29; due++) expect([...new Set(raiders(due))]).toEqual([3]);
});

test('a raid with more warriors than camps to enter on enters what it can', () => {
  const two = CAMPS.slice(0, 2);
  const raiders = SEEDS.map(
    (seed) =>
      enemiesOf(
        endedTurn(awaiting(20, { rng: seedRng(seed), tiles: camped(field(4), two) }), 'PH_Raid'),
      ).length,
  );

  expect([...new Set(raiders)]).toEqual([two.length]);
});

test('a famine is dealt as readily on the third turn as the twentieth, and empties the stock', () => {
  for (const due of [3, 14, 20]) {
    for (const seed of SEEDS) {
      const standing = dealtBy(due, { rng: seedRng(seed) });

      expect(standing.deal).toContain('PH_Famine');
      expect(standing.resources.food).toBe(STOCKED);
      expect(endedTurn(awaiting(due, { rng: seedRng(seed) }), 'PH_Famine').resources.food).toBe(0);
    }
  }
});

test('the famine empties the food stock, and leaves the population and its threshold alone', () => {
  const starving = awaiting(15);
  const after = endedTurn(starving, 'PH_Famine');

  expect(after.resources.food).toBe(0);
  expect(after.population).toBe(starving.population);
  expect(growthThreshold(after)).toBe(growthThreshold(starving));
  expect(enemiesOf(after)).toEqual([]);
});

test('a due turn deals both entries, in an order the seed decides, and the turn ends there', () => {
  const dealt = SEEDS.map((seed) => dealtBy(5, { rng: seedRng(seed), drawPile: fullDraw() }));
  const staged = stagedBy(awaiting(5, { drawPile: fullDraw() }), { type: 'end-turn' });

  for (const standing of dealt) {
    expect([...standing.deal].sort()).toEqual(['PH_Famine', 'PH_Raid']);
    expect(standing.turn).toBe(5);
    expect(standing.hand).toEqual([]);
  }
  expect(staged[staged.length - 1]).toBe('deal');
  expect(staged).not.toContain('draw');
  expect(new Set(dealt.map((standing) => standing.deal.join(' '))).size).toBe(2);
  expect(dealtBy(5, { rng: seedRng(7) }).deal).toEqual(dealtBy(5, { rng: seedRng(7) }).deal);
});

test('the take lands the entry taken and no other, rolls the next due turn, and draws a hand', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const raided = outcome(apply(standing, { type: 'take', event: 'PH_Raid' }));
  const starved = outcome(apply(standing, { type: 'take', event: 'PH_Famine' }));

  expect(stagedBy(standing, { type: 'take', event: 'PH_Raid' })).toEqual(['events', 'draw']);
  expect(enemiesOf(raided)).toHaveLength(1);
  expect(raided.resources.food).toBe(STOCKED);
  expect(enemiesOf(starved)).toEqual([]);
  expect(starved.resources.food).toBe(0);
  for (const after of [raided, starved]) {
    expect(after.deal).toEqual([]);
    expect(after.hand).toEqual(fullDraw());
    expect(after.nextEvent - after.turn).toBeGreaterThanOrEqual(3);
    expect(after.nextEvent - after.turn).toBeLessThanOrEqual(7);
  }
});

test('a take the deal does not offer, and one with no deal standing, are refused', () => {
  const one = cityOf(['urban'], { tiles: camped(field(4), CAMPS), deal: ['PH_Famine'] });
  const undealt: Command = { type: 'take', event: 'PH_Raid' };

  expect(stagedBy(one, undealt)).toEqual(['refused']);
  expect(outcome(apply(one, undealt))).toBe(one);
  expect(stagedBy(cityOf(['urban']), undealt)).toEqual(['refused']);
  expect(outcome(apply(one, { type: 'take', event: 'PH_Famine' })).deal).toEqual([]);
});

test('a chronicle waiting on a deal takes no command but the take', () => {
  const waiting = cityOf(['urban', 'plain'], {
    tiles: camped(field(4), CAMPS),
    deal: ['PH_Raid', 'PH_Famine'],
    hand: ['PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const refused: Command[] = [
    { type: 'end-turn' },
    { type: 'play', index: 0, aim: 'none' },
    assignTo({ q: 1, r: 0 }),
  ];

  for (const command of refused) {
    expect(stagedBy(waiting, command)).toEqual(['refused']);
    expect(outcome(apply(waiting, command))).toBe(waiting);
  }
  expect(stagedBy(waiting, { type: 'take', event: 'PH_Raid' })).toEqual(['events']);
});
