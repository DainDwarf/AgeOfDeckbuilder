import { readFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { catalogued } from '../src/rules/catalogue';
import { freshCampaign, type Save, writeSave } from '../src/rules/save';
import { readSaveFile, writeSaveFile } from '../src/rules/save-file';
import { bound, DEFAULTS, STORED } from '../src/ui/bindings';
import { openingChoices } from '../src/ui/launch-layout';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { text } from '../src/ui/text';
import {
  campaignShown,
  chronicleButton,
  click,
  counted,
  heldSave,
  launchedIn,
  onScreen,
  openSaved,
  plantCampaign,
  plantControls,
  readNames,
  rested,
  settledOn,
  standing,
  storedUnder,
  textOf,
  titleOf,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The save a spec opens on: a new campaign, and the first seed's chronicle settled beside it. */
function opening(): Save {
  const campaign = freshCampaign(CATALOGUE);
  const { region, civilization } = openingChoices(CATALOGUE, campaign);
  return { campaign, chronicle: { chronicle: settledOn(1, [], campaign), region, civilization } };
}

/** The chronicle screen opened on the save, as the boot finds it. */
async function openedOn(page: Page, save: Save): Promise<void> {
  if (save.chronicle === undefined) throw new Error('the save holds no chronicle to open');
  await openSaved(page, save.chronicle.chronicle, save.campaign);
}

/** The menu raised, and Manage Save pressed on it: its window stands. */
async function manageSave(page: Page): Promise<void> {
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
  await click(page, 'menu-manage-save');
  await expect.poll(() => standing(page, 'manage-save')).toBe(true);
  await rested(page);
}

/** Export save pressed: the file the browser's download hands over, its name and its text. */
async function exported(page: Page): Promise<{ name: string; text: string }> {
  const downloading = page.waitForEvent('download');
  await click(page, 'manage-save-export');
  const download = await downloading;
  return {
    name: download.suggestedFilename(),
    text: await readFile(await download.path(), 'utf8'),
  };
}

/** Import save pressed, and a file of that text chosen in the browser's file window. */
async function imported(page: Page, held: string): Promise<void> {
  const choosing = page.waitForEvent('filechooser');
  await click(page, 'manage-save-import');
  const chooser = await choosing;
  await chooser.setFiles({
    name: 'chosen.adbsave',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(held),
  });
}

/** The warning's press gone through, and the campaign screen it stands waited for. */
async function goneThrough(page: Page, warning: string): Promise<void> {
  await click(page, `${warning}-through`);
  await expect.poll(() => standing(page, warning)).toBe(false);
  await campaignShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'manage-save')).toBe(false);
}

/** The save as the game keeps it, read as the game reads it: the save whole, nothing dropped. */
function keptAs({ campaign, chronicle }: Save): object {
  return { campaign, chronicle, dropped: [] };
}

test('the menu lists Manage Save first, whose window reads its line over its four buttons, and Export save hands over the save as a save file dated the day', async ({
  page,
}) => {
  const problems = watch(page);
  const save = opening();
  await openedOn(page, save);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
  expect(await textOf(page, 'menu-manage-save-label')).toBe(text('menu.manage-save'));
  expect((await onScreen(page, 'menu-manage-save')).y).toBeLessThan(
    (await onScreen(page, 'menu-settings')).y,
  );
  await click(page, 'menu-manage-save');
  await expect.poll(() => standing(page, 'manage-save')).toBe(true);
  await rested(page);

  expect(await titleOf(page, 'manage-save')).toBe(text('menu.manage-save'));
  expect(await textOf(page, 'manage-save.line')).toBe(text('manage-save.line'));
  expect(await textOf(page, 'manage-save-export-label')).toBe(text('manage-save.export'));
  expect(await textOf(page, 'manage-save-import-label')).toBe(text('manage-save.import'));
  expect(await textOf(page, 'manage-save-clear-label')).toBe(text('manage-save.clear'));
  expect(await textOf(page, 'manage-save-back-label')).toBe(text('control.back'));

  const file = await exported(page);
  const day = await page.evaluate(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, date: now.getDate() };
  });
  const two = (count: number): string => String(count).padStart(2, '0');
  expect(file.name).toBe(
    `age-of-deckbuilder-save-${day.year}-${two(day.month)}-${two(day.date)}.adbsave`,
  );
  expect(readSaveFile(CATALOGUE, file.text)).toEqual({ save, dropped: [] });
  expect(await heldSave(page)).toEqual(keptAs(save));
  expect(await standing(page, 'manage-save')).toBe(true);

  expect(problems).toEqual([]);
});

test('Clear save warns in its sentence, Back and the back key take the warning down with nothing changed, and the clear gone through stands the campaign screen on a new campaign, the keys as they were', async ({
  page,
}) => {
  const problems = watch(page);
  await plantControls(page, bound(DEFAULTS, 'inspect', 1, { code: 'KeyJ' }));
  await openedOn(page, opening());
  const keys = await storedUnder(page, STORED);
  expect(keys).not.toBeNull();
  const kept = await storedUnder(page, SAVE_ENTRY);

  await manageSave(page);
  await click(page, 'manage-save-clear');
  await expect.poll(() => standing(page, 'clear-warning')).toBe(true);
  expect(await titleOf(page, 'clear-warning')).toBe(text('menu.manage-save'));
  expect(await textOf(page, 'manage-save.clear-warning')).toBe(text('manage-save.clear-warning'));
  expect(await textOf(page, 'clear-warning-through-label')).toBe(text('manage-save.clear'));
  expect(await textOf(page, 'clear-warning-back-label')).toBe(text('control.back'));
  expect(await standing(page, 'manage-save-export')).toBe(false);
  await rested(page);

  await click(page, 'clear-warning-back');
  await expect.poll(() => standing(page, 'manage-save')).toBe(true);
  expect(await standing(page, 'clear-warning')).toBe(false);
  expect(await storedUnder(page, SAVE_ENTRY)).toBe(kept);
  await rested(page);

  await click(page, 'manage-save-clear');
  await expect.poll(() => standing(page, 'clear-warning')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'manage-save')).toBe(true);
  expect(await storedUnder(page, SAVE_ENTRY)).toBe(kept);
  await rested(page);

  await click(page, 'manage-save-clear');
  await expect.poll(() => standing(page, 'clear-warning')).toBe(true);
  await rested(page);
  await goneThrough(page, 'clear-warning');
  expect(await heldSave(page)).toEqual(keptAs({ campaign: freshCampaign(CATALOGUE) }));
  expect(await storedUnder(page, STORED)).toBe(keys);

  expect(problems).toEqual([]);
});

test('Import save on a save file exported warns with no second sentence, and the import gone through stands the campaign screen on the save the file holds', async ({
  page,
}) => {
  const problems = watch(page);
  await openedOn(page, opening());
  await manageSave(page);
  const file = await exported(page);
  await rested(page);
  await click(page, 'manage-save-clear');
  await expect.poll(() => standing(page, 'clear-warning')).toBe(true);
  await rested(page);
  await goneThrough(page, 'clear-warning');

  await manageSave(page);
  await imported(page, file.text);
  await expect.poll(() => standing(page, 'import-warning')).toBe(true);
  expect(await titleOf(page, 'import-warning')).toBe(text('menu.manage-save'));
  expect(await textOf(page, 'manage-save.import-warning')).toBe(text('manage-save.import-warning'));
  expect(await textOf(page, 'manage-save.dropped')).toBeUndefined();
  expect(await textOf(page, 'import-warning-through-label')).toBe(text('manage-save.import'));
  expect(await textOf(page, 'import-warning-back-label')).toBe(text('control.back'));
  expect(await heldSave(page)).toEqual(keptAs({ campaign: freshCampaign(CATALOGUE) }));
  await rested(page);

  await goneThrough(page, 'import-warning');
  const { save } = readSaveFile(CATALOGUE, file.text);
  if (save === undefined) throw new Error('the save file exported is refused');
  expect(await heldSave(page)).toEqual(keptAs(save));

  expect(problems).toEqual([]);
});

test('Import save on a save file whose chronicle names a content version the game does not ship warns with the second sentence, and the import gone through keeps the campaign and no chronicle', async ({
  page,
}) => {
  const problems = watch(page);
  const unshipped = catalogued({ ...CATALOGUE, version: `${CATALOGUE.version}-unshipped` });
  const campaign = freshCampaign(unshipped);
  const choices = openingChoices(unshipped, campaign);
  const chronicle = launchedIn(unshipped, campaign, choices, 1);
  const { region, civilization } = choices;
  const file = writeSaveFile(unshipped, campaign, { chronicle, region, civilization });
  const read = readSaveFile(CATALOGUE, file);
  if (read.save === undefined) throw new Error('the save file is refused');
  expect(read.save.chronicle).toBeUndefined();
  expect(read.dropped).not.toEqual([]);

  await openedOn(page, opening());
  await manageSave(page);
  await imported(page, file);
  await expect.poll(() => standing(page, 'import-warning')).toBe(true);
  expect(await textOf(page, 'manage-save.import-warning')).toBe(text('manage-save.import-warning'));
  expect(await textOf(page, 'manage-save.dropped')).toBe(text('manage-save.dropped'));
  await rested(page);

  await goneThrough(page, 'import-warning');
  expect(await heldSave(page)).toEqual(keptAs(read.save));

  expect(problems).toEqual([]);
});

test('Import save on a file that is no save raises the refused line and no warning, a second one leaves the one line, and the save stands as it was', async ({
  page,
}) => {
  const problems = watch(page);
  await openedOn(page, opening());
  const kept = await storedUnder(page, SAVE_ENTRY);
  const noSaveFile = writeSave(CATALOGUE, freshCampaign(CATALOGUE));
  expect(readSaveFile(CATALOGUE, noSaveFile).save).toBeUndefined();

  await manageSave(page);
  await imported(page, noSaveFile);
  await expect.poll(() => textOf(page, 'manage-save.refused')).toBe(text('manage-save.refused'));
  expect(await standing(page, 'import-warning')).toBe(false);
  expect(await storedUnder(page, SAVE_ENTRY)).toBe(kept);
  await rested(page);

  await imported(page, noSaveFile);
  await expect.poll(() => standing(page, 'manage-save.refused')).toBe(true);
  expect(await counted(page, 'manage-save.refused')).toBe(1);
  expect(await standing(page, 'import-warning')).toBe(false);
  expect(await storedUnder(page, SAVE_ENTRY)).toBe(kept);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(true);

  expect(problems).toEqual([]);
});

test('over the campaign screen, the import gone through stands the campaign screen anew on the save the file holds', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = freshCampaign(CATALOGUE);
  const campaign = wonCampaign();
  expect(campaign.influence).not.toBe(opened.influence);
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(opened.influence));

  await manageSave(page);
  await imported(page, writeSaveFile(CATALOGUE, campaign));
  await expect.poll(() => standing(page, 'import-warning')).toBe(true);
  await rested(page);
  await goneThrough(page, 'import-warning');
  expect(await textOf(page, 'reading-influence-value')).toBe(String(campaign.influence));
  expect(await heldSave(page)).toEqual(keptAs({ campaign }));

  expect(problems).toEqual([]);
});

test('over the launch screen, the clear gone through stands the campaign screen on a new campaign', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = freshCampaign(CATALOGUE);
  const campaign = wonCampaign();
  expect(campaign.influence).not.toBe(opened.influence);
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);

  await manageSave(page);
  await click(page, 'manage-save-clear');
  await expect.poll(() => standing(page, 'clear-warning')).toBe(true);
  await rested(page);
  await goneThrough(page, 'clear-warning');
  expect(await page.evaluate(() => window.game?.scene.isActive('launch'))).toBe(false);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(opened.influence));
  expect(await heldSave(page)).toEqual(keptAs({ campaign: opened }));

  expect(problems).toEqual([]);
});
