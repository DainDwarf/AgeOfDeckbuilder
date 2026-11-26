import { expect, test } from 'vitest';
import { barShares, turnsLeft } from './city-bar';

test('a stock below its threshold fills its bar by the share of the threshold it holds, and paler past it what ending the turn would add', () => {
  expect(barShares(1, 10, 3)).toEqual({ held: 1 / 10, added: 3 / 10 });
});

test('a stock at or past its threshold fills its bar, nothing more', () => {
  expect(barShares(8, 8, 2)).toEqual({ held: 1, added: 0 });
  expect(barShares(9, 8, 2)).toEqual({ held: 1, added: 0 });
});

test('what ending the turn would add stops at the bar’s end', () => {
  expect(barShares(3, 4, 5)).toEqual({ held: 3 / 4, added: 1 / 4 });
});

test('a turn that would take from the stock, or add nothing, or none read, leaves the bar at the stock', () => {
  expect(barShares(3, 4, -2)).toEqual({ held: 3 / 4, added: 0 });
  expect(barShares(3, 4, 0)).toEqual({ held: 3 / 4, added: 0 });
  expect(barShares(3, 4, undefined)).toEqual({ held: 3 / 4, added: 0 });
});

test('the turns left count the ends of turn until the stock covers its threshold, the last one partial', () => {
  expect(turnsLeft('food', 5, 12, 1)).toBe(7);
  expect(turnsLeft('culture', 9, 14, 2)).toBe(3);
  expect(turnsLeft('culture', 9, 14, 5)).toBe(1);
});

test('food’s turns left are never fewer than one, culture’s none once its stock covers its threshold', () => {
  expect(turnsLeft('food', 11, 12, 3)).toBe(1);
  expect(turnsLeft('food', 12, 12, 0)).toBe(1);
  expect(turnsLeft('culture', 14, 14, 0)).toBe(0);
  expect(turnsLeft('culture', 15, 14, -2)).toBe(0);
});

test('a turn that adds nothing to a stock short of its threshold, or takes from it, leaves no count', () => {
  expect(turnsLeft('food', 5, 12, 0)).toBeUndefined();
  expect(turnsLeft('food', 5, 12, -1)).toBeUndefined();
  expect(turnsLeft('culture', 9, 14, 0)).toBeUndefined();
  expect(turnsLeft('food', 12, 12, -1)).toBeUndefined();
});
