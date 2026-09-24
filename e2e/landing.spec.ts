import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileKey } from '../src/rules/map';
import { offered } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import { walked } from '../src/rules/stages';
import {
  budget,
  endedTurn,
  firstSeed,
  inside,
  launch,
  mapFrame,
  onScreen,
  open,
  rested,
  standing,
  stoppedTurn,
  take,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** The schedule whose one event deals an answer that charts the tile it deals a feature onto. */
const WILDS = 'PH_WildsSchedule';

/**
 * The first seed whose first deal stands alone and deals the wilds, and whose `PH_Follow` charts a
 * tile the map does not draw on the chronicle the deal stands on; the turn that deal is due on, the
 * place `PH_Follow` stands in it, and the tile.
 */
function followRun(): { seed: number; due: number; at: number; tile: TileCoords } {
  return firstSeed('charts a tile the map does not draw on its first deal', (seed) => {
    const opened = launch(seed, deckOf(STAND_IN, 'PH_Deck'), WILDS);
    const due = opened.timeline.next;

    let chronicle = opened;
    for (let turn = 1; turn < due - 1; turn++) chronicle = endedTurn(chronicle);
    const dealt = outcome(apply(STAND_IN, chronicle, { type: 'end-turn' }));
    const [deal, ...behind] = dealt.deals;
    if (deal?.of !== 'event' || deal.event !== 'PH_Wilds' || behind.length > 0) return undefined;

    const at = offered(STAND_IN, deal).indexOf('PH_Follow');
    const [tile] = [...walked(apply(STAND_IN, dealt, { type: 'take', at }))].flatMap((stage) =>
      stage.name === 'charted' ? [stage.tile] : [],
    );
    if (tile === undefined) return undefined;
    const key = tileKey(tile);
    const drawn =
      inSight(STAND_IN, dealt).has(key) || dealt.snapshots.some((kept) => tileKey(kept) === key);
    return drawn ? undefined : { seed, due, at, tile };
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

test("an answer's charted tile, pushed out of the frame under the deal window, is brought into it and drawn", async ({
  page,
}) => {
  const problems = watch(page);
  const run = followRun();
  // The turns ended up to the due one, and the take that plays the rest of it out.
  test.setTimeout(budget(run.due));
  const key = tileKey(run.tile);

  await open(page, run.seed, 'PH_Deck', WILDS);
  // A wheel notch over the deal window's scrim is the scrim's, so the map is zoomed before it rises.
  const frame = await mapFrame(page);
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  for (let notch = 0; notch < 2; notch++) await page.mouse.wheel(0, -100);
  await rested(page);

  for (let turn = 1; turn < run.due; turn++) await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await pushOut(page, run.tile);
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
