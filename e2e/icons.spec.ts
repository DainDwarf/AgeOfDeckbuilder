import { expect, type Page, test } from '@playwright/test';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { unitAt } from '../src/rules/units';
import {
  aimed,
  campaignThenChronicle,
  campaignWith,
  capstoneClosed,
  click,
  HUNT,
  onDeer,
  onFeature,
  openSaved,
  paidOnGround,
  playerCityTile,
  pressContinue,
  readings,
  standing,
  TRAPPING,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([TRAPPING]);

/**
 * Turn 1 with Hunt in hand and paid for, the deer on the first tile beside the city, and trapping
 * placed on that same feature on another tile beside it that nothing stands or is built on.
 */
const PAID = paidOnGround(
  HUNT,
  (opened) => {
    const deer = onDeer(opened, []);
    const feature = tileAt(deer.chronicle.tiles, deer.tile)?.feature;
    const trapped = neighbours(playerCityTile(opened)).find(
      (tile) =>
        unitAt(deer.chronicle.units, tile) === undefined &&
        tileAt(deer.chronicle.tiles, tile)?.building === undefined,
    );
    if (feature === undefined || trapped === undefined) return undefined;
    return { chronicle: onFeature(deer.chronicle, trapped, feature, [TRAPPING]), tile: deer.tile };
  },
  CAMPAIGN,
);

/** The tile beside the city trapping was placed on. */
const TRAPPED: TileCoords = (() => {
  const tile = neighbours(playerCityTile(PAID.chronicle)).find((beside) =>
    tileAt(PAID.chronicle.tiles, beside)?.improvements.includes(TRAPPING),
  );
  if (tile === undefined) throw new Error(`no tile beside the city carries ${TRAPPING}`);
  return tile;
})();

/** The deer's disc and icon, then trapping's pale disc and what it wears. */
const DISCS = [
  `feature-disc-${tileKey(PAID.tile)}`,
  `feature-${tileKey(PAID.tile)}`,
  `improvement-disc-${TRAPPING}-${tileKey(TRAPPED)}`,
  `improvement-${TRAPPING}-${tileKey(TRAPPED)}`,
];

/** What lies on the ground of the two tiles: the deer's herd, and trapping's painting. */
const GROUND = [
  `herd-${tileKey(PAID.tile)}-0`,
  `improvement-painting-${TRAPPING}-alone-${tileKey(TRAPPED)}`,
];

const WELL = 'icons-button-well';

/** Which of the discs and of what lies on the ground stand, and whether the button is sunk, in one question. */
async function shown(page: Page): Promise<{ discs: boolean[]; ground: boolean[]; sunk: boolean }> {
  const seen = await readings(page, [...DISCS, ...GROUND, WELL]);
  return {
    discs: DISCS.map((name) => seen(name).standing),
    ground: GROUND.map((name) => seen(name).standing),
    sunk: seen(WELL).standing,
  };
}

const DISCS_SHOWN = { discs: [true, true, true, true], ground: [true, true], sunk: true };
const DISCS_HIDDEN = { discs: [false, false, false, false], ground: [true, true], sunk: false };

test('the Icons button hides every disc of the row and shows them again, the ground left as it lies', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, PAID.chronicle, CAMPAIGN);
  expect(await shown(page)).toEqual(DISCS_SHOWN);

  await click(page, 'icons-button');
  await expect.poll(() => shown(page)).toEqual(DISCS_HIDDEN);

  await click(page, 'icons-button');
  await expect.poll(() => shown(page)).toEqual(DISCS_SHOWN);

  expect(problems).toEqual([]);
});

test('the icons key hides and shows the discs as the button does', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, PAID.chronicle, CAMPAIGN);

  await page.keyboard.press('f');
  await expect.poll(() => shown(page)).toEqual(DISCS_HIDDEN);

  await page.keyboard.press('f');
  await expect.poll(() => shown(page)).toEqual(DISCS_SHOWN);

  expect(problems).toEqual([]);
});

test('a chronicle left with its discs hidden opens again on them, Continue opening it as it stands', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, PAID.chronicle, CAMPAIGN);
  await page.keyboard.press('f');
  await expect.poll(() => shown(page)).toEqual(DISCS_HIDDEN);

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await campaignThenChronicle(page);
  await pressContinue(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await capstoneClosed(page);
  expect(await shown(page)).toEqual(DISCS_SHOWN);

  expect(problems).toEqual([]);
});

test('a press on the Icons button lets the card being aimed go, and the icons key leaves it aimed', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, PAID.chronicle, CAMPAIGN);
  await click(page, `hand-${PAID.index}`);
  await aimed(page);

  await page.keyboard.press('f');
  await expect.poll(() => shown(page)).toEqual(DISCS_HIDDEN);
  expect(await standing(page, 'aim')).toBe(true);

  await click(page, 'icons-button');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await shown(page)).toEqual(DISCS_SHOWN);

  expect(problems).toEqual([]);
});
