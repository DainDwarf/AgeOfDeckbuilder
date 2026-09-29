import { expect, test } from 'vitest';
import { dealt, FIRST_CARD_NUMBER } from '../rules/campaign';
import { merged } from '../rules/catalogue';
import { CATALOGUE, SLICES } from '../rules/fixtures';
import type { CardId } from '../rules/state';
import { stacksOf } from './collection-layout';

/** The names the player reads the fixture's cards by, the test's own. */
const NAMES: Readonly<Record<CardId, string>> = {
  PH_Band: 'Camp',
  PH_Claim: 'Outpost',
  PH_Stores: 'Granary',
  PH_Worker: 'Hand',
  PH_Warrior: 'Guard',
  PH_Farm: 'Field',
  PH_March: 'Zeal',
  PH_Harvest: 'Bounty',
  PH_Mine: 'Bounty',
  PH_Hunger: 'Ache',
};

function nameOf(card: CardId): string {
  const name = NAMES[card];
  if (name === undefined) throw new Error(`the test names no card ${card}`);
  return name;
}

/** A collection of these cards, one copy for each time an id is named, dealt as the campaign deals. */
function collectionOf(...ids: CardId[]) {
  return dealt(FIRST_CARD_NUMBER, ids).cards;
}

/** The fixture's content with its stores and its worker cards brought by its second age. */
function twoAges() {
  const [first, second, ...rest] = SLICES;
  const { PH_Stores, PH_Worker, ...firstCards } = first.brings.cards ?? {};
  return merged('fixture', [
    { ...first, brings: { ...first.brings, cards: firstCards } },
    { ...second, brings: { cards: { PH_Stores, PH_Worker } } },
    ...rest,
  ]);
}

test('the collection stands each card once with its copies, by age in the order of history, then settle, unit, building and instant, then by name', () => {
  const collection = collectionOf(
    'PH_Worker',
    'PH_March',
    'PH_Farm',
    'PH_March',
    'PH_Claim',
    'PH_Stores',
    'PH_Warrior',
    'PH_Band',
    'PH_Warrior',
    'PH_March',
  );

  expect(stacksOf(twoAges(), collection, nameOf)).toEqual([
    { id: 'PH_Band', copies: 1 },
    { id: 'PH_Claim', copies: 1 },
    { id: 'PH_Warrior', copies: 2 },
    { id: 'PH_Farm', copies: 1 },
    { id: 'PH_March', copies: 3 },
    { id: 'PH_Stores', copies: 1 },
    { id: 'PH_Worker', copies: 1 },
  ]);
});

test('cards of one age and kind read by the same name stand in the catalogue’s order, whatever order the collection holds them in', () => {
  const collection = collectionOf('PH_Mine', 'PH_Harvest', 'PH_Mine');

  expect(stacksOf(CATALOGUE, collection, nameOf)).toEqual([
    { id: 'PH_Harvest', copies: 1 },
    { id: 'PH_Mine', copies: 2 },
  ]);
});

test('a hazard stands after every other kind of its age', () => {
  const collection = collectionOf('PH_Hunger', 'PH_March', 'PH_Claim');

  expect(stacksOf(CATALOGUE, collection, nameOf)).toEqual([
    { id: 'PH_Claim', copies: 1 },
    { id: 'PH_March', copies: 1 },
    { id: 'PH_Hunger', copies: 1 },
  ]);
});
