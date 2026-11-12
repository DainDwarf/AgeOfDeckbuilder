import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { unitKind } from '../src/rules/catalogue';
import { byHand } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import {
  bareWith,
  besideTiles,
  chronicleOf,
  click,
  dragSlack,
  firstSeed,
  freeFor,
  onScreen,
  openSaved,
  playerCityTile,
  refusalLines,
  refusalSaid,
  refusedLiftedOut,
  rested,
  ringedAndLit,
  SCOUT,
  settledOn,
  standing,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The tiles the map lights and glows for the unit standing on the tile, by tile key, in key order. */
function litFor(chronicle: Chronicle, tile: TileCoords): string[] {
  const unit = unitAt(chronicle.units, tile);
  if (unit === undefined) throw new Error(`no unit stands on ${tileKey(tile)}`);
  const { landings, targets } = byHand(CATALOGUE, chronicle, unit);
  return [...landings.map((landing) => landing.tile), ...targets.map((target) => target.tile)]
    .map(tileKey)
    .sort();
}

/**
 * The first seed's turn 1 settled bare, a scout of the player's entered on the city's tile and one on
 * a tile beside it, each lighting tiles, and not the same ones.
 */
function twoScouts(): { chronicle: Chronicle; city: TileCoords; beside: TileCoords } {
  return firstSeed(
    'lights two scouts of the player’s apart, one on its city and one beside',
    (seed) => {
      const settled = settledOn(seed);
      const city = playerCityTile(settled);
      const scout = unitKind(CATALOGUE, SCOUT);
      for (const beside of neighbours(city)) {
        if (!freeFor(settled, scout, beside)) continue;
        const chronicle = [city, beside].reduce(
          (standing, tile) => unitEntered(standing, { type: SCOUT, faction: 'player', tile }),
          settled,
        );
        const [own, other] = [city, beside].map((tile) => litFor(chronicle, tile));
        if (own.length > 0 && other.length > 0 && own.join() !== other.join()) {
          return { chronicle, city, beside };
        }
      }
      return undefined;
    },
  );
}

/** The tile selected, the unit standing on it ringed and lighting its reach, as the map shows it. */
function selectedOn(
  chronicle: Chronicle,
  tile: TileCoords,
): { selected: string; rings: string[]; lit: string[] } {
  const key = tileKey(tile);
  return { selected: key, rings: [key], lit: litFor(chronicle, tile) };
}

test('a press held on a unit of the player’s rings and lights nothing, and its release rings it and lights its reach together', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city } = twoScouts();

  await openSaved(page, chronicle);
  const face = await onScreen(page, `tile-${tileKey(city)}`);

  await page.mouse.move(face.x, face.y);
  await page.mouse.down();
  await rested(page);
  expect(await ringedAndLit(page)).toEqual({ selected: undefined, rings: [], lit: [] });

  await page.mouse.up();
  await expect.poll(() => ringedAndLit(page)).toEqual(selectedOn(chronicle, city));

  expect(problems).toEqual([]);
});

test('a press held on a second unit of the player’s leaves the selected one ringed and lit', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, beside } = twoScouts();

  await openSaved(page, chronicle);
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedAndLit(page)).toEqual(selectedOn(chronicle, city));

  const face = await onScreen(page, `tile-${tileKey(beside)}`);
  await page.mouse.move(face.x, face.y);
  await page.mouse.down();
  await rested(page);
  expect(await ringedAndLit(page)).toEqual(selectedOn(chronicle, city));
  await page.mouse.up();

  expect(problems).toEqual([]);
});

test('a unit carried lights its reach from the start of its drag and wears no ring, and let go beside the lit tiles leaves the selection lit as it stood', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, city, beside } = twoScouts();

  await openSaved(page, chronicle);
  await click(page, `tile-${tileKey(city)}`);
  await expect.poll(() => ringedAndLit(page)).toEqual(selectedOn(chronicle, city));

  const face = await onScreen(page, `tile-${tileKey(beside)}`);
  const slack = await dragSlack(page);
  const off = await besideTiles(page);

  await page.mouse.move(face.x, face.y);
  await page.mouse.down();
  await page.mouse.move(face.x + slack / 2, face.y);
  await rested(page);
  expect(await ringedAndLit(page)).toEqual(selectedOn(chronicle, city));

  await page.mouse.move(face.x + 2 * slack, face.y);
  await rested(page);
  expect(await ringedAndLit(page)).toEqual({
    ...selectedOn(chronicle, city),
    lit: litFor(chronicle, beside),
  });

  await page.mouse.move(off.x, off.y, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => ringedAndLit(page)).toEqual(selectedOn(chronicle, city));
  expect(await chronicleOf(page)).toEqual(chronicle);

  expect(problems).toEqual([]);
});

test('a refusal’s note stands through a press held still, and comes down as it is let go', async ({
  page,
}) => {
  const problems = watch(page);

  await refusedLiftedOut(page);
  const at = await besideTiles(page);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await rested(page);
  expect(await standing(page, 'refusal')).toBe(true);

  await page.mouse.up();
  await expect.poll(() => standing(page, 'refusal')).toBe(false);

  expect(problems).toEqual([]);
});

test('a refusal’s note comes down as a held press starts its drag, the button still down', async ({
  page,
}) => {
  const problems = watch(page);

  await refusedLiftedOut(page);
  const at = await besideTiles(page);
  const slack = await dragSlack(page);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x + slack / 2, at.y);
  await rested(page);
  expect(await standing(page, 'refusal')).toBe(true);

  await page.mouse.move(at.x + 2 * slack, at.y);
  await expect.poll(() => standing(page, 'refusal')).toBe(false);
  await page.mouse.up();

  expect(problems).toEqual([]);
});

test('a second refused click on the same card leaves its note standing', async ({ page }) => {
  const problems = watch(page);
  const { chronicle, index } = bareWith(
    'a card the rules refuse that plays at nothing',
    ({ aim, playable }) => aim === 'none' && !playable,
  );
  const said = refusalSaid(chronicle, chronicle.hand[index].id);

  await openSaved(page, chronicle);
  const home = await onScreen(page, `hand-${index}`);
  await page.mouse.click(home.x, home.y);
  await rested(page);
  await page.mouse.click(home.x, home.y);
  await expect.poll(() => refusalLines(page)).toEqual(said);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await refusalLines(page)).toEqual(said);
  expect(await chronicleOf(page)).toEqual(chronicle);

  expect(problems).toEqual([]);
});
