import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { civilizationIn, removedFrom } from '../src/rules/campaign';
import { gained, terraformed } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { neighbours, runsAlong, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { unchanged } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { openingChoices } from '../src/ui/launch-layout';
import { improvementName, text } from '../src/ui/text';
import {
  aimed,
  campaignWith,
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
  riverRows,
  settledOn,
  shownCard,
  unitEntered,
  WORKER,
  watch,
} from './chronicle-screen';

/** The card that places the improvement, and the improvement it places. */
const IRRIGATION = 'irrigation';

/** A new campaign with the card added to its deck and every other card of the deck removed. */
const CAMPAIGN = (() => {
  const added = campaignWith([IRRIGATION]);
  const { civilization } = openingChoices(CATALOGUE, added);
  return civilizationIn(CATALOGUE, added, civilization)
    .cards.filter((card) => card !== IRRIGATION)
    .reduce((left, card) => removedFrom(CATALOGUE, left, civilization, card), added);
})();

/**
 * The first seed's turn 1 with the card alone in its deck, a river running along a tile beside the
 * city: that tile made the first terrain the improvement names, a worker entered on it, and the
 * card's cost gained.
 */
function paidAlongRiver(): { chronicle: Chronicle; tile: TileCoords; index: number } {
  const [terrain] = improvementKind(CATALOGUE, IRRIGATION).terrains;
  return firstSeed('runs a river along a tile beside the city', (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    const tile = neighbours(cityTileOf(opened)).find((at) => runsAlong(opened.rivers, at));
    if (tile === undefined) return undefined;
    const ground =
      tileAt(opened.tiles, tile)?.terrain === terrain
        ? unchanged(opened)
        : terraformed(CATALOGUE, opened, tile, terrain);
    const worked = unitEntered(ground.chronicle, { type: WORKER, faction: 'player', tile });
    const chronicle = gained(worked, cardOf(CATALOGUE, IRRIGATION).cost).chronicle;
    return { chronicle, tile, index: idsOf(chronicle.hand).indexOf(IRRIGATION) };
  });
}

test('the irrigation card places irrigation on the tile a river runs along that the worker stands on', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidAlongRiver();
  const placed = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle, CAMPAIGN);
  const before = await marksIn(page, 'improvements');
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(placed);
  expect(await marksIn(page, 'improvements')).toBe(before + 1);
  expect(problems).toEqual([]);
});

test('the tile irrigation was placed on inspects irrigation on a card of its own, before its terrain with the river giving no yield', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidAlongRiver();

  await openSaved(page, playedOn(paid.chronicle, paid.index, paid.tile), CAMPAIGN);

  // The worker that placed it still stands there, so irrigation's card comes after the unit's.
  await click(page, `tile-${tileKey(paid.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(paid.tile));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('building');

  // Nothing is built on it, so irrigation heads the card and its one row says what it gives.
  await expect
    .poll(() => panelRows(page))
    .toEqual([
      { text: improvementName(IRRIGATION), yields: {} },
      { text: improvementName(IRRIGATION), yields: improvementKind(CATALOGUE, IRRIGATION).yields },
    ]);

  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await expect
    .poll(() => riverRows(page))
    .toEqual([
      { text: text('panel.river'), yields: {} },
      { text: text('panel.no-yield'), yields: {} },
    ]);

  expect(problems).toEqual([]);
});
