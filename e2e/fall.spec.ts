import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import {
  beforeTheFall,
  budget,
  chronicleOf,
  defeatShown,
  openSaved,
  stoppedTurn,
  watch,
} from './chronicle-screen';

test('the enemy that reaches the city captures it, and the chronicle ends on the defeat screen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const standing = beforeTheFall();
  const fallen = outcome(apply(CATALOGUE, standing, { type: 'end-turn' }));

  await openSaved(page, standing);
  expect(await defeatShown(page)).toBe(false);
  await stoppedTurn(page);

  expect(await chronicleOf(page)).toEqual(fallen);
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'capture', turn: standing.turn });
  await expect.poll(() => defeatShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
