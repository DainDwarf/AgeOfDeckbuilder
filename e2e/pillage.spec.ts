import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { built, terraformed } from '../src/rules/cards';
import { campUnit } from '../src/rules/enemies';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { followed } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  budget,
  campKind,
  chronicleOf,
  cityTileOf,
  endedTurn,
  endTurn,
  onScreen,
  openSaved,
  readings,
  rested,
  secondEra,
  settledOn,
  shownCard,
  standing,
  textOf,
  unitEntered,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The building the farm card builds. */
const FARM = 'farm';

/**
 * Seed 1's turn 1 in the Stone Age, its city settled bare, with the first tile beside the city
 * terraformed into the first terrain the farm names, a farm built there, and a pillager of the
 * camp's entered on it.
 */
function farmBeset(campaign: Campaign): { chronicle: Chronicle; farm: TileCoords } {
  const settled = settledOn(1, [], undefined, secondEra(campaign));
  const [farm] = neighbours(cityTileOf(settled));
  const [terrain] = buildingKind(CATALOGUE, FARM).terrains;
  const pillager = campUnit(CATALOGUE, settled, campKind(settled), farm, 'pillager');
  if (pillager === undefined) throw new Error(`the ${settled.age} camp names no pillager`);
  const farmed = followed(terraformed(CATALOGUE, settled, farm, terrain), (left) =>
    built(CATALOGUE, left, farm, FARM),
  ).chronicle;
  return { chronicle: unitEntered(farmed, pillager), farm };
}

/** The infopanel raised on the tile by a right click, its first card the unit's. */
async function inspected(page: Page, tile: TileCoords): Promise<void> {
  await rested(page);
  const at = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
}

test('a pillager standing on a farm prepares the pillage: the farm’s tile wears the enemy colour and its card reads Pillaging, and at the next end of turn the farm is gone', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const campaign = wonCampaign();
  const { chronicle, farm } = farmBeset(campaign);
  const key = tileKey(farm);
  const prepared = endedTurn(chronicle);
  const pillaged = endedTurn(prepared);

  await openSaved(page, chronicle, campaign);
  expect(await standing(page, `prepared-${key}`)).toBe(false);

  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(prepared);
  const hued = await readings(page, [`prepared-${key}`, `building-${key}`]);
  expect(hued(`prepared-${key}`).fill).toBe(LOOK.enemy);
  expect(hued(`building-${key}`).standing).toBe(true);
  await inspected(page, farm);
  expect(await textOf(page, 'panel-state')).toBe(text('unit-state.pillaging'));

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(pillaged);
  expect(tileAt(pillaged.tiles, farm)?.building).toBeUndefined();
  const bare = await readings(page, [`prepared-${key}`, `building-${key}`]);
  expect([bare(`prepared-${key}`).standing, bare(`building-${key}`).standing]).toEqual([
    false,
    false,
  ]);

  expect(problems).toEqual([]);
});

test('an enemy on the city’s tile prepares the capture: the city’s tile wears the enemy colour and its card reads Capturing', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const settled = settledOn(1);
  const city = cityTileOf(settled);
  const chronicle = unitEntered(
    settled,
    campUnit(CATALOGUE, settled, campKind(settled), city, 'raider'),
  );
  const key = tileKey(city);

  await openSaved(page, chronicle);
  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(endedTurn(chronicle));

  expect((await readings(page, [`prepared-${key}`]))(`prepared-${key}`).fill).toBe(LOOK.enemy);
  await inspected(page, city);
  expect(await textOf(page, 'panel-state')).toBe(text('unit-state.capturing'));

  expect(problems).toEqual([]);
});
