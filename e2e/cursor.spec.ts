import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf, playedByNothing } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted, byHand, refusalOf } from '../src/rules/chronicle';
import { distance, type TileCoords, tileKey } from '../src/rules/map';
import { offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { type Cursor, cursorStyle } from '../src/ui/cursor';
import {
  aimed,
  cursorNamedBy,
  cursorStyleOnCanvas,
  enemyBesideCity,
  firstSeed,
  freeGround,
  guardedOn,
  inHand,
  nearestUncharted,
  onScreen,
  openSaved,
  playerCityTile,
  readings,
  rested,
  restedOnDeal,
  tileOnScreen,
  tilePlayable,
  unitEntered,
  unpaidDealt,
  WORKER,
  watch,
} from './chronicle-screen';

/** How far a press is moved to drag what it holds: past the drag slack, in design units. */
const DRAGGED = 40;

/**
 * A turn of the first seed with a warrior on the city lighting a tile and marking an enemy beside it,
 * a worker two out; in hand a card unpaid, one whose face shows no refusal and one aimed at a tile
 * admitting a charted tile; and a bare charted tile two out that neither lights nor admits.
 */
function town(): {
  chronicle: Chronicle;
  unpaid: number;
  open: number;
  aiming: number;
  lit: TileCoords;
  enemy: TileCoords;
  admits: TileCoords;
  bare: TileCoords;
} {
  return firstSeed(
    'stands a warrior lighting a tile and marking an enemy, and a hand to aim and refuse',
    (seed) => {
      const beset = enemyBesideCity(guardedOn(seed));
      if (beset === undefined) return undefined;
      const { enemy } = beset;
      const inside = new Set(beset.chronicle.held.map(tileKey));
      const [ground] = freeGround(beset.chronicle, WORKER, 2).filter(
        (tile) => !inside.has(tileKey(tile)),
      );
      if (ground === undefined) return undefined;
      const chronicle = unitEntered(beset.chronicle, {
        type: WORKER,
        faction: 'player',
        tile: ground,
      });
      const refusedOnFace = (index: number): boolean => {
        const { id } = chronicle.hand[index];
        return (
          refusalOf(CATALOGUE, chronicle, id).unaffordable.length > 0 ||
          playedByNothing(cardOf(CATALOGUE, id))
        );
      };
      const unpaid = chronicle.hand.findIndex(
        ({ id }) => refusalOf(CATALOGUE, chronicle, id).unaffordable.length > 0,
      );
      const open = chronicle.hand.findIndex((_, index) => !refusedOnFace(index));
      const aiming = inHand(chronicle, tilePlayable);
      if (unpaid === -1 || open === -1 || aiming === -1) return undefined;
      const aim = aimOf(cardOf(CATALOGUE, chronicle.hand[aiming].id));
      if (aim.aim !== 'tile') return undefined;

      const charted = new Set(chronicle.snapshots.map(tileKey));
      const city = playerCityTile(chronicle);
      const near = (tile: TileCoords): boolean =>
        charted.has(tileKey(tile)) && distance(tile, city) <= 2;
      const admittedKeys = new Set(admitted(CATALOGUE, chronicle, aim).map(tileKey));
      const warrior = unitAt(chronicle.units, city);
      if (warrior === undefined) return undefined;
      const { landings, steps, targets } = byHand(CATALOGUE, chronicle, warrior);
      if (!targets.some((target) => target.id === enemy.id)) return undefined;
      const litKeys = new Set([...landings, ...steps].map(({ tile }) => tileKey(tile)));
      const lit = landings.map(({ tile }) => tile).find(near);
      const admits = chronicle.tiles.find((tile) => near(tile) && admittedKeys.has(tileKey(tile)));
      const bare = chronicle.tiles.find(
        (tile) =>
          near(tile) &&
          distance(tile, city) === 2 &&
          unitAt(chronicle.units, tile) === undefined &&
          !litKeys.has(tileKey(tile)) &&
          !admittedKeys.has(tileKey(tile)),
      );
      if (lit === undefined || admits === undefined || bare === undefined) return undefined;
      return { chronicle, unpaid, open, aiming, lit, enemy: enemy.tile, admits, bare };
    },
  );
}

/** Where the dev server serves a file under the assets folder. */
function servedAt(file: string): string {
  return `/assets/${file}`;
}

/**
 * The picture the pointer wears, the style the canvas holds asking for it drawn across 32 pixels, at
 * its point and with its fallback, at that density.
 */
async function worn(page: Page, dense = false): Promise<Cursor> {
  const style = await cursorStyleOnCanvas(page);
  const cursor = cursorNamedBy(style);
  expect(style).toBe(cursorStyle(cursor, servedAt, dense));
  return cursor;
}

/** The picture the pointer wears moved to that point, a drawn frame after. */
async function wornAt(page: Page, at: { x: number; y: number }, dense = false): Promise<Cursor> {
  await page.mouse.move(at.x, at.y);
  await rested(page);
  return worn(page, dense);
}

test('on a turn the pointer is the arrow over the map, the open hand over a card of the hand, the not-allowed sign over one the city cannot pay for, and the pointing hand over End turn', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, unpaid, open, bare } = town();
  await openSaved(page, chronicle);

  expect(await wornAt(page, await tileOnScreen(page, bare))).toBe('arrow');
  expect(await wornAt(page, await onScreen(page, `hand-${open}`))).toBe('open hand');
  expect(await wornAt(page, await onScreen(page, `hand-${unpaid}`))).toBe('not-allowed sign');
  expect(await wornAt(page, await onScreen(page, 'end-turn'))).toBe('pointing hand');

  expect(problems).toEqual([]);
});

test('a unit selected wears the step sign on a tile it lights, the attack sign on a unit it marks and the arrow on a tile it lights nothing on, and a stat of the summary the help sign', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, lit, enemy, bare } = town();
  await openSaved(page, chronicle);
  const city = await tileOnScreen(page, playerCityTile(chronicle));
  await page.mouse.click(city.x, city.y);
  await rested(page);

  expect(await wornAt(page, await tileOnScreen(page, lit))).toBe('step sign');
  expect(await wornAt(page, await tileOnScreen(page, enemy))).toBe('attack sign');
  expect(await wornAt(page, await tileOnScreen(page, bare))).toBe('arrow');
  expect(await wornAt(page, await onScreen(page, 'summary-health'))).toBe('help sign');

  expect(problems).toEqual([]);
});

test('a card being aimed wears the aim sign on a tile it admits, the not-allowed sign on a drawn tile it does not, and the arrow over the uncharted', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, aiming, admits, bare } = town();
  await openSaved(page, chronicle);
  const card = await onScreen(page, `hand-${aiming}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  expect(await wornAt(page, await tileOnScreen(page, admits))).toBe('aim sign');
  expect(await wornAt(page, await tileOnScreen(page, bare))).toBe('not-allowed sign');
  const dark = await tileOnScreen(page, nearestUncharted(chronicle));
  expect(await wornAt(page, dark)).toBe('arrow');

  expect(problems).toEqual([]);
});

test('a card of the hand dragged and the map panned wear the closed hand from the drag’s start, wherever the pointer goes, until the press is let go', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, open, bare } = town();
  await openSaved(page, chronicle);

  const card = await onScreen(page, `hand-${open}`);
  expect(await wornAt(page, card)).toBe('open hand');
  await page.mouse.down();
  await rested(page);
  expect(await worn(page)).toBe('open hand');
  await page.mouse.move(card.x + DRAGGED * card.unit, card.y, { steps: 5 });
  await rested(page);
  expect(await worn(page)).toBe('closed hand');
  await page.mouse.move(card.x, card.y, { steps: 5 });
  await page.mouse.up();
  await rested(page);
  expect(await worn(page)).toBe('open hand');

  const ground = await tileOnScreen(page, bare);
  expect(await wornAt(page, ground)).toBe('arrow');
  await page.mouse.down();
  await rested(page);
  expect(await worn(page)).toBe('arrow');
  await page.mouse.move(ground.x + DRAGGED * ground.unit, ground.y, { steps: 5 });
  await rested(page);
  expect(await worn(page)).toBe('closed hand');
  await page.mouse.up();
  await rested(page);
  expect(await worn(page)).toBe('arrow');

  expect(problems).toEqual([]);
});

test('on a deal the not-allowed sign stands over the answer the city cannot pay for', async ({
  page,
}) => {
  const problems = watch(page);
  const { dealt, answer } = unpaidDealt();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const unpaid = `deal-card-${offered(CATALOGUE, dealt, deal).indexOf(answer)}`;
  await openSaved(page, dealt);
  await restedOnDeal(page);

  const seen = await readings(page, [unpaid]);
  const box = seen(unpaid).boundsOnScreen;
  const { unit } = seen(unpaid).onScreen;
  // In the answer's padding over its name, off every name its text draws.
  expect(await wornAt(page, { x: box.x + 12 * unit, y: box.y + 6 * unit })).toBe(
    'not-allowed sign',
  );

  expect(problems).toEqual([]);
});

test.describe('on a screen of two device pixels to the CSS pixel', () => {
  test.use({ deviceScaleFactor: 2 });

  test('the pointer takes the 64 pixel picture, drawn across the same 32', async ({ page }) => {
    const problems = watch(page);
    const { chronicle } = town();
    await openSaved(page, chronicle);

    expect(await wornAt(page, await onScreen(page, 'end-turn'), true)).toBe('pointing hand');

    expect(problems).toEqual([]);
  });
});
