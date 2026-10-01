/** What the launch screen computes before it draws: the choices it opens on and keeps, and each region's ring. */

import { agesReached, type Campaign } from '../rules/campaign';
import { ageOf, type Catalogue, firstRegion } from '../rules/catalogue';
import type { Region } from '../rules/map-kinds';
import type { Choices } from './save-entry';

/** How many hexagons stand around a region's middle one. */
export const RING = 6;

/**
 * The choices the launch screen opens on: the furthest age the campaign has reached, that age's
 * first region, and the campaign's first civilization.
 */
export function openingChoices(catalogue: Catalogue, campaign: Campaign): Choices {
  const age = agesReached(catalogue, campaign).at(-1);
  const [civilization] = Object.keys(campaign.civilizations);
  if (age === undefined || civilization === undefined) {
    throw new Error('the campaign has reached no age or owns no civilization');
  }
  return { age, region: firstRegion(catalogue, age), civilization };
}

/**
 * The choices with another age selected: the region kept where that age holds one of its name, and
 * the age's first region where it does not.
 */
export function withAge(catalogue: Catalogue, choices: Choices, age: string): Choices {
  const region = Object.hasOwn(ageOf(catalogue, age).regions, choices.region)
    ? choices.region
    : firstRegion(catalogue, age);
  return { ...choices, age, region };
}

/**
 * The age's regions in the row, each with the biomes of its cluster, the middle hexagon's first: read
 * from the region of its name in the first age, in the order of history, that holds one.
 */
export function clustersOf(
  catalogue: Catalogue,
  age: string,
): { region: string; biomes: string[] }[] {
  const ages = Object.values(catalogue.ages);
  return Object.entries(ageOf(catalogue, age).regions).map(([region, own]) => {
    const first =
      ages.find(({ regions }) => Object.hasOwn(regions, region))?.regions[region] ?? own;
    return { region, biomes: [first.centreBiome, ...ringOf(first)] };
  });
}

/**
 * The biome of each hexagon around the region's middle one, clockwise from the right, a biome's side
 * by side in the shares' order: one to each biome they name, the six largest at most, the rest one by
 * one to the largest share per hexagon it would hold, a tie to the larger share, then the first named.
 */
export function ringOf(region: Region): string[] {
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
