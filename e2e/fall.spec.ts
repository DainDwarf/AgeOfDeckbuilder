import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle } from '../src/rules/chronicle';
import { chronicleOf, endTurn, open, watch } from './table';

/** The first seed whose city is captured inside twenty turns of ending the turn and nothing else. */
function fallRun(): { seed: number; turns: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turns = 1; turns <= 20 && chronicle.defeat === undefined; turns++) {
      chronicle = apply(chronicle, { type: 'end-turn' });
      if (chronicle.defeat?.cause === 'capture') return { seed, turns };
    }
  }
  throw new Error('no seed under a thousand is captured inside twenty turns');
}

/** Whether the defeat screen stands over the table. */
function defeatShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('defeat')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true;
  });
}

test('the enemy that reaches the city captures it, and the chronicle ends on the defeat screen', async ({
  page,
}) => {
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
