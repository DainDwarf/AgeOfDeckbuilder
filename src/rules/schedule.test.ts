import { expect, test } from 'vitest';
import type { Catalogue } from './catalogue';
import { apply, type Command, launched, outcome } from './chronicle';
import { growthThreshold } from './city';
import {
  assignTo,
  builtOn,
  CAMPS,
  CATALOGUE,
  type Carrying,
  CITY,
  camped,
  cityOf,
  DECK,
  dealing,
  EXPLOSION,
  endedTurn,
  enemiesOf,
  field,
  fullDraw,
  madeOf,
  NO_GROWTH,
  only,
  opening,
  plains,
  REGION,
  SCHEDULE,
  type Standing,
  settledOn,
  stagedBy,
  standing,
  withUnits,
  worker,
} from './fixtures';
import { distance, neighbours, type TileCoords, tileKey } from './map';
import { seedRng } from './rng';
import { timelineOf } from './schedule';
import type { Chronicle, Timeline } from './state';
import { unitAt } from './units';

/** The timeline a seed rolls of the fixture's schedule. */
function rolled(seed: number): Timeline {
  return timelineOf(CATALOGUE, SCHEDULE, seedRng(seed)).timeline;
}

/** The seeds a test over the whole timeline runs: enough of them for both orders to be drawn. */
const SEEDS: readonly number[] = Array.from({ length: 40 }, (_, at) => at + 1);

/** The food stock a city waiting on an event holds: its one tile yields none, so only a famine moves it. */
const STOCKED = 5;

/** A timeline dealing the hardship, its raid first and its famine second, on that turn and on no other. */
function dueOn(turn: number, event = 'PH_Hardship'): Timeline {
  return dealing({ turn, event });
}

/**
 * The city with camps enough for any raid, holding food it is too many to grow on, standing on the
 * turn before its timeline deals: one end of turn brings the deal to it.
 */
function awaiting(due: number, carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    resources: { food: STOCKED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    turn: due - 1,
    timeline: dueOn(due),
    ...carrying,
  });
}

/** The same city one end of turn on: the due turn open, and its deal standing. */
function dealtBy(due: number, carrying: Carrying = {}): Chronicle {
  return outcome(apply(CATALOGUE, awaiting(due, carrying), { type: 'end-turn' }));
}

test('a deal is due on the third turn to the seventh, and each next three to seven turns after a landing', () => {
  for (const seed of SEEDS) {
    const { deals, capstone } = rolled(seed);
    const landings = [...deals.map((deal) => deal.turn), capstone.turn].sort((a, b) => a - b);

    let previous = 0;
    for (const turn of landings) {
      if (turn !== capstone.turn) {
        expect(turn - previous).toBeGreaterThanOrEqual(3);
        expect(turn - previous).toBeLessThanOrEqual(7);
      }
      previous = turn;
    }
    expect(landings[landings.length - 1]).toBeGreaterThan(capstone.last - 7);
  }
});

test('the same seed rolls the same timeline, and another seed a different one', () => {
  expect(rolled(7)).toEqual(rolled(7));
  expect(rolled(7)).not.toEqual(rolled(8));
});

test('the capstone lands on a turn rolled at the launch, between the twenty-seventh and the thirty-third, and spans six', () => {
  const capstones = SEEDS.map(
    (seed) => launched(CATALOGUE, REGION, SCHEDULE, seed, DECK).timeline.capstone,
  );

  for (const { turn, last } of capstones) {
    expect(turn).toBeGreaterThanOrEqual(27);
    expect(turn).toBeLessThanOrEqual(33);
    expect(last).toBe(turn + 5);
  }
  expect(new Set(capstones.map(({ turn }) => turn)).size).toBeGreaterThan(1);
});

test('the timeline deals nothing on the capstone’s turn, and each due turn deals one event the seed decides', () => {
  const firsts = new Set<string>();
  for (const seed of SEEDS) {
    const { deals, capstone } = rolled(seed);
    expect(deals.map((deal) => deal.turn)).not.toContain(capstone.turn);
    for (const deal of deals) expect(['PH_Hardship', 'PH_Blight']).toContain(deal.event);
    firsts.add(deals[0].event);
  }

  expect(firsts.size).toBe(2);
});

test('the blight is dealt as readily on the third turn as the twentieth', () => {
  const turns = SEEDS.flatMap((seed) =>
    rolled(seed)
      .deals.filter((deal) => deal.event === 'PH_Blight')
      .map((deal) => deal.turn),
  );

  expect(Math.min(...turns)).toBeLessThanOrEqual(7);
  expect(Math.max(...turns)).toBeGreaterThanOrEqual(20);
});

test('a timeline dealing on the first turn stops the end of turn 0 on its deal, and the take draws its hand', () => {
  const settled = settledOn(opening(plains(4), { timeline: dueOn(1) }), CITY);
  const dealt = outcome(apply(CATALOGUE, settled, { type: 'end-turn' }));
  const taken = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 1 }));

  expect(dealt.turn).toBe(1);
  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(dealt.hand).toEqual([]);
  expect(taken.deals).toEqual([]);
  expect(taken.hand).toHaveLength(5);
});

test('nothing is dealt before the due turn, and the raid enters a warrior on a camp', () => {
  const camp = { q: 4, r: 0 };
  let chronicle = cityOf(['urban'], { tiles: camped(field(4), [camp]), timeline: dueOn(5) });

  for (let turn = 2; turn < 5; turn++) {
    chronicle = endedTurn(chronicle);
    expect(chronicle.turn).toBe(turn);
    expect(chronicle.deals).toEqual([]);
    expect(chronicle.units).toEqual([]);
  }
  chronicle = endedTurn(chronicle, 'PH_Raid');

  expect(chronicle.turn).toBe(5);
  expect(chronicle.units).toHaveLength(1);
  expect(chronicle.units[0].faction).toBe('enemy');
  expect(chronicle.units[0].stats).toEqual(CATALOGUE.units.PH_Warrior);
  expect(chronicle.units[0].tile).toEqual(camp);
});

test('which camp the raid enters a warrior on is drawn from the seeded generator', () => {
  const disc = camped(field(4), CAMPS);
  const raidOf = (seed: number): TileCoords =>
    endedTurn(cityOf(['urban'], { tiles: disc, rng: seedRng(seed), timeline: dueOn(2) }), 'PH_Raid')
      .units[0].tile;

  expect(raidOf(7)).toEqual(raidOf(7));
  expect(new Set(SEEDS.map((seed) => tileKey(raidOf(seed)))).size).toBeGreaterThan(1);
});

test('the raid enters its warrior on a camp no unit stands on, and on nothing else at all', () => {
  const open = cityOf(['urban'], { tiles: camped(field(4), CAMPS), timeline: dueOn(2) });
  const [onlyOpen, ...taken] = CAMPS;
  const stoodOn = (camps: TileCoords[]): Chronicle =>
    withUnits(
      open,
      camps.map((camp) => worker(camp)),
    );
  const raid = (chronicle: Chronicle): Chronicle => endedTurn(chronicle, 'PH_Raid');

  expect(CAMPS.map(tileKey)).toContain(tileKey(raid(open).units[0].tile));
  expect(raid(stoodOn(taken)).units[taken.length].tile).toEqual(onlyOpen);
  expect(raid(stoodOn(CAMPS)).units).toHaveLength(CAMPS.length);
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

test('a famine taken on any turn lays its hazard and leaves the food stock as it stood', () => {
  for (const due of [3, 14, 20]) {
    const landed = endedTurn(awaiting(due), 'PH_Famine');

    expect(landed.resources.food).toBe(STOCKED);
    expect(landed.hand).toEqual(['PH_Hunger']);
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

test('a due turn deals its one event, and the turn ends there', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const blighted = dealtBy(5, { timeline: dueOn(5, 'PH_Blight') });
  const staged = stagedBy(awaiting(5, { drawPile: fullDraw() }), { type: 'end-turn' });

  expect(standing.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(blighted.deals).toEqual([{ of: 'event', event: 'PH_Blight' }]);
  expect(standing.turn).toBe(5);
  expect(standing.hand).toEqual([]);
  expect(staged[staged.length - 1]).toBe('deal');
  expect(staged).not.toContain('draw');
});

test('the take lands the answer at its place in the order declared and no other, draws nothing of its own, and draws a hand', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const raided = outcome(apply(CATALOGUE, standing, { type: 'take', at: 0 }));
  const starved = outcome(apply(CATALOGUE, standing, { type: 'take', at: 1 }));

  expect(stagedBy(standing, { type: 'take', at: 0 })).toEqual(['events', 'draw']);
  expect(enemiesOf(raided)).toHaveLength(1);
  expect(raided.hand).toEqual(fullDraw());
  expect(enemiesOf(starved)).toEqual([]);
  expect(starved.hand).toEqual(['PH_Hunger', ...fullDraw().slice(0, 4)]);
  expect(starved.rng).toEqual(standing.rng);
  for (const after of [raided, starved]) {
    expect(after.deals).toEqual([]);
    expect(after.resources.food).toBe(STOCKED);
    expect(after.timeline).toEqual(standing.timeline);
  }
});

test('an answer taken pays its cost before it lands, and one the city cannot pay for is refused with nothing paid', () => {
  const stocked = (production: number): Chronicle =>
    dealtBy(5, {
      timeline: dueOn(5, 'PH_Blight'),
      drawPile: fullDraw(),
      resources: { food: STOCKED, production, military: 0, money: 0, science: 0, culture: 0 },
    });
  const short = stocked(0);
  const rich = stocked(EXPLOSION);
  const exploded = outcome(apply(CATALOGUE, rich, { type: 'take', at: 1 }));
  const endured = outcome(apply(CATALOGUE, short, { type: 'take', at: 0 }));

  expect(short.resources.production).toBeLessThan(EXPLOSION);
  expect(stagedBy(short, { type: 'take', at: 1 })).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, short, { type: 'take', at: 1 }))).toBe(short);
  expect(exploded.resources.production).toBe(rich.resources.production - EXPLOSION);
  expect(exploded.deals).toEqual([]);
  expect(exploded.hand).toEqual(fullDraw());
  expect(endured.resources).toEqual(short.resources);
  expect(endured.hand[0]).toBe('PH_Hunger');
});

test('a take at a place the deal does not offer, and one with no deal standing, are refused', () => {
  const one = dealtBy(5);
  const refused: Command[] = [-1, 2, 0.5].map((at) => ({ type: 'take', at }));

  for (const command of refused) {
    expect(stagedBy(one, command)).toEqual(['refused']);
    expect(outcome(apply(CATALOGUE, one, command))).toBe(one);
  }
  expect(stagedBy(cityOf(['urban']), { type: 'take', at: 0 })).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, one, { type: 'take', at: 1 })).deals).toEqual([]);
});

test('a chronicle waiting on a deal takes no command but the take', () => {
  const waiting = cityOf(['urban', 'plain'], {
    tiles: camped(field(4), CAMPS),
    deals: [{ of: 'event', event: 'PH_Hardship' }],
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
  expect(stagedBy(waiting, { type: 'take', at: 0 })).toEqual(['events']);
});

/** The turn the capstone lands on in every fixture below. */
const CAPSTONE = 30;

/** How many turns of the siege's span follow the one it lands on: what a city stands out to win. */
const REINFORCED = 5;

/** A timeline with the siege on its turn and spanning its six, and these deals besides. */
function besieging(...deals: Timeline['deals']): Timeline {
  return {
    deals,
    capstone: { id: 'PH_Siege', turn: CAPSTONE, last: CAPSTONE + REINFORCED },
  };
}

/**
 * The city standing on the turn before the capstone's, on a disc of plain wide enough for the siege
 * to reach around it.
 */
function awaitingCapstone(carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(6),
    turn: CAPSTONE - 1,
    timeline: besieging(),
    ...carrying,
  });
}

/** The same city one end of turn on, the capstone landed on the turn that end opened. */
function siegeLanded(carrying: Carrying = {}): Chronicle {
  return endedTurn(awaitingCapstone(carrying));
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
  return siegeLanded({ tiles: only(6, CORRIDOR), ...carrying });
}

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
  return siegeLanded({ tiles: camped(MOATED, [STANDING_CAMP]), ...carrying });
}

/** That city ending turn after turn to the end of the siege's span: the chronicle it left. */
function stoodOut(): Chronicle {
  let standingOut = moated({ units: [unkillable(LURE)] });
  for (let turn = 0; turn <= REINFORCED; turn++) standingOut = endedTurn(standingOut, 'PH_Famine');
  return standingOut;
}

test('the capstone’s turn lands the capstone straight and draws the hand, dealing nothing, whatever the timeline lists for that turn', () => {
  const listed = dueOn(CAPSTONE).deals;
  for (const timeline of [besieging(), besieging(...listed)]) {
    const awaited = awaitingCapstone({ timeline, drawPile: fullDraw() });
    const landed = outcome(apply(CATALOGUE, awaited, { type: 'end-turn' }));
    const staged = stagedBy(awaited, { type: 'end-turn' });

    expect(landed.deals).toEqual([]);
    expect(landed.turn).toBe(CAPSTONE);
    expect(landed.hand).toEqual(fullDraw());
    expect(campsOf(landed)).toHaveLength(5);
    expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'capstone', 'draw']);
  }
});

test('the capstone’s landing is a stage of its own on its turn, even where it lands nothing', () => {
  const quiet: Catalogue = {
    ...CATALOGUE,
    capstones: { PH_Siege: { lands: (_c, chronicle) => chronicle } },
  };
  const awaited = awaitingCapstone({ drawPile: fullDraw() });
  const staged = apply(quiet, awaited, { type: 'end-turn' }).map((stage) => stage.name);

  expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'capstone', 'draw']);
});

test('a camp captured the turn before the capstone’s deals its rewards, and the take opens the capstone’s turn on its landing and the draw', () => {
  const camp = { q: 4, r: 0 };
  const dealt = outcome(
    apply(
      CATALOGUE,
      awaitingCapstone({
        tiles: camped(field(6), [camp]),
        units: [worker(camp)],
        drawPile: fullDraw(),
      }),
      { type: 'end-turn' },
    ),
  );
  const taken = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

  expect(dealt.deals).toEqual([{ of: 'camp', rewards: CATALOGUE.camp.rewards }]);
  expect(dealt.turn).toBe(CAPSTONE - 1);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['reward', 'turn', 'capstone', 'draw']);
  expect(taken.turn).toBe(CAPSTONE);
  expect(taken.deals).toEqual([]);
  expect(taken.hand).toEqual(fullDraw());
  expect(campsOf(taken)).not.toEqual([]);
});

test('a camp captured on the capstone’s last turn holds the victory back until its reward is taken', () => {
  const camp = { q: 4, r: 0 };
  const last = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(6), [camp]),
    units: [worker(camp)],
    turn: CAPSTONE + REINFORCED,
    timeline: besieging(),
  });
  const dealt = outcome(apply(CATALOGUE, last, { type: 'end-turn' }));

  expect(stagedBy(last, { type: 'end-turn' })).not.toContain('victory');
  expect(dealt.ending).toBeUndefined();
  expect(dealt.deals).toEqual([{ of: 'camp', rewards: CATALOGUE.camp.rewards }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['reward', 'victory']);
  expect(outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 })).ending).toEqual({
    outcome: 'victory',
    turn: CAPSTONE + REINFORCED,
  });
});

test('the siege places five camps around the city, apart from one another, a warrior on each', () => {
  const after = siegeLanded();
  const camps = campsOf(after);
  const warriors = enemiesOf(after);

  expect(camps).toHaveLength(5);
  for (const [at, camp] of camps.entries()) {
    expect(distance(camp, CITY)).toBeGreaterThanOrEqual(3);
    expect(distance(camp, CITY)).toBeLessThanOrEqual(5);
    for (const other of camps.slice(at + 1)) {
      expect(distance(camp, other)).toBeGreaterThanOrEqual(3);
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
    campsOf(siegeLanded({ rng: seedRng(seed) }))
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
  const near = { q: 5, r: 0 };
  const none: Chronicle[] = [
    corridor({ held: [CITY, ...reach] }),
    corridor({ units: reach.map(worker) }),
    corridor({ tiles: builtOn(only(6, CORRIDOR), 'PH_Farm', reach) }),
    corridor({ tiles: camped(only(6, [...CORRIDOR, near]), [near]) }),
  ];

  for (const after of none) {
    expect(enemiesOf(after)).toEqual([]);
  }
  expect(campsOf(none[3])).toEqual([near]);
  for (const after of none.slice(0, 3)) expect(campsOf(after)).toEqual([]);
});

test('the siege places no camp on ground a camp does not lie on, or the city is not walked to', () => {
  const reach = [
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const land = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, ...reach];
  const rough = siegeLanded({ tiles: madeOf(only(6, land), 'mountain', reach) });
  const moat = siegeLanded({ tiles: only(6, [CITY, ...reach]) });

  for (const after of [rough, moat]) {
    expect(campsOf(after)).toEqual([]);
    expect(enemiesOf(after)).toEqual([]);
  }
});

test('each of the five turns after the landing enters a warrior on the camp standing, and no turn more', () => {
  let reinforcing = moated({ units: [unkillable(LURE)] });
  expect(enemiesOf(reinforcing)).toEqual([]);

  for (let turn = 1; turn <= REINFORCED; turn++) {
    reinforcing = endedTurn(reinforcing, 'PH_Famine');

    expect(reinforcing.turn).toBe(CAPSTONE + turn);
    expect(enemiesOf(reinforcing)).toHaveLength(turn);
    expect(unitAt(reinforcing.units, STANDING_CAMP)?.faction).toBe('enemy');
  }
  expect(enemiesOf(stoodOut())).toHaveLength(REINFORCED);
});

test('the reinforcement is a stage of its own, raised after the tick and ahead of the deal', () => {
  const due = CAPSTONE + 3;
  let reinforcing = moated({
    units: [unkillable(LURE)],
    timeline: besieging(...dueOn(due).deals),
  });

  while (reinforcing.turn < due - 1) {
    const staged = stagedBy(reinforcing, { type: 'end-turn' });
    expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'reinforce']);
    reinforcing = endedTurn(reinforcing, 'PH_Famine');
  }
  const dealt = stagedBy(reinforcing, { type: 'end-turn' });

  expect(dealt.slice(dealt.indexOf('turn'))).toEqual(['turn', 'reinforce', 'deal']);
});

test('the siege’s own camps are reinforced as the camps standing are', () => {
  const landed = siegeLanded({ units: [unkillable(CITY)] });
  const camps = campsOf(landed);
  const after = endedTurn(landed, 'PH_Famine');

  expect(enemiesOf(landed)).toHaveLength(camps.length);
  expect(enemiesOf(after)).toHaveLength(2 * camps.length);
  for (const camp of camps) expect(unitAt(after.units, camp)?.faction).toBe('enemy');
});

test('the reinforcement enters no warrior on a camp a unit stands on', () => {
  let reinforcing = moated({ units: [standing('enemy', STANDING_CAMP)] });
  const entered = unitAt(reinforcing.units, STANDING_CAMP)?.id;

  for (let turn = 1; turn <= REINFORCED; turn++) {
    reinforcing = endedTurn(reinforcing, 'PH_Famine');

    expect(enemiesOf(reinforcing)).toHaveLength(1);
    expect(unitAt(reinforcing.units, STANDING_CAMP)?.id).toBe(entered);
  }
});

test('the city standing at the end of the siege’s sixth turn ends the chronicle in victory', () => {
  let reinforcing = moated({ units: [unkillable(LURE)] });

  for (let turn = 1; turn <= REINFORCED; turn++) {
    reinforcing = endedTurn(reinforcing, 'PH_Famine');
    expect(reinforcing.turn).toBe(CAPSTONE + turn);
    expect(reinforcing.ending).toBeUndefined();
  }
  const staged = stagedBy(reinforcing, { type: 'end-turn' });
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
