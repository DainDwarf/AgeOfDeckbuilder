import { expect, test } from 'vitest';
import { dealt, FIRST_CARD_NUMBER, newCampaign, paidInto } from '../rules/campaign';
import { merged } from '../rules/catalogue';
import { CATALOGUE, CIVILIZATION_ID, hoardedVictory, SLICES, twoAges } from '../rules/fixtures';
import type { CardId } from '../rules/state';
import { copiesIn, countsOf, deckRowsOf, heldIn, stacksOf } from './collection-layout';

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

/**
 * The fixture's content with its civilization listing two settle cards, one of them twice, and three
 * cards, one of them three times, neither section in the collection's order.
 */
function edited() {
  const settle = ['PH_Claim', 'PH_Band', 'PH_Claim'];
  const cards = ['PH_March', 'PH_Worker', 'PH_March', 'PH_Farm', 'PH_March'];
  const [first, ...rest] = SLICES;
  const civilizations = first.brings.civilizations ?? {};
  const listed = civilizations[CIVILIZATION_ID];
  return merged('fixture', [
    {
      ...first,
      brings: {
        ...first.brings,
        civilizations: { ...civilizations, [CIVILIZATION_ID]: { ...listed, settle, cards } },
      },
    },
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

test('a civilization’s settle section and its deck each stand every card they hold once, with the copies they hold, in the collection’s order, and the city section’s card in neither', () => {
  const catalogue = edited();

  expect(
    deckRowsOf(catalogue, newCampaign(catalogue, CIVILIZATION_ID), CIVILIZATION_ID, nameOf),
  ).toEqual({
    settle: [
      { id: 'PH_Band', copies: 1 },
      { id: 'PH_Claim', copies: 2 },
    ],
    cards: [
      { id: 'PH_Worker', copies: 1 },
      { id: 'PH_Farm', copies: 1 },
      { id: 'PH_March', copies: 3 },
    ],
  });
});

test('a civilization counts its cards, and its settle cards with the city section’s card among them', () => {
  const catalogue = edited();
  const campaign = newCampaign(catalogue, CIVILIZATION_ID);

  expect(countsOf(campaign.civilizations[CIVILIZATION_ID])).toEqual({ cards: 5, settle: 4 });
});

test('a card of the collection reads the copies a deck holds of it, in its settle section as in the rest, and none where the deck holds none', () => {
  const catalogue = edited();
  const deck = deckRowsOf(
    catalogue,
    newCampaign(catalogue, CIVILIZATION_ID),
    CIVILIZATION_ID,
    nameOf,
  );

  expect(heldIn(deck, 'PH_Claim')).toBe(2);
  expect(heldIn(deck, 'PH_March')).toBe(3);
  expect(heldIn(deck, 'PH_Harvest')).toBe(0);
});

test('the copies a won chronicle adds to the collection stand in no deck', () => {
  const { campaign } = paidInto(
    CATALOGUE,
    newCampaign(CATALOGUE, CIVILIZATION_ID),
    hoardedVictory(),
  );
  const stacks = stacksOf(CATALOGUE, campaign.collection, nameOf);

  expect(copiesIn(stacks, 'PH_Harvest')).toBe(4);
  expect(heldIn(deckRowsOf(CATALOGUE, campaign, CIVILIZATION_ID, nameOf), 'PH_Harvest')).toBe(2);
});
