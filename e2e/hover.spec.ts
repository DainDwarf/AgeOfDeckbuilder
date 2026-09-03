import { expect, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome, playable, refusalOf } from '../src/rules/chronicle';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  endTurn,
  endTurnLabel,
  offCanvas,
  onScreen,
  open,
  tooltipUp,
  watch,
} from './table';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left above it. */
const WINDOW = { width: 1280, height: 900 };

/** Longer than the rest a tooltip waits out, so one that were coming has had every chance to. */
const PAST_REST = 800;

/**
 * The first seed with a turn in its first eight opening on a card the city can play: only a
 * playable card lifts out of the hand under the pointer.
 */
function liftRun(): { seed: number; turn: number; index: number } {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const index = chronicle.hand.findIndex((id) => playable(refusalOf(chronicle, id)));
      if (index !== -1) return { seed, turn, index };
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
  }
  throw new Error('no seed under a thousand opens a turn on a card the city can play');
}

test('a pointer that leaves the canvas over a resource raises no tooltip behind it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.waitForTimeout(PAST_REST);

  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

test('a tooltip standing over a resource goes down when the pointer leaves the canvas', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);

  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

// The single move is the whole point: the pointer never passes over the canvas outside the button,
// so nothing but the leaving of the canvas itself can end the hover.
test('the end-turn button reads the turn again when the pointer leaves the canvas over it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await open(page, 1, 'PH_Deck');

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  expect(problems).toEqual([]);
});

test('a hand card the pointer leaves the canvas over settles back into the hand', async ({
  page,
}) => {
  const problems = watch(page);
  const run = liftRun();

  await page.setViewportSize(WINDOW);
  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const card = `hand-${run.index}`;
  const rest = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(rest.x, rest.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeLessThan(rest.y);

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeCloseTo(rest.y, 0);

  expect(problems).toEqual([]);
});
