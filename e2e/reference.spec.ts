import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { addedToDrawPileTop, offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { answerShown } from '../src/ui/event-text';
import { cardFaceAtStart, namedCardFace } from '../src/ui/face';
import {
  besideTheDeal,
  browse,
  cardOnFace,
  chronicleOf,
  civilizationOpened,
  cursorOverCanvas,
  firstDealtAlone,
  launchedAs,
  liftedName,
  namedIn,
  nameOnScreen,
  onScreen,
  openSaved,
  pileStacks,
  readings,
  referenceOnFace,
  rested,
  restedOnDeal,
  selected,
  settledOn,
  shows,
  standing,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** The event the first spec opens on. */
const LEAN_SEASON = 'lean-season';

/** The cursor over something that reacts to a press. */
const HAND = 'pointer';

/** Longer than the hand-over a small card waits out before it goes down, so one going has gone. */
const PAST_HANDOVER = 400;

/**
 * The first answer the deal standing offers whose text names a card: the answer, where the deal
 * window lays it out, the card it names, and where that name stands among the text's names.
 */
function namingAnswer(dealt: Chronicle): {
  answer: string;
  at: number;
  named: string;
  name: number;
} {
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  for (const [at, answer] of offered(CATALOGUE, deal).entries()) {
    const names = namedIn(answerShown(CATALOGUE, dealt, deal.event, answer).text);
    const name = names.findIndex((reference) => reference.kind === 'card');
    if (name !== -1) return { answer, at, named: names[name].id, name };
  }
  throw new Error(`the ${deal.event} offers no answer naming a card`);
}

/**
 * Seed 1's turn 1, settled bare, the first card of the catalogue whose rules entry names a card added
 * to its draw pile's top: that chronicle, the card, the card it names, and where that name stands
 * among the entry's names.
 */
function namingInDrawPile(): { holding: Chronicle; naming: string; named: string; name: number } {
  const opened = settledOn(1);
  for (const naming of Object.keys(CATALOGUE.cards)) {
    const names = namedIn(cardFaceAtStart(CATALOGUE, naming, opened.citySection.building).rules);
    const name = names.findIndex((reference) => reference.kind === 'card');
    if (name === -1) continue;
    const holding = addedToDrawPileTop(CATALOGUE, opened, naming).chronicle;
    return { holding, naming, named: names[name].id, name };
  }
  throw new Error('no card of the catalogue names a card');
}

test('a card named in an answer’s text raises it small at a rest and shows it large at a right click on the name or on the small card', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = firstDealtAlone(LEAN_SEASON);
  const { answer, at, named, name: naming } = namingAnswer(dealt);
  const answering = `deal-card-${at}`;
  const { reading } = answerShown(CATALOGUE, dealt, LEAN_SEASON, answer);

  await openSaved(page, dealt);
  await restedOnDeal(page);
  expect(await cardOnFace(page, answering)).toBe(answer);

  const name = await nameOnScreen(page, answering, naming);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);
  const raised = await readings(page, ['small-card-0']);
  expect(raised('small-card-0').rules).toBe(namedCardFace(CATALOGUE, named, reading).rules);

  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(menu.x, menu.y);
  await waitGameClock(page, PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(false);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);

  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await waitGameClock(page, PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(true);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named);
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await waitGameClock(page, PAST_HANDOVER);
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

  expect(problems).toEqual([]);
});

test('a card named on a card shown large stands over it at a right click on the name', async ({
  page,
}) => {
  const problems = watch(page);
  const { holding, naming: host, named, name: naming } = namingInDrawPile();
  const at = pileStacks(holding.drawPile).findIndex(({ card }) => card.id === host);

  await openSaved(page, holding);
  await browse(page, 'draw-pile');
  await rested(page);

  const card = await onScreen(page, `browse-card-${at}`);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(host);
  await rested(page);

  const large = await onScreen(page, 'inspection');
  await page.mouse.move(large.x, large.y);
  await expect.poll(() => cursorOverCanvas(page)).not.toBe(HAND);
  const own = await nameOnScreen(page, 'inspection', naming);
  await page.mouse.move(own.x, own.y);
  await expect.poll(() => cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(own.x, own.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  expect(await cardOnFace(page, 'inspection-0')).toBe(host);
  await rested(page);

  // Measured on the faces: two different cards place their names differently.
  const top = await onScreen(page, 'inspection');
  const beneath = await onScreen(page, 'inspection-0');
  expect(beneath.x).toBeLessThan(top.x);
  expect(beneath.y).toBeLessThan(top.y);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection-0')).toBe(false);
  expect(await cardOnFace(page, 'inspection')).toBe(host);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'browse')).toBe(true);

  expect(problems).toEqual([]);
});

test('a building named on the settle card raises its card small at a rest and shows it large at a right click, alone or on top of the settle card shown large', async ({
  page,
}) => {
  const problems = watch(page);
  const { city: section } = civilizationOpened();
  const settle = section.card;
  const city = { kind: 'building', id: section.building };

  await openSaved(page, launchedAs(1));
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
  await waitGameClock(page, PAST_HANDOVER);
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
  expect(await selected(page, 0, card)).toBe(false);
  expect(await shows(page, 'settle-phase-chip')).toBe(true);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});
