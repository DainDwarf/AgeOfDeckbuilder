import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { terraformed } from '../src/rules/cards';
import {
  distance,
  neighbours,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
  type YieldPart,
  yieldParts,
} from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import { addedToDrawPileTop } from '../src/rules/schedule';
import { followed } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { buildingName, terrainName, text } from '../src/ui/text';
import {
  admits,
  aimed,
  chronicleOf,
  cityTileOf,
  claimedAt,
  click,
  dragOut,
  drawnFaces,
  endedTurn,
  firstSeed,
  glyphs,
  glyphsOf,
  idsOf,
  marksIn,
  openSaved,
  type Paid,
  paidFor,
  panelRows,
  playedOn,
  playedOut,
  readings,
  settledOn,
  shownCard,
  shows,
  unitEntered,
  WORKER,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that builds the Fishery, and the building it builds. */
const FISHERY = 'fishery';

/** The card that embarks the worker the Fishery is built through. */
const EMBARK = 'embark';

const CIVILIZATION = withCard(EMBARK);

/** The terrain the Fishery stands on, and what it gives the tiles beside it. */
const { SHORE, GIVES } = (() => {
  const { terrains, givesBeside } = buildingKind(CATALOGUE, FISHERY);
  if (givesBeside === undefined) throw new Error(`${FISHERY} gives nothing beside it`);
  return { SHORE: terrains[0], GIVES: givesBeside };
})();

/** The line under the Fishery's row, naming the terrain it gives to. */
const LINE = text('panel.beside', { terrain: terrainName(GIVES.terrain) });

/**
 * Turn 2 of the first seed whose turn 1 holds Embark, two tiles beside the city and each other made
 * coast, the first claimed and a worker embarked onto it: the Fishery drawn and paid for, its tile,
 * and the coast beside it outside the border.
 */
function fisheryAdmitted(): Paid & { readonly beside: TileCoords } {
  return firstSeed(`opens turn 1 on ${EMBARK} in hand with ground to make coast`, (seed) => {
    const opened = settledOn(seed, [], CIVILIZATION);
    const city = cityTileOf(opened);
    if (!idsOf(opened.hand).includes(EMBARK) || unitAt(opened.units, city) !== undefined) {
      return undefined;
    }
    for (const tile of neighbours(city)) {
      for (const beside of neighbours(city).filter((other) => distance(other, tile) === 1)) {
        const wet = followed(terraformed(CATALOGUE, opened, tile, SHORE), (left) =>
          terraformed(CATALOGUE, left, beside, GIVES.terrain),
        ).chronicle;
        if (tileAt(wet.tiles, tile)?.terrain !== SHORE) continue;
        if (tileAt(wet.tiles, beside)?.terrain !== GIVES.terrain) continue;
        const claimed = claimedAt(wet, tile);
        if (claimed === undefined) continue;
        const manned = unitEntered(claimed, { type: WORKER, faction: 'player', tile: city });
        const embarking = paidFor(manned, EMBARK);
        if (!admits(embarking.chronicle, embarking.index, tile)) continue;
        const afloat = playedOn(embarking.chronicle, embarking.index, tile);
        const next = endedTurn(addedToDrawPileTop(CATALOGUE, afloat, FISHERY).chronicle);
        if (next.ending !== undefined) continue;
        const paid = paidFor(next, FISHERY);
        if (admits(paid.chronicle, paid.index, tile)) return { ...paid, tile, beside };
      }
    }
    return undefined;
  });
}

/** What a tile's yield is made of on the faces the map draws of the chronicle: its part of the kind asked. */
function partOf(
  chronicle: Chronicle,
  at: TileCoords,
  kind: YieldPart['kind'],
): YieldPart | undefined {
  const faces = drawnFaces(chronicle);
  const face = faces.find((drawn) => tileKey(drawn) === tileKey(at));
  if (face === undefined) throw new Error(`the map draws no face of ${tileKey(at)}`);
  return yieldParts(CATALOGUE, face, tilesBeside(faces)).find((part) => part.kind === kind);
}

test('the Fishery played at the coast tile inside the border its embarked worker stands on builds a Fishery there', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, index } = fisheryAdmitted();
  const built = playedOn(chronicle, index, tile);

  await openSaved(page, chronicle);
  const before = await marksIn(page, 'buildings');
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(built);
  expect(tileAt(built.tiles, tile)?.building).toBe(FISHERY);
  expect(unitAt(built.units, tile)?.embarked).toBe(true);
  expect(await marksIn(page, 'buildings')).toBe(before + 1);
  expect(problems).toEqual([]);
});

test('a Fishery built gives the coast beside it what the overlay glyphs and its terrain card reads, and reads its row and its line on its own tile’s building card', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, index, beside } = fisheryAdmitted();
  const built = playedOn(chronicle, index, tile);
  const given = partOf(built, beside, 'beside');
  const own = partOf(built, tile, 'building');
  if (given === undefined) throw new Error(`the ${FISHERY} gives nothing to ${tileKey(beside)}`);
  if (own === undefined) throw new Error(`no building stands on ${tileKey(tile)}`);

  await openSaved(page, built);
  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await glyphs(page)).toEqual(glyphsOf(drawnFaces(built)));

  const seen = await readings(page, [`tile-${tileKey(beside)}`, `tile-${tileKey(tile)}`]);
  const coast = seen(`tile-${tileKey(beside)}`).onScreen;
  const shore = seen(`tile-${tileKey(tile)}`).onScreen;

  // Nothing stands on the coast beside and nothing is built there: its terrain card comes first.
  await page.mouse.click(coast.x, coast.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  const rows = await panelRows(page);
  expect(rows).toContainEqual({ text: buildingName(FISHERY), yields: given.yields });
  expect(rows).not.toContainEqual({ text: LINE, yields: {} });

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();

  // The embarked worker's card comes first on the Fishery's tile, and the building card after it.
  await page.mouse.click(shore.x, shore.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.mouse.click(shore.x, shore.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  await expect
    .poll(() => panelRows(page))
    .toEqual([
      { text: buildingName(FISHERY), yields: {} },
      { text: buildingName(FISHERY), yields: own.yields },
      { text: LINE, yields: {} },
    ]);

  expect(problems).toEqual([]);
});
