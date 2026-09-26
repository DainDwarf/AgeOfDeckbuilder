import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { charted } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
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

/** A turn 1 whose worker stands on a forest beside the city, trapping in the hand and paid for. */
type Paid = { readonly chronicle: Chronicle; readonly tile: TileCoords; readonly index: number };

/**
 * The first seed's turn 1 whose first worker steps off the city onto a forest with trapping in the
 * hand, and trapping's cost gained: trapping then admits the worker's tile.
 */
function trappingPaid(): Paid {
  const { stepped, tile } = workerStepped(
    'steps its first worker onto a forest with trapping in the hand',
    (moved, at) =>
      tileAt(moved.tiles, at)?.terrain === 'forest' && idsOf(moved.hand).includes(TRAPPING),
  );
  const chronicle = charted(NOMADIC, gained(stepped, cardOf(NOMADIC, TRAPPING).cost).chronicle);
  const index = idsOf(chronicle.hand).indexOf(TRAPPING);
  if (!admits(chronicle, index, tile))
    throw new Error(`${TRAPPING} admits no ${tileKey(tile)} once paid for`);
  return { chronicle, tile, index };
}

/** The chronicle trapping played at the worker's tile leaves. */
function trappingPlaced({ chronicle, tile, index }: Paid): Chronicle {
  const placed = outcome(apply(NOMADIC, chronicle, { type: 'play', index, aim: 'tile', tile }));
  if (placed === chronicle) throw new Error(`${TRAPPING} is refused on ${tileKey(tile)}`);
  return placed;
}

test('the trapping card places trapping on the forest the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = trappingPaid();
  const placed = trappingPlaced(paid);

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
  const paid = trappingPaid();

  await openSaved(page, trappingPlaced(paid));

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
      { text: improvementName(TRAPPING), yields: improvementKind(NOMADIC, TRAPPING).yields },
    ]);

  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  expect(problems).toEqual([]);
});
