import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import type { Chronicle } from '../src/rules/state';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import {
  budget,
  cardOnFace,
  chronicleOf,
  click,
  endedTurn,
  firstSeed,
  loreOf,
  onScreen,
  openSaved,
  playedOut,
  rested,
  settledOn,
  standing,
  stoppedTurn,
  titleOf,
  watch,
} from './chronicle-screen';

/**
 * The first seed whose bare turn 1, its turns ended headlessly, stands on an open turn the turn
 * before the capstone lands: that chronicle.
 */
function beforeTheCapstone(): Chronicle {
  return firstSeed('stands on an open turn the turn before the capstone lands', (seed) => {
    let chronicle = settledOn(seed);
    const landing = chronicle.timeline.capstone.turn;
    while (chronicle.turn < landing - 1 && chronicle.ending === undefined) {
      chronicle = endedTurn(chronicle);
    }
    return chronicle.ending === undefined && chronicle.deals.length === 0 ? chronicle : undefined;
  });
}

test('the capstone’s landing holds the end of turn on its window, and the end of turn goes on to draw the hand once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const before = beforeTheCapstone();
  const capstone = before.timeline.capstone.id;
  const landed = outcome(apply(CATALOGUE, before, { type: 'end-turn' }));

  await openSaved(page, before);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'landing'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(capstone);
  expect((await chronicleOf(page)).hand).toEqual([]);
  expect(await standing(page, 'hand-0')).toBe(false);

  await rested(page);
  const card = await onScreen(page, 'capstone-card-0');
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);
  expect(await standing(page, 'hand-0')).toBe(false);

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
