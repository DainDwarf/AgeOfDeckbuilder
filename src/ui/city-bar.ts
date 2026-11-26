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
export function barShares(stock: number, threshold: number, turn: number | undefined): CityBar {
  if (stock >= threshold) return { held: 1, added: 0 };
  const reached = Math.min(stock + Math.max(turn ?? 0, 0), threshold);
  return { held: stock / threshold, added: (reached - stock) / threshold };
}

/**
 * The fewest ends of turn, each moving the stock by `turn`, after which it covers its threshold:
 * food's counted from one, growth being the end of turn's, culture's from none; nothing where none do.
 */
export function turnsLeft(
  stock: CityBarStock,
  held: number,
  threshold: number,
  turn: number,
): number | undefined {
  const from = fewestTurns(stock);
  if (held + from * turn >= threshold) return from;
  if (turn <= 0) return undefined;
  return Math.ceil((threshold - held) / turn);
}

/** The fewest ends of turn a stock's turns left count. */
function fewestTurns(stock: CityBarStock): number {
  switch (stock) {
    case 'food':
      return 1;
    case 'culture':
      return 0;
  }
}

/** The bar of the player's city's stock on the chronicle, moved by what ending the turn would, where it is read. */
export function cityBarOf(
  chronicle: Chronicle,
  stock: CityBarStock,
  turn: number | undefined,
): CityBar {
  return barShares(chronicle.resources[stock], thresholdOf(chronicle, stock), turn);
}
