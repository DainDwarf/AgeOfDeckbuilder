import { expect, type Page, test } from '@playwright/test';
import { NOMADIC } from '../src/content/nomadic';
import { deckOf } from '../src/rules/catalogue';
import { offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { answerFace } from '../src/ui/face';
import { referenceName } from '../src/ui/text';
import { layOutRun, type Reference } from '../src/ui/text-run';
import {
  besideTheDeal,
  capstoneClosed,
  cardOnFace,
  chronicleOf,
  cursorOverCanvas,
  firstsOf,
  leanSeason,
  nameOnScreen,
  onScreen,
  openNew,
  openSaved,
  referenceOnFace,
  rested,
  ringed,
  shows,
  standing,
  watch,
} from './chronicle-screen';

/** The cursor over something that answers a press. */
const HAND = 'pointer';

/** Longer than the hand-over a small card waits out before it goes down, so one going has gone. */
const PAST_HANDOVER = 400;

/** What a rules entry names, laid out as a run on a measure of one to the character. */
function namedIn(entry: string): Reference[] {
  const measure = (content: string): number => content.length;
  const metrics = { width: 24, glyph: 1, bearing: 0, space: 1 };
  return layOutRun(entry, measure, metrics, referenceName).names.map((name) => name.reference);
}

/**
 * The first answer the deal standing offers whose rules entry names a card: the answer, where the
 * deal window lays it, the card it names, and where that name stands among the entry's names.
 */
function namingAnswer(dealt: Chronicle): {
  answer: string;
  at: number;
  named: string;
  name: number;
} {
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  for (const [at, answer] of offered(NOMADIC, deal).entries()) {
    const names = namedIn(answerFace(NOMADIC, dealt, deal.event, answer).rules);
    const name = names.findIndex((reference) => reference.kind === 'card');
    if (name !== -1) return { answer, at, named: names[name].id, name };
  }
  throw new Error(`the ${deal.event} offers no answer naming a card`);
}

/**
 * The first name of the first card of the hand, read once the card has come to rest lifted under the
 * pointer: the lift carries the name up off where it lay.
 */
async function liftedName(
  page: Page,
  lying: { x: number; y: number },
): Promise<{ x: number; y: number }> {
  let name = lying;
  await expect
    .poll(async () => {
      const was = await nameOnScreen(page, 'hand-0');
      await rested(page);
      name = await nameOnScreen(page, 'hand-0');
      return name.y < lying.y && name.y === was.y;
    })
    .toBe(true);
  return name;
}

test('a card named on a card raises it small at a rest and shows it large at a right click on the name or on the small card, and one named on a card shown large stands over it', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = leanSeason();
  const { answer, at, named, name: naming } = namingAnswer(dealt);
  const answering = `deal-card-${at}`;

  await openSaved(page, dealt);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  expect(await cardOnFace(page, answering)).toBe(answer);

  const name = await nameOnScreen(page, answering, naming);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);

  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(menu.x, menu.y);
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(false);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);

  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(true);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(true);

  await page.mouse.click(small.x, small.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  expect(await standing(page, 'small-card-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  expect(await standing(page, 'inspection-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  const card = await onScreen(page, answering);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(answer);
  await rested(page);

  const large = await onScreen(page, 'inspection');
  await page.mouse.move(large.x, large.y);
  await expect.poll(() => cursorOverCanvas(page)).not.toBe(HAND);
  const own = await nameOnScreen(page, 'inspection', naming);
  await page.mouse.move(own.x, own.y);
  await expect.poll(() => cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(own.x, own.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  expect(await cardOnFace(page, 'inspection-0')).toBe(answer);
  await rested(page);

  // Measured on the faces: two different cards place their names differently.
  const top = await onScreen(page, 'inspection');
  const beneath = await onScreen(page, 'inspection-0');
  expect(beneath.x).toBeLessThan(top.x);
  expect(beneath.y).toBeLessThan(top.y);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection-0')).toBe(false);
  expect(await cardOnFace(page, 'inspection')).toBe(answer);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  expect(problems).toEqual([]);
});

test('a building named on the settle card raises its card small at a rest and shows it large at a right click, alone or on top of the settle card shown large', async ({
  page,
}) => {
  const problems = watch(page);
  const [settle] = deckOf(NOMADIC, firstsOf(NOMADIC).deck).settle;
  const city = { kind: 'building', id: NOMADIC.city.building };

  await openNew(page, NOMADIC, 1);
  await capstoneClosed(page);
  const opened = await chronicleOf(page);
  expect(opened.hand[0].id).toBe(settle);

  const card = await onScreen(page, 'hand-0');
  const lying = await nameOnScreen(page, 'hand-0');
  await page.mouse.move(card.x, card.y);
  const name = await liftedName(page, lying);
  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => referenceOnFace(page, 'small-card-0')).toEqual(city);
  expect(await cardOnFace(page, 'small-card-0')).toBeUndefined();

  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await referenceOnFace(page, 'small-card-0')).toEqual(city);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(menu.x, menu.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const again = await liftedName(page, lying);
  await page.mouse.click(again.x, again.y, { button: 'right' });
  await expect.poll(() => referenceOnFace(page, 'inspection')).toEqual(city);
  expect(await standing(page, 'inspection-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);

  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(settle);
  await rested(page);
  const named = await nameOnScreen(page, 'inspection');
  await page.mouse.move(named.x, named.y);
  await expect.poll(() => cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(named.x, named.y, { button: 'right' });
  await expect.poll(() => referenceOnFace(page, 'inspection')).toEqual(city);
  expect(await cardOnFace(page, 'inspection-0')).toBe(settle);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection-0')).toBe(false);
  expect(await cardOnFace(page, 'inspection')).toBe(settle);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'small-card-0')).toBe(false);
  expect(await ringed(page, 'hand-0')).toBe(false);
  expect(await shows(page, 'settle-phase-chip')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});
