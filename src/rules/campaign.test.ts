import { expect, test } from 'vitest';
import { type CampaignCard, newCampaign, paidInto } from './campaign';
import { achievementOf, technologyOf } from './catalogue';
import { apply, outcome } from './chronicle';
import {
  AGE,
  CATALOGUE,
  cityOf,
  DECK,
  DECK_ID,
  field,
  HOARD,
  HOARD_NEED,
  hoardedVictory,
  reaching,
  victoryOf,
} from './fixtures';

function numbersOf(cards: readonly CampaignCard[]): number[] {
  return cards.map(({ number }) => number);
}

test('a new campaign unlocks nothing and holds no influence, and owns a card of its own for each card its deck lists, each numbered once from one', () => {
  const campaign = newCampaign(CATALOGUE, DECK_ID);
  const { card, ...city } = campaign.deck.city;
  const numbers = [card.number, ...numbersOf(campaign.collection)];

  expect(campaign.technologies).toEqual([]);
  expect(campaign.influence).toBe(0);
  expect([...numbers].sort((a, b) => a - b)).toEqual(numbers.map((_, at) => at + 1));
  expect(campaign.nextCard).toBe(numbers.length + 1);
  expect({ ...city, card: card.id }).toEqual(DECK.city);
  expect(numbersOf(campaign.collection)).not.toContain(card.number);
});

test('a new campaign’s deck names every card of its collection, each in the section of the catalogue deck it came from', () => {
  const campaign = newCampaign(CATALOGUE, DECK_ID);
  const owned = new Map(campaign.collection.map(({ number, id }) => [number, id]));
  const named = (numbers: readonly number[]): (string | undefined)[] =>
    numbers.map((number) => owned.get(number));

  expect(named(campaign.deck.settle)).toEqual(DECK.settle);
  expect(named(campaign.deck.cards)).toEqual(DECK.cards);
  expect([...campaign.deck.settle, ...campaign.deck.cards].sort((a, b) => a - b)).toEqual(
    numbersOf(campaign.collection).sort((a, b) => a - b),
  );
});

test('an ended chronicle pays into the campaign each achievement it reached, in its order: the technology unlocked, the influence added, and the cards the technology unlocks entering the collection as new cards in no section of the deck', () => {
  const won = hoardedVictory();
  const opened = newCampaign(CATALOGUE, DECK_ID);
  const hoard = achievementOf(CATALOGUE, AGE, HOARD);
  const victory = achievementOf(CATALOGUE, AGE, victoryOf(AGE));
  const unlocks = Object.entries(technologyOf(CATALOGUE, hoard.technology).unlocks.cards).flatMap(
    ([card, copies]) => Array.from({ length: copies }, () => card),
  );

  const { campaign, ...paid } = paidInto(CATALOGUE, opened, won);

  expect(won.ending?.outcome).toBe('victory');
  expect(unlocks.length).toBeGreaterThan(1);
  expect(paid.achievements).toEqual([HOARD, victoryOf(AGE)]);
  expect(paid.technologies).toEqual([hoard.technology, victory.technology]);
  expect(paid.influence).toBe(hoard.influence + victory.influence);
  expect(paid.entered).toEqual(unlocks.map((id, at) => ({ number: opened.nextCard + at, id })));
  expect(campaign).toEqual({
    technologies: [hoard.technology, victory.technology],
    influence: opened.influence + paid.influence,
    nextCard: opened.nextCard + unlocks.length,
    collection: [...opened.collection, ...paid.entered],
    deck: opened.deck,
  });
});

test('a card a technology unlocks that the collection already owns enters as new cards beside the ones owned: nothing merges', () => {
  const opened = newCampaign(CATALOGUE, DECK_ID);
  const { campaign, entered } = paidInto(CATALOGUE, opened, hoardedVictory());
  const [{ id }] = entered;
  const copies = (cards: readonly CampaignCard[]): number =>
    cards.filter((card) => card.id === id).length;

  expect(copies(opened.collection)).toBeGreaterThan(0);
  expect(copies(campaign.collection)).toBe(copies(opened.collection) + copies(entered));
  expect(new Set(numbersOf(campaign.collection)).size).toBe(campaign.collection.length);
});

test('a defeat pays as a victory does: the achievements it reached', () => {
  const empty = reaching([], {
    tiles: field(2),
    population: 0,
    assigned: [],
    hand: ['PH_Harvest'],
    resources: { food: HOARD_NEED, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const fallen = outcome(apply(CATALOGUE, empty, { type: 'play', index: 0, aim: 'none' }));
  const hoard = achievementOf(CATALOGUE, AGE, HOARD);

  const paid = paidInto(CATALOGUE, newCampaign(CATALOGUE, DECK_ID), fallen);

  expect(fallen.ending?.outcome).toBe('defeat');
  expect(paid.achievements).toEqual([HOARD]);
  expect(paid.technologies).toEqual([hoard.technology]);
  expect(paid.influence).toBe(hoard.influence);
});

test('a chronicle that ends having reached no achievement pays nothing', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0, assigned: [] });
  const fallen = outcome(apply(CATALOGUE, empty, { type: 'end-turn' }));
  const opened = newCampaign(CATALOGUE, DECK_ID);

  const paid = paidInto(CATALOGUE, opened, fallen);

  expect(fallen.ending).toBeDefined();
  expect(paid).toEqual({
    campaign: opened,
    influence: 0,
    achievements: [],
    technologies: [],
    entered: [],
  });
});

test('a chronicle that has not ended is refused its payment', () => {
  const running = reaching([], { tiles: field(2) });

  expect(running.ending).toBeUndefined();
  expect(() => paidInto(CATALOGUE, newCampaign(CATALOGUE, DECK_ID), running)).toThrow(
    'fixture: a chronicle that has not ended pays nothing',
  );
});

test('a chronicle paid in a second time is refused: the technology its achievement earns is already unlocked', () => {
  const won = hoardedVictory();
  const { campaign } = paidInto(CATALOGUE, newCampaign(CATALOGUE, DECK_ID), won);
  const { technology } = achievementOf(CATALOGUE, AGE, HOARD);

  expect(() => paidInto(CATALOGUE, campaign, won)).toThrow(
    `fixture: the achievement ${HOARD} earns ${technology}, which is already unlocked`,
  );
});
