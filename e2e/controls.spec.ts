import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import {
  click,
  onScreen,
  open,
  ringedTile,
  settled,
  shownCard,
  standing,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand; the founding never sees it. */
const BARE = { q: 0, r: -3 };

/** Every slot of the Controls window as it reads before a single key has been rebound. */
const AS_FOUND = [
  ['W', '↑'],
  ['A', '←'],
  ['S', '↓'],
  ['D', '→'],
  ['Wheel up', '—'],
  ['Wheel down', '—'],
  ['C', '—'],
  ['Tab', '—'],
  ['I', '—'],
  ['Escape', '—'],
];

const LISTED = [
  'pan-up',
  'pan-left',
  'pan-down',
  'pan-right',
  'zoom-in',
  'zoom-out',
  'city',
  'yields',
  'inspect',
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

/** How far the map moved down the screen under a press held for a dozen frames. */
async function heldThrough(
  page: Page,
  down: () => Promise<void>,
  up: () => Promise<void>,
): Promise<number> {
  const before = await tileOnScreen(page, BARE);
  await down();
  for (let frame = 0; frame < 12; frame++) await settled(page);
  await up();
  await settled(page);
  await settled(page);
  return (await tileOnScreen(page, BARE)).y - before.y;
}

/** How far the map moved down the screen under a key held, under a modifier or not. */
function heldBy(page: Page, key: string, under?: string): Promise<number> {
  return heldThrough(
    page,
    async () => {
      if (under !== undefined) await page.keyboard.down(under);
      await page.keyboard.down(key);
    },
    async () => {
      await page.keyboard.up(key);
      if (under !== undefined) await page.keyboard.up(under);
    },
  );
}

/**
 * One press of a place, under a layout that prints something else on it. Playwright's own keyboard
 * prints what the US layout does on the place it types, so a press the two disagree on is sent to
 * the page itself.
 */
function sendKey(page: Page, type: 'keydown' | 'keyup', code: string, key: string): Promise<void> {
  return page.evaluate(
    ([type, code, key]) => {
      window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }));
    },
    [type, code, key],
  );
}

/** How far the map moved down the screen under such a place held. */
function heldAs(page: Page, code: string, key: string): Promise<number> {
  return heldThrough(
    page,
    () => sendKey(page, 'keydown', code, key),
    () => sendKey(page, 'keyup', code, key),
  );
}

/** How far the map moved down the screen under a mouse button held over a bare tile. */
async function heldByButton(
  page: Page,
  button: 'middle' | 'right',
  under?: string,
): Promise<number> {
  const over = await tileOnScreen(page, BARE);
  await page.mouse.move(over.x, over.y);
  return heldThrough(
    page,
    async () => {
      if (under !== undefined) await page.keyboard.down(under);
      await page.mouse.down({ button });
    },
    async () => {
      await page.mouse.up({ button });
      if (under !== undefined) await page.keyboard.up(under);
    },
  );
}

/** How far a drag of a bare tile with that button carried the map down the screen. */
async function draggedBy(page: Page, button: 'left' | 'right', by: number): Promise<number> {
  const before = await tileOnScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await page.mouse.down({ button });
  await page.mouse.move(before.x, before.y + by / 2, { steps: 5 });
  await page.mouse.move(before.x, before.y + by, { steps: 5 });
  await page.mouse.up({ button });
  await settled(page);
  await settled(page);
  return (await tileOnScreen(page, BARE)).y - before.y;
}

/** How much larger the map stands after a gesture made with the pointer over a bare tile. */
async function grewBy(page: Page, gesture: () => Promise<void>): Promise<number> {
  const before = await tileOnScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await gesture();
  await settled(page);
  await settled(page);
  return (await tileOnScreen(page, BARE)).unit / before.unit;
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
  // The reload founds the chronicle again, and the menu closes back onto its capstone window.
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  // The frame pans up, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'k')).toBeGreaterThan(40);
  expect(Math.abs(await heldBy(page, 'ArrowUp'))).toBeLessThan(1);

  expect(problems).toEqual([]);
});

test("a control fires on its key's place, and a key that prints nothing binds there", async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  // The place W stands on in the US layout, under a layout that prints Z on it. The frame pans up,
  // so what stands on the map comes down the screen.
  expect(await heldAs(page, 'KeyW', 'z')).toBeGreaterThan(40);

  await intoControls(page);
  await click(page, 'controls-city-1');
  await expect.poll(() => slotReads(page, 'city', 1)).toBe('Press a key');
  await sendKey(page, 'keydown', 'BracketLeft', 'Dead');
  await expect.poll(() => slotReads(page, 'city', 1)).toBe('[');

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

// Tab is the browser's key to move on with, and the game keeps it: a slot listening takes it like
// any other, and it stays where the player put it.
test('a slot takes the Tab key, which the game holds on to', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-1');
  await page.keyboard.press('Tab');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Tab');
  expect(await slotReads(page, 'yields', 0)).toBe('—');

  await outOfControls(page);

  // The frame pans up, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'Tab')).toBeGreaterThan(40);

  expect(problems).toEqual([]);
});

test("a chord is the browser's, and binds nothing", async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  await click(page, 'controls-pan-up-1');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('Press a key');

  await page.keyboard.press('Control+k');
  await settled(page);
  await settled(page);
  expect(await slotReads(page, 'pan-up', 1)).toBe('Press a key');

  await page.keyboard.press('Control');
  await settled(page);
  await settled(page);
  expect(await slotReads(page, 'pan-up', 1)).toBe('Press a key');

  await page.keyboard.press('k');
  await expect.poll(() => slotReads(page, 'pan-up', 1)).toBe('K');

  await click(page, 'controls-pan-down-0');
  const slot = await onScreen(page, 'controls-pan-down-0');
  await page.mouse.click(slot.x, slot.y, { button: 'middle' });
  await expect.poll(() => slotReads(page, 'pan-down', 0)).toBe('Middle click');

  await outOfControls(page);

  // The button binds a pan and presses nothing on the map; under a chord it does neither.
  const tile = await tileOnScreen(page, BARE);
  await page.keyboard.down('Control');
  await page.mouse.click(tile.x, tile.y, { button: 'middle' });
  await page.keyboard.up('Control');
  await settled(page);
  await settled(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  expect(await grewBy(page, () => page.mouse.wheel(0, -100))).toBeCloseTo(NOTCH, 2);
  expect(
    await grewBy(page, async () => {
      await page.keyboard.down('Control');
      await page.mouse.wheel(0, -100);
      await page.keyboard.up('Control');
    }),
  ).toBeCloseTo(1, 2);

  expect(Math.abs(await heldBy(page, 'k', 'Control'))).toBeLessThan(1);
  // The frame pans up, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'k')).toBeGreaterThan(40);

  expect(Math.abs(await heldByButton(page, 'middle', 'Control'))).toBeLessThan(1);
  // The button pans the frame back down, so what stands on the map goes up the screen again.
  expect(await heldByButton(page, 'middle')).toBeLessThan(-40);

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
  const before = await tileOnScreen(page, BARE);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await settled(page);
  await settled(page);

  const nudged = await tileOnScreen(page, BARE);
  expect(nudged.unit / before.unit).toBeCloseTo(1, 2);
  expect(nudged.y - before.y).toBeGreaterThan(0);
  expect(nudged.y - before.y).toBeLessThan(await heldBy(page, 'w'));

  expect(await grewBy(page, () => page.keyboard.press('e'))).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a right click leaves a window standing, and the back key still steps out of it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await intoControls(page);

  // The middle of the design space: the windows stand on it, and bare map lies under them.
  const middle = await onScreen(page, 'controls');
  await page.mouse.click(middle.x, middle.y, { button: 'right' });
  await settled(page);
  await settled(page);
  expect(await standing(page, 'controls')).toBe(true);

  await outOfControls(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('a right drag carries the map as a left drag does, and the button on its own binds nothing', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  expect(await draggedBy(page, 'left', 120)).toBeCloseTo(120, 0);
  expect(await draggedBy(page, 'right', -120)).toBeCloseTo(-120, 0);
  // A drag is no press on the tile it started over, whichever button carried it.
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  expect(Math.abs(await heldByButton(page, 'right'))).toBeLessThan(1);

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
