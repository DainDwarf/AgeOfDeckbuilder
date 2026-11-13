import { cultureThreshold, growthThreshold } from '../rules/city';
import type { Chronicle } from '../rules/state';

/** A stock the player's city reads against a threshold of its own. */
export type CityBarStock = 'food' | 'culture';

/** The stocks the player's city wears a bar of. */
export const CITY_BAR_STOCKS: readonly CityBarStock[] = ['food', 'culture'];

/** The threshold the player's city's stock stands against: the food stock the growth threshold, the culture stock the culture threshold. */
export function thresholdOf(chronicle: Chronicle, stock: CityBarStock): number {
  switch (stock) {
    case 'food':
      return growthThreshold(chronicle, 'player');
    case 'culture':
      return cultureThreshold(chronicle, 'player');
  }
}

/**
 * What a city's bar shows, each as a share of the bar's length: the stock it holds of its threshold,
 * and past it what ending the turn would add.
 */
export type CityBar = {
  readonly held: number;
  readonly added: number;
};

/**
 * The bar of a stock against its threshold, with what ending the turn would move it by where the
 * turn is read: full from the threshold on, and the turn's part stopping at the bar's end; a turn
 * read as taking, or none read, adds nothing.
 */
export function cityBarOf(stock: number, threshold: number, turn: number | undefined): CityBar {
  if (stock >= threshold) return { held: 1, added: 0 };
  const reached = Math.min(stock + Math.max(turn ?? 0, 0), threshold);
  return { held: stock / threshold, added: (reached - stock) / threshold };
}
