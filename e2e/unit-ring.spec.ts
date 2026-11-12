import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import {
  aimed,
  campaignWith,
  click,
  dragOut,
  HEAL,
  hurtBesideAnEnemy,
  openSaved,
  ringedTile,
  ringsAndRims,
  shows,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([HEAL]);

test('the unit on the selected tile wears the ring in place of the tile’s rim, whoever’s it is, and a bare tile or one in city mode wears the rim', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, enemy, bare } = hurtBesideAnEnemy(CAMPAIGN);
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
  const { chronicle, index } = hurtBesideAnEnemy(CAMPAIGN);
  const aim = aimOf(cardOf(CATALOGUE, HEAL));
  if (aim.aim !== 'unit') throw new Error(`${HEAL} is aimed at no unit`);
  const admits = admitted(CATALOGUE, chronicle, aim).map(tileKey).sort();

  await openSaved(page, chronicle, CAMPAIGN);
  await dragOut(page, index);
  await aimed(page);

  expect(await ringsAndRims(page)).toEqual({ rings: admits, rims: [] });
  expect(problems).toEqual([]);
});
