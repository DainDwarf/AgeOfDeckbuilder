import { expect, test } from '@playwright/test';
import { watch } from './table';

test('the page boots into the chronicle and logs nothing', async ({ page }) => {
  const problems = watch(page);

  await page.goto('/');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);

  await page.waitForFunction(() => window.game?.scene.isActive('chronicle') === true);

  expect(problems).toEqual([]);
});
