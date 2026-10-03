import {
  builds,
  discarded,
  firstRefusal,
  gained,
  healed,
  healthLost,
  inside,
  placesImprovement,
} from '../rules/cards';
import type { Age, Slice } from '../rules/catalogue';
import { terrainsPlayedOn, turnsPlaying } from '../rules/chronicle';
import { MOVE_POINT, tileAt } from '../rules/map';
import { followed, plays } from '../rules/stages';
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
      { feature: 'fertile', share: 0.05 },
      { feature: 'deer', share: 0.05 },
      { feature: 'cattle', share: 0.05 },
      { feature: 'flint', share: 0.1 },
      { feature: 'oasis', share: 0.05 },
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
      agriculture: {
        count: (_catalogue, chronicle) =>
          chronicle.held.filter((coord) => tileAt(chronicle.tiles, coord)?.terrain === 'plain')
            .length,
        need: 5,
        technology: 'agriculture',
        influence: 1,
      },
      trapping: {
        tallies: (_catalogue, _started, stages, tally) => {
          const hunts = plays(stages).filter(({ card }) => card === 'hunt').length;
          return hunts === 0 ? tally : { ...tally, hunts: (tally.hunts ?? 0) + hunts };
        },
        count: (_catalogue, _chronicle, tally) => tally.hunts ?? 0,
        need: 6,
        technology: 'trapping',
        influence: 1,
      },
      fire: { ...turnsPlaying(5), need: 3, technology: 'fire', influence: 1 },
      herbalism: {
        ...terrainsPlayedOn('gather'),
        need: 4,
        technology: 'herbalism',
        influence: 1,
      },
    },
  },
  brings: {
    cards: {
      farm: {
        kind: 'building',
        cost: { production: 4 },
        singleUse: true,
        ...builds('farm'),
      },
      trapping: { kind: 'instant', cost: { production: 2 }, ...placesImprovement('trapping') },
      fire: {
        kind: 'instant',
        cost: {},
        aim: 'hand',
        effect: (_catalogue, paid, at) =>
          followed(discarded(paid, [at]), (left) => gained(left, { science: 1 })),
      },
      heal: {
        kind: 'instant',
        cost: { food: 2 },
        aim: 'unit',
        refuses: (catalogue, chronicle, tile) =>
          firstRefusal(inside(chronicle, tile), healthLost(catalogue, chronicle, tile)),
        effect: (catalogue, paid, at) => healed(catalogue, paid, at),
      },
    },
    technologies: {
      agriculture: { needs: ['settlement'], unlocks: { cards: { farm: 1 } } },
      trapping: { needs: ['settlement'], unlocks: { cards: { trapping: 1 } } },
      fire: { needs: ['settlement'], unlocks: { cards: { fire: 1 } } },
      herbalism: { needs: ['settlement'], unlocks: { cards: { heal: 1 } } },
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
    buildings: {
      farm: { terrains: ['plain'], yields: { food: 2 } },
    },
    improvements: {
      trapping: { terrains: ['forest'], feature: 'deer', yields: { food: 1 } },
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
