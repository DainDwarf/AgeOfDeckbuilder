import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle } from '../src/rules/chronicle';
import { neighbours, tileKey } from '../src/rules/map';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  onScreen,
  open,
  ringedTile,
  settled,
  shownLayer,
  standing,
  watch,
  workerRun,
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

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await settled(page);
  await settled(page);
}

/** The first seed whose generator put a feature on a tile touching the city, well inside the frame. */
function featureRun(): { seed: number; key: string } {
  for (let seed = 1; seed <= 1000; seed++) {
    const { tiles, city } = beginChronicle(seed, DECKS.PH_Deck);
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find((tile) => tile.feature !== undefined && touching.has(tileKey(tile)));
    if (found !== undefined) return { seed, key: tileKey(found) };
  }
  throw new Error('no seed under a thousand puts a feature beside the city');
}

test('a tile the generator gave a feature shows its mark, and inspects as a layer of its own', async ({
  page,
}) => {
  const problems = watch(page);
  const run = featureRun();

  await open(page, run.seed, 'PH_Deck');
  expect(await standing(page, `feature-${run.key}`)).toBe(true);

  // Nothing stands on it and nothing is built on it: the feature and the terrain are all it is.
  const at = await onScreen(page, `tile-${run.key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(run.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('feature');
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('a click selects a tile, the inspection key steps its layers, and the back key drops each in turn', async ({
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
  const cityTile = tileKey(entered.units[0].tile);
  const city = await onScreen(page, `tile-${cityTile}`);
  expect(await shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // With nothing selected the inspection key has no tile to step.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // The city's tile carries all three layers: the worker that just entered, the city, the terrain.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownLayer(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('building');
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('unit');

  // A click on the tile already selected selects nothing afresh, and the layer stands.
  await page.mouse.click(city.x, city.y);
  await answered(page);
  expect(await shownLayer(page)).toBe('unit');
  expect(await ringedTile(page)).toBe(cityTile);

  // One step per press of the back key: the infopanel first, the ring after it.
  await page.keyboard.press('Escape');
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await standing(page, 'menu')).toBe(false);

  // West of the city: nothing stands on it, and it is clear of the panel standing east of the city.
  const { q, r } = entered.units[0].tile;
  const bareTile = tileKey({ q: q - 1, r });
  const bare = await onScreen(page, `tile-${bareTile}`);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(bareTile);
  expect(await shownLayer(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownLayer(page)).toBe('terrain');

  // A click on another tile selects it, and the inspection standing on the last one is let go of.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownLayer(page)).toBeUndefined();

  // Up and left of the city: inside the map's frame, which starts under the resource bar, and far
  // enough out for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 160 * city.unit);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a right click selects and inspects in the one press, steps on where it stands, and shows no browser menu', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const bare = await onScreen(page, BARE.name);
  const city = await chronicleOf(page).then((chronicle) =>
    onScreen(page, `tile-${tileKey(chronicle.city)}`),
  );

  await watchBrowserMenu(page);
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(BARE.key);
  await expect.poll(() => browserMenu(page)).toBe(true);

  // Nothing stands on it and nothing is built on it: after its terrain comes the bare ring again.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(BARE.key);
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBe('terrain');

  // The press carried the map nowhere either: the tile stands where it stood.
  const after = await onScreen(page, BARE.name);
  expect(after.x).toBeCloseTo(bare.x, 0);
  expect(after.y).toBeCloseTo(bare.y, 0);

  await page.mouse.click(city.x - 440 * city.unit, city.y - 160 * city.unit, { button: 'right' });
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('a right press while a card is aimed lets the card go', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm');

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragOut(page, entered.hand.indexOf('PH_March'));
  await aimed(page);

  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y, { button: 'right' });

  await expect.poll(() => standing(page, 'aim')).toBe(false);
  const released = await chronicleOf(page);
  expect(released.hand).toEqual(entered.hand);
  expect(released.units[0].tile).toEqual(entered.units[0].tile);
  // The aim held the tile presses off, so the one that let the card go picked out no tile.
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
