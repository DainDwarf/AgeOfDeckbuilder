import { expect, type Page, test } from '@playwright/test';
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
  standing,
  watch,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = { name: 'tile-0,-3', key: '0,-3' };

declare global {
  interface Window {
    /** Whether the game cancelled the browser's own menu, once the browser has asked for one. */
    browserMenu?: boolean;
  }
}

/** Listens for the browser asking for a menu of its own; nothing is asked for until it is. */
function watchBrowserMenu(page: Page): Promise<void> {
  return page.evaluate(() => {
    window.addEventListener(
      'contextmenu',
      (event) => {
        window.browserMenu = event.defaultPrevented;
      },
      { once: true },
    );
  });
}

/** Whether the browser asked for a menu, and whether the game cancelled the one it asked for. */
function browserMenu(page: Page): Promise<boolean | undefined> {
  return page.evaluate(() => window.browserMenu);
}

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

test('a right click picks out no tile: it backs the reading out, and no browser menu shows', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  const city = await chronicleOf(page).then((chronicle) =>
    onScreen(page, `tile-${tileKey(chronicle.city)}`),
  );
  await watchBrowserMenu(page);
  await page.mouse.click(city.x, city.y, { button: 'right' });

  await expect.poll(() => browserMenu(page)).toBe(true);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await standing(page, 'menu')).toBe(false);
  // The press carried the map nowhere either: the tile stands where it stood.
  const after = await onScreen(page, BARE.name);
  expect(after.x).toBeCloseTo(bare.x, 0);
  expect(after.y).toBeCloseTo(bare.y, 0);

  expect(problems).toEqual([]);
});

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

  // Up and left of the city: inside the map's frame, which starts under the resource bar, and far
  // enough out for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 160 * city.unit);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
