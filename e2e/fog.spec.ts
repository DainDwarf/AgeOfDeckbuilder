import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { campUnit } from '../src/rules/enemies';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { charted, chartedAt, inSight } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { reachable } from '../src/rules/units';
import {
  campGround,
  chronicleOf,
  cityTileOf,
  consoleKey,
  counted,
  dragUnit,
  drawnFaces,
  enter,
  firstSeed,
  glyphs,
  glyphsOf,
  marksIn,
  nearestUncharted,
  openSaved,
  playersOf,
  rested,
  ringedTile,
  riverRuns,
  settledOn,
  shownCard,
  shows,
  standing,
  tileOnScreen,
  unitEntered,
  watch,
} from './chronicle-screen';

/** The settle card that enters the scout. */
const FIRST_SCOUT = 'first-scout';

/** The chronicle the step leaves, or none where the rules refuse the move. */
function stepped(chronicle: Chronicle, to: TileCoords): Chronicle | undefined {
  const [unit] = playersOf(chronicle);
  const moved = outcome(apply(NOMADIC, chronicle, { type: 'move', unit: unit.id, tile: to }));
  return moved === chronicle ? undefined : moved;
}

/**
 * Seed 1's turn 1 with the first scout on the city, and the first neighbour whose round trip leaves
 * the map showing all three states at once: the tile it stepped onto in sight, a tile it charted from
 * there and no longer sees in fog, and a tile nobody has seen uncharted.
 */
function roundTrip(): {
  scouted: Chronicle;
  out: TileCoords;
  back: Chronicle;
  fog: TileCoords;
  uncharted: TileCoords;
} {
  const scouted = settledOn(NOMADIC, 1, [FIRST_SCOUT]);
  const city = cityTileOf(scouted);
  const before = new Set(scouted.snapshots.map(tileKey));
  for (const out of neighbours(city)) {
    const there = stepped(scouted, out);
    const back = there && stepped(there, city);
    if (back === undefined) continue;
    const seen = inSight(NOMADIC, back);
    const chartedTiles = new Set(back.snapshots.map(tileKey));
    const fog = back.snapshots.find(
      (snapshot) => !seen.has(tileKey(snapshot)) && !before.has(tileKey(snapshot)),
    );
    const uncharted = back.tiles.find((tile) => !chartedTiles.has(tileKey(tile)));
    if (fog === undefined || uncharted === undefined) continue;
    return {
      scouted,
      out,
      back,
      fog: { q: fog.q, r: fog.r },
      uncharted: { q: uncharted.q, r: uncharted.r },
    };
  }
  throw new Error('no round trip of the scout off the city leaves a tile in fog');
}

/**
 * Seed 1's bare turn 1 with a guard of the camp's entered four tiles from the city and that tile
 * charted, so the enemy's mark stands in fog there; and the tile.
 */
function enemyInFog(): { chronicle: Chronicle; fog: TileCoords } {
  const bare = settledOn(NOMADIC, 1);
  const [fog] = campGround(bare, 4);
  if (fog === undefined) throw new Error('seed 1 leaves no ground four tiles from its city');
  const guarded = unitEntered(bare, campUnit(NOMADIC, fog, 'guard'));
  return { chronicle: charted(NOMADIC, chartedAt(NOMADIC, guarded, fog)), fog };
}

/**
 * The first seed whose turn 1, the first scout on the city, runs rivers along no charted tile, and
 * the first landing of the scout's, in the order the rules list them, that charts one; and the
 * chronicle the step leaves.
 */
function riverUncharted(): { scouted: Chronicle; landing: TileCoords; stepped: Chronicle } {
  return firstSeed('charts a river on the scout’s first step', (seed) => {
    const scouted = settledOn(NOMADIC, seed, [FIRST_SCOUT]);
    if (scouted.rivers.length === 0 || riverRuns(scouted) > 0) return undefined;
    const [scout] = playersOf(scouted);
    for (const { tile } of reachable(NOMADIC, scouted, scout)) {
      const moved = stepped(scouted, tile);
      if (moved !== undefined && riverRuns(moved) > 0)
        return { scouted, landing: tile, stepped: moved };
    }
    return undefined;
  });
}

test('the map draws a tile in sight live, a tile in fog under its scrim, and an uncharted tile not at all', async ({
  page,
}) => {
  const problems = watch(page);
  const run = roundTrip();
  const city = cityTileOf(run.scouted);

  await openSaved(page, run.scouted);

  // Before the scout steps out, the tile it will see from there is uncharted like any other.
  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(false);

  await dragUnit(page, city, run.out);
  await dragUnit(page, run.out, city);
  expect(await chronicleOf(page)).toEqual(run.back);

  expect(await standing(page, `tile-${tileKey(run.out)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.out)}`)).toBe(false);

  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.fog)}`)).toBe(true);

  expect(await standing(page, `tile-${tileKey(run.uncharted)}`)).toBe(false);
  expect(await standing(page, `fog-${tileKey(run.uncharted)}`)).toBe(false);

  // The map draws a face for every tile it has ever seen, and one scrim for each of them in fog.
  const seen = inSight(NOMADIC, run.back);
  expect(await marksIn(page, 'terrain')).toBe(run.back.snapshots.length);
  expect(await marksIn(page, 'fog')).toBe(
    run.back.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length,
  );

  expect(problems).toEqual([]);
});

test('the overlay, the inspection and a press read what the map draws, and widen with it', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: stood, fog } = enemyInFog();
  const uncharted = nearestUncharted(stood);

  await openSaved(page, stood);

  // The overlay glyphs the tiles the map draws, each from the face it draws of it.
  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  const kept = stood.snapshots.find((snapshot) => tileKey(snapshot) === tileKey(fog));
  expect(kept?.unit?.faction).toBe('enemy');
  expect(await glyphs(page)).toEqual(glyphsOf(stood, drawnFaces(stood)));

  // The tile in fog inspects as it was last seen, and the enemy on it is a mark and not a card.
  const fogged = await tileOnScreen(page, fog);
  await page.mouse.click(fogged.x, fogged.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(fog));
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('i');
    await rested(page);
    await rested(page);
    const card = await shownCard(page);
    expect(card).toBeDefined();
    expect(card).not.toBe('unit');
  }

  // A press on an uncharted tile lands off the map: it rings nothing and inspects nothing.
  const dark = await tileOnScreen(page, uncharted);
  await page.mouse.click(dark.x, dark.y);
  await rested(page);
  await rested(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  // The veil off, the map draws the whole disc: the overlay widens with it, and the press lands.
  expect(await glyphs(page)).toEqual(glyphsOf(stood, stood.tiles));
  await page.mouse.click(dark.x, dark.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(uncharted));

  expect(problems).toEqual([]);
});

test('the map draws no river between two uncharted tiles, and draws one along a tile just charted', async ({
  page,
}) => {
  const problems = watch(page);
  const run = riverUncharted();

  await openSaved(page, run.scouted);

  // The map runs rivers, and every edge of them lies between two tiles nobody has charted yet.
  expect(await counted(page, 'river')).toBe(0);

  await dragUnit(page, cityTileOf(run.scouted), run.landing);
  expect(await chronicleOf(page)).toEqual(run.stepped);
  expect(await counted(page, 'river')).toBe(riverRuns(run.stepped));

  expect(problems).toEqual([]);
});
