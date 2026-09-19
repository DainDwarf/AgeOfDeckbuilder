import { expect, test } from 'vitest';
import { type Catalogue, catalogued } from '../rules/catalogue';
import { apply, outcome } from '../rules/chronicle';
import {
  attacksOf,
  CATALOGUE,
  CITY,
  cityOf,
  field,
  madeOf,
  movesOf,
  only,
  riverBetween,
  SCRIPT,
  standing,
  worker,
} from '../rules/fixtures';
import { distance, MOVE_POINT, type River } from '../rules/map';
import type { Chronicle } from '../rules/state';
import { ADVANCE } from './scripts';

/** The fixture's content, its enemies entering with the default script in place of its own. */
const ADVANCING: Catalogue = catalogued({ ...CATALOGUE, scripts: { [SCRIPT]: ADVANCE } });

test('a forest on an enemy’s way costs it what the tile says, and keeps it off the city', () => {
  /** One corridor to the city, forked: the straight way through one tile, the way round through two. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 1, r: -1 }];
  const raider = standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT, damage: 0 });
  const plains = cityOf(['urban'], { tiles: only(2, corridor), units: [raider] });
  const wooded = cityOf(['urban'], {
    tiles: madeOf(only(2, corridor), 'forest', [{ q: 1, r: 0 }]),
    units: [raider],
  });

  expect(movesOf(plains, ADVANCING)).toEqual([['2,0', '0,0']]);
  expect(movesOf(wooded, ADVANCING)).toEqual([['2,0', '1,-1']]);
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

  expect(movesOf(beset([]), ADVANCING)).toEqual([['3,0', '4,0']]);
  expect(movesOf(beset([riverBetween(bank, across)]), ADVANCING)).toEqual([['3,0', '0,0']]);
});

test('an enemy moves toward the nearest of the player’s units instead of the city', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(ADVANCING, city, { type: 'end-turn' }));

  expect(distance(moved.units[1].tile, { q: 2, r: 0 })).toBe(1);
});

test('an enemy on the city’s tile attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      worker({ q: 0, r: 1 }),
      standing('enemy', { q: 1, r: 0 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  const stood = outcome(apply(ADVANCING, city, { type: 'end-turn' }));

  expect(stood.units[1].tile).toEqual(CITY);
  expect(attacksOf(city, ADVANCING)).toEqual([]);
  expect(stood.units[0].stats.health).toBe(city.units[0].stats.health);
});
