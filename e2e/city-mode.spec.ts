import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { beginChronicle, RESOURCES } from '../src/rules/chronicle';
import { distance, runsAlong, tileKey, tileYield } from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  click,
  counted,
  endTurn,
  type Glyphs,
  glyphs,
  noGlyphs,
  onScreen,
  open,
  playedOut,
  refusalLines,
  ringedTile,
  settled,
  shownLayer,
  shows,
  standing,
  watch,
} from './chronicle-screen';

/** A tile on bare map the founding's border does not touch, clear of the bar, the piles and the hand. */
const BARE = { name: 'tile-0,-3', key: '0,-3' };

/** A tile on bare map the founding's border touches: what a claim takes first. */
const TOUCHING = { name: 'tile-0,-2', key: '0,-2' };

/** A tile the city holds, and an inhabitant stands on from the founding. */
const HELD = 'tile-0,-1';

/** How many tiles the city holds from the founding, one inhabitant on each. */
const FOUNDED = 7;

/** How many tiles the founding's border touches: the ring two out, as far as the map reaches. */
function touching(): number {
  const founding = beginChronicle(1, DECKS.PH_Deck);
  return founding.tiles.filter((tile) => distance(tile, founding.city) === 2).length;
}

/** Whether the chronicle screen shows city mode is on: both marks stand, or neither does. */
async function inCityMode(page: Page): Promise<boolean> {
  const chip = await shows(page, 'city-chip');
  const frame = await shows(page, 'city-frame');
  expect(frame).toBe(chip);
  return chip;
}

/**
 * A tile the founding leaves bare: its terrain and nothing else, no river running along it, well
 * clear of the border. So it inspects its terrain and steps to the bare tile from there.
 */
async function bareTile(page: Page): Promise<string> {
  const chronicle = await chronicleOf(page);
  const found = chronicle.tiles.find(
    (tile) =>
      distance(tile, chronicle.city) === 3 &&
      tile.feature === undefined &&
      tile.building === undefined &&
      tile.improvements.length === 0 &&
      !runsAlong(chronicle.rivers, tile),
  );
  if (found === undefined) throw new Error('the founding leaves no bare tile three tiles out');
  return tileKey(found);
}

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await settled(page);
  await settled(page);
}

/** What the tiles inside the border yield, point by point, and what the whole map yields. */
async function yielded(page: Page): Promise<{ inside: Glyphs; map: Glyphs }> {
  const chronicle = await chronicleOf(page);
  const held = new Set(chronicle.held.map(tileKey));
  const inside = noGlyphs();
  const map = noGlyphs();
  for (const tile of chronicle.tiles) {
    const yields = tileYield(tile, chronicle.rivers);
    for (const resource of RESOURCES) {
      const points = yields[resource] ?? 0;
      map[resource] += points;
      if (held.has(tileKey(tile))) inside[resource] += points;
    }
  }
  return { inside, map };
}

test('the city key enters city mode, where a tile click selects nothing, and the back key leaves it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await inCityMode(page)).toBe(false);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y);
  await answered(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownLayer(page)).toBeUndefined();

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  expect(problems).toEqual([]);
});

test('city mode lets go of the selection as it comes on', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const bare = await onScreen(page, BARE.name);
  await page.mouse.click(bare.x, bare.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a right click in city mode inspects the tile under it without selecting, and leaving the mode drops it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const at = await onScreen(page, `tile-${await bareTile(page)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // Its terrain is the whole of it, so the step after it is the bare tile again.
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBeUndefined();
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // The first back key takes the infopanel down; the mode stands until the next one.
  await page.keyboard.press('Escape');
  await answered(page);
  expect(await shownLayer(page)).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  // What the mode is left on goes down with it, however it is left.
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownLayer(page)).toBe('terrain');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await shownLayer(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a press on culture or population enters city mode, and the chip leaves it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-culture');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, 'reading-population');
  await answered(page);
  expect(await inCityMode(page)).toBe(true);

  await click(page, 'city-chip');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-population');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('city mode marks every tile an inhabitant stands on, and a click takes one off and puts it back', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await counted(page, 'assigned')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'assigned')).toBe(FOUNDED);
  expect(await counted(page, 'city-dim')).toBe(0);

  const held = await onScreen(page, HELD);
  await page.mouse.click(held.x, held.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(FOUNDED - 1);
  expect(await counted(page, 'city-dim')).toBe(1);

  await page.mouse.click(held.x, held.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(FOUNDED);
  expect(await counted(page, 'city-dim')).toBe(0);

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await counted(page, 'assigned')).toBe(0);

  expect(problems).toEqual([]);
});

test('city mode marks every tile the city can claim, and leaving it takes the marks down', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await counted(page, 'claimable')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'claimable')).toBe(touching());

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await counted(page, 'claimable')).toBe(0);

  expect(problems).toEqual([]);
});

test('a city-mode click the rules refuse says why, one on no act of the city’s says nothing, and one the city can pay for claims the tile', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const near = await onScreen(page, TOUCHING.name);
  const far = await onScreen(page, BARE.name);

  await page.mouse.click(near.x, near.y);
  await expect.poll(() => refusalLines(page)).toEqual([text('refusal.culture', { cost: 1 })]);

  await page.mouse.click(far.x, far.y);
  await answered(page);
  expect(await refusalLines(page)).toBeUndefined();

  await endTurn(page);
  expect((await chronicleOf(page)).resources.culture).toBe(1);

  await page.mouse.click(near.x, near.y);
  await playedOut(page);
  const claimed = await chronicleOf(page);

  expect(claimed.held.map(tileKey)).toContain(TOUCHING.key);
  expect(claimed.resources.culture).toBe(0);
  expect(await counted(page, 'assigned')).toBe(FOUNDED + 1);
  expect(await counted(page, 'claimable')).toBeGreaterThan(touching());

  // The border has moved out: the tile it did not touch before is a tile the city can pay for now.
  await page.mouse.click(far.x, far.y);
  await expect.poll(() => refusalLines(page)).toEqual([text('refusal.culture', { cost: 1 })]);

  expect(problems).toEqual([]);
});

test('city mode shows what every tile inside the border yields, and nothing of any other tile', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await glyphs(page)).toEqual(noGlyphs());

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  const { inside, map } = await yielded(page);
  expect(inside).not.toEqual(map);
  expect(await glyphs(page)).toEqual(inside);
  expect(await shows(page, 'yield-dim')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the city key', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await page.keyboard.press('c');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});
