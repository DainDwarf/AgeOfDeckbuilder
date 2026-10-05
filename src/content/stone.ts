import {
  builds,
  discarded,
  enters,
  firstRefusal,
  gained,
  healed,
  healthLost,
  inside,
  placesImprovement,
} from '../rules/cards';
import type { Age, Slice } from '../rules/catalogue';
import { enemiesKilledBy, playsOn, terrainsPlayedOn, turnsPlaying } from '../rules/chronicle';
import { MOVE_POINT, tileAt } from '../rules/map';
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
      herbalism: {
        ...terrainsPlayedOn('gather'),
        need: 4,
        technology: 'herbalism',
        influence: 1,
      },
      agriculture: {
        count: (_catalogue, chronicle) =>
          chronicle.held.filter((coord) => tileAt(chronicle.tiles, coord)?.terrain === 'plain')
            .length,
        need: 5,
        technology: 'agriculture',
        influence: 1,
      },
      trapping: {
        ...playsOn('hunt', { on: 'anywhere' }),
        need: 6,
        technology: 'trapping',
        influence: 1,
      },
      fire: { ...turnsPlaying(5), need: 3, technology: 'fire', influence: 1 },
      irrigation: {
        ...playsOn('farm', { on: 'river' }),
        need: 2,
        technology: 'irrigation',
        influence: 1,
      },
      domestication: {
        ...playsOn('gather', { on: 'feature', feature: 'cattle' }),
        need: 10,
        technology: 'domestication',
        influence: 1,
      },
      'bow-and-arrow': {
        ...enemiesKilledBy('scout'),
        need: 3,
        technology: 'bow-and-arrow',
        influence: 1,
      },
      tanning: {
        count: (_catalogue, chronicle) =>
          chronicle.held.filter((coord) =>
            tileAt(chronicle.tiles, coord)?.improvements.some(
              (improvement) => improvement === 'pasture' || improvement === 'trapping',
            ),
          ).length,
        need: 2,
        technology: 'tanning',
        influence: 1,
      },
    },
  },
  brings: {
    units: {
      archer: {
        type: 'archer',
        worker: false,
        health: 3,
        damage: 2,
        range: 2,
        move: 2 * MOVE_POINT,
        action: 1,
        sight: 2,
      },
    },
    cards: {
      farm: {
        kind: 'building',
        cost: { production: 4 },
        singleUse: true,
        ...builds('farm'),
      },
      trapping: { kind: 'instant', cost: { production: 2 }, ...placesImprovement('trapping') },
      irrigation: { kind: 'instant', cost: { production: 2 }, ...placesImprovement('irrigation') },
      pasture: { kind: 'instant', cost: { production: 2 }, ...placesImprovement('pasture') },
      archer: { kind: 'unit', cost: { military: 2 }, ...enters('archer') },
      tannery: {
        kind: 'building',
        cost: { production: 4 },
        singleUse: true,
        ...builds('tannery'),
      },
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
      herbalism: { needs: ['settlement'], unlocks: { cards: { heal: 1 } } },
      agriculture: { needs: ['settlement'], unlocks: { cards: { farm: 1 } } },
      trapping: { needs: ['settlement'], unlocks: { cards: { trapping: 1 } } },
      fire: { needs: ['settlement'], unlocks: { cards: { fire: 1 } } },
      irrigation: { needs: ['agriculture', 'herbalism'], unlocks: { cards: { irrigation: 1 } } },
      domestication: { needs: ['trapping', 'agriculture'], unlocks: { cards: { pasture: 1 } } },
      'bow-and-arrow': { needs: ['trapping'], unlocks: { cards: { archer: 1 } } },
      tanning: { needs: ['domestication'], unlocks: { cards: { tannery: 1 } } },
    },
    terrains: {
      desert: {
        yields: {},
        movementCost: MOVE_POINT,
        water: false,
        elevation: 0,
      },
    },
    features: {
      oasis: { terrain: 'desert', yields: { food: 1 } },
    },
    buildings: {
      farm: { terrains: ['plain'], yields: { food: 2 } },
      tannery: {
        terrains: ['forest', 'plain'],
        features: ['deer', 'cattle'],
        yields: { money: 2 },
      },
    },
    improvements: {
      trapping: { terrains: ['forest'], features: ['deer'], yields: { food: 1 } },
      irrigation: { terrains: ['plain', 'desert'], river: true, yields: { food: 1 } },
      pasture: { terrains: ['plain'], features: ['cattle'], yields: { food: 1 } },
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
