import { describe, expect, it } from 'vitest';
import { CATALOGUE, cityOf, FREEZE, FROST } from '../rules/fixtures';
import { answerOf } from '../rules/schedule';
import { namedCardMade } from './face';

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
