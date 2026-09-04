import { expect, test } from '@playwright/test';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  marksIn,
  onScreen,
  open,
  playedOut,
  watch,
  workerRun,
} from './chronicle-screen';

test('the farm card builds its farm where the worker marched to', async ({ page }) => {
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
  const city = await onScreen(page, `tile-${tileKey(entered.city)}`);
  const destination = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await dragOut(page, entered.hand.indexOf('PH_March'));
  await aimed(page);
  await page.mouse.move(city.x, city.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 5 });
  await page.mouse.up();
  await playedOut(page);
  await page.waitForFunction((on) => {
    const unit = window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.units[0];
    return unit?.tile.q === on.q && unit.tile.r === on.r;
  }, run.tile);

  const marched = await chronicleOf(page);
  const standing = await marksIn(page, 'buildings');
  await dragOut(page, marched.hand.indexOf('PH_Farm'));
  await aimed(page);
  await page.mouse.click(destination.x, destination.y);
  await playedOut(page);
  await page.waitForFunction(
    (held) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.hand.length === held,
    marched.hand.length - 1,
  );

  const after = await chronicleOf(page);
  const built = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(built?.building).toBe('PH_Farm');
  expect(await marksIn(page, 'buildings')).toBe(standing + 1);
  expect(after.resources.production).toBe(marched.resources.production - 3);
  expect(after.units[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});
