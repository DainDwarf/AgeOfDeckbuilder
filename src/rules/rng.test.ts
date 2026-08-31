import { expect, test } from 'vitest';
import { nextRng, type Rng, seedRng } from './rng';

function take(rng: Rng, count: number): number[] {
  const values: number[] = [];
  let state = rng;
  for (let i = 0; i < count; i++) {
    const step = nextRng(state);
    state = step.rng;
    values.push(step.value);
  }
  return values;
}

test('the same seed gives the same sequence', () => {
  expect(take(seedRng(1234), 20)).toEqual(take(seedRng(1234), 20));
});

test('different seeds give different sequences', () => {
  expect(take(seedRng(1234), 20)).not.toEqual(take(seedRng(1235), 20));
});

test('the state survives JSON and continues identically', () => {
  let state = seedRng(99);
  for (let i = 0; i < 10; i++) state = nextRng(state).rng;

  const revived: Rng = JSON.parse(JSON.stringify(state));

  expect(revived).toEqual(state);
  expect(take(revived, 20)).toEqual(take(state, 20));
});

test('every value stays in [0, 1)', () => {
  for (const value of take(seedRng(7), 500)) {
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  }
});

// The literals below are the published splitmix32 and sfc32 streams, derived from the canonical
// implementations and never from rng.ts: regenerating them from this module's own output makes
// the test a tautology. A change to the stream forks every chronicle replay and every save that
// carries a generator state, so these vectors may only move with that break accepted.

test('a seed expands to the published generator state', () => {
  expect(seedRng(0)).toEqual([1684164658, -641697380, -1355403760, 2141751570]);
  expect(seedRng(1)).toEqual([1580013426, 350525680, -770792963, -1283263687]);
  expect(seedRng(1234)).toEqual([-1182780713, -1646890852, 428646200, 675931623]);
  expect(seedRng(0xdeadbeef | 0)).toEqual([46217145, 304148291, 1711218402, -1602892257]);
});

test('a seed replays the published stream', () => {
  expect(take(seedRng(1234), 8)).toEqual([
    0.49854334304109216, 0.6712051937356591, 0.6623358991928399, 0.09910198138095438,
    0.3061040532775223, 0.49293727963231504, 0.45523568615317345, 0.15070137521252036,
  ]);
  expect(take(seedRng(0xdeadbeef | 0), 8)).toEqual([
    0.7083733740728348, 0.28356762370094657, 0.3318341390695423, 0.9178141723386943,
    0.6297310914378613, 0.29322814219631255, 0.84101766301319, 0.5011682182084769,
  ]);
});
