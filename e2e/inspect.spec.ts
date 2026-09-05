import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle, type Chronicle } from '../src/rules/chronicle';
import {
  FEATURES,
  type FeatureId,
  neighbours,
  RIVER_YIELDS,
  runsAlong,
  type Terrain,
  type TileCoords,
  tileAt,
  tileKey,
} from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  aimed,
  chronicleOf,
  dragOut,
  endTurn,
  onScreen,
  open,
  ringedTile,
  settled,
  shownCard,
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
function featureRun(): { seed: number; key: string; feature: FeatureId } {
  for (let seed = 1; seed <= 1000; seed++) {
    const { tiles, city } = beginChronicle(seed, DECKS.PH_Deck);
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find((tile) => tile.feature !== undefined && touching.has(tileKey(tile)));
    if (found?.feature !== undefined) return { seed, key: tileKey(found), feature: found.feature };
  }
  throw new Error('no seed under a thousand puts a feature beside the city');
}

/** The tile west of one: the panel stands east of the tile it reads, so this one is clear of it. */
function westOf({ q, r }: TileCoords): TileCoords {
  return { q: q - 1, r };
}

/**
 * A chronicle whose city tile and the tile west of it hold nothing but what the spec steps: no
 * river runs along either, and the west one is bare, so its terrain card is the only one it holds.
 */
function stepsClear(chronicle: Chronicle): boolean {
  const west = tileAt(chronicle.tiles, westOf(chronicle.city));
  return (
    west !== undefined &&
    west.feature === undefined &&
    west.building === undefined &&
    west.improvements.length === 0 &&
    !runsAlong(chronicle.rivers, chronicle.city) &&
    !runsAlong(chronicle.rivers, west)
  );
}

/**
 * The first seed whose generator runs a river along a bare tile of a terrain a river feeds, touching
 * the city and so well inside the frame.
 */
function riverRun(): { seed: number; key: string; terrain: Terrain } {
  for (let seed = 1; seed <= 1000; seed++) {
    const { tiles, city, rivers } = beginChronicle(seed, DECKS.PH_Deck);
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find(
      (tile) =>
        touching.has(tileKey(tile)) &&
        tile.feature === undefined &&
        RIVER_YIELDS[tile.terrain] !== undefined &&
        runsAlong(rivers, tile),
    );
    if (found !== undefined) return { seed, key: tileKey(found), terrain: found.terrain };
  }
  throw new Error('no seed under a thousand runs a river along a fed tile beside the city');
}

/** What the card the infopanel is standing reads, line by line: its name, then its rows. */
function panelLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const panel = window.named?.('infopanel')?.object as Phaser.GameObjects.Container | undefined;
    if (panel === undefined) throw new Error('the infopanel is not on the chronicle screen');
    return panel.list
      .filter((object) => object.type === 'Container')
      .flatMap((card) =>
        (card as Phaser.GameObjects.Container).list
          .filter((part) => part.type === 'Text')
          .map((part) => (part as Phaser.GameObjects.Text).text),
      );
  });
}

test('a tile the generator gave a feature shows its mark, and the terrain card gives it a row of its own', async ({
  page,
}) => {
  const problems = watch(page);
  const run = featureRun();

  await open(page, run.seed, 'PH_Deck');
  expect(await standing(page, `feature-${run.key}`)).toBe(true);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${run.key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(run.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const lines = await panelLines(page);
  const row = lines.indexOf(text(`feature.${run.feature}`));
  expect(row).toBeGreaterThan(0);
  expect(lines[row + 1]).toBe(`+${FEATURES[run.feature].yields.food}`);

  expect(problems).toEqual([]);
});

test('a tile a river runs along gives the river a row of the terrain card, on what it gives that tile', async ({
  page,
}) => {
  const problems = watch(page);
  const run = riverRun();

  await open(page, run.seed, 'PH_Deck');

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${run.key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(run.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const lines = await panelLines(page);
  const row = lines.indexOf(text('panel.river'));
  expect(row).toBeGreaterThan(0);
  expect(lines[row + 1]).toBe(`+${RIVER_YIELDS[run.terrain]?.food}`);

  // The tile holds that one card, so a further press leaves it standing.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(run.key);

  expect(problems).toEqual([]);
});

test('a click selects a tile, the inspection key steps its cards, and the back key drops each in turn', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm', (_, chronicle) => stepsClear(chronicle));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  const cityTile = tileKey(entered.units[0].tile);
  const city = await onScreen(page, `tile-${cityTile}`);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // With nothing selected the inspection key has no tile to step.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // The city's tile carries all three cards: the worker that just entered, the city, the terrain.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  // After the last card comes the first again, never the bare ring.
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  expect(await ringedTile(page)).toBe(cityTile);

  // A click on the tile already selected selects nothing afresh, and the layer stands.
  await page.mouse.click(city.x, city.y);
  await answered(page);
  expect(await shownCard(page)).toBe('unit');
  expect(await ringedTile(page)).toBe(cityTile);

  // One step per press of the back key: the infopanel first, the ring after it.
  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await standing(page, 'menu')).toBe(false);

  // West of the city: the run leaves nothing on it, and it is clear of the panel the city raises.
  const bareTile = tileKey(westOf(entered.city));
  const bare = await onScreen(page, `tile-${bareTile}`);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(bareTile);
  expect(await shownCard(page)).toBeUndefined();
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');

  // A click on another tile selects it, and the inspection standing on the last one is let go of.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();

  // Up and left of the city: inside the map's frame, which starts under the resource bar, and far
  // enough out for the nearest tile to be well outside the map's disc.
  await page.mouse.click(city.x - 440 * city.unit, city.y - 160 * city.unit);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

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
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(BARE.key);
  await expect.poll(() => browserMenu(page)).toBe(true);

  // Nothing stands on it and nothing is built on it: its terrain card is the whole of its cycle.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(BARE.key);

  // The press carried the map nowhere either: the tile stands where it stood.
  const after = await onScreen(page, BARE.name);
  expect(after.x).toBeCloseTo(bare.x, 0);
  expect(after.y).toBeCloseTo(bare.y, 0);

  await page.mouse.click(city.x - 440 * city.unit, city.y - 160 * city.unit, { button: 'right' });
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();
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
  expect(await shownCard(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
