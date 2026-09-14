import { expect, test } from '@playwright/test';
import type { CardId } from '../src/rules/state';
import {
  besideTheCards,
  browse,
  cardOf,
  chronicleOf,
  click,
  endedTurn,
  endTurn,
  firstSeed,
  launch,
  offsetOf,
  onScreen,
  open,
  ringed,
  scrolled,
  settled,
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
  return firstSeed('ends three turns standing on fifteen discarded cards', (seed) => {
    let chronicle = launch(seed, DECK);
    for (let turn = 0; turn < 3; turn++) {
      chronicle = endedTurn(chronicle);
    }
    return chronicle.ending === undefined && chronicle.discardPile.length === 15 ? seed : undefined;
  });
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

test('a click rings a browsed card, a right click and the inspection key show it large, and a press beside walks back out', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, browseSeed(), DECK);
  const before = await chronicleOf(page);
  await browse(page, 'draw-pile');

  // The deck holds five of each card, so one of the first six the browse lays out reads differently
  // from the first, and which card stands large says where the inspection sits.
  const first = await cardOf(page, 'browse-card-0');
  const read = await Promise.all(
    [1, 2, 3, 4, 5].map((index) => cardOf(page, `browse-card-${index}`)),
  );
  const other = 1 + read.findIndex((id) => id !== first);
  const selection = `browse-card-${other}`;

  await click(page, 'browse-card-0');
  await expect.poll(() => ringed(page, 'browse-card-0')).toBe(true);

  await click(page, selection);
  await expect.poll(() => ringed(page, selection)).toBe(true);
  expect(await ringed(page, 'browse-card-0')).toBe(false);

  // A card in a browse is there to be seen and no more: a click on the selection does nothing.
  await click(page, selection);
  await settled(page);
  expect(await ringed(page, selection)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  const at = await onScreen(page, 'browse-card-0');
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => cardOf(page, 'inspection')).toBe(first);
  expect(await standing(page, 'browse')).toBe(false);

  // A card stands large, so the inspection key does nothing.
  await page.keyboard.press('KeyI');
  await settled(page);
  expect(await cardOf(page, 'inspection')).toBe(first);

  // The right click never selects, so the back key finds the browse's own selection standing.
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await ringed(page, selection)).toBe(true);

  await page.keyboard.press('KeyI');
  await expect.poll(() => cardOf(page, 'inspection')).toBe(read[other - 1]);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(true);
  expect(await ringed(page, selection)).toBe(true);

  // Between the first two cards of the row: on the frame the grid scrolls on, and on neither card.
  const beside = await onScreen(page, 'browse-card-1');
  await page.mouse.click((at.x + beside.x) / 2, at.y);
  await expect.poll(() => ringed(page, selection)).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y);
  await expect.poll(() => standing(page, 'browse')).toBe(false);

  // The selection dies with the window.
  await browse(page, 'draw-pile');
  expect(await ringed(page, selection)).toBe(false);

  await click(page, 'browse-card-0');
  await expect.poll(() => ringed(page, 'browse-card-0')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringed(page, 'browse-card-0')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(false);

  expect(await chronicleOf(page)).toEqual(before);
  expect(problems).toEqual([]);
});
