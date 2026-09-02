import { expect, test } from '@playwright/test';
import { offCanvas, onScreen, open, tooltipUp, watch } from './table';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left above it. */
const WINDOW = { width: 1280, height: 900 };

/** Longer than the rest a tooltip waits out, so one that were coming has had every chance to. */
const PAST_REST = 800;

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
