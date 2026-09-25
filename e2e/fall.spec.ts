import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  endedTurn,
  firstSeed,
  openSaved,
  settledOn,
  stoppedTurn,
  watch,
} from './chronicle-screen';

/** Whether the defeat screen has risen over the chronicle screen: the rise ends at full alpha. */
function defeatShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('defeat')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

/**
 * The chronicle of the first seed whose city is captured inside forty turns of ending the turn and
 * nothing else, standing on the turn whose end captures it.
 */
function beforeTheFall(): Chronicle {
  return firstSeed('is captured inside forty turns', (seed) => {
    let chronicle = settledOn(NOMADIC, seed);
    for (let turn = 1; turn <= 40 && chronicle.ending === undefined; turn++) {
      const ended = endedTurn(chronicle);
      if (ended.ending?.outcome === 'defeat' && ended.ending.cause === 'capture') return chronicle;
      chronicle = ended;
    }
    return undefined;
  });
}

test('the enemy that reaches the city captures it, and the chronicle ends on the defeat screen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const standing = beforeTheFall();
  const fallen = outcome(apply(NOMADIC, standing, { type: 'end-turn' }));

  await openSaved(page, standing);
  expect(await defeatShown(page)).toBe(false);
  await stoppedTurn(page);

  expect(await chronicleOf(page)).toEqual(fallen);
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'capture', turn: standing.turn });
  await expect.poll(() => defeatShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
