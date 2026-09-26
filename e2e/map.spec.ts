import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { campUnit } from '../src/rules/enemies';
import { CENTRE, type TileCoords, tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import { walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import {
  admits,
  aimed,
  budget,
  campGround,
  chronicleOf,
  cityTileOf,
  dragOut,
  endTurn,
  idsOf,
  inside,
  mapFrame,
  onScreen,
  openSaved,
  playedOut,
  rested,
  ringedTile,
  type Step,
  settledOn,
  shownCard,
  standing,
  tileOnScreen,
  tooltipUp,
  unitEntered,
  watch,
  workerStepped,
} from './chronicle-screen';

/** A point on bare map, clear of the resource bar, the piles and the hand; no tile is read off it. */
const BARE = { at: { q: 0, r: -3 }, key: '0,-3' };

/** A bare tile the opening charts, clear of the same three: what a press picks out. */
const CHARTED = { at: { q: 1, r: -2 }, key: '1,-2' };

/** What one wheel notch multiplies the zoom by. */
const NOTCH = 1.3;

/** The card the worker plays where it stands. */
const GATHER = 'gather';

/** Seed 1's bare turn 1. */
const OPENED = settledOn(NOMADIC, 1);

/** The tile of the list furthest along the measure given. */
function furthest(tiles: readonly TileCoords[], by: (tile: TileCoords) => number): TileCoords {
  const { q, r } = tiles.reduce((far, tile) => (by(tile) > by(far) ? tile : far));
  return { q, r };
}

/** The tiles furthest east and furthest south: the last of the map to leave the frame. */
const EAST = furthest(
  OPENED.tiles.filter((tile) => tile.r === CENTRE.r),
  (tile) => tile.q,
);
const SOUTH = furthest(
  OPENED.tiles.filter((tile) => tile.q === CENTRE.q),
  (tile) => tile.r,
);

type Point = { x: number; y: number };

/** Drags from a page point by a page offset, well past the slack that tells a drag from a click. */
async function drag(page: Page, from: Point, by: Point): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + by.x / 2, from.y + by.y / 2, { steps: 5 });
  await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 5 });
  await page.mouse.up();
  await rested(page);
}

/**
 * Drags the map until the tile stands off the frame: the map is zoomed in first, since its own
 * bounds keep a frame at full width from ever carrying a tile near the middle of the disc out of
 * itself; then sideways, and up or down after it.
 */
async function pushOut(page: Page, coord: TileCoords): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  await page.mouse.move(middle.x, middle.y);
  for (let notch = 0; notch < 2; notch++) await page.mouse.wheel(0, -100);
  await rested(page);

  for (const step of [
    { x: frame.width / 3, y: 0 },
    { x: 0, y: frame.height / 4 },
  ]) {
    for (let pass = 0; pass < 6; pass++) {
      const at = await tileOnScreen(page, coord);
      if (!inside(at, frame)) return;
      const way = Math.sign(step.x === 0 ? at.y - middle.y : at.x - middle.x) || 1;
      await drag(page, middle, { x: step.x * way, y: step.y * way });
    }
  }
}

/** The first seed's turn 1 whose first worker steps off the city onto a tile gather admits. */
function gatherStep(): Step {
  return workerStepped(
    'steps its first worker off the city with gather to play there',
    (stepped, tile) => admits(stepped, idsOf(stepped.hand).indexOf(GATHER), tile),
  );
}

/**
 * Seed 1's bare turn 1 with a raider entered three tiles out, on the first tile whose end of turn is
 * its one move with a tile of it in sight and no deal, and the crossing's two tiles.
 */
function raiderThreeOff(): { chronicle: Chronicle; from: TileCoords; to: TileCoords } {
  for (const tile of campGround(OPENED, 3)) {
    const chronicle = unitEntered(OPENED, campUnit(NOMADIC, tile, 'raider'));
    const stages = [...walked(apply(NOMADIC, chronicle, { type: 'end-turn' }))];
    const moves = stages.flatMap((stage) =>
      stage.name === 'move'
        ? [{ from: stage.from, to: stage.to, seen: inSight(NOMADIC, stage.chronicle) }]
        : [],
    );
    const [crossing] = moves;
    if (
      moves.length === 1 &&
      !stages.some((stage) => stage.name === 'deal') &&
      (crossing.seen.has(tileKey(crossing.from)) || crossing.seen.has(tileKey(crossing.to)))
    ) {
      return { chronicle, from: crossing.from, to: crossing.to };
    }
  }
  throw new Error('seed 1 crosses no raider entered three tiles out in sight');
}

test('the map is framed between the resource bar and the band, on the city', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const frame = await mapFrame(page);
  const bar = await onScreen(page, 'bar-edge');
  const band = await onScreen(page, 'band-edge');
  expect(Math.abs(frame.y - bar.y)).toBeLessThan(2);
  expect(Math.abs(frame.y + frame.height - band.y)).toBeLessThan(2);
  expect((await onScreen(page, 'band')).y).toBeGreaterThan(frame.y + frame.height);

  const at = await onScreen(page, `tile-${tileKey(cityTileOf(OPENED))}`);
  expect(Math.abs(at.x - (frame.x + frame.width / 2))).toBeLessThan(2);
  expect(Math.abs(at.y - (frame.y + frame.height / 2))).toBeLessThan(2);

  expect(problems).toEqual([]);
});

test('a drag on bare map carries the map with it, and picks out no tile', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, CHARTED.at);
  await drag(page, before, { x: 120, y: -80 });

  const after = await tileOnScreen(page, CHARTED.at);
  expect(after.x - before.x).toBeCloseTo(120, 0);
  expect(after.y - before.y).toBeCloseTo(-80, 0);
  expect(await ringedTile(page)).toBeUndefined();

  await page.mouse.click(after.x, after.y);
  await expect.poll(() => ringedTile(page)).toBe(CHARTED.key);

  expect(problems).toEqual([]);
});

test('a pan and a zoom carry the ringed tile and the panel beside it', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const tile = await tileOnScreen(page, CHARTED.at);
  await page.mouse.click(tile.x, tile.y);
  await expect.poll(() => ringedTile(page)).toBe(CHARTED.key);
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');

  const panel = await onScreen(page, 'infopanel');
  await drag(page, tile, { x: 120, y: -80 });

  const panned = await tileOnScreen(page, CHARTED.at);
  const carried = await onScreen(page, 'infopanel');
  expect(await ringedTile(page)).toBe(CHARTED.key);
  expect(await shownCard(page)).toBe('terrain');
  expect(panned.x - tile.x).toBeCloseTo(120, 0);
  expect(carried.x - panel.x).toBeCloseTo(120, 0);
  expect(carried.y - panel.y).toBeCloseTo(-80, 0);

  await page.mouse.move(panned.x, panned.y);
  await page.mouse.wheel(0, -100);
  await rested(page);

  const zoomed = await onScreen(page, 'infopanel');
  const grown = await tileOnScreen(page, CHARTED.at);
  expect(await ringedTile(page)).toBe(CHARTED.key);
  expect(await shownCard(page)).toBe('terrain');
  // The tile keeps the ground it had under the pointer and grows, so the panel stands further off.
  expect(Math.abs(grown.x - panned.x)).toBeLessThan(2);
  expect(zoomed.x).toBeGreaterThan(carried.x);

  expect(problems).toEqual([]);
});

test("a pan carries a panel row's tooltip along with the row", async ({ page }) => {
  const problems = watch(page);
  const { entered } = gatherStep();

  await openSaved(page, entered);

  const tile = await onScreen(page, `tile-${tileKey(cityTileOf(entered))}`);
  await page.mouse.click(tile.x, tile.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('unit');
  await rested(page);

  // The unit card's rows follow its stats, and damage's label is the widest of them.
  const row = await onScreen(page, 'infopanel-row-1');
  const width = await page.evaluate(() => {
    const found = window.named?.('infopanel-row-1');
    if (found === undefined) throw new Error('nothing named infopanel-row-1 is on the map');
    return (found.object as unknown as { getBounds(): { width: number } }).getBounds().width;
  });
  await page.mouse.move(row.x - (width / 2 - 2) * row.unit, row.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-map')).toBe(true);
  const panel = await onScreen(page, 'infopanel');
  const bubble = await onScreen(page, 'tooltip-map');

  // One tap pans one frame, and a row carried out from under the still pointer is left and takes its
  // tooltip down: the pointer rests just inside the end the tap carries away from it.
  await page.keyboard.press('d');
  await rested(page);
  await rested(page);

  const carried = await onScreen(page, 'infopanel');
  const stood = await onScreen(page, 'tooltip-map');
  expect(carried.x).toBeLessThan(panel.x - 10 * row.unit);
  expect(await tooltipUp(page, 'tooltip-map')).toBe(true);
  expect(stood.x - carried.x).toBeCloseTo(bubble.x - panel.x, 0);
  expect(stood.y - carried.y).toBeCloseTo(bubble.y - panel.y, 0);

  expect(problems).toEqual([]);
});

test('a drag on bare ground pans the map, and a drag from the unit moves it', async ({ page }) => {
  const problems = watch(page);
  const step = gatherStep();

  await openSaved(page, step.entered);

  const before = await tileOnScreen(page, BARE.at);
  await drag(page, before, { x: 100, y: 60 });

  const after = await tileOnScreen(page, BARE.at);
  expect(after.x - before.x).toBeCloseTo(100, 0);
  expect(after.y - before.y).toBeCloseTo(60, 0);
  expect(await chronicleOf(page)).toEqual(step.entered);

  const city = await onScreen(page, `tile-${tileKey(cityTileOf(step.entered))}`);
  const destination = await onScreen(page, `tile-${tileKey(step.tile)}`);
  await drag(page, city, { x: destination.x - city.x, y: destination.y - city.y });
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(step.stepped);
  // The press that took hold of the unit left the map where it stood.
  const held = await tileOnScreen(page, BARE.at);
  expect(held.x).toBeCloseTo(after.x, 0);
  expect(held.y).toBeCloseTo(after.y, 0);

  expect(problems).toEqual([]);
});

test('a drag during a tile aim pans the map, and the aim still plays after it', async ({
  page,
}) => {
  const problems = watch(page);
  const step = gatherStep();
  const index = idsOf(step.stepped.hand).indexOf(GATHER);
  const gathered = outcome(
    apply(NOMADIC, step.stepped, { type: 'play', index, aim: 'tile', tile: step.tile }),
  );

  await openSaved(page, step.stepped);
  await dragOut(page, index);
  await aimed(page);

  const before = await tileOnScreen(page, BARE.at);
  await drag(page, before, { x: -90, y: 40 });

  const after = await tileOnScreen(page, BARE.at);
  expect(after.x - before.x).toBeCloseTo(-90, 0);
  expect(after.y - before.y).toBeCloseTo(40, 0);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(step.stepped);

  const target = await onScreen(page, `tile-${tileKey(step.tile)}`);
  await page.mouse.click(target.x, target.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(gathered);

  expect(problems).toEqual([]);
});

test('a wheel notch zooms the map about the pointer', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, BARE.at);
  const east = await tileOnScreen(page, EAST);
  await page.mouse.move(before.x, before.y);
  await page.mouse.wheel(0, -100);
  await rested(page);

  const after = await tileOnScreen(page, BARE.at);
  const eastAfter = await tileOnScreen(page, EAST);

  // What the pointer stood on stays under it, and the map grows out from there by one notch.
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  expect(after.unit / before.unit).toBeCloseTo(NOTCH, 2);
  expect((eastAfter.x - after.x) / (east.x - before.x)).toBeCloseTo(NOTCH, 2);

  expect(problems).toEqual([]);
});

test('a held pan key moves the map, and lets go of it when it is released', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);

  const before = await tileOnScreen(page, BARE.at);
  await page.keyboard.down('w');
  // The frame pans up, so what stands on the map comes down the screen.
  await expect
    .poll(() => tileOnScreen(page, BARE.at).then((at) => at.y))
    .toBeGreaterThan(before.y + 40);
  await page.keyboard.up('w');

  await rested(page);
  await rested(page);
  const stopped = await tileOnScreen(page, BARE.at);
  await rested(page);
  expect((await tileOnScreen(page, BARE.at)).y).toBe(stopped.y);

  expect(problems).toEqual([]);
});

test('however far the map is dragged, it cannot leave the frame', async ({ page }) => {
  const problems = watch(page);
  await openSaved(page, OPENED);
  const frame = await mapFrame(page);

  // Passes the width and the height of the frame at a time, well past the whole map's own size.
  const west = { x: frame.x + frame.width - 40, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, west, { x: 80 - frame.width, y: 0 });
  const north = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 3 };
  for (let pass = 0; pass < 4; pass++) await drag(page, north, { x: 0, y: -frame.height / 3 });

  // The push west keeps the east end across the frame; the south end, the disc's south-east corner,
  // stays in it both ways.
  const east = await tileOnScreen(page, EAST);
  expect(east.x).toBeGreaterThan(frame.x);
  expect(east.x).toBeLessThan(frame.x + frame.width);
  expect(inside(await tileOnScreen(page, SOUTH), frame)).toBe(true);

  // One more of each pass finds the map already against its bounds.
  await drag(page, west, { x: 80 - frame.width, y: 0 });
  await drag(page, north, { x: 0, y: -frame.height / 3 });
  const again = await tileOnScreen(page, EAST);
  expect(again.x).toBeCloseTo(east.x, 0);
  expect(again.y).toBeCloseTo(east.y, 0);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame already holds pans nothing', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const run = raiderThreeOff();
  const crossed = outcome(apply(NOMADIC, run.chronicle, { type: 'end-turn' }));

  await openSaved(page, run.chronicle);

  const frame = await mapFrame(page);
  const at = await tileOnScreen(page, run.to);
  expect(inside(at, frame)).toBe(true);
  // Onto the middle of the frame, so both tiles the move plays on stand well inside it.
  await drag(page, at, {
    x: frame.x + frame.width / 2 - at.x,
    y: frame.y + frame.height / 2 - at.y,
  });

  const before = await tileOnScreen(page, run.to);
  expect(inside(await tileOnScreen(page, run.from), frame)).toBe(true);
  await endTurn(page);

  const after = await tileOnScreen(page, run.to);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(after.y).toBeCloseTo(before.y, 1);
  expect(await chronicleOf(page)).toEqual(crossed);

  expect(problems).toEqual([]);
});

test('a stage on tiles the frame does not show is brought into it', async ({ page }) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const run = raiderThreeOff();
  const crossed = outcome(apply(NOMADIC, run.chronicle, { type: 'end-turn' }));

  await openSaved(page, run.chronicle);

  const frame = await mapFrame(page);
  await pushOut(page, run.to);
  expect(inside(await tileOnScreen(page, run.to), frame)).toBe(false);

  await endTurn(page);

  expect(inside(await tileOnScreen(page, run.to), frame)).toBe(true);
  expect(await chronicleOf(page)).toEqual(crossed);

  expect(problems).toEqual([]);
});
