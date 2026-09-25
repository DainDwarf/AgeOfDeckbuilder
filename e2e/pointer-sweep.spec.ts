import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  endedTurn,
  endTurn,
  firstSeed,
  onScreen,
  openSaved,
  playing,
  settledOn,
  watch,
} from './chronicle-screen';

/**
 * The first seed's first turn whose draw pile holds fewer cards than the hand, so its end deals the
 * next hand either side of a shuffle, with no deal due on the two turns the spec ends.
 */
function thinned(): Chronicle {
  return firstSeed('thins its draw pile under a hand with no deal due', (seed) => {
    let chronicle = settledOn(NOMADIC, seed);
    for (let turn = 1; turn <= 8 && chronicle.ending === undefined; turn++) {
      if (chronicle.drawPile.length < chronicle.hand.length) {
        return chronicle.timeline.next > chronicle.turn + 2 ? chronicle : undefined;
      }
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

test('a pointer sweeping the hand while the end of turn plays leaves the chronicle screen live behind it', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const opened = thinned();
  const stages = apply(NOMADIC, opened, { type: 'end-turn' });
  const names = [...walked(stages)].map((stage) => stage.name);
  expect(names.indexOf('drawn')).toBeLessThan(names.indexOf('shuffled'));
  const once = outcome(stages);

  await openSaved(page, opened);

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

  expect(await chronicleOf(page)).toEqual(once);

  await endTurn(page);
  expect(await chronicleOf(page)).toEqual(endedTurn(once));
  expect(problems).toEqual([]);
});
