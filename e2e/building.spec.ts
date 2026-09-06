import { expect, test } from '@playwright/test';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  aimed,
  chronicleOf,
  dragOut,
  dragUnit,
  endTurn,
  marksIn,
  onScreen,
  open,
  playedOut,
  watch,
  workerRun,
} from './chronicle-screen';

test('the farm card builds its farm where the worker moved to', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm');

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.units.length === 1,
  );

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.tile);

  const moved = await chronicleOf(page);
  const standing = await marksIn(page, 'buildings');
  const destination = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await dragOut(page, moved.hand.indexOf('PH_Farm'));
  await aimed(page);
  await page.mouse.click(destination.x, destination.y);
  await playedOut(page);
  await page.waitForFunction(
    (held) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.hand.length === held,
    moved.hand.length - 1,
  );

  const after = await chronicleOf(page);
  const built = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(built?.building).toBe('PH_Farm');
  expect(await marksIn(page, 'buildings')).toBe(standing + 1);
  expect(after.resources.production).toBe(moved.resources.production - 3);
  expect(after.units[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});
