import { expect, test } from '@playwright/test';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import {
  beforeTheLanding,
  budget,
  cardOnFace,
  chronicleOf,
  click,
  loreOf,
  onScreen,
  openSaved,
  playedOut,
  rested,
  standing,
  stoppedTurn,
  titleOf,
  watch,
} from './chronicle-screen';

test('the capstone’s landing holds the end of turn on its window over the hand the turn drew, and the landing plays out once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { before, landed } = beforeTheLanding(
    'stands on an open turn the turn before the capstone lands',
    (before, landed) => ({ before, landed }),
  );
  const capstone = before.timeline.capstone.id;

  await openSaved(page, before);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'landing'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(capstone);
  expect((await chronicleOf(page)).hand).toEqual(landed.hand);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  const card = await onScreen(page, 'capstone-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await standing(page, 'capstone')).toBe(false);
  await expect.poll(() => chronicleOf(page)).toEqual(landed);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(problems).toEqual([]);
});
