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
  litFor,
  neutralInFog,
  openSaved,
  readings,
  ringsAndRims,
  type SelectionShown,
  selectionShown,
  shows,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([HEAL]);

/** The unit on the tile of that key selected, ringed and lighting `lit`, nothing inspected. */
function unitOn(key: string, lit: string[] = []): SelectionShown {
  return { selected: key, rings: [key], rims: [], lit, card: undefined };
}

/** The tile of that key selected, wearing the rim and lighting nothing, nothing inspected. */
function tileOn(key: string): SelectionShown {
  return { selected: key, rings: [], rims: [key], lit: [], card: undefined };
}

/** Nothing selected and nothing inspected. */
const NOTHING: SelectionShown = {
  selected: undefined,
  rings: [],
  rims: [],
  lit: [],
  card: undefined,
};

test('a selected unit wears the ring in place of its tile’s rim, whoever’s it is, and a bare tile or one selected in city mode wears the rim', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, enemy, bare } = hurtBesideAnEnemy(CAMPAIGN);
  const [cityKey, enemyKey, bareKey] = [city, enemy, bare].map(tileKey);

  await openSaved(page, chronicle, CAMPAIGN);

  await click(page, `tile-${enemyKey}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(enemyKey));

  await click(page, `tile-${bareKey}`);
  await expect.poll(() => selectionShown(page)).toEqual(tileOn(bareKey));

  await click(page, `tile-${cityKey}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(cityKey, litFor(chronicle, city)));

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  await click(page, `tile-${cityKey}`);
  await expect.poll(() => selectionShown(page)).toEqual(tileOn(cityKey));

  expect(problems).toEqual([]);
});

test('successive left clicks on a tile a unit stands on select the unit, its tile and the unit again, whoever’s it is, and each switch drops the inspection', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, enemy } = hurtBesideAnEnemy(CAMPAIGN);
  const key = tileKey(enemy);

  await openSaved(page, chronicle, CAMPAIGN);

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(key));
  await page.keyboard.press('i');
  await expect.poll(() => selectionShown(page)).toEqual({ ...unitOn(key), card: 'unit' });

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(tileOn(key));

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(key));

  expect(problems).toEqual([]);
});

test('successive left clicks on the city’s own tile a unit of the player’s stands on select the unit lighting its reach, then the tile lighting nothing, then enter city mode', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city } = hurtBesideAnEnemy(CAMPAIGN);
  const key = tileKey(city);

  await openSaved(page, chronicle, CAMPAIGN);

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(key, litFor(chronicle, city)));

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(tileOn(key));
  expect(await shows(page, 'city-chip')).toBe(false);

  await click(page, `tile-${key}`);
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await selectionShown(page)).toEqual(NOTHING);

  expect(problems).toEqual([]);
});

test('a left click on a tile in fog selects the unit it keeps as last seen, which wears the ring, and successive clicks switch to its tile and back', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, campaign, fog } = neutralInFog();
  const key = tileKey(fog);

  await openSaved(page, chronicle, campaign);

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(key));

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(tileOn(key));

  await click(page, `tile-${key}`);
  await expect.poll(() => selectionShown(page)).toEqual(unitOn(key));

  expect(problems).toEqual([]);
});

test('an inspection of the selection opens on the card of what is selected, the unit’s for a unit and the first of the tile’s own for its tile, and steps through every card the tile holds; one on another tile opens on its first', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, enemy } = hurtBesideAnEnemy(CAMPAIGN);
  const [cityKey, enemyKey] = [city, enemy].map(tileKey);
  const unitSelected = unitOn(cityKey, litFor(chronicle, city));
  const tileSelected = tileOn(cityKey);

  await openSaved(page, chronicle, CAMPAIGN);
  const seen = await readings(page, [`tile-${cityKey}`, `tile-${enemyKey}`]);
  const onCity = seen(`tile-${cityKey}`).onScreen;
  const onEnemy = seen(`tile-${enemyKey}`).onScreen;

  await page.mouse.click(onCity.x, onCity.y);
  await expect.poll(() => selectionShown(page)).toEqual(unitSelected);
  await page.mouse.click(onCity.x, onCity.y, { button: 'right' });
  await expect.poll(() => selectionShown(page)).toEqual({ ...unitSelected, card: 'unit' });

  await page.mouse.click(onCity.x, onCity.y);
  await expect.poll(() => selectionShown(page)).toEqual(tileSelected);
  for (const card of ['building', 'terrain', 'unit', 'building']) {
    await page.keyboard.press('i');
    await expect.poll(() => selectionShown(page)).toEqual({ ...tileSelected, card });
  }

  await page.keyboard.press('Escape');
  await expect.poll(() => selectionShown(page)).toEqual(tileSelected);
  await page.mouse.click(onCity.x, onCity.y, { button: 'right' });
  await expect.poll(() => selectionShown(page)).toEqual({ ...tileSelected, card: 'building' });

  await page.keyboard.press('Escape');
  await expect.poll(() => selectionShown(page)).toEqual(tileSelected);
  await page.mouse.click(onEnemy.x, onEnemy.y, { button: 'right' });
  await expect.poll(() => selectionShown(page)).toEqual({ ...tileSelected, card: 'unit' });

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
