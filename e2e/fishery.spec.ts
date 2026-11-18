import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { type TileCoords, tileAt, tileKey, tilesBeside } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { type YieldPart, yieldParts } from '../src/rules/yields';
import { cardFaceAtStart } from '../src/ui/face';
import {
  aimed,
  campaignWith,
  chronicleOf,
  click,
  dragOut,
  drawnFaces,
  FISHERY,
  fisheryAdmitted,
  glyphs,
  glyphsOf,
  marksIn,
  openSaved,
  panelFace,
  playedOn,
  playedOut,
  RAFT,
  readings,
  shownCard,
  terrainRead,
  terrainSeen,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([RAFT]);

/** What a tile's yield is made of on the faces the map draws of the chronicle: its part of the kind asked. */
function partOf(
  chronicle: Chronicle,
  at: TileCoords,
  kind: YieldPart['kind'],
): YieldPart | undefined {
  const faces = drawnFaces(chronicle);
  const face = faces.find((drawn) => tileKey(drawn) === tileKey(at));
  if (face === undefined) throw new Error(`the map draws no face of ${tileKey(at)}`);
  return yieldParts(CATALOGUE, chronicle, face, tilesBeside(faces)).find(
    (part) => part.kind === kind,
  );
}

test('the Fishery played at the coast tile inside the border its embarked worker stands on builds a Fishery there', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, index } = fisheryAdmitted(CAMPAIGN);
  const built = playedOn(chronicle, index, tile);

  await openSaved(page, chronicle, CAMPAIGN);
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

test('a Fishery built gives the coast beside it what the overlay glyphs and its terrain card reads in its sum and names, and its own tile’s building card is the face of the card that built it', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, index, beside } = fisheryAdmitted(CAMPAIGN);
  const built = playedOn(chronicle, index, tile);
  if (partOf(built, beside, 'beside') === undefined) {
    throw new Error(`the ${FISHERY} gives nothing to ${tileKey(beside)}`);
  }
  const card = chronicle.hand[index].id;

  await openSaved(page, built, CAMPAIGN);
  await page.keyboard.press('Tab');
  await expect.poll(() => glyphs(page)).toEqual(glyphsOf(built, drawnFaces(built)));

  const seen = await readings(page, [`tile-${tileKey(beside)}`, `tile-${tileKey(tile)}`]);
  const coast = seen(`tile-${tileKey(beside)}`).onScreen;
  const shore = seen(`tile-${tileKey(tile)}`).onScreen;

  // Nothing stands on the coast beside and nothing is built there: its terrain card comes first.
  await page.mouse.click(coast.x, coast.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  const coastCard = await panelFace(page);
  expect(terrainSeen(coastCard)).toEqual(terrainRead(built, beside));
  expect(coastCard.references).toContainEqual({ kind: 'building', id: FISHERY });

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();

  // The embarked worker's card comes first on the Fishery's tile, and the building card after it.
  await page.mouse.click(shore.x, shore.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  await page.mouse.click(shore.x, shore.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  const face = await panelFace(page);
  expect([face.card, face.rules]).toEqual([
    card,
    cardFaceAtStart(CATALOGUE, card, undefined).rules,
  ]);

  expect(problems).toEqual([]);
});
