import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf, technologyOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { neutralBuilding } from '../src/rules/map-kinds';
import { freshCampaign } from '../src/rules/save';
import { buildingName } from '../src/ui/text';
import { learnedWithNeeds } from '../tools/learned-with-needs';
import {
  consoleKey,
  enter,
  inside,
  mapFrame,
  marksIn,
  openSaved,
  rested,
  settledOn,
  shownCard,
  sitesOf,
  standing,
  textOf,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** The age whose content names the neutral. */
const AGE = (() => {
  const found = Object.keys(CATALOGUE.ages).find((age) => ageOf(CATALOGUE, age).neutral);
  if (found === undefined) throw new Error('no age of the catalogue names the neutral');
  return found;
})();

/** A new campaign with the technology that unlocks the age learned with its needs. */
const CAMPAIGN = (() => {
  const unlocker = Object.keys(CATALOGUE.technologies).find(
    (id) => technologyOf(CATALOGUE, id).unlocks.age === AGE,
  );
  if (unlocker === undefined) throw new Error(`no technology unlocks the age ${AGE}`);
  return learnedWithNeeds(CATALOGUE, freshCampaign(CATALOGUE), [unlocker]);
})();

/**
 * Carries the map by right-button drags from the middle of its frame, a third of the frame at most
 * each, until the tile stands in the frame's middle half.
 */
async function broughtIn(page: Page, coord: TileCoords): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const half = {
    x: frame.x + frame.width / 4,
    y: frame.y + frame.height / 4,
    width: frame.width / 2,
    height: frame.height / 2,
  };
  const step = (off: number, span: number): number => Math.max(-span / 3, Math.min(span / 3, off));
  for (let pass = 0; pass < 6; pass++) {
    const at = await tileOnScreen(page, coord);
    if (inside(at, half)) return;
    const to = {
      x: middle.x + step(middle.x - at.x, frame.width),
      y: middle.y + step(middle.y - at.y, frame.height),
    };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move((middle.x + to.x) / 2, (middle.y + to.y) / 2, { steps: 5 });
    await page.mouse.move(to.x, to.y, { steps: 5 });
    await page.mouse.up({ button: 'right' });
    await rested(page);
  }
  throw new Error(`the map never carried ${tileKey(coord)} into the middle of its frame`);
}

test('the map draws the neutral’s city once the uncharted veil is off, among the camps, the sites and the city, and its tile inspected heads its building card with its name', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1, [], CAMPAIGN);
  const { neutral } = opened;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const building = neutralBuilding(CATALOGUE, ageOf(CATALOGUE, AGE), `the age ${AGE}`);
  const camp = ageOf(CATALOGUE, opened.age).camp.building;
  const camps = opened.tiles.filter((tile) => tile.building === camp);
  const mark = `building-${tileKey(neutral.city)}`;
  expect(opened.age).toBe(AGE);

  await openSaved(page, opened, CAMPAIGN);
  expect(await standing(page, mark)).toBe(false);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  expect(await standing(page, mark)).toBe(true);
  // The whole disc drawn, the buildings on it are the camps, the sites, the neutral's and the city's.
  expect(await marksIn(page, 'buildings')).toBe(camps.length + sitesOf(opened).length + 2);

  await broughtIn(page, neutral.city);
  const at = await tileOnScreen(page, neutral.city);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await textOf(page, 'panel-name')).toBe(buildingName(building));

  expect(problems).toEqual([]);
});
