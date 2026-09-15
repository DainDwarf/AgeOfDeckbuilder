import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import {
  chronicleOf,
  counted,
  endTurn,
  firstSeed,
  launch,
  open,
  riverRuns,
  watch,
} from './chronicle-screen';

/** The first seed whose map runs a river along a tile the opening has charted. */
function riverSeed(): number {
  return firstSeed('runs a river along a charted tile', (seed) =>
    riverRuns(launch(seed, deckOf(STAND_IN, 'PH_Deck'))) > 0 ? seed : undefined,
  );
}

test('the map draws every run of river along a charted tile, and an ended turn leaves them', async ({
  page,
}) => {
  const problems = watch(page);
  await open(page, riverSeed(), 'PH_Deck');

  const chronicle = await chronicleOf(page);
  expect(riverRuns(chronicle)).toBeGreaterThan(0);
  expect(await counted(page, 'river')).toBe(riverRuns(chronicle));

  await endTurn(page);
  const ended = await chronicleOf(page);
  expect(await counted(page, 'river')).toBe(riverRuns(ended));

  expect(problems).toEqual([]);
});
