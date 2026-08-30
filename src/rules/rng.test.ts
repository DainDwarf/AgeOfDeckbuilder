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
