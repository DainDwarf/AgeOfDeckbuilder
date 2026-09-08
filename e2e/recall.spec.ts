import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import {
  chronicleOf,
  click,
  dragOut,
  endTurn,
  firstSeed,
  type OnScreen,
  onScreen,
  open,
  selected,
  settled,
  standing,
  watch,
} from './chronicle-screen';

/** The first seed whose third turn opens on a recall card the city can pay for. */
function recallSeed(): number {
  return firstSeed('opens its third turn on a playable recall card', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn < 3; turn++) {
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    const found =
      chronicle.hand.includes('PH_Recall') && playable(refusalOf(chronicle, 'PH_Recall'));
    return found ? seed : undefined;
  });
}

/** The chronicle the window stands on, where the recall card lies in the hand, and where it rests. */
type Raised = { before: Chronicle; index: number; home: OnScreen };

/** That third turn, with the recall card dragged out of the hand and the window standing. */
async function aimingAtThePile(page: Page): Promise<Raised> {
  await open(page, recallSeed(), 'PH_Deck');
  await endTurn(page);
  await endTurn(page);

  const before = await chronicleOf(page);
  const index = before.hand.indexOf('PH_Recall');
  const home = await onScreen(page, `hand-${index}`);
  await dragOut(page, index);
  await expect.poll(() => standing(page, 'aim-window')).toBe(true);
  return { before, index, home };
}

/** The corner of the canvas the resource bar stands in: on the scrim, beside the window's cards. */
function besideTheCards(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + 10, y: rect.top + 10 };
  });
}

test('a press on a card of the aim window recalls it into the hand', async ({ page }) => {
  const problems = watch(page);

  const { before, index } = await aimingAtThePile(page);
  const newest = before.discardPile.length - 1;

  // The window lays the pile out newest first, so its first card is the pile's last.
  await click(page, 'aim-window-card-0');
  await expect.poll(async () => (await chronicleOf(page)).discardPile.at(-1)).toBe('PH_Recall');

  const after = await chronicleOf(page);
  expect(after.hand).toEqual([
    ...before.hand.slice(0, index),
    ...before.hand.slice(index + 1),
    before.discardPile[newest],
  ]);
  expect(after.discardPile).toEqual([...before.discardPile.slice(0, newest), 'PH_Recall']);
  expect(await standing(page, 'aim-window')).toBe(false);

  expect(problems).toEqual([]);
});

test('a press beside the aim window cards closes it, the card still selected in the hand', async ({
  page,
}) => {
  const problems = watch(page);

  const { before, index, home } = await aimingAtThePile(page);
  expect(before.discardPile.length).toBeGreaterThan(1);

  // Between the first two cards of the row: on the frame the grid scrolls on, and on neither card.
  const first = await onScreen(page, 'aim-window-card-0');
  const second = await onScreen(page, 'aim-window-card-1');
  await page.mouse.click((first.x + second.x) / 2, first.y);
  await expect.poll(() => standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);
  expect(await selected(page, index, home)).toBe(true);

  // The card is still the selection, so the next left click on it is its act: the window again.
  await click(page, `hand-${index}`);
  await expect.poll(() => standing(page, 'aim-window')).toBe(true);
  expect(await chronicleOf(page)).toEqual(before);

  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y);
  await expect.poll(() => standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);
  expect(await selected(page, index, home)).toBe(true);

  expect(problems).toEqual([]);
});

test('a right click on a card of the aim window shows it large, and the back key brings the window back', async ({
  page,
}) => {
  const problems = watch(page);

  const { before } = await aimingAtThePile(page);

  const card = await onScreen(page, 'aim-window-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  expect(await standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  // A card has but the one thing to show, so a second right click on it steps nowhere.
  const large = await onScreen(page, 'inspection');
  await page.mouse.click(large.x, large.y, { button: 'right' });
  await settled(page);
  expect(await standing(page, 'inspection')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim-window')).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('the back key closes the aim window, and a second one lets the card go', async ({ page }) => {
  const problems = watch(page);

  const { before, index, home } = await aimingAtThePile(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);
  expect(await selected(page, index, home)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('the Menu button stands over the scrim: it closes the aim window and lets the card go', async ({
  page,
}) => {
  const problems = watch(page);

  const { before, index, home } = await aimingAtThePile(page);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);
  await expect.poll(() => selected(page, index, home)).toBe(false);

  expect(problems).toEqual([]);
});
