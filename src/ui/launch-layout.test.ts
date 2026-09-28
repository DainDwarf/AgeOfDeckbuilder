import { expect, test } from 'vitest';
import { newCampaign, paidInto } from '../rules/campaign';
import { achievementOf, firstRegion, merged, technologyOf } from '../rules/catalogue';
import {
  AGE,
  CATALOGUE,
  CIVILIZATION_ID,
  CLEARING,
  hoardedVictory,
  QUIET,
  REGION,
  REGIONS,
  SLICES,
  victoryOf,
} from '../rules/fixtures';
import type { Region } from '../rules/map-kinds';
import { openingChoices, RING, ringOf, withAge } from './launch-layout';

/** A fixture region whose shares are these, in this order. */
function sharing(...shares: [string, number][]): Region {
  return {
    ...REGIONS[REGION],
    biomeShares: shares.map(([biome, share]) => ({ biome, share })),
  };
}

test('the launch screen opens on a new campaign on the first age, its first region and the campaign’s civilization', () => {
  expect(openingChoices(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID))).toEqual({
    age: AGE,
    region: firstRegion(CATALOGUE, AGE),
    civilization: CIVILIZATION_ID,
  });
});

test('the launch screen opens on the furthest age the campaign has reached, and that age’s first region', () => {
  const { campaign } = paidInto(
    CATALOGUE,
    newCampaign(CATALOGUE, CIVILIZATION_ID),
    hoardedVictory(),
  );
  const { technology } = achievementOf(CATALOGUE, AGE, victoryOf(AGE));
  const next = technologyOf(CATALOGUE, technology).unlocks.age;
  if (next === undefined) throw new Error(`the victory of ${AGE} unlocks no age`);

  expect(openingChoices(CATALOGUE, campaign)).toEqual({
    age: next,
    region: firstRegion(CATALOGUE, next),
    civilization: CIVILIZATION_ID,
  });
});

test('choosing another age keeps the region where that age holds one of its name', () => {
  const choices = { age: AGE, region: CLEARING, civilization: CIVILIZATION_ID };

  expect(firstRegion(CATALOGUE, QUIET)).not.toBe(CLEARING);
  expect(withAge(CATALOGUE, choices, QUIET)).toEqual({ ...choices, age: QUIET });
});

test('choosing another age takes its first region where it holds none of the chosen one’s name', () => {
  const [first, second] = SLICES;
  const glen = merged('fixture', [
    first,
    { ...second, owns: { ...second.owns, regions: { glen: REGIONS[CLEARING] } } },
    ...SLICES.slice(2),
  ]);
  const choices = { age: AGE, region: CLEARING, civilization: CIVILIZATION_ID };

  expect(withAge(glen, choices, second.id)).toEqual({ ...choices, age: second.id, region: 'glen' });
});

test('each biome a region’s shares name stands on one hexagon around the middle one, the rest go to the largest share, and one biome’s stand side by side in the order named', () => {
  const ring = ringOf(sharing(['low', 0.1], ['high', 0.5], ['mid', 0.15], ['wide', 0.25]));

  expect(ring).toEqual(['low', 'high', 'high', 'high', 'mid', 'wide']);
});

test('a hexagon left goes to the share largest for the hexagons it would hold, not to the largest share alone', () => {
  const ring = ringOf(sharing(['big', 0.5], ['small', 0.4], ['tiny', 0.1]));

  expect(ring).toEqual(['big', 'big', 'big', 'small', 'small', 'tiny']);
});

test('a tie for a hexagon goes to the larger share, and between equal shares to the biome named first', () => {
  expect(ringOf(sharing(['small', 0.3], ['large', 0.6], ['tiny', 0.05]))).toEqual([
    'small',
    'large',
    'large',
    'large',
    'large',
    'tiny',
  ]);
  expect(ringOf(sharing(['first', 0.4], ['second', 0.4], ['third', 0.2]))).toEqual([
    'first',
    'first',
    'first',
    'second',
    'second',
    'third',
  ]);
});

test('a region naming more than six biomes draws its six largest, a tie going to the biome named first', () => {
  const ring = ringOf(
    sharing(
      ['a', 0.1],
      ['b', 0.2],
      ['c', 0.1],
      ['d', 0.2],
      ['e', 0.1],
      ['f', 0.1],
      ['g', 0.1],
      ['h', 0.1],
    ),
  );

  expect(ring).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
});

test('a biome the shares name twice stands as one, on the two shares together', () => {
  expect(ringOf(sharing(['sea', 0.25], ['land', 0.5], ['sea', 0.25]))).toEqual([
    'sea',
    'sea',
    'sea',
    'land',
    'land',
    'land',
  ]);
});

test('a region whose shares name no biome stands its centre’s biome all around', () => {
  const region = sharing();

  expect(ringOf(region)).toEqual(Array(RING).fill(region.centreBiome));
});
