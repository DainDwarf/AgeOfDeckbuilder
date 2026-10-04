import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { achievementOf, firstAge } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import type { Chronicle } from '../src/rules/state';
import { openingChoices, withAge } from '../src/ui/launch-layout';
import { type Choices, SAVE_ENTRY } from '../src/ui/save-entry';
import { technologyName, text } from '../src/ui/text';
import {
  chronicleOf,
  chronicleRaised,
  click,
  heldSave,
  launchedAs,
  launchScreenOver,
  onScreen,
  reachedByClaims,
  reading,
  readings,
  rested,
  secondEra,
  settledOn,
  standing,
  storedUnder,
  watch,
  wonCampaign,
} from './chronicle-screen';

const WARNING = 'launch-warning';

/** Each achievement the chronicle has reached, as the rules read it, under its technology's name. */
function reachedIn(chronicle: Chronicle): string[] {
  return chronicle.achievements
    .filter(({ reached }) => reached)
    .map(({ id }) =>
      text('achievement.reached', {
        achievement: technologyName(achievementOf(CATALOGUE, chronicle.age, id).technology),
      }),
    );
}

/** Launch pressed on the launch screen, and the warning it raises waited for and rested on. */
async function warned(page: Page): Promise<void> {
  await rested(page);
  await click(page, 'launch-button');
  await expect.poll(() => standing(page, WARNING)).toBe(true);
  await rested(page);
}

/**
 * The warning down onto the launch screen, no menu raised in its place, the choices selected as
 * they were and the save as it was kept.
 */
async function takenDown(page: Page, choices: Choices, kept: string | null): Promise<void> {
  const options = [
    `launch-age-${choices.age}`,
    `launch-region-${choices.region}`,
    `launch-civilization-${choices.civilization}`,
  ];
  await expect.poll(() => standing(page, WARNING)).toBe(false);
  const seen = await readings(page, ['menu', 'launch-button', ...options]);
  expect(seen('menu').standing).toBe(false);
  expect(seen('launch-button').standing).toBe(true);
  expect(options.map((option) => seen(option).selected)).toEqual(options.map(() => true));
  expect(await storedUnder(page, SAVE_ENTRY)).toBe(kept);
}

test('Launch over a saved chronicle that has reached an achievement raises the warning listing what it reached as Continue reads it; Back, the back key and a press on the scrim each take it down onto the choices and the save as they were, and Launch gone through opens a new chronicle on those choices', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const saved = reachedByClaims(secondEra(campaign));
  const reached = reachedIn(saved);
  expect(reached).not.toEqual([]);
  const first = firstAge(CATALOGUE);
  expect(first).not.toBe(saved.age);
  const choices = withAge(CATALOGUE, openingChoices(CATALOGUE, campaign), first);

  await launchScreenOver(page, saved, campaign);
  await click(page, `launch-age-${first}`);
  await expect.poll(async () => (await reading(page, `launch-age-${first}`)).selected).toBe(true);
  const kept = await storedUnder(page, SAVE_ENTRY);

  await warned(page);
  const listed = reached.map((_, at) => `${WARNING}-listed-${at}`);
  const continued = reached.map((_, at) => `launch-continue-line-${at + 1}`);
  const seen = await readings(page, [
    `${WARNING}-title`,
    'launch.warning',
    'launch.unpaid',
    ...listed,
    `${WARNING}-listed-${reached.length}`,
    ...continued,
    `${WARNING}-through-label`,
    `${WARNING}-back-label`,
  ]);
  expect(seen(`${WARNING}-title`).text).toBe(text('navbar.chronicle'));
  expect(seen('launch.warning').text).toBe(text('launch.warning'));
  expect(seen('launch.unpaid').text).toBe(text('launch.unpaid'));
  expect(listed.map((name) => seen(name).text)).toEqual(reached);
  expect(seen(`${WARNING}-listed-${reached.length}`).standing).toBe(false);
  expect(continued.map((name) => seen(name).text)).toEqual(reached);
  expect(seen(`${WARNING}-through-label`).text).toBe(text('launch.button'));
  expect(seen(`${WARNING}-back-label`).text).toBe(text('control.back'));

  await click(page, `${WARNING}-back`);
  await takenDown(page, choices, kept);

  await warned(page);
  await page.keyboard.press('Escape');
  await takenDown(page, choices, kept);

  await warned(page);
  // The Menu button stands under the scrim, clear of the window's box.
  const scrim = await onScreen(page, 'menu-button');
  await page.mouse.click(scrim.x, scrim.y);
  await takenDown(page, choices, kept);

  await warned(page);
  await click(page, `${WARNING}-through`);
  await chronicleRaised(page);
  const chronicle = await chronicleOf(page);
  expect(chronicle).toEqual(launchedAs(campaign, choices, chronicle.seed));
  await expect
    .poll(async () => (await heldSave(page)).chronicle)
    .toEqual({ chronicle, region: choices.region, civilization: choices.civilization });
  expect(await standing(page, WARNING)).toBe(false);

  expect(problems).toEqual([]);
});

test('Launch over a saved chronicle that has reached no achievement opens the new chronicle at once', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = freshCampaign(CATALOGUE);
  const saved = settledOn(1);
  expect(reachedIn(saved)).toEqual([]);

  await launchScreenOver(page, saved, campaign);
  await rested(page);
  await click(page, 'launch-button');
  expect(await standing(page, WARNING)).toBe(false);
  await chronicleRaised(page);
  const chronicle = await chronicleOf(page);
  expect(chronicle).toEqual(
    launchedAs(campaign, openingChoices(CATALOGUE, campaign), chronicle.seed),
  );

  expect(problems).toEqual([]);
});
