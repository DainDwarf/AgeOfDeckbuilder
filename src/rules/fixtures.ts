/**
 * The fixtures the rules tests share, authored by the tests and entered through the rules. Nothing
 * outside a test imports this module: a rules module that did would ship fixtures in the build.
 */
// The one import of `src/content/` under `src/rules/`, allowed because this module is test-only.
import { ADVANCE } from '../content/stand-in';
import {
  built,
  claimableTile,
  enters,
  firstRefusal,
  gained,
  improved,
  inside,
  made,
  movePointsSpent,
  recalled,
  refreshed,
  settled,
  slotFree,
  terraformed,
  throughWorker,
  unimproved,
} from './cards';
import {
  type Catalogue,
  cardOf,
  catalogued,
  type Deck,
  deckOf,
  type Entering,
  entered,
} from './catalogue';
import { apply, beginChronicle, type Command, launched, outcome } from './chronicle';
import { arrived, bordered } from './city';
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
  tileKey,
} from './map';
import { buildingKind, improvementKind } from './map-kinds';
import type { Resources } from './resources';
import { seedRng } from './rng';
import { besieged, laid, raided, reinforced } from './schedule';
import { charted } from './sight';
import type { CardId, Chronicle, Timeline } from './state';
import type { Faction, Unit, UnitStats } from './units';

/** How many camps the fixture's siege places: what its rules entry reads and what it lands. */
const SIEGE_CAMPS = 5;

/** How many warriors the fixture's raid enters on this turn: one, and one more for every ten turns. */
function raiders(turn: number): number {
  return 1 + Math.floor(turn / 10);
}

/** The content every fixture is played on, its numbers the fixture's own. */
export const CATALOGUE: Catalogue = catalogued({
  version: 'fixture',
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
  scripts: { advance: ADVANCE },
  cards: {
    PH_Settle: {
      kind: 'settle',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, _chronicle, tile) =>
        firstRefusal(made(catalogue, tile, ['plain', 'forest', 'hills']), slotFree(tile)),
      effect: (catalogue, paid, at) =>
        settled(catalogue, terraformed(catalogue, paid, at, catalogue.city.terrain), at),
    },
    PH_Claim: {
      kind: 'instant',
      cost: {},
      aim: 'tile',
      refuses: (catalogue, chronicle, tile) => claimableTile(catalogue, chronicle, tile),
      effect: (_catalogue, paid, at) => bordered(arrived(paid), at),
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
  decks: {
    deck: {
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
      settle: ['PH_Settle', 'PH_Claim'],
    },
  },
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
    schedule: {
      spacing: [3, 7],
      deal: 2,
      capstone: { event: 'PH_Siege', window: [27, 33], span: 6 },
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
    PH_Trail: {
      terrains: ['plain', 'forest', 'hills', 'urban'],
      yields: {},
      movementCost: (3 * MOVE_POINT) / 4,
    },
    PH_Rubble: { terrains: ['plain'], yields: {}, movementCost: 2 * MOVE_POINT },
  },
  regions: {
    disc: {
      radius: 8,
      centre: 3,
      tilesPerBiome: 26,
      minBiomes: 5,
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
  camp: { unit: 'PH_Warrior', script: 'advance', building: 'PH_Camp', reward: 'PH_Spoils' },
  city: { terrain: 'urban', building: 'PH_City', sight: 2, idle: 2 },
});

/** The one region the fixture catalogue deals its maps from. */
export const REGION = 'disc';

/** The one schedule the fixture catalogue rolls its timelines from. */
export const SCHEDULE = 'schedule';

/**
 * A timeline dealing nothing: no deal at all, and the capstone on a turn past any a test ends. What a
 * fixture chronicle carries unless its test writes the deals it wants.
 */
export const NO_DEALS: Timeline = {
  deals: [],
  capstone: { event: 'PH_Siege', turn: 1000, last: 1005 },
};

/** A timeline dealing these entries on these turns, and its capstone as `NO_DEALS` has it. */
export function dealing(...deals: Timeline['deals']): Timeline {
  return { ...NO_DEALS, deals };
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
    const dealt = entered(CATALOGUE, stood, unit.entering);
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

/** What a fixture authors on the chronicle it asks for: its state, and the units standing on it. */
export type Carrying = Partial<Omit<Chronicle, 'units' | 'nextUnit'>> & {
  readonly units?: readonly Standing[];
};

/**
 * A city on `inside`, tile by tile, with one plain lying outside the border and no cards. Its
 * inhabitants stand one on each tile the city holds, and none is idle.
 */
export function cityOf(inside: Terrain[], carrying: Carrying = {}): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  const { units = [], ...state } = carrying;
  const city: Chronicle = {
    content: CATALOGUE.version,
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
    city: CITY,
    held,
    turn: 1,
    deal: [],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: held.length,
    assigned: [...held],
    units: [],
    nextUnit: 1,
    drawPile: [],
    hand: [],
    discardPile: [],
    ...state,
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

/** What a fixture opening names: the deck, the timeline, and how far the centre part reaches. */
type Opening = {
  readonly deck?: Deck;
  readonly timeline?: Timeline;
  readonly reach?: number;
};

/**
 * The chronicle opened on these tiles through the rules, standing on turn 0 with the city nowhere:
 * its centre part every tile within `reach` of the centre, two unless the fixture names it, on the
 * fixture's deck and a timeline dealing nothing unless the fixture names others.
 */
export function opening(
  tiles: Tile[],
  { deck = DECK, timeline = NO_DEALS, reach = 2 }: Opening = {},
): Chronicle {
  const centre = tiles
    .filter((tile) => distance(tile, CITY) <= reach)
    .map(({ q, r }) => ({ q, r }));
  return beginChronicle(CATALOGUE, 7, deck, { tiles, rivers: [], centre }, timeline);
}

/** The chronicle with the first settle card of its hand played on a tile, refused or not. */
export function settledOn(
  chronicle: Chronicle,
  tile: TileCoords,
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  const index = chronicle.hand.findIndex((id) => cardOf(catalogue, id).kind === 'settle');
  return outcome(apply(catalogue, chronicle, { type: 'play', index, aim: 'tile', tile }));
}

/**
 * A chronicle launched as the boot launches one, its settle card played on a tile — the centre tile
 * unless the fixture names another — and turn 0 ended, all through the rules: turn 1 as that end
 * leaves it, standing on the deal where turn 1 deals one. A settle the tile refuses throws.
 */
export function settledLaunch(
  catalogue: Catalogue,
  region: string,
  schedule: string,
  seed: number,
  deck: Deck,
  at: TileCoords = CITY,
): Chronicle {
  const settling = settledOn(launched(catalogue, region, schedule, seed, deck), at, catalogue);
  if (settling.city === undefined)
    throw new Error(`seed ${seed} settles no city on ${tileKey(at)}`);
  return outcome(apply(catalogue, settling, { type: 'end-turn' }));
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
  return builtOn(tiles, CATALOGUE.camp.building, coords);
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
      return { ...state, entering: { type: carried.type, tile, faction, script: 'advance' } };
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

/** The command city mode sends for a tile: an inhabitant on it, or the one on it off. */
export function assignTo(tile: TileCoords): Command {
  return { type: 'assign', tile };
}

/** The command city mode sends for a tile the city does not hold: culture for the tile. */
export function claimOf(tile: TileCoords): Command {
  return { type: 'claim', tile };
}

/**
 * A city on a disc of plain out to `radius`, holding its own tile and the six around it, one
 * inhabitant on each and two idle.
 */
export function ringed(radius: number, carrying: Carrying = {}): Chronicle {
  const ring = [CITY, ...neighbours(CITY)];
  return cityOf(['urban'], {
    tiles: field(radius),
    held: ring,
    population: ring.length + 2,
    assigned: [...ring],
    ...carrying,
  });
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
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
}

/** What every stage of the command is called, in the order the command resolves them. */
export function stagedBy(chronicle: Chronicle, command: Command): string[] {
  return apply(CATALOGUE, chronicle, command).map((stage) => stage.name);
}

/** Cards enough for the end of turn to draw a full hand, so its shuffle leaves the discard pile be. */
export function fullDraw(): CardId[] {
  return ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'];
}

/** The deck these chronicles are played on: two of each card, enough to draw a hand and cycle, and the settle. */
export const DECK: Deck = deckOf(CATALOGUE, 'deck');

/**
 * One whole turn: the end of turn, and the entry taken of the deal it may stop on — `wanted` where
 * this deal holds it, and the first entry dealt where it does not. Every fixture that ends turns
 * goes through here, because a chronicle waiting on a deal refuses every other command.
 */
export function endedTurn(chronicle: Chronicle, wanted?: string): Chronicle {
  const ended = outcome(apply(CATALOGUE, chronicle, { type: 'end-turn' }));
  if (ended.deal.length === 0) return ended;
  const taken = wanted !== undefined && ended.deal.includes(wanted) ? wanted : ended.deal[0];
  return outcome(apply(CATALOGUE, ended, { type: 'take', event: taken }));
}

/** The enemies standing on the chronicle: what a raid entered, and nothing for a famine. */
export function enemiesOf(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'enemy');
}
