import { expect, test } from '@playwright/test';
import { tileKey } from '../src/rules/map';
import {
  aimed,
  campaignWith,
  click,
  dragOut,
  drawnIn,
  HEAL,
  hurtBesideAnEnemy,
  type MapGroup,
  mapOrder,
  onScreen,
  openSaved,
  rested,
  ringedTile,
  shows,
  watch,
} from './chronicle-screen';

const CAMPAIGN = campaignWith([HEAL]);

/** What the map draws, from the ground up; an aim's rims stand only while a card is aimed. */
const ORDER = [
  'terrain',
  'rivers',
  'ditches',
  'lying',
  'claim-marks',
  'border',
  'buildings',
  'features',
  'improvements',
  'badges',
  'city-marks',
  'yield-dim',
  'prepared',
  'lit',
  'rings',
  'selected',
  'aim-lit',
  'path',
  'units',
  'yields',
  'thresholds',
  'infopanel',
  'tooltip-map',
];

test('what the map draws stands in one order whatever is switched on, a ringed unit among the units', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index, city } = hurtBesideAnEnemy(CAMPAIGN);
  const cityKey = tileKey(city);

  await openSaved(page, chronicle, CAMPAIGN);

  let before: MapGroup[] | undefined;
  /**
   * The map's groups in the order, each on the stratum it stood on in the state before, and the
   * city's unit and every unit ringed standing in the units group; the tiles ringed.
   */
  const inOrder = async (aiming: boolean): Promise<string[]> => {
    await rested(page);
    const { groups, rings, markersIn } = await mapOrder(page, [cityKey]);
    expect(groups.map(({ name }) => name)).toEqual(
      ORDER.filter((name) => aiming || name !== 'aim-lit'),
    );
    const was = before ?? groups;
    expect(groups.filter(({ name }) => was.some((one) => one.name === name))).toEqual(was);
    expect(markersIn).toEqual(Object.fromEntries([cityKey, ...rings].map((key) => [key, 'units'])));
    before = groups;
    return rings;
  };

  await click(page, `tile-${cityKey}`);
  await expect.poll(() => ringedTile(page)).toBe(cityKey);
  expect(await inOrder(false)).toEqual([cityKey]);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  expect(await inOrder(false)).toEqual([cityKey]);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(false);
  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await inOrder(false)).toEqual([]);

  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  await dragOut(page, index);
  await aimed(page);
  expect(await inOrder(true)).toContain(cityKey);

  expect(problems).toEqual([]);
});

test('a unit being dragged is drawn over the other units', async ({ page }) => {
  const problems = watch(page);
  const { chronicle, city, enemy } = hurtBesideAnEnemy(CAMPAIGN);
  const [carried, other] = [city, enemy].map((tile) => `unit-${tileKey(tile)}`);

  await openSaved(page, chronicle, CAMPAIGN);
  // At rest the unit carried is drawn under the other, so the drag is what puts it over.
  await rested(page);
  const resting = await drawnIn(page, 'units');
  expect(resting).toEqual(expect.arrayContaining([carried, other]));
  expect(resting.indexOf(carried)).toBeLessThan(resting.indexOf(other));

  const from = await onScreen(page, `tile-${tileKey(city)}`);
  const onto = await onScreen(page, `tile-${tileKey(enemy)}`);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(onto.x, onto.y, { steps: 5 });
  await rested(page);
  const dragged = await drawnIn(page, 'units');
  expect(dragged).toEqual(expect.arrayContaining([carried, other]));
  expect(dragged.indexOf(carried)).toBeGreaterThan(dragged.indexOf(other));

  expect(problems).toEqual([]);
});
