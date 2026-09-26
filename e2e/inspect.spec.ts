import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import {
  type FeatureId,
  MOVE_POINT,
  movementCost,
  neighbours,
  runsAlong,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  water,
} from '../src/rules/map';
import { featureKind, terrainKind } from '../src/rules/map-kinds';
import type { Resources } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import { featureName, text } from '../src/ui/text';
import {
  besideTiles,
  cityTileOf,
  firstSeed,
  onScreen,
  openSaved,
  panelMovement,
  panelRows,
  rested,
  ringedTile,
  settledOn,
  shownCard,
  standing,
  watch,
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
  await rested(page);
  await rested(page);
}

/**
 * The chronicle a search over the seeds found, a tile touching its city, and so well inside the
 * frame, and what the search found there.
 */
type Found<T> = { readonly chronicle: Chronicle; readonly tile: Tile; readonly found: T };

/** The first of the city's neighbours that `found` answers, and its answer. */
function besideOn<T>(
  chronicle: Chronicle,
  found: (tile: Tile) => T | undefined,
): Found<T> | undefined {
  for (const at of neighbours(cityTileOf(chronicle))) {
    const tile = tileAt(chronicle.tiles, at);
    if (tile === undefined) continue;
    const answer = found(tile);
    if (answer !== undefined) return { chronicle, tile, found: answer };
  }
  return undefined;
}

/** The first seed's turn 1 on the Nomadic content, its city settled bare, with a neighbour `found` answers. */
function besideCity<T>(
  complaint: string,
  found: (tile: Tile, chronicle: Chronicle) => T | undefined,
): Found<T> {
  return firstSeed(complaint, (seed) => {
    const chronicle = settledOn(NOMADIC, seed);
    return besideOn(chronicle, (tile) => found(tile, chronicle));
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
  const west = tileAt(chronicle.tiles, westOf(cityTileOf(chronicle)));
  return (
    west !== undefined &&
    west.feature === undefined &&
    west.building === undefined &&
    west.improvements.length === 0 &&
    !runsAlong(chronicle.rivers, cityTileOf(chronicle)) &&
    !runsAlong(chronicle.rivers, west)
  );
}

/** The first seed's turn 1, with the first worker entered on the city, whose steps are clear. */
function workerOnCity(): Chronicle {
  return firstSeed('enters its first worker on a city whose steps are clear', (seed) => {
    const chronicle = settledOn(NOMADIC, seed, ['first-worker']);
    return stepsClear(chronicle) ? chronicle : undefined;
  });
}

/** A tile beside the city with a feature on it, and the feature. */
function featureBeside(): Found<FeatureId> {
  return besideCity('puts a feature beside the city', (tile) => tile.feature);
}

/**
 * A tile beside the city bare of feature, of a terrain a river feeds, a river running along it, and
 * what the river gives it.
 */
function riverBeside(): Found<Partial<Resources>> {
  return besideCity('runs a river along a fed tile beside the city', (tile, chronicle) =>
    tile.feature === undefined && runsAlong(chronicle.rivers, tile)
      ? terrainKind(NOMADIC, tile.terrain).river
      : undefined,
  );
}

/**
 * A tile beside the city bare of feature, building and improvement, and its key; a river may run
 * along it, being a row of its terrain card, not a card.
 */
function bareBeside(): Found<string> {
  return besideCity('leaves a tile beside the city bare', (tile) =>
    tile.feature === undefined && tile.building === undefined && tile.improvements.length === 0
      ? tileKey(tile)
      : undefined,
  );
}

/**
 * The first seed's bare turn 1 whose opening charts a water tile, and a tile beside the city costing
 * two move points, bare and with nobody on it so its terrain card is the whole of its cycle: that
 * tile, what entering it costs, and the water tile.
 */
function costBeside(): Found<number> & { readonly water: TileCoords } {
  return firstSeed(
    'leaves a tile costing two move points beside the city, and water in sight',
    (seed) => {
      const chronicle = settledOn(NOMADIC, seed);
      const wet = chronicle.snapshots.find((snapshot) => water(NOMADIC, snapshot.tile.terrain));
      if (wet === undefined) return undefined;
      const land = besideOn(chronicle, (tile) => {
        const cost = movementCost(NOMADIC, tile);
        const bare =
          !chronicle.units.some((unit) => tileKey(unit.tile) === tileKey(tile)) &&
          tile.building === undefined &&
          tile.improvements.length === 0;
        return bare && cost === 2 * MOVE_POINT ? cost : undefined;
      });
      return land === undefined ? undefined : { ...land, water: wet };
    },
  );
}

test('a tile the generator gave a feature shows its mark, and the terrain card gives it a row of its own', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: feature } = featureBeside();
  const key = tileKey(tile);

  await openSaved(page, chronicle);
  expect(await standing(page, `feature-${key}`)).toBe(true);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  await expect
    .poll(() => panelRows(page))
    .toContainEqual({ text: featureName(feature), yields: featureKind(NOMADIC, feature).yields });

  expect(problems).toEqual([]);
});

test('a tile a river runs along gives the river a row of the terrain card, on what it gives that tile', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: fed } = riverBeside();
  const key = tileKey(tile);

  await openSaved(page, chronicle);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const at = await onScreen(page, `tile-${key}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  await expect
    .poll(() => panelRows(page))
    .toContainEqual({ text: text('panel.river'), yields: fed });

  // The tile holds that one card, so a further press leaves it standing.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(key);

  expect(problems).toEqual([]);
});

test('the terrain card reads what entering the tile costs, and a dash on a tile nothing crosses', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, found: cost, water: wetTile } = costBeside();

  await openSaved(page, chronicle);

  // Nothing stands on it and nothing is built on it: the terrain card is the whole of its cycle.
  const land = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(land.x, land.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await panelMovement(page)).toBe(text('panel.movement', { cost: cost / MOVE_POINT }));

  const wet = await onScreen(page, `tile-${tileKey(wetTile)}`);
  await page.mouse.click(wet.x, wet.y, { button: 'right' });
  await expect.poll(() => panelMovement(page)).toBe(text('panel.no-movement'));
  expect(await shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('a click selects a tile, the inspection key steps its cards, and the back key drops each in turn', async ({
  page,
}) => {
  const problems = watch(page);
  const entered = workerOnCity();

  await openSaved(page, entered);
  const cityTile = tileKey(cityTileOf(entered));
  const city = await onScreen(page, `tile-${cityTile}`);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // With nothing selected the inspection key has no tile to step.
  await page.keyboard.press('i');
  await answered(page);
  expect(await shownCard(page)).toBeUndefined();
  expect(await ringedTile(page)).toBeUndefined();

  // The city's tile carries all three cards: the worker entered at the settle, the city, the terrain.
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

  // West of the city: the search leaves nothing on it, and it is clear of the panel the city raises.
  const bareTile = tileKey(westOf(cityTileOf(entered)));
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
  const { chronicle, found: key } = bareBeside();

  await openSaved(page, chronicle);
  const bare = await onScreen(page, `tile-${key}`);
  const cityTile = tileKey(cityTileOf(chronicle));
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
  const after = await onScreen(page, `tile-${key}`);
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
