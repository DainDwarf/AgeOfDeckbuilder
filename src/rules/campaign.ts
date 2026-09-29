import {
  achievementOf,
  type Catalogue,
  type Civilization,
  checkContent,
  civilizationOf,
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
};

/** Whether a technology is available; one the catalogue does not hold is refused. */
export function available(
  catalogue: Catalogue,
  technology: string,
  learned: readonly string[],
): boolean {
  if (learned.includes(technology)) return false;
  return technologyOf(catalogue, technology).needs.every((need) => learned.includes(need));
}

/**
 * The ages the campaign has reached, in the order of history: the first age, and every age a
 * technology it has learned unlocks. A technology the catalogue does not hold is refused.
 */
export function agesReached(catalogue: Catalogue, campaign: Campaign): string[] {
  const unlocked = new Set(
    campaign.technologies.flatMap((technology) => {
      const { age } = technologyOf(catalogue, technology).unlocks;
      return age === undefined ? [] : [age];
    }),
  );
  const first = firstAge(catalogue);
  return Object.keys(catalogue.ages).filter((age) => age === first || unlocked.has(age));
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
  if (!Object.hasOwn(campaign.civilizations, name)) {
    refuse(catalogue, `the campaign holds no civilization named ${name}`);
  }
  const { city, settle, cards } = campaign.civilizations[name];
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

/** What an ended chronicle paid into the campaign, and the campaign it left. */
export type Payment = {
  readonly campaign: Campaign;
  readonly influence: number;
  readonly achievements: readonly string[];
  readonly technologies: readonly string[];
  readonly entered: readonly CampaignCard[];
};

/**
 * An ended chronicle paid into the campaign, achievement by achievement in the chronicle's order. A
 * chronicle that has not ended, and an achievement reached whose technology is already learned, are
 * refused.
 */
export function paidInto(catalogue: Catalogue, campaign: Campaign, chronicle: Chronicle): Payment {
  checkContent(catalogue, chronicle);
  if (chronicle.ending === undefined)
    refuse(catalogue, 'a chronicle that has not ended pays nothing');
  let { technologies, influence, nextCard } = campaign;
  const achievements: string[] = [];
  const learned: string[] = [];
  const entered: CampaignCard[] = [];
  for (const { id, reached } of chronicle.achievements) {
    if (!reached) continue;
    const achievement = achievementOf(catalogue, chronicle.age, id);
    const { technology } = achievement;
    if (technologies.includes(technology)) {
      refuse(catalogue, `the achievement ${id} earns ${technology}, which is already learned`);
    }
    const ids = Object.entries(technologyOf(catalogue, technology).unlocks.cards).flatMap(
      ([card, copies]) => Array.from({ length: copies }, () => card),
    );
    const cards = dealt(nextCard, ids);
    achievements.push(id);
    learned.push(technology);
    entered.push(...cards.cards);
    technologies = [...technologies, technology];
    influence += achievement.influence;
    nextCard = cards.nextCard;
  }
  return {
    campaign: {
      ...campaign,
      technologies,
      influence,
      nextCard,
      collection: [...campaign.collection, ...entered],
    },
    influence: influence - campaign.influence,
    achievements,
    technologies: learned,
    entered,
  };
}
