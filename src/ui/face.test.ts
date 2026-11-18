import { describe, expect, it } from 'vitest';
import { builds } from '../rules/cards';
import { type Card, cardOf, catalogued, unitKind } from '../rules/catalogue';
import {
  CAMP,
  CATALOGUE,
  changed,
  cityOf,
  FREEZE,
  FROST,
  NEUTRAL,
  SHRINE,
  SILO,
  SITE,
  TILLAGE,
} from '../rules/fixtures';
import { answerOf } from '../rules/schedule';
import type { CardArt } from './art-box';
import {
  artPictureOf,
  buildingFacing,
  cardFront,
  cardStats,
  labelledKind,
  namedCardMade,
  numbersRun,
  placedReading,
} from './face';
import { text } from './text';

describe('a card’s face', () => {
  it('is labelled by its card’s kind, an action card’s naming the worker it is played through', () => {
    const labelled = (id: string) => labelledKind(cardOf(CATALOGUE, id));

    expect(labelled('PH_Hunt')).toBe('worker-action');
    expect(labelled('PH_Mine')).toBe('improvement');
    expect(labelled('PH_Farm')).toBe('building');
    expect(labelled('PH_Harvest')).toBe('instant');
  });

  it('wears the plain front of its kind, the oval window where its play places a thing and the arched where it places nothing, and the decorated front where its play places the city', () => {
    const front = (id: string) => cardFront(cardOf(CATALOGUE, id));

    expect(front('PH_Worker')).toEqual({ front: 'plain', kind: 'unit', window: 'oval' });
    expect(front('PH_Band')).toEqual({ front: 'plain', kind: 'settle', window: 'oval' });
    expect(front('PH_Stores')).toEqual({ front: 'plain', kind: 'settle', window: 'arched' });
    expect(front(SILO)).toEqual({ front: 'plain', kind: 'action', window: 'oval' });
    expect(front('PH_Mine')).toEqual({ front: 'plain', kind: 'improvement', window: 'oval' });
    expect(front('PH_Hunt')).toEqual({ front: 'plain', kind: 'action', window: 'arched' });
    expect(front('PH_Harvest')).toEqual({ front: 'plain', kind: 'instant', window: 'arched' });
    expect(front('PH_Hunger')).toEqual({ front: 'plain', kind: 'hazard', window: 'arched' });
    expect(front('PH_Settle')).toEqual({ front: 'decorated' });
  });
});

describe('a face of a card that places a thing on the ground', () => {
  const reading = (id: string, city?: string) =>
    placedReading(CATALOGUE, cardOf(CATALOGUE, id), city);

  it('marks the building its thing is built over alone, else the features its kind names, else its terrains, and the river last where its kind asks for one; a settle card its city section’s building’s, and nothing under none', () => {
    expect(reading(SILO).goesOn).toEqual([{ kind: 'building', id: TILLAGE }]);
    expect(reading('PH_Smokehouse').goesOn).toEqual([
      { kind: 'feature', id: 'PH_Game' },
      { kind: 'feature', id: 'PH_Fertile' },
    ]);
    expect(reading('PH_Ditch').goesOn).toEqual([
      { kind: 'terrain', id: 'plain' },
      { kind: 'terrain', id: 'forest' },
      { kind: 'river' },
    ]);
    expect(reading('PH_Settle', 'PH_City').goesOn).toEqual([{ kind: 'terrain', id: 'urban' }]);
    expect(reading('PH_Settle').goesOn).toEqual([]);
    expect(reading('PH_Band', 'PH_City').goesOn).toEqual([]);
  });

  it('reads one resource to each point its thing gives and to each it takes, in the resource bar’s order', () => {
    expect(reading(SHRINE)).toMatchObject({
      gives: [],
      takes: ['production', 'production', 'production', 'culture'],
      range: 0,
    });
    expect(reading('PH_Mill')).toMatchObject({ gives: ['production'], takes: [], range: 0 });
  });

  it('of a building giving to the tiles beside it and nothing on its own tile reads one text of what it gives, on which terrain, and what it takes, and a range of one, and no numbers', () => {
    const jetty = 'PH_Jetty';
    const beside = { terrain: 'coast', yields: { food: 2 } };
    const content = catalogued(
      changed({
        buildings: {
          ...CATALOGUE.buildings,
          [jetty]: { terrains: ['coast'], yields: {}, givesBeside: beside, upkeep: { money: 1 } },
        },
      }),
    );
    const card: Card = { kind: 'building', cost: {}, ...builds(jetty) };

    expect(placedReading(content, card, undefined)).toEqual({
      goesOn: [{ kind: 'terrain', id: 'coast' }],
      gives: [],
      takes: [],
      range: 1,
      leads: text('face.in-range-taking', {
        gives: numbersRun('gives', ['food', 'food']),
        terrain: 'coast',
        takes: numbersRun('takes', ['money']),
      }),
    });
  });
});

describe('a face of a card that places a unit', () => {
  it('reads the stats of the kind its card places, a unit card’s and a settle card’s alike, and a card placing no unit reads none', () => {
    const statsOf = (kind: string) => {
      const { damage, health, move, action, range, sight } = unitKind(CATALOGUE, kind);
      return { damage, health, move, action, range, sight };
    };
    const stats = (id: string) => cardStats(CATALOGUE, cardOf(CATALOGUE, id));

    expect(stats('PH_Warrior')).toEqual(statsOf('PH_Warrior'));
    expect(stats('PH_Band')).toEqual(statsOf('PH_Worker'));
    expect(stats('PH_Farm')).toBeUndefined();
  });
});

describe('a card’s art box', () => {
  it('on the card whose play places the city holds the building of the city section it is drawn under, on its ground in the oval window, and nothing under no city section', () => {
    const art: CardArt = { ground: 'plain', holds: 'placed' };

    expect(artPictureOf(CATALOGUE, 'PH_Settle', art, 'PH_City')).toEqual({
      window: 'oval',
      ground: 'plain',
      holds: { kind: 'building', building: 'PH_City' },
    });
    expect(artPictureOf(CATALOGUE, 'PH_Settle', art, undefined)).toBeUndefined();
  });

  it('on a card whose play places an improvement holds that improvement, on its ground in the oval window', () => {
    const art: CardArt = { ground: 'hills', holds: 'placed' };

    expect(artPictureOf(CATALOGUE, 'PH_Mine', art, undefined)).toEqual({
      window: 'oval',
      ground: 'hills',
      holds: { kind: 'improvement', improvement: 'PH_Mine' },
    });
  });
});

describe('a building’s face', () => {
  it('is the face of the card whose play places it, the city’s card drawn under it where it is a city section’s building', () => {
    expect(buildingFacing(CATALOGUE, 'PH_Farm')).toEqual({
      wears: 'card',
      card: 'PH_Farm',
      city: undefined,
    });
    expect(buildingFacing(CATALOGUE, 'PH_City')).toEqual({
      wears: 'card',
      card: 'PH_Settle',
      city: 'PH_City',
    });
  });

  it('of a building no card places is its own, reading what it is in its age: a camp, a site or a neutral’s city', () => {
    expect(buildingFacing(CATALOGUE, CAMP.building)).toEqual({ wears: 'own', captured: 'camp' });
    expect(buildingFacing(CATALOGUE, SITE)).toEqual({ wears: 'own', captured: 'site' });
    expect(buildingFacing(CATALOGUE, NEUTRAL)).toEqual({ wears: 'own', captured: 'neutral-city' });
  });

  it('is refused for a building two cards place, and for one no card places that no age holds', () => {
    const twice = changed({
      cards: { ...CATALOGUE.cards, PH_Barn: { kind: 'building', cost: {}, ...builds('PH_Farm') } },
    });
    const unplaced = changed({
      buildings: { ...CATALOGUE.buildings, PH_Hut: { terrains: ['plain'], yields: {} } },
    });

    expect(() => buildingFacing(twice, 'PH_Farm')).toThrow();
    expect(() => buildingFacing(unplaced, 'PH_Hut')).toThrow();
  });
});

describe('a card named on a face', () => {
  it('is made at the counters an answer reads under the names the card declares, a value read under any other name setting nothing, and at its start on any other face', () => {
    const chronicle = cityOf(['urban']);
    const reading = answerOf(CATALOGUE, 'PH_Cold', 'PH_Freeze').reads(CATALOGUE, chronicle);

    const onAnswer = namedCardMade(CATALOGUE, 'PH_Frost', reading);
    const onCard = namedCardMade(CATALOGUE, 'PH_Frost', {});

    expect(reading).toEqual({ amount: FREEZE, cards: 1 });
    expect(onAnswer.counters).toEqual({ amount: FREEZE });
    expect(onCard.counters).toEqual({ amount: FROST });
  });
});
