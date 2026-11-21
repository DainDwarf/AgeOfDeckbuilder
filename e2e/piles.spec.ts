import { expect, type Page, test } from '@playwright/test';
import type { Chronicle } from '../src/rules/state';
import type { PileKind } from '../src/ui/cast';
import { text } from '../src/ui/text';
import {
  canvasOf,
  cursorAt,
  DESIGN_WINDOW,
  endedTurn,
  firstSeed,
  liftedPart,
  openSaved,
  pieceOnScreen,
  pileAt,
  readings,
  resizedTo,
  settledOn,
  standing,
  titleOf,
  tooltipLines,
  tooltipUp,
  WIDE,
  watch,
} from './chronicle-screen';

const PILES: readonly PileKind[] = ['draw-pile', 'discard-pile', 'exhaust-pile'];

/** How many cards each pile of the chronicle holds. */
function countsOf(chronicle: Chronicle): Record<PileKind, number> {
  return {
    'draw-pile': chronicle.drawPile.length,
    'discard-pile': chronicle.discardPile.length,
    'exhaust-pile': chronicle.exhaustPile.length,
  };
}

test('each pile reads the count of its cards; the pointer is the hand on it and a rest raises its name over it; a left and a right click each open its browse, an empty pile’s among them', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = firstSeed(
    'ends its first turn with cards in the draw and discard piles and none exhausted',
    (seed) => {
      const ended = endedTurn(settledOn(seed));
      const { drawPile, discardPile, exhaustPile } = ended;
      return drawPile.length > 0 && discardPile.length > 0 && exhaustPile.length === 0
        ? ended
        : undefined;
    },
  );
  const counts = countsOf(opened);
  await openSaved(page, opened);

  const read = await readings(
    page,
    PILES.map((pile) => `${pile}-count`),
  );
  for (const pile of PILES) expect(read(`${pile}-count`).text, pile).toBe(String(counts[pile]));

  for (const pile of PILES) {
    const at = await pileAt(page, pile);
    expect(await cursorAt(page, at), pile).toBe('pointer');
    await expect.poll(() => tooltipUp(page, 'tooltip-ui'), pile).toBe(true);
    expect(await tooltipLines(page, 'tooltip-ui')).toEqual([
      { text: text(`tooltip.${pile}`), bold: false },
    ]);
    const bubble = (await readings(page, ['tooltip-ui']))('tooltip-ui').boundsOnScreen;
    const chip = await pieceOnScreen(page, `${pile}-count-chip`);
    expect(bubble.y + bubble.height, pile).toBeLessThan(chip.y);

    for (const button of ['left', 'right'] as const) {
      await page.mouse.click(at.x, at.y, { button });
      await expect.poll(() => standing(page, 'browse'), `${pile} ${button}`).toBe(true);
      expect(await titleOf(page, 'browse')).toBe(text(`browse.${pile}`, { count: counts[pile] }));
      await page.keyboard.press('Escape');
      await expect.poll(() => standing(page, 'browse')).toBe(false);
    }
  }

  expect(problems).toEqual([]);
});

test('a resting card shows its picture over the screen’s bottom edge and its foot under it, and a card the pointer lifts stands whole over the edge', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);
  const card = `hand-${Math.floor(opened.hand.length / 2)}`;
  await openSaved(page, opened);
  const canvas = await canvasOf(page);

  const lying = (await readings(page, [card]))(card);
  expect(lying.windowOnScreen.y).toBeLessThan(canvas.bottom);
  expect(lying.kindLabelOnScreen.y).toBeGreaterThan(canvas.bottom);
  expect(lying.placeOnScreen.y).toBeGreaterThan(canvas.bottom);

  await page.mouse.move(lying.windowOnScreen.x, lying.windowOnScreen.y, { steps: 5 });
  const foot = await liftedPart(
    page,
    async () => (await readings(page, [card]))(card).placeOnScreen,
    lying.placeOnScreen,
  );
  const lifted = (await readings(page, [card]))(card);
  expect(foot.y).toBeLessThan(canvas.bottom);
  expect(lifted.kindLabelOnScreen.y).toBeLessThan(canvas.bottom);
  expect(lifted.boundsOnScreen.y).toBeGreaterThan(canvas.top);

  expect(problems).toEqual([]);
});

/** Where the piles and the hand's first and last cards stand across the page. */
async function acrossOf(page: Page, hand: number): Promise<Record<string, number>> {
  const first = 'hand-0';
  const last = `hand-${hand - 1}`;
  const seen = await readings(page, [...PILES, first, last]);
  return {
    ...Object.fromEntries(PILES.map((pile) => [pile, seen(pile).onScreen.x])),
    first: seen(first).placeOnScreen.x,
    last: seen(last).placeOnScreen.x,
  };
}

test('on a wider window the hand and the piles keep together in the middle of the bottom edge, the draw pile left of the hand and the discard and the exhaust piles right of it', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);
  const held = opened.hand.length;

  await page.setViewportSize(DESIGN_WINDOW);
  await openSaved(page, opened);
  const smallest = await acrossOf(page, held);

  await resizedTo(page, WIDE);
  const wide = await acrossOf(page, held);

  for (const [at, x] of Object.entries(wide)) {
    expect(x - WIDE.width / 2, at).toBeCloseTo(smallest[at] - DESIGN_WINDOW.width / 2, 3);
  }
  expect(wide['draw-pile']).toBeLessThan(wide.first);
  expect(wide.last).toBeLessThan(wide['discard-pile']);
  expect(wide['discard-pile']).toBeLessThan(wide['exhaust-pile']);

  expect(problems).toEqual([]);
});
