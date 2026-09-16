import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { budget, chronicleOf, endTurn, open, watch } from './chronicle-screen';

/** Whether the victory screen has risen over the chronicle screen: the rise ends at full alpha. */
function victoryShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('victory')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

test('the city passing the capstone wins, and the chronicle ends on the victory screen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(3));

  // The short schedule's capstone lands on the second turn and is passed at the end of the third:
  // the second end of turn stops on its window, and the third passes it.
  await open(page, 1, 'PH_Deck', 'PH_ShortSchedule');
  expect(await victoryShown(page)).toBe(false);
  for (let turn = 0; turn < 3; turn++) await endTurn(page);

  const won = await chronicleOf(page);

  expect(won.ending).toEqual({ outcome: 'victory', turn: 3 });
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
