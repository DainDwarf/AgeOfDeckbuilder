import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { chartedAt, inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { LOOK, multiplied } from '../src/ui/look';
import { glyphFileOf } from '../src/ui/marks';
import {
  budget,
  campsOf,
  click,
  openSaved,
  type PointerShown,
  restedOnDeal,
  settledOn,
  sitePointersOn,
  sitesOf,
  stoppedTurn,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** A site's pointer with its sign, both darkened by the tint where one is handed. */
function pointerOf(tint?: number): PointerShown {
  return {
    tint,
    glyph: glyphFileOf('site'),
    ink: tint === undefined ? LOOK.siteSignInk : multiplied(LOOK.siteSignInk, tint),
  };
}

/**
 * Seed 1's turn 1 with a warrior of the player's standing on its first site, in sight, another site
 * and a camp charted out of its sight, in fog; the three tiles.
 */
function sitesAndCamp(): {
  chronicle: Chronicle;
  seen: TileCoords;
  fog: TileCoords;
  camp: TileCoords;
} {
  const bare = settledOn(1);
  const [first, ...others] = sitesOf(bare);
  if (first === undefined) throw new Error('seed 1 deals no site');
  const seen = { q: first.q, r: first.r };
  const manned = unitEntered(bare, { type: WARRIOR, faction: 'player', tile: seen });
  const sight = inSight(CATALOGUE, manned);
  const fog = others.find((site) => !sight.has(tileKey(site)));
  if (fog === undefined) throw new Error('seed 1 deals no second site out of the warrior’s sight');
  const camp = campsOf(manned).find((tile) => !sight.has(tileKey(tile)));
  if (camp === undefined) throw new Error('seed 1 deals no camp out of the warrior’s sight');
  const chronicle = chartedAt(CATALOGUE, chartedAt(CATALOGUE, manned, fog), camp);
  return { chronicle, seen, fog: { q: fog.q, r: fog.r }, camp };
}

test('every site the map draws wears its pointer with the site’s sign, darkened in fog, a camp none, and the Icons button hides them with the discs', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, seen, fog, camp } = sitesAndCamp();
  const tiles = [seen, fog, camp];
  const worn = [pointerOf(), pointerOf(LOOK.fog), undefined];

  await openSaved(page, chronicle);
  expect(await sitePointersOn(page, tiles)).toEqual(worn);

  await click(page, 'icons-button');
  await expect.poll(() => sitePointersOn(page, tiles)).toEqual(tiles.map(() => undefined));

  await click(page, 'icons-button');
  await expect.poll(() => sitePointersOn(page, tiles)).toEqual(worn);

  expect(problems).toEqual([]);
});

test('a site captured loses its pointer, and the site in fog keeps its own', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, seen, fog } = sitesAndCamp();

  await openSaved(page, chronicle);
  await stoppedTurn(page);
  await restedOnDeal(page);
  expect(await sitePointersOn(page, [seen, fog])).toEqual([undefined, pointerOf(LOOK.fog)]);

  expect(problems).toEqual([]);
});
