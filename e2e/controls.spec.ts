import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { click, onScreen, open, settled, standing, watch } from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = 'tile-0,-3';

/** Every slot of the Controls window as it reads before a single key has been rebound. */
const AS_FOUND = [
  ['W', '↑'],
  ['A', '←'],
  ['S', '↓'],
  ['D', '→'],
  ['Wheel up', '—'],
  ['Wheel down', '—'],
  ['C', '—'],
  ['Escape', 'Right click'],
];

const LISTED = [
  'pan-up',
  'pan-left',
  'pan-down',
  'pan-right',
  'zoom-in',
  'zoom-out',
  'city',
  'back',
];

/** What one press of a zoom key multiplies the map's size by. */
const NOTCH = 1.3;

/** What one slot of the Controls window reads. */
function slotReads(page: Page, control: string, slot: number): Promise<string> {
  return page.evaluate((name) => {
    const label = window.named?.(name)?.object as Phaser.GameObjects.Text | undefined;
    if (label === undefined) throw new Error(`there is no ${name}`);
    return label.text;
  }, `controls-${control}-${slot}-label`);
}

/** Every slot the Controls window lists, row by row, as it reads them. */
async function rows(page: Page): Promise<string[][]> {
  const read: string[][] = [];
  for (const control of LISTED) {
    read.push([await slotReads(page, control, 0), await slotReads(page, control, 1)]);
  }
  return read;
}

/** From the chronicle screen into Controls, the way the player walks there. */
async function intoControls(page: Page): Promise<void> {
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-settings');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await click(page, 'settings-controls');
  await expect.poll(() => standing(page, 'controls')).toBe(true);
}

/** How far the map moved down the screen under a key held for a dozen frames. */
async function heldBy(page: Page, key: string): Promise<number> {
  const before = await onScreen(page, BARE);
  await page.keyboard.down(key);
  for (let frame = 0; frame < 12; frame++) await settled(page);
  await page.keyboard.up(key);
  await settled(page);
  await settled(page);
  return (await onScreen(page, BARE)).y - before.y;
}

/** How far the map moved down the screen under a mouse button held for a dozen frames. */
async function heldByButton(page: Page, button: 'middle' | 'right'): Promise<number> {
  const before = await onScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await page.mouse.down({ button });
  for (let frame = 0; frame < 12; frame++) await settled(page);
  await page.mouse.up({ button });
  await settled(page);
  await settled(page);
  return (await onScreen(page, BARE)).y - before.y;
}

/** How much larger the map stands after a gesture made with the pointer over a bare tile. */
async function grewBy(page: Page, gesture: () => Promise<void>): Promise<number> {
  const before = await onScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await gesture();
  await settled(page);
  await settled(page);
  return (await onScreen(page, BARE)).unit / before.unit;
}

/** Out of Controls and back to a bare chronicle screen, on the back key. */
async function outOfControls(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
}

test('a slot takes the next key pressed, and keeps it across a reload', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);
  expect(await rows(page)).toEqual(AS_FOUND);

  await click(page, 'controls-pan-up-1');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Press a key');
  await page.keyboard.press('k');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('K');

  await page.reload();
  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);
  await settled(page);
  await intoControls(page);
  expect(await slotReads(page, 'pan-up', 1)).toBe('K');
  expect(await slotReads(page, 'pan-up', 0)).toBe('W');

  await click(page, 'controls-back');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  // The frame pans up, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'k')).toBeGreaterThan(40);
  expect(Math.abs(await heldBy(page, 'ArrowUp'))).toBeLessThan(1);

  expect(problems).toEqual([]);
});

test('a key bound to a second slot leaves the slot that had it', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-left-0');
  await page.keyboard.press('w');
  await expect.poll(() => slotReads(page, 'pan-left', 0)).toBe('W');
  expect(await slotReads(page, 'pan-up', 0)).toBe('—');
  expect(await slotReads(page, 'pan-up', 1)).toBe('↑');

  expect(problems).toEqual([]);
});

test('the back key binds like any other, and the Back button closes without it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-down-1');
  await page.keyboard.press('Escape');
  await expect.poll(() => slotReads(page, 'pan-down', 1)).toBe('Escape');
  expect(await slotReads(page, 'back', 0)).toBe('—');
  expect(await slotReads(page, 'back', 1)).toBe('Right click');

  // Escape backs nothing out any more, so the key that used to leaves the window standing.
  await page.keyboard.press('Escape');
  await settled(page);
  await settled(page);
  expect(await standing(page, 'controls')).toBe(true);

  await click(page, 'controls-back');
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await click(page, 'settings-controls');
  await expect.poll(() => standing(page, 'controls')).toBe(true);

  await click(page, 'controls-back-0');
  await page.keyboard.press('b');
  await expect.poll(() => slotReads(page, 'back', 0)).toBe('B');

  await page.keyboard.press('b');
  await expect.poll(() => standing(page, 'settings')).toBe(true);

  expect(problems).toEqual([]);
});

test('a slot bound to the space bar says so, instead of reading empty', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-0');
  await page.keyboard.press('Space');
  await expect.poll(() => slotReads(page, 'pan-up', 0)).toBe('Space');

  expect(problems).toEqual([]);
});

test('Default puts every key back where it began', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-0');
  await page.keyboard.press('k');
  await expect.poll(() => slotReads(page, 'pan-up', 0)).toBe('K');
  await click(page, 'controls-back-0');
  await page.keyboard.press('b');
  await expect.poll(() => slotReads(page, 'back', 0)).toBe('B');

  await click(page, 'controls-default');
  await expect.poll(() => rows(page)).toEqual(AS_FOUND);

  expect(problems).toEqual([]);
});

test('a slot takes a mouse button, and the button then pans the way a key does', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-1');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Press a key');
  const slot = await onScreen(page, 'controls-pan-up-1');
  await page.mouse.click(slot.x, slot.y, { button: 'middle' });
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Middle click');
  expect(await slotReads(page, 'pan-up', 0)).toBe('W');

  await outOfControls(page);

  // The frame pans up, so what stands on the map comes down the screen.
  expect(await heldByButton(page, 'middle')).toBeGreaterThan(40);

  expect(problems).toEqual([]);
});

test('a key bound to a zoom zooms the map, and the wheel moved off it stops zooming', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-zoom-in-1');
  await page.keyboard.press('e');
  await expect.poll(() => slotReads(page, 'zoom-in', 1)).toBe('E');
  await outOfControls(page);

  expect(await grewBy(page, () => page.keyboard.press('e'))).toBeCloseTo(NOTCH, 2);
  expect(await grewBy(page, () => page.mouse.wheel(0, -100))).toBeCloseTo(NOTCH, 2);

  await intoControls(page);
  await click(page, 'controls-pan-up-1');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Press a key');

  // The slot is listening, so the notch is the key it takes and not the zoom it used to be.
  expect(await grewBy(page, () => page.mouse.wheel(0, -100))).toBeCloseTo(1, 2);
  expect(await slotReads(page, 'pan-up', 1)).toBe('Wheel up');
  expect(await slotReads(page, 'zoom-in', 0)).toBe('—');
  await outOfControls(page);

  // A notch is a press and a release at once, so it pans the one frame that follows it: the frame
  // goes up, what stands on the map comes down the screen, and nothing about it zooms.
  const before = await onScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await settled(page);
  await settled(page);

  const nudged = await onScreen(page, BARE);
  expect(nudged.unit / before.unit).toBeCloseTo(1, 2);
  expect(nudged.y - before.y).toBeGreaterThan(0);
  expect(nudged.y - before.y).toBeLessThan(await heldBy(page, 'w'));

  expect(await grewBy(page, () => page.keyboard.press('e'))).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a right click backs out one step, and raises the menu from a bare chronicle screen', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  // The middle of the design space: the windows stand on it, and bare map lies under them.
  const middle = await onScreen(page, 'controls');
  const rightClick = (): Promise<void> => page.mouse.click(middle.x, middle.y, { button: 'right' });

  await rightClick();
  await expect.poll(() => standing(page, 'settings')).toBe(true);
  await rightClick();
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rightClick();
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  await rightClick();
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('a press anywhere else lets go of the slot that was listening', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-0');
  await expect.poll(() => slotReads(page, 'pan-up', 0)).toBe('Press a key');
  await click(page, 'controls-pan-right-1');
  await expect.poll(() => slotReads(page, 'pan-right', 1)).toBe('Press a key');
  expect(await slotReads(page, 'pan-up', 0)).toBe('W');

  await click(page, 'controls-default');
  await expect.poll(() => rows(page)).toEqual(AS_FOUND);
  await page.keyboard.press('k');
  await settled(page);
  await settled(page);
  expect(await rows(page)).toEqual(AS_FOUND);

  expect(problems).toEqual([]);
});
