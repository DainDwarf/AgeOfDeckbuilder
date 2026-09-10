import { expect, test } from 'vitest';
import { apply, beginChronicle, type Command, outcome } from './chronicle';
import {
  buildingAt,
  cityOf,
  DECK,
  everyCard,
  field,
  fullDraw,
  NO_GROWTH,
  stagedBy,
  standing,
  worker,
} from './fixtures';
import { MOVE_POINT } from './map';
import { RESOURCES } from './resources';
import { seedRng } from './rng';
import type { Chronicle } from './state';

test('the same seed founds the same chronicle', () => {
  expect(beginChronicle(1234, DECK)).toEqual(beginChronicle(1234, DECK));
  expect(beginChronicle(1235, DECK)).not.toEqual(beginChronicle(1234, DECK));
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('a chronicle opens on turn one, with empty stores and more inhabitants than tiles', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(chronicle.turn).toBe(1);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.population).toBe(chronicle.held.length + 2);
});

test('ending the turn moves the chronicle on to the next one', () => {
  const city = cityOf(['urban']);
  const second = outcome(apply(city, { type: 'end-turn' }));

  expect(second.turn).toBe(2);
  expect(outcome(apply(second, { type: 'end-turn' })).turn).toBe(3);
});

test('growth is staged right after the income it comes from, and before the enemy phase', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(3),
    population: 2,
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT })],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'income',
    'grow',
    'move',
    'attack',
    'turn',
  ]);
});

test('the hand holds five cards on founding, and five again after every turn', () => {
  let chronicle = beginChronicle(4242, DECK);
  expect(chronicle.hand).toHaveLength(5);

  for (let turn = 0; turn < 6; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(chronicle.hand).toHaveLength(5);
  }
});

test('a play the rules refuse is one refused stage, on the chronicle as it stood', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const command: Command = { type: 'play', index: 0, aim: 'none' };

  expect(stagedBy(penniless, command)).toEqual(['refused']);
  expect(outcome(apply(penniless, command))).toBe(penniless);
  expect(stagedBy(penniless, { type: 'play', index: 3, aim: 'none' })).toEqual(['refused']);
});

test('a card that lands whole is played in the one stage, the effect already in it', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const stages = apply(city, { type: 'play', index: 0, aim: 'none' });

  expect(stages.map((stage) => stage.name)).toEqual(['played']);
  expect(stages[0].chronicle.resources).toEqual({ ...city.resources, food: 3, science: 0 });
  expect(stages[0].chronicle.discardPile).toEqual(['PH_Harvest']);
});

test('ending the turn discards what is left of the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Worker', 'PH_Warrior', 'PH_Warrior', 'PH_Harvest'],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

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

  const after = outcome(apply(spent, { type: 'end-turn' }));

  expect(after.hand).toHaveLength(5);
  expect(after.drawPile).toHaveLength(2);
  expect(after.discardPile).toEqual([]);
  expect(everyCard(after)).toEqual(everyCard(spent));
  expect(outcome(apply(spent, { type: 'end-turn' })).hand).toEqual(after.hand);
  expect(outcome(apply({ ...spent, rng: seedRng(99) }, { type: 'end-turn' })).hand).not.toEqual(
    after.hand,
  );
});

test('a draw with nothing left anywhere draws what there is', () => {
  const city = cityOf(['urban'], { drawPile: ['PH_March', 'PH_Harvest'] });

  expect(outcome(apply(city, { type: 'end-turn' })).hand).toEqual(['PH_March', 'PH_Harvest']);
});

test('the end of turn resolves in order, and its last stage is where the turn ends', () => {
  const city = cityOf(['urban', 'plain', 'forest'], {
    tiles: field(2),
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Warrior', 'PH_Harvest'],
    discardPile: ['PH_Harvest', 'PH_Worker'],
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  const stages = apply(city, { type: 'end-turn' });
  const ended = stages[stages.length - 1].chronicle;

  expect(stages.map((stage) => stage.name)).toEqual([
    'discard',
    'income',
    'move',
    'attack',
    'turn',
    'draw',
    'shuffle',
    'draw',
  ]);
  expect(ended).toEqual(outcome(stages));
  expect(ended.turn).toBe(city.turn + 1);
  expect(ended.hand).toHaveLength(5);
});

test('a stage of the end of turn that changed nothing is left out of it', () => {
  const quiet = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    tiles: field(1),
    drawPile: fullDraw(),
    discardPile: ['PH_Harvest'],
  });

  expect(stagedBy(quiet, { type: 'end-turn' })).toEqual(['income', 'turn', 'draw']);
});

test('every card of the deck is in exactly one pile through a full cycle', () => {
  let chronicle = beginChronicle(2026, DECK);
  const deck = everyCard(chronicle);
  expect(deck).toHaveLength(DECK.length);

  for (let turn = 0; turn < 8; turn++) {
    chronicle = outcome(apply(chronicle, { type: 'play', index: 0, aim: 'none' }));
    chronicle = outcome(apply(chronicle, { type: 'end-turn' }));
    expect(everyCard(chronicle)).toEqual(deck);
  }
});

test('the same command on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban', 'plain', 'forest', 'hills', 'coast']);
  const untouched = structuredClone(city);

  expect(outcome(apply(city, { type: 'end-turn' }))).toEqual(
    outcome(apply(city, { type: 'end-turn' })),
  );
  expect(city).toEqual(untouched);
});

test('a city with no population left falls, whatever the command was', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0 });

  expect(outcome(apply(empty, { type: 'play', index: 0, aim: 'none' })).defeat).toEqual({
    cause: 'population',
    turn: empty.turn,
  });
  // The fall rides the last stage the command resolved as, refused though that play was.
  expect(stagedBy(empty, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);

  const ended = outcome(apply(empty, { type: 'end-turn' }));

  expect(ended.population).toBe(0);
  expect(ended.defeat).toEqual({ cause: 'population', turn: ended.turn });
});

test('the founding fills the city tile’s slot with the city', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(buildingAt(chronicle, chronicle.city)).toBe('PH_City');
});

test('a chronicle that has ended takes no command at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const fallen: Chronicle = { ...city, defeat: { cause: 'capture', turn: city.turn } };

  expect(
    outcome(apply(city, { type: 'play', index: 0, aim: 'none' })).resources.food,
  ).toBeGreaterThan(0);
  expect(outcome(apply(fallen, { type: 'end-turn' }))).toBe(fallen);
  expect(outcome(apply(fallen, { type: 'play', index: 0, aim: 'none' }))).toBe(fallen);
  expect(stagedBy(fallen, { type: 'end-turn' })).toEqual(['refused']);
  expect(stagedBy(fallen, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
});
