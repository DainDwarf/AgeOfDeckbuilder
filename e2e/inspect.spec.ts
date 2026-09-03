import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import {
  chronicleOf,
  dragOut,
  endTurn,
  onScreen,
  open,
  ringedTile,
  shownLayer,
  watch,
} from './table';

/** The first seed with a turn in its first eight that opens on a worker the city can pay for. */
function workerRun(): { seed: number; turn: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      if (chronicle.hand.includes('PH_Worker') && playable(refusalOf(chronicle, 'PH_Worker'))) {
        return { seed, turn };
      }
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on a playable worker');
}

test('a tile selects on the first click and reads out a layer per click after it, until a click off the map drops it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await page.waitForFunction(
    () => window.game?.scene.getScene<ChronicleScene>('chronicle').chronicle.units.length === 1,
  );

  const entered = await chronicleOf(page);
  const cityTile = tileKey(entered.units[0].tile);
  const city = await onScreen(page, `tile-${cityTile}`);
  expect(await shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // The city's tile carries all three layers: the worker that just entered, the city, the terrain.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownLayer(page)).toBeUndefined();
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('unit');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('building');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => shownLayer(page)).toBe('unit');

  // West of the city: nothing stands on it, and it is clear of the panel standing east of the city.
  const { q, r } = entered.units[0].tile;
  const bareTile = tileKey({ q: q - 1, r });
  const bare = await onScreen(page, `tile-${bareTile}`);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(bareTile);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(bareTile);

  // Far enough up and left of the city for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 260 * city.unit);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
