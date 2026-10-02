/**
 * The fixtures the rules tests share, authored by the tests and entered through the rules. Nothing
 * outside a test imports this module: a rules module that did would ship fixtures in the build.
 * Every id here carries the `PH_` prefix so that one leaking into shipped code is one search away.
 */
import {
  built,
  claimableTile,
  enters,
  entersOn,
  firstRefusal,
  gained,
  improvementAbsent,
  improvementPlaced,
  inside,
  made,
  movePointsSpent,
  recalled,
  refreshed,
  settled,
  shocked,
  slotFree,
  terraformable,
  terraformed,
  throughWorker,
} from './cards';
import {
  type Age,
  type Camp,
  type Catalogue,
  type Civilization,
  cardMade,
  civilizationOf,
  type EnemyScript,
  type Entering,
  entered,
  merged,
  type Schedule,
  type Slice,
  type Tables,
} from './catalogue';
import { apply, beginChronicle, type Command, launched, outcome } from './chronicle';
import { arrived, bordered, populationKilled, populationTaken } from './city';
import { campUnit, enteredAround } from './enemies';
import {
  type BuildingTypeId,
  cornerKey,
  cornersOf,
  distance,
  MOVE_POINT,
  neighbours,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { buildingKind, improvementKind, type Region } from './map-kinds';
import type { Resources } from './resources';
import { seedRng } from './rng';
import type { ChronicleSave } from './save';
import {
  addedToDrawPileTop,
  burned,
  campPlaceable,
  campsPlaced,
  type Fire,
  featureDealable,
  featureDealt,
  fireRead,
  fireStartable,
  offered,
  raided,
  reinforced,
  spanEnded,
  tileCharted,
  unitDamaged,
} from './schedule';
import { charted } from './sight';
import { followed, type Group, type Landed, plays, type Stage, unchanged, walked } from './stages';
import {
  type CardId,
  type Chronicle,
  type ChronicleAchievement,
  type ChronicleCard,
  type CitySection,
  type Deal,
  holds,
  type Timeline,
} from './state';
import {
  type Faction,
  FIRST_UNIT_NUMBER,
  type Landing,
  leastHealth,
  reachable,
  type Unit,
  type UnitStats,
} from './units';

const SIEGE_CAMPS = 5;

/** A turn past any a test ends. */
const FAR = 1000;

/** The building whose standing on a tile the city holds passes the fixture's tillage. */
export const TILLAGE = 'PH_Farm';

/** The food the fixture's hunger strikes off the stock. */
export const HUNGER = 6;

/** The food the fixture's drought strikes off the stock, taking one population where it falls short. */
export const DROUGHT = 4;

/** What the counter of the fixture's frost starts at: the food it strikes off the stock. */
export const FROST = 2;

/** The counter the fixture's freeze sets on the frost it adds: the food that frost strikes off. */
export const FREEZE = 5;

/** The production the fixture's explosion costs: the one answer of the fixture whose flat cost asks a stock. */
export const EXPLOSION = 4;

/**
 * The tile every answer of the fixture's upheaval lands on: the one beside the city a `cityOf` city
 * holds second.
 */
export const UPHEAVAL: TileCoords = { q: 1, r: 0 };

/** The health the fixture's ambush takes off the unit standing on the upheaval's tile. */
export const AMBUSH = 3;

/** How many warriors the fixture's encampment enters on and around the camp it places. */
export const ENCAMPED = 3;

const RIVALS = { fromCity: [3, 4], apart: 3 } as const;

/** The fixture's wildfire: forest burned to plain, starting within three of the city. */
export const FIRE: Fire = { burns: 'forest', leaves: 'plain', fromCity: 3, around: 1, damage: 3 };

/** How far from the city the fixture's herd deals its feature. */
export const HERD = 3;

/** How many warriors the fixture's raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

function besieged(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const placing = campsPlaced(catalogue, chronicle, SIEGE_CAMPS, [3, 5], 3);
  let landing: Landed = placing;
  for (const camp of placing.placed) {
    landing = followed(landing, (left) =>
      entered(catalogue, left, campUnit(catalogue, left, camp, 'raider')),
    );
  }
  return landing;
}

/** The events every fixture age's schedule deals from, each one also an age of its own through `dealing`. */
const EVENTS: Catalogue['events'] = {
  PH_Hardship: {
    answers: {
      PH_Raid: {
        cost: {},
        reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
        lands: (catalogue, chronicle) => raided(catalogue, chronicle, raiders(chronicle.turn)),
      },
      PH_Famine: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) => addedToDrawPileTop(catalogue, chronicle, 'PH_Hunger'),
      },
    },
  },
  PH_Blight: {
    answers: {
      PH_Endure: {
        cost: { food: 0 },
        reads: () => ({}),
        lands: (catalogue, chronicle) => addedToDrawPileTop(catalogue, chronicle, 'PH_Hunger'),
      },
      PH_Explosion: {
        cost: { production: EXPLOSION },
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
      PH_Levy: {
        cost: (_catalogue, chronicle) => ({ production: chronicle.population }),
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Upheaval: {
    answers: {
      PH_Plague: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => populationKilled(chronicle, UPHEAVAL),
      },
      PH_Ambush: {
        cost: {},
        reads: () => ({ damage: AMBUSH }),
        lands: (_catalogue, chronicle) => unitDamaged(chronicle, UPHEAVAL, AMBUSH),
      },
      PH_Quake: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) => terraformed(catalogue, chronicle, UPHEAVAL, 'forest'),
      },
    },
  },
  PH_Exodus: {
    answers: {
      PH_Leave: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => populationTaken(chronicle),
      },
      PH_Stay: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Rivals: {
    needs: (catalogue, chronicle) =>
      campPlaceable(catalogue, chronicle, RIVALS.fromCity, RIVALS.apart),
    answers: {
      PH_Encampment: {
        cost: {},
        reads: () => ({ warriors: ENCAMPED }),
        lands: (catalogue, chronicle) => {
          const placing = campsPlaced(catalogue, chronicle, 1, RIVALS.fromCity, RIVALS.apart);
          const [camp] = placing.placed;
          if (camp === undefined) return placing;
          // The first warrior lands on the camp only because `campsPlaced` asks the ground to run to
          // the city and no unit to stand there, and the catalogue refuses a camp on a terrain its
          // unit cannot stand on.
          return followed(placing, (left) =>
            enteredAround(catalogue, left, camp, ENCAMPED, 'guard'),
          );
        },
      },
      PH_Truce: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Wildfire: {
    needs: (_catalogue, chronicle) => fireStartable(chronicle, FIRE),
    answers: {
      PH_Burn: {
        cost: {},
        reads: (_catalogue, chronicle) => fireRead(chronicle, FIRE),
        lands: (catalogue, chronicle) => burned(catalogue, chronicle, FIRE),
      },
      PH_Firebreak: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Herd: {
    needs: (catalogue, chronicle) => featureDealable(catalogue, chronicle, 'PH_Fertile', HERD),
    answers: {
      PH_Follow: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) => {
          const dealt = featureDealt(catalogue, chronicle, 'PH_Fertile', HERD);
          const { at } = dealt;
          return at === undefined ? dealt : followed(dealt, (left) => tileCharted(left, at));
        },
      },
      PH_Ignore: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Cold: {
    answers: {
      PH_Chill: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) => addedToDrawPileTop(catalogue, chronicle, 'PH_Frost'),
      },
      PH_Freeze: {
        cost: {},
        reads: () => ({ amount: FREEZE, cards: 1 }),
        lands: (catalogue, chronicle) =>
          addedToDrawPileTop(catalogue, chronicle, 'PH_Frost', { amount: FREEZE }),
      },
      PH_Thaw: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) =>
          addedToDrawPileTop(catalogue, chronicle, 'PH_Frost', { thaw: 1 }),
      },
    },
  },
  PH_Spoilage: {
    needs: (_catalogue, chronicle) => everyCard(chronicle).includes('PH_Hunger'),
    answers: {
      PH_Ration: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
      PH_Waste: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
};

/** The script the fixture's enemies enter with, and the one its camp's raiders carry. */
export const SCRIPT = 'PH_Beeline';

/** The script the fixture camp's guards carry: it stays where it stands and attacks within range. */
const SENTRY: EnemyScript = {
  moveTo: (_catalogue, chronicle, enemy) => ({
    landing: { tile: enemy.tile, cost: 0 },
    rng: chronicle.rng,
  }),
  attacks: (_catalogue, chronicle, enemy) => leastHealth(chronicle.units, enemy),
};

/** The fixture's script. Unlike the raider, it attacks from the city's tile too. */
const BEELINE: EnemyScript = {
  moveTo(catalogue, chronicle, enemy) {
    const stay: Landing = { tile: enemy.tile, cost: 0 };
    const { city } = chronicle;
    if (city === undefined) return { landing: stay, rng: chronicle.rng };
    let chosen = stay;
    for (const landing of reachable(catalogue, chronicle, enemy)) {
      if (distance(landing.tile, city) < distance(chosen.tile, city)) chosen = landing;
    }
    return { landing: chosen, rng: chronicle.rng };
  },
  attacks: (_catalogue, chronicle, enemy) => leastHealth(chronicle.units, enemy),
};

/** The id the fixture catalogue lists its one civilization under. */
export const CIVILIZATION_ID = 'civilization';

/** The city section of the fixture's civilization, and of every chronicle the fixture builds directly. */
const CITY_SECTION: CitySection = { building: 'PH_City', sight: 2, idle: 2, card: 'PH_Settle' };

/** What the fixture's first age brings to the tables every age shares, its technologies aside. */
const TABLES: Omit<Tables, 'technologies'> = {
  units: {
    PH_Worker: {
      type: 'PH_Worker',
      worker: true,
      health: 2,
      damage: 0,
      range: 0,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
    },
    PH_Warrior: {
      type: 'PH_Warrior',
      worker: false,
      health: 5,
      damage: 2,
      range: 1,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
    },
  },
  scripts: { [SCRIPT]: BEELINE, PH_Sentry: SENTRY },
  cards: {
    PH_Settle: {
      kind: 'settle',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, _chronicle, tile) =>
        firstRefusal(made(catalogue, tile, ['plain', 'forest', 'hills']), slotFree(tile)),
      effect: (catalogue, paid, at) =>
        followed(terraformed(catalogue, paid, at, 'urban'), (left) => settled(catalogue, left, at)),
    },
    PH_Claim: {
      kind: 'settle',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, chronicle, tile) => claimableTile(catalogue, chronicle, tile),
      effect: (_catalogue, paid, at) => followed(arrived(paid), (left) => bordered(left, at)),
    },
    PH_Band: { kind: 'settle', cost: {}, ...entersOn('PH_Worker') },
    PH_Stores: {
      kind: 'settle',
      cost: {},
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 2 }),
    },
    PH_Worker: { kind: 'unit', cost: { food: 2 }, ...enters('PH_Worker') },
    PH_Warrior: { kind: 'unit', cost: { military: 2 }, ...enters('PH_Warrior') },
    PH_Farm: {
      kind: 'building',
      cost: { production: 3 },
      ...throughWorker(
        (catalogue, chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, buildingKind(catalogue, 'PH_Farm').terrains),
            inside(chronicle, tile),
            slotFree(tile),
          ),
        (catalogue, paid, at) => built(catalogue, paid, at, 'PH_Farm'),
      ),
    },
    PH_March: {
      kind: 'instant',
      cost: {},
      aim: 'unit',
      refuses: (_catalogue, chronicle, tile) => movePointsSpent(chronicle, tile),
      effect: (_catalogue, paid, at) => refreshed(paid, at),
    },
    PH_Harvest: {
      kind: 'instant',
      cost: { science: 1 },
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 2 }),
    },
    PH_Mine: {
      kind: 'instant',
      cost: { production: 3 },
      ...throughWorker(
        (catalogue, _chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, improvementKind(catalogue, 'PH_Mine').terrains),
            improvementAbsent(catalogue, tile, 'PH_Mine'),
          ),
        (catalogue, paid, at) => improvementPlaced(catalogue, paid, at, 'PH_Mine'),
      ),
    },
    PH_Road: {
      kind: 'instant',
      cost: { production: 2 },
      ...throughWorker(
        (catalogue, _chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, improvementKind(catalogue, 'PH_Road').terrains),
            improvementAbsent(catalogue, tile, 'PH_Road'),
          ),
        (catalogue, paid, at) => improvementPlaced(catalogue, paid, at, 'PH_Road'),
      ),
    },
    PH_Urbanisation: {
      kind: 'instant',
      cost: { production: 5 },
      ...throughWorker(
        (catalogue, chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, ['plain']),
            terraformable(catalogue, chronicle, tile, 'urban'),
          ),
        (catalogue, paid, at) => terraformed(catalogue, paid, at, 'urban'),
      ),
    },
    PH_Recall: {
      kind: 'instant',
      cost: { science: 2 },
      aim: 'discard-pile',
      blocked: (_catalogue, chronicle) =>
        chronicle.discardPile.length === 0 ? ['discard-pile'] : [],
      effect: (_catalogue, paid, at) => recalled(paid, at),
    },
    PH_Spoils: {
      kind: 'instant',
      cost: {},
      singleUse: true,
      aim: 'none',
      effect: (_catalogue, paid) =>
        gained(paid, { food: 10, production: 10, military: 10, money: 10, science: 10 }),
    },
    PH_Cache: {
      kind: 'instant',
      cost: {},
      singleUse: true,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 5 }),
    },
    PH_Hunger: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle) => shocked(chronicle, 'food', HUNGER),
    },
    PH_Frost: {
      kind: 'hazard',
      cost: { production: 3 },
      counters: { amount: FROST },
      strikes: (_catalogue, chronicle, counter) => shocked(chronicle, 'food', counter('amount')),
    },
    PH_Squall: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle, counter) => shocked(chronicle, 'food', counter('amount')),
    },
    PH_Drought: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle) => {
        const shortened = shocked(chronicle, 'food', DROUGHT);
        return chronicle.resources.food < DROUGHT
          ? followed(shortened, (left) => populationTaken(left))
          : shortened;
      },
    },
  },
  civilizations: {
    [CIVILIZATION_ID]: {
      cards: [
        'PH_Worker',
        'PH_Worker',
        'PH_Warrior',
        'PH_Warrior',
        'PH_Farm',
        'PH_Farm',
        'PH_March',
        'PH_March',
        'PH_Harvest',
        'PH_Harvest',
      ],
      settle: ['PH_Claim'],
      city: CITY_SECTION,
    },
  },
  events: EVENTS,
  capstones: {
    PH_Siege: {
      lands: besieged,
      continues: (catalogue, chronicle) => reinforced(catalogue, chronicle, 'raider'),
      passes: (_catalogue, chronicle) => spanEnded(chronicle, 6),
    },
    PH_Tillage: {
      lands: (_catalogue, chronicle) => unchanged(chronicle),
      passes: (_catalogue, chronicle) =>
        chronicle.tiles.some((tile) => tile.building === TILLAGE && holds(chronicle, tile)),
    },
  },
  terrains: {
    plain: {
      yields: { food: 2 },
      movementCost: MOVE_POINT,
      water: false,
      elevation: 0,
      river: { food: 1 },
    },
    forest: {
      yields: { food: 1, production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 1,
      river: { food: 1 },
    },
    hills: {
      yields: { production: 2 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 2,
    },
    mountain: {
      yields: { production: 1 },
      movementCost: 6 * MOVE_POINT,
      water: false,
      elevation: 3,
    },
    coast: { yields: { food: 1, money: 1 }, water: true, elevation: 0 },
    deep: { yields: { food: 1 }, water: true, elevation: 0 },
    urban: {
      yields: { production: 1, military: 1, money: 1, science: 1, culture: 1 },
      movementCost: MOVE_POINT,
      water: false,
      elevation: 0,
    },
    glade: { yields: { food: 1 }, movementCost: MOVE_POINT, water: false, elevation: 0 },
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
      growth: { kind: 'weight', weight: 1 },
      compactness: 0,
    },
    mountain: {
      origin: 'mountain',
      interior: { mountain: 0.7, hills: 0.3 },
      rim: { hills: 1 },
      rimWidths: [0.4, 0.6],
      growth: { kind: 'weight', weight: 1 },
      compactness: 0,
    },
    clearing: {
      origin: 'glade',
      interior: { glade: 1 },
      rim: { glade: 1 },
      rimWidths: [1],
      growth: { kind: 'size', size: 9 },
      compactness: 2,
    },
  },
  buildings: {
    PH_City: { terrains: ['urban'], yields: {} },
    PH_Farm: { terrains: ['plain'], yields: { food: 1 } },
    PH_Camp: { terrains: ['plain', 'forest', 'hills'], yields: {} },
  },
  features: {
    PH_Fertile: { terrain: 'plain', yields: { food: 1 } },
  },
  improvements: {
    PH_Mine: { terrains: ['hills'], yields: { production: 1 } },
    PH_Road: {
      terrains: ['plain', 'forest', 'hills', 'urban'],
      yields: {},
      movementCost: MOVE_POINT / 2,
      bridge: true,
    },
    PH_Trail: {
      terrains: ['plain', 'forest', 'hills', 'urban'],
      yields: {},
      movementCost: (3 * MOVE_POINT) / 4,
    },
    PH_Rubble: { terrains: ['plain'], yields: {}, movementCost: 2 * MOVE_POINT },
  },
};

/** The regions table every fixture age holds. */
export const REGIONS: Readonly<Record<string, Region>> = {
  disc: {
    radius: 8,
    centre: 3,
    tilesPerBiome: 26,
    centreBiome: 'land',
    biomeShares: [
      { biome: 'sea', share: 0.3 },
      { biome: 'mountain', share: 0.1 },
    ],
    featureShares: [{ feature: 'PH_Fertile', share: 1 / 6 }],
    camps: 3,
    campFromCentre: 6,
    campsApart: 3,
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
  clearing: {
    radius: 7,
    centre: 2,
    tilesPerBiome: 28,
    centreBiome: 'clearing',
    biomeShares: [
      { biome: 'sea', share: 0.2 },
      { biome: 'mountain', share: 0.2 },
      { biome: 'land', share: 0.6 },
    ],
    featureShares: [],
    camps: 2,
    campFromCentre: 6,
    campsApart: 4,
    rivers: {
      source: 'mountain',
      relief: 1,
      roughness: 0.5,
      perRange: 1,
      climb: 0.5,
      meander: 1,
      curl: 0.75,
      edgesPerTile: 4,
      leastEdges: 4,
      draws: 40,
    },
  },
};

/** The camp every fixture age holds. */
export const CAMP: Camp = {
  unit: 'PH_Warrior',
  scripts: { guard: 'PH_Sentry', raider: SCRIPT },
  building: 'PH_Camp',
  rewards: ['PH_Spoils', 'PH_Cache'],
  odds: 0,
  raidCampOdds: 1,
};

/** The region the fixture catalogue deals its maps from, its centre's biome one that spreads. */
export const REGION = 'disc';

/** The region whose centre's biome is dealt to a size: the one biome kind of the fixture that is. */
export const CLEARING = 'clearing';

/** The first age of the fixture's ages table: the one its tests launch chronicles in. */
export const AGE = 'age';

/** The age of the fixture's chronicles that name no other: its schedule deals nothing before `FAR`. */
export const QUIET = 'quiet';

/**
 * The age whose schedule deals the hardship and the spoilage alike, the spoilage only once the
 * city's cards hold the hunger.
 */
export const WARY = 'wary';

/** Each fixture age's schedule, by the age's id, in the order of the ages table. */
const SCHEDULES: Readonly<Record<string, Schedule>> = {
  [AGE]: {
    spacing: [3, 7],
    capstone: { id: 'PH_Siege', window: [27, 33] },
    entries: { PH_Hardship: () => 1, PH_Blight: () => 1 },
  },
  [QUIET]: {
    spacing: [3, 7],
    capstone: { id: 'PH_Tillage', window: [27, 33] },
    entries: { PH_Hardship: (turn) => (turn >= FAR ? 1 : 0) },
  },
  [WARY]: {
    spacing: [3, 7],
    capstone: { id: 'PH_Siege', window: [27, 33] },
    entries: { PH_Hardship: () => 1, PH_Spoilage: () => 1 },
  },
  ...Object.fromEntries(
    Object.keys(EVENTS).map((event): [string, Schedule] => [
      event,
      {
        spacing: [FAR, FAR],
        capstone: { id: 'PH_Siege', window: [FAR, FAR] },
        entries: { [event]: () => 1 },
      },
    ]),
  ),
};

/** The first fixture age's achievement the food stock reaches, earning `GRANARY`. */
export const HOARD = 'PH_Hoard';

/** The food stock that reaches `HOARD`. */
export const HOARD_NEED = 20;

/** The first fixture age's achievement the food stock reaches past `HOARD`'s need, earning `LARDER`. */
export const FEAST = 'PH_Feast';

/** The food stock that reaches `FEAST`. */
export const FEAST_NEED = 25;

/** The first fixture age's achievement the population reaches, earning `CENSUS`. */
export const CROWD = 'PH_Crowd';

/** The population that reaches `CROWD`. */
export const CROWD_NEED = 6;

/**
 * The first fixture age's achievement a deed reaches, earning `SURVEYING`: its tally counts the road
 * played through a worker by the terrain of the tile it was played on, and its count is the kinds of
 * terrain the tally names.
 */
export const SURVEY = 'PH_Survey';

/** The kinds of terrain that reach `SURVEY`. */
export const SURVEY_NEED = 2;

/** The technology `SURVEY` earns: it needs none, and unlocks nothing. */
const SURVEYING = 'PH_Surveying';

/** The technology `HOARD` earns: it needs none, and unlocks two copies of a card. */
export const GRANARY = 'PH_Granary';

/** The technology `CROWD` earns: it needs `GRANARY`. */
export const CENSUS = 'PH_Census';

/** The technology `FEAST` earns: it needs none, and unlocks nothing. */
const LARDER = 'PH_Larder';

/** The achievement a fixture age's victory is. */
export function victoryOf(age: string): string {
  return `PH_Victory_${age}`;
}

/** The technology a fixture age's victory earns: it unlocks the next age of the table, if any. */
function pastOf(age: string): string {
  return `PH_Past_${age}`;
}

/** The fixture's ages, in the order of the ages table. */
const AGES = Object.keys(SCHEDULES);

/** The achievements a fixture age owns: its victory, and before it the first age's four others. */
function achievementsOf(age: string): Age['achievements'] {
  const victory: Age['achievements'] = {
    [victoryOf(age)]: {
      count: (_catalogue, chronicle) => (chronicle.ending?.outcome === 'victory' ? 1 : 0),
      need: 1,
      technology: pastOf(age),
      influence: 2,
    },
  };
  if (age !== AGE) return victory;
  return {
    [HOARD]: {
      count: (_catalogue, chronicle) => chronicle.resources.food,
      need: HOARD_NEED,
      technology: GRANARY,
      influence: 1,
    },
    [FEAST]: {
      count: (_catalogue, chronicle) => chronicle.resources.food,
      need: FEAST_NEED,
      technology: LARDER,
      influence: 1,
    },
    [CROWD]: {
      count: (_catalogue, chronicle) => chronicle.population,
      need: CROWD_NEED,
      technology: CENSUS,
      influence: 0,
    },
    [SURVEY]: {
      tallies: (_catalogue, started, stages, tally) => {
        let kept = tally;
        for (const { card, aimed } of plays(stages)) {
          if (card !== 'PH_Road' || aimed.aim !== 'tile') continue;
          const terrain = tileAt(started.tiles, aimed.tile)?.terrain;
          if (terrain === undefined) continue;
          kept = { ...kept, [terrain]: (kept[terrain] ?? 0) + 1 };
        }
        return kept;
      },
      count: (_catalogue, _chronicle, tally) => Object.keys(tally).length,
      need: SURVEY_NEED,
      technology: SURVEYING,
      influence: 1,
    },
    ...victory,
  };
}

/** The fixture's technologies: the first age's four, and each age's victory unlocking the next age. */
const TECHNOLOGIES: Tables['technologies'] = {
  [GRANARY]: { needs: [], unlocks: { cards: { PH_Harvest: 2 } } },
  [CENSUS]: { needs: [GRANARY], unlocks: { cards: {} } },
  [LARDER]: { needs: [], unlocks: { cards: {} } },
  [SURVEYING]: { needs: [], unlocks: { cards: {} } },
  ...Object.fromEntries(
    AGES.map((age, at) => {
      const next = AGES[at + 1];
      const unlocks = next === undefined ? { cards: {} } : { cards: {}, age: next };
      return [pastOf(age), { needs: [], unlocks }];
    }),
  ),
};

/** Every fixture age, each owning its own schedule and achievements over the camp and the regions handed in. */
export function agesOver(
  camp: Camp,
  regions: Readonly<Record<string, Region>>,
): Readonly<Record<string, Age>> {
  return Object.fromEntries(
    Object.entries(SCHEDULES).map(([id, schedule], at) => [
      id,
      { basePrice: 3 + at, schedule, camp, regions, achievements: achievementsOf(id) },
    ]),
  );
}

/** The fixture's slices, in the order of its ages: the first brings every table, the others nothing. */
export const SLICES: readonly Slice[] = Object.entries(agesOver(CAMP, REGIONS)).map(
  ([id, owns], at) => ({
    id,
    owns,
    brings: at === 0 ? { ...TABLES, technologies: TECHNOLOGIES } : {},
  }),
);

/** The content every fixture is played on, its numbers the fixture's own. */
export const CATALOGUE: Catalogue = merged('fixture', SLICES);

/** The fixture's content with its stores and its worker cards brought by its second age. */
export function twoAges(): Catalogue {
  const [first, second, ...rest] = SLICES;
  const { PH_Stores, PH_Worker, ...firstCards } = first.brings.cards ?? {};
  return merged('fixture', [
    { ...first, brings: { ...first.brings, cards: firstCards } },
    { ...second, brings: { cards: { PH_Stores, PH_Worker } } },
    ...rest,
  ]);
}

/**
 * A timeline dealing nothing in the quiet age: its next deal, and the capstone, on a turn past any a
 * test ends. What a fixture chronicle carries unless its test writes the deal it wants.
 */
export const NO_DEALS: Timeline = {
  rng: seedRng(7),
  next: FAR,
  capstone: { id: 'PH_Siege', turn: FAR },
};

/**
 * A chronicle's age and timeline due on this turn: the age whose schedule deals this event alone,
 * and a timeline whose next due turn after this one is past any a test ends, its capstone as
 * `NO_DEALS` has it.
 */
export function dealing(deal: {
  readonly turn: number;
  readonly event: string;
}): Pick<Chronicle, 'age' | 'timeline'> {
  return { age: deal.event, timeline: { ...NO_DEALS, next: deal.turn } };
}

export const CITY: TileCoords = { q: 0, r: 0 };

/**
 * A unit a fixture puts on the map: what it enters as, and the state the fixture authors on it once
 * it stands there.
 */
export type Standing = {
  readonly entering: Entering;
  readonly stats: UnitStats;
  readonly movePoints: number;
  readonly action: number;
};

/**
 * The chronicle with these units entered on it through the rules and the map charted of what they
 * see. The one way a fixture puts units on the map.
 */
export function withUnits(chronicle: Chronicle, units: readonly Standing[]): Chronicle {
  let stood = chronicle;
  for (const unit of units) {
    const dealt = entered(CATALOGUE, stood, unit.entering).chronicle;
    const last = dealt.units[dealt.units.length - 1];
    const authored: Unit = {
      ...last,
      stats: unit.stats,
      movePoints: unit.movePoints,
      action: unit.action,
    };
    stood = { ...dealt, units: [...dealt.units.slice(0, -1), authored] };
  }
  return charted(CATALOGUE, stood);
}

type Pile = 'drawPile' | 'hand' | 'discardPile';

/**
 * What a fixture authors on the chronicle it asks for: its state, the units standing on it, and the
 * cards of each pile by id.
 */
export type Carrying = Partial<Omit<Chronicle, 'units' | 'nextUnit' | Pile>> & {
  readonly units?: readonly Standing[];
} & Partial<Record<Pile, readonly CardId[]>>;

/**
 * A city on `inside`, tile by tile, with one plain lying outside the border and no cards and no
 * achievements but the ones the fixture names, made on the fixture's content unless the test hands
 * in its own. Its population stands one on each tile the city holds, and none is idle.
 */
export function cityOf(
  inside: Terrain[],
  carrying: Carrying = {},
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  const { units = [], drawPile = [], hand = [], discardPile = [], ...state } = carrying;
  const made = (id: CardId): ChronicleCard => cardMade(catalogue, id);
  const city: Chronicle = {
    content: catalogue.version,
    age: QUIET,
    seed: 7,
    rng: seedRng(7),
    timeline: NO_DEALS,
    snapshots: [],
    centre: [],
    tiles: [
      ...inside.map(
        (terrain, index): Tile =>
          index === 0
            ? { q: 0, r: 0, terrain, improvements: [], building: 'PH_City' }
            : { q: index, r: 0, terrain, improvements: [] },
      ),
      { q: 0, r: 5, terrain: 'plain', improvements: [] },
    ],
    rivers: [],
    citySection: CITY_SECTION,
    city: CITY,
    held,
    turn: 1,
    deals: [],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: held.length,
    assigned: [...held],
    units: [],
    nextUnit: FIRST_UNIT_NUMBER,
    achievements: [],
    ...state,
    drawPile: drawPile.map(made),
    hand: hand.map(made),
    discardPile: discardPile.map(made),
  };
  return withUnits(city, units);
}

/**
 * A disc of plain around the city, out to `radius`; `coast` names the wet ones. The city stands on
 * its urban tile as the settle leaves it: in that tile's building slot.
 */
export function field(radius: number, coast: TileCoords[] = []): Tile[] {
  const wet = new Set(coast.map(tileKey));
  const tiles: Tile[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      if (q === 0 && r === 0) {
        tiles.push({ q, r, terrain: 'urban', improvements: [], building: 'PH_City' });
        continue;
      }
      tiles.push({
        q,
        r,
        terrain: wet.has(tileKey({ q, r })) ? 'coast' : 'plain',
        improvements: [],
      });
    }
  }
  return tiles;
}

/** A disc of plain out to `radius` with nothing standing on it: ground no city has settled yet. */
export function plains(radius: number): Tile[] {
  return field(radius).map(({ q, r }): Tile => ({ q, r, terrain: 'plain', improvements: [] }));
}

/** What a fixture opening names: the civilization, the age and the timeline, and how far the centre part reaches. */
type Opening = {
  readonly civilization?: Civilization;
  readonly age?: string;
  readonly timeline?: Timeline;
  readonly reach?: number;
};

/**
 * The chronicle opened on these tiles through the rules, on the settle phase with the city nowhere:
 * its centre part every tile within `reach` of the centre, two unless named, on the fixture's
 * civilization in the quiet age on a timeline dealing nothing, unless the fixture names others.
 */
export function opening(
  tiles: Tile[],
  { civilization = CIVILIZATION, age = QUIET, timeline = NO_DEALS, reach = 2 }: Opening = {},
): Chronicle {
  const centre = tiles
    .filter((tile) => distance(tile, CITY) <= reach)
    .map(({ q, r }) => ({ q, r }));
  return beginChronicle(
    CATALOGUE,
    age,
    7,
    civilization,
    { tiles, rivers: [], centre },
    timeline,
    [],
  );
}

/** The chronicle with the first card of its hand played on a tile, refused or not. */
export function settledOn(
  chronicle: Chronicle,
  tile: TileCoords,
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  return outcome(apply(catalogue, chronicle, { type: 'play', index: 0, aim: 'tile', tile }));
}

/**
 * Turn 1 as the end of the settle phase leaves it, standing on a deal where the age's schedule deals
 * one — and a chronicle waiting on a deal refuses every other command.
 */
export function settledLaunch(
  catalogue: Catalogue,
  age: string,
  region: string,
  seed: number,
  civilization: Civilization,
  learned: readonly string[],
  at: TileCoords = CITY,
): Chronicle {
  const launch = launched(catalogue, age, region, seed, civilization, learned);
  const settling = settledOn(launch, at, catalogue);
  if (settling.city === undefined)
    throw new Error(`seed ${seed} settles no city on ${tileKey(at)}`);
  return outcome(apply(catalogue, settling, { type: 'end-turn' }));
}

/** A city in the first age, carrying the achievements a launch with these technologies learned names. */
export function reaching(learned: readonly string[], carrying: Carrying): Chronicle {
  const { achievements } = launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, learned);
  return cityOf(['urban', 'plain'], { age: AGE, achievements, ...carrying });
}

/**
 * A first-age chronicle launched with nothing learned, `HOARD` reached and then won on the tillage:
 * a victory with two achievements reached.
 */
export function hoardedVictory(): Chronicle {
  const city = reaching([], {
    tiles: builtOn(field(2), TILLAGE, [{ q: 1, r: 0 }]),
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } },
    hand: ['PH_Cache'],
    resources: { food: HOARD_NEED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });
  return outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));
}

/** The tiles a fixture plays the road on toward `SURVEY`: two plains, then a forest. */
export const SURVEYED: readonly [TileCoords, TileCoords, TileCoords] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
];

/**
 * A first-age city with nothing learned, a worker on each tile of `SURVEYED`, a road in hand for
 * each and a harvest after them, and the stocks to play them all.
 */
export function surveying(carrying: Carrying = {}): Chronicle {
  return reaching([], {
    tiles: madeOf(field(2), 'forest', [SURVEYED[2]]),
    units: SURVEYED.map(worker),
    hand: ['PH_Road', 'PH_Road', 'PH_Road', 'PH_Harvest'],
    resources: { food: 0, production: 6, military: 0, money: 0, science: 1, culture: 0 },
    ...carrying,
  });
}

/** The road at that place of the hand, the first unless named, played on a tile. */
export function roadOn(tile: TileCoords, index = 0): Command {
  return { type: 'play', index, aim: 'tile', tile };
}

/** The achievement of the chronicle's row that the id names. A row without it throws. */
export function achievementIn(chronicle: Chronicle, id: string): ChronicleAchievement {
  const held = chronicle.achievements.find((achievement) => achievement.id === id);
  if (held === undefined) throw new Error(`the chronicle's row holds no ${id}`);
  return held;
}

/** A chronicle three turns in, saved with what it was launched on. */
export function chronicleSaved(): ChronicleSave {
  let chronicle = settledLaunch(CATALOGUE, AGE, REGION, 4242, CIVILIZATION, []);
  for (let turn = 1; turn < 3; turn++) chronicle = endedTurn(chronicle);
  return { chronicle, region: REGION, civilization: CIVILIZATION_ID };
}

/** The same disc with every tile but the named ones under water: what leaves a fixture one corridor. */
export function only(radius: number, land: TileCoords[]): Tile[] {
  const kept = new Set(land.map(tileKey));
  return field(
    radius,
    field(radius).filter((tile) => !kept.has(tileKey(tile))),
  );
}

/** A river running along the edge two tiles share: the two corners both of them carry. */
export function riverBetween(a: TileCoords, b: TileCoords): River {
  const beside = new Set(cornersOf(b).map(cornerKey));
  return cornersOf(a).filter((corner) => beside.has(cornerKey(corner)));
}

/** The same tiles, with the terrain of the named ones replaced. */
export function madeOf(tiles: Tile[], terrain: Terrain, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, terrain } : tile));
}

/** The camps a fixture deals over a disc out to four: one on each of the six directions. */
export const CAMPS: TileCoords[] = [
  { q: 4, r: 0 },
  { q: -4, r: 0 },
  { q: 0, r: 4 },
  { q: 0, r: -4 },
  { q: 4, r: -4 },
  { q: -4, r: 4 },
];

/** The same tiles, with a building of that kind filling the slot of the named ones. */
export function builtOn(tiles: Tile[], building: BuildingTypeId, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, building } : tile));
}

/** The same tiles, with a camp filling the building slot of the named ones. */
export function camped(tiles: Tile[], coords: TileCoords[]): Tile[] {
  return builtOn(tiles, CAMP.building, coords);
}

function statsOf(stats: Partial<UnitStats>): UnitStats {
  return {
    type: 'PH_Warrior',
    worker: false,
    health: 4,
    damage: 1,
    range: 1,
    move: 2 * MOVE_POINT,
    action: 1,
    sight: 2,
    ...stats,
  };
}

/**
 * A unit standing on a tile with its move points and its action full, unless the caller names what
 * it has left of either.
 */
export function standing(
  faction: Faction,
  tile: TileCoords,
  stats: Partial<UnitStats> = {},
  movePoints?: number,
  action?: number,
): Standing {
  const carried = statsOf(stats);
  const state = {
    stats: carried,
    movePoints: movePoints ?? carried.move,
    action: action ?? carried.action,
  };
  switch (faction) {
    case 'player':
      return { ...state, entering: { type: carried.type, tile, faction } };
    case 'enemy':
      return { ...state, entering: { type: carried.type, tile, faction, script: SCRIPT } };
  }
}

/** The unit a number names, for a fixture that expects it to be standing. */
export function unitNamed(chronicle: Chronicle, unit: number): Unit {
  const named = chronicle.units.find((other) => other.id === unit);
  if (named === undefined) throw new Error(`no unit of this chronicle is numbered ${unit}`);
  return named;
}

/** A unit of the player's attacking what stands on a tile, ready to hand to `apply`. */
export function attackOn(unit: number, at: TileCoords): Command {
  return { type: 'attack', unit, tile: at };
}

/** What a unit has left of its move points. */
export function pointsOf(chronicle: Chronicle, unit: number): number {
  return unitNamed(chronicle, unit).movePoints;
}

/** What a unit has left of its action. */
export function actionOf(chronicle: Chronicle, unit: number): number {
  return unitNamed(chronicle, unit).action;
}

/** The chronicle with the tile at those coordinates replaced, layer for layer. */
export function withTile(chronicle: Chronicle, tile: Tile): Chronicle {
  return charted(CATALOGUE, {
    ...chronicle,
    tiles: chronicle.tiles.map((other) => (tileKey(other) === tileKey(tile) ? tile : other)),
  });
}

/** The command city mode sends for a tile: one population on it, or the one on it off. */
export function assignTo(tile: TileCoords): Command {
  return { type: 'assign', tile };
}

/** The command city mode sends for a tile the city does not hold: culture for the tile. */
export function claimOf(tile: TileCoords): Command {
  return { type: 'claim', tile };
}

/**
 * A city on a disc of plain out to `radius`, holding its own tile and the six around it, one
 * population on each and two idle.
 */
export function ringed(
  radius: number,
  carrying: Carrying = {},
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  const ring = [CITY, ...neighbours(CITY)];
  return cityOf(
    ['urban'],
    {
      tiles: field(radius),
      held: ring,
      population: ring.length + 2,
      assigned: [...ring],
      ...carrying,
    },
    catalogue,
  );
}

/**
 * A population no fixture below piles up the food for: the growth threshold stands out of reach,
 * so income accumulates untouched under every test that is not about growth.
 */
export const NO_GROWTH: Carrying = { population: 99 };

/** What the city holds to claim with, and nothing besides. */
export function culture(amount: number): Resources {
  return { food: 0, production: 0, military: 0, money: 0, science: 0, culture: amount };
}

/** What the city pays for the worker card, and nothing besides. */
export const FOOD: Resources = {
  food: 2,
  production: 0,
  military: 0,
  money: 0,
  science: 0,
  culture: 0,
};

export function buildingAt(chronicle: Chronicle, { q, r }: TileCoords): BuildingTypeId | undefined {
  return chronicle.tiles.find((tile) => tile.q === q && tile.r === r)?.building;
}

/** A worker of the player's, standing on a tile. */
export function worker(tile: TileCoords): Standing {
  return standing('player', tile, { type: 'PH_Worker', worker: true });
}

/** What a worker of these fixtures carries: what says which tiles one of them can stand on. */
export const WORKER = worker(CITY).stats;

export function everyCard(chronicle: Chronicle): CardId[] {
  return idsOf([...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile]).sort();
}

/** What the cards of a pile are, by id, in pile order. */
export function idsOf(pile: readonly ChronicleCard[]): CardId[] {
  return pile.map(({ id }) => id);
}

/** What every stage of the tree is called, in the order the walk plays them. */
export function namesOf(stages: readonly Stage[]): string[] {
  return [...walked(stages)].map((stage) => stage.name);
}

/** What the first group of that name the walk meets holds. A tree holding no such group throws. */
export function heldBy(stages: readonly Stage[], name: Group['name']): readonly Stage[] {
  for (const stage of walked(stages)) {
    if (stage.kind === 'group' && stage.name === name) return stage.stages;
  }
  throw new Error(`no ${name} group is staged`);
}

/** What every stage of the command is called, in the order the walk plays them. */
export function stagedBy(chronicle: Chronicle, command: Command): string[] {
  return namesOf(apply(CATALOGUE, chronicle, command));
}

/** Cards enough for the end of turn to draw a full hand, so its shuffle leaves the discard pile be. */
export function fullDraw(): CardId[] {
  return ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'];
}

/** The civilization these chronicles are played on: two of each card, enough to draw a hand and cycle, the claim, and the city. */
export const CIVILIZATION: Civilization = civilizationOf(CATALOGUE, CIVILIZATION_ID);

/**
 * One whole turn, on the fixture's content unless the test hands in its own: the end of turn, and an
 * entry taken of every deal it may stop on, one after another — `wanted` where the deal offers it,
 * and the first entry dealt where it does not. Every fixture that ends turns goes through here,
 * because a chronicle waiting on a deal refuses every other command. A take the rules refuse throws.
 */
export function endedTurn(
  chronicle: Chronicle,
  wanted?: string,
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  let standing = outcome(apply(catalogue, chronicle, { type: 'end-turn' }));
  for (let deal = standing.deals[0]; deal !== undefined; deal = standing.deals[0]) {
    const at = placeOf(catalogue, deal, wanted);
    const taken = outcome(apply(catalogue, standing, { type: 'take', at }));
    if (taken === standing) throw new Error(`the take at ${at} is refused`);
    standing = taken;
  }
  return standing;
}

/** Where a deal offers `wanted`, and the first place where it does not or nothing is wanted. */
function placeOf(catalogue: Catalogue, deal: Deal, wanted: string | undefined): number {
  const at = wanted === undefined ? -1 : offered(catalogue, deal).indexOf(wanted);
  return at < 0 ? 0 : at;
}

/** Every attack the end of turn stages, as the tile each was made from and the tile it was aimed at. */
export function attacksOf(chronicle: Chronicle, catalogue: Catalogue = CATALOGUE): string[][] {
  return [...walked(apply(catalogue, chronicle, { type: 'end-turn' }))].flatMap((stage) =>
    stage.name === 'attack' ? [[tileKey(stage.attacker), tileKey(stage.target)]] : [],
  );
}

/** Every move the end of turn stages, as the tile each enemy left and the tile it reached. */
export function movesOf(chronicle: Chronicle, catalogue: Catalogue = CATALOGUE): string[][] {
  return [...walked(apply(catalogue, chronicle, { type: 'end-turn' }))].flatMap((stage) =>
    stage.name === 'move' ? [[tileKey(stage.from), tileKey(stage.to)]] : [],
  );
}

/** The enemies standing on the chronicle: what a raid entered, and nothing for a famine. */
export function enemiesOf(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'enemy');
}
