import { expect, test } from 'vitest';
import { cityBarOf } from './city-bar';

test('a stock below its threshold fills its bar by the share of the threshold it holds, and paler past it what ending the turn would add', () => {
  expect(cityBarOf(1, 10, 3)).toEqual({ held: 1 / 10, added: 3 / 10 });
});

test('a stock at or past its threshold fills its bar, nothing more', () => {
  expect(cityBarOf(8, 8, 2)).toEqual({ held: 1, added: 0 });
  expect(cityBarOf(9, 8, 2)).toEqual({ held: 1, added: 0 });
});

test('what ending the turn would add stops at the bar’s end', () => {
  expect(cityBarOf(3, 4, 5)).toEqual({ held: 3 / 4, added: 1 / 4 });
});

test('a turn that would take from the stock, or add nothing, or none read, leaves the bar at the stock', () => {
  expect(cityBarOf(3, 4, -2)).toEqual({ held: 3 / 4, added: 0 });
  expect(cityBarOf(3, 4, 0)).toEqual({ held: 3 / 4, added: 0 });
  expect(cityBarOf(3, 4, undefined)).toEqual({ held: 3 / 4, added: 0 });
});
