import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import {
  type FeatureId,
  MOVE_POINT,
  movementCost,
  neighbours,
  runsAlong,
  type Terrain,
  type TileCoords,
  tileAt,
  tileKey,
  water,
} from '../src/rules/map';
import { featureKind, terrainKind } from '../src/rules/map-kinds';
import type { Chronicle } from '../src/rules/state';
import { featureName, text } from '../src/ui/text';
import {
  besideTiles,
  chronicleOf,
  dragOut,
  endTurn,
  firstSeed,
  launch,
  onScreen,
  open,
  panelLines,
  panelMovement,
  ringedTile,
  settled,
  shownCard,
  standing,
  watch,
  workerRun,
} from './chronicle-screen';

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
  return firstSeed('puts a feature beside the city', (seed) => {
    const { tiles, city } = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find((tile) => tile.feature !== undefined && touching.has(tileKey(tile)));
    if (found?.feature === undefined) return undefined;
    return { seed, key: tileKey(found), feature: found.feature };
  });
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
  return firstSeed('runs a river along a fed tile beside the city', (seed) => {
    const { tiles, city, rivers } = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find(
      (tile) =>
        touching.has(tileKey(tile)) &&
        tile.feature === undefined &&
        terrainKind(STAND_IN, tile.terrain).river !== undefined &&
        runsAlong(rivers, tile),
    );
    if (found === undefined) return undefined;
    return { seed, key: tileKey(found), terrain: found.terrain };
  });
}

/**
 * The first seed leaving a tile touching the city, and so well inside the frame, bare of feature,
 * building and improvement; a river may run along it, being a row of its terrain card, not a card.
 */
function bareRun(): { seed: number; key: string } {
  return firstSeed('leaves a tile beside the city bare', (seed) => {
    const { tiles, city } = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    const touching = new Set(neighbours(city).map(tileKey));
    const found = tiles.find(
      (tile) =>
        touching.has(tileKey(tile)) &&
        tile.feature === undefined &&
        tile.building === undefined &&
        tile.improvements.length === 0,
    );
    return found === undefined ? undefined : { seed, key: tileKey(found) };
  });
}

/**
 * The first seed whose generator leaves a tile costing two move points beside the city, bare and
 * with nobody on it so its terrain card is the whole of its cycle, and charts a water tile from the
 * founding.
 */
function costRun(): { seed: number; land: string; water: string } {
  return firstSeed(
    'leaves a tile costing two move points beside the city, and water in sight',
    (seed) => {
      const chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
      const touching = new Set(neighbours(chronicle.city).map(tileKey));
      const stood = new Set(chronicle.units.map((unit) => tileKey(unit.tile)));
      const land = chronicle.tiles.find(
        (tile) =>
          touching.has(tileKey(tile)) &&
          !stood.has(tileKey(tile)) &&
          tile.building === undefined &&
          tile.improvements.length === 0 &&
          movementCost(STAND_IN, tile) === 2 * MOVE_POINT,
      );
      const wet = chronicle.snapshots.find((snapshot) => water(STAND_IN, snapshot.tile.terrain));
      if (land === undefined || wet === undefined) return undefined;
      return { seed, land: tileKey(land), water: tileKey(wet) };
    },
  );
}

/** The three lines a ledger row reads from `name` on: its name, its chip, and what the chip counts. */
async function rowFrom(page: Page, name: string): Promise<string[]> {
  const lines = await panelLines(page);
  return lines.slice(lines.indexOf(name), lines.indexOf(name) + 3);
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

  await expect
    .poll(() => rowFrom(page, featureName(run.feature)))
    .toEqual([
      featureName(run.feature),
      'panel-yield-food',
      `+${featureKind(STAND_IN, run.feature).yields.food}`,
    ]);

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

  await expect
    .poll(() => rowFrom(page, text('panel.river')))
    .toEqual([
      text('panel.river'),
      'panel-yield-food',
      `+${terrainKind(STAND_IN, run.terrain).river?.food}`,
    ]);

  // The tile holds that one card, so a further press leaves it standing.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(run.key);

  expect(problems).toEqual([]);
});

test('the terrain card reads what entering the tile costs, and a dash on a tile nothing crosses', async ({
  page,
}) => {
  const problems = watch(page);
  const run = costRun();

  await open(page, run.seed, 'PH_Deck');

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const land = await onScreen(page, `tile-${run.land}`);
  await page.mouse.click(land.x, land.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await panelMovement(page)).toBe(text('panel.movement', { cost: 2 }));

  const wet = await onScreen(page, `tile-${run.water}`);
  await page.mouse.click(wet.x, wet.y, { button: 'right' });
  await expect.poll(() => panelMovement(page)).toBe(text('panel.no-movement'));
  expect(await shownCard(page)).toBe('terrain');

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

  // A click on the tile already selected selects nothing afresh, and the card stands.
  await page.mouse.click(bare.x, bare.y);
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(bareTile);

  // A click on another tile selects it, and the inspection standing on the last one is let go of.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a right click inspects and never selects, shows no browser menu, and the inspection key moves the inspection to the selection', async ({
  page,
}) => {
  const problems = watch(page);
  const run = bareRun();

  await open(page, run.seed, 'PH_Deck');
  const bare = await onScreen(page, `tile-${run.key}`);
  const cityTile = await chronicleOf(page).then((chronicle) => tileKey(chronicle.city));
  const city = await onScreen(page, `tile-${cityTile}`);

  await watchBrowserMenu(page);
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();
  await expect.poll(() => browserMenu(page)).toBe(true);

  // Nothing stands on it and nothing is built on it: its terrain card is the whole of its cycle.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // The press carried the map nowhere either: the tile stands where it stood.
  const after = await onScreen(page, `tile-${run.key}`);
  expect(after.x).toBeCloseTo(bare.x, 0);
  expect(after.y).toBeCloseTo(bare.y, 0);

  // One left click on the city's own tile selects it; a second would enter city mode.
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(cityTile);
  expect(await shownCard(page)).toBeUndefined();

  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(cityTile);

  const beside = await besideTiles(page);
  await page.mouse.click(beside.x, beside.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBe(cityTile);
  expect(await standing(page, 'menu')).toBe(false);

  // Nothing stands on the city this early, so the first card of its cycle is what is built there.
  await page.mouse.click(bare.x, bare.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await ringedTile(page)).toBe(cityTile);

  expect(problems).toEqual([]);
});
