import { expect, type Page, test } from '@playwright/test';
import { catalogueOf } from '../src/content/catalogues';
import { NOMADIC } from '../src/content/nomadic';
import { cardOf } from '../src/rules/catalogue';
import { type TileCoords, tileKey } from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  bareTile,
  besideTheDeal,
  besideTiles,
  budget,
  cardOnFace,
  chronicleOf,
  cursorOverCanvas,
  endTurnLabel,
  firstDealt,
  kindLabelOnScreen,
  offCanvas,
  onScreen,
  openSaved,
  rested,
  ringedTile,
  settledOn,
  shownCard,
  standing,
  stoppedTurn,
  tileOnScreen,
  tooltipText,
  tooltipUp,
  watch,
} from './chronicle-screen';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left above it. */
const WINDOW = { width: 1280, height: 900 };

/** Longer than the rest a tooltip waits out, so one that were coming has had every chance to. */
const PAST_REST = 800;

/** The cursor over something that answers a press. */
const HAND = 'pointer';

test('a pointer that leaves the canvas over a resource raises no tooltip behind it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await page.waitForTimeout(PAST_REST);

  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

test('a tooltip standing over a resource goes down when the pointer leaves the canvas', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

// The single move is the whole point: the pointer never passes over the canvas outside the button,
// so nothing but the leaving of the canvas itself can end the hover.
test('the end-turn button reads the turn again when the pointer leaves the canvas over it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  expect(problems).toEqual([]);
});

// The end of turn is pressed on the button and the pointer rests there through its play-out: the
// first assertions have to come before any move.
test('the end-turn button reads End turn under the pointer the last turn ended at', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));
  await stoppedTurn(page);

  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const { turn } = await chronicleOf(page);
  const beside = await besideTiles(page);
  await page.mouse.move(beside.x, beside.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));
  expect(await cursorOverCanvas(page)).not.toBe(HAND);

  expect(problems).toEqual([]);
});

test('the end-turn button reads End turn when the pointer comes back straight onto it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const bare = await offCanvas(page);

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const beside = await besideTiles(page);
  await page.mouse.move(beside.x, beside.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));
  expect(await cursorOverCanvas(page)).not.toBe(HAND);

  expect(problems).toEqual([]);
});

test('a reading hovered while the deal window stands raises no tooltip', async ({ page }) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, firstDealt(1));
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await page.waitForTimeout(PAST_REST);

  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

// The pointer never moves after the key: the menu rising is the one thing that can take the bubble
// down, and Phaser tells nothing under a scrim that it was covered.
test('a tooltip standing over a reading goes down when the back key raises the menu', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

// The pointer never moves after it reaches the button: the menu rising and falling over it is all
// that happens under it.
test('the end-turn button reads End turn the moment the menu falls under a pointer resting on it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  await page.mouse.move(button.x - 20 * button.unit, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  expect(problems).toEqual([]);
});

/** The bare tile inspected, and the pointer resting on the first row of its card. */
async function onPanelRow(page: Page, at: TileCoords): Promise<void> {
  const tile = await tileOnScreen(page, at);
  await page.mouse.click(tile.x, tile.y);
  await expect.poll(() => ringedTile(page)).toBe(tileKey(at));
  await page.keyboard.press('i');
  await expect.poll(() => shownCard(page)).toBe('terrain');
  const row = await onScreen(page, 'infopanel-row-0');
  await page.mouse.move(row.x, row.y);
}

// One move each way: the pointer never crosses bare map between the row and the reading.
test("a panel row's tooltip does not rise once the pointer moves straight onto a reading", async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  const opened = settledOn(NOMADIC, 1);
  await openSaved(page, opened);

  await onPanelRow(page, bareTile(opened));
  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await page.waitForTimeout(PAST_REST);

  expect(await tooltipUp(page, 'tooltip-map')).toBe(false);

  expect(problems).toEqual([]);
});

test("a panel row's tooltip rises when the pointer comes straight back onto it from a reading", async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  const opened = settledOn(NOMADIC, 1);
  await openSaved(page, opened);

  await onPanelRow(page, bareTile(opened));
  const row = await onScreen(page, 'infopanel-row-0');
  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await page.waitForTimeout(PAST_REST);
  await page.mouse.move(row.x, row.y);

  await expect.poll(() => tooltipUp(page, 'tooltip-map')).toBe(true);

  expect(problems).toEqual([]);
});

test('the end-turn button reads the turn again when the pointer moves straight onto the Menu button', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const { turn } = await chronicleOf(page);
  const button = await onScreen(page, 'end-turn');
  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(button.x - 20 * button.unit, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-turn'));

  await page.mouse.move(menu.x, menu.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.turn', { turn }));

  expect(problems).toEqual([]);
});

test('a hand card the pointer leaves the canvas over settles back into the hand', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(NOMADIC, 1));

  const card = 'hand-0';
  const rest = await onScreen(page, card);
  const bare = await offCanvas(page);

  await page.mouse.move(rest.x, rest.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeLessThan(rest.y);

  await page.mouse.move(bare.x, bare.y);
  await expect.poll(() => onScreen(page, card).then((at) => at.y)).toBeCloseTo(rest.y, 0);

  expect(problems).toEqual([]);
});

/** The first card's kind label once the card has come to rest lifted out of the hand. */
async function liftedLabel(
  page: Page,
  lying: { x: number; y: number },
): Promise<{ x: number; y: number }> {
  let label = lying;
  await expect
    .poll(async () => {
      const was = await kindLabelOnScreen(page, 'hand-0');
      await rested(page);
      label = await kindLabelOnScreen(page, 'hand-0');
      return label.y < lying.y && label.y === was.y;
    })
    .toBe(true);
  return label;
}

test("a card's kind label in the hand raises the bubble reading what its kind is, and a right click on it shows the card large", async ({
  page,
}) => {
  const problems = watch(page);

  const opened = settledOn(NOMADIC, 1);
  await openSaved(page, opened);

  const id = opened.hand[0]?.id;
  if (id === undefined) throw new Error('the hand holds no card');
  const { kind } = cardOf(catalogueOf(opened.content), id);
  const card = await onScreen(page, 'hand-0');
  const lying = await kindLabelOnScreen(page, 'hand-0');

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const label = await liftedLabel(page, lying);
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(text(`tooltip.${kind}`));
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const beside = await besideTiles(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(false);

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const again = await liftedLabel(page, lying);
  await page.mouse.click(again.x, again.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(id);

  expect(problems).toEqual([]);
});

test("an answer's kind label on the deal window raises the overlay's bubble reading what an event is", async ({
  page,
}) => {
  const problems = watch(page);

  await openSaved(page, firstDealt(1));
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  const label = await kindLabelOnScreen(page, 'deal-card-0');
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(true);
  expect(await tooltipText(page, 'tooltip-overlay')).toBe(text('tooltip.event'));

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(false);

  expect(problems).toEqual([]);
});
