import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { freshCampaign } from '../src/rules/save';
import { stacksOf } from '../src/ui/collection-layout';
import { cardName, text } from '../src/ui/text';
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

/** The collection's stacks in the order the screen stands them in. */
const STACKS = stacksOf(CATALOGUE, CAMPAIGN.collection, cardName);

/** How many stacks a line holds. */
const ACROSS = 6;

/** Where the named face stands in the design space: its own bottom centre, which every face is drawn about. */
function placeOf(page: Page, name: string): Promise<{ x: number; y: number }> {
  return page.evaluate((target) => {
    const face = window.named?.(target)?.object as Phaser.GameObjects.Container | undefined;
    if (face === undefined) throw new Error(`there is no ${target}`);
    const at = face.getWorldTransformMatrix();
    return { x: at.tx, y: at.ty };
  }, name);
}

/** Collection pressed on the navbar of the campaign screen a bare boot opens, and its screen waited for. */
async function openCollection(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  await click(page, 'navbar-collection');
  await expect.poll(() => standing(page, 'collection')).toBe(true);
  await rested(page);
}

test('the navbar’s Collection opens the collection screen on a new campaign, Collection sunk: each card owned stands once reading its copies, six to a line in the collection’s order, and each civilization’s pile reads its two counts', async ({
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
        settle: civilization.settle.length,
      }),
    );
    expect((await placeOf(page, `${pile}-card`)).x).toBeGreaterThan(rightmost);
  }

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
