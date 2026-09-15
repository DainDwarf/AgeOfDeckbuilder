import { expect, test } from 'vitest';
import { apply, type Command, launched, outcome } from './chronicle';
import {
  CATALOGUE,
  CITY,
  cityOf,
  DECK,
  endedTurn,
  everyCard,
  field,
  fullDraw,
  NO_GROWTH,
  opening,
  plains,
  REGION,
  SCHEDULE,
  settledLaunch,
  settledOn,
  stagedBy,
  standing,
  worker,
} from './fixtures';
import { MOVE_POINT, type Tile, tileAt, tileKey } from './map';
import { RESOURCES } from './resources';
import { seedRng } from './rng';
import { inSight } from './sight';
import { type Chronicle, idle } from './state';

/** A disc of plain out to eight, with nothing on it but a fertile plain on its centre tile. */
function plainDisc(): Tile[] {
  return field(8).map(
    ({ q, r }): Tile =>
      tileKey({ q, r }) === tileKey(CITY)
        ? { q, r, terrain: 'plain', feature: 'PH_Fertile', improvements: [] }
        : { q, r, terrain: 'plain', improvements: [] },
  );
}

test('the same seed begins the same chronicle', () => {
  expect(launched(CATALOGUE, REGION, SCHEDULE, 1234, DECK)).toEqual(
    launched(CATALOGUE, REGION, SCHEDULE, 1234, DECK),
  );
  expect(launched(CATALOGUE, REGION, SCHEDULE, 1235, DECK)).not.toEqual(
    launched(CATALOGUE, REGION, SCHEDULE, 1234, DECK),
  );
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = launched(CATALOGUE, REGION, SCHEDULE, 1234, DECK);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('a chronicle opens on turn 0 with empty stores, the city standing nowhere, the settle cards in hand and the centre part alone in sight', () => {
  const chronicle = launched(CATALOGUE, REGION, SCHEDULE, 1234, DECK);
  const centre = chronicle.centre.map(tileKey).sort();

  expect(chronicle.turn).toBe(0);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.city).toBeUndefined();
  expect(chronicle.population).toBe(0);
  expect(chronicle.held).toEqual([]);
  expect(chronicle.hand).toEqual(DECK.settle);
  expect([...chronicle.drawPile].sort()).toEqual([...DECK.cards].sort());
  expect(centre.length).toBeGreaterThan(1);
  expect([...inSight(CATALOGUE, chronicle)].sort()).toEqual(centre);
  expect(chronicle.snapshots.map(tileKey).sort()).toEqual(centre);
});

test('ending the turn moves the chronicle on to the next one', () => {
  const city = cityOf(['urban']);
  const second = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(second.turn).toBe(2);
  expect(outcome(apply(CATALOGUE, second, { type: 'end-turn' })).turn).toBe(3);
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

test('the hand holds five cards on turn 1, and five again after every turn', () => {
  let chronicle = settledLaunch(CATALOGUE, REGION, SCHEDULE, 4242, DECK);
  expect(chronicle.hand).toHaveLength(5);

  for (let turn = 0; turn < 6; turn++) {
    chronicle = endedTurn(chronicle);
    expect(chronicle.hand).toHaveLength(5);
  }
});

test('a play the rules refuse is one refused stage, on the chronicle as it stood', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const command: Command = { type: 'play', index: 0, aim: 'none' };

  expect(stagedBy(penniless, command)).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, penniless, command))).toBe(penniless);
  expect(stagedBy(penniless, { type: 'play', index: 3, aim: 'none' })).toEqual(['refused']);
});

test('a card that lands whole is played in the one stage, the effect already in it', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const stages = apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' });

  expect(stages.map((stage) => stage.name)).toEqual(['played']);
  expect(stages[0].chronicle.resources).toEqual({ ...city.resources, food: 3, science: 0 });
  expect(stages[0].chronicle.discardPile).toEqual(['PH_Harvest']);
});

test('ending the turn discards what is left of the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Worker', 'PH_Warrior', 'PH_Warrior', 'PH_Harvest'],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

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

  const after = outcome(apply(CATALOGUE, spent, { type: 'end-turn' }));

  expect(after.hand).toHaveLength(5);
  expect(after.drawPile).toHaveLength(2);
  expect(after.discardPile).toEqual([]);
  expect(everyCard(after)).toEqual(everyCard(spent));
  expect(outcome(apply(CATALOGUE, spent, { type: 'end-turn' })).hand).toEqual(after.hand);
  expect(
    outcome(apply(CATALOGUE, { ...spent, rng: seedRng(99) }, { type: 'end-turn' })).hand,
  ).not.toEqual(after.hand);
});

test('a draw with nothing left anywhere draws what there is', () => {
  const city = cityOf(['urban'], { drawPile: ['PH_March', 'PH_Harvest'] });

  expect(outcome(apply(CATALOGUE, city, { type: 'end-turn' })).hand).toEqual([
    'PH_March',
    'PH_Harvest',
  ]);
});

test('the end of turn resolves in order, and its last stage is where the turn ends', () => {
  const city = cityOf(['urban', 'plain', 'forest'], {
    tiles: field(2),
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Warrior', 'PH_Harvest'],
    discardPile: ['PH_Harvest', 'PH_Worker'],
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 })],
  });

  const stages = apply(CATALOGUE, city, { type: 'end-turn' });
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
  let chronicle = settledLaunch(CATALOGUE, REGION, SCHEDULE, 2026, DECK);
  const deck = everyCard(chronicle);
  expect(deck).toHaveLength(DECK.cards.length);

  for (let turn = 0; turn < 8; turn++) {
    chronicle = outcome(apply(CATALOGUE, chronicle, { type: 'play', index: 0, aim: 'none' }));
    chronicle = endedTurn(chronicle, 'PH_Raid');
    expect(everyCard(chronicle)).toEqual(deck);
  }
});

test('the same command on the same chronicle gives the same chronicle back', () => {
  const city = cityOf(['urban', 'plain', 'forest', 'hills', 'coast']);
  const untouched = structuredClone(city);

  expect(outcome(apply(CATALOGUE, city, { type: 'end-turn' }))).toEqual(
    outcome(apply(CATALOGUE, city, { type: 'end-turn' })),
  );
  expect(city).toEqual(untouched);
});

test('a city with no population left falls, whatever the command was', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0 });

  expect(outcome(apply(CATALOGUE, empty, { type: 'play', index: 0, aim: 'none' })).ending).toEqual({
    outcome: 'defeat',
    cause: 'population',
    turn: empty.turn,
  });
  // The fall rides the last stage the command resolved as, refused though that play was.
  expect(stagedBy(empty, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);

  const ended = outcome(apply(CATALOGUE, empty, { type: 'end-turn' }));

  expect(ended.population).toBe(0);
  expect(ended.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: ended.turn });
});

test('the settle puts the city on its tile: its terrain and building, no feature, that tile alone held and staffed, and the card in no pile', () => {
  const opened = opening(plainDisc(), { deck: { cards: DECK.cards, settle: ['PH_Settle'] } });
  const settled = settledOn(opened, CITY);
  const centre = tileAt(settled.tiles, CITY);

  expect(settled.city).toEqual(CITY);
  expect(centre?.terrain).toBe(CATALOGUE.city.terrain);
  expect(centre?.building).toBe(CATALOGUE.city.building);
  expect(centre?.feature).toBeUndefined();
  for (const tile of settled.tiles) {
    if (tileKey(tile) === tileKey(CITY)) continue;
    expect(tile.terrain).toBe('plain');
    expect(tile.building).toBeUndefined();
  }
  expect(settled.held).toEqual([CITY]);
  expect(settled.assigned).toEqual([CITY]);
  expect(idle(settled)).toBe(CATALOGUE.city.idle);
  expect(settled.hand).toEqual([]);
  expect(settled.discardPile).toEqual([]);
  expect(everyCard(settled)).toEqual([...DECK.cards].sort());
});

test('ending turn 0 is refused while the city stands nowhere, and a chronicle standing nowhere never falls for its population', () => {
  const opened = opening(plains(3));

  expect(opened.population).toBe(0);
  expect(stagedBy(opened, { type: 'end-turn' })).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, opened, { type: 'end-turn' }))).toBe(opened);
  expect(outcome(apply(CATALOGUE, opened, { type: 'play', index: 0, aim: 'none' })).ending).toBe(
    undefined,
  );
});

test('the end of turn 0 runs none of the cycle: turn 1 and its hand drawn, no income, no growth, and the settle cards left in hand gone', () => {
  const opened = opening(plains(3), {
    deck: { cards: DECK.cards, settle: ['PH_Settle', 'PH_Settle'] },
  });
  const settled = settledOn(opened, CITY);
  const stocked: Chronicle = { ...settled, resources: { ...settled.resources, food: 99 } };

  const stages = apply(CATALOGUE, stocked, { type: 'end-turn' });
  const after = outcome(stages);

  expect(stocked.hand).toEqual(['PH_Settle']);
  expect(stages.map((stage) => stage.name)).toEqual(['turn', 'draw']);
  expect(after.turn).toBe(1);
  expect(after.hand).toHaveLength(5);
  expect(after.resources).toEqual(stocked.resources);
  expect(after.population).toBe(stocked.population);
  expect(everyCard(after)).toEqual([...DECK.cards].sort());
});

test('any card played on turn 0 leaves the chronicle, and the hand holds the settle section in the deck’s order', () => {
  const opened = opening(plains(3), { deck: { cards: [], settle: ['PH_Harvest', 'PH_Settle'] } });
  const paying: Chronicle = { ...opened, resources: { ...opened.resources, science: 1 } };

  const harvested = outcome(apply(CATALOGUE, paying, { type: 'play', index: 0, aim: 'none' }));

  expect(opened.hand).toEqual(['PH_Harvest', 'PH_Settle']);
  expect(harvested.resources.food).toBe(2);
  expect(harvested.hand).toEqual(['PH_Settle']);
  expect(harvested.discardPile).toEqual([]);
  expect(everyCard(harvested)).toEqual(['PH_Settle']);
});

test('a chronicle that has ended takes no command at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const fallen: Chronicle = {
    ...city,
    ending: { outcome: 'defeat', cause: 'capture', turn: city.turn },
  };

  expect(
    outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' })).resources.food,
  ).toBeGreaterThan(0);
  expect(outcome(apply(CATALOGUE, fallen, { type: 'end-turn' }))).toBe(fallen);
  expect(outcome(apply(CATALOGUE, fallen, { type: 'play', index: 0, aim: 'none' }))).toBe(fallen);
  expect(stagedBy(fallen, { type: 'end-turn' })).toEqual(['refused']);
  expect(stagedBy(fallen, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
});
