import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { pinned, unpinnable } from '../src/rules/campaign';
import { achievementOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { CENTRE, type TileCoords, tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
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
  endedTurn,
  firstSeed,
  inHand,
  type Judged,
  launchedOn,
  mapFrame,
  namedIn,
  nameOnScreen,
  type OnScreen,
  offCanvas,
  offsetOf,
  onScreen,
  openSaved,
  overflowingPiles,
  pileTop,
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

/** The chronicle the card at that place in the hand leaves, played at nothing. */
function playedAtNothing(chronicle: Chronicle, index: number): Chronicle {
  return outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'none' }));
}

/** Whether a named object stands where it was measured, to the page pixel. */
async function stillAt(page: Page, name: string, was: OnScreen): Promise<boolean> {
  const now = await onScreen(page, name);
  return Math.round(now.x - was.x) === 0 && Math.round(now.y - was.y) === 0;
}

/**
 * Carries the map by a drag off the tile until the tile stands under the middle of the named object,
 * so a press that fell through the object would land on it.
 */
async function carriedUnder(page: Page, tile: TileCoords, name: string): Promise<void> {
  const face = `tile-${tileKey(tile)}`;
  const to = await onScreen(page, name);
  await dragBetween(page, await onScreen(page, face), to);
  await rested(page);
  const now = await onScreen(page, face);
  if (Math.hypot(now.x - to.x, now.y - to.y) >= 2) {
    throw new Error(`the map stops short of carrying ${face} under ${name}`);
  }
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
  const { stepped: moved, tile } = workerStepped(
    'steps its first worker onto a tile a card aimed at a tile the city can pay for admits',
    (stepped, at) => admits(stepped, inHand(stepped, tilePlayable), at),
  );
  const index = inHand(moved, tilePlayable);

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
  await expect
    .poll(() => chronicleOf(page))
    .toEqual(outcome(apply(CATALOGUE, moved, { type: 'play', index, aim: 'tile', tile })));

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

test('a click on the resource bar lets the card being aimed go and lands as on a clean screen: nothing on its bare ground, and the yield latched on a yield reading', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);
  // Food is the bar's first reading: its bare ground runs from the bar's left end to that zone.
  const seen = await readings(page, ['resource-bar', 'reading-food']);
  const bar = seen('resource-bar').boundsOnScreen;
  const food = seen('reading-food').boundsOnScreen;
  const ground = { x: (bar.x + food.x) / 2, y: food.y + food.height / 2 };

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  expect(await cursorAt(page, ground)).toBe('');
  await page.mouse.click(ground.x, ground.y);
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

test('a click on the line naming the aim lets the card go and reaches no tile under it', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await carriedUnder(page, cityTileOf(opened), 'aim-line');
  await click(page, 'aim-line');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

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

test('a click on the pinned achievement, a name in its goal included, lets the card being aimed go and reaches no tile under it', async ({
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
        unpinnable(CATALOGUE, technology, won.technologies) === undefined &&
        namedIn(achievementGoal(id, need)).length > 0,
    );
  if (pin === undefined)
    throw new Error(
      `the ${era.age} age reads no achievement of a pinnable technology whose goal names a thing`,
    );

  await openSaved(page, opened, pinned(CATALOGUE, won, pin.technology));
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  await click(page, 'pinned-achievement-name');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await ringedTile(page)).toBeUndefined();
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(home.x, home.y);
  await aimed(page);
  const name = await nameOnScreen(page, 'pinned-achievement-face');
  await page.mouse.click(name.x, name.y);
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'inspection')).toBe(false);
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a left click on either pile lets the card being aimed go and raises no browse', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle: opened, index } = bareAimable();

  await openSaved(page, opened);
  const home = await onScreen(page, `hand-${index}`);

  for (const pile of ['draw-pile', 'discard-pile'] as const) {
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
