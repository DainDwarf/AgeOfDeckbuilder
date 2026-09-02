import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { DECKS } from '../src/rules/cards';
import {
  apply,
  beginChronicle,
  buildable,
  type Chronicle,
  playable,
  refusalOf,
} from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { chronicleOf, dragOut, endTurn, onScreen, open, watch } from './table';

/** A chronicle whose turn `turn` can enter a worker, march it onto `tile` and build a farm there. */
type Run = { readonly seed: number; readonly turn: number; readonly tile: TileCoords };

function farmRun(): Run {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const tile = farmedThisTurn(chronicle);
      if (tile !== undefined) return { seed, turn, tile };
      chronicle = apply(chronicle, { type: 'end-turn' });
    }
  }
  throw new Error('no seed under a thousand opens a turn on a worker, a march and a farm');
}

/** Where the farm lands when this hand plays its worker, its march and its farm in that order. */
function farmedThisTurn(chronicle: Chronicle): TileCoords | undefined {
  const enter = chronicle.hand.indexOf('PH_Worker');
  if (enter === -1 || !playable(refusalOf(chronicle, 'PH_Worker'))) return undefined;
  const entered = apply(chronicle, { type: 'play', index: enter });

  const march = entered.hand.indexOf('PH_March');
  if (march === -1 || !entered.hand.includes('PH_Farm')) return undefined;

  for (const tile of neighbours(entered.city)) {
    const moved = apply(entered, {
      type: 'play',
      index: march,
      target: { type: 'unit-tile', unit: 0, tile },
    });
    if (moved === entered || !playable(refusalOf(moved, 'PH_Farm'))) continue;
    if (buildable(moved, 'PH_Farm').some((coord) => tileKey(coord) === tileKey(tile))) return tile;
  }
  return undefined;
}

/** How many buildings stand drawn on the map. */
function marks(page: Page): Promise<number> {
  return page.evaluate(() => {
    const built = window.named?.('buildings')?.object as Phaser.GameObjects.Container | undefined;
    if (built === undefined) throw new Error('the buildings are not on the table');
    return built.list.length;
  });
}

/** Waits for the armed card to lay its catcher over the map, which the press that aims lands on. */
async function aimed(page: Page): Promise<void> {
  await page.waitForFunction(() => window.named?.('aim') !== undefined);
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
  await page.waitForFunction((on) => {
    const unit = window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.units[0];
    return unit?.tile.q === on.q && unit.tile.r === on.r;
  }, run.tile);

  const marched = await chronicleOf(page);
  const standing = await marks(page);
  await dragOut(page, marched.hand.indexOf('PH_Farm'));
  await aimed(page);
  await page.mouse.click(destination.x, destination.y);
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
