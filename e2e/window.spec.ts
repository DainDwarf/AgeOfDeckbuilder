import { expect, type Page, test } from '@playwright/test';
import { openSaved, settledOn, watch } from './chronicle-screen';

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

/** Waits for the backing store to leave that width. */
async function backingLeaves(page: Page, width: number): Promise<void> {
  await page.waitForFunction((was) => document.querySelector('canvas')?.width !== was, width);
}

const DESIGN_WINDOW = { width: 1280, height: 720 };

/** The window moved to a monitor of that density: its CSS size stands and no resize fires. */
async function hoppedTo(page: Page, ratio: number, colorScheme: 'dark' | 'light'): Promise<void> {
  const { width } = await measure(page);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setDeviceMetricsOverride', {
    ...DESIGN_WINDOW,
    deviceScaleFactor: ratio,
    mobile: false,
  });
  // The override moves the ratio and tells no media query: a real monitor's change does. Any media
  // emulated anew has Chromium read every query again, so `colorScheme` has to differ hop to hop.
  await page.emulateMedia({ colorScheme });
  await backingLeaves(page, width);
}

test('the design space follows a window that grows after boot', async ({ page }) => {
  const problems = watch(page);

  await page.setViewportSize({ width: 640, height: 360 });
  await openSaved(page, settledOn(1));

  const booted = await measure(page);
  expect(booted.width).toBe(booted.onWidth);
  expect(booted.height).toBe(booted.onHeight);

  await page.setViewportSize(DESIGN_WINDOW);
  await backingLeaves(page, booted.width);

  const grown = await measure(page);
  expect(grown.width).toBeGreaterThan(booted.width);
  expect(grown.width).toBe(grown.onWidth);
  expect(grown.height).toBe(grown.onHeight);

  expect(problems).toEqual([]);
});

test('the design space follows a window moved to a monitor of another pixel density', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, settledOn(1));

  await hoppedTo(page, 1.5, 'dark');
  const first = await measure(page);
  expect(first.width).toBe(first.onWidth);
  expect(first.height).toBe(first.onHeight);

  await hoppedTo(page, 2, 'light');
  const second = await measure(page);
  expect(second.width).toBe(second.onWidth);
  expect(second.height).toBe(second.onHeight);

  expect(problems).toEqual([]);
});
