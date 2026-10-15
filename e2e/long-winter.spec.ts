import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { apply, outcome } from '../src/rules/chronicle';
import { tileAt, tileKey, tilesBeside } from '../src/rules/map';
import { terrainKind } from '../src/rules/map-kinds';
import { unitDamaged } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { actsAsEnemy, relationsOf, unitAt } from '../src/rules/units';
import { yieldParts } from '../src/rules/yields';
import { capstoneFace } from '../src/ui/face';
import { capstoneLore } from '../src/ui/lore';
import { terrainName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  cityTileOf,
  click,
  drawnFaces,
  endedTurn,
  firstSeed,
  idsOf,
  onScreen,
  openSaved,
  panelRows,
  playedOut,
  readings,
  rested,
  ringedTile,
  settledOn,
  shownCard,
  standing,
  stoppedTurn,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The capstone the spec lands. */
const WINTER = 'long-winter';

/** The hazard its landing adds. */
const COLD_NIGHT = 'cold-night';

/** The chronicle with every unit acting as an enemy killed, as an attack's damage kills one. */
function cleared(chronicle: Chronicle): Chronicle {
  let left = chronicle;
  for (const unit of chronicle.units) {
    if (!actsAsEnemy(unit, relationsOf(chronicle))) continue;
    left = unitDamaged(left, unit.tile, unit.stats.health).chronicle;
  }
  return left;
}

/**
 * The first seed's turn 1 from the campaign, settled bare, each turn ended once `cleared`, up to an
 * open turn before the long winter lands on a city whose terrain gives food; and its end of turn.
 */
function beforeTheWinter(campaign: Campaign): {
  readonly before: Chronicle;
  readonly landed: Chronicle;
} {
  return firstSeed(
    'stands the turn before the long winter on a city whose terrain gives food',
    (seed) => {
      let chronicle = settledOn(seed, [], campaign);
      const { id, turn } = chronicle.timeline.capstone;
      if (id !== WINTER) return undefined;
      while (chronicle.turn < turn - 1 && chronicle.ending === undefined) {
        chronicle = endedTurn(cleared(chronicle));
      }
      if (chronicle.ending !== undefined || chronicle.deals.length > 0) return undefined;
      const tile = tileAt(chronicle.tiles, cityTileOf(chronicle));
      if (tile === undefined || (terrainKind(CATALOGUE, tile.terrain).yields.food ?? 0) === 0) {
        return undefined;
      }
      const landed = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
      return landed.ending === undefined ? { before: chronicle, landed } : undefined;
    },
  );
}

test('the long winter’s landing raises its card, adds its Cold nights to the discard pile, and the city’s tile reads no food of its terrain', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { before, landed } = beforeTheWinter(campaign);
  const city = cityTileOf(landed);
  const faces = drawnFaces(landed);
  const face = faces.find((drawn) => tileKey(drawn) === tileKey(city));
  if (face === undefined) throw new Error('the map draws no face of the city’s tile');
  const terrain = yieldParts(CATALOGUE, landed, face, tilesBeside(faces)).find(
    (part) => part.kind === 'terrain',
  );
  const added = idsOf(landed.discardPile).filter((id) => id === COLD_NIGHT);
  expect(terrain?.yields.food).toBeUndefined();
  expect(idsOf(before.discardPile)).not.toContain(COLD_NIGHT);
  expect(added.length).toBe(capstoneFace(CATALOGUE, landed).reading.count);

  await openSaved(page, before, campaign);
  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  const shown = await readings(page, ['capstone-lore', 'capstone-card-0']);
  expect([shown('capstone-lore').text, shown('capstone-card-0').card]).toEqual([
    capstoneLore(WINTER, 'landing'),
    WINTER,
  ]);
  expect(shown('capstone-card-0').rules).toBe(capstoneFace(CATALOGUE, landed).rules);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(landed);

  // The city's tile steps its unit, if one stands there, then the city, then its terrain.
  await rested(page);
  const at = await onScreen(page, `tile-${tileKey(city)}`);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(city));
  const steps = [
    ...(unitAt(landed.units, city) === undefined ? [] : ['unit']),
    'building',
    'terrain',
  ];
  for (const card of steps) {
    await page.keyboard.press('i');
    await expect.poll(() => shownCard(page)).toBe(card);
  }
  expect(await panelRows(page)).toContainEqual({
    text: terrainName(face.terrain),
    yields: terrain?.yields,
  });

  expect(problems).toEqual([]);
});
