import { expect, test } from 'vitest';
import { beginChronicle } from './chronicle';
import type { TileCoords } from './map';
import { seedRng } from './rng';

function key({ q, r }: TileCoords): string {
  return `${q},${r}`;
}

function distance(a: TileCoords, b: TileCoords): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - (b.q + b.r))) / 2;
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
