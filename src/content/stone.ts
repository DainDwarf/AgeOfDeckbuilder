import type { Age, Slice } from '../rules/catalogue';
import { NOMADIC } from './nomadic';

const { basePrice, schedule, camp } = NOMADIC.owns;

const REGIONS: Age['regions'] = {
  temperate: {
    radius: 12,
    centre: 3,
    tilesPerBiome: 30,
    centreBiome: 'heartland',
    biomeShares: [
      { biome: 'sea', share: 0.2 },
      { biome: 'mountain', share: 0.1 },
      { biome: 'woodland', share: 0.1 },
      { biome: 'land', share: 0.6 },
    ],
    featureShares: [
      { feature: 'fertile', share: 0.1 },
      { feature: 'wildlife', share: 0.1 },
      { feature: 'flint', share: 0.1 },
    ],
    camps: 6,
    campFromCentre: 7,
    campsApart: 4,
    rivers: {
      source: 'mountain',
      relief: 1,
      roughness: 0.5,
      perRange: 2,
      climb: 0.5,
      meander: 1.5,
      curl: 0.75,
      edgesPerTile: 4,
      leastEdges: 6,
      draws: 60,
    },
  },
};

/** The Stone Age: what it owns, and what it brings to the tables every age shares. */
export const STONE: Slice = {
  id: 'stone',
  owns: {
    basePrice,
    schedule: {
      spacing: [6, 9],
      capstone: { id: schedule.capstone.id, window: [26, 34] },
      entries: schedule.entries,
    },
    camp,
    regions: REGIONS,
    achievements: {},
  },
  brings: {},
};
