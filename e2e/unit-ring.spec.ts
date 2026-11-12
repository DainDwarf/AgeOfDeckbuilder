import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf } from '../src/rules/cards';
import { cardOf, unitKind } from '../src/rules/catalogue';
import { admitted } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { unitDamaged } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import {
  aimed,
  bareTile,
  campaignWith,
  claimedAt,
  click,
  dragOut,
  enemyBesideCity,
  firstSeed,
  freeFor,
  idsOf,
  openSaved,
  paidFor,
  playerCityTile,
  ringedTile,
  ringsAndRims,
  settledOn,
  shows,
  unitEntered,
  WARRIOR,
  watch,
} from './chronicle-screen';

/** The card aimed at a unit. */
const HEAL = 'heal';

const CAMPAIGN = campaignWith([HEAL]);

/**
 * The first seed's turn 1 with the heal card in hand and paid for, a warrior of the player's hurt on
 * the city's tile and another on a tile beside it the city has claimed, an enemy beside the city,
 * and a bare tile nobody stands on.
 */
function hurtBesideAnEnemy(): {
  chronicle: Chronicle;
  index: number;
  city: TileCoords;
  enemy: TileCoords;
  bare: TileCoords;
} {
  return firstSeed(`opens turn 1 on ${HEAL} in hand, an enemy beside its city`, (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    if (!idsOf(opened.hand).includes(HEAL)) return undefined;
    const city = playerCityTile(opened);
    const warrior = unitKind(CATALOGUE, WARRIOR);
    const [claim] = neighbours(city).flatMap((tile) => {
      const claimed = freeFor(opened, warrior, tile) ? claimedAt(opened, tile) : undefined;
      return claimed === undefined ? [] : [{ tile, claimed }];
    });
    if (claim === undefined) return undefined;
    let guarded = claim.claimed;
    for (const tile of [city, claim.tile]) {
      const standing = unitEntered(guarded, { type: WARRIOR, faction: 'player', tile });
      guarded = unitDamaged(standing, tile, 1).chronicle;
    }
    const beset = enemyBesideCity(guarded);
    if (beset === undefined) return undefined;
    const bare = bareTile(beset.chronicle);
    if (unitAt(beset.chronicle.units, bare) !== undefined) return undefined;
    const { chronicle, index } = paidFor(beset.chronicle, HEAL);
    return { chronicle, index, city, enemy: beset.enemy.tile, bare };
  });
}

test('the unit on the selected tile wears the ring in place of the tile’s rim, whoever’s it is, and a bare tile or one in city mode wears the rim', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, enemy, bare } = hurtBesideAnEnemy();
  const [cityKey, enemyKey, bareKey] = [city, enemy, bare].map(tileKey);

  await openSaved(page, chronicle, CAMPAIGN);

  await click(page, `tile-${enemyKey}`);
  await expect.poll(() => ringedTile(page)).toBe(enemyKey);
  expect(await ringsAndRims(page)).toEqual({ rings: [enemyKey], rims: [] });

  await click(page, `tile-${bareKey}`);
  await expect.poll(() => ringedTile(page)).toBe(bareKey);
  expect(await ringsAndRims(page)).toEqual({ rings: [], rims: [bareKey] });

  await click(page, `tile-${cityKey}`);
  await expect.poll(() => ringedTile(page)).toBe(cityKey);
  expect(await ringsAndRims(page)).toEqual({ rings: [cityKey], rims: [] });

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  await click(page, `tile-${cityKey}`);
  await expect.poll(() => ringedTile(page)).toBe(cityKey);
  expect(await ringsAndRims(page)).toEqual({ rings: [], rims: [cityKey] });

  expect(problems).toEqual([]);
});

test('a card aimed at a unit rings each unit its aim admits and lights no tile', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index } = hurtBesideAnEnemy();
  const aim = aimOf(cardOf(CATALOGUE, HEAL));
  if (aim.aim !== 'unit') throw new Error(`${HEAL} is aimed at no unit`);
  const admits = admitted(CATALOGUE, chronicle, aim).map(tileKey).sort();

  await openSaved(page, chronicle, CAMPAIGN);
  await dragOut(page, index);
  await aimed(page);

  expect(await ringsAndRims(page)).toEqual({ rings: admits, rims: [] });
  expect(problems).toEqual([]);
});
