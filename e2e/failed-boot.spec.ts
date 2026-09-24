import { expect, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { watch } from './chronicle-screen';

// A worker-scoped option: at the top level of the file, never inside a describe.
test.use({ launchOptions: { args: ['--disable-webgl'] } });

test("a boot that throws says the game could not start, in the error's own words", async ({
  page,
}) => {
  const problems = watch(page);

  await page.goto('/');

  const sentence = page.getByText(text('boot.failed'), { exact: true });
  await expect(sentence).toBeVisible();
  const words = sentence.locator('xpath=following-sibling::*[1]');
  await expect(words).toBeVisible();

  await expect.poll(() => problems.length).toBeGreaterThan(0);
  expect(problems).toEqual([`page: ${await words.textContent()}`]);
  await expect(page.locator('canvas')).toHaveCount(0);
});
