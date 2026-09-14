import { expect, test } from 'vitest';
import { catalogued } from '../rules/catalogue';
import { unitMarkOf } from '../ui/marks';
import { unitName } from '../ui/text';
import { STAND_IN } from './stand-in';

test('the stand-in holds together', () => {
  expect(catalogued(STAND_IN)).toBe(STAND_IN);
});

test('every unit kind of the stand-in has a name and a mark on the screen', () => {
  for (const id of Object.keys(STAND_IN.units)) {
    expect(() => unitName(id)).not.toThrow();
    expect(() => unitMarkOf(id)).not.toThrow();
  }
});
