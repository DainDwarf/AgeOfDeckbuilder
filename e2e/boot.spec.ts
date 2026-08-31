import { expect, test } from '@playwright/test';

// A literal specifier would be resolved by the type checker against this file's own directory;
// the path is the dev server's, and the page's module registry hands back the running game.
const entry = '/src/main.ts';

test('the page boots into the chronicle and logs nothing', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));

  await page.goto('/');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBeGreaterThan(0);

  await page.waitForFunction(async (path) => {
    const { game } = await import(path);
    return game.scene.isActive('chronicle');
  }, entry);

  expect(problems).toEqual([]);
});
