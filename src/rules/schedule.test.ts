import { expect, test } from 'vitest';
import { chartedTile } from './cards';
import { type Catalogue, catalogued, eventOf } from './catalogue';
import { apply, type Command, launched, outcome } from './chronicle';
import { growthThreshold } from './city';
import {
  AMBUSH,
  assignTo,
  buildingAt,
  builtOn,
  CAMPS,
  CATALOGUE,
  type Carrying,
  CITY,
  camped,
  cityOf,
  DECK,
  dealing,
  ENCAMPED,
  EXPLOSION,
  endedTurn,
  enemiesOf,
  FIRE,
  field,
  fullDraw,
  HERD,
  heldBy,
  madeOf,
  NO_DEALS,
  NO_GROWTH,
  namesOf,
  only,
  opening,
  plains,
  REGION,
  ringed,
  SCHEDULE,
  type Standing,
  settledOn,
  stagedBy,
  standing,
  TILLAGE,
  UPHEAVAL,
  WARY,
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
import { nextRng, seedRng } from './rng';
import { offered } from './schedule';
import { chartedAt, inSight } from './sight';
import { type Stage, walked as stagesWalked, unchanged } from './stages';
import { type Chronicle, idle, type Snapshot, type Timeline } from './state';
import { unitAt } from './units';

/** The seeds a test over a whole walk runs: enough of them for both orders to be drawn. */
const SEEDS: readonly number[] = Array.from({ length: 40 }, (_, at) => at + 1);

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
      if (name === 'capstone' && left.turn === left.timeline.capstone.turn) {
        landings.push({ turn: left.turn });
      }
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

const walks = new Map<string, Walk>();

/**
 * A chronicle launched on the fixture's schedule from a seed, settled on the centre tile, and walked
 * to the fortieth turn.
 */
function walked(seed: number, wanted = 'PH_Famine'): Walk {
  const key = `${seed} ${wanted}`;
  const known = walks.get(key);
  if (known !== undefined) return known;
  const settled = settledOn(launched(CATALOGUE, REGION, SCHEDULE, seed, DECK), CITY);
  const walk = walkedFrom(CATALOGUE, settled, 40, wanted);
  walks.set(key, walk);
  return walk;
}

/** The food stock a city waiting on an event holds: its one tile yields none, so only a famine moves it. */
const STOCKED = 5;

/** A timeline dealing the hardship, its raid first and its famine second, on that turn and on no other. */
function dueOn(turn: number, event = 'PH_Hardship'): Timeline {
  return dealing({ turn, event });
}

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
    (seed) => launched(CATALOGUE, REGION, SCHEDULE, seed, DECK).timeline.capstone.turn,
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

test('a raid enters one warrior, and one more for every ten turns', () => {
  const raiders = (due: number): number[] =>
    SEEDS.map(
      (seed) => enemiesOf(endedTurn(awaiting(due, { rng: seedRng(seed) }), 'PH_Raid')).length,
    );

  for (let due = 3; due <= 9; due++) expect([...new Set(raiders(due))]).toEqual([1]);
  for (let due = 20; due <= 29; due++) expect([...new Set(raiders(due))]).toEqual([3]);
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
  expect(staged.slice(-3)).toEqual(['deal', 'rolled', 'dealt']);
  expect(staged).not.toContain('drawn');
});

/** A timeline of that schedule from a seed due on the second turn, and the hunger among the cards or not. */
function spoiling(schedule: string, seed: number, hungry: boolean): Carrying {
  return {
    timeline: { ...NO_DEALS, schedule, rng: seedRng(seed), next: 2 },
    drawPile: hungry ? ['PH_Hunger', ...fullDraw()] : fullDraw(),
  };
}

test('an event whose need the chronicle does not meet is never dealt while another can be, and one whose need it meets is dealt as any', () => {
  const dealtOn = (hungry: boolean): string[] => [
    ...new Set(
      SEEDS.map((seed) => {
        const [deal] = dealtBy(2, spoiling(WARY, seed, hungry)).deals;
        return deal?.of === 'event' ? deal.event : 'nothing';
      }),
    ),
  ];

  expect(dealtOn(false)).toEqual(['PH_Hardship']);
  expect(dealtOn(true).sort()).toEqual(['PH_Hardship', 'PH_Spoilage']);
});

test('a due turn no event’s need lets deal on deals nothing, and leaves the timeline where a deal leaves it', () => {
  const end: Command = { type: 'end-turn' };
  const unmet = awaiting(2, spoiling('PH_Spoilage', 7, false));
  const met = awaiting(2, spoiling('PH_Spoilage', 7, true));
  const passed = outcome(apply(CATALOGUE, unmet, end));
  const dealt = outcome(apply(CATALOGUE, met, end));

  expect(heldBy(apply(CATALOGUE, unmet, end), 'deal').map(({ name }) => name)).toEqual([
    'rolled',
    'runtime-error',
  ]);
  expect(heldBy(apply(CATALOGUE, met, end), 'deal').map(({ name }) => name)).toEqual([
    'rolled',
    'dealt',
  ]);
  expect(stagedBy(unmet, end)).toContain('drawn');
  expect(passed.turn).toBe(2);
  expect(passed.deals).toEqual([]);
  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Spoilage' }]);
  expect(passed.timeline).toEqual(dealt.timeline);
  expect(passed.timeline.rng).not.toEqual(unmet.timeline.rng);
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

test('a due turn weighing no entry above nought is a deal over the roll and a runtime error, and play goes on to the next due turn, which deals as any', () => {
  const late: Catalogue = catalogued({
    ...CATALOGUE,
    schedules: {
      ...CATALOGUE.schedules,
      late: {
        ...CATALOGUE.schedules.quiet,
        entries: { PH_Hardship: (turn) => (turn >= 3 ? 1 : 0) },
      },
    },
  });
  const city = awaiting(2, {
    drawPile: [...fullDraw(), ...fullDraw()],
    timeline: { ...NO_DEALS, schedule: 'late', next: 2 },
  });

  const stages = apply(late, city, { type: 'end-turn' });
  const passed = outcome(stages);

  expect(heldBy(stages, 'deal').map(({ name }) => name)).toEqual(['rolled', 'runtime-error']);
  expect(passed.turn).toBe(2);
  expect(passed.deals).toEqual([]);
  expect(passed.hand).toHaveLength(5);
  expect(passed.timeline.next).toBeGreaterThanOrEqual(2 + 3);
  expect(passed.timeline.next).toBeLessThanOrEqual(2 + 7);

  let walking = passed;
  while (walking.turn < passed.timeline.next - 1) walking = endedTurn(walking, undefined, late);
  const due = apply(late, walking, { type: 'end-turn' });

  expect(heldBy(due, 'deal').map(({ name }) => name)).toEqual(['rolled', 'dealt']);
  expect(outcome(due).deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
});

test('an answer taken is one answer group over the deal taken, its cost as one stock, and its landing', () => {
  const rich = dealtBy(5, {
    timeline: dueOn(5, 'PH_Blight'),
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
  expect(enduring.map(({ name }) => name)).toEqual(['taken', 'laid']);
});

test('a reward taken is one reward group over the deal taken and the card discarded', () => {
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

  const [taken, discarded, ...rest] = heldBy(
    apply(CATALOGUE, dealt, { type: 'take', at: 0 }),
    'reward',
  );

  expect([taken.name, discarded.name]).toEqual(['taken', 'discarded']);
  expect(rest).toEqual([]);
  expect(taken.chronicle.deals).toEqual([]);
  expect(taken.chronicle.discardPile).toEqual([]);
  expect(discarded.chronicle.discardPile).toEqual([CATALOGUE.camp.rewards[0]]);
});

test('the same seed is due on the same turns whatever answers are taken, though what they let be dealt differs', () => {
  let differs = false;
  for (const seed of SEEDS.slice(0, 5)) {
    const start = withUnits(settledOn(launched(CATALOGUE, REGION, WARY, seed, DECK), CITY), [
      standing('player', CITY, { type: 'PH_Worker', worker: true, health: 9999 }),
    ]);
    const starved = walkedFrom(CATALOGUE, start, 20, 'PH_Famine');
    const raided = walkedFrom(CATALOGUE, start, 20, 'PH_Raid');
    const through = Math.min(raided.turn, starved.turn);
    const until = (walk: Walk): Landing[] =>
      walk.landings.filter((landing) => landing.turn <= through);

    expect(until(raided).length).toBeGreaterThan(1);
    expect(until(raided).map((landing) => landing.turn)).toEqual(
      until(starved).map((landing) => landing.turn),
    );
    differs ||= JSON.stringify(until(raided)) !== JSON.stringify(until(starved));
  }
  expect(differs).toBe(true);
});

test('the take lands the answer at its place in the order declared and no other, draws nothing of its own, and draws a hand', () => {
  const standing = dealtBy(5, { drawPile: fullDraw() });
  const raided = outcome(apply(CATALOGUE, standing, { type: 'take', at: 0 }));
  const starved = outcome(apply(CATALOGUE, standing, { type: 'take', at: 1 }));

  expect(stagedBy(standing, { type: 'take', at: 0 })).toEqual([
    'answer',
    'taken',
    'enter',
    'drawn',
  ]);
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

test('a raid with no free tile to enter on enters nobody, draws nothing, and resolves as a runtime error', () => {
  const held = cityOf(['urban'], {
    tiles: field(1),
    timeline: dueOn(2),
    drawPile: fullDraw(),
    units: neighbours(CITY).map((tile) => standing('player', tile)),
  });
  const dealt = outcome(apply(CATALOGUE, held, { type: 'end-turn' }));
  const raided = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));

  expect(dealt.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual([
    'answer',
    'taken',
    'runtime-error',
    'drawn',
  ]);
  expect(enemiesOf(raided)).toEqual([]);
  expect(raided.rng).toEqual(dealt.rng);
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

test('an answer whose cost reads the chronicle is refused where that reading outruns the stock, and pays exactly that reading where it does not', () => {
  const levied = (population: number): Chronicle =>
    dealtBy(5, {
      timeline: dueOn(5, 'PH_Blight'),
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

/** The chronicle an answer's landing leaves: the last stage's before the hand is drawn. */
function landedOf(stages: readonly Stage[]): Chronicle {
  const read = [...stagesWalked(stages)];
  const drawing = read.findIndex((stage) => stage.name === 'drawn');
  return outcome(drawing < 0 ? read : read.slice(0, drawing));
}

/** The timeline dealing the fixture's upheaval at the end of a `cityOf` city's turn. */
const UPHEAVAL_DUE: Carrying = { timeline: dueOn(2, 'PH_Upheaval') };

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

/** The timeline dealing the fixture's exodus at the end of a `cityOf` city's turn. */
const EXODUS_DUE: Carrying = { timeline: dueOn(2, 'PH_Exodus') };

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
  expect(after.hand).toEqual([]);
  expect(after.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 2 });
});

test('an answer placing a camp near the city places one, and its raid enters a warrior on the camp and the rest around it', () => {
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(6),
    timeline: dueOn(2, 'PH_Rivals'),
  });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));
  const [camp, ...others] = campsOf(after);
  const warriors = enemiesOf(after);

  expect(campsOf(dealt)).toEqual([]);
  expect(others).toEqual([]);
  expect(distance(camp, CITY)).toBeGreaterThanOrEqual(3);
  expect(distance(camp, CITY)).toBeLessThanOrEqual(4);
  expect(warriors).toHaveLength(ENCAMPED);
  expect(warriors.map((warrior) => distance(warrior.tile, camp)).sort((a, b) => a - b)).toEqual([
    0,
    ...Array<number>(ENCAMPED - 1).fill(1),
  ]);
});

test('an event placing a camp near the city is not dealt where no tile near it takes a camp, and its answer landed there is a runtime error', () => {
  const cramped = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(2),
    timeline: dueOn(2, 'PH_Rivals'),
  });
  const passed = outcome(apply(CATALOGUE, cramped, { type: 'end-turn' }));
  const landing = eventOf(CATALOGUE, 'PH_Rivals').answers.PH_Encampment.lands(CATALOGUE, passed);

  expect(
    heldBy(apply(CATALOGUE, cramped, { type: 'end-turn' }), 'deal').map(({ name }) => name),
  ).toEqual(['rolled', 'runtime-error']);
  expect(passed.deals).toEqual([]);
  expect(landing.stages.map(({ name }) => name)).toEqual(['runtime-error']);
  expect(campsOf(landing.chronicle)).toEqual([]);
  expect(enemiesOf(landing.chronicle)).toEqual([]);
});

/**
 * A city on a disc of plain out to five, forest on the named tiles, dealt the fixture's wildfire at
 * the end of its turn.
 */
function wooded(forest: TileCoords[], carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], {
    timeline: dueOn(2, 'PH_Wildfire'),
    drawPile: fullDraw(),
    tiles: madeOf(field(5), 'forest', forest),
    ...carrying,
  });
}

/** The city one end of turn on with the wildfire standing, what its card reads, and the chronicle the fire leaves. */
function aflame(
  city: Chronicle,
  catalogue: Catalogue = CATALOGUE,
): { dealt: Chronicle; read: Record<string, number>; landed: Chronicle } {
  const dealt = outcome(apply(catalogue, city, { type: 'end-turn' }));
  if (dealt.deals.length === 0) throw new Error('the wildfire is not dealt');
  const read = eventOf(catalogue, 'PH_Wildfire').answers.PH_Burn.reads(catalogue, dealt);
  return { dealt, read, landed: landedOf(apply(catalogue, dealt, { type: 'take', at: 0 })) };
}

function terrainOf(chronicle: Chronicle, at: TileCoords): string | undefined {
  return tileAt(chronicle.tiles, at)?.terrain;
}

/**
 * The fixture's content with the city's building standing on forest and plain besides urban, and
 * forest yielding no food, so a city working it alone never grows.
 */
const CITY_IN_FOREST: Catalogue = catalogued({
  ...CATALOGUE,
  terrains: {
    ...CATALOGUE.terrains,
    forest: { ...CATALOGUE.terrains.forest, yields: { production: 1 } },
  },
  buildings: {
    ...CATALOGUE.buildings,
    PH_City: { ...CATALOGUE.buildings.PH_City, terrains: ['urban', 'forest', 'plain'] },
  },
});

test('a fire burns every forest tile within its reach of the tile it starts on to plain, and no other tile', () => {
  const start = { q: FIRE.fromCity, r: 0 };
  const around = [
    { q: FIRE.fromCity + 1, r: 0 },
    { q: FIRE.fromCity + 1, r: -1 },
    { q: FIRE.fromCity, r: 1 },
  ];
  const beyond = { q: FIRE.fromCity + 2, r: 0 };
  const burning = new Set([start, ...around].map(tileKey));
  const { dealt, read, landed } = aflame(wooded([start, ...around, beyond]));

  for (const tile of [start, ...around]) expect(terrainOf(landed, tile)).toBe('plain');
  expect(terrainOf(landed, beyond)).toBe('forest');
  expect(landed.tiles.filter((tile) => !burning.has(tileKey(tile)))).toEqual(
    dealt.tiles.filter((tile) => !burning.has(tileKey(tile))),
  );
  expect(read.tiles).toBe(4);
});

test('the forest tile a fire starts on is drawn once from the seeded generator, and what the card reads is what lands', () => {
  const worked = { q: 1, r: 0 };
  const walkedTo = { q: 0, r: 2 };
  const starts = [worked, { q: -2, r: 0 }, walkedTo, { q: 0, r: -2 }];
  const far = { q: FIRE.fromCity + 1, r: 0 };
  const burnedFrom = new Set<string>();

  for (const seed of SEEDS) {
    const city = cityOf(['urban', 'forest'], {
      timeline: dueOn(2, 'PH_Wildfire'),
      drawPile: fullDraw(),
      tiles: madeOf(field(5), 'forest', [...starts, far]),
      rng: seedRng(seed),
      units: [worker(walkedTo)],
    });
    const { dealt, read, landed } = aflame(city);
    const burned = starts.filter((tile) => terrainOf(landed, tile) === 'plain');

    expect(burned).toHaveLength(1);
    expect(terrainOf(landed, far)).toBe('forest');
    expect(landed.rng).toEqual(nextRng(dealt.rng).rng);
    expect(read).toEqual({
      tiles: 1,
      population: dealt.population - landed.population,
      units: tileKey(burned[0]) === tileKey(walkedTo) ? 1 : 0,
      damage: FIRE.damage,
    });
    burnedFrom.add(tileKey(burned[0]));
  }
  expect(burnedFrom.size).toBeGreaterThan(1);
});

test('a fire kills the population working a burned tile, the city’s own tile included, and no idle population', () => {
  const beside = { q: 1, r: 0 };
  const city = cityOf(['forest', 'forest', 'plain'], {
    timeline: dueOn(2, 'PH_Wildfire'),
    drawPile: fullDraw(),
    tiles: madeOf(field(5), 'forest', [CITY, beside]),
    population: 5,
  });
  const { dealt, read, landed } = aflame(city, CITY_IN_FOREST);

  expect(read.population).toBe(2);
  expect(landed.population).toBe(dealt.population - 2);
  expect(landed.assigned).toEqual([{ q: 2, r: 0 }]);
  expect(terrainOf(landed, CITY)).toBe('plain');
  expect(buildingAt(landed, CITY)).toBe('PH_City');
  expect(landed.city).toEqual(CITY);
});

test('a fire killing the city’s last population ends the chronicle in defeat on the take', () => {
  const city = cityOf(['forest'], {
    timeline: dueOn(2, 'PH_Wildfire'),
    drawPile: fullDraw(),
    tiles: madeOf(field(5), 'forest', [CITY]),
  });
  const dealt = outcome(apply(CITY_IN_FOREST, city, { type: 'end-turn' }));
  const taken = outcome(apply(CITY_IN_FOREST, dealt, { type: 'take', at: 0 }));

  expect(dealt.population).toBe(1);
  expect(taken.population).toBe(0);
  expect(taken.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 2 });
});

test('a fire damages every unit standing on a burned tile, whatever its faction, and its card counts the player’s alone', () => {
  const warriorAt = { q: 2, r: 0 };
  const enemyAt = { q: 3, r: 0 };
  const workerAt = { q: 3, r: -1 };
  const clear = { q: 1, r: 0 };
  const city = wooded([warriorAt, enemyAt, workerAt], {
    units: [
      standing('player', warriorAt, { health: FIRE.damage + 2 }),
      standing('enemy', enemyAt, { health: FIRE.damage + 1 }, 0, 0),
      standing('player', workerAt, { type: 'PH_Worker', worker: true, health: FIRE.damage }),
      standing('player', clear, { health: FIRE.damage }),
    ],
  });
  const { read, landed } = aflame(city);

  expect(read.units).toBe(2);
  expect(read.damage).toBe(FIRE.damage);
  expect(unitAt(landed.units, warriorAt)?.stats.health).toBe(2);
  expect(unitAt(landed.units, enemyAt)?.stats.health).toBe(1);
  expect(unitAt(landed.units, workerAt)).toBeUndefined();
  expect(unitAt(landed.units, clear)?.stats.health).toBe(FIRE.damage);
});

test('a camp on a burned tile stays, and the warrior on it takes the damage', () => {
  const camp = { q: 2, r: 0 };
  const city = wooded([], {
    tiles: camped(madeOf(field(5), 'forest', [camp]), [camp]),
    units: [standing('enemy', camp, { health: FIRE.damage + 1 }, 0, 0)],
  });
  const { landed } = aflame(city);

  expect(terrainOf(landed, camp)).toBe('plain');
  expect(buildingAt(landed, camp)).toBe(CATALOGUE.camp.building);
  expect(unitAt(landed.units, camp)?.stats.health).toBe(1);
});

test('a wildfire is dealt with a forest tile within its distance of the city to start on, and not without one', () => {
  const end: Command = { type: 'end-turn' };
  const near = wooded([{ q: FIRE.fromCity, r: 0 }]);
  const far = wooded([{ q: FIRE.fromCity + 1, r: 0 }]);

  expect(outcome(apply(CATALOGUE, near, end)).deals).toEqual([
    { of: 'event', event: 'PH_Wildfire' },
  ]);
  expect(stagedBy(far, end)).toContain('rolled');
  expect(outcome(apply(CATALOGUE, far, end)).deals).toEqual([]);
});

/** The same tiles, with the named ones carrying the feature. */
function featured(tiles: Tile[], feature: FeatureId, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, feature } : tile));
}

/**
 * A city on a disc of plain out to five, every plain within the herd's reach of the city carrying a
 * feature already but the named ones, dealt the fixture's herd at the end of its turn.
 */
function herded(open: TileCoords[], carrying: Carrying = {}): Chronicle {
  const wanted = new Set([CITY, ...open].map(tileKey));
  const covered = field(5).filter(
    (tile) => distance(tile, CITY) <= HERD && !wanted.has(tileKey(tile)),
  );
  return cityOf(['urban'], {
    timeline: dueOn(2, 'PH_Herd'),
    drawPile: fullDraw(),
    tiles: featured(field(5), 'PH_Fertile', covered),
    ...carrying,
  });
}

/**
 * The city one end of turn on with the herd standing, the chronicle its first answer lands on, and
 * the one the take leaves once the hand is drawn.
 */
function followed(city: Chronicle): {
  dealt: Chronicle;
  landed: Chronicle;
  taken: Chronicle;
} {
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  if (dealt.deals.length === 0) throw new Error('the herd is not dealt');
  const stages = apply(CATALOGUE, dealt, { type: 'take', at: 0 });
  return { dealt, landed: landedOf(stages), taken: outcome(stages) };
}

function featureOf(chronicle: Chronicle, at: TileCoords): FeatureId | undefined {
  return tileAt(chronicle.tiles, at)?.feature;
}

function snapshotOf(chronicle: Chronicle, at: TileCoords): Snapshot | undefined {
  return chronicle.snapshots.find((kept) => tileKey(kept) === tileKey(at));
}

test('a feature is dealt onto one tile near the city carrying none, drawn once from the seeded generator, and no other tile changes', () => {
  const open = [
    { q: HERD, r: 0 },
    { q: -HERD, r: 0 },
    { q: 0, r: HERD },
    { q: 0, r: -HERD },
  ];
  const beyond = { q: HERD + 1, r: 0 };
  const dealtOn = new Set<string>();

  for (const seed of SEEDS) {
    const { dealt, landed } = followed(herded(open, { rng: seedRng(seed) }));
    const gained = open.filter((tile) => featureOf(landed, tile) !== undefined);

    expect(gained).toHaveLength(1);
    expect(featureOf(landed, beyond)).toBeUndefined();
    expect(landed.rng).toEqual(nextRng(dealt.rng).rng);
    expect(landed.tiles.filter((tile) => tileKey(tile) !== tileKey(gained[0]))).toEqual(
      dealt.tiles.filter((tile) => tileKey(tile) !== tileKey(gained[0])),
    );
    dealtOn.add(tileKey(gained[0]));
  }
  expect(dealtOn.size).toBeGreaterThan(1);
});

test('a tile an answer charts is charted where it was not, its snapshot holding what the answer dealt onto it and whoever stands on it, and it is in fog as the answer lands', () => {
  const at = { q: HERD, r: 0 };
  const { dealt, landed } = followed(herded([at], { units: [standing('enemy', at, {}, 0, 0)] }));
  const snapshot = snapshotOf(landed, at);

  expect(chartedTile(dealt, at)).toBe('uncharted');
  expect(chartedTile(landed, at)).toBeUndefined();
  expect(inSight(CATALOGUE, landed).has(tileKey(at))).toBe(false);
  expect(snapshot?.tile.feature).toBe('PH_Fertile');
  expect(snapshot?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy' });
});

test('a tile an answer charts that was charted before holds what the answer dealt onto it and whoever stands on it, over the snapshot it had', () => {
  const at = { q: HERD, r: 0 };
  const seen = chartedAt(CATALOGUE, herded([at]), at);
  const { dealt, landed, taken } = followed(withUnits(seen, [standing('enemy', at, {}, 0, 0)]));

  expect(snapshotOf(dealt, at)).toBeDefined();
  expect(snapshotOf(dealt, at)?.tile.feature).toBeUndefined();
  expect(snapshotOf(dealt, at)?.unit).toBeUndefined();
  expect(snapshotOf(landed, at)?.tile.feature).toBe('PH_Fertile');
  expect(snapshotOf(landed, at)?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy' });
  expect(snapshotOf(taken, at)?.tile.feature).toBe('PH_Fertile');
  expect(inSight(CATALOGUE, landed).has(tileKey(at))).toBe(false);
});

test('a tile an answer charted stays charted as it was then, and in fog, through the commands and the turns that follow, where nothing sees it', () => {
  const at = { q: HERD, r: 0 };
  const { taken } = followed(herded([at]));
  const fogged = (chronicle: Chronicle): void => {
    expect(inSight(CATALOGUE, chronicle).has(tileKey(at))).toBe(false);
    expect(chartedTile(chronicle, at)).toBeUndefined();
    expect(snapshotOf(chronicle, at)?.tile.feature).toBe('PH_Fertile');
  };

  let later = outcome(apply(CATALOGUE, taken, assignTo(CITY)));
  fogged(later);
  for (let turns = 0; turns < 3; turns++) {
    later = outcome(apply(CATALOGUE, later, { type: 'end-turn' }));
    fogged(later);
  }
  expect(later.turn).toBe(taken.turn + 3);
});

test('a landing resolves as one stage per change it makes, in the order it makes them, each carrying the tile it landed on', () => {
  const burning = { q: 1, r: 0 };
  const city = cityOf(['urban', 'forest'], {
    timeline: dueOn(2, 'PH_Wildfire'),
    drawPile: fullDraw(),
    tiles: madeOf(field(5), 'forest', [burning]),
    units: [standing('player', burning, { health: FIRE.damage + 1 })],
  });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const [answer, , unassigned, lost, retiled, damaged, drawn] = stagesWalked(
    apply(CATALOGUE, dealt, { type: 'take', at: 0 }),
  );
  const healthOn = (stage: Stage): number | undefined =>
    unitAt(stage.chronicle.units, burning)?.stats.health;

  expect([answer, unassigned, lost, retiled, damaged, drawn].map((stage) => stage.name)).toEqual([
    'answer',
    'assigned',
    'population',
    'retiled',
    'damaged',
    'drawn',
  ]);
  expect(unassigned).toMatchObject({ tile: burning });
  expect(retiled).toMatchObject({ tile: burning });
  expect(damaged).toMatchObject({ tile: burning });
  expect(lost.chronicle.population).toBe(dealt.population - 1);
  expect(terrainOf(lost.chronicle, burning)).toBe('forest');
  expect(terrainOf(retiled.chronicle, burning)).toBe('plain');
  expect(healthOn(retiled)).toBe(FIRE.damage + 1);
  expect(healthOn(damaged)).toBe(1);
});

test('a tile a landing charts is charted as the stage charting it stands, and stays so through every stage after', () => {
  const at = { q: HERD, r: 0 };
  const city = herded([at], { units: [standing('enemy', at, {}, 0, 0)] });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const stages = apply(CATALOGUE, dealt, { type: 'take', at: 0 });
  const [, , retiled, charting, ...after] = stagesWalked(stages);

  expect(namesOf(stages)).toEqual(['answer', 'taken', 'retiled', 'charted', 'drawn']);
  expect(retiled).toMatchObject({ tile: at });
  expect(charting).toMatchObject({ tile: at });
  expect(snapshotOf(retiled.chronicle, at)).toBeUndefined();
  for (const stage of [charting, ...after]) {
    expect(snapshotOf(stage.chronicle, at)?.tile.feature).toBe('PH_Fertile');
    expect(snapshotOf(stage.chronicle, at)?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy' });
    expect(inSight(CATALOGUE, stage.chronicle).has(tileKey(at))).toBe(false);
  }
});

test('an event needing a tile near the city to deal a feature onto is dealt with one, and not without one', () => {
  const end: Command = { type: 'end-turn' };
  const near = herded([{ q: HERD, r: 0 }]);
  const far = herded([{ q: HERD + 1, r: 0 }]);

  expect(outcome(apply(CATALOGUE, near, end)).deals).toEqual([{ of: 'event', event: 'PH_Herd' }]);
  expect(stagedBy(far, end)).toContain('rolled');
  expect(outcome(apply(CATALOGUE, far, end)).deals).toEqual([]);
});

/** The turn the capstone lands on in every fixture below. */
const CAPSTONE = 30;

/** How many turns follow the siege's landing up to its last: the tick past that one passes the fixture's siege. */
const REINFORCED = 5;

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
 * the enemies of the siege to spend their turns.
 */
function unkillable(tile: TileCoords): Standing {
  return standing('player', tile, { type: 'PH_Worker', worker: true, health: 99 });
}

/**
 * The disc with water around the city: no ground runs to it, so the siege places no camp of its own
 * and its landing there is a `runtime-error`.
 */
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

/** That city ending turn after turn until the tick past the siege's last turn passes it: the chronicle it left. */
function stoodOut(): Chronicle {
  let standingOut = moated({ units: [unkillable(LURE)] });
  for (let turn = 0; turn <= REINFORCED; turn++) standingOut = endedTurn(standingOut, 'PH_Famine');
  return standingOut;
}

test('the capstone’s turn lands the capstone straight and draws the hand, dealing nothing, whatever deal was due on that turn', () => {
  for (const timeline of [besieging(), besieging(dueOn(CAPSTONE))]) {
    const awaited = awaitingCapstone({ timeline, drawPile: fullDraw() });
    const landed = outcome(apply(CATALOGUE, awaited, { type: 'end-turn' }));
    const staged = stagedBy(awaited, { type: 'end-turn' });

    expect(landed.deals).toEqual([]);
    expect(landed.turn).toBe(CAPSTONE);
    expect(landed.hand).toEqual(fullDraw());
    expect(campsOf(landed)).toHaveLength(5);
    expect(staged.slice(staged.indexOf('turn'))).toEqual([
      'turn',
      'turn',
      'capstone',
      'rolled',
      ...Array<string>(5).fill('retiled'),
      ...Array<string>(5).fill('enter'),
      'drawn',
    ]);
  }
});

test('the capstone’s turn drops a deal due past it, and the next deal is due three to seven turns after the landing', () => {
  const past = { ...besieging(), schedule: SCHEDULE, next: CAPSTONE + 1 };
  const landed = moated({ units: [unkillable(LURE)], timeline: past });
  const walk = walkedFrom(CATALOGUE, landed, CAPSTONE + 2, 'PH_Famine');
  const { next } = landed.timeline;

  expect(walk.landings).toEqual([]);
  expect(next).toBeGreaterThanOrEqual(CAPSTONE + 3);
  expect(next).toBeLessThanOrEqual(CAPSTONE + 7);
});

test('the capstone’s turn is one capstone group over the next due turn rolled and the landing, and each turn after it one over the second script', () => {
  const awaited = awaitingCapstone({ drawPile: fullDraw() });

  const landing = heldBy(apply(CATALOGUE, awaited, { type: 'end-turn' }), 'capstone');
  const [rolled, ...landed] = landing;

  expect(rolled.name).toBe('rolled');
  expect(rolled.chronicle.timeline.next).toBeGreaterThan(CAPSTONE);
  expect(campsOf(rolled.chronicle)).toEqual([]);
  expect(landed.map(({ name }) => name)).toEqual([
    ...Array<string>(5).fill('retiled'),
    ...Array<string>(5).fill('enter'),
  ]);

  const after = moated({ units: [unkillable(LURE)] });
  const continued = heldBy(apply(CATALOGUE, after, { type: 'end-turn' }), 'capstone');

  expect(continued.map(({ name }) => name)).toEqual(['enter']);
  expect(continued).toMatchObject([{ tile: STANDING_CAMP }]);
});

test('a capstone carrying no second script stages no capstone on the turns after its own', () => {
  const tilled = awaitingTillage();
  const landed = endedTurn(tilled);

  expect(stagedBy(tilled, { type: 'end-turn' })).toContain('capstone');
  expect(landed.turn).toBe(CAPSTONE);
  expect(stagedBy(landed, { type: 'end-turn' })).not.toContain('capstone');
});

test('the capstone’s landing is a stage of its own on its turn, even where it lands nothing', () => {
  const quiet: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Siege: { lands: (_c, chronicle) => unchanged(chronicle), passes: () => false },
    },
  };
  const awaited = awaitingCapstone({ drawPile: fullDraw() });
  const staged = namesOf(apply(quiet, awaited, { type: 'end-turn' }));

  expect(staged.slice(staged.indexOf('turn'))).toEqual([
    'turn',
    'turn',
    'capstone',
    'rolled',
    'drawn',
  ]);
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
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual([
    'reward',
    'taken',
    'discarded',
    'turn',
    'turn',
    'capstone',
    'rolled',
    ...campsOf(taken).map(() => 'retiled'),
    ...campsOf(taken).map(() => 'enter'),
    'drawn',
  ]);
  expect(taken.turn).toBe(CAPSTONE);
  expect(taken.deals).toEqual([]);
  expect(taken.hand).toEqual(fullDraw());
  expect(campsOf(taken)).not.toEqual([]);
});

test('a camp captured on the siege’s last turn holds the victory back until its reward is taken', () => {
  const camp = { q: 4, r: 0 };
  const last = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(6), [camp]),
    units: [worker(camp)],
    turn: CAPSTONE + REINFORCED,
    timeline: besieging(),
  });
  const dealt = outcome(apply(CATALOGUE, last, { type: 'end-turn' }));

  expect(stagedBy(last, { type: 'end-turn' })).not.toContain('ended');
  expect(dealt.ending).toBeUndefined();
  expect(dealt.deals).toEqual([{ of: 'camp', rewards: CATALOGUE.camp.rewards }]);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual([
    'reward',
    'taken',
    'discarded',
    'turn',
    'turn',
    'ended',
  ]);
  expect(outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 })).ending).toEqual({
    outcome: 'victory',
    turn: CAPSTONE + REINFORCED + 1,
  });
});

test('a capture that meets a capstone’s condition ends the chronicle on the capture, its rewards never dealt', () => {
  const camp = { q: 4, r: 0 };
  const cleared: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Siege: {
        lands: (_c, chronicle) => unchanged(chronicle),
        passes: (catalogue, chronicle) =>
          chronicle.tiles.every((tile) => tile.building !== catalogue.camp.building),
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
  const stages = apply(cleared, last, { type: 'end-turn' });

  expect(heldBy(stages, 'camp-capture').map(({ name }) => name)).toEqual(['retiled', 'ended']);
  expect(namesOf(stages).slice(-3)).toEqual(['camp-capture', 'retiled', 'ended']);
  expect(outcome(stages).deals).toEqual([]);
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
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

    expect(heldBy(stages, 'capstone').map(({ name }) => name)).toEqual(['rolled', 'runtime-error']);
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

    expect(heldBy(stages, 'capstone').map(({ name }) => name)).toEqual(['rolled', 'runtime-error']);
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

test('the warrior the reinforcement enters is a stage of its own, raised after the tick and ahead of the deal', () => {
  const due = CAPSTONE + 3;
  const landed = moated({ units: [unkillable(LURE)] });
  let reinforcing: Chronicle = {
    ...landed,
    timeline: { ...dueOn(due), capstone: landed.timeline.capstone },
  };

  const opened = (stages: readonly Stage[]): string[] => {
    const names = stages.map(({ name }) => name);
    return names.slice(names.indexOf('turn'));
  };

  while (reinforcing.turn < due - 1) {
    const stages = apply(CATALOGUE, reinforcing, { type: 'end-turn' });
    expect(opened(stages)).toEqual(['turn', 'capstone']);
    expect(heldBy(stages, 'capstone').map(({ name }) => name)).toEqual(['enter']);
    reinforcing = endedTurn(reinforcing, 'PH_Famine');
  }
  const dealt = apply(CATALOGUE, reinforcing, { type: 'end-turn' });

  expect(opened(dealt)).toEqual(['turn', 'capstone', 'deal']);
  expect(heldBy(dealt, 'capstone').map(({ name }) => name)).toEqual(['enter']);
  expect(heldBy(dealt, 'deal').map(({ name }) => name)).toEqual(['rolled', 'dealt']);
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

test('the turn ticking past the siege’s sixth with the city standing ends the chronicle in victory on the tick', () => {
  let reinforcing = moated({ units: [unkillable(LURE)] });

  for (let turn = 1; turn <= REINFORCED; turn++) {
    reinforcing = endedTurn(reinforcing, 'PH_Famine');
    expect(reinforcing.turn).toBe(CAPSTONE + turn);
    expect(reinforcing.ending).toBeUndefined();
  }
  const stages = apply(CATALOGUE, reinforcing, { type: 'end-turn' });
  const staged = namesOf(stages);
  const survived = stoodOut();

  expect(staged.slice(staged.indexOf('turn'))).toEqual(['turn', 'turn', 'ended']);
  expect(heldBy(stages, 'turn').map(({ name }) => name)).toEqual(['turn', 'ended']);
  expect(survived.turn).toBe(CAPSTONE + REINFORCED + 1);
  expect(survived.ending).toEqual({ outcome: 'victory', turn: CAPSTONE + REINFORCED + 1 });
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
    index: chronicle.hand.indexOf('PH_Farm'),
    aim: 'tile',
    tile: TILLED,
  };
  const played = outcome(apply(CATALOGUE, chronicle, play));
  if (played === chronicle) throw new Error('the farm is refused on the tilled tile');
  return played;
}

/** The farm card played on the tilled tile: what a play of it resolves as. */
function tilling(chronicle: Chronicle): Command {
  return { type: 'play', index: chronicle.hand.indexOf('PH_Farm'), aim: 'tile', tile: TILLED };
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
      'discarded',
      'stock',
      'action-spent',
      'retiled',
      'ended',
    ]);
    expect(buildingAt(outcome(stages), TILLED)).toBe(TILLAGE);
    expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn });
  }
});

test('a capstone’s condition met partway through a play ends the chronicle there, and the rest of the card never resolves', () => {
  const spent: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Tillage: {
        lands: (_c, chronicle) => unchanged(chronicle),
        passes: (_c, chronicle) => chronicle.units.some((unit) => unit.action === 0),
      },
    },
  };
  const landed = endedTurn(awaitingTillage(FARMING), undefined, spent);
  const stages = apply(spent, landed, tilling(landed));

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'stock', 'action-spent', 'ended']);
  expect(buildingAt(outcome(stages), TILLED)).toBeUndefined();
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
});

test('a capstone’s condition holding before the capstone lands ends the chronicle on the landing, before the draw, the tick and the roll reading nothing', () => {
  const tilledEarly = tilled(
    awaitingTillage({ ...FARMING, turn: CAPSTONE - 2, drawPile: [], hand: ['PH_Farm'] }),
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
    'capstone',
    'rolled',
    'ended',
  ]);
  expect(outcome(stages).hand).toEqual([]);
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: CAPSTONE });
});

test('a change that both leaves the city no population and meets a capstone’s condition ends the chronicle in defeat', () => {
  const emptied: Catalogue = {
    ...CATALOGUE,
    capstones: {
      PH_Tillage: {
        lands: (_c, chronicle) => unchanged(chronicle),
        passes: (_c, chronicle) => chronicle.population === 0,
      },
    },
  };
  const city = cityOf(['urban'], {
    hand: ['PH_Drought'],
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } },
  });
  const stages = apply(emptied, city, { type: 'end-turn' });

  expect(namesOf(stages).slice(-3)).toEqual(['assigned', 'population', 'ended']);
  expect(outcome(stages).ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 1 });
});

test('the schedule keeps dealing past the landing of a capstone no span passes', () => {
  const start = awaitingTillage({
    tiles: camped(field(4), CAMPS),
    timeline: { ...NO_DEALS, schedule: SCHEDULE, capstone: { id: 'PH_Tillage', turn: CAPSTONE } },
  });
  const { chronicle, landings } = walkedFrom(CATALOGUE, start, CAPSTONE + 40, 'PH_Famine');
  const dealt = landings.filter((landing) => landing.event !== undefined);

  expect(chronicle.ending).toBeUndefined();
  expect(landings[0]).toEqual({ turn: CAPSTONE });
  expect(dealt.length).toBeGreaterThan(4);
  expect(dealt[dealt.length - 1].turn).toBeGreaterThan(CAPSTONE + 30);
});
