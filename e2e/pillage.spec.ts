import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { built, terraformed } from '../src/rules/cards';
import { ageOf } from '../src/rules/catalogue';
import { enemyEntering, type PreparedAs, preparedAs } from '../src/rules/enemies';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { chartedAt, inSight, unitShown } from '../src/rules/sight';
import { followed } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { LOOK, multiplied } from '../src/ui/look';
import { glyphFileOf } from '../src/ui/marks';
import { text } from '../src/ui/text';
import {
  type BadgeShown,
  budget,
  campKind,
  chronicleOf,
  endedTurn,
  endTurn,
  freeGround,
  onScreen,
  openSaved,
  playerCityTile,
  readingsAndUnitMarks,
  rested,
  settledOn,
  shownCard,
  textOf,
  unitEntered,
  unitMarksOn,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The building the farm card builds. */
const FARM = 'farm';

/** The script a pillager carries. */
const PILLAGER = 'pillager';

/**
 * The chronicle with the tile terraformed into the first terrain the farm names, a farm built there,
 * and an enemy of the camp's kind entered on it as a pillager.
 */
function farmedUnderAPillager(chronicle: Chronicle, farm: TileCoords): Chronicle {
  const [terrain] = buildingKind(CATALOGUE, FARM).terrains;
  const pillager = enemyEntering(campKind(chronicle), PILLAGER, farm);
  const farmed = followed(terraformed(CATALOGUE, chronicle, farm, terrain), (left) =>
    built(CATALOGUE, left, farm, FARM),
  ).chronicle;
  return unitEntered(farmed, pillager);
}

/** Seed 1's turn 1 launched from the campaign, its city settled bare, the first tile beside the city farmed under a pillager. */
function farmBeset(campaign: Campaign): { chronicle: Chronicle; farm: TileCoords } {
  const settled = settledOn(1, [], campaign);
  const [farm] = neighbours(playerCityTile(settled));
  return { chronicle: farmedUnderAPillager(settled, farm), farm };
}

/**
 * Seed 1's turn 1 launched from the campaign, its city settled bare, the first ground four tiles from
 * the city out of its sight farmed under a pillager, the turn ended, which prepares the pillage
 * unseen, and the tile charted after: the map keeps the pillager there as last seen.
 */
function farmBesetInFog(campaign: Campaign): { chronicle: Chronicle; farm: TileCoords } {
  const settled = settledOn(1, [], campaign);
  const seen = inSight(CATALOGUE, settled);
  const farm = freeGround(settled, campKind(settled), 4).find((tile) => !seen.has(tileKey(tile)));
  if (farm === undefined)
    throw new Error('seed 1 leaves no ground unseen four tiles from its city');
  const prepared = endedTurn(farmedUnderAPillager(settled, farm));
  return { chronicle: chartedAt(CATALOGUE, prepared, farm), farm };
}

/** What the prepare of the unit standing on the tile lands as, as the rules read it. */
function preparesOn(chronicle: Chronicle, tile: TileCoords): PreparedAs | undefined {
  const unit = unitAt(chronicle.units, tile);
  return unit === undefined ? undefined : preparedAs(chronicle, unit);
}

/** The badge an enemy wears for what its prepare lands as, every colour multiplied by the shade. */
function enemyBadge(prepares: PreparedAs | undefined, shade = 0xffffff): BadgeShown {
  if (prepares === undefined) throw new Error('the enemy has prepared nothing');
  return {
    disc: multiplied(LOOK.enemy, shade),
    rim: multiplied(LOOK.mapOutline, shade),
    glyph: glyphFileOf(prepares),
    ink: multiplied(LOOK.unitBadgeInk, shade),
  };
}

/** The infopanel raised on the tile by a right click, its first card the unit's. */
async function inspected(page: Page, tile: TileCoords): Promise<void> {
  await rested(page);
  const at = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
}

test('a pillager standing on a farm prepares the pillage: it wears the badge in the enemy colour with the flame and its card reads Pillaging, and at the next end of turn the farm is gone and the pillager wears only what it prepares next', async ({
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
  const [unprepared] = await unitMarksOn(page, [farm]);
  expect(unprepared).toBeDefined();
  expect(unprepared?.badge).toBeUndefined();

  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(prepared);
  const badged = await readingsAndUnitMarks(page, [`building-${key}`], [farm]);
  expect(badged.unitMarkOn(farm)?.badge).toEqual(enemyBadge(preparesOn(prepared, farm)));
  expect(badged.read(`building-${key}`).standing).toBe(true);
  await inspected(page, farm);
  expect(await textOf(page, 'panel-state')).toBe(text('unit-state.pillaging'));

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(pillaged);
  expect(tileAt(pillaged.tiles, farm)?.building).toBeUndefined();
  // Its pillage landed, the pillager walks on in the same enemy phase and may prepare again there.
  const pillager = pillaged.units.find((unit) => unit.id === unitAt(prepared.units, farm)?.id);
  if (pillager === undefined) throw new Error('the pillager did not live through its pillage');
  const next = preparesOn(pillaged, pillager.tile);
  const bare = await readingsAndUnitMarks(page, [`building-${key}`], [pillager.tile]);
  expect(bare.unitMarkOn(pillager.tile)).toBeDefined();
  expect(bare.unitMarkOn(pillager.tile)?.badge).toEqual(
    next === undefined ? undefined : enemyBadge(next),
  );
  expect(bare.read(`building-${key}`).standing).toBe(false);

  expect(problems).toEqual([]);
});

test('an enemy on the city’s tile prepares the capture: it wears the badge in the enemy colour with the flag and its card reads Capturing', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const settled = settledOn(1);
  const city = playerCityTile(settled);
  const { raider } = ageOf(CATALOGUE, settled.age).camp.scripts;
  const chronicle = unitEntered(settled, enemyEntering(campKind(settled), raider, city));
  const prepared = endedTurn(chronicle);

  await openSaved(page, chronicle);
  await endTurn(page);
  await expect.poll(() => chronicleOf(page)).toEqual(prepared);

  const [mark] = await unitMarksOn(page, [city]);
  expect(mark?.badge).toEqual(enemyBadge(preparesOn(prepared, city)));
  await inspected(page, city);
  expect(await textOf(page, 'panel-state')).toBe(text('unit-state.capturing'));

  expect(problems).toEqual([]);
});

test('a pillager a tile in fog keeps as last seen prepared wears its badge darkened with the rest of it', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const { chronicle, farm } = farmBesetInFog(campaign);
  const snapshot = chronicle.snapshots.find((one) => tileKey(one) === tileKey(farm));
  const kept = unitShown(chronicle.units, { tile: farm, snapshot });
  if (snapshot === undefined || kept === undefined) {
    throw new Error('no snapshot of the farm keeps a unit');
  }
  expect(inSight(CATALOGUE, chronicle).has(tileKey(farm))).toBe(false);

  await openSaved(page, chronicle, campaign);

  const [mark] = await unitMarksOn(page, [farm]);
  expect(mark?.badge).toEqual(enemyBadge(preparedAs(chronicle, kept), LOOK.fog));

  expect(problems).toEqual([]);
});
