import { expect, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { apply, outcome } from '../src/rules/chronicle';
import { answerCost, answerOf, answerRefusal, offered } from '../src/rules/schedule';
import { type Chronicle, playable } from '../src/rules/state';
import { eventLore } from '../src/ui/lore';
import { eventName, text } from '../src/ui/text';
import {
  besideTheDeal,
  budget,
  cardOnFace,
  chronicleOf,
  click,
  endedTurn,
  enemiesOf,
  firstEntriesTaken,
  firstSeed,
  loreOf,
  onScreen,
  openSaved,
  refusalLines,
  rested,
  ringed,
  settledOn,
  standing,
  take,
  titleOf,
  watch,
} from './chronicle-screen';

/** The event dealt as the choice, and the answer of it that enters warriors. */
const LEAN_SEASON = 'lean-season';
const RAID = 'ration';

/** The chronicle of the first seed whose first deal is the lean season alone, stopped on that deal. */
function leanSeason(): Chronicle {
  return firstSeed('deals the lean season alone first', (seed) => {
    let chronicle = settledOn(NOMADIC, seed);
    const due = chronicle.timeline.next;
    while (chronicle.turn < due - 1 && chronicle.ending === undefined) {
      chronicle = endedTurn(chronicle);
    }
    const dealt = outcome(apply(NOMADIC, chronicle, { type: 'end-turn' }));
    const [deal, ...behind] = dealt.deals;
    if (deal?.of !== 'event' || deal.event !== LEAN_SEASON || behind.length > 0) return undefined;
    return dealt;
  });
}

/**
 * The chronicle of the first seed and turn, inside forty turns, whose deal offers an answer the city
 * cannot pay for, stopped on that deal, and that answer.
 */
function unpaid(): { dealt: Chronicle; answer: string } {
  return firstSeed('deals an answer its city cannot pay for inside forty turns', (seed) => {
    let chronicle = settledOn(NOMADIC, seed);
    while (chronicle.turn < 40 && chronicle.ending === undefined) {
      const dealt = outcome(apply(NOMADIC, chronicle, { type: 'end-turn' }));
      const [deal] = dealt.deals;
      if (deal?.of === 'event') {
        const answer = offered(NOMADIC, deal).find(
          (id) => !playable(answerRefusal(NOMADIC, dealt, deal.event, id)),
        );
        if (answer !== undefined) return { dealt, answer };
      }
      chronicle = firstEntriesTaken(dealt);
    }
    return undefined;
  });
}

test('the events phase deals a choice, and the turn plays on from the one taken', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const dealt = leanSeason();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const answers = offered(NOMADIC, deal);
  const raid = answers.indexOf(RAID);
  const after = outcome(apply(NOMADIC, dealt, { type: 'take', at: raid }));

  await openSaved(page, dealt);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  expect(await titleOf(page, 'deal')).toBe(eventName(deal.event));
  expect(await loreOf(page, 'deal')).toBe(eventLore(deal.event));
  for (const [at, answer] of answers.entries()) {
    expect(await cardOnFace(page, `deal-card-${at}`)).toBe(answer);
  }

  const second = await onScreen(page, 'deal-card-1');
  await page.mouse.click(second.x, second.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(answers[1]);

  const beside = await besideTheDeal(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await loreOf(page, 'deal')).toBe(eventLore(deal.event));

  await click(page, 'deal-card-0');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await take(page, raid);

  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(after);
  expect(enemiesOf(after).length).toBeGreaterThan(enemiesOf(dealt).length);

  expect(problems).toEqual([]);
});

test('the take of an answer the city cannot pay for says why over the card, and takes and pays nothing', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(0));
  const { dealt, answer } = unpaid();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const at = offered(NOMADIC, deal).indexOf(answer);
  const refusal = answerRefusal(NOMADIC, dealt, deal.event, answer);
  const said = answerCost(NOMADIC, dealt, answerOf(NOMADIC, deal.event, answer))
    .filter(({ resource }) => refusal.unaffordable.includes(resource))
    .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount }));

  await openSaved(page, dealt);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);

  await click(page, `deal-card-${at}`);
  await expect.poll(() => ringed(page, `deal-card-${at}`)).toBe(true);
  await click(page, `deal-card-${at}`);

  await expect.poll(() => refusalLines(page)).toEqual(said);
  expect(await ringed(page, `deal-card-${at}`)).toBe(true);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  expect(problems).toEqual([]);
});
