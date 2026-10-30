/**
 * The fixtures the rules tests share, authored by the tests and entered through the rules. Nothing
 * outside a test imports this module: a rules module that did would ship fixtures in the build.
 * Every id here carries the `PH_` prefix so that one leaking into shipped code is one search away.
 */
import {
  buildingRemoved,
  builds,
  claimableTile,
  discarded,
  disembarks,
  embarks,
  enters,
  entersOn,
  featureAmong,
  featureRemoved,
  firstRefusal,
  gained,
  healed,
  healthLost,
  made,
  movePointsSpent,
  outside,
  placesImprovement,
  refreshed,
  settled,
  slotFree,
  terraformable,
  terraformed,
  throughWorker,
} from './cards';
import {
  type Age,
  type Answer,
  ageOf,
  type Camp,
  type Catalogue,
  type Civilization,
  cardMade,
  cardOf,
  catalogued,
  civilizationOf,
  type Entering,
  entered,
  merged,
  type Neutral,
  type NeutralScript,
  type Schedule,
  type ScriptAct,
  type Slice,
  type Tables,
  type Technology,
  type UnitEntryRow,
  type UnitEntryTable,
  type UnitScript,
  workerAim,
} from './catalogue';
import {
  apply,
  beginChronicle,
  type Command,
  endedInVictory,
  launched,
  outcome,
  playsOn,
  terrainsPlayedOn,
} from './chronicle';
import { arrived, bordered, populationTaken, shocked, warDeclared, yielded } from './city';
import { attackOrNone, enemyEntering, leastHealth, raided, rowsDrawn } from './enemies';
import {
  type BuildingTypeId,
  cornerKey,
  cornersOf,
  discAround,
  distance,
  type FeatureId,
  MOVE_POINT,
  neighbours,
  type River,
  sameTile,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import type { MapRegion } from './map-kinds';
import { RESOURCES, type Resources, withNone } from './resources';
import { seedRng } from './rng';
import type { ChronicleSave } from './save';
import {
  addedToDrawPileTop,
  campPlaceable,
  featureDealtNear,
  featureRemovalNear,
  featuresRemovedNear,
  guardedCampPlaced,
  offered,
  removalNear,
  removedNear,
  showsNextLanding,
  terraformedNear,
  tileCharted,
  unitDamaged,
} from './schedule';
import { charted } from './sight';
import { followed, type Group, type Sequence, type Stage, unchanged, walked } from './stages';
import {
  type CardId,
  type Chronicle,
  type ChronicleAchievement,
  type ChronicleCard,
  type CitySection,
  cardsInPiles,
  cityOn,
  type Deal,
  FIRST_KEY,
  holds,
  keysDealt,
  type Timeline,
} from './state';
import {
  type Faction,
  FIRST_UNIT_NUMBER,
  type Landing,
  reachable,
  type Unit,
  type UnitStats,
} from './units';

/** The one unit kind the fixture camp enters. */
export const CAMP_KIND = 'PH_Warrior';

/** The script the fixture's enemies enter with, and the one its camp's raiders carry. */
export const SCRIPT = 'PH_Beeline';

/** The id of the script the fixture camp's guards and its neutral's guards carry, `SENTRY`. */
export const GUARD_SCRIPT = 'PH_Sentry';

/** The id of the script the workers of `WORKING`'s neutral carry, `FIRST_ADMITTED`. */
export const WORKER_SCRIPT = 'PH_FirstAdmitted';

/** The fixture camp's kind, as a raider. */
export const RAIDER_ROW: UnitEntryRow = { kind: CAMP_KIND, script: SCRIPT, weight: 1 };

/** The fixture camp's kind, as a guard. */
const GUARD_ROW: UnitEntryRow = { kind: CAMP_KIND, script: GUARD_SCRIPT, weight: 1 };

/** A turn past any a test ends. */
const FAR = 1000;

/** The building whose standing on a tile the city holds passes the fixture's tillage. */
export const TILLAGE = 'PH_Farm';

/**
 * The capstone whose rule over the yield takes the terrain's and the feature's food to nothing, and
 * which nothing passes. No schedule names it.
 */
export const FALLOW = 'PH_Fallow';

/** The building built over `TILLAGE`, and the card that builds it. */
export const SILO = 'PH_Silo';

/**
 * The capstone that lands nothing, which nothing passes, and which fails once a `TILLAGE` or a `SILO`
 * leaves a tile with neither.
 */
export const TOWER = 'PH_Tower';

/** The food the fixture's hunger strikes off the stock. */
export const HUNGER = 6;

/** What the counter of the fixture's frost starts at: the food it strikes off the stock. */
export const FROST = 2;

/** The counter the fixture's freeze sets on the frost it adds: the food that frost strikes off. */
export const FREEZE = 5;

/** The food the fixture's curse strikes off the stock. */
export const CURSE = 3;

/** What the counter of the fixture's tithe starts at: the food its first strike takes. */
export const TITHE = 2;

/** How much higher each strike of the fixture's tithe sets its counter. */
export const TITHE_RISE = 3;

/** How many tiles the fixture's sprawl terraforms into urban at each strike. */
export const SPRAWL = 2;

/** The terrains the fixture's sprawl terraforms. */
const SPRAWLED: readonly Terrain[] = ['plain', 'forest'];

/** How many things the fixture's deluge removes. */
export const DELUGE = 2;

/** How many features the fixture's cull removes. */
export const CULL = 2;

/** The production the fixture's cull costs. */
export const CULL_COST = 1;

/** The features the fixture's cull removes. */
const CULLED: readonly FeatureId[] = ['PH_Fertile', 'PH_Game'];

/** The production the fixture's explosion costs. */
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

/** How far apart from every camp standing the fixture's encampment places its camp. */
const CAMPS_APART = 3;

/** The fixture's building that gives to the tiles beside it. */
export const WELL = 'PH_Well';

/** What `WELL` gives each plain tile beside it, and its own. */
export const WELL_GIVES = { terrain: 'plain', yields: { production: 2 } } as const;

/** The fixture's building that takes upkeep, and the card that builds it, for nothing. */
export const SHRINE = 'PH_Shrine';

/** The move of a unit the fixture's embark card embarks: none of the fixture's units has it ashore. */
export const EMBARKED_MOVE = 3 * MOVE_POINT;

/** The building every fixture age's neutral's city is. */
export const NEUTRAL = 'PH_Hamlet';

/** How many warriors the fixture's raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** The fixture's raid, its enemies drawn out of the table. */
function raidOf(table: UnitEntryTable): Answer {
  return {
    cost: {},
    reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
    lands: (catalogue, chronicle) => {
      const drawn = rowsDrawn(catalogue, chronicle, table, raiders(chronicle.turn));
      return raided(catalogue, drawn.chronicle, drawn.rows);
    },
  };
}

/** The events every fixture schedule deals from, each one also an age of its own through `dealing`. */
const EVENTS: Catalogue['events'] = {
  PH_Hardship: {
    answers: {
      PH_Raid: raidOf([RAIDER_ROW]),
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
        lands: (_catalogue, chronicle) => populationTaken(chronicle, 'player'),
      },
      PH_Stay: {
        cost: {},
        reads: () => ({}),
        cases: {
          declared: ['PH_Fed', 'PH_Starved'],
          names: (_catalogue, chronicle) =>
            chronicle.resources.food > 0 ? 'PH_Fed' : 'PH_Starved',
        },
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Rivals: {
    answers: {
      PH_Encampment: {
        cost: {},
        blocked: (catalogue, chronicle) =>
          campPlaceable(catalogue, chronicle, CAMPS_APART) ? [] : ['no-camp-tile'],
        reads: () => ({ warriors: ENCAMPED }),
        lands: (catalogue, chronicle) =>
          guardedCampPlaced(catalogue, chronicle, CAMP_KIND, ENCAMPED, CAMPS_APART),
      },
      PH_Truce: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Wildfire: {
    answers: {
      PH_Burn: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) =>
          terraformedNear(catalogue, chronicle, ['forest'], 'plain', 1),
      },
      PH_Firebreak: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Herd: {
    answers: {
      PH_Follow: {
        cost: {},
        reads: () => ({}),
        lands: (catalogue, chronicle) => {
          const dealt = featureDealtNear(catalogue, chronicle, ['PH_Fertile', 'PH_Game']);
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
  PH_Deluge: {
    answers: {
      PH_Drown: {
        cost: {},
        reads: (_catalogue, chronicle) => removalNear(chronicle, DELUGE),
        lands: (_catalogue, chronicle) => removedNear(chronicle, DELUGE),
      },
      PH_Wade: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
  PH_Prowl: {
    answers: {
      PH_Cull: {
        cost: { production: CULL_COST },
        reads: (catalogue, chronicle) => featureRemovalNear(catalogue, chronicle, CULLED, CULL),
        lands: (catalogue, chronicle) => featuresRemovedNear(catalogue, chronicle, CULLED, CULL),
      },
      PH_Guard: {
        cost: {},
        reads: () => ({}),
        lands: (_catalogue, chronicle) => unchanged(chronicle),
      },
    },
  },
};

/** What the fixture's scripts do with an action: attack the unit of the least health they can. */
function struckAt(catalogue: Catalogue, chronicle: Chronicle, unit: Unit): ScriptAct {
  return attackOrNone(leastHealth(catalogue, chronicle, chronicle.units, unit));
}

/**
 * The script the fixture camp's guards and its neutral's guards carry: it stays where it stands and
 * attacks what it can.
 */
const SENTRY: UnitScript = {
  moveTo: (_catalogue, chronicle, unit) => ({
    landing: { tile: unit.tile, cost: 0 },
    rng: chronicle.rng,
  }),
  acts: struckAt,
};

/**
 * The fixture's script, and its neutral's wave's. Unlike the raider, it attacks from the city's tile
 * too, and prepares the capture there only where it finds nothing to attack.
 */
const BEELINE: UnitScript = {
  moveTo(catalogue, chronicle, unit) {
    const stay: Landing = { tile: unit.tile, cost: 0 };
    const { city } = chronicle;
    if (city === undefined) return { landing: stay, rng: chronicle.rng };
    let chosen = stay;
    for (const landing of reachable(catalogue, chronicle, unit)) {
      if (distance(landing.tile, city) < distance(chosen.tile, city)) chosen = landing;
    }
    return { landing: chosen, rng: chronicle.rng };
  },
  acts(catalogue, chronicle, unit) {
    const struck = struckAt(catalogue, chronicle, unit);
    return struck.act === 'none' && cityOn(chronicle, unit.tile) === 'player'
      ? { act: 'prepare' }
      : struck;
  },
};

/**
 * The script the fixture's neutral's workers carry: it stays where it stands and plays there the
 * first card its neutral's workers play that admits the tile, and otherwise nothing.
 */
const FIRST_ADMITTED: UnitScript = {
  moveTo: (_catalogue, chronicle, unit) => ({
    landing: { tile: unit.tile, cost: 0 },
    rng: chronicle.rng,
  }),
  acts(catalogue, chronicle, unit) {
    const tile = tileAt(chronicle.tiles, unit.tile);
    const card = ageOf(catalogue, chronicle.age).neutral?.workers?.cards.find(
      (id) =>
        tile !== undefined &&
        workerAim(cardOf(catalogue, id))?.refuses(catalogue, chronicle, tile, 'neutral') ===
          undefined,
    );
    return card === undefined ? { act: 'none' } : { act: 'play', card, tile: unit.tile };
  },
};

/**
 * The script every fixture age's neutral carries: it claims the first tile offered, in tile order,
 * works the first tiles held, as many as its population, and enters its unit through the first card
 * its ratio names.
 */
const FIRST_OFFERED: NeutralScript = {
  claims: (_catalogue, _chronicle, offered) => offered[0],
  assigns: (_catalogue, chronicle, held) => held.slice(0, chronicle.neutral?.population ?? 0),
  enters: (_catalogue, _chronicle, ratio) => ratio[0]?.card,
};

/**
 * The neutral every fixture age names: no unit at its opening, its warriors entered through the
 * warrior card.
 */
const FIXTURE_NEUTRAL: Neutral = {
  building: NEUTRAL,
  script: FIRST_OFFERED,
  scripts: { guard: GUARD_SCRIPT, wave: SCRIPT },
  opening: [],
  ratio: [{ card: 'PH_Warrior', kind: 'PH_Warrior', share: 1 }],
  wave: { gathered: 3, sent: 2 },
  rewards: { PH_Cache: 3 },
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
    PH_Slinger: {
      type: 'PH_Slinger',
      worker: false,
      health: 3,
      damage: 1,
      range: 2,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
    },
    PH_Chief: {
      type: 'PH_Chief',
      worker: false,
      health: 6,
      damage: 2,
      range: 1,
      move: 2 * MOVE_POINT,
      action: 1,
      sight: 2,
      bonus: 2,
    },
  },
  scripts: { [SCRIPT]: BEELINE, [GUARD_SCRIPT]: SENTRY, [WORKER_SCRIPT]: FIRST_ADMITTED },
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
      effect: (_catalogue, paid, at) =>
        followed(arrived(paid, 'player'), (left) => bordered(left, 'player', at)),
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
    PH_Farm: { kind: 'building', cost: { production: 3 }, ...builds('PH_Farm') },
    [SHRINE]: { kind: 'building', cost: {}, ...builds(SHRINE) },
    PH_March: {
      kind: 'instant',
      cost: {},
      aim: 'unit',
      refuses: (_catalogue, chronicle, tile) => movePointsSpent(chronicle, tile),
      effect: (_catalogue, paid, at) => refreshed(paid, at),
    },
    PH_Heal: {
      kind: 'instant',
      cost: {},
      aim: 'unit',
      refuses: (catalogue, chronicle, tile) => healthLost(catalogue, chronicle, tile),
      effect: (catalogue, paid, at) => healed(catalogue, paid, at),
    },
    PH_Harvest: {
      kind: 'instant',
      cost: { science: 1 },
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 2 }),
    },
    PH_Offering: {
      kind: 'instant',
      cost: { food: 1 },
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { culture: 1 }),
    },
    PH_Mine: { kind: 'action', cost: { production: 3 }, ...placesImprovement('PH_Mine') },
    PH_Stake: { kind: 'action', cost: { production: 2 }, ...placesImprovement('PH_Stake') },
    PH_Snare: { kind: 'action', cost: { production: 2 }, ...placesImprovement('PH_Snare') },
    PH_Lodge: { kind: 'building', cost: { production: 3 }, ...builds('PH_Lodge') },
    PH_Smokehouse: { kind: 'building', cost: { production: 3 }, ...builds('PH_Smokehouse') },
    PH_Ditch: { kind: 'action', cost: { production: 2 }, ...placesImprovement('PH_Ditch') },
    PH_Weir: { kind: 'action', cost: {}, ...placesImprovement('PH_Weir') },
    PH_Embark: { kind: 'action', cost: {}, ...embarks(EMBARKED_MOVE) },
    PH_Disembark: { kind: 'action', cost: {}, ...disembarks() },
    PH_Mill: { kind: 'building', cost: { production: 3 }, ...builds('PH_Mill') },
    [SILO]: { kind: 'action', cost: { production: 3 }, ...builds(SILO, TILLAGE) },
    PH_Urbanisation: {
      kind: 'action',
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
    PH_Hunt: {
      kind: 'action',
      cost: {},
      ...throughWorker(
        (catalogue, _chronicle, tile) => featureAmong(catalogue, tile, ['PH_Fertile', 'PH_Game']),
        (catalogue, paid, at) => featureRemoved(catalogue, paid, at),
      ),
    },
    PH_Forage: {
      kind: 'action',
      cost: {},
      ...throughWorker(
        (_catalogue, chronicle, tile) => outside(chronicle, tile),
        (catalogue, paid, at) => yielded(catalogue, paid, 'player', at),
      ),
    },
    PH_Discard: {
      kind: 'instant',
      cost: { science: 1 },
      aim: 'hand',
      effect: (_catalogue, paid, at) => discarded(paid, [paid.hand[at]]),
    },
    PH_Almanac: { kind: 'instant', cost: {}, ...showsNextLanding() },
    PH_Spoils: {
      kind: 'trophy',
      cost: {},
      influence: 2,
      aim: 'none',
      effect: (_catalogue, paid) =>
        gained(paid, { food: 10, production: 10, military: 10, money: 10, science: 10 }),
    },
    PH_Cache: {
      kind: 'trophy',
      cost: {},
      influence: 1,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 5 }),
    },
    PH_Ordeal: { kind: 'challenge', cost: {}, influence: 3 },
    PH_Curse: {
      kind: 'challenge',
      cost: {},
      influence: 2,
      strikes: (_catalogue, chronicle) => shocked(chronicle, 'player', { food: CURSE }),
    },
    PH_Sprawl: {
      kind: 'challenge',
      cost: {},
      influence: 2,
      strikes: (catalogue, chronicle) =>
        terraformedNear(catalogue, chronicle, SPRAWLED, 'urban', SPRAWL),
    },
    PH_Tithe: {
      kind: 'challenge',
      cost: {},
      influence: 2,
      counters: { food: TITHE },
      strikes: (_catalogue, chronicle, counter, set) =>
        followed(shocked(chronicle, 'player', { food: counter('food') }), (left) =>
          set(left, { food: counter('food') + TITHE_RISE }),
        ),
    },
    PH_Idol: {
      kind: 'instant',
      cost: {},
      banish: true,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { culture: 3 }),
    },
    PH_Flood: {
      kind: 'instant',
      cost: {},
      counters: { tide: 1 },
      becomes: 'PH_Ebb',
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 1 }),
    },
    PH_Ebb: {
      kind: 'instant',
      cost: {},
      counters: { tide: 2 },
      becomes: 'PH_Flood',
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { production: 1 }),
    },
    PH_Sow: {
      kind: 'instant',
      cost: {},
      becomes: 'PH_Sprout',
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 1 }),
    },
    PH_Sprout: {
      kind: 'instant',
      cost: {},
      counters: { growth: 3 },
      exhaust: true,
      aim: 'none',
      effect: (_catalogue, paid) => gained(paid, { food: 2 }),
    },
    PH_Hunger: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle) => shocked(chronicle, 'player', { food: HUNGER }),
    },
    PH_Frost: {
      kind: 'hazard',
      cost: { production: 3 },
      counters: { amount: FROST },
      strikes: (_catalogue, chronicle, counter) =>
        shocked(chronicle, 'player', { food: counter('amount') }),
    },
    PH_Squall: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle, counter) =>
        shocked(chronicle, 'player', { food: counter('amount') }),
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
    PH_Tillage: {
      lands: (_catalogue, chronicle) => unchanged(chronicle),
      count: (_catalogue, chronicle) =>
        chronicle.tiles.some((tile) => tile.building === TILLAGE && holds(chronicle, tile)) ? 1 : 0,
      need: 1,
    },
    [FALLOW]: {
      lands: (_catalogue, chronicle) => unchanged(chronicle),
      yieldRule: (part) => {
        switch (part.kind) {
          case 'terrain':
          case 'feature':
            return withNone(part.yields, 'food');
          case 'improvement':
          case 'building':
          case 'beside':
            return part.yields;
        }
      },
      count: () => 0,
      need: 1,
    },
    [TOWER]: {
      lands: (_catalogue, chronicle) => unchanged(chronicle),
      fails: (catalogue, before, after) =>
        buildingRemoved(catalogue, before, after, [TILLAGE, SILO]),
      count: () => 0,
      need: 1,
    },
  },
  terrains: {
    plain: { yields: { food: 2 }, movementCost: MOVE_POINT, water: false, elevation: 0 },
    forest: {
      yields: { food: 1, production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 1,
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
    coast: {
      yields: { food: 1, money: 1 },
      embarkedMovementCost: MOVE_POINT,
      water: true,
      elevation: 0,
    },
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
    [NEUTRAL]: { terrains: ['plain', 'forest', 'hills'], yields: { culture: 1 } },
    PH_Cairn: { terrains: ['hills'], yields: {} },
    PH_Lodge: { terrains: ['forest'], features: ['PH_Game'], yields: { food: 1 } },
    PH_Smokehouse: {
      terrains: ['forest', 'plain'],
      features: ['PH_Game', 'PH_Fertile'],
      yields: { money: 1 },
    },
    PH_Mill: { terrains: ['plain'], river: true, yields: { production: 1 } },
    [SILO]: { terrains: ['plain'], yields: {} },
    [WELL]: { terrains: ['plain'], yields: { money: 1 }, givesBeside: WELL_GIVES },
    [SHRINE]: { terrains: ['plain'], yields: {}, upkeep: { production: 3, culture: 1 } },
  },
  features: {
    PH_Fertile: { terrain: 'plain', yields: { food: 1 } },
    PH_Game: { terrain: 'forest', yields: { food: 1 } },
    PH_Flint: { terrain: 'hills', yields: { production: 1 } },
  },
  improvements: {
    PH_Mine: { terrains: ['hills'], yields: { production: 1 } },
    PH_Stake: { terrains: ['plain', 'forest', 'hills', 'urban'], yields: {} },
    PH_Snare: { terrains: ['forest'], features: ['PH_Game'], yields: { food: 1 } },
    PH_Ditch: { terrains: ['plain', 'forest'], river: true, yields: { food: 1 } },
    PH_Weir: { terrains: ['coast'], yields: { food: 1 } },
  },
};

/** The one site every fixture age owns, by its key, and the building it is. */
export const SITE = 'PH_Cairn';

/** The site every fixture age owns. */
export const SITES: Age['sites'] = { [SITE]: { building: SITE, rewards: { PH_Idol: 2 } } };

/** The maps every fixture age's regions deal, by the region's key. */
export const REGIONS: Readonly<Record<string, MapRegion>> = {
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
    sites: [SITE],
    siteFromCentre: 5,
    sitesApart: 3,
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
    sites: [],
    siteFromCentre: 6,
    sitesApart: 4,
    neutralFromCentre: { least: 5, most: 6 },
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
  opening: [GUARD_ROW],
  roll: [GUARD_ROW],
  scripts: { guard: GUARD_SCRIPT, raider: SCRIPT },
  building: 'PH_Camp',
  rewards: { PH_Spoils: 1, PH_Cache: 1 },
  odds: 0,
  wait: 0,
  raidCampOdds: 1,
};

/** The region the fixture catalogue deals its maps from, its centre's biome one that spreads. */
export const REGION = 'disc';

/** The region whose centre's biome is dealt to a size: the one biome kind of the fixture that is. */
export const CLEARING = 'clearing';

/** The first age of the fixture's ages table: the one its tests launch chronicles in. */
export const AGE = 'age';

/**
 * The age of the fixture's chronicles that name no other: its regions' schedule deals nothing
 * before `FAR`, and names two capstones.
 */
export const QUIET = 'quiet';

/** The age after the quiet one, whose regions' schedule deals the hardship. */
export const WARY = 'wary';

/** The schedule every region of a fixture age deals, by the age's id, in the order of the ages table. */
const SCHEDULES: Readonly<Record<string, Schedule>> = {
  [AGE]: {
    spacing: [3, 7],
    window: [27, 33],
    capstones: ['PH_Tillage'],
    entries: { PH_Hardship: 1, PH_Blight: 1 },
  },
  [QUIET]: {
    spacing: [FAR, FAR],
    window: [27, 33],
    capstones: ['PH_Tillage', TOWER],
    entries: { PH_Hardship: 1 },
  },
  [WARY]: {
    spacing: [3, 7],
    window: [27, 33],
    capstones: ['PH_Tillage'],
    entries: { PH_Hardship: 1 },
  },
  ...Object.fromEntries(
    Object.keys(EVENTS).map((event): [string, Schedule] => [
      event,
      {
        spacing: [FAR, FAR],
        window: [FAR, FAR],
        capstones: ['PH_Tillage'],
        entries: { [event]: 1 },
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
 * The first fixture age's achievement a deed reaches, earning `SURVEYING`: its tally counts the stake
 * played through a worker by the terrain of the tile it was played on, and its count is the kinds of
 * terrain the tally names.
 */
export const SURVEY = 'PH_Survey';

/** The kinds of terrain that reach `SURVEY`. */
const SURVEY_NEED = 2;

/** The technology `SURVEY` earns: it needs none, and unlocks nothing. */
const SURVEYING = 'PH_Surveying';

/**
 * The first fixture age's achievement a deed reaches, earning `DITCHING`: its tally counts the farm
 * built on a tile a river runs along.
 */
export const RIVERSIDE = 'PH_Riverside';

/** The farms built along a river that reach `RIVERSIDE`. */
const RIVERSIDE_NEED = 2;

/** The technology `RIVERSIDE` earns: it needs none, and unlocks nothing. */
const DITCHING = 'PH_Ditching';

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

/** The technology a fixture age's victory earns: it needs none, and unlocks the next age, if any. */
function pastOf(age: string): string {
  return `PH_Past_${age}`;
}

/** The fixture's ages, in the order of the ages table. */
const AGES = Object.keys(SCHEDULES);

/** The achievements a fixture age owns: its victory, and before it the first age's five others. */
function achievementsOf(age: string): Age['achievements'] {
  const victory: Age['achievements'] = {
    [victoryOf(age)]: {
      ...endedInVictory(),
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
      ...terrainsPlayedOn('PH_Stake'),
      need: SURVEY_NEED,
      technology: SURVEYING,
      influence: 1,
    },
    [RIVERSIDE]: {
      ...playsOn('PH_Farm', { on: 'river' }),
      need: RIVERSIDE_NEED,
      technology: DITCHING,
      influence: 1,
    },
    ...victory,
  };
}

/** The fixture's technologies: the first age's five, and each age's victory's. */
const TECHNOLOGIES: Tables['technologies'] = {
  [GRANARY]: { needs: [], unlocks: { cards: { PH_Harvest: 2 } } },
  [CENSUS]: { needs: [GRANARY], unlocks: { cards: {} } },
  [LARDER]: { needs: [], unlocks: { cards: {} } },
  [SURVEYING]: { needs: [], unlocks: { cards: {} } },
  [DITCHING]: { needs: [], unlocks: { cards: {} } },
  ...Object.fromEntries(AGES.map((age) => [pastOf(age), { needs: [], unlocks: { cards: {} } }])),
};

/**
 * Every fixture age, each owning its own achievements, its victory among them, and the maps handed
 * in, each region dealing the age's own schedule, over the camp handed in, the fixture's neutral,
 * and the fixture's site.
 */
export function agesOver(
  camp: Camp,
  maps: Readonly<Record<string, MapRegion>>,
): Readonly<Record<string, Age>> {
  return Object.fromEntries(
    Object.entries(SCHEDULES).map(([id, schedule], at) => [
      id,
      {
        basePrice: 3 + at,
        camp,
        neutral: FIXTURE_NEUTRAL,
        sites: SITES,
        regions: Object.fromEntries(
          Object.entries(maps).map(([region, map]) => [region, { ...map, schedule }]),
        ),
        achievements: achievementsOf(id),
        victory: victoryOf(id),
      },
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

/** The content handed in, the fixture's unless named, its camp naming these over the fixture camp's own. */
export function camping(named: Partial<Camp>, content: Catalogue = CATALOGUE): Catalogue {
  return catalogued({ ...content, ages: agesOver({ ...CAMP, ...named }, REGIONS) });
}

/** The content handed in, the fixture's unless named, its raid drawing out of the table handed in. */
export function raidingFrom(table: UnitEntryTable, content: Catalogue = CATALOGUE): Catalogue {
  const hardship = content.events.PH_Hardship;
  const answers = { ...hardship.answers, PH_Raid: raidOf(table) };
  const events = { ...content.events, PH_Hardship: { ...hardship, answers } };
  return catalogued({ ...content, events });
}

/**
 * The fixture's content, over the slices the test hands where it hands its own, with each technology
 * named unlocking the region named beside it.
 */
export function regionsUnlocked(
  unlocks: Readonly<Record<string, string>>,
  slices: readonly Slice[] = SLICES,
): Catalogue {
  const technologies: Record<string, Technology> = { ...TECHNOLOGIES };
  for (const [id, region] of Object.entries(unlocks)) {
    technologies[id] = { ...TECHNOLOGIES[id], unlocks: { ...TECHNOLOGIES[id].unlocks, region } };
  }
  const [first, ...rest] = slices;
  return merged('fixture', [{ ...first, brings: { ...first.brings, technologies } }, ...rest]);
}

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

/** The fixture's content with what the test changes laid over it. */
export function changed(content: Partial<Catalogue>): Catalogue {
  return { ...CATALOGUE, ...content };
}

/** The fixture's content with its slinger's move one move point: it stands on no forest and no hills. */
export const SLOW_SLINGER: Catalogue = changed({
  units: { ...CATALOGUE.units, PH_Slinger: { ...CATALOGUE.units.PH_Slinger, move: MOVE_POINT } },
});

/** The fixture's content with what its first age owns changed as the test lays it over. */
export function aged(owns: Partial<Age>): Catalogue {
  return changed({ ages: { ...CATALOGUE.ages, [AGE]: { ...ageOf(CATALOGUE, AGE), ...owns } } });
}

/**
 * The fixture's content with the schedule of every region of an age, its first unless the test
 * names another, changed as the test lays it over.
 */
export function rescheduled(schedule: Partial<Schedule>, age = AGE): Catalogue {
  const owned = ageOf(CATALOGUE, age);
  const regions = Object.fromEntries(
    Object.entries(owned.regions).map(([id, region]) => [
      id,
      { ...region, schedule: { ...region.schedule, ...schedule } },
    ]),
  );
  return changed({ ages: { ...CATALOGUE.ages, [age]: { ...owned, regions } } });
}

/**
 * The fixture's content with its first age's neutral opening with a worker and keeping workers
 * beside its warriors, entered through the worker card under `WORKER_SCRIPT` and playing the farm
 * and the mine.
 */
export const WORKING: Catalogue = catalogued(
  aged({
    neutral: {
      ...FIXTURE_NEUTRAL,
      opening: ['PH_Worker'],
      ratio: [...FIXTURE_NEUTRAL.ratio, { card: 'PH_Worker', kind: 'PH_Worker', share: 1 }],
      workers: { script: WORKER_SCRIPT, cards: ['PH_Farm', 'PH_Mine'] },
    },
  }),
);

/** The fixture's content with its first age's achievements laid over as the test lays them. */
export function achieved(achievements: Age['achievements']): Catalogue {
  return aged({ achievements: { ...ageOf(CATALOGUE, AGE).achievements, ...achievements } });
}

/**
 * A timeline dealing nothing in the quiet age: its next deal, and the capstone, on a turn past any a
 * test ends. What a fixture chronicle carries unless its test writes the deal it wants.
 */
export const NO_DEALS: Timeline = {
  rng: seedRng(7),
  next: FAR,
  capstone: { id: 'PH_Tillage', turn: FAR },
};

/**
 * A chronicle's age, region and timeline due on this turn: the age whose regions' schedule deals
 * this event alone, and a timeline whose next due turn after this one is past any a test ends, its
 * capstone as `NO_DEALS` has it.
 */
export function dealing(deal: {
  readonly turn: number;
  readonly event: string;
}): Pick<Chronicle, 'age' | 'region' | 'timeline'> {
  return { age: deal.event, region: REGION, timeline: { ...NO_DEALS, next: deal.turn } };
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
  /** Whether a unit acting by a script has prepared on the tile it stands on. */
  readonly prepared?: true;
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
    const state = { stats: unit.stats, movePoints: unit.movePoints, action: unit.action };
    const authored: Unit =
      last.faction === 'player'
        ? { ...last, ...state }
        : { ...last, ...state, prepared: unit.prepared === true };
    stood = { ...dealt, units: [...dealt.units.slice(0, -1), authored] };
  }
  return charted(CATALOGUE, stood);
}

/** An enemy standing as `standing` stands it, having prepared on its tile. */
export function preparing(enemy: Standing): Standing {
  return { ...enemy, prepared: true };
}

/** A pile of a chronicle, by the field it stands under. */
export type ChroniclePile = 'drawPile' | 'hand' | 'discardPile' | 'exhaustPile';

/**
 * What a fixture authors on the chronicle it asks for: its state, the units standing on it, and the
 * cards of each pile by id.
 */
export type Carrying = Partial<
  Omit<Chronicle, 'units' | 'nextUnit' | 'nextKey' | ChroniclePile>
> & {
  readonly units?: readonly Standing[];
} & Partial<Record<ChroniclePile, readonly CardId[]>>;

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
  const {
    units = [],
    drawPile = [],
    hand = [],
    discardPile = [],
    exhaustPile = [],
    ...state
  } = carrying;
  let nextKey = FIRST_KEY;
  const pile = (ids: readonly CardId[]): ChronicleCard[] => {
    const dealt = keysDealt(
      nextKey,
      ids.map((id) => cardMade(catalogue, id)),
    );
    nextKey = dealt.nextKey;
    return dealt.cards;
  };
  const piles = {
    drawPile: pile(drawPile),
    hand: pile(hand),
    discardPile: pile(discardPile),
    exhaustPile: pile(exhaustPile),
  };
  const city: Chronicle = {
    content: catalogue.version,
    age: QUIET,
    region: REGION,
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
    nextKey,
    achievements: [],
    ...state,
    ...piles,
  };
  return withUnits(city, units);
}

/**
 * A disc of plain around the city, out to `radius`; `coast` names the wet ones. The city stands on
 * its urban tile as the settle leaves it: in that tile's building slot.
 */
export function field(radius: number, coast: TileCoords[] = []): Tile[] {
  const wet = new Set(coast.map(tileKey));
  return discAround(CITY, radius).map(
    ({ q, r }): Tile =>
      sameTile({ q, r }, CITY)
        ? { q, r, terrain: 'urban', improvements: [], building: 'PH_City' }
        : { q, r, terrain: wet.has(tileKey({ q, r })) ? 'coast' : 'plain', improvements: [] },
  );
}

/** A disc of plain out to `radius` with nothing standing on it: ground no city has settled yet. */
export function plains(radius: number): Tile[] {
  return field(radius).map(({ q, r }): Tile => ({ q, r, terrain: 'plain', improvements: [] }));
}

/**
 * What a fixture opening names: the content, the civilization, the age, the region and the
 * timeline, and how far the centre part reaches.
 */
type Opening = {
  readonly catalogue?: Catalogue;
  readonly civilization?: Civilization;
  readonly age?: string;
  readonly region?: string;
  readonly timeline?: Timeline;
  readonly reach?: number;
};

/**
 * The opening on these tiles through the rules, on the settle phase with the city nowhere: its centre
 * part every tile within `reach` of the centre, two unless named, on the fixture's content and
 * civilization in the quiet age's first region dealing nothing, unless the fixture names others.
 */
export function begunOn(
  tiles: Tile[],
  {
    catalogue = CATALOGUE,
    civilization = CIVILIZATION,
    age = QUIET,
    region = REGION,
    timeline = NO_DEALS,
    reach = 2,
  }: Opening = {},
): Sequence {
  const centre = tiles
    .filter((tile) => distance(tile, CITY) <= reach)
    .map(({ q, r }) => ({ q, r }));
  return beginChronicle(
    catalogue,
    age,
    region,
    7,
    civilization,
    { tiles, rivers: [], centre },
    timeline,
    [],
  );
}

/** The chronicle `begunOn` leaves. */
export function opening(tiles: Tile[], named: Opening = {}): Chronicle {
  return begunOn(tiles, named).chronicle;
}

/** The chronicle with the first card of its hand played on a tile, refused or not. */
export function settledOn(
  chronicle: Chronicle,
  tile: TileCoords,
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  return outcome(apply(catalogue, chronicle, aimedAt(tile)));
}

/**
 * Turn 1 as the end of the settle phase leaves it, standing on a deal where the region's schedule
 * deals one — and a chronicle waiting on a deal refuses every other command.
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
  const launch = launched(catalogue, age, region, seed, civilization, learned).chronicle;
  const settling = settledOn(launch, at, catalogue);
  if (settling.city === undefined)
    throw new Error(`seed ${seed} settles no city on ${tileKey(at)}`);
  return outcome(apply(catalogue, settling, { type: 'end-turn' }));
}

/** The tile the neutral's city stands on in `besideTheNeutral`: beside the city's own. */
export const NEUTRAL_TILE: TileCoords = { q: 1, r: 0 };

/**
 * Turn 1 of a chronicle begun as `begunOn` begins one, on plains out to three unless the test hands
 * in its own ground, with the neutral's city on `NEUTRAL_TILE`, its city settled on the centre.
 */
export function besideTheNeutral(named: Opening = {}, ground: Tile[] = plains(3)): Chronicle {
  const { catalogue = CATALOGUE } = named;
  const opened = opening(builtOn(ground, NEUTRAL, [NEUTRAL_TILE]), named);
  return outcome(apply(catalogue, settledOn(opened, CITY, catalogue), { type: 'end-turn' }));
}

/**
 * Turn 1 of `besideTheNeutral` with the neutral hostile, a unit of the player's standing on its city,
 * and the units named.
 */
export function onTheNeutralCity(others: readonly Standing[] = []): Chronicle {
  const standingOn = withUnits(besideTheNeutral(), [standing('player', NEUTRAL_TILE), ...others]);
  return warDeclared(standingOn).chronicle;
}

/**
 * Turn 2 of `besideTheNeutral` with the neutral hostile, a unit of its under `SCRIPT` having
 * prepared on the city's tile.
 */
export function preparedOnTheCity(): Chronicle {
  const onCity = withUnits(besideTheNeutral(), [neutralStanding(CITY, { script: SCRIPT })]);
  return endedTurn(warDeclared(onCity).chronicle);
}

/** A city in the first age, carrying the achievements a launch with these technologies learned names. */
export function reaching(learned: readonly string[], carrying: Carrying): Chronicle {
  const { achievements } = launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, learned).chronicle;
  return cityOf(['urban', 'plain'], { age: AGE, achievements, ...carrying });
}

/**
 * A first-age chronicle launched with nothing learned, `HOARD` reached and then won on the tillage:
 * a victory with two achievements reached, keeping the cards `kept` lays in its piles, the hand's
 * after the card played.
 */
export function hoardedVictory(kept: Pick<Carrying, ChroniclePile> = {}): Chronicle {
  const city = reaching([], {
    ...kept,
    tiles: builtOn(field(2), TILLAGE, [{ q: 1, r: 0 }]),
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } },
    hand: ['PH_Cache', ...(kept.hand ?? [])],
    resources: { food: HOARD_NEED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });
  return outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));
}

/** The tiles a fixture plays the stake on toward `SURVEY`: two plains, then a forest. */
export const SURVEYED: readonly [TileCoords, TileCoords, TileCoords] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
];

/**
 * A first-age city with nothing learned, a worker on each tile of `SURVEYED`, a stake in hand for
 * each and a harvest after them, and the stocks to play them all.
 */
export function surveying(carrying: Carrying = {}): Chronicle {
  return reaching([], {
    tiles: madeOf(field(2), 'forest', [SURVEYED[2]]),
    units: SURVEYED.map(worker),
    hand: ['PH_Stake', 'PH_Stake', 'PH_Stake', 'PH_Harvest'],
    resources: { food: 0, production: 6, military: 0, money: 0, science: 1, culture: 0 },
    ...carrying,
  });
}

/** The first card of the hand played at nothing. */
export const PLAYED: Command = { type: 'play', index: 0, aim: 'none' };

/** A card of the hand, the first unless the test names another, aimed at a tile, ready to hand to `apply`. */
export function aimedAt(tile: TileCoords, index = 0): Command {
  return { type: 'play', index, aim: 'tile', tile };
}

/** A card aimed at the unit standing on a tile, ready to hand to `apply`. */
export function aimedAtUnit(tile: TileCoords): Command {
  return { type: 'play', index: 0, aim: 'unit', tile };
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
  return { chronicle, civilization: CIVILIZATION_ID };
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

/** The same tiles, with the named ones carrying the feature. */
export function featured(tiles: Tile[], feature: FeatureId, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, feature } : tile));
}

/** The same tiles with every one but the named ones made deep, which nothing crosses. */
export function deepBut(tiles: Tile[], kept: TileCoords[]): Tile[] {
  const named = new Set(kept.map(tileKey));
  return madeOf(
    tiles,
    'deep',
    tiles.filter((tile) => !named.has(tileKey(tile))),
  );
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

/**
 * Turn 1 of a chronicle opened on a disc of plain out to four with one camp on its edge, its city
 * settled on the centre, on the content handed in.
 */
export function openedWithACamp(catalogue: Catalogue): Chronicle {
  const opened = opening(camped(plains(4), [{ q: 4, r: 0 }]), { catalogue });
  return endedTurn(settledOn(opened, CITY, catalogue), undefined, catalogue);
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
      return { ...state, entering: enemyEntering(carried.type, SCRIPT, tile) };
    case 'neutral':
      return {
        ...state,
        entering: { type: carried.type, faction: 'neutral', script: GUARD_SCRIPT, tile },
      };
  }
}

/**
 * An enemy standing as `standing` stands it, the named camp's where one is, under `SCRIPT` unless
 * another is named, and embarked where a move is named, that move its move and its move points.
 */
export function enemyStanding(
  tile: TileCoords,
  camp: TileCoords | undefined,
  {
    script = SCRIPT,
    stats = {},
    embarkedMove,
  }: { script?: string; stats?: Partial<UnitStats>; embarkedMove?: number } = {},
): Standing {
  const afloat = embarkedMove === undefined ? stats : { ...stats, move: embarkedMove };
  const enemy = standing('enemy', tile, afloat);
  const entering = { ...enemyEntering(enemy.stats.type, script, tile), embarkedMove, camp };
  return { ...enemy, entering };
}

/** A unit of the neutral's standing as `standing` stands it, under `GUARD_SCRIPT` unless another is named. */
export function neutralStanding(
  tile: TileCoords,
  { script = GUARD_SCRIPT, stats = {} }: { script?: string; stats?: Partial<UnitStats> } = {},
): Standing {
  const unit = standing('neutral', tile, stats);
  return { ...unit, entering: { type: unit.stats.type, faction: 'neutral', script, tile } };
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

/** The stocks named, and nothing of every other resource. */
export function onlyStocks(named: Partial<Resources>): Resources {
  return { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0, ...named };
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
export const WORKER_STATS = worker(CITY).stats;

export function everyCard(chronicle: Chronicle): CardId[] {
  return idsOf(cardsInPiles(chronicle)).sort();
}

/** What the stock rose by, resource by resource, from one chronicle to the next. */
export function gainedBetween(before: Chronicle, after: Chronicle): Resources {
  return Object.fromEntries(
    RESOURCES.map((resource) => [resource, after.resources[resource] - before.resources[resource]]),
  ) as Resources;
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

/** The names of the stages the enemy phase of the end of turn holds. */
export function enemyPhaseOf(chronicle: Chronicle, catalogue: Catalogue): string[] {
  return namesOf(heldBy(apply(catalogue, chronicle, { type: 'end-turn' }), 'enemy-phase'));
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
