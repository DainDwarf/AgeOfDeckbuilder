import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { civilizationIn } from '../src/rules/campaign';
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
  onScreen,
  readNames,
  rested,
  standing,
  textOf,
  watch,
} from './chronicle-screen';

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

/**
 * The collection screen a bare boot's navbar opens, and the deck editing mode a press on the first
 * civilization's pile opens on it.
 */
async function openDeck(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  await click(page, 'navbar-collection');
  await expect.poll(() => standing(page, 'collection-mode')).toBe(true);
  await rested(page);
  await click(page, `collection-civilization-${CIVILIZATION}`);
  await expect.poll(() => standing(page, 'deck-editing-mode')).toBe(true);
  await rested(page);
}

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
    expect(
      await page.evaluate(
        (target) => window.named?.(target)?.object.getData('dimmed'),
        `collection-stack-${id}`,
      ),
    ).toBe(holds === copies);
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
  expect(await cursorOverCanvas(page)).toBe('pointer');
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
