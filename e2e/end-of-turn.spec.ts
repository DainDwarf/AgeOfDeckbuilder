import { expect, test } from '@playwright/test';
import type { CardId } from '../src/rules/cards';
import { apply, beginChronicle } from '../src/rules/chronicle';
import { chronicleOf, endTurn, onScreen, open, playing, watch } from './table';

/**
 * Seven cards, so the first end of turn deals its next hand either side of a shuffle: two off what
 * the draw pile has left, the discard pile shuffled back into it, then the other three.
 */
const DECK: readonly CardId[] = [
  'PH_Worker',
  'PH_Warrior',
  'PH_Farm',
  'PH_March',
  'PH_Harvest',
  'PH_Farm',
  'PH_March',
];

/** No enemy arrives before the fifth turn, so the two turns this ends are safe on any seed. */
const SEED = 1;

test('a pointer sweeping the hand while the end of turn plays leaves the table live behind it', async ({
  page,
}) => {
  const problems = watch(page);

  const names = apply(beginChronicle(SEED, DECK), { type: 'end-turn' }).map((stage) => stage.name);
  expect(names.indexOf('draw')).toBeLessThan(names.indexOf('shuffle'));

  await open(page, SEED, DECK);

  const opened = await chronicleOf(page);
  const lane = await onScreen(page, `hand-${opened.hand.length - 1}`);
  const button = await onScreen(page, 'end-turn');

  await page.mouse.click(button.x, button.y);
  await expect.poll(() => playing(page)).toBe(true);

  // Every read sweeps the pointer across the lane again, so it is moving over the hand from the
  // first stage to the last: a card left live under it would take the hover, kill the tween the
  // stage is waiting on, and the play would never end.
  let sweep = 0;
  await expect
    .poll(async () => {
      sweep += 1;
      await page.mouse.move(lane.x - sweep * 24 * lane.unit, lane.y);
      return playing(page);
    })
    .toBe(false);

  expect((await chronicleOf(page)).turn).toBe(opened.turn + 1);

  await endTurn(page);
  expect((await chronicleOf(page)).turn).toBe(opened.turn + 2);
  expect(problems).toEqual([]);
});
