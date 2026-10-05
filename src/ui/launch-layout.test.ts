import { expect, test } from 'vitest';
import { newCampaign, paidInto } from '../rules/campaign';
import { achievementOf, firstRegion, merged, technologyOf } from '../rules/catalogue';
import {
  AGE,
  CATALOGUE,
  CIVILIZATION_ID,
  CLEARING,
  GRANARY,
  hoardedVictory,
  QUIET,
  REGION,
  REGIONS,
  regionsUnlocked,
  SLICES,
  victoryOf,
} from '../rules/fixtures';
import type { Region } from '../rules/map-kinds';
import { clustersOf, openingChoices, RING, ringOf, withAge } from './launch-layout';

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

test('the launch screen opens on the first region of the age the campaign has reached, the first listed not reached passed over', () => {
  const catalogue = regionsUnlocked({ [GRANARY]: REGION });
  const opened = newCampaign(catalogue, CIVILIZATION_ID);
  const { campaign } = paidInto(catalogue, opened, hoardedVictory());

  expect(firstRegion(catalogue, AGE)).toBe(REGION);
  expect(openingChoices(catalogue, opened)).toEqual({
    age: AGE,
    region: CLEARING,
    civilization: CIVILIZATION_ID,
  });
  expect(openingChoices(catalogue, campaign).region).toBe(REGION);
});

test('selecting another age keeps the region where that age holds one of its name', () => {
  const choices = { age: AGE, region: CLEARING, civilization: CIVILIZATION_ID };
  const campaign = newCampaign(CATALOGUE, CIVILIZATION_ID);

  expect(firstRegion(CATALOGUE, QUIET)).not.toBe(CLEARING);
  expect(withAge(CATALOGUE, campaign, choices, QUIET)).toEqual({ ...choices, age: QUIET });
});

test('selecting another age takes the first region of it the campaign has reached where it holds none of the selected one’s name', () => {
  const [first, second] = SLICES;
  const slices = [
    first,
    {
      ...second,
      owns: { ...second.owns, regions: { glen: REGIONS[REGION], dell: REGIONS[CLEARING] } },
    },
    ...SLICES.slice(2),
  ];
  const catalogue = regionsUnlocked({ [GRANARY]: 'glen' }, slices);
  const campaign = newCampaign(catalogue, CIVILIZATION_ID);
  const choices = { age: AGE, region: CLEARING, civilization: CIVILIZATION_ID };

  expect(withAge(catalogue, campaign, choices, second.id)).toEqual({
    ...choices,
    age: second.id,
    region: 'dell',
  });
});

test('the row stands every region of the age in the order listed, each read as reached or not', () => {
  const catalogue = regionsUnlocked({ [GRANARY]: REGION });
  const campaign = newCampaign(catalogue, CIVILIZATION_ID);

  expect(
    clustersOf(catalogue, campaign, AGE).map(({ region, reached }) => [region, reached]),
  ).toEqual([
    [REGION, false],
    [CLEARING, true],
  ]);
});

test('a region’s cluster is drawn from the region of its name in the first age holding one, whichever age is selected', () => {
  const [first, second, ...rest] = SLICES;
  const reshared = sharing(['mountain', 0.3], ['sea', 0.1]);
  const later = merged('fixture', [
    first,
    {
      ...second,
      owns: { ...second.owns, regions: { ...second.owns.regions, [REGION]: reshared } },
    },
    ...rest,
  ]);
  const firstAges = Object.entries(REGIONS).map(([region, held]) => ({
    region,
    reached: true,
    biomes: [held.centreBiome, ...ringOf(held)],
  }));
  const campaign = newCampaign(later, CIVILIZATION_ID);

  expect(ringOf(reshared)).not.toEqual(ringOf(REGIONS[REGION]));
  expect(clustersOf(later, campaign, first.id)).toEqual(firstAges);
  expect(clustersOf(later, campaign, second.id)).toEqual(firstAges);
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
