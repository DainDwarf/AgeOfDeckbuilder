import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { addedTo, type Campaign, civilizationIn, removedFrom } from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import type { CardId } from '../src/rules/state';
import { stacksOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import {
  campaignShown,
  cardOnFace,
  click,
  counted,
  cursorOverCanvas,
  heldSave,
  kindLabelOnScreen,
  nameOnScreen,
  onScreen,
  readNames,
  rested,
  standing,
  textOf,
  watch,
} from './chronicle-screen';

/** The cursor over something that answers a left click or a rest. */
const HAND = 'pointer';

/** A new campaign, as the bare address with no save opens on. */
const CAMPAIGN = freshCampaign(CATALOGUE);

/** The civilization a new campaign owns first, and its sections by id, as a chronicle is launched on it. */
const [[CIVILIZATION, OWNED]] = Object.entries(CAMPAIGN.civilizations);
const DECK = civilizationIn(CATALOGUE, CAMPAIGN, CIVILIZATION);

/** The collection's stacks in the order the screen stands them in. */
const STACKS = stacksOf(CATALOGUE, CAMPAIGN.collection, cardName);

/** How many stacks a line holds in the deck editing mode. */
const ACROSS = 4;

/** How many of the ids are this one. */
function copiesIn(ids: readonly CardId[], id: CardId): number {
  return ids.filter((held) => held === id).length;
}

/** A section's rows as the screen stands them: each card it holds once, in the collection's order. */
function rowsOf(ids: readonly CardId[]): { id: CardId; copies: number }[] {
  return STACKS.filter(({ id }) => ids.includes(id)).map(({ id }) => ({
    id,
    copies: copiesIn(ids, id),
  }));
}

/** Where the named object stands in the design space: the point it is drawn about. */
function placeOf(page: Page, name: string): Promise<{ x: number; y: number }> {
  return page.evaluate((target) => {
    const found = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (found === undefined) throw new Error(`there is no ${target}`);
    const at = found.getWorldTransformMatrix();
    return { x: at.tx, y: at.ty };
  }, name);
}

/** The collection screen the navbar opens from the campaign screen a boot stands on. */
async function collectionOpened(page: Page): Promise<void> {
  await campaignShown(page);
  await click(page, 'navbar-collection');
  await expect.poll(() => standing(page, 'collection-mode')).toBe(true);
  await rested(page);
}

/** The collection screen a bare boot's navbar opens. */
async function openCollection(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await collectionOpened(page);
}

/** The deck editing mode a press on the first civilization's pile opens, and a drawn frame after it. */
async function pilePressed(page: Page): Promise<void> {
  await click(page, `collection-civilization-${CIVILIZATION}`);
  await expect.poll(() => standing(page, 'deck-editing-mode')).toBe(true);
  await rested(page);
}

/** The collection screen a bare boot's navbar opens, in the deck editing mode on its first civilization. */
async function openDeck(page: Page): Promise<void> {
  await openCollection(page);
  await pilePressed(page);
}

/** Whether the named face's rules entry draws a name. */
function drawsName(page: Page, face: string): Promise<boolean> {
  return page.evaluate((target) => {
    const root = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (root === undefined) throw new Error(`there is no ${target}`);
    return ((root.getData('names') as unknown[] | undefined) ?? []).length > 0;
  }, face);
}

/** The first card of the collection whose stack draws a name in its rules entry. */
async function namingCard(page: Page): Promise<CardId> {
  for (const { id } of STACKS) if (await drawsName(page, `collection-card-${id}`)) return id;
  throw new Error('no card of the collection draws a name');
}

/** The cursor the pointer shows moved to this point, a drawn frame after. */
async function cursorAt(page: Page, at: { x: number; y: number }): Promise<string> {
  await page.mouse.move(at.x, at.y);
  await rested(page);
  return cursorOverCanvas(page);
}

/** Whether the card's stack stands dimmed, and nothing where no stack of it stands. */
function dimmed(page: Page, id: CardId): Promise<boolean | undefined> {
  return page.evaluate(
    (target) => window.named?.(target)?.object.getData('dimmed') as boolean | undefined,
    `collection-stack-${id}`,
  );
}

/**
 * The deck editing mode reads the campaign's first civilization as it stands: each section's count,
 * each card it holds a row reading its copies in its own section, no row for a card it does not
 * hold, and each stack reading the copies it holds, dimmed where it holds them all.
 */
async function readsAs(page: Page, campaign: Campaign): Promise<void> {
  const { settle, cards } = civilizationIn(CATALOGUE, campaign, CIVILIZATION);
  expect(await textOf(page, 'deck-section-settle-count')).toBe(
    text('collection.cards', { cards: settle.length + 1 }),
  );
  expect(await textOf(page, 'deck-section-cards-count')).toBe(
    text('collection.cards', { cards: cards.length }),
  );
  expect(await standing(page, 'deck-empty')).toBe(cards.length === 0);
  const cardsWord = (await placeOf(page, 'deck-section-cards')).y;
  for (const [ids, inSettle] of [
    [settle, true],
    [cards, false],
  ] as const) {
    for (const { id, copies } of rowsOf(ids)) {
      expect(await counted(page, `deck-row-${id}`)).toBe(1);
      expect(await textOf(page, `deck-row-${id}-copies`)).toBe(
        text('collection.row-copies', { copies }),
      );
      expect((await placeOf(page, `deck-row-${id}`)).y < cardsWord).toBe(inSettle);
    }
  }
  const held = [...settle, ...cards];
  for (const { id, copies } of STACKS) {
    const holds = copiesIn(held, id);
    if (holds === 0) expect(await counted(page, `deck-row-${id}`)).toBe(0);
    expect(await textOf(page, `collection-card-${id}-copies`)).toBe(
      text('collection.in-deck', { held: holds, copies }),
    );
    expect(await dimmed(page, id)).toBe(holds === copies);
  }
}

/**
 * A left click on the named object, the save waited for until it holds the campaign `move` makes of
 * the one handed, and a drawn frame after: the campaign the save now holds.
 */
async function pressed(
  page: Page,
  name: string,
  campaign: Campaign,
  move: (campaign: Campaign) => Campaign,
): Promise<Campaign> {
  const moved = move(campaign);
  const at = await onScreen(page, name);
  await page.mouse.click(at.x, at.y);
  await expect
    .poll(async () => (await heldSave(page).catch(() => undefined))?.campaign)
    .toEqual(moved);
  await rested(page);
  return moved;
}

test('on the collection screen the pointer on a civilization’s pile is the hand, and holding still where its press opened the deck editing mode, it reads what came up there as a pointer brought there reads it', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);

  const pile = await onScreen(page, `collection-civilization-${CIVILIZATION}`);
  await page.mouse.move(pile.x, pile.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await pilePressed(page);
  const still = await cursorOverCanvas(page);
  await cursorAt(page, await onScreen(page, 'deck-civilization'));
  expect(await cursorAt(page, pile)).toBe(still);

  expect(problems).toEqual([]);
});

test('a press on a civilization’s pile opens the deck editing mode on it: its name, its settle section under its count with the city section’s card at its head, its deck under its count, each card a row reading its copies in the collection’s order, and the collection four stacks to a line reading the copies the deck holds, dimmed where it holds them all', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);

  expect(await standing(page, 'collection-mode')).toBe(false);
  expect(await standing(page, `collection-civilization-${CIVILIZATION}`)).toBe(false);
  expect(await textOf(page, 'deck-civilization')).toBe(civilizationName(CIVILIZATION));
  expect(await textOf(page, 'collection-to-collection-label')).toBe(
    text('collection.to-collection'),
  );
  expect(await textOf(page, 'collection-to-civilization-label')).toBe(
    text('collection.to-civilization'),
  );

  expect(await textOf(page, 'deck-section-settle-count')).toBe(
    text('collection.cards', { cards: DECK.settle.length + 1 }),
  );
  expect(await textOf(page, 'deck-section-cards-count')).toBe(
    text('collection.cards', { cards: DECK.cards.length }),
  );
  expect(await cardOnFace(page, 'deck-city')).toBe(OWNED.city.card.id);
  expect(await standing(page, 'deck-city-copies')).toBe(false);
  expect(await standing(page, 'deck-empty')).toBe(false);

  const rows = [...rowsOf(DECK.settle), ...rowsOf(DECK.cards)];
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(await counted(page, `deck-row-${id}`)).toBe(rows.some((row) => row.id === id) ? 1 : 0);
  }
  const heights: number[] = [(await placeOf(page, 'deck-city')).y];
  for (const { id, copies } of rows) {
    expect(await cardOnFace(page, `deck-row-${id}`)).toBe(id);
    expect(await textOf(page, `deck-row-${id}-copies`)).toBe(
      text('collection.row-copies', { copies }),
    );
    heights.push((await placeOf(page, `deck-row-${id}`)).y);
  }
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  const lastSettle = rowsOf(DECK.settle).length;
  const cardsWord = (await placeOf(page, 'deck-section-cards')).y;
  expect((await placeOf(page, 'deck-section-settle')).y).toBeLessThan(heights[0]);
  expect(cardsWord).toBeGreaterThan(heights[lastSettle]);
  expect(cardsWord).toBeLessThan(heights[lastSettle + 1]);

  const held = [...DECK.settle, ...DECK.cards];
  const placed: { id: CardId; at: { x: number; y: number } }[] = [];
  for (const { id, copies } of STACKS) {
    const holds = copiesIn(held, id);
    expect(await textOf(page, `collection-card-${id}-copies`)).toBe(
      text('collection.in-deck', { held: holds, copies }),
    );
    expect(await dimmed(page, id)).toBe(holds === copies);
    placed.push({ id, at: await placeOf(page, `collection-card-${id}`) });
  }
  const read = [...placed].sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x);
  expect(read.map(({ id }) => id)).toEqual(STACKS.map(({ id }) => id));
  const [first] = read;
  expect(read.filter(({ at }) => at.y === first.at.y)).toHaveLength(
    Math.min(ACROSS, STACKS.length),
  );

  expect(problems).toEqual([]);
});

test('in the deck editing mode a right click on a row shows its card large, the city section’s row among them, the back key takes it down and raises no menu, and with no card large the back key raises the menu', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);
  const [{ id }] = rowsOf(DECK.cards);

  for (const [row, card] of [
    ['deck-city', OWNED.city.card.id],
    [`deck-row-${id}`, id],
  ]) {
    const at = await onScreen(page, row);
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
  expect(await standing(page, 'deck-editing-mode')).toBe(true);

  expect(problems).toEqual([]);
});

test('in the deck editing mode « Civilization stands as a button, the hand over it, a press on it leaving the mode as it stands, and Collection » returns to the collection mode', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);

  const onward = await onScreen(page, 'collection-to-civilization');
  await page.mouse.move(onward.x, onward.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);
  await page.mouse.click(onward.x, onward.y);
  await rested(page);
  expect(await standing(page, 'deck-editing-mode')).toBe(true);

  await click(page, 'collection-to-collection');
  await expect.poll(() => standing(page, 'collection-mode')).toBe(true);
  await rested(page);
  expect(await standing(page, 'deck-editing-mode')).toBe(false);
  expect(await standing(page, `collection-civilization-${CIVILIZATION}`)).toBe(true);
  for (const { id, copies } of STACKS) {
    expect(await textOf(page, `collection-card-${id}-copies`)).toBe(
      text('collection.copies', { copies }),
    );
  }

  expect(problems).toEqual([]);
});

test('in the collection mode the pointer on a stack is the hand over a name of its card and over its kind label, and the arrow over the rest of it', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);
  const face = `collection-card-${await namingCard(page)}`;

  expect(await cursorAt(page, await onScreen(page, face))).toBe('');
  expect(await cursorAt(page, await kindLabelOnScreen(page, face))).toBe(HAND);
  expect(await cursorAt(page, await nameOnScreen(page, face))).toBe(HAND);

  expect(problems).toEqual([]);
});

test('in the deck editing mode the pointer is the hand over a row and the arrow over the city section’s row, and on a stack whose copies the deck all holds the hand over a name of its card and its kind label and the arrow over the rest of it', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);
  const card = await namingCard(page);
  const face = `collection-card-${card}`;
  const [{ id }] = rowsOf(DECK.cards);

  expect(await dimmed(page, card)).toBe(true);

  expect(await cursorAt(page, await onScreen(page, `deck-row-${id}`))).toBe(HAND);
  expect(await cursorAt(page, await onScreen(page, 'deck-city'))).toBe('');
  expect(await cursorAt(page, await onScreen(page, face))).toBe('');
  expect(await cursorAt(page, await kindLabelOnScreen(page, face))).toBe(HAND);
  expect(await cursorAt(page, await nameOnScreen(page, face))).toBe(HAND);

  expect(problems).toEqual([]);
});

test('in the deck editing mode a left click on a row removes a copy of its card and a left click on its stack adds one, a settle card in the settle section, each written to the save; a stack with a copy free is the hand and one the add leaves wholly held the arrow under a pointer holding still, the last copy removed takes its row away, and a reload reads the edit', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);
  const many = rowsOf(DECK.cards).find(({ copies }) => copies > 1);
  if (many === undefined) throw new Error('the first civilization holds no card twice');
  const [settle] = rowsOf(DECK.settle);
  let campaign = CAMPAIGN;

  campaign = await pressed(page, `deck-row-${many.id}`, campaign, (held) =>
    removedFrom(CATALOGUE, held, CIVILIZATION, many.id),
  );
  await readsAs(page, campaign);
  expect(await cursorAt(page, await onScreen(page, `collection-card-${many.id}`))).toBe(HAND);

  campaign = await pressed(page, `collection-card-${many.id}`, campaign, (held) =>
    addedTo(CATALOGUE, held, CIVILIZATION, many.id),
  );
  expect(await dimmed(page, many.id)).toBe(true);
  expect(await cursorOverCanvas(page)).toBe('');
  await readsAs(page, campaign);

  for (let copy = 0; copy < settle.copies; copy++) {
    campaign = await pressed(page, `deck-row-${settle.id}`, campaign, (held) =>
      removedFrom(CATALOGUE, held, CIVILIZATION, settle.id),
    );
    await readsAs(page, campaign);
  }
  expect(await counted(page, `deck-row-${settle.id}`)).toBe(0);

  campaign = await pressed(page, `collection-card-${settle.id}`, campaign, (held) =>
    addedTo(CATALOGUE, held, CIVILIZATION, settle.id),
  );
  await readsAs(page, campaign);

  await page.reload();
  await collectionOpened(page);
  await pilePressed(page);
  await readsAs(page, campaign);

  expect(problems).toEqual([]);
});
