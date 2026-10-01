import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { addedTo, type Campaign, civilizationIn, removedFrom } from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import type { CardId } from '../src/rules/state';
import { stacksOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import {
  cardOnFace,
  click,
  collectionOpened,
  cursorAt,
  cursorOverCanvas,
  heldSave,
  kindLabelOnScreen,
  nameOnScreen,
  onScreen,
  openCollection,
  pilePressed,
  pressed,
  type Reading,
  readings,
  readOrder,
  rested,
  saved,
  standing,
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

/** How far sideways a press held on a stack moves, in design units: past the drag slack, and then some. */
const SIDEWAYS = 40;

/** How many of the ids are this one. */
function idsCounted(ids: readonly CardId[], id: CardId): number {
  return ids.filter((held) => held === id).length;
}

/** A section's rows as the screen stands them: each card it holds once, in the collection's order. */
function rowsOf(ids: readonly CardId[]): { id: CardId; copies: number }[] {
  return STACKS.filter(({ id }) => ids.includes(id)).map(({ id }) => ({
    id,
    copies: idsCounted(ids, id),
  }));
}

/** The collection screen a bare boot's navbar opens, in the deck editing mode on its first civilization. */
async function openDeck(page: Page): Promise<void> {
  await openCollection(page);
  await pilePressed(page, CIVILIZATION);
}

/** The first card of the collection whose stack draws a name in its rules entry, off readings of every stack's face. */
function namingCard(seen: (name: string) => Reading): CardId {
  const found = STACKS.find(({ id }) => seen(`collection-card-${id}`).drawsName);
  if (found === undefined) throw new Error('no card of the collection draws a name');
  return found.id;
}

function stackOf(id: CardId): string {
  return `collection-stack-${id}`;
}

/**
 * The deck editing mode reads the campaign's first civilization as it stands: each section's count,
 * each card it holds a row reading its copies in its own section, no row for a card it does not hold,
 * each stack its copies held, dimmed where it holds them all; what it read, `also` with it, comes back.
 */
async function readsAs(
  page: Page,
  campaign: Campaign,
  also: readonly string[] = [],
): Promise<(name: string) => Reading> {
  const { settle, cards } = civilizationIn(CATALOGUE, campaign, CIVILIZATION);
  const rows = [
    ...rowsOf(settle).map((row) => ({ ...row, inSettle: true })),
    ...rowsOf(cards).map((row) => ({ ...row, inSettle: false })),
  ];
  const seen = await readings(page, [
    'deck-section-settle-count',
    'deck-section-cards-count',
    'deck-empty',
    'deck-section-cards',
    ...rows.map(({ id }) => `deck-row-${id}-copies`),
    ...STACKS.flatMap(({ id }) => [`deck-row-${id}`, `collection-card-${id}-copies`, stackOf(id)]),
    ...also,
  ]);
  expect(seen('deck-section-settle-count').text).toBe(
    text('collection.cards', { cards: settle.length + 1 }),
  );
  expect(seen('deck-section-cards-count').text).toBe(
    text('collection.cards', { cards: cards.length }),
  );
  expect(seen('deck-empty').standing).toBe(cards.length === 0);
  const cardsWord = seen('deck-section-cards').place.y;
  for (const { id, copies, inSettle } of rows) {
    expect(seen(`deck-row-${id}`).count).toBe(1);
    expect(seen(`deck-row-${id}-copies`).text).toBe(text('collection.row-copies', { copies }));
    expect(seen(`deck-row-${id}`).place.y < cardsWord).toBe(inSettle);
  }
  const held = [...settle, ...cards];
  for (const { id, copies } of STACKS) {
    const holds = idsCounted(held, id);
    if (holds === 0) expect(seen(`deck-row-${id}`).count).toBe(0);
    expect(seen(`collection-card-${id}-copies`).text).toBe(
      text('collection.in-deck', { held: holds, copies }),
    );
    expect(seen(stackOf(id)).dimmed).toBe(holds === copies);
  }
  return seen;
}

/** A press held on the named object and moved in steps to the point handed, a drawn frame after, not let go. */
async function heldTo(page: Page, name: string, to: { x: number; y: number }): Promise<void> {
  const from = await onScreen(page, name);
  await page.mouse.move(from.x, from.y);
  await rested(page);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 5 });
  await rested(page);
}

/** The first stack of the collection with a copy the first civilization's deck leaves free, or with none. */
function stackWith(campaign: Campaign, free: boolean): CardId {
  const { settle, cards } = civilizationIn(CATALOGUE, campaign, CIVILIZATION);
  const found = STACKS.find(
    ({ id, copies }) => idsCounted([...settle, ...cards], id) < copies === free,
  );
  if (found === undefined) throw new Error(`no stack has ${free ? 'a' : 'no'} copy free`);
  return found.id;
}

test('on the collection screen the pointer on a civilization’s pile is the hand', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);

  const pile = await onScreen(page, `collection-civilization-${CIVILIZATION}`);
  await page.mouse.move(pile.x, pile.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  expect(problems).toEqual([]);
});

test('a press on a civilization’s pile opens the deck editing mode on it: its name, its settle section under its count with the city section’s card at its head, its deck under its count, each card a row reading its copies in the collection’s order, and the collection four stacks to a line reading the copies the deck holds, dimmed where it holds them all', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);

  const rows = [...rowsOf(DECK.settle), ...rowsOf(DECK.cards)];
  const seen = await readings(page, [
    'collection-mode',
    `collection-civilization-${CIVILIZATION}`,
    'deck-civilization',
    'collection-to-collection-label',
    'collection-to-civilization-label',
    'deck-section-settle-count',
    'deck-section-cards-count',
    'deck-city-copies',
    'deck-empty',
    'deck-city',
    'deck-section-settle',
    'deck-section-cards',
    ...Object.keys(CATALOGUE.cards).map((id) => `deck-row-${id}`),
    ...rows.map(({ id }) => `deck-row-${id}-copies`),
    ...STACKS.flatMap(({ id }) => [
      `collection-card-${id}`,
      `collection-card-${id}-copies`,
      stackOf(id),
    ]),
  ]);

  expect(seen('collection-mode').standing).toBe(false);
  expect(seen(`collection-civilization-${CIVILIZATION}`).standing).toBe(false);
  expect(seen('deck-civilization').text).toBe(civilizationName(CIVILIZATION));
  expect(seen('collection-to-collection-label').text).toBe(text('collection.to-collection'));
  expect(seen('collection-to-civilization-label').text).toBe(text('collection.to-civilization'));

  expect(seen('deck-section-settle-count').text).toBe(
    text('collection.cards', { cards: DECK.settle.length + 1 }),
  );
  expect(seen('deck-section-cards-count').text).toBe(
    text('collection.cards', { cards: DECK.cards.length }),
  );
  expect(seen('deck-city').card).toBe(OWNED.city.card.id);
  expect(seen('deck-city-copies').standing).toBe(false);
  expect(seen('deck-empty').standing).toBe(false);

  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(seen(`deck-row-${id}`).count).toBe(rows.some((row) => row.id === id) ? 1 : 0);
  }
  const heights: number[] = [seen('deck-city').place.y];
  for (const { id, copies } of rows) {
    expect(seen(`deck-row-${id}`).card).toBe(id);
    expect(seen(`deck-row-${id}-copies`).text).toBe(text('collection.row-copies', { copies }));
    heights.push(seen(`deck-row-${id}`).place.y);
  }
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  const lastSettle = rowsOf(DECK.settle).length;
  const cardsWord = seen('deck-section-cards').place.y;
  expect(seen('deck-section-settle').place.y).toBeLessThan(heights[0]);
  expect(cardsWord).toBeGreaterThan(heights[lastSettle]);
  expect(cardsWord).toBeLessThan(heights[lastSettle + 1]);

  const held = [...DECK.settle, ...DECK.cards];
  const placed: { id: CardId; at: { x: number; y: number } }[] = [];
  for (const { id, copies } of STACKS) {
    const holds = idsCounted(held, id);
    expect(seen(`collection-card-${id}-copies`).text).toBe(
      text('collection.in-deck', { held: holds, copies }),
    );
    expect(seen(stackOf(id)).dimmed).toBe(holds === copies);
    placed.push({ id, at: seen(`collection-card-${id}`).place });
  }
  const read = readOrder(placed, ({ at }) => at);
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

test('in the deck editing mode « Civilization stands as a button, the hand over it, and Collection » returns to the collection mode', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);

  const onward = await onScreen(page, 'collection-to-civilization');
  await page.mouse.move(onward.x, onward.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await click(page, 'collection-to-collection');
  await expect.poll(() => standing(page, 'collection-mode')).toBe(true);
  await rested(page);
  const seen = await readings(page, [
    'deck-editing-mode',
    `collection-civilization-${CIVILIZATION}`,
    ...STACKS.map(({ id }) => `collection-card-${id}-copies`),
  ]);
  expect(seen('deck-editing-mode').standing).toBe(false);
  expect(seen(`collection-civilization-${CIVILIZATION}`).standing).toBe(true);
  for (const { id, copies } of STACKS) {
    expect(seen(`collection-card-${id}-copies`).text).toBe(text('collection.copies', { copies }));
  }

  expect(problems).toEqual([]);
});

test('in the collection mode the pointer on a stack is the hand over a name of its card and over its kind label, and the arrow over the rest of it', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);
  const seen = await readings(
    page,
    STACKS.map(({ id }) => `collection-card-${id}`),
  );
  const face = `collection-card-${namingCard(seen)}`;

  expect(await cursorAt(page, seen(face).onScreen)).toBe('');
  expect(await cursorAt(page, await kindLabelOnScreen(page, face))).toBe(HAND);
  expect(await cursorAt(page, await nameOnScreen(page, face))).toBe(HAND);

  expect(problems).toEqual([]);
});

test('in the deck editing mode the pointer is the hand over a row and the arrow over the city section’s row, and on a stack whose copies the deck all holds the hand over a name of its card and its kind label and the arrow over the rest of it', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);
  const [{ id }] = rowsOf(DECK.cards);
  const seen = await readings(page, [
    ...STACKS.flatMap((stack) => [`collection-card-${stack.id}`, stackOf(stack.id)]),
    `deck-row-${id}`,
  ]);
  const card = namingCard(seen);
  const face = `collection-card-${card}`;

  expect(seen(stackOf(card)).dimmed).toBe(true);

  expect(await cursorAt(page, seen(`deck-row-${id}`).onScreen)).toBe(HAND);
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
  const removed = await readsAs(page, campaign, [`collection-card-${many.id}`]);
  expect(await cursorAt(page, removed(`collection-card-${many.id}`).onScreen)).toBe(HAND);

  campaign = await pressed(page, `collection-card-${many.id}`, campaign, (held) =>
    addedTo(CATALOGUE, held, CIVILIZATION, many.id),
  );
  const added = await readsAs(page, campaign);
  expect(added(stackOf(many.id)).dimmed).toBe(true);
  expect(await cursorOverCanvas(page)).toBe('');

  let emptied: ((name: string) => Reading) | undefined;
  for (let copy = 0; copy < settle.copies; copy++) {
    campaign = await pressed(page, `deck-row-${settle.id}`, campaign, (held) =>
      removedFrom(CATALOGUE, held, CIVILIZATION, settle.id),
    );
    emptied = await readsAs(page, campaign);
  }
  expect(emptied?.(`deck-row-${settle.id}`).count).toBe(0);

  campaign = await pressed(page, `collection-card-${settle.id}`, campaign, (held) =>
    addedTo(CATALOGUE, held, CIVILIZATION, settle.id),
  );
  await readsAs(page, campaign);

  await page.reload();
  await collectionOpened(page);
  await pilePressed(page, CIVILIZATION);
  await readsAs(page, campaign);

  expect(problems).toEqual([]);
});

test('in the deck editing mode a stack with a copy free dragged onto the civilization’s side adds a copy and a row dragged onto the collection’s side removes one, each written to the save, a card let go on its own side slides back and changes nothing, and a stack whose copies the deck all holds carries nothing', async ({
  page,
}) => {
  const problems = watch(page);
  await openDeck(page);
  const sides = await readings(page, ['civilization-panel-frame', 'collection-panel-frame']);
  const civilizationSide = sides('civilization-panel-frame').onScreen;
  const collectionSide = sides('collection-panel-frame').onScreen;
  let campaign = CAMPAIGN;

  const [{ id: removing }] = rowsOf(DECK.cards);
  await heldTo(page, `deck-row-${removing}`, collectionSide);
  const rowCarried = await readings(page, ['carried-card', 'landing-edge']);
  expect(rowCarried('carried-card').card).toBe(removing);
  expect(rowCarried('landing-edge').shows).toBe(true);
  await page.mouse.up();
  campaign = removedFrom(CATALOGUE, campaign, CIVILIZATION, removing);
  await saved(page, campaign);
  const removed = await readsAs(page, campaign, ['carried-card']);
  expect(removed('carried-card').standing).toBe(false);

  const adding = stackWith(campaign, true);
  await heldTo(page, `collection-card-${adding}`, collectionSide);
  const stackHome = await readings(page, ['carried-card', 'landing-edge']);
  expect(stackHome('carried-card').card).toBe(adding);
  expect(stackHome('landing-edge').shows).toBe(false);
  await page.mouse.up();
  await expect.poll(() => standing(page, 'carried-card')).toBe(false);
  expect((await heldSave(page)).campaign).toEqual(campaign);
  await readsAs(page, campaign);

  await heldTo(page, `collection-card-${adding}`, civilizationSide);
  const stackCarried = await readings(page, ['carried-card', 'landing-edge']);
  expect(stackCarried('carried-card').card).toBe(adding);
  expect(stackCarried('landing-edge').shows).toBe(true);
  await page.mouse.up();
  campaign = addedTo(CATALOGUE, campaign, CIVILIZATION, adding);
  await saved(page, campaign);
  const whole = `collection-card-${stackWith(campaign, false)}`;
  const added = await readsAs(page, campaign, ['carried-card', whole]);
  expect(added('carried-card').standing).toBe(false);

  const at = added(whole).onScreen;
  await heldTo(page, whole, { x: at.x + SIDEWAYS * at.unit, y: at.y });
  expect(await standing(page, 'carried-card')).toBe(false);
  await page.mouse.up();
  await rested(page);
  expect((await heldSave(page)).campaign).toEqual(campaign);

  expect(problems).toEqual([]);
});
