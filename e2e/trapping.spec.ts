import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { featurePlaced, gained, improvementPlaced, terraformed } from '../src/rules/cards';
import { cardOf, civilizationOf, firstCivilization } from '../src/rules/catalogue';
import { type FeatureId, neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { featureKind, improvementKind } from '../src/rules/map-kinds';
import { followed, unchanged } from '../src/rules/stages';
import type { CardId, Chronicle } from '../src/rules/state';
import { improvementName } from '../src/ui/text';
import {
  aimed,
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  firstSeed,
  idsOf,
  marksIn,
  openSaved,
  panelRows,
  playedOn,
  playedOut,
  ringedTile,
  settledOn,
  shownCard,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The card that places the improvement, and the improvement it places. */
const TRAPPING = 'trapping';

/** The card that removes the feature. */
const HUNT = 'hunt';

/** The feature the trapping goes on. */
function deer(): FeatureId {
  const { feature } = improvementKind(CATALOGUE, TRAPPING);
  if (feature === undefined) throw new Error(`${TRAPPING} names no feature`);
  return feature;
}

/** A turn 1 whose worker stands on the deer beside the city, a card in the hand and paid for. */
type Paid = { readonly chronicle: Chronicle; readonly tile: TileCoords; readonly index: number };

/**
 * The first seed's turn 1 with the card in hand and a copy of Trapping in the first civilization's
 * deck: the first tile beside the city made the deer's terrain, the deer and the improvements named
 * placed on it, a worker entered there and the card paid for.
 */
function onDeer(card: CardId, improvements: readonly string[]): Paid {
  const first = civilizationOf(CATALOGUE, firstCivilization(CATALOGUE));
  const civilization = { ...first, cards: [...first.cards, TRAPPING] };
  const feature = deer();
  const { terrain } = featureKind(CATALOGUE, feature);
  return firstSeed(`opens turn 1 on ${card} in hand`, (seed) => {
    const opened = settledOn(seed, [], civilization);
    if (!idsOf(opened.hand).includes(card)) return undefined;
    const [tile] = neighbours(cityTileOf(opened));
    let ground =
      tileAt(opened.tiles, tile)?.terrain === terrain
        ? unchanged(opened)
        : terraformed(CATALOGUE, opened, tile, terrain);
    ground = followed(ground, (left) => featurePlaced(CATALOGUE, left, tile, feature));
    for (const improvement of improvements) {
      ground = followed(ground, (left) => improvementPlaced(CATALOGUE, left, tile, improvement));
    }
    ground = followed(ground, (left) => gained(left, cardOf(CATALOGUE, card).cost));
    const chronicle = unitEntered(ground.chronicle, { type: 'worker', faction: 'player', tile });
    return { chronicle, tile, index: idsOf(chronicle.hand).indexOf(card) };
  });
}

test('the trapping card places trapping on the deer the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = onDeer(TRAPPING, []);
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
  const paid = onDeer(TRAPPING, []);

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
  const paid = onDeer(HUNT, [TRAPPING]);
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
