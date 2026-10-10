import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { improvementName } from '../src/ui/text';
import {
  aimed,
  campaignWith,
  chronicleOf,
  click,
  dragOut,
  HUNT,
  marksIn,
  openSaved,
  paidOnDeer,
  panelRows,
  playedOn,
  playedOut,
  ringedTile,
  shownCard,
  TRAPPING,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([TRAPPING]);

test('the trapping card places trapping on the deer the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, [], CAMPAIGN);
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

test('the tile trapping was placed on inspects trapping on a card of its own, before its terrain', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, [], CAMPAIGN);

  await openSaved(page, playedOn(paid.chronicle, paid.index, paid.tile), CAMPAIGN);

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
  const paid = paidOnDeer(HUNT, [TRAPPING], CAMPAIGN);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle, CAMPAIGN);
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
