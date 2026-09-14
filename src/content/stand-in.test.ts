import { expect, test } from 'vitest';
import { aimOf } from '../rules/cards';
import { cardOf, catalogued, deckOf } from '../rules/catalogue';
import { admitted, launched, refusalOf } from '../rules/chronicle';
import {
  buildingColourOf,
  buildingMarkOf,
  featureColourOf,
  featureMarkOf,
  improvementMarkOf,
  terrainColourOf,
  unitMarkOf,
} from '../ui/marks';
import {
  buildingName,
  cardName,
  cardRules,
  featureName,
  improvementName,
  terrainName,
  unitName,
} from '../ui/text';
import { STAND_IN, STAND_IN_REGION } from './stand-in';

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

test('every card of the stand-in has a name and a rules entry on the screen', () => {
  for (const id of Object.keys(STAND_IN.cards)) {
    expect(() => cardName(id)).not.toThrow();
    expect(() => cardRules(id)).not.toThrow();
  }
});

test('every card of the stand-in answers its refusal, and its admitted tiles, on a chronicle founded on each deck', () => {
  for (const deck of Object.keys(STAND_IN.decks)) {
    const chronicle = launched(STAND_IN, STAND_IN_REGION, 1, deckOf(STAND_IN, deck));
    for (const id of Object.keys(STAND_IN.cards)) {
      expect(() => refusalOf(STAND_IN, chronicle, id)).not.toThrow();
      const card = aimOf(cardOf(STAND_IN, id));
      switch (card.aim) {
        case 'tile':
        case 'unit':
          expect(() => admitted(STAND_IN, chronicle, card)).not.toThrow();
          break;
        case 'none':
        case 'discard-pile':
          break;
      }
    }
  }
});
