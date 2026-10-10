import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  budget,
  campaignShown,
  capstoneClosed,
  click,
  continued,
  firstSeed,
  onScreen,
  plantSaved,
  playedOut,
  readNames,
  rested,
  settledOn,
  standing,
  stoppedTurn,
  textOf,
  titleOf,
  watch,
} from './chronicle-screen';

/** The words the browser refuses its storage in, here. */
const REFUSED = 'the storage is refused';

/** The pages this one loads from now on refuse every access to their storage. */
async function refuseStorage(page: Page): Promise<void> {
  await page.addInitScript((words) => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException(words, 'SecurityError');
      },
    });
  }, REFUSED);
}

/**
 * The pages this one loads from now on refuse every write to their storage, as a full one does, and
 * read it as it stands: added after `plantSaved`, whose write runs first.
 */
async function refuseWrites(page: Page): Promise<void> {
  await page.addInitScript((words) => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
      if (this === window.localStorage) throw new DOMException(words, 'QuotaExceededError');
      write.call(this, key, value);
    };
  }, REFUSED);
}

/** Every refusal the run said on the console, in the browser's words. */
function refusals(page: Page): string[] {
  const said: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text() === REFUSED) said.push(message.text());
  });
  return said;
}

/** The refused-save window stands, reading its title, its line and Back. */
async function refusedSaveShown(page: Page): Promise<void> {
  await expect.poll(() => standing(page, 'refused-save')).toBe(true);
  expect(await titleOf(page, 'refused-save')).toBe(text('refused-save.title'));
  expect(await textOf(page, 'refused-save-line')).toBe(text('refused-save.line'));
  expect(await textOf(page, 'refused-save-back-label')).toBe(text('control.back'));
}

/** The first seed's turn 1, settled bare, whose next two ends of turn stop on no deal, no landing and no ending. */
function twoBareTurns(): Chronicle {
  return firstSeed('ends two turns on nothing', (seed) => {
    const opened = settledOn(seed);
    let turned = opened;
    for (let turn = 0; turn < 2; turn++) {
      turned = outcome(apply(CATALOGUE, turned, { type: 'end-turn' }));
      if (
        turned.deals.length > 0 ||
        turned.ending !== undefined ||
        turned.turn >= turned.timeline.capstone.turn
      )
        return undefined;
    }
    return opened;
  });
}

test('a browser refusing its storage from the start boots the campaign screen under the refused-save window, which Back takes down, and the game runs on', async ({
  page,
}) => {
  const problems = watch(page);
  const said = refusals(page);
  await readNames(page);
  await refuseStorage(page);

  await page.goto('/');
  await campaignShown(page);
  await refusedSaveShown(page);
  await expect.poll(() => said.length).toBeGreaterThan(0);

  await click(page, 'refused-save-back');
  await expect.poll(() => standing(page, 'refused-save')).toBe(false);
  await rested(page);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'refused-save')).toBe(false);

  expect(problems).toEqual([]);
});

test('a right click on its scrim takes the refused-save window down, and the menu opens after it', async ({
  page,
}) => {
  const problems = watch(page);
  await readNames(page);
  await refuseStorage(page);

  await page.goto('/');
  await campaignShown(page);
  await refusedSaveShown(page);

  // The Menu button stands under the scrim, clear of the window's box.
  const scrim = await onScreen(page, 'menu-button');
  await rested(page);
  await page.mouse.click(scrim.x, scrim.y, { button: 'right' });
  await expect.poll(() => standing(page, 'refused-save')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  await rested(page);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  expect(problems).toEqual([]);
});

test('a write refused mid-chronicle raises the refused-save window once over the chronicle screen, and a second refused write raises nothing', async ({
  page,
}) => {
  test.setTimeout(budget(2));
  const problems = watch(page);
  const said = refusals(page);
  await plantSaved(page, twoBareTurns());
  await refuseWrites(page);

  await continued(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  await capstoneClosed(page);
  expect(await standing(page, 'refused-save')).toBe(false);
  expect(said).toEqual([]);

  await stoppedTurn(page);
  await playedOut(page);
  await refusedSaveShown(page);
  expect(await page.evaluate(() => window.game?.scene.isActive('ui'))).toBe(true);
  await expect.poll(() => said.length).toBe(1);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'refused-save')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  await rested(page);

  await stoppedTurn(page);
  await playedOut(page);
  await rested(page);
  await expect.poll(() => said.length).toBe(2);
  expect(await standing(page, 'refused-save')).toBe(false);

  expect(problems).toEqual([]);
});
