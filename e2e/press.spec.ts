import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { cardName, text } from '../src/ui/text';
import {
  admits,
  aimed,
  aimLine,
  bareAimable,
  besideTheCards,
  browse,
  cardOnFace,
  chronicleOf,
  cityTileOf,
  click,
  doubledDeck,
  dragOut,
  endedTurn,
  firstSeed,
  inHand,
  type Judged,
  mapFrame,
  type OnScreen,
  offCanvas,
  offsetOf,
  onScreen,
  openSaved,
  playedOut,
  rested,
  ringed,
  scrolled,
  selected,
  settledOn,
  shownCard,
  standing,
  tilePlayable,
  watch,
  wheel,
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
      let opened = settledOn(NOMADIC, seed);
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
  return outcome(apply(NOMADIC, chronicle, { type: 'play', index, aim: 'none' }));
}

/** Whether a named object stands where it was measured, to the page pixel. */
async function stillAt(page: Page, name: string, was: OnScreen): Promise<boolean> {
  const now = await onScreen(page, name);
  return Math.round(now.x - was.x) === 0 && Math.round(now.y - was.y) === 0;
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
    .toEqual(outcome(apply(NOMADIC, moved, { type: 'play', index, aim: 'tile', tile })));

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

test('a right press beside the cards drops the card a browse shows large, and does nothing while none stands', async ({
  page,
}) => {
  const problems = watch(page);
  const before = settledOn(NOMADIC, 1);

  await openSaved(page, before);
  await browse(page, 'draw-pile');

  await click(page, 'browse-card-0');
  await expect.poll(() => ringed(page, 'browse-card-0')).toBe(true);

  // Nothing stands large, so the right press beside the cards has nothing to take down.
  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await rested(page);
  expect(await standing(page, 'browse')).toBe(true);
  expect(await ringed(page, 'browse-card-0')).toBe(true);

  const other = await onScreen(page, 'browse-card-1');
  await page.mouse.click(other.x, other.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);
  expect(await standing(page, 'browse')).toBe(false);

  await page.mouse.click(away.x, away.y, { button: 'right' });
  await expect.poll(() => standing(page, 'browse')).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await ringed(page, 'browse-card-0')).toBe(true);
  expect(await chronicleOf(page)).toEqual(before);

  expect(problems).toEqual([]);
});

test('a browse released off the canvas stays open, and the next gesture scrolls it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1, [], doubledDeck()));
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
