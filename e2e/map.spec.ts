import { expect, type Page, test } from '@playwright/test';
import { DECKS } from '../src/rules/cards';
import { apply, beginChronicle, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import {
  aimed,
  budget,
  chronicleOf,
  dragOut,
  dragUnit,
  endTurn,
  type Frame,
  firstSeed,
  mapFrame,
  onScreen,
  open,
  playedOut,
  ringedTile,
  settled,
  shownCard,
  standing,
  tooltipUp,
  watch,
  workerRun,
} from './chronicle-screen';

/** A tile on bare map, clear of the resource bar, the piles and the hand. */
const BARE = { name: 'tile-0,-3', key: '0,-3' };

/** The tiles furthest east and furthest south: the last of the map to leave the frame. */
const EAST = 'tile-8,0';
const SOUTH = 'tile-0,8';

/** What one wheel notch multiplies the zoom by. */
const NOTCH = 1.3;

type Point = { x: number; y: number };

/** Drags from a page point by a page offset, well past the slack that tells a drag from a click. */
async function drag(page: Page, from: Point, by: Point): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + by.x / 2, from.y + by.y / 2, { steps: 5 });
  await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 5 });
  await page.mouse.up();
  await settled(page);
}

function inside(at: Point, frame: Frame): boolean {
  return (
    at.x > frame.x &&
    at.x < frame.x + frame.width &&
    at.y > frame.y &&
    at.y < frame.y + frame.height
  );
}

/**
 * Drags the map until the named tile stands off the frame: sideways first, then up or down, since
 * the map's own bounds keep a tile near the middle of one axis from ever leaving by that axis.
 */
async function pushOut(page: Page, name: string): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  for (const step of [
    { x: frame.width / 3, y: 0 },
    { x: 0, y: frame.height / 4 },
  ]) {
    for (let pass = 0; pass < 4; pass++) {
      const at = await onScreen(page, name);
      if (!inside(at, frame)) return;
      const way = Math.sign(step.x === 0 ? at.y - middle.y : at.x - middle.x) || 1;
      await drag(page, middle, { x: step.x * way, y: step.y * way });
    }
  }
}

/**
 * The first seed whose enemy crosses the map in an end of turn all to itself — one move, and no
 * arrival landing in the same end of turn to carry the frame off after it — and how many ends of
 * turn stand before that one.
 */
function moveRun(): { seed: number; turns: number; from: TileCoords; to: TileCoords } {
  return firstSeed('crosses an enemy inside eight ends of turn', (seed) => {
    let chronicle = beginChronicle(seed, DECKS.PH_Deck);
    for (let turns = 0; turns <= 8 && chronicle.defeat === undefined; turns++) {
      const stages = apply(chronicle, { type: 'end-turn' });
      const moves = stages.flatMap((stage) =>
        stage.name === 'move' ? [{ from: stage.from, to: stage.to }] : [],
      );
      if (moves.length === 1 && !stages.some((stage) => stage.name === 'events')) {
        return { seed, turns, ...moves[0] };
      }
      chronicle = outcome(stages);
    }
    return undefined;
  });
}

test('the map is framed between the resource bar and the band, on the city', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const frame = await mapFrame(page);
  const bar = await onScreen(page, 'bar-edge');
  const band = await onScreen(page, 'band-edge');
  expect(Math.abs(frame.y - bar.y)).toBeLessThan(2);
  expect(Math.abs(frame.y + frame.height - band.y)).toBeLessThan(2);
  expect((await onScreen(page, 'band')).y).toBeGreaterThan(frame.y + frame.height);

  const city = await chronicleOf(page).then((chronicle) => chronicle.city);
  const at = await onScreen(page, `tile-${tileKey(city)}`);
  expect(Math.abs(at.x - (frame.x + frame.width / 2))).toBeLessThan(2);
  expect(Math.abs(at.y - (frame.y + frame.height / 2))).toBeLessThan(2);

  expect(problems).toEqual([]);
});

test('a drag on bare map carries the map with it, and picks out no tile', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  await drag(page, before, { x: 120, y: -80 });

  const after = await onScreen(page, BARE.name);
  expect(after.x - before.x).toBeCloseTo(120, 0);
  expect(after.y - before.y).toBeCloseTo(-80, 0);
  expect(await ringedTile(page)).toBeUndefined();

  await page.mouse.click(after.x, after.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);

  expect(problems).toEqual([]);
});

test('a pan and a zoom carry the ringed tile and the panel beside it', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const tile = await onScreen(page, BARE.name);
  await page.mouse.click(tile.x, tile.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const panel = await onScreen(page, 'infopanel');
  await drag(page, tile, { x: 120, y: -80 });

  const panned = await onScreen(page, BARE.name);
  const carried = await onScreen(page, 'infopanel');
  expect(await ringedTile(page)).toBe(BARE.key);
  expect(await shownCard(page)).toBe('terrain');
  expect(panned.x - tile.x).toBeCloseTo(120, 0);
  expect(carried.x - panel.x).toBeCloseTo(120, 0);
  expect(carried.y - panel.y).toBeCloseTo(-80, 0);

  await page.mouse.move(panned.x, panned.y);
  await page.mouse.wheel(0, -100);
  await settled(page);

  const zoomed = await onScreen(page, 'infopanel');
  const grown = await onScreen(page, BARE.name);
  expect(await ringedTile(page)).toBe(BARE.key);
  expect(await shownCard(page)).toBe('terrain');
  // The tile keeps the ground it had under the pointer and grows, so the panel stands further off.
  expect(Math.abs(grown.x - panned.x)).toBeLessThan(2);
  expect(zoomed.x).toBeGreaterThan(carried.x);

  expect(problems).toEqual([]);
});

test("a pan carries a panel row's tooltip along with the row", async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const tile = await onScreen(page, BARE.name);
  await page.mouse.click(tile.x, tile.y);
  await expect.poll(() => ringedTile(page)).toBe(BARE.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const row = await onScreen(page, 'infopanel-row-0');
  await page.mouse.move(row.x, row.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-map')).toBe(true);
  const panel = await onScreen(page, 'infopanel');
  const bubble = await onScreen(page, 'tooltip-map');

  // The pointer holds still, so the row keeps the hover the panel is carrying out from under it.
  await page.keyboard.down('w');
  await expect
    .poll(() => onScreen(page, 'infopanel').then((at) => at.y))
    .toBeGreaterThan(panel.y + 40);
  await page.keyboard.up('w');
  await settled(page);
  await settled(page);

  const carried = await onScreen(page, 'infopanel');
  const stood = await onScreen(page, 'tooltip-map');
  expect(await tooltipUp(page, 'tooltip-map')).toBe(true);
  expect(stood.x - carried.x).toBeCloseTo(bubble.x - panel.x, 0);
  expect(stood.y - carried.y).toBeCloseTo(bubble.y - panel.y, 0);

  expect(problems).toEqual([]);
});

test('a drag on bare ground pans the map, and a drag from the unit moves it', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm');

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  const before = await onScreen(page, BARE.name);
  await drag(page, before, { x: 100, y: 60 });

  const after = await onScreen(page, BARE.name);
  expect(after.x - before.x).toBeCloseTo(100, 0);
  expect(after.y - before.y).toBeCloseTo(60, 0);
  const panned = await chronicleOf(page);
  expect(panned.units[0].tile).toEqual(entered.units[0].tile);

  const city = await onScreen(page, `tile-${tileKey(entered.city)}`);
  const destination = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await drag(page, city, { x: destination.x - city.x, y: destination.y - city.y });
  await playedOut(page);

  await expect
    .poll(async () => tileKey((await chronicleOf(page)).units[0].tile))
    .toBe(tileKey(run.tile));
  // The press that took hold of the unit left the map where it stood.
  const held = await onScreen(page, BARE.name);
  expect(held.x).toBeCloseTo(after.x, 0);
  expect(held.y).toBeCloseTo(after.y, 0);

  expect(problems).toEqual([]);
});

test('a drag during a tile aim pans the map, and the aim still builds after it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm');

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.tile);

  const aiming = await chronicleOf(page);
  await dragOut(page, aiming.hand.indexOf('PH_Farm'));
  await aimed(page);

  const before = await onScreen(page, BARE.name);
  await drag(page, before, { x: -90, y: 40 });

  const after = await onScreen(page, BARE.name);
  expect(after.x - before.x).toBeCloseTo(-90, 0);
  expect(after.y - before.y).toBeCloseTo(40, 0);
  expect(await standing(page, 'aim')).toBe(true);
  const panned = await chronicleOf(page);
  expect(panned.hand).toEqual(aiming.hand);
  expect(
    panned.tiles.find((tile) => tileKey(tile) === tileKey(run.tile))?.building,
  ).toBeUndefined();

  const target = await onScreen(page, `tile-${tileKey(run.tile)}`);
  await page.mouse.click(target.x, target.y);
  await playedOut(page);
  await expect
    .poll(
      async () =>
        (await chronicleOf(page)).tiles.find((tile) => tileKey(tile) === tileKey(run.tile))
          ?.building,
    )
    .toBe('PH_Farm');

  expect(problems).toEqual([]);
});

test('a wheel notch zooms the map about the pointer', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  const east = await onScreen(page, EAST);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await settled(page);

  const after = await onScreen(page, BARE.name);
  const eastAfter = await onScreen(page, EAST);

  // What the pointer stood on stays under it, and the map grows out from there by one notch.
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  expect(after.unit / before.unit).toBeCloseTo(NOTCH, 2);
  expect((eastAfter.x - after.x) / (east.x - before.x)).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a held pan key moves the map, and lets go of it when it is released', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');

  const before = await onScreen(page, BARE.name);
  await page.keyboard.down('w');
  // The frame pans up, so what stands on the map comes down the screen.
  await expect
    .poll(() => onScreen(page, BARE.name).then((at) => at.y))
    .toBeGreaterThan(before.y + 40);
  await page.keyboard.up('w');

  await settled(page);
  await settled(page);
  const stopped = await onScreen(page, BARE.name);
  await settled(page);
  expect((await onScreen(page, BARE.name)).y).toBe(stopped.y);

  expect(problems).toEqual([]);
});

test('however far the map is dragged, it cannot leave the frame', async ({ page }) => {
  const problems = watch(page);
  await open(page, 1, 'PH_Deck');
  const frame = await mapFrame(page);

  // Passes the width and the height of the frame at a time, well past the whole map's own size.
  const west = { x: frame.x + frame.width - 40, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, west, { x: 80 - frame.width, y: 0 });
  const north = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, north, { x: 0, y: -frame.height / 3 });

  const east = await onScreen(page, EAST);
  const south = await onScreen(page, SOUTH);
  for (const at of [east, south]) {
    expect(at.x).toBeGreaterThan(frame.x);
    expect(at.x).toBeLessThan(frame.x + frame.width);
    expect(at.y).toBeGreaterThan(frame.y);
    expect(at.y).toBeLessThan(frame.y + frame.height);
  }

  // One more of each pass finds the map already against its bounds.
  await drag(page, west, { x: 80 - frame.width, y: 0 });
  await drag(page, north, { x: 0, y: -frame.height / 3 });
  const again = await onScreen(page, EAST);
  expect(again.x).toBeCloseTo(east.x, 0);
  expect(again.y).toBeCloseTo(east.y, 0);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame already holds pans nothing', async ({ page }) => {
  const problems = watch(page);
  const run = moveRun();
  // The run's ends of turn, the one the test ends after them, and the drag between the two.
  test.setTimeout(budget(run.turns + 2));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);

  const frame = await mapFrame(page);
  const crossed = `tile-${tileKey(run.to)}`;
  const at = await onScreen(page, crossed);
  expect(inside(at, frame)).toBe(true);
  // Onto the middle of the frame, so both tiles the move plays on stand well inside it.
  await drag(page, at, {
    x: frame.x + frame.width / 2 - at.x,
    y: frame.y + frame.height / 2 - at.y,
  });

  const before = await onScreen(page, crossed);
  expect(inside(await onScreen(page, `tile-${tileKey(run.from)}`), frame)).toBe(true);
  await endTurn(page);

  const after = await onScreen(page, crossed);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(after.y).toBeCloseTo(before.y, 1);
  expect(
    (await chronicleOf(page)).units.some((unit) => tileKey(unit.tile) === tileKey(run.to)),
  ).toBe(true);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame does not show is brought into it', async ({ page }) => {
  const problems = watch(page);
  const run = moveRun();
  // The run's ends of turn, the one the test ends after them, and the drag that pushes the tile out.
  test.setTimeout(budget(run.turns + 2));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 0; turn < run.turns; turn++) await endTurn(page);

  const frame = await mapFrame(page);
  const crossed = `tile-${tileKey(run.to)}`;
  await pushOut(page, crossed);
  expect(inside(await onScreen(page, crossed), frame)).toBe(false);

  await endTurn(page);

  expect(inside(await onScreen(page, crossed), frame)).toBe(true);
  expect(
    (await chronicleOf(page)).units.some((unit) => tileKey(unit.tile) === tileKey(run.to)),
  ).toBe(true);

  expect(problems).toEqual([]);
});
