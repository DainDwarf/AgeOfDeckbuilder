import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { STAND_IN } from '../src/content/stand-in';
import { scheduleOf } from '../src/rules/catalogue';
import { tileKey } from '../src/rules/map';
import {
  aimed,
  budget,
  chronicleOf,
  cityTileOf,
  dragOut,
  dragUnit,
  endTurn,
  onScreen,
  open,
  playedOut,
  playersOf,
  watch,
  workerRun,
} from './chronicle-screen';

/** Whether the victory screen has risen over the chronicle screen: the rise ends at full alpha. */
function victoryShown(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const screen = window.named?.('victory')?.object as Phaser.GameObjects.Container | undefined;
    return screen?.visible === true && screen.alpha === 1;
  });
}

/** The schedule whose capstone lands early and is passed by a farm standing inside the border. */
const TILLAGE = 'PH_TillageSchedule';

test('the city passing the capstone wins, and the chronicle ends on the victory screen', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(3));

  // The short schedule's capstone lands on the second turn and its span's last is the third: the
  // second end of turn stops on its window, and the tick the third end brings passes it.
  await open(page, 1, 'PH_Deck', 'PH_ShortSchedule');
  expect(await victoryShown(page)).toBe(false);
  for (let turn = 0; turn < 3; turn++) await endTurn(page);

  const won = await chronicleOf(page);

  expect(won.ending).toEqual({ outcome: 'victory', turn: 4 });
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(problems).toEqual([]);
});

test('the play that builds the farm passing the capstone wins on the play, and the victory screen rises', async ({
  page,
}) => {
  const problems = watch(page);
  const landing = scheduleOf(STAND_IN, TILLAGE).capstone.window[0];
  const run = workerRun('PH_Farm', (_, moved) => moved.turn >= landing, TILLAGE);
  test.setTimeout(budget(run.turn + 2));

  await open(page, run.seed, 'PH_Deck', TILLAGE);
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => playersOf(await chronicleOf(page)).length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, cityTileOf(entered), run.tile);

  const moved = await chronicleOf(page);
  const destination = await onScreen(page, `tile-${tileKey(run.tile)}`);
  expect(await victoryShown(page)).toBe(false);
  await dragOut(page, moved.hand.indexOf('PH_Farm'));
  await aimed(page);
  await page.mouse.click(destination.x, destination.y);
  await playedOut(page);

  const won = await chronicleOf(page);

  expect(won.tiles.find((tile) => tileKey(tile) === tileKey(run.tile))?.building).toBe('PH_Farm');
  expect(won.ending).toEqual({ outcome: 'victory', turn: run.turn });
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
