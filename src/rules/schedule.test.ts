import { expect, test } from 'vitest';
import { apply, type Command, launched, outcome } from './chronicle';
import { growthThreshold } from './city';
import {
  assignTo,
  built,
  CAMPS,
  CATALOGUE,
  type Carrying,
  CITY,
  camped,
  cityOf,
  DECK,
  endedTurn,
  enemiesOf,
  everyCard,
  field,
  fullDraw,
  LATE_CAPSTONE,
  landings,
  madeOf,
  NO_GROWTH,
  only,
  REGION,
  SCHEDULE_BOUND,
  type Standing,
  stagedBy,
  standing,
  throughSchedule,
  toFirstRaid,
  withUnits,
  worker,
} from './fixtures';
import { distance, neighbours, type TileCoords, tileKey } from './map';
import { seedRng } from './rng';
import { SIEGE, scheduled } from './schedule';
import type { Chronicle } from './state';
import { unitAt } from './units';

/**
 * Every event a seed's schedule dealt over thirty turns, the turn it was dealt on and how many
 * hunger cards the chronicle holds by then. The city holds no camp, so a raid enters nobody and
 * nothing ever reaches the city: what a landing leaves to read is its turn, against the hazards the
 * famines have laid.
 */
function scheduleOf(seed: number): { turn: number; hungers: number }[] {
  return landings(
    cityOf(['urban', 'plain'], { ...NO_GROWTH, ...scheduled(seedRng(seed)), ...LATE_CAPSTONE }),
  ).map((landed) => ({
    turn: landed.turn,
    hungers: everyCard(landed).filter((id) => id === 'PH_Hunger').length,
  }));
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
    ...LATE_CAPSTONE,
    tiles: camped(field(4), CAMPS),
    resources: { food: STOCKED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    turn: due - 1,
    nextEvent: due,
    ...carrying,
  });
}

/** The same city one end of turn on: the due turn open, and its deal standing. */
function dealtBy(due: number, carrying: Carrying = {}): Chronicle {
  return outcome(apply(CATALOGUE, awaiting(due, carrying), { type: 'end-turn' }));
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
  let chronicle = cityOf(['urban'], { ...LATE_CAPSTONE, tiles: camped(field(4), [camp]) });
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
  expect(chronicle.units[0].stats).toEqual(CATALOGUE.units.PH_Warrior);
  expect(chronicle.units[0].tile).toEqual(camp);
});

test('which camp the raid enters a warrior on is drawn from the seeded generator', () => {
  const disc = camped(field(4), CAMPS);
  const raidOf = (seed: number): TileCoords =>
    toFirstRaid(cityOf(['urban'], { ...LATE_CAPSTONE, tiles: disc, rng: seedRng(seed) })).units[0]
      .tile;

  expect(raidOf(7)).toEqual(raidOf(7));
  expect(new Set(SEEDS.map((seed) => tileKey(raidOf(seed)))).size).toBeGreaterThan(1);
});

test('the raid enters its warrior on a camp no unit stands on, and on nothing else at all', () => {
  const open = cityOf(['urban'], { ...LATE_CAPSTONE, tiles: camped(field(4), CAMPS) });
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

test('a famine is dealt as readily on the third turn as the twentieth, and lays its hazard', () => {
  for (const due of [3, 14, 20]) {
    for (const seed of SEEDS) {
      const standing = dealtBy(due, { rng: seedRng(seed) });
      const landed = endedTurn(awaiting(due, { rng: seedRng(seed) }), 'PH_Famine');

      expect(standing.deal).toContain('PH_Famine');
      expect(standing.resources.food).toBe(STOCKED);
      expect(landed.resources.food).toBe(STOCKED);
      expect(landed.hand).toEqual(['PH_Hunger']);
    }
  }
});

test('the famine lays its hazard on top of the draw pile, and leaves the city as it stood', () => {
  const waiting = awaiting(15, { drawPile: fullDraw() });
  const after = endedTurn(waiting, 'PH_Famine');

  expect(after.hand).toEqual(['PH_Hunger', ...fullDraw().slice(0, 4)]);
  expect(after.drawPile).toEqual(fullDraw().slice(4));
  expect(after.resources.food).toBe(STOCKED);
  expect(after.population).toBe(waiting.population);
  expect(growthThreshold(after)).toBe(growthThreshold(waiting));
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
  const raided = outcome(apply(CATALOGUE, standing, { type: 'take', event: 'PH_Raid' }));
  const starved = outcome(apply(CATALOGUE, standing, { type: 'take', event: 'PH_Famine' }));

  expect(stagedBy(standing, { type: 'take', event: 'PH_Raid' })).toEqual(['events', 'draw']);
  expect(enemiesOf(raided)).toHaveLength(1);
  expect(raided.hand).toEqual(fullDraw());
  expect(enemiesOf(starved)).toEqual([]);
  expect(starved.hand).toEqual(['PH_Hunger', ...fullDraw().slice(0, 4)]);
  for (const after of [raided, starved]) {
    expect(after.deal).toEqual([]);
    expect(after.resources.food).toBe(STOCKED);
    expect(after.nextEvent - after.turn).toBeGreaterThanOrEqual(3);
    expect(after.nextEvent - after.turn).toBeLessThanOrEqual(7);
  }
});

test('a take the deal does not offer, and one with no deal standing, are refused', () => {
  const one = cityOf(['urban'], { tiles: camped(field(4), CAMPS), deal: ['PH_Famine'] });
  const undealt: Command = { type: 'take', event: 'PH_Raid' };

  expect(stagedBy(one, undealt)).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, one, undealt))).toBe(one);
  expect(stagedBy(cityOf(['urban']), undealt)).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, one, { type: 'take', event: 'PH_Famine' })).deal).toEqual([]);
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
    expect(outcome(apply(CATALOGUE, waiting, command))).toBe(waiting);
  }
  expect(stagedBy(waiting, { type: 'take', event: 'PH_Raid' })).toEqual(['events']);
});

/** A turn inside the window the capstone's own turn is rolled from. */
const CAPSTONE = 30;

/**
 * The city standing on the turn before the capstone's, on a disc of plain wide enough for the siege
 * to reach around it. The next event is long overdue: what the capstone's turn deals is its own.
 */
function awaitingCapstone(carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(6),
    turn: CAPSTONE - 1,
    capstoneTurn: CAPSTONE,
    ...carrying,
  });
}

/** The same city one end of turn on, with the capstone taken off the deal its turn brought. */
function besieged(carrying: Carrying = {}): Chronicle {
  return endedTurn(awaitingCapstone(carrying), 'PH_Siege');
}

/** The tiles a camp fills: what the siege placed, these fixtures standing with none of their own. */
function campsOf(chronicle: Chronicle): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => tile.building === CATALOGUE.camp.building)
    .map(({ q, r }) => ({ q, r }));
}

/**
 * The plain running east out of the city, the ground walked out along it: every fixture on this
 * corridor keeps the whole of it, or the walk stops at the city and cuts every candidate before any
 * other filter is asked.
 */
const CORRIDOR: TileCoords[] = [
  CITY,
  { q: 1, r: 0 },
  { q: 2, r: 0 },
  { q: 3, r: 0 },
  { q: 4, r: 0 },
];

/** A city on that corridor, and water everywhere else. */
function corridor(carrying: Carrying = {}): Chronicle {
  return besieged({ tiles: only(6, CORRIDOR), ...carrying });
}

/** How many turns of the siege's span follow the one it lands on: what a city stands out to win. */
const REINFORCED = 5;

/**
 * A worker of the player's with health no siege runs through: what a fixture stands where it wants
 * the enemies of the span to spend their turns.
 */
function unkillable(tile: TileCoords): Standing {
  return standing('player', tile, { type: 'PH_Worker', worker: true, health: 99 });
}

/** The disc with water around the city: no ground runs to it, so the siege places no camp of its own. */
const MOATED = field(6, neighbours(CITY));

/** A camp of the generator's out on that disc. */
const STANDING_CAMP: TileCoords = { q: 6, r: 0 };

/**
 * The tile the worker the camp's enemies walk to stands on: two tiles off the camp, with room enough
 * around it for five of them, so every warrior entered leaves the camp it entered on.
 */
const LURE: TileCoords = { q: 4, r: 0 };

/** The moated city with the siege landed on it, a camp of the generator's standing out of its reach. */
function moated(carrying: Carrying = {}): Chronicle {
  return besieged({ tiles: camped(MOATED, [STANDING_CAMP]), ...carrying });
}

/** That city ending turn after turn to the end of the siege's span: the chronicle it left. */
function stoodOut(): Chronicle {
  let besieging = moated({ units: [unkillable(LURE)] });
  for (let turn = 0; turn <= REINFORCED; turn++) besieging = endedTurn(besieging, 'PH_Famine');
  return besieging;
}

test('the capstone lands on a turn rolled at the founding, between the twenty-seventh and the thirty-third', () => {
  const turns = SEEDS.map((seed) => launched(CATALOGUE, REGION, seed, DECK).capstoneTurn);

  for (const turn of turns) {
    expect(turn).toBeGreaterThanOrEqual(27);
    expect(turn).toBeLessThanOrEqual(33);
  }
  expect(launched(CATALOGUE, REGION, 7, DECK).capstoneTurn).toBe(
    launched(CATALOGUE, REGION, 7, DECK).capstoneTurn,
  );
  expect(new Set(turns).size).toBeGreaterThan(1);
});

test('the capstone turn deals the capstone alone, whatever turn the next event was due', () => {
  for (const due of [CAPSTONE - 4, CAPSTONE, CAPSTONE + 4]) {
    const dealt = outcome(
      apply(CATALOGUE, awaitingCapstone({ nextEvent: due, drawPile: fullDraw() }), {
        type: 'end-turn',
      }),
    );

    expect(dealt.deal).toEqual(['PH_Siege']);
    expect(dealt.turn).toBe(CAPSTONE);
    expect(dealt.hand).toEqual([]);
  }
});

test('the siege places five camps around the city, apart from one another, a warrior on each', () => {
  const after = besieged();
  const camps = campsOf(after);
  const warriors = enemiesOf(after);

  expect(camps).toHaveLength(5);
  for (const [at, camp] of camps.entries()) {
    expect(distance(camp, CITY)).toBeGreaterThanOrEqual(3);
    expect(distance(camp, CITY)).toBeLessThanOrEqual(5);
    for (const other of camps.slice(at + 1)) {
      expect(distance(camp, other)).toBeGreaterThanOrEqual(SIEGE.apart);
    }
  }
  expect(warriors).toHaveLength(camps.length);
  expect(warriors.map((warrior) => tileKey(warrior.tile)).sort()).toEqual(
    camps.map(tileKey).sort(),
  );
  for (const warrior of warriors) expect(warrior.stats).toEqual(CATALOGUE.units.PH_Warrior);
});

test('which tiles the siege places its camps on is drawn from the seeded generator', () => {
  const campsFrom = (seed: number): string =>
    campsOf(besieged({ rng: seedRng(seed) }))
      .map(tileKey)
      .join(' ');

  expect(campsFrom(7)).toBe(campsFrom(7));
  expect(new Set(SEEDS.map(campsFrom)).size).toBeGreaterThan(1);
});

test('the siege places what it can where the tiles run out, and enters one warrior for each', () => {
  const after = corridor();

  expect(campsOf(after)).toHaveLength(1);
  expect(distance(campsOf(after)[0], CITY)).toBeGreaterThanOrEqual(3);
  expect(enemiesOf(after)).toHaveLength(1);
  expect(enemiesOf(after)[0].tile).toEqual(campsOf(after)[0]);
});

test('the siege places no camp the city holds, a unit stands on, a building fills, or a camp stands near', () => {
  const reach = [
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const standing = { q: 5, r: 0 };
  const none: Chronicle[] = [
    corridor({ held: [CITY, ...reach] }),
    corridor({ units: reach.map(worker) }),
    corridor({ tiles: built(only(6, CORRIDOR), 'PH_Farm', reach) }),
    corridor({ tiles: camped(only(6, [...CORRIDOR, standing]), [standing]) }),
  ];

  for (const after of none) {
    expect(enemiesOf(after)).toEqual([]);
  }
  expect(campsOf(none[3])).toEqual([standing]);
  for (const after of none.slice(0, 3)) expect(campsOf(after)).toEqual([]);
});

test('the siege places no camp on ground a camp does not lie on, or the city is not walked to', () => {
  const reach = [
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const land = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, ...reach];
  const rough = besieged({ tiles: madeOf(only(6, land), 'mountain', reach) });
  const moat = besieged({ tiles: only(6, [CITY, ...reach]) });

  for (const after of [rough, moat]) {
    expect(campsOf(after)).toEqual([]);
    expect(enemiesOf(after)).toEqual([]);
  }
});

test('each of the five turns after the landing enters a warrior on the camp standing, and no turn more', () => {
  let besieging = moated({ units: [unkillable(LURE)] });
  expect(enemiesOf(besieging)).toEqual([]);

  for (let turn = 1; turn <= REINFORCED; turn++) {
    besieging = endedTurn(besieging, 'PH_Famine');

    expect(besieging.turn).toBe(CAPSTONE + turn);
    expect(enemiesOf(besieging)).toHaveLength(turn);
    expect(unitAt(besieging.units, STANDING_CAMP)?.faction).toBe('enemy');
  }
  expect(enemiesOf(stoodOut())).toHaveLength(REINFORCED);
});

test('the reinforcement is a stage of its own, raised after the tick and ahead of the deal', () => {
  let besieging = moated({ rng: seedRng(1), units: [unkillable(LURE)] });
  expect(besieging.nextEvent).toBeLessThanOrEqual(CAPSTONE + REINFORCED);

  while (besieging.turn < besieging.nextEvent - 1) {
    const staged = stagedBy(besieging, { type: 'end-turn' });
    expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'reinforce']);
    besieging = endedTurn(besieging, 'PH_Famine');
  }
  const due = stagedBy(besieging, { type: 'end-turn' });

  expect(due.slice(due.indexOf('turn'))).toEqual(['turn', 'reinforce', 'deal']);
});

test('the siege’s own camps are reinforced as the camps standing are', () => {
  const besieging = besieged({ units: [unkillable(CITY)] });
  const camps = campsOf(besieging);
  const after = endedTurn(besieging, 'PH_Famine');

  expect(enemiesOf(besieging)).toHaveLength(camps.length);
  expect(enemiesOf(after)).toHaveLength(2 * camps.length);
  for (const camp of camps) expect(unitAt(after.units, camp)?.faction).toBe('enemy');
});

test('the reinforcement enters no warrior on a camp a unit stands on', () => {
  let besieging = moated({ units: [standing('enemy', STANDING_CAMP)] });
  const entered = unitAt(besieging.units, STANDING_CAMP)?.id;

  for (let turn = 1; turn <= REINFORCED; turn++) {
    besieging = endedTurn(besieging, 'PH_Famine');

    expect(enemiesOf(besieging)).toHaveLength(1);
    expect(unitAt(besieging.units, STANDING_CAMP)?.id).toBe(entered);
  }
});

test('the city standing at the end of the siege’s sixth turn ends the chronicle in victory', () => {
  let besieging = moated({ units: [unkillable(LURE)] });

  for (let turn = 1; turn <= REINFORCED; turn++) {
    besieging = endedTurn(besieging, 'PH_Famine');
    expect(besieging.turn).toBe(CAPSTONE + turn);
    expect(besieging.ending).toBeUndefined();
  }
  const staged = stagedBy(besieging, { type: 'end-turn' });
  const survived = stoodOut();

  expect(staged[staged.length - 1]).toBe('victory');
  expect(staged).not.toContain('turn');
  expect(survived.turn).toBe(CAPSTONE + REINFORCED);
  expect(survived.ending).toEqual({ outcome: 'victory', turn: CAPSTONE + REINFORCED });
});

test('a chronicle that ended in victory takes no command at all', () => {
  const survived = stoodOut();
  const refused: Command[] = [{ type: 'end-turn' }, assignTo(CITY)];

  expect(stagedBy(moated(), assignTo(CITY))).toEqual(['assign']);
  for (const command of refused) {
    expect(stagedBy(survived, command)).toEqual(['refused']);
    expect(outcome(apply(CATALOGUE, survived, command))).toBe(survived);
  }
});
