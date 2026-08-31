import { expect, test } from 'vitest';
import { type CardId, DECK } from './cards';
import { apply, beginChronicle, type Chronicle, RESOURCES } from './chronicle';
import { TERRAIN_YIELDS, type Terrain, type TileCoords } from './map';
import { seedRng } from './rng';

function key({ q, r }: TileCoords): string {
  return `${q},${r}`;
}

function distance(a: TileCoords, b: TileCoords): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - (b.q + b.r))) / 2;
}

/** A city on `inside`, tile by tile, with one plain lying outside the border and no cards. */
function cityOf(inside: Terrain[], carrying: Partial<Chronicle> = {}): Chronicle {
  const held = inside.map((_, index) => ({ q: index, r: 0 }));
  return {
    seed: 7,
    rng: seedRng(7),
    tiles: [
      ...inside.map((terrain, index) => ({ q: index, r: 0, terrain })),
      { q: 0, r: 5, terrain: 'plain' as Terrain },
    ],
    city: { q: 0, r: 0 },
    held,
    turn: 1,
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: held.length,
    drawPile: [],
    hand: [],
    discardPile: [],
    ...carrying,
  };
}

function everyCard(chronicle: Chronicle): CardId[] {
  return [...chronicle.drawPile, ...chronicle.hand, ...chronicle.discardPile].sort();
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
    const held = new Set(chronicle.held.map(key));

    expect(held.size).toBe(7);
    for (const tile of chronicle.tiles) {
      expect(held.has(key(tile))).toBe(distance(tile, chronicle.city) <= 1);
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
