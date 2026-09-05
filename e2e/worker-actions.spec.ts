import { expect, type Page, test } from '@playwright/test';
import type { CardId } from '../src/rules/cards';
import type { Chronicle } from '../src/rules/chronicle';
import { IMPROVEMENTS, type TileCoords, tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { text } from '../src/ui/text';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  marksIn,
  onScreen,
  open,
  panelLines,
  playedOut,
  type Run,
  ringedTile,
  shownCard,
  standing,
  watch,
  workerRun,
} from './chronicle-screen';

/** The run's turn opened, a worker entered and marched onto the tile the run found. */
async function marchOut(page: Page, run: Run): Promise<Chronicle> {
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

  return chronicleOf(page);
}

/** The card taken out of the hand and aimed at the tile the worker stands on. */
async function aimAt(
  page: Page,
  hand: readonly CardId[],
  card: CardId,
  at: TileCoords,
): Promise<void> {
  const target = await onScreen(page, `tile-${tileKey(at)}`);
  await dragOut(page, hand.indexOf(card));
  await aimed(page);
  await page.mouse.click(target.x, target.y);
  await playedOut(page);
  await page.waitForFunction(
    (held) =>
      window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.hand.length === held,
    hand.length - 1,
  );
}

test('the mine card improves the hills the worker marched to', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Mine');

  const marched = await marchOut(page, run);
  const before = await marksIn(page, 'improvements');
  await aimAt(page, marched.hand, 'PH_Mine', run.tile);

  const after = await chronicleOf(page);
  const improved = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(improved?.improvements).toEqual(['PH_Mine']);
  expect(await marksIn(page, 'improvements')).toBe(before + 1);
  expect(after.resources.production).toBe(marched.resources.production - 3);
  expect(after.units[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});

test('the tile the mine improved inspects the mine on a card of its own, before its terrain', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Mine');

  const marched = await marchOut(page, run);
  await aimAt(page, marched.hand, 'PH_Mine', run.tile);

  // The worker that laid it still stands there, so the mine's card comes after the unit's.
  const at = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.tile));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');

  // Nothing is built on it, so the mine heads the card and its one row says what it gives.
  await expect
    .poll(() => panelLines(page))
    .toEqual([
      text('improvement.PH_Mine'),
      text('improvement.PH_Mine'),
      'panel-yield-production',
      `+${IMPROVEMENTS.PH_Mine.yields.production}`,
    ]);

  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('the urbanisation card terraforms the plain the worker marched to, feature and all', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Urbanisation', (tile) => tile.feature !== undefined);
  const mark = `feature-${tileKey(run.tile)}`;

  const marched = await marchOut(page, run);
  expect(await standing(page, mark)).toBe(true);

  await aimAt(page, marched.hand, 'PH_Urbanisation', run.tile);

  const after = await chronicleOf(page);
  const worked = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(worked?.terrain).toBe('urban');
  expect(worked?.feature).toBeUndefined();
  expect(await standing(page, mark)).toBe(false);
  expect(after.resources.production).toBe(marched.resources.production - 5);
  expect(after.units[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});
