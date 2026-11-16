import { describe, expect, it } from 'vitest';
import { cardOf } from '../rules/catalogue';
import { CATALOGUE, cityOf, FREEZE, FROST, SILO } from '../rules/fixtures';
import { answerOf } from '../rules/schedule';
import { familyOf, labelledKind, namedCardMade } from './face';

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
