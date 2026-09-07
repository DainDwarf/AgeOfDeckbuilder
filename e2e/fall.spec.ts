import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { budget, chronicleOf, endTurn, fallRun, open, watch } from './chronicle-screen';

/** Whether the defeat screen has risen over the chronicle screen: the rise ends at full alpha. */
function defeatShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('defeat')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

test('the enemy that reaches the city captures it, and the chronicle ends on the defeat screen', async ({
  page,
}) => {
  const problems = watch(page);
  const run = fallRun();
  test.setTimeout(budget(run.turns));

  await open(page, run.seed, 'PH_Deck');
  expect(await defeatShown(page)).toBe(false);
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);

  const fallen = await chronicleOf(page);

  expect(fallen.defeat?.cause).toBe('capture');
  expect(fallen.defeat?.turn).toBe(fallen.turn);
  await expect.poll(() => defeatShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
