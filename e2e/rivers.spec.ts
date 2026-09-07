import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle } from '../src/rules/chronicle';
import { chronicleOf, counted, endTurn, firstSeed, open, watch } from './chronicle-screen';

/** The first seed whose map runs a river. */
function riverSeed(): number {
  return firstSeed('runs a river', (seed) =>
    beginChronicle(seed, DECKS.PH_Deck).rivers.length > 0 ? seed : undefined,
  );
}

test('the map draws every river the chronicle runs, and an ended turn leaves them', async ({
  page,
}) => {
  const problems = watch(page);
  await open(page, riverSeed(), 'PH_Deck');

  const chronicle = await chronicleOf(page);
  expect(chronicle.rivers.length).toBeGreaterThan(0);
  expect(await counted(page, 'river')).toBe(chronicle.rivers.length);

  await endTurn(page);
  expect(await counted(page, 'river')).toBe(chronicle.rivers.length);

  expect(problems).toEqual([]);
});
