import { discarded, gained } from '../rules/cards';
import type { Age, Slice } from '../rules/catalogue';
import { turnsPlaying } from '../rules/chronicle';
import { MOVE_POINT } from '../rules/map';
import { followed } from '../rules/stages';
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
      { biome: 'desert', share: 0.07, keepsAwayFrom: ['sea'] },
      { biome: 'land', share: 0.53 },
    ],
    featureShares: [
      { feature: 'fertile', share: 0.1 },
      { feature: 'wildlife', share: 0.1 },
      { feature: 'flint', share: 0.1 },
      { feature: 'oasis', share: 0.1 },
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
    achievements: {
      fire: { ...turnsPlaying(5), need: 3, technology: 'fire', influence: 1 },
    },
  },
  brings: {
    cards: {
      fire: {
        kind: 'instant',
        cost: {},
        aim: 'hand',
        effect: (_catalogue, paid, at) =>
          followed(discarded(paid, [at]), (left) => gained(left, { science: 1 })),
      },
    },
    technologies: {
      fire: { needs: ['settlement'], unlocks: { cards: { fire: 1 } } },
    },
    terrains: {
      desert: {
        yields: {},
        movementCost: MOVE_POINT,
        water: false,
        elevation: 0,
        river: { food: 1 },
      },
    },
    features: {
      oasis: { terrain: 'desert', yields: { food: 1 } },
    },
    biomes: {
      desert: {
        origin: 'desert',
        interior: { desert: 0.9, hills: 0.1 },
        rim: { desert: 0.9, hills: 0.1 },
        rimWidths: [1],
        growth: { kind: 'weight', weight: 1 },
        compactness: 1,
      },
    },
  },
};
