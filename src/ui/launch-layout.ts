/** What the launch screen computes before it draws: the choices it keeps, and each region's ring. */

import { type Campaign, type Choices, regionsReached } from '../rules/campaign';
import { ageOf, type Catalogue } from '../rules/catalogue';
import type { MapRegion } from '../rules/map-kinds';

/** How many hexagons stand around a region's middle one. */
export const RING = 6;

/**
 * The choices with another age selected: the region kept where that age holds one of its name, and
 * the first region of that age the campaign has reached where it does not.
 */
export function withAge(
  catalogue: Catalogue,
  campaign: Campaign,
  choices: Choices,
  age: string,
): Choices {
  const region = Object.hasOwn(ageOf(catalogue, age).regions, choices.region)
    ? choices.region
    : regionsReached(catalogue, campaign, age)[0];
  return { ...choices, age, region };
}

/**
 * The age's regions in the row, each with whether the campaign has reached it and the biomes of its
 * cluster, the middle hexagon's first: read from the region of its name in the first age, in the order
 * of history, that holds one.
 */
export function clustersOf(
  catalogue: Catalogue,
  campaign: Campaign,
  age: string,
): { region: string; reached: boolean; biomes: string[] }[] {
  const ages = Object.values(catalogue.ages);
  const reached = regionsReached(catalogue, campaign, age);
  return Object.entries(ageOf(catalogue, age).regions).map(([region, own]) => {
    const first =
      ages.find(({ regions }) => Object.hasOwn(regions, region))?.regions[region] ?? own;
    return {
      region,
      reached: reached.includes(region),
      biomes: [first.centreBiome, ...ringOf(first)],
    };
  });
}

/**
 * The biome of each hexagon around the region's middle one, clockwise from the right, a biome's side
 * by side in the shares' order: one to each biome they name, the six largest at most, the rest one by
 * one to the largest share per hexagon it would hold, a tie to the larger share, then the first named.
 */
export function ringOf(region: MapRegion): string[] {
  const shares: { biome: string; share: number }[] = [];
  for (const { biome, share } of region.biomeShares) {
    const named = shares.find((held) => held.biome === biome);
    if (named === undefined) shares.push({ biome, share });
    else named.share += share;
  }
  if (shares.length === 0) return Array<string>(RING).fill(region.centreBiome);

  // Shares are decimals: a tie is read within a hair, or 0.6 / 3 loses to 0.2 / 1.
  const ahead = (a: number, b: number): number => (Math.abs(a - b) < 1e-9 ? 0 : a - b);
  const drawn = shares
    .map((held, named) => ({ ...held, named }))
    .sort((a, b) => ahead(b.share, a.share) || a.named - b.named)
    .slice(0, RING)
    .map((held) => ({ ...held, hexagons: 1 }));
  for (let left = RING - drawn.length; left > 0; left--) {
    // `drawn` runs from the larger share, then the first named, so a tie keeps the earlier.
    const next = drawn.reduce((best, held) =>
      ahead(held.share / (held.hexagons + 1), best.share / (best.hexagons + 1)) > 0 ? held : best,
    );
    next.hexagons++;
  }
  return drawn
    .sort((a, b) => a.named - b.named)
    .flatMap(({ biome, hexagons }) => Array<string>(hexagons).fill(biome));
}
