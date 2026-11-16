import { expect, type Page, test } from '@playwright/test';
import { LOOK } from '../src/ui/look';
import { cardName, text } from '../src/ui/text';
import {
  AIMED_AT_HAND,
  aimableAtHand,
  aimLine,
  chronicleOf,
  onScreen,
  openSaved,
  playedAtCard,
  playedOut,
  readings,
  rested,
  selected,
  watch,
} from './chronicle-screen';

/**
 * How the card at this place in the hand stands, in one question: how much larger than its own size,
 * whether upright, and whether a ring or a point stands anywhere on the screen.
 */
async function standsAs(
  page: Page,
  index: number,
): Promise<{ scale: number; upright: boolean; ring: boolean; point: boolean }> {
  const seen = await readings(page, [`hand-${index}`, 'ring', 'aim-point']);
  const card = seen(`hand-${index}`);
  return {
    scale: card.scale,
    upright: card.axes.x.y === 0,
    ring: seen('ring').standing,
    point: seen('aim-point').standing,
  };
}

test('a card aimed at the hand stands lifted once selected, upright and larger, wearing no ring and no point; it is being aimed from its second click, the line over the hand saying it is played at a card of the hand, the card wearing nothing more; and a click on another card of the hand plays it there', async ({
  page,
}) => {
  const problems = watch(page);
  const { campaign, opened, card, other } = aimableAtHand();
  const lifted = { scale: LOOK.liftedCard, upright: true, ring: false, point: false };

  await openSaved(page, opened, campaign);
  const home = await onScreen(page, `hand-${card}`);
  const aimedAt = await onScreen(page, `hand-${other}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await selected(page, card, home)).toBe(true);
  expect(await standsAs(page, card)).toEqual(lifted);
  expect(await aimLine(page)).toBeUndefined();

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await aimLine(page)).toBe(text('aim.hand', { card: cardName(AIMED_AT_HAND) }));
  expect(await selected(page, card, home)).toBe(true);
  expect(await standsAs(page, card)).toEqual(lifted);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(aimedAt.x, aimedAt.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtCard(opened, card, other));
  expect(await aimLine(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
