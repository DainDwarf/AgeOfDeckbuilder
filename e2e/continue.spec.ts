import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type Chronicle, onSettlePhase } from '../src/rules/state';
import { achievementName, text } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  click,
  firstsOf,
  idsOf,
  landed,
  launchedOn,
  plant,
  readNames,
  rested,
  SHELTER,
  settledOn,
  standing,
  victoryShown,
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

/** The chronicle planted as the save, and the page the bare address boots on waited for. */
async function pageOver(page: Page, chronicle: Chronicle): Promise<void> {
  const { region, deck } = firstsOf();
  await readNames(page);
  await plant(page, { chronicle, region, deck });
  await page.goto('/');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
}

/** Continue pressed, and the chronicle screen it opens waited for. */
async function pressContinue(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-continue');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
}

test('on a save holding a chronicle the bare address lands on the page, Continue reads its turn, and the press opens it where it stood', async ({
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

test('on a save holding a won chronicle, Continue reads its turn and each achievement it reached, and opens it on its ending screen', async ({
  page,
}) => {
  test.setTimeout(budget(0));
  const problems = watch(page);
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const reached = won.achievements.filter((achievement) => achievement.reached);
  expect(reached.length).toBeGreaterThan(0);

  await pageOver(page, won);
  expect(await continueReads(page)).toEqual([
    text('launch.continue'),
    text('launch.turn', { turn: won.turn }),
    ...reached.map(({ id }) => text('launch.reached', { achievement: achievementName(id) })),
  ]);

  await pressContinue(page);
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(await chronicleOf(page)).toEqual(won);

  expect(problems).toEqual([]);
});

test('with no save the page stands with no Continue', async ({ page }) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
  expect(await standing(page, 'launch-continue')).toBe(false);

  expect(problems).toEqual([]);
});

test('the menu’s New chronicle leaves the chronicle launched on the page in its save, and Continue opens it as it stands', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await expect.poll(() => standing(page, 'launch-button')).toBe(true);
  expect(await standing(page, 'launch-continue')).toBe(false);
  await rested(page);
  await click(page, 'launch-button');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  const launched = await chronicleOf(page);
  expect(onSettlePhase(launched)).toBe(true);

  await expect.poll(() => standing(page, 'menu-button')).toBe(true);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await click(page, 'menu-new-chronicle');
  await expect.poll(() => standing(page, 'launch-continue')).toBe(true);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await continueReads(page)).toEqual([text('launch.continue'), text('launch.settle-phase')]);

  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await chronicleOf(page)).toEqual(launched);

  expect(problems).toEqual([]);
});

test('continue named beside a deck the catalogue does not hold opens the chronicle the save holds, and nothing else is read', async ({
  page,
}) => {
  const problems = watch(page);
  const saved = settledOn(1);
  const { region, deck } = firstsOf();
  await readNames(page);
  await plant(page, { chronicle: saved, region, deck });

  await page.goto('/?deck=nowhere&seed=7&continue=1');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  expect(await chronicleOf(page)).toEqual(saved);

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
