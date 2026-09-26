import { expect, test } from 'vitest';
import { catalogued } from './catalogue';
import { apply, type Command, outcome } from './chronicle';
import {
  CATALOGUE,
  DECK,
  DECK_ID,
  endedTurn,
  FROST,
  REGION,
  SCHEDULE,
  settledLaunch,
} from './fixtures';
import { type ChronicleSave, readSave, writeSave } from './save';
import { laid } from './schedule';
import type { Chronicle, Counters } from './state';

/** A chronicle three turns in, saved with what it was launched on. */
function saved(): ChronicleSave {
  let chronicle = settledLaunch(CATALOGUE, REGION, SCHEDULE, 4242, DECK);
  for (let turn = 1; turn < 3; turn++) chronicle = endedTurn(chronicle);
  return { chronicle, region: REGION, deck: DECK_ID };
}

/** The save's text with the chronicle it holds changed after it was written. */
function tampered(save: ChronicleSave, change: (chronicle: Chronicle) => object): string {
  const written = JSON.parse(writeSave(CATALOGUE, save)) as ChronicleSave;
  return JSON.stringify({ ...written, chronicle: change(written.chronicle) });
}

test('a chronicle saved and read back is the chronicle, and plays the next command to the same outcome', () => {
  const save = saved();
  const read = readSave(CATALOGUE, writeSave(CATALOGUE, save));
  const command: Command = { type: 'end-turn' };

  expect(read).toEqual(save);
  const played = outcome(apply(CATALOGUE, read.chronicle, command));
  expect(played.turn).toBe(save.chronicle.turn + 1);
  expect(played).toEqual(outcome(apply(CATALOGUE, save.chronicle, command)));
});

test('a save carrying a card no catalogue holds is refused', () => {
  const text = tampered(saved(), (chronicle) => ({
    ...chronicle,
    drawPile: [{ ...chronicle.drawPile[0], id: 'PH_Unheld' }, ...chronicle.drawPile.slice(1)],
  }));

  expect(() => readSave(CATALOGUE, text)).toThrow('fixture: no card is named PH_Unheld');
});

test('a chronicle carrying a card no catalogue holds is refused its save', () => {
  const save = saved();
  const [card, ...rest] = save.chronicle.drawPile;
  const chronicle = { ...save.chronicle, drawPile: [{ ...card, id: 'PH_Unheld' }, ...rest] };

  expect(() => writeSave(CATALOGUE, { ...save, chronicle })).toThrow(
    'fixture: no card is named PH_Unheld',
  );
});

test('a card in a save carries the counters its content declares, no fewer and no more', () => {
  const save = saved();
  const chronicle = laid(CATALOGUE, save.chronicle, 'PH_Frost').chronicle;
  const [frost, ...rest] = chronicle.drawPile;
  const carrying = (counters: Counters): string =>
    tampered({ ...save, chronicle }, (written) => ({
      ...written,
      drawPile: [{ ...frost, counters }, ...rest],
    }));

  expect(readSave(CATALOGUE, carrying({ amount: FROST })).chronicle).toEqual(chronicle);
  expect(() => readSave(CATALOGUE, carrying({}))).toThrow(
    "fixture: the save's chronicle.drawPile[0].counters lacks the counter amount the card PH_Frost declares",
  );
  expect(() => readSave(CATALOGUE, carrying({ amount: FROST, thaw: 1 }))).toThrow(
    'fixture: the card PH_Frost declares no counter thaw',
  );
});

test('a save that is not a chronicle’s shape is refused', () => {
  const save = saved();
  const [unit, ...others] = save.chronicle.units;
  const refusal = (change: (chronicle: Chronicle) => object): (() => unknown) => {
    const text = tampered(save, change);
    return () => readSave(CATALOGUE, text);
  };

  expect(() => readSave(CATALOGUE, '{"chronicle":')).toThrow('fixture: the save is not JSON');
  expect(() => readSave(CATALOGUE, '[]')).toThrow('fixture: the save is not an object');
  expect(refusal((chronicle) => ({ ...chronicle, rng: undefined }))).toThrow(
    "fixture: the save's chronicle.rng is not a list",
  );
  expect(refusal((chronicle) => ({ ...chronicle, turn: String(chronicle.turn) }))).toThrow(
    "fixture: the save's chronicle.turn is not an integer",
  );
  expect(refusal((chronicle) => ({ ...chronicle, seed: chronicle.seed + 0.5 }))).toThrow(
    "fixture: the save's chronicle.seed is not an integer",
  );
  expect(
    refusal((chronicle) => ({ ...chronicle, resources: { ...chronicle.resources, wood: 1 } })),
  ).toThrow("fixture: the save's chronicle.resources names no resource wood");
  expect(
    refusal((chronicle) => ({
      ...chronicle,
      units: [{ ...unit, stats: { ...unit.stats, health: 1.5 } }, ...others],
    })),
  ).toThrow("fixture: the save's chronicle.units[0].stats.health is not an integer");
  expect(
    refusal((chronicle) => ({ ...chronicle, units: [{ ...unit, faction: 'neutral' }, ...others] })),
  ).toThrow("fixture: the save's chronicle.units[0].faction names no faction neutral");
});

test('a save written on one content version is refused by a catalogue of another', () => {
  const text = writeSave(CATALOGUE, saved());
  const next = catalogued({ ...CATALOGUE, version: 'fixture-next' });

  expect(() => readSave(next, text)).toThrow(
    'fixture-next: a chronicle begun on fixture is played on no other content',
  );
});
