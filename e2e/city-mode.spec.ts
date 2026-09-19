import { expect, type Page, test } from '@playwright/test';
import { STAND_IN, STAND_IN_SCHEDULE } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { claimable, tileCost } from '../src/rules/city';
import { CENTRE, distance, runsAlong, type TileCoords, tileKey, tileYield } from '../src/rules/map';
import { RESOURCES } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  type Border,
  besideTiles,
  budget,
  chronicleOf,
  cityTileOf,
  click,
  consoleKey,
  counted,
  dragOut,
  dragTiles,
  drawnFaces,
  endTurn,
  enter,
  type Glyphs,
  glyphs,
  glyphsOf,
  launch,
  marksIn,
  noGlyphs,
  open,
  openOnCapstone,
  playedOut,
  playersOf,
  refusalLines,
  rested,
  ringedTile,
  settle,
  shownCard,
  shows,
  standing,
  stepRun,
  thresholdShown,
  tileOnScreen,
  watch,
} from './chronicle-screen';

/** A tile the opening's border touches and the city has charted: what a claim takes first. */
const TOUCHING = { at: { q: 1, r: -2 }, key: '1,-2' };

/** A tile beside the bare city, charted from the settle: what a claim on the bare city takes. */
const BESIDE = { at: { q: 1, r: -1 }, key: '1,-1' };

/** A tile out beyond the centre part the border does not touch, and uncharted from the opening. */
const FAR = { at: { q: 1, r: -4 }, key: '1,-4' };

/** A tile the city holds, and one population stands on from the opening. */
const HELD = { at: { q: 0, r: -1 }, key: '0,-1' };

/** Another one of them, on the other side of the city: what a drag carries one population from. */
const WORKED = { at: { q: 0, r: 1 }, key: '0,1' };

/** How many tiles the city holds from the opening, one population on each. */
const RING = 7;

/** What the note says over a tile whose claim the city cannot pay for. */
const UNPAID = [text('refusal.unpaid')];

/** The chronicle `open` settles on seed 1, with the border asked for. */
function opening(border: Border = 'ring'): Chronicle {
  return launch(1, deckOf(STAND_IN, 'PH_Deck'), STAND_IN_SCHEDULE, CENTRE, border);
}

/** The culture threshold a claim on the tile asks for, as the tile wears it. */
function threshold(chronicle: Chronicle, tile: TileCoords): string {
  const [cost] = tileCost(chronicle, tile);
  return text('threshold.culture', { culture: cost.amount });
}

/** How many claims the opening opens on, by the rules' own count: one mark to be drawn for each. */
function claims(): number {
  return claimable(STAND_IN, opening()).length;
}

/** Whether the chronicle screen shows city mode is on: both marks stand, or neither does. */
async function inCityMode(page: Page): Promise<boolean> {
  const chip = await shows(page, 'city-chip');
  const frame = await shows(page, 'city-frame');
  expect(frame).toBe(chip);
  return chip;
}

/**
 * A tile the opening charts and leaves bare: its terrain and nothing else, no river running along
 * it, outside the border. So it inspects its terrain, and a right click on it claims nothing.
 */
async function bareTile(page: Page): Promise<TileCoords> {
  const chronicle = await chronicleOf(page);
  const seen = new Set(chronicle.snapshots.map(tileKey));
  const found = chronicle.tiles.find(
    (tile) =>
      distance(tile, cityTileOf(chronicle)) === 2 &&
      seen.has(tileKey(tile)) &&
      tile.feature === undefined &&
      tile.building === undefined &&
      tile.improvements.length === 0 &&
      !runsAlong(chronicle.rivers, tile),
  );
  if (found === undefined) throw new Error('the opening charts no bare tile two tiles out');
  return { q: found.q, r: found.r };
}

/** Two frames, so whatever the last gesture handed the chronicle screen has been answered. */
async function answered(page: Page): Promise<void> {
  await rested(page);
  await rested(page);
}

/** What the tiles inside the border yield, point by point, and what every tile the map draws does. */
async function yielded(page: Page): Promise<{ inside: Glyphs; drawn: Glyphs }> {
  const chronicle = await chronicleOf(page);
  const held = new Set(chronicle.held.map(tileKey));
  const inside = noGlyphs();
  const drawn = noGlyphs();
  for (const face of drawnFaces(chronicle)) {
    const yields = tileYield(STAND_IN, face, chronicle.rivers);
    for (const resource of RESOURCES) {
      const points = yields[resource] ?? 0;
      drawn[resource] += points;
      if (held.has(tileKey(face))) inside[resource] += points;
    }
  }
  return { inside, drawn };
}

test('before the settle neither the city key nor culture nor population enters city mode, and once the city stands the city key does', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openOnCapstone(page, 1, 'PH_Deck');
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);

  await page.keyboard.press('c');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-culture');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-population');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  await settle(page, CENTRE, 'bare');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('the city key enters city mode, where a click rings a tile and stands the culture threshold on it, and the back key drops both', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await inCityMode(page)).toBe(false);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const near = await tileOnScreen(page, TOUCHING.at);
  await page.mouse.click(near.x, near.y);
  await expect.poll(() => ringedTile(page)).toBe(TOUCHING.key);
  expect(await thresholdShown(page)).toBe(threshold(opening(), TOUCHING.at));
  expect(await refusalLines(page)).toBeUndefined();
  expect((await chronicleOf(page)).held.map(tileKey)).not.toContain(TOUCHING.key);

  // The first back key drops the selection and what it wore; the mode stands until the next one.
  await page.keyboard.press('Escape');
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  expect(problems).toEqual([]);
});

test('city mode lets go of the selection as it comes on', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const near = await tileOnScreen(page, TOUCHING.at);
  await page.mouse.click(near.x, near.y);
  await expect.poll(() => ringedTile(page)).toBe(TOUCHING.key);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a second left click on the city’s own tile enters city mode, and on any other tile changes nothing', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  const own = cityTileOf(await chronicleOf(page));
  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  expect(await inCityMode(page)).toBe(false);

  await page.mouse.click(city.x, city.y);
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  const near = await tileOnScreen(page, TOUCHING.at);
  await page.mouse.click(near.x, near.y);
  await expect.poll(() => ringedTile(page)).toBe(TOUCHING.key);

  await page.mouse.click(near.x, near.y);
  await answered(page);
  expect(await ringedTile(page)).toBe(TOUCHING.key);
  expect(await inCityMode(page)).toBe(false);

  expect(problems).toEqual([]);
});

test('a right click in city mode inspects the tile under it without selecting, and leaving the mode drops it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const at = await tileOnScreen(page, await bareTile(page));
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // Its terrain card is the whole of it, so a further press leaves that card standing.
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await answered(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // The first back key takes the infopanel down; the mode stands until the next one.
  await page.keyboard.press('Escape');
  await answered(page);
  expect(await shownCard(page)).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  // What the mode is left on goes down with it, however it is left.
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await shownCard(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a press beside the tiles in city mode drops the selection and the inspection with it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const bare = await bareTile(page);
  const at = await tileOnScreen(page, bare);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(bare));

  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(tileKey(bare));

  const away = await besideTiles(page);
  await page.mouse.click(away.x, away.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('a press on culture or population enters city mode, and the chip leaves it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'reading-culture');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, 'reading-population');
  await answered(page);
  expect(await inCityMode(page)).toBe(true);

  await click(page, 'city-chip');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-population');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('city mode marks every tile the population stands on, and a second click on the selected one takes it off and puts it back', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await counted(page, 'assigned')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'assigned')).toBe(RING);
  expect(await counted(page, 'city-dim')).toBe(0);

  const held = await tileOnScreen(page, HELD.at);
  await page.mouse.click(held.x, held.y);
  await expect.poll(() => ringedTile(page)).toBe(HELD.key);
  expect(await counted(page, 'assigned')).toBe(RING);
  expect(await refusalLines(page)).toBeUndefined();
  // The city holds it, so there is no claim on it to ask for anything.
  expect(await thresholdShown(page)).toBeUndefined();

  await page.mouse.click(held.x, held.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(RING - 1);
  expect(await counted(page, 'city-dim')).toBe(1);
  await expect.poll(() => ringedTile(page)).toBe(HELD.key);

  await page.mouse.click(held.x, held.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(RING);
  expect(await counted(page, 'city-dim')).toBe(0);

  // The city's own tile is one of the tiles it works, and its second click acts as any other's does.
  const own = cityTileOf(await chronicleOf(page));
  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(RING - 1);
  expect(await inCityMode(page)).toBe(true);

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await counted(page, 'assigned')).toBe(0);

  expect(problems).toEqual([]);
});

test('a drag in city mode carries the population onto the tile the city holds and nobody stands on, and selects it', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const held = await tileOnScreen(page, HELD.at);
  await page.mouse.click(held.x, held.y);
  await expect.poll(() => ringedTile(page)).toBe(HELD.key);
  await page.mouse.click(held.x, held.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(RING - 1);
  expect(await counted(page, 'city-dim')).toBe(1);

  const worked = await tileOnScreen(page, WORKED.at);
  await page.mouse.click(worked.x, worked.y);
  await expect.poll(() => ringedTile(page)).toBe(WORKED.key);

  await dragTiles(page, WORKED.at, HELD.at);
  const carried = await chronicleOf(page);

  expect(carried.assigned.map(tileKey)).toContain(HELD.key);
  expect(carried.assigned.map(tileKey)).not.toContain(WORKED.key);
  expect(await counted(page, 'assigned')).toBe(RING - 1);
  expect(await counted(page, 'city-dim')).toBe(1);
  // The tile it landed on takes the ring, so the next press on it is the city's next act there.
  await expect.poll(() => ringedTile(page)).toBe(HELD.key);

  expect(problems).toEqual([]);
});

test('a drag in city mode let go anywhere else changes nothing and leaves the selection where it was', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const held = await tileOnScreen(page, HELD.at);
  await page.mouse.click(held.x, held.y);
  await expect.poll(() => ringedTile(page)).toBe(HELD.key);
  const before = await chronicleOf(page);

  await dragTiles(page, WORKED.at, TOUCHING.at);
  await answered(page);
  expect(await chronicleOf(page)).toEqual(before);
  expect(await counted(page, 'assigned')).toBe(RING);
  expect(await ringedTile(page)).toBe(HELD.key);

  await dragTiles(page, WORKED.at, HELD.at);
  await answered(page);
  expect(await chronicleOf(page)).toEqual(before);
  expect(await counted(page, 'assigned')).toBe(RING);
  expect(await ringedTile(page)).toBe(HELD.key);

  expect(problems).toEqual([]);
});

test('a unit’s tile selected in city mode lights nothing, and a click on the tile it could step to selects it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = stepRun();
  // The run's ends of turn, and the worker entered on the turn it opens.
  test.setTimeout(budget(run.turn + 1));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => playersOf(await chronicleOf(page)).length).toBe(1);

  const entered = await chronicleOf(page);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, `tile-${tileKey(cityTileOf(entered))}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(cityTileOf(entered)));
  expect(await marksIn(page, 'lit')).toBe(0);

  await click(page, `tile-${tileKey(run.first)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(run.first));
  expect(await marksIn(page, 'lit')).toBe(0);
  expect(await chronicleOf(page)).toEqual(entered);

  expect(problems).toEqual([]);
});

test('city mode marks every tile the city can claim, and leaving it takes the marks down', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await counted(page, 'claimable')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'claimable')).toBe(claims());

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await counted(page, 'claimable')).toBe(0);

  expect(problems).toEqual([]);
});

test('a second click the city cannot pay for claims nothing and says so, one it can pay for claims the tile, and one on no act of the city’s says nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = opening('bare');
  const asked = threshold(bare, BESIDE.at);

  await open(page, 1, 'PH_Deck', STAND_IN_SCHEDULE, CENTRE, 'bare');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  // The uncharted veil off, so the press on the far tile lands on it and the rules answer it.
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  const near = await tileOnScreen(page, BESIDE.at);
  const far = await tileOnScreen(page, FAR.at);

  await page.mouse.click(near.x, near.y);
  await expect.poll(() => thresholdShown(page)).toBe(asked);
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(near.x, near.y);
  await answered(page);
  expect(await refusalLines(page)).toEqual(UNPAID);
  // The tile goes on wearing what the claim asks for, under the note.
  expect(await thresholdShown(page)).toBe(asked);
  expect((await chronicleOf(page)).held.map(tileKey)).not.toContain(BESIDE.key);

  await page.mouse.click(far.x, far.y);
  await expect.poll(() => ringedTile(page)).toBe(FAR.key);
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await answered(page);
  expect(await ringedTile(page)).toBe(FAR.key);
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await endTurn(page);
  expect((await chronicleOf(page)).resources.culture).toBe(1);

  await page.mouse.click(near.x, near.y);
  await expect.poll(() => thresholdShown(page)).toBe(asked);
  await page.mouse.click(near.x, near.y);
  await playedOut(page);
  const claimed = await chronicleOf(page);

  expect(claimed.held.map(tileKey)).toContain(BESIDE.key);
  expect(claimed.resources.culture).toBe(0);
  expect(await counted(page, 'assigned')).toBe(bare.held.length + 1);
  // The tile claimed is a claim no longer, and the marks are the claims the moved border opens.
  expect(claimable(STAND_IN, claimed).map(tileKey)).not.toContain(BESIDE.key);
  expect(await counted(page, 'claimable')).toBe(claimable(STAND_IN, claimed).length);
  // The tile the claim took stays selected, and asks for nothing more.
  await expect.poll(() => ringedTile(page)).toBe(BESIDE.key);
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await answered(page);
  expect(await refusalLines(page)).toBeUndefined();
  expect(claimable(STAND_IN, claimed).map(tileKey)).not.toContain(FAR.key);

  expect(problems).toEqual([]);
});

test('city mode shows what every tile inside the border yields, and nothing of any other tile', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  expect(await glyphs(page)).toEqual(noGlyphs());

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  const { inside, drawn } = await yielded(page);
  expect(inside).not.toEqual(drawn);
  expect(await glyphs(page)).toEqual(inside);
  expect(await shows(page, 'yield-dim')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());

  expect(problems).toEqual([]);
});

test('the tile wearing the culture threshold shows none of the overlay’s glyphs, and shows them again once the selection drops', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');
  await page.keyboard.press('Tab');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const chronicle = await chronicleOf(page);
  const faces = drawnFaces(chronicle);
  const all = glyphsOf(faces, chronicle.rivers);
  const bare = glyphsOf(
    faces.filter((face) => tileKey(face) !== TOUCHING.key),
    chronicle.rivers,
  );
  expect(bare).not.toEqual(all);
  expect(await glyphs(page)).toEqual(all);

  const near = await tileOnScreen(page, TOUCHING.at);
  await page.mouse.click(near.x, near.y);
  await expect.poll(() => thresholdShown(page)).toBe(threshold(opening(), TOUCHING.at));
  expect(await glyphs(page)).toEqual(bare);

  await page.keyboard.press('Escape');
  await expect.poll(() => thresholdShown(page)).toBeUndefined();
  expect(await glyphs(page)).toEqual(all);

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the city key', async ({ page }) => {
  const problems = watch(page);

  await open(page, 1, 'PH_Deck');

  await click(page, 'menu-button');
  await expect.poll(() => standing(page, 'menu')).toBe(true);

  await page.keyboard.press('c');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});
