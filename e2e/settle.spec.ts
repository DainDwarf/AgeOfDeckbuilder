import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { cardOf, deckOf } from '../src/rules/catalogue';
import { admitted } from '../src/rules/chronicle';
import { CENTRE, neighbours, tileAt, tileKey } from '../src/rules/map';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  aimed,
  budget,
  chronicleOf,
  click,
  dragOut,
  endTurnFill,
  endTurnLabel,
  marksIn,
  onScreen,
  openOnCapstone,
  playedOut,
  rested,
  shows,
  standing,
  stoppedTurn,
  watch,
} from './chronicle-screen';

test('a chronicle opens on the settle phase with the city standing nowhere, and the settle card puts it on the tile it is aimed at', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openOnCapstone(page, 1, 'PH_Deck');
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);

  const opened = await chronicleOf(page);
  expect(opened.turn).toBe(0);
  expect(opened.city).toBeUndefined();
  expect(opened.hand).toEqual(deckOf(STAND_IN, 'PH_Deck').settle);
  expect(await standing(page, `hand-${opened.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${opened.hand.length}`)).toBe(false);

  expect(await marksIn(page, 'terrain')).toBe(opened.centre.length);
  for (const coord of opened.centre) {
    expect(await standing(page, `tile-${tileKey(coord)}`)).toBe(true);
  }
  expect(await marksIn(page, 'border')).toBe(0);

  expect(await endTurnLabel(page)).toBe(text('button.settle-phase'));
  expect(await endTurnFill(page)).toBe(LOOK.settlePhase);
  expect(await shows(page, 'settle-phase-frame')).toBe(true);
  expect(await shows(page, 'settle-phase-chip')).toBe(true);
  await click(page, 'end-turn');
  await rested(page);
  await rested(page);
  expect(await endTurnLabel(page)).toBe(text('button.settle-phase'));
  expect(await chronicleOf(page)).toEqual(opened);

  const card = aimOf(cardOf(STAND_IN, 'PH_Settle'));
  if (card.aim !== 'tile') throw new Error('PH_Settle is aimed at no tile');
  const lit = admitted(STAND_IN, opened, card);
  const at = lit.find((coord) => tileKey(coord) !== tileKey(CENTRE));
  if (at === undefined) throw new Error('the settle admits no tile off the centre');

  await dragOut(page, 0);
  await aimed(page);
  expect(await marksIn(page, 'aim-lit')).toBe(lit.length);

  await click(page, `tile-${tileKey(at)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(at);

  const standingCity = await chronicleOf(page);
  expect(tileAt(standingCity.tiles, at)?.terrain).toBe('urban');
  expect(await marksIn(page, 'border')).toBe(standingCity.held.length);

  const button = await onScreen(page, 'end-turn');
  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-settle-phase'));

  await stoppedTurn(page);
  const ticked = await chronicleOf(page);
  expect(ticked.turn).toBe(1);
  expect(await endTurnFill(page)).toBe(LOOK.accent);
  expect(await shows(page, 'settle-phase-frame')).toBe(false);
  expect(await shows(page, 'settle-phase-chip')).toBe(false);
  expect(ticked.hand).toHaveLength(5);
  for (const pile of [ticked.hand, ticked.drawPile, ticked.discardPile]) {
    expect(pile).not.toContain('PH_Settle');
    expect(pile).not.toContain('PH_Claim');
  }

  expect(problems).toEqual([]);
});

test('city mode entered once the city stands hides the settle phase’s frame and chip, and leaving it brings them back', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openOnCapstone(page, 1, 'PH_Deck');
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);

  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);

  await page.keyboard.press('c');
  await expect.poll(() => shows(page, 'city-chip')).toBe(true);
  expect(await shows(page, 'city-frame')).toBe(true);
  expect(await shows(page, 'settle-phase-chip')).toBe(false);
  expect(await shows(page, 'settle-phase-frame')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => shows(page, 'city-chip')).toBe(false);
  expect(await shows(page, 'settle-phase-chip')).toBe(true);
  expect(await shows(page, 'settle-phase-frame')).toBe(true);

  expect(problems).toEqual([]);
});

test('after the settle a free claim lights the six tiles around the city and no other, and a press on one holds it, brings one population that stands on it, and leaves the card in neither pile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openOnCapstone(page, 1, 'PH_Deck');
  await click(page, 'capstone-card-0');
  await expect.poll(() => standing(page, 'capstone')).toBe(false);
  await rested(page);

  await dragOut(page, 0);
  await aimed(page);
  await click(page, `tile-${tileKey(CENTRE)}`);
  await playedOut(page);
  await expect.poll(async () => (await chronicleOf(page)).city).toEqual(CENTRE);

  const settled = await chronicleOf(page);
  const card = aimOf(cardOf(STAND_IN, 'PH_Claim'));
  if (card.aim !== 'tile') throw new Error('PH_Claim is aimed at no tile');
  const around = neighbours(CENTRE).map(tileKey).sort();
  expect(settled.hand[0]).toBe('PH_Claim');
  expect(admitted(STAND_IN, settled, card).map(tileKey).sort()).toEqual(around);

  await click(page, 'hand-0');
  await aimed(page);
  expect(await marksIn(page, 'aim-lit')).toBe(around.length);

  const [tile] = neighbours(CENTRE);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);
  await expect
    .poll(async () => (await chronicleOf(page)).held.length)
    .toBe(settled.held.length + 1);

  const claimed = await chronicleOf(page);
  expect(claimed.held.map(tileKey)).toContain(tileKey(tile));
  expect(claimed.assigned.map(tileKey)).toContain(tileKey(tile));
  expect(claimed.population).toBe(settled.population + 1);
  expect(claimed.hand).toHaveLength(settled.hand.length - 1);
  expect(claimed.drawPile).not.toContain('PH_Claim');
  expect(claimed.discardPile).not.toContain('PH_Claim');

  expect(problems).toEqual([]);
});
