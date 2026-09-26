import { expect, test } from '@playwright/test';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  counted,
  endTurn,
  firstSeed,
  openSaved,
  riverRuns,
  settledOn,
  watch,
} from './chronicle-screen';

/** The first seed's turn 1, settled bare, whose opening charts a tile a river runs along. */
function riverCharted(): Chronicle {
  return firstSeed('charts a river from its opening', (seed) => {
    const chronicle = settledOn(seed);
    return riverRuns(chronicle) > 0 ? chronicle : undefined;
  });
}

test('the map draws every run of river along a charted tile, and an ended turn leaves them', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const opened = riverCharted();

  await openSaved(page, opened);
  expect(await counted(page, 'river')).toBe(riverRuns(opened));

  await endTurn(page);
  const ended = await chronicleOf(page);
  expect(await counted(page, 'river')).toBe(riverRuns(ended));

  expect(problems).toEqual([]);
});
