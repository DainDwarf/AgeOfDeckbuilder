import { expect, type Page, test } from '@playwright/test';
import { type TileCoords, tileKey } from '../src/rules/map';
import {
  aimed,
  campaignWith,
  chronicleOf,
  click,
  dragOut,
  HUNT,
  openSaved,
  paidOnDeer,
  panelFace,
  playedOn,
  playedOut,
  readings,
  ringedTile,
  shownCard,
  TRAPPING,
  terrainRead,
  terrainSeen,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([TRAPPING]);

/**
 * Whether trapping's pale disc and the picture on it stand on the tile, and whether its feature's
 * own disc and icon do, read in one question.
 */
async function standingOn(
  page: Page,
  tile: TileCoords,
): Promise<{ trapping: boolean[]; feature: boolean[] }> {
  const key = tileKey(tile);
  const trapping = [`improvement-disc-${TRAPPING}-${key}`, `improvement-${TRAPPING}-${key}`];
  const feature = [`feature-disc-${key}`, `feature-${key}`];
  const seen = await readings(page, [...trapping, ...feature]);
  const stand = (names: string[]): boolean[] => names.map((name) => seen(name).standing);
  return { trapping: stand(trapping), feature: stand(feature) };
}

test('the trapping card places trapping on the deer the worker stands on', async ({ page }) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, [], CAMPAIGN);
  const placed = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle, CAMPAIGN);
  expect((await standingOn(page, paid.tile)).trapping).toEqual([false, false]);
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(placed);
  expect((await standingOn(page, paid.tile)).trapping).toEqual([true, true]);
  expect(problems).toEqual([]);
});

test('the tile trapping was placed on names trapping on its terrain card, which reads what the tile gives with it', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidOnDeer(TRAPPING, [], CAMPAIGN);
  const placed = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, placed, CAMPAIGN);

  // The worker that placed it still stands there and nothing is built there: the terrain card comes
  // after the unit's.
  await click(page, `tile-${tileKey(paid.tile)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(paid.tile));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');
  const face = await panelFace(page);
  expect(terrainSeen(face)).toEqual(terrainRead(placed, paid.tile));
  expect(face.references).toContainEqual({ kind: 'improvement', id: TRAPPING });

  expect(problems).toEqual([]);
});

test('the hunt card played on a trapped deer removes the deer and the trapping with it', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = paidOnDeer(HUNT, [TRAPPING], CAMPAIGN);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);

  await openSaved(page, paid.chronicle, CAMPAIGN);
  expect((await standingOn(page, paid.tile)).trapping).toEqual([true, true]);
  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await standingOn(page, paid.tile)).toEqual({
    trapping: [false, false],
    feature: [false, false],
  });
  expect(problems).toEqual([]);
});
