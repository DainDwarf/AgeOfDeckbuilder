import { expect, test } from 'vitest';
import { type Catalogue, catalogued, entered, type Schedule } from './catalogue';
import { apply, beginChronicle, launched } from './chronicle';
import { CATALOGUE, CITY, cityOf, DECK, field, NO_DEALS, REGION, SCHEDULE } from './fixtures';
import { generateMap, tileKey } from './map';
import type { Resources } from './resources';
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

test('a catalogue whose camp rolls at odds below nought or above one is refused', () => {
  const below = changed({ camp: { ...CATALOGUE.camp, odds: -0.1 } });
  const above = changed({ camp: { ...CATALOGUE.camp, odds: 1.1 } });

  expect(() => catalogued(below)).toThrow(/^fixture: /);
  expect(() => catalogued(above)).toThrow(/^fixture: /);
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

test('a catalogue whose layer names a movement cost of zero is refused', () => {
  const content = changed({
    improvements: {
      ...CATALOGUE.improvements,
      PH_Road: { ...CATALOGUE.improvements.PH_Road, movementCost: 0 },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose camp is a building it does not hold is refused', () => {
  const content = changed({ camp: { ...CATALOGUE.camp, building: 'PH_Fort' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose city sees or opens with idle inhabitants below nought is refused', () => {
  for (const below of [{ sight: -1 }, { idle: -1 }]) {
    const content = changed({ city: { ...CATALOGUE.city, ...below } });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose deck names a card it does not hold is refused', () => {
  const content = changed({ decks: { deck: { ...DECK, cards: [...DECK.cards, 'PH_Scout'] } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds a hazard in either section is refused', () => {
  const cards = changed({ decks: { deck: { ...DECK, cards: [...DECK.cards, 'PH_Hunger'] } } });
  const settle = changed({ decks: { deck: { ...DECK, settle: [...DECK.settle, 'PH_Hunger'] } } });

  expect(() => catalogued(cards)).toThrow(/^fixture: /);
  expect(() => catalogued(settle)).toThrow(/^fixture: /);
});

test('a catalogue whose deck holds any of the camp’s rewards in either section is refused', () => {
  for (const reward of CATALOGUE.camp.rewards) {
    const cards = changed({ decks: { deck: { ...DECK, cards: [...DECK.cards, reward] } } });
    const settle = changed({ decks: { deck: { ...DECK, settle: [...DECK.settle, reward] } } });

    expect(() => catalogued(cards)).toThrow(/^fixture: /);
    expect(() => catalogued(settle)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose deck’s settle section is empty or holds a card of another kind is refused', () => {
  for (const settle of [
    [],
    ['PH_Harvest'],
    ['PH_Settle', 'PH_Harvest'],
    ['PH_Settle', 'PH_Worker'],
  ]) {
    const content = changed({ decks: { deck: { ...DECK, settle } } });

    expect(() => catalogued(content)).toThrow(/^fixture: /);
  }
});

test('a catalogue whose deck holds a settle card among its cards is refused', () => {
  const content = changed({ decks: { deck: { ...DECK, cards: [...DECK.cards, 'PH_Settle'] } } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose region’s camps may come within sight of the settle wherever it lands is refused', () => {
  const disc = CATALOGUE.regions[REGION];
  const reach = disc.centre + CATALOGUE.city.sight;
  const near = changed({ regions: { [REGION]: { ...disc, campFromCentre: reach } } });
  const far = changed({
    version: 'far',
    regions: { [REGION]: { ...disc, campFromCentre: reach + 1 } },
  });
  const seeing = changed({ city: { ...CATALOGUE.city, sight: disc.campFromCentre - disc.centre } });

  expect(() => catalogued(near)).toThrow(/^fixture: /);
  expect(catalogued(far)).toBe(far);
  expect(() => catalogued(seeing)).toThrow(/^fixture: /);
});

test('a catalogue whose camp deals a reward it does not hold, or no reward at all, is refused', () => {
  const loot = changed({
    camp: { ...CATALOGUE.camp, rewards: [...CATALOGUE.camp.rewards, 'PH_Loot'] },
  });
  const none = changed({ camp: { ...CATALOGUE.camp, rewards: [] } });

  expect(() => catalogued(loot)).toThrow(/^fixture: /);
  expect(() => catalogued(none)).toThrow(/^fixture: /);
});

test('a catalogue whose schedule deals an event of fewer than two answers is refused', () => {
  const { PH_Hardship } = CATALOGUE.events;
  const { PH_Raid } = PH_Hardship.answers;
  const content = changed({
    events: { ...CATALOGUE.events, PH_Hardship: { ...PH_Hardship, answers: { PH_Raid } } },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose two events deal the same answer is refused', () => {
  const { PH_Blight, PH_Hardship } = CATALOGUE.events;
  const content = changed({
    events: {
      ...CATALOGUE.events,
      PH_Blight: {
        ...PH_Blight,
        answers: { ...PH_Blight.answers, PH_Raid: PH_Hardship.answers.PH_Raid },
      },
    },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose event deals no answer costing no stock is refused, an answer costing nought of a stock costing none', () => {
  const { PH_Blight } = CATALOGUE.events;
  const { PH_Endure, PH_Explosion } = PH_Blight.answers;
  const blighted = (endure: Partial<Resources>): Catalogue =>
    changed({
      version: 'blighted',
      events: {
        ...CATALOGUE.events,
        PH_Blight: {
          ...PH_Blight,
          answers: { PH_Endure: { ...PH_Endure, cost: endure }, PH_Explosion },
        },
      },
    });

  expect(() => catalogued(blighted({ food: 1 }))).toThrow(/^blighted: /);
  expect(() => catalogued(blighted({ food: 0, money: 2 }))).toThrow(/^blighted: /);
  expect(catalogued(blighted({ food: 0, money: 0 })).version).toBe('blighted');
  expect(catalogued(blighted({})).version).toBe('blighted');
});

test('a catalogue whose schedule deals an event it does not hold is refused', () => {
  const { entries } = CATALOGUE.schedules[SCHEDULE];

  expect(() => catalogued(rescheduled({ entries: { ...entries, PH_Plague: () => 1 } }))).toThrow(
    /^fixture: /,
  );
});

test('a catalogue whose schedule deals no event is refused', () => {
  expect(() => catalogued(rescheduled({ entries: {} }))).toThrow(/^fixture: /);
});

test('a catalogue whose schedule names a capstone it does not hold is refused', () => {
  const { capstone } = CATALOGUE.schedules[SCHEDULE];
  const flood = rescheduled({ capstone: { ...capstone, id: 'PH_Flood' } });
  const event = rescheduled({ capstone: { ...capstone, id: 'PH_Hardship' } });

  expect(() => catalogued(flood)).toThrow(/^fixture: /);
  expect(() => catalogued(event)).toThrow(/^fixture: /);
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

test('the opening on a map whose centre part names a tile the map does not hold is refused', () => {
  const holed = field(2).filter((tile) => tileKey(tile) !== tileKey(CITY));
  const map = { tiles: holed, rivers: [], centre: [CITY] };

  expect(() => beginChronicle(CATALOGUE, 1, DECK, map, NO_DEALS)).toThrow(/^fixture: /);
});

test('a catalogue whose region’s rivers rise in a biome it does not hold is refused', () => {
  const disc = CATALOGUE.regions[REGION];
  const content = changed({
    regions: { [REGION]: { ...disc, rivers: { ...disc.rivers, source: 'glacier' } } },
  });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a chronicle begun on another version of the content is refused by apply', () => {
  const other = catalogued(changed({ version: 'other' }));
  const begun = launched(other, REGION, SCHEDULE, 1234, DECK);

  expect(() => apply(CATALOGUE, begun, { type: 'end-turn' })).toThrow(/^fixture: /);
  expect(apply(other, begun, { type: 'end-turn' }).length).toBeGreaterThan(0);
});

test('a unit entering as a kind the catalogue does not hold is refused', () => {
  const city = cityOf(['urban']);

  expect(() =>
    entered(CATALOGUE, city, { type: 'PH_Scout', tile: { q: 0, r: 0 }, faction: 'player' }),
  ).toThrow(/^fixture: /);
});
