import { expect, test } from 'vitest';
import { healthBarOf } from './health-bar';

test('a unit at its full health wears no bar, nor one holding more than it', () => {
  expect(healthBarOf(5, 5, undefined)).toBeUndefined();
  expect(healthBarOf(7, 5, undefined)).toBeUndefined();
});

test('a unit below its full health fills its bar by the share of its full health it holds', () => {
  expect(healthBarOf(3, 5, undefined)).toEqual({ held: 3 / 5, removed: 0, kills: false });
});

test('an attack read on a unit removes its damage from the top of the health held, the bar worn at full health too', () => {
  expect(healthBarOf(3, 5, 2)).toEqual({ held: 3 / 5, removed: 2 / 5, kills: false });
  expect(healthBarOf(5, 5, 2)).toEqual({ held: 1, removed: 2 / 5, kills: false });
});

test('an attack that would kill removes all the health held, however much its damage passes it', () => {
  expect(healthBarOf(2, 5, 2)).toEqual({ held: 2 / 5, removed: 2 / 5, kills: true });
  expect(healthBarOf(2, 5, 4)).toEqual({ held: 2 / 5, removed: 2 / 5, kills: true });
});

test('a unit holding more than its full health is read as one at it, an attack included', () => {
  expect(healthBarOf(7, 5, 6)).toEqual({ held: 1, removed: 1, kills: false });
});
