import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { apply, type Command, outcome } from '../src/rules/chronicle';
import { claimable, givingYield, tileCost, tileRefusal } from '../src/rules/city';
import { type Tile, type TileCoords, tileKey } from '../src/rules/map';
import { RESOURCES } from '../src/rules/resources';
import { charted } from '../src/rules/sight';
import { assignedTo, type Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import { LOOK } from '../src/ui/look';
import { refused } from '../src/ui/refusal-lines';
import { text } from '../src/ui/text';
import {
  bareTile,
  besideTiles,
  chronicleOf,
  claimMarked,
  click,
  consoleKey,
  counted,
  dragTiles,
  drawnFaces,
  enemyEnteredOn,
  enter,
  type Glyphs,
  glyphName,
  glyphs,
  glyphsByStrength,
  glyphsOf,
  latched,
  launchedAs,
  marksIn,
  nearestUncharted,
  noGlyphs,
  openSaved,
  type PieceWorn,
  playedOut,
  playerCityTile,
  type Reading,
  reacted,
  readings,
  readingsAndUnitMarks,
  refusalLines,
  ringedTile,
  settledOn,
  shownCard,
  shows,
  standing,
  thresholdShown,
  tileOnScreen,
  unitMarksOn,
  unitsStrength,
  watch,
  wellWorn,
  workerStepped,
} from './chronicle-screen';

/** What a reading stands on while its act in city mode waits: a button's gold, in its own look. */
const ON_THE_GOLD: PieceWorn = { piece: 'gold', look: 'normal' };

/** Seed 1's turn 1, the city settled and nothing else played. */
function bareTurn(): Chronicle {
  return settledOn(1);
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
  const [tile] = claimable(CATALOGUE, chronicle, 'player');
  if (tile === undefined)
    throw new Error(`turn ${chronicle.turn} holds no tile the city may claim`);
  return tile;
}

/** The tiles the city may claim, by tile key, in key order. */
function claimableKeys(chronicle: Chronicle): string[] {
  return claimable(CATALOGUE, chronicle, 'player').map(tileKey).sort();
}

/** The chronicle the command leaves; a refusal throws. */
function applied(chronicle: Chronicle, command: Command): Chronicle {
  const left = outcome(apply(CATALOGUE, chronicle, command));
  if (left === chronicle)
    throw new Error(`the ${command.type} is refused on turn ${chronicle.turn}`);
  return left;
}

/** Bare turn 1, or the turn handed, with the culture threshold of a claim gained, and charted as a command is. */
function culturePaid(bare = bareTurn()): Chronicle {
  const culture = threshold(bare, firstClaim(bare));
  return charted(CATALOGUE, gained(bare, { culture }).chronicle);
}

/** Culture paid with the first tile the city may claim claimed: nobody stands on it. */
function oneClaimed(bare = bareTurn()): { chronicle: Chronicle; claimed: TileCoords } {
  const paid = culturePaid(bare);
  const claimed = firstClaim(paid);
  return { chronicle: applied(paid, { type: 'claim', tile: claimed }), claimed };
}

/** The tiles the city holds that nobody is assigned to, by the rules, by tile key, in key order. */
function unassignedHeld(chronicle: Chronicle): string[] {
  return chronicle.held
    .filter((tile) => !assignedTo(chronicle, tile))
    .map(tileKey)
    .sort();
}

/** The name a tile's painting stands under. */
function faceName(tile: TileCoords): string {
  return `tile-${tileKey(tile)}`;
}

/**
 * The tiles the city holds whose painting wears city mode's dark, read off the readings of their
 * faces, by tile key, in key order.
 */
function darkIn(read: (name: string) => Reading, chronicle: Chronicle): string[] {
  return chronicle.held
    .filter((tile) => read(faceName(tile)).tint === LOOK.unassigned)
    .map(tileKey)
    .sort();
}

/** The tiles the city holds whose painting wears city mode's dark, in one question to the page. */
async function darkHeld(page: Page, chronicle: Chronicle): Promise<string[]> {
  return darkIn(await readings(page, chronicle.held.map(faceName)), chronicle);
}

/** The names the city's food bar, its culture bar and its badge stand under on its tile. */
function cityWearing(city: TileCoords): string[] {
  const key = tileKey(city);
  return [`city-bar-food-${key}`, `city-bar-culture-${key}`, `population-${key}`];
}

/** What the faces the map draws of the chronicle are owed, split by whether the tile gives its yield at income. */
function owedByIncome(
  chronicle: Chronicle,
  counted: (face: Tile) => boolean,
): {
  full: Glyphs;
  pale: Glyphs;
} {
  const faces = drawnFaces(chronicle);
  const giving = givingYield(chronicle, 'player');
  return {
    full: glyphsOf(chronicle, faces, (face) => counted(face) && giving(face)),
    pale: glyphsOf(chronicle, faces, (face) => counted(face) && !giving(face)),
  };
}

/** Whether the chronicle screen shows city mode is on: both marks stand, or neither does. */
async function inCityMode(page: Page): Promise<boolean> {
  const chip = await shows(page, 'city-chip');
  const frame = await shows(page, 'city-frame');
  expect(frame).toBe(chip);
  return chip;
}

/** What the tiles inside the border yield, point by point, and what every tile the map draws does. */
async function yielded(page: Page): Promise<{ inside: Glyphs; drawn: Glyphs }> {
  const chronicle = await chronicleOf(page);
  const held = new Set(chronicle.held.map(tileKey));
  const faces = drawnFaces(chronicle);
  return {
    inside: glyphsOf(chronicle, faces, (face) => held.has(tileKey(face))),
    drawn: glyphsOf(chronicle, faces),
  };
}

test('before the settle neither the city key nor culture nor idle enters city mode', async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, launchedAs(1));

  await page.keyboard.press('c');
  await reacted(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-culture');
  await reacted(page);
  expect(await inCityMode(page)).toBe(false);

  await click(page, 'reading-idle');
  await reacted(page);
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

test('a left click on the city’s own tile once selected enters city mode, and on any other tile no unit stands on changes nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = playerCityTile(bare);
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
  await reacted(page);
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
  await reacted(page);
  expect(await shownCard(page)).toBe('terrain');
  expect(await ringedTile(page)).toBeUndefined();

  // The first back key takes the infopanel down; the mode stands until the next one.
  await page.keyboard.press('Escape');
  await reacted(page);
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
  await reacted(page);
  expect(await inCityMode(page)).toBe(true);

  await click(page, 'city-chip');
  await expect.poll(() => inCityMode(page)).toBe(false);

  await click(page, 'reading-idle');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});

test('culture stands on the gold while the city can pay for a tile it may claim, and leaves it once the claim is paid', async ({
  page,
}) => {
  const problems = watch(page);
  const paid = culturePaid();
  const near = firstClaim(paid);
  const claimed = applied(paid, { type: 'claim', tile: near });

  await openSaved(page, paid);
  await expect.poll(() => wellWorn(page, 'culture')).toEqual(ON_THE_GOLD);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  const at = await tileOnScreen(page, near);
  await page.mouse.click(at.x, at.y);
  await expect.poll(() => thresholdShown(page)).toBe(thresholdWorn(paid, near));

  await page.mouse.click(at.x, at.y);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(claimed);
  await expect.poll(() => wellWorn(page, 'culture')).toBeUndefined();

  expect(problems).toEqual([]);
});

test('idle stands on the gold while one population is idle over a tile the city holds and nobody stands on, and leaves it once it is assigned', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = playerCityTile(bare);
  const unassigned = applied(bare, { type: 'assign', tile: own });
  const assigned = applied(unassigned, { type: 'assign', tile: own });

  await openSaved(page, bare);
  expect(await wellWorn(page, 'idle')).toBeUndefined();

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));
  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(unassigned);
  expect(await counted(page, 'assigned')).toBe(unassigned.assigned.length);
  await expect.poll(() => wellWorn(page, 'idle')).toEqual(ON_THE_GOLD);

  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(assigned);
  expect(await counted(page, 'assigned')).toBe(assigned.assigned.length);
  await expect.poll(() => wellWorn(page, 'idle')).toBeUndefined();

  expect(problems).toEqual([]);
});

test('city mode marks every tile the population stands on, and a second click on the selected one takes it off and puts it back', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = playerCityTile(bare);
  const unassigned = applied(bare, { type: 'assign', tile: own });

  await openSaved(page, bare);
  expect(await counted(page, 'assigned')).toBe(0);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await counted(page, 'assigned')).toBe(bare.assigned.length);
  expect(await darkHeld(page, bare)).toEqual(unassignedHeld(bare));

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
  expect(await darkHeld(page, unassigned)).toEqual(unassignedHeld(unassigned));
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));

  await page.mouse.click(city.x, city.y);
  await playedOut(page);
  expect(await counted(page, 'assigned')).toBe(bare.assigned.length);
  expect(await darkHeld(page, bare)).toEqual(unassignedHeld(bare));
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
  const own = playerCityTile(chronicle);
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
  expect(await darkHeld(page, carried)).toEqual(unassignedHeld(carried));
  // The tile it landed on takes the ring, so the next press on it is the city's next act there.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(claimed));

  expect(problems).toEqual([]);
});

test('a drag in city mode let go anywhere else changes nothing and leaves the selection where it was', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, claimed } = oneClaimed();
  const own = playerCityTile(chronicle);
  const outside = firstClaim(chronicle);

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const city = await tileOnScreen(page, own);
  await page.mouse.click(city.x, city.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(own));

  await dragTiles(page, own, outside);
  await reacted(page);
  expect(await chronicleOf(page)).toEqual(chronicle);
  expect(await counted(page, 'assigned')).toBe(chronicle.assigned.length);
  expect(await ringedTile(page)).toBe(tileKey(own));

  await dragTiles(page, claimed, own);
  await reacted(page);
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
  const own = playerCityTile(chronicle);

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
  expect(await claimMarked(page)).toEqual([]);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await claimMarked(page)).toEqual(claimableKeys(bare));

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await claimMarked(page)).toEqual([]);

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
  const refusal = tileRefusal(CATALOGUE, bare, nearTile);
  if (refusal === undefined)
    throw new Error(`turn ${bare.turn} has no act of the city's on the tile`);
  const unpaid = refused(tileCost(bare, nearTile), refusal);

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
  await reacted(page);
  expect(await refusalLines(page)).toEqual(unpaid);
  // The tile goes on wearing what the claim asks for, under the note.
  expect(await thresholdShown(page)).toBe(asked);
  expect(await chronicleOf(page)).toEqual(bare);

  await page.mouse.click(far.x, far.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(farTile));
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await reacted(page);
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
  expect(claimable(CATALOGUE, claimed, 'player').map(tileKey)).not.toContain(tileKey(nearTile));
  expect(await claimMarked(page)).toEqual(claimableKeys(claimed));
  // The tile the claim took stays selected, and asks for nothing more.
  await expect.poll(() => ringedTile(page)).toBe(tileKey(nearTile));
  expect(await thresholdShown(page)).toBeUndefined();
  expect(await refusalLines(page)).toBeUndefined();

  await page.mouse.click(far.x, far.y);
  await reacted(page);
  expect(await refusalLines(page)).toBeUndefined();
  expect(claimable(CATALOGUE, claimed, 'player').map(tileKey)).not.toContain(tileKey(farTile));

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

  await page.keyboard.press('Escape');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await glyphs(page)).toEqual(noGlyphs());

  expect(problems).toEqual([]);
});

test('city mode marks the assigned tile, darkens the held tiles nobody is assigned to and no unit on them, pales the glyphs of every tile not giving its yield at income, fades every unit and takes the city’s bars and badge off, and leaving it puts each back', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: claimedOn, claimed } = oneClaimed(settledOn(1, ['first-worker']));
  const own = playerCityTile(claimedOn);
  const chronicle = applied(claimedOn, { type: 'reassign', from: own, to: claimed });
  const every = owedByIncome(chronicle, () => true);
  // The worker stands on the city's own tile, which nobody is assigned to once the population is carried off it.
  expect(unitAt(chronicle.units, own)).toBeDefined();
  expect(unassignedHeld(chronicle)).toContain(tileKey(own));
  expect(every.full).not.toEqual(noGlyphs());
  expect(every.pale).not.toEqual(noGlyphs());

  await openSaved(page, chronicle);
  await page.keyboard.press('Tab');
  await expect.poll(() => latched(page)).toEqual([...RESOURCES]);
  const [worker] = await unitMarksOn(page, [own]);

  const wearing = cityWearing(own);
  const names = [
    'assigned',
    ...chronicle.held.map(faceName),
    ...RESOURCES.map(glyphName),
    ...wearing,
  ];
  /** Everything city mode changes, read as it stands. */
  const worn = async () => {
    const { read, unitMarkOn } = await readingsAndUnitMarks(page, names, [own]);
    return {
      assigned: read('assigned').count,
      dark: darkIn(read, chronicle),
      worker: unitMarkOn(own),
      glyphs: glyphsByStrength(read),
      units: await unitsStrength(page),
      city: wearing.map((name) => read(name).shows),
    };
  };
  const out = {
    assigned: 0,
    dark: [],
    worker,
    glyphs: { full: glyphsOf(chronicle, drawnFaces(chronicle)), pale: noGlyphs() },
    units: 1,
    city: [true, true, true],
  };
  expect(await worn()).toEqual(out);

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);
  expect(await worn()).toEqual({
    assigned: chronicle.assigned.length,
    dark: unassignedHeld(chronicle),
    worker,
    glyphs: every,
    units: LOOK.unitsInCityMode,
    city: [false, false, false],
  });

  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(false);
  expect(await worn()).toEqual(out);

  expect(problems).toEqual([]);
});

test('in city mode an assigned tile an enemy occupies keeps its mark and its painting, and its glyphs stand paler', async ({
  page,
}) => {
  const problems = watch(page);
  const bare = bareTurn();
  const own = playerCityTile(bare);
  const beset = enemyEnteredOn(bare, own);
  if (beset === undefined) throw new Error(`turn ${bare.turn} enters no enemy on the city's tile`);
  const { chronicle } = beset;
  const held = new Set(chronicle.held.map(tileKey));
  const inside = owedByIncome(chronicle, (face) => held.has(tileKey(face)));
  expect(chronicle.assigned.map(tileKey)).toContain(tileKey(own));
  expect(givingYield(chronicle, 'player')(own)).toBe(false);

  await openSaved(page, chronicle);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  const names = ['assigned', ...chronicle.held.map(faceName), ...RESOURCES.map(glyphName)];
  const read = await readings(page, names);
  expect(read('assigned').count).toBe(chronicle.assigned.length);
  expect(darkIn(read, chronicle)).toEqual(unassignedHeld(chronicle));
  expect(unassignedHeld(chronicle)).not.toContain(tileKey(own));
  expect(glyphsByStrength(read)).toEqual(inside);
  expect(inside.full).toEqual(noGlyphs());
  expect(inside.pale).not.toEqual(noGlyphs());

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
  const worn = glyphsOf(chronicle, faces, (face) => tileKey(face) !== tileKey(near));
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
  await reacted(page);
  expect(await inCityMode(page)).toBe(false);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await page.keyboard.press('c');
  await expect.poll(() => inCityMode(page)).toBe(true);

  expect(problems).toEqual([]);
});
