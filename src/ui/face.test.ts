import { describe, expect, it } from 'vitest';
import { cardMade } from '../rules/catalogue';
import { CATALOGUE, cityOf, FREEZE, FROST } from '../rules/fixtures';
import { answerFace, cardFace, namedCardFace } from './face';

describe('a card named on a face', () => {
  it('is made at the counters an answer reads under the names the card declares, a value read under any other name setting nothing, and at its start on any other face', () => {
    const chronicle = cityOf(['urban']);
    const answer = answerFace(CATALOGUE, chronicle, 'PH_Cold', 'PH_Freeze');
    const card = cardFace(CATALOGUE, cardMade(CATALOGUE, 'PH_Hunger'));

    const onAnswer = namedCardFace(CATALOGUE, 'PH_Frost', answer.reading);
    const onCard = namedCardFace(CATALOGUE, 'PH_Frost', card.reading);

    expect(onAnswer.rules).toContain(String(FREEZE));
    expect(onAnswer.rules).not.toContain(String(FROST));
    expect(onCard.rules).toContain(String(FROST));
    expect(onCard.rules).not.toContain(String(FREEZE));
  });
});
