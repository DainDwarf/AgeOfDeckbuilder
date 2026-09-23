import { expect, test } from 'vitest';
import { type Catalogue, catalogued } from '../rules/catalogue';
import {
  attacksOf,
  CATALOGUE,
  CITY,
  camped,
  cityOf,
  field,
  madeOf,
  movesOf,
  only,
  SCRIPT,
  standing,
  worker,
} from '../rules/fixtures';
import { distance, MOVE_POINT, type TileCoords, tileKey } from '../rules/map';
import { seedRng } from '../rules/rng';
import type { Chronicle } from '../rules/state';
import { guarding, RAIDER } from './scripts';

/** The fixture's content, its enemies entering as raiders in place of its own script. */
const RAIDING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: RAIDER },
});

/** How far from its camp the fixture's guards keep. */
const RADIUS = 2;

/** The fixture's content, its enemies entering as guards in place of its own script. */
const GUARDING: Catalogue = catalogued({
  ...CATALOGUE,
  scripts: { ...CATALOGUE.scripts, [SCRIPT]: guarding(RADIUS) },
});

/** The last enemy of the chronicle, asked its move and its attack straight from the script. */
function asked(script: Catalogue, chronicle: Chronicle): { to: string; attacks?: string } {
  const enemy = chronicle.units.filter((unit) => unit.faction === 'enemy').at(-1);
  if (enemy === undefined) throw new Error('no enemy stands on the chronicle');
  const closure = script.scripts[SCRIPT];
  const target = closure.attacks(script, chronicle, enemy);
  return {
    to: tileKey(closure.moveTo(script, chronicle, enemy).landing.tile),
    attacks: target === undefined ? undefined : tileKey(target.tile),
  };
}

test('a raider on the city’s tile stays there and attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 0 }), standing('enemy', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(asked(RAIDING, city)).toEqual({ to: tileKey(CITY), attacks: undefined });
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
