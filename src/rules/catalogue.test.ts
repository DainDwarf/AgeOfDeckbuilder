import { expect, test } from 'vitest';
import { type Catalogue, catalogued, entered } from './catalogue';
import { apply, beginChronicle } from './chronicle';
import { CATALOGUE, cityOf, DECK } from './fixtures';

/** The fixture's content with what the test changes laid over it. */
function changed(content: Partial<Catalogue>): Catalogue {
  return { ...CATALOGUE, ...content };
}

test('a catalogue whose camp enters a unit kind it does not hold is refused', () => {
  const content = changed({ camp: { unit: 'PH_Scout', script: 'advance' } });

  expect(() => catalogued(content)).toThrow(/^fixture: /);
});

test('a catalogue whose camp carries a script it does not hold is refused', () => {
  const content = changed({ camp: { unit: 'PH_Warrior', script: 'retreat' } });

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

test('a catalogue that holds together builds', () => {
  const content = changed({ version: 'coherent' });

  expect(catalogued(content)).toBe(content);
});

test('a chronicle founded on another version of the content is refused by apply', () => {
  const other = catalogued(changed({ version: 'other' }));
  const founded = beginChronicle(other, 1234, DECK);

  expect(() => apply(CATALOGUE, founded, { type: 'end-turn' })).toThrow(/^fixture: /);
  expect(apply(other, founded, { type: 'end-turn' }).length).toBeGreaterThan(0);
});

test('a unit entering as a kind the catalogue does not hold is refused', () => {
  const city = cityOf(['urban']);

  expect(() =>
    entered(CATALOGUE, city, { type: 'PH_Scout', tile: { q: 0, r: 0 }, faction: 'player' }),
  ).toThrow(/^fixture: /);
});
