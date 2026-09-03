import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { chronicleOf, endTurn, fallRun, open, watch } from './table';

/** Whether the defeat screen has risen over the table: the rise ends at its full alpha. */
function defeatShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('defeat')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

/** Nine ends of turn, every stage of each played out: 22 seconds alone, 29 beside the local suite. */
const NINE_TURNS = 60_000;

test('the enemy that reaches the city captures it, and the chronicle ends on the defeat screen', async ({
  page,
}) => {
  test.setTimeout(NINE_TURNS);
  const problems = watch(page);
  const run = fallRun();

  await open(page, run.seed, 'PH_Deck');
  expect(await defeatShown(page)).toBe(false);
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);

  const fallen = await chronicleOf(page);

  expect(fallen.defeat?.cause).toBe('capture');
  expect(fallen.defeat?.turn).toBe(fallen.turn);
  await expect.poll(() => defeatShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
