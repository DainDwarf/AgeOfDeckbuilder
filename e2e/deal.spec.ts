import { expect, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { answerCost, answerOf, answerRefusal, offered } from '../src/rules/schedule';
import { playable } from '../src/rules/state';
import { eventName, text } from '../src/ui/text';
import {
  besideTheDeal,
  budget,
  cardOnFace,
  chronicleOf,
  click,
  dealRun,
  enemiesOf,
  launch,
  onScreen,
  open,
  refusalLines,
  ringed,
  standing,
  stoppedTurn,
  take,
  titleOf,
  watch,
} from './chronicle-screen';

test('the events phase deals a choice, and the turn plays on from the one taken', async ({
  page,
}) => {
  const problems = watch(page);
  const run = dealRun();
  // The turns ended up to the due one, and the take that plays the rest of it out.
  test.setTimeout(budget(run.due));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.due; turn++) await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  const dealt = await chronicleOf(page);
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${run.due} deals no event`);
  const answers = offered(STAND_IN, deal);
  expect(dealt.turn).toBe(run.due);
  expect(dealt.hand).toEqual([]);
  expect(await titleOf(page, 'deal')).toBe(eventName(deal.event));
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

  await click(page, 'deal-card-0');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await take(page, 0);

  const after = await chronicleOf(page);
  expect(await standing(page, 'deal')).toBe(false);
  expect(after.deals).toEqual([]);
  expect(after.turn).toBe(run.due);
  expect(after.timeline.next).toBeGreaterThan(run.due);
  expect(after.hand).toHaveLength(5);
  expect(enemiesOf(after).length).toBeGreaterThan(enemiesOf(dealt).length);

  expect(problems).toEqual([]);
});

/** The schedule whose one event deals an answer no city pays for by its first deal. */
const TOLL = 'PH_TollSchedule';

test('the take of an answer the city cannot pay for says why over the card, and takes and pays nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const seed = 1;
  const due = launch(seed, deckOf(STAND_IN, 'PH_Deck'), TOLL).timeline.next;
  test.setTimeout(budget(due));

  await open(page, seed, 'PH_Deck', TOLL);
  for (let turn = 1; turn < due; turn++) await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  const dealt = await chronicleOf(page);
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${due} deals no event`);
  const at = offered(STAND_IN, deal).indexOf('PH_Tribute');
  const refusal = answerRefusal(STAND_IN, dealt, deal.event, 'PH_Tribute');
  const said = answerCost(STAND_IN, dealt, answerOf(STAND_IN, deal.event, 'PH_Tribute'))
    .filter(({ resource }) => refusal.unaffordable.includes(resource))
    .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount }));
  expect(playable(refusal)).toBe(false);

  await click(page, `deal-card-${at}`);
  await expect.poll(() => ringed(page, `deal-card-${at}`)).toBe(true);
  await click(page, `deal-card-${at}`);

  await expect.poll(() => refusalLines(page)).toEqual(said);
  expect(await ringed(page, `deal-card-${at}`)).toBe(true);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  expect(problems).toEqual([]);
});
