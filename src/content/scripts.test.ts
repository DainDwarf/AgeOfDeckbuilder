import { expect, test } from 'vitest';
import { ageOf, type Catalogue, catalogued, neutralOf, type ScriptAct } from '../rules/catalogue';
import { apply, outcome } from '../rules/chronicle';
import { claimable, warDeclared } from '../rules/city';
import {
  AGE,
  aimedAt,
  attacksOf,
  besideTheNeutral,
  builtOn,
  CAMP,
  CAMP_KIND,
  CATALOGUE,
  CITY,
  camped,
  camping,
  cityOf,
  deepBut,
  EMBARKED_MOVE,
  endedTurn,
  enemiesOf,
  enemyStanding,
  field,
  GUARD_SCRIPT,
  madeOf,
  movesOf,
  NEUTRAL_TILE,
  neutralStanding,
  only,
  onlyStocks,
  onTheNeutralCity,
  plains,
  SCRIPT,
  SHRINE,
  SITE,
  type Standing,
  standing,
  WELL,
  WELL_GIVES,
  WORKER_SCRIPT,
  WORKER_STATS,
  WORKING,
  withTile,
  withUnits,
  worker,
} from '../rules/fixtures';
import { distance, MOVE_POINT, type Tile, type TileCoords, tileAt, tileKey } from '../rules/map';
import { seedRng } from '../rules/rng';
import { walked } from '../rules/stages';
import { type Chronicle, withCityRows } from '../rules/state';
import {
  campedOrRaided,
  guarding,
  NEUTRAL_GUARD,
  NEUTRAL_WAVE,
  NEUTRAL_WORKER,
  PILLAGER,
  RAIDER,
  SIEGE_RAIDER,
  VILLAGER,
} from './scripts';

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

/** How far around a held camp the fixture's guards roam. */
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

function readOf(act: ScriptAct): string | undefined {
  switch (act.act) {
    case 'attack':
      return tileKey(act.target.tile);
    case 'prepare':
      return 'prepare';
    case 'play':
      return `${act.card} on ${tileKey(act.tile)}`;
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

test('a raider that can attack a unit lands in range of it, on the landing nearest the city, and attacks', () => {
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

test('a pillager goes for no site and prepares nothing on one: with a site beside it it raids, where a farm there draws it', () => {
  const beside = { q: 3, r: -1 };
  const ground = madeOf(field(3), 'hills', [beside]);
  const pillager = standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT });
  const sited = cityOf(['urban'], { tiles: builtOn(ground, SITE, [beside]), units: [pillager] });
  const farmed = cityOf(['urban'], {
    tiles: builtOn(ground, 'PH_Farm', [beside]),
    units: [pillager],
  });
  const onSite = cityOf(['urban'], {
    tiles: builtOn(ground, SITE, [beside]),
    units: [standing('enemy', beside, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(farmed, PILLAGING)).toEqual([['2,0', '3,-1']]);
  expect(movesOf(sited, PILLAGING)).toEqual([['2,0', '0,0']]);
  expect(asked(PILLAGING, onSite).acts).toBeUndefined();
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
      enemyStanding(AFIELD, AFIELD, { stats: { move: 0 } }),
      enemyStanding(FLANK, AFIELD, { stats: { move: 2 * MOVE_POINT, range: 2 } }),
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
      enemyStanding(SCREENED, SCREENED, { stats: { move: 0, range: 2 } }),
    ],
  });

  expect(attacksOf(city, GUARDING)).toEqual([[tileKey(SCREENED), tileKey(OPEN)]]);
});

test('a guard keeps its own camp, though another stands nearer', () => {
  const near = { q: 4, r: 0 };
  const own = { q: 4, r: -3 };
  const guardAt = (camp: TileCoords, tile: TileCoords): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), [near, own]),
      units: [enemyStanding(tile, camp, { stats: { move: 2 * MOVE_POINT } })],
    });

  expect(movesOf(guardAt(own, { q: 4, r: -1 }), GUARDING)).toEqual([['4,-1', '4,-3']]);
  expect(movesOf(guardAt(near, { q: 4, r: -2 }), GUARDING)).toEqual([['4,-2', '4,0']]);
});

test('a guard on its camp stays there', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [worker({ q: 2, r: 0 }), enemyStanding(camp, camp, { stats: { move: 2 * MOVE_POINT } })],
  });

  expect(movesOf(city, GUARDING)).toEqual([]);
});

test('a guard off its camp, the camp’s tile free, lands on the camp, or as near it as it can', () => {
  const camp = { q: 4, r: 0 };
  const guard = (move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), [camp]),
      units: [enemyStanding({ q: 4, r: -2 }, camp, { stats: { move } })],
    });

  expect(movesOf(guard(2 * MOVE_POINT), GUARDING)).toEqual([['4,-2', '4,0']]);
  expect(movesOf(guard(MOVE_POINT), GUARDING)).toEqual([['4,-2', '4,-1']]);
});

test('a guard whose camp a fellow holds lands in range of a unit it could attack from inside its radius, nearest the camp, and attacks; failing the reach it closes on the unit inside its radius', () => {
  const camp = { q: 4, r: 0 };
  const beside = (target: TileCoords, move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4), [camp]),
      units: [
        worker(target),
        enemyStanding(camp, camp, { stats: { move: 0 } }),
        enemyStanding({ q: 4, r: -2 }, camp, { stats: { move } }),
      ],
    });

  expect(movesOf(beside({ q: 2, r: 0 }, 2 * MOVE_POINT), GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(beside({ q: 2, r: 0 }, 2 * MOVE_POINT), GUARDING)).toEqual([['3,0', '2,0']]);
  expect(movesOf(beside({ q: 1, r: 0 }, MOVE_POINT), GUARDING)).toEqual([['4,-2', '3,-1']]);
  expect(attacksOf(beside({ q: 1, r: 0 }, MOVE_POINT), GUARDING)).toEqual([]);
});

test('a guard whose range is one passes over an embarked unit as over one out of its reach, and one of a longer range closes on it and attacks', () => {
  const camp = { q: 4, r: 0 };
  const coast = { q: 1, r: 0 };
  const guarded = (range: number): Chronicle =>
    cityOf(['urban'], {
      tiles: camped(field(4, [coast]), [camp]),
      hand: ['PH_Embark'],
      units: [
        standing('player', { q: 0, r: 1 }),
        enemyStanding(camp, camp, { stats: { move: 0 } }),
        enemyStanding({ q: 4, r: -2 }, camp, { stats: { move: 2 * MOVE_POINT, range } }),
      ],
    });
  const embarked = (range: number): Chronicle => {
    const city = guarded(range);
    return outcome(apply(CATALOGUE, city, aimedAt(city, coast)));
  };

  expect(asked(GUARDING, embarked(1))).toEqual(asked(GUARDING, guarded(1)));
  expect(movesOf(embarked(2), GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(embarked(2), GUARDING)).toEqual([['3,0', '1,0']]);
});

test('a guard whose camp a unit of another faction stands on closes on that unit and attacks it', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [
      worker(camp),
      enemyStanding({ q: 4, r: -2 }, camp, { stats: { move: 2 * MOVE_POINT } }),
    ],
  });

  expect(movesOf(city, GUARDING)).toEqual([['4,-2', '3,0']]);
  expect(attacksOf(city, GUARDING)).toEqual([['3,0', '4,0']]);
});

test('a guard whose camp a fellow holds, with nothing to attack, wanders to a landing inside its radius drawn from the seed, the one it stands on included: the same seed wanders the same, and seeds differ', () => {
  const camp = { q: 4, r: 0 };
  const from = { q: 4, r: -1 };
  const wandered = (seed: number): string => {
    const city = cityOf(['urban'], {
      rng: seedRng(seed),
      tiles: camped(field(4), [camp]),
      units: [
        enemyStanding(camp, camp, { stats: { move: 0 } }),
        enemyStanding(from, camp, { stats: { move: MOVE_POINT } }),
      ],
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

test('a guard of no camp raids, though a camp stands beside it', () => {
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [{ q: 3, r: 0 }]),
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  expect(movesOf(city, GUARDING)).toEqual([['2,0', '0,0']]);
  expect(attacksOf(city, GUARDING)).toEqual([]);
});

test('a guard off its camp beyond its radius walks toward the camp, whether a fellow holds it or not, where a guard of no camp raids', () => {
  const camp = { q: 4, r: 0 };
  const far = { q: 4, r: -4 };
  const guarded = (units: Standing[]): Chronicle =>
    cityOf(['urban'], { tiles: camped(field(4), [camp]), units });
  const walker = enemyStanding(far, camp, { stats: { move: MOVE_POINT } });
  const keeper = enemyStanding(camp, camp, { stats: { move: 0 } });

  expect(movesOf(guarded([walker]), GUARDING)).toEqual([['4,-4', '4,-3']]);
  expect(movesOf(guarded([keeper, walker]), GUARDING)).toEqual([['4,-4', '4,-3']]);
  expect(movesOf(guarded([standing('enemy', far, { move: MOVE_POINT })]), GUARDING)).toEqual([
    ['4,-4', '3,-3'],
  ]);
});

test('a guard whose camp is captured raids from the next enemy phase on', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [
      standing('player', camp),
      enemyStanding({ q: 4, r: -4 }, camp, { stats: { move: MOVE_POINT } }),
    ],
  });
  const captured = endedTurn(city, undefined, GUARDING);

  expect(movesOf(city, GUARDING)).toEqual([['4,-4', '4,-3']]);
  expect(movesOf(captured, GUARDING)).toEqual(movesOf(captured, RAIDING));
  expect(movesOf(captured, GUARDING)).not.toEqual([]);
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
  const one = outcome(apply(CATALOGUE, free, aimedAt(free, north)));
  const both = outcome(apply(CATALOGUE, one, aimedAt(one, east)));
  const content = camping({ embarkedMove: EMBARKED_MOVE }, RAIDING);

  expect(movesOf(free, content)).toEqual([[tileKey(shore), tileKey(north)]]);
  expect(movesOf(one, content)).toEqual([[tileKey(shore), tileKey(east)]]);
  expect(movesOf(both, content)).toEqual([]);
});

test('a guard of a camp keeps the ground, and one of no camp embarks as the raider does', () => {
  const camp = { q: 4, r: 0 };
  const beside = { q: 3, r: 0 };
  const kept = cityOf(['urban'], {
    tiles: camped(islanded().tiles, [camp]),
    units: [enemyStanding(camp, camp, { stats: { move: 0 } }), enemyStanding(beside, camp)],
  });
  const content = camping({ embarkedMove: EMBARKED_MOVE }, GUARDING);

  expect(movesOf(kept, content)).toEqual([]);
  expect(movesOf(islanded([standing('enemy', beside)]), content)).toEqual([['3,0', '2,0']]);
});

test('an embarked guard moves and steps as the raider does, however near its camp', () => {
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
    units: [enemyStanding({ q: 2, r: 0 }, camp, { embarkedMove: EMBARKED_MOVE })],
  });
  const content = camping({ embarkedMove: EMBARKED_MOVE }, GUARDING);

  expect(movesOf(city, content)).toEqual([
    ['2,0', '1,0'],
    ['1,0', '0,0'],
  ]);
});

/** The tile the villager claims for the neutral's city, out of every tile it may claim. */
function villagerClaims(chronicle: Chronicle): string {
  return tileKey(VILLAGER.claims(CATALOGUE, chronicle, claimable(CATALOGUE, chronicle, 'neutral')));
}

test('the villager claims the tile that yields most, a building beside counted, and of equals the nearest to its city, the first in tile order of those', () => {
  const opened = besideTheNeutral();
  const welled = withTile(opened, {
    q: 3,
    r: -1,
    terrain: WELL_GIVES.terrain,
    improvements: [],
    building: WELL,
  });
  const spread = withCityRows(opened, 'neutral', { held: [NEUTRAL_TILE, { q: 0, r: 1 }] });

  expect(villagerClaims(opened)).toBe('0,1');
  expect(villagerClaims(welled)).toBe('2,-1');
  expect(villagerClaims(spread)).toBe('1,-1');
});

/** The fixture's content, its units under `SCRIPT` acting as the neutral's guard. */
const KEEPING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: NEUTRAL_GUARD },
});

/** The fixture's content, its units under `SCRIPT` acting as the neutral's wave. */
const SENDING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: NEUTRAL_WAVE },
});

/**
 * `besideTheNeutral` on plains out to four unless the test hands its own ground, the neutral holding
 * the tiles named beside its city's own, the units standing on it and the generator seeded.
 */
function neutralAround(
  held: readonly TileCoords[],
  units: readonly Standing[],
  { ground = plains(4), seed = 7 }: { ground?: Tile[]; seed?: number } = {},
): Chronicle {
  const opened = besideTheNeutral({}, ground);
  const holding = withCityRows(opened, 'neutral', { held: [NEUTRAL_TILE, ...held] });
  return withUnits({ ...holding, rng: seedRng(seed) }, units);
}

/** A unit of the neutral's under `SCRIPT` on the tile, its move the move points named. */
function scripted(tile: TileCoords, move = 2 * MOVE_POINT, sight = 2): Standing {
  return neutralStanding(tile, { script: SCRIPT, stats: { move, sight } });
}

/** An enemy staying where it stands and attacking what it can, on the tile. */
function sentry(tile: TileCoords): Standing {
  return enemyStanding(tile, undefined, { script: GUARD_SCRIPT, stats: { move: 0 } });
}

test('the neutral’s guard lands where it can attack an enemy from inside the border, the nearest its city, and attacks it, never a unit of the player’s', () => {
  const archer = neutralStanding(
    { q: 3, r: 0 },
    { script: SCRIPT, stats: { move: 2 * MOVE_POINT, range: 2 } },
  );
  const chronicle = neutralAround(
    [
      { q: 2, r: 0 },
      { q: 2, r: -1 },
      { q: 3, r: -1 },
      { q: 3, r: 0 },
    ],
    [archer, standing('player', { q: 2, r: -2 }, { health: 1 }), sentry({ q: 4, r: -1 })],
  );

  expect(movesOf(chronicle, KEEPING)).toEqual([['3,0', '2,-1']]);
  expect(attacksOf(chronicle, KEEPING)[0]).toEqual(['2,-1', '4,-1']);
});

test('the neutral’s guard that can attack no enemy from inside the border walks inside it toward the one it sees, never out of it', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const chronicle = neutralAround(
      [
        { q: 2, r: 0 },
        { q: 0, r: 1 },
        { q: 1, r: 1 },
      ],
      [scripted(NEUTRAL_TILE, 2 * MOVE_POINT, 3), sentry({ q: 4, r: 0 })],
      { seed },
    );

    expect(movesOf(chronicle, KEEPING)).toEqual([['1,0', '2,0']]);
    expect(attacksOf(chronicle, KEEPING)).toEqual([]);
  }
});

test('the neutral’s guard with no enemy in sight wanders inside the border drawn from the seed, off its city’s tile while another tile it holds is free: the same seed wanders the same, and seeds differ', () => {
  const held = [
    { q: 2, r: 0 },
    { q: 1, r: 1 },
    { q: 2, r: -1 },
    { q: 0, r: 1 },
  ];
  const wandered = (seed: number): string =>
    movesOf(neutralAround(held, [scripted(NEUTRAL_TILE, MOVE_POINT)], { seed }), KEEPING)[0][1];
  const seeds = Array.from({ length: 30 }, (_, at) => at + 1);
  const landed = seeds.map(wandered);

  for (const seed of seeds) expect(wandered(seed)).toBe(wandered(seed));
  for (const tile of landed) expect(held.map(tileKey)).toContain(tile);
  expect(new Set(landed).size).toBeGreaterThan(1);
});

test('the neutral’s guard rests on its city’s tile only while no other tile its city holds is free', () => {
  const beside = { q: 2, r: 0 };
  const kept = (units: Standing[]): string[][] => movesOf(neutralAround([beside], units), KEEPING);

  expect(kept([scripted(NEUTRAL_TILE)])).toEqual([['1,0', '2,0']]);
  expect(kept([scripted(NEUTRAL_TILE), neutralStanding(beside, { stats: { move: 0 } })])).toEqual(
    [],
  );
  for (const seed of [1, 2, 3, 4, 5]) {
    expect(movesOf(neutralAround([beside], [scripted(beside)], { seed }), KEEPING)).toEqual([]);
  }
});

/**
 * What a unit of the neutral's under `SCRIPT` does hostile, the script being the content's: the move
 * it makes from beside its city with the city's tile free and in reach, and whether it stands
 * prepared after an enemy phase begun on the city's tile.
 */
function raidedBy(content: Catalogue): { moves: string[][]; prepared: boolean } {
  const hostile = (unit: Standing): Chronicle => warDeclared(neutralAround([], [unit])).chronicle;
  const after = outcome(apply(content, hostile(scripted(CITY)), { type: 'end-turn' }));
  const standing = after.units.find((unit) => tileKey(unit.tile) === tileKey(CITY));
  return {
    moves: movesOf(hostile(scripted({ q: 2, r: 0 })), content),
    prepared: standing?.faction === 'neutral' && standing.prepared,
  };
}

test('hostile, the neutral’s guard walks and acts as the raider: onto the city’s tile free and in reach, and preparing the capture there', () => {
  expect(raidedBy(KEEPING)).toEqual({ moves: [['2,0', '0,0']], prepared: true });
});

test('the neutral’s guard outside the border walks back toward its city, and never embarks to', () => {
  const island = { q: 4, r: 0 };
  const coast = { q: 3, r: 0 };
  const strait = deepBut(madeOf(plains(4), 'coast', [coast]), [
    CITY,
    NEUTRAL_TILE,
    { q: 2, r: 0 },
    coast,
    island,
  ]);
  const content = camping({ embarkedMove: EMBARKED_MOVE }, KEEPING);

  expect(movesOf(neutralAround([], [scripted({ q: 3, r: 0 }, MOVE_POINT)]), KEEPING)).toEqual([
    ['3,0', '2,0'],
  ]);
  expect(movesOf(neutralAround([], [scripted(island)], { ground: strait }), content)).toEqual([]);
});

/** The chronicle with a camp built on each tile named, none of its enemies standing. */
function campedOn(
  chronicle: Chronicle,
  camps: readonly TileCoords[],
  terrain = 'plain',
): Chronicle {
  return camps.reduce(
    (left, { q, r }) =>
      withTile(left, { q, r, terrain, improvements: [], building: CAMP.building }),
    chronicle,
  );
}

test('the neutral’s wave goes for the camp its own walk weighs the least to, not the one fewest tiles off', () => {
  const near = { q: 4, r: 0 };
  const far = { q: 2, r: -3 };
  const wave = neutralAround([], [scripted({ q: 2, r: 0 })]);
  const open = campedOn(campedOn(wave, [far]), [near]);
  const wooded = campedOn(
    campedOn(withTile(wave, { q: 3, r: 0, terrain: 'forest', improvements: [] }), [far]),
    [near],
    'forest',
  );

  expect(distance({ q: 2, r: 0 }, near)).toBeLessThan(distance({ q: 2, r: 0 }, far));
  expect(movesOf(open, SENDING)).toEqual([['2,0', '4,0']]);
  expect(movesOf(wooded, SENDING)).toEqual([['2,0', '2,-2']]);
});

test('the neutral’s wave lands in range of an enemy it can attack on its way and attacks it, never a unit of the player’s, and with no camp standing it stands where it is', () => {
  const camp = { q: 2, r: -3 };
  const units = [
    scripted({ q: 2, r: 0 }),
    standing('player', { q: 3, r: -1 }, { health: 1 }),
    sentry({ q: 4, r: -2 }),
  ];
  const beset = campedOn(neutralAround([], units), [camp]);
  const campless = neutralAround([], units);

  expect(movesOf(beset, SENDING)).toEqual([['2,0', '3,-2']]);
  expect(attacksOf(beset, SENDING)[0]).toEqual(['3,-2', '4,-2']);
  expect(movesOf(campless, SENDING)).toEqual([]);
});

test('the neutral’s wave weighs no route through a tile the player holds: the camp only such a route reaches is none it goes for, and it walks for the other, where an enemy walks through the player’s tile onto the nearer camp', () => {
  const from = { q: 2, r: 2 };
  const held = { q: 1, r: 2 };
  const behind = { q: 0, r: 2 };
  const around = [
    { q: 3, r: 1 },
    { q: 4, r: 0 },
  ];
  const beyond = { q: 4, r: -1 };
  const ground = deepBut(plains(4), [CITY, NEUTRAL_TILE, from, held, ...around]);
  const walking = (unit: Standing): Chronicle => {
    const opened = neutralAround([], [unit], { ground });
    const holding = withCityRows(opened, 'player', { held: [CITY, held] });
    return campedOn(holding, [behind, beyond]);
  };

  expect(movesOf(walking(scripted(from)), SENDING)).toEqual([[tileKey(from), '4,0']]);
  expect(movesOf(walking(standing('enemy', from)), SENDING)).toEqual([
    [tileKey(from), tileKey(behind)],
  ]);
});

test('the neutral’s wave walks the long way round the tiles the player holds to its camp, where an enemy walks through them', () => {
  const from = { q: 2, r: 3 };
  const held = { q: 1, r: 3 };
  const camp = { q: 0, r: 3 };
  const round = [
    { q: 3, r: 2 },
    { q: 3, r: 1 },
    { q: 2, r: 1 },
    { q: 1, r: 2 },
  ];
  const ground = deepBut(plains(5), [CITY, NEUTRAL_TILE, from, held, ...round]);
  const walking = (unit: Standing): Chronicle => {
    const opened = neutralAround([], [unit], { ground });
    const holding = withCityRows(opened, 'player', { held: [CITY, held] });
    return campedOn(holding, [camp]);
  };

  expect(movesOf(walking(scripted(from)), SENDING)).toEqual([[tileKey(from), '3,1']]);
  expect(movesOf(walking(standing('enemy', from)), SENDING)).toEqual([
    [tileKey(from), tileKey(camp)],
  ]);
});

test('hostile, the neutral’s wave walks and acts as the raider: onto the city’s tile free and in reach, and preparing the capture there', () => {
  expect(raidedBy(SENDING)).toEqual({ moves: [['2,0', '0,0']], prepared: true });
});

test('a raider goes for the nearer city by its own walk, the neutral’s or the player’s, and prepares the capture on either’s tile', () => {
  const raiding = (unit: Standing): Chronicle => neutralAround([], [unit]);
  const raider = (tile: TileCoords): Standing => standing('enemy', tile, { move: 2 * MOVE_POINT });

  expect(movesOf(raiding(raider({ q: 3, r: 0 })), RAIDING)).toEqual([['3,0', '1,0']]);
  expect(movesOf(raiding(raider({ q: -2, r: 0 })), RAIDING)).toEqual([['-2,0', '0,0']]);
  for (const city of [NEUTRAL_TILE, CITY]) {
    expect(asked(RAIDING, raiding(raider(city)))).toEqual({ to: tileKey(city), acts: 'prepare' });
  }
});

/** The fixture's content, its enemies entering as the siege's raiders in place of its own script. */
const SIEGING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: SIEGE_RAIDER },
});

test('the siege’s raider goes for the player’s city where the neutral’s lies nearer, where the raider goes for the neutral’s', () => {
  const from = neutralAround([], [standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT })]);

  expect(movesOf(from, RAIDING)).toEqual([['2,0', '1,0']]);
  expect(movesOf(from, SIEGING)).toEqual([['2,0', '0,0']]);
});

test('the siege’s raider prepares nothing on the neutral’s city’s tile, and the capture on the player’s', () => {
  const on = (tile: TileCoords): Chronicle =>
    neutralAround([], [standing('enemy', tile, { move: 0 })]);

  expect(asked(SIEGING, on(NEUTRAL_TILE)).acts).toBeUndefined();
  expect(asked(SIEGING, on(CITY)).acts).toBe('prepare');
});

test('the neutral’s wave embarks where the ground ends to cross toward its camp', () => {
  const camp = { q: 4, r: 0 };
  const coast = { q: 3, r: 0 };
  const strait = deepBut(madeOf(plains(4), 'coast', [coast]), [
    CITY,
    NEUTRAL_TILE,
    { q: 2, r: 0 },
    coast,
    camp,
  ]);
  const content = camping({ embarkedMove: EMBARKED_MOVE }, SENDING);
  const chronicle = campedOn(neutralAround([], [scripted({ q: 2, r: 0 })], { ground: strait }), [
    camp,
  ]);

  expect(movesOf(chronicle, content)).toEqual([['2,0', '3,0']]);
});

/** The card the villager enters a unit through, out of the ratio, two warriors to one worker. */
function villagerEnters(
  chronicle: Chronicle,
  first: 'warrior' | 'worker' = 'warrior',
): string | undefined {
  const warrior = { card: 'PH_Warrior', kind: 'PH_Warrior', share: 2 };
  const worker = { card: 'PH_Worker', kind: 'PH_Worker', share: 1 };
  const ratio = first === 'warrior' ? [warrior, worker] : [worker, warrior];
  return VILLAGER.enters(CATALOGUE, chronicle, ratio);
}

test('the villager enters the kind whose share of the neutral’s units falls shortest of the ratio, the first the ratio names of equals, counting no unit of another faction', () => {
  const warrior = (tile: TileCoords): Standing => neutralStanding(tile);
  const workerOf = (tile: TileCoords): Standing => neutralStanding(tile, { stats: WORKER_STATS });
  const standingWith = (units: Standing[]): Chronicle => neutralAround([], units);

  expect(villagerEnters(standingWith([]))).toBe('PH_Warrior');
  expect(villagerEnters(standingWith([]), 'worker')).toBe('PH_Worker');
  expect(villagerEnters(standingWith([warrior({ q: 2, r: 0 })]))).toBe('PH_Worker');
  expect(villagerEnters(standingWith([warrior({ q: 2, r: 0 }), workerOf({ q: 2, r: -1 })]))).toBe(
    'PH_Warrior',
  );
  expect(
    villagerEnters(
      standingWith([warrior({ q: 2, r: 0 }), warrior({ q: 3, r: 0 }), workerOf({ q: 2, r: -1 })]),
      'worker',
    ),
  ).toBe('PH_Worker');
  expect(
    villagerEnters(
      standingWith([warrior({ q: 2, r: 0 }), standing('enemy', { q: 3, r: 0 }, WORKER_STATS)]),
    ),
  ).toBe('PH_Worker');
});

test('the villager works the tiles its city holds giving the most food first, the most of everything together of equals, a building beside counted, the first in tile order of those, as many as its population, and a population past the tiles held works none', () => {
  const around = neutralAround(
    [
      { q: 2, r: -1 },
      { q: 2, r: 0 },
      { q: 2, r: 1 },
      { q: 3, r: -1 },
      { q: 3, r: 0 },
    ],
    [],
  );
  const laid = [
    { q: 2, r: -1, terrain: 'hills' },
    { q: 2, r: 0, terrain: 'forest' },
    { q: 4, r: -2, terrain: WELL_GIVES.terrain, building: WELL },
  ].reduce((chronicle, tile) => withTile(chronicle, { improvements: [], ...tile }), around);
  const working = (population: number): string[] =>
    VILLAGER.assigns(
      CATALOGUE,
      withCityRows(laid, 'neutral', { population }),
      laid.neutral?.held ?? [],
    ).map(tileKey);

  expect(working(3)).toEqual(['3,-1', '1,0', '2,1']);
  expect(working(8)).toEqual(['3,-1', '1,0', '2,1', '3,0', '2,0', '2,-1']);
});

test('the villager works the tiles giving what its upkeep takes first, resource by resource, the most of it first, until they cover it, and the most food once they do', () => {
  const held = [
    { q: 2, r: -1, terrain: 'hills' },
    { q: 2, r: 0, terrain: 'forest' },
    { q: 2, r: 1, terrain: 'plain', feature: 'PH_Fertile' },
    { q: 3, r: -1, terrain: 'plain' },
  ];
  const around = neutralAround(
    held.map(({ q, r }) => ({ q, r })),
    [],
  );
  const laid = (shrined: boolean): Chronicle =>
    held.reduce(
      (chronicle, tile) =>
        withTile(chronicle, {
          improvements: [],
          ...tile,
          ...(shrined && tileKey(tile) === '3,-1' ? { building: SHRINE } : {}),
        }),
      around,
    );
  const working = (chronicle: Chronicle, population: number): string[] =>
    VILLAGER.assigns(
      CATALOGUE,
      withCityRows(chronicle, 'neutral', { population }),
      chronicle.neutral?.held ?? [],
    ).map(tileKey);

  expect(working(laid(false), 1)).toEqual(['2,1']);
  expect(working(laid(true), 1)).toEqual(['2,-1']);
  expect(working(laid(true), 4)).toEqual(['2,-1', '2,0', '1,0', '2,1']);
});

/** `WORKING`, its neutral's workers acting as the neutral's worker and playing the cards named. */
function workersPlaying(cards: readonly string[]): Catalogue {
  const neutral = neutralOf(WORKING, AGE);
  return catalogued({
    ...WORKING,
    scripts: { ...WORKING.scripts, [WORKER_SCRIPT]: NEUTRAL_WORKER },
    ages: {
      ...WORKING.ages,
      [AGE]: {
        ...ageOf(WORKING, AGE),
        neutral: { ...neutral, workers: { script: WORKER_SCRIPT, cards } },
      },
    },
  });
}

/**
 * `besideTheNeutral` on the content in its first age, its worker opening on its city's tile, the
 * neutral holding the tiles named beside its city's own and the production named.
 */
function workerAround(
  content: Catalogue,
  held: readonly TileCoords[],
  {
    ground = plains(3),
    production = 3,
    units = [],
    seed = 7,
  }: { ground?: Tile[]; production?: number; units?: readonly Standing[]; seed?: number } = {},
): Chronicle {
  const opened = besideTheNeutral({ catalogue: content, age: AGE }, ground);
  const holding = withCityRows(opened, 'neutral', {
    held: [NEUTRAL_TILE, ...held],
    resources: onlyStocks({ production }),
  });
  return withUnits({ ...holding, rng: seedRng(seed) }, units);
}

/** Each tile a worker of the neutral's built on at the end of turn, with the layers it then carries. */
function builtBy(content: Catalogue, chronicle: Chronicle): string[] {
  return [...walked(apply(content, chronicle, { type: 'end-turn' }))].flatMap((stage) => {
    if (stage.kind !== 'group' || stage.name !== 'neutral-played') return [];
    return stage.stages.flatMap((held) => {
      if (held.kind !== 'change' || held.name !== 'retiled') return [];
      const tile = tileAt(held.chronicle.tiles, held.tile);
      const layers = [tile?.building ?? [], tile?.improvements ?? []].flat();
      return [`${tileKey(held.tile)} ${layers.join(' ')}`];
    });
  });
}

test('the neutral’s worker plays, on the tile its city holds where it adds the most to the yield, the card adding it: the most food first, the most of everything together of equals, the tile nearest its city of those, the first in tile order, and the first card named', () => {
  const hills = madeOf(plains(3), 'hills', [{ q: 1, r: -1 }]);
  const game = plains(3).map((tile) =>
    tileKey(tile) === '2,0' ? { ...tile, terrain: 'forest', feature: 'PH_Game' } : tile,
  );

  const mining = workersPlaying(['PH_Mine', 'PH_Farm']);
  const staking = workersPlaying(['PH_Stake', 'PH_Mine']);
  const farming = workersPlaying(['PH_Farm']);
  const hillsAndPlain = [
    { q: 1, r: -1 },
    { q: 3, r: -1 },
  ];

  expect(builtBy(mining, workerAround(mining, hillsAndPlain, { ground: hills }))).toEqual([
    '3,-1 PH_Farm',
  ]);
  expect(builtBy(staking, workerAround(staking, [{ q: 1, r: -1 }], { ground: hills }))).toEqual([
    '1,-1 PH_Mine',
  ]);
  expect(
    builtBy(
      farming,
      workerAround(farming, [
        { q: -1, r: 1 },
        { q: 2, r: -1 },
      ]),
    ),
  ).toEqual(['2,-1 PH_Farm']);
  expect(
    builtBy(
      farming,
      workerAround(farming, [
        { q: 2, r: 0 },
        { q: 1, r: -1 },
      ]),
    ),
  ).toEqual(['1,-1 PH_Farm']);
  for (const cards of [
    ['PH_Snare', 'PH_Lodge'],
    ['PH_Lodge', 'PH_Snare'],
  ]) {
    const content = workersPlaying(cards);
    expect(builtBy(content, workerAround(content, [{ q: 2, r: 0 }], { ground: game }))).toEqual([
      `2,0 ${cards[0]}`,
    ]);
  }
});

test('the neutral’s worker builds what takes upkeep where its population, laid over anew, then covers it, and not where it cannot', () => {
  const shrining = workersPlaying([SHRINE]);
  const hills = { q: 2, r: 0 };
  const forest = { q: 1, r: -1 };
  const ground = madeOf(madeOf(plains(3), 'hills', [hills]), 'forest', [forest]);
  const peopled = (population: number): Chronicle =>
    withCityRows(workerAround(shrining, [hills, forest, { q: 2, r: -1 }], { ground }), 'neutral', {
      population,
    });

  expect(builtBy(shrining, peopled(3))).toEqual([`2,-1 ${SHRINE}`]);
  expect(builtBy(shrining, peopled(2))).toEqual([]);
});

test('the neutral’s worker walks toward the tile it goes for out of its reach and plays nothing on the way', () => {
  const farming = workersPlaying(['PH_Farm']);
  const far = workerAround(farming, [{ q: -2, r: 1 }]);

  expect(movesOf(far, farming)).toEqual([['1,0', '-1,1']]);
  expect(builtBy(farming, far)).toEqual([]);
});

test('the neutral’s worker with nothing to play rests as its guard does: off its city’s tile while another tile its city holds is free, and on it while none is', () => {
  const farming = workersPlaying(['PH_Farm']);
  const beside = { q: 2, r: 0 };

  for (const seed of [1, 2, 3, 4, 5]) {
    const unpaid = workerAround(farming, [beside], { production: 0, seed });
    expect(movesOf(unpaid, farming)).toEqual([['1,0', '2,0']]);
    expect(builtBy(farming, unpaid)).toEqual([]);
  }
  const kept = workerAround(farming, [beside], {
    production: 0,
    units: [neutralStanding(beside, { stats: { move: 0 } })],
  });
  expect(movesOf(kept, farming)).toEqual([]);
});

test('hostile, the neutral’s worker builds as it does at peace, and of no city it stands where it is and plays nothing', () => {
  const farming = workersPlaying(['PH_Farm']);
  const peace = workerAround(farming, [{ q: 2, r: 0 }]);
  const fallen = withUnits(endedTurn(onTheNeutralCity()), [
    neutralStanding({ q: 2, r: 0 }, { script: WORKER_SCRIPT, stats: WORKER_STATS }),
  ]);
  const unit = fallen.units.at(-1);
  if (unit === undefined) throw new Error('no unit stands on the fallen chronicle');

  expect(builtBy(farming, warDeclared(peace).chronicle)).toEqual(builtBy(farming, peace));
  expect(builtBy(farming, peace)).toEqual(['2,0 PH_Farm']);
  expect(fallen.neutral).toBeUndefined();
  expect(tileKey(NEUTRAL_WORKER.moveTo(farming, fallen, unit).landing.tile)).toBe('2,0');
  expect(readOf(NEUTRAL_WORKER.acts(farming, fallen, unit))).toBeUndefined();
});

test('a pillager goes for a worker of the neutral’s as for one of the player’s, and never for the neutral’s city’s tile, a worker standing on it or not', () => {
  const from = { q: 2, r: 0 };
  const pillager = standing('enemy', from, { move: MOVE_POINT });
  const workerOf = (tile: TileCoords): Standing => neutralStanding(tile, { stats: WORKER_STATS });
  const moves = (units: Standing[]): string[][] =>
    movesOf(neutralAround([], [...units, pillager]), PILLAGING);

  expect(moves([workerOf({ q: 4, r: -3 })])).toEqual([['2,0', '2,-1']]);
  expect(moves([worker({ q: 4, r: -3 })])).toEqual([['2,0', '2,-1']]);
  expect(moves([workerOf(NEUTRAL_TILE)])).toEqual(moves([neutralStanding(NEUTRAL_TILE)]));
});

test('a pillager with nothing left to go for, standing on the neutral’s city’s tile, prepares the capture there', () => {
  const standingOn = neutralAround([], [standing('enemy', NEUTRAL_TILE, { move: MOVE_POINT })]);

  expect(asked(PILLAGING, standingOn)).toEqual({ to: tileKey(NEUTRAL_TILE), acts: 'prepare' });
});

test('a guard attacks the unit of the least health within its range', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [
      standing('player', { q: 3, r: 0 }, { health: 4 }),
      standing('player', { q: 4, r: -1 }, { health: 2 }),
      enemyStanding(camp, camp, { stats: { move: 0 } }),
    ],
  });

  expect(attacksOf(city, GUARDING)).toEqual([['4,0', '4,-1']]);
});

/** How far apart from every camp standing the camp-or-raid shape places its camp in these tests. */
const APART = 3;

test('a camp or a raid places a camp near the city with its warriors on and around it as the camp’s guards where a tile takes one, and enters them as a raid of the camp’s raiders where none does', () => {
  const open = cityOf(['urban'], { tiles: field(6) });
  const closed = cityOf(['urban'], { tiles: field(2) });

  const placed = campedOrRaided(CATALOGUE, open, CAMP_KIND, 3, APART).chronicle;
  const raided = campedOrRaided(CATALOGUE, closed, CAMP_KIND, 3, APART).chronicle;
  const camps = placed.tiles.filter((tile) => tile.building === CAMP.building);
  const camp = { q: camps[0].q, r: camps[0].r };

  expect(camps).toHaveLength(1);
  expect(distance(camp, CITY)).toBeGreaterThanOrEqual(3);
  expect(enemiesOf(placed)).toMatchObject(Array(3).fill({ script: GUARD_SCRIPT, camp }));
  expect(enemiesOf(placed).map((unit) => tileKey(unit.tile))).toContain(tileKey(camp));
  expect(raided.tiles.some((tile) => tile.building === CAMP.building)).toBe(false);
  expect(enemiesOf(raided)).toMatchObject(Array(3).fill({ script: SCRIPT, camp: undefined }));
});
