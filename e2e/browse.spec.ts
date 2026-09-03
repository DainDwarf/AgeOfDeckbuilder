import { expect, test } from '@playwright/test';
import type { CardId } from '../src/rules/cards';
import { apply, beginChronicle, outcome } from '../src/rules/chronicle';
import {
  browse,
  endTurn,
  offsetOf,
  onScreen,
  open,
  scrolled,
  standing,
  watch,
  wheel,
} from './chronicle-screen';

/** Five copies of each card: a pile of these lays out taller than the browse's frame. */
const DECK: readonly CardId[] = (
  ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'] as CardId[]
).flatMap((id) => [id, id, id, id, id]);

/** The first seed whose three ended turns leave the city standing on fifteen discarded cards. */
function browseSeed(): number {
  for (let seed = 1; seed <= 1000; seed++) {
    let chronicle = beginChronicle(seed, DECK);
    for (let turn = 0; turn < 3; turn++) {
      chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    }
    if (chronicle.defeat === undefined && chronicle.discardPile.length === 15) return seed;
  }
  throw new Error('no seed under a thousand ends three turns standing on fifteen discarded cards');
}

test('a pile of more cards than the frame holds scrolls, and stops on its first and last row', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, browseSeed(), DECK);
  await browse(page, 'draw-pile');

  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  await wheel(page, 120);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(opened.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  const frame = await onScreen(page, 'browse-frame');
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y - 60 * frame.unit, { steps: 6 });
  await page.mouse.move(frame.x, frame.y - 120 * frame.unit, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => offsetOf(page)).toBeGreaterThanOrEqual(120);
  expect(await standing(page, 'browse')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);

  for (let turn = 0; turn < 3; turn++) await endTurn(page);
  await browse(page, 'discard-pile');

  const discarded = await scrolled(page);
  expect(discarded.offset).toBe(0);
  expect(discarded.overflow).toBeGreaterThan(0);
  await wheel(page, 4000);
  await expect.poll(() => offsetOf(page)).toBe(discarded.overflow);
  await wheel(page, -4000);
  await expect.poll(() => offsetOf(page)).toBe(0);

  expect(problems).toEqual([]);
});
