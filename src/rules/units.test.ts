import { expect, test } from 'vitest';
import { apply, type Command, outcome } from './chronicle';
import {
  actionOf,
  attackOn,
  CATALOGUE,
  CITY,
  cityOf,
  FOOD,
  field,
  madeOf,
  only,
  pointsOf,
  riverBetween,
  stagedBy,
  standing,
  unitNamed,
  worker,
} from './fixtures';
import { type ImprovementId, MOVE_POINT, type Tile, type TileCoords, tileKey } from './map';
import type { Chronicle } from './state';
import { attackable } from './units';

/** The same tiles, with the named ones carrying the improvement. */
function improvedWith(tiles: Tile[], improvement: ImprovementId, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) =>
    named.has(tileKey(tile))
      ? { ...tile, improvements: [...tile.improvements, improvement] }
      : tile,
  );
}

/** A unit of the player's sent to a tile, ready to hand to `apply`. */
function moveTo(unit: number, to: TileCoords): Command {
  return { type: 'move', unit, tile: to };
}

test('a move is one stage, naming the tile the unit left and the one it reached', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }),
      standing('enemy', { q: 1, r: 1 }, { health: 3 }),
    ],
  });

  const stages = apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 }));
  const [crossed] = stages;
  if (crossed.name !== 'move') throw new Error('the command staged no move');

  expect(stages.map((stage) => stage.name)).toEqual(['move']);
  expect(crossed.from).toEqual(CITY);
  expect(crossed.to).toEqual({ q: 1, r: 0 });
  expect(crossed.chronicle.units[0].tile).toEqual({ q: 1, r: 0 });
  // The unit that arrives beside an enemy leaves it alone: an arrival attacks nothing.
  expect(crossed.chronicle.units[1].stats.health).toBe(3);
});

test('a unit steps tile by tile, in as many steps as it has move points', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const first = outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })));
  expect(first.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(pointsOf(first, 1)).toBe(MOVE_POINT);

  const second = outcome(apply(CATALOGUE, first, moveTo(1, { q: 2, r: 0 })));
  expect(second.units[0].tile).toEqual({ q: 2, r: 0 });
  expect(pointsOf(second, 1)).toBe(0);

  expect(stagedBy(second, moveTo(1, { q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, second, moveTo(1, { q: 3, r: 0 })))).toBe(second);
});

test('a unit with no move points left crosses nothing until the turn ticks', () => {
  const spent = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }, 0)],
  });

  expect(stagedBy(spent, moveTo(1, { q: 1, r: 0 }))).toEqual(['refused']);

  const ticked = outcome(apply(CATALOGUE, spent, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(2 * MOVE_POINT);
  expect(outcome(apply(CATALOGUE, ticked, moveTo(1, { q: 1, r: 0 }))).units[0].tile).toEqual({
    q: 1,
    r: 0,
  });
});

test('the turn refreshes every unit to its move, and never past it', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, 0),
      standing('player', { q: 1, r: 1 }, { move: 3 * MOVE_POINT }),
      standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  const ticked = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(2 * MOVE_POINT);
  expect(pointsOf(ticked, 2)).toBe(3 * MOVE_POINT);
  expect(pointsOf(ticked, 3)).toBe(2 * MOVE_POINT);
});

test('a unit entering by its card enters with its move points full, and moves the same turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    resources: FOOD,
  });

  const entered = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(pointsOf(entered, 1)).toBe(CATALOGUE.units.PH_Worker.move);

  const moved = outcome(apply(CATALOGUE, entered, moveTo(1, { q: 1, r: 0 })));

  expect(moved.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(pointsOf(moved, 1)).toBe(CATALOGUE.units.PH_Worker.move - MOVE_POINT);
});

test('an attack by hand takes the attacker’s damage off the target and spends one action', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 2, move: 2 * MOVE_POINT }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const stages = apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 }));
  const [landed] = stages;
  if (landed.name !== 'attack') throw new Error('the command staged no attack');

  expect(stages.map((stage) => stage.name)).toEqual(['attack']);
  expect(landed.attacker).toEqual({ q: 1, r: 0 });
  expect(landed.target).toEqual({ q: 2, r: 0 });
  expect(landed.chronicle.units[1].stats.health).toBe(3);
  expect(landed.chronicle.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(actionOf(landed.chronicle, 1)).toBe(0);
  expect(pointsOf(landed.chronicle, 1)).toBe(2 * MOVE_POINT);
});

test('a unit attacks on the action it holds, and a second attack the same turn is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 2 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const once = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));

  expect(actionOf(once, 1)).toBe(0);
  expect(stagedBy(once, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, once, attackOn(1, { q: 2, r: 0 })))).toBe(once);
});

test('an attack by a worker, by a unit that is not the player’s, and by no unit at all is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 2, r: 0 }),
      standing('player', { q: 3, r: 0 }),
    ],
  });

  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, attackOn(2, { q: 3, r: 0 })))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, attackOn(10, { q: 2, r: 0 })))).toBe(city);
});

test('a worker entered by its card holds an action and attacks nothing beside it', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_Worker'],
    population: 2,
    resources: FOOD,
    units: [standing('enemy', { q: 1, r: 0 })],
  });

  const entered = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(actionOf(entered, 2)).toBeGreaterThan(0);
  expect(attackable(entered.units, unitNamed(entered, 2))).toEqual([]);
  expect(stagedBy(entered, attackOn(2, { q: 1, r: 0 }))).toEqual(['refused']);
});

test('a worker with range and damage attacks nothing all the same', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { type: 'PH_Worker', worker: true, damage: 1, range: 1 }),
      standing('enemy', { q: 2, r: 0 }),
    ],
  });

  expect(actionOf(city, 1)).toBeGreaterThan(0);
  expect(attackable(city.units, unitNamed(city, 1))).toEqual([]);
  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
});

test('an attack reaches its range and no further, and lands on a unit of another faction alone', () => {
  const units = [
    standing('player', CITY, { damage: 2, range: 1 }),
    standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    standing('player', { q: 1, r: 0 }),
  ];
  const city = cityOf(['urban'], { tiles: field(3), units });

  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, attackOn(1, { q: 1, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, attackOn(1, { q: 0, r: 1 }))).toEqual(['refused']);

  const far = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { damage: 2, range: 2 }), ...units.slice(1)],
  });

  expect(stagedBy(far, attackOn(1, { q: 2, r: 0 }))).toEqual(['attack']);
});

test('an attack that takes the target’s last health kills it, and it leaves the map', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));

  expect(after.units).toHaveLength(1);
  expect(after.units[0].faction).toBe('player');
  expect(actionOf(after, 1)).toBe(0);
});

test('a kill leaves every unit still standing commanded by the number it entered with', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
      standing('player', { q: 1, r: 0 }, { damage: 3, move: 2 * MOVE_POINT }),
      worker({ q: 0, r: 1 }),
    ],
  });

  const killed = outcome(apply(CATALOGUE, city, attackOn(2, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(2);

  const stepped = outcome(apply(CATALOGUE, killed, moveTo(2, { q: 1, r: 1 })));
  const both = outcome(apply(CATALOGUE, stepped, moveTo(3, { q: 0, r: 2 })));

  expect(unitNamed(both, 2).tile).toEqual({ q: 1, r: 1 });
  expect(unitNamed(both, 3).tile).toEqual({ q: 0, r: 2 });
});

test('a number a killed unit carried is dealt to nobody after it, and commands nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_Worker'],
    population: 3,
    resources: FOOD,
    units: [
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
    ],
  });

  const killed = outcome(apply(CATALOGUE, city, attackOn(2, { q: 2, r: 0 })));
  const entered = outcome(apply(CATALOGUE, killed, { type: 'play', index: 0, aim: 'none' }));

  expect(entered.units.map((unit) => unit.id)).toEqual([2, 3]);
  expect(stagedBy(entered, moveTo(1, { q: 0, r: 1 }))).toEqual(['refused']);
  expect(unitNamed(outcome(apply(CATALOGUE, entered, moveTo(3, { q: 0, r: 1 }))), 3).tile).toEqual({
    q: 0,
    r: 1,
  });
});

test('the turn refreshes every unit to its action, and never past it', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      standing('player', CITY, { action: 1 }, undefined, 0),
      standing('player', { q: 1, r: 1 }, { action: 2 }),
      standing('enemy', { q: 4, r: 0 }, { action: 1 }, undefined, 0),
    ],
  });

  const ticked = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(actionOf(ticked, 1)).toBe(1);
  expect(actionOf(ticked, 2)).toBe(2);
  expect(actionOf(ticked, 3)).toBe(1);
});

test('an attack spends no move points and a step no action: either follows the other', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { move: 2 * MOVE_POINT, damage: 1, range: 1 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const attackedFirst = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));
  expect(pointsOf(attackedFirst, 1)).toBe(2 * MOVE_POINT);
  const andStepped = outcome(apply(CATALOGUE, attackedFirst, moveTo(1, { q: 1, r: 1 })));
  expect(andStepped.units[0].tile).toEqual({ q: 1, r: 1 });
  expect(andStepped.units[1].stats.health).toBe(4);

  const steppedFirst = outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 1 })));
  expect(actionOf(steppedFirst, 1)).toBe(1);
  const andAttacked = outcome(apply(CATALOGUE, steppedFirst, attackOn(1, { q: 2, r: 0 })));
  expect(andAttacked.units[1].stats.health).toBe(4);
  expect(pointsOf(andAttacked, 1)).toBe(MOVE_POINT);
});

test('a chronicle with units on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY), standing('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});

test('a unit crosses within its move points, and no further', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 }))).units[0].tile).toEqual({
    q: 2,
    r: 0,
  });
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 3, r: 0 })))).toEqual(city);
});

test('a unit spends what the tile it enters costs: two plains for the one forest beside them', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 1, r: -1 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const overPlains = outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 })));
  const intoForest = outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: -1 })));

  expect(overPlains.units[0].tile).toEqual({ q: 2, r: 0 });
  expect(pointsOf(overPlains, 1)).toBe(0);
  expect(intoForest.units[0].tile).toEqual({ q: 1, r: -1 });
  expect(pointsOf(intoForest, 1)).toBe(0);
});

test('a unit with fewer move points left than a tile costs does not enter it', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 2, r: -1 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const stepped = outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: -1 })));

  expect(pointsOf(stepped, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(CATALOGUE, stepped, moveTo(1, { q: 2, r: -1 })))).toEqual(stepped);
  expect(outcome(apply(CATALOGUE, stepped, moveTo(1, { q: 2, r: -2 }))).units[0].tile).toEqual({
    q: 2,
    r: -2,
  });
});

test('a unit crossing a river spends every move point it has left, and steps no further', () => {
  const bank = { q: 1, r: 0 };
  const on = { q: 2, r: 0 };
  const city = cityOf(['urban'], {
    tiles: only(2, [CITY, bank, on]),
    rivers: [riverBetween(CITY, bank)],
    units: [standing('player', CITY, { move: 3 * MOVE_POINT })],
  });

  const crossed = outcome(apply(CATALOGUE, city, moveTo(1, bank)));

  expect(crossed.units[0].tile).toEqual(bank);
  expect(pointsOf(crossed, 1)).toBe(0);
  expect(outcome(apply(CATALOGUE, crossed, moveTo(1, on)))).toEqual(crossed);
});

test('a unit crosses a river only where the move points it has left cover the far tile in full', () => {
  const bank = { q: 1, r: 0 };
  const across = { q: 2, r: 0 };
  const beside = { q: 1, r: -1 };
  /** One forest across a river, the plain on this bank it is reached from, and a plain to turn to. */
  const shore = (move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: madeOf(only(2, [CITY, bank, across, beside]), 'forest', [across]),
      rivers: [riverBetween(bank, across)],
      units: [standing('player', CITY, { move })],
    });

  const short = outcome(apply(CATALOGUE, shore(2 * MOVE_POINT), moveTo(1, bank)));
  const long = outcome(apply(CATALOGUE, shore(4 * MOVE_POINT), moveTo(1, bank)));
  const crossed = outcome(apply(CATALOGUE, long, moveTo(1, across)));

  expect(pointsOf(short, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(CATALOGUE, short, moveTo(1, across)))).toEqual(short);
  expect(outcome(apply(CATALOGUE, short, moveTo(1, beside))).units[0].tile).toEqual(beside);
  expect(pointsOf(long, 1)).toBe(3 * MOVE_POINT);
  expect(crossed.units[0].tile).toEqual(across);
  expect(pointsOf(crossed, 1)).toBe(0);
});

test('a unit crosses further over a road than beside it: half a move point to the tile', () => {
  const road = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];
  const city = cityOf(['urban'], {
    tiles: improvedWith(field(4), 'PH_Road', road),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, sight: 4 })],
  });

  const along = outcome(apply(CATALOGUE, city, moveTo(1, { q: 4, r: 0 })));

  expect(along.units[0].tile).toEqual({ q: 4, r: 0 });
  expect(pointsOf(along, 1)).toBe(0);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 1 }))).units[0].tile).toEqual({
    q: 2,
    r: 1,
  });
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 3, r: 1 })))).toEqual(city);
});

test('a river edge with a road on both banks is a bridge, crossed as if no river ran there', () => {
  const bank = { q: 1, r: 0 };
  const across = { q: 2, r: 0 };
  const on = { q: 3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: improvedWith(field(3), 'PH_Road', [bank, across]),
    rivers: [riverBetween(bank, across)],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, sight: 4 })],
  });

  const crossed = outcome(apply(CATALOGUE, city, moveTo(1, across)));

  expect(crossed.units[0].tile).toEqual(across);
  expect(pointsOf(crossed, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(CATALOGUE, crossed, moveTo(1, on))).units[0].tile).toEqual(on);
});

test('a road on one bank alone leaves the crossing spending every move point', () => {
  const bank = { q: 1, r: 0 };
  const across = { q: 2, r: 0 };
  const on = { q: 3, r: 0 };
  const shore = (roads: TileCoords[]): Chronicle =>
    cityOf(['urban'], {
      tiles: improvedWith(field(3), 'PH_Road', roads),
      rivers: [riverBetween(bank, across)],
      units: [standing('player', CITY, { move: 2 * MOVE_POINT, sight: 4 })],
    });

  for (const roads of [[bank], [across]]) {
    const crossed = outcome(apply(CATALOGUE, shore(roads), moveTo(1, across)));

    expect(crossed.units[0].tile).toEqual(across);
    expect(pointsOf(crossed, 1)).toBe(0);
    expect(outcome(apply(CATALOGUE, crossed, moveTo(1, on)))).toEqual(crossed);
  }
});

test('a layer naming a movement cost that does not bridge leaves the crossing spending every move point', () => {
  const bank = { q: 1, r: 0 };
  const across = { q: 2, r: 0 };
  const on = { q: 3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: improvedWith(field(3), 'PH_Trail', [bank, across]),
    rivers: [riverBetween(bank, across)],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, sight: 4 })],
  });

  const crossed = outcome(apply(CATALOGUE, city, moveTo(1, across)));

  expect(crossed.units[0].tile).toEqual(across);
  expect(pointsOf(crossed, 1)).toBe(0);
  expect(outcome(apply(CATALOGUE, crossed, moveTo(1, on)))).toEqual(crossed);
});

test('a tile two layers each name a movement cost for costs the lower, whichever came first', () => {
  const line = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
    { q: 3, r: 0 },
    { q: 4, r: 0 },
  ];

  for (const [first, second] of [
    ['PH_Road', 'PH_Trail'],
    ['PH_Trail', 'PH_Road'],
  ]) {
    const city = cityOf(['urban'], {
      tiles: improvedWith(improvedWith(field(4), first, line), second, line),
      units: [standing('player', CITY, { move: 2 * MOVE_POINT, sight: 4 })],
    });

    const along = outcome(apply(CATALOGUE, city, moveTo(1, { q: 4, r: 0 })));

    expect(along.units[0].tile).toEqual({ q: 4, r: 0 });
    expect(pointsOf(along, 1)).toBe(0);
  }
});

test('a layer naming a movement cost above its terrain’s takes the tile to it', () => {
  const heaped = { q: 1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: improvedWith(field(3), 'PH_Rubble', [heaped]),
    units: [standing('player', CITY, { move: 3 * MOVE_POINT, sight: 4 })],
  });

  const entered = outcome(apply(CATALOGUE, city, moveTo(1, heaped)));

  expect(entered.units[0].tile).toEqual(heaped);
  expect(pointsOf(entered, 1)).toBe(MOVE_POINT);
});

test('a unit crosses to a tile the cheapest way, not the fewest tiles', () => {
  /** A hill the whole disc is in sight from, two forests on the straight line east of it. */
  const watch = { q: 0, r: -1 };
  const city = cityOf(['urban'], {
    tiles: madeOf(
      madeOf(field(3), 'forest', [
        { q: 1, r: -1 },
        { q: 2, r: -1 },
      ]),
      'hills',
      [watch],
    ),
    units: [standing('player', watch, { move: 4 * MOVE_POINT, sight: 4 })],
  });

  // The three tiles straight there cost five; the four round the forests cost four.
  const round = outcome(apply(CATALOGUE, city, moveTo(1, { q: 3, r: -1 })));

  expect(round.units[0].tile).toEqual({ q: 3, r: -1 });
  expect(pointsOf(round, 1)).toBe(0);
});

test('water is crossed by nobody, and so is everything only water leads to', () => {
  const city = cityOf(['urban'], {
    tiles: field(2, [{ q: 1, r: 0 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 1 }))).units[0].tile).toEqual({
    q: 1,
    r: 1,
  });
});

test('a tile costing more than a unit’s move is beyond it, however often it refreshes', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 1, r: 0 }]),
    units: [standing('player', CITY, { move: MOVE_POINT })],
  });

  expect(pointsOf(city, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 0, r: 1 }))).units[0].tile).toEqual({
    q: 0,
    r: 1,
  });

  const ticked = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(CATALOGUE, ticked, moveTo(1, { q: 1, r: 0 })))).toEqual(ticked);
});

test('a unit crosses its own faction but never lands on it', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('player', { q: 1, r: 0 })],
  });

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 }))).units[0].tile).toEqual({
    q: 2,
    r: 0,
  });
});

test('the other faction stops a unit where it stands', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT, damage: 0 }),
      standing('enemy', { q: 1, r: 0 }),
    ],
  });

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 })))).toEqual(city);
});

test('a move of a unit that is not the player’s, or of no unit at all, is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('enemy', { q: 2, r: 0 })],
  });

  expect(stagedBy(city, moveTo(2, { q: 2, r: 1 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, moveTo(2, { q: 2, r: 1 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(5, { q: 1, r: 0 })))).toEqual(city);
});

test('a unit walled in by water crosses nowhere at all', () => {
  const walled: TileCoords[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(2, walled),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  for (const to of walled) expect(outcome(apply(CATALOGUE, city, moveTo(1, to)))).toEqual(city);
});

test('the same move on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT, damage: 2, range: 1 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });
  const untouched = structuredClone(city);

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(
    outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});
