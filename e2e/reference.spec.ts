import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { earningOf, technologyOf } from '../src/rules/catalogue';
import { buildingKind } from '../src/rules/map-kinds';
import { freshCampaign } from '../src/rules/save';
import { addedToDrawPileTop, offered } from '../src/rules/schedule';
import type { Chronicle } from '../src/rules/state';
import { artFrameOf } from '../src/ui/art-sheet';
import { answerShown } from '../src/ui/event-text';
import {
  bareTerrain,
  cardFaceAtStart,
  type Face,
  featureFace,
  frontWindowOf,
  improvementFace,
  namedCardFace,
  terrainFace,
} from '../src/ui/face';
import { achievementGoal, cardRules } from '../src/ui/text';
import { learnedWithNeeds } from '../tools/learned-with-needs';
import {
  besideTheDeal,
  browse,
  cardOnFace,
  chronicleOf,
  civilizationOpened,
  cursorOverCanvas,
  firstDealtAlone,
  firstSeed,
  givesRead,
  HUNT,
  idsOf,
  kindLabelOnScreen,
  launchedAs,
  liftedName,
  namedIn,
  nameOnScreen,
  onScreen,
  openCampaign,
  openSaved,
  pileStacks,
  type Reading,
  readings,
  rested,
  restedOnDeal,
  selected,
  settledOn,
  shows,
  standing,
  waitGameClock,
  watch,
  windowOnScreen,
} from './chronicle-screen';

/** The event the first spec opens on. */
const LEAN_SEASON = 'lean-season';

/** The technology whose goal names an improvement. */
const TANNING = 'tanning';

/** What a face shows that tells it from another: what it stands, its text, its row, and its picture. */
type FaceRead = { card: string | undefined; rules: string; numbers: string[]; art: string };

/** What the face drawn on the page shows, as `FaceRead` reads it. */
function faceSeen({ card, rules, numbers, art }: Reading): FaceRead {
  return { card, rules, numbers: [...numbers], art };
}

/**
 * What the face shows, as `FaceRead` reads it, where its row of what its thing gives stands over its
 * text: the sign and one glyph to each point, nothing where it gives none.
 */
function faceRead(face: Face): FaceRead {
  if (face.art === undefined) throw new Error(`the face of ${face.id} holds no picture`);
  return {
    card: face.id,
    rules: face.rules,
    numbers: givesRead(face),
    art: artFrameOf(face.art, frontWindowOf(face.front)),
  };
}

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

  const card = await windowOnScreen(page, `browse-card-${at}`);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(host);
  await rested(page);

  const large = await windowOnScreen(page, 'inspection');
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

test('a terrain marked on the settle card raises its own face small at a rest and shows it large at a right click, alone or on top of the settle card shown large', async ({
  page,
}) => {
  const problems = watch(page);
  const { city: section } = civilizationOpened();
  const settle = section.card;
  const marked = buildingKind(CATALOGUE, section.building).terrains[0];
  const face = faceRead(terrainFace(bareTerrain(CATALOGUE, marked)));

  await openSaved(page, launchedAs(1));
  const opened = await chronicleOf(page);
  expect(opened.hand[0].id).toBe(settle);

  const card = await onScreen(page, 'hand-0');
  const lying = await nameOnScreen(page, 'hand-0');
  await page.mouse.move(card.x, card.y);
  const name = await liftedName(page, lying);
  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(marked);
  expect(faceSeen((await readings(page, ['small-card-0']))('small-card-0'))).toEqual(face);

  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await waitGameClock(page, PAST_HANDOVER);
  expect(await cardOnFace(page, 'small-card-0')).toBe(marked);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const menu = await onScreen(page, 'menu-button');
  await page.mouse.move(menu.x, menu.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.move(card.x, card.y, { steps: 5 });
  const again = await liftedName(page, lying);
  await page.mouse.click(again.x, again.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(marked);
  expect(faceSeen((await readings(page, ['inspection']))('inspection'))).toEqual(face);
  expect(await standing(page, 'inspection-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);

  // A mark may stand on the card's middle: the card is right-clicked on its kind label, a name nowhere.
  const lifted = await kindLabelOnScreen(page, 'hand-0');
  await page.mouse.move(lifted.x, lifted.y, { steps: 5 });
  await page.mouse.click(lifted.x, lifted.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(settle);
  await rested(page);
  const named = await nameOnScreen(page, 'inspection');
  await page.mouse.move(named.x, named.y);
  await expect.poll(() => cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(named.x, named.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(marked);
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

test('a feature named on a card of the hand raises its own face small at a rest', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, index } = firstSeed('opens turn 1 with a hunt in hand', (seed) => {
    const opened = settledOn(seed);
    const at = idsOf(opened.hand).indexOf(HUNT);
    return at === -1 ? undefined : { chronicle: opened, index: at };
  });
  const hand = `hand-${index}`;
  const [named] = namedIn(cardRules(chronicle.hand[index]));
  if (named?.kind !== 'feature') throw new Error(`${HUNT} names no feature first`);

  await openSaved(page, chronicle);
  const card = await onScreen(page, hand);
  const lying = await nameOnScreen(page, hand);
  await page.mouse.move(card.x, card.y);
  const name = await liftedName(page, lying, hand);
  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named.id);
  expect(faceSeen((await readings(page, ['small-card-0']))('small-card-0'))).toEqual(
    faceRead(featureFace(CATALOGUE, named.id)),
  );

  expect(problems).toEqual([]);
});

test('an improvement named in a technology’s goal raises the face of the card whose play places it small at a rest', async ({
  page,
}) => {
  const problems = watch(page);
  const { needs } = technologyOf(CATALOGUE, TANNING);
  const campaign = learnedWithNeeds(CATALOGUE, freshCampaign(CATALOGUE), needs);
  const { id, achievement } = earningOf(CATALOGUE, TANNING);
  const [named] = namedIn(achievementGoal(id, achievement.need));
  if (named?.kind !== 'improvement')
    throw new Error(`${TANNING}'s goal names no improvement first`);
  const { card, art } = faceRead(improvementFace(CATALOGUE, named.id));

  await openCampaign(page, campaign);
  const name = await nameOnScreen(page, `plate-${TANNING}`);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(card);
  expect((await readings(page, ['small-card-0']))('small-card-0').art).toBe(art);

  expect(problems).toEqual([]);
});
