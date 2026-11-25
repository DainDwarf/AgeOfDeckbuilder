import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { freshCampaign } from '../src/rules/save';
import { creditsListed, LINKS, lineRead } from '../src/ui/credits';
import { text } from '../src/ui/text';
import { buildVersion } from '../tools/version';
import {
  click,
  cursorAt,
  onScreen,
  openSaved,
  PAST_REST,
  readings,
  rested,
  settledOn,
  standing,
  titleOf,
  tooltipText,
  tooltipUp,
  waitGameClock,
  watch,
} from './chronicle-screen';

const LICENCE = readFileSync(new URL('../LICENSE', import.meta.url), 'utf-8');
const RECORD = readFileSync(new URL('../public/assets/LICENSES.md', import.meta.url), 'utf-8');

/**
 * The chronicle a new campaign settles on its first seed, opened as the save the boot finds it, every
 * request a tab makes outside the dev server answered empty.
 */
async function openedOn(page: Page, server: string): Promise<void> {
  await page
    .context()
    .route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(server).origin
        ? route.continue()
        : route.fulfill({ status: 200, contentType: 'text/plain', body: '' }),
    );
  const campaign = freshCampaign(CATALOGUE);
  await openSaved(page, settledOn(1, [], campaign), campaign);
}

/** The menu raised over the chronicle screen, and its window rested on. */
async function menuRaised(page: Page): Promise<void> {
  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await rested(page);
}

/** Credits pressed on the menu standing, and its window rested on. */
async function creditsOpened(page: Page): Promise<void> {
  await click(page, 'menu-credits');
  await expect.poll(() => standing(page, 'credits')).toBe(true);
  await rested(page);
}

/** The tab a left click at the point opens, loaded; the caller closes it. */
async function tabOpenedAt(page: Page, at: { x: number; y: number }): Promise<Page> {
  const opening = page.context().waitForEvent('page');
  await page.mouse.click(at.x, at.y);
  const tab = await opening;
  await expect.poll(() => tab.url()).not.toBe('about:blank');
  await tab.waitForLoadState();
  return tab;
}

/** The address a left click at the point opens in a new tab, the tab closed after. */
async function addressOpenedAt(page: Page, at: { x: number; y: number }): Promise<string> {
  const tab = await tabOpenedAt(page, at);
  const address = tab.url();
  await tab.close();
  return address;
}

test('the menu lists Credits between Settings and Campaign over the version, and Credits reads the makers off the packs’ licence record over Licences and Back side by side, the version under them, Back closing it onto the menu', async ({
  page,
  baseURL,
}) => {
  const problems = watch(page);
  await openedOn(page, baseURL ?? '');
  await menuRaised(page);
  const menu = await readings(page, [
    'menu-settings',
    'menu-credits',
    'menu-credits-label',
    'menu-campaign',
    'menu-version',
  ]);
  expect(menu('menu-credits-label').text).toBe(text('menu.credits'));
  expect(menu('menu-settings').onScreen.y).toBeLessThan(menu('menu-credits').onScreen.y);
  expect(menu('menu-credits').onScreen.y).toBeLessThan(menu('menu-campaign').onScreen.y);
  expect(menu('menu-version').text).toBe(buildVersion());

  await creditsOpened(page);
  const listed = creditsListed(RECORD);
  const rowsOf = (heading: number, line: number, words: number): string[] =>
    Array.from({ length: words + 1 }, (_, row) => `credits-${heading}-${line}-${row}`);
  const names = listed.flatMap(({ lines }, heading) => [
    `credits-${heading}`,
    ...lines.flatMap((line, at) => rowsOf(heading, at, lineRead(line).split(' ').length)),
  ]);
  const seen = await readings(page, [
    ...names,
    `credits-${listed.length}`,
    'credits-licences',
    'credits-licences-label',
    'credits-back',
    'credits-back-label',
    'credits-version',
  ]);
  const shown = names.filter((name) => seen(name).standing);
  expect(
    listed.map(({ lines }, heading) => ({
      heading: seen(`credits-${heading}`).text,
      lines: lines.map((line, at) =>
        rowsOf(heading, at, lineRead(line).split(' ').length)
          .filter((name) => seen(name).standing)
          .map((name) => seen(name).text)
          .join(' '),
      ),
    })),
  ).toEqual(listed.map(({ heading, lines }) => ({ heading, lines: lines.map(lineRead) })));
  expect(seen(`credits-${listed.length}`).standing).toBe(false);
  const tops = shown.map((name) => seen(name).onScreen.y);
  expect(tops).toEqual([...tops].sort((one, other) => one - other));

  expect(seen('credits-licences-label').text).toBe(text('credits.licences'));
  expect(seen('credits-back-label').text).toBe(text('control.back'));
  expect(seen('credits-licences').onScreen.y).toBe(seen('credits-back').onScreen.y);
  expect(seen('credits-licences').onScreen.x).toBeLessThan(seen('credits-back').onScreen.x);
  expect(seen('credits-version').text).toBe(buildVersion());
  expect(seen('credits-version').onScreen.y).toBeGreaterThan(seen('credits-back').onScreen.y);
  expect(await titleOf(page, 'credits')).toBe(text('menu.credits'));

  await click(page, 'credits-back');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'credits')).toBe(false);

  expect(problems).toEqual([]);
});

test('a rest on a link of the menu raises its name under it, a right click opens nothing, and a left click opens its site in a new tab, the menu standing as it was', async ({
  page,
  baseURL,
}) => {
  const problems = watch(page);
  await openedOn(page, baseURL ?? '');
  await menuRaised(page);

  for (const { sign, reads, opens } of LINKS) {
    const at = await onScreen(page, sign);
    expect(await cursorAt(page, at)).toBe('pointing hand');
    await waitGameClock(page, PAST_REST);
    expect(await tooltipUp(page, 'tooltip-menu')).toBe(true);
    expect(await tooltipText(page, 'tooltip-menu')).toBe(text(reads));
    expect((await onScreen(page, 'tooltip-menu')).y).toBeGreaterThan(at.y);

    const tabs = page.context().pages().length;
    await page.mouse.click(at.x, at.y, { button: 'right' });
    await rested(page);
    expect(page.context().pages().length).toBe(tabs);

    expect(await addressOpenedAt(page, at)).toBe(new URL(opens).href);
    expect(await standing(page, 'menu')).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  expect(await tooltipUp(page, 'tooltip-menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('an address on the Credits list is the pointing hand under the pointer, its underline thicker there, and a left click opens its site in a new tab, Credits standing as it was', async ({
  page,
  baseURL,
}) => {
  const problems = watch(page);
  await openedOn(page, baseURL ?? '');
  await menuRaised(page);
  await creditsOpened(page);

  const addresses = creditsListed(RECORD).flatMap(({ lines }, heading) =>
    lines.flatMap((line, at) =>
      line.flatMap(({ opens }, stretch) =>
        opens === undefined ? [] : [{ name: `credits-${heading}-${at}-address-${stretch}`, opens }],
      ),
    ),
  );
  expect(addresses).not.toEqual([]);
  for (const { name, opens } of addresses) {
    const resting = (await readings(page, [`${name}-rule`]))(`${name}-rule`);
    const at = await onScreen(page, name);
    expect(await cursorAt(page, at)).toBe('pointing hand');
    const pointed = (await readings(page, [`${name}-rule`]))(`${name}-rule`);
    expect(pointed.boundsOnScreen.height).toBeGreaterThan(resting.boundsOnScreen.height);

    expect(await addressOpenedAt(page, at)).toBe(new URL(opens).href);
    expect(await standing(page, 'credits')).toBe(true);
  }

  expect(problems).toEqual([]);
});

test('Licences opens the licences’ page in a new tab, the game’s licence over the packs’ record and, on the dev server, nothing after them', async ({
  page,
  baseURL,
}) => {
  const problems = watch(page);
  await openedOn(page, baseURL ?? '');
  await menuRaised(page);
  await creditsOpened(page);

  const tab = await tabOpenedAt(page, await onScreen(page, 'credits-licences'));
  expect(new URL(tab.url()).origin).toBe(new URL(baseURL ?? '').origin);
  const shown = await tab.evaluate(() => document.querySelector('pre')?.textContent);
  await tab.close();
  expect(shown?.split(`\n${'='.repeat(72)}\n\n`)).toEqual([
    `THE GAME\n${LICENCE.trimEnd()}\n`,
    `THE PACKS\n${RECORD.trimEnd()}\n`,
  ]);
  expect(await standing(page, 'credits')).toBe(true);

  expect(problems).toEqual([]);
});
