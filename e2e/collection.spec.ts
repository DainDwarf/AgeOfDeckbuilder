import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { bought, type Campaign, priceOf, unaffordableIn } from '../src/rules/campaign';
import { freshCampaign } from '../src/rules/save';
import { DEFAULTS } from '../src/ui/bindings';
import { browseOf, stacksOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import { learnedWithNeeds, technologiesEarnedIn } from '../tools/learned-with-needs';
import {
  cardOnFace,
  cursorOverCanvas,
  dragBetween,
  heldFor,
  heldSave,
  offsetOf,
  onScreen,
  openCollection,
  panKeys,
  pannedToEndsThenTapped,
  plantCampaign,
  readings,
  readOrder,
  rested,
  standing,
  textOf,
  titleOf,
  watch,
  wheel,
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

/** The collection mode's two panels, and the frames they are cut at. */
const COLLECTION_PANEL = 'collection-panel';
const COLLECTION_FRAME = `${COLLECTION_PANEL}-frame`;
const CIVILIZATIONS_PANEL = 'civilizations-panel';
const CIVILIZATIONS_FRAME = `${CIVILIZATIONS_PANEL}-frame`;

/** A new campaign that has learned every technology the Stone Age's achievements earn, each with its needs. */
function stoneAgeLearned(): Campaign {
  const [, stoneAge] = Object.keys(CATALOGUE.ages);
  if (stoneAge === undefined) throw new Error('the catalogue lists no second age');
  return learnedWithNeeds(CATALOGUE, CAMPAIGN, technologiesEarnedIn(CATALOGUE, stoneAge));
}

test('the navbar’s Collection opens the collection screen on a new campaign, Collection sunk: each card owned stands once reading its copies and its price, six to a line in the collection’s order, and each civilization’s pile reads its two counts, the city section’s card among its settle cards', async ({
  page,
}) => {
  const problems = watch(page);
  await openCollection(page);

  const owned = new Set(CAMPAIGN.collection.map(({ id }) => id));
  const seen = await readings(page, [
    'navbar-collection-well',
    'navbar-collection',
    ...Object.keys(CATALOGUE.cards).map((id) => `collection-card-${id}`),
    ...STACKS.flatMap(({ id }) => [`collection-card-${id}-copies`, `collection-card-${id}-price`]),
    ...Object.keys(CAMPAIGN.civilizations).flatMap((id) => [
      `collection-civilization-${id}-card`,
      `collection-civilization-${id}-counts`,
    ]),
  ]);

  expect(seen('navbar-collection-well').standing).toBe(true);
  expect(seen('navbar-collection').standing).toBe(false);

  expect(STACKS.map(({ id }) => id).sort()).toEqual([...owned].sort());
  expect(STACKS.length).toBeGreaterThan(ACROSS);
  for (const id of Object.keys(CATALOGUE.cards)) {
    expect(seen(`collection-card-${id}`).count).toBe(owned.has(id) ? 1 : 0);
  }

  const placed: { id: string; at: { x: number; y: number } }[] = [];
  for (const { id } of STACKS) {
    const copies = CAMPAIGN.collection.filter((card) => card.id === id).length;
    expect(seen(`collection-card-${id}`).card).toBe(id);
    expect(seen(`collection-card-${id}-copies`).text).toBe(text('collection.copies', { copies }));
    expect(seen(`collection-card-${id}-price`).text).toBe(
      text('collection.price', { price: priceOf(CATALOGUE, CAMPAIGN, id) }),
    );
    placed.push({ id, at: seen(`collection-card-${id}`).place });
  }
  const read = readOrder(placed, ({ at }) => at);
  expect(read.map(({ id }) => id)).toEqual(STACKS.map(({ id }) => id));
  const [first] = read;
  expect(read.filter(({ at }) => at.y === first.at.y)).toHaveLength(ACROSS);

  const rightmost = Math.max(...placed.map(({ at }) => at.x));
  for (const [id, civilization] of Object.entries(CAMPAIGN.civilizations)) {
    const pile = `collection-civilization-${id}`;
    expect(seen(`${pile}-card`).card).toBe(civilization.city.card.id);
    expect(seen(`${pile}-counts`).text).toBe(
      text('pile.counts', {
        cards: civilization.cards.length,
        settle: civilization.settle.length + 1,
      }),
    );
    expect(seen(`${pile}-card`).place.x).toBeGreaterThan(rightmost);
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
  const opened = await readings(page, [
    'reading-influence-value',
    `collection-card-${card.id}-buy`,
  ]);
  expect(opened('reading-influence-value').text).toBe(String(campaign.influence));

  const button = opened(`collection-card-${card.id}-buy`).onScreen;
  await page.mouse.move(button.x, button.y);
  await rested(page);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(button.x, button.y);
  await expect.poll(async () => (await heldSave(page)).campaign).toEqual(after);
  await rested(page);
  const afterBuy = await readings(page, [
    'reading-influence-value',
    `collection-card-${card.id}-copies`,
    `collection-card-${card.id}-price`,
    `collection-card-${greyed.id}-buy`,
  ]);
  expect(afterBuy('reading-influence-value').text).toBe(String(campaign.influence - price));
  expect(afterBuy(`collection-card-${card.id}-copies`).text).toBe(
    text('collection.copies', { copies: card.copies + 1 }),
  );
  expect(afterBuy(`collection-card-${card.id}-price`).text).toBe(
    text('collection.price', { price: priceOf(CATALOGUE, after, card.id) }),
  );

  const unaffordable = afterBuy(`collection-card-${greyed.id}-buy`).onScreen;
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
  const raised = await readings(page, [`${BROWSE}-card-0`, 'deck-editing-mode']);
  expect(raised(`${BROWSE}-card-0`).card).toBe(stacks[0].id);
  expect(raised('deck-editing-mode').standing).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, BROWSE)).toBe(false);
  await rested(page);
  const closed = await readings(page, ['collection-mode', 'menu']);
  expect(closed('collection-mode').standing).toBe(true);
  expect(closed('menu').standing).toBe(false);

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

test('on a campaign holding the Stone Age’s technologies the collection panel opens at its top holding more than its room; the wheel over it, a press held on it and the keys that pan up and down with the pointer on it move it and stop it at its first line and its last, and the wheel and those keys over the civilizations panel and the keys that pan left and right move it nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const { down, up } = panKeys();
  const offset = (): Promise<number> => offsetOf(page, COLLECTION_PANEL);

  await plantCampaign(page, stoneAgeLearned());
  await openCollection(page);
  const opened = await readings(page, [
    COLLECTION_PANEL,
    CIVILIZATIONS_PANEL,
    COLLECTION_FRAME,
    CIVILIZATIONS_FRAME,
  ]);
  const { overflow } = opened(COLLECTION_PANEL).scrolled;
  expect(opened(COLLECTION_PANEL).scrolled.offset).toBe(0);
  expect(overflow).toBeGreaterThan(0);
  expect(opened(CIVILIZATIONS_PANEL).scrolled).toEqual({ offset: 0, overflow: 0 });
  const frame = opened(COLLECTION_FRAME).onScreen;
  const beside = opened(CIVILIZATIONS_FRAME).onScreen;

  await wheel(page, 120, COLLECTION_FRAME);
  await expect.poll(offset).toBeGreaterThan(0);
  expect(await offset()).toBeLessThan(overflow);
  await wheel(page, 4000, COLLECTION_FRAME);
  await expect.poll(offset).toBe(overflow);
  await wheel(page, -4000, COLLECTION_FRAME);
  await expect.poll(offset).toBe(0);
  await wheel(page, 120, CIVILIZATIONS_FRAME);
  await rested(page);
  await rested(page);
  expect(await offset()).toBe(0);

  await dragBetween(page, frame, { x: frame.x, y: frame.y - 120 * frame.unit });
  await expect.poll(offset).toBeGreaterThanOrEqual(120);
  expect(await offset()).toBeLessThanOrEqual(overflow);
  await wheel(page, -4000, COLLECTION_FRAME);
  await expect.poll(offset).toBe(0);
  await rested(page);

  const tapped = await pannedToEndsThenTapped(page, overflow, COLLECTION_PANEL);

  for (const control of ['pan-left', 'pan-right'] as const) {
    for (const slot of DEFAULTS[control]) {
      if (slot === undefined) continue;
      expect(await heldFor(page, slot.code, 200, COLLECTION_PANEL)).toBe(tapped);
    }
  }

  expect(await heldFor(page, up, 200, COLLECTION_PANEL)).toBe(0);
  expect(await heldFor(page, down, 200, COLLECTION_PANEL)).toBeGreaterThan(tapped);

  await wheel(page, -4000, COLLECTION_FRAME);
  await expect.poll(offset).toBe(0);
  await page.mouse.move(beside.x, beside.y);
  await rested(page);
  expect(await heldFor(page, down, 200, COLLECTION_PANEL)).toBe(0);

  expect(problems).toEqual([]);
});
