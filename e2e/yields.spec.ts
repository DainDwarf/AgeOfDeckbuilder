import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { claimable } from '../src/rules/city';
import { sameTile, type Tile, type TileCoords, tileKey } from '../src/rules/map';
import { RESOURCES, type Resource } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import {
  chronicleOf,
  click,
  drawnFaces,
  endTurn,
  latched,
  noGlyphs,
  openSaved,
  rested,
  settledOn,
  shows,
  standing,
  thresholdShown,
  tileOnScreen,
  watch,
  type YieldShown,
  yieldOwed,
  yieldShown,
} from './chronicle-screen';

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await rested(page);
  await rested(page);
}

/** What the map shows of the yield with nothing on the overlay: no glyph, and no patch. */
const NOTHING: YieldShown = { glyphs: noGlyphs(), patched: [] };

/** What the overlay would show with these resources on it, and nothing of every other. */
async function only(page: Page, ...resources: Resource[]): Promise<YieldShown> {
  const chronicle = await chronicleOf(page);
  return yieldOwed(chronicle, drawnFaces(chronicle), () => resources);
}

/**
 * What the map shows with these resources on the overlay while city mode is on: every tile inside
 * the border shows its whole yield, every other tile the map draws what the overlay is asked for,
 * and the tile wearing the culture threshold, where one is named, nothing.
 */
function withCityMode(
  chronicle: Chronicle,
  resources: readonly Resource[],
  threshold?: TileCoords,
): YieldShown {
  const held = new Set(chronicle.held.map(tileKey));
  const asked = (face: Tile): readonly Resource[] => {
    if (threshold !== undefined && sameTile(face, threshold)) return [];
    return held.has(tileKey(face)) ? RESOURCES : resources;
  };
  return yieldOwed(chronicle, drawnFaces(chronicle), asked);
}

test('the yield key shows what every tile yields, each tile’s glyphs on a patch, and clears it again', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  expect(await yieldShown(page)).toEqual(NOTHING);

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);
  const every = await only(page, ...RESOURCES);
  expect(every.patched.length).toBeGreaterThan(0);
  expect(await yieldShown(page)).toEqual(every);

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([]);
  expect(await yieldShown(page)).toEqual(NOTHING);

  expect(problems).toEqual([]);
});

test('a press on a reading shows that resource alone, on the tiles yielding it, and a second press takes it away', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await click(page, 'reading-food');
  await expect.poll(() => latched(page)).toEqual(['food']);
  const food = await only(page, 'food');
  expect(food.patched).not.toEqual((await only(page, ...RESOURCES)).patched);
  expect(await yieldShown(page)).toEqual(food);

  await click(page, 'reading-production');
  await expect.poll(() => latched(page)).toEqual(['food', 'production']);
  expect(await yieldShown(page)).toEqual(await only(page, 'food', 'production'));

  await click(page, 'reading-food');
  await expect.poll(() => latched(page)).toEqual(['production']);
  expect(await yieldShown(page)).toEqual(await only(page, 'production'));

  await click(page, 'reading-production');
  await expect.poll(() => latched(page)).toEqual([]);
  expect(await yieldShown(page)).toEqual(NOTHING);

  expect(problems).toEqual([]);
});

test('the yield key clears an overlay a reading raised, and fills one from nothing', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await click(page, 'reading-science');
  await expect.poll(() => latched(page)).toEqual(['science']);

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([]);
  expect(await yieldShown(page)).toEqual(NOTHING);

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);

  expect(problems).toEqual([]);
});

test('the overlay is a display, not a mode: city mode and the back key leave it standing', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);
  const shown = await yieldShown(page);

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await latched(page)).toEqual([...RESOURCES]);
  expect(await yieldShown(page)).toEqual(shown);

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-chip')).toBe(false);
  expect(await latched(page)).toEqual([...RESOURCES]);
  expect(await yieldShown(page)).toEqual(shown);

  await page.keyboard.press('Escape');
  await answered(page);
  expect(await latched(page)).toEqual([...RESOURCES]);
  expect(await yieldShown(page)).toEqual(shown);

  expect(problems).toEqual([]);
});

test('a tile inside the border shows its whole yield on its patch while city mode stands, with the overlay or without it, and the tile wearing the culture threshold shows neither', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));
  const chronicle = await chronicleOf(page);

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  const inside = withCityMode(chronicle, []);
  expect(await yieldShown(page)).toEqual(inside);

  await click(page, 'reading-food');
  await expect.poll(() => latched(page)).toEqual(['food']);
  const withFood = withCityMode(chronicle, ['food']);
  expect(withFood).not.toEqual(inside);
  expect(await yieldShown(page)).toEqual(withFood);

  const near = claimable(CATALOGUE, chronicle, 'player').find((tile) =>
    withFood.patched.includes(tileKey(tile)),
  );
  if (near === undefined) throw new Error('no tile the city may claim shows a glyph');
  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => thresholdShown(page)).toBeDefined();
  expect(await yieldShown(page)).toEqual(withCityMode(chronicle, ['food'], near));

  await page.keyboard.press('Escape');
  await expect.poll(() => thresholdShown(page)).toBeUndefined();
  expect(await yieldShown(page)).toEqual(withFood);

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-chip')).toBe(false);
  expect(await yieldShown(page)).toEqual(await only(page, 'food'));

  expect(problems).toEqual([]);
});

test('the overlay stands on the turn the map stands on, with no glyph and no patch left over', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);

  await endTurn(page);
  await answered(page);

  expect(await yieldShown(page)).toEqual(await only(page, ...RESOURCES));

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the yield key', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, settledOn(1));

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Tab');
  await answered(page);
  expect(await latched(page)).toEqual([]);
  expect(await yieldShown(page)).toEqual(NOTHING);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);

  expect(problems).toEqual([]);
});
