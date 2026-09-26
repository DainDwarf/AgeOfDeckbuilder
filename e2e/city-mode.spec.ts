import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { gained } from '../src/rules/cards';
import { apply, type Command, outcome } from '../src/rules/chronicle';
import { claimable, tileCost } from '../src/rules/city';
import { distance, runsAlong, type TileCoords, tileKey } from '../src/rules/map';
import { charted } from '../src/rules/sight';
import type { Chronicle } from '../src/rules/state';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  besideTiles,
  budget,
  capstoneClosed,
  chronicleOf,
  cityTileOf,
  click,
  consoleKey,
  counted,
  dragTiles,
  drawnFaces,
  enter,
  type Glyphs,
  glyphs,
  glyphsOf,
  marksIn,
  nearestUncharted,
  noGlyphs,
  openNew,
  openSaved,
  playedOut,
  refusalLines,
  rested,
  ringedTile,
  settledOn,
  shownCard,
  shows,
  standing,
  thresholdShown,
  tileOnScreen,
  watch,
  wellFill,
  workerStepped,
} from './chronicle-screen';

/** Seed 1's turn 1, the city settled and nothing else played. */
function bareTurn(): Chronicle {
  return settledOn(NOMADIC, 1);
}

/** The culture threshold a claim on the tile asks for, by the rules' own count. */
function threshold(chronicle: Chronicle, tile: TileCoords): number {
  const [cost] = tileCost(chronicle, tile);
  return cost.amount;
}

/** The culture threshold a claim on the tile asks for, as the tile wears it. */
function thresholdWorn(chronicle: Chronicle, tile: TileCoords): string {
  return text('threshold.culture', { culture: threshold(chronicle, tile) });
}

/** The first tile the city may claim, in the order the rules list them. */
function firstClaim(chronicle: Chronicle): TileCoords {
  const [tile] = claimable(NOMADIC, chronicle);
  if (tile === undefined)
    throw new Error(`turn ${chronicle.turn} holds no tile the city may claim`);
  return tile;
}

/** The chronicle the command leaves; a refusal throws. */
function applied(chronicle: Chronicle, command: Command): Chronicle {
  const left = outcome(apply(NOMADIC, chronicle, command));
  if (left === chronicle)
    throw new Error(`the ${command.type} is refused on turn ${chronicle.turn}`);
  return left;
}

/** Bare turn 1 with the culture threshold of a claim gained, and charted as a command is. */
function culturePaid(): Chronicle {
  const bare = bareTurn();
  const culture = threshold(bare, firstClaim(bare));
  return charted(NOMADIC, gained(bare, { culture }).chronicle);
}

/** Culture paid with the first tile the city may claim claimed: nobody stands on it. */
function oneClaimed(): { chronicle: Chronicle; claimed: TileCoords } {
  const paid = culturePaid();
  const claimed = firstClaim(paid);
  return { chronicle: applied(paid, { type: 'claim', tile: claimed }), claimed };
}

/** Whether the chronicle screen shows city mode is on: both marks stand, or neither does. */
async function inCityMode(page: Page): Promise<boolean> {
  const chip = await shows(page, 'city-chip');
  const frame = await shows(page, 'city-frame');
  expect(frame).toBe(chip);
  return chip;
}

/**
 * A tile the chronicle charts and leaves bare: its terrain and nothing else, no river running along
 * it, outside the border. So it inspects its terrain, and a right click on it claims nothing.
 */
function bareTile(chronicle: Chronicle): TileCoords {
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
  if (found === undefined) throw new Error('the chronicle charts no bare tile two tiles out');
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
  const faces = drawnFaces(chronicle);
  return {
    inside: glyphsOf(
      chronicle,
      faces.filter((face) => held.has(tileKey(face))),
    ),
    drawn: glyphsOf(chronicle, faces),
  };
}

test('before the settle neither the city key nor culture nor idle enters city mode', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openNew(page, NOMADIC, 1);
  await capstoneClosed(page);

  await page.keyboard.press('c');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-culture');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-idle');
  await answered(page);
  expect(await inCityMode(page)).toBe(false);

  expect(problems).toEqual([]);
});

test('the city key enters city mode, where a click rings a tile and stands the culture threshold on it, and the back key drops both', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const near = firstClaim(bare);

  await openSaved(page, bare);
  expect(await inCityMode(page)).toBe(false);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(near));
  expect(await thresholdShown(page)).toBe(thresholdWorn(bare, near));
  expect(await refusalLines(page)).toBeUndefined();
  expect((await chronicleOf(page)).held.map(tileKey)).not.toContain(tileKey(near));

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
  const bare = bareTurn();
  const near = firstClaim(bare);

  await openSaved(page, bare);
  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(near));

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a second left click on the city’s own tile enters city mode, and on any other tile changes nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = cityTileOf(bare);
  const near = firstClaim(bare);

  await openSaved(page, bare);
  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  expect(await inCityMode(page)).toBe(false);

  await page.mouse.click(city.x, city.y);
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await ringedTile(page)).toBeUndefined();

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);

  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(near));

  await page.mouse.click(at.x, at.y);
  await answered(page);
  expect(await ringedTile(page)).toBe(tileKey(near));
  expect(await inCityMode(page)).toBe(false);

  expect(problems).toEqual([]);
});

test('a right click in city mode inspects the tile under it without selecting, and leaving the mode drops it', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();

  await openSaved(page, bare);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const at = await tileOnScreen(page, bareTile(bare));
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
  const bare = bareTurn();
  const tile = bareTile(bare);

  await openSaved(page, bare);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const at = await tileOnScreen(page, tile);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(tile));

  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBe(tileKey(tile));

  const away = await besideTiles(page);
  await page.mouse.click(away.x, away.y);
  await expect.poll(() => ringedTile(page)).toBeUndefined();
  expect(await shownCard(page)).toBeUndefined();
  expect(await inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('a press on culture or idle enters city mode, and the chip leaves it', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, bareTurn());

  await click(page, 'reading-culture');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, 'reading-idle');
  await answered(page);
  expect(await inCityMode(page)).toBe(true);

  await click(page, 'city-chip');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-idle');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('culture’s well fills while the city can pay for a tile it may claim, and empties once the claim is paid', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = culturePaid();
  const near = firstClaim(paid);
  const claimed = applied(paid, { type: 'claim', tile: near });

  await openSaved(page, paid);
  await expect.poll(() => wellFill(page, 'culture')).toBe(LOOK.accent);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => thresholdShown(page)).toBe(thresholdWorn(paid, near));

  await page.mouse.click(at.x, at.y);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(claimed);
  await expect.poll(() => wellFill(page, 'culture')).toBeUndefined();

  expect(problems).toEqual([]);
});

test('idle’s well fills while one population is idle over a tile the city holds and nobody stands on, and empties once it is assigned', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = cityTileOf(bare);
  const unassigned = applied(bare, { type: 'assign', tile: own });
  const assigned = applied(unassigned, { type: 'assign', tile: own });

  await openSaved(page, bare);
  expect(await wellFill(page, 'idle')).toBeUndefined();

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(unassigned);
  expect(await counted(page, 'assigned')).toBe(unassigned.assigned.length);
  await expect.poll(() => wellFill(page, 'idle')).toBe(LOOK.accent);

  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(assigned);
  expect(await counted(page, 'assigned')).toBe(assigned.assigned.length);
  await expect.poll(() => wellFill(page, 'idle')).toBeUndefined();

  expect(problems).toEqual([]);
});

test('city mode marks every tile the population stands on, and a second click on the selected one takes it off and puts it back', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = cityTileOf(bare);
  const unassigned = applied(bare, { type: 'assign', tile: own });

  await openSaved(page, bare);
  expect(await counted(page, 'assigned')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'assigned')).toBe(bare.assigned.length);
  expect(await counted(page, 'city-dim')).toBe(bare.held.length - bare.assigned.length);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  expect(await counted(page, 'assigned')).toBe(bare.assigned.length);
  expect(await refusalLines(page)).toBeUndefined();
  // The city holds it, so there is no claim on it to ask for anything.
  expect(await thresholdShown(page)).toBeUndefined();

  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(unassigned.assigned.length);
  expect(await counted(page, 'city-dim')).toBe(unassigned.held.length - unassigned.assigned.length);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));

  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(bare.assigned.length);
  expect(await counted(page, 'city-dim')).toBe(bare.held.length - bare.assigned.length);
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
  const { chronicle, claimed } = oneClaimed();
  const own = cityTileOf(chronicle);
  const carried = applied(chronicle, { type: 'reassign', from: own, to: claimed });

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));

  await dragTiles(page, own, claimed);
  await expect.poll(() => chronicleOf(page)).toEqual(carried);
  expect(await counted(page, 'assigned')).toBe(carried.assigned.length);
  expect(await counted(page, 'city-dim')).toBe(carried.held.length - carried.assigned.length);
  // The tile it landed on takes the ring, so the next press on it is the city's next act there.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(claimed));

  expect(problems).toEqual([]);
});

test('a drag in city mode let go anywhere else changes nothing and leaves the selection where it was', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, claimed } = oneClaimed();
  const own = cityTileOf(chronicle);
  const outside = firstClaim(chronicle);

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));

  await dragTiles(page, own, outside);
  await answered(page);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await counted(page, 'assigned')).toBe(chronicle.assigned.length);
  expect(await ringedTile(page)).toBe(tileKey(own));

  await dragTiles(page, claimed, own);
  await answered(page);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await counted(page, 'assigned')).toBe(chronicle.assigned.length);
  expect(await ringedTile(page)).toBe(tileKey(own));

  expect(problems).toEqual([]);
});

test('a unit’s tile selected in city mode lights nothing, and a click on the tile it could step to selects it', async ({
  page,
}) => {
  const problems = watch(page);
  const { entered: chronicle, tile: step } = workerStepped(
    'steps its first worker off the city',
    () => true,
  );
  const own = cityTileOf(chronicle);

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await click(page, `tile-${tileKey(own)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  expect(await marksIn(page, 'lit')).toBe(0);

  await click(page, `tile-${tileKey(step)}`);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(step));
  expect(await marksIn(page, 'lit')).toBe(0);
  expect(await chronicleOf(page)).toEqual(chronicle);

  expect(problems).toEqual([]);
});

test('city mode marks every tile the city can claim, and leaving it takes the marks down', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();

  await openSaved(page, bare);
  expect(await counted(page, 'claimable')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'claimable')).toBe(claimable(NOMADIC, bare).length);

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await counted(page, 'claimable')).toBe(0);

  expect(problems).toEqual([]);
});

test('a second click the city cannot pay for claims nothing and says so, and one on no act of the city’s says nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const nearTile = firstClaim(bare);
  const farTile = nearestUncharted(bare);
  const asked = thresholdWorn(bare, nearTile);
  const unpaid = [text('refusal.culture', { cost: threshold(bare, nearTile) })];

  await openSaved(page, bare);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  // The uncharted veil off, so the press on the far tile lands on it and the rules answer it.
  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  const near = await tileOnScreen(page, nearTile);
  const far = await tileOnScreen(page, farTile);

  await page.mouse.click(near.x, near.y);
  await expect.poll(() => thresholdShown(page)).toBe(asked);
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(near.x, near.y);
  await answered(page);
  expect(await refusalLines(page)).toEqual(unpaid);
  // The tile goes on wearing what the claim asks for, under the note.
  expect(await thresholdShown(page)).toBe(asked);
  expect(await chronicleOf(page)).toEqual(bare);

  await page.mouse.click(far.x, far.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(farTile));
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await answered(page);
  expect(await ringedTile(page)).toBe(tileKey(farTile));
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();
  expect(await chronicleOf(page)).toEqual(bare);

  expect(problems).toEqual([]);
});

test('a second click the city can pay for claims the tile, which stays selected and asks for nothing more', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = culturePaid();
  const nearTile = firstClaim(paid);
  const farTile = nearestUncharted(paid);
  const claimed = applied(paid, { type: 'claim', tile: nearTile });

  await openSaved(page, paid);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  await consoleKey(page);
  await enter(page, 'uncharted');
  await consoleKey(page);

  const near = await tileOnScreen(page, nearTile);
  const far = await tileOnScreen(page, farTile);

  await page.mouse.click(near.x, near.y);
  await expect.poll(() => thresholdShown(page)).toBe(thresholdWorn(paid, nearTile));
  await page.mouse.click(near.x, near.y);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(claimed);
  expect(await counted(page, 'assigned')).toBe(claimed.assigned.length);
  // The tile claimed is a claim no longer, and the marks are the claims the moved border opens.
  expect(claimable(NOMADIC, claimed).map(tileKey)).not.toContain(tileKey(nearTile));
  expect(await counted(page, 'claimable')).toBe(claimable(NOMADIC, claimed).length);
  // The tile the claim took stays selected, and asks for nothing more.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(nearTile));
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await answered(page);
  expect(await refusalLines(page)).toBeUndefined();
  expect(claimable(NOMADIC, claimed).map(tileKey)).not.toContain(tileKey(farTile));

  expect(problems).toEqual([]);
});

test('city mode shows what every tile inside the border yields, and nothing of any other tile', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, bareTurn());
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
  const bare = bareTurn();
  const near = firstClaim(bare);

  await openSaved(page, bare);
  await page.keyboard.press('Tab');
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const chronicle = await chronicleOf(page);
  const faces = drawnFaces(chronicle);
  const all = glyphsOf(chronicle, faces);
  const worn = glyphsOf(
    chronicle,
    faces.filter((face) => tileKey(face) !== tileKey(near)),
  );
  expect(worn).not.toEqual(all);
  expect(await glyphs(page)).toEqual(all);

  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => thresholdShown(page)).toBe(thresholdWorn(bare, near));
  expect(await glyphs(page)).toEqual(worn);

  await page.keyboard.press('Escape');
  await expect.poll(() => thresholdShown(page)).toBeUndefined();
  expect(await glyphs(page)).toEqual(all);

  expect(problems).toEqual([]);
});

test('a window standing over the chronicle screen takes the city key', async ({ page }) => {
  const problems = watch(page);

  await openSaved(page, bareTurn());

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
