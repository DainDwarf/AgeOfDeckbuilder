import { expect, test } from 'vitest';
import { DECKS } from './cards';
import { apply, outcome } from './chronicle';
import { cityCommand, claimable } from './city';
import {
  attackOn,
  buildingAt,
  CAMPS,
  CITY,
  camped,
  cityOf,
  claimOf,
  culture,
  endedTurn,
  enemiesOf,
  everyCard,
  field,
  founded,
  fullDraw,
  madeOf,
  NO_GROWTH,
  only,
  pointsOf,
  riverBetween,
  stagedBy,
  standing,
  throughSchedule,
  toFirstRaid,
  WORKER,
  withUnits,
  worker,
} from './fixtures';
import {
  distance,
  MAP_COMPOSITION,
  MOVE_POINT,
  type River,
  TERRAIN_YIELDS,
  type TileCoords,
  tileKey,
} from './map';
import { RESOURCES } from './resources';
import type { Chronicle } from './state';

/** Every attack the end of turn stages, as the tile each was made from and the tile it was aimed at. */
function attacksOf(chronicle: Chronicle): string[][] {
  return apply(chronicle, { type: 'end-turn' }).flatMap((stage) =>
    stage.name === 'attack' ? [[tileKey(stage.attacker), tileKey(stage.target)]] : [],
  );
}

/** Every move the end of turn stages, as the tile each enemy left and the tile it reached. */
function movesOf(chronicle: Chronicle): string[][] {
  return apply(chronicle, { type: 'end-turn' }).flatMap((stage) =>
    stage.name === 'move' ? [[tileKey(stage.from), tileKey(stage.to)]] : [],
  );
}

/** Every camp the end of turn stages a capture of, as the tile each stood on. */
function capturesOf(chronicle: Chronicle): string[] {
  return apply(chronicle, { type: 'end-turn' }).flatMap((stage) =>
    stage.name === 'camp-capture' ? [tileKey(stage.tile)] : [],
  );
}

test('a capture ends the end of turn on its own stage, with the defeat set', () => {
  const overrun = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    drawPile: ['PH_Worker', 'PH_Warrior'],
    units: [standing('enemy', CITY)],
  });

  const stages = apply(overrun, { type: 'end-turn' });
  const last = stages[stages.length - 1];

  expect(stages.map((stage) => stage.name)).toEqual(['discard', 'capture']);
  expect(last.chronicle.defeat).toEqual({ cause: 'capture', turn: overrun.turn });
  expect(last.chronicle.turn).toBe(overrun.turn);
  expect(last.chronicle.hand).toEqual([]);
});

test('a camp captured at the end of the turn leaves its tile claimed like any other', () => {
  const camp = { q: 2, r: 0 };
  const besieging = founded(3, {
    ...NO_GROWTH,
    tiles: camped(field(3), [camp]),
    resources: culture(9),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = outcome(apply(besieging, { type: 'end-turn' }));

  expect(capturesOf(besieging)).toEqual([tileKey(camp)]);
  expect(claimable(taken).map(tileKey)).toContain(tileKey(camp));
  expect(cityCommand(taken, camp)).toEqual(claimOf(camp));
  expect(stagedBy(taken, claimOf(camp))).toEqual(['claim']);
  expect(outcome(apply(taken, claimOf(camp))).held.map(tileKey)).toContain(tileKey(camp));
});

test('a unit of the player’s standing on a camp when the turn ends captures it', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = outcome(apply(besieging, { type: 'end-turn' }));

  expect(stagedBy(besieging, { type: 'end-turn' })).toEqual([
    'income',
    'camp-capture',
    'turn',
    'draw',
  ]);
  expect(capturesOf(besieging)).toEqual([tileKey(camp)]);
  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual(['PH_Spoils']);
});

test('a worker of the player’s captures a camp as any unit does', () => {
  const camp = { q: 4, r: 0 };
  const worked = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [worker(camp)],
  });

  const taken = outcome(apply(worked, { type: 'end-turn' }));

  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual(['PH_Spoils']);
});

test('a unit killed in the enemy phase captures the camp it stood on no longer', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    units: [worker(camp), standing('enemy', { q: 3, r: 0 }, { damage: WORKER.health })],
  });

  const taken = outcome(apply(besieging, { type: 'end-turn' }));

  expect(taken.units.some((unit) => unit.faction === 'player')).toBe(false);
  expect(buildingAt(taken, camp)).toBe('PH_Camp');
  expect(taken.discardPile).toEqual([]);
});

test('a chronicle that fell in the enemy phase captures no camp', () => {
  const camp = { q: 4, r: 0 };
  const overrun = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [standing('player', camp), standing('enemy', CITY)],
  });

  const fallen = outcome(apply(overrun, { type: 'end-turn' }));

  expect(stagedBy(overrun, { type: 'end-turn' })).toEqual(['capture']);
  expect(buildingAt(fallen, camp)).toBe('PH_Camp');
  expect(fallen.discardPile).toEqual([]);
});

test('a captured camp is silent: the raid enters on a camp still standing', () => {
  const [kept, ...besieged] = CAMPS;
  const held = cityOf(['urban'], {
    tiles: camped(field(4), CAMPS),
    units: besieged.map(worker),
  });

  const raided = toFirstRaid(held);

  for (const camp of besieged) expect(buildingAt(raided, camp)).toBeUndefined();
  expect(buildingAt(raided, kept)).toBe('PH_Camp');
  expect(raided.units.find((unit) => unit.faction === 'enemy')?.tile).toEqual(kept);
});

test('a chronicle whose every camp is captured takes no raider at all', () => {
  const held = cityOf(['urban'], { tiles: camped(field(4), CAMPS), units: CAMPS.map(worker) });

  const raided = throughSchedule(held);

  expect(raided.tiles.some((tile) => tile.building === 'PH_Camp')).toBe(false);
  expect(enemiesOf(raided)).toEqual([]);
});

test('two camps captured in one turn lay two cards in the discard pile', () => {
  const camps = [
    { q: 4, r: 0 },
    { q: 0, r: 4 },
  ];
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), camps),
    drawPile: fullDraw(),
    units: camps.map((camp) => standing('player', camp)),
  });

  const taken = outcome(apply(besieging, { type: 'end-turn' }));

  expect(capturesOf(besieging)).toEqual(
    besieging.tiles.filter((tile) => tile.building === 'PH_Camp').map(tileKey),
  );
  for (const camp of camps) expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual(['PH_Spoils', 'PH_Spoils']);
});

test('the camp’s reward card is single use: played, it gains and leaves the chronicle', () => {
  const city = cityOf(['urban'], { hand: ['PH_Spoils'] });

  const played = outcome(apply(city, { type: 'play', index: 0, aim: 'none' }));

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual(['played']);
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

test('the camp’s reward card discarded unplayed comes around like any card', () => {
  const city = cityOf(['urban'], { ...NO_GROWTH, hand: ['PH_Spoils'], drawPile: fullDraw() });

  const ended = outcome(apply(city, { type: 'end-turn' }));

  expect(ended.discardPile).toEqual(['PH_Spoils']);
  expect(everyCard(outcome(apply(ended, { type: 'end-turn' })))).toContain('PH_Spoils');
});

test('no deck a chronicle is founded on holds the camp’s reward card', () => {
  for (const deck of Object.values(DECKS)) expect(deck).not.toContain('PH_Spoils');
});

test('an enemy moves its move toward the city, turn after turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(city, { type: 'end-turn' }));

  expect(distance(moved.units[0].tile, CITY)).toBe(2);
  expect(distance(outcome(apply(moved, { type: 'end-turn' })).units[0].tile, CITY)).toBe(0);
});

test('an enemy spends the move points it crosses on, and carries them into the turn refreshed', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const stages = apply(city, { type: 'end-turn' });
  const crossed = stages.find((stage) => stage.name === 'move');
  if (crossed === undefined) throw new Error('the enemy phase staged no move');

  expect(pointsOf(crossed.chronicle, 1)).toBe(0);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
});

test('a forest on an enemy’s way costs it what the tile says, and keeps it off the city', () => {
  /** One corridor to the city, forked: the straight way through one tile, the way round through two. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 1, r: -1 }];
  const raider = standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT, damage: 0 });
  const plains = cityOf(['urban'], { tiles: only(2, corridor), units: [raider] });
  const wooded = cityOf(['urban'], {
    tiles: madeOf(only(2, corridor), 'forest', [{ q: 1, r: 0 }]),
    units: [raider],
  });

  expect(movesOf(plains)).toEqual([['2,0', '0,0']]);
  expect(movesOf(wooded)).toEqual([['2,0', '1,-1']]);
});

test('an enemy weighs a crossing as its whole move, and turns for the city instead of taking it', () => {
  const bank = { q: 4, r: 0 };
  const across = { q: 5, r: 0 };
  /** One corridor east of the city, with the player's unit on the far end of it. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, bank, across];
  const beset = (rivers: River[]): Chronicle =>
    cityOf(['urban'], {
      tiles: only(5, corridor),
      rivers,
      units: [
        standing('player', across),
        standing('enemy', { q: 3, r: 0 }, { move: 3 * MOVE_POINT }),
      ],
    });

  expect(movesOf(beset([]))).toEqual([['3,0', '4,0']]);
  expect(movesOf(beset([riverBetween(bank, across)]))).toEqual([['3,0', '0,0']]);
});

test('an enemy moves toward the nearest of the player’s units instead of the city', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(city, { type: 'end-turn' }));

  expect(distance(moved.units[1].tile, { q: 2, r: 0 })).toBe(1);
});

test('an enemy moves within range of a unit and attacks it in the same enemy phase', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 2, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(['income', 'move', 'attack', 'turn']);
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

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(['income', 'move', 'turn']);
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
    const after = outcome(apply(city, { type: 'end-turn' }));
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

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units.map((unit) => unit.id)).toEqual([2, 3]);
});

test('a killed enemy attacks no more', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3, damage: 2 }),
    ],
  });

  const killed = outcome(apply(city, attackOn(1, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(1);

  const after = outcome(apply(killed, { type: 'end-turn' }));

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
    'income',
    'move',
    'attack',
    'move',
    'attack',
    'turn',
  ]);
});

test('a tile an enemy occupies yields nothing at income', () => {
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);
  const occupied = withUnits(bare, [standing('enemy', { q: 1, r: 0 })]);

  const free = outcome(apply(bare, { type: 'end-turn' }));
  const held = outcome(apply(occupied, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(held.resources[resource]).toBe(
      free.resources[resource] - (TERRAIN_YIELDS.plain[resource] ?? 0),
    );
  }
});

test('an enemy on the city’s tile attacks nothing, and captures the city the turn after', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      worker({ q: 0, r: 1 }),
      standing('enemy', { q: 1, r: 0 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  const stood = outcome(apply(city, { type: 'end-turn' }));
  expect(stood.units[1].tile).toEqual(CITY);
  expect(attacksOf(city)).toEqual([]);
  expect(stood.units[0].stats.health).toBe(city.units[0].stats.health);
  expect(stood.defeat).toBeUndefined();

  const fallen = outcome(apply(stood, { type: 'end-turn' }));
  expect(fallen.defeat).toEqual({ cause: 'capture', turn: stood.turn });
  expect(fallen.turn).toBe(stood.turn);
});

test('the enemy that moves in from its camp reaches the city and captures it', () => {
  const radius = MAP_COMPOSITION.radius;
  let chronicle = cityOf(['urban'], {
    tiles: camped(field(radius), [{ q: radius, r: 0 }]),
  });
  for (let turn = 0; turn < 20 && chronicle.defeat === undefined; turn++) {
    chronicle = endedTurn(chronicle, 'PH_Raid');
  }

  expect(chronicle.defeat?.cause).toBe('capture');
  expect(chronicle.defeat?.turn).toBe(chronicle.turn);
});

test('a chronicle with enemies on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});
