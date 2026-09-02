import { expect, type Page, test } from '@playwright/test';
import { CARDS, DECKS } from '../src/rules/cards';
import { apply, beginChronicle, type Chronicle, playable, refusalOf } from '../src/rules/chronicle';
import {
  browse,
  chronicleOf,
  endTurn,
  type OnScreen,
  offsetOf,
  onScreen,
  onTable,
  open,
  scrolled,
  watch,
  wheel,
} from './table';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left to release on. */
const WINDOW = { width: 1280, height: 900 };

/** How far up a card comes before the release plays it, in design units, and then some. */
const LIFTED = 140;

/** Where a card the city can pay for and play at nothing lies in the hand, or -1. */
function atNothing(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) => CARDS[id].target === 'none' && playable(refusalOf(chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on such a card. */
function playableRun(): { seed: number; turn: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_LongDeck);
    for (let turn = 1; turn <= 8; turn++) {
      if (atNothing(chronicle) !== -1) return { seed, turn };
      chronicle = apply(chronicle, { type: 'end-turn' });
    }
  }
  throw new Error('no seed under a thousand opens a turn on a card that plays at nothing');
}

/** A point on the bare page above the canvas: a release there lands outside the game. */
async function offCanvas(page: Page): Promise<{ x: number; y: number }> {
  const band = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top - 20, room: rect.top };
  });
  if (band.room < 40) throw new Error('the window leaves no bare page above the canvas');
  return { x: band.x, y: band.y };
}

/** Whether a named object stands where it was measured, to the page pixel. */
async function stillAt(page: Page, name: string, was: OnScreen): Promise<boolean> {
  const now = await onScreen(page, name);
  return Math.round(now.x - was.x) === 0 && Math.round(now.y - was.y) === 0;
}

test('a hand card released off the canvas comes home, plays nothing, and leaves the next press clean', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await page.setViewportSize(WINDOW);
  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const card = `hand-${atNothing(opened)}`;
  const home = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.up();

  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  // The gesture is over, so the card no longer follows the pointer back onto the table.
  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  expect(await stillAt(page, card, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  // A card taken out and brought back was dragged, so its release on itself is no click either.
  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(home.x, home.y, { steps: 5 });
  await page.mouse.up();
  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await onTable(page, 'zoom')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.mouse.click(home.x, home.y);
  await expect.poll(() => onTable(page, 'zoom')).toBe(true);

  expect(problems).toEqual([]);
});

test('a browse released off the canvas stays open, and the next gesture scrolls it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_LongDeck');
  await browse(page, 'draw-pile');

  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  const frame = await onScreen(page, 'browse-frame');
  const bare = await offCanvas(page);

  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y - 100 * frame.unit, { steps: 6 });
  await page.mouse.move(bare.x, bare.y, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);
  expect(await onTable(page, 'browse')).toBe(true);
  const dropped = await offsetOf(page);

  await wheel(page, -60);
  await expect.poll(() => offsetOf(page)).toBeLessThan(dropped);

  const wheeled = await offsetOf(page);
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y + 60 * frame.unit, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => offsetOf(page)).toBeLessThan(wheeled);

  expect(problems).toEqual([]);
});
