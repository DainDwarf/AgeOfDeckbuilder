import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { charted } from '../src/rules/sight';
import type { CardId, Chronicle } from '../src/rules/state';
import {
  admits,
  aimed,
  chronicleOf,
  click,
  dragOut,
  idsOf,
  marksIn,
  openSaved,
  playedOn,
  playedOut,
  watch,
  workerStepped,
} from './chronicle-screen';

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

test('the hunt card removes the feature of the tile the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOn(HUNT);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);

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
