import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import {
  addedTo,
  bought,
  type Campaign,
  civilizationIn,
  priceOf,
  removedFrom,
  unaffordableIn,
} from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import type { CardId } from '../src/rules/state';
import { deckRowsOf } from '../src/ui/collection-layout';
import { LOOK } from '../src/ui/look';
import { cardName, civilizationName, text } from '../src/ui/text';
import {
  cardOnFace,
  click,
  counted,
  cursorAt,
  fillOf,
  heldSave,
  kindLabelOnScreen,
  onScreen,
  openCollection,
  pilePressed,
  plantCampaign,
  pressed,
  readings,
  readOrder,
  rested,
  stackDimmed,
  standing,
  textOf,
  watch,
  wonCampaign,
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

/** How many copies of the card the campaign's collection owns. */
function ownedIn(campaign: Campaign, card: CardId): number {
  return campaign.collection.filter(({ id }) => id === card).length;
}

/**
 * The first civilization's cards on the campaign whose stacks stand on the first line of a section,
 * the city section's card first on the settle section's: those the panel at its top shows whole.
 */
function firstLines(campaign: Campaign): { id: CardId; copies: number }[] {
  const { settle, cards } = deckRowsOf(CATALOGUE, campaign, CIVILIZATION, cardName);
  return [
    ...settle.slice(0, ACROSS - 1),
    ...(settle.length < ACROSS ? cards.slice(0, ACROSS) : []),
  ];
}

/** A card of the rows whose copies the campaign's first civilization holds every one of, where one does. */
function whollyHeld(
  campaign: Campaign,
  rows: readonly { id: CardId; copies: number }[],
  such: (card: CardId) => boolean,
): { id: CardId; copies: number } | undefined {
  return rows.find(({ id, copies }) => copies === ownedIn(campaign, id) && such(id));
}

/** In deck editing on the first civilization, « Civilization pressed, and a drawn frame after. */
async function civilizationPressed(page: Page): Promise<void> {
  await click(page, 'collection-to-civilization');
  await expect.poll(() => standing(page, 'civilization-mode')).toBe(true);
  await rested(page);
}

/** The campaign's collection screen, in the civilization mode « Civilization opens on its first civilization. */
async function openCivilization(page: Page, campaign: Campaign = PLANTED.campaign): Promise<void> {
  await plantCampaign(page, campaign);
  await openCollection(page);
  await pilePressed(page, CIVILIZATION);
  await civilizationPressed(page);
}

test('in the deck editing mode « Civilization opens the civilization mode on its civilization: the name over the room, neither the collection nor the rows standing, each section’s count beside its word, the city section’s card at the head of the settle section, each card the deck holds a stack reading its copies held over owned in the collection’s order, seven to a line, and a card it holds no copy of not standing', async ({
  page,
}) => {
  const problems = watch(page);
  await openCivilization(page);

  const absent = ['deck-editing-mode', 'collection-panel', 'civilization-panel'];
  const { settle, cards } = civilizationIn(CATALOGUE, PLANTED.campaign, CIVILIZATION);
  const sections = [
    ['civilization-section-settle', settle.length + 1],
    ['civilization-section-cards', cards.length],
  ] as const;
  const rows = [...ROWS.settle, ...ROWS.cards];
  const settleFaces = [
    'civilization-city',
    ...ROWS.settle.map(({ id }) => `civilization-card-${id}`),
  ];
  const deckFaces = ROWS.cards.map(({ id }) => `civilization-card-${id}`);
  const seen = await readings(page, [
    'civilization-title',
    'collection-to-deck-editing-label',
    ...absent,
    ...sections.flatMap(([section]) => [section, `${section}-count`]),
    'civilization-city',
    `civilization-card-${PLANTED.gone}`,
    ...rows.flatMap(({ id }) => [`civilization-card-${id}`, `civilization-card-${id}-copies`]),
  ]);

  expect(seen('civilization-title').text).toBe(
    text('collection.civilization-title', { civilization: civilizationName(CIVILIZATION) }),
  );
  expect(seen('collection-to-deck-editing-label').text).toBe(text('collection.to-collection'));
  for (const gone of absent) {
    expect(seen(gone).standing).toBe(false);
  }

  for (const [section, count] of sections) {
    expect(seen(`${section}-count`).text).toBe(text('collection.cards', { cards: count }));
    const word = seen(section).place;
    const beside = seen(`${section}-count`).place;
    expect(beside.y).toBe(word.y);
    expect(beside.x).toBeGreaterThan(word.x);
  }

  expect(seen('civilization-city').card).toBe(OWNED.city.card.id);
  expect(seen(`civilization-card-${PLANTED.gone}`).count).toBe(0);
  const fewer = ROWS.cards.find(({ id }) => id === PLANTED.fewer);
  expect(fewer?.copies).toBeLessThan(ownedIn(PLANTED.campaign, PLANTED.fewer));

  for (const { id, copies } of rows) {
    const face = `civilization-card-${id}`;
    expect(seen(face).count).toBe(1);
    expect(seen(face).card).toBe(id);
    expect(seen(`${face}-copies`).text).toBe(
      text('collection.held-of-owned', { held: copies, copies: ownedIn(PLANTED.campaign, id) }),
    );
  }

  for (const faces of [settleFaces, deckFaces]) {
    expect(readOrder(faces, (face) => seen(face).place)).toEqual(faces);
    const firstLine = seen(faces[0]).place.y;
    let inLine = 0;
    for (const face of faces) if (seen(face).place.y === firstLine) inLine++;
    expect(inLine).toBe(Math.min(ACROSS, faces.length));
  }

  const settleWord = seen('civilization-section-settle').place.y;
  const deckWord = seen('civilization-section-cards').place.y;
  for (const face of settleFaces) {
    const { y } = seen(face).place;
    expect(y).toBeGreaterThan(settleWord);
    expect(y).toBeLessThan(deckWord);
  }
  for (const face of deckFaces) expect(seen(face).place.y).toBeGreaterThan(deckWord);

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
  const seen = await readings(
    page,
    ROWS.cards.map(({ id }) => `deck-row-${id}-copies`),
  );
  for (const { id, copies } of ROWS.cards) {
    expect(seen(`deck-row-${id}-copies`).text).toBe(text('collection.row-copies', { copies }));
  }

  expect(problems).toEqual([]);
});

test('in the civilization mode each stack’s reading stands centred between its buttons, − under a stack removes a copy, the reading, the section’s count and the save following, the last copy removed leaves the stack dimmed reading none over owned, − greyed, no hand and answering no press, + adds a copy back, undimmed, and a card at no copy stands no more once the mode is left and opened again', async ({
  page,
}) => {
  const problems = watch(page);
  const shown = firstLines(PLANTED.campaign);
  const whole = whollyHeld(PLANTED.campaign, shown, (id) =>
    ROWS.cards.some((row) => row.id === id),
  );
  if (whole === undefined) throw new Error('the planted deck’s first line holds no card wholly');
  const { id } = whole;
  const owned = ownedIn(PLANTED.campaign, id);
  const face = `civilization-card-${id}`;
  const cardsCount = (campaign: Campaign): string =>
    text('collection.cards', {
      cards: civilizationIn(CATALOGUE, campaign, CIVILIZATION).cards.length,
    });
  await openCivilization(page);

  const buttons = shown.map(({ id: card, copies }) => {
    const stack = `civilization-card-${card}`;
    const more = copies < ownedIn(PLANTED.campaign, card) ? `${stack}-add` : `${stack}-buy`;
    return { reading: `${stack}-copies`, less: `${stack}-remove`, more };
  });
  const seen = await readings(
    page,
    buttons.flatMap(({ reading, less, more }) => [reading, less, more]),
  );
  for (const { reading, less, more } of buttons) {
    const left = seen(less).across;
    const right = seen(more).across;
    expect(seen(reading).across.middle).toBeCloseTo((left.right + right.left) / 2, 0);
  }

  let campaign = PLANTED.campaign;
  for (let held = whole.copies - 1; held >= 0; held--) {
    campaign = await pressed(page, `${face}-remove`, campaign, (from) =>
      removedFrom(CATALOGUE, from, CIVILIZATION, id),
    );
    expect(await textOf(page, `${face}-copies`)).toBe(
      text('collection.held-of-owned', { held, copies: owned }),
    );
    expect(await textOf(page, 'civilization-section-cards-count')).toBe(cardsCount(campaign));
    expect(await counted(page, face)).toBe(1);
  }
  expect(await stackDimmed(page, `civilization-stack-${id}`)).toBe(true);
  expect(await fillOf(page, `${face}-remove`)).toBe(LOOK.greyedFill);
  expect(await fillOf(page, `${face}-add`)).toBe(LOOK.panelFill);
  expect(await cursorAt(page, await onScreen(page, `${face}-remove`))).toBe('');
  expect(await cursorAt(page, await onScreen(page, `${face}-add`))).toBe(HAND);

  await click(page, `${face}-remove`);
  await rested(page);
  expect((await heldSave(page)).campaign).toEqual(campaign);

  campaign = await pressed(page, `${face}-add`, campaign, (from) =>
    addedTo(CATALOGUE, from, CIVILIZATION, id),
  );
  expect(await textOf(page, `${face}-copies`)).toBe(
    text('collection.held-of-owned', { held: 1, copies: owned }),
  );
  expect(await textOf(page, 'civilization-section-cards-count')).toBe(cardsCount(campaign));
  expect(await stackDimmed(page, `civilization-stack-${id}`)).toBe(false);
  expect(await fillOf(page, `${face}-remove`)).toBe(LOOK.panelFill);

  campaign = await pressed(page, `${face}-remove`, campaign, (from) =>
    removedFrom(CATALOGUE, from, CIVILIZATION, id),
  );
  expect(await stackDimmed(page, `civilization-stack-${id}`)).toBe(true);
  await click(page, 'collection-to-deck-editing');
  await expect.poll(() => standing(page, 'deck-editing-mode')).toBe(true);
  await rested(page);
  await civilizationPressed(page);
  expect(await counted(page, face)).toBe(0);
  expect((await heldSave(page)).campaign).toEqual(campaign);

  expect(problems).toEqual([]);
});

test('in the civilization mode, on a campaign a won chronicle paid into, under a stack whose copies the deck all holds the right button reads the card’s price, and a press on it buys a copy and adds it: the bar, the reading, the doubled price and the save following at once; the price of an unaffordable card stands greyed, no hand, and a press on it changes nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const card = whollyHeld(
    campaign,
    firstLines(campaign),
    (id) => !unaffordableIn(CATALOGUE, campaign, id),
  );
  if (card === undefined) {
    throw new Error('the won campaign’s first lines hold no affordable card the deck wholly holds');
  }
  const price = priceOf(CATALOGUE, campaign, card.id);
  const after = addedTo(CATALOGUE, bought(CATALOGUE, campaign, card.id), CIVILIZATION, card.id);
  const greyed = whollyHeld(after, firstLines(after), (id) => unaffordableIn(CATALOGUE, after, id));
  if (greyed === undefined) {
    throw new Error(
      'the won campaign’s first lines hold no unaffordable card the deck wholly holds',
    );
  }
  const face = `civilization-card-${card.id}`;

  await openCivilization(page, campaign);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(campaign.influence));
  expect(await textOf(page, `${face}-price`)).toBe(text('collection.price', { price }));
  expect(await fillOf(page, `${face}-buy`)).toBe(LOOK.panelFill);
  expect(await cursorAt(page, await onScreen(page, `${face}-buy`))).toBe(HAND);

  await pressed(page, `${face}-buy`, campaign, () => after);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(campaign.influence - price));
  expect(await textOf(page, `${face}-copies`)).toBe(
    text('collection.held-of-owned', {
      held: card.copies + 1,
      copies: ownedIn(campaign, card.id) + 1,
    }),
  );
  expect(await textOf(page, `${face}-price`)).toBe(
    text('collection.price', { price: priceOf(CATALOGUE, after, card.id) }),
  );

  const unaffordable = `civilization-card-${greyed.id}-buy`;
  expect(await fillOf(page, unaffordable)).toBe(LOOK.greyedFill);
  expect(await cursorAt(page, await onScreen(page, unaffordable))).toBe('');
  await click(page, unaffordable);
  await rested(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(after.influence));
  expect((await heldSave(page)).campaign).toEqual(after);

  expect(problems).toEqual([]);
});
