import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf, technologyOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { neutralBuilding } from '../src/rules/map-kinds';
import { freshCampaign } from '../src/rules/save';
import { chartedAt, inSight } from '../src/rules/sight';
import { type Chronicle, type CityFaction, holderOf } from '../src/rules/state';
import { LOOK } from '../src/ui/look';
import { buildingName } from '../src/ui/text';
import { learnedWithNeeds } from '../tools/learned-with-needs';
import {
  consoleKey,
  endedTurn,
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

/** How many rings of the map's border stand stroked in each colour, by the colour's value. */
function ringsByColour(page: Page): Promise<Record<number, number>> {
  return page.evaluate(() => {
    const border = window.named?.('border')?.object as Phaser.GameObjects.Layer | undefined;
    if (border === undefined) throw new Error('there is no border on the chronicle screen');
    const counts: Record<number, number> = {};
    for (const ring of border.list as Phaser.GameObjects.Polygon[]) {
      counts[ring.strokeColor] = (counts[ring.strokeColor] ?? 0) + 1;
    }
    return counts;
  });
}

/** The colour a city's border is drawn in. */
function borderColour(holder: CityFaction): number {
  switch (holder) {
    case 'player':
      return LOOK.civilization;
    case 'neutral':
      return LOOK.neutral;
  }
}

/** How many rings each colour stands for over the holders named, by the colour's value. */
function colouredBy(holders: readonly (CityFaction | undefined)[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const holder of holders) {
    if (holder === undefined) continue;
    const colour = borderColour(holder);
    counts[colour] = (counts[colour] ?? 0) + 1;
  }
  return counts;
}

/** The chronicle the turns from this one leave once the neutral's city has claimed a tile. */
function neutralClaimed(chronicle: Chronicle): Chronicle {
  let claiming = chronicle;
  while ((claiming.neutral?.held.length ?? 0) < 2) {
    if (claiming.turn > 10) throw new Error('the neutral claims no tile by turn 10');
    claiming = endedTurn(claiming);
  }
  return claiming;
}

test('the map rings every tile the neutral holds in the neutral’s colour beside the city’s own border, a tile drawn in fog wearing the ring it wore when last seen', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1, [], CAMPAIGN);
  const [, first] = neutralClaimed(opened).neutral?.held ?? [];
  if (first === undefined) throw new Error('seed 1 opens with no neutral');
  const claimed = neutralClaimed(chartedAt(CATALOGUE, opened, first));
  const { neutral } = claimed;
  if (neutral === undefined) throw new Error('seed 1 opens with no neutral');
  const seen = inSight(CATALOGUE, claimed);
  const kept = new Map(claimed.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  const worn = claimed.tiles.map((tile) => {
    const snapshot = kept.get(tileKey(tile));
    return seen.has(tileKey(tile)) || snapshot === undefined
      ? holderOf(claimed, tile)
      : snapshot.holder;
  });
  expect(holderOf(claimed, first)).toBe('neutral');
  expect(seen.has(tileKey(first))).toBe(false);
  expect(kept.get(tileKey(first))?.holder).toBeUndefined();

  await openSaved(page, claimed, CAMPAIGN);
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);
  await rested(page);

  expect(await ringsByColour(page)).toEqual(colouredBy(worn));

  await consoleKey(page);
  await enter(page, 'fog');
  await consoleKey(page);
  await rested(page);

  expect(await ringsByColour(page)).toEqual(
    colouredBy([
      ...claimed.held.map((): CityFaction => 'player'),
      ...neutral.held.map((): CityFaction => 'neutral'),
    ]),
  );
  expect(problems).toEqual([]);
});
