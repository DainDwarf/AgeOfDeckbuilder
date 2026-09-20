import { expect, test } from 'vitest';
import { type Catalogue, catalogued, unitKind } from './catalogue';
import { apply, outcome } from './chronicle';
import { cityCommand, claimable } from './city';
import {
  attackOn,
  attacksOf,
  buildingAt,
  CAMPS,
  CATALOGUE,
  CITY,
  camped,
  cityOf,
  claimOf,
  culture,
  dealing,
  endedTurn,
  enemiesOf,
  everyCard,
  field,
  fullDraw,
  heldBy,
  movesOf,
  NO_GROWTH,
  namesOf,
  only,
  opening,
  plains,
  pointsOf,
  REGION,
  ringed,
  SCRIPT,
  stagedBy,
  standing,
  WORKER,
  withUnits,
  worker,
} from './fixtures';
import { CENTRE, distance, MOVE_POINT, neighbours, type TileCoords, tileKey } from './map';
import { regionOf, terrainKind } from './map-kinds';
import { RESOURCES } from './resources';
import { nextRng, seedRng } from './rng';
import { walked } from './stages';
import type { Chronicle } from './state';
import { unitAt } from './units';

/** A timeline dealing the raid on the second turn, and no other deal. */
const RAID_ON_SECOND = dealing({ turn: 2, event: 'PH_Hardship' });

/** Every camp the end of turn stages a capture of, as the tile each stood on. */
function capturesOf(chronicle: Chronicle): string[] {
  return [...walked(apply(CATALOGUE, chronicle, { type: 'end-turn' }))].flatMap((stage) =>
    stage.name === 'camp-capture' ? [tileKey(stage.tile)] : [],
  );
}

test('a capture ends the end of turn on its own stage, with the ending set', () => {
  const overrun = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    drawPile: ['PH_Worker', 'PH_Warrior'],
    units: [standing('enemy', CITY)],
  });

  const stages = apply(CATALOGUE, overrun, { type: 'end-turn' });
  const last = stages[stages.length - 1];

  expect(namesOf(stages)).toEqual(['discarded', 'grow', 'income', 'enemy-phase', 'ended']);
  expect(heldBy(stages, 'enemy-phase').map(({ name }) => name)).toEqual(['ended']);
  expect(last.chronicle.ending).toEqual({
    outcome: 'defeat',
    cause: 'capture',
    turn: overrun.turn,
  });
  expect(last.chronicle.turn).toBe(overrun.turn);
  expect(last.chronicle.hand).toEqual([]);
});

test('a camp captured at the end of the turn leaves its tile claimed like any other', () => {
  const camp = { q: 2, r: 0 };
  const besieging = ringed(3, {
    ...NO_GROWTH,
    tiles: camped(field(3), [camp]),
    resources: culture(20),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = endedTurn(besieging);

  expect(capturesOf(besieging)).toEqual([tileKey(camp)]);
  expect(claimable(CATALOGUE, taken).map(tileKey)).toContain(tileKey(camp));
  expect(cityCommand(CATALOGUE, taken, camp)).toEqual(claimOf(camp));
  expect(stagedBy(taken, claimOf(camp))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, taken, claimOf(camp))).held.map(tileKey)).toContain(
    tileKey(camp),
  );
});

test('a unit of the player’s standing on a camp when the turn ends captures it', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));

  expect(stagedBy(besieging, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'camp-capture',
    'retiled',
    'dealt',
  ]);
  expect(capturesOf(besieging)).toEqual([tileKey(camp)]);
  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual([]);
});

test('a capture deals the camp’s rewards and stops the end of turn before the tick, and the take resumes it: the one taken is laid in the discard pile, the other gone', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });
  const dealt = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));
  const cache = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 1 }));

  expect(dealt.deals).toEqual([{ of: 'camp', rewards: ['PH_Spoils', 'PH_Cache'] }]);
  expect(dealt.turn).toBe(besieging.turn);
  expect(dealt.hand).toEqual([]);
  expect(stagedBy(dealt, { type: 'take', at: 1 })).toEqual([
    'reward',
    'taken',
    'discarded',
    'turn',
    'turn',
    'drawn',
  ]);
  expect(cache.turn).toBe(besieging.turn + 1);
  expect(cache.deals).toEqual([]);
  expect(cache.discardPile).toEqual(['PH_Cache']);
  expect(cache.hand).toEqual(fullDraw());
  expect(everyCard(cache)).not.toContain('PH_Spoils');
});

test('a worker of the player’s captures a camp as any unit does', () => {
  const camp = { q: 4, r: 0 };
  const worked = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [worker(camp)],
  });

  const taken = endedTurn(worked, 'PH_Spoils');

  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual(['PH_Spoils']);
});

test('a unit killed in the enemy phase captures the camp it stood on no longer', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    units: [worker(camp), standing('enemy', { q: 3, r: 0 }, { move: 0, damage: WORKER.health })],
  });

  const taken = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));

  expect(taken.units.some((unit) => unit.faction === 'player')).toBe(false);
  expect(buildingAt(taken, camp)).toBe(CATALOGUE.camp.building);
  expect(taken.deals).toEqual([]);
});

test('a chronicle that fell in the enemy phase captures no camp', () => {
  const camp = { q: 4, r: 0 };
  const overrun = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [standing('player', camp), standing('enemy', CITY)],
  });

  const fallen = outcome(apply(CATALOGUE, overrun, { type: 'end-turn' }));

  expect(stagedBy(overrun, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'enemy-phase',
    'ended',
  ]);
  expect(buildingAt(fallen, camp)).toBe(CATALOGUE.camp.building);
  expect(fallen.deals).toEqual([]);
});

test('a captured camp is silent: the raid enters on a camp still standing', () => {
  const [kept, ...besieged] = CAMPS;
  const held = cityOf(['urban'], {
    tiles: camped(field(4), CAMPS),
    units: besieged.map(worker),
    timeline: RAID_ON_SECOND,
  });

  const raided = endedTurn(held, 'PH_Raid');

  for (const camp of besieged) expect(buildingAt(raided, camp)).toBeUndefined();
  expect(buildingAt(raided, kept)).toBe(CATALOGUE.camp.building);
  expect(raided.units.find((unit) => unit.faction === 'enemy')?.tile).toEqual(kept);
});

// the fixture's raid enters three warriors from turn 20
const RAID_OF_THREE = dealing({ turn: 20, event: 'PH_Hardship' });

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function raidingAt(raidCampOdds: number): Catalogue {
  return catalogued({ ...CATALOGUE, camp: { ...CATALOGUE.camp, raidCampOdds } });
}

function enteredSince(before: Chronicle, after: Chronicle): TileCoords[] {
  return enemiesOf(after)
    .filter((unit) => unit.id >= before.nextUnit)
    .map((unit) => unit.tile);
}

test('a raid of three enters on its camp’s tile, then on the nearest free tile around it, ring by ring', () => {
  const camp = { q: 3, r: 0 };
  const [open, ...taken] = neighbours(camp);
  const city = cityOf(['urban'], {
    tiles: camped(field(5), [camp]),
    units: taken.map(worker),
    turn: 19,
    timeline: RAID_OF_THREE,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const [first, second, third, ...more] = enteredSince(seeded, endedTurn(seeded, 'PH_Raid'));

    expect(first).toEqual(camp);
    expect(second).toEqual(open);
    expect(distance(third, camp)).toBe(2);
    expect(more).toEqual([]);
  }
});

test('a raid through a camp a unit stands on enters beside the camp’s tile', () => {
  const camp = { q: 3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(5), [camp]),
    units: [standing('enemy', camp, { move: 0 })],
    timeline: RAID_ON_SECOND,
  });

  const entered = enteredSince(city, endedTurn(city, 'PH_Raid'));

  expect(entered).toHaveLength(1);
  expect(distance(entered[0], camp)).toBe(1);
});

test('a raid drawn through the outer ring enters on a tile of the disc farthest from its centre, camps standing', () => {
  const city = cityOf(['urban'], { tiles: camped(field(5), CAMPS), timeline: RAID_ON_SECOND });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const entered = enteredSince(seeded, endedTurn(seeded, 'PH_Raid', raidingAt(0)));

    expect(entered).toHaveLength(1);
    expect(distance(entered[0], CENTRE)).toBe(5);
  }
});

test('a chronicle whose every camp is captured takes its raid on the outer ring', () => {
  const held = cityOf(['urban'], {
    tiles: camped(field(5), CAMPS),
    units: CAMPS.map(worker),
    timeline: RAID_ON_SECOND,
  });

  const raided = endedTurn(held, 'PH_Raid');
  const entered = enteredSince(held, raided);

  expect(raided.turn).toBe(2);
  expect(raided.tiles.some((tile) => tile.building === CATALOGUE.camp.building)).toBe(false);
  expect(entered).toHaveLength(1);
  expect(distance(entered[0], CENTRE)).toBe(5);
});

test('a raid never enters on the city’s tile, and one larger than the tiles left to it enters what it can', () => {
  const camp = { q: 1, r: 0 };
  const beyond = { q: 2, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(only(4, [CITY, camp, beyond]), [camp]),
    turn: 19,
    timeline: RAID_OF_THREE,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };

    expect(enteredSince(seeded, endedTurn(seeded, 'PH_Raid'))).toEqual([camp, beyond]);
  }
});

/** The fixture's content with its camp rolling at these odds. */
function rolling(odds: number): Catalogue {
  return catalogued({ ...CATALOGUE, camp: { ...CATALOGUE.camp, odds } });
}

/** Every camp the end of turn stages a warrior entering on, as the tile each stood on. */
function entriesOf(catalogue: Catalogue, chronicle: Chronicle): string[] {
  return [...walked(apply(catalogue, chronicle, { type: 'end-turn' }))].flatMap((stage) =>
    stage.name === 'enter' ? [tileKey(stage.tile)] : [],
  );
}

/** The fixture's camps in the order the map lists their tiles. */
function campsInTileOrder(chronicle: Chronicle): string[] {
  return chronicle.tiles.filter((tile) => tile.building === CATALOGUE.camp.building).map(tileKey);
}

test('at odds of one every camp enters a guard once the enemies have acted, a stage each in tile order ahead of the captures: on the camp where its tile is free, and beside it where a unit stands on it', () => {
  const held = { q: 4, r: 0 };
  const guarded = { q: 0, r: -4 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    drawPile: fullDraw(),
    units: [
      standing('player', held),
      standing('enemy', guarded, { move: 0 }),
      standing('enemy', { q: 3, r: 0 }, { move: 0 }),
    ],
  });
  const camps = campsInTileOrder(city);
  const stages = apply(rolling(1), city, { type: 'end-turn' });
  const entries = [...walked(stages)].flatMap((stage) =>
    stage.name === 'enter' ? [stage.tile] : [],
  );

  expect(namesOf(stages)).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'attack',
    'action-spent',
    'damaged',
    ...camps.map(() => 'enter'),
    'camp-capture',
    'retiled',
    'dealt',
  ]);
  for (const [at, camp] of camps.entries()) {
    const taken = camp === tileKey(held) || camp === tileKey(guarded);
    const [q, r] = camp.split(',').map(Number);
    expect(distance(entries[at], { q, r })).toBe(taken ? 1 : 0);
  }
  expect(
    enemiesOf(outcome(stages))
      .filter((unit) => unit.id >= city.nextUnit)
      .map((unit) => (unit.faction === 'enemy' ? unit.script : undefined)),
  ).toEqual(camps.map(() => CATALOGUE.camp.scripts.guard));
});

test('the chronicle opens with one guard on each camp the map was dealt, in tile order, ahead of every unit the settle enters', () => {
  const opened = opening(camped(plains(5), CAMPS), { deck: { cards: [], settle: ['PH_Band'] } });
  const camps = campsInTileOrder(opened);
  const banded = outcome(
    apply(CATALOGUE, opened, { type: 'play', index: 0, aim: 'tile', tile: CITY }),
  );

  expect(
    opened.units.map((unit) => ({
      id: unit.id,
      tile: tileKey(unit.tile),
      script: unit.faction === 'enemy' ? unit.script : undefined,
    })),
  ).toEqual(camps.map((tile, at) => ({ id: at + 1, tile, script: CATALOGUE.camp.scripts.guard })));
  expect(unitAt(banded.units, CITY)?.id).toBe(camps.length + 1);
});

test('a raid enters raiders, whatever door it comes through', () => {
  const city = cityOf(['urban'], { tiles: camped(field(5), CAMPS), timeline: RAID_ON_SECOND });

  for (const catalogue of [raidingAt(0), raidingAt(1)]) {
    const raided = endedTurn(city, 'PH_Raid', catalogue);
    const entered = enemiesOf(raided).filter((unit) => unit.id >= city.nextUnit);

    expect(entered).toHaveLength(1);
    expect(entered.map((unit) => (unit.faction === 'enemy' ? unit.script : undefined))).toEqual([
      CATALOGUE.camp.scripts.raider,
    ]);
  }
});

test('an enemy’s move draws from the seeded generator where its script draws, and the phase carries on from the generator the script leaves', () => {
  const drawing: Catalogue = catalogued({
    ...CATALOGUE,
    scripts: {
      ...CATALOGUE.scripts,
      [SCRIPT]: {
        moveTo: (_catalogue, chronicle, enemy) => ({
          landing: { tile: enemy.tile, cost: 0 },
          rng: nextRng(chronicle.rng).rng,
        }),
        attacks: () => undefined,
      },
    },
  });
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('enemy', { q: 3, r: 0 }, { move: 0 }),
      standing('enemy', { q: -3, r: 0 }, { move: 0 }),
    ],
  });
  const phaseOf = (catalogue: Catalogue): Chronicle => {
    const stages = apply(catalogue, city, { type: 'end-turn' });
    const phase = stages.find((stage) => stage.name === 'enemy-phase');
    if (phase === undefined) throw new Error('the end of turn staged no phase');
    return phase.chronicle;
  };

  expect(phaseOf(CATALOGUE).rng).toEqual(city.rng);
  expect(phaseOf(drawing).rng).toEqual(nextRng(nextRng(city.rng).rng).rng);
  expect(outcome(apply(drawing, city, { type: 'end-turn' })).rng).toEqual(phaseOf(drawing).rng);
});

test('a warrior a camp rolls stands on the camp with the camp’s unit’s stats, its move points and its action full when the turn ends', () => {
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    drawPile: fullDraw(),
  });
  const stats = unitKind(CATALOGUE, CATALOGUE.camp.unit);

  const after = outcome(apply(rolling(1), city, { type: 'end-turn' }));

  expect(after.turn).toBe(city.turn + 1);
  expect(
    after.units.map((unit) => ({
      tile: tileKey(unit.tile),
      stats: unit.stats,
      movePoints: unit.movePoints,
      action: unit.action,
      script: unit.faction === 'enemy' ? unit.script : undefined,
    })),
  ).toEqual(
    campsInTileOrder(city).map((tile) => ({
      tile,
      stats,
      movePoints: stats.move,
      action: stats.action,
      script: CATALOGUE.camp.scripts.guard,
    })),
  );
});

test('a camp its warrior walked off in the enemy phase rolls at the same phase', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('enemy', camp)],
  });

  const after = outcome(apply(rolling(1), city, { type: 'end-turn' }));

  expect(entriesOf(rolling(1), city)).toEqual([tileKey(camp)]);
  expect(enemiesOf(after).filter((unit) => tileKey(unit.tile) === tileKey(camp))).toHaveLength(1);
  expect(enemiesOf(after)).toHaveLength(2);
});

test('at odds of nought no camp enters a warrior and no stage is raised, and every camp draws all the same', () => {
  const carrying = { ...NO_GROWTH, drawPile: fullDraw() };
  const city = cityOf(['urban'], { ...carrying, tiles: camped(field(4), CAMPS) });
  const empty = cityOf(['urban'], { ...carrying, tiles: field(4) });
  const rngAt = (odds: number): Chronicle['rng'] =>
    outcome(apply(rolling(odds), city, { type: 'end-turn' })).rng;

  const after = outcome(apply(rolling(0), city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(stagedBy(empty, { type: 'end-turn' }));
  expect(enemiesOf(after)).toEqual([]);
  expect(rngAt(0)).toEqual(rngAt(0.5));
  expect(rngAt(0)).toEqual(rngAt(1));
  expect(rngAt(0)).not.toEqual(outcome(apply(rolling(0), empty, { type: 'end-turn' })).rng);
});

test('the enemy phase holds nothing at odds of nought, and its chronicle carries the draws every camp made', () => {
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    drawPile: fullDraw(),
  });

  const stages = apply(rolling(0), city, { type: 'end-turn' });
  const phase = stages.find((stage) => stage.name === 'enemy-phase');
  const grow = stages.find((stage) => stage.name === 'grow');
  if (phase === undefined || grow === undefined) throw new Error('the end of turn staged no phase');

  expect(heldBy(stages, 'enemy-phase')).toEqual([]);
  expect(phase.chronicle.rng).not.toEqual(grow.chronicle.rng);
  expect(outcome(stages).rng).toEqual(outcome(apply(rolling(0.5), city, { type: 'end-turn' })).rng);
});

test('the enemy phase holds each enemy’s move and attacks, then the warriors the camps roll, each entering on its camp', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [worker({ q: 2, r: 0 }), standing('enemy', { q: 3, r: -1 }, { move: MOVE_POINT })],
  });

  const held = heldBy(apply(rolling(1), city, { type: 'end-turn' }), 'enemy-phase');

  expect(held.map(({ name }) => name)).toEqual(['move', 'attack', 'enter']);
  const [crossed, attack, entered] = held;
  if (attack.kind !== 'group' || attack.name !== 'attack') throw new Error('no attack staged');
  expect(attack.stages.map(({ name }) => name)).toEqual(['action-spent', 'damaged']);
  expect(attack.stages).toMatchObject([{ tile: attack.attacker }, { tile: attack.target }]);
  expect(attack.target).toEqual({ q: 2, r: 0 });
  expect(crossed).toMatchObject({ to: attack.attacker });
  expect(entered).toMatchObject({ tile: camp });
});

test('a camp captured is one camp-capture carrying its tile, over the camp leaving the tile and its rewards dealt', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const stages = apply(CATALOGUE, besieging, { type: 'end-turn' });
  const capture = stages.find((stage) => stage.name === 'camp-capture');
  if (capture?.kind !== 'group' || capture.name !== 'camp-capture') {
    throw new Error('no camp was captured');
  }
  const [retiled, dealt] = capture.stages;

  expect(capture.tile).toEqual(camp);
  expect(retiled).toMatchObject({ name: 'retiled', tile: camp });
  expect(buildingAt(retiled.chronicle, camp)).toBeUndefined();
  expect(retiled.chronicle.deals).toEqual([]);
  expect(dealt.name).toBe('dealt');
  expect(dealt.chronicle.deals).toEqual([{ of: 'camp', rewards: CATALOGUE.camp.rewards }]);
  expect(outcome(stages)).toBe(capture.chronicle);
});

test('at odds of a half a seed enters on the same camps every time, and seeds differ in the camps they enter on', () => {
  const rolledOn = (seed: number): string =>
    entriesOf(
      rolling(0.5),
      cityOf(['urban'], {
        ...NO_GROWTH,
        rng: seedRng(seed),
        tiles: camped(field(4), CAMPS),
        drawPile: fullDraw(),
      }),
    ).join(' ');
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const seed of seeds) expect(rolledOn(seed)).toBe(rolledOn(seed));
  expect(new Set(seeds.map(rolledOn)).size).toBeGreaterThan(1);
});

test('a city fallen in the enemy phase rolls no camp', () => {
  const overrun = cityOf(['urban'], {
    tiles: camped(field(4), CAMPS),
    units: [standing('enemy', CITY)],
  });

  const fallen = outcome(apply(rolling(1), overrun, { type: 'end-turn' }));

  expect(entriesOf(rolling(1), overrun)).toEqual([]);
  expect(enemiesOf(fallen)).toHaveLength(1);
  expect(fallen.rng).toEqual(overrun.rng);
});

test('the settle phase’s end rolls no camp', () => {
  const opening = cityOf(['urban'], { turn: 0, tiles: camped(field(4), CAMPS) });

  const opened = outcome(apply(rolling(1), opening, { type: 'end-turn' }));

  expect(entriesOf(rolling(1), opening)).toEqual([]);
  expect(enemiesOf(opened)).toEqual([]);
});

test('two camps captured the turn before an event is due deal two deals of rewards, and the last take opens the turn on the event, taken in turn, the draw after the last', () => {
  const camps = [
    { q: 4, r: 0 },
    { q: 0, r: 4 },
  ];
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [...camps, { q: -4, r: 0 }]),
    drawPile: fullDraw(),
    units: camps.map((camp) => standing('player', camp)),
    timeline: RAID_ON_SECOND,
  });
  const rewards = { of: 'camp', rewards: CATALOGUE.camp.rewards };

  const dealt = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));
  const first = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));
  const second = outcome(apply(CATALOGUE, first, { type: 'take', at: 1 }));

  expect(capturesOf(besieging)).toEqual(
    besieging.tiles
      .filter((tile) => camps.some((camp) => tileKey(camp) === tileKey(tile)))
      .map(tileKey),
  );
  for (const camp of camps) expect(buildingAt(dealt, camp)).toBeUndefined();
  expect(dealt.deals).toEqual([rewards, rewards]);
  expect(dealt.turn).toBe(besieging.turn);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['reward', 'taken', 'discarded']);
  expect(first.turn).toBe(besieging.turn);
  expect(stagedBy(first, { type: 'take', at: 1 })).toEqual([
    'reward',
    'taken',
    'discarded',
    'turn',
    'turn',
    'deal',
    'rolled',
    'dealt',
  ]);
  expect(second.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(second.discardPile).toEqual(['PH_Spoils', 'PH_Cache']);
  expect(second.hand).toEqual([]);
  expect(stagedBy(second, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'enter', 'drawn']);
  expect(outcome(apply(CATALOGUE, second, { type: 'take', at: 0 })).deals).toEqual([]);
});

test('the camp’s reward is single use: played, it gains and leaves the chronicle', () => {
  const city = cityOf(['urban'], { hand: ['PH_Spoils'] });

  const played = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual([
    'played',
    'left',
    'stock',
  ]);
  expect(played.resources).toEqual({
    food: 10,
    production: 10,
    military: 10,
    money: 10,
    science: 10,
    culture: 0,
  });
  expect(everyCard(played)).toEqual([]);
});

test('the camp’s reward discarded unplayed comes around like any card', () => {
  const city = cityOf(['urban'], { ...NO_GROWTH, hand: ['PH_Spoils'], drawPile: fullDraw() });

  const ended = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(ended.discardPile).toEqual(['PH_Spoils']);
  expect(everyCard(outcome(apply(CATALOGUE, ended, { type: 'end-turn' })))).toContain('PH_Spoils');
});

test('an enemy moves its move toward the city, turn after turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(distance(moved.units[0].tile, CITY)).toBe(2);
  expect(distance(outcome(apply(CATALOGUE, moved, { type: 'end-turn' })).units[0].tile, CITY)).toBe(
    0,
  );
});

test('an enemy spends the move points it crosses on, and carries them into the turn refreshed', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const stages = apply(CATALOGUE, city, { type: 'end-turn' });
  const crossed = [...walked(stages)].find((stage) => stage.name === 'move');
  if (crossed === undefined) throw new Error('the enemy phase staged no move');

  expect(pointsOf(crossed.chronicle, 1)).toBe(0);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
});

test('an enemy moves within range of a unit and attacks it in the same enemy phase', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 2, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'turn',
    'turn',
    'refreshed',
  ]);
  expect(movesOf(city)).toEqual([['4,0', '3,0']]);
  expect(attacksOf(city)).toEqual([['3,0', '2,0']]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health - 2);
});

test('an enemy its move leaves out of range attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'move',
    'turn',
    'turn',
    'refreshed',
  ]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy attacks once for each of its action, and one with none attacks nothing', () => {
  const beset = (action: number): Chronicle =>
    cityOf(['urban'], {
      tiles: field(2),
      units: [
        worker({ q: 1, r: 0 }),
        standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 1, action }),
      ],
    });

  expect(attacksOf(beset(0))).toEqual([]);
  expect(attacksOf(beset(1))).toEqual([['2,0', '1,0']]);
  expect(attacksOf(beset(2))).toEqual([
    ['2,0', '1,0'],
    ['2,0', '1,0'],
  ]);
  for (const action of [0, 1, 2]) {
    const city = beset(action);
    const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
    expect(after.units[0].stats.health).toBe(city.units[0].stats.health - action);
  }
});

test('each enemy acts on the chronicle the enemy before it left, and no unit of the player’s acts at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      standing('player', { q: 1, r: 0 }, { health: 4, damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 4 }),
      standing('enemy', { q: 1, r: 1 }, { move: 0 * MOVE_POINT, damage: 4 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units.map((unit) => unit.id)).toEqual([2, 3]);
});

test('an enemy with no damage attacks all the same, and removes nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 }, { move: 0, damage: 0 })],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy that is a worker attacks nothing, whatever its range and damage', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 2, r: 0 }, { worker: true, move: 0, damage: 2, range: 2 }),
    ],
  });

  expect(attacksOf(city)).toEqual([]);
});

test('a killed enemy attacks no more', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3, damage: 2 }),
    ],
  });

  const killed = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(1);

  const after = outcome(apply(CATALOGUE, killed, { type: 'end-turn' }));

  expect(attacksOf(killed)).toEqual([]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy that moves stages the tile it left and the one it reached; a stuck one stages nothing', () => {
  const moat: TileCoords[] = [
    { q: 2, r: 0 },
    { q: 3, r: -1 },
    { q: 2, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(3, moat),
    units: [
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT }),
    ],
  });

  expect(movesOf(city)).toEqual([['0,3', '0,2']]);
});

test('each enemy stages its own move and its own attacks, before the next enemy acts', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      worker({ q: 1, r: 1 }),
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT, damage: 1 }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'turn',
    'turn',
    'refreshed',
    'refreshed',
  ]);
});

test('a tile an enemy occupies yields nothing at income', () => {
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);
  const occupied = withUnits(bare, [standing('enemy', { q: 1, r: 0 })]);

  const free = outcome(apply(CATALOGUE, bare, { type: 'end-turn' }));
  const held = outcome(apply(CATALOGUE, occupied, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(held.resources[resource]).toBe(
      free.resources[resource] - (terrainKind(CATALOGUE, 'plain').yields[resource] ?? 0),
    );
  }
});

test('an enemy that reaches the city’s tile stands there, and captures the city the turn after', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('enemy', { q: 1, r: 0 }, { move: MOVE_POINT })],
  });

  const stood = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  expect(stood.units[0].tile).toEqual(CITY);
  expect(stood.ending).toBeUndefined();

  const fallen = outcome(apply(CATALOGUE, stood, { type: 'end-turn' }));
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'capture', turn: stood.turn });
  expect(fallen.turn).toBe(stood.turn);
});

test('the enemy that moves in from its camp reaches the city and captures it', () => {
  const radius = regionOf(CATALOGUE, REGION).radius;
  let chronicle = cityOf(['urban'], {
    tiles: camped(field(radius), [{ q: radius, r: 0 }]),
    timeline: RAID_ON_SECOND,
  });
  for (let turn = 0; turn < 20 && chronicle.ending === undefined; turn++) {
    chronicle = endedTurn(chronicle, 'PH_Raid');
  }

  expect(chronicle.ending).toEqual({
    outcome: 'defeat',
    cause: 'capture',
    turn: chronicle.turn,
  });
});

test('a chronicle with enemies on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});
