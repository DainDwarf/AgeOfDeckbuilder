import { expect, test } from 'vitest';
import { type Catalogue, catalogued, entered } from './catalogue';
import { apply, beginChronicle, launched } from './chronicle';
import { CATALOGUE, CITY, cityOf, DECK, field, REGION } from './fixtures';
import { generateMap, tileKey } from './map';
import { seedRng } from './rng';

/** The fixture's content with what the test changes laid over it. */
function changed(content: Partial<Catalogue>): Catalogue {
  return { ...CATALOGUE, ...content };
}

test('a catalogue whose camp enters a unit kind it does not hold is refused', () => {
  const content = changed({ camp: { ...CATALOGUE.camp, unit: 'PH_Scout' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose camp carries a script it does not hold is refused', () => {
  const content = changed({ camp: { ...CATALOGUE.camp, script: 'retreat' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose camp enters a unit that cannot stand on a camp’s terrain is refused', () => {
  const stuck = { ...CATALOGUE.units.PH_Warrior, move: 0 };
  const content = changed({ units: { ...CATALOGUE.units, PH_Warrior: stuck } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose unit kind names itself by another key is refused', () => {
  const content = changed({
    units: { ...CATALOGUE.units, PH_Guard: CATALOGUE.units.PH_Warrior },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose biome names a terrain it does not hold is refused', () => {
  const { sea } = CATALOGUE.biomes;
  const content = changed({ biomes: { ...CATALOGUE.biomes, sea: { ...sea, rim: { shoal: 1 } } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose feature lies on a terrain it does not hold is refused', () => {
  const content = changed({ features: { PH_Fertile: { terrain: 'marsh', yields: {} } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose region names a biome or a feature it does not hold is refused', () => {
  const disc = CATALOGUE.regions[REGION];
  const tundra = changed({ regions: { [REGION]: { ...disc, centreBiome: 'tundra' } } });
  const ruins = changed({
    regions: { [REGION]: { ...disc, featureShares: [{ feature: 'PH_Ruins', share: 1 }] } },
  });

  expect(() => catalogued(tundra)).toThrow(/^fixture: /);
  expect(() => catalogued(ruins)).toThrow(/^fixture: /);
});

test('a catalogue whose camp is a building it does not hold is refused', () => {
  const content = changed({ camp: { ...CATALOGUE.camp, building: 'PH_Fort' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose city’s building does not stand on the city’s terrain is refused', () => {
  const content = changed({ city: { ...CATALOGUE.city, terrain: 'plain' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck names a card it does not hold is refused', () => {
  const content = changed({ decks: { deck: [...DECK, 'PH_Scout'] } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds a hazard is refused', () => {
  const content = changed({ decks: { deck: [...DECK, 'PH_Hunger'] } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds the camp’s reward is refused', () => {
  const content = changed({ decks: { deck: [...DECK, CATALOGUE.camp.reward] } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose camp’s reward is a card it does not hold is refused', () => {
  const content = changed({ camp: { ...CATALOGUE.camp, reward: 'PH_Loot' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue that holds together builds', () => {
  const content = changed({ version: 'coherent' });

  expect(catalogued(content)).toBe(content);
});

test('a map of a region the catalogue does not hold is refused', () => {
  expect(() => generateMap(CATALOGUE, 'tundra', seedRng(1))).toThrow(/^fixture: /);
});

test('the opening on a map with no centre tile is refused', () => {
  const holed = field(2).filter((tile) => tileKey(tile) !== tileKey(CITY));

  expect(() => beginChronicle(CATALOGUE, 1, DECK, { tiles: holed, rivers: [] })).toThrow(
    /^fixture: /,
  );
});

test('a catalogue whose region’s rivers rise in a biome it does not hold is refused', () => {
  const disc = CATALOGUE.regions[REGION];
  const content = changed({
    regions: { [REGION]: { ...disc, rivers: { ...disc.rivers, source: 'glacier' } } },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a chronicle founded on another version of the content is refused by apply', () => {
  const other = catalogued(changed({ version: 'other' }));
  const founded = launched(other, REGION, 1234, DECK);

  expect(() => apply(CATALOGUE, founded, { type: 'end-turn' })).toThrow(/^fixture: /);
  expect(apply(other, founded, { type: 'end-turn' }).length).toBeGreaterThan(0);
});

test('a unit entering as a kind the catalogue does not hold is refused', () => {
  const city = cityOf(['urban']);

  expect(() =>
    entered(CATALOGUE, city, { type: 'PH_Scout', tile: { q: 0, r: 0 }, faction: 'player' }),
  ).toThrow(/^fixture: /);
});
