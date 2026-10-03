import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import type { CardId, Chronicle } from '../src/rules/state';
import { improvementName } from '../src/ui/text';
import {
  aimed,
  chronicleOf,
  click,
  dragOut,
  firstSeed,
  idsOf,
  marksIn,
  onDeer,
  openSaved,
  panelRows,
  playedOn,
  playedOut,
  ringedTile,
  settledOn,
  shownCard,
  TRAPPING,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that removes the feature. */
const HUNT = 'hunt';

/** A turn 1 whose worker stands on the deer beside the city, a card in the hand and paid for. */
type Paid = { readonly chronicle: Chronicle; readonly tile: TileCoords; readonly index: number };

/**
 * The first seed's turn 1 with the card in hand and a copy of Trapping in the deck, on the deer the
 * improvements named are placed on, with the card paid for.
 */
function paidOnDeer(card: CardId, improvements: readonly string[]): Paid {
  const civilization = withCard(TRAPPING);
  return firstSeed(`opens turn 1 on ${card} in hand`, (seed) => {
    const opened = settledOn(seed, [], civilization);
    if (!idsOf(opened.hand).includes(card)) return undefined;
    const { chronicle: worked, tile } = onDeer(opened, improvements);
    const chronicle = gained(worked, cardOf(CATALOGUE, card).cost).chronicle;
    return { chronicle, tile, index: idsOf(chronicle.hand).indexOf(card) };
  });
}

test('the trapping card places trapping on the deer the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, []);
  const placed = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle);
  const before = await marksIn(page, 'improvements');
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(placed);
  expect(await marksIn(page, 'improvements')).toBe(before + 1);
  expect(problems).toEqual([]);
});

test('the tile trapping was placed on inspects trapping on a card of its own, before its terrain', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, []);

  await openSaved(page, playedOn(paid.chronicle, paid.index, paid.tile));

  // The worker that placed it still stands there, so trapping's card comes after the unit's.
  await click(page, `tile-${tileKey(paid.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(paid.tile));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');

  // Nothing is built on it, so trapping heads the card and its one row says what it gives.
  await expect
    .poll(() => panelRows(page))
    .toEqual([
      { text: improvementName(TRAPPING), yields: {} },
      { text: improvementName(TRAPPING), yields: improvementKind(CATALOGUE, TRAPPING).yields },
    ]);

  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});

test('the hunt card played on a trapped deer removes the deer and the trapping with it', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidOnDeer(HUNT, [TRAPPING]);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle);
  const features = await marksIn(page, 'features');
  const improvements = await marksIn(page, 'improvements');
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await marksIn(page, 'features')).toBe(features - 1);
  expect(await marksIn(page, 'improvements')).toBe(improvements - 1);
  expect(problems).toEqual([]);
});
