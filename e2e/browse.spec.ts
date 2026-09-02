import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { CardId } from '../src/rules/cards';
import { apply, beginChronicle } from '../src/rules/chronicle';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { endTurn, onScreen, open, watch } from './table';

/** Five copies of each card: a pile of these lays out taller than the browse's frame. */
const DECK: readonly CardId[] = (
  ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'] as CardId[]
).flatMap((id) => [id, id, id, id, id]);

/** The first seed whose three ended turns leave the city standing on fifteen discarded cards. */
function browseSeed(): number {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECK);
    for (let turn = 0; turn < 3; turn++) chronicle = apply(chronicle, { type: 'end-turn' });
    if (chronicle.defeat === undefined && chronicle.discardPile.length === 15) return seed;
  }
  throw new Error('no seed under a thousand ends three turns standing on fifteen discarded cards');
}

function browsing(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    return scene?.children.getByName('browse') != null;
  });
}

/** How far the browse's grid stands scrolled, and how far it can: the grid scrolls by its own `y`. */
function scrolled(page: Page): Promise<{ offset: number; overflow: number }> {
  return page.evaluate(() => {
    const scene = window.game?.scene.getScene<ChronicleScene>('chronicle');
    const grid = scene?.children.getByName('browse') as
      | Phaser.GameObjects.Container
      | null
      | undefined;
    if (grid === null || grid === undefined) throw new Error('no browse is open');
    return { offset: -grid.y, overflow: grid.getData('overflow') as number };
  });
}

function offsetOf(page: Page): Promise<number> {
  return scrolled(page).then(({ offset }) => offset);
}

/** Opens a pile's browse, and waits for its cards to be laid out. */
async function browse(page: Page, pile: 'draw-pile' | 'discard-pile'): Promise<void> {
  const at = await onScreen(page, pile);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => browsing(page)).toBe(true);
}

/** Wheels over the browse's frame, from the middle of it. */
async function wheel(page: Page, by: number): Promise<void> {
  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.wheel(0, by);
}

test('a pile of more cards than the frame holds scrolls, and stops on its first and last row', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, browseSeed(), DECK);
  await browse(page, 'draw-pile');

  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  await wheel(page, 120);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(opened.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y - 60 * frame.unit, { steps: 6 });
  await page.mouse.move(frame.x, frame.y - 120 * frame.unit, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => offsetOf(page)).toBeGreaterThanOrEqual(120);
  expect(await browsing(page)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => browsing(page)).toBe(false);

  for (let turn = 0; turn < 3; turn++) await endTurn(page);
  await browse(page, 'discard-pile');

  const discarded = await scrolled(page);
  expect(discarded.offset).toBe(0);
  expect(discarded.overflow).toBeGreaterThan(0);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(discarded.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  expect(problems).toEqual([]);
});
