import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { aimOf } from '../src/rules/cards';
import { cardOf, deckOf } from '../src/rules/catalogue';
import { admitted, apply, outcome } from '../src/rules/chronicle';
import { CENTRE, tileAt, tileKey } from '../src/rules/map';
import { LOOK } from '../src/ui/look';
import { text } from '../src/ui/text';
import {
  aimed,
  budget,
  capstoneClosed,
  chronicleOf,
  click,
  dragOut,
  endTurnFill,
  endTurnLabel,
  firstsOf,
  idsOf,
  launchedOn,
  marksIn,
  onScreen,
  openNew,
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
  const before = launchedOn(NOMADIC, 1);

  await openNew(page, NOMADIC, 1);
  await capstoneClosed(page);

  const opened = await chronicleOf(page);
  expect(opened).toEqual(before);
  expect(opened.turn).toBe(0);
  expect(opened.city).toBeUndefined();
  expect(idsOf(opened.hand)).toEqual(deckOf(NOMADIC, firstsOf(NOMADIC).deck).settle);
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

  const settle = opened.hand[0].id;
  const card = aimOf(cardOf(NOMADIC, settle));
  if (card.aim !== 'tile') throw new Error(`${settle} is aimed at no tile`);
  const lit = admitted(NOMADIC, opened, card);
  const at = lit.find((coord) => tileKey(coord) !== tileKey(CENTRE));
  if (at === undefined) throw new Error('the settle admits no tile off the centre');
  const settled = outcome(
    apply(NOMADIC, before, { type: 'play', index: 0, aim: 'tile', tile: at }),
  );

  await dragOut(page, 0);
  await aimed(page);
  expect(await marksIn(page, 'aim-lit')).toBe(lit.length);

  await click(page, `tile-${tileKey(at)}`);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(settled);

  const standingCity = await chronicleOf(page);
  expect(standingCity.city).toEqual(at);
  expect(tileAt(standingCity.tiles, at)?.building).toBe(NOMADIC.city.building);
  expect(tileAt(standingCity.tiles, at)?.terrain).toBe(tileAt(opened.tiles, at)?.terrain);
  expect(await marksIn(page, 'border')).toBe(standingCity.held.length);

  const button = await onScreen(page, 'end-turn');
  await page.mouse.move(button.x, button.y);
  await expect.poll(() => endTurnLabel(page)).toBe(text('button.end-settle-phase'));

  await stoppedTurn(page);
  const ticked = await chronicleOf(page);
  expect(ticked).toEqual(outcome(apply(NOMADIC, settled, { type: 'end-turn' })));
  expect(ticked.turn).toBe(1);
  expect(await endTurnFill(page)).toBe(LOOK.accent);
  expect(await shows(page, 'settle-phase-frame')).toBe(false);
  expect(await shows(page, 'settle-phase-chip')).toBe(false);
  expect(ticked.hand).toHaveLength(5);
  for (const pile of [ticked.hand, ticked.drawPile, ticked.discardPile]) {
    for (const { id } of opened.hand) expect(idsOf(pile)).not.toContain(id);
  }

  expect(problems).toEqual([]);
});

test('city mode entered once the city stands hides the settle phase’s frame and chip, and leaving it brings them back', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));

  await openNew(page, NOMADIC, 1);
  await capstoneClosed(page);

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
