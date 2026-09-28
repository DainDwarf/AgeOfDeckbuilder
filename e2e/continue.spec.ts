import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { type Chronicle, onSettlePhase } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  campaignShown,
  chronicleButton,
  chronicleOf,
  click,
  firstsOf,
  launchedOn,
  plant,
  readNames,
  rested,
  settledOn,
  standing,
  watch,
} from './chronicle-screen';

/** What Continue reads on the page: its label, then every line under it in order. */
function continueReads(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const read = (name: string): string | undefined =>
      (window.named?.(name)?.object as Phaser.GameObjects.Text | undefined)?.text;
    const lines: string[] = [];
    const label = read('launch-continue-label');
    if (label !== undefined) lines.push(label);
    for (let at = 0; ; at++) {
      const line = read(`launch-continue-line-${at}`);
      if (line === undefined) return lines;
      lines.push(line);
    }
  });
}

/** The chronicle planted as the save, and the page Chronicle opens from the campaign screen waited for. */
async function pageOver(page: Page, chronicle: Chronicle): Promise<void> {
  const { region, civilization } = firstsOf();
  await readNames(page);
  await plant(page, { chronicle, region, civilization });
  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
}

/** Continue pressed, and the chronicle screen it opens waited for. */
async function pressContinue(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-continue');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
}

test('on a save holding a chronicle the bare address lands on the campaign screen, Continue on the page reads its turn, and the press opens it where it stood', async ({
  page,
}) => {
  const problems = watch(page);
  const saved = settledOn(1);

  expect(onSettlePhase(saved)).toBe(false);

  await pageOver(page, saved);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await continueReads(page)).toEqual([
    text('launch.continue'),
    text('launch.turn', { turn: saved.turn }),
  ]);

  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await chronicleOf(page)).toEqual(saved);

  expect(problems).toEqual([]);
});

test('on a save holding a chronicle still on its settle phase, Continue reads the settle phase', async ({
  page,
}) => {
  const problems = watch(page);
  const saved = launchedOn(1);
  expect(onSettlePhase(saved)).toBe(true);

  await pageOver(page, saved);
  expect(await continueReads(page)).toEqual([text('launch.continue'), text('launch.settle-phase')]);

  expect(problems).toEqual([]);
});

test('with no save the page stands with no Continue', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
  expect(await standing(page, 'launch-continue')).toBe(false);

  expect(problems).toEqual([]);
});

test('the menu’s Campaign leaves the chronicle launched on the page in its save, and Continue opens it as it stands', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
  expect(await standing(page, 'launch-continue')).toBe(false);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  const launched = await chronicleOf(page);
  expect(onSettlePhase(launched)).toBe(true);

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
  await click(page, 'menu-campaign');
  await campaignShown(page);
  expect(await standing(page, 'menu')).toBe(false);
  await chronicleButton(page);
  expect(await continueReads(page)).toEqual([text('launch.continue'), text('launch.settle-phase')]);

  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await chronicleOf(page)).toEqual(launched);

  expect(problems).toEqual([]);
});

test('continue on a save holding no chronicle fails the boot', async ({ page }) => {
  const problems = watch(page);

  await page.goto('/?continue=1');

  const sentence = page.getByText(text('boot.failed'), { exact: true });
  await expect(sentence).toBeVisible();
  const words = sentence.locator('xpath=following-sibling::*[1]');
  await expect(words).toHaveText('the save holds no chronicle to continue');
  await expect.poll(() => problems.length).toBeGreaterThan(0);
  expect(problems).toEqual([`page: ${await words.textContent()}`]);
  await expect(page.locator('canvas')).toHaveCount(0);
});
