import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  farmRun,
  onScreen,
  open,
  playedOut,
  watch,
} from './chronicle-screen';

/** How many buildings stand drawn on the map. */
function marks(page: Page): Promise<number> {
  return page.evaluate(() => {
    const built = window.named?.('buildings')?.object as Phaser.GameObjects.Container | undefined;
    if (built === undefined) throw new Error('the buildings are not on the chronicle screen');
    return built.list.length;
  });
}

test('the farm card builds its farm where the worker marched to', async ({ page }) => {
  const problems = watch(page);
  const run = farmRun();

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
  const standing = await marks(page);
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
  expect(await marks(page)).toBe(standing + 1);
  expect(after.resources.production).toBe(marched.resources.production - 3);
  expect(after.units[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});
