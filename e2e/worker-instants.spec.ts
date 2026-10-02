import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { charted } from '../src/rules/sight';
import type { CardId, Chronicle } from '../src/rules/state';
import { improvementName } from '../src/ui/text';
import {
  admits,
  aimed,
  chronicleOf,
  click,
  dragOut,
  idsOf,
  marksIn,
  openSaved,
  panelRows,
  playedOut,
  ringedTile,
  shownCard,
  watch,
  workerStepped,
} from './chronicle-screen';

/** The card that places the improvement, and the improvement it places. */
const TRAPPING = 'trapping';

/** The card that removes the feature. */
const HUNT = 'hunt';

/** A turn 1 whose worker stands on a tile beside the city, a card in the hand and paid for. */
type Paid = { readonly chronicle: Chronicle; readonly tile: TileCoords; readonly index: number };

/**
 * The first seed's turn 1 whose first worker steps off the city onto a tile the card in the hand
 * admits, and the card's cost gained.
 */
function paidOn(card: CardId): Paid {
  const { stepped, tile } = workerStepped(
    `steps its first worker onto a tile ${card} in the hand admits`,
    (moved, at) => admits(moved, idsOf(moved.hand).indexOf(card), at),
  );
  const chronicle = charted(CATALOGUE, gained(stepped, cardOf(CATALOGUE, card).cost).chronicle);
  return { chronicle, tile, index: idsOf(chronicle.hand).indexOf(card) };
}

/** The chronicle the paid card played at the worker's tile leaves. */
function playedAt({ chronicle, tile, index }: Paid): Chronicle {
  const played = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  if (played === chronicle)
    throw new Error(`${chronicle.hand[index]?.id} is refused on ${tileKey(tile)}`);
  return played;
}

test('the trapping card places trapping on the forest the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOn(TRAPPING);
  const placed = playedAt(paid);

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
  const paid = paidOn(TRAPPING);

  await openSaved(page, playedAt(paid));

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

test('the hunt card removes the feature of the tile the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOn(HUNT);
  const hunted = playedAt(paid);

  await openSaved(page, paid.chronicle);
  const before = await marksIn(page, 'features');
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await marksIn(page, 'features')).toBe(before - 1);
  expect(problems).toEqual([]);
});
