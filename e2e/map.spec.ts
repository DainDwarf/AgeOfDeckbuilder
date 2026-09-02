import { expect, type Page, test } from '@playwright/test';
import { onScreen, open, ringedTile, settled, watch } from './table';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = { name: 'tile-0,-3', key: '0,-3' };

/** The tiles furthest east and furthest south: the last of the map to leave the frame. */
const EAST = 'tile-8,0';
const SOUTH = 'tile-0,8';

/** What one wheel notch multiplies the zoom by. */
const NOTCH = 1.3;

type Point = { x: number; y: number };

/** Drags from a page point by a page offset, well past the slack that tells a drag from a click. */
async function drag(page: Page, from: Point, by: Point): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + by.x / 2, from.y + by.y / 2, { steps: 5 });
  await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 5 });
  await page.mouse.up();
  await settled(page);
}

/** Where the canvas sits on the page. */
async function frameOf(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('the canvas is not on the page');
  return box;
}

test('a drag on bare map carries the map with it, and picks out no tile', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  await drag(page, before, { x: 120, y: -80 });

  const after = await onScreen(page, BARE.name);
  expect(after.x - before.x).toBeCloseTo(120, 0);
  expect(after.y - before.y).toBeCloseTo(-80, 0);
  expect(await ringedTile(page)).toBeUndefined();

  await page.mouse.click(after.x, after.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  expect(problems).toEqual([]);
});

test('a wheel notch zooms the map about the pointer', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  const east = await onScreen(page, EAST);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await settled(page);

  const after = await onScreen(page, BARE.name);
  const eastAfter = await onScreen(page, EAST);

  // What the pointer stood on stays under it, and the map grows out from there by one notch.
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  expect(after.unit / before.unit).toBeCloseTo(NOTCH, 2);
  expect((eastAfter.x - after.x) / (east.x - before.x)).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a held pan key moves the map, and lets go of it when it is released', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  await page.keyboard.down('w');
  // The frame pans up, so what stands on the map comes down the screen.
  await expect
    .poll(() => onScreen(page, BARE.name).then((at) => at.y))
    .toBeGreaterThan(before.y + 40);
  await page.keyboard.up('w');

  await settled(page);
  await settled(page);
  const stopped = await onScreen(page, BARE.name);
  await settled(page);
  expect((await onScreen(page, BARE.name)).y).toBe(stopped.y);

  expect(problems).toEqual([]);
});

test('however far the map is dragged, it cannot leave the frame', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');
  const frame = await frameOf(page);

  // Passes the width and the height of the frame at a time, well past the whole map's own size.
  const west = { x: frame.x + frame.width - 40, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, west, { x: 80 - frame.width, y: 0 });
  const north = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, north, { x: 0, y: -frame.height / 3 });

  const east = await onScreen(page, EAST);
  const south = await onScreen(page, SOUTH);
  for (const at of [east, south]) {
    expect(at.x).toBeGreaterThan(frame.x);
    expect(at.x).toBeLessThan(frame.x + frame.width);
    expect(at.y).toBeGreaterThan(frame.y);
    expect(at.y).toBeLessThan(frame.y + frame.height);
  }

  // One more of each pass finds the map already against its bounds.
  await drag(page, west, { x: 80 - frame.width, y: 0 });
  await drag(page, north, { x: 0, y: -frame.height / 3 });
  const again = await onScreen(page, EAST);
  expect(again.x).toBeCloseTo(east.x, 0);
  expect(again.y).toBeCloseTo(east.y, 0);

  expect(problems).toEqual([]);
});
