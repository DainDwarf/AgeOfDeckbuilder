import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { answerOf, answerRefusal, offered } from '../src/rules/schedule';
import { costsOf, playable } from '../src/rules/state';
import { eventName, text } from '../src/ui/text';
import {
  budget,
  cardOnFace,
  chronicleOf,
  click,
  endedTurn,
  firstSeed,
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

/**
 * The first seed whose timeline's first deal stands alone and offers the raid first, with a camp
 * free for it to enter a warrior on — what the take lands is then a warrior standing on the map —
 * and the turn that deal is due on.
 */
function dealRun(): { seed: number; due: number } {
  return firstSeed('deals a raid first on its first deal', (seed) => {
    const opened = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    const due = opened.timeline.next;

    let chronicle = opened;
    for (let turn = 1; turn < due - 1; turn++) chronicle = endedTurn(chronicle);
    const dealt = outcome(apply(STAND_IN, chronicle, { type: 'end-turn' }));
    const [deal, ...behind] = dealt.deals;
    if (deal === undefined || behind.length > 0) return undefined;
    if (offered(STAND_IN, deal)[0] !== 'PH_Raid') return undefined;

    const landed = outcome(apply(STAND_IN, dealt, { type: 'take', at: 0 }));
    return landed.units.some((unit) => unit.faction === 'enemy') ? { seed, due } : undefined;
  });
}

/**
 * A point on the scrim beside the window's cards: at the left edge, clear of the frame they are laid
 * in and of the resource bar, which stands over the scrim while a deal waits to be taken.
 */
async function besideTheDeal(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + 8, y: rect.top + rect.height / 2 };
  });
}

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
  expect(after.units.some((unit) => unit.faction === 'enemy')).toBe(true);

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
  const said = costsOf(answerOf(STAND_IN, deal.event, 'PH_Tribute').cost)
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
