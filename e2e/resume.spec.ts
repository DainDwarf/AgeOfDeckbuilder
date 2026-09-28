import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { CENTRE, tileKey } from '../src/rules/map';
import { freshCampaign } from '../src/rules/save';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { eventName } from '../src/ui/text';
import {
  aimed,
  budget,
  campaignShown,
  chronicleOf,
  click,
  continued,
  dragOut,
  firstDealt,
  firstsOf,
  launchedOn,
  openSaved,
  plant,
  playedOut,
  readNames,
  rested,
  standing,
  textOf,
  titleOf,
  watch,
} from './chronicle-screen';

async function resume(page: Page): Promise<void> {
  await continued(page);
  await rested(page);
}

test('a chronicle continued through the address stands where it stood, under its capstone’s window', async ({
  page,
}) => {
  test.setTimeout(budget(0));
  const problems = watch(page);

  await openSaved(page, launchedOn(1));
  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);
  const stood = await chronicleOf(page);

  await resume(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  expect(await chronicleOf(page)).toEqual(stood);

  expect(problems).toEqual([]);
});

test('a save that cannot be read is dropped, the console says why, and the campaign screen boots on a new campaign', async ({
  page,
}) => {
  const problems = watch(page);
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await readNames(page);
  await page.addInitScript((entry) => {
    window.localStorage.setItem(entry, 'no save');
  }, SAVE_ENTRY);

  await page.goto('/');

  await campaignShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await textOf(page, 'reading-influence-value')).toBe(
    String(freshCampaign(CATALOGUE).influence),
  );
  expect(await page.evaluate((entry) => window.localStorage.getItem(entry), SAVE_ENTRY)).toBe(null);
  expect(warnings).toContainEqual(expect.stringContaining('the save is not JSON'));

  expect(problems).toEqual([]);
});

test('a chronicle reopened waiting on a deal stands under its capstone’s window, and the deal’s window rises once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = firstDealt(1);
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const { region, civilization } = firstsOf();

  await readNames(page);
  await plant(page, { chronicle: dealt, region, civilization });
  await resume(page);

  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await standing(page, 'deal')).toBe(false);
  await rested(page);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  expect(await titleOf(page, 'deal')).toBe(eventName(deal.event));
  expect(await chronicleOf(page)).toEqual(dealt);

  expect(problems).toEqual([]);
});
