import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { newCampaign, paidInto } from '../src/rules/campaign';
import { apply, outcome } from '../src/rules/chronicle';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  campaignShown,
  chronicleButton,
  chronicleOf,
  click,
  cursorOverCanvas,
  firstsOf,
  idsOf,
  landed,
  onScreen,
  openSaved,
  plantCampaign,
  readNames,
  rested,
  SHELTER,
  settledOn,
  standing,
  tooltipText,
  tooltipUp,
  watch,
} from './chronicle-screen';

/** What the bar's influence reads. */
function influenceReads(page: Page): Promise<string | undefined> {
  return page.evaluate(
    () =>
      (window.named?.('reading-influence-value')?.object as Phaser.GameObjects.Text | undefined)
        ?.text,
  );
}

/**
 * How the navbar's button for that screen stands: sunk in its well, where the well stands and no
 * face does, or pressable in the fill its face is painted.
 */
function buttonOf(
  page: Page,
  screen: string,
): Promise<{ sunk: true } | { sunk: false; fill: number; pressable: boolean }> {
  return page.evaluate((name) => {
    const well = window.named?.(`navbar-${name}-well`);
    const face = window.named?.(`navbar-${name}`)?.object as
      | Phaser.GameObjects.Rectangle
      | undefined;
    if (well !== undefined && face === undefined) return { sunk: true as const };
    if (well !== undefined || face === undefined) throw new Error(`navbar-${name} stands as both`);
    return { sunk: false as const, fill: face.fillColor, pressable: face.input?.enabled === true };
  }, screen);
}

const ACCENT = { sunk: false, fill: LOOK.accent, pressable: true };

test('the bare address with no save boots the campaign screen, Campaign sunk, Chronicle in the accent, and the bar reading a new campaign’s influence', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);

  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await buttonOf(page, 'campaign')).toEqual({ sunk: true });
  expect(await buttonOf(page, 'launch')).toEqual(ACCENT);
  expect(await influenceReads(page)).toBe(
    String(newCampaign(CATALOGUE, firstsOf().deck).influence),
  );

  expect(problems).toEqual([]);
});

test('an address naming no deck boots the campaign screen, and reads nothing else it names', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/?seed=12&age=nowhere&region=nowhere');
  await campaignShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);

  expect(problems).toEqual([]);
});

test('on a campaign a won chronicle paid into, the bar reads its influence, and the pointer resting on the reading raises its tooltip under an arrow', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const opened = newCampaign(CATALOGUE, firstsOf().deck);
  const { campaign } = paidInto(CATALOGUE, opened, won);
  expect(campaign.influence).not.toBe(opened.influence);

  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
  expect(await influenceReads(page)).toBe(String(campaign.influence));

  const reading = await onScreen(page, 'reading-influence');
  await page.mouse.move(reading.x, reading.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-campaign')).toBe(true);
  expect(await tooltipText(page, 'tooltip-campaign')).toBe(text('tooltip.influence'));
  expect(await cursorOverCanvas(page)).toBe('');

  expect(problems).toEqual([]);
});

test('Chronicle opens the launch page, Chronicle sunk there, the back key raises the menu there, and Campaign opens the campaign screen', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);

  expect(await buttonOf(page, 'launch')).toEqual({ sunk: true });
  expect(await buttonOf(page, 'campaign')).toEqual(ACCENT);
  expect(await influenceReads(page)).toBe(
    String(newCampaign(CATALOGUE, firstsOf().deck).influence),
  );

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'menu-campaign')).toBe(false);
  expect(await standing(page, 'launch')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'launch')).toBe(true);

  await rested(page);
  await click(page, 'navbar-campaign');
  await campaignShown(page);
  expect(await standing(page, 'launch')).toBe(false);
  expect(await buttonOf(page, 'campaign')).toEqual({ sunk: true });

  expect(problems).toEqual([]);
});

test('over a chronicle the menu lists Campaign, and Campaign leaves the chronicle in its save for Continue to open as it stands', async ({
  page,
}) => {
  const problems = watch(page);
  const saved = settledOn(1);

  await openSaved(page, saved);
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'menu-campaign')).toBe(true);

  await rested(page);
  await click(page, 'menu-campaign');
  await campaignShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);

  await chronicleButton(page);
  await click(page, 'launch-continue');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await chronicleOf(page)).toEqual(saved);

  expect(problems).toEqual([]);
});

test('the back key on the campaign screen raises the menu, which lists no Campaign', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);

  await page.goto('/');
  await campaignShown(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'menu-settings')).toBe(true);
  expect(await standing(page, 'menu-campaign')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await page.evaluate(() => window.game?.scene.isActive('campaign'))).toBe(true);

  expect(problems).toEqual([]);
});
