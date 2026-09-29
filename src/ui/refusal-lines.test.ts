import { describe, expect, it } from 'vitest';
import { refused } from './refusal-lines';
import { text } from './text';

describe('what a refusal note says', () => {
  it('says of what a thing costs only what the city cannot pay, then what stands in the way', () => {
    const said = refused(
      [
        { resource: 'food', amount: 2 },
        { resource: 'culture', amount: 5 },
      ],
      { unaffordable: ['culture'], blocked: ['idle'] },
    );

    expect(said).toEqual([text('refusal.culture', { cost: 5 }), text('refusal.idle')]);
  });
});
