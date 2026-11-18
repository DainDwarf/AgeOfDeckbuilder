import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { addedToDrawPileTop, offered } from '../src/rules/schedule';
import { cardFace, cardFaceAtStart, kindTooltip } from '../src/ui/face';
import { text } from '../src/ui/text';
import {
  besideTheDeal,
  besideTiles,
  campBeside,
  cardOnFace,
  chronicleOf,
  cursorOverCanvas,
  endedTurn,
  endTurnLabel,
  firstDealt,
  influenceCardGaining,
  kindLabelOnScreen,
  liftedPart,
  offCanvas,
  onScreen,
  openSaved,
  reading,
  restedOnDeal,
  settledOn,
  standing,
  stoppedTurn,
  tooltipText,
  tooltipUp,
  WARRIOR,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** Taller than the design aspect, so the canvas letterboxes and bare page is left above it. */
const WINDOW = { width: 1280, height: 900 };

/** Longer than the rest a tooltip waits out, so one that were coming has had every chance to. */
const PAST_REST = 800;

/** The cursor over something that reacts to a press. */
const HAND = 'pointer';

test('a pointer that leaves the canvas over a resource raises no tooltip behind it', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(1));

  const food = await onScreen(page, 'reading-food');
  const bare = await offCanvas(page);

  await page.mouse.move(food.x, food.y);
  await page.mouse.move(bare.x, bare.y, { steps: 5 });
  await waitGameClock(page, PAST_REST);

  expect(await tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

test('a tooltip standing over a resource goes down when the pointer leaves the canvas', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(1));

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
  await openSaved(page, settledOn(1));

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

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(1));
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
  await openSaved(page, settledOn(1));

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
  await restedOnDeal(page);

  const food = await onScreen(page, 'reading-food');
  await page.mouse.move(food.x, food.y);
  await waitGameClock(page, PAST_REST);

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
  await openSaved(page, settledOn(1));

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
  await openSaved(page, settledOn(1));

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

test('the end-turn button reads the turn again when the pointer moves straight onto the Menu button', async ({
  page,
}) => {
  const problems = watch(page);

  await page.setViewportSize(WINDOW);
  await openSaved(page, settledOn(1));

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
  await openSaved(page, settledOn(1));

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
function liftedLabel(
  page: Page,
  lying: { x: number; y: number },
): Promise<{ x: number; y: number }> {
  return liftedPart(page, () => kindLabelOnScreen(page, 'hand-0'), lying);
}

test("a card's kind label in the hand raises the bubble reading what its kind is, and a right click on it shows the card large", async ({
  page,
}) => {
  const problems = watch(page);

  const opened = settledOn(1);
  await openSaved(page, opened);

  const held = opened.hand[0];
  if (held === undefined) throw new Error('the hand holds no card');
  const { id, kind } = cardFace(CATALOGUE, held, opened.citySection.building);
  const card = await onScreen(page, 'hand-0');
  const lying = await kindLabelOnScreen(page, 'hand-0');

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const label = await liftedLabel(page, lying);
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(kindTooltip(kind));
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

test("a card of the hand that gains influence reads it on its disc, and the disc raises the influence reading's bubble", async ({
  page,
}) => {
  const problems = watch(page);
  const trophy = influenceCardGaining('trophy', (influence) => influence > 0);
  const added = addedToDrawPileTop(CATALOGUE, settledOn(1), trophy).chronicle;
  const [drawn] = added.drawPile;
  const opened = endedTurn(added);
  const at = opened.hand.findIndex(({ key }) => key === drawn.key);
  if (at === -1) throw new Error(`the turn ended draws no ${trophy}`);
  const { influence } = cardFace(CATALOGUE, opened.hand[at], opened.citySection.building);
  const face = `hand-${at}`;

  await openSaved(page, opened);
  const card = await onScreen(page, face);
  const lying = await reading(page, face);
  expect(lying.influence.text).toBe(String(influence));

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const disc = await liftedPart(
    page,
    async () => (await reading(page, face)).influence.onScreen,
    lying.influence.onScreen,
  );
  await page.mouse.move(disc.x, disc.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(true);
  expect(await tooltipText(page, 'tooltip-ui')).toBe(text('tooltip.influence'));

  const beside = await besideTiles(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-ui')).toBe(false);

  expect(problems).toEqual([]);
});

test("a reward's kind label on a capture's window raises the overlay's bubble reading what its kind is", async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle } = campBeside((tile) => ({ type: WARRIOR, faction: 'player', tile }));
  const captured = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
  const [deal] = captured.deals;
  if (deal?.of !== 'capture') throw new Error('the camp is not captured');
  const [reward] = offered(CATALOGUE, deal);
  const { kind } = cardFaceAtStart(CATALOGUE, reward, captured.citySection.building);

  await openSaved(page, captured);
  await restedOnDeal(page);

  const label = await kindLabelOnScreen(page, 'deal-card-0');
  await page.mouse.move(label.x, label.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(true);
  expect(await tooltipText(page, 'tooltip-overlay')).toBe(kindTooltip(kind));

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => tooltipUp(page, 'tooltip-overlay')).toBe(false);

  expect(problems).toEqual([]);
});
