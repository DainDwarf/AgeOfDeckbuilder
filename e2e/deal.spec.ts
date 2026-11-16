import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { answerCost, answerOf, answerRefusal, offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { eventLore } from '../src/ui/lore';
import { refused } from '../src/ui/refusal-lines';
import {
  besideTheDeal,
  budget,
  chronicleOf,
  click,
  cursorAt,
  enemiesOf,
  eventDealRead,
  firstDealtAlone,
  firstEntriesTaken,
  firstSeed,
  offeredOn,
  openSaved,
  readings,
  refusalLines,
  rested,
  restedOnDeal,
  settledOn,
  standing,
  take,
  watch,
} from './chronicle-screen';

/** The event the first spec opens on. */
const LEAN_SEASON = 'lean-season';

/** The answer of the lean season that enters warriors. */
const RATION = 'ration';

/** The cursor over something that answers a left click or a rest. */
const HAND = 'pointer';

/**
 * The chronicle of the first seed and turn, inside forty turns, whose deal offers an answer the city
 * cannot pay for, stopped on that deal, and that answer.
 */
function unpaid(): { dealt: Chronicle; answer: string } {
  return firstSeed('deals an answer its city cannot pay for inside forty turns', (seed) => {
    let chronicle = settledOn(seed);
    while (chronicle.turn < 40 && chronicle.ending === undefined) {
      const dealt = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
      const [deal] = dealt.deals;
      if (deal?.of === 'event') {
        const answer = offered(CATALOGUE, deal).find(
          (id) => answerRefusal(CATALOGUE, dealt, deal.event, id).unaffordable.length > 0,
        );
        if (answer !== undefined) return { dealt, answer };
      }
      chronicle = firstEntriesTaken(dealt);
    }
    return undefined;
  });
}

test('the events phase deals a choice, and the turn plays on from the one a left click takes', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const dealt = firstDealtAlone(LEAN_SEASON);
  const answers = offeredOn(dealt);
  const ration = answers.indexOf(RATION);
  if (ration === -1) throw new Error(`the ${LEAN_SEASON} offers no ${RATION}`);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: ration }));

  await openSaved(page, dealt);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, LEAN_SEASON, []);

  const first = shown('deal-card-0').onScreen;
  const second = shown('deal-card-1').onScreen;
  expect(await cursorAt(page, { x: (first.x + second.x) / 2, y: first.y })).toBe('');
  expect(await cursorAt(page, second)).toBe(HAND);

  // Inside the answer's padding over its name, where no name of its text lies.
  const offNames = { x: second.x, y: shown('deal-card-1').boundsOnScreen.y + 6 * second.unit };
  await page.mouse.click(offNames.x, offNames.y, { button: 'right' });
  await rested(page);
  const inspected = await readings(page, ['inspection', 'deal', 'deal-card-1', 'deal-lore']);
  expect(inspected('inspection').standing).toBe(false);
  expect(inspected('deal').standing).toBe(true);
  expect(inspected('deal-card-1').standing).toBe(true);
  expect(inspected('deal-lore').text).toBe(eventLore(LEAN_SEASON));

  const beside = await besideTheDeal(page);
  await page.mouse.click(beside.x, beside.y);
  await rested(page);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await take(page, ration);

  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(after);
  expect(enemiesOf(after).length).toBeGreaterThan(enemiesOf(dealt).length);

  expect(problems).toEqual([]);
});

test('a left click on an answer the city cannot pay for says why over it, takes and pays nothing, and the inspection key then shows nothing', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));
  const { dealt, answer } = unpaid();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const at = offered(CATALOGUE, deal).indexOf(answer);
  const said = refused(
    answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, deal.event, answer)),
    answerRefusal(CATALOGUE, dealt, deal.event, answer),
  );

  await openSaved(page, dealt);
  await restedOnDeal(page);

  await click(page, `deal-card-${at}`);
  await expect.poll(() => refusalLines(page)).toEqual(said);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  await page.keyboard.press('i');
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(false);

  expect(problems).toEqual([]);
});
