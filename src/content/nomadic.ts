import {
  builds,
  enters,
  entersOn,
  featureAmong,
  featureRemoved,
  firstRefusal,
  gained,
  made,
  movePointsSpent,
  outside,
  refreshed,
  settled,
  slotFree,
  throughWorker,
} from '../rules/cards';
import type { Age, Schedule, Slice, Tables, UnitEntryTable } from '../rules/catalogue';
import { endedInVictory } from '../rules/chronicle';
import { arrived, shocked, yielded } from '../rules/city';
import { raided, rowsDrawn } from '../rules/enemies';
import { MOVE_POINT } from '../rules/map';
import { buildingKind } from '../rules/map-kinds';
import {
  addedToDrawPileTop,
  campPlaceable,
  featureDealtNear,
  guardedCampPlaced,
  tileCharted,
} from '../rules/schedule';
import { followed, unchanged } from '../rules/stages';
import { guarding, RAIDER } from './scripts';

/** How many enemies a raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

function hungerFood(turn: number): number {
  return 2 + Math.floor(turn / 10);
}

function wildfireTakes(turn: number): number {
  return 2 * (1 + Math.floor(turn / 5));
}

function firebreak(turn: number): number {
  return 4 * (1 + Math.floor(turn / 5));
}

/** What an event's raid enters. */
const RAID: UnitEntryTable = [{ kind: 'warrior', script: 'raider', weight: 1 }];

/** How far apart from every camp standing a rival band's camp is placed. */
const RIVAL_CAMP_APART = 3;

const TABLES: Tables = {
  units: {
    worker: {
      type: 'worker',
      worker: true,
      health: 2,
      damage: 0,
      range: 0,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
    },
    warrior: {
      type: 'warrior',
      worker: false,
      health: 5,
      damage: 2,
      range: 1,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
    },
    scout: {
      type: 'scout',
      worker: false,
      health: 3,
      damage: 1,
      range: 1,
      move: 4 * MOVE_POINT,
      action: 1,
      sight: 3,
    },
  },
  scripts: { guard: guarding(2), raider: RAIDER },
  cards: {
    settle: {
      kind: 'settle',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, chronicle, tile) =>
        firstRefusal(
          made(catalogue, tile, buildingKind(catalogue, chronicle.citySection.building).terrains),
          slotFree(tile),
        ),
      effect: (catalogue, paid, at) => settled(catalogue, paid, at),
    },
    'first-worker': { kind: 'settle', cost: {}, ...entersOn('worker') },
    'first-scout': { kind: 'settle', cost: {}, ...entersOn('scout') },
    worker: { kind: 'unit', cost: { food: 2 }, ...enters('worker') },
    warrior: { kind: 'unit', cost: { military: 2 }, ...enters('warrior') },
    scout: { kind: 'unit', cost: { military: 1 }, ...enters('scout') },
    gather: {
      kind: 'action',
      cost: {},
      ...throughWorker(
        (_catalogue, chronicle, tile) => outside(chronicle, tile),
        (catalogue, paid, at) => yielded(catalogue, paid, 'player', at),
      ),
    },
    hunt: {
      kind: 'action',
      cost: {},
      ...throughWorker(
        (catalogue, _chronicle, tile) => featureAmong(catalogue, tile, ['deer', 'cattle']),
        (catalogue, paid, at) =>
          followed(featureRemoved(catalogue, paid, at), (left) => gained(left, { food: 6 })),
      ),
    },
    march: {
      kind: 'instant',
      cost: { military: 1 },
      aim: 'unit',
      refuses: (_catalogue, chronicle, tile) => movePointsSpent(chronicle, tile),
      effect: (_catalogue, paid, at) => refreshed(paid, at),
    },
    shelter: { kind: 'building', cost: { production: 12 }, ...builds('shelter') },
    hunger: {
      kind: 'hazard',
      cost: { production: 4 },
      counters: { food: hungerFood(0) },
      strikes: (_catalogue, chronicle, counter) =>
        shocked(chronicle, 'player', { food: counter('food') }),
    },
    stores: {
      kind: 'trophy',
      cost: {},
      influence: 0,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 4, production: 4 }),
    },
    'band-joins': {
      kind: 'trophy',
      cost: {},
      influence: 0,
      aim: 'none',
      effect: (_catalogue, paid) => arrived(paid, 'player'),
    },
    'cave-paintings': {
      kind: 'trophy',
      cost: {},
      influence: 0,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { culture: 2 }),
    },
    'honour-the-dead': {
      kind: 'trophy',
      cost: {},
      influence: 0,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { culture: 2 }),
    },
    'bone-carvings': {
      kind: 'trophy',
      cost: {},
      influence: 0,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { culture: 2 }),
    },
  },
  civilizations: {
    nomadic: {
      cards: [
        ...Array<string>(8).fill('gather'),
        ...Array<string>(2).fill('worker'),
        ...Array<string>(2).fill('warrior'),
        'scout',
        ...Array<string>(2).fill('hunt'),
        ...Array<string>(2).fill('march'),
      ],
      settle: ['first-worker', 'first-scout'],
      city: { building: 'hearth', sight: 2, idle: 0, card: 'settle' },
    },
  },
  events: {
    'lean-season': {
      answers: {
        share: {
          cost: {},
          reads: (_catalogue, chronicle) => ({ food: hungerFood(chronicle.turn) }),
          lands: (catalogue, chronicle) =>
            addedToDrawPileTop(catalogue, chronicle, 'hunger', {
              food: hungerFood(chronicle.turn),
            }),
        },
        ration: {
          cost: {},
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
          lands: (catalogue, chronicle) => {
            const drawn = rowsDrawn(catalogue, chronicle, RAID, raiders(chronicle.turn));
            return raided(catalogue, drawn.chronicle, drawn.rows);
          },
        },
      },
    },
    'rival-band': {
      answers: {
        fight: {
          cost: {},
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) + 1 }),
          lands: (catalogue, chronicle) => {
            const drawn = rowsDrawn(catalogue, chronicle, RAID, raiders(chronicle.turn) + 1);
            return raided(catalogue, drawn.chronicle, drawn.rows);
          },
        },
        'make-room': {
          cost: {},
          blocked: (catalogue, chronicle) =>
            campPlaceable(catalogue, chronicle, RIVAL_CAMP_APART) ? [] : ['no-camp-tile'],
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
          lands: (catalogue, chronicle) =>
            guardedCampPlaced(
              catalogue,
              chronicle,
              'warrior',
              raiders(chronicle.turn),
              RIVAL_CAMP_APART,
            ),
        },
      },
    },
    wildfire: {
      answers: {
        'let-the-fields-burn': {
          cost: {},
          reads: (_catalogue, chronicle) => ({ food: wildfireTakes(chronicle.turn) }),
          lands: (_catalogue, chronicle) =>
            shocked(chronicle, 'player', { food: wildfireTakes(chronicle.turn) }),
        },
        firebreak: {
          cost: (_catalogue, chronicle) => ({ production: firebreak(chronicle.turn) }),
          reads: (_catalogue, chronicle) => ({ production: firebreak(chronicle.turn) }),
          lands: (_catalogue, chronicle) => unchanged(chronicle),
        },
      },
    },
    herd: {
      answers: {
        'hunt-it': {
          cost: {},
          reads: () => ({ food: 4 }),
          lands: (_catalogue, chronicle) => gained(chronicle, { food: 4 }),
        },
        'follow-it': {
          cost: {},
          reads: () => ({}),
          lands: (catalogue, chronicle) => {
            const dealt = featureDealtNear(catalogue, chronicle, ['deer', 'cattle']);
            const { at } = dealt;
            return at === undefined ? dealt : followed(dealt, (left) => tileCharted(left, at));
          },
        },
      },
    },
  },
  capstones: {
    'first-shelter': {
      lands: (catalogue, chronicle) => addedToDrawPileTop(catalogue, chronicle, 'shelter'),
      count: (_catalogue, chronicle) =>
        chronicle.tiles.some((tile) => tile.building === 'shelter') ? 1 : 0,
      need: 1,
    },
  },
  technologies: {
    settlement: {
      needs: [],
      unlocks: { cards: {}, city: { building: 'village', replaces: 'hearth' } },
    },
  },
  terrains: {
    plain: { yields: { food: 1 }, movementCost: MOVE_POINT, water: false, elevation: 0 },
    forest: { yields: { production: 1 }, movementCost: 2 * MOVE_POINT, water: false, elevation: 1 },
    hills: {
      yields: { production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 2,
    },
    coast: { yields: { food: 1 }, embarkedMovementCost: MOVE_POINT, water: true, elevation: 0 },
    ocean: { yields: {}, water: true, elevation: 0 },
    mountain: { yields: {}, water: false, elevation: 3 },
  },
  biomes: {
    land: {
      origin: 'plain',
      interior: { plain: 0.55, forest: 0.25, hills: 0.2 },
      rim: { plain: 0.55, forest: 0.25, hills: 0.2 },
      rimWidths: [1],
      growth: { kind: 'weight', weight: 1 },
      compactness: 0,
    },
    sea: {
      origin: 'ocean',
      interior: { ocean: 0.92, plain: 0.08 },
      rim: { coast: 1 },
      rimWidths: [0.2, 0.6, 0.2],
      growth: { kind: 'weight', weight: 1.2 },
      compactness: 0,
    },
    mountain: {
      origin: 'mountain',
      interior: { mountain: 0.7, hills: 0.3 },
      rim: { hills: 1 },
      rimWidths: [0.5, 0.5],
      growth: { kind: 'weight', weight: 0.4 },
      compactness: 0,
    },
    woodland: {
      origin: 'forest',
      interior: { forest: 0.8, plain: 0.2 },
      rim: { forest: 0.8, plain: 0.2 },
      rimWidths: [1],
      growth: { kind: 'weight', weight: 1 },
      compactness: 0,
    },
    heartland: {
      origin: 'plain',
      interior: { plain: 0.6, forest: 0.3, hills: 0.1 },
      rim: { plain: 0.6, forest: 0.3, hills: 0.1 },
      rimWidths: [1],
      growth: { kind: 'size', size: 12 },
      compactness: 1.5,
    },
  },
  buildings: {
    hearth: { terrains: ['plain', 'forest', 'hills'], yields: {} },
    camp: { terrains: ['plain', 'forest', 'hills'], yields: {} },
    shelter: { terrains: ['plain', 'forest', 'hills'], yields: {} },
    'painted-cave': { terrains: ['hills'], yields: {} },
    'old-cairn': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
    'beast-bones': { terrains: ['plain', 'forest', 'hills', 'desert'], yields: {} },
  },
  features: {
    fertile: { terrain: 'plain', yields: { food: 1 } },
    deer: { terrain: 'forest', yields: { food: 1 } },
    cattle: { terrain: 'plain', yields: { food: 1 } },
    flint: { terrain: 'hills', yields: { military: 1 } },
  },
  improvements: {},
};

const NOMADIC_SCHEDULE: Schedule = {
  spacing: [6, 9],
  window: [12, 18],
  capstones: ['first-shelter'],
  entries: {
    'lean-season': 1,
    'rival-band': 1,
    wildfire: 1,
    herd: 1 / 3,
  },
};

const REGIONS: Age['regions'] = {
  temperate: {
    radius: 10,
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
      { feature: 'fertile', share: 0.05 },
      { feature: 'deer', share: 0.05 },
      { feature: 'cattle', share: 0.05 },
      { feature: 'flint', share: 0.1 },
    ],
    camps: 4,
    campFromCentre: 7,
    campsApart: 4,
    sites: ['painted-cave', 'old-cairn', 'beast-bones'],
    siteFromCentre: 7,
    sitesApart: 4,
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
    schedule: NOMADIC_SCHEDULE,
  },
};

/** The Nomadic Age: what it owns, and what it brings to the tables every age shares. */
export const NOMADIC: Slice = {
  id: 'nomadic',
  owns: {
    basePrice: 1,
    camp: {
      opening: [{ kind: 'warrior', script: 'guard', weight: 1 }],
      roll: [{ kind: 'warrior', script: 'guard', weight: 1 }],
      scripts: { guard: 'guard', raider: 'raider' },
      building: 'camp',
      rewards: { stores: 1, 'band-joins': 1 },
      odds: 0.08,
      wait: 0,
      raidCampOdds: 0.8,
    },
    sites: {
      'painted-cave': { building: 'painted-cave', rewards: { 'cave-paintings': 1 } },
      'old-cairn': { building: 'old-cairn', rewards: { 'honour-the-dead': 1 } },
      'beast-bones': { building: 'beast-bones', rewards: { 'bone-carvings': 1 } },
    },
    regions: REGIONS,
    achievements: {
      'first-shelter': {
        ...endedInVictory(),
        need: 1,
        technology: 'settlement',
        influence: 3,
      },
    },
    victory: 'first-shelter',
  },
  brings: TABLES,
};
