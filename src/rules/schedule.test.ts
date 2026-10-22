import { expect, test } from 'vitest';
import { chartedTile } from './cards';
import { ageOf, type Catalogue, catalogued, eventOf } from './catalogue';
import { apply, type Command, launched, outcome, refusalOf } from './chronicle';
import { bordered, growthThreshold } from './city';
import {
  AGE,
  AMBUSH,
  aimedAt,
  assignTo,
  besideTheNeutral,
  buildingAt,
  builtOn,
  CAMP,
  CAMPS,
  CATALOGUE,
  type Carrying,
  CITY,
  CIVILIZATION,
  CULL,
  CULL_COST,
  camped,
  cityOf,
  DELUGE,
  dealing,
  deepBut,
  ENCAMPED,
  EXPLOSION,
  endedTurn,
  enemiesOf,
  featured,
  field,
  fullDraw,
  heldBy,
  idsOf,
  madeOf,
  NEUTRAL_TILE,
  NO_DEALS,
  NO_GROWTH,
  namesOf,
  only,
  onlyStocks,
  opening,
  PLAYED,
  plains,
  QUIET,
  REGION,
  ringed,
  SILO,
  SPRAWL,
  type Standing,
  settledOn,
  stagedBy,
  standing,
  TILLAGE,
  TOWER,
  UPHEAVAL,
  withUnits,
  worker,
} from './fixtures';
import {
  distance,
  type FeatureId,
  neighbours,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { nextRng, type Rng, seedRng } from './rng';
import { answerCase, answerRefusal, offered } from './schedule';
import { chartedAt, inSight } from './sight';
import { type Stage, walked as stagesWalked, unchanged } from './stages';
import {
  type Chronicle,
  holderOf,
  holds,
  idle,
  NO_REFUSAL,
  type Snapshot,
  type Timeline,
  turnShown,
} from './state';

/** The seeds a test over a whole walk runs: enough of them for both orders to be drawn. */
const SEEDS: readonly number[] = Array.from({ length: 40 }, (_, at) => at + 1);

/** The seeds a test over a draw near the city runs: enough of them for its lightest tiles to be drawn. */
const MANY_SEEDS: readonly number[] = Array.from({ length: 200 }, (_, at) => at + 1);

/** What the events phase landed on one turn: the event it dealt, or no event for the capstone. */
type Landing = { readonly turn: number; readonly event?: string };

/** A walk: what the events phase landed turn by turn, and the turn the chronicle stood on at its end. */
type Walk = { readonly landings: readonly Landing[]; readonly turn: number };

/**
 * The chronicle ended turn after turn until it stands on `through` or has ended, every deal taken —
 * `wanted` where the deal offers it, and the first entry dealt where it does not — and what the
 * events phase landed read off the stages every command resolved as.
 */
function walkedFrom(
  catalogue: Catalogue,
  start: Chronicle,
  through: number,
  wanted: string,
): Walk & { readonly chronicle: Chronicle } {
  let chronicle = start;
  const landings: Landing[] = [];
  const resolve = (command: Command): void => {
    const stages = apply(catalogue, chronicle, command);
    for (const { name, chronicle: left } of stagesWalked(stages)) {
      const dealt = left.deals[left.deals.length - 1];
      if (name === 'capstone-landing') landings.push({ turn: left.turn });
      if (name === 'deal' && dealt?.of === 'event') {
        landings.push({ turn: left.turn, event: dealt.event });
      }
    }
    const next = outcome(stages);
    if (next === chronicle) throw new Error(`the ${command.type} is refused`);
    chronicle = next;
  };

  while (chronicle.turn < through && chronicle.ending === undefined) {
    resolve({ type: 'end-turn' });
    for (let deal = chronicle.deals[0]; deal !== undefined; deal = chronicle.deals[0]) {
      resolve({ type: 'take', at: Math.max(offered(catalogue, deal).indexOf(wanted), 0) });
    }
  }
  return { landings, turn: chronicle.turn, chronicle };
}

/**
 * The chronicle with a food stock past what a walk's hungers take, so the walk reaches its end; the
 * city grows every turn of it.
 */
function fed(chronicle: Chronicle): Chronicle {
  return { ...chronicle, resources: { ...chronicle.resources, food: 100_000 } };
}

const walks = new Map<string, Walk>();

/**
 * A chronicle launched in the fixture's first age from a seed, settled on the centre tile, and walked
 * to the fortieth turn.
 */
function walked(seed: number, wanted = 'PH_Famine'): Walk {
  const key = `${seed} ${wanted}`;
  const known = walks.get(key);
  if (known !== undefined) return known;
  const settled = settledOn(
    launched(CATALOGUE, AGE, REGION, seed, CIVILIZATION, []).chronicle,
    CITY,
  );
  const walk = walkedFrom(CATALOGUE, fed(settled), 40, wanted);
  walks.set(key, walk);
  return walk;
}

/** The food stock a city waiting on an event holds: its one tile yields none, so only a famine moves it. */
const STOCKED = 5;

/**
 * An age and a timeline dealing the hardship, its raid first and its famine second, on that turn and
 * on no other.
 */
function dueOn(turn: number, event = 'PH_Hardship'): Pick<Chronicle, 'age' | 'timeline'> {
  return dealing({ turn, event });
}

function awaiting(due: number, carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    resources: { food: STOCKED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    turn: due - 1,
    ...dueOn(due),
    ...carrying,
  });
}

/** The same city one end of turn on: the due turn open, and its deal standing. */
function dealtBy(due: number, carrying: Carrying = {}): Chronicle {
  return outcome(apply(CATALOGUE, awaiting(due, carrying), { type: 'end-turn' }));
}

test('a deal is due on the third turn to the seventh, and each next three to seven turns after a landing', () => {
  for (const seed of SEEDS) {
    const { landings } = walked(seed);
    expect(landings.filter((landing) => landing.event !== undefined).length).toBeGreaterThan(2);

    let previous = 0;
    for (const { turn, event } of landings) {
      if (event !== undefined) {
        expect(turn - previous).toBeGreaterThanOrEqual(3);
        expect(turn - previous).toBeLessThanOrEqual(7);
      }
      previous = turn;
    }
  }
});

test('the same seed deals the same whatever answers are taken, and another seed deals otherwise', () => {
  for (const seed of SEEDS.slice(0, 10)) {
    const raided = walked(seed, 'PH_Raid');
    const starved = walked(seed);
    const through = Math.min(raided.turn, starved.turn);
    const until = (walk: Walk): Landing[] =>
      walk.landings.filter((landing) => landing.turn <= through);

    expect(until(raided).length).toBeGreaterThan(0);
    expect(until(raided)).toEqual(until(starved));
  }
  expect(walked(7).landings).not.toEqual(walked(8).landings);
});

test('the capstone lands on a turn rolled at the launch, between the twenty-seventh and the thirty-third', () => {
  const turns = SEEDS.map(
    (seed) =>
      launched(CATALOGUE, AGE, REGION, seed, CIVILIZATION, []).chronicle.timeline.capstone.turn,
  );

  for (const turn of turns) {
    expect(turn).toBeGreaterThanOrEqual(27);
    expect(turn).toBeLessThanOrEqual(33);
  }
  expect(new Set(turns).size).toBeGreaterThan(1);
});

test('the capstone’s turn deals nothing, and each due turn deals one event the seed decides', () => {
  const firsts = new Set<string>();
  for (const seed of SEEDS) {
    const { landings } = walked(seed);
    const turns = landings.map((landing) => landing.turn);

    expect(new Set(turns).size).toBe(turns.length);
    for (const { event } of landings) {
      if (event !== undefined) expect(['PH_Hardship', 'PH_Blight']).toContain(event);
    }
    const [first] = landings;
    if (first?.event !== undefined) firsts.add(first.event);
  }

  expect(firsts.size).toBe(2);
});

test('the blight is dealt as readily on the third turn as the twentieth', () => {
  const turns = SEEDS.flatMap((seed) =>
    walked(seed)
      .landings.filter((landing) => landing.event === 'PH_Blight')
      .map((landing) => landing.turn),
  );

  expect(Math.min(...turns)).toBeLessThanOrEqual(7);
  expect(Math.max(...turns)).toBeGreaterThanOrEqual(20);
});

test('a timeline dealing on the first turn stops the end of the settle phase on its deal over the hand it drew, and the take draws nothing', () => {
  const settled = settledOn(opening(plains(4), dueOn(1)), CITY);
  const dealt = outcome(apply(CATALOGUE, settled, { type: 'end-turn' }));
  const taken = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 1 }));

  expect(dealt.turn).toBe(1);
  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(dealt.hand).toHaveLength(5);
  expect(taken.deals).toEqual([]);
  expect(taken.hand).toEqual(dealt.hand);
});

test('nothing is dealt before the due turn, and the raid enters a warrior on a camp', () => {
  const camp = { q: 4, r: 0 };
  let chronicle = cityOf(['urban'], { tiles: camped(field(4), [camp]), ...dueOn(5) });

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
    endedTurn(cityOf(['urban'], { tiles: disc, rng: seedRng(seed), ...dueOn(2) }), 'PH_Raid')
      .units[0].tile;

  expect(raidOf(7)).toEqual(raidOf(7));
  expect(new Set(SEEDS.map((seed) => tileKey(raidOf(seed)))).size).toBeGreaterThan(1);
});

test('a raid enters one warrior, and one more for every ten turns', () => {
  const raiders = (due: number): number[] =>
    SEEDS.map(
      (seed) => enemiesOf(endedTurn(awaiting(due, { rng: seedRng(seed) }), 'PH_Raid')).length,
    );

  for (let due = 3; due <= 9; due++) expect([...new Set(raiders(due))]).toEqual([1]);
  for (let due = 20; due <= 29; due++) expect([...new Set(raiders(due))]).toEqual([3]);
});

test('a famine taken on any turn adds its hazard and leaves the food stock as it stood', () => {
  for (const due of [3, 14, 20]) {
    const landed = endedTurn(awaiting(due), 'PH_Famine');

    expect(landed.resources.food).toBe(STOCKED);
    expect(idsOf(landed.drawPile)).toEqual(['PH_Hunger']);
  }
});

test('the famine taken on a due turn adds its hazard to the top of the draw pile, drawn in the next turn’s hand, and leaves the city as it stood', () => {
  const waiting = awaiting(15, { drawPile: fullDraw() });
  const after = endedTurn(waiting, 'PH_Famine');

  expect(idsOf(after.hand)).toEqual(fullDraw());
  expect(idsOf(after.drawPile)).toEqual(['PH_Hunger']);
  expect(idsOf(endedTurn(after).hand)[0]).toBe('PH_Hunger');
  expect(after.resources.food).toBe(STOCKED);
  expect(after.population).toBe(waiting.population);
  expect(growthThreshold(after, 'player')).toBe(growthThreshold(waiting, 'player'));
  expect(enemiesOf(after)).toEqual([]);
});

test('a due turn deals its one event over the hand it drew, and the turn ends there', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const blighted = dealtBy(5, dueOn(5, 'PH_Blight'));
  const staged = stagedBy(awaiting(5, { drawPile: fullDraw() }), { type: 'end-turn' });

  expect(standing.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(blighted.deals).toEqual([{ of: 'event', event: 'PH_Blight' }]);
  expect(standing.turn).toBe(5);
  expect(idsOf(standing.hand)).toEqual(fullDraw());
  expect(staged.slice(-3)).toEqual(['deal', 'rolled', 'dealt']);
  expect(staged.indexOf('drawn')).toBeLessThan(staged.indexOf('deal'));
});

test('a due turn is one deal group over the next due turn rolled and the event dealt, and a turn not due stages no deal at all', () => {
  const end: Command = { type: 'end-turn' };
  const waiting = awaiting(5, { drawPile: fullDraw() });
  const early = awaiting(6, { drawPile: fullDraw(), turn: 3 });

  const [rolled, dealt, ...rest] = heldBy(apply(CATALOGUE, waiting, end), 'deal');

  expect([rolled.name, dealt.name]).toEqual(['rolled', 'dealt']);
  expect(rest).toEqual([]);
  expect(rolled.chronicle.timeline.next).toBeGreaterThan(waiting.timeline.next);
  expect(rolled.chronicle.deals).toEqual([]);
  expect(dealt.chronicle.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(dealt.chronicle.timeline).toEqual(rolled.chronicle.timeline);
  expect(stagedBy(early, end)).not.toContain('deal');
});

test('an answer taken is one answer group over the deal taken, its cost as one stock, and its landing', () => {
  const rich = dealtBy(5, {
    ...dueOn(5, 'PH_Blight'),
    drawPile: fullDraw(),
    resources: {
      food: STOCKED,
      production: EXPLOSION,
      military: 0,
      money: 0,
      science: 0,
      culture: 0,
    },
  });

  const exploding = heldBy(apply(CATALOGUE, rich, { type: 'take', at: 1 }), 'answer');
  const enduring = heldBy(apply(CATALOGUE, rich, { type: 'take', at: 0 }), 'answer');
  const [taken, paid] = exploding;

  expect(exploding.map(({ name }) => name)).toEqual(['taken', 'stock']);
  expect(taken.chronicle.deals).toEqual([]);
  expect(taken.chronicle.resources).toEqual(rich.resources);
  expect(paid.chronicle.resources.production).toBe(rich.resources.production - EXPLOSION);
  expect(enduring.map(({ name }) => name)).toEqual(['taken', 'added']);
});

test('a reward taken is one reward group over the deal taken and the card added', () => {
  const camp = { q: 4, r: 0 };
  const dealt = outcome(
    apply(
      CATALOGUE,
      cityOf(['urban'], {
        ...NO_GROWTH,
        tiles: camped(field(4), [camp]),
        drawPile: fullDraw(),
        units: [standing('player', camp)],
      }),
      { type: 'end-turn' },
    ),
  );

  const [taken, added, ...rest] = heldBy(
    apply(CATALOGUE, dealt, { type: 'take', at: 0 }),
    'reward',
  );

  expect([taken.name, added.name]).toEqual(['taken', 'added']);
  expect(rest).toEqual([]);
  expect(taken.chronicle.deals).toEqual([]);
  expect(taken.chronicle.discardPile).toEqual([]);
  expect(idsOf(added.chronicle.discardPile)).toEqual([Object.keys(CAMP.rewards)[0]]);
});

test('the take lands the answer at its place in the order declared and no other, draws nothing of its own, and resolves nothing after its landing', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const raided = outcome(apply(CATALOGUE, standing, { type: 'take', at: 0 }));
  const starved = outcome(apply(CATALOGUE, standing, { type: 'take', at: 1 }));

  expect(stagedBy(standing, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'enter']);
  expect(enemiesOf(raided)).toHaveLength(1);
  expect(enemiesOf(starved)).toEqual([]);
  expect(idsOf(starved.drawPile)).toEqual(['PH_Hunger']);
  expect(starved.rng).toEqual(standing.rng);
  for (const after of [raided, starved]) {
    expect(after.hand).toEqual(standing.hand);
    expect(after.deals).toEqual([]);
    expect(after.resources.food).toBe(STOCKED);
    expect(after.timeline).toEqual(standing.timeline);
  }
});

test('a raid with no free tile to enter on enters nobody, draws nothing, and resolves as a runtime error', () => {
  const held = cityOf(['urban'], {
    tiles: field(1),
    ...dueOn(2),
    drawPile: fullDraw(),
    units: neighbours(CITY).map((tile) => standing('player', tile)),
  });
  const dealt = outcome(apply(CATALOGUE, held, { type: 'end-turn' }));
  const raided = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'runtime-error']);
  expect(enemiesOf(raided)).toEqual([]);
  expect(raided.rng).toEqual(dealt.rng);
});

test('an answer taken pays its cost before it lands, and one the city cannot pay for is refused with nothing paid', () => {
  const stocked = (production: number): Chronicle =>
    dealtBy(5, {
      ...dueOn(5, 'PH_Blight'),
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
  expect(idsOf(exploded.hand)).toEqual(fullDraw());
  expect(endured.resources).toEqual(short.resources);
  expect(endured.drawPile[0].id).toBe('PH_Hunger');
});

test('an answer whose cost reads the chronicle is refused where that reading outruns the stock, and pays exactly that reading where it does not', () => {
  const levied = (population: number): Chronicle =>
    dealtBy(5, {
      ...dueOn(5, 'PH_Blight'),
      drawPile: fullDraw(),
      population,
      resources: { food: STOCKED, production: 40, military: 0, money: 0, science: 0, culture: 0 },
    });
  const levy: Command = { type: 'take', at: 2 };
  const short = levied(99);
  const rich = levied(30);
  const paid = outcome(apply(CATALOGUE, rich, levy));

  expect(short.resources.production).toBeLessThan(short.population);
  expect(stagedBy(short, levy)).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, short, levy))).toBe(short);
  expect(rich.resources.production).toBeGreaterThanOrEqual(rich.population);
  expect(paid.resources.production).toBe(rich.resources.production - rich.population);
  expect(paid.deals).toEqual([]);
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
  expect(stagedBy(waiting, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'enter']);
});

/** The age and the timeline dealing the fixture's upheaval at the end of a `cityOf` city's turn. */
const UPHEAVAL_DUE: Carrying = dueOn(2, 'PH_Upheaval');

/** The city one end of turn on with its deal standing, and the stages the named answer taken resolves as. */
function answerTaken(city: Chronicle, answer: string): { dealt: Chronicle; stages: Stage[] } {
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const [deal] = dealt.deals;
  if (deal === undefined) throw new Error(`no deal stands to take ${answer} from`);
  const at = offered(CATALOGUE, deal).indexOf(answer);
  return { dealt, stages: apply(CATALOGUE, dealt, { type: 'take', at }) };
}

test('an answer killing the population working a tile leaves the population one fewer and the tile unassigned', () => {
  const { dealt, stages } = answerTaken(cityOf(['urban', 'hills'], UPHEAVAL_DUE), 'PH_Plague');
  const after = outcome(stages);

  expect(namesOf(stages)).toEqual(['answer', 'taken', 'assigned', 'population']);
  expect(after.population).toBe(dealt.population - 1);
  expect(after.assigned).toEqual([CITY]);
  expect(after.ending).toBeUndefined();
});

test('an answer killing the population working a tile nobody works kills nobody', () => {
  const city = cityOf(['urban', 'hills'], { ...UPHEAVAL_DUE, assigned: [CITY] });
  const { dealt, stages } = answerTaken(city, 'PH_Plague');
  const after = outcome(stages);

  expect(after.population).toBe(dealt.population);
  expect(after.assigned).toEqual(dealt.assigned);
});

test('an answer killing the city’s last population ends the chronicle in defeat on the take', () => {
  const city = cityOf(['urban', 'hills'], {
    ...UPHEAVAL_DUE,
    population: 1,
    assigned: [UPHEAVAL],
  });
  const { stages } = answerTaken(city, 'PH_Plague');

  expect(namesOf(stages)).toEqual(['answer', 'taken', 'assigned', 'population', 'ended']);
  expect(outcome(stages).population).toBe(0);
  expect(outcome(stages).ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 2 });
});

test('an answer damaging the unit standing on a tile takes its health, whatever its faction, and kills it at nought', () => {
  const hurt = (unit: Standing): Chronicle =>
    outcome(
      answerTaken(cityOf(['urban', 'plain'], { ...UPHEAVAL_DUE, units: [unit] }), 'PH_Ambush')
        .stages,
    );

  const warrior = hurt(standing('player', UPHEAVAL, { health: AMBUSH + 2 }));
  const enemy = hurt(standing('enemy', UPHEAVAL, { health: AMBUSH + 1 }, 0, 0));
  const { stages } = answerTaken(
    cityOf(['urban', 'plain'], {
      ...UPHEAVAL_DUE,
      units: [standing('player', UPHEAVAL, { type: 'PH_Worker', worker: true, health: AMBUSH })],
    }),
    'PH_Ambush',
  );

  expect(warrior.units.map((unit) => unit.stats.health)).toEqual([2]);
  expect(enemy.units.map((unit) => unit.stats.health)).toEqual([1]);
  expect(namesOf(stages)).toEqual(['answer', 'taken', 'killed']);
  expect(outcome(stages).units).toEqual([]);
});

test('an answer damaging the unit standing on a tile no unit stands on touches no unit', () => {
  const city = cityOf(['urban', 'plain'], { ...UPHEAVAL_DUE, units: [standing('player', CITY)] });
  const { dealt, stages } = answerTaken(city, 'PH_Ambush');

  expect(outcome(stages).units).toEqual(dealt.units);
});

/** The age and the timeline dealing the fixture's exodus at the end of a `cityOf` city's turn. */
const EXODUS_DUE: Carrying = dueOn(2, 'PH_Exodus');

test('an answer taking one population takes an idle one, and leaves every tile assigned', () => {
  const city = cityOf(['urban', 'plain', 'hills'], { ...EXODUS_DUE, population: 4 });
  const { dealt, stages } = answerTaken(city, 'PH_Leave');
  const after = outcome(stages);

  expect(idle(dealt)).toBe(1);
  expect(after.population).toBe(dealt.population - 1);
  expect(after.assigned).toEqual(dealt.assigned);
  expect(after.ending).toBeUndefined();
});

test('an answer taking one population with none idle unassigns the tile assigned last', () => {
  const back: TileCoords = { q: 1, r: 0 };
  const city = cityOf(['urban', 'plain', 'hills'], EXODUS_DUE);
  const off = outcome(apply(CATALOGUE, city, assignTo(back)));
  const on = outcome(apply(CATALOGUE, off, assignTo(back)));
  const { dealt, stages } = answerTaken(on, 'PH_Leave');
  const after = outcome(stages);

  expect(idle(dealt)).toBe(0);
  expect(dealt.assigned).toEqual([CITY, { q: 2, r: 0 }, back]);
  expect(after.population).toBe(dealt.population - 1);
  expect(after.assigned).toEqual([CITY, { q: 2, r: 0 }]);
});

test('an answer taking the city’s last population falls on the take, and nothing of it resolves after', () => {
  const city = cityOf(['urban'], { ...EXODUS_DUE, population: 1, drawPile: fullDraw() });
  const { dealt, stages } = answerTaken(city, 'PH_Leave');
  const after = outcome(stages);

  expect(dealt.population).toBe(1);
  expect(namesOf(stages)).toEqual(['answer', 'taken', 'assigned', 'population', 'ended']);
  expect(heldBy(stages, 'answer').map(({ name }) => name)).toEqual([
    'taken',
    'assigned',
    'population',
    'ended',
  ]);
  expect(after.population).toBe(0);
  expect(after.hand).toEqual(dealt.hand);
  expect(after.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 2 });
});

test('an answer declaring cases names the one the chronicle it is dealt on meets, and an answer declaring none names none', () => {
  const dealtWith = (food: number): Chronicle =>
    outcome(
      apply(
        CATALOGUE,
        cityOf(['urban'], { ...EXODUS_DUE, ...NO_GROWTH, resources: onlyStocks({ food }) }),
        { type: 'end-turn' },
      ),
    );
  const fed = dealtWith(1);
  const starved = dealtWith(0);

  expect(fed.deals).toEqual([{ of: 'event', event: 'PH_Exodus' }]);
  expect(answerCase(CATALOGUE, fed, 'PH_Exodus', 'PH_Stay')).toBe('PH_Fed');
  expect(answerCase(CATALOGUE, starved, 'PH_Exodus', 'PH_Stay')).toBe('PH_Starved');
  expect(answerCase(CATALOGUE, fed, 'PH_Exodus', 'PH_Leave')).toBeUndefined();
});

test('an answer placing a camp near the city places one, and its raid enters a warrior on the camp and the rest around it', () => {
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(6),
    ...dueOn(2, 'PH_Rivals'),
  });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));
  const [camp, ...others] = campsOf(after);
  const warriors = enemiesOf(after);

  expect(campsOf(dealt)).toEqual([]);
  expect(others).toEqual([]);
  expect(warriors).toHaveLength(ENCAMPED);
  expect(warriors.map((warrior) => distance(warrior.tile, camp)).sort((a, b) => a - b)).toEqual([
    0,
    ...Array<number>(ENCAMPED - 1).fill(1),
  ]);
});

test('a camp placed near a city holding its own tile alone lands three tiles from it or further, the third ring the likeliest', () => {
  const rings: number[] = [];

  for (const seed of SEEDS) {
    const city = cityOf(['urban'], {
      ...NO_GROWTH,
      tiles: field(6),
      ...dueOn(2, 'PH_Rivals'),
      rng: seedRng(seed),
    });
    const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
    const [camp] = campsOf(outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 })));
    rings.push(distance(camp, CITY));
  }
  const third = rings.filter((ring) => ring === 3).length;

  expect(Math.min(...rings)).toBe(3);
  expect(Math.max(...rings)).toBeGreaterThan(3);
  expect(third).toBeGreaterThan(rings.length - third);
});

test('an event placing a camp near the city is dealt where no tile takes a camp, its answer read blocked there with its reason and its take refused with nothing paid, and that answer landed there is a runtime error', () => {
  const cramped = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(2),
    ...dueOn(2, 'PH_Rivals'),
  });
  const dealt = outcome(apply(CATALOGUE, cramped, { type: 'end-turn' }));
  const encamping = { type: 'take', at: 0 } as const;
  const landing = eventOf(CATALOGUE, 'PH_Rivals').answers.PH_Encampment.lands(CATALOGUE, dealt);

  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Rivals' }]);
  expect(offered(CATALOGUE, dealt.deals[0])[encamping.at]).toBe('PH_Encampment');
  expect(answerRefusal(CATALOGUE, dealt, 'PH_Rivals', 'PH_Encampment')).toEqual({
    unaffordable: [],
    blocked: ['no-camp-tile'],
  });
  expect(stagedBy(dealt, encamping)).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, dealt, encamping))).toBe(dealt);
  expect(landing.stages.map(({ name }) => name)).toEqual(['runtime-error']);
  expect(campsOf(landing.chronicle)).toEqual([]);
  expect(enemiesOf(landing.chronicle)).toEqual([]);
});

/** A city on these tiles dealt the fixture's wildfire at the end of its turn, and its burn taken. */
function burnt(
  city: Chronicle,
  catalogue: Catalogue = CATALOGUE,
): { dealt: Chronicle; landed: Chronicle } {
  const dealt = outcome(apply(catalogue, city, { type: 'end-turn' }));
  if (dealt.deals.length === 0) throw new Error('the wildfire is not dealt');
  return { dealt, landed: outcome(apply(catalogue, dealt, { type: 'take', at: 0 })) };
}

function terrainOf(chronicle: Chronicle, at: TileCoords): string | undefined {
  return tileAt(chronicle.tiles, at)?.terrain;
}

/** The fixture's content with the city's building standing on forest besides urban, and never on plain. */
const CITY_IN_FOREST: Catalogue = catalogued({
  ...CATALOGUE,
  buildings: {
    ...CATALOGUE.buildings,
    PH_City: { ...CATALOGUE.buildings.PH_City, terrains: ['urban', 'forest'] },
  },
});

test('an answer terraforming near the city turns one tile of the terrain it names that a terraform reaches into another, drawn near the city in one step of the seeded generator, every layer going with the old terrain or the feature and the population working it staying, and nothing where none stands', () => {
  const near = [
    { q: 2, r: 0 },
    { q: -2, r: 0 },
    { q: 0, r: 2 },
    { q: 0, r: -2 },
  ];
  const far = { q: 3, r: 0 };
  const lodged = tileKey(near[0]);
  const tiles = madeOf(field(5), 'forest', [...near, far]).map((tile) =>
    tileKey(tile) === lodged
      ? { ...tile, feature: 'PH_Game', building: 'PH_Lodge', improvements: ['PH_Snare'] }
      : tile,
  );
  const struckOn = new Set<string>();

  for (const seed of SEEDS) {
    const { dealt, landed } = burnt(
      cityOf(['urban'], {
        ...dueOn(2, 'PH_Wildfire'),
        drawPile: fullDraw(),
        tiles,
        rng: seedRng(seed),
      }),
    );
    const [struck, ...others] = [...near, far].filter((at) => terrainOf(landed, at) === 'plain');
    const key = tileKey(struck);

    expect(others).toEqual([]);
    expect(landed.rng).toEqual(nextRng(dealt.rng).rng);
    expect(tileAt(landed.tiles, struck)).toEqual({
      ...tileAt(dealt.tiles, struck),
      terrain: 'plain',
      feature: undefined,
      building: undefined,
      improvements: [],
    });
    expect(landed.tiles.filter((tile) => tileKey(tile) !== key)).toEqual(
      dealt.tiles.filter((tile) => tileKey(tile) !== key),
    );
    struckOn.add(key);
  }
  expect(struckOn.size).toBeGreaterThan(1);

  const worked = { q: 1, r: 0 };
  const working = burnt(
    cityOf(['urban', 'forest'], {
      ...dueOn(2, 'PH_Wildfire'),
      drawPile: fullDraw(),
      tiles: madeOf(field(5), 'forest', [worked]),
    }),
  );
  const bare = burnt(
    cityOf(['urban'], { ...dueOn(2, 'PH_Wildfire'), drawPile: fullDraw(), tiles: field(5) }),
  );
  const wooded = burnt(
    cityOf(['forest'], {
      ...dueOn(2, 'PH_Wildfire'),
      drawPile: fullDraw(),
      tiles: madeOf(field(5), 'forest', [CITY, far]),
    }),
    CITY_IN_FOREST,
  );

  expect(terrainOf(wooded.landed, CITY)).toBe('forest');
  expect(terrainOf(wooded.landed, far)).toBe('plain');
  expect(terrainOf(working.landed, worked)).toBe('plain');
  expect(working.landed.assigned).toEqual(working.dealt.assigned);
  expect(working.landed.population).toBe(working.dealt.population);
  expect(stagedBy(bare.dealt, { type: 'take', at: 0 })).toEqual(['answer', 'taken']);
  expect(bare.landed.tiles).toEqual(bare.dealt.tiles);
  expect(bare.landed.rng).toEqual(bare.dealt.rng);
});

/** A tile beside the city that a `ringed` city holds. */
const SOAKED: TileCoords = { q: 1, r: 0 };

/** Another tile beside the city that a `ringed` city holds. */
const BARN: TileCoords = { q: 0, r: 1 };

/** A tile outside a `ringed` city's border. */
const DRY: TileCoords = { q: 2, r: 0 };

/** What a fixture lays on a tile, over the plain it stands as. */
type Laid = Partial<Pick<Tile, 'terrain' | 'feature' | 'improvements' | 'building'>>;

/** A disc of plain out to three, each tile named laid as `Laid` says. */
function laidOut(laid: readonly (readonly [TileCoords, Laid])[]): Tile[] {
  const on = new Map(laid.map(([at, layers]) => [tileKey(at), layers]));
  return field(3).map((tile) => ({ ...tile, ...on.get(tileKey(tile)) }));
}

/**
 * A `ringed` city on a disc of plain out to three, each tile named carrying what is laid beside it,
 * dealt the fixture's deluge at the end of its turn.
 */
function flooding(
  laid: readonly (readonly [TileCoords, Laid])[],
  carrying: Carrying = {},
): Chronicle {
  return ringed(3, { ...dueOn(2, 'PH_Deluge'), tiles: laidOut(laid), ...carrying });
}

/** The city one end of turn on with the deluge standing, what its card reads, and the stages its take resolves as. */
function deluged(city: Chronicle): {
  dealt: Chronicle;
  read: Record<string, number>;
  stages: Stage[];
} {
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  if (dealt.deals.length === 0) throw new Error('the deluge is not dealt');
  const read = eventOf(CATALOGUE, 'PH_Deluge').answers.PH_Drown.reads(CATALOGUE, dealt);
  return { dealt, read, stages: apply(CATALOGUE, dealt, { type: 'take', at: 0 }) };
}

/** The tiles the take's answer retiled, in the order it retiled them. */
function retiledOn(stages: readonly Stage[]): string[] {
  return [...stagesWalked(heldBy(stages, 'answer'))].flatMap((stage) =>
    stage.kind === 'change' && stage.name === 'retiled' ? [tileKey(stage.tile)] : [],
  );
}

/** Every improvement standing on the tiles named, each read with its tile. */
function improvementsOn(chronicle: Chronicle, tiles: readonly TileCoords[]): string[] {
  return tiles.flatMap((at) =>
    (tileAt(chronicle.tiles, at)?.improvements ?? []).map((id) => `${tileKey(at)} ${id}`),
  );
}

/** The generator after that many steps. */
function steppedBy(rng: Rng, steps: number): Rng {
  let stepped = rng;
  for (let step = 0; step < steps; step++) stepped = nextRng(stepped).rng;
  return stepped;
}

/** What lies outside the border the city of `dealt` holds: every tile it does not hold. */
function outsideOf(dealt: Chronicle, chronicle: Chronicle): Tile[] {
  return chronicle.tiles.filter((tile) => !holds(dealt, tile));
}

test('a removal takes improvements while they stand, each drawn near the city, inside the border and out of it, the city’s own tile included and a tile carrying several counting each, and leaves every building', () => {
  const laid: [TileCoords, Laid][] = [
    [CITY, { improvements: ['PH_Road'] }],
    [SOAKED, { improvements: ['PH_Road', 'PH_Trail'] }],
    [BARN, { building: TILLAGE }],
    [DRY, { improvements: ['PH_Road', 'PH_Rubble'], building: TILLAGE }],
  ];
  const carrying = [CITY, SOAKED, DRY];
  const standing = improvementsOn(flooding(laid), carrying);
  const taken = new Set<string>();

  for (const seed of MANY_SEEDS) {
    const { dealt, read, stages } = deluged(flooding(laid, { rng: seedRng(seed) }));
    const landed = outcome(stages);
    const left = improvementsOn(landed, carrying);

    expect(read).toEqual({ improvements: DELUGE, buildings: 0, city: 0 });
    expect(left).toHaveLength(standing.length - DELUGE);
    expect(standing).toEqual(expect.arrayContaining(left));
    expect(retiledOn(stages)).toHaveLength(DELUGE);
    expect(landed.rng).toEqual(steppedBy(dealt.rng, DELUGE));
    expect([buildingAt(landed, BARN), buildingAt(landed, DRY)]).toEqual([TILLAGE, TILLAGE]);
    for (const each of standing.filter((one) => !left.includes(one))) taken.add(each);
  }
  expect([...taken].sort()).toEqual([...standing].sort());
});

test('once no improvement stands, a removal takes a building inside the border in its place, drawn once from the seeded generator among all standing there, and the city’s own building stands', () => {
  const takenFrom = new Set<string>();

  for (const seed of SEEDS) {
    const city = flooding(
      [
        [CITY, { improvements: ['PH_Road'] }],
        [SOAKED, { building: TILLAGE }],
        [BARN, { building: TILLAGE }],
        [DRY, { building: TILLAGE }],
      ],
      { rng: seedRng(seed) },
    );
    const { dealt, read, stages } = deluged(city);
    const landed = outcome(stages);
    const [first, second] = retiledOn(stages);
    const razed = [SOAKED, BARN].filter((at) => buildingAt(landed, at) === undefined);

    expect(read).toEqual({ improvements: 1, buildings: 1, city: 0 });
    expect(first).toBe(tileKey(CITY));
    expect(improvementsOn(landed, [CITY])).toEqual([]);
    expect(razed.map(tileKey)).toEqual([second]);
    expect(buildingAt(landed, CITY)).toBe(buildingAt(dealt, CITY));
    expect(landed.ending).toBeUndefined();
    expect(landed.rng).toEqual(steppedBy(dealt.rng, 2));
    expect(outsideOf(dealt, landed)).toEqual(outsideOf(dealt, dealt));
    takenFrom.add(second);
  }
  expect(takenFrom.size).toBeGreaterThan(1);
});

test('once no improvement and no building inside the border stands, a removal takes the city’s own building, drawing nothing for it, and the city falls on the spot', () => {
  const { dealt, read, stages } = deluged(
    flooding([
      [SOAKED, { building: TILLAGE }],
      [DRY, { building: TILLAGE }],
    ]),
  );
  const fallen = outcome(stages);

  expect(read).toEqual({ improvements: 0, buildings: 1, city: 1 });
  expect(retiledOn(stages)).toEqual([tileKey(SOAKED), tileKey(CITY)]);
  expect(buildingAt(fallen, SOAKED)).toBeUndefined();
  expect(buildingAt(fallen, CITY)).toBeUndefined();
  expect(fallen.rng).toEqual(steppedBy(dealt.rng, 1));
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'removal', turn: dealt.turn });
  expect(outsideOf(dealt, fallen)).toEqual(outsideOf(dealt, dealt));
});

test('the player’s city’s building removed ends the chronicle in defeat right on that change, and nothing of play resolves after it', () => {
  const bare = cityOf(['urban'], { ...dueOn(2, 'PH_Deluge'), drawPile: fullDraw() });
  const dealt = outcome(apply(CATALOGUE, bare, { type: 'end-turn' }));
  const stages = apply(CATALOGUE, dealt, { type: 'take', at: 0 });
  const fallen = outcome(stages);

  expect(namesOf(stages)).toEqual(['answer', 'taken', 'retiled', 'ended']);
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'removal', turn: dealt.turn });
  expect(fallen.hand).toEqual(dealt.hand);
});

/**
 * A `ringed` city on a disc of plain out to three holding the cull's cost, each tile named laid as
 * `Laid` says, one end of turn on with the fixture's prowl standing.
 */
function prowled(laid: readonly (readonly [TileCoords, Laid])[], seed = 7): Chronicle {
  const city = ringed(3, {
    ...dueOn(2, 'PH_Prowl'),
    drawPile: fullDraw(),
    tiles: laidOut(laid),
    resources: { food: 0, production: CULL_COST, military: 0, money: 0, science: 0, culture: 0 },
    rng: seedRng(seed),
  });
  return outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
}

const CULLING = { type: 'take', at: 0 } as const;

const { PH_Cull } = eventOf(CATALOGUE, 'PH_Prowl').answers;

test('a removal of features takes that many, each drawn near the city, inside the border and out of it, the city’s own tile included, with every layer going with it, reads what it takes of each before it lands, takes fewer where fewer stand and nothing where none does, and is refused by nothing', () => {
  const laid: [TileCoords, Laid][] = [
    [CITY, { feature: 'PH_Fertile' }],
    [SOAKED, { feature: 'PH_Fertile', building: 'PH_Smokehouse' }],
    [BARN, { terrain: 'forest', feature: 'PH_Game', improvements: ['PH_Snare'] }],
    [DRY, { feature: 'PH_Fertile', building: 'PH_Smokehouse' }],
  ];
  const herds = laid.map(([at]) => at);
  const takenFrom = new Set<string>();

  for (const seed of MANY_SEEDS) {
    const dealt = prowled(laid, seed);
    const read = PH_Cull.reads(CATALOGUE, dealt);
    const stages = apply(CATALOGUE, dealt, CULLING);
    const landed = outcome(stages);
    const bared = herds.filter((at) => featureOf(landed, at) === undefined);
    const keys = new Set(bared.map(tileKey));
    const lost = (feature: FeatureId): number =>
      bared.filter((at) => featureOf(dealt, at) === feature).length;

    expect(bared).toHaveLength(CULL);
    expect(read).toEqual({ PH_Fertile: lost('PH_Fertile'), PH_Game: lost('PH_Game') });
    expect(retiledOn(stages)).toHaveLength(CULL);
    expect(landed.rng).toEqual(steppedBy(dealt.rng, CULL));
    for (const at of bared) {
      expect(tileAt(landed.tiles, at)?.improvements).toEqual([]);
      expect(buildingAt(landed, at)).toBe(tileKey(at) === tileKey(CITY) ? 'PH_City' : undefined);
    }
    expect(landed.tiles.filter((tile) => !keys.has(tileKey(tile)))).toEqual(
      dealt.tiles.filter((tile) => !keys.has(tileKey(tile))),
    );
    expect(landed.assigned).toEqual(dealt.assigned);
    for (const key of keys) takenFrom.add(key);
  }
  expect([...takenFrom].sort()).toEqual(herds.map(tileKey).sort());

  const stray = prowled([[DRY, { feature: 'PH_Fertile' }]]);
  const fewer = outcome(apply(CATALOGUE, stray, CULLING));
  const none = prowled([]);
  const culled = outcome(apply(CATALOGUE, none, CULLING));

  expect(PH_Cull.reads(CATALOGUE, stray)).toEqual({ PH_Fertile: 1, PH_Game: 0 });
  expect(featureOf(fewer, DRY)).toBeUndefined();
  expect(fewer.rng).toEqual(steppedBy(stray.rng, 1));
  expect(answerRefusal(CATALOGUE, none, 'PH_Prowl', 'PH_Cull')).toEqual(NO_REFUSAL);
  expect(PH_Cull.reads(CATALOGUE, none)).toEqual({ PH_Fertile: 0, PH_Game: 0 });
  expect(PH_Cull.lands(CATALOGUE, none)).toEqual(unchanged(none));
  expect(culled.deals).toEqual([]);
  expect(culled.resources.production).toBe(none.resources.production - CULL_COST);
});

/**
 * A `ringed` city on a disc of plain out to three, each tile named laid as `Laid` says, the fixture's
 * sprawl in its hand: what its strike holds at the end of the turn, and the chronicle it leaves.
 */
function sprawled(
  laid: readonly (readonly [TileCoords, Laid])[],
  seed = 7,
): { city: Chronicle; held: readonly Stage[]; left: Chronicle } {
  const city = ringed(3, { hand: ['PH_Sprawl'], tiles: laidOut(laid), rng: seedRng(seed) });
  for (const stage of stagesWalked(apply(CATALOGUE, city, { type: 'end-turn' }))) {
    if (stage.kind === 'group' && stage.name === 'strike') {
      return { city, held: stage.stages, left: stage.chronicle };
    }
  }
  throw new Error('the sprawl strikes nothing');
}

/** Every tile of a `laidOut` disc but the city's and the named ones, laid as hills. */
function hillsBut(kept: readonly TileCoords[]): [TileCoords, Laid][] {
  const named = new Set([CITY, ...kept].map(tileKey));
  return field(3)
    .filter((tile) => !named.has(tileKey(tile)))
    .map(({ q, r }) => [{ q, r }, { terrain: 'hills' }]);
}

test('a challenge that terraforms strikes that many tiles of the terrains it names, each drawn near the city, inside the border and out of it, the city’s own tile included, every layer going with the old terrain or the feature and the population working them staying, and fewer where fewer stand and nothing where none does', () => {
  const laid: [TileCoords, Laid][] = [
    [CITY, { terrain: 'plain' }],
    [SOAKED, { building: TILLAGE, improvements: ['PH_Road'] }],
    [BARN, { terrain: 'forest', feature: 'PH_Game', building: 'PH_Lodge' }],
    [DRY, { terrain: 'forest', feature: 'PH_Game', building: 'PH_Lodge' }],
  ];
  const candidates = laid.map(([at]) => at);
  const hills = hillsBut(candidates);
  const terraformedOn = new Set<string>();

  for (const seed of MANY_SEEDS) {
    const { city, held, left } = sprawled([...hills, ...laid], seed);
    const changed = candidates.filter((at) => terrainOf(left, at) === 'urban');
    const keys = new Set(changed.map(tileKey));

    expect(changed).toHaveLength(SPRAWL);
    expect(namesOf(held)).toEqual(Array(SPRAWL).fill('retiled'));
    expect(left.rng).toEqual(steppedBy(city.rng, SPRAWL));
    for (const at of changed) {
      const before = tileAt(city.tiles, at);
      expect(tileAt(left.tiles, at)).toEqual({
        ...before,
        terrain: 'urban',
        feature: undefined,
        building: tileKey(at) === tileKey(CITY) ? 'PH_City' : undefined,
      });
    }
    expect(left.tiles.filter((tile) => !keys.has(tileKey(tile)))).toEqual(
      city.tiles.filter((tile) => !keys.has(tileKey(tile))),
    );
    expect(left.assigned).toEqual(city.assigned);
    expect(left.ending).toBeUndefined();
    for (const key of keys) terraformedOn.add(key);
  }
  expect([...terraformedOn].sort()).toEqual(candidates.map(tileKey).sort());

  const one = sprawled([...hillsBut([DRY]), [DRY, { terrain: 'forest' }]]);
  const none = sprawled(hillsBut([]));

  expect(terrainOf(one.left, DRY)).toBe('urban');
  expect(namesOf(one.held)).toEqual(['retiled']);
  expect(one.left.rng).toEqual(steppedBy(one.city.rng, 1));
  expect(none.held).toEqual([]);
  expect(none.left.tiles).toEqual(none.city.tiles);
  expect(none.left.rng).toEqual(none.city.rng);
});

/** How far from the city the tile the herd is dealt onto lies in the tests below: out of its sight. */
const HERD = 3;

/**
 * A city on a disc of plain out to five, forest on the named tiles, every plain carrying a feature
 * already but the named ones, dealt the fixture's herd at the end of its turn.
 */
function herded(open: TileCoords[], carrying: Carrying = {}, forest: TileCoords[] = []): Chronicle {
  const wanted = new Set([CITY, ...open, ...forest].map(tileKey));
  const covered = field(5).filter((tile) => !wanted.has(tileKey(tile)));
  return cityOf(['urban'], {
    ...dueOn(2, 'PH_Herd'),
    drawPile: fullDraw(),
    tiles: featured(madeOf(field(5), 'forest', forest), 'PH_Fertile', covered),
    ...carrying,
  });
}

/** The city one end of turn on with the herd standing, and the chronicle its first answer taken leaves. */
function followed(city: Chronicle): { dealt: Chronicle; landed: Chronicle } {
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  if (dealt.deals.length === 0) throw new Error('the herd is not dealt');
  return { dealt, landed: outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 })) };
}

function featureOf(chronicle: Chronicle, at: TileCoords): FeatureId | undefined {
  return tileAt(chronicle.tiles, at)?.feature;
}

function snapshotOf(chronicle: Chronicle, at: TileCoords): Snapshot | undefined {
  return chronicle.snapshots.find((kept) => tileKey(kept) === tileKey(at));
}

test('a feature is dealt onto a tile carrying none, of a terrain one of the features named lies on, drawn near the city in one step of the seeded generator — each tile the likelier the nearer it lies, and the twelve a tile further together likelier than the one — the feature the one its terrain carries, and no other tile changes', () => {
  const single = { q: 1, r: 0 };
  const ring = field(2)
    .filter((tile) => distance(tile, CITY) === 2)
    .map(({ q, r }) => ({ q, r }));
  const forest = ring.filter((_, at) => at % 2 === 0);
  const open = [single, ...ring.filter((_, at) => at % 2 === 1)];
  const dealtOn = new Map<string, number>();

  for (const seed of MANY_SEEDS) {
    const { dealt, landed } = followed(herded(open, { rng: seedRng(seed) }, forest));
    const [gained, ...others] = [single, ...ring].filter(
      (tile) => featureOf(landed, tile) !== undefined,
    );
    const key = tileKey(gained);
    const wooded = forest.some((tile) => tileKey(tile) === key);

    expect(others).toEqual([]);
    expect(featureOf(landed, gained)).toBe(wooded ? 'PH_Game' : 'PH_Fertile');
    expect(landed.rng).toEqual(nextRng(dealt.rng).rng);
    expect(landed.tiles.filter((tile) => tileKey(tile) !== key)).toEqual(
      dealt.tiles.filter((tile) => tileKey(tile) !== key),
    );
    dealtOn.set(key, (dealtOn.get(key) ?? 0) + 1);
  }
  const onSingle = dealtOn.get(tileKey(single)) ?? 0;
  const onRing = ring.map((tile) => dealtOn.get(tileKey(tile)) ?? 0);

  for (const count of onRing) {
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(onSingle);
  }
  expect(onRing.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(onSingle);
});

test('a draw near the city lands on no tile the neutral holds, however near, and on a tile nobody holds, however far', () => {
  const far = { q: -3, r: 0 };
  const bare = new Set([NEUTRAL_TILE, far].map(tileKey));
  const ground = plains(3).map((tile) =>
    bare.has(tileKey(tile)) ? tile : { ...tile, feature: 'PH_Fertile' },
  );
  const opened = besideTheNeutral(dealing({ turn: 1, event: 'PH_Herd' }), ground);

  expect(opened.deals).toEqual([{ of: 'event', event: 'PH_Herd' }]);
  expect(opened.neutral?.held.map(tileKey)).toContain(tileKey(NEUTRAL_TILE));
  for (const seed of SEEDS) {
    const dealt = { ...opened, rng: seedRng(seed) };
    const landed = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

    expect(featureOf(landed, NEUTRAL_TILE)).toBeUndefined();
    expect(featureOf(landed, far)).toBe('PH_Fertile');
  }
});

test('a camp is never placed on a tile the neutral holds, however near, but on a tile nobody holds further out, and an answer placing one is blocked where only the neutral’s tiles would take it', () => {
  const corridor = Array.from({ length: 6 }, (_, q) => ({ q, r: 0 }));
  const [far] = corridor.slice(-1);
  const opened = besideTheNeutral(
    dealing({ turn: 1, event: 'PH_Rivals' }),
    deepBut(plains(5), corridor),
  );
  const bordering = (tiles: readonly TileCoords[]): Chronicle =>
    tiles.reduce((chronicle, at) => bordered(chronicle, 'neutral', at).chronicle, opened);
  const near = bordering([
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ]);
  const walled = bordering([{ q: 3, r: 0 }, { q: 4, r: 0 }, far]);

  expect(opened.deals).toEqual([{ of: 'event', event: 'PH_Rivals' }]);
  for (const seed of SEEDS) {
    const landed = outcome(
      apply(CATALOGUE, { ...near, rng: seedRng(seed) }, { type: 'take', at: 0 }),
    );

    expect(campsOf(landed)).toEqual([far]);
    expect(holderOf(landed, far)).toBeUndefined();
  }
  expect(answerRefusal(CATALOGUE, walled, 'PH_Rivals', 'PH_Encampment')).toEqual({
    unaffordable: [],
    blocked: ['no-camp-tile'],
  });
});

test('a feature dealt where no tile of a terrain one of the features named lies on carries none is a runtime error, and draws nothing', () => {
  const covered = field(5).filter((tile) => tileKey(tile) !== tileKey(CITY));
  const dealt = outcome(
    apply(
      CATALOGUE,
      cityOf(['urban'], {
        ...dueOn(2, 'PH_Herd'),
        drawPile: fullDraw(),
        tiles: featured(field(5), 'PH_Fertile', covered),
      }),
      { type: 'end-turn' },
    ),
  );
  const landed = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Herd' }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'runtime-error']);
  expect(landed.tiles).toEqual(dealt.tiles);
  expect(landed.rng).toEqual(dealt.rng);
});

test('a tile whose feature a card removed is dealt that feature again by an answer, and stands as it stood before the removal', () => {
  const at = { q: HERD, r: 0 };
  const city = herded([], { hand: ['PH_Hunt'], units: [worker(at)] });

  const hunted = outcome(apply(CATALOGUE, city, aimedAt(at)));
  const { landed } = followed(hunted);

  expect(featureOf(city, at)).toBe('PH_Fertile');
  expect(featureOf(hunted, at)).toBeUndefined();
  expect(tileAt(landed.tiles, at)).toEqual(tileAt(city.tiles, at));
});

test('a tile an answer charts is charted where it was not, its snapshot holding what the answer dealt onto it and whoever stands on it, and it is in fog as the answer lands', () => {
  const at = { q: HERD, r: 0 };
  const { dealt, landed } = followed(herded([at], { units: [standing('enemy', at, {}, 0, 0)] }));
  const snapshot = snapshotOf(landed, at);

  expect(chartedTile(dealt, at)).toBe('tile-uncharted');
  expect(chartedTile(landed, at)).toBeUndefined();
  expect(inSight(CATALOGUE, landed).has(tileKey(at))).toBe(false);
  expect(snapshot?.tile.feature).toBe('PH_Fertile');
  expect(snapshot?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy', embarked: false });
});

test('a tile an answer charts that was charted before holds what the answer dealt onto it and whoever stands on it, over the snapshot it had', () => {
  const at = { q: HERD, r: 0 };
  const seen = chartedAt(CATALOGUE, herded([at]), at);
  const { dealt, landed } = followed(withUnits(seen, [standing('enemy', at, {}, 0, 0)]));

  expect(snapshotOf(dealt, at)).toBeDefined();
  expect(snapshotOf(dealt, at)?.tile.feature).toBeUndefined();
  expect(snapshotOf(dealt, at)?.unit).toBeUndefined();
  expect(snapshotOf(landed, at)?.tile.feature).toBe('PH_Fertile');
  expect(snapshotOf(landed, at)?.unit).toEqual({
    type: 'PH_Warrior',
    faction: 'enemy',
    embarked: false,
  });
  expect(inSight(CATALOGUE, landed).has(tileKey(at))).toBe(false);
});

test('a tile an answer charted stays charted as it was then, and in fog, through the commands and the turns that follow, where nothing sees it', () => {
  const at = { q: HERD, r: 0 };
  const { landed } = followed(herded([at]));
  const fogged = (chronicle: Chronicle): void => {
    expect(inSight(CATALOGUE, chronicle).has(tileKey(at))).toBe(false);
    expect(chartedTile(chronicle, at)).toBeUndefined();
    expect(snapshotOf(chronicle, at)?.tile.feature).toBe('PH_Fertile');
  };

  let later = outcome(apply(CATALOGUE, landed, assignTo(CITY)));
  fogged(later);
  for (let turns = 0; turns < 3; turns++) {
    later = outcome(apply(CATALOGUE, later, { type: 'end-turn' }));
    fogged(later);
  }
  expect(later.turn).toBe(landed.turn + 3);
});

test('a landing resolves as one stage per change it makes, in the order it makes them, each carrying the tile it landed on', () => {
  const city = cityOf(['urban'], { ...NO_GROWTH, tiles: field(6), ...dueOn(2, 'PH_Rivals') });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const [answer, , built, ...entered] = stagesWalked(
    apply(CATALOGUE, dealt, { type: 'take', at: 0 }),
  );
  const [camp] = campsOf(built.chronicle);

  expect([answer, built, ...entered].map((stage) => stage.name)).toEqual([
    'answer',
    'retiled',
    ...Array<string>(ENCAMPED).fill('enter'),
  ]);
  expect(built).toMatchObject({ tile: camp });
  expect(campsOf(dealt)).toEqual([]);
  expect(enemiesOf(built.chronicle)).toEqual([]);
  for (const [at, entering] of entered.entries()) {
    const enemies = enemiesOf(entering.chronicle);
    expect(enemies).toHaveLength(at + 1);
    expect(entering).toMatchObject({ tile: enemies[at].tile });
  }
});

test('a tile a landing charts is charted as the stage charting it stands', () => {
  const at = { q: HERD, r: 0 };
  const city = herded([at], { units: [standing('enemy', at, {}, 0, 0)] });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const stages = apply(CATALOGUE, dealt, { type: 'take', at: 0 });
  const [, , retiled, charting] = stagesWalked(stages);

  expect(namesOf(stages)).toEqual(['answer', 'taken', 'retiled', 'charted']);
  expect(retiled).toMatchObject({ tile: at });
  expect(charting).toMatchObject({ tile: at });
  expect(snapshotOf(retiled.chronicle, at)).toBeUndefined();
  expect(snapshotOf(charting.chronicle, at)?.tile.feature).toBe('PH_Fertile');
  expect(snapshotOf(charting.chronicle, at)?.unit).toEqual({
    type: 'PH_Warrior',
    faction: 'enemy',
    embarked: false,
  });
  expect(inSight(CATALOGUE, charting.chronicle).has(tileKey(at))).toBe(false);
});

/** The turn the capstone lands on in every fixture below. */
const CAPSTONE = 30;

/** How many turns follow the siege's landing up to its last: the tick past that one passes the fixture's siege. */
const AFTER_LANDING = 5;

/** This timeline, dealing nothing unless the test names one, with the siege landing on its turn. */
function besieging(timeline: Timeline = NO_DEALS): Timeline {
  return { ...timeline, capstone: { id: 'PH_Siege', turn: CAPSTONE } };
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
    .filter((tile) => tile.building === CAMP.building)
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
 * The disc with water around the city: no ground runs to it, so the siege places no camp of its own
 * and its landing there is a `runtime-error`.
 */
const MOATED = field(6, neighbours(CITY));

/** The moated city with the siege landed on it. */
function moated(carrying: Carrying = {}): Chronicle {
  return siegeLanded({ tiles: MOATED, ...carrying });
}

/** That city ending turn after turn until the tick past the siege's last turn passes it: the chronicle it left. */
function stoodOut(): Chronicle {
  let standingOut = moated();
  for (let turn = 0; turn <= AFTER_LANDING; turn++)
    standingOut = endedTurn(standingOut, 'PH_Famine');
  return standingOut;
}

test('the capstone’s turn draws the hand and lands the capstone straight on it, dealing nothing, whatever deal was due on that turn', () => {
  const due = dueOn(CAPSTONE);
  for (const carrying of [
    { timeline: besieging() },
    { age: due.age, timeline: besieging(due.timeline) },
  ]) {
    const awaited = awaitingCapstone({ ...carrying, drawPile: fullDraw() });
    const landed = outcome(apply(CATALOGUE, awaited, { type: 'end-turn' }));
    const staged = stagedBy(awaited, { type: 'end-turn' });

    expect(landed.deals).toEqual([]);
    expect(landed.turn).toBe(CAPSTONE);
    expect(idsOf(landed.hand)).toEqual(fullDraw());
    expect(campsOf(landed)).toHaveLength(5);
    expect(staged.slice(staged.indexOf('turn'))).toEqual([
      'turn',
      'turn',
      'drawn',
      'capstone-landing',
      'rolled',
      ...Array<string>(5).fill('retiled'),
      ...Array<string>(5).fill('enter'),
    ]);
  }
});

test('the capstone’s turn drops a deal due past it, and the next deal is due three to seven turns after the landing', () => {
  const landed = moated({ age: AGE, timeline: { ...besieging(), next: CAPSTONE + 1 } });
  const walk = walkedFrom(CATALOGUE, landed, CAPSTONE + 2, 'PH_Famine');
  const { next } = landed.timeline;

  expect(walk.landings).toEqual([]);
  expect(next).toBeGreaterThanOrEqual(CAPSTONE + 3);
  expect(next).toBeLessThanOrEqual(CAPSTONE + 7);
});

test('the capstone’s turn is one landing group over the next due turn rolled and the landing', () => {
  const awaited = awaitingCapstone({ drawPile: fullDraw() });

  const landing = heldBy(apply(CATALOGUE, awaited, { type: 'end-turn' }), 'capstone-landing');
  const [rolled, ...landed] = landing;

  expect(rolled.name).toBe('rolled');
  expect(rolled.chronicle.timeline.next).toBeGreaterThan(CAPSTONE);
  expect(campsOf(rolled.chronicle)).toEqual([]);
  expect(landed.map(({ name }) => name)).toEqual([
    ...Array<string>(5).fill('retiled'),
    ...Array<string>(5).fill('enter'),
  ]);
});

test('a capstone carrying no second script stages no second-script group on the turns after its own', () => {
  const tilled = awaitingTillage();
  const landed = endedTurn(tilled);

  expect(stagedBy(tilled, { type: 'end-turn' })).toContain('capstone-landing');
  expect(landed.turn).toBe(CAPSTONE);
  expect(stagedBy(landed, { type: 'end-turn' })).not.toContain('capstone-continued');
});

test('the capstone’s landing is a stage of its own on its turn, even where it lands nothing', () => {
  const quiet: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Siege: { lands: (_c, chronicle) => unchanged(chronicle), count: () => 0, need: 1 },
    },
  };
  const awaited = awaitingCapstone({ drawPile: fullDraw() });
  const staged = namesOf(apply(quiet, awaited, { type: 'end-turn' }));

  expect(staged.slice(staged.indexOf('turn'))).toEqual([
    'turn',
    'turn',
    'drawn',
    'capstone-landing',
    'rolled',
  ]);
});

test('a schedule naming two capstones draws each of them at the launch, and the one drawn is the one that lands on its turn', () => {
  const drawn = SEEDS.map(
    (seed) => launched(CATALOGUE, QUIET, REGION, seed, CIVILIZATION, []).chronicle.timeline,
  );
  const besieged = drawn.map(
    (timeline) =>
      campsOf(
        endedTurn(awaitingCapstone({ age: QUIET, timeline, turn: timeline.capstone.turn - 1 })),
      ).length > 0,
  );

  expect(new Set(drawn.map(({ capstone }) => capstone.id))).toEqual(
    new Set(['PH_Siege', 'PH_Tillage']),
  );
  expect(besieged).toEqual(drawn.map(({ capstone }) => capstone.id === 'PH_Siege'));
});

test('a camp captured the turn before the capstone’s deals its rewards, and the take opens the capstone’s turn on the draw and its landing', () => {
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

  expect(dealt.deals).toEqual([{ of: 'capture', building: CAMP.building, rewards: CAMP.rewards }]);
  expect(dealt.turn).toBe(CAPSTONE - 1);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual([
    'reward',
    'taken',
    'added',
    'turn',
    'turn',
    'drawn',
    'capstone-landing',
    'rolled',
    ...campsOf(taken).map(() => 'retiled'),
    ...campsOf(taken).map(() => 'enter'),
  ]);
  expect(taken.turn).toBe(CAPSTONE);
  expect(taken.deals).toEqual([]);
  expect(idsOf(taken.hand)).toEqual(fullDraw());
  expect(campsOf(taken)).not.toEqual([]);
});

test('a camp captured on the siege’s last turn holds the victory back until its reward is taken', () => {
  const camp = { q: 4, r: 0 };
  const last = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(6), [camp]),
    units: [worker(camp)],
    turn: CAPSTONE + AFTER_LANDING,
    timeline: besieging(),
  });
  const dealt = outcome(apply(CATALOGUE, last, { type: 'end-turn' }));

  expect(stagedBy(last, { type: 'end-turn' })).not.toContain('ended');
  expect(dealt.ending).toBeUndefined();
  expect(dealt.deals).toEqual([{ of: 'capture', building: CAMP.building, rewards: CAMP.rewards }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual([
    'reward',
    'taken',
    'added',
    'turn',
    'turn',
    'ended',
  ]);
  expect(outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 })).ending).toEqual({
    outcome: 'victory',
    turn: CAPSTONE + AFTER_LANDING + 1,
  });
});

test('a capture after which a capstone’s count meets its need ends the chronicle on the capture, its rewards never dealt', () => {
  const camp = { q: 4, r: 0 };
  const campsRemoved: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Siege: {
        lands: (_c, chronicle) => unchanged(chronicle),
        count: (catalogue, chronicle) =>
          chronicle.tiles.every(
            (tile) => tile.building !== ageOf(catalogue, chronicle.age).camp.building,
          )
            ? 1
            : 0,
        need: 1,
      },
    },
  };
  const last = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(6), [camp]),
    units: [worker(camp)],
    turn: CAPSTONE,
    timeline: besieging(),
  });
  const stages = apply(campsRemoved, last, { type: 'end-turn' });

  expect(heldBy(stages, 'capture').map(({ name }) => name)).toEqual(['retiled', 'ended']);
  expect(namesOf(stages).slice(-3)).toEqual(['capture', 'retiled', 'ended']);
  expect(outcome(stages).deals).toEqual([]);
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
});

test('the siege places five camps near the city, three tiles from it or further, apart from one another, a warrior on each', () => {
  const after = siegeLanded();
  const camps = campsOf(after);
  const warriors = enemiesOf(after);

  expect(camps).toHaveLength(5);
  for (const [at, camp] of camps.entries()) {
    expect(distance(camp, CITY)).toBeGreaterThanOrEqual(3);
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

test('the siege places no camp the city holds, a unit stands on, a building fills, or a camp stands near, and its landing there is a runtime error', () => {
  const reach = [
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const near = { q: 5, r: 0 };
  const carryings: Carrying[] = [
    { held: [CITY, ...reach] },
    { units: reach.map(worker) },
    { tiles: builtOn(only(6, CORRIDOR), 'PH_Farm', reach) },
    { tiles: camped(only(6, [...CORRIDOR, near]), [near]) },
  ];
  const none: Chronicle[] = [];

  for (const carrying of carryings) {
    const stages = apply(CATALOGUE, awaitingCapstone({ tiles: only(6, CORRIDOR), ...carrying }), {
      type: 'end-turn',
    });
    const after = outcome(stages);
    none.push(after);

    expect(heldBy(stages, 'capstone-landing').map(({ name }) => name)).toEqual([
      'rolled',
      'runtime-error',
    ]);
    expect(enemiesOf(after)).toEqual([]);
  }
  expect(campsOf(none[3])).toEqual([near]);
  for (const after of none.slice(0, 3)) expect(campsOf(after)).toEqual([]);
});

test('the siege places no camp on ground a camp does not lie on, or the city is not walked to, and its landing there is a runtime error', () => {
  const reach = [
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const land = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, ...reach];
  const rough = awaitingCapstone({ tiles: madeOf(only(6, land), 'mountain', reach) });
  const moat = awaitingCapstone({ tiles: only(6, [CITY, ...reach]) });

  for (const awaited of [rough, moat]) {
    const stages = apply(CATALOGUE, awaited, { type: 'end-turn' });
    const after = outcome(stages);

    expect(heldBy(stages, 'capstone-landing').map(({ name }) => name)).toEqual([
      'rolled',
      'runtime-error',
    ]);
    expect(campsOf(after)).toEqual([]);
    expect(enemiesOf(after)).toEqual([]);
  }
});

test('the turn ticking past the siege’s sixth with the city standing ends the chronicle in victory on the tick', () => {
  let besieged = moated();

  for (let turn = 1; turn <= AFTER_LANDING; turn++) {
    besieged = endedTurn(besieged, 'PH_Famine');
    expect(besieged.turn).toBe(CAPSTONE + turn);
    expect(besieged.ending).toBeUndefined();
  }
  const stages = apply(CATALOGUE, besieged, { type: 'end-turn' });
  const staged = namesOf(stages);
  const survived = stoodOut();

  expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'turn', 'ended']);
  expect(heldBy(stages, 'turn').map(({ name }) => name)).toEqual(['turn', 'ended']);
  expect(survived.turn).toBe(CAPSTONE + AFTER_LANDING + 1);
  expect(survived.ending).toEqual({ outcome: 'victory', turn: CAPSTONE + AFTER_LANDING + 1 });
});

test('a chronicle that ended in victory takes no command at all', () => {
  const survived = stoodOut();
  const refused: Command[] = [{ type: 'end-turn' }, assignTo(CITY)];

  expect(stagedBy(moated(), assignTo(CITY))).toEqual(['assign', 'assigned']);
  for (const command of refused) {
    expect(stagedBy(survived, command)).toEqual(['refused']);
    expect(outcome(apply(CATALOGUE, survived, command))).toBe(survived);
  }
});

/** The tile of the ring the tillage's building stands on once a fixture puts it there. */
const TILLED: TileCoords = { q: 1, r: 0 };

/**
 * A city holding the ring around it, standing on the turn before the tillage lands: a capstone that
 * lands nothing and is passed once its building stands on a tile the city holds.
 */
function awaitingTillage(carrying: Carrying = {}): Chronicle {
  return ringed(2, {
    turn: CAPSTONE - 1,
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: CAPSTONE } },
    ...carrying,
  });
}

/**
 * What a city carries to build the tillage's building: a worker on the tilled tile, the farm card
 * coming around to the hand, and the production to pay for it.
 */
const FARMING: Carrying = {
  units: [worker(TILLED)],
  drawPile: ['PH_Farm'],
  resources: { food: 0, production: 99, military: 0, money: 0, science: 0, culture: 0 },
};

/** The chronicle with the farm card in its hand played on the tilled tile. A refused play throws. */
function tilled(chronicle: Chronicle): Chronicle {
  const play: Command = {
    type: 'play',
    index: idsOf(chronicle.hand).indexOf('PH_Farm'),
    aim: 'tile',
    tile: TILLED,
  };
  const played = outcome(apply(CATALOGUE, chronicle, play));
  if (played === chronicle) throw new Error('the farm is refused on the tilled tile');
  return played;
}

/** The farm card played on the tilled tile: what a play of it resolves as. */
function tilling(chronicle: Chronicle): Command {
  return {
    type: 'play',
    index: idsOf(chronicle.hand).indexOf('PH_Farm'),
    aim: 'tile',
    tile: TILLED,
  };
}

test('a building that passes a capstone ends the chronicle in victory on the play that builds it, the landing turn included', () => {
  const landed = endedTurn(awaitingTillage(FARMING));
  let later = landed;
  for (let turn = 1; turn <= 3; turn++) {
    later = endedTurn(later);
    expect(later.ending).toBeUndefined();
  }

  for (const [chronicle, turn] of [
    [landed, CAPSTONE],
    [later, CAPSTONE + 3],
  ] as const) {
    const stages = apply(CATALOGUE, chronicle, tilling(chronicle));

    expect(chronicle.ending).toBeUndefined();
    expect(namesOf(stages)).toEqual([
      'played',
      'exhausted',
      'stock',
      'action-spent',
      'retiled',
      'ended',
    ]);
    expect(buildingAt(outcome(stages), TILLED)).toBe(TILLAGE);
    expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn });
  }
});

test('a capstone’s count meeting its need partway through a play ends the chronicle there, and the rest of the card never resolves', () => {
  const spent: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Tillage: {
        lands: (_c, chronicle) => unchanged(chronicle),
        count: (_c, chronicle) => chronicle.units.filter((unit) => unit.action === 0).length,
        need: 1,
      },
    },
  };
  const landed = endedTurn(awaitingTillage(FARMING), undefined, spent);
  const stages = apply(spent, landed, tilling(landed));

  expect(namesOf(stages)).toEqual(['played', 'exhausted', 'stock', 'action-spent', 'ended']);
  expect(buildingAt(outcome(stages), TILLED)).toBeUndefined();
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
});

test('a capstone’s count meeting its need before the capstone lands ends the chronicle on the landing, the tick, the draw and the roll reading nothing', () => {
  const tilledEarly = tilled(
    awaitingTillage({
      ...FARMING,
      turn: CAPSTONE - 2,
      drawPile: [...fullDraw(), ...fullDraw()],
      hand: ['PH_Farm'],
    }),
  );
  expect(buildingAt(tilledEarly, TILLED)).toBe(TILLAGE);

  const awaited = endedTurn(tilledEarly);
  expect(awaited.turn).toBe(CAPSTONE - 1);
  expect(awaited.ending).toBeUndefined();

  const stages = apply(CATALOGUE, awaited, { type: 'end-turn' });
  const staged = namesOf(stages);

  expect(staged.slice(staged.indexOf('turn'))).toEqual([
    'turn',
    'turn',
    'drawn',
    'capstone-landing',
    'rolled',
    'ended',
  ]);
  expect(idsOf(outcome(stages).hand)).toEqual(fullDraw());
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
});

test('a change that both leaves the city no population and brings a capstone’s count to its need ends the chronicle in victory', () => {
  const emptied: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Tillage: {
        lands: (_c, chronicle) => unchanged(chronicle),
        count: (_c, chronicle) => (chronicle.population === 0 ? 1 : 0),
        need: 1,
      },
    },
  };
  const city = cityOf(['urban'], {
    hand: ['PH_Hunger'],
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } },
  });
  const stages = apply(emptied, city, { type: 'end-turn' });

  expect(namesOf(stages).slice(-3)).toEqual(['assigned', 'population', 'ended']);
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: 1 });
});

/**
 * The tillage's city on the turn before the tower lands, the tillage's building standing on the
 * tilled tile with a worker on it, and the production to play on it.
 */
function awaitingTower(carrying: Carrying = {}): Chronicle {
  return awaitingTillage({
    tiles: builtOn(field(2), TILLAGE, [TILLED]),
    timeline: { ...NO_DEALS, capstone: { id: TOWER, turn: CAPSTONE } },
    ...FARMING,
    drawPile: [],
    ...carrying,
  });
}

/** The card in the chronicle's hand played on the tilled tile. */
function playedOnTilled(chronicle: Chronicle, card: string): Command {
  return { type: 'play', index: idsOf(chronicle.hand).indexOf(card), aim: 'tile', tile: TILLED };
}

test('a capstone naming what fails it ends the chronicle in defeat on the change after which it holds, from its landing on: a building it names removed, never before the landing, and never the next built over it', () => {
  const before = awaitingTower({ hand: ['PH_Urbanisation'] });
  const early = outcome(apply(CATALOGUE, before, playedOnTilled(before, 'PH_Urbanisation')));
  const landed = endedTurn(awaitingTower({ drawPile: ['PH_Urbanisation', SILO] }));
  const removed = apply(CATALOGUE, landed, playedOnTilled(landed, 'PH_Urbanisation'));
  const builtOver = apply(CATALOGUE, landed, playedOnTilled(landed, SILO));

  expect(buildingAt(early, TILLED)).toBeUndefined();
  expect(early.ending).toBeUndefined();
  expect(namesOf(removed).slice(-2)).toEqual(['retiled', 'ended']);
  expect(outcome(removed).ending).toEqual({ outcome: 'defeat', cause: 'capstone', turn: CAPSTONE });
  expect(buildingAt(outcome(builtOver), TILLED)).toBe(SILO);
  expect(namesOf(builtOver)).not.toContain('ended');
});

test('the schedule keeps dealing past the landing of a capstone no span passes', () => {
  const start = fed(
    awaitingTillage({
      age: AGE,
      timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: CAPSTONE } },
    }),
  );
  const { chronicle, landings } = walkedFrom(CATALOGUE, start, CAPSTONE + 40, 'PH_Famine');
  const dealt = landings.filter((landing) => landing.event !== undefined);

  expect(chronicle.ending).toBeUndefined();
  expect(landings[0]).toEqual({ turn: CAPSTONE });
  expect(dealt.length).toBeGreaterThan(4);
  expect(dealt[dealt.length - 1].turn).toBeGreaterThan(CAPSTONE + 30);
});

test('a card showing the turn of the next landing shows the next due turn, and is refused while that turn is shown and played again once it has come', () => {
  const city = cityOf(['urban'], {
    ...dealing({ turn: 3, event: 'PH_Exodus' }),
    hand: ['PH_Almanac', 'PH_Almanac'],
    drawPile: ['PH_Almanac'],
  });
  const shown = outcome(apply(CATALOGUE, city, PLAYED));
  const next = endedTurn(shown, 'PH_Stay');
  const due = endedTurn(next, 'PH_Stay');

  expect(turnShown(city)).toBeUndefined();
  expect(turnShown(shown)).toBe(city.timeline.next);
  expect(shown.timeline).toEqual(city.timeline);
  expect(refusalOf(CATALOGUE, shown, 'PH_Almanac').blocked).toEqual(['turn-shown']);
  expect(stagedBy(shown, PLAYED)).toEqual(['refused']);
  expect(next.turn).toBe(city.turn + 1);
  expect(refusalOf(CATALOGUE, next, 'PH_Almanac').blocked).toEqual(['turn-shown']);
  expect(due.turn).toBe(city.timeline.next);
  expect(turnShown(due)).toBeUndefined();
  expect(refusalOf(CATALOGUE, due, 'PH_Almanac').blocked).toEqual([]);
  expect(turnShown(outcome(apply(CATALOGUE, due, PLAYED)))).toBeGreaterThan(due.turn);
});

test('a card showing the turn of the next landing shows the capstone’s where it lands before the next due turn, and the due turn once the capstone has landed', () => {
  const capstone = 3;
  const city = cityOf(['urban'], {
    timeline: { ...NO_DEALS, next: capstone + 2, capstone: { id: 'PH_Tillage', turn: capstone } },
    hand: ['PH_Almanac'],
    drawPile: ['PH_Almanac'],
  });
  const shown = outcome(apply(CATALOGUE, city, PLAYED));
  const landed = endedTurn(endedTurn(shown));
  const after = outcome(apply(CATALOGUE, landed, PLAYED));

  expect(turnShown(shown)).toBe(capstone);
  expect(landed.turn).toBe(capstone);
  expect(landed.timeline.next).toBeGreaterThan(capstone);
  expect(turnShown(after)).toBe(landed.timeline.next);
});
