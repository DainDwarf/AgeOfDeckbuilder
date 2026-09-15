import { expect, test } from '@playwright/test';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  aimed,
  besideTiles,
  chronicleOf,
  cityTileOf,
  dragOut,
  dragUnit,
  endTurn,
  marksIn,
  onScreen,
  open,
  playedOut,
  shownCard,
  standing,
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
  await dragUnit(page, cityTileOf(entered), run.tile);

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

test('a right click while the farm card is aimed inspects, and the card stays aimed to be played', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm');

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, cityTileOf(entered), run.tile);

  const moved = await chronicleOf(page);
  const destination = await onScreen(page, `tile-${tileKey(run.tile)}`);
  const beside = await besideTiles(page);
  await dragOut(page, moved.hand.indexOf('PH_Farm'));
  await aimed(page);

  // The worker moved there, so the first card of that tile's cycle is the unit standing on it.
  await page.mouse.click(destination.x, destination.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  expect(await standing(page, 'aim')).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(moved.hand);

  await page.mouse.click(beside.x, beside.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await standing(page, 'aim')).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(moved.hand);

  // Neither press let the card go, so the left press on the destination is still the card's.
  await page.mouse.click(destination.x, destination.y);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).hand.length).toBe(moved.hand.length - 1);

  const after = await chronicleOf(page);
  expect(after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile))?.building).toBe('PH_Farm');
  expect(problems).toEqual([]);
});
