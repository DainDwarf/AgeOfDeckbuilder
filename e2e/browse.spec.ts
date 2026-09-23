import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import {
  besideTheCards,
  browse,
  cardOnFace,
  chronicleOf,
  click,
  endedTurn,
  endTurn,
  firstSeed,
  kindLabelOnScreen,
  launch,
  nameOnScreen,
  offsetOf,
  onScreen,
  open,
  rested,
  ringed,
  scrolled,
  standing,
  tooltipUp,
  watch,
  wheel,
} from './chronicle-screen';

/** Five copies of each of five cards: a pile of these lays out taller than the browse's frame. */
const DECK = 'PH_TallDeck';

/** Longer than the hand-over a small card waits out before it goes down, so one going has gone. */
const PAST_HANDOVER = 400;

/** Whether the named face's rules entry draws a name. */
function drawsName(page: Page, face: string): Promise<boolean> {
  return page.evaluate((target) => {
    const root = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (root === undefined) throw new Error(`nothing named ${target} is on the chronicle screen`);
    return ((root.getData('names') as unknown[] | undefined) ?? []).length > 0;
  }, face);
}

/** The face whose spot on the page stands nearest the height `y`. */
async function nearest(
  y: number,
  faces: readonly string[],
  spot: (face: string) => Promise<{ y: number }>,
): Promise<string> {
  const spots = await Promise.all(faces.map(spot));
  let best: number | undefined;
  for (const [index, at] of spots.entries()) {
    if (best === undefined || Math.abs(at.y - y) < Math.abs(spots[best].y - y)) best = index;
  }
  if (best === undefined) throw new Error('no face to choose from');
  return faces[best];
}

/** The first seed whose three ended turns leave the city standing on fifteen discarded cards. */
function browseSeed(): number {
  return firstSeed('ends three turns standing on fifteen discarded cards', (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, DECK));
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
  const first = await cardOnFace(page, 'browse-card-0');
  const read = await Promise.all(
    [1, 2, 3, 4, 5].map((index) => cardOnFace(page, `browse-card-${index}`)),
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
  await rested(page);
  expect(await ringed(page, selection)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  const at = await onScreen(page, 'browse-card-0');
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(first);
  expect(await standing(page, 'browse')).toBe(false);

  // A card stands large, so the inspection key does nothing.
  await page.keyboard.press('KeyI');
  await rested(page);
  expect(await cardOnFace(page, 'inspection')).toBe(first);

  // The right click never selects, so the back key finds the browse's own selection standing.
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'browse')).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await ringed(page, selection)).toBe(true);

  await page.keyboard.press('KeyI');
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(read[other - 1]);
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

test('a small card and a kind bubble raised off a browsed card move with it as the wheel scrolls, and go down once the scroll takes what raised them out from under a still pointer', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, browseSeed(), DECK);
  const faces = (await chronicleOf(page)).drawPile.map((_, index) => `browse-card-${index}`);
  await browse(page, 'draw-pile');
  await rested(page);
  const frame = await onScreen(page, 'browse-frame');

  const naming: string[] = [];
  for (const face of faces) if (await drawsName(page, face)) naming.push(face);
  const named = await nearest(frame.y, naming, (face) => nameOnScreen(page, face));

  const name = await nameOnScreen(page, named);
  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(true);
  await rested(page);
  const small = await onScreen(page, 'small-card-0');

  // A quarter of the name's line: the name moves and stays under the pointer.
  const start = await offsetOf(page);
  await page.mouse.wheel(0, name.height / frame.unit / 4);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(start);
  await page.waitForTimeout(PAST_HANDOVER);
  const carried = await nameOnScreen(page, named);
  const followed = await onScreen(page, 'small-card-0');
  expect(carried.y).toBeLessThan(name.y);
  expect(followed.x - carried.x).toBeCloseTo(small.x - name.x, 1);
  expect(followed.y - carried.y).toBeCloseTo(small.y - name.y, 1);

  await page.mouse.wheel(0, (2 * name.height) / frame.unit);
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  const away = await besideTheCards(page);
  await page.mouse.move(away.x, away.y, { steps: 5 });
  const labelled = await nearest(frame.y, faces, (face) => kindLabelOnScreen(page, face));

  const label = await kindLabelOnScreen(page, labelled);
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(true);
  await rested(page);
  const bubble = await onScreen(page, 'tooltip-overlay');

  const at = await offsetOf(page);
  await page.mouse.wheel(0, label.height / frame.unit / 4);
  await expect.poll(() => offsetOf(page)).toBeGreaterThan(at);
  await rested(page);
  const moved = await kindLabelOnScreen(page, labelled);
  const beside = await onScreen(page, 'tooltip-overlay');
  expect(await tooltipUp(page, 'tooltip-overlay')).toBe(true);
  expect(moved.y).toBeLessThan(label.y);
  expect(beside.x - moved.x).toBeCloseTo(bubble.x - label.x, 1);
  expect(beside.y - moved.y).toBeCloseTo(bubble.y - label.y, 1);

  await page.mouse.wheel(0, (2 * label.height) / frame.unit);
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(false);

  expect(problems).toEqual([]);
});
