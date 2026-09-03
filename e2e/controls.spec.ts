import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { click, onScreen, onTable, open, settled, watch } from './table';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = 'tile-0,-3';

/** Every slot of the Controls window as it reads before a single key has been rebound. */
const AS_FOUND = [
  ['W', '↑'],
  ['A', '←'],
  ['S', '↓'],
  ['D', '→'],
  ['Escape', '—'],
];

const LISTED = ['pan-up', 'pan-left', 'pan-down', 'pan-right', 'back'];

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

/** From the table into Controls, the way the player walks there. */
async function intoControls(page: Page): Promise<void> {
  await click(page, 'menu-button');
  await expect.poll(() => onTable(page, 'menu')).toBe(true);
  await click(page, 'menu-settings');
  await expect.poll(() => onTable(page, 'settings')).toBe(true);
  await click(page, 'settings-controls');
  await expect.poll(() => onTable(page, 'controls')).toBe(true);
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
  await expect.poll(() => onTable(page, 'settings')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => onTable(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => onTable(page, 'menu')).toBe(false);

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
  expect(await slotReads(page, 'back', 1)).toBe('—');

  // Nothing backs out any more, so the key that used to leaves the window standing.
  await page.keyboard.press('Escape');
  await settled(page);
  await settled(page);
  expect(await onTable(page, 'controls')).toBe(true);

  await click(page, 'controls-back');
  await expect.poll(() => onTable(page, 'settings')).toBe(true);
  await click(page, 'settings-controls');
  await expect.poll(() => onTable(page, 'controls')).toBe(true);

  await click(page, 'controls-back-0');
  await page.keyboard.press('b');
  await expect.poll(() => slotReads(page, 'back', 0)).toBe('B');

  await page.keyboard.press('b');
  await expect.poll(() => onTable(page, 'settings')).toBe(true);

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
