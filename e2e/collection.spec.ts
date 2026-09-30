import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { bought, priceOf, unaffordableIn } from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import { browseOf, stacksOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import {
  cardOnFace,
  counted,
  cursorOverCanvas,
  heldSave,
  onScreen,
  openCollection,
  placeOf,
  plantCampaign,
  rested,
  standing,
  textOf,
  titleOf,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The browse a right click on a pile raises. */
const BROWSE = 'civilization-browse';

/** The cursor over something that answers a left click or a rest. */
const HAND = 'pointer';

/** A new campaign, as the bare address with no save opens on. */
const CAMPAIGN = freshCampaign(CATALOGUE);

/** The collection's stacks in the order the screen stands them in. */
const STACKS = stacksOf(CATALOGUE, CAMPAIGN.collection, cardName);

/** How many stacks a line holds. */
const ACROSS = 6;

test('the navbar’s Collection opens the collection screen on a new campaign, Collection sunk: each card owned stands once reading its copies and its price, six to a line in the collection’s order, and each civilization’s pile reads its two counts, the city section’s card among its settle cards', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);

  expect(await standing(page, 'navbar-collection-well')).toBe(true);
  expect(await standing(page, 'navbar-collection')).toBe(false);

  const owned = new Set(CAMPAIGN.collection.map(({ id }) => id));
  expect(STACKS.map(({ id }) => id).sort()).toEqual([...owned].sort());
  expect(STACKS.length).toBeGreaterThan(ACROSS);
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(await counted(page, `collection-card-${id}`)).toBe(owned.has(id) ? 1 : 0);
  }

  const placed: { id: string; at: { x: number; y: number } }[] = [];
  for (const { id } of STACKS) {
    const copies = CAMPAIGN.collection.filter((card) => card.id === id).length;
    expect(await cardOnFace(page, `collection-card-${id}`)).toBe(id);
    expect(await textOf(page, `collection-card-${id}-copies`)).toBe(
      text('collection.copies', { copies }),
    );
    expect(await textOf(page, `collection-card-${id}-price`)).toBe(
      text('collection.price', { price: priceOf(CATALOGUE, CAMPAIGN, id) }),
    );
    placed.push({ id, at: await placeOf(page, `collection-card-${id}`) });
  }
  const read = [...placed].sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x);
  expect(read.map(({ id }) => id)).toEqual(STACKS.map(({ id }) => id));
  const [first] = read;
  expect(read.filter(({ at }) => at.y === first.at.y)).toHaveLength(ACROSS);

  const rightmost = Math.max(...placed.map(({ at }) => at.x));
  for (const [id, civilization] of Object.entries(CAMPAIGN.civilizations)) {
    const pile = `collection-civilization-${id}`;
    expect(await cardOnFace(page, `${pile}-card`)).toBe(civilization.city.card.id);
    expect(await textOf(page, `${pile}-counts`)).toBe(
      text('pile.counts', {
        cards: civilization.cards.length,
        settle: civilization.settle.length + 1,
      }),
    );
    expect((await placeOf(page, `${pile}-card`)).x).toBeGreaterThan(rightmost);
  }

  expect(problems).toEqual([]);
});

test('on a campaign a won chronicle paid into, a press on the price of an affordable card buys a copy of it: the bar reads the influence less the price, the stack one copy more and its price doubled, and the save the campaign the buy makes; the price of an unaffordable card stands greyed, no hand, and a press on it buys nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const firstLine = stacksOf(CATALOGUE, campaign.collection, cardName).slice(0, ACROSS);
  const card = firstLine.find(({ id }) => !unaffordableIn(CATALOGUE, campaign, id));
  const greyed = firstLine.find(({ id }) => unaffordableIn(CATALOGUE, campaign, id));
  if (card === undefined || greyed === undefined) {
    throw new Error('the won campaign’s first line holds no affordable and unaffordable card both');
  }
  const price = priceOf(CATALOGUE, campaign, card.id);
  const after = bought(CATALOGUE, campaign, card.id);

  await plantCampaign(page, campaign);
  await openCollection(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(campaign.influence));

  const button = await onScreen(page, `collection-card-${card.id}-buy`);
  await page.mouse.move(button.x, button.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(button.x, button.y);
  await expect.poll(async () => (await heldSave(page)).campaign).toEqual(after);
  await rested(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(campaign.influence - price));
  expect(await textOf(page, `collection-card-${card.id}-copies`)).toBe(
    text('collection.copies', { copies: card.copies + 1 }),
  );
  expect(await textOf(page, `collection-card-${card.id}-price`)).toBe(
    text('collection.price', { price: priceOf(CATALOGUE, after, card.id) }),
  );

  const unaffordable = await onScreen(page, `collection-card-${greyed.id}-buy`);
  await page.mouse.move(unaffordable.x, unaffordable.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe('');

  await page.mouse.click(unaffordable.x, unaffordable.y);
  await rested(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(after.influence));
  expect((await heldSave(page)).campaign).toEqual(after);

  expect(problems).toEqual([]);
});

test('in the collection mode a right click on a civilization’s pile, on its counts, raises its browse and opens no deck editing mode, and the back key closes the browse onto the collection mode and raises no menu', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);
  const [civilization] = Object.keys(CAMPAIGN.civilizations);
  const { count, stacks } = browseOf(CATALOGUE, CAMPAIGN, civilization, cardName);

  const counts = await onScreen(page, `collection-civilization-${civilization}-counts`);
  await page.mouse.click(counts.x, counts.y, { button: 'right' });
  await expect.poll(() => standing(page, BROWSE)).toBe(true);
  await rested(page);
  expect(await titleOf(page, BROWSE)).toBe(
    text('browse.civilization', { civilization: civilizationName(civilization), count }),
  );
  expect(await cardOnFace(page, `${BROWSE}-card-0`)).toBe(stacks[0].id);
  expect(await standing(page, 'deck-editing-mode')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, BROWSE)).toBe(false);
  await rested(page);
  expect(await standing(page, 'collection-mode')).toBe(true);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('on the collection screen the pointer on a stack is no hand, a right click on it shows its card large, and the back key takes it down and raises no menu', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);
  const [{ id }] = STACKS;

  const card = await onScreen(page, `collection-card-${id}`);
  await page.mouse.move(card.x, card.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe('');

  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(id);
  await rested(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  await rested(page);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});
