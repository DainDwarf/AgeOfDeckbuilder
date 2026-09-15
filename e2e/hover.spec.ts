import { expect, type Page, test } from '@playwright/test';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  endTurnLabel,
  offCanvas,
  onScreen,
  open,
  tooltipUp,
  watch,
} from './chronicle-screen';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left above it. */
const WINDOW = { width: 1280, height: 900 };

/** Longer than the rest a tooltip waits out, so one that were coming has had every chance to. */
const PAST_REST = 800;

/** The cursor over something that answers a press. */
const HAND = 'pointer';

test('a pointer that leaves the canvas over a resource raises no tooltip behind it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.waitForTimeout(PAST_REST);

  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

test('a tooltip standing over a resource goes down when the pointer leaves the canvas', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);

  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

// The single move is the whole point: the pointer never passes over the canvas outside the button,
// so nothing but the leaving of the canvas itself can end the hover.
test('the end-turn button reads the turn again when the pointer leaves the canvas over it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  expect(problems).toEqual([]);
});

/** The cursor the page shows over the canvas. */
function cursorOverCanvas(page: Page): Promise<string> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.style.cursor);
}

// `open` ends turn 0 by clicking the button, so the pointer rests on it: the first assertions have
// to come before any move.
test('the end-turn button reads End turn under the pointer the last turn ended at', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const { turn } = await chronicleOf(page);
  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));
  expect(await cursorOverCanvas(page)).not.toBe(HAND);

  expect(problems).toEqual([]);
});

test('the end-turn button reads End turn when the pointer comes back straight onto it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));
  expect(await cursorOverCanvas(page)).not.toBe(HAND);

  expect(problems).toEqual([]);
});

test('a hand card the pointer leaves the canvas over settles back into the hand', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const card = 'hand-0';
  const rest = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(rest.x, rest.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeLessThan(rest.y);

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeCloseTo(rest.y, 0);

  expect(problems).toEqual([]);
});
