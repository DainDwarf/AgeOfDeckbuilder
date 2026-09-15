import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { cardOf, deckOf } from '../src/rules/catalogue';
import { refusalOf } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import { type Chronicle, playable } from '../src/rules/state';
import { cardName, text } from '../src/ui/text';
import {
  aimed,
  aimLine,
  atTile,
  atTileRun,
  besideTheCards,
  browse,
  budget,
  cardOnFace,
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  dragUnit,
  endedTurn,
  endTurn,
  firstSeed,
  launch,
  mapFrame,
  type OnScreen,
  offCanvas,
  offsetOf,
  onScreen,
  open,
  playedOut,
  ringed,
  scrolled,
  selected,
  settled,
  shownCard,
  standing,
  watch,
  wheel,
  workerRun,
} from './chronicle-screen';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left to release on. */
const WINDOW = { width: 1280, height: 900 };

/** How far up a card comes before the release plays it, in design units, and then some. */
const LIFTED = 140;

/** Where a card the city can pay for and play at nothing lies in the hand, or -1. */
function atNothing(chronicle: Chronicle): number {
  return chronicle.hand.findIndex(
    (id) =>
      aimOf(cardOf(STAND_IN, id)).aim === 'none' && playable(refusalOf(STAND_IN, chronicle, id)),
  );
}

/** The first seed with a turn in its first eight that opens on such a card. */
function playableRun(): { seed: number; turn: number } {
  return firstSeed('opens a turn on a card that plays at nothing', (seed) => {
    let chronicle = launch(seed, deckOf(STAND_IN, 'PH_LongDeck'));
    for (let turn = 1; turn <= 8; turn++) {
      if (atNothing(chronicle) !== -1) return { seed, turn };
      chronicle = endedTurn(chronicle);
    }
    return undefined;
  });
}

/**
 * The first seed with a turn in its first eight whose hand holds a card aimed at a tile and a card
 * that plays at nothing, the city paying for both.
 */
function bothKindsRun(): { seed: number; turn: number } {
  return firstSeed(
    'opens a turn on a card aimed at a tile and a card that plays at nothing',
    (seed) => {
      let chronicle = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
      for (let turn = 1; turn <= 8; turn++) {
        if (atTile(chronicle) !== -1 && atNothing(chronicle) !== -1) return { seed, turn };
        chronicle = endedTurn(chronicle);
      }
      return undefined;
    },
  );
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
  const run = playableRun();

  await page.setViewportSize(WINDOW);
  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const card = `hand-${atNothing(opened)}`;
  const home = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.mouse.up();

  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  expect(await stillAt(page, card, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await page.mouse.move(home.x, home.y, { steps: 5 });
  await page.mouse.up();
  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect(await standing(page, 'inspection')).toBe(false);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  expect(problems).toEqual([]);
});

test('a hand card whose release the blur swallowed comes home, and the next press plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await page.setViewportSize(WINDOW);
  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atNothing(opened);
  const card = `hand-${index}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.mouse.move(home.x, home.y - LIFTED * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(false);

  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });

  await expect.poll(() => stillAt(page, card, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  // The release the browser finally delivers, long after the gesture it belonged to ended.
  await page.mouse.up();
  expect(await stillAt(page, card, home)).toBe(true);
  expect(await standing(page, 'inspection')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await dragOut(page, index);
  await expect.poll(async () => (await chronicleOf(page)).hand).not.toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('a press the blur swallowed before it dragged is no click, and the next right click inspects', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await page.setViewportSize(WINDOW);
  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const card = `hand-${atNothing(opened)}`;
  const home = await onScreen(page, card);

  await page.mouse.move(home.x, home.y);
  await page.mouse.down();
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
  });
  await page.mouse.up();

  expect(await standing(page, 'inspection')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.mouse.move(home.x, home.y - 300 * home.unit, { steps: 5 });
  await expect.poll(() => stillAt(page, card, home)).toBe(true);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  expect(problems).toEqual([]);
});

test('a right click on the card being aimed shows it large, and the back key leaves the aim standing', async ({
  page,
}) => {
  const problems = watch(page);
  const run = atTileRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atTile(opened);
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

test('a click selects a card that plays at nothing, and a second click plays it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atNothing(opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);
  expect(await selected(page, index, home)).toBe(true);

  await page.mouse.click(home.x, home.y);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).hand).not.toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('a right click inspects a tile while a card is selected, and the back key takes the inspection first', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atNothing(opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect(await selected(page, index, home)).toBe(true);

  // The city's own tile: the map centres on it, so the press lands clear of the hand and the bar,
  // and nothing stands on it this early, so the first card of its cycle is what is built there.
  const city = await onScreen(page, `tile-${tileKey(cityTileOf(opened))}`);
  await page.mouse.click(city.x, city.y, { button: 'right' });
  await expect.poll(() => shownCard(page)).toBe('building');
  expect(await selected(page, index, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  await page.keyboard.press('Escape');
  await expect.poll(() => shownCard(page)).toBeUndefined();
  expect(await selected(page, index, home)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => selected(page, index, home)).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('a click aims a card at the tiles it admits, and a click on another card takes it', async ({
  page,
}) => {
  const problems = watch(page);
  const run = bothKindsRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atTile(opened);
  const other = atNothing(opened);
  const card = await onScreen(page, `hand-${index}`);
  const beside = await onScreen(page, `hand-${other}`);

  await page.mouse.click(card.x, card.y);
  await aimed(page);

  await page.mouse.click(card.x, card.y);
  await settled(page);
  expect(await standing(page, 'aim')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.click(beside.x, beside.y);
  await settled(page);
  expect(await standing(page, 'aim')).toBe(false);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);
  expect(await selected(page, other, beside)).toBe(true);

  expect(problems).toEqual([]);
});

test('the card being aimed wears a point and says what it is played at, and a card merely selected neither', async ({
  page,
}) => {
  const problems = watch(page);
  const run = bothKindsRun();
  test.setTimeout(budget(run.turn));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const other = atNothing(opened);
  const beside = await onScreen(page, `hand-${other}`);

  await page.mouse.click(beside.x, beside.y);
  await settled(page);
  expect(await selected(page, other, beside)).toBe(true);
  expect(await standing(page, 'aim-point')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();

  const index = atTile(opened);
  const card = await onScreen(page, `hand-${index}`);
  await page.mouse.click(card.x, card.y);
  await aimed(page);

  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await aimLine(page)).toBe(text('aim.tile', { card: cardName(opened.hand[index]) }));

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'aim')).toBe(false);
  expect(await standing(page, 'aim-point')).toBe(false);
  expect(await aimLine(page)).toBeUndefined();
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});

test('a card aimed at a unit says it is played at a unit', async ({ page }) => {
  const problems = watch(page);
  const run = workerRun('PH_Farm', (_, chronicle) => chronicle.hand.includes('PH_March'));
  // The run's ends of turn, the worker entered on the turn it opens, and the step it takes.
  test.setTimeout(budget(run.turn + 2));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  await dragOut(page, opened.hand.indexOf('PH_Worker'));
  await expect.poll(async () => (await chronicleOf(page)).units.length).toBe(1);

  // The refresh instant admits the tile of a unit that has spent move points, so the worker moves first.
  const entered = await chronicleOf(page);
  await dragUnit(page, cityTileOf(entered), run.tile);

  const moved = await chronicleOf(page);
  const home = await onScreen(page, `hand-${moved.hand.indexOf('PH_March')}`);
  await page.mouse.click(home.x, home.y);
  await aimed(page);

  expect(await standing(page, 'aim-point')).toBe(true);
  expect(await aimLine(page)).toBe(text('aim.unit', { card: text('card.PH_March') }));

  expect(problems).toEqual([]);
});

test('a click beside the tiles lets the card being aimed go, as it drops a selection', async ({
  page,
}) => {
  const problems = watch(page);
  const run = atTileRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atTile(opened);
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
  const run = bothKindsRun();

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const card = await onScreen(page, `hand-${atTile(opened)}`);

  await page.mouse.click(card.x, card.y);
  await aimed(page);

  await dragOut(page, atNothing(opened));
  expect(await standing(page, 'aim')).toBe(false);
  await expect.poll(async () => (await chronicleOf(page)).hand).not.toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('the inspection key shows the selected card large, and the back key leaves it selected', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atNothing(opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  await page.keyboard.press('KeyI');
  await expect.poll(() => standing(page, 'inspection')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await selected(page, index, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('a right press beside the card shown large takes it down and leaves the card selected in the hand', async ({
  page,
}) => {
  const problems = watch(page);
  const run = playableRun();

  await open(page, run.seed, 'PH_LongDeck');
  for (let turn = 1; turn < run.turn; turn++) await endTurn(page);

  const opened = await chronicleOf(page);
  const index = atNothing(opened);
  const home = await onScreen(page, `hand-${index}`);

  await page.mouse.click(home.x, home.y);
  await settled(page);
  expect(await selected(page, index, home)).toBe(true);

  await page.mouse.click(home.x, home.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(opened.hand[index]);

  // A card has but the one, so a second right click on the card shown large steps nowhere.
  const large = await onScreen(page, 'inspection');
  await page.mouse.click(large.x, large.y, { button: 'right' });
  await settled(page);
  expect(await standing(page, 'inspection')).toBe(true);

  await page.mouse.click(large.x, large.y);
  await settled(page);
  expect(await standing(page, 'inspection')).toBe(true);
  expect(await selected(page, index, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await selected(page, index, home)).toBe(true);
  expect((await chronicleOf(page)).hand).toEqual(opened.hand);

  expect(problems).toEqual([]);
});

test('a right press beside the cards drops the card a browse shows large, and does nothing while none stands', async ({
  page,
}) => {
  const problems = watch(page);

  await open(page, 1, 'PH_LongDeck');
  const before = await chronicleOf(page);
  await browse(page, 'draw-pile');

  await click(page, 'browse-card-0');
  await expect.poll(() => ringed(page, 'browse-card-0')).toBe(true);

  // Nothing stands large, so the right press beside the cards has nothing to take down.
  const away = await besideTheCards(page);
  await page.mouse.click(away.x, away.y, { button: 'right' });
  await settled(page);
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
  await open(page, 1, 'PH_LongDeck');
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
