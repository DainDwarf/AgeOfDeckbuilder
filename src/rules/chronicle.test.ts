import { expect, test } from 'vitest';
import { type AimedCard, CARDS, DECKS, refuses } from './cards';
import {
  admitted,
  apply,
  beginChronicle,
  type Command,
  cityCommand,
  cityDrag,
  claimable,
  growthThreshold,
  outcome,
  playable,
  refusalOf,
  tileCost,
  tileRefusal,
} from './chronicle';
import {
  BUILDINGS,
  type BuildingTypeId,
  cornerKey,
  cornersOf,
  distance,
  FEATURES,
  IMPROVEMENTS,
  MAP_COMPOSITION,
  MOVE_POINT,
  neighbours,
  RIVER_YIELDS,
  type River,
  TERRAIN_YIELDS,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { RESOURCES, type Resources } from './resources';
import { seedRng } from './rng';
import { charted } from './sight';
import { type CardId, type Chronicle, type Entering, entered, idle, type TileBlock } from './state';
import { type Faction, standsOn, UNIT_STATS, type Unit, type UnitStats } from './units';

const CITY: TileCoords = { q: 0, r: 0 };

/** The deck the foundings below are played on: two of each card, enough to draw a hand and cycle. */
const DECK: readonly CardId[] = [
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

/**
 * A unit a fixture puts on the map: what it enters as, and the state the fixture authors on it once
 * it stands there.
 */
type Standing = {
  readonly entering: Entering;
  readonly stats: UnitStats;
  readonly movePoints: number;
  readonly action: number;
};

/**
 * The chronicle with these units entered on it through the rules and the map charted of what they
 * see. The one way a fixture puts units on the map.
 */
function withUnits(chronicle: Chronicle, units: readonly Standing[]): Chronicle {
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
type Carrying = Partial<Omit<Chronicle, 'units' | 'nextUnit'>> & {
  readonly units?: readonly Standing[];
};

/**
 * A city on `inside`, tile by tile, with one plain lying outside the border and no cards. Its
 * inhabitants stand where the founding leaves them: one on each tile the city holds.
 */
function cityOf(inside: Terrain[], carrying: Carrying = {}): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  const { units = [], ...state } = carrying;
  const city: Chronicle = {
    seed: 7,
    rng: seedRng(7),
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
function field(radius: number, coast: TileCoords[] = []): Tile[] {
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
function only(radius: number, land: TileCoords[]): Tile[] {
  const kept = new Set(land.map(tileKey));
  return field(
    radius,
    field(radius).filter((tile) => !kept.has(tileKey(tile))),
  );
}

/** A river running along the edge two tiles share: the two corners both of them carry. */
function riverBetween(a: TileCoords, b: TileCoords): River {
  const beside = new Set(cornersOf(b).map(cornerKey));
  return cornersOf(a).filter((corner) => beside.has(cornerKey(corner)));
}

/** The same tiles, with the terrain of the named ones replaced. */
function madeOf(tiles: Tile[], terrain: Terrain, coords: TileCoords[]): Tile[] {
  const named = new Set(coords.map(tileKey));
  return tiles.map((tile) => (named.has(tileKey(tile)) ? { ...tile, terrain } : tile));
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
function standing(
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
function unitNamed(chronicle: Chronicle, unit: number): Unit {
  const named = chronicle.units.find((other) => other.id === unit);
  if (named === undefined) throw new Error(`no unit of this chronicle is numbered ${unit}`);
  return named;
}

/** A unit of the player's sent to a tile, ready to hand to `apply`. */
function moveTo(unit: number, to: TileCoords): Command {
  return { type: 'move', unit, tile: to };
}

/** A unit of the player's attacking what stands on a tile, ready to hand to `apply`. */
function attackOn(unit: number, at: TileCoords): Command {
  return { type: 'attack', unit, tile: at };
}

/** What a unit has left of its move points. */
function pointsOf(chronicle: Chronicle, unit: number): number {
  return unitNamed(chronicle, unit).movePoints;
}

/** What a unit has left of its action. */
function actionOf(chronicle: Chronicle, unit: number): number {
  return unitNamed(chronicle, unit).action;
}

/** A card aimed at a tile, ready to hand to `apply`. */
function aimedAt(tile: TileCoords): Command {
  return { type: 'play', index: 0, aim: 'tile', tile };
}

/** A card aimed at the unit standing on a tile, ready to hand to `apply`. */
function aimedAtUnit(tile: TileCoords): Command {
  return { type: 'play', index: 0, aim: 'unit', tile };
}

/** A card aimed at where a card lies in the discard pile, ready to hand to `apply`. */
function aimedAtPile(card: number): Command {
  return { type: 'play', index: 0, aim: 'discard-pile', card };
}

/** The named card, for a fixture that expects it to be aimed at a tile or at a unit. */
function aimedCard(id: CardId): AimedCard {
  const card = CARDS[id];
  if (card.aim !== 'tile' && card.aim !== 'unit')
    throw new Error(`${id} is aimed at neither a tile nor a unit`);
  return card;
}

/** The tiles the named card's aim admits, for a card aimed at a tile or at a unit. */
function admittedTiles(chronicle: Chronicle, id: CardId): TileCoords[] {
  return admitted(chronicle, aimedCard(id));
}

/** The one reason the named card's aim refuses this tile of the map, and nothing when it admits it. */
function refusedFor(chronicle: Chronicle, id: CardId, at: TileCoords): TileBlock | undefined {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) throw new Error(`${tileKey(at)} is no tile of the map`);
  return refuses(chronicle, aimedCard(id), tile);
}

/** The chronicle with the tile at those coordinates replaced, layer for layer. */
function withTile(chronicle: Chronicle, tile: Tile): Chronicle {
  return charted({
    ...chronicle,
    tiles: chronicle.tiles.map((other) => (tileKey(other) === tileKey(tile) ? tile : other)),
  });
}

/** The command city mode sends for a tile: an inhabitant on it, or the one on it off. */
function assignTo(tile: TileCoords): Command {
  return { type: 'assign', tile };
}

/** The command city mode sends for a tile the city does not hold: culture for the tile. */
function claimOf(tile: TileCoords): Command {
  return { type: 'claim', tile };
}

/** The command a drag in city mode sends: the inhabitant off one tile and onto another. */
function reassignTo(from: TileCoords, to: TileCoords): Command {
  return { type: 'reassign', from, to };
}

/**
 * A city on a disc of plain out to `radius`, holding the seven tiles the founding holds with an
 * inhabitant on each and two idle besides.
 */
function founded(radius: number, carrying: Carrying = {}): Chronicle {
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
const NO_GROWTH: Carrying = { population: 99 };

/** What the city holds to claim with, and nothing besides. */
function culture(amount: number): Resources {
  return { food: 0, production: 0, military: 0, money: 0, science: 0, culture: amount };
}

/** What the city holds to build and to work tiles with, and nothing besides. */
function production(amount: number): Resources {
  return { food: 0, production: amount, military: 0, money: 0, science: 0, culture: 0 };
}

/** What the city holds to play a science instant with, and nothing besides. */
function science(amount: number): Resources {
  return { food: 0, production: 0, military: 0, money: 0, science: amount, culture: 0 };
}

/** What the city pays for the worker card, and nothing besides. */
const FOOD: Resources = { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 };

function buildingAt(chronicle: Chronicle, { q, r }: TileCoords): BuildingTypeId | undefined {
  return chronicle.tiles.find((tile) => tile.q === q && tile.r === r)?.building;
}

/** A worker of the player's, standing on a tile with nothing to fight with and no action to fight on. */
function worker(tile: TileCoords): Standing {
  return standing('player', tile, { type: 'PH_Worker', damage: 0, range: 0, action: 0 });
}

/** What a worker of these fixtures carries: what says which tiles one of them can stand on. */
const WORKER = worker(CITY).stats;

/**
 * The founding on a disc out to two, with the tile at `at` made of `terrain` and a worker of the
 * player's standing on it wherever a worker can stand at all: ground no worker enters holds nobody.
 * The seven tiles the founding holds reach out to one, so a tile further out lies outside the border.
 */
function workedTile(at: TileCoords, terrain: Terrain, carrying: Carrying = {}): Chronicle {
  const tiles = madeOf(field(2), terrain, [at]);
  return founded(2, {
    tiles,
    units: standsOn(WORKER, tileAt(tiles, at)) ? [worker(at)] : [],
    ...carrying,
  });
}

function everyCard(chronicle: Chronicle): CardId[] {
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
}

/** What every stage of the command is called, in the order the command resolves them. */
function stagedBy(chronicle: Chronicle, command: Command): string[] {
  return apply(chronicle, command).map((stage) => stage.name);
}

/** Every attack the end of turn stages, as the tile each was made from and the tile it was aimed at. */
function attacksOf(chronicle: Chronicle): string[][] {
  return apply(chronicle, { type: 'end-turn' }).flatMap((stage) =>
    stage.name === 'attack' ? [[tileKey(stage.attacker), tileKey(stage.target)]] : [],
  );
}

/** Every move the end of turn stages, as the tile each enemy left and the tile it reached. */
function movesOf(chronicle: Chronicle): string[][] {
  return apply(chronicle, { type: 'end-turn' }).flatMap((stage) =>
    stage.name === 'move' ? [[tileKey(stage.from), tileKey(stage.to)]] : [],
  );
}

/** Every tile of a disc at its outer ring: what an arrival draws from. */
function outerRingOf(radius: number): TileCoords[] {
  return field(radius)
    .filter((tile) => distance(tile, CITY) === radius)
    .map(({ q, r }) => ({ q, r }));
}

/** A tile of a generated map that touches the border and has never been in sight. */
function unchartedTouching(chronicle: Chronicle): TileCoords {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  const found = chronicle.tiles.find(
    (tile) => distance(tile, chronicle.city) === 2 && !seen.has(tileKey(tile)),
  );
  if (found === undefined) throw new Error('every tile touching this border has been in sight');
  return { q: found.q, r: found.r };
}

/**
 * The chronicle with a worker entered and stepped onto a tile between the city and `tile`, from
 * where it charts it.
 */
function withWorkerBeside(chronicle: Chronicle, tile: TileCoords): Chronicle {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1) throw new Error('this hand holds no worker to enter');
  const entered = outcome(apply(chronicle, { type: 'play', index: at, aim: 'none' }));
  const worker = entered.units[entered.units.length - 1];
  const between = neighbours(entered.city).find((coord) => distance(coord, tile) === 1);
  if (between === undefined) throw new Error(`no tile of the border touches ${tileKey(tile)}`);
  return outcome(apply(entered, { type: 'move', unit: worker.id, tile: between }));
}

/** Four ends of turn on: the chronicle stands on turn five, with that turn's events resolved. */
function toFifthTurn(chronicle: Chronicle): Chronicle {
  let standing = chronicle;
  for (let turn = 1; turn < 5; turn++) standing = outcome(apply(standing, { type: 'end-turn' }));
  return standing;
}

test('the same seed founds the same chronicle', () => {
  expect(beginChronicle(1234, DECK)).toEqual(beginChronicle(1234, DECK));
  expect(beginChronicle(1235, DECK)).not.toEqual(beginChronicle(1234, DECK));
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('the city holds its own tile and every tile touching it', () => {
  for (const seed of [0, 1234, 0xdeadbeef | 0]) {
    const chronicle = beginChronicle(seed, DECK);
    const held = new Set(chronicle.held.map(tileKey));

    expect(held.size).toBe(7);
    for (const tile of chronicle.tiles) {
      expect(held.has(tileKey(tile))).toBe(distance(tile, chronicle.city) <= 1);
    }
  }
});

test('a chronicle opens on turn one, with empty stores and more inhabitants than tiles', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(chronicle.turn).toBe(1);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.population).toBe(chronicle.held.length + 2);
});

test('income yields every tile inside the border, and nothing outside it', () => {
  const inside: Terrain[] = ['urban', 'plain', 'forest', 'hills', 'mountain', 'coast'];

  const after = outcome(apply(cityOf(inside, NO_GROWTH), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    const yielded = inside.reduce(
      (total, terrain) => total + (TERRAIN_YIELDS[terrain][resource] ?? 0),
      0,
    );
    expect(after.resources[resource]).toBe(yielded);
  }
});

test('a second tile of the same terrain yields as much again', () => {
  const once = outcome(apply(cityOf(['forest'], NO_GROWTH), { type: 'end-turn' }));
  const twice = outcome(apply(cityOf(['forest', 'forest'], NO_GROWTH), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(twice.resources[resource]).toBe(once.resources[resource] * 2);
  }
});

test('an assigned tile yields what all four of its layers declare, summed', () => {
  const layered: Tile = {
    q: 1,
    r: 0,
    terrain: FEATURES.PH_Fertile.terrain,
    feature: 'PH_Fertile',
    improvements: ['PH_Mine'],
    building: 'PH_Farm',
  };
  const city = cityOf(['urban', layered.terrain], NO_GROWTH);

  const after = outcome(apply(withTile(city, layered), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      (TERRAIN_YIELDS.urban[resource] ?? 0) +
        (BUILDINGS.PH_City.yields[resource] ?? 0) +
        (TERRAIN_YIELDS[layered.terrain][resource] ?? 0) +
        (FEATURES.PH_Fertile.yields[resource] ?? 0) +
        (IMPROVEMENTS.PH_Mine.yields[resource] ?? 0) +
        (BUILDINGS.PH_Farm.yields[resource] ?? 0),
    );
  }
});

test('a river running along a tile gives it one food at income, however many edges it runs along', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(apply(cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }));

  for (const river of [around.slice(0, 2), around.slice(0, 4)]) {
    const city = cityOf(['urban', 'plain'], { ...NO_GROWTH, rivers: [river] });

    const after = outcome(apply(city, { type: 'end-turn' }));

    for (const resource of RESOURCES) {
      expect(after.resources[resource]).toBe(
        bare.resources[resource] + (RIVER_YIELDS.plain?.[resource] ?? 0),
      );
    }
  }
});

test('two rivers meeting at a tile give it the one food between them', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(apply(cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }));
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    rivers: [around.slice(1, 3), around.slice(2, 4)],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      bare.resources[resource] + (RIVER_YIELDS.plain?.[resource] ?? 0),
    );
  }
});

test('a river running along a terrain it feeds nothing gives that tile nothing', () => {
  const at = { q: 1, r: 0 };
  const bare = outcome(apply(cityOf(['urban', 'hills'], NO_GROWTH), { type: 'end-turn' }));
  const city = cityOf(['urban', 'hills'], { ...NO_GROWTH, rivers: [cornersOf(at).slice(0, 2)] });

  const after = outcome(apply(city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(bare.resources[resource]);
  }
});

test('a plain a river runs along stops taking its food once the tile is terraformed', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'plain', {
    ...NO_GROWTH,
    hand: ['PH_Urbanisation'],
    resources: production(5),
    rivers: [cornersOf(at).slice(0, 2)],
  });

  const plain = outcome(apply({ ...city, resources: production(0) }, { type: 'end-turn' }));
  const urban = outcome(apply(outcome(apply(city, aimedAt(at))), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(urban.resources[resource]).toBe(
      plain.resources[resource] -
        (TERRAIN_YIELDS.plain[resource] ?? 0) -
        (RIVER_YIELDS.plain?.[resource] ?? 0) +
        (TERRAIN_YIELDS.urban[resource] ?? 0),
    );
  }
});

test('resources accumulate over consecutive turns', () => {
  const city = cityOf(['urban', 'plain', 'hills'], NO_GROWTH);

  const first = outcome(apply(city, { type: 'end-turn' }));
  const second = outcome(apply(first, { type: 'end-turn' }));
  const third = outcome(apply(second, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(third.resources[resource]).toBe(first.resources[resource] * 3);
  }
});

test('ending the turn moves the chronicle on to the next one', () => {
  const city = cityOf(['urban']);
  const second = outcome(apply(city, { type: 'end-turn' }));

  expect(second.turn).toBe(2);
  expect(outcome(apply(second, { type: 'end-turn' })).turn).toBe(3);
});

test('a food stock short of the growth threshold grows nobody, and the stock is kept', () => {
  const city = cityOf(['urban', 'plain', 'coast'], NO_GROWTH);

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population);
  expect(after.resources.food).toBe(3);
  expect(stagedBy(city, { type: 'end-turn' })).not.toContain('grow');
});

test('the food stock reaching the growth threshold is spent on one inhabitant, and that one is idle', () => {
  const city = cityOf(['urban', 'plain'], {
    population: 3,
    resources: { food: 1, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(0);
  expect(after.assigned).toEqual(city.assigned);
  expect(idle(after)).toBe(idle(city) + 1);
});

test('the growth threshold is the food the next inhabitant needs: one short of it grows nobody', () => {
  const city = cityOf(['urban', 'plain'], { population: 5, assigned: [] });
  const stocked = (food: number): Chronicle => ({
    ...city,
    resources: { ...city.resources, food },
  });

  const short = outcome(apply(stocked(growthThreshold(city) - 1), { type: 'end-turn' }));
  const reached = outcome(apply(stocked(growthThreshold(city)), { type: 'end-turn' }));

  expect(short.population).toBe(city.population);
  expect(short.resources.food).toBe(growthThreshold(city) - 1);
  expect(reached.population).toBe(city.population + 1);
  expect(reached.resources.food).toBe(0);
});

test('a food stock worth several growth thresholds grows one inhabitant and no more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 9, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(7);
});

test('the growth threshold widens with the population: the next inhabitant costs one food more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 5, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const first = outcome(apply(city, { type: 'end-turn' }));
  const second = outcome(apply(first, { type: 'end-turn' }));

  expect(first.population).toBe(3);
  expect(first.resources.food).toBe(3);
  expect(second.population).toBe(4);
  expect(second.resources.food).toBe(0);
});

test('growth is staged right after the income it comes from, and before the enemy phase', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(3),
    population: 2,
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT })],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'income',
    'grow',
    'move',
    'attack',
    'turn',
  ]);
});

test('the hand holds five cards on founding, and five again after every turn', () => {
  let chronicle = beginChronicle(4242, DECK);
  expect(chronicle.hand).toHaveLength(5);

  for (let turn = 0; turn < 6; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(chronicle.hand).toHaveLength(5);
  }
});

test('playing a card pays its cost and sends it to the discard pile', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_March'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 3, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'play', index: 0, aim: 'none' }));

  expect(after.hand).toEqual(['PH_March']);
  expect(after.discardPile).toEqual(['PH_Harvest']);
  expect(after.resources.science).toBe(2);
});

test('playing the harvest card gains its two food, on top of what the city already holds', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'play', index: 0, aim: 'none' }));

  expect(after.resources.food).toBe(3);
});

test('a card the city cannot pay for stays in the hand and costs nothing', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const halfway = cityOf(['urban'], {
    hand: ['PH_Farm'],
    resources: { food: 0, production: 2, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(outcome(apply(penniless, { type: 'play', index: 0, aim: 'none' }))).toEqual(penniless);
  expect(outcome(apply(halfway, { type: 'play', index: 0, aim: 'none' }))).toEqual(halfway);
});

test('a play the rules refuse is one refused stage, on the chronicle as it stood', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const command: Command = { type: 'play', index: 0, aim: 'none' };

  expect(stagedBy(penniless, command)).toEqual(['refused']);
  expect(outcome(apply(penniless, command))).toBe(penniless);
  expect(stagedBy(penniless, { type: 'play', index: 3, aim: 'none' })).toEqual(['refused']);
});

test('a card that lands whole is played in the one stage, the effect already in it', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const stages = apply(city, { type: 'play', index: 0, aim: 'none' });

  expect(stages.map((stage) => stage.name)).toEqual(['played']);
  expect(stages[0].chronicle.resources).toEqual({ ...city.resources, food: 3, science: 0 });
  expect(stages[0].chronicle.discardPile).toEqual(['PH_Harvest']);
});

test('a move is one stage, naming the tile the unit left and the one it reached', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }),
      standing('enemy', { q: 1, r: 1 }, { health: 3 }),
    ],
  });

  const stages = apply(city, moveTo(1, { q: 1, r: 0 }));
  const [crossed] = stages;
  if (crossed.name !== 'move') throw new Error('the command staged no move');

  expect(stages.map((stage) => stage.name)).toEqual(['move']);
  expect(crossed.from).toEqual(CITY);
  expect(crossed.to).toEqual({ q: 1, r: 0 });
  expect(crossed.chronicle.units[0].tile).toEqual({ q: 1, r: 0 });
  // The unit that arrives beside an enemy leaves it alone: an arrival attacks nothing.
  expect(crossed.chronicle.units[1].stats.health).toBe(3);
});

test('a unit steps tile by tile, in as many steps as it has move points', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const first = outcome(apply(city, moveTo(1, { q: 1, r: 0 })));
  expect(first.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(pointsOf(first, 1)).toBe(MOVE_POINT);

  const second = outcome(apply(first, moveTo(1, { q: 2, r: 0 })));
  expect(second.units[0].tile).toEqual({ q: 2, r: 0 });
  expect(pointsOf(second, 1)).toBe(0);

  expect(stagedBy(second, moveTo(1, { q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(second, moveTo(1, { q: 3, r: 0 })))).toBe(second);
});

test('a unit with no move points left crosses nothing until the turn ticks', () => {
  const spent = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }, 0)],
  });

  expect(stagedBy(spent, moveTo(1, { q: 1, r: 0 }))).toEqual(['refused']);

  const ticked = outcome(apply(spent, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(2 * MOVE_POINT);
  expect(outcome(apply(ticked, moveTo(1, { q: 1, r: 0 }))).units[0].tile).toEqual({ q: 1, r: 0 });
});

test('the turn refreshes every unit to its move, and never past it', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, 0),
      standing('player', { q: 1, r: 1 }, { move: 3 * MOVE_POINT }),
      standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  const ticked = outcome(apply(city, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(2 * MOVE_POINT);
  expect(pointsOf(ticked, 2)).toBe(3 * MOVE_POINT);
  expect(pointsOf(ticked, 3)).toBe(2 * MOVE_POINT);
});

test('a unit entering by its card enters with its move points full, and moves the same turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    resources: FOOD,
  });

  const entered = outcome(apply(city, { type: 'play', index: 0, aim: 'none' }));

  expect(pointsOf(entered, 1)).toBe(UNIT_STATS.PH_Worker.move);

  const moved = outcome(apply(entered, moveTo(1, { q: 1, r: 0 })));

  expect(moved.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(pointsOf(moved, 1)).toBe(UNIT_STATS.PH_Worker.move - MOVE_POINT);
});

test('the refresh instant refreshes one unit of the player’s that has spent move points', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, 0),
      standing('player', { q: 1, r: 1 }, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  const stages = apply(city, aimedAtUnit(CITY));

  expect(stages.map((stage) => stage.name)).toEqual(['played']);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
  expect(pointsOf(outcome(stages), 2)).toBe(MOVE_POINT);
  expect(outcome(stages).discardPile).toEqual(['PH_March']);
});

test('the refresh instant is refused on a unit whose move points are full, on an enemy, on a tile nobody stands on and at nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, MOVE_POINT),
      standing('player', { q: 1, r: 1 }, { move: 2 * MOVE_POINT }),
      standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT }, 0),
    ],
  });

  expect(stagedBy(city, aimedAtUnit({ q: 1, r: 1 }))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtUnit({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtUnit({ q: 0, r: 1 }))).toEqual(['refused']);
  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
  expect(outcome(apply(city, aimedAtUnit({ q: 1, r: 1 })))).toBe(city);
  expect(outcome(apply(city, aimedAtUnit({ q: 2, r: 0 })))).toBe(city);
  expect(outcome(apply(city, aimedAtUnit({ q: 0, r: 1 })))).toBe(city);
  expect(outcome(apply(city, { type: 'play', index: 0, aim: 'none' }))).toBe(city);
});

test('the recall instant takes the card it is aimed at out of the discard pile and into the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm', 'PH_Harvest', 'PH_Mine'],
    resources: science(2),
  });

  const stages = apply(city, aimedAtPile(1));
  const after = outcome(stages);

  expect(stages.map((stage) => stage.name)).toEqual(['played']);
  expect(after.hand).toEqual(['PH_Harvest']);
  expect(after.discardPile).toEqual(['PH_Farm', 'PH_Mine', 'PH_Recall']);
  expect(after.resources.science).toBe(0);
  expect(everyCard(after)).toEqual(everyCard(city));
});

test('the recall instant is refused at a card the discard pile does not hold, and at nothing', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm', 'PH_Harvest'],
    resources: science(2),
  });

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
  expect(stagedBy(city, aimedAtPile(-1))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtPile(2))).toEqual(['refused']);
  expect(outcome(apply(city, { type: 'play', index: 0, aim: 'none' }))).toBe(city);
  expect(outcome(apply(city, aimedAtPile(-1)))).toBe(city);
  expect(outcome(apply(city, aimedAtPile(2)))).toBe(city);
});

test('the recall instant never brings back the card it sent to the discard pile itself', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(2),
  });

  expect(stagedBy(city, aimedAtPile(1))).toEqual(['refused']);
  expect(outcome(apply(city, aimedAtPile(1)))).toBe(city);
  expect(outcome(apply(city, aimedAtPile(0))).hand).toEqual(['PH_Farm']);
});

test('an empty discard pile blocks the recall instant in the hand', () => {
  const empty = cityOf(['urban'], { hand: ['PH_Recall'], resources: science(2) });
  const holding = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(2),
  });

  expect(refusalOf(empty, 'PH_Recall').blocked).toEqual(['discard-pile']);
  expect(playable(refusalOf(empty, 'PH_Recall'))).toBe(false);
  expect(stagedBy(empty, aimedAtPile(0))).toEqual(['refused']);
  expect(outcome(apply(empty, aimedAtPile(0)))).toBe(empty);
  expect(playable(refusalOf(holding, 'PH_Recall'))).toBe(true);
});

test('a recall the city cannot pay for stays in the hand and costs nothing', () => {
  const short = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(1),
  });

  expect(stagedBy(short, aimedAtPile(0))).toEqual(['refused']);
  expect(outcome(apply(short, aimedAtPile(0)))).toBe(short);
});

test('an attack by hand takes the attacker’s damage off the target and spends one action', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 2, move: 2 * MOVE_POINT }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const stages = apply(city, attackOn(1, { q: 2, r: 0 }));
  const [landed] = stages;
  if (landed.name !== 'attack') throw new Error('the command staged no attack');

  expect(stages.map((stage) => stage.name)).toEqual(['attack']);
  expect(landed.attacker).toEqual({ q: 1, r: 0 });
  expect(landed.target).toEqual({ q: 2, r: 0 });
  expect(landed.chronicle.units[1].stats.health).toBe(3);
  expect(landed.chronicle.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(actionOf(landed.chronicle, 1)).toBe(0);
  expect(pointsOf(landed.chronicle, 1)).toBe(2 * MOVE_POINT);
});

test('a unit attacks on the action it holds, and a second attack the same turn is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 2 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const once = outcome(apply(city, attackOn(1, { q: 2, r: 0 })));

  expect(actionOf(once, 1)).toBe(0);
  expect(stagedBy(once, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(once, attackOn(1, { q: 2, r: 0 })))).toBe(once);
});

test('an attack by a worker, by a unit that is not the player’s, and by no unit at all is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 2, r: 0 }),
      standing('player', { q: 3, r: 0 }),
    ],
  });

  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(city, attackOn(1, { q: 2, r: 0 })))).toBe(city);
  expect(outcome(apply(city, attackOn(2, { q: 3, r: 0 })))).toBe(city);
  expect(outcome(apply(city, attackOn(10, { q: 2, r: 0 })))).toBe(city);
});

test('an attack reaches its range and no further, and lands on a unit of another faction alone', () => {
  const units = [
    standing('player', CITY, { damage: 2, range: 1 }),
    standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    standing('player', { q: 1, r: 0 }),
  ];
  const city = cityOf(['urban'], { tiles: field(3), units });

  expect(stagedBy(city, attackOn(1, { q: 2, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, attackOn(1, { q: 1, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, attackOn(1, { q: 0, r: 1 }))).toEqual(['refused']);

  const far = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { damage: 2, range: 2 }), ...units.slice(1)],
  });

  expect(stagedBy(far, attackOn(1, { q: 2, r: 0 }))).toEqual(['attack']);
});

test('an attack that takes the target’s last health kills it, and it leaves the map', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
    ],
  });

  const after = outcome(apply(city, attackOn(1, { q: 2, r: 0 })));

  expect(after.units).toHaveLength(1);
  expect(after.units[0].faction).toBe('player');
  expect(actionOf(after, 1)).toBe(0);
});

test('a kill leaves every unit still standing commanded by the number it entered with', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
      standing('player', { q: 1, r: 0 }, { damage: 3, move: 2 * MOVE_POINT }),
      worker({ q: 0, r: 1 }),
    ],
  });

  const killed = outcome(apply(city, attackOn(2, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(2);

  const stepped = outcome(apply(killed, moveTo(2, { q: 1, r: 1 })));
  const both = outcome(apply(stepped, moveTo(3, { q: 0, r: 2 })));

  expect(unitNamed(both, 2).tile).toEqual({ q: 1, r: 1 });
  expect(unitNamed(both, 3).tile).toEqual({ q: 0, r: 2 });
});

test('a number a killed unit carried is dealt to nobody after it, and commands nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_Worker'],
    population: 3,
    resources: FOOD,
    units: [
      standing('enemy', { q: 2, r: 0 }, { health: 3 }),
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
    ],
  });

  const killed = outcome(apply(city, attackOn(2, { q: 2, r: 0 })));
  const entered = outcome(apply(killed, { type: 'play', index: 0, aim: 'none' }));

  expect(entered.units.map((unit) => unit.id)).toEqual([2, 3]);
  expect(stagedBy(entered, moveTo(1, { q: 0, r: 1 }))).toEqual(['refused']);
  expect(unitNamed(outcome(apply(entered, moveTo(3, { q: 0, r: 1 }))), 3).tile).toEqual({
    q: 0,
    r: 1,
  });
});

test('the turn refreshes every unit to its action, and never past it', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      standing('player', CITY, { action: 1 }, undefined, 0),
      standing('player', { q: 1, r: 1 }, { action: 2 }),
      standing('enemy', { q: 4, r: 0 }, { action: 1 }, undefined, 0),
    ],
  });

  const ticked = outcome(apply(city, { type: 'end-turn' }));

  expect(actionOf(ticked, 1)).toBe(1);
  expect(actionOf(ticked, 2)).toBe(2);
  expect(actionOf(ticked, 3)).toBe(1);
});

test('the refresh instant refreshes move points alone, and leaves a spent action spent', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, action: 1 }, 0, 0)],
  });

  const refreshed = outcome(apply(city, aimedAtUnit(CITY)));

  expect(pointsOf(refreshed, 1)).toBe(2 * MOVE_POINT);
  expect(actionOf(refreshed, 1)).toBe(0);
});

test('the refresh instant is refused on a unit whose move points are full, its action spent', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, action: 1 }, 2 * MOVE_POINT, 0)],
  });

  expect(stagedBy(city, aimedAtUnit(CITY))).toEqual(['refused']);
  expect(outcome(apply(city, aimedAtUnit(CITY)))).toBe(city);
});

test('an attack spends no move points and a step no action: either follows the other', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { move: 2 * MOVE_POINT, damage: 1, range: 1 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });

  const attackedFirst = outcome(apply(city, attackOn(1, { q: 2, r: 0 })));
  expect(pointsOf(attackedFirst, 1)).toBe(2 * MOVE_POINT);
  const andStepped = outcome(apply(attackedFirst, moveTo(1, { q: 1, r: 1 })));
  expect(andStepped.units[0].tile).toEqual({ q: 1, r: 1 });
  expect(andStepped.units[1].stats.health).toBe(4);

  const steppedFirst = outcome(apply(city, moveTo(1, { q: 1, r: 1 })));
  expect(actionOf(steppedFirst, 1)).toBe(1);
  const andAttacked = outcome(apply(steppedFirst, attackOn(1, { q: 2, r: 0 })));
  expect(andAttacked.units[1].stats.health).toBe(4);
  expect(pointsOf(andAttacked, 1)).toBe(MOVE_POINT);
});

test('ending the turn discards what is left of the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Worker', 'PH_Warrior', 'PH_Warrior', 'PH_Harvest'],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.discardPile).toEqual(['PH_March', 'PH_Farm']);
  expect(after.hand).toEqual(city.drawPile);
});

test('an emptied draw pile is refilled by shuffling the discard pile into it', () => {
  const spent = cityOf(['urban'], {
    discardPile: [
      'PH_Worker',
      'PH_Warrior',
      'PH_Farm',
      'PH_March',
      'PH_Harvest',
      'PH_Worker',
      'PH_Warrior',
    ],
  });

  const after = outcome(apply(spent, { type: 'end-turn' }));

  expect(after.hand).toHaveLength(5);
  expect(after.drawPile).toHaveLength(2);
  expect(after.discardPile).toEqual([]);
  expect(everyCard(after)).toEqual(everyCard(spent));
  expect(outcome(apply(spent, { type: 'end-turn' })).hand).toEqual(after.hand);
  expect(outcome(apply({ ...spent, rng: seedRng(99) }, { type: 'end-turn' })).hand).not.toEqual(
    after.hand,
  );
});

test('a draw with nothing left anywhere draws what there is', () => {
  const city = cityOf(['urban'], { drawPile: ['PH_March', 'PH_Harvest'] });

  expect(outcome(apply(city, { type: 'end-turn' })).hand).toEqual(['PH_March', 'PH_Harvest']);
});

test('the end of turn resolves in order, and its last stage is where the turn ends', () => {
  const city = cityOf(['urban', 'plain', 'forest'], {
    tiles: field(2),
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Warrior', 'PH_Harvest'],
    discardPile: ['PH_Harvest', 'PH_Worker'],
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  const stages = apply(city, { type: 'end-turn' });
  const ended = stages[stages.length - 1].chronicle;

  expect(stages.map((stage) => stage.name)).toEqual([
    'discard',
    'income',
    'move',
    'attack',
    'turn',
    'draw',
    'shuffle',
    'draw',
  ]);
  expect(ended).toEqual(outcome(stages));
  expect(ended.turn).toBe(city.turn + 1);
  expect(ended.hand).toHaveLength(5);
});

test('a stage of the end of turn that changed nothing is left out of it', () => {
  const quiet = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    tiles: field(1),
    drawPile: ['PH_Worker', 'PH_Warrior', 'PH_Farm', 'PH_March', 'PH_Harvest'],
    discardPile: ['PH_Harvest'],
  });

  expect(stagedBy(quiet, { type: 'end-turn' })).toEqual(['income', 'turn', 'draw']);
});

test('a capture ends the end of turn on its own stage, with the defeat set', () => {
  const overrun = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    drawPile: ['PH_Worker', 'PH_Warrior'],
    units: [standing('enemy', CITY)],
  });

  const stages = apply(overrun, { type: 'end-turn' });
  const last = stages[stages.length - 1];

  expect(stages.map((stage) => stage.name)).toEqual(['discard', 'capture']);
  expect(last.chronicle.defeat).toEqual({ cause: 'capture', turn: overrun.turn });
  expect(last.chronicle.turn).toBe(overrun.turn);
  expect(last.chronicle.hand).toEqual([]);
});

test('every card of the deck is in exactly one pile through a full cycle', () => {
  let chronicle = beginChronicle(2026, DECK);
  const deck = everyCard(chronicle);
  expect(deck).toHaveLength(DECK.length);

  for (let turn = 0; turn < 8; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'play', index: 0, aim: 'none' }));
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(everyCard(chronicle)).toEqual(deck);
  }
});

test('the deck the game ships with founds a chronicle that draws a full hand from it', () => {
  const chronicle = beginChronicle(2026, DECKS.PH_Deck);

  expect(chronicle.hand).toHaveLength(5);
  expect(everyCard(chronicle)).toHaveLength(DECKS.PH_Deck.length);
  for (const id of everyCard(chronicle)) expect(CARDS[id]).toBeDefined();
});

test('the same command on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban', 'plain', 'forest', 'hills', 'coast']);
  const untouched = structuredClone(city);

  expect(outcome(apply(city, { type: 'end-turn' }))).toEqual(
    outcome(apply(city, { type: 'end-turn' })),
  );
  expect(city).toEqual(untouched);
});

test('a unit card turns one population into a unit on the city tile', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'play', index: 0, aim: 'none' }));

  expect(after.population).toBe(city.population - 1);
  expect(after.units).toHaveLength(1);
  expect(after.units[0].tile).toEqual(CITY);
  expect(after.units[0].faction).toBe('player');
  expect(after.resources.food).toBe(0);
  expect(after.hand).toEqual([]);
  expect(after.discardPile).toEqual(['PH_Worker']);
});

test('a chronicle with units on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY), standing('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});

test('a city with no population left falls, whatever the command was', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0 });

  expect(outcome(apply(empty, { type: 'play', index: 0, aim: 'none' })).defeat).toEqual({
    cause: 'population',
    turn: empty.turn,
  });
  // The fall rides the last stage the command resolved as, refused though that play was.
  expect(stagedBy(empty, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);

  const ended = outcome(apply(empty, { type: 'end-turn' }));

  expect(ended.population).toBe(0);
  expect(ended.defeat).toEqual({ cause: 'population', turn: ended.turn });
});

test('a unit card is refused while a unit already stands on the city tile', () => {
  const crowded = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    units: [standing('player', CITY)],
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(outcome(apply(crowded, { type: 'play', index: 0, aim: 'none' }))).toEqual(crowded);
});

test('a unit crosses within its move points, and no further', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(outcome(apply(city, moveTo(1, { q: 2, r: 0 }))).units[0].tile).toEqual({ q: 2, r: 0 });
  expect(outcome(apply(city, moveTo(1, { q: 3, r: 0 })))).toEqual(city);
});

test('a unit spends what the tile it enters costs: two plains for the one forest beside them', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 1, r: -1 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const overPlains = outcome(apply(city, moveTo(1, { q: 2, r: 0 })));
  const intoForest = outcome(apply(city, moveTo(1, { q: 1, r: -1 })));

  expect(overPlains.units[0].tile).toEqual({ q: 2, r: 0 });
  expect(pointsOf(overPlains, 1)).toBe(0);
  expect(intoForest.units[0].tile).toEqual({ q: 1, r: -1 });
  expect(pointsOf(intoForest, 1)).toBe(0);
});

test('a unit with fewer move points left than a tile costs does not enter it', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 2, r: -1 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  const stepped = outcome(apply(city, moveTo(1, { q: 1, r: -1 })));

  expect(pointsOf(stepped, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(stepped, moveTo(1, { q: 2, r: -1 })))).toEqual(stepped);
  expect(outcome(apply(stepped, moveTo(1, { q: 2, r: -2 }))).units[0].tile).toEqual({
    q: 2,
    r: -2,
  });
});

test('a unit crossing a river spends every move point it has left, and steps no further', () => {
  const bank = { q: 1, r: 0 };
  const on = { q: 2, r: 0 };
  const city = cityOf(['urban'], {
    tiles: only(2, [CITY, bank, on]),
    rivers: [riverBetween(CITY, bank)],
    units: [standing('player', CITY, { move: 3 * MOVE_POINT })],
  });

  const crossed = outcome(apply(city, moveTo(1, bank)));

  expect(crossed.units[0].tile).toEqual(bank);
  expect(pointsOf(crossed, 1)).toBe(0);
  expect(outcome(apply(crossed, moveTo(1, on)))).toEqual(crossed);
});

test('a unit crosses a river only where the move points it has left cover the far tile in full', () => {
  const bank = { q: 1, r: 0 };
  const across = { q: 2, r: 0 };
  const beside = { q: 1, r: -1 };
  /** One forest across a river, the plain on this bank it is reached from, and a plain to turn to. */
  const shore = (move: number): Chronicle =>
    cityOf(['urban'], {
      tiles: madeOf(only(2, [CITY, bank, across, beside]), 'forest', [across]),
      rivers: [riverBetween(bank, across)],
      units: [standing('player', CITY, { move })],
    });

  const short = outcome(apply(shore(2 * MOVE_POINT), moveTo(1, bank)));
  const long = outcome(apply(shore(4 * MOVE_POINT), moveTo(1, bank)));
  const crossed = outcome(apply(long, moveTo(1, across)));

  expect(pointsOf(short, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(short, moveTo(1, across)))).toEqual(short);
  expect(outcome(apply(short, moveTo(1, beside))).units[0].tile).toEqual(beside);
  expect(pointsOf(long, 1)).toBe(3 * MOVE_POINT);
  expect(crossed.units[0].tile).toEqual(across);
  expect(pointsOf(crossed, 1)).toBe(0);
});

test('a unit crosses to a tile the cheapest way, not the fewest tiles', () => {
  /** A hill the whole disc is in sight from, two forests on the straight line east of it. */
  const watch = { q: 0, r: -1 };
  const city = cityOf(['urban'], {
    tiles: madeOf(
      madeOf(field(3), 'forest', [
        { q: 1, r: -1 },
        { q: 2, r: -1 },
      ]),
      'hills',
      [watch],
    ),
    units: [standing('player', watch, { move: 4 * MOVE_POINT, sight: 4 })],
  });

  // The three tiles straight there cost five; the four round the forests cost four.
  const round = outcome(apply(city, moveTo(1, { q: 3, r: -1 })));

  expect(round.units[0].tile).toEqual({ q: 3, r: -1 });
  expect(pointsOf(round, 1)).toBe(0);
});

test('water is crossed by nobody, and so is everything only water leads to', () => {
  const city = cityOf(['urban'], {
    tiles: field(2, [{ q: 1, r: 0 }]),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  expect(outcome(apply(city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(1, { q: 2, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(1, { q: 1, r: 1 }))).units[0].tile).toEqual({ q: 1, r: 1 });
});

test('a tile costing more than a unit’s move is beyond it, however often it refreshes', () => {
  const city = cityOf(['urban'], {
    tiles: madeOf(field(2), 'forest', [{ q: 1, r: 0 }]),
    units: [standing('player', CITY, { move: MOVE_POINT })],
  });

  expect(pointsOf(city, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(1, { q: 0, r: 1 }))).units[0].tile).toEqual({ q: 0, r: 1 });

  const ticked = outcome(apply(city, { type: 'end-turn' }));

  expect(pointsOf(ticked, 1)).toBe(MOVE_POINT);
  expect(outcome(apply(ticked, moveTo(1, { q: 1, r: 0 })))).toEqual(ticked);
});

test('a unit crosses its own faction but never lands on it', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('player', { q: 1, r: 0 })],
  });

  expect(outcome(apply(city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(1, { q: 2, r: 0 }))).units[0].tile).toEqual({ q: 2, r: 0 });
});

test('the other faction stops a unit where it stands', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT, damage: 0 }),
      standing('enemy', { q: 1, r: 0 }),
    ],
  });

  expect(outcome(apply(city, moveTo(1, { q: 1, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(1, { q: 2, r: 0 })))).toEqual(city);
});

test('a move of a unit that is not the player’s, or of no unit at all, is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT }), standing('enemy', { q: 2, r: 0 })],
  });

  expect(stagedBy(city, moveTo(2, { q: 2, r: 1 }))).toEqual(['refused']);
  expect(outcome(apply(city, moveTo(2, { q: 2, r: 1 })))).toEqual(city);
  expect(outcome(apply(city, moveTo(5, { q: 1, r: 0 })))).toEqual(city);
});

test('a unit walled in by water crosses nowhere at all', () => {
  const walled: TileCoords[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(2, walled),
    units: [standing('player', CITY, { move: 2 * MOVE_POINT })],
  });

  for (const to of walled) expect(outcome(apply(city, moveTo(1, to)))).toEqual(city);
});

test('a building card builds its building on a tile inside the border where a worker stands', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  const after = outcome(apply(city, aimedAt({ q: 1, r: 0 })));

  expect(buildingAt(after, { q: 1, r: 0 })).toBe('PH_Farm');
  expect(after.resources.production).toBe(0);
  expect(after.hand).toEqual([]);
  expect(after.discardPile).toEqual(['PH_Farm']);
  expect(after.units).toEqual(city.units);
});

test('a building card is refused on a tile no worker stands on, and with no tile at all', () => {
  const city = cityOf(['urban', 'plain', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  expect(outcome(apply(city, aimedAt({ q: 2, r: 0 })))).toEqual(city);
  expect(outcome(apply(city, { type: 'play', index: 0, aim: 'none' }))).toEqual(city);
});

test('a building card is refused on a tile outside the border, worker standing or not', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  expect(outcome(apply(city, aimedAt({ q: 1, r: 0 })))).toEqual(city);
});

test('a building card cannot be played with no worker of the player’s inside the border', () => {
  const alone = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    resources: production(3),
  });
  const fighting = withUnits(alone, [standing('player', { q: 1, r: 0 })]);

  expect(refusedFor(alone, 'PH_Farm', { q: 1, r: 0 })).toBe('worker');
  expect(refusedFor(fighting, 'PH_Farm', { q: 1, r: 0 })).toBe('worker');
  expect(outcome(apply(alone, aimedAt({ q: 1, r: 0 })))).toEqual(alone);
});

test('a tile’s building slot takes one building and no more', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm', 'PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(6),
  });

  const once = outcome(apply(city, aimedAt({ q: 1, r: 0 })));

  expect(outcome(apply(once, aimedAt({ q: 1, r: 0 })))).toEqual(once);
  expect(refusedFor(once, 'PH_Farm', { q: 1, r: 0 })).toBe('slot');
});

test('the founding fills the city tile’s slot with the city', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(buildingAt(chronicle, chronicle.city)).toBe('PH_City');
});

test('the city in its slot adds nothing to what the tile it stands on yields', () => {
  const founded = outcome(apply(cityOf(['urban'], { tiles: field(1) }), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(founded.resources[resource]).toBe(TERRAIN_YIELDS.urban[resource] ?? 0);
  }
});

test('the city fills its own tile’s slot, worker or no worker', () => {
  const bare = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    resources: production(3),
  });
  const city = withUnits(bare, [worker(CITY)]);
  const overOne = withUnits(bare, [worker({ q: 1, r: 0 })]);

  expect(buildingAt(city, CITY)).toBe('PH_City');
  expect(admittedTiles(city, 'PH_Farm')).toEqual([]);
  expect(outcome(apply(city, aimedAt(CITY)))).toEqual(city);
  // The city's own tile is urban, so the farm names the terrain before it ever reaches the slot.
  expect(refusedFor(city, 'PH_Farm', CITY)).toBe('terrain');
  expect(admittedTiles(overOne, 'PH_Farm')).toEqual([{ q: 1, r: 0 }]);
});

test('a farm stands on a plain and on no other terrain a worker reaches', () => {
  for (const terrain of ['forest', 'hills', 'urban'] as Terrain[]) {
    const city = cityOf(['urban', terrain], {
      hand: ['PH_Farm'],
      units: [worker({ q: 1, r: 0 })],
      resources: production(3),
    });

    expect(admittedTiles(city, 'PH_Farm')).toEqual([]);
    expect(refusedFor(city, 'PH_Farm', { q: 1, r: 0 })).toBe('terrain');
    expect(outcome(apply(city, aimedAt({ q: 1, r: 0 })))).toEqual(city);
  }
});

test('a farm standing on a tile adds its food to what that tile yields at income', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  const bare = outcome(apply(city, { type: 'end-turn' }));
  const built = outcome(apply(city, aimedAt({ q: 1, r: 0 })));
  const farmed = outcome(apply(built, { type: 'end-turn' }));

  expect(farmed.resources.food).toBe(bare.resources.food + 1);
});

test('the mine card improves the hills a worker stands on, inside the border and outside it', () => {
  for (const at of [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]) {
    const city = workedTile(at, 'hills', { hand: ['PH_Mine'], resources: production(3) });

    const after = outcome(apply(city, aimedAt(at)));

    expect(tileAt(after.tiles, at)?.improvements).toEqual(['PH_Mine']);
    expect(after.resources.production).toBe(0);
    expect(after.hand).toEqual([]);
    expect(after.discardPile).toEqual(['PH_Mine']);
    expect(after.units).toEqual(city.units);
  }
});

test('the mine card is refused on a tile no worker of the player’s stands on', () => {
  const at = { q: 1, r: 0 };
  const bare = workedTile(at, 'hills', {
    hand: ['PH_Mine'],
    resources: production(3),
    units: [],
  });
  const fighting = withUnits(bare, [standing('player', at)]);

  expect(admittedTiles(bare, 'PH_Mine')).toEqual([]);
  expect(refusedFor(bare, 'PH_Mine', at)).toBe('worker');
  expect(refusedFor(fighting, 'PH_Mine', at)).toBe('worker');
  expect(outcome(apply(bare, aimedAt(at)))).toEqual(bare);
  expect(outcome(apply(fighting, aimedAt(at)))).toEqual(fighting);
});

test('the mine card is refused on every terrain but the hills it goes on', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['plain', 'forest', 'mountain', 'coast', 'deep', 'urban'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Mine'], resources: production(3) });

    expect(admittedTiles(city, 'PH_Mine')).toEqual([]);
    expect(refusedFor(city, 'PH_Mine', at)).toBe(
      standsOn(WORKER, tileAt(city.tiles, at)) ? 'terrain' : 'worker',
    );
    expect(outcome(apply(city, aimedAt(at)))).toEqual(city);
  }
});

test('a tile takes the same improvement once and never a second time', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    hand: ['PH_Mine', 'PH_Mine'],
    resources: production(6),
  });

  const once = outcome(apply(city, aimedAt(at)));

  expect(admittedTiles(once, 'PH_Mine')).toEqual([]);
  expect(refusedFor(once, 'PH_Mine', at)).toBe('improvement');
  expect(outcome(apply(once, aimedAt(at)))).toEqual(once);
});

test('a mine improved onto a tile adds its production to what that tile yields at income', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    ...NO_GROWTH,
    hand: ['PH_Mine'],
    resources: production(3),
  });

  const bare = outcome(apply({ ...city, resources: production(0) }, { type: 'end-turn' }));
  const mined = outcome(apply(outcome(apply(city, aimedAt(at))), { type: 'end-turn' }));

  expect(mined.resources.production).toBe(bare.resources.production + 1);
});

test('the urbanisation card terraforms the plain a worker stands on, inside the border and outside it', () => {
  for (const at of [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]) {
    const city = workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) });

    const after = outcome(apply(city, aimedAt(at)));

    expect(tileAt(after.tiles, at)?.terrain).toBe('urban');
    expect(after.resources.production).toBe(0);
    expect(after.discardPile).toEqual(['PH_Urbanisation']);
    expect(after.units).toEqual(city.units);
  }
});

test('a terraformed tile loses its feature and keeps the improvements on it', () => {
  const at = { q: 1, r: 0 };
  const city = withTile(
    workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) }),
    { ...at, terrain: 'plain', feature: 'PH_Fertile', improvements: ['PH_Mine'] },
  );

  const after = tileAt(outcome(apply(city, aimedAt(at))).tiles, at);

  expect(after?.terrain).toBe('urban');
  expect(after?.feature).toBeUndefined();
  expect(after?.improvements).toEqual(['PH_Mine']);
});

test('a terraform leaves the rivers where they run: a river lies on no tile', () => {
  const at = { q: 1, r: 0 };
  /** A river along the edges of the tile that is terraformed: five corners of its own hexagon. */
  const river = cornersOf(at).slice(0, 5);
  const city = workedTile(at, 'plain', {
    hand: ['PH_Urbanisation'],
    resources: production(5),
    rivers: [river],
  });

  const after = outcome(apply(city, aimedAt(at)));

  expect(tileAt(after.tiles, at)?.terrain).toBe('urban');
  expect(after.rivers).toEqual([river]);
});

test('a tile with a building in its slot is not terraformed', () => {
  const at = { q: 1, r: 0 };
  const city = withTile(
    workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) }),
    { ...at, terrain: 'plain', improvements: [], building: 'PH_Farm' },
  );

  expect(admittedTiles(city, 'PH_Urbanisation')).toEqual([]);
  expect(refusedFor(city, 'PH_Urbanisation', at)).toBe('slot');
  expect(outcome(apply(city, aimedAt(at)))).toEqual(city);
});

test('the urbanisation card is refused on every terrain but the plain it terraforms', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['forest', 'hills', 'mountain', 'coast', 'deep', 'urban'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Urbanisation'], resources: production(5) });

    expect(admittedTiles(city, 'PH_Urbanisation')).toEqual([]);
    expect(refusedFor(city, 'PH_Urbanisation', at)).toBe(
      standsOn(WORKER, tileAt(city.tiles, at)) ? 'terrain' : 'worker',
    );
    expect(outcome(apply(city, aimedAt(at)))).toEqual(city);
  }
});

test('a terraformed tile yields its new terrain at the next income', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'plain', {
    ...NO_GROWTH,
    hand: ['PH_Urbanisation'],
    resources: production(5),
  });

  const bare = outcome(apply({ ...city, resources: production(0) }, { type: 'end-turn' }));
  const urban = outcome(apply(outcome(apply(city, aimedAt(at))), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(urban.resources[resource]).toBe(
      bare.resources[resource] -
        (TERRAIN_YIELDS.plain[resource] ?? 0) +
        (TERRAIN_YIELDS.urban[resource] ?? 0),
    );
  }
});

test('a unit card never takes the city’s last population', () => {
  const last = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 1,
    resources: FOOD,
  });
  const idling = { ...last, population: 2 };

  expect(playable(refusalOf(last, 'PH_Worker'))).toBe(false);
  expect(outcome(apply(last, { type: 'play', index: 0, aim: 'none' }))).toEqual(last);
  expect(outcome(apply(idling, { type: 'play', index: 0, aim: 'none' })).population).toBe(1);
});

test('a unit card is refused for the population when only the city’s last inhabitant is left', () => {
  const last = cityOf(['urban'], { tiles: field(2), population: 1, assigned: [], resources: FOOD });

  expect(idle(last)).toBe(1);
  expect(refusalOf(last, 'PH_Worker').blocked).toEqual(['population']);
});

test('a unit card refused for the population and for the idle inhabitant names both', () => {
  const last = cityOf(['urban'], { tiles: field(2), population: 1, resources: FOOD });

  expect(idle(last)).toBe(0);
  expect(refusalOf(last, 'PH_Worker').blocked).toEqual(['population', 'idle']);
});

test('a unit card is refused for the city while a unit of the player’s stands on it', () => {
  const held = cityOf(['urban', 'plain'], {
    tiles: field(2),
    population: 3,
    units: [worker(CITY)],
    resources: FOOD,
  });

  expect(refusalOf(held, 'PH_Worker').blocked).toEqual(['city']);
});

test('a unit card refused for the population and for the city names both', () => {
  const both = cityOf(['urban'], {
    tiles: field(2),
    population: 1,
    assigned: [],
    units: [worker(CITY)],
    resources: FOOD,
  });

  expect(refusalOf(both, 'PH_Worker').blocked).toEqual(['population', 'city']);
});

test('the founding puts an inhabitant on every tile the city holds, and leaves two idle', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect([...chronicle.assigned].map(tileKey).sort()).toEqual(
    [...chronicle.held].map(tileKey).sort(),
  );
  expect(idle(chronicle)).toBe(2);
});

test('an assign takes the inhabitant off a tile, and a second one puts it back', () => {
  const city = cityOf(['urban', 'plain']);
  const tile = { q: 1, r: 0 };

  const off = outcome(apply(city, assignTo(tile)));
  const back = outcome(apply(off, assignTo(tile)));

  expect(stagedBy(city, assignTo(tile))).toEqual(['assign']);
  expect(off.assigned.map(tileKey)).toEqual(['0,0']);
  expect(idle(off)).toBe(1);
  expect(back.assigned.map(tileKey).sort()).toEqual(['0,0', '1,0']);
  expect(idle(back)).toBe(0);
});

test('an assign on a tile the city does not hold is refused', () => {
  const city = cityOf(['urban', 'plain'], { population: 4 });

  expect(stagedBy(city, assignTo({ q: 0, r: 5 }))).toEqual(['refused']);
  expect(outcome(apply(city, assignTo({ q: 0, r: 5 })))).toBe(city);
  expect(stagedBy(city, assignTo({ q: 9, r: 9 }))).toEqual(['refused']);
});

test('an assign with no inhabitant idle is refused', () => {
  const spent = cityOf(['urban', 'plain', 'forest'], {
    population: 2,
    assigned: [CITY, { q: 1, r: 0 }],
  });

  expect(idle(spent)).toBe(0);
  expect(stagedBy(spent, assignTo({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(spent, assignTo({ q: 2, r: 0 })))).toBe(spent);
});

test('a drag takes the inhabitant off the tile it stands on and puts it on the tile it lands on', () => {
  const founding = beginChronicle(1, DECK);
  const [from, to] = neighbours(founding.city);
  const freed = outcome(apply(founding, assignTo(to)));

  const stages = apply(freed, reassignTo(from, to));
  const after = outcome(stages);

  expect(cityDrag(freed, from, to)).toEqual(reassignTo(from, to));
  expect(stages.map((stage) => stage.name)).toEqual(['assign']);
  expect(after.assigned.map(tileKey)).not.toContain(tileKey(from));
  expect(after.assigned.map(tileKey)).toContain(tileKey(to));
  expect(after.population).toBe(freed.population);
  expect(idle(after)).toBe(idle(freed));
});

test('a drag onto a tile an inhabitant stands on, onto one the city does not hold, or onto the tile it started from is refused', () => {
  const founding = beginChronicle(1, DECK);
  const [from, worked] = neighbours(founding.city);
  const outside = claimable(founding)[0];

  expect(cityDrag(founding, from, worked)).toBeUndefined();
  expect(stagedBy(founding, reassignTo(from, worked))).toEqual(['refused']);
  expect(outcome(apply(founding, reassignTo(from, worked)))).toBe(founding);
  expect(stagedBy(founding, reassignTo(from, outside))).toEqual(['refused']);
  expect(stagedBy(founding, reassignTo(from, from))).toEqual(['refused']);
});

test('a drag from a tile nobody stands on is refused', () => {
  const founding = beginChronicle(1, DECK);
  const [bare, empty] = neighbours(founding.city);
  const freed = outcome(apply(outcome(apply(founding, assignTo(bare))), assignTo(empty)));

  expect(cityDrag(freed, bare, empty)).toBeUndefined();
  expect(stagedBy(freed, reassignTo(bare, empty))).toEqual(['refused']);
  expect(outcome(apply(freed, reassignTo(bare, empty)))).toBe(freed);
});

test('an assigned tile yields at income, and an unassigned one yields nothing', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(city, assignTo({ q: 1, r: 0 })));

  const worked = outcome(apply(city, { type: 'end-turn' }));
  const bare = outcome(apply(off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (TERRAIN_YIELDS.plain[resource] ?? 0),
    );
  }
});

test('the city’s own tile unassigned yields nothing at income, like any other', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(city, assignTo(CITY)));

  const worked = outcome(apply(city, { type: 'end-turn' }));
  const bare = outcome(apply(off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (TERRAIN_YIELDS.urban[resource] ?? 0),
    );
  }
});

test('a claim pays its culture, takes the tile inside the border, and puts an idle inhabitant on it', () => {
  const city = founded(3, { resources: culture(2) });
  const tile = { q: 2, r: 0 };

  const stages = apply(city, claimOf(tile));
  const after = outcome(stages);

  expect(stages.map((stage) => stage.name)).toEqual(['claim']);
  expect(after.held.map(tileKey)).toContain('2,0');
  expect(after.resources.culture).toBe(1);
  expect(after.assigned.map(tileKey)).toContain('2,0');
  expect(idle(after)).toBe(idle(city) - 1);
});

test('a claim made with nobody idle takes the tile with no inhabitant on it', () => {
  const full = founded(3, { resources: culture(2), population: 7 });

  const after = outcome(apply(full, claimOf({ q: 2, r: 0 })));

  expect(idle(full)).toBe(0);
  expect(after.held.map(tileKey)).toContain('2,0');
  expect(after.assigned.map(tileKey)).not.toContain('2,0');
  expect(idle(after)).toBe(0);
});

test('a claimed tile an inhabitant stands on yields at the next income', () => {
  const city = founded(3, { ...NO_GROWTH, resources: culture(1) });
  const claimed = outcome(apply(city, claimOf({ q: 2, r: 0 })));

  const bare = outcome(apply(city, { type: 'end-turn' }));
  const wider = outcome(apply(claimed, { type: 'end-turn' }));

  expect(wider.resources.food).toBe(bare.resources.food + (TERRAIN_YIELDS.plain.food ?? 0));
});

test('a claim on a tile the border does not touch, off the map, or already held is refused', () => {
  const city = founded(3, { resources: culture(9) });

  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(city, claimOf({ q: 3, r: 0 })))).toBe(city);
  expect(stagedBy(city, claimOf({ q: 9, r: 9 }))).toEqual(['refused']);
  expect(stagedBy(city, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
});

test('a claim the city cannot pay for is refused, and one it can just pay for goes through', () => {
  const penniless = founded(3);
  const exact = founded(3, { resources: culture(1) });

  expect(stagedBy(penniless, claimOf({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(penniless, claimOf({ q: 2, r: 0 })))).toBe(penniless);
  expect(stagedBy(exact, claimOf({ q: 2, r: 0 }))).toEqual(['claim']);
  expect(outcome(apply(exact, claimOf({ q: 2, r: 0 }))).resources.culture).toBe(0);
});

test('a claim costs one culture, and one more for every three tiles claimed', () => {
  let chronicle = founded(4, { resources: culture(20), population: 40 });
  const touching = field(4)
    .filter((tile) => distance(tile, CITY) === 2)
    .slice(0, 7);

  const paid = touching.map((tile) => {
    const before = chronicle.resources.culture;
    chronicle = outcome(apply(chronicle, claimOf(tile)));
    return before - chronicle.resources.culture;
  });

  expect(paid).toEqual([1, 1, 1, 2, 2, 2, 3]);
  expect(chronicle.held).toHaveLength(14);
});

test('the city may claim every tile touching the border, and no other', () => {
  const city = founded(3);

  expect(claimable(city).map(tileKey).sort()).toEqual(
    field(3)
      .filter((tile) => distance(tile, CITY) === 2)
      .map(tileKey)
      .sort(),
  );
});

test('an uncharted tile touching the border is no claim of the city’s', () => {
  const opened = outcome(apply(beginChronicle(1, DECK), { type: 'end-turn' }));
  const dark = unchartedTouching(opened);

  expect(opened.resources.culture).toBeGreaterThanOrEqual(1);
  expect(claimable(opened).map(tileKey)).not.toContain(tileKey(dark));
  expect(tileRefusal(opened, dark)).toBeUndefined();
  expect(cityCommand(opened, dark)).toBeUndefined();
  expect(stagedBy(opened, claimOf(dark))).toEqual(['refused']);
  expect(outcome(apply(opened, claimOf(dark)))).toBe(opened);
});

test('a unit that charts that tile makes it a claim the city can make', () => {
  const opened = outcome(apply(beginChronicle(1, DECK), { type: 'end-turn' }));
  const dark = unchartedTouching(opened);
  const charting = withWorkerBeside(opened, dark);

  expect(claimable(charting).map(tileKey)).toContain(tileKey(dark));
  expect(cityCommand(charting, dark)).toEqual(claimOf(dark));
  expect(stagedBy(charting, claimOf(dark))).toEqual(['claim']);
  expect(outcome(apply(charting, claimOf(dark))).held.map(tileKey)).toContain(tileKey(dark));
});

test('a city-mode click assigns on a tile the city holds and claims on any other', () => {
  const city = founded(3, { resources: culture(1) });

  expect(cityCommand(city, { q: 1, r: 0 })).toEqual(assignTo({ q: 1, r: 0 }));
  expect(cityCommand(city, { q: 2, r: 0 })).toEqual(claimOf({ q: 2, r: 0 }));
  expect(cityCommand(city, { q: 3, r: 0 })).toBeUndefined();
});

test('a city-mode click is refused for the culture it costs, and a tile off the border refuses nothing', () => {
  const city = founded(3);
  const paid = founded(3, { resources: culture(1) });

  expect(tileCost(city, { q: 2, r: 0 })).toEqual([{ resource: 'culture', amount: 1 }]);
  expect(tileRefusal(city, { q: 2, r: 0 })).toEqual({ unaffordable: ['culture'], blocked: [] });
  expect(tileRefusal(paid, { q: 2, r: 0 })).toEqual({ unaffordable: [], blocked: [] });
  expect(tileCost(paid, CITY)).toEqual([]);
  expect(tileRefusal(paid, CITY)).toEqual({ unaffordable: [], blocked: [] });
});

test('a tile the city neither holds nor can claim is no act of the city’s, and refuses a claim', () => {
  const city = founded(3, { resources: culture(9) });

  expect(tileRefusal(city, { q: 3, r: 0 })).toBeUndefined();
  expect(tileRefusal(city, { q: 9, r: 9 })).toBeUndefined();
  expect(cityCommand(city, { q: 3, r: 0 })).toBeUndefined();
  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
});

test('a city-mode click on a held tile nobody stands on is refused while nobody is idle', () => {
  const spent = founded(3, { population: 6, assigned: [CITY, ...neighbours(CITY).slice(1)] });
  const empty = { q: 1, r: 0 };

  expect(idle(spent)).toBe(0);
  expect(tileRefusal(spent, empty)).toEqual({ unaffordable: [], blocked: ['idle'] });
  expect(cityCommand(spent, empty)).toBeUndefined();
  expect(stagedBy(spent, assignTo(empty))).toEqual(['refused']);

  const freed = outcome(apply(spent, assignTo(CITY)));

  expect(tileRefusal(freed, empty)).toEqual({ unaffordable: [], blocked: [] });
  expect(stagedBy(freed, assignTo(empty))).toEqual(['assign']);
});

test('the same claim on the same chronicle gives the same chronicle back', () => {
  const city = founded(3, { resources: culture(3) });
  const untouched = structuredClone(city);

  expect(outcome(apply(city, claimOf({ q: 2, r: 0 })))).toEqual(
    outcome(apply(city, claimOf({ q: 2, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});

test('a unit card takes an idle inhabitant, and is refused while every one is assigned', () => {
  const full = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    resources: FOOD,
  });
  const freed = outcome(apply(full, assignTo({ q: 1, r: 0 })));

  expect(idle(full)).toBe(0);
  expect(refusalOf(full, 'PH_Worker').blocked).toEqual(['idle']);
  expect(outcome(apply(full, { type: 'play', index: 0, aim: 'none' }))).toEqual(full);

  const entered = outcome(apply(freed, { type: 'play', index: 0, aim: 'none' }));

  expect(entered.population).toBe(freed.population - 1);
  expect(entered.assigned).toEqual(freed.assigned);
  expect(entered.units).toHaveLength(1);
});

test('a building card with nowhere to stand is playable all the same, and every tile refuses it', () => {
  const at = { q: 1, r: 0 };
  const alone = cityOf(['urban', 'plain'], { tiles: field(2), resources: production(3) });
  const worked = withUnits(alone, [worker(at)]);

  expect(admittedTiles(alone, 'PH_Farm')).toEqual([]);
  expect(refusalOf(alone, 'PH_Farm').blocked).toEqual([]);
  expect(refusedFor(alone, 'PH_Farm', at)).toBe('worker');
  expect(admittedTiles(worked, 'PH_Farm')).toEqual([at]);
  expect(refusalOf(worked, 'PH_Farm').blocked).toEqual([]);
});

test('every card the map answers for is playable whatever the map holds, and blocked only by its cost', () => {
  const empty = cityOf(['urban'], { tiles: field(2), resources: production(3) });

  for (const id of ['PH_Farm', 'PH_March', 'PH_Mine', 'PH_Urbanisation'] as CardId[]) {
    expect(admittedTiles(empty, id)).toEqual([]);
    expect(refusalOf(empty, id).blocked).toEqual([]);
  }
  expect(playable(refusalOf(empty, 'PH_Farm'))).toBe(true);
  expect(playable(refusalOf(empty, 'PH_March'))).toBe(true);
  expect(playable(refusalOf(empty, 'PH_Urbanisation'))).toBe(false);
});

test('the farm card names the first of its four reasons: worker, terrain, border, then slot', () => {
  const at = { q: 1, r: 0 };
  const out = { q: 2, r: 0 };
  const hilly = founded(2, { tiles: madeOf(field(2), 'hills', [at, out]) });
  const flat = founded(2, { tiles: madeOf(field(2), 'plain', [at, out]) });
  const worked = withUnits(flat, [worker(at)]);
  const filled = withTile(worked, {
    ...at,
    terrain: 'plain',
    improvements: [],
    building: 'PH_Farm',
  });

  expect(refusedFor(hilly, 'PH_Farm', out)).toBe('worker');
  expect(refusedFor(withUnits(hilly, [worker(out)]), 'PH_Farm', out)).toBe('terrain');
  expect(refusedFor(withUnits(hilly, [worker(at)]), 'PH_Farm', at)).toBe('terrain');
  expect(refusedFor(withUnits(flat, [worker(out)]), 'PH_Farm', out)).toBe('border');
  expect(refusedFor(filled, 'PH_Farm', at)).toBe('slot');
  expect(refusedFor(worked, 'PH_Farm', at)).toBeUndefined();
});

test('the mine card names the first of its three reasons: worker, terrain, then improvement', () => {
  const at = { q: 1, r: 0 };
  const plain = founded(2);
  const hills = founded(2, { tiles: madeOf(field(2), 'hills', [at]) });
  const worked = withUnits(hills, [worker(at)]);
  const mined = withTile(worked, { ...at, terrain: 'hills', improvements: ['PH_Mine'] });

  expect(refusedFor(plain, 'PH_Mine', at)).toBe('worker');
  expect(
    refusedFor(
      withTile(hills, { ...at, terrain: 'hills', improvements: ['PH_Mine'] }),
      'PH_Mine',
      at,
    ),
  ).toBe('worker');
  expect(refusedFor(withUnits(plain, [worker(at)]), 'PH_Mine', at)).toBe('terrain');
  expect(refusedFor(mined, 'PH_Mine', at)).toBe('improvement');
  expect(refusedFor(worked, 'PH_Mine', at)).toBeUndefined();
});

test('the urbanisation card names the first of its three reasons: worker, terrain, then slot', () => {
  const at = { q: 1, r: 0 };
  const plain = founded(2);
  const forest = founded(2, { tiles: madeOf(field(2), 'forest', [at]) });
  const built = withTile(plain, { ...at, terrain: 'plain', improvements: [], building: 'PH_Farm' });
  const worked = withUnits(plain, [worker(at)]);
  const wooded = withUnits(forest, [worker(at)]);
  const filled = withUnits(built, [worker(at)]);

  expect(refusedFor(plain, 'PH_Urbanisation', at)).toBe('worker');
  expect(refusedFor(forest, 'PH_Urbanisation', at)).toBe('worker');
  expect(refusedFor(wooded, 'PH_Urbanisation', at)).toBe('terrain');
  expect(refusedFor(built, 'PH_Urbanisation', at)).toBe('worker');
  expect(refusedFor(filled, 'PH_Urbanisation', at)).toBe('slot');
  expect(refusedFor(worked, 'PH_Urbanisation', at)).toBeUndefined();
});

test('a card aimed at a unit admits the tiles the player’s units stand on, and no others', () => {
  const spent = { q: 1, r: 0 };
  const held = { q: 2, r: 0 };
  const city = founded(2, {
    units: [
      standing('player', spent, { move: 2 * MOVE_POINT }, MOVE_POINT),
      standing('enemy', held, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  expect(admittedTiles(city, 'PH_March')).toEqual([spent]);
  expect(refusedFor(city, 'PH_March', held)).toBe('unit');
  expect(refusedFor(city, 'PH_March', { q: 0, r: 1 })).toBe('unit');
  expect(admittedTiles(founded(2), 'PH_March')).toEqual([]);
});

test('a card aimed at a unit lands on the play that aims at a unit, and nowhere on one that aims at a tile', () => {
  const at = { q: 1, r: 0 };
  const city = founded(2, {
    hand: ['PH_March'],
    units: [standing('player', at, { move: 2 * MOVE_POINT }, MOVE_POINT)],
  });

  expect(stagedBy(city, aimedAt(at))).toEqual(['refused']);
  expect(outcome(apply(city, aimedAt(at)))).toBe(city);
  expect(stagedBy(city, aimedAtUnit(at))).toEqual(['played']);
  expect(pointsOf(outcome(apply(city, aimedAtUnit(at))), 1)).toBe(2 * MOVE_POINT);
});

test('the refresh instant names the first of its two reasons: the unit, then its move points', () => {
  const at = { q: 1, r: 0 };
  const bare = founded(2);
  const enemy = withUnits(bare, [standing('enemy', at)]);
  const full = withUnits(bare, [worker(at)]);
  const spent = withUnits(bare, [standing('player', at, { move: 2 * MOVE_POINT }, MOVE_POINT)]);

  expect(refusedFor(bare, 'PH_March', at)).toBe('unit');
  expect(refusedFor(enemy, 'PH_March', at)).toBe('unit');
  expect(refusedFor(full, 'PH_March', at)).toBe('move');
  expect(refusedFor(spent, 'PH_March', at)).toBeUndefined();
});

test('a card’s aim admits exactly the tiles of the map it names no reason for', () => {
  const worked = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const city = founded(2, { units: worked.map(worker) });

  const lit = admittedTiles(city, 'PH_Farm');

  expect(lit.map(tileKey).sort()).toEqual(worked.map(tileKey).sort());
  for (const tile of city.tiles) {
    expect(refusedFor(city, 'PH_Farm', tile) === undefined).toBe(
      lit.some((coord) => tileKey(coord) === tileKey(tile)),
    );
  }
});

test('a play aimed at a tile the aim refuses, or at nothing, lands nowhere', () => {
  const at = { q: 1, r: 0 };
  const city = founded(2, { hand: ['PH_Farm'], resources: production(3) });

  const aimed = apply(city, aimedAt(at));
  const nowhere = apply(city, { type: 'play', index: 0, aim: 'none' });

  expect(refusedFor(city, 'PH_Farm', at)).toBe('worker');
  expect(aimed.map((stage) => stage.name)).toEqual(['refused']);
  expect(outcome(aimed)).toEqual(city);
  expect(nowhere.map((stage) => stage.name)).toEqual(['refused']);
  expect(outcome(nowhere)).toEqual(city);
});

test('a card the city falls short for is refused for the resource it is short of', () => {
  const short = cityOf(['urban', 'plain'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 0 })],
    resources: production(2),
  });
  const paid = { ...short, resources: production(3) };

  expect(refusalOf(short, 'PH_Farm').unaffordable).toEqual(['production']);
  expect(refusalOf(paid, 'PH_Farm')).toEqual({ unaffordable: [], blocked: [] });
});

test('an enemy arrives on the outer ring of the map on every fifth turn, and on no turn between', () => {
  let chronicle = cityOf(['urban'], { tiles: field(MAP_COMPOSITION.radius) });

  for (let turn = 2; turn <= 4; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(chronicle.turn).toBe(turn);
    expect(chronicle.units).toEqual([]);
  }
  chronicle = outcome(apply(chronicle, { type: 'end-turn' }));

  expect(chronicle.turn).toBe(5);
  expect(chronicle.units).toHaveLength(1);
  expect(chronicle.units[0].faction).toBe('enemy');
  expect(chronicle.units[0].stats).toEqual(UNIT_STATS.PH_Warrior);
  expect(distance(chronicle.units[0].tile, CITY)).toBe(MAP_COMPOSITION.radius);
});

test('where the enemy arrives is drawn from the seeded generator', () => {
  const disc = field(MAP_COMPOSITION.radius);
  const arrivalOf = (seed: number): TileCoords =>
    toFifthTurn(cityOf(['urban'], { tiles: disc, rng: seedRng(seed) })).units[0].tile;

  expect(arrivalOf(7)).toEqual(arrivalOf(7));
  expect(arrivalOf(7)).not.toEqual(arrivalOf(8));
});

test('the enemy arrives on a free tile of the outer ring it can stand on, and on nothing else', () => {
  const ring = outerRingOf(MAP_COMPOSITION.radius);
  const onlyOpen = ring[3];
  /** A disc no unit stands on the named outer tiles of: half of them coast, half of them mountain. */
  const shut = (coords: TileCoords[]): Tile[] =>
    madeOf(
      field(MAP_COMPOSITION.radius, coords),
      'mountain',
      coords.filter((_, index) => index % 2 === 0),
    );
  const open = cityOf(['urban'], {
    tiles: shut(ring.filter((coord) => tileKey(coord) !== tileKey(onlyOpen))),
  });

  expect(toFifthTurn(open).units[0].tile).toEqual(onlyOpen);
  expect(toFifthTurn(withUnits(open, [worker(onlyOpen)])).units).toHaveLength(1);
  expect(toFifthTurn(cityOf(['urban'], { tiles: shut(ring) })).units).toEqual([]);
});

test('an enemy moves its move toward the city, turn after turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(city, { type: 'end-turn' }));

  expect(distance(moved.units[0].tile, CITY)).toBe(2);
  expect(distance(outcome(apply(moved, { type: 'end-turn' })).units[0].tile, CITY)).toBe(0);
});

test('an enemy spends the move points it crosses on, and carries them into the turn refreshed', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const stages = apply(city, { type: 'end-turn' });
  const crossed = stages.find((stage) => stage.name === 'move');
  if (crossed === undefined) throw new Error('the enemy phase staged no move');

  expect(pointsOf(crossed.chronicle, 1)).toBe(0);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
});

test('a forest on an enemy’s way costs it what the tile says, and keeps it off the city', () => {
  /** One corridor to the city, forked: the straight way through one tile, the way round through two. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 1, r: -1 }];
  const raider = standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT, damage: 0 });
  const plains = cityOf(['urban'], { tiles: only(2, corridor), units: [raider] });
  const wooded = cityOf(['urban'], {
    tiles: madeOf(only(2, corridor), 'forest', [{ q: 1, r: 0 }]),
    units: [raider],
  });

  expect(movesOf(plains)).toEqual([['2,0', '0,0']]);
  expect(movesOf(wooded)).toEqual([['2,0', '1,-1']]);
});

test('an enemy weighs a crossing as its whole move, and turns for the city instead of taking it', () => {
  const bank = { q: 4, r: 0 };
  const across = { q: 5, r: 0 };
  /** One corridor east of the city, with the player's unit on the far end of it. */
  const corridor = [CITY, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, bank, across];
  const beset = (rivers: River[]): Chronicle =>
    cityOf(['urban'], {
      tiles: only(5, corridor),
      rivers,
      units: [
        standing('player', across),
        standing('enemy', { q: 3, r: 0 }, { move: 3 * MOVE_POINT }),
      ],
    });

  expect(movesOf(beset([]))).toEqual([['3,0', '4,0']]);
  expect(movesOf(beset([riverBetween(bank, across)]))).toEqual([['3,0', '0,0']]);
});

test('an enemy moves toward the nearest of the player’s units instead of the city', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(city, { type: 'end-turn' }));

  expect(distance(moved.units[1].tile, { q: 2, r: 0 })).toBe(1);
});

test('an enemy moves within range of a unit and attacks it in the same enemy phase', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 2, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(['income', 'move', 'attack', 'turn']);
  expect(movesOf(city)).toEqual([['4,0', '3,0']]);
  expect(attacksOf(city)).toEqual([['3,0', '2,0']]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health - 2);
});

test('an enemy its move leaves out of range attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(['income', 'move', 'turn']);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy attacks once for each of its action, and one with none attacks nothing', () => {
  const beset = (action: number): Chronicle =>
    cityOf(['urban'], {
      tiles: field(2),
      units: [
        worker({ q: 1, r: 0 }),
        standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 1, action }),
      ],
    });

  expect(attacksOf(beset(0))).toEqual([]);
  expect(attacksOf(beset(1))).toEqual([['2,0', '1,0']]);
  expect(attacksOf(beset(2))).toEqual([
    ['2,0', '1,0'],
    ['2,0', '1,0'],
  ]);
  for (const action of [0, 1, 2]) {
    const city = beset(action);
    const after = outcome(apply(city, { type: 'end-turn' }));
    expect(after.units[0].stats.health).toBe(city.units[0].stats.health - action);
  }
});

test('each enemy acts on the chronicle the enemy before it left, and no unit of the player’s acts at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      standing('player', { q: 1, r: 0 }, { health: 4, damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 4 }),
      standing('enemy', { q: 1, r: 1 }, { move: 0 * MOVE_POINT, damage: 4 }),
    ],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units.map((unit) => unit.id)).toEqual([2, 3]);
});

test('a killed enemy attacks no more', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3, damage: 2 }),
    ],
  });

  const killed = outcome(apply(city, attackOn(1, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(1);

  const after = outcome(apply(killed, { type: 'end-turn' }));

  expect(attacksOf(killed)).toEqual([]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy that moves stages the tile it left and the one it reached; a stuck one stages nothing', () => {
  const moat: TileCoords[] = [
    { q: 2, r: 0 },
    { q: 3, r: -1 },
    { q: 2, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(3, moat),
    units: [
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT }),
    ],
  });

  expect(movesOf(city)).toEqual([['0,3', '0,2']]);
});

test('each enemy stages its own move and its own attacks, before the next enemy acts', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      worker({ q: 1, r: 1 }),
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT, damage: 1 }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'income',
    'move',
    'attack',
    'move',
    'attack',
    'turn',
  ]);
});

test('a tile an enemy occupies yields nothing at income', () => {
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);
  const occupied = withUnits(bare, [standing('enemy', { q: 1, r: 0 })]);

  const free = outcome(apply(bare, { type: 'end-turn' }));
  const held = outcome(apply(occupied, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(held.resources[resource]).toBe(
      free.resources[resource] - (TERRAIN_YIELDS.plain[resource] ?? 0),
    );
  }
});

test('an enemy on the city’s tile attacks nothing, and captures the city the turn after', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      worker({ q: 0, r: 1 }),
      standing('enemy', { q: 1, r: 0 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  const stood = outcome(apply(city, { type: 'end-turn' }));
  expect(stood.units[1].tile).toEqual(CITY);
  expect(attacksOf(city)).toEqual([]);
  expect(stood.units[0].stats.health).toBe(city.units[0].stats.health);
  expect(stood.defeat).toBeUndefined();

  const fallen = outcome(apply(stood, { type: 'end-turn' }));
  expect(fallen.defeat).toEqual({ cause: 'capture', turn: stood.turn });
  expect(fallen.turn).toBe(stood.turn);
});

test('the enemy that moves in from the outer ring reaches the city and captures it', () => {
  let chronicle = cityOf(['urban'], { tiles: field(MAP_COMPOSITION.radius) });
  for (let turn = 0; turn < 20 && chronicle.defeat === undefined; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
  }

  expect(chronicle.defeat?.cause).toBe('capture');
  expect(chronicle.defeat?.turn).toBe(chronicle.turn);
});

test('a chronicle that has ended takes no command at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const fallen: Chronicle = { ...city, defeat: { cause: 'capture', turn: city.turn } };

  expect(
    outcome(apply(city, { type: 'play', index: 0, aim: 'none' })).resources.food,
  ).toBeGreaterThan(0);
  expect(outcome(apply(fallen, { type: 'end-turn' }))).toBe(fallen);
  expect(outcome(apply(fallen, { type: 'play', index: 0, aim: 'none' }))).toBe(fallen);
  expect(stagedBy(fallen, { type: 'end-turn' })).toEqual(['refused']);
  expect(stagedBy(fallen, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
});

test('a chronicle with enemies on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});

test('the same move on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT, damage: 2, range: 1 }),
      standing('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });
  const untouched = structuredClone(city);

  expect(outcome(apply(city, moveTo(1, { q: 1, r: 0 })))).toEqual(
    outcome(apply(city, moveTo(1, { q: 1, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});
