import { achievementOf, type Catalogue, checkContent, deckOf, technologyOf } from './catalogue';
import { refuse } from './map-kinds';
import type { CardId, Chronicle, CitySection } from './state';

/**
 * A card the campaign owns: the number it was dealt, which no other card of the campaign ever takes,
 * and the content it is, by its id.
 */
export type CampaignCard = { readonly number: number; readonly id: CardId };

/**
 * The campaign's deck: its city section, holding its card as a card of its own outside the
 * collection, and its settle section and its cards, each naming cards of the collection by number.
 */
export type CampaignDeck = {
  readonly city: Omit<CitySection, 'card'> & { readonly card: CampaignCard };
  readonly settle: readonly number[];
  readonly cards: readonly number[];
};

/** The meta's progression: what the chronicles have paid into it, and the cards it owns. */
export type Campaign = {
  readonly technologies: readonly string[];
  readonly influence: number;
  /**
   * The number the next card dealt takes. It only counts up from one, so no number is dealt twice,
   * the city section's card's included.
   */
  readonly nextCard: number;
  readonly collection: readonly CampaignCard[];
  readonly deck: CampaignDeck;
};

/**
 * Whether a technology is within reach of the technologies unlocked: not unlocked itself, and needing
 * none that is not. A technology the catalogue does not hold is refused.
 */
export function withinReach(
  catalogue: Catalogue,
  technology: string,
  unlocked: readonly string[],
): boolean {
  if (unlocked.includes(technology)) return false;
  return technologyOf(catalogue, technology).needs.every((need) => unlocked.includes(need));
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
 * A campaign opened on a deck of the catalogue: nothing unlocked, no influence, and a card of its own
 * for each card the deck lists, the deck naming each in the section it came from.
 */
export function newCampaign(catalogue: Catalogue, deck: string): Campaign {
  const { city, settle, cards } = deckOf(catalogue, deck);
  const cityCard = dealt(FIRST_CARD_NUMBER, [city.card]);
  const settled = dealt(cityCard.nextCard, settle);
  const drawn = dealt(settled.nextCard, cards);
  const numbers = (owned: readonly CampaignCard[]): number[] => owned.map(({ number }) => number);
  return {
    technologies: [],
    influence: 0,
    nextCard: drawn.nextCard,
    collection: [...settled.cards, ...drawn.cards],
    deck: {
      city: { ...city, card: cityCard.cards[0] },
      settle: numbers(settled.cards),
      cards: numbers(drawn.cards),
    },
  };
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
 * chronicle that has not ended, and an achievement reached whose technology is already unlocked, are
 * refused.
 */
export function paidInto(catalogue: Catalogue, campaign: Campaign, chronicle: Chronicle): Payment {
  checkContent(catalogue, chronicle);
  if (chronicle.ending === undefined)
    refuse(catalogue, 'a chronicle that has not ended pays nothing');
  let { technologies, influence, nextCard } = campaign;
  const achievements: string[] = [];
  const unlocked: string[] = [];
  const entered: CampaignCard[] = [];
  for (const { id, reached } of chronicle.achievements) {
    if (!reached) continue;
    const achievement = achievementOf(catalogue, chronicle.age, id);
    const { technology } = achievement;
    if (technologies.includes(technology)) {
      refuse(catalogue, `the achievement ${id} earns ${technology}, which is already unlocked`);
    }
    const ids = Object.entries(technologyOf(catalogue, technology).unlocks.cards).flatMap(
      ([card, copies]) => Array.from({ length: copies }, () => card),
    );
    const cards = dealt(nextCard, ids);
    achievements.push(id);
    unlocked.push(technology);
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
    technologies: unlocked,
    entered,
  };
}
