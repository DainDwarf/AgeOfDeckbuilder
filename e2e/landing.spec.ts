import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { featurePlaced } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { featureKind } from '../src/rules/map-kinds';
import { offered } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import { followed, unchanged, walked } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import {
  budget,
  firstSeed,
  inside,
  mapFrame,
  onScreen,
  openSaved,
  rested,
  restedOnDeal,
  settledOn,
  standing,
  stoppedTurn,
  take,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** The event whose answer charts the tile it deals a feature onto, and that answer. */
const HERD = 'herd';
const FOLLOW = 'follow-it';

/** The features follow-it deals, each onto the terrain it lies on. */
const HERDS = ['deer', 'cattle'];

/** Whether the map draws the tile on the chronicle: in sight, or charted in fog. */
function drawnOn(chronicle: Chronicle, key: string): boolean {
  return (
    inSight(CATALOGUE, chronicle).has(key) ||
    chronicle.snapshots.some((kept) => tileKey(kept) === key)
  );
}

/**
 * The chronicle with a feature placed on every tile the map draws that carries none and lies under
 * one of `HERDS`, so follow-it deals onto a tile the map does not draw.
 */
function herdsDrawnPlaced(chronicle: Chronicle): Chronicle {
  const lyingOn = new Map(
    HERDS.map((feature) => [featureKind(CATALOGUE, feature).terrain, feature]),
  );
  let placing = unchanged(chronicle);
  for (const { q, r, terrain, feature } of chronicle.tiles) {
    const herd = lyingOn.get(terrain);
    if (herd === undefined || feature !== undefined || !drawnOn(chronicle, tileKey({ q, r }))) {
      continue;
    }
    placing = followed(placing, (left) => featurePlaced(CATALOGUE, left, { q, r }, herd));
  }
  return placing.chronicle;
}

/**
 * The first seed, its turn 1 as `herdsDrawnPlaced` leaves it, whose first deal is the herd alone and
 * whose follow-it charts a tile the map does not draw: the chronicle whose end of turn deals it, where
 * follow-it stands in the deal, and the tile.
 */
function herdDealt(): { before: Chronicle; at: number; tile: TileCoords } {
  const turns = 20;
  const complaint = `deals the herd alone as its first deal at one of ${turns} ended turns, its follow-it charting a tile the map does not draw`;
  return firstSeed(complaint, (seed) => {
    let before = herdsDrawnPlaced(settledOn(seed));
    if (before.deals.length > 0) return undefined;
    let dealt = before;
    for (let turn = 0; turn < turns && dealt.deals.length === 0; turn++) {
      if (dealt.ending !== undefined) return undefined;
      before = dealt;
      dealt = outcome(apply(CATALOGUE, dealt, { type: 'end-turn' }));
    }
    const [deal, ...behind] = dealt.deals;
    if (deal?.of !== 'event' || deal.event !== HERD || behind.length > 0) return undefined;

    const at = offered(CATALOGUE, deal).indexOf(FOLLOW);
    const [tile] = [...walked(apply(CATALOGUE, dealt, { type: 'take', at }))].flatMap((stage) =>
      stage.name === 'charted' ? [stage.tile] : [],
    );
    if (tile === undefined || drawnOn(dealt, tileKey(tile))) return undefined;
    return { before, at, tile };
  });
}

/**
 * Holds the pan keys until the tile stands off the frame: sideways first, then up or down, each held
 * until the tile is out or the map stands against its bounds.
 */
async function pushOut(page: Page, coord: TileCoords): Promise<void> {
  const frame = await mapFrame(page);
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  for (const axis of ['x', 'y'] as const) {
    let at = await tileOnScreen(page, coord);
    if (!inside(at, frame)) return;
    // The frame pans away from the side the tile stands on, so the tile goes on towards it.
    const key = axis === 'x' ? (at.x < middle.x ? 'd' : 'a') : at.y < middle.y ? 's' : 'w';
    await page.keyboard.down(key);
    for (;;) {
      await rested(page);
      const now = await tileOnScreen(page, coord);
      const still = now.x === at.x && now.y === at.y;
      at = now;
      if (!inside(at, frame) || still) break;
    }
    await page.keyboard.up(key);
    await rested(page);
  }
}

test("an answer's charted tile, out of the frame under the deal window, is brought into it and drawn", async ({
  page,
}) => {
  const problems = watch(page);
  // The end of turn stops on the deal, and the take plays the rest of it out.
  test.setTimeout(budget(2));
  const run = herdDealt();
  const key = tileKey(run.tile);

  await openSaved(page, run.before);
  await rested(page);

  // A tile near the middle of the disc leaves a frame at full width only zoomed in, and under the
  // deal window the map hears no key: it is zoomed and panned before the turn ends.
  const frame = await mapFrame(page);
  const unzoomed = await tileOnScreen(page, run.tile);
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  for (let notch = 0; notch < 2; notch++) await page.keyboard.press('=');
  await rested(page);
  expect((await tileOnScreen(page, run.tile)).unit).toBeGreaterThan(unzoomed.unit);

  await pushOut(page, run.tile);
  await stoppedTurn(page);
  await restedOnDeal(page);
  expect(inside(await tileOnScreen(page, run.tile), frame)).toBe(false);
  expect(await standing(page, `tile-${key}`)).toBe(false);
  expect(await standing(page, `feature-${key}`)).toBe(false);

  await take(page, run.at);
  await rested(page);

  expect(await standing(page, 'deal')).toBe(false);
  expect(await standing(page, `tile-${key}`)).toBe(true);
  expect(await standing(page, `feature-${key}`)).toBe(true);
  expect(inside(await onScreen(page, `tile-${key}`), frame)).toBe(true);
  expect(inside(await onScreen(page, `feature-${key}`), frame)).toBe(true);

  expect(problems).toEqual([]);
});
