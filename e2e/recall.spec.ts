import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import {
  chronicleOf,
  click,
  dragOut,
  endTurn,
  onScreen,
  open,
  settled,
  standing,
  watch,
} from './chronicle-screen';

/** The first seed whose third turn opens on a recall card the city can pay for. */
function recallSeed(): number {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn < 3; turn++) {
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    if (chronicle.hand.includes('PH_Recall') && playable(refusalOf(chronicle, 'PH_Recall'))) {
      return seed;
    }
  }
  throw new Error('no seed under a thousand opens its third turn on a playable recall card');
}

/** That third turn, with the recall card dragged out of the hand and the window standing. */
async function aimingAtThePile(page: Page): Promise<Chronicle> {
  await open(page, recallSeed(), 'PH_Deck');
  await endTurn(page);
  await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Recall'));
  await expect.poll(() => standing(page, 'aim-window')).toBe(true);
  return opened;
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

  const before = await aimingAtThePile(page);
  const index = before.hand.indexOf('PH_Recall');
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

test('the aim window stands through a press beside its cards and a right click, and Cancel lets the card go', async ({
  page,
}) => {
  const problems = watch(page);

  const before = await aimingAtThePile(page);

  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y);
  await settled(page);
  expect(await standing(page, 'aim-window')).toBe(true);

  const card = await onScreen(page, 'aim-window-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await settled(page);
  expect(await standing(page, 'aim-window')).toBe(true);
  expect(await chronicleOf(page)).toEqual(before);

  await click(page, 'aim-cancel');
  await expect.poll(() => standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('the back key lets the aimed card go, and the discard pile keeps every card', async ({
  page,
}) => {
  const problems = watch(page);

  const before = await aimingAtThePile(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim-window')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});
