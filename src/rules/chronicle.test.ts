import { expect, test } from 'vitest';
import { apply, beginChronicle, type Chronicle, RESOURCES } from './chronicle';
import { TERRAIN_YIELDS, type Terrain, type TileCoords } from './map';
import { seedRng } from './rng';

function key({ q, r }: TileCoords): string {
  return `${q},${r}`;
}

function distance(a: TileCoords, b: TileCoords): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - (b.q + b.r))) / 2;
}

/** A city on `inside`, tile by tile, with one plain lying outside the border. */
function cityOf(inside: Terrain[]): Chronicle {
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
  };
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

test('the same command on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban', 'plain', 'forest', 'hills', 'water']);
  const untouched = structuredClone(city);

  expect(apply(city, { type: 'end-turn' })).toEqual(apply(city, { type: 'end-turn' }));
  expect(city).toEqual(untouched);
});
