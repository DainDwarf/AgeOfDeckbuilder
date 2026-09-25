import { expect, type Page, test } from '@playwright/test';
import { STAND_IN, STAND_IN_REGION } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { writeSave } from '../src/rules/save';
import type { Chronicle } from '../src/rules/state';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { eventName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  click,
  dealRun,
  endedTurn,
  endTurn,
  launch,
  open,
  readNames,
  rested,
  standing,
  titleOf,
  victoryShown,
  watch,
} from './chronicle-screen';

/** The chronicle kept as the save the pages this one loads from now on find, on `PH_Deck`. */
async function plant(page: Page, chronicle: Chronicle): Promise<void> {
  const text = writeSave(STAND_IN, { chronicle, region: STAND_IN_REGION, deck: 'PH_Deck' });
  await page.addInitScript(
    ({ entry, save }) => {
      window.localStorage.setItem(entry, save);
    },
    { entry: SAVE_ENTRY, save: text },
  );
}

async function resume(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.game?.scene.isActive('ui') === true);
  await rested(page);
}

test('a chronicle reopened on the bare address stands where it stood, under its capstone’s window', async ({
  page,
}) => {
  test.setTimeout(budget(1));
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await endTurn(page);
  const stood = await chronicleOf(page);

  await resume(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  expect(await chronicleOf(page)).toEqual(stood);

  expect(problems).toEqual([]);
});

test('a save that cannot be read is dropped, the console says why, and the launch page boots', async ({
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

  await expect.poll(() => standing(page, 'launch')).toBe(true);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await page.evaluate((entry) => window.localStorage.getItem(entry), SAVE_ENTRY)).toBe(null);
  expect(warnings).toContainEqual(expect.stringContaining('the save is not JSON'));

  expect(problems).toEqual([]);
});

test('an ended chronicle reopens on its ending screen, and no capstone’s window rises', async ({
  page,
}) => {
  const problems = watch(page);
  let ended = launch(1, deckOf(STAND_IN, 'PH_Deck'), 'PH_ShortSchedule');
  for (let turn = 0; turn < 3; turn++) ended = endedTurn(ended);
  expect(ended.ending).toEqual({ outcome: 'victory', turn: 4 });

  await readNames(page);
  await plant(page, ended);
  await resume(page);

  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(await chronicleOf(page)).toEqual(ended);

  expect(problems).toEqual([]);
});

test('a chronicle reopened waiting on a deal stands under its capstone’s window, and the deal’s window rises once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  const { dealt } = dealRun();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);

  await readNames(page);
  await plant(page, dealt);
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
