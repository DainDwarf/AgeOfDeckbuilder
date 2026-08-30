import { expect, test } from '@playwright/test';

test('the page boots a canvas and logs nothing', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));

  await page.goto('/');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);
  expect(problems).toEqual([]);
});
