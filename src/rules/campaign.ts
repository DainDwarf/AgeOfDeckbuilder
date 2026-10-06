import {
  achievementOf,
  ageOf,
  type Catalogue,
  type Civilization,
  cardAge,
  cardOf,
  checkContent,
  civilizationOf,
  earningOf,
  firstAge,
  technologyOf,
} from './catalogue';
import { refuse } from './map-kinds';
import type { CardId, Chronicle, CitySection } from './state';

/**
 * A card the campaign owns: the number it was dealt, which no other card of the campaign ever takes,
 * and the content it is, by its id.
 */
export type CampaignCard = { readonly number: number; readonly id: CardId };

/**
 * A civilization the campaign owns: its city section, holding its card as a card of its own outside
 * the collection, and its settle section and its cards, each naming cards of the collection by number.
 */
export type CampaignCivilization = {
  readonly city: Omit<CitySection, 'card'> & { readonly card: CampaignCard };
  readonly settle: readonly number[];
  readonly cards: readonly number[];
};

/** The meta's progression: what the chronicles have paid into it, the cards it owns and its civilizations. */
export type Campaign = {
  readonly technologies: readonly string[];
  readonly influence: number;
  /**
   * The number the next card dealt takes. It only counts up from one, so no number is dealt twice,
   * a city section's card's included.
   */
  readonly nextCard: number;
  readonly collection: readonly CampaignCard[];
  /** The civilizations the campaign owns, by name; it never holds none. */
  readonly civilizations: Readonly<Record<string, CampaignCivilization>>;
  /** The technology the campaign pins, where it pins one. */
  readonly pin?: string;
};

/** A technology the catalogue does not hold is refused. */
export function available(
  catalogue: Catalogue,
  technology: string,
  learned: readonly string[],
): boolean {
  if (learned.includes(technology)) return false;
  return technologyOf(catalogue, technology).needs.every((need) => learned.includes(need));
}

/**
 * What keeps a technology from being available beside the technologies learned, named as what it is,
 * and nothing for an available technology.
 */
export function unavailable(
  catalogue: Catalogue,
  technology: string,
  learned: readonly string[],
): string | undefined {
  if (!Object.hasOwn(catalogue.technologies, technology)) return `no technology ${technology}`;
  if (learned.includes(technology)) return `the learned technology ${technology}`;
  return available(catalogue, technology, learned)
    ? undefined
    : `the unknown technology ${technology}`;
}

/** The campaign pinning the technology, in place of any it pinned; one not available is refused. */
export function pinned(catalogue: Catalogue, campaign: Campaign, technology: string): Campaign {
  const misfit = unavailable(catalogue, technology, campaign.technologies);
  if (misfit !== undefined) refuse(catalogue, `the pin names ${misfit}`);
  return { ...campaign, pin: technology };
}

/** The campaign pinning nothing. */
export function unpinned(campaign: Campaign): Campaign {
  const { pin: _, ...rest } = campaign;
  return rest;
}

/** The ages or the regions those technologies unlock; a technology the catalogue does not hold is refused. */
function unlockedBy(
  catalogue: Catalogue,
  technologies: readonly string[],
  noun: 'age' | 'region',
): Set<string> {
  return new Set(
    technologies.flatMap((technology) => {
      const unlocked = technologyOf(catalogue, technology).unlocks[noun];
      return unlocked === undefined ? [] : [unlocked];
    }),
  );
}

/**
 * The ages the campaign has reached, in the order of history: the first age, and every age a
 * technology it has learned unlocks. A technology the catalogue does not hold is refused.
 */
export function agesReached(catalogue: Catalogue, campaign: Campaign): string[] {
  const unlocked = unlockedBy(catalogue, campaign.technologies, 'age');
  const first = firstAge(catalogue);
  return Object.keys(catalogue.ages).filter((age) => age === first || unlocked.has(age));
}

/**
 * The regions of the age the campaign has reached, in the order the age lists them: every region no
 * technology unlocks, and every region a technology it has learned unlocks by its name. An age the
 * catalogue does not hold is refused.
 */
export function regionsReached(catalogue: Catalogue, campaign: Campaign, age: string): string[] {
  const unlockable = unlockedBy(catalogue, Object.keys(catalogue.technologies), 'region');
  const unlocked = unlockedBy(catalogue, campaign.technologies, 'region');
  return Object.keys(ageOf(catalogue, age).regions).filter(
    (region) => !unlockable.has(region) || unlocked.has(region),
  );
}

/** The number a campaign's first card is dealt. */
export const FIRST_CARD_NUMBER = 1;

/** New cards dealt the next numbers, in order, and the number the card after them takes. */
export function dealt(
  nextCard: number,
  ids: readonly CardId[],
): { readonly cards: CampaignCard[]; readonly nextCard: number } {
  return {
    cards: ids.map((id, at) => ({ number: nextCard + at, id })),
    nextCard: nextCard + ids.length,
  };
}

/**
 * A campaign opened on a civilization of the catalogue: nothing learned, no influence, and the one
 * civilization, named as the catalogue's, with a card of its own for each card the catalogue's lists,
 * naming each in the section it came from.
 */
export function newCampaign(catalogue: Catalogue, civilization: string): Campaign {
  const { city, settle, cards } = civilizationOf(catalogue, civilization);
  const cityCard = dealt(FIRST_CARD_NUMBER, [city.card]);
  const settled = dealt(cityCard.nextCard, settle);
  const drawn = dealt(settled.nextCard, cards);
  const numbers = (owned: readonly CampaignCard[]): number[] => owned.map(({ number }) => number);
  return {
    technologies: [],
    influence: 0,
    nextCard: drawn.nextCard,
    collection: [...settled.cards, ...drawn.cards],
    civilizations: {
      [civilization]: {
        city: { ...city, card: cityCard.cards[0] },
        settle: numbers(settled.cards),
        cards: numbers(drawn.cards),
      },
    },
  };
}

/**
 * The campaign's civilization of that name as a chronicle is launched on it: its city section, and
 * each card of its sections by id, in the section's order. A name the campaign does not hold, and a
 * number naming no card of the collection, are refused.
 */
export function civilizationIn(
  catalogue: Catalogue,
  campaign: Campaign,
  name: string,
): Civilization {
  const { city, settle, cards } = heldCivilization(catalogue, campaign, name);
  const owned = new Map(campaign.collection.map(({ number, id }) => [number, id]));
  const ids = (numbers: readonly number[]): CardId[] =>
    numbers.map((number) => {
      const id = owned.get(number);
      if (id === undefined) {
        refuse(
          catalogue,
          `the civilization ${name} names no card of the collection numbered ${number}`,
        );
      }
      return id;
    });
  return { city: { ...city, card: city.card.id }, settle: ids(settle), cards: ids(cards) };
}

/** The campaign's civilization of that name; a name the campaign does not hold is refused. */
function heldCivilization(
  catalogue: Catalogue,
  campaign: Campaign,
  name: string,
): CampaignCivilization {
  if (!Object.hasOwn(campaign.civilizations, name)) {
    refuse(catalogue, `the campaign holds no civilization named ${name}`);
  }
  return campaign.civilizations[name];
}

/**
 * The price of a card of the collection: the base price of the card's age, doubled for every copy
 * the collection owns past the first. A card it owns no copy of is refused.
 */
export function priceOf(catalogue: Catalogue, campaign: Campaign, card: CardId): number {
  const copies = campaign.collection.filter(({ id }) => id === card).length;
  if (copies === 0) refuse(catalogue, `the collection owns no copy of ${card}`);
  return ageOf(catalogue, cardAge(catalogue, card)).basePrice * 2 ** (copies - 1);
}

/**
 * Whether a card of the collection is unaffordable: its price is more than the influence. A card the
 * collection owns no copy of is refused.
 */
export function unaffordableIn(catalogue: Catalogue, campaign: Campaign, card: CardId): boolean {
  return priceOf(catalogue, campaign, card) > campaign.influence;
}

/**
 * The campaign with one more copy of the card bought: its price paid out of the influence, and the
 * copy dealt into the collection, in no section of any civilization. An unaffordable card, and a card
 * the collection owns no copy of, are refused.
 */
export function bought(catalogue: Catalogue, campaign: Campaign, card: CardId): Campaign {
  const price = priceOf(catalogue, campaign, card);
  if (unaffordableIn(catalogue, campaign, card)) {
    refuse(
      catalogue,
      `the influence ${campaign.influence} does not cover the price ${price} of ${card}`,
    );
  }
  const copy = dealt(campaign.nextCard, [card]);
  return {
    ...campaign,
    influence: campaign.influence - price,
    nextCard: copy.nextCard,
    collection: [...campaign.collection, ...copy.cards],
  };
}

/** The section of a civilization a card stands in. */
function sectionOf(catalogue: Catalogue, card: CardId): 'settle' | 'cards' {
  const { kind } = cardOf(catalogue, card);
  switch (kind) {
    case 'settle':
      return 'settle';
    case 'unit':
    case 'building':
    case 'instant':
    case 'hazard':
      return 'cards';
  }
}

/** The campaign with the civilization of that name standing as handed. */
function withCivilization(
  campaign: Campaign,
  name: string,
  civilization: CampaignCivilization,
): Campaign {
  return { ...campaign, civilizations: { ...campaign.civilizations, [name]: civilization } };
}

/**
 * The campaign with a copy of the card its civilization of that name does not hold, whatever another
 * holds, added to its section. A card it holds every copy of is refused.
 */
export function addedTo(
  catalogue: Catalogue,
  campaign: Campaign,
  name: string,
  card: CardId,
): Campaign {
  const civilization = heldCivilization(catalogue, campaign, name);
  const section = sectionOf(catalogue, card);
  const holds = new Set([...civilization.settle, ...civilization.cards]);
  const free = campaign.collection.find(({ number, id }) => id === card && !holds.has(number));
  if (free === undefined) {
    refuse(catalogue, `the civilization ${name} holds every copy of ${card} the collection owns`);
  }
  return withCivilization(campaign, name, {
    ...civilization,
    [section]: [...civilization[section], free.number],
  });
}

/**
 * The campaign with a copy of the card removed from its civilization of that name, out of the
 * section it stands in. A card the civilization does not hold is refused.
 */
export function removedFrom(
  catalogue: Catalogue,
  campaign: Campaign,
  name: string,
  card: CardId,
): Campaign {
  const civilization = heldCivilization(catalogue, campaign, name);
  const section = sectionOf(catalogue, card);
  const owned = new Map(campaign.collection.map(({ number, id }) => [number, id]));
  const at = civilization[section].findIndex((number) => owned.get(number) === card);
  if (at === -1) refuse(catalogue, `the civilization ${name} holds no ${card}`);
  return withCivilization(campaign, name, {
    ...civilization,
    [section]: civilization[section].filter((_, index) => index !== at),
  });
}

/**
 * The campaign with the technology learned: the cards it unlocks dealt into the collection with their
 * copies, in no section of any civilization, the influence of the achievement that earns it added,
 * and the pin taken off it. A technology that is not available is refused.
 */
export function learnedInto(
  catalogue: Catalogue,
  campaign: Campaign,
  technology: string,
): Campaign {
  const misfit = unavailable(catalogue, technology, campaign.technologies);
  if (misfit !== undefined) refuse(catalogue, `the campaign learns ${misfit}`);
  const ids = Object.entries(technologyOf(catalogue, technology).unlocks.cards).flatMap(
    ([card, copies]) => Array.from({ length: copies }, () => card),
  );
  const cards = dealt(campaign.nextCard, ids);
  const learned: Campaign = {
    ...campaign,
    technologies: [...campaign.technologies, technology],
    influence: campaign.influence + earningOf(catalogue, technology).achievement.influence,
    nextCard: cards.nextCard,
    collection: [...campaign.collection, ...cards.cards],
  };
  return learned.pin === technology ? unpinned(learned) : learned;
}

/** What an ended chronicle paid into the campaign, and the campaign it left. */
export type Payment = {
  readonly campaign: Campaign;
  readonly influence: number;
  readonly achievements: readonly string[];
  readonly technologies: readonly string[];
  readonly entered: readonly CampaignCard[];
};

/**
 * An ended chronicle paid into the campaign, the technology of each achievement it reached learned in
 * the chronicle's order. A chronicle that has not ended, and an achievement reached whose technology
 * is not available, are refused.
 */
export function paidInto(catalogue: Catalogue, campaign: Campaign, chronicle: Chronicle): Payment {
  checkContent(catalogue, chronicle);
  if (chronicle.ending === undefined)
    refuse(catalogue, 'a chronicle that has not ended pays nothing');
  let paid = campaign;
  const achievements: string[] = [];
  const learned: string[] = [];
  for (const { id, reached } of chronicle.achievements) {
    if (!reached) continue;
    const { technology } = achievementOf(catalogue, chronicle.age, id);
    if (paid.technologies.includes(technology)) {
      refuse(catalogue, `the achievement ${id} earns ${technology}, which is already learned`);
    }
    paid = learnedInto(catalogue, paid, technology);
    achievements.push(id);
    learned.push(technology);
  }
  return {
    campaign: paid,
    influence: paid.influence - campaign.influence,
    achievements,
    technologies: learned,
    entered: paid.collection.slice(campaign.collection.length),
  };
}
