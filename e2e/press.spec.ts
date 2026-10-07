import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { achievementOf } from '../src/rules/catalogue';
import { apply, byHand, outcome } from '../src/rules/chronicle';
import { CENTRE, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { unitAt } from '../src/rules/units';
import type { ChronicleScene } from '../src/ui/chronicle-scene';
import { achievementGoal, cardName, text } from '../src/ui/text';
import {
  admits,
  aimableAtHand,
  aimed,
  aimLine,
  bareAimable,
  bareWith,
  besideTheCards,
  browse,
  budget,
  cardOnFace,
  chronicleOf,
  cityTileOf,
  click,
  cursorAt,
  dragBetween,
  dragOut,
  dragSlack,
  eastOf,
  endedTurn,
  firstSeed,
  inHand,
  type Judged,
  launchedOn,
  mapFrame,
  marked,
  namedIn,
  nameOnScreen,
  offCanvas,
  offsetOf,
  onScreen,
  onTheBand,
  openSaved,
  overflowingPiles,
  pileTop,
  pinnedAchievement,
  playedOn,
  playedOut,
  readings,
  rested,
  ringedTile,
  scrolled,
  secondEra,
  selected,
  settledOn,
  shownCard,
  shows,
  standing,
  stillAt,
  tilePlayable,
  watch,
  wheel,
  wonCampaign,
  workerStepped,
} from './chronicle-screen';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left to release on. */
const WINDOW = { width: 1280, height: 900 };

/** How far up a card comes before the release plays it, in design units, and then some. */
const LIFTED = 140;

/** A unit card the city can pay for and nothing blocks: a card that plays at nothing. */
function unitPlayable({ kind, playable }: Judged): boolean {
  return kind === 'unit' && playable;
}

/**
 * The first seed and turn inside forty, the city settled bare and every turn ended with nothing
 * played, whose hand holds both a unit card the city can pay for and nothing blocks and a card aimed
 * at a tile it can pay for; and where each lies.
 */
function playableAtNothing(): { opened: Chronicle; unit: number; tile: number } {
  return firstSeed(
    'opens a turn inside forty on a unit card it can play and a card aimed at a tile',
    (seed) => {
      let opened = settledOn(seed);
      for (let turn = 1; turn <= 40 && opened.ending === undefined; turn++) {
        const unit = inHand(opened, unitPlayable);
        const tile = inHand(opened, tilePlayable);
        if (unit !== -1 && tile !== -1) return { opened, unit, tile };
        opened = endedTurn(opened);
      }
      return undefined;
    },
  );
}

/**
 * The first worker stepped onto a tile a card aimed at a tile the city can pay for admits; where
 * that card lies in the hand, and the tile.
 */
function steppedOntoTheAim(): { moved: Chronicle; index: number; tile: TileCoords } {
  const { stepped: moved, tile } = workerStepped(
    'steps its first worker onto a tile a card aimed at a tile the city can pay for admits',
    (stepped, at) => admits(stepped, inHand(stepped, tilePlayable), at),
  );
  return { moved, index: inHand(moved, tilePlayable), tile };
}

/** The chronicle the card at that place in the hand leaves, played at nothing. */
function playedAtNothing(chronicle: Chronicle, index: number): Chronicle {
  return outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'none' }));
}

/**
 * Carries the map by a drag off the tile until the tile stands under the middle of the named object,
 * so a press that fell through the object would land on it.
 */
async function carriedUnder(page: Page, tile: TileCoords, name: string): Promise<void> {
  await carriedTo(page, tile, await onScreen(page, name), name);
}

/** Carries the map by a drag off the tile until the tile stands at that point of the page, on `what`. */
async function carriedTo(
  page: Page,
  tile: TileCoords,
  to: { x: number; y: number },
  what: string,
): Promise<void> {
  const face = `tile-${tileKey(tile)}`;
  await dragBetween(page, await onScreen(page, face), to);
  await rested(page);
  const now = await onScreen(page, face);
  if (Math.hypot(now.x - to.x, now.y - to.y) >= 2) {
    throw new Error(`the map stops short of carrying ${face} under ${what}`);
  }
}

/**
 * The first seed's turn 1, settled bare, whose end of turn sends the hand off as its first stage, no
 * hazard striking ahead of it.
 */
function leavingFirst(): Chronicle {
  return firstSeed('ends its turn 1 on the hand leaving first', (seed) => {
    const opened = settledOn(seed);
    const [first] = apply(CATALOGUE, opened, { type: 'end-turn' });
    return first?.name === 'discarded' ? opened : undefined;
  });
}

/** A point on the resource bar's paper: between the bar's left end and its first reading, food. */
async function onThePaper(page: Page): Promise<{ x: number; y: number }> {
  const seen = await readings(page, ['resource-bar', 'reading-food']);
  const bar = seen('resource-bar').boundsOnScreen;
  const food = seen('reading-food').boundsOnScreen;
  return { x: (bar.x + food.x) / 2, y: food.y + food.height / 2 };
}

test('a hand card released off the canvas comes home, plays nothing, and leaves the next press clean', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.up();

  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  expect(await stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(home.x, home.y, { steps: 5 });
  await page.mouse.up();
  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(false);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  expect(problems).toEqual([]);
});

test('a unit carried stands through the right button pressed and let go off the canvas, and the left release on a tile it lights steps it there', async ({
  page,
}) => {
  const problems = watch(page);
  const {
    entered: opened,
    tile,
    stepped,
  } = workerStepped('steps its first worker off the city', () => true);

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const from = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);
  const onto = await onScreen(page, `tile-${tileKey(tile)}`);
  const bare = await offCanvas(page);

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await page.mouse.move(onto.x, onto.y, { steps: 5 });
  await page.mouse.up();
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(stepped);

  expect(problems).toEqual([]);
});

test('a hand card dragged stands through the right button pressed on the canvas and let go off it, and the left release clear of the hand plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const home = await onScreen(page, `hand-${unit}`);
  const bare = await offCanvas(page);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.up({ button: 'right' });
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.up();
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a click held on the end-turn button stands through the right button let go off the canvas, and the left release on the button ends the turn', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const opened = settledOn(1);

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(button.x, button.y);
  await page.mouse.down();
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await page.mouse.move(button.x, button.y, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(() => chronicleOf(page))
    .toEqual(outcome(apply(CATALOGUE, opened, { type: 'end-turn' })));

  expect(problems).toEqual([]);
});

test('a hand card whose release the blur swallowed comes home, and the next press plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(false);

  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  // The release the browser finally delivers, long after the gesture it belonged to ended.
  await page.mouse.up();
  expect(await stillAt(page, card, home)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await dragOut(page, unit);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a press the blur swallowed before it dragged is no click, and the next right click inspects', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await page.setViewportSize(WINDOW);
  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });
  await page.mouse.up();

  expect(await standing(page, 'inspection')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(true);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  expect(problems).toEqual([]);
});

test('a card dragged when the menu rises comes home, plays nothing, and the release under the menu lands as nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.up();
  await rested(page);
  expect(await stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);
  expect(await standing(page, 'menu')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);

  await dragOut(page, unit);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a right click on a card being dragged shows it large and brings it home, and the release plays nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(false);

  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(opened.hand[unit].id);
  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.up();
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(true);
  expect(await stillAt(page, card, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);

  expect(problems).toEqual([]);
});

test('a card dragged and right-clicked where no scrim rises follows the pointer on, and the left release plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);

  const card = `hand-${unit}`;
  const home = await onScreen(page, card);
  const menu = await onScreen(page, 'menu-button');

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(menu.x, menu.y, { steps: 5 });

  // The Menu button swallows the press and raises nothing, while the release it never swallows ends
  // Phaser's drag: from there the card follows the pointer on the hand's own carry.
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  expect(await standing(page, 'menu')).toBe(false);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  // The carry is absolute, so it is exact from the first move the menu does not stop: both of these
  // stand clear of the button, which swallows every move that lands on it and freezes the card.
  const below = menu.y + 120 * menu.unit;
  await page.mouse.move(menu.x, below, { steps: 4 });
  await rested(page);
  const carried = await onScreen(page, card);

  const by = 160 * menu.unit;
  await page.mouse.move(menu.x, below + by, { steps: 4 });
  await expect
    .poll(async () => Math.round((await onScreen(page, card)).y - carried.y))
    .toBe(Math.round(by));

  await page.mouse.up();
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a right click while a unit is carried inspects the tile under it and leaves the unit in hand, and the left release steps it there', async ({
  page,
}) => {
  const problems = watch(page);
  const {
    entered: opened,
    tile,
    stepped,
  } = workerStepped('steps its first worker off the city', () => true);

  await openSaved(page, opened);

  const city = cityTileOf(opened);
  const from = await onScreen(page, `tile-${tileKey(city)}`);
  const onto = await onScreen(page, `tile-${tileKey(tile)}`);

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + onto.x) / 2, (from.y + onto.y) / 2, { steps: 5 });
  await page.mouse.move(onto.x, onto.y, { steps: 5 });

  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.up();
  await playedOut(page);
  expect(await chronicleOf(page)).toEqual(stepped);

  expect(problems).toEqual([]);
});

test('a right click on the card being aimed shows it large, and the back key leaves the aim standing', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  await dragOut(page, index);
  await aimed(page);

  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a right click while a press is held on the aim inspects the tile under it, and the left release still plays the card there', async ({
  page,
}) => {
  const problems = watch(page);
  const { moved, index, tile } = steppedOntoTheAim();

  await openSaved(page, moved);
  const home = await onScreen(page, `hand-${index}`);
  await page.mouse.click(home.x, home.y);
  await aimed(page);

  const face = await onScreen(page, `tile-${tileKey(tile)}`);
  await page.mouse.move(face.x, face.y);
  await page.mouse.down();
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect.poll(() => shownCard(page)).toBeDefined();
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(moved);

  await page.mouse.up();
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(playedOn(moved, index, tile));

  expect(problems).toEqual([]);
});

test('a click selects a card that plays at nothing, and a second click plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await chronicleOf(page)).toEqual(opened);
  expect(await selected(page, unit, home)).toBe(true);

  await page.mouse.click(home.x, home.y);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a right click inspects a tile while a card is selected, and the back key takes the inspection first', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await selected(page, unit, home)).toBe(true);

  // The city's own tile: the map centres on it, so the press lands clear of the hand and the bar,
  // and nothing stands on it this early, so the first card of its cycle is what is built there.
  const city = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);
  await page.mouse.click(city.x, city.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await selected(page, unit, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await selected(page, unit, home)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => selected(page, unit, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a click aims a card at the tiles it admits, and a click on another card takes it', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit, tile } = playableAtNothing();

  await openSaved(page, opened);
  const card = await onScreen(page, `hand-${tile}`);
  const beside = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(card.x, card.y);
  await aimed(page);

  await page.mouse.click(card.x, card.y);
  await rested(page);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(beside.x, beside.y);
  await rested(page);
  expect(await standing(page, 'aim')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);
  expect(await selected(page, unit, beside)).toBe(true);

  expect(problems).toEqual([]);
});

test('the card being aimed wears a point and says what it is played at, and a card merely selected neither', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit, tile } = playableAtNothing();

  await openSaved(page, opened);
  const beside = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(beside.x, beside.y);
  await rested(page);
  expect(await selected(page, unit, beside)).toBe(true);
  expect(await standing(page, 'aim-point')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();

  const card = await onScreen(page, `hand-${tile}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await aimLine(page)).toBe(text('aim.tile', { card: cardName(opened.hand[tile].id) }));

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'aim-point')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a card aimed at a unit says it is played at a unit', async ({ page }) => {
  const problems = watch(page);
  const atUnit = ({ aim }: Judged): boolean => aim === 'unit';
  const { stepped: moved } = workerStepped(
    'steps its first worker onto a tile a card aimed at a unit admits',
    (stepped, at) => admits(stepped, inHand(stepped, atUnit), at),
  );
  const index = inHand(moved, atUnit);

  await openSaved(page, moved);
  const home = await onScreen(page, `hand-${index}`);
  await page.mouse.click(home.x, home.y);
  await aimed(page);

  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await aimLine(page)).toBe(text('aim.unit', { card: cardName(moved.hand[index].id) }));

  expect(problems).toEqual([]);
});

test('a click beside the tiles lets the card being aimed go, as it drops a selection', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);

  // The frame's own corner: inside the map, and far enough out for its disc to reach no tile there.
  const frame = await mapFrame(page);
  await page.mouse.click(frame.x + 10, frame.y + 10);

  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a click on the bar’s paper drops the card being aimed, and one on a yield reading lets it go and latches the yield', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);
  const paper = await onThePaper(page);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  expect(await cursorAt(page, paper)).toBe('');
  await page.mouse.click(paper.x, paper.y);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, 'reading-food');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await shows(page, 'reading-food-well')).toBe(true);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('the end-turn button clicked while a card is aimed at a tile lets the card go and ends the turn', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, 'end-turn');
  await expect
    .poll(() => chronicleOf(page))
    .toEqual(outcome(apply(CATALOGUE, opened, { type: 'end-turn' })));
  expect(await standing(page, 'aim')).toBe(false);

  expect(problems).toEqual([]);
});

test('a click on the top of a card of the hand while the end of turn plays out stops on the card, and no tile under it is ringed', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const opened = leavingFirst();

  await openSaved(page, opened);
  const card = `hand-${Math.floor(opened.hand.length / 2)}`;
  const seen = await readings(page, [card, 'end-turn']);
  const home = seen(card).onScreen;
  const top = seen(card).boundsOnScreen;
  const button = seen('end-turn').onScreen;
  const frame = await mapFrame(page);
  const at = { x: top.x + top.width / 2, y: (top.y + frame.y + frame.height) / 2 };

  await carriedTo(page, cityTileOf(opened), at, `the top of ${card}`);
  await page.mouse.move(button.x, button.y);
  await expect.poll(() => stillAt(page, card, home)).toBe(true);

  // The hand leaves at the end of turn's first stage and is out of its lane a frame later, so both
  // clicks land in one task; the screen reads where a click landed only after it, hence the wait.
  const landedPlaying = await page.evaluate(
    async (points) => {
      const game = window.game;
      if (game === undefined) throw new Error('the game is not running');
      const clicked = ({ x, y }: { x: number; y: number }): void => {
        for (const [type, buttons] of [
          ['mousedown', 1],
          ['mouseup', 0],
        ] as const) {
          game.canvas.dispatchEvent(
            new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              buttons,
            }),
          );
        }
      };
      clicked(points.button);
      await null;
      clicked(points.at);
      return game.scene.getScene<ChronicleScene>('ui').playing;
    },
    { button, at },
  );
  expect(landedPlaying).toBe(true);

  await playedOut(page);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a click on the line naming the aim lands on the tile under it, and plays the card there', async ({
  page,
}) => {
  const problems = watch(page);
  const { moved, index, tile } = steppedOntoTheAim();

  await openSaved(page, moved);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await carriedUnder(page, tile, 'aim-line');
  await click(page, 'aim-line');
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(playedOn(moved, index, tile));
  expect(await standing(page, 'aim')).toBe(false);
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('on the settle phase the chip and the dead end-turn button stop a press: each lets the settle card being aimed go and settles nothing, and the chip on a clean screen rings no tile', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = launchedOn(1);

  await openSaved(page, opened);
  const home = await onScreen(page, 'hand-0');

  await carriedUnder(page, CENTRE, 'settle-phase-chip');
  await click(page, 'settle-phase-chip');
  await rested(page);
  expect(await ringedTile(page)).toBeUndefined();

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, 'settle-phase-chip');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await expect.poll(() => selected(page, 0, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  // The centre stands under the chip, which a press on it would land on: its neighbour carries the map.
  await carriedUnder(page, { q: CENTRE.q, r: CENTRE.r + 1 }, 'end-turn');
  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, 'end-turn');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await expect.poll(() => selected(page, 0, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a click on a pinned achievement, a name in its goal included, lets the card being aimed go and reaches no tile under it', async ({
  page,
}) => {
  const problems = watch(page);
  const won = wonCampaign();
  const era = secondEra(won);
  const { chronicle: opened, index } = bareWith(
    'a card aimed at a tile the city can pay for',
    tilePlayable,
    era,
  );
  const pin = opened.achievements
    .map(({ id }) => ({ id, ...achievementOf(CATALOGUE, opened.age, id) }))
    .find(
      ({ id, technology, need }) =>
        won.pins.includes(technology) && namedIn(achievementGoal(id, need)).length > 0,
    );
  if (pin === undefined)
    throw new Error(
      `the ${era.age} age reads no achievement of a pinned technology whose goal names a thing`,
    );
  const plate = pinnedAchievement(pin.technology);

  await openSaved(page, opened, won);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, `${plate}-name`);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await ringedTile(page)).toBeUndefined();
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  const name = await nameOnScreen(page, `${plate}-face`);
  await page.mouse.click(name.x, name.y);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'inspection')).toBe(false);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a left click on any pile, the exhaust pile’s tab included, lets the card being aimed go and raises no browse', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);

  for (const pile of ['draw-pile', 'discard-pile', 'exhaust-pile'] as const) {
    await page.mouse.click(home.x, home.y);
    await aimed(page);
    const top = await pileTop(page, pile);
    await page.mouse.click(top.x, top.y);
    await expect.poll(() => standing(page, 'aim')).toBe(false);
    expect(await standing(page, 'browse')).toBe(false);
    await expect.poll(() => selected(page, index, home)).toBe(false);
    expect(await chronicleOf(page)).toEqual(opened);
  }

  expect(problems).toEqual([]);
});

test('a left click anywhere on the infopanel reaches no tile under it, and lets the card being aimed go with the inspection standing', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);
  const city = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);

  /** The card aimed, then the city's tile inspected under the aim. */
  const aimedAndInspected = async (): Promise<void> => {
    await page.mouse.click(home.x, home.y);
    await aimed(page);
    await page.mouse.click(city.x, city.y, { button: 'right' });
    await expect.poll(() => shownCard(page)).toBeDefined();
    await rested(page);
  };

  // A row's tooltip zone, a row's name beside it, and the head.
  for (const on of ['infopanel-row-0', 'panel-row-0-name', 'panel-name']) {
    await aimedAndInspected();
    await click(page, on);
    await expect.poll(() => standing(page, 'aim')).toBe(false);
    expect(await shownCard(page)).toBeDefined();
    await expect.poll(() => selected(page, index, home)).toBe(false);
    expect(await chronicleOf(page)).toEqual(opened);
  }

  await click(page, 'panel-name');
  await rested(page);
  expect(await shownCard(page)).toBeDefined();
  expect(await ringedTile(page)).toBeUndefined();

  expect(problems).toEqual([]);
});

test('a click on a yield reading, a pile or the infopanel lets a unit being aimed go with the inspection standing, and the reading latches its yield', async ({
  page,
}) => {
  const problems = watch(page);
  const { entered: opened } = workerStepped('steps its first worker off the city', () => true);
  const city = tileKey(cityTileOf(opened));

  await openSaved(page, opened);
  const face = await onScreen(page, `tile-${city}`);
  const pile = await pileTop(page, 'draw-pile');

  const presses: [string, () => Promise<void>][] = [
    ['reading-food', () => click(page, 'reading-food')],
    ['draw-pile', () => page.mouse.click(pile.x, pile.y)],
    ['panel-name', () => click(page, 'panel-name')],
  ];
  for (const [on, press] of presses) {
    await page.mouse.click(face.x, face.y);
    await page.mouse.click(face.x, face.y, { button: 'right' });
    await expect.poll(async () => (await marked(page)).inspecting).toBeDefined();
    await rested(page);
    const aiming = await marked(page);
    expect(aiming.ringed, on).toBe(city);
    expect(aiming.lit, on).toBeGreaterThan(0);

    await press();
    await expect
      .poll(() => marked(page), on)
      .toEqual({ ringed: undefined, lit: 0, inspecting: aiming.inspecting });
  }
  expect(await shows(page, 'reading-food-well')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a unit that lights and glows nothing stays selected through a click on a pile', async ({
  page,
}) => {
  const problems = watch(page);
  const { stepped: opened, tile } = workerStepped(
    'steps its first worker off the city onto a tile it can do nothing more from',
    (stepped, at) => {
      const worker = unitAt(stepped.units, at);
      if (worker === undefined) return false;
      const { landings, targets } = byHand(CATALOGUE, stepped, worker);
      return landings.length === 0 && targets.length === 0;
    },
  );
  const key = tileKey(tile);

  await openSaved(page, opened);
  await click(page, `tile-${key}`);
  await expect.poll(async () => (await marked(page)).ringed).toBe(key);

  const pile = await pileTop(page, 'draw-pile');
  await page.mouse.click(pile.x, pile.y);
  await rested(page);
  expect(await marked(page)).toEqual({ ringed: key, lit: 0, inspecting: undefined });
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a click on the band or on the bar’s paper drops a selected tile and the inspection with it, and the band drops a selected card', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();
  const city = tileKey(cityTileOf(opened));

  await openSaved(page, opened);
  const face = await onScreen(page, `tile-${city}`);
  const home = await onScreen(page, `hand-${unit}`);
  const band = await onTheBand(page);
  const paper = await onThePaper(page);

  for (const [on, at] of [
    ['band', band],
    ['paper', paper],
  ] as const) {
    await page.mouse.click(face.x, face.y);
    await page.mouse.click(face.x, face.y, { button: 'right' });
    await expect.poll(async () => (await marked(page)).inspecting).toBeDefined();
    await rested(page);
    expect((await marked(page)).ringed, on).toBe(city);

    await page.mouse.click(at.x, at.y);
    await expect
      .poll(() => marked(page), on)
      .toEqual({ ringed: undefined, lit: 0, inspecting: undefined });
  }

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await selected(page, unit, home)).toBe(true);
  await page.mouse.click(band.x, band.y);
  await expect.poll(() => selected(page, unit, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a press landed on the band and let go on the Menu button, then one landed on the Menu button and let go on the band, drop nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);
  const city = tileKey(cityTileOf(opened));

  await openSaved(page, opened);
  const face = await onScreen(page, `tile-${city}`);
  const band = await onTheBand(page);
  const menu = await onScreen(page, 'menu-button');

  await page.mouse.click(face.x, face.y);
  await expect.poll(() => ringedTile(page)).toBe(city);

  await page.mouse.move(band.x, band.y);
  await page.mouse.down();
  await page.mouse.move(menu.x, menu.y, { steps: 5 });
  await page.mouse.up();
  await page.mouse.down();
  await page.mouse.move(band.x, band.y, { steps: 5 });
  await page.mouse.up();
  await rested(page);
  expect(await ringedTile(page)).toBe(city);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a press landed on one tile and let go on its neighbour inside the drag slack is no click, selects nothing and carries the map nowhere', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);
  const city = cityTileOf(opened);
  const face = `tile-${tileKey(city)}`;

  await openSaved(page, opened);
  const seen = await readings(page, [face, `tile-${tileKey(eastOf(city))}`]);
  const from = seen(face).onScreen;
  const to = seen(`tile-${tileKey(eastOf(city))}`).onScreen;
  const quarter = (await dragSlack(page)) / 4;
  const across = Math.hypot(to.x - from.x, to.y - from.y);
  const step = {
    x: ((to.x - from.x) / across) * quarter,
    y: ((to.y - from.y) / across) * quarter,
  };
  const edge = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

  await page.mouse.move(edge.x - step.x, edge.y - step.y);
  await page.mouse.down();
  await page.mouse.move(edge.x + step.x, edge.y + step.y);
  await page.mouse.up();
  await rested(page);
  expect(await ringedTile(page)).toBeUndefined();
  expect(await stillAt(page, face, from)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a drag while a card is being aimed takes the aim down and plays the card it lifts', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit, tile } = playableAtNothing();

  await openSaved(page, opened);
  const card = await onScreen(page, `hand-${tile}`);

  await page.mouse.click(card.x, card.y);
  await aimed(page);

  await dragOut(page, unit);
  expect(await standing(page, 'aim')).toBe(false);
  await expect.poll(() => chronicleOf(page)).toEqual(playedAtNothing(opened, unit));

  expect(problems).toEqual([]);
});

test('a drag that carries the map leaves a card aimed at the hand being aimed', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, card } = aimableAtHand();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${card}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  await page.mouse.click(home.x, home.y);
  await expect.poll(() => standing(page, 'aim-point')).toBe(true);

  const city = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);
  await dragBetween(page, city, { x: city.x + 120 * city.unit, y: city.y - 80 * city.unit });
  await rested(page);
  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('the inspection key shows the selected card large, and the back key leaves it selected', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  await page.keyboard.press('KeyI');
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await selected(page, unit, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a right press beside the card shown large takes it down and leaves the card selected in the hand', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, unit } = playableAtNothing();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${unit}`);

  await page.mouse.click(home.x, home.y);
  await rested(page);
  expect(await selected(page, unit, home)).toBe(true);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(opened.hand[unit].id);

  // A card has but the one, so a second right click on the card shown large steps nowhere.
  const large = await onScreen(page, 'inspection');
  await page.mouse.click(large.x, large.y, { button: 'right' });
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(true);

  await page.mouse.click(large.x, large.y);
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(true);
  expect(await selected(page, unit, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await selected(page, unit, home)).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('right presses beside the cards walk a browse back: the card shown large, then the browse', async ({
  page,
}) => {
  const problems = watch(page);
  const before = settledOn(1);

  await openSaved(page, before);
  await browse(page, 'draw-pile');

  const other = await onScreen(page, 'browse-card-1');
  await page.mouse.click(other.x, other.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  expect(await standing(page, 'browse')).toBe(true);

  const away = await besideTheCards(page);
  await rested(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  await rested(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await expect.poll(() => standing(page, 'browse')).toBe(false);
  expect(await standing(page, 'menu')).toBe(false);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('a browse released off the canvas stays open, and the next gesture scrolls it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, overflowingPiles());
  await browse(page, 'draw-pile');

  const opened = await scrolled(page);
  expect(opened.offset).toBe(0);
  expect(opened.overflow).toBeGreaterThan(0);

  const frame = await onScreen(page, 'browse-frame');
  const bare = await offCanvas(page);

  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y - 100 * frame.unit, { steps: 6 });
  await page.mouse.move(bare.x, bare.y, { steps: 6 });
  await page.mouse.up();

  await expect.poll(() => offsetOf(page)).toBeGreaterThan(0);
  expect(await standing(page, 'browse')).toBe(true);
  const dropped = await offsetOf(page);

  await wheel(page, -60);
  await expect.poll(() => offsetOf(page)).toBeLessThan(dropped);

  const wheeled = await offsetOf(page);
  await page.mouse.move(frame.x, frame.y);
  await page.mouse.down();
  await page.mouse.move(frame.x, frame.y + 60 * frame.unit, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => offsetOf(page)).toBeLessThan(wheeled);

  expect(problems).toEqual([]);
});
