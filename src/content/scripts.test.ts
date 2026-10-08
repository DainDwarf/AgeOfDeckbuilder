import { expect, test } from 'vitest';
import { type Catalogue, catalogued, type EnemyAct } from '../rules/catalogue';
import { apply, outcome } from '../rules/chronicle';
import {
  aimedAt,
  attacksOf,
  builtOn,
  CATALOGUE,
  CITY,
  camped,
  camping,
  cityOf,
  deepBut,
  EMBARKED_MOVE,
  endedTurn,
  field,
  madeOf,
  movesOf,
  only,
  SCRIPT,
  type Standing,
  standing,
  worker,
} from '../rules/fixtures';
import { distance, MOVE_POINT, type Tile, type TileCoords, tileKey } from '../rules/map';
import { seedRng } from '../rules/rng';
import type { Chronicle } from '../rules/state';
import { guarding, PILLAGER, RAIDER } from './scripts';

/** The fixture's content, its enemies entering as raiders in place of its own script. */
const RAIDING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: RAIDER },
});

/** The fixture's content, its enemies entering as pillagers in place of its own script. */
const PILLAGING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: PILLAGER },
});

/** How far from its camp the fixture's guards keep. */
const RADIUS = 2;

/** The fixture's content, its enemies entering as guards in place of its own script. */
const GUARDING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: guarding(RADIUS) },
});

/**
 * The last enemy of the chronicle, asked its move and its act straight from the script: the tile it
 * attacks, `prepare`, or nothing.
 */
function asked(script: Catalogue, chronicle: Chronicle): { to: string; acts?: string } {
  const enemy = chronicle.units.filter((unit) => unit.faction === 'enemy').at(-1);
  if (enemy === undefined) throw new Error('no enemy stands on the chronicle');
  const closure = script.scripts[SCRIPT];
  const act = closure.acts(script, chronicle, enemy);
  return {
    to: tileKey(closure.moveTo(script, chronicle, enemy).landing.tile),
    acts: readOf(act),
  };
}

function readOf(act: EnemyAct): string | undefined {
  switch (act.act) {
    case 'attack':
      return tileKey(act.target.tile);
    case 'prepare':
      return 'prepare';
    case 'none':
      return undefined;
  }
}

test('a raider on the city’s tile stays there, prepares the capture and attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 0 }), standing('enemy', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(asked(RAIDING, city)).toEqual({ to: tileKey(CITY), acts: 'prepare' });
});

test('a raider with the city’s tile free and in reach steps onto it ahead of any attack', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(city, RAIDING)).toEqual([['2,0', '0,0']]);
  expect(attacksOf(city, RAIDING)).toEqual([]);
});

test('a raider that can strike a unit lands in range of it, on the landing nearest the city, and strikes', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 3, r: -3 }), standing('enemy', { q: 4, r: 0 }, { move: 3 * MOVE_POINT })],
  });

  expect(movesOf(city, RAIDING)).toEqual([['4,0', '3,-2']]);
  expect(attacksOf(city, RAIDING)).toEqual([['3,-2', '3,-3']]);
});

test('a raider with neither the city’s tile nor a unit in reach moves toward the city by the cheapest way, a forest costing it what the tile says', () => {
  /** One corridor to the city, forked: the straight way through one tile, the way round through two. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 1, r: -1 }];
  const raider = standing('enemy', { q: 2, r: 0 }, { move: MOVE_POINT });
  const plains = cityOf(['urban'], { tiles: only(2, corridor), units: [raider] });
  const wooded = cityOf(['urban'], {
    tiles: madeOf(only(2, corridor), 'forest', [{ q: 1, r: 0 }]),
    units: [raider],
  });

  expect(movesOf(plains, RAIDING)).toEqual([['2,0', '1,0']]);
  expect(movesOf(wooded, RAIDING)).toEqual([['2,0', '2,-1']]);
});

test('a raider attacks the unit of the least health within its range', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      standing('player', { q: 3, r: 0 }, { health: 4 }),
      standing('player', { q: 4, r: -1 }, { health: 2 }),
      standing('enemy', { q: 4, r: 0 }, { move: 0 }),
    ],
  });

  expect(attacksOf(city, RAIDING)).toEqual([['4,0', '4,-1']]);
});

test('a pillager goes for what its own walk weighs the least to: past a farm two tiles off through the forest, toward one three tiles off over the plain', () => {
  const forested = { q: 2, r: 2 };
  const plain = { q: 4, r: -3 };
  const land = [CITY, { q: 2, r: 0 }, { q: 2, r: 1 }, forested, { q: 3, r: -1 }, { q: 4, r: -2 }];
  const city = cityOf(['urban'], {
    tiles: builtOn(
      madeOf(only(4, [...land, plain]), 'forest', [{ q: 2, r: 1 }, forested]),
      'PH_Farm',
      [forested, plain],
    ),
    units: [standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  expect(distance({ q: 2, r: 0 }, forested)).toBeLessThan(distance({ q: 2, r: 0 }, plain));
  expect(movesOf(city, PILLAGING)).toEqual([['2,0', '4,-2']]);
});

test('a pillager with nothing built to go for walks toward a worker of the player’s out of its reach, where a raider walks toward the city', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 4, r: -3 }), standing('enemy', { q: 2, r: 0 }, { move: MOVE_POINT })],
  });

  expect(movesOf(city, PILLAGING)).toEqual([['2,0', '2,-1']]);
  expect(attacksOf(city, PILLAGING)).toEqual([]);
  expect(movesOf(city, RAIDING)).toEqual([['2,0', '1,0']]);
});

test('a pillager standing on a farm attacks a unit it can reach ahead of preparing, and prepares the pillage with nothing to attack', () => {
  const farm = { q: 2, r: 0 };
  const ground = builtOn(field(3), 'PH_Farm', [farm]);
  const pillager = standing('enemy', farm, { move: 2 * MOVE_POINT });
  const beset = cityOf(['urban'], { tiles: ground, units: [worker({ q: 3, r: 0 }), pillager] });
  const alone = cityOf(['urban'], { tiles: ground, units: [pillager] });

  expect(asked(PILLAGING, beset)).toEqual({ to: tileKey(farm), acts: '3,0' });
  expect(asked(PILLAGING, alone)).toEqual({ to: tileKey(farm), acts: 'prepare' });
});

test('a pillager with nothing built and no worker to go for raids: it walks to the city and prepares the capture there', () => {
  const raiding = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })],
  });
  const arrived = cityOf(['urban'], { tiles: field(2), units: [standing('enemy', CITY)] });

  expect(movesOf(raiding, PILLAGING)).toEqual([['2,0', '0,0']]);
  expect(asked(PILLAGING, arrived)).toEqual({ to: tileKey(CITY), acts: 'prepare' });
});

/** Where a unit stands two tiles off `SCREENED` and `OPEN`, a forest between it and `SCREENED` alone. */
const BEYOND: TileCoords = { q: 1, r: 0 };

/** Two tiles off `BEYOND` and nearer the city and the camp than `OPEN`. */
const SCREENED: TileCoords = { q: 1, r: -2 };

const OPEN: TileCoords = { q: 3, r: -2 };

/** Out of range of `BEYOND`, a step from `SCREENED` and two from `OPEN`. */
const AFIELD: TileCoords = { q: 2, r: -3 };

/** Out of range of `BEYOND`, a step from `AFIELD` and from `OPEN`. */
const FLANK: TileCoords = { q: 3, r: -3 };

/** The ground of the tiles named above, and water everywhere else. */
function screened(camps: TileCoords[] = []): Tile[] {
  const forest = { q: 1, r: -1 };
  const land = [CITY, BEYOND, forest, SCREENED, OPEN, AFIELD, FLANK];
  return camped(madeOf(only(3, land), 'forest', [forest]), camps);
}

test('a raider that can attack a unit from several landings lands on one it sees the unit from', () => {
  const city = cityOf(['urban'], {
    tiles: screened(),
    units: [worker(BEYOND), standing('enemy', AFIELD, { move: 2 * MOVE_POINT, range: 2 })],
  });

  expect(movesOf(city, RAIDING)).toEqual([[tileKey(AFIELD), tileKey(OPEN)]]);
});

test('a raider attacks the unit of the least health among those it sees', () => {
  const city = cityOf(['urban'], {
    tiles: screened(),
    units: [
      standing('player', BEYOND, { health: 1 }),
      standing('player', OPEN, { health: 4 }),
      standing('enemy', SCREENED, { move: 0, range: 2 }),
    ],
  });

  expect(attacksOf(city, RAIDING)).toEqual([[tileKey(SCREENED), tileKey(OPEN)]]);
});

test('a guard whose camp a fellow holds lands on a landing inside its radius it sees the unit from', () => {
  const city = cityOf(['urban'], {
    tiles: screened([AFIELD]),
    units: [
      worker(BEYOND),
      standing('enemy', AFIELD, { move: 0 }),
      standing('enemy', FLANK, { move: 2 * MOVE_POINT, range: 2 }),
    ],
  });

  expect(movesOf(city, GUARDING)).toEqual([[tileKey(FLANK), tileKey(OPEN)]]);
});

test('a guard attacks the unit of the least health among those it sees', () => {
  const city = cityOf(['urban'], {
    tiles: screened([SCREENED]),
    units: [
      standing('player', BEYOND, { health: 1 }),
      standing('player', OPEN, { health: 4 }),
      standing('enemy', SCREENED, { move: 0, range: 2 }),
    ],
  });

  expect(attacksOf(city, GUARDING)).toEqual([[tileKey(SCREENED), tileKey(OPEN)]]);
});

test('a guard keeps the nearest camp standing within its radius, ties in tile order', () => {
  const camps = [
    { q: 4, r: 0 },
    { q: 4, r: -3 },
  ];
  const guardAt = (tile: TileCoords): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), camps),
      units: [standing('enemy', tile, { move: 2 * MOVE_POINT })],
    });

  expect(movesOf(guardAt({ q: 4, r: -1 }), GUARDING)).toEqual([['4,-1', '4,0']]);
  expect(movesOf(guardAt({ q: 3, r: -1 }), GUARDING)).toEqual([['3,-1', '4,-3']]);
});

test('a guard on its camp stays there', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [worker({ q: 2, r: 0 }), standing('enemy', camp, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(city, GUARDING)).toEqual([]);
});

test('a guard off its camp, the camp’s tile free, lands on the camp, or as near it as it can', () => {
  const camp = { q: 4, r: 0 };
  const guard = (move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), [camp]),
      units: [standing('enemy', { q: 4, r: -2 }, { move })],
    });

  expect(movesOf(guard(2 * MOVE_POINT), GUARDING)).toEqual([['4,-2', '4,0']]);
  expect(movesOf(guard(MOVE_POINT), GUARDING)).toEqual([['4,-2', '4,-1']]);
});

test('a guard whose camp a fellow holds lands in range of a unit it could strike from inside its radius, nearest the camp, and strikes; failing the reach it closes on the unit inside its radius', () => {
  const camp = { q: 4, r: 0 };
  const beside = (target: TileCoords, move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), [camp]),
      units: [
        worker(target),
        standing('enemy', camp, { move: 0 }),
        standing('enemy', { q: 4, r: -2 }, { move }),
      ],
    });

  expect(movesOf(beside({ q: 2, r: 0 }, 2 * MOVE_POINT), GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(beside({ q: 2, r: 0 }, 2 * MOVE_POINT), GUARDING)).toEqual([['3,0', '2,0']]);
  expect(movesOf(beside({ q: 1, r: 0 }, MOVE_POINT), GUARDING)).toEqual([['4,-2', '3,-1']]);
  expect(attacksOf(beside({ q: 1, r: 0 }, MOVE_POINT), GUARDING)).toEqual([]);
});

test('a guard whose range is one passes over an embarked unit as over one out of its reach, and one of a longer range closes on it and strikes', () => {
  const camp = { q: 4, r: 0 };
  const coast = { q: 1, r: 0 };
  const guarded = (range: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4, [coast]), [camp]),
      hand: ['PH_Embark'],
      units: [
        standing('player', { q: 0, r: 1 }),
        standing('enemy', camp, { move: 0 }),
        standing('enemy', { q: 4, r: -2 }, { move: 2 * MOVE_POINT, range }),
      ],
    });
  const embarked = (range: number): Chronicle =>
    outcome(apply(CATALOGUE, guarded(range), aimedAt(coast)));

  expect(asked(GUARDING, embarked(1))).toEqual(asked(GUARDING, guarded(1)));
  expect(movesOf(embarked(2), GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(embarked(2), GUARDING)).toEqual([['3,0', '1,0']]);
});

test('a guard whose camp a unit of another faction stands on closes on that unit and strikes it', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [worker(camp), standing('enemy', { q: 4, r: -2 }, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(city, GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(city, GUARDING)).toEqual([['3,0', '4,0']]);
});

test('a guard whose camp a fellow holds, with nothing to strike, wanders to a landing inside its radius drawn from the seed, the one it stands on included: the same seed wanders the same, and seeds differ', () => {
  const camp = { q: 4, r: 0 };
  const from = { q: 4, r: -1 };
  const wandered = (seed: number): string => {
    const city = cityOf(['urban'], {
      rng: seedRng(seed),
      tiles: camped(field(4), [camp]),
      units: [standing('enemy', camp, { move: 0 }), standing('enemy', from, { move: MOVE_POINT })],
    });
    return asked(GUARDING, city).to;
  };
  const seeds = Array.from({ length: 30 }, (_, at) => at + 1);
  const landed = seeds.map(wandered);

  for (const seed of seeds) expect(wandered(seed)).toBe(wandered(seed));
  for (const tile of landed) {
    const [q, r] = tile.split(',').map(Number);
    expect(distance({ q, r }, camp)).toBeLessThanOrEqual(RADIUS);
    expect(distance({ q, r }, from)).toBeLessThanOrEqual(1);
  }
  expect(new Set(landed).size).toBeGreaterThan(1);
  expect(landed).toContain(tileKey(from));
});

test('a guard with no camp within its radius raids', () => {
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [{ q: -4, r: 0 }]),
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(city, GUARDING)).toEqual([['2,0', '0,0']]);
  expect(attacksOf(city, GUARDING)).toEqual([]);
});

/** A disc of deep water out to four but for the city’s tile, the land and the coast named, and the forest named on the land. */
function strait(land: TileCoords[], coast: TileCoords[], forest: TileCoords[] = []): Tile[] {
  return madeOf(deepBut(field(4, coast), [CITY, ...land, ...coast]), 'forest', forest);
}

/** A city two tiles of coast off an island, a raider on the island's far tile unless the test names its units. */
function islanded(units: readonly Standing[] = [standing('enemy', { q: 4, r: 0 })]): Chronicle {
  return cityOf(['urban'], {
    tiles: strait(
      [
        { q: 3, r: 0 },
        { q: 4, r: 0 },
      ],
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    ),
    units,
  });
}

test('a raider whose cheapest route to the city embarks walks to where the ground ends and embarks there, and one whose camp names no embarked move stays on its island', () => {
  const city = islanded();

  expect(movesOf(city, camping({ embarkedMove: EMBARKED_MOVE }, RAIDING))).toEqual([
    ['4,0', '3,0'],
    ['3,0', '2,0'],
  ]);
  expect(movesOf(city, RAIDING)).toEqual([]);
});

test('an embarked raider moves over the water toward the city and disembarks where its cheapest route reaches the ground, onto the city’s tile itself', () => {
  const content = camping({ embarkedMove: EMBARKED_MOVE }, RAIDING);
  const embarked = endedTurn(islanded(), undefined, content);

  expect(movesOf(embarked, content)).toEqual([
    ['2,0', '1,0'],
    ['1,0', '0,0'],
  ]);
});

test('a raider weighs the water against the ground in moves: with an embarked move fast enough it embarks at once, and with a slow one it walks the long way round', () => {
  const corridor = [
    { q: 2, r: 2 },
    { q: 1, r: 2 },
    { q: 0, r: 2 },
    { q: 0, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: strait(
      [{ q: 3, r: 1 }, ...corridor],
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
        { q: 3, r: 0 },
      ],
      corridor,
    ),
    units: [standing('enemy', { q: 3, r: 1 })],
  });

  expect(movesOf(city, camping({ embarkedMove: EMBARKED_MOVE }, RAIDING))).toEqual([
    ['3,1', '3,0'],
  ]);
  expect(movesOf(city, camping({ embarkedMove: MOVE_POINT }, RAIDING))).toEqual([['3,1', '2,2']]);
});

test('a raider whose embark is held embarks onto another free tile on a route as cheap, and with none free it does not embark', () => {
  const shore = { q: 2, r: -1 };
  const north = { q: 1, r: -1 };
  const east = { q: 1, r: 0 };
  const beside = { q: 0, r: 1 };
  const free = cityOf(['urban'], {
    tiles: strait([shore, beside], [north, east]),
    hand: ['PH_Embark', 'PH_Embark'],
    units: [standing('player', CITY), standing('player', beside), standing('enemy', shore)],
  });
  const one = outcome(apply(CATALOGUE, free, aimedAt(north)));
  const both = outcome(apply(CATALOGUE, one, aimedAt(east)));
  const content = camping({ embarkedMove: EMBARKED_MOVE }, RAIDING);

  expect(movesOf(free, content)).toEqual([[tileKey(shore), tileKey(north)]]);
  expect(movesOf(one, content)).toEqual([[tileKey(shore), tileKey(east)]]);
  expect(movesOf(both, content)).toEqual([]);
});

test('a guard keeps the ground while a camp stands within its radius, and with none it embarks as the raider does', () => {
  const camp = { q: 4, r: 0 };
  const guard = standing('enemy', { q: 3, r: 0 });
  const kept = cityOf(['urban'], {
    tiles: camped(islanded().tiles, [camp]),
    units: [standing('enemy', camp, { move: 0 }), guard],
  });
  const content = camping({ embarkedMove: EMBARKED_MOVE }, GUARDING);

  expect(movesOf(kept, content)).toEqual([]);
  expect(movesOf(islanded([guard]), content)).toEqual([['3,0', '2,0']]);
});

test('an embarked guard within a standing camp’s radius moves and steps as the raider does', () => {
  const camp = { q: 0, r: -1 };
  const city = cityOf(['urban'], {
    tiles: camped(
      strait(
        [{ q: 3, r: 0 }, camp],
        [
          { q: 1, r: 0 },
          { q: 2, r: 0 },
        ],
      ),
      [camp],
    ),
    units: [standing('enemy', { q: 3, r: 0 })],
  });
  const content = camping({ embarkedMove: EMBARKED_MOVE }, GUARDING);
  const embarked = endedTurn(city, undefined, content);

  expect(movesOf(city, content)).toEqual([['3,0', '2,0']]);
  expect(movesOf(embarked, content)).toEqual([
    ['2,0', '1,0'],
    ['1,0', '0,0'],
  ]);
});

test('a guard attacks the unit of the least health within its range', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [
      standing('player', { q: 3, r: 0 }, { health: 4 }),
      standing('player', { q: 4, r: -1 }, { health: 2 }),
      standing('enemy', camp, { move: 0 }),
    ],
  });

  expect(attacksOf(city, GUARDING)).toEqual([['4,0', '4,-1']]);
});
