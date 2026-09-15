import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { aimOf } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { admitted } from '../src/rules/chronicle';
import { CENTRE, tileAt, tileKey } from '../src/rules/map';
import { text } from '../src/ui/text';
import {
  aimed,
  budget,
  chronicleOf,
  click,
  dragOut,
  endTurnLabel,
  marksIn,
  openOnCapstone,
  playedOut,
  rested,
  standing,
  stoppedTurn,
  watch,
} from './chronicle-screen';

test('a chronicle opens on turn 0 with the city standing nowhere, and the settle card puts it on the tile it is aimed at', async ({
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
  expect(opened.hand).toEqual(['PH_Settle']);
  expect(await standing(page, 'hand-0')).toBe(true);
  expect(await standing(page, 'hand-1')).toBe(false);

  expect(await marksIn(page, 'terrain')).toBe(opened.centre.length);
  for (const coord of opened.centre) {
    expect(await standing(page, `tile-${tileKey(coord)}`)).toBe(true);
  }
  expect(await marksIn(page, 'border')).toBe(0);

  expect(await endTurnLabel(page)).toBe(text('button.turn', { turn: 0 }));
  await click(page, 'end-turn');
  await rested(page);
  await rested(page);
  expect(await endTurnLabel(page)).toBe(text('button.turn', { turn: 0 }));
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
  expect(tileAt(standingCity.tiles, at)?.terrain).toBe(STAND_IN.city.terrain);
  expect(await marksIn(page, 'border')).toBe(standingCity.held.length);

  await stoppedTurn(page);
  const ticked = await chronicleOf(page);
  expect(ticked.turn).toBe(1);
  expect(ticked.hand).toHaveLength(5);
  for (const pile of [ticked.hand, ticked.drawPile, ticked.discardPile]) {
    expect(pile).not.toContain('PH_Settle');
  }

  expect(problems).toEqual([]);
});
