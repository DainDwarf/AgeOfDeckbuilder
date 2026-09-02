import { expect, test } from 'vitest';
import { type CardId, DECK } from './cards';
import {
  apply,
  beginChronicle,
  buildable,
  type Chronicle,
  type Command,
  playable,
  RESOURCES,
  type Resources,
  refusalOf,
} from './chronicle';
import {
  type BuildingTypeId,
  distance,
  MAP_COMPOSITION,
  TERRAIN_YIELDS,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { seedRng } from './rng';
import { type Faction, UNIT_STATS, type Unit, type UnitStats } from './units';

const CITY: TileCoords = { q: 0, r: 0 };

/** A city on `inside`, tile by tile, with one plain lying outside the border and no cards. */
function cityOf(inside: Terrain[], carrying: Partial<Chronicle> = {}): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  return {
    seed: 7,
    rng: seedRng(7),
    tiles: [
      ...inside.map(
        (terrain, index): Tile =>
          index === 0 ? { q: 0, r: 0, terrain, building: 'PH_City' } : { q: index, r: 0, terrain },
      ),
      { q: 0, r: 5, terrain: 'plain' as Terrain },
    ],
    city: CITY,
    held,
    turn: 1,
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: held.length,
    units: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    ...carrying,
  };
}

/**
 * A disc of plain around the city, out to `radius`; `water` names the wet ones. The city stands on
 * its urban tile as the founding leaves it: in that tile's building slot.
 */
function field(radius: number, water: TileCoords[] = []): Tile[] {
  const wet = new Set(water.map(tileKey));
  const tiles: Tile[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      if (q === 0 && r === 0) {
        tiles.push({ q, r, terrain: 'urban', building: 'PH_City' });
        continue;
      }
      tiles.push({ q, r, terrain: wet.has(tileKey({ q, r })) ? 'water' : 'plain' });
    }
  }
  return tiles;
}

function statsOf(stats: Partial<UnitStats>): UnitStats {
  return { id: 'PH_Warrior', health: 4, damage: 1, range: 1, move: 2, ...stats };
}

function unitOf(faction: Faction, tile: TileCoords, stats: Partial<UnitStats> = {}): Unit {
  return faction === 'player'
    ? { stats: statsOf(stats), faction, tile }
    : { stats: statsOf(stats), faction, tile, script: 'PH_Advance' };
}

/** An enemy carrying the intent an enemy phase left on it: the tile its attack is aimed at. */
function aiming(tile: TileCoords, intent: TileCoords, stats: Partial<UnitStats> = {}): Unit {
  return { stats: statsOf(stats), faction: 'enemy', tile, script: 'PH_Advance', intent };
}

/** An order aimed at a unit and a destination, ready to hand to `apply`. */
function march(unit: number, to: TileCoords): Command {
  return { type: 'play', index: 0, target: { type: 'unit-tile', unit, tile: to } };
}

/** A building card aimed at a tile, ready to hand to `apply`. */
function buildOn(tile: TileCoords): Command {
  return { type: 'play', index: 0, target: { type: 'tile', tile } };
}

/** What the city pays for the farm card, and nothing besides. */
const PRODUCTION: Resources = {
  food: 0,
  production: 3,
  military: 0,
  money: 0,
  science: 0,
  culture: 0,
};

function buildingAt(chronicle: Chronicle, { q, r }: TileCoords): BuildingTypeId | undefined {
  return chronicle.tiles.find((tile) => tile.q === q && tile.r === r)?.building;
}

/** A worker of the player's, standing on a tile with nothing to fight with. */
function worker(tile: TileCoords): Unit {
  return unitOf('player', tile, { id: 'PH_Worker', damage: 0, range: 0 });
}

function everyCard(chronicle: Chronicle): CardId[] {
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
}

/** What the enemy standing at `index` is aiming at, and nothing when it declared no intent. */
function intentOf(chronicle: Chronicle, index: number): TileCoords | undefined {
  const unit = chronicle.units[index];
  if (unit.faction !== 'enemy') throw new Error(`the unit at ${index} is not an enemy`);
  return unit.intent;
}

/** Every tile of a disc at its rim: the ring an arrival draws from. */
function rimOf(radius: number): TileCoords[] {
  return field(radius)
    .filter((tile) => distance(tile, CITY) === radius)
    .map(({ q, r }) => ({ q, r }));
}

/** Four ends of turn on: the chronicle stands on turn five, with that turn's events resolved. */
function toFifthTurn(chronicle: Chronicle): Chronicle {
  let standing = chronicle;
  for (let turn = 1; turn < 5; turn++) standing = apply(standing, { type: 'end-turn' });
  return standing;
}

test('the same seed founds the same chronicle', () => {
  expect(beginChronicle(1234)).toEqual(beginChronicle(1234));
  expect(beginChronicle(1235)).not.toEqual(beginChronicle(1234));
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = beginChronicle(1234);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('the city holds its own tile and every tile touching it', () => {
  for (const seed of [0, 1234, 0xdeadbeef | 0]) {
    const chronicle = beginChronicle(seed);
    const held = new Set(chronicle.held.map(tileKey));

    expect(held.size).toBe(7);
    for (const tile of chronicle.tiles) {
      expect(held.has(tileKey(tile))).toBe(distance(tile, chronicle.city) <= 1);
    }
  }
});

test('a chronicle opens on turn one, with empty stores and a tile each for its inhabitants', () => {
  const chronicle = beginChronicle(1234);

  expect(chronicle.turn).toBe(1);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.population).toBe(chronicle.held.length);
});

test('income yields every tile inside the border, and nothing outside it', () => {
  const inside: Terrain[] = ['urban', 'plain', 'forest', 'hills', 'water'];

  const after = apply(cityOf(inside), { type: 'end-turn' });

  for (const resource of RESOURCES) {
    const yielded = inside.reduce(
      (total, terrain) => total + (TERRAIN_YIELDS[terrain][resource] ?? 0),
      0,
    );
    expect(after.resources[resource]).toBe(yielded);
  }
});

test('a second tile of the same terrain yields as much again', () => {
  const once = apply(cityOf(['forest']), { type: 'end-turn' });
  const twice = apply(cityOf(['forest', 'forest']), { type: 'end-turn' });

  for (const resource of RESOURCES) {
    expect(twice.resources[resource]).toBe(once.resources[resource] * 2);
  }
});

test('resources accumulate over consecutive turns', () => {
  const city = cityOf(['urban', 'plain', 'hills']);

  const first = apply(city, { type: 'end-turn' });
  const third = apply(apply(first, { type: 'end-turn' }), { type: 'end-turn' });

  for (const resource of RESOURCES) {
    expect(third.resources[resource]).toBe(first.resources[resource] * 3);
  }
});

test('ending the turn moves the chronicle on to the next one', () => {
  const city = cityOf(['urban']);

  expect(apply(city, { type: 'end-turn' }).turn).toBe(2);
  expect(apply(apply(city, { type: 'end-turn' }), { type: 'end-turn' }).turn).toBe(3);
});

test('ending the turn leaves the population alone', () => {
  const city = cityOf(['urban', 'plain', 'water']);

  expect(apply(city, { type: 'end-turn' }).population).toBe(city.population);
});

test('the hand holds five cards on founding, and five again after every turn', () => {
  let chronicle = beginChronicle(4242);
  expect(chronicle.hand).toHaveLength(5);

  for (let turn = 0; turn < 6; turn++) {
    chronicle = apply(chronicle, { type: 'end-turn' });
    expect(chronicle.hand).toHaveLength(5);
  }
});

test('playing a card pays its cost and sends it to the discard pile', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_March'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 3, culture: 0 },
  });

  const after = apply(city, { type: 'play', index: 0 });

  expect(after.hand).toEqual(['PH_March']);
  expect(after.discardPile).toEqual(['PH_Harvest']);
  expect(after.resources.science).toBe(2);
});

test('playing the harvest card gains its two food, on top of what the city already holds', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const after = apply(city, { type: 'play', index: 0 });

  expect(after.resources.food).toBe(3);
});

test('a card the city cannot pay for stays in the hand and costs nothing', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const halfway = cityOf(['urban'], {
    hand: ['PH_Farm'],
    resources: { food: 0, production: 2, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(apply(penniless, { type: 'play', index: 0 })).toEqual(penniless);
  expect(apply(halfway, { type: 'play', index: 0 })).toEqual(halfway);
});

test('ending the turn discards what is left of the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Worker', 'PH_Warrior', 'PH_Warrior', 'PH_Harvest'],
  });

  const after = apply(city, { type: 'end-turn' });

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

  const after = apply(spent, { type: 'end-turn' });

  expect(after.hand).toHaveLength(5);
  expect(after.drawPile).toHaveLength(2);
  expect(after.discardPile).toEqual([]);
  expect(everyCard(after)).toEqual(everyCard(spent));
  expect(apply(spent, { type: 'end-turn' }).hand).toEqual(after.hand);
  expect(apply({ ...spent, rng: seedRng(99) }, { type: 'end-turn' }).hand).not.toEqual(after.hand);
});

test('a draw with nothing left anywhere draws what there is', () => {
  const city = cityOf(['urban'], { drawPile: ['PH_March', 'PH_Harvest'] });

  expect(apply(city, { type: 'end-turn' }).hand).toEqual(['PH_March', 'PH_Harvest']);
});

test('every card of the deck is in exactly one pile through a full cycle', () => {
  let chronicle = beginChronicle(2026);
  const deck = everyCard(chronicle);
  expect(deck).toHaveLength(DECK.length);

  for (let turn = 0; turn < 8; turn++) {
    chronicle = apply(chronicle, { type: 'play', index: 0 });
    chronicle = apply(chronicle, { type: 'end-turn' });
    expect(everyCard(chronicle)).toEqual(deck);
  }
});

test('the same command on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban', 'plain', 'forest', 'hills', 'water']);
  const untouched = structuredClone(city);

  expect(apply(city, { type: 'end-turn' })).toEqual(apply(city, { type: 'end-turn' }));
  expect(city).toEqual(untouched);
});

test('a unit card turns one population into a unit on the city tile', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = apply(city, { type: 'play', index: 0 });

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
    units: [unitOf('player', CITY), unitOf('enemy', { q: 2, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});

test('a unit card is refused with no population left to make the unit of', () => {
  const spent = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 0,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = apply(spent, { type: 'play', index: 0 });

  expect(playable(refusalOf(spent, 'PH_Worker'))).toBe(false);
  expect(after.hand).toEqual(spent.hand);
  expect(after.units).toEqual([]);
});

test('a city with no population left falls, whatever the command was', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0 });

  expect(apply(empty, { type: 'play', index: 0 }).defeat).toEqual({
    cause: 'population',
    turn: empty.turn,
  });
});

test('a unit card is refused while a unit already stands on the city tile', () => {
  const crowded = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    units: [unitOf('player', CITY)],
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(apply(crowded, { type: 'play', index: 0 })).toEqual(crowded);
});

test('the plain order moves a unit within its move, and no further', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2 })],
  });

  expect(apply(city, march(0, { q: 2, r: 0 })).units[0].tile).toEqual({ q: 2, r: 0 });
  expect(apply(city, march(0, { q: 3, r: 0 }))).toEqual(city);
});

test('water is impassable, and so is everything only water leads to', () => {
  const city = cityOf(['urban'], {
    tiles: field(2, [{ q: 1, r: 0 }]),
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2 })],
  });

  expect(apply(city, march(0, { q: 1, r: 0 }))).toEqual(city);
  expect(apply(city, march(0, { q: 2, r: 0 }))).toEqual(city);
  expect(apply(city, march(0, { q: 1, r: 1 })).units[0].tile).toEqual({ q: 1, r: 1 });
});

test('a unit crosses its own faction but never lands on it', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2 }), unitOf('player', { q: 1, r: 0 })],
  });

  expect(apply(city, march(0, { q: 1, r: 0 }))).toEqual(city);
  expect(apply(city, march(0, { q: 2, r: 0 })).units[0].tile).toEqual({ q: 2, r: 0 });
});

test('the other faction stops a unit where it stands', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2, damage: 0 }), unitOf('enemy', { q: 1, r: 0 })],
  });

  expect(apply(city, march(0, { q: 1, r: 0 }))).toEqual(city);
  expect(apply(city, march(0, { q: 2, r: 0 }))).toEqual(city);
});

test('an order with no target, or a target that is not the player’s, is refused', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2 }), unitOf('enemy', { q: 2, r: 0 })],
  });

  expect(apply(city, { type: 'play', index: 0 })).toEqual(city);
  expect(apply(city, march(1, { q: 2, r: 1 }))).toEqual(city);
  expect(apply(city, march(4, { q: 1, r: 0 }))).toEqual(city);
});

test('an order is refused when no unit of the player’s has anywhere to go', () => {
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
    hand: ['PH_March'],
    units: [unitOf('player', CITY, { move: 2 })],
  });

  for (const to of walled) expect(apply(city, march(0, to))).toEqual(city);
});

test('a unit with damage attacks the enemy with the least health where it lands', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      unitOf('player', CITY, { move: 1, damage: 2, range: 1 }),
      unitOf('enemy', { q: 2, r: 0 }, { health: 5 }),
      unitOf('enemy', { q: 1, r: 1 }, { health: 3 }),
    ],
  });

  const after = apply(city, march(0, { q: 1, r: 0 }));

  expect(after.units).toHaveLength(3);
  expect(after.units[1].stats.health).toBe(5);
  expect(after.units[2].stats.health).toBe(1);
});

test('an enemy brought to zero health is killed and leaves the map', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      unitOf('player', CITY, { move: 1, damage: 2, range: 1 }),
      unitOf('enemy', { q: 2, r: 0 }, { health: 5 }),
      unitOf('enemy', { q: 1, r: 1 }, { health: 2 }),
    ],
  });

  const after = apply(city, march(0, { q: 1, r: 0 }));

  expect(after.units.map((unit) => unit.tile)).toEqual([
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]);
});

test('a worker arriving beside an enemy leaves it alone', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      unitOf('player', CITY, { id: 'PH_Worker', move: 1, damage: 0, range: 0 }),
      unitOf('enemy', { q: 1, r: 1 }, { health: 3 }),
    ],
  });

  const after = apply(city, march(0, { q: 1, r: 0 }));

  expect(after.units[1].stats.health).toBe(3);
});

test('an enemy out of range is left alone, and the order still resolves', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      unitOf('player', CITY, { move: 1, damage: 2, range: 1 }),
      unitOf('enemy', { q: 3, r: 0 }, { health: 3 }),
    ],
  });

  const after = apply(city, march(0, { q: 1, r: 0 }));

  expect(after.units[0].tile).toEqual({ q: 1, r: 0 });
  expect(after.units[1].stats.health).toBe(3);
  expect(after.discardPile).toEqual(['PH_March']);
});

test('a building card builds its building on a tile inside the border where a worker stands', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: PRODUCTION,
  });

  const after = apply(city, buildOn({ q: 1, r: 0 }));

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
    resources: PRODUCTION,
  });

  expect(apply(city, buildOn({ q: 2, r: 0 }))).toEqual(city);
  expect(apply(city, { type: 'play', index: 0 })).toEqual(city);
});

test('a building card is refused on a tile outside the border, worker standing or not', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: PRODUCTION,
  });

  expect(apply(city, buildOn({ q: 1, r: 0 }))).toEqual(city);
});

test('a building card cannot be played with no worker of the player’s inside the border', () => {
  const alone = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    resources: PRODUCTION,
  });
  const fighting = { ...alone, units: [unitOf('player', { q: 1, r: 0 })] };

  expect(playable(refusalOf(alone, 'PH_Farm'))).toBe(false);
  expect(playable(refusalOf(fighting, 'PH_Farm'))).toBe(false);
  expect(apply(alone, buildOn({ q: 1, r: 0 }))).toEqual(alone);
});

test('a tile’s building slot takes one building and no more', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm', 'PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: { ...PRODUCTION, production: 6 },
  });

  const once = apply(city, buildOn({ q: 1, r: 0 }));

  expect(apply(once, buildOn({ q: 1, r: 0 }))).toEqual(once);
  expect(playable(refusalOf(once, 'PH_Farm'))).toBe(false);
});

test('the founding fills the city tile’s slot with the city', () => {
  const chronicle = beginChronicle(1234);

  expect(buildingAt(chronicle, chronicle.city)).toBe('PH_City');
});

test('the city in its slot adds nothing to what the tile it stands on yields', () => {
  const founded = apply(cityOf(['urban'], { tiles: field(1) }), { type: 'end-turn' });

  for (const resource of RESOURCES) {
    expect(founded.resources[resource]).toBe(TERRAIN_YIELDS.urban[resource] ?? 0);
  }
});

test('the city fills its own tile’s slot, worker or no worker', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker(CITY)],
    resources: PRODUCTION,
  });
  const overOne = { ...city, units: [worker({ q: 1, r: 0 })] };

  expect(buildingAt(city, CITY)).toBe('PH_City');
  expect(buildable(city, 'PH_Farm')).toEqual([]);
  expect(apply(city, buildOn(CITY))).toEqual(city);
  expect(playable(refusalOf(city, 'PH_Farm'))).toBe(false);
  expect(playable(refusalOf(overOne, 'PH_Farm'))).toBe(true);
});

test('a farm stands on a plain and on no other terrain a worker reaches', () => {
  for (const terrain of ['forest', 'hills', 'urban'] as Terrain[]) {
    const city = cityOf(['urban', terrain], {
      hand: ['PH_Farm'],
      units: [worker({ q: 1, r: 0 })],
      resources: PRODUCTION,
    });

    expect(buildable(city, 'PH_Farm')).toEqual([]);
    expect(playable(refusalOf(city, 'PH_Farm'))).toBe(false);
    expect(apply(city, buildOn({ q: 1, r: 0 }))).toEqual(city);
  }
});

test('a farm standing on a tile adds its food to what that tile yields at income', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: PRODUCTION,
  });

  const bare = apply(city, { type: 'end-turn' });
  const farmed = apply(apply(city, buildOn({ q: 1, r: 0 })), { type: 'end-turn' });

  expect(farmed.resources.food).toBe(bare.resources.food + 1);
});

test('a unit card never takes the city’s last population', () => {
  const last = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 1,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });
  const spare = { ...last, population: 2 };

  expect(playable(refusalOf(last, 'PH_Worker'))).toBe(false);
  expect(apply(last, { type: 'play', index: 0 })).toEqual(last);
  expect(apply(spare, { type: 'play', index: 0 }).population).toBe(1);
});

test('an enemy arrives on the rim of the map on every fifth turn, and on no turn between', () => {
  let chronicle = cityOf(['urban'], { tiles: field(MAP_COMPOSITION.radius) });

  for (let turn = 2; turn <= 4; turn++) {
    chronicle = apply(chronicle, { type: 'end-turn' });
    expect(chronicle.turn).toBe(turn);
    expect(chronicle.units).toEqual([]);
  }
  chronicle = apply(chronicle, { type: 'end-turn' });

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

test('the enemy arrives on a free land tile of the rim, and on nothing else there is', () => {
  const rim = rimOf(MAP_COMPOSITION.radius);
  const onlyDry = rim[3];
  const dry = cityOf(['urban'], {
    tiles: field(
      MAP_COMPOSITION.radius,
      rim.filter((coord) => tileKey(coord) !== tileKey(onlyDry)),
    ),
  });

  expect(toFifthTurn(dry).units[0].tile).toEqual(onlyDry);
  expect(toFifthTurn({ ...dry, units: [worker(onlyDry)] }).units).toHaveLength(1);
  expect(
    toFifthTurn(cityOf(['urban'], { tiles: field(MAP_COMPOSITION.radius, rim) })).units,
  ).toEqual([]);
});

test('an enemy moves its move toward the city, turn after turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [unitOf('enemy', { q: 4, r: 0 }, { move: 2 })],
  });

  const moved = apply(city, { type: 'end-turn' });

  expect(distance(moved.units[0].tile, CITY)).toBe(2);
  expect(distance(apply(moved, { type: 'end-turn' }).units[0].tile, CITY)).toBe(0);
});

test('an enemy moves toward the nearest of the player’s units instead of the city', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), unitOf('enemy', { q: 4, r: 0 }, { move: 2 })],
  });

  const moved = apply(city, { type: 'end-turn' });

  expect(distance(moved.units[1].tile, { q: 2, r: 0 })).toBe(1);
});

test('an enemy declares its intent on a unit in range, and executes it in the next combat', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [worker({ q: 2, r: 0 }), unitOf('enemy', { q: 4, r: 0 }, { move: 2, damage: 2 })],
  });

  const declared = apply(city, { type: 'end-turn' });
  expect(intentOf(declared, 1)).toEqual({ q: 2, r: 0 });

  const attacked = apply(declared, { type: 'end-turn' });
  expect(attacked.units[0].stats.health).toBe(city.units[0].stats.health - 2);
});

test('a killed enemy’s intent dies with it', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      unitOf('player', { q: 1, r: 0 }, { damage: 3 }),
      aiming({ q: 2, r: 0 }, { q: 1, r: 0 }, { health: 3, damage: 2 }),
    ],
  });

  const after = apply(city, { type: 'end-turn' });

  expect(after.units).toHaveLength(1);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an intent aimed at a tile its target has left attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [worker({ q: 1, r: 0 }), aiming({ q: 2, r: 0 }, { q: 1, r: 0 }, { damage: 2 })],
  });

  const dodged = apply(apply(city, march(0, { q: 0, r: 1 })), { type: 'end-turn' });

  expect(dodged.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('a fighting unit that stands still attacks the enemy with the least health', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      unitOf('player', { q: 1, r: 0 }, { damage: 2 }),
      unitOf('enemy', { q: 2, r: 0 }, { health: 5 }),
      unitOf('enemy', { q: 1, r: 1 }, { health: 3 }),
    ],
  });

  const after = apply(city, { type: 'end-turn' });

  expect(after.units[1].stats.health).toBe(5);
  expect(after.units[2].stats.health).toBe(1);
});

test('a tile an enemy occupies yields nothing at income', () => {
  const bare = cityOf(['urban', 'plain']);
  const occupied = { ...bare, units: [unitOf('enemy', { q: 1, r: 0 })] };

  const free = apply(bare, { type: 'end-turn' });
  const held = apply(occupied, { type: 'end-turn' });

  for (const resource of RESOURCES) {
    expect(held.resources[resource]).toBe(
      free.resources[resource] - (TERRAIN_YIELDS.plain[resource] ?? 0),
    );
  }
});

test('an enemy on the city’s tile declares nothing, and captures the city the turn after', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [unitOf('enemy', { q: 1, r: 0 }, { move: 1 })],
  });

  const stood = apply(city, { type: 'end-turn' });
  expect(stood.units[0].tile).toEqual(CITY);
  expect(intentOf(stood, 0)).toBeUndefined();
  expect(stood.defeat).toBeUndefined();

  const fallen = apply(stood, { type: 'end-turn' });
  expect(fallen.defeat).toEqual({ cause: 'capture', turn: stood.turn });
  expect(fallen.turn).toBe(stood.turn);
});

test('the enemy that moves in from the rim reaches the city and captures it', () => {
  let chronicle = cityOf(['urban'], { tiles: field(MAP_COMPOSITION.radius) });
  for (let turn = 0; turn < 20 && chronicle.defeat === undefined; turn++) {
    chronicle = apply(chronicle, { type: 'end-turn' });
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

  expect(apply(city, { type: 'play', index: 0 }).resources.food).toBeGreaterThan(0);
  expect(apply(fallen, { type: 'end-turn' })).toBe(fallen);
  expect(apply(fallen, { type: 'play', index: 0 })).toBe(fallen);
});

test('a chronicle with enemies on the map survives JSON', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [worker({ q: 1, r: 0 }), aiming({ q: 2, r: 0 }, { q: 1, r: 0 })],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});

test('the same order on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      unitOf('player', CITY, { move: 2, damage: 2, range: 1 }),
      unitOf('enemy', { q: 2, r: 0 }, { health: 5 }),
    ],
  });
  const untouched = structuredClone(city);

  expect(apply(city, march(0, { q: 1, r: 0 }))).toEqual(apply(city, march(0, { q: 1, r: 0 })));
  expect(city).toEqual(untouched);
});
