import { expect, test } from 'vitest';
import { apply, type Command, launched, outcome } from './chronicle';
import {
  CATALOGUE,
  CITY,
  camped,
  cityOf,
  DECK,
  endedTurn,
  everyCard,
  field,
  fullDraw,
  heldBy,
  NO_GROWTH,
  namesOf,
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
import { type Change, type Stage, walked } from './stages';
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

test('a chronicle opens on the settle phase with empty stores, the city standing nowhere, the settle cards in hand and the centre part alone in sight', () => {
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

test('growth is staged on the food stock the turn ends with, before the income and before the enemy phase', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(3),
    population: 2,
    resources: { food: 6, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    units: [worker({ q: 1, r: 1 }), standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT })],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'stock',
    'population',
    'income',
    'stock',
    'stock',
    'enemy-phase',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'turn',
    'turn',
    'refreshed',
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

test('a card that lands whole is played as one played group, closing on the chronicle its effect left', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const stages = apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' });

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'stock', 'stock']);
  expect(stages[0].chronicle.resources).toEqual({ ...city.resources, food: 3, science: 0 });
  expect(stages[0].chronicle.discardPile).toEqual(['PH_Harvest']);
});

/** What the one `played` group a play resolves as holds. A play resolving as anything else throws. */
function playedOver(chronicle: Chronicle, command: Command): readonly Stage[] {
  const stages = apply(CATALOGUE, chronicle, command);
  const [played] = stages;
  if (stages.length !== 1 || played.kind !== 'group' || played.name !== 'played') {
    throw new Error('the play resolves as no one played group');
  }
  expect(played.chronicle).toBe(played.stages[played.stages.length - 1].chronicle);
  return played.stages;
}

const PLAYED: Command = { type: 'play', index: 0, aim: 'none' };

test('a card played goes to the discard pile, then pays its cost as one stock, then lands its effect', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_March'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const [discarded, paid, gained, ...rest] = playedOver(city, PLAYED);

  expect([discarded, paid, gained].map(({ name }) => name)).toEqual([
    'discarded',
    'stock',
    'stock',
  ]);
  expect(rest).toEqual([]);
  expect(discarded.chronicle.hand).toEqual(['PH_March']);
  expect(discarded.chronicle.discardPile).toEqual(['PH_Harvest']);
  expect(discarded.chronicle.resources).toEqual(city.resources);
  expect(paid.chronicle.resources).toEqual({ ...city.resources, science: 0 });
  expect(gained.chronicle.resources).toEqual({ ...city.resources, food: 3, science: 0 });
});

test('a free card played raises no stock for its cost, and a single use card leaves the chronicle instead of the discard pile', () => {
  const city = cityOf(['urban'], { hand: ['PH_Cache'] });

  const [left, gained, ...rest] = playedOver(city, PLAYED);

  expect([left, gained].map(({ name }) => name)).toEqual(['left', 'stock']);
  expect(rest).toEqual([]);
  expect(left.chronicle.hand).toEqual([]);
  expect(left.chronicle.discardPile).toEqual([]);
  expect(gained.chronicle.resources.food).toBe(city.resources.food + 5);
});

test('a card whose effect moves nothing is played over its leaving and its cost alone', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Hunger'],
    resources: { food: 0, production: 3, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(playedOver(city, PLAYED).map(({ name }) => name)).toEqual(['left', 'stock']);
});

/** The first change of that name the walk meets. A tree holding none throws. */
function changeNamed(stages: readonly Stage[], name: Change['name']): Change {
  for (const stage of walked(stages)) {
    if (stage.kind === 'change' && stage.name === name) return stage;
  }
  throw new Error(`no ${name} change is staged`);
}

test('a pile change carries the places in the pile its cards came out of, and a reward, out of no pile, carries none', () => {
  const copies = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const second = apply(CATALOGUE, copies, { type: 'play', index: 1, aim: 'none' });

  expect(changeNamed(second, 'discarded')).toMatchObject({ places: [1] });
  expect(outcome(second).hand).toEqual(['PH_Harvest']);

  const held = cityOf(['urban'], { hand: ['PH_Harvest', 'PH_March', 'PH_Harvest'] });

  expect(changeNamed(apply(CATALOGUE, held, { type: 'end-turn' }), 'discarded')).toMatchObject({
    places: [0, 1, 2],
  });

  const settling = opening(plainDisc(), {
    deck: { cards: DECK.cards, settle: ['PH_Settle', 'PH_Settle', 'PH_Settle'] },
  });

  expect(
    changeNamed(apply(CATALOGUE, settledOn(settling, CITY), { type: 'end-turn' }), 'left'),
  ).toMatchObject({ places: [0, 1] });

  const camp = { q: 4, r: 0 };
  const dealt = outcome(
    apply(
      CATALOGUE,
      cityOf(['urban'], {
        ...NO_GROWTH,
        tiles: camped(field(4), [camp]),
        drawPile: fullDraw(),
        units: [standing('player', camp)],
      }),
      { type: 'end-turn' },
    ),
  );

  expect(
    changeNamed(heldBy(apply(CATALOGUE, dealt, { type: 'take', at: 0 }), 'reward'), 'discarded'),
  ).toMatchObject({ places: [] });

  const recalling = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_Recall'],
    discardPile: ['PH_Farm', 'PH_Harvest', 'PH_Mine'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 2, culture: 0 },
  });
  const recall = apply(CATALOGUE, recalling, {
    type: 'play',
    index: 1,
    aim: 'discard-pile',
    card: 2,
  });

  expect(changeNamed(recall, 'discarded')).toMatchObject({ places: [1] });
  expect(changeNamed(recall, 'recalled')).toMatchObject({ places: [2] });
  expect(outcome(recall).hand).toEqual(['PH_Harvest', 'PH_Mine']);
});

test('a unit card is played over its cost, one population fewer, and the unit entering on the city’s tile', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Worker'],
    population: 3,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const held = playedOver(city, PLAYED);
  const [, , fewer, entering] = held;

  expect(held.map(({ name }) => name)).toEqual(['discarded', 'stock', 'population', 'enter']);
  expect(fewer.chronicle.population).toBe(2);
  expect(fewer.chronicle.units).toEqual([]);
  expect(entering).toMatchObject({ tile: CITY });
  expect(entering.chronicle.units.map(({ tile }) => tile)).toEqual([CITY]);
});

test('a second settle raises no change for a row it leaves where it stood: the population already at what the settle gives', () => {
  const opened = opening(plainDisc(), {
    deck: { cards: DECK.cards, settle: ['PH_Settle', 'PH_Settle'] },
  });
  const first = settledOn(opened, CITY);
  const moved = { q: 1, r: 0 };

  const held = playedOver(first, { type: 'play', index: 0, aim: 'tile', tile: moved });

  expect(first.population).toBe(1 + CATALOGUE.city.idle);
  expect(held.map(({ name }) => name)).toEqual([
    'left',
    'retiled',
    'retiled',
    'held',
    'assigned',
    'settled',
  ]);
  expect(
    outcome(apply(CATALOGUE, first, { type: 'play', index: 0, aim: 'tile', tile: moved })).city,
  ).toEqual(moved);
});

test('the settle is played over the card leaving and the settle’s own changes, all on the city’s tile', () => {
  const opened = opening(plainDisc(), { deck: { cards: DECK.cards, settle: ['PH_Settle'] } });

  const held = playedOver(opened, { type: 'play', index: 0, aim: 'tile', tile: CITY });
  const [left, ...changes] = held;
  const [, built, holding, population, assigned, stood] = changes;

  expect(held.map(({ name }) => name)).toEqual([
    'left',
    'retiled',
    'retiled',
    'held',
    'population',
    'assigned',
    'settled',
  ]);
  expect(left.chronicle.hand).toEqual([]);
  for (const change of [...changes.slice(0, 3), assigned, stood]) {
    expect(change).toMatchObject({ tile: CITY });
  }
  expect(tileAt(built.chronicle.tiles, CITY)?.building).toBe(CATALOGUE.city.building);
  expect(holding.chronicle.held).toEqual([CITY]);
  expect(population.chronicle.population).toBe(1 + CATALOGUE.city.idle);
  expect(assigned.chronicle.assigned).toEqual([CITY]);
  for (const change of changes.slice(0, 4)) expect(change.chronicle.city).toBeUndefined();
  expect(stood.chronicle.city).toEqual(CITY);
  expect(
    outcome(apply(CATALOGUE, opened, { type: 'play', index: 0, aim: 'tile', tile: CITY })).ending,
  ).toBeUndefined();
});

test('the settle raises no ending: the city stands only once everything it runs on is in place', () => {
  const opened = opening(plainDisc(), { deck: { cards: DECK.cards, settle: ['PH_Settle'] } });

  const names = stagedBy(opened, { type: 'play', index: 0, aim: 'tile', tile: CITY });

  expect(names).not.toContain('ended');
  expect(names[names.length - 1]).toBe('settled');
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

  expect(namesOf(stages)).toEqual([
    'discarded',
    'grow',
    'income',
    'stock',
    'stock',
    'enemy-phase',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'turn',
    'turn',
    'refreshed',
    'drawn',
    'shuffled',
    'drawn',
  ]);
  expect(ended).toEqual(outcome(stages));
  expect(ended.turn).toBe(city.turn + 1);
  expect(ended.hand).toHaveLength(5);
});

test('a phase the turn always has is staged every turn, empty or not, and an empty hand discards nothing', () => {
  const quiet = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    tiles: field(1),
    drawPile: fullDraw(),
    discardPile: ['PH_Harvest'],
  });
  const stages = apply(CATALOGUE, quiet, { type: 'end-turn' });

  expect(namesOf(stages)).toEqual([
    'grow',
    'income',
    'stock',
    'stock',
    'enemy-phase',
    'turn',
    'turn',
    'drawn',
  ]);
  expect(heldBy(stages, 'grow')).toEqual([]);
  expect(heldBy(stages, 'enemy-phase')).toEqual([]);
});

test('the turn ticks first, then refreshes every unit short of full move points or action, in unit order, each on its tile', () => {
  const spent = { q: 2, r: 0 };
  const idleOne = { q: 0, r: 2 };
  const tired = { q: -2, r: 0 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: field(3),
    units: [
      standing('player', spent, {}, 0),
      standing('player', idleOne),
      standing('player', tired, {}, undefined, 0),
    ],
  });

  const [tick, ...refreshes] = heldBy(apply(CATALOGUE, city, { type: 'end-turn' }), 'turn');

  expect(tick.name).toBe('turn');
  expect(tick.chronicle.turn).toBe(city.turn + 1);
  expect(tick.chronicle.units).toEqual(city.units);
  expect(refreshes.map(({ name }) => name)).toEqual(['refreshed', 'refreshed']);
  expect(refreshes).toMatchObject([{ tile: spent }, { tile: tired }]);
  const after = refreshes[1].chronicle;
  for (const unit of after.units) {
    expect(unit.movePoints).toBe(unit.stats.move);
    expect(unit.action).toBe(unit.stats.action);
  }
});

test('a city whose food stock of nought would grow at no population falls on the food spent, and grows nobody', () => {
  const empty = cityOf(['urban'], { tiles: field(2), population: 0, assigned: [] });

  const stages = apply(CATALOGUE, empty, { type: 'end-turn' });
  const ended = outcome(stages);

  expect(namesOf(stages)).toEqual(['grow', 'stock', 'ended']);
  expect(ended.population).toBe(0);
  expect(ended.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: empty.turn });
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

test('a city with no population left falls on the first change a command makes, whatever the command was, and nothing after it resolves', () => {
  const empty = cityOf(['urban'], {
    tiles: field(2),
    population: 0,
    hand: ['PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const played = apply(CATALOGUE, empty, { type: 'play', index: 0, aim: 'none' });

  expect(namesOf(played)).toEqual(['played', 'discarded', 'ended']);
  expect(outcome(played).ending).toEqual({
    outcome: 'defeat',
    cause: 'population',
    turn: empty.turn,
  });
  expect(outcome(played).resources).toEqual(empty.resources);

  const stages = apply(CATALOGUE, empty, { type: 'end-turn' });
  const ended = outcome(stages);

  expect(namesOf(stages)).toEqual(['discarded', 'ended']);
  expect(ended.population).toBe(0);
  expect(ended.turn).toBe(empty.turn);
  expect(ended.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: ended.turn });
});

test('the settle puts the city on its tile: its terrain and building, no feature, that tile alone held and staffed, and the card in no pile', () => {
  const opened = opening(plainDisc(), { deck: { cards: DECK.cards, settle: ['PH_Settle'] } });
  const settled = settledOn(opened, CITY);
  const centre = tileAt(settled.tiles, CITY);

  expect(settled.city).toEqual(CITY);
  expect(centre?.terrain).toBe('urban');
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

test('ending the settle phase is refused while the city stands nowhere, and a chronicle standing nowhere never falls for its population', () => {
  const opened = opening(plains(3));

  expect(opened.population).toBe(0);
  expect(stagedBy(opened, { type: 'end-turn' })).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, opened, { type: 'end-turn' }))).toBe(opened);
  expect(outcome(apply(CATALOGUE, opened, { type: 'play', index: 0, aim: 'none' })).ending).toBe(
    undefined,
  );
});

test('the end of the settle phase runs none of the cycle: turn 1 and its hand drawn, no income, no growth, and the settle cards left in hand gone', () => {
  const opened = opening(plains(3), {
    deck: { cards: DECK.cards, settle: ['PH_Settle', 'PH_Settle'] },
  });
  const settled = settledOn(opened, CITY);
  const stocked: Chronicle = { ...settled, resources: { ...settled.resources, food: 99 } };

  const stages = apply(CATALOGUE, stocked, { type: 'end-turn' });
  const after = outcome(stages);

  expect(stocked.hand).toEqual(['PH_Settle']);
  expect(namesOf(stages)).toEqual(['turn', 'turn', 'left', 'drawn']);
  const [, tick, left] = [...walked(stages)];
  expect(tick.chronicle.turn).toBe(1);
  expect(tick.chronicle.hand).toEqual(stocked.hand);
  expect(left.chronicle.hand).toEqual([]);
  expect(after.turn).toBe(1);
  expect(after.hand).toHaveLength(5);
  expect(after.resources).toEqual(stocked.resources);
  expect(after.population).toBe(stocked.population);
  expect(everyCard(after)).toEqual([...DECK.cards].sort());
});

test('a settle card played leaves the chronicle, and the hand holds the settle section in the deck’s order', () => {
  const opened = opening(plains(3), { deck: { cards: [], settle: ['PH_Stores', 'PH_Settle'] } });

  const stocked = outcome(apply(CATALOGUE, opened, { type: 'play', index: 0, aim: 'none' }));

  expect(opened.hand).toEqual(['PH_Stores', 'PH_Settle']);
  expect(stocked.resources.food).toBe(2);
  expect(stocked.hand).toEqual(['PH_Settle']);
  expect(stocked.discardPile).toEqual([]);
  expect(everyCard(stocked)).toEqual(['PH_Settle']);
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
