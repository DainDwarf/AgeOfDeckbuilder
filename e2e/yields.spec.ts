import { expect, type Page, test } from '@playwright/test';
import { tileKey, tileYield } from '../src/rules/map';
import { RESOURCES, type Resource } from '../src/rules/resources';
import {
  chronicleOf,
  click,
  drawnFaces,
  endTurn,
  type Glyphs,
  glyphs,
  glyphsOf,
  noGlyphs,
  open,
  settled,
  shows,
  standing,
  watch,
} from './chronicle-screen';

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await settled(page);
  await settled(page);
}

/** How many glyphs each resource is owed: one for every point the tiles the map draws yield of it. */
async function owed(page: Page): Promise<Glyphs> {
  const chronicle = await chronicleOf(page);
  return glyphsOf(drawnFaces(chronicle), chronicle.rivers);
}

/** What the overlay would show with these resources on it, and nothing of every other. */
async function only(page: Page, ...resources: Resource[]): Promise<Glyphs> {
  const all = await owed(page);
  const shown = noGlyphs();
  for (const resource of resources) shown[resource] = all[resource];
  return shown;
}

/**
 * What the map shows with these resources on the overlay while city mode is on: every tile inside
 * the border shows its whole yield, and every other tile the map draws what the overlay is asked for.
 */
async function withCityMode(page: Page, ...resources: Resource[]): Promise<Glyphs> {
  const chronicle = await chronicleOf(page);
  const inside = new Set(chronicle.held.map(tileKey));
  const shown = noGlyphs();
  for (const face of drawnFaces(chronicle)) {
    const yields = tileYield(face, chronicle.rivers);
    for (const resource of inside.has(tileKey(face)) ? RESOURCES : resources) {
      shown[resource] += yields[resource] ?? 0;
    }
  }
  return shown;
}

/** Which readings the bar has latched down, in the order the bar reads them. */
async function latched(page: Page): Promise<Resource[]> {
  const down: Resource[] = [];
  for (const resource of RESOURCES) {
    if (await shows(page, `reading-${resource}-well`)) down.push(resource);
  }
  return down;
}

test('the yield key shows what every tile yields, and clears it again', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await glyphs(page)).toEqual(noGlyphs());
  expect(await shows(page, 'yield-dim')).toBe(false);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(await owed(page));
  expect(await latched(page)).toEqual([...RESOURCES]);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());
  expect(await latched(page)).toEqual([]);

  expect(problems).toEqual([]);
});

test('a press on a reading shows that resource alone, and a second press takes it away', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-food');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(await only(page, 'food'));
  expect(await latched(page)).toEqual(['food']);

  await click(page, 'reading-production');
  await expect.poll(() => latched(page)).toEqual(['food', 'production']);
  expect(await glyphs(page)).toEqual(await only(page, 'food', 'production'));

  await click(page, 'reading-food');
  await expect.poll(() => latched(page)).toEqual(['production']);
  expect(await glyphs(page)).toEqual(await only(page, 'production'));
  expect(await shows(page, 'yield-dim')).toBe(true);

  await click(page, 'reading-production');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());

  expect(problems).toEqual([]);
});

test('the yield key clears an overlay a reading raised, and fills one from nothing', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-science');
  await expect.poll(() => latched(page)).toEqual(['science']);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());

  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);

  expect(problems).toEqual([]);
});

test('the overlay is a display, not a mode: city mode and the back key leave it standing', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  const shown = await glyphs(page);

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(shown);

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-chip')).toBe(false);
  expect(await shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(shown);

  await page.keyboard.press('Escape');
  await answered(page);
  expect(await shows(page, 'yield-dim')).toBe(true);

  expect(problems).toEqual([]);
});

test('a tile inside the border shows its whole yield while city mode stands with the overlay', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-food');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(await only(page, 'food'));

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(await withCityMode(page, 'food'));

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-chip')).toBe(false);
  expect(await glyphs(page)).toEqual(await only(page, 'food'));

  expect(problems).toEqual([]);
});

test('the overlay stands on the turn the map stands on, with no glyph left over', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);

  await endTurn(page);
  await answered(page);

  expect(await glyphs(page)).toEqual(await owed(page));

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the yield key', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Tab');
  await answered(page);
  expect(await shows(page, 'yield-dim')).toBe(false);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);

  expect(problems).toEqual([]);
});
