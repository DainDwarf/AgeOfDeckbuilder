import { expect, type Page, test } from '@playwright/test';
import { open, watch } from './chronicle-screen';

/** The canvas's backing store, and the room it takes on screen measured in the same device pixels. */
type Backing = { width: number; height: number; onWidth: number; onHeight: number };

function measure(page: Page): Promise<Backing> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      onWidth: Math.round(rect.width * window.devicePixelRatio),
      onHeight: Math.round(rect.height * window.devicePixelRatio),
    };
  });
}

test('the design space follows a window that grows after boot', async ({ page }) => {
  const problems = watch(page);

  await page.setViewportSize({ width: 640, height: 360 });
  await open(page, 1, 'PH_Deck');

  const booted = await measure(page);
  expect(booted.width).toBe(booted.onWidth);
  expect(booted.height).toBe(booted.onHeight);

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForFunction(
    (was) => document.querySelector('canvas')?.width !== was,
    booted.width,
  );

  const grown = await measure(page);
  expect(grown.width).toBeGreaterThan(booted.width);
  expect(grown.width).toBe(grown.onWidth);
  expect(grown.height).toBe(grown.onHeight);

  expect(problems).toEqual([]);
});
