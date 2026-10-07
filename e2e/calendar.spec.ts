import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { type Chronicle, turnShown } from '../src/rules/state';
import { text } from '../src/ui/text';
import {
  chronicleOf,
  dragOut,
  firstSeed,
  idsOf,
  openSaved,
  playedAtNothing,
  readings,
  refusalLines,
  settledOn,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that shows the turn of the next landing. */
const CALENDAR = 'calendar';

/** The first civilization the catalogue lists, with two copies of the card added to its cards. */
const CIVILIZATION = (() => {
  const once = withCard(CALENDAR);
  return { ...once, cards: [...once.cards, CALENDAR] };
})();

/**
 * The first seed's turn 1 whose hand holds both copies of the card, the cost of both gained, and
 * where the first lies.
 */
function twoInHand(): { opened: Chronicle; index: number } {
  return firstSeed(`opens turn 1 on two copies of ${CALENDAR} in hand`, (seed) => {
    const settled = settledOn(seed, [], CIVILIZATION);
    const held = idsOf(settled.hand).filter((id) => id === CALENDAR);
    if (held.length < 2) return undefined;
    const { cost } = cardOf(CATALOGUE, CALENDAR);
    const opened = gained(gained(settled, cost).chronicle, cost).chronicle;
    return { opened, index: idsOf(opened.hand).indexOf(CALENDAR) };
  });
}

test('the calendar played raises the strip over the end-turn button reading the turn the rules show, and a calendar played while it stands is refused under its sentence', async ({
  page,
}) => {
  const problems = watch(page);
  const { opened, index } = twoInHand();
  const shown = playedAtNothing(opened, index);
  const turn = turnShown(shown);
  if (turn === undefined) throw new Error(`${CALENDAR} played shows no turn`);
  const other = idsOf(shown.hand).indexOf(CALENDAR);

  await openSaved(page, opened);
  const before = await readings(page, ['shown-event']);
  expect(before('shown-event').shows).toBe(false);

  await dragOut(page, index);
  await expect.poll(() => chronicleOf(page)).toEqual(shown);
  const after = await readings(page, ['shown-event', 'shown-event-turn', 'end-turn']);
  const strip = after('shown-event');
  const button = after('end-turn');
  expect(strip.shows).toBe(true);
  expect(after('shown-event-turn').text).toBe(text('shown-event.turn', { turn }));
  expect(strip.across.left).toBeCloseTo(button.across.left);
  expect(strip.across.right).toBeCloseTo(button.across.right);
  expect(strip.boundsOnScreen.y + strip.boundsOnScreen.height).toBeLessThan(
    button.boundsOnScreen.y,
  );

  await dragOut(page, other);
  expect(await refusalLines(page)).toEqual([text('refusal.turn-shown')]);
  expect(await chronicleOf(page)).toEqual(shown);
  expect(problems).toEqual([]);
});
