import { expect, test } from 'vitest';
import { catalogued } from '../rules/catalogue';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from '../ui/marks';
import { buildingName, featureName, improvementName, terrainName, unitName } from '../ui/text';
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

test('every terrain of the stand-in has a name and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.terrains)) {
    expect(() => terrainName(id)).not.toThrow();
    expect(() => terrainColourOf(id)).not.toThrow();
  }
});

test('every building of the stand-in has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.buildings)) {
    expect(() => buildingName(id)).not.toThrow();
    expect(() => buildingMarkOf(id)).not.toThrow();
    expect(() => buildingColourOf(id)).not.toThrow();
  }
});

test('every feature of the stand-in has a name, a mark and a colour on the screen', () => {
  for (const id of Object.keys(STAND_IN.features)) {
    expect(() => featureName(id)).not.toThrow();
    expect(() => featureMarkOf(id)).not.toThrow();
    expect(() => featureColourOf(id)).not.toThrow();
  }
});

test('every improvement of the stand-in has a name and a mark on the screen', () => {
  for (const id of Object.keys(STAND_IN.improvements)) {
    expect(() => improvementName(id)).not.toThrow();
    expect(() => improvementMarkOf(id)).not.toThrow();
  }
});
