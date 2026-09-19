import {
  built,
  enters,
  entersOn,
  firstRefusal,
  gained,
  improved,
  inside,
  made,
  movePointsSpent,
  refreshed,
  settled,
  shocked,
  slotFree,
  throughWorker,
  unimproved,
} from '../rules/cards';
import { type Catalogue, catalogued } from '../rules/catalogue';
import { arrived, populationTaken, yielded } from '../rules/city';
import { enteredAround } from '../rules/enemies';
import { MOVE_POINT } from '../rules/map';
import { buildingKind, improvementKind } from '../rules/map-kinds';
import {
  burned,
  campPlaceable,
  campsPlaced,
  type Fire,
  featureDealable,
  featureDealt,
  fireRead,
  fireStartable,
  laid,
  raided,
  tileCharted,
} from '../rules/schedule';
import { followed, unchanged } from '../rules/stages';
import { ADVANCE } from './scripts';

/** How many warriors a raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

const WILDFIRE: Fire = { burns: 'forest', leaves: 'plain', fromCity: 4, around: 1, damage: 2 };

const HERD = { feature: 'game', fromCity: 4 } as const;

const RIVAL_CAMP = { fromCity: [3, 4], apart: 3 } as const;

export const NOMADIC: Catalogue = catalogued({
  version: 'nomadic',
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
      health: 2,
      damage: 1,
      range: 1,
      move: 4 * MOVE_POINT,
      action: 1,
      sight: 3,
    },
  },
  scripts: { advance: ADVANCE },
  cards: {
    settle: {
      kind: 'settle',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, _chronicle, tile) =>
        firstRefusal(
          made(catalogue, tile, buildingKind(catalogue, catalogue.city.building).terrains),
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
      kind: 'instant',
      cost: {},
      ...throughWorker(
        () => undefined,
        (catalogue, paid, at) => yielded(catalogue, paid, at),
      ),
    },
    trapping: {
      kind: 'instant',
      cost: { production: 2 },
      ...throughWorker(
        (catalogue, _chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, improvementKind(catalogue, 'trapping').terrains),
            unimproved(catalogue, tile, 'trapping'),
          ),
        (catalogue, paid, at) => improved(catalogue, paid, at, 'trapping'),
      ),
    },
    march: {
      kind: 'instant',
      cost: { military: 1 },
      aim: 'unit',
      refuses: (_catalogue, chronicle, tile) => movePointsSpent(chronicle, tile),
      effect: (_catalogue, paid, at) => refreshed(paid, at),
    },
    shelter: {
      kind: 'building',
      cost: { production: 8 },
      ...throughWorker(
        (catalogue, chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, buildingKind(catalogue, 'shelter').terrains),
            inside(chronicle, tile),
            slotFree(tile),
          ),
        (catalogue, paid, at) => built(catalogue, paid, at, 'shelter'),
      ),
    },
    hunger: {
      kind: 'hazard',
      cost: { production: 2 },
      strikes: (_catalogue, chronicle) => {
        const taken = 2 + Math.floor(chronicle.turn / 10);
        const shortened = shocked(chronicle, 'food', taken);
        return chronicle.resources.food < taken
          ? followed(shortened, (left) => populationTaken(left))
          : shortened;
      },
    },
    stores: {
      kind: 'instant',
      cost: {},
      singleUse: true,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 4, production: 4 }),
    },
    'band-joins': {
      kind: 'instant',
      cost: {},
      singleUse: true,
      aim: 'none',
      effect: (_catalogue, paid) => arrived(paid),
    },
  },
  decks: {
    nomadic: {
      cards: [
        ...Array<string>(8).fill('gather'),
        ...Array<string>(2).fill('worker'),
        ...Array<string>(2).fill('warrior'),
        'scout',
        ...Array<string>(2).fill('trapping'),
        ...Array<string>(2).fill('march'),
      ],
      settle: ['settle', 'first-worker', 'first-scout'],
    },
  },
  events: {
    'lean-season': {
      answers: {
        share: {
          cost: {},
          reads: () => ({}),
          lands: (catalogue, chronicle) => laid(catalogue, chronicle, 'hunger'),
        },
        ration: {
          cost: {},
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
          lands: (catalogue, chronicle) => raided(catalogue, chronicle, raiders(chronicle.turn)),
        },
      },
    },
    'rival-band': {
      needs: (catalogue, chronicle) =>
        campPlaceable(catalogue, chronicle, RIVAL_CAMP.fromCity, RIVAL_CAMP.apart),
      answers: {
        fight: {
          cost: {},
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) + 1 }),
          lands: (catalogue, chronicle) =>
            raided(catalogue, chronicle, raiders(chronicle.turn) + 1),
        },
        'make-room': {
          cost: {},
          reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
          lands: (catalogue, chronicle) => {
            const placing = campsPlaced(
              catalogue,
              chronicle,
              1,
              RIVAL_CAMP.fromCity,
              RIVAL_CAMP.apart,
            );
            const [camp] = placing.placed;
            if (camp === undefined) return placing;
            // The first warrior lands on the camp only because `campsPlaced` asks the ground to run
            // to the city and no unit to stand there, and the catalogue refuses a camp on a terrain
            // its unit cannot stand on.
            return followed(placing, (left) =>
              enteredAround(catalogue, left, camp, raiders(chronicle.turn)),
            );
          },
        },
      },
    },
    wildfire: {
      needs: (_catalogue, chronicle) => fireStartable(chronicle, WILDFIRE),
      answers: {
        'let-it-burn': {
          cost: {},
          reads: (_catalogue, chronicle) => fireRead(chronicle, WILDFIRE),
          lands: (catalogue, chronicle) => burned(catalogue, chronicle, WILDFIRE),
        },
        firebreak: {
          cost: { production: 3 },
          reads: () => ({}),
          lands: (_catalogue, chronicle) => unchanged(chronicle),
        },
      },
    },
    departure: {
      answers: {
        'let-them-go': {
          cost: {},
          reads: () => ({}),
          lands: (_catalogue, chronicle) => populationTaken(chronicle),
        },
        'keep-them': {
          cost: (_catalogue, chronicle) => ({ culture: chronicle.population }),
          reads: () => ({}),
          lands: (_catalogue, chronicle) => unchanged(chronicle),
        },
      },
    },
    herd: {
      needs: (catalogue, chronicle) =>
        featureDealable(catalogue, chronicle, HERD.feature, HERD.fromCity),
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
            const dealt = featureDealt(catalogue, chronicle, HERD.feature, HERD.fromCity);
            const { at } = dealt;
            return at === undefined ? dealt : followed(dealt, (left) => tileCharted(left, at));
          },
        },
      },
    },
  },
  capstones: {
    'first-shelter': {
      lands: (catalogue, chronicle) => laid(catalogue, chronicle, 'shelter'),
      passes: (_catalogue, chronicle) =>
        chronicle.tiles.some((tile) => tile.building === 'shelter'),
    },
  },
  schedules: {
    nomadic: {
      spacing: [3, 5],
      capstone: { id: 'first-shelter', window: [12, 18] },
      entries: {
        'lean-season': () => 1,
        'rival-band': () => 1,
        wildfire: (turn) => (turn >= 8 ? 1 : 0),
        departure: () => 1,
        herd: () => 1 / 3,
      },
    },
  },
  terrains: {
    plain: {
      yields: { food: 1 },
      movementCost: MOVE_POINT,
      water: false,
      elevation: 0,
      lift: 0,
      river: { food: 1 },
    },
    forest: {
      yields: { production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 1,
      lift: 0,
      river: { food: 1 },
    },
    hills: {
      yields: { production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 2,
      lift: 1,
    },
    coast: { yields: { food: 1 }, water: true, elevation: 0, lift: 0 },
    deep: { yields: {}, water: true, elevation: 0, lift: 0 },
    mountain: { yields: {}, water: false, elevation: 3, lift: 2 },
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
      origin: 'deep',
      interior: { deep: 0.92, plain: 0.08 },
      rim: { coast: 1 },
      rimWidths: [0.2, 0.5, 0.3],
      growth: { kind: 'weight', weight: 1.2 },
      compactness: 0,
    },
    mountain: {
      origin: 'mountain',
      interior: { mountain: 0.7, hills: 0.3 },
      rim: { hills: 1 },
      rimWidths: [0.4, 0.6],
      growth: { kind: 'weight', weight: 0.4 },
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
    city: { terrains: ['plain', 'forest', 'hills'], yields: { military: 1, culture: 1 } },
    camp: { terrains: ['plain', 'forest', 'hills'], yields: {} },
    shelter: { terrains: ['plain', 'forest', 'hills'], yields: {} },
  },
  features: {
    fertile: { terrain: 'plain', yields: { food: 1 } },
    game: { terrain: 'forest', yields: { food: 1 } },
    flint: { terrain: 'hills', yields: { production: 1 } },
  },
  improvements: {
    trapping: { terrains: ['forest'], yields: { food: 1 } },
  },
  regions: {
    temperate: {
      radius: 10,
      centre: 3,
      tilesPerBiome: 30,
      centreBiome: 'heartland',
      biomeShares: [
        { biome: 'sea', share: 0.2 },
        { biome: 'mountain', share: 0.1 },
        { biome: 'land', share: 0.7 },
      ],
      featureShares: [
        { feature: 'fertile', share: 1 / 6 },
        { feature: 'game', share: 1 / 6 },
        { feature: 'flint', share: 1 / 6 },
      ],
      camps: 4,
      campFromCentre: 7,
      campsApart: 4,
      rivers: {
        source: 'mountain',
        relief: 1.5,
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
  },
  camp: {
    unit: 'warrior',
    script: 'advance',
    building: 'camp',
    rewards: ['stores', 'band-joins'],
    odds: 0.08,
    raidCampOdds: 0.8,
  },
  city: { building: 'city', sight: 2, idle: 2 },
});
