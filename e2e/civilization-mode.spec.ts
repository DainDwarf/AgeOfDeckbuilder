import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { type Campaign, civilizationIn, removedFrom } from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import type { CardId } from '../src/rules/state';
import { deckRowsOf, stacksOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import {
  cardOnFace,
  click,
  counted,
  cursorAt,
  heldSave,
  kindLabelOnScreen,
  onScreen,
  openCollection,
  pilePressed,
  placeOf,
  plantCampaign,
  rested,
  standing,
  textOf,
  watch,
} from './chronicle-screen';

/** The cursor over something that answers a left click or a rest. */
const HAND = 'pointer';

/** How many stacks a line holds in the civilization mode. */
const ACROSS = 7;

/** How far sideways a press held on a stack moves, in design units: past the drag slack, and then some. */
const SIDEWAYS = 40;

/** A new campaign, and the civilization it owns first. */
const CAMPAIGN = freshCampaign(CATALOGUE);
const [[CIVILIZATION]] = Object.entries(CAMPAIGN.civilizations);

/**
 * The new campaign with one copy of a card its first civilization holds twice removed from the deck,
 * and every copy of another card, as a press on their rows removes them: the campaign, and the two cards.
 */
function plantedCampaign(): { campaign: Campaign; fewer: CardId; gone: CardId } {
  const { cards } = deckRowsOf(CATALOGUE, CAMPAIGN, CIVILIZATION, cardName);
  const fewer = cards.find(({ copies }) => copies > 1);
  const gone = cards.find(({ id }) => id !== fewer?.id);
  if (fewer === undefined || gone === undefined) {
    throw new Error('the first civilization holds no card twice beside another card');
  }
  let campaign = removedFrom(CATALOGUE, CAMPAIGN, CIVILIZATION, fewer.id);
  for (let copy = 0; copy < gone.copies; copy++) {
    campaign = removedFrom(CATALOGUE, campaign, CIVILIZATION, gone.id);
  }
  return { campaign, fewer: fewer.id, gone: gone.id };
}

const PLANTED = plantedCampaign();
const OWNED = PLANTED.campaign.civilizations[CIVILIZATION];
const ROWS = deckRowsOf(CATALOGUE, PLANTED.campaign, CIVILIZATION, cardName);

/** How many copies of the card the planted campaign's collection owns. */
function ownedOf(card: CardId): number {
  const found = stacksOf(CATALOGUE, PLANTED.campaign.collection, cardName).find(
    ({ id }) => id === card,
  );
  if (found === undefined) throw new Error(`the collection owns no copy of ${card}`);
  return found.copies;
}

/** The planted campaign's collection screen, in the civilization mode « Civilization opens on its first civilization. */
async function openCivilization(page: Page): Promise<void> {
  await plantCampaign(page, PLANTED.campaign);
  await openCollection(page);
  await pilePressed(page, CIVILIZATION);
  await click(page, 'collection-to-civilization');
  await expect.poll(() => standing(page, 'civilization-mode')).toBe(true);
  await rested(page);
}

/** The named faces read top down, each line left to right. */
async function readOrder(page: Page, names: readonly string[]): Promise<string[]> {
  const placed: { name: string; at: { x: number; y: number } }[] = [];
  for (const name of names) placed.push({ name, at: await placeOf(page, name) });
  return placed.sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x).map(({ name }) => name);
}

test('in the deck editing mode « Civilization opens the civilization mode on its civilization: the name over the room, neither the collection nor the rows standing, each section’s count beside its word, the city section’s card at the head of the settle section, each card the deck holds a stack reading its copies held over owned in the collection’s order, seven to a line, no button under any, and a card it holds no copy of not standing', async ({
  page,
}) => {
  const problems = watch(page);
  await openCivilization(page);

  expect(await textOf(page, 'civilization-title')).toBe(
    text('collection.civilization-title', { civilization: civilizationName(CIVILIZATION) }),
  );
  expect(await textOf(page, 'collection-to-deck-editing-label')).toBe(
    text('collection.to-collection'),
  );
  for (const gone of ['deck-editing-mode', 'collection-panel', 'civilization-panel']) {
    expect(await standing(page, gone)).toBe(false);
  }

  const { settle, cards } = civilizationIn(CATALOGUE, PLANTED.campaign, CIVILIZATION);
  for (const [section, count] of [
    ['civilization-section-settle', settle.length + 1],
    ['civilization-section-cards', cards.length],
  ] as const) {
    expect(await textOf(page, `${section}-count`)).toBe(text('collection.cards', { cards: count }));
    const word = await placeOf(page, section);
    const beside = await placeOf(page, `${section}-count`);
    expect(beside.y).toBe(word.y);
    expect(beside.x).toBeGreaterThan(word.x);
  }

  expect(await cardOnFace(page, 'civilization-city')).toBe(OWNED.city.card.id);
  expect(await counted(page, `civilization-card-${PLANTED.gone}`)).toBe(0);
  const fewer = ROWS.cards.find(({ id }) => id === PLANTED.fewer);
  expect(fewer?.copies).toBeLessThan(ownedOf(PLANTED.fewer));

  for (const { id, copies } of [...ROWS.settle, ...ROWS.cards]) {
    const face = `civilization-card-${id}`;
    expect(await counted(page, face)).toBe(1);
    expect(await cardOnFace(page, face)).toBe(id);
    expect(await textOf(page, `${face}-copies`)).toBe(
      text('collection.in-deck', { held: copies, copies: ownedOf(id) }),
    );
    expect(await standing(page, `${face}-buy`)).toBe(false);
  }

  const settleFaces = [
    'civilization-city',
    ...ROWS.settle.map(({ id }) => `civilization-card-${id}`),
  ];
  const deckFaces = ROWS.cards.map(({ id }) => `civilization-card-${id}`);
  for (const faces of [settleFaces, deckFaces]) {
    expect(await readOrder(page, faces)).toEqual(faces);
    const firstLine = (await placeOf(page, faces[0])).y;
    let inLine = 0;
    for (const face of faces) if ((await placeOf(page, face)).y === firstLine) inLine++;
    expect(inLine).toBe(Math.min(ACROSS, faces.length));
  }

  const settleWord = (await placeOf(page, 'civilization-section-settle')).y;
  const deckWord = (await placeOf(page, 'civilization-section-cards')).y;
  for (const face of settleFaces) {
    const { y } = await placeOf(page, face);
    expect(y).toBeGreaterThan(settleWord);
    expect(y).toBeLessThan(deckWord);
  }
  for (const face of deckFaces) expect((await placeOf(page, face)).y).toBeGreaterThan(deckWord);

  expect(problems).toEqual([]);
});

test('in the civilization mode a right click on a stack or on the city section’s card shows its card large, the back key takes it down and raises no menu, and with no card large the back key raises the menu, the mode standing', async ({
  page,
}) => {
  const problems = watch(page);
  await openCivilization(page);
  const [{ id }] = ROWS.cards;

  for (const [face, card] of [
    ['civilization-city', OWNED.city.card.id],
    [`civilization-card-${id}`, id],
  ]) {
    const at = await onScreen(page, face);
    await page.mouse.click(at.x, at.y, { button: 'right' });
    await expect.poll(() => cardOnFace(page, 'inspection')).toBe(card);
    await rested(page);
    await page.keyboard.press('Escape');
    await expect.poll(() => standing(page, 'inspection')).toBe(false);
    await rested(page);
    expect(await standing(page, 'menu')).toBe(false);
  }

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  expect(await standing(page, 'civilization-mode')).toBe(true);

  expect(problems).toEqual([]);
});

test('in the civilization mode the pointer is the hand over Collection » and over a stack’s kind label and the arrow over its art, and a left click on a stack or a press held on it and moved sideways changes nothing of the save and carries nothing', async ({
  page,
}) => {
  const problems = watch(page);
  await openCivilization(page);
  const [{ id }] = ROWS.cards;
  const face = `civilization-card-${id}`;

  expect(await cursorAt(page, await onScreen(page, 'collection-to-deck-editing'))).toBe(HAND);
  expect(await cursorAt(page, await kindLabelOnScreen(page, face))).toBe(HAND);
  expect(await cursorAt(page, await onScreen(page, 'civilization-city'))).toBe('');
  const at = await onScreen(page, face);
  expect(await cursorAt(page, at)).toBe('');

  await page.mouse.click(at.x, at.y);
  await rested(page);
  expect((await heldSave(page)).campaign).toEqual(PLANTED.campaign);
  expect(await standing(page, 'civilization-mode')).toBe(true);

  await page.mouse.down();
  await page.mouse.move(at.x + (SIDEWAYS / 2) * at.unit, at.y, { steps: 5 });
  await page.mouse.move(at.x + SIDEWAYS * at.unit, at.y, { steps: 5 });
  await rested(page);
  expect(await standing(page, 'carried-card')).toBe(false);
  await page.mouse.up();
  await rested(page);
  expect((await heldSave(page)).campaign).toEqual(PLANTED.campaign);

  expect(problems).toEqual([]);
});

test('in the civilization mode Collection » returns to the deck editing mode on the same civilization', async ({
  page,
}) => {
  const problems = watch(page);
  await openCivilization(page);

  await click(page, 'collection-to-deck-editing');
  await expect.poll(() => standing(page, 'deck-editing-mode')).toBe(true);
  await rested(page);
  expect(await standing(page, 'civilization-mode')).toBe(false);
  expect(await textOf(page, 'deck-civilization')).toBe(civilizationName(CIVILIZATION));
  for (const { id, copies } of ROWS.cards) {
    expect(await textOf(page, `deck-row-${id}-copies`)).toBe(
      text('collection.row-copies', { copies }),
    );
  }

  expect(problems).toEqual([]);
});
