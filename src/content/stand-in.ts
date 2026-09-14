import {
  built,
  enters,
  firstRefusal,
  gained,
  improved,
  inside,
  made,
  movePointsSpent,
  recalled,
  refreshed,
  slotFree,
  terraformed,
  throughWorker,
  unimproved,
} from '../rules/cards';
import { type Catalogue, catalogued, type EnemyScript } from '../rules/catalogue';
import {
  MOVE_POINT,
  movementCost,
  pathCosts,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from '../rules/map';
import { buildingKind, improvementKind } from '../rules/map-kinds';
import { besieged, laid, raided, reinforced } from '../rules/schedule';
import type { CardId, Chronicle } from '../rules/state';
import { type Landing, leastHealth, reachable, type Unit } from '../rules/units';

/** `PH_` marks a stand-in: this script is not authored content, and it goes with the enemies it drives. */
export const ADVANCE: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Landing {
    const stay: Landing = { tile: enemy.tile, cost: 0 };
    const target = nearest(catalogue, chronicle, enemy);
    if (target === undefined) return stay;

    const outward = costsFrom(catalogue, chronicle, target, enemy);
    const landings = [stay, ...reachable(catalogue, chronicle, enemy)];
    const spent = new Map(landings.map((landing) => [tileKey(landing.tile), landing.cost]));

    let chosen = stay;
    let cheapest = Number.POSITIVE_INFINITY;
    for (const tile of inTileOrder(
      chronicle.tiles,
      landings.map((landing) => landing.tile),
    )) {
      const at = tileKey(tile);
      const reached = outward.get(at);
      const own = movementCost(catalogue, tileAt(chronicle.tiles, tile));
      if (reached === undefined || own === undefined) continue;
      // The walk out charges the landing's own cost and not the target's; crossing back charges
      // the other way about, and the target's cost is the same for every landing weighed here.
      const away = reached - own;
      if (away >= cheapest) continue;
      cheapest = away;
      chosen = { tile, cost: spent.get(at) ?? 0 };
    }
    return chosen;
  },

  attacks(_catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
    if (tileKey(enemy.tile) === tileKey(chronicle.city)) return undefined;
    return leastHealth(chronicle.units, enemy);
  },
};

/** The region the boot launches the stand-in on. */
export const STAND_IN_REGION = 'PH_Region';

/** The schedule the boot launches the stand-in on, where the address names none. */
export const STAND_IN_SCHEDULE = 'PH_Schedule';

/** What the decks are built from: a card won on the map joins a chronicle and no deck. */
const FOUNDING_CARDS: readonly CardId[] = [
  'PH_Worker',
  'PH_Warrior',
  'PH_Farm',
  'PH_March',
  'PH_Harvest',
  'PH_Mine',
  'PH_Road',
  'PH_Urbanisation',
  'PH_Recall',
];

/** How many camps the siege places: what its rules entry reads and what it lands. */
const SIEGE_CAMPS = 5;

/** `PH_` marks a stand-in: none of this is authored content, and every piece of it goes. */
export const STAND_IN: Catalogue = catalogued({
  version: 'stand-in',
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
  scripts: { PH_Advance: ADVANCE },
  cards: {
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
            unimproved(catalogue, tile, 'PH_Mine'),
          ),
        (catalogue, paid, at) => improved(catalogue, paid, at, 'PH_Mine'),
      ),
    },
    PH_Road: {
      kind: 'instant',
      cost: { production: 2 },
      ...throughWorker(
        (catalogue, _chronicle, tile) =>
          firstRefusal(
            made(catalogue, tile, improvementKind(catalogue, 'PH_Road').terrains),
            unimproved(catalogue, tile, 'PH_Road'),
          ),
        (catalogue, paid, at) => improved(catalogue, paid, at, 'PH_Road'),
      ),
    },
    PH_Urbanisation: {
      kind: 'instant',
      cost: { production: 5 },
      ...throughWorker(
        (catalogue, _chronicle, tile) =>
          firstRefusal(made(catalogue, tile, ['plain']), slotFree(tile)),
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
    PH_Hunger: {
      kind: 'hazard',
      cost: { production: 3 },
      strikes: (_catalogue, chronicle) => ({
        ...chronicle,
        resources: { ...chronicle.resources, food: 0 },
      }),
    },
  },
  decks: { PH_Deck: copies(2), PH_LongDeck: copies(5) },
  events: {
    PH_Raid: {
      reads: (_catalogue, chronicle) => ({ warriors: raiders(chronicle.turn) }),
      lands: (catalogue, chronicle) => raided(catalogue, chronicle, raiders(chronicle.turn)),
    },
    PH_Famine: {
      reads: () => ({}),
      lands: (catalogue, chronicle) => laid(catalogue, chronicle, 'PH_Hunger'),
    },
    PH_Siege: {
      reads: () => ({ camps: SIEGE_CAMPS }),
      lands: (catalogue, chronicle) => besieged(catalogue, chronicle, SIEGE_CAMPS, [3, 5], 3),
      continues: reinforced,
    },
  },
  schedules: {
    [STAND_IN_SCHEDULE]: {
      spacing: [3, 7],
      deal: 2,
      capstone: { event: 'PH_Siege', window: [27, 33], span: 6 },
      entries: { PH_Raid: () => 1, PH_Famine: () => 1 },
    },
    PH_ShortSchedule: {
      spacing: [3, 7],
      deal: 2,
      capstone: { event: 'PH_Siege', window: [2, 2], span: 2 },
      entries: { PH_Raid: () => 1, PH_Famine: () => 1 },
    },
  },
  terrains: {
    plain: {
      yields: { food: 2 },
      movementCost: MOVE_POINT,
      water: false,
      elevation: 0,
      lift: 0,
      river: { food: 1 },
    },
    forest: {
      yields: { food: 1, production: 1 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 1,
      lift: 0,
      river: { food: 1 },
    },
    hills: {
      yields: { production: 2 },
      movementCost: 2 * MOVE_POINT,
      water: false,
      elevation: 2,
      lift: 1,
    },
    mountain: {
      yields: { production: 1 },
      movementCost: 6 * MOVE_POINT,
      water: false,
      elevation: 3,
      lift: 2,
    },
    coast: { yields: { food: 1, money: 1 }, water: true, elevation: 0, lift: 0 },
    deep: { yields: { food: 1 }, water: true, elevation: 0, lift: 0 },
    urban: {
      yields: { production: 1, military: 1, money: 1, science: 1, culture: 1 },
      movementCost: MOVE_POINT,
      water: false,
      elevation: 0,
      lift: 0,
    },
  },
  biomes: {
    land: {
      origin: 'plain',
      interior: { plain: 0.55, forest: 0.25, hills: 0.2 },
      rim: { plain: 0.55, forest: 0.25, hills: 0.2 },
      rimWidths: [1],
    },
    sea: {
      origin: 'deep',
      interior: { deep: 0.92, plain: 0.08 },
      rim: { coast: 1 },
      rimWidths: [0.2, 0.5, 0.3],
    },
    mountain: {
      origin: 'mountain',
      interior: { mountain: 0.7, hills: 0.3 },
      rim: { hills: 1 },
      rimWidths: [0.4, 0.6],
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
  },
  regions: {
    [STAND_IN_REGION]: {
      radius: 8,
      tilesPerBiome: 26,
      minBiomes: 5,
      centreBiome: 'land',
      biomeShares: [
        { biome: 'sea', share: 0.3 },
        { biome: 'mountain', share: 0.1 },
      ],
      featureShares: [{ feature: 'PH_Fertile', share: 1 / 6 }],
      camps: 3,
      campFromCentre: 4,
      campsApart: 3,
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
  camp: { unit: 'PH_Warrior', script: 'PH_Advance', building: 'PH_Camp', reward: 'PH_Spoils' },
  city: { terrain: 'urban', building: 'PH_City' },
});

/** A deck of this many copies of each founding card, in the order the founding cards are listed. */
function copies(count: number): readonly CardId[] {
  return FOUNDING_CARDS.flatMap((id) => Array<CardId>(count).fill(id));
}

/** How many warriors a raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** What an enemy moves toward: the player's unit or the city it crosses to for the least it can. */
function nearest(catalogue: Catalogue, chronicle: Chronicle, walker: Unit): TileCoords | undefined {
  const costs = costsFrom(catalogue, chronicle, walker.tile, walker);
  const targets = chronicle.units
    .filter((unit) => unit.faction === 'player')
    .map((unit) => unit.tile);

  let chosen: TileCoords | undefined;
  let cheapest = Number.POSITIVE_INFINITY;
  for (const coord of inTileOrder(chronicle.tiles, [...targets, chronicle.city])) {
    const cost = costs.get(tileKey(coord));
    if (cost !== undefined && cost < cheapest) {
      cheapest = cost;
      chosen = coord;
    }
  }
  return chosen;
}

/** The one order every tie in a script falls back on: the order the map lists its tiles in. */
function inTileOrder(tiles: readonly Tile[], coords: readonly TileCoords[]): TileCoords[] {
  const wanted = new Set(coords.map(tileKey));
  return tiles.filter((tile) => wanted.has(tileKey(tile))).map(({ q, r }) => ({ q, r }));
}

/**
 * What crossing to every tile from a start costs the walking unit, whatever stands on them and
 * however far off they lie: a script reads the whole map, so no move points cap the walk and a river
 * edge weighs the walker's whole move, what a crossing drains at worst. A tile no route reaches is
 * absent.
 */
function costsFrom(
  catalogue: Catalogue,
  chronicle: Chronicle,
  from: TileCoords,
  walker: Unit,
): Map<string, number> {
  return pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    from,
    { kind: 'whole-map', move: walker.stats.move },
    () => false,
  );
}
