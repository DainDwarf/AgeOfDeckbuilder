import { expect, test } from 'vitest';
import { bonusCarried, bonusOf, unitKind } from './catalogue';
import {
  anythingByHand,
  apply,
  broughtInRange,
  byHand,
  type Command,
  declaresWar,
  outcome,
} from './chronicle';
import { warDeclared } from './city';
import {
  actionOf,
  aimedAt,
  aimedAtNothing,
  attackOn,
  attacksOf,
  besideTheNeutral,
  CATALOGUE,
  CITY,
  cityOf,
  deepBut,
  EMBARKED_MOVE,
  FOOD,
  field,
  madeOf,
  NEUTRAL_TILE,
  namesOf,
  neutralStanding,
  only,
  plains,
  pointsOf,
  riverBetween,
  type Standing,
  stagedBy,
  standing,
  unitNamed,
  withUnits,
  worker,
} from './fixtures';
import { MOVE_POINT, sameTile, type TileCoords, tileKey } from './map';
import { walked } from './stages';
import type { Chronicle } from './state';
import { attackable, type Faction, pathTo, relationsOf, type Unit } from './units';

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
  const [crossed] = walked(stages);
  if (crossed.name !== 'move') throw new Error('the command staged no move');

  expect(namesOf(stages)).toEqual(['move']);
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

  const entered = outcome(apply(CATALOGUE, city, aimedAtNothing(city)));

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
  const [landed, spent, damaged] = walked(stages);
  if (landed.name !== 'attack') throw new Error('the command staged no attack');

  expect(namesOf(stages)).toEqual(['attack', 'action-spent', 'damaged']);
  expect(spent).toMatchObject({ tile: { q: 1, r: 0 } });
  expect(actionOf(spent.chronicle, 1)).toBe(0);
  expect(spent.chronicle.units[1].stats.health).toBe(5);
  expect(damaged).toMatchObject({ tile: { q: 2, r: 0 } });
  expect(landed.chronicle).toBe(damaged.chronicle);
  expect(landed.attacker).toEqual({ q: 1, r: 0 });
  expect(landed.target).toEqual({ q: 2, r: 0 });
  expect(landed.chronicle.units[1].stats.health).toBe(3);
  expect(landed.chronicle.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(actionOf(landed.chronicle, 1)).toBe(0);
  expect(pointsOf(landed.chronicle, 1)).toBe(0);
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

  const entered = outcome(apply(CATALOGUE, city, aimedAtNothing(city)));

  expect(actionOf(entered, 2)).toBeGreaterThan(0);
  expect(attackable(entered.units, unitNamed(entered, 2), relationsOf(entered))).toEqual([]);
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
  expect(attackable(city.units, unitNamed(city, 1), relationsOf(city))).toEqual([]);
  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
});

test('an attack reaches its range and no further, and lands on a unit of another faction alone', () => {
  const units = [
    standing('player', CITY, { damage: 2, range: 1 }, 0),
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

  expect(stagedBy(far, attackOn(1, { q: 2, r: 0 }))).toEqual(['attack', 'action-spent', 'damaged']);
});

test('an attack removes the attacker’s damage and the bonus of a unit of its faction beside it, and none for one two tiles off or one of another faction beside it', () => {
  const attacker = { q: 1, r: 0 };
  const target = { q: 2, r: 0 };
  const damage = 2;
  const chief = (faction: Faction, tile: TileCoords): Standing =>
    standing(faction, tile, { type: 'PH_Chief', move: 0 });
  const struck = (units: Standing[]): { lost: number; carried: number } => {
    const city = cityOf(['urban'], {
      tiles: field(3),
      units: [
        standing('player', attacker, { damage }),
        standing('enemy', target, { health: 9 }),
        ...units,
      ],
    });
    const after = outcome(apply(CATALOGUE, city, attackOn(1, target)));
    return {
      lost: unitNamed(city, 2).stats.health - unitNamed(after, 2).stats.health,
      carried: bonusCarried(CATALOGUE, city.units, unitNamed(city, 1)),
    };
  };
  const bonus = bonusOf(CATALOGUE, unitKind(CATALOGUE, 'PH_Chief'));

  expect(bonus).toBeGreaterThan(0);
  expect(struck([chief('player', { q: 1, r: -1 })])).toEqual({
    lost: damage + bonus,
    carried: bonus,
  });
  expect(struck([chief('player', { q: -1, r: 0 })])).toEqual({ lost: damage, carried: 0 });
  expect(struck([chief('enemy', { q: 1, r: -1 })])).toEqual({ lost: damage, carried: 0 });
});

test('an attack lands only on a unit standing on a tile in sight, whatever sees the tile', () => {
  const hidden = { q: 2, r: 0 };
  const seen = { q: 0, r: 2 };
  const tiles = madeOf(field(3), 'hills', [{ q: 1, r: 0 }]);
  const units = [
    standing('player', CITY, { damage: 2, range: 2 }),
    standing('enemy', hidden, { health: 5 }),
    standing('enemy', seen, { health: 5 }),
  ];
  const city = cityOf(['urban'], { tiles, units });

  expect(byHand(CATALOGUE, city, unitNamed(city, 1)).targets.map(({ tile }) => tile)).toEqual([
    seen,
  ]);
  expect(stagedBy(city, attackOn(1, hidden))).toEqual(['refused']);
  expect(stagedBy(city, attackOn(1, seen))).toEqual(['attack', 'action-spent', 'damaged']);

  const watched = cityOf(['urban'], { tiles, units: [...units, worker({ q: 2, r: 1 })] });

  expect(stagedBy(watched, attackOn(1, hidden))).toEqual(['attack', 'action-spent', 'damaged']);
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
  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['attack', 'action-spent', 'killed']);
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

  const ticked = outcome(apply(CATALOGUE, killed, { type: 'end-turn' }));
  const stepped = outcome(apply(CATALOGUE, ticked, moveTo(2, { q: 1, r: 1 })));
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
  const entered = outcome(apply(CATALOGUE, killed, aimedAtNothing(killed)));

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

test('an attack spends the move points the attacker has left, and a step no action: a unit moves, then acts', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { move: 2 * MOVE_POINT, damage: 1, range: 1 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const attackedFirst = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));
  expect(pointsOf(attackedFirst, 1)).toBe(0);
  expect(stagedBy(attackedFirst, moveTo(1, { q: 1, r: 1 }))).toEqual(['refused']);

  const steppedFirst = outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 1 })));
  expect(actionOf(steppedFirst, 1)).toBe(1);
  const andAttacked = outcome(apply(CATALOGUE, steppedFirst, attackOn(1, { q: 2, r: 0 })));
  expect(andAttacked.units[1].stats.health).toBe(4);
  expect(pointsOf(andAttacked, 1)).toBe(0);
});

test('an attack on a unit a step brings in range is the move to the landing and then the attack from it, the action spent there; a unit already in range is attacked with no step', () => {
  const near = { q: 1, r: -1 };
  const far = { q: 2, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', CITY, { damage: 2, range: 1 }),
      standing('enemy', near, { health: 5 }),
      standing('enemy', far, { health: 5 }),
    ],
  });
  const [attacker] = city.units;
  const landing = { q: 1, r: 0 };

  expect(
    broughtInRange(CATALOGUE, city, attacker).map((stepped) => [
      stepped.target.tile,
      stepped.landing,
    ]),
  ).toEqual([[far, { tile: landing, cost: MOVE_POINT }]]);

  const stages = apply(CATALOGUE, city, attackOn(attacker.id, far));
  const [crossed, struck] = stages;
  const after = outcome(stages);

  expect(namesOf(stages)).toEqual(['move', 'attack', 'action-spent', 'damaged']);
  expect(crossed).toMatchObject({ from: CITY, to: landing });
  expect(struck).toMatchObject({ attacker: landing, target: far });
  expect(unitNamed(after, attacker.id).tile).toEqual(landing);
  expect(actionOf(after, attacker.id)).toBe(0);
  expect(pointsOf(after, attacker.id)).toBe(0);
  expect(unitNamed(after, 3).stats.health).toBe(3);

  expect(stagedBy(city, attackOn(attacker.id, near))).toEqual([
    'attack',
    'action-spent',
    'damaged',
  ]);
  expect(
    unitNamed(outcome(apply(CATALOGUE, city, attackOn(attacker.id, near))), attacker.id).tile,
  ).toEqual(CITY);
});

test('of the landings a step brings a unit in range from, it attacks from the cheapest, then the one its path reaches over the fewest tiles, then the one nearest the straight line', () => {
  /** The landing the chronicle's first unit attacks the unit on the tile from. */
  const from = (chronicle: Chronicle, target: TileCoords): string | undefined => {
    const [unit] = chronicle.units;
    const stepped = broughtInRange(CATALOGUE, chronicle, unit).find(({ target: other }) =>
      sameTile(other.tile, target),
    );
    const after = outcome(apply(CATALOGUE, chronicle, attackOn(unit.id, target)));
    expect(unitNamed(after, unit.id).tile).toEqual(stepped?.landing.tile);
    return stepped === undefined ? undefined : tileKey(stepped.landing.tile);
  };
  const moving = { move: 3 * MOVE_POINT, sight: 4 };
  const aslant = { q: 3, r: -2 };

  // Both three tiles long; the one nearer the line crosses a forest. The worker sees what the forest
  // hides from the unit.
  const forest = cityOf(['urban'], {
    tiles: madeOf(field(4), 'forest', [{ q: 2, r: -1 }]),
    units: [standing('player', CITY, moving), standing('enemy', aslant), worker({ q: 4, r: -3 })],
  });
  // Across a river for every point it has left, or three plains round its own units for as many.
  const diagonal = { q: 2, r: -1 };
  const river = cityOf(['urban'], {
    tiles: field(4),
    rivers: [riverBetween({ q: 1, r: -1 }, { q: 2, r: -2 })],
    units: [
      standing('player', CITY, moving),
      standing('player', { q: 1, r: 0 }),
      standing('player', { q: 1, r: -1 }),
      standing('player', { q: 2, r: 0 }),
      standing('enemy', diagonal),
    ],
  });
  // As cheap and as long either way; the first in the map's order lies further off the line.
  const open = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('player', CITY, moving), standing('enemy', aslant)],
  });

  expect(from(forest, aslant)).toBe('2,-2');
  expect(from(river, diagonal)).toBe('2,-2');
  expect(from(open, aslant)).toBe('2,-1');
});

/** The chronicle's one unit of the player's. */
function playerOf(chronicle: Chronicle): Unit {
  const unit = chronicle.units.find(({ faction }) => faction === 'player');
  if (unit === undefined) throw new Error('no unit of the player’s stands');
  return unit;
}

test('a step that declares war brings a unit in range only where no other landing does, and the war is declared once', () => {
  const target = { q: 2, r: 0 };
  const attacker = standing('player', CITY);
  const open = withUnits(besideTheNeutral(), [attacker, standing('enemy', target)]);
  const lined = withUnits(onTheLine(attacker), [neutralStanding(target)]);
  const attackOf = (chronicle: Chronicle): Command => attackOn(playerOf(chronicle).id, target);
  /** Where the chronicle's one unit of the player's attacks the target from. */
  const landingOf = (chronicle: Chronicle): TileCoords | undefined =>
    broughtInRange(CATALOGUE, chronicle, playerOf(chronicle)).find((stepped) =>
      sameTile(stepped.target.tile, target),
    )?.landing.tile;

  expect(landingOf(open)).toBeDefined();
  expect(landingOf(open)).not.toEqual(NEUTRAL_TILE);
  expect(stagedBy(open, attackOf(open))).toEqual(['move', 'attack', 'action-spent', 'damaged']);
  expect(landingOf(lined)).toEqual(NEUTRAL_TILE);
  expect(stagedBy(lined, attackOf(lined))).toEqual([
    'relations',
    'move',
    'attack',
    'action-spent',
    'damaged',
  ]);
  expect(declaresWar(CATALOGUE, lined, attackOf(lined))).toBe(true);
});

/** Whether the chronicle's one unit of the player's has anything to do by hand, the war counted and not. */
function anythingOf(chronicle: Chronicle): { warCounted: boolean; warNotCounted: boolean } {
  const unit = playerOf(chronicle);
  return {
    warCounted: anythingByHand(CATALOGUE, chronicle, unit, true),
    warNotCounted: anythingByHand(CATALOGUE, chronicle, unit, false),
  };
}

const NOTHING = { warCounted: false, warNotCounted: false };
const SOMETHING = { warCounted: true, warNotCounted: true };

test('a unit with no tile in its reach and no unit in its attack’s reach has nothing to do by hand, and a landing or a unit in its attack’s reach gives it something', () => {
  const spent = standing('player', CITY, {}, 0);
  const on = (units: Standing[]): Chronicle => cityOf(['urban'], { tiles: field(3), units });

  expect(anythingOf(on([spent]))).toEqual(NOTHING);
  expect(anythingOf(on([spent, standing('enemy', { q: 1, r: 0 })]))).toEqual(SOMETHING);
  expect(anythingOf(on([standing('player', CITY)]))).toEqual(SOMETHING);
});

test('a unit of the neutral’s at peace in a unit’s attack’s reach gives it something to do by hand only where the war is counted, and a hostile one either way', () => {
  const atPeace = withUnits(besideTheNeutral(), [
    standing('player', CITY, {}, 0),
    neutralStanding(NEUTRAL_TILE),
  ]);

  expect(anythingOf(atPeace)).toEqual({ warCounted: true, warNotCounted: false });
  expect(anythingOf(warDeclared(atPeace).chronicle)).toEqual(SOMETHING);
});

test('a unit on a tile out of sight in a unit’s attack’s reach gives it nothing to do by hand, and the same unit seen gives it something', () => {
  const tiles = madeOf(field(3), 'hills', [{ q: 1, r: 0 }]);
  const units = [standing('player', CITY, { range: 2 }, 0), standing('enemy', { q: 2, r: 0 })];

  expect(anythingOf(cityOf(['urban'], { tiles, units }))).toEqual(NOTHING);
  expect(
    anythingOf(cityOf(['urban'], { tiles, units: [...units, worker({ q: 2, r: 1 })] })),
  ).toEqual(SOMETHING);
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

test('a unit’s path is a cheapest way over the fewest tiles, nearest the straight line and through its own units, and walked step by step it spends what its landing costs', () => {
  const moving = { move: 3 * MOVE_POINT, sight: 3 };
  /** The path of the chronicle's first unit to the tile, by tile key. */
  const pathOf = (chronicle: Chronicle, to: TileCoords): string[] | undefined =>
    pathTo(CATALOGUE, chronicle, chronicle.units[0], to)?.map(tileKey);

  // Straight across the river, or onto the plain on this bank and across from there: either spends
  // every point.
  const bank = { q: 1, r: -1 };
  const across = { q: 1, r: 0 };
  const river = cityOf(['urban'], {
    tiles: only(2, [CITY, bank, across]),
    rivers: [riverBetween(CITY, across), riverBetween(bank, across)],
    units: [standing('player', CITY, moving)],
  });
  // The forest and the plain beyond it, or the three plains round it: three points either way. The
  // worker sees what the forest hides from the unit.
  const beyond = { q: 2, r: 0 };
  const forest = cityOf(['urban'], {
    tiles: madeOf(field(3), 'forest', [{ q: 1, r: 0 }]),
    units: [standing('player', CITY, moving), worker({ q: 2, r: 1 })],
  });
  const far = { q: 3, r: -1 };
  const open = cityOf(['urban'], { tiles: field(3), units: [standing('player', CITY, moving)] });
  const crowded = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY), standing('player', { q: 1, r: 0 })],
  });

  expect(pathOf(river, across)).toEqual(['0,0', '1,0']);
  expect(pathOf(forest, beyond)).toEqual(['0,0', '1,0', '2,0']);
  expect(pathOf(open, far)).toEqual(['0,0', '1,0', '2,-1', '3,-1']);
  expect(pathOf(crowded, beyond)).toEqual(['0,0', '1,0', '2,0']);

  for (const [chronicle, to] of [
    [river, across],
    [forest, beyond],
    [open, far],
  ] as const) {
    const [unit] = chronicle.units;
    const landing = byHand(CATALOGUE, chronicle, unit).landings.find(
      ({ tile }) => tileKey(tile) === tileKey(to),
    );
    if (landing === undefined) throw new Error(`${tileKey(to)} is no landing`);
    let walked = chronicle;
    for (const tile of pathTo(CATALOGUE, chronicle, unit, to)?.slice(1) ?? []) {
      walked = outcome(apply(CATALOGUE, walked, moveTo(unit.id, tile)));
    }

    expect(unitNamed(walked, unit.id).tile).toEqual(to);
    expect(pointsOf(walked, unit.id)).toBe(unit.movePoints - landing.cost);
  }
});

test('water is crossed by no unit ashore, and neither is everything only water leads to', () => {
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
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('enemy', { q: 1, r: 0 })],
  });

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 2, r: 0 })))).toEqual(city);
});

test('a unit of the neutral’s neither lands on nor crosses a tile the player holds, where an enemy lands on it and crosses it', () => {
  const line = [{ q: -2, r: 0 }, { q: -1, r: 0 }, CITY, { q: 1, r: 0 }, { q: 2, r: 0 }];
  const from = { q: 2, r: 0 };
  const stats = { move: 4 * MOVE_POINT };
  const landed = (unit: Standing): string[] => {
    const city = cityOf(['urban'], { tiles: only(2, line), units: [unit] });
    return byHand(CATALOGUE, city, unitNamed(city, 1)).landings.map(({ tile }) => tileKey(tile));
  };

  expect(landed(neutralStanding(from, { stats }))).toEqual(['1,0']);
  expect(landed(standing('enemy', from, stats))).toEqual(['-2,0', '-1,0', '0,0', '1,0']);
});

/**
 * `besideTheNeutral` on one line of plain, west of the city to east of the neutral's city, with the
 * unit standing on it.
 */
function onTheLine(unit: Standing): Chronicle {
  const line = [{ q: -1, r: 0 }, CITY, NEUTRAL_TILE, { q: 2, r: 0 }];
  return withUnits(besideTheNeutral({}, deepBut(plains(3), line)), [unit]);
}

/** The tiles the chronicle's one unit lands on by hand. */
function landingsOf(chronicle: Chronicle): string[] {
  const [unit] = chronicle.units;
  return byHand(CATALOGUE, chronicle, unit).landings.map(({ tile }) => tileKey(tile));
}

test('at peace a unit of the player’s lands on a tile the neutral holds and crosses none to the tile beyond it; hostile, it crosses it', () => {
  const opened = onTheLine(standing('player', { q: -1, r: 0 }, { move: 4 * MOVE_POINT }));

  expect(landingsOf(opened)).toEqual(['0,0', '1,0']);
  expect(landingsOf(warDeclared(opened).chronicle)).toEqual(['0,0', '1,0', '2,0']);
});

test('hostile, a unit of the neutral’s lands on and crosses a tile the player holds', () => {
  const opened = onTheLine(neutralStanding({ q: 2, r: 0 }, { stats: { move: 4 * MOVE_POINT } }));

  expect(landingsOf(opened)).toEqual(['1,0']);
  expect(landingsOf(warDeclared(opened).chronicle)).toEqual(['-1,0', '0,0', '1,0']);
});

test('a unit of the player’s landing on a tile the neutral holds, its city’s own, declares war: one relations change ahead of the move, the neutral hostile from it; a landing elsewhere declares nothing, nor one once hostile', () => {
  const opened = onTheLine(standing('player', CITY, { move: 2 * MOVE_POINT }));
  const [unit] = opened.units;
  const hostile = warDeclared(opened).chronicle;

  const declared = apply(CATALOGUE, opened, moveTo(unit.id, NEUTRAL_TILE));

  expect(namesOf(declared)).toEqual(['relations', 'move']);
  expect(relationsOf(declared[0].chronicle)).toBe('hostile');
  expect(unitNamed(outcome(declared), unit.id).tile).toEqual(NEUTRAL_TILE);
  expect(stagedBy(opened, moveTo(unit.id, { q: -1, r: 0 }))).toEqual(['move']);
  expect(relationsOf(outcome(apply(CATALOGUE, opened, moveTo(unit.id, { q: -1, r: 0 }))))).toBe(
    'peace',
  );
  expect(stagedBy(hostile, moveTo(unit.id, NEUTRAL_TILE))).toEqual(['move']);
});

test('an attack of the player’s on a unit of the neutral’s declares war, the one that kills it included: one relations change first in the attack, the neutral hostile from it; an attack on an enemy declares nothing', () => {
  const beside = (target: Standing, damage: number): Chronicle =>
    withUnits(besideTheNeutral(), [standing('player', CITY, { damage }), target]);
  const struck = beside(neutralStanding(NEUTRAL_TILE, { stats: { health: 4 } }), 1);
  const killed = beside(neutralStanding(NEUTRAL_TILE, { stats: { health: 4 } }), 4);
  const raided = beside(standing('enemy', NEUTRAL_TILE, { health: 4 }), 1);
  const [attacker] = struck.units;

  expect(stagedBy(struck, attackOn(attacker.id, NEUTRAL_TILE))).toEqual([
    'attack',
    'relations',
    'action-spent',
    'damaged',
  ]);
  expect(relationsOf(outcome(apply(CATALOGUE, struck, attackOn(attacker.id, NEUTRAL_TILE))))).toBe(
    'hostile',
  );
  expect(stagedBy(killed, attackOn(attacker.id, NEUTRAL_TILE))).toEqual([
    'attack',
    'relations',
    'action-spent',
    'killed',
  ]);
  expect(stagedBy(raided, attackOn(attacker.id, NEUTRAL_TILE))).toEqual([
    'attack',
    'action-spent',
    'damaged',
  ]);
  expect(relationsOf(outcome(apply(CATALOGUE, raided, attackOn(attacker.id, NEUTRAL_TILE))))).toBe(
    'peace',
  );
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
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('enemy', { q: 2, r: 0 })],
  });
  const untouched = structuredClone(city);

  expect(outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 })))).toEqual(
    outcome(apply(CATALOGUE, city, moveTo(1, { q: 1, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});

test('an embarked unit moves on the card’s move over the water embarked units enter, and onto no land', () => {
  const coast = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
    { q: 3, r: 0 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(3, coast),
    hand: ['PH_Embark'],
    units: [standing('player', CITY, { sight: 4 })],
  });
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(city, coast[0])));
  const ticked = outcome(apply(CATALOGUE, embarked, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(EMBARKED_MOVE);
  expect(unitNamed(outcome(apply(CATALOGUE, ticked, moveTo(1, coast[2]))), 1).tile).toEqual(
    coast[2],
  );
  expect(outcome(apply(CATALOGUE, ticked, moveTo(1, { q: 1, r: 1 })))).toEqual(ticked);
  expect(outcome(apply(CATALOGUE, ticked, moveTo(1, CITY)))).toEqual(ticked);
});

test('an embarked unit attacks nothing, whatever its range and damage', () => {
  const coast = { q: 1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(3, [coast]),
    hand: ['PH_Embark'],
    units: [
      standing('player', CITY, { damage: 2, range: 2 }),
      standing('enemy', { q: 2, r: 0 }, { move: 0, range: 1 }),
    ],
  });
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(city, coast)));
  const ticked = outcome(apply(CATALOGUE, embarked, { type: 'end-turn' }));

  expect(actionOf(ticked, 1)).toBeGreaterThan(0);
  expect(attackable(ticked.units, unitNamed(ticked, 1), relationsOf(ticked))).toEqual([]);
  expect(stagedBy(ticked, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
});

test('a unit whose range is one attacks no embarked unit, and one of a longer range attacks it anywhere within its range', () => {
  const coast = { q: 1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(3, [coast]),
    hand: ['PH_Embark'],
    units: [
      standing('player', CITY, { health: 5 }),
      standing('enemy', { q: 2, r: 0 }, { move: 0, range: 1 }),
      standing('enemy', { q: 1, r: 1 }, { move: 0, range: 2 }),
      standing('enemy', { q: 3, r: 0 }, { move: 0, range: 2 }),
    ],
  });
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(city, coast)));

  expect(attacksOf(embarked)).toEqual([
    ['1,1', '1,0'],
    ['3,0', '1,0'],
  ]);
});
