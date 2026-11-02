import { expect, test } from '@playwright/test';
import { failedWords, watch } from './chronicle-screen';

// A worker-scoped option: at the top level of the file, never inside a describe.
test.use({ launchOptions: { args: ['--disable-webgl'] } });

test("a boot that throws says the game could not start, in the error's own words", async ({
  page,
}) => {
  const problems = watch(page);

  await page.goto('/');

  const words = await failedWords(page);

  await expect.poll(() => problems.length).toBeGreaterThan(0);
  expect(problems).toEqual([`page: ${await words.textContent()}`]);
  await expect(page.locator('canvas')).toHaveCount(0);
});
