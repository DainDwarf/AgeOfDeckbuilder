import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { NOMADIC } from '../src/content/nomadic';
import { tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import {
  budget,
  chronicleOf,
  consoleKey,
  enemiesOf,
  enter,
  marksIn,
  openSaved,
  rested,
  settledOn,
  shows,
  standing,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand; the opening never sees it. */
const BARE = { q: 0, r: -3 };

/** What the console reads, line by line, the line being typed last of all. */
function consoleLines(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = window.named?.('console')?.object as Phaser.GameObjects.Container | undefined;
    if (root === undefined) throw new Error('the console is not on the chronicle screen');
    return root.list
      .filter((part) => part.type === 'Text')
      .map((part) => (part as Phaser.GameObjects.Text).text);
  });
}

/** What the console's input line reads. */
async function typedLine(page: Page): Promise<string> {
  const lines = await consoleLines(page);
  return lines[lines.length - 1];
}

/** How far down the resource bar reaches, and the highest line the console writes, on the screen. */
function bandAndLines(page: Page): Promise<{ bar: number; highest: number }> {
  return page.evaluate(() => {
    const boundsOf = (name: string): Phaser.Geom.Rectangle => {
      const found = window.named?.(name)?.object as
        | (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds)
        | undefined;
      if (found === undefined) throw new Error(`nothing named ${name} is on the chronicle screen`);
      return found.getBounds();
    };
    const written = ['console-line-0', 'console-line-1', 'console-line-2', 'console-line-3'];
    return {
      bar: boundsOf('reading-food').bottom,
      highest: Math.min(
        ...written.map((name) => boundsOf(name).top),
        boundsOf('console-input').top,
      ),
    };
  });
}

/** How far the map moved down the screen under a key held for a dozen frames. */
async function heldBy(page: Page, key: string): Promise<number> {
  const before = await tileOnScreen(page, BARE);
  await page.keyboard.down(key);
  for (let frame = 0; frame < 12; frame++) await rested(page);
  await page.keyboard.up(key);
  await rested(page);
  await rested(page);
  return (await tileOnScreen(page, BARE)).y - before.y;
}

test('the key above Tab opens the console, which then holds the keyboard', async ({ page }) => {
  const problems = watch(page);
  // No turn is played out; the budget covers the boot and the gestures held over a dozen frames.
  test.setTimeout(budget(1));

  await openSaved(page, settledOn(NOMADIC, 1));
  expect(await shows(page, 'console')).toBe(false);

  // The frame pans up under the pan key, so what stands on the map comes down the screen.
  expect(await heldBy(page, 'w')).toBeGreaterThan(40);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(true);

  // The panel is not opaque, so the resource bar reads dimly through the top of it: no line the
  // console writes stands in that strip, whichever of the five it is and however full the history.
  const laid = await bandAndLines(page);
  expect(laid.highest).toBeGreaterThanOrEqual(laid.bar);

  // The key is the console's now: it types, and the map stands exactly where it was.
  expect(Math.abs(await heldBy(page, 'w'))).toBeLessThan(1);
  expect(await typedLine(page)).toBe('> w');

  await page.keyboard.press('Backspace');
  await rested(page);
  expect(await typedLine(page)).toBe('> ');

  await enter(page, 'sight');
  expect(await consoleLines(page)).toEqual(['', '', '> sight', 'no such entry: sight', '> ']);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(false);
  // The key is the map's again; the frame pans down, so what stands on it goes up the screen.
  expect(await heldBy(page, 's')).toBeLessThan(-40);

  await consoleKey(page);
  expect(await shows(page, 'console')).toBe(true);
  await page.keyboard.press('Escape');
  await rested(page);
  expect(await shows(page, 'console')).toBe(false);

  expect(problems).toEqual([]);
});

test('the two switches draw the whole map, and put the fog back where it was', async ({ page }) => {
  const problems = watch(page);
  const stood = settledOn(NOMADIC, 1);
  const [guard] = enemiesOf(stood);
  const enemy = guard.tile;
  expect(stood.snapshots.map(tileKey)).not.toContain(tileKey(enemy));

  await openSaved(page, stood);

  const seen = inSight(NOMADIC, stood);
  const fogged = stood.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length;
  expect(await chronicleOf(page)).toEqual(stood);
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(false);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);

  await consoleKey(page);
  await enter(page, 'uncharted');
  expect(await consoleLines(page)).toEqual(['', '', '> uncharted', 'uncharted veil: off', '> ']);
  await consoleKey(page);

  // Every tile of the disc is drawn now, and every one of them out of sight stands under a scrim.
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(true);
  expect(await marksIn(page, 'terrain')).toBe(stood.tiles.length);
  expect(await marksIn(page, 'fog')).toBe(stood.tiles.length - seen.size);

  await consoleKey(page);
  await enter(page, 'fog');
  expect(await typedLine(page)).toBe('> ');
  expect((await consoleLines(page))[3]).toBe('fog veil: off');
  await consoleKey(page);

  // Nothing is darkened any more, and every unit on the map stands as it is, the enemies included.
  expect(await marksIn(page, 'fog')).toBe(0);
  expect(await marksIn(page, 'units')).toBe(stood.units.length);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await enter(page, 'fog');
  expect(await consoleLines(page)).toEqual([
    '> uncharted',
    'uncharted veil: on',
    '> fog',
    'fog veil: on',
    '> ',
  ]);
  await consoleKey(page);

  // Both veils back: the map draws what it has charted, and no more.
  expect(await standing(page, `tile-${tileKey(enemy)}`)).toBe(false);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);
  expect(await marksIn(page, 'fog')).toBe(fogged);

  expect(problems).toEqual([]);
});
