/**
 * The fixtures the rules tests share, authored by the tests and entered through the rules. Nothing
 * outside a test imports this module: a rules module that did would ship fixtures in the build.
 */
import { apply, type Command, outcome } from './chronicle';
import {
  type BuildingTypeId,
  cornerKey,
  cornersOf,
  MOVE_POINT,
  neighbours,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import type { Resources } from './resources';
import { seedRng } from './rng';
import { scheduled } from './schedule';
import { charted } from './sight';
import { type CardId, type Chronicle, type Entering, type EventId, entered } from './state';
import type { Faction, Unit, UnitStats } from './units';

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
    const dealt = entered(stood, unit.entering);
    const last = dealt.units[dealt.units.length - 1];
    const authored: Unit = {
      ...last,
      stats: unit.stats,
      movePoints: unit.movePoints,
      action: unit.action,
    };
    stood = { ...dealt, units: [...dealt.units.slice(0, -1), authored] };
  }
  return charted(stood);
}

/** What a fixture authors on the chronicle it asks for: its state, and the units standing on it. */
export type Carrying = Partial<Omit<Chronicle, 'units' | 'nextUnit'>> & {
  readonly units?: readonly Standing[];
};

/**
 * A city on `inside`, tile by tile, with one plain lying outside the border and no cards. Its
 * inhabitants stand where the founding leaves them: one on each tile the city holds.
 */
export function cityOf(inside: Terrain[], carrying: Carrying = {}): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  const { units = [], ...state } = carrying;
  const city: Chronicle = {
    seed: 7,
    ...scheduled(seedRng(7)),
    snapshots: [],
    tiles: [
      ...inside.map(
        (terrain, index): Tile =>
          index === 0
            ? { q: 0, r: 0, terrain, improvements: [], building: 'PH_City' }
            : { q: index, r: 0, terrain, improvements: [] },
      ),
      { q: 0, r: 5, terrain: 'plain' as Terrain, improvements: [] },
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
 * its urban tile as the founding leaves it: in that tile's building slot.
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
export function built(tiles: Tile[], building: BuildingTypeId, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, building } : tile));
}

/** The same tiles, with a camp filling the building slot of the named ones. */
export function camped(tiles: Tile[], coords: TileCoords[]): Tile[] {
  return built(tiles, 'PH_Camp', coords);
}

function statsOf(stats: Partial<UnitStats>): UnitStats {
  return {
    type: 'PH_Warrior',
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
      return { ...state, entering: { type: carried.type, tile, faction, script: 'PH_Advance' } };
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
  return charted({
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
 * A city on a disc of plain out to `radius`, holding the seven tiles the founding holds with an
 * inhabitant on each and two idle besides.
 */
export function founded(radius: number, carrying: Carrying = {}): Chronicle {
  const held = [CITY, ...neighbours(CITY)];
  return cityOf(['urban'], {
    tiles: field(radius),
    held,
    population: held.length + 2,
    assigned: [...held],
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

/** A worker of the player's, standing on a tile with nothing to fight with. */
export function worker(tile: TileCoords): Standing {
  return standing('player', tile, { type: 'PH_Worker', damage: 0, range: 0 });
}

/** What a worker of these fixtures carries: what says which tiles one of them can stand on. */
export const WORKER = worker(CITY).stats;

export function everyCard(chronicle: Chronicle): CardId[] {
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
}

/** What every stage of the command is called, in the order the command resolves them. */
export function stagedBy(chronicle: Chronicle, command: Command): string[] {
  return apply(chronicle, command).map((stage) => stage.name);
}

/** Cards enough for the end of turn to draw a full hand, so its shuffle leaves the discard pile be. */
export function fullDraw(): CardId[] {
  return ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'];
}

/** The deck these foundings are played on: two of each card, enough to draw a hand and cycle. */
export const DECK: readonly CardId[] = [
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
];

/** How many turns these fixtures end before they give up on a schedule that has landed nothing. */
export const SCHEDULE_BOUND = 30;

/**
 * A capstone standing past every turn a walk of the schedule below reaches: what a fixture about the
 * ordinary cadence carries, so no siege is dealt in the middle of the turns it ends.
 */
export const LATE_CAPSTONE: Carrying = { capstoneTurn: SCHEDULE_BOUND * 2 };

/**
 * One whole turn: the end of turn, and the entry taken of the deal it may stop on — `wanted` where
 * this deal holds it, and the first entry dealt where it does not. Every fixture that ends turns
 * goes through here, because a chronicle waiting on a deal refuses every other command.
 */
export function endedTurn(chronicle: Chronicle, wanted?: EventId): Chronicle {
  const ended = outcome(apply(chronicle, { type: 'end-turn' }));
  if (ended.deal.length === 0) return ended;
  const taken = wanted !== undefined && ended.deal.includes(wanted) ? wanted : ended.deal[0];
  return outcome(apply(ended, { type: 'take', event: taken }));
}

/**
 * The chronicle every event landed on over thirty whole turns, in the order they landed; `wanted`
 * is the entry taken wherever the deal offers it.
 */
export function landings(chronicle: Chronicle, wanted?: EventId): Chronicle[] {
  let standing = chronicle;
  const landed: Chronicle[] = [];
  for (let turn = 0; turn < SCHEDULE_BOUND; turn++) {
    const dealt = standing.nextEvent;
    standing = endedTurn(standing, wanted);
    if (standing.nextEvent !== dealt) landed.push(standing);
  }
  return landed;
}

/**
 * Whole turn after whole turn until a raid enters an enemy, and the chronicle that turn left: the
 * raid is taken wherever it is dealt. A fixture with no camp free gives up instead, the raid it
 * takes entering nobody.
 */
export function toFirstRaid(chronicle: Chronicle): Chronicle {
  let standing = chronicle;
  for (let turn = 0; turn < SCHEDULE_BOUND; turn++) {
    standing = endedTurn(standing, 'PH_Raid');
    if (enemiesOf(standing).length > 0) return standing;
  }
  throw new Error(`this schedule entered no raider in ${SCHEDULE_BOUND} turns`);
}

/**
 * The chronicle the last of thirty turns' landings left: what a fixture no raid can enter a warrior
 * on is read through, there being no landing of its own for it to stop at.
 */
export function throughSchedule(chronicle: Chronicle): Chronicle {
  const landed = landings(chronicle, 'PH_Raid');
  if (landed.length === 0) {
    throw new Error(`this schedule landed no event in ${SCHEDULE_BOUND} turns`);
  }
  return landed[landed.length - 1];
}

/** The enemies standing on the chronicle: what a raid entered, and nothing for a famine. */
export function enemiesOf(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'enemy');
}
