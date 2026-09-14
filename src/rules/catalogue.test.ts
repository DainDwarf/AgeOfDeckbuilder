import { expect, test } from 'vitest';
import { type Catalogue, catalogued, entered, type Schedule } from './catalogue';
import { apply, beginChronicle, launched } from './chronicle';
import { CATALOGUE, CITY, cityOf, DECK, field, NO_DEALS, REGION, SCHEDULE } from './fixtures';
import { generateMap, tileKey } from './map';
import { seedRng } from './rng';
import { timelineOf } from './schedule';

/** The fixture's content with what the test changes laid over it. */
function changed(content: Partial<Catalogue>): Catalogue {
  return { ...CATALOGUE, ...content };
}

/** The fixture's content with its one schedule changed as the test lays it over. */
function rescheduled(schedule: Partial<Schedule>): Catalogue {
  return changed({ schedules: { [SCHEDULE]: { ...CATALOGUE.schedules[SCHEDULE], ...schedule } } });
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

test('a catalogue whose schedule names an event it does not hold is refused', () => {
  const { entries, capstone } = CATALOGUE.schedules[SCHEDULE];
  const entry = rescheduled({ entries: { ...entries, PH_Plague: () => 1 } });
  const trial = rescheduled({ capstone: { ...capstone, event: 'PH_Flood' } });

  expect(() => catalogued(entry)).toThrow(/^fixture: /);
  expect(() => catalogued(trial)).toThrow(/^fixture: /);
});

test('a catalogue whose schedule deals its capstone among its entries is refused', () => {
  const { entries, capstone } = CATALOGUE.schedules[SCHEDULE];
  const content = rescheduled({ entries: { ...entries, [capstone.event]: () => 1 } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose event carries a second script under no schedule’s capstone is refused', () => {
  const { PH_Raid } = CATALOGUE.events;
  const content = changed({
    events: {
      ...CATALOGUE.events,
      PH_Raid: { ...PH_Raid, continues: (_c, chronicle) => chronicle },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose schedule deals or spans less than one is refused', () => {
  const { capstone } = CATALOGUE.schedules[SCHEDULE];

  expect(() => catalogued(rescheduled({ deal: 0 }))).toThrow(/^fixture: /);
  expect(() => catalogued(rescheduled({ capstone: { ...capstone, span: 0 } }))).toThrow(
    /^fixture: /,
  );
});

test('a catalogue whose schedule rolls a span from below one, or to less than its least, is refused', () => {
  const { capstone } = CATALOGUE.schedules[SCHEDULE];

  expect(() => catalogued(rescheduled({ spacing: [0, 7] }))).toThrow(/^fixture: /);
  expect(() => catalogued(rescheduled({ capstone: { ...capstone, window: [33, 27] } }))).toThrow(
    /^fixture: /,
  );
});

test('a timeline of a schedule the catalogue does not hold is refused', () => {
  expect(() => timelineOf(CATALOGUE, 'seasons', seedRng(1))).toThrow(/^fixture: /);
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

  expect(() => beginChronicle(CATALOGUE, 1, DECK, { tiles: holed, rivers: [] }, NO_DEALS)).toThrow(
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
  const founded = launched(other, REGION, SCHEDULE, 1234, DECK);

  expect(() => apply(CATALOGUE, founded, { type: 'end-turn' })).toThrow(/^fixture: /);
  expect(apply(other, founded, { type: 'end-turn' }).length).toBeGreaterThan(0);
});

test('a unit entering as a kind the catalogue does not hold is refused', () => {
  const city = cityOf(['urban']);

  expect(() =>
    entered(CATALOGUE, city, { type: 'PH_Scout', tile: { q: 0, r: 0 }, faction: 'player' }),
  ).toThrow(/^fixture: /);
});
