import { describe, expect, it } from 'vitest';
import { builds } from '../rules/cards';
import { type Card, cardOf, catalogued } from '../rules/catalogue';
import {
  CATALOGUE,
  changed,
  cityOf,
  FREEZE,
  FROST,
  SHRINE,
  SILO,
  TILLAGE,
} from '../rules/fixtures';
import { answerOf } from '../rules/schedule';
import { familyOf, labelledKind, namedCardMade, numbersRun, placedReading } from './face';
import { text } from './text';

describe('a card’s face', () => {
  it('is labelled by its card’s kind, an action card’s naming the worker where it is played through one and no unit where it is played through any', () => {
    const labelled = (id: string) => labelledKind(cardOf(CATALOGUE, id));

    expect(labelled('PH_Mine')).toBe('worker-action');
    expect(labelled('PH_Embark')).toBe('action');
    expect(labelled('PH_Farm')).toBe('building');
    expect(labelled('PH_Harvest')).toBe('instant');
  });

  it('is of the family of what its play places, whatever its kind, and of its kind’s family where it places nothing', () => {
    const family = (id: string) => familyOf(cardOf(CATALOGUE, id));

    expect(family('PH_Worker')).toBe('unit');
    expect(family('PH_Band')).toBe('unit');
    expect(family('PH_Farm')).toBe('building');
    expect(family('PH_Settle')).toBe('building');
    expect(family(SILO)).toBe('building');
    expect(family('PH_Mine')).toBe('improvement');
    expect(family('PH_Hunger')).toBe('hazard');
    expect(family('PH_Ordeal')).toBe('challenge');
    expect(family('PH_Spoils')).toBe('trophy');
    expect(family('PH_Embark')).toBe('thing-done');
    expect(family('PH_Stores')).toBe('thing-done');
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
