import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { DECKS } from '../src/rules/cards';
import { apply, outcome, refusalOf } from '../src/rules/chronicle';
import { distance, neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { inSight } from '../src/rules/sight';
import { type Chronicle, playable } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  consoleKey,
  counted,
  dragOut,
  dragUnit,
  drawnFaces,
  endedTurn,
  endTurn,
  enter,
  firstSeed,
  glyphs,
  glyphsOf,
  launch,
  marksIn,
  open,
  ringedTile,
  riverRuns,
  settled,
  shownCard,
  shows,
  standing,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** One tile of each of the three states, on the chronicle a worker's step out and back leaves. */
type Run = {
  readonly seed: number;
  readonly turn: number;
  /** The tile the worker steps onto and off again; the city holds it, so it stays in sight. */
  readonly out: TileCoords;
  readonly fog: TileCoords;
  readonly uncharted: TileCoords;
};

/**
 * The first seed with a turn in its first eight whose worker, stepping one tile off the city and
 * back again, leaves the map showing all three states at once: the tile it stepped onto in sight,
 * a tile it saw from there and no longer does in fog, and one it never saw uncharted.
 */
function fogRun(): Run {
  return firstSeed(
    'opens a turn on a worker whose step out and back leaves a tile in fog',
    (seed) => {
      let chronicle = launch(seed, DECKS.PH_Deck);
      for (let turn = 1; turn <= 8; turn++) {
        const stepped = steppedThisTurn(chronicle);
        if (stepped !== undefined) return { seed, turn, ...stepped };
        chronicle = endedTurn(chronicle);
      }
      return undefined;
    },
  );
}

/** One round trip of a worker: the tile it stepped onto, and the chronicle its step back leaves. */
type RoundTrip = { readonly out: TileCoords; readonly back: Chronicle };

/**
 * Every round trip this hand's worker can make: entered on the city's tile, stepped one tile off it
 * and stepped back again. None at all where the hand holds no worker the city can enter.
 */
function roundTrips(chronicle: Chronicle): RoundTrip[] {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return [];
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: at, aim: 'none' }));
  const worker = entered.units[entered.units.length - 1];
  if (worker.faction !== 'player') return [];

  const trips: RoundTrip[] = [];
  for (const out of neighbours(entered.city)) {
    const stepped = outcome(apply(STAND_IN, entered, { type: 'move', unit: worker.id, tile: out }));
    if (stepped === entered) continue;
    const back = outcome(
      apply(STAND_IN, stepped, { type: 'move', unit: worker.id, tile: entered.city }),
    );
    if (back !== stepped) trips.push({ out, back });
  }
  return trips;
}

/** What this hand's worker leaves behind it when it steps one tile off the city and back again. */
function steppedThisTurn(chronicle: Chronicle): Omit<Run, 'seed' | 'turn'> | undefined {
  for (const { out, back } of roundTrips(chronicle)) {
    const seen = inSight(STAND_IN, back);
    const charted = new Set(back.snapshots.map(tileKey));
    const fog = back.snapshots.find((snapshot) => !seen.has(tileKey(snapshot)));
    const uncharted = back.tiles.find((tile) => !charted.has(tileKey(tile)));
    if (fog === undefined || uncharted === undefined) continue;
    return { out, fog: { q: fog.q, r: fog.r }, uncharted: { q: uncharted.q, r: uncharted.r } };
  }
  return undefined;
}

/** One tile in fog with an enemy standing on it, and one tile the map draws nothing of. */
type EnemyRun = {
  readonly seed: number;
  readonly turn: number;
  /** The tile the worker steps onto and off again. */
  readonly out: TileCoords;
  /** A tile the worker charted from there, in fog now, with an enemy standing on it. */
  readonly fog: TileCoords;
  /** The tile nearest the city that has never been in sight: near enough to press. */
  readonly uncharted: TileCoords;
};

/**
 * The first seed with a turn in its first eight whose worker, stepping one tile off the city and
 * back again, leaves a tile it charted from there in fog with an enemy standing on it.
 */
function enemyInFog(): EnemyRun {
  return firstSeed('leaves an enemy standing in the fog behind a worker', (seed) => {
    let chronicle = launch(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const stepped = foggedThisTurn(chronicle);
      if (stepped !== undefined) return { seed, turn, ...stepped };
      chronicle = endedTurn(chronicle);
      if (chronicle.ending !== undefined) return undefined;
    }
    return undefined;
  });
}

/** Where this hand's worker steps out and back to leave an enemy behind it in fog. */
function foggedThisTurn(chronicle: Chronicle): Omit<EnemyRun, 'seed' | 'turn'> | undefined {
  for (const { out, back } of roundTrips(chronicle)) {
    const seen = inSight(STAND_IN, back);
    const fog = back.snapshots.find(
      (snapshot) =>
        !seen.has(tileKey(snapshot)) &&
        back.units.some((unit) => tileKey(unit.tile) === tileKey(snapshot)),
    );
    if (fog === undefined) continue;
    return { out, fog: { q: fog.q, r: fog.r }, uncharted: nearestUncharted(back) };
  }
  return undefined;
}

/** How many units of the player's stand on the map, the enemies of the turn left out. */
async function playerUnits(page: Page): Promise<number> {
  const { units } = await chronicleOf(page);
  return units.filter((unit) => unit.faction === 'player').length;
}

/** The tile nearest the city that has never been in sight: the closest dark ground to press on. */
function nearestUncharted(chronicle: Chronicle): TileCoords {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  let nearest: TileCoords | undefined;
  let away = Infinity;
  for (const tile of chronicle.tiles) {
    if (seen.has(tileKey(tile))) continue;
    const off = distance(tile, chronicle.city);
    if (off >= away) continue;
    away = off;
    nearest = { q: tile.q, r: tile.r };
  }
  if (nearest === undefined) throw new Error('this chronicle has charted the whole disc');
  return nearest;
}

/** The turn a worker's one step charts a river the map was drawing nothing of. */
type Charting = {
  readonly seed: number;
  readonly turn: number;
  /** The tile the worker steps onto: a river runs along it, and no river was charted before. */
  readonly out: TileCoords;
};

/**
 * The first seed with a turn in its first eight whose worker, stepping one tile off the city, charts
 * a tile a river runs along, on a map whose rivers all lie between uncharted tiles until then.
 */
function riverCharting(): Charting {
  return firstSeed('opens a turn on a worker whose step charts a river', (seed) => {
    let chronicle = launch(seed, DECKS.PH_Deck);
    for (let turn = 1; turn <= 8; turn++) {
      const charted = chartedThisTurn(chronicle);
      if (charted !== undefined) return { seed, turn, out: charted };
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

/** Where this hand's worker steps to chart a river, on a chronicle whose map draws none yet. */
function chartedThisTurn(chronicle: Chronicle): TileCoords | undefined {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1 || !playable(refusalOf(STAND_IN, chronicle, 'PH_Worker'))) return undefined;
  if (chronicle.rivers.length === 0 || riverRuns(chronicle) > 0) return undefined;
  const entered = outcome(apply(STAND_IN, chronicle, { type: 'play', index: at, aim: 'none' }));
  if (entered.units.length !== 1) return undefined;

  for (const out of neighbours(entered.city)) {
    const stepped = outcome(apply(STAND_IN, entered, { type: 'move', unit: 1, tile: out }));
    if (stepped !== entered && riverRuns(stepped) > 0) return out;
  }
  return undefined;
}

test('the map draws a tile in sight live, a tile in fog under its scrim, and an uncharted tile not at all', async ({
  page,
}) => {
  const problems = watch(page);
  const run = fogRun();
  // The run's ends of turn, and the two steps the worker takes on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // Before the worker steps out, the tile it will see from there is uncharted like any other.
  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(false);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.out);
  await dragUnit(page, run.out, entered.city);

  expect(await standing(page, `tile-${tileKey(run.out)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.out)}`)).toBe(false);

  expect(await standing(page, `tile-${tileKey(run.fog)}`)).toBe(true);
  expect(await standing(page, `fog-${tileKey(run.fog)}`)).toBe(true);

  expect(await standing(page, `tile-${tileKey(run.uncharted)}`)).toBe(false);
  expect(await standing(page, `fog-${tileKey(run.uncharted)}`)).toBe(false);

  // The map draws a face for every tile it has ever seen, and one scrim for each of them in fog.
  const stood = await chronicleOf(page);
  const seen = inSight(STAND_IN, stood);
  expect(await marksIn(page, 'terrain')).toBe(stood.snapshots.length);
  expect(await marksIn(page, 'fog')).toBe(
    stood.snapshots.filter((snapshot) => !seen.has(tileKey(snapshot))).length,
  );

  expect(problems).toEqual([]);
});

test('the overlay, the inspection and a press read what the map draws, and widen with it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = enemyInFog();
  // The run's ends of turn, and the two steps the worker takes on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(() => playerUnits(page)).toBe(1);

  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.out);
  await dragUnit(page, run.out, entered.city);

  // The overlay glyphs the tiles the map draws, each from the face it draws of it.
  await page.keyboard.press('Tab');
  await expect.poll(() => shows(page, 'yield-dim')).toBe(true);
  const stood = await chronicleOf(page);
  expect(stood.units.some((unit) => tileKey(unit.tile) === tileKey(run.fog))).toBe(true);
  expect(await glyphs(page)).toEqual(glyphsOf(drawnFaces(stood), stood.rivers));

  // The tile in fog inspects as it was last seen, and the enemy on it is a mark and not a card.
  const fogged = await tileOnScreen(page, run.fog);
  await page.mouse.click(fogged.x, fogged.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.fog));
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('i');
    await settled(page);
    await settled(page);
    const card = await shownCard(page);
    expect(card).toBeDefined();
    expect(card).not.toBe('unit');
  }

  // A press on an uncharted tile lands off the map: it rings nothing and inspects nothing.
  const dark = await tileOnScreen(page, run.uncharted);
  await page.mouse.click(dark.x, dark.y);
  await settled(page);
  await settled(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  // The veil off, the map draws the whole disc: the overlay widens with it, and the press lands.
  expect(await glyphs(page)).toEqual(glyphsOf(stood.tiles, stood.rivers));
  await page.mouse.click(dark.x, dark.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.uncharted));

  expect(problems).toEqual([]);
});

test('the map draws no river between two uncharted tiles, and draws one along a tile just charted', async ({
  page,
}) => {
  const problems = watch(page);
  const run = riverCharting();
  // The run's ends of turn, and the step the worker takes on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  // The map runs rivers, and every edge of them lies between two tiles nobody has charted yet.
  const opened = await chronicleOf(page);
  expect(opened.rivers.length).toBeGreaterThan(0);
  expect(riverRuns(opened)).toBe(0);
  expect(await counted(page, 'river')).toBe(0);

  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  const entered = await chronicleOf(page);
  await dragUnit(page, entered.city, run.out);

  const stepped = await chronicleOf(page);
  expect(riverRuns(stepped)).toBeGreaterThan(0);
  expect(await counted(page, 'river')).toBe(riverRuns(stepped));

  expect(problems).toEqual([]);
});
