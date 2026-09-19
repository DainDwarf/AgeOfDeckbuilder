import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted, apply, outcome, refusalOf } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { type CardId, type Chronicle, playable } from '../src/rules/state';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { text } from '../src/ui/text';
import {
  aimed,
  budget,
  chronicleOf,
  cityTileOf,
  dragOut,
  dragUnit,
  endedTurn,
  endTurn,
  marksIn,
  onScreen,
  open,
  panelLines,
  playedOut,
  playersOf,
  type Run,
  refusalLines,
  rested,
  ringedTile,
  shownCard,
  standing,
  watch,
  workerRun,
} from './chronicle-screen';

/** Whether the road can be played on the tile: a worker with action left stands there, and the city can pay. */
function roadLands(chronicle: Chronicle, at: TileCoords): boolean {
  const road = aimOf(cardOf(STAND_IN, 'PH_Road'));
  if (road.aim !== 'tile') throw new Error('PH_Road is aimed at no tile');
  return (
    chronicle.hand.includes('PH_Road') &&
    playable(refusalOf(STAND_IN, chronicle, 'PH_Road')) &&
    admitted(STAND_IN, chronicle, road).some((coord) => tileKey(coord) === tileKey(at))
  );
}

/** The run's turn opened, a worker entered and moved by hand onto the tile the run found. */
async function moveOut(page: Page, run: Run): Promise<Chronicle> {
  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await page.waitForFunction(
    () =>
      window.game?.scene
        .getScene<ChronicleScene>('chronicle')
        .chronicle.units.filter((unit) => unit.faction === 'player').length === 1,
  );

  const entered = await chronicleOf(page);
  await dragUnit(page, cityTileOf(entered), run.tile);

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

test('the mine card improves the hills the worker moved to', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Mine');

  const moved = await moveOut(page, run);
  const before = await marksIn(page, 'improvements');
  await aimAt(page, moved.hand, 'PH_Mine', run.tile);

  const after = await chronicleOf(page);
  const improved = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(improved?.improvements).toEqual(['PH_Mine']);
  expect(await marksIn(page, 'improvements')).toBe(before + 1);
  expect(after.resources.production).toBe(moved.resources.production - 3);
  expect(playersOf(after)[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});

test('the road on the worker that laid the mine is refused for its action, and lands on the next turn', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Mine', (tile, moved) => {
    const at = { q: tile.q, r: tile.r };
    const mine = moved.hand.indexOf('PH_Mine');
    const mined = outcome(
      apply(STAND_IN, moved, { type: 'play', index: mine, aim: 'tile', tile: at }),
    );
    if (!mined.hand.includes('PH_Road') || !playable(refusalOf(STAND_IN, mined, 'PH_Road')))
      return false;
    const next = endedTurn(mined);
    return next.ending === undefined && roadLands(next, at);
  });
  // The run's ends of turn, the worker entered and moved, the mine, and the turn after it.
  test.setTimeout(budget(run.turn + 3));

  const moved = await moveOut(page, run);
  await aimAt(page, moved.hand, 'PH_Mine', run.tile);

  const mined = await chronicleOf(page);
  const target = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await dragOut(page, mined.hand.indexOf('PH_Road'));
  await aimed(page);
  await page.mouse.click(target.x, target.y);
  await rested(page);

  expect(await refusalLines(page)).toEqual([text('refusal.action')]);
  expect(await chronicleOf(page)).toEqual(mined);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await endTurn(page);

  const next = await chronicleOf(page);
  await aimAt(page, next.hand, 'PH_Road', run.tile);

  const after = await chronicleOf(page);
  const improved = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(improved?.improvements).toEqual(['PH_Mine', 'PH_Road']);
  expect(problems).toEqual([]);
});

test('the tile the mine improved inspects the mine on a card of its own, before its terrain', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Mine');

  const moved = await moveOut(page, run);
  await aimAt(page, moved.hand, 'PH_Mine', run.tile);

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
      `+${improvementKind(STAND_IN, 'PH_Mine').yields.production}`,
    ]);

  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('the urbanisation card terraforms the plain the worker moved to, feature and all', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Urbanisation', (tile) => tile.feature !== undefined);
  const mark = `feature-${tileKey(run.tile)}`;

  const moved = await moveOut(page, run);
  expect(await standing(page, mark)).toBe(true);

  await aimAt(page, moved.hand, 'PH_Urbanisation', run.tile);

  const after = await chronicleOf(page);
  const worked = after.tiles.find((tile) => tileKey(tile) === tileKey(run.tile));

  expect(worked?.terrain).toBe('urban');
  expect(worked?.feature).toBeUndefined();
  expect(await standing(page, mark)).toBe(false);
  expect(after.resources.production).toBe(moved.resources.production - 5);
  expect(playersOf(after)[0].tile).toEqual(run.tile);
  expect(problems).toEqual([]);
});
