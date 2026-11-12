import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, byHand, declaresWar, outcome } from '../src/rules/chronicle';
import { MOVE_POINT, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { pathTo, type Unit } from '../src/rules/units';
import { DEFAULTS } from '../src/ui/bindings';
import {
  besideTiles,
  budget,
  chronicleOf,
  click,
  firstSeed,
  onScreen,
  openSaved,
  type PathDrawn,
  pathDrawn,
  playedOut,
  playerCityTile,
  playersOf,
  readings,
  rested,
  ringedTile,
  SCOUT,
  settledOn,
  unitEntered,
  watch,
} from './chronicle-screen';

/** How many tiles of a row past the unit's own the pan crosses, every one of them lit. */
const ROW = 3;

/**
 * How many notches the map is zoomed in before the pan, so that a tap of the pan key, which moves the
 * map as far as one frame's length carries it, moves it less than two tiles on a slow runner.
 */
const ZOOMED = 2;

/** How many taps of a pan key a spec waits for the map to move a tile under the pointer. */
const TAPS = 30;

/**
 * The first seed's turn 1 with a scout entered on the city's tile: a landing its path reaches in
 * two steps or more, and the way along its row, east or west, that lights the next `ROW` tiles, a
 * step onto any of them declaring no war.
 */
function afield(): { chronicle: Chronicle; scout: Unit; far: TileCoords; way: 1 | -1 } {
  return firstSeed(
    'lights a landing two steps off and a row of landings beside its scout',
    (seed) => {
      const settled = settledOn(seed);
      const tile = playerCityTile(settled);
      const chronicle = unitEntered(settled, { type: SCOUT, faction: 'player', tile });
      const [scout] = playersOf(chronicle);
      const { landings } = byHand(CATALOGUE, chronicle, scout);
      const lit = new Set(landings.map((landing) => tileKey(landing.tile)));
      const far = landings.find(
        (landing) => (pathTo(CATALOGUE, chronicle, scout, landing.tile)?.length ?? 0) > 2,
      );
      const way = ([1, -1] as const).find((along) =>
        Array.from({ length: ROW }, (_, at) => alongRow(scout.tile, along, at + 1)).every(
          (one) =>
            lit.has(tileKey(one)) &&
            !declaresWar(CATALOGUE, chronicle, { type: 'move', unit: scout.id, tile: one }),
        ),
      );
      return far === undefined || way === undefined
        ? undefined
        : { chronicle, scout, far: far.tile, way };
    },
  );
}

/** The tile that many tiles along the row from this one, east or west. */
function alongRow({ q, r }: TileCoords, way: 1 | -1, by: number): TileCoords {
  return { q: q + way * by, r };
}

/** The path the map is drawing, by its tiles' keys, read after a drawn frame; nothing while none stands. */
async function pathKeys(page: Page): Promise<string[] | undefined> {
  await rested(page);
  return (await pathDrawn(page))?.tiles;
}

/**
 * The map draws the scout's path to the landing as the rules answer it: two chevrons a step, each on
 * the line between the step's two tiles, in the step's order, running at the drop the number stands
 * at below the landing; and the number reads the move points the scout would have left.
 */
async function drawnTo(
  page: Page,
  chronicle: Chronicle,
  scout: Unit,
  to: TileCoords,
): Promise<void> {
  const tiles = pathTo(CATALOGUE, chronicle, scout, to) ?? [];
  const landing = byHand(CATALOGUE, chronicle, scout).landings.find(
    (one) => tileKey(one.tile) === tileKey(to),
  );
  if (landing === undefined) throw new Error(`${tileKey(to)} is no landing of the scout's`);
  await expect.poll(() => pathKeys(page)).toEqual(tiles.map(tileKey));

  const drawn = (await pathDrawn(page)) as PathDrawn;
  expect(drawn.left.text).toBe(String((scout.movePoints - landing.cost) / MOVE_POINT));
  expect(drawn.chevrons).toHaveLength(2 * (tiles.length - 1));
  const last = drawn.faces[drawn.faces.length - 1];
  const drop = { x: drawn.left.at.x - last.x, y: drawn.left.at.y - last.y };
  expect(drop.x).toBeCloseTo(0, 6);
  expect(drop.y).toBeGreaterThan(0);
  for (let step = 1; step < drawn.faces.length; step++) {
    const from = { x: drawn.faces[step - 1].x + drop.x, y: drawn.faces[step - 1].y + drop.y };
    const to = { x: drawn.faces[step].x + drop.x, y: drawn.faces[step].y + drop.y };
    const span = { x: to.x - from.x, y: to.y - from.y };
    const length = Math.hypot(span.x, span.y);
    const along = drawn.chevrons.slice(2 * (step - 1), 2 * step).map((chevron) => {
      const off = { x: chevron.x - from.x, y: chevron.y - from.y };
      expect((off.x * span.y - off.y * span.x) / length).toBeCloseTo(0, 6);
      return (off.x * span.x + off.y * span.y) / length ** 2;
    });
    expect(along[0]).toBeGreaterThan(0);
    expect(along[1]).toBeGreaterThan(along[0]);
    expect(along[1]).toBeLessThan(1);
  }
}

/** Moves the pointer onto the tile's face, in one move. */
async function pointAt(page: Page, tile: TileCoords): Promise<void> {
  const at = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.move(at.x, at.y);
}

/** Which of these tiles of one row stands nearest the point along the row, on the page. */
async function nearestAlong(
  page: Page,
  row: readonly TileCoords[],
  at: { x: number },
): Promise<TileCoords> {
  const names = row.map((tile) => `tile-${tileKey(tile)}`);
  const read = await readings(page, names);
  const gaps = names.map((name) => Math.abs(read(name).onScreen.x - at.x));
  return row[gaps.indexOf(Math.min(...gaps))];
}

test('a scout being aimed wears its path to the lit tile the pointer is on, keeps it beside the lit tiles, and drops it on its own tile and at a step', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(2));
  const { chronicle, scout, far, way } = afield();
  const own = scout.tile;
  const beside = alongRow(own, way, 1);
  const other = far.q === beside.q && far.r === beside.r ? alongRow(own, way, 2) : beside;

  await openSaved(page, chronicle);
  expect(await pathKeys(page)).toBeUndefined();

  // Selected, under a pointer resting on its own tile: no path yet.
  await click(page, `tile-${tileKey(own)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  expect(await pathKeys(page)).toBeUndefined();

  await pointAt(page, far);
  await drawnTo(page, chronicle, scout, far);

  const off = await besideTiles(page);
  await page.mouse.move(off.x, off.y);
  expect(await pathKeys(page)).toEqual(pathTo(CATALOGUE, chronicle, scout, far)?.map(tileKey));

  await pointAt(page, other);
  await drawnTo(page, chronicle, scout, other);

  await pointAt(page, own);
  await expect.poll(() => pathKeys(page)).toBeUndefined();

  // Dragged over a lit tile, then let go beside the tiles: home again, the path still on that tile.
  await page.mouse.down();
  const toward = await onScreen(page, `tile-${tileKey(far)}`);
  await page.mouse.move(toward.x, toward.y, { steps: 5 });
  await drawnTo(page, chronicle, scout, far);
  await page.mouse.move(off.x, off.y);
  await rested(page);
  await page.mouse.up();
  await rested(page);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await pathKeys(page)).toEqual(pathTo(CATALOGUE, chronicle, scout, far)?.map(tileKey));

  // The map panned by key under a pointer that never moved: the path follows the tile now under it.
  const resting = await onScreen(page, `tile-${tileKey(beside)}`);
  await page.mouse.move(resting.x, resting.y);
  await drawnTo(page, chronicle, scout, beside);
  const [pan] = DEFAULTS[way === 1 ? 'pan-right' : 'pan-left'];
  const [zoom] = DEFAULTS['zoom-in'];
  if (pan === undefined || zoom === undefined) throw new Error('a control stands on no key');
  for (let notch = 0; notch < ZOOMED; notch++) {
    await page.keyboard.press(zoom.code);
    await rested(page);
  }
  const row = Array.from({ length: ROW + 1 }, (_, at) => alongRow(own, way, at));
  let under = beside;
  for (let taps = 0; tileKey(under) === tileKey(beside); taps++) {
    if (taps === TAPS) throw new Error(`${TAPS} taps of the pan key left the pointer where it was`);
    await page.keyboard.press(pan.code);
    await rested(page);
    under = await nearestAlong(page, row, resting);
  }
  expect(row.slice(1).map(tileKey)).toContain(tileKey(under));
  await drawnTo(page, chronicle, scout, under);

  // A click on the lit tile under it is the step, and the pointer rests on the scout's tile then.
  await page.mouse.down();
  await page.mouse.up();
  await playedOut(page);
  const stepped = outcome(
    apply(CATALOGUE, chronicle, { type: 'move', unit: scout.id, tile: under }),
  );
  await expect.poll(() => chronicleOf(page)).toEqual(stepped);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(under));
  expect(await pathKeys(page)).toBeUndefined();

  expect(problems).toEqual([]);
});
