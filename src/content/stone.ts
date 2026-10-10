import {
  builds,
  discarded,
  disembarks,
  embarks,
  enters,
  firstRefusal,
  gained,
  healed,
  healthLost,
  inside,
  placesImprovement,
} from '../rules/cards';
import type { Age, Slice } from '../rules/catalogue';
import {
  drawPileEmptied,
  enemiesKilledBy,
  gainedFrom,
  playsOn,
  terrainsPlayedOn,
  turnsPlaying,
} from '../rules/chronicle';
import { distance, MOVE_POINT, tileAt } from '../rules/map';
import type { RiverFlow } from '../rules/map-kinds';
import { showsNextLanding } from '../rules/schedule';
import { followed } from '../rules/stages';
import { NOMADIC } from './nomadic';
import { PILLAGER } from './scripts';

const { basePrice, schedule, camp } = NOMADIC.owns;

const NOMADIC_BIOMES = NOMADIC.brings.biomes;
if (NOMADIC_BIOMES === undefined) throw new Error('the Nomadic Age brings no biome');
const { land, sea } = NOMADIC_BIOMES;

const RIVERS: RiverFlow = {
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
};

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
    sites: ['painted-cave', 'old-cairn', 'beast-bones'],
    siteFromCentre: 7,
    sitesApart: 4,
    rivers: RIVERS,
  },
  archipelago: {
    radius: 12,
    centre: 3,
    tilesPerBiome: 25,
    centreBiome: 'heartland',
    biomeShares: [
      { biome: 'island', share: 0.5 },
      { biome: 'open-sea', share: 0.33 },
      { biome: 'shallows', share: 0.17 },
    ],
    featureShares: [
      { feature: 'fertile', share: 0.05 },
      { feature: 'deer', share: 0.05 },
      { feature: 'cattle', share: 0.05 },
      { feature: 'flint', share: 0.1 },
    ],
    camps: 6,
    campFromCentre: 7,
    campsApart: 4,
    sites: ['painted-cave', 'old-cairn', 'beast-bones'],
    siteFromCentre: 7,
    sitesApart: 4,
    rivers: RIVERS,
  },
};

/** The move a unit has embarked: the Embark card's and the camp's enemies' alike. */
const EMBARKED_MOVE = MOVE_POINT;

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
    camp: {
      ...camp,
      building: 'stone-camp',
      opening: [{ kind: 'warrior', script: 'guard', weight: 1 }],
      roll: [
        { kind: 'archer', script: 'guard', weight: 2 },
        { kind: 'warrior', script: 'guard', weight: 3 },
        { kind: 'warrior', script: 'pillager', weight: 1 },
      ],
      odds: 0.08,
      acrossWater: true,
      embarkedMove: EMBARKED_MOVE,
      wave: { gathered: 3, sent: 2 },
    },
    sites: {
      'painted-cave': {
        building: 'stone-painted-cave',
        rewards: ['stone-cave-paintings', 'old-stories'],
      },
      'old-cairn': {
        building: 'stone-old-cairn',
        rewards: ['stone-honour-the-dead', 'dig-the-graves'],
      },
      'beast-bones': {
        building: 'stone-beast-bones',
        rewards: ['stone-bone-carvings', 'bone-tools'],
      },
    },
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
      pottery: {
        ...gainedFrom('production', 'hills'),
        need: 50,
        technology: 'pottery',
        influence: 1,
      },
      calendar: { ...drawPileEmptied(), need: 12, technology: 'calendar', influence: 1 },
      bread: {
        count: (_catalogue, chronicle) => chronicle.population,
        need: 12,
        technology: 'bread',
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
      raft: {
        count: (_catalogue, chronicle) =>
          chronicle.snapshots.filter((snapshot) => snapshot.tile.terrain === 'coast').length,
        need: 30,
        technology: 'raft',
        influence: 1,
      },
      megalith: {
        count: (_catalogue, chronicle) => {
          const { city } = chronicle;
          if (city === undefined) return 0;
          return Math.max(...chronicle.held.map((coord) => distance(coord, city)));
        },
        need: 5,
        technology: 'megalith',
        influence: 1,
      },
      bartering: {
        count: (_catalogue, chronicle) => chronicle.resources.money,
        need: 30,
        technology: 'bartering',
        influence: 1,
      },
      fishing: {
        ...gainedFrom('food', 'coast'),
        need: 50,
        technology: 'fishing',
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
    scripts: { pillager: PILLAGER },
    cards: {
      farm: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('farm'),
      },
      trapping: { kind: 'action', cost: { production: 2 }, ...placesImprovement('trapping') },
      irrigation: { kind: 'action', cost: { production: 2 }, ...placesImprovement('irrigation') },
      pasture: { kind: 'action', cost: { production: 2 }, ...placesImprovement('pasture') },
      archer: { kind: 'unit', cost: { military: 2 }, ...enters('archer') },
      'clay-pit': { kind: 'action', cost: { production: 2 }, ...placesImprovement('clay-pit') },
      calendar: { kind: 'instant', cost: { science: 2 }, ...showsNextLanding() },
      bread: {
        kind: 'instant',
        cost: { food: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 2 }),
      },
      tannery: {
        kind: 'building',
        cost: { production: 4 },
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
      embark: {
        kind: 'action',
        cost: { production: 1 },
        becomes: 'disembark',
        ...embarks(EMBARKED_MOVE),
      },
      disembark: { kind: 'action', cost: {}, becomes: 'embark', ...disembarks() },
      'food-trade': {
        kind: 'instant',
        cost: { money: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { food: 3 }),
      },
      'goods-trade': {
        kind: 'instant',
        cost: { money: 2 },
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { production: 3 }),
      },
      fishery: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('fishery'),
      },
      megalith: {
        kind: 'building',
        cost: { production: 4 },
        ...builds('megalith'),
      },
      'stone-cave-paintings': {
        kind: 'instant',
        cost: {},
        banish: true,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'old-stories': {
        kind: 'instant',
        cost: {},
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 1 }),
      },
      'stone-honour-the-dead': {
        kind: 'instant',
        cost: {},
        banish: true,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'dig-the-graves': {
        kind: 'instant',
        cost: {},
        banish: true,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { money: 4 }),
      },
      'stone-bone-carvings': {
        kind: 'instant',
        cost: {},
        banish: true,
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { culture: 4 }),
      },
      'bone-tools': {
        kind: 'instant',
        cost: {},
        aim: 'none',
        effect: (_catalogue, paid) => gained(paid, { production: 2 }),
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
      pottery: { needs: ['fire'], unlocks: { cards: { 'clay-pit': 1 } } },
      calendar: { needs: ['irrigation'], unlocks: { cards: { calendar: 1 } } },
      bread: { needs: ['irrigation'], unlocks: { cards: { bread: 1 } } },
      tanning: { needs: ['domestication'], unlocks: { cards: { tannery: 1 } } },
      raft: {
        needs: ['bow-and-arrow'],
        unlocks: { cards: { embark: 1 }, region: 'archipelago' },
      },
      megalith: { needs: ['calendar'], unlocks: { cards: { megalith: 1 } } },
      bartering: {
        needs: ['tanning', 'bread'],
        unlocks: { cards: { 'food-trade': 1, 'goods-trade': 1 } },
      },
      fishing: { needs: ['raft'], unlocks: { cards: { fishery: 1 } } },
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
      village: {
        terrains: ['plain', 'forest', 'hills', 'desert'],
        yields: { military: 1, culture: 1 },
      },
      'stone-camp': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
      farm: { terrains: ['plain'], yields: { food: 2 } },
      tannery: {
        terrains: ['forest', 'plain'],
        features: ['deer', 'cattle'],
        yields: { money: 2 },
      },
      fishery: {
        terrains: ['coast'],
        yields: {},
        givesBeside: { terrain: 'coast', yields: { food: 1 } },
      },
      megalith: { terrains: ['plain', 'hills', 'desert'], yields: { culture: 1 } },
      'stone-painted-cave': { terrains: ['hills'], yields: {} },
      'stone-old-cairn': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
      'stone-beast-bones': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
    },
    improvements: {
      trapping: { terrains: ['forest'], features: ['deer'], yields: { food: 1 } },
      irrigation: { terrains: ['plain', 'desert'], river: true, yields: { food: 1 } },
      pasture: { terrains: ['plain'], features: ['cattle'], yields: { food: 1 } },
      'clay-pit': { terrains: ['hills'], yields: { production: 1 } },
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
      island: {
        origin: 'plain',
        interior: land.interior,
        rim: land.rim,
        rimWidths: [1],
        growth: { kind: 'size', size: 8 },
        compactness: 2,
      },
      'open-sea': {
        origin: 'ocean',
        interior: { ocean: 1 },
        rim: { coast: 1 },
        rimWidths: sea.rimWidths,
        growth: sea.growth,
        compactness: 0,
      },
      shallows: {
        origin: 'coast',
        interior: { coast: 1 },
        rim: { coast: 1 },
        rimWidths: [1],
        growth: { kind: 'weight', weight: 1 },
        compactness: -3,
      },
    },
  },
};
