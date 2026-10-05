import { expect, test } from 'vitest';
import {
  addedTo,
  agesReached,
  available,
  bought,
  type Campaign,
  type CampaignCard,
  civilizationIn,
  dealt,
  newCampaign,
  paidInto,
  pinned,
  priceOf,
  regionsReached,
  removedFrom,
  unpinned,
} from './campaign';
import { achievementOf, ageOf, type Civilization, cardAge, technologyOf } from './catalogue';
import { apply, outcome } from './chronicle';
import {
  AGE,
  CATALOGUE,
  CENSUS,
  CIVILIZATION,
  CIVILIZATION_ID,
  CLEARING,
  cityOf,
  field,
  GRANARY,
  HOARD,
  HOARD_NEED,
  hoardedVictory,
  QUIET,
  REGION,
  reaching,
  regionsUnlocked,
  twoAges,
  victoryOf,
} from './fixtures';
import { readSave, writeSave } from './save';
import type { CardId } from './state';

function numbersOf(cards: readonly CampaignCard[]): number[] {
  return cards.map(({ number }) => number);
}

/** How many of the ids are this one. */
function copiesIn(ids: readonly CardId[], card: CardId): number {
  return ids.filter((id) => id === card).length;
}

/** The name the campaign's second civilization goes by in these tests. */
const SECOND = 'second';

/** A new campaign owning a second civilization, on a city section of its own and holding no card. */
function withSecond(): Campaign {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const { city } = opened.civilizations[CIVILIZATION_ID];
  const cityCard = dealt(opened.nextCard, [city.card.id]);
  return {
    ...opened,
    nextCard: cityCard.nextCard,
    civilizations: {
      ...opened.civilizations,
      [SECOND]: { city: { ...city, card: cityCard.cards[0] }, settle: [], cards: [] },
    },
  };
}

test('a new campaign unlocks nothing and holds no influence, and owns one civilization, named as the catalogue’s, and a card of its own for each card that civilization lists, each numbered once from one', () => {
  const campaign = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const civilization = campaign.civilizations[CIVILIZATION_ID];
  const { card } = civilization.city;
  const numbers = [card.number, ...numbersOf(campaign.collection)];

  expect(Object.keys(campaign.civilizations)).toEqual([CIVILIZATION_ID]);
  expect(campaign.technologies).toEqual([]);
  expect(campaign.influence).toBe(0);
  expect([...numbers].sort((a, b) => a - b)).toEqual(numbers.map((_, at) => at + 1));
  expect(campaign.nextCard).toBe(numbers.length + 1);
  expect(numbersOf(campaign.collection)).not.toContain(card.number);
  expect([...civilization.settle, ...civilization.cards].sort((a, b) => a - b)).toEqual(
    numbersOf(campaign.collection).sort((a, b) => a - b),
  );
});

test('a new campaign’s civilization is launched on as the catalogue’s it was opened on: its city section, and its cards by id in the order listed', () => {
  const campaign = newCampaign(CATALOGUE, CIVILIZATION_ID);

  expect(civilizationIn(CATALOGUE, campaign, CIVILIZATION_ID)).toEqual(CIVILIZATION);
});

test('a civilization the campaign does not hold is launched on by no chronicle', () => {
  expect(() =>
    civilizationIn(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), 'PH_Unheld'),
  ).toThrow('fixture: the campaign holds no civilization named PH_Unheld');
});

test('an ended chronicle pays into the campaign each achievement it reached, in its order: the technology learned, the influence added, and the cards the technology unlocks added to the collection as new cards in no section of the deck', () => {
  const won = hoardedVictory();
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
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
    civilizations: opened.civilizations,
  });
});

test('a card a technology unlocks that the collection already owns enters as new cards beside the ones owned: nothing merges', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
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

  const paid = paidInto(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), fallen);

  expect(fallen.ending?.outcome).toBe('defeat');
  expect(paid.achievements).toEqual([HOARD]);
  expect(paid.technologies).toEqual([hoard.technology]);
  expect(paid.influence).toBe(hoard.influence);
});

test('a chronicle that ends having reached no achievement pays nothing', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0, assigned: [] });
  const fallen = outcome(apply(CATALOGUE, empty, { type: 'end-turn' }));
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);

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
  expect(() => paidInto(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), running)).toThrow(
    'fixture: a chronicle that has not ended pays nothing',
  );
});

/** An available technology of the campaign other than `GRANARY`, which `HOARD` earns. */
function besideGranary(campaign: Campaign): string {
  const technology = Object.keys(CATALOGUE.technologies).find(
    (held) => held !== GRANARY && available(CATALOGUE, held, campaign.technologies),
  );
  if (technology === undefined)
    throw new Error('the campaign has no available technology beside GRANARY');
  return technology;
}

test('a campaign pins an available technology, a second pin moves it, and the pin is taken off; a technology learned, one unknown and one the catalogue does not hold are pinned by nothing', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const other = besideGranary(opened);
  const { campaign: paid } = paidInto(CATALOGUE, opened, hoardedVictory());

  const first = pinned(CATALOGUE, opened, GRANARY);
  const moved = pinned(CATALOGUE, first, other);

  expect(first).toEqual({ ...opened, pin: GRANARY });
  expect(moved).toEqual({ ...opened, pin: other });
  expect(unpinned(moved)).toStrictEqual(opened);
  expect(paid.technologies).toContain(GRANARY);
  expect(() => pinned(CATALOGUE, paid, GRANARY)).toThrow(
    `fixture: the pin names the learned technology ${GRANARY}`,
  );
  expect(() => pinned(CATALOGUE, opened, CENSUS)).toThrow(
    `fixture: the pin names the unknown technology ${CENSUS}`,
  );
  expect(() => pinned(CATALOGUE, opened, 'PH_Unheld')).toThrow(
    'fixture: the pin names no technology PH_Unheld',
  );
});

test('an ended chronicle that learns the pinned technology leaves nothing pinned, and one that learns another leaves the pin standing', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const other = besideGranary(opened);
  const won = hoardedVictory();
  const { campaign } = paidInto(CATALOGUE, opened, won);

  expect(campaign.technologies).toContain(GRANARY);
  expect(campaign.technologies).not.toContain(other);
  expect(paidInto(CATALOGUE, pinned(CATALOGUE, opened, GRANARY), won).campaign).toStrictEqual(
    campaign,
  );
  expect(paidInto(CATALOGUE, pinned(CATALOGUE, opened, other), won).campaign).toEqual({
    ...campaign,
    pin: other,
  });
});

test('a new campaign has reached the first age alone', () => {
  expect(agesReached(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID))).toEqual([AGE]);
});

test('a campaign paid an age’s victory has reached the age its technology unlocks, beside the first, in the order of history', () => {
  const { campaign } = paidInto(
    CATALOGUE,
    newCampaign(CATALOGUE, CIVILIZATION_ID),
    hoardedVictory(),
  );
  const { technology } = achievementOf(CATALOGUE, AGE, victoryOf(AGE));
  const next = technologyOf(CATALOGUE, technology).unlocks.age;

  expect(next).toBeDefined();
  expect(agesReached(CATALOGUE, campaign)).toEqual([AGE, next]);
});

test('a region a technology unlocks is reached once that technology is learned, in every age holding its name, and a region no technology unlocks is reached from the first chronicle', () => {
  const catalogue = regionsUnlocked({ [GRANARY]: REGION });
  const opened = newCampaign(catalogue, CIVILIZATION_ID);
  const { campaign } = paidInto(catalogue, opened, hoardedVictory());

  expect(campaign.technologies).toContain(GRANARY);
  for (const age of [AGE, QUIET]) {
    expect(regionsReached(catalogue, opened, age)).toEqual([CLEARING]);
    expect(regionsReached(catalogue, campaign, age)).toEqual([REGION, CLEARING]);
  }
});

test('a chronicle paid in a second time is refused: the technology its achievement earns is already learned', () => {
  const won = hoardedVictory();
  const { campaign } = paidInto(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), won);
  const { technology } = achievementOf(CATALOGUE, AGE, HOARD);

  expect(() => paidInto(CATALOGUE, campaign, won)).toThrow(
    `fixture: the achievement ${HOARD} earns ${technology}, which is already learned`,
  );
});

test('a card’s price is the base price of its age owning one copy, doubled for every copy owned past the first, a copy a chronicle paid in counted as any other; a card the collection owns no copy of has none', () => {
  const catalogue = twoAges();
  const opened = newCampaign(catalogue, CIVILIZATION_ID);
  const { campaign } = paidInto(catalogue, opened, hoardedVictory());
  const owned = (held: Campaign, card: CardId): number =>
    copiesIn(
      held.collection.map(({ id }) => id),
      card,
    );
  const first = ageOf(catalogue, AGE).basePrice;
  const second = ageOf(catalogue, QUIET).basePrice;

  expect(second).not.toBe(first);
  expect([cardAge(catalogue, 'PH_Claim'), cardAge(catalogue, 'PH_Warrior')]).toEqual([AGE, AGE]);
  expect(cardAge(catalogue, 'PH_Worker')).toBe(QUIET);
  expect([owned(opened, 'PH_Claim'), owned(opened, 'PH_Warrior')]).toEqual([1, 2]);
  expect(owned(opened, 'PH_Worker')).toBe(2);
  expect([owned(opened, 'PH_Harvest'), owned(campaign, 'PH_Harvest')]).toEqual([2, 4]);

  expect(priceOf(catalogue, opened, 'PH_Claim')).toBe(first);
  expect(priceOf(catalogue, opened, 'PH_Warrior')).toBe(2 * first);
  expect(priceOf(catalogue, opened, 'PH_Worker')).toBe(2 * second);
  expect(priceOf(catalogue, opened, 'PH_Harvest')).toBe(2 * first);
  expect(priceOf(catalogue, campaign, 'PH_Harvest')).toBe(8 * first);
  expect(owned(campaign, 'PH_Stores')).toBe(0);
  expect(() => priceOf(catalogue, campaign, 'PH_Stores')).toThrow(
    'fixture: the collection owns no copy of PH_Stores',
  );
});

test('a copy is bought for its price in influence and dealt into the collection as a new card in no section, and its price doubles; an unaffordable card and a card the collection owns no copy of are not bought', () => {
  const { campaign } = paidInto(
    CATALOGUE,
    newCampaign(CATALOGUE, CIVILIZATION_ID),
    hoardedVictory(),
  );
  const owned = [...new Set(campaign.collection.map(({ id }) => id))];
  const price = (card: CardId): number => priceOf(CATALOGUE, campaign, card);
  const card = owned.find((id) => price(id) <= campaign.influence);
  const unaffordable = owned.find((id) => price(id) > campaign.influence);
  if (card === undefined || unaffordable === undefined) {
    throw new Error('the fixture’s paid campaign holds no affordable and unaffordable card');
  }

  const after = bought(CATALOGUE, campaign, card);

  expect(after).toEqual({
    ...campaign,
    influence: campaign.influence - price(card),
    nextCard: campaign.nextCard + 1,
    collection: [...campaign.collection, { number: campaign.nextCard, id: card }],
  });
  expect(priceOf(CATALOGUE, after, card)).toBe(2 * price(card));
  expect(() => bought(CATALOGUE, campaign, unaffordable)).toThrow(
    `fixture: the influence ${campaign.influence} does not cover the price ${price(unaffordable)} of ${unaffordable}`,
  );
  expect(owned).not.toContain('PH_Stores');
  expect(() => bought(CATALOGUE, campaign, 'PH_Stores')).toThrow(
    'fixture: the collection owns no copy of PH_Stores',
  );
});

test('a copy removed from a civilization leaves its section one copy short and the collection whole, and added back a settle card stands in the settle section and any other card in the deck', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const [card] = CIVILIZATION.cards;
  const [settle] = CIVILIZATION.settle;
  const sections = (campaign: Campaign): Civilization =>
    civilizationIn(CATALOGUE, campaign, CIVILIZATION_ID);

  const lessCard = removedFrom(CATALOGUE, opened, CIVILIZATION_ID, card);
  const lessSettle = removedFrom(CATALOGUE, lessCard, CIVILIZATION_ID, settle);

  expect(copiesIn(sections(lessCard).cards, card)).toBe(copiesIn(CIVILIZATION.cards, card) - 1);
  expect(sections(lessCard).settle).toEqual(CIVILIZATION.settle);
  expect(copiesIn(sections(lessSettle).settle, settle)).toBe(
    copiesIn(CIVILIZATION.settle, settle) - 1,
  );
  expect(lessSettle.collection).toEqual(opened.collection);

  const back = addedTo(
    CATALOGUE,
    addedTo(CATALOGUE, lessSettle, CIVILIZATION_ID, settle),
    CIVILIZATION_ID,
    card,
  );

  expect([...sections(back).settle].sort()).toEqual([...CIVILIZATION.settle].sort());
  expect([...sections(back).cards].sort()).toEqual([...CIVILIZATION.cards].sort());
  expect(back.collection).toEqual(opened.collection);
});

test('a copy one civilization holds is added to a second, and stands in both', () => {
  const campaign = withSecond();
  const [card] = CIVILIZATION.cards;

  const shared = addedTo(CATALOGUE, campaign, SECOND, card);
  const [number] = shared.civilizations[SECOND].cards;

  expect(civilizationIn(CATALOGUE, shared, SECOND).cards).toEqual([card]);
  expect(shared.civilizations[CIVILIZATION_ID]).toEqual(campaign.civilizations[CIVILIZATION_ID]);
  expect(shared.civilizations[CIVILIZATION_ID].cards).toContain(number);
});

test('a campaign edited by adds and removes across two civilizations writes as a save and reads back whole', () => {
  const [card] = CIVILIZATION.cards;
  const [settle] = CIVILIZATION.settle;
  let campaign = withSecond();
  campaign = addedTo(CATALOGUE, campaign, SECOND, card);
  campaign = addedTo(CATALOGUE, campaign, SECOND, settle);
  campaign = removedFrom(CATALOGUE, campaign, CIVILIZATION_ID, card);
  campaign = removedFrom(CATALOGUE, campaign, CIVILIZATION_ID, settle);

  expect(readSave(CATALOGUE, writeSave(CATALOGUE, campaign))).toEqual({ campaign, dropped: [] });
});

test('a card of which a civilization holds every copy owned is added to it no further, and a card it does not hold is removed from it no further', () => {
  const opened = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const [card] = CIVILIZATION.cards;
  let emptied = opened;
  for (let copy = 0; copy < copiesIn(CIVILIZATION.cards, card); copy++) {
    emptied = removedFrom(CATALOGUE, emptied, CIVILIZATION_ID, card);
  }

  expect(() => addedTo(CATALOGUE, opened, CIVILIZATION_ID, card)).toThrow(
    `fixture: the civilization ${CIVILIZATION_ID} holds every copy of ${card} the collection owns`,
  );
  expect(() => removedFrom(CATALOGUE, emptied, CIVILIZATION_ID, card)).toThrow(
    `fixture: the civilization ${CIVILIZATION_ID} holds no ${card}`,
  );
});
