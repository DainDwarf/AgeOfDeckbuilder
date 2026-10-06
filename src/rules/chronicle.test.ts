import { expect, test } from 'vitest';
import { type Achievement, achievementOf, ageOf, type Catalogue, capstoneOf } from './catalogue';
import {
  apply,
  type Command,
  drawPileEmptied,
  enemiesKilledBy,
  gainedFrom,
  launched,
  outcome,
  playsOn,
  terrainsPlayedOn,
  turnsPlaying,
} from './chronicle';
import {
  AGE,
  achieved,
  achievementIn,
  aimedAt,
  aimedAtUnit,
  attackOn,
  builtOn,
  CATALOGUE,
  type Carrying,
  CITY,
  CIVILIZATION,
  CROWD,
  CROWD_NEED,
  camped,
  cityOf,
  endedTurn,
  everyCard,
  FEAST,
  FEAST_NEED,
  field,
  fullDraw,
  GRANARY,
  HOARD,
  HOARD_NEED,
  heldBy,
  idsOf,
  madeOf,
  NO_DEALS,
  NO_GROWTH,
  namesOf,
  opening,
  plains,
  QUIET,
  REGION,
  RIVERSIDE,
  reaching,
  riverBetween,
  SURVEY,
  SURVEYED,
  settledLaunch,
  settledOn,
  stagedBy,
  standing,
  surveying,
  TILLAGE,
  victoryOf,
  worker,
} from './fixtures';
import { MOVE_POINT, type Tile, type TileCoords, tileAt, tileKey } from './map';
import { terrainKind } from './map-kinds';
import { RESOURCES } from './resources';
import { seedRng } from './rng';
import { inSight } from './sight';
import { type Change, type Stage, walked } from './stages';
import { type CardId, type Chronicle, type ChronicleAchievement, idle } from './state';

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
  expect(launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, [])).toEqual(
    launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, []),
  );
  expect(launched(CATALOGUE, AGE, REGION, 1235, CIVILIZATION, [])).not.toEqual(
    launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, []),
  );
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, []);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('a chronicle opens on the settle phase with empty stores, the city standing nowhere, the civilization’s city section carried, its card in hand before the settle cards, and the centre part alone in sight', () => {
  const chronicle = launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, []);
  const centre = chronicle.centre.map(tileKey).sort();

  expect(chronicle.turn).toBe(0);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.city).toBeUndefined();
  expect(chronicle.population).toBe(0);
  expect(chronicle.held).toEqual([]);
  expect(chronicle.citySection).toEqual(CIVILIZATION.city);
  expect(idsOf(chronicle.hand)).toEqual([CIVILIZATION.city.card, ...CIVILIZATION.settle]);
  expect(idsOf(chronicle.drawPile).sort()).toEqual([...CIVILIZATION.cards].sort());
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
  let chronicle = settledLaunch(CATALOGUE, AGE, REGION, 4242, CIVILIZATION, []);
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
  expect(idsOf(stages[0].chronicle.discardPile)).toEqual(['PH_Harvest']);
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
  expect(idsOf(discarded.chronicle.hand)).toEqual(['PH_March']);
  expect(idsOf(discarded.chronicle.discardPile)).toEqual(['PH_Harvest']);
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

test('a card that becomes another, played, lies on the discard pile as that card at its own counters and comes around as it', () => {
  const city = cityOf(['urban'], { hand: ['PH_Flood'] });

  const [moved] = playedOver(city, PLAYED);
  const flooded = outcome(apply(CATALOGUE, city, PLAYED));
  const drawn = endedTurn(flooded);
  const ebbed = outcome(apply(CATALOGUE, drawn, PLAYED));

  expect(moved.name).toBe('discarded');
  expect(flooded.discardPile).toEqual([{ id: 'PH_Ebb', counters: { tide: 2 } }]);
  expect(drawn.hand).toEqual([{ id: 'PH_Ebb', counters: { tide: 2 } }]);
  expect(ebbed.discardPile).toEqual([{ id: 'PH_Flood', counters: { tide: 1 } }]);
});

test('a card that becomes another, discarded unplayed, comes around as it is', () => {
  const city = cityOf(['urban'], { hand: ['PH_Flood', 'PH_Ebb'] });

  expect(idsOf(endedTurn(city).hand).sort()).toEqual(['PH_Ebb', 'PH_Flood']);
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
  expect(idsOf(outcome(second).hand)).toEqual(['PH_Harvest']);

  const held = cityOf(['urban'], { hand: ['PH_Harvest', 'PH_March', 'PH_Harvest'] });

  expect(changeNamed(apply(CATALOGUE, held, { type: 'end-turn' }), 'discarded')).toMatchObject({
    places: [0, 1, 2],
  });

  const settling = opening(plainDisc(), {
    civilization: { ...CIVILIZATION, settle: ['PH_Settle', 'PH_Settle'] },
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
    changeNamed(heldBy(apply(CATALOGUE, dealt, { type: 'take', at: 0 }), 'reward'), 'added'),
  ).not.toHaveProperty('places');

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
  expect(idsOf(outcome(recall).hand)).toEqual(['PH_Harvest', 'PH_Mine']);
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
  const opened = opening(plainDisc(), { civilization: { ...CIVILIZATION, settle: ['PH_Settle'] } });
  const first = settledOn(opened, CITY);
  const moved = { q: 1, r: 0 };

  const held = playedOver(first, aimedAt(moved));

  expect(first.population).toBe(1 + CIVILIZATION.city.idle);
  expect(held.map(({ name }) => name)).toEqual([
    'left',
    'retiled',
    'retiled',
    'held',
    'assigned',
    'settled',
  ]);
  expect(outcome(apply(CATALOGUE, first, aimedAt(moved))).city).toEqual(moved);
});

test('the settle is played over the card leaving and the settle’s own changes, all on the city’s tile', () => {
  const opened = opening(plainDisc(), { civilization: { ...CIVILIZATION, settle: [] } });

  const held = playedOver(opened, aimedAt(CITY));
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
  expect(tileAt(built.chronicle.tiles, CITY)?.building).toBe(CIVILIZATION.city.building);
  expect(holding.chronicle.held).toEqual([CITY]);
  expect(population.chronicle.population).toBe(1 + CIVILIZATION.city.idle);
  expect(assigned.chronicle.assigned).toEqual([CITY]);
  for (const change of changes.slice(0, 4)) expect(change.chronicle.city).toBeUndefined();
  expect(stood.chronicle.city).toEqual(CITY);
  expect(outcome(apply(CATALOGUE, opened, aimedAt(CITY))).ending).toBeUndefined();
});

test('the settle raises no ending: the city stands only once everything it runs on is in place', () => {
  const opened = opening(plainDisc(), { civilization: { ...CIVILIZATION, settle: [] } });

  const names = stagedBy(opened, aimedAt(CITY));

  expect(names).not.toContain('ended');
  expect(names[names.length - 1]).toBe('settled');
});

test('ending the turn discards what is left of the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_March', 'PH_Farm'],
    drawPile: ['PH_Worker', 'PH_Worker', 'PH_Warrior', 'PH_Warrior', 'PH_Harvest'],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(idsOf(after.discardPile)).toEqual(['PH_March', 'PH_Farm']);
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

  expect(idsOf(outcome(apply(CATALOGUE, city, { type: 'end-turn' })).hand)).toEqual([
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
  let chronicle = endedTurn(settledOn(opening(plains(3)), CITY));
  const deck = everyCard(chronicle);
  expect(deck).toHaveLength(CIVILIZATION.cards.length);

  for (let turn = 0; turn < 8; turn++) {
    chronicle = outcome(apply(CATALOGUE, chronicle, { type: 'play', index: 0, aim: 'none' }));
    chronicle = endedTurn(chronicle);
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
  const opened = opening(plainDisc(), { civilization: { ...CIVILIZATION, settle: [] } });
  const settled = settledOn(opened, CITY);
  const centre = tileAt(settled.tiles, CITY);

  expect(settled.city).toEqual(CITY);
  expect(centre?.terrain).toBe('urban');
  expect(centre?.building).toBe(CIVILIZATION.city.building);
  expect(centre?.feature).toBeUndefined();
  for (const tile of settled.tiles) {
    if (tileKey(tile) === tileKey(CITY)) continue;
    expect(tile.terrain).toBe('plain');
    expect(tile.building).toBeUndefined();
  }
  expect(settled.held).toEqual([CITY]);
  expect(settled.assigned).toEqual([CITY]);
  expect(idle(settled)).toBe(CIVILIZATION.city.idle);
  expect(settled.hand).toEqual([]);
  expect(settled.discardPile).toEqual([]);
  expect(everyCard(settled)).toEqual([...CIVILIZATION.cards].sort());
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
  const opened = opening(plains(3), { civilization: { ...CIVILIZATION, settle: ['PH_Settle'] } });
  const settled = settledOn(opened, CITY);
  const stocked: Chronicle = { ...settled, resources: { ...settled.resources, food: 99 } };

  const stages = apply(CATALOGUE, stocked, { type: 'end-turn' });
  const after = outcome(stages);

  expect(idsOf(stocked.hand)).toEqual(['PH_Settle']);
  expect(namesOf(stages)).toEqual(['turn', 'turn', 'left', 'drawn']);
  const [, tick, left] = [...walked(stages)];
  expect(tick.chronicle.turn).toBe(1);
  expect(tick.chronicle.hand).toEqual(stocked.hand);
  expect(left.chronicle.hand).toEqual([]);
  expect(after.turn).toBe(1);
  expect(after.hand).toHaveLength(5);
  expect(after.resources).toEqual(stocked.resources);
  expect(after.population).toBe(stocked.population);
  expect(everyCard(after)).toEqual([...CIVILIZATION.cards].sort());
});

test('a settle card played leaves the chronicle, and the hand holds the city section’s card, then the settle section in the deck’s order', () => {
  const opened = opening(plains(3), {
    civilization: { ...CIVILIZATION, cards: [], settle: ['PH_Stores', 'PH_Band'] },
  });

  const stocked = outcome(apply(CATALOGUE, opened, { type: 'play', index: 1, aim: 'none' }));

  expect(idsOf(opened.hand)).toEqual([CIVILIZATION.city.card, 'PH_Stores', 'PH_Band']);
  expect(stocked.resources.food).toBe(2);
  expect(idsOf(stocked.hand)).toEqual([CIVILIZATION.city.card, 'PH_Band']);
  expect(stocked.discardPile).toEqual([]);
  expect(everyCard(stocked)).toEqual([CIVILIZATION.city.card, 'PH_Band'].sort());
});

test('a chronicle is launched with the achievements of its age whose technology is not learned and needs none that is not, none reached, in the order the age declares them', () => {
  const launchedWith = (learned: readonly string[]): readonly ChronicleAchievement[] =>
    launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, learned).achievements;

  expect(launchedWith([])).toEqual([
    { id: HOARD, reached: false, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(launchedWith([GRANARY])).toEqual([
    { id: FEAST, reached: false, tally: {} },
    { id: CROWD, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(() => launchedWith(['PH_Unheld'])).toThrow('fixture: no technology is named PH_Unheld');
});

test('an achievement its count meets on the chronicle as it is launched is recorded at the launch, one keeping a tally as any other', () => {
  const seen: Pick<Achievement, 'count' | 'need'> = {
    count: (_catalogue, chronicle) => chronicle.snapshots.length,
    need: 1,
  };
  const metAtOnce = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), ...seen },
    [SURVEY]: { ...achievementOf(CATALOGUE, AGE, SURVEY), ...seen },
  });

  const launch = launched(metAtOnce, AGE, REGION, 1234, CIVILIZATION, []);

  expect(launch.snapshots.length).toBeGreaterThan(0);
  expect(launch.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: true, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect({ ...launch, achievements: [] }).toEqual({
    ...launched(CATALOGUE, AGE, REGION, 1234, CIVILIZATION, []),
    achievements: [],
  });
});

test('an achievement is recorded reached right after the change its count meets its need on, every stage after carries the record, and it is never read again', () => {
  const city = reaching([], {
    ...NO_GROWTH,
    tiles: field(1),
    drawPile: fullDraw(),
    resources: {
      food: HOARD_NEED - 1,
      production: 0,
      military: 0,
      money: 0,
      science: 0,
      culture: 0,
    },
  });
  const recorded = [
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ];

  const stages = apply(CATALOGUE, city, { type: 'end-turn' });
  const played = [...walked(stages)];
  const at = played.findIndex(({ name }) => name === 'reached');
  const met = played[at - 1];

  expect(played.filter(({ name }) => name === 'reached')).toHaveLength(1);
  expect(met.name).toBe('stock');
  expect(met.chronicle.resources.food).toBeGreaterThanOrEqual(HOARD_NEED);
  expect(met.chronicle.achievements).toEqual(city.achievements);
  for (const stage of played.slice(0, at - 1)) {
    if (stage.kind === 'change') expect(stage.chronicle.resources.food).toBeLessThan(HOARD_NEED);
  }
  for (const stage of played.slice(at)) expect(stage.chronicle.achievements).toEqual(recorded);
  expect(outcome(stages).achievements).toEqual(recorded);
  expect(stagedBy(outcome(stages), { type: 'end-turn' })).not.toContain('reached');
});

test('two achievements one change meets are each recorded as a reached of its own, in the order the age declares them', () => {
  const city = reaching([], {
    hand: ['PH_Spoils'],
    resources: {
      food: HOARD_NEED - 1,
      production: 0,
      military: 0,
      money: 0,
      science: 0,
      culture: 0,
    },
  });

  const stages = apply(CATALOGUE, city, PLAYED);
  const [, , gained, first, second] = [...walked(stages)];

  expect(FEAST_NEED).toBeGreaterThan(HOARD_NEED);
  expect(city.resources.food).toBeLessThan(HOARD_NEED);
  expect(gained.chronicle.resources.food).toBeGreaterThanOrEqual(FEAST_NEED);
  expect(namesOf(stages)).toEqual(['played', 'left', 'stock', 'reached', 'reached']);
  expect(first.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(second.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: true, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
});

test('an achievement the launch did not name is never read, whatever its count', () => {
  const growing = (learned: readonly string[]): Chronicle =>
    reaching(learned, {
      tiles: field(1),
      held: [CITY],
      population: CROWD_NEED - 1,
      assigned: [CITY],
      drawPile: fullDraw(),
      resources: {
        food: 2 * (CROWD_NEED - 1),
        production: 0,
        military: 0,
        money: 0,
        science: 0,
        culture: 0,
      },
    });
  const named = apply(CATALOGUE, growing([GRANARY]), { type: 'end-turn' });
  const unnamed = apply(CATALOGUE, growing([]), { type: 'end-turn' });

  expect(heldBy(named, 'grow').map(({ name }) => name)).toEqual(['stock', 'population', 'reached']);
  expect(outcome(named).population).toBe(CROWD_NEED);
  expect(heldBy(unnamed, 'grow').map(({ name }) => name)).toEqual(['stock', 'population']);
  expect(outcome(unnamed).population).toBe(CROWD_NEED);
  expect(namesOf(unnamed)).not.toContain('reached');
});

test('a victory is followed by its achievement, recorded after the ending, and an achievement the same change meets is recorded before the ending', () => {
  const city = reaching([], {
    tiles: builtOn(field(2), TILLAGE, [{ q: 1, r: 0 }]),
    timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } },
    hand: ['PH_Cache'],
    resources: { food: HOARD_NEED, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const stages = apply(CATALOGUE, city, PLAYED);
  const [, left, hoarded, ended, won] = [...walked(stages)];

  expect(namesOf(stages)).toEqual(['played', 'left', 'reached', 'ended', 'reached']);
  expect(left.chronicle.achievements).toEqual(city.achievements);
  expect(hoarded.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(hoarded.chronicle.ending).toBeUndefined();
  expect(ended.chronicle.ending).toEqual({ outcome: 'victory', turn: city.turn });
  expect(ended.chronicle.achievements).toEqual(hoarded.chronicle.achievements);
  expect(won.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: true, tally: {} },
  ]);
  expect(outcome(stages)).toBe(won.chronicle);
});

test('the fall’s ending is read as any change: a victory’s achievement is not reached on it, and one the fall meets is recorded right after it', () => {
  const quiet = ageOf(CATALOGUE, QUIET);
  const victory = achievementOf(CATALOGUE, QUIET, victoryOf(QUIET));
  const anyEnding: Catalogue = {
    ...CATALOGUE,
    ages: {
      ...CATALOGUE.ages,
      [QUIET]: {
        ...quiet,
        achievements: {
          [victoryOf(QUIET)]: {
            ...victory,
            count: (_catalogue, chronicle) => (chronicle.ending === undefined ? 0 : 1),
          },
        },
      },
    },
  };
  const empty = cityOf(['urban'], {
    tiles: field(2),
    population: 0,
    assigned: [],
    achievements: [{ id: victoryOf(QUIET), reached: false, tally: {} }],
  });

  expect(namesOf(apply(CATALOGUE, empty, { type: 'end-turn' }))).toEqual([
    'grow',
    'stock',
    'ended',
  ]);
  const fallen = apply(anyEnding, empty, { type: 'end-turn' });
  expect(namesOf(fallen)).toEqual(['grow', 'stock', 'ended', 'reached']);
  expect(outcome(fallen).ending).toEqual({ outcome: 'defeat', cause: 'population', turn: 1 });
  expect(outcome(fallen).achievements).toEqual([
    { id: victoryOf(QUIET), reached: true, tally: {} },
  ]);
});

test('an achievement that counts the charted tiles is recorded right after the move that charts the tile it needs, in the same command', () => {
  const city = reaching([], { tiles: field(6), units: [standing('player', { q: 0, r: 3 })] });
  const exploring = achieved({
    [HOARD]: {
      ...achievementOf(CATALOGUE, AGE, HOARD),
      count: (_catalogue, chronicle) => chronicle.snapshots.length,
      need: city.snapshots.length + 1,
    },
  });

  const stages = apply(exploring, city, {
    type: 'move',
    unit: city.units[0].id,
    tile: { q: 0, r: 4 },
  });
  const [moved, reached] = [...walked(stages)];

  expect(namesOf(stages)).toEqual(['move', 'reached']);
  expect(moved.chronicle.snapshots.length).toBeGreaterThan(city.snapshots.length);
  expect(moved.chronicle.achievements).toEqual(city.achievements);
  expect(reached.chronicle.snapshots).toBe(moved.chronicle.snapshots);
  expect(reached.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: {} },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
});

test('an achievement keeping a tally is reached at the end of the command whose deed brings its count to the need, whatever was played between', () => {
  const [plain, other, forest] = SURVEYED;
  const first = apply(CATALOGUE, surveying(), aimedAt(plain));
  const between = apply(CATALOGUE, outcome(first), { type: 'play', index: 2, aim: 'none' });
  const second = apply(CATALOGUE, outcome(between), aimedAt(other));
  const third = apply(CATALOGUE, outcome(second), aimedAt(forest));

  expect(namesOf(first).at(-1)).toBe('tallied');
  expect(achievementIn(outcome(first), SURVEY)).toEqual({
    id: SURVEY,
    reached: false,
    tally: { plain: 1 },
  });
  expect(namesOf(between)).toEqual(['played', 'discarded', 'stock', 'stock']);
  expect(achievementIn(outcome(second), SURVEY)).toEqual({
    id: SURVEY,
    reached: false,
    tally: { plain: 2 },
  });
  expect(third.slice(-2).map(({ name }) => name)).toEqual(['tallied', 'reached']);
  expect(achievementIn(outcome(third), SURVEY)).toEqual({
    id: SURVEY,
    reached: true,
    tally: { plain: 2, forest: 1 },
  });
  for (const stage of walked(third.slice(0, -1))) {
    expect(achievementIn(stage.chronicle, SURVEY).reached).toBe(false);
  }
});

test('a command the chronicle ends on moves no tally, so a deed whose count it would bring to the need is not recorded', () => {
  const [plain, , forest] = SURVEYED;
  const tillage = capstoneOf(CATALOGUE, 'PH_Tillage');
  const paving: Catalogue = {
    ...CATALOGUE,
    capstones: {
      ...CATALOGUE.capstones,
      PH_Tillage: {
        ...tillage,
        passes: (_catalogue, chronicle) =>
          tileAt(chronicle.tiles, forest)?.improvements.includes('PH_Road') === true,
      },
    },
  };
  const surveyed = outcome(
    apply(
      paving,
      surveying({ timeline: { ...NO_DEALS, capstone: { id: 'PH_Tillage', turn: 1 } } }),
      aimedAt(plain),
    ),
  );

  const stages = apply(paving, surveyed, aimedAt(forest));

  expect(achievementIn(surveyed, SURVEY).tally).toEqual({ plain: 1 });
  expect(namesOf(apply(CATALOGUE, surveyed, aimedAt(forest))).slice(-2)).toEqual([
    'tallied',
    'reached',
  ]);
  expect(outcome(stages).ending).toEqual({ outcome: 'victory', turn: surveyed.turn });
  expect(namesOf(stages)).not.toContain('tallied');
  expect(achievementIn(outcome(stages), SURVEY)).toEqual({
    id: SURVEY,
    reached: false,
    tally: { plain: 1 },
  });
});

test('a command moving the tallies of two achievements raises a tallied for each, in the order of the row, then a reached for each whose count it meets', () => {
  const [plain] = SURVEYED;
  const { tallies, count } = achievementOf(CATALOGUE, AGE, SURVEY);
  const twoTallies = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), tallies, count, need: 1 },
  });

  const stages = apply(twoTallies, surveying(), aimedAt(plain));
  const [hoarded, surveyed, met] = [...walked(stages)].slice(-3);

  expect(namesOf(stages).slice(-3)).toEqual(['tallied', 'tallied', 'reached']);
  expect(hoarded.chronicle.achievements).toEqual([
    { id: HOARD, reached: false, tally: { plain: 1 } },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: {} },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(surveyed.chronicle.achievements).toEqual([
    { id: HOARD, reached: false, tally: { plain: 1 } },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: { plain: 1 } },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
  expect(met.chronicle.achievements).toEqual([
    { id: HOARD, reached: true, tally: { plain: 1 } },
    { id: FEAST, reached: false, tally: {} },
    { id: SURVEY, reached: false, tally: { plain: 1 } },
    { id: RIVERSIDE, reached: false, tally: {} },
    { id: victoryOf(AGE), reached: false, tally: {} },
  ]);
});

test('an achievement counting the kinds of terrain a card is played on counts a card aimed at a unit by the terrain of the tile its unit stands on', () => {
  const [, , forest] = SURVEYED;
  const marching = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), ...terrainsPlayedOn('PH_March'), need: 1 },
  });
  const city = surveying({
    units: [standing('player', forest, {}, MOVE_POINT)],
    hand: ['PH_March'],
  });

  const stages = apply(marching, city, aimedAtUnit(forest));

  expect(achievementIn(outcome(stages), HOARD)).toEqual({
    id: HOARD,
    reached: true,
    tally: { forest: 1 },
  });
});

test('an achievement counting a card’s plays anywhere counts each one whatever tile it is aimed at, and none of another card', () => {
  const [fertile, game] = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const hunting = achieved({
    [HOARD]: {
      ...achievementOf(CATALOGUE, AGE, HOARD),
      ...playsOn('PH_Hunt', { on: 'anywhere' }),
      need: 2,
    },
  });
  const city = reaching([], {
    tiles: field(2).map((tile): Tile => {
      if (tileKey(tile) === tileKey(fertile)) return { ...tile, feature: 'PH_Fertile' };
      if (tileKey(tile) === tileKey(game))
        return { ...tile, terrain: 'forest', feature: 'PH_Game' };
      return tile;
    }),
    units: [fertile, game].map(worker),
    hand: ['PH_Hunt', 'PH_Cache', 'PH_Hunt'],
  });

  const first = apply(hunting, city, aimedAt(fertile));
  const other = apply(hunting, outcome(first), { type: 'play', index: 0, aim: 'none' });
  const second = apply(hunting, outcome(other), aimedAt(game));

  expect(achievementIn(outcome(first), HOARD).tally).toEqual({ plays: 1 });
  expect(namesOf(other)).not.toContain('tallied');
  expect(achievementIn(outcome(second), HOARD)).toEqual({
    id: HOARD,
    reached: true,
    tally: { plays: 2 },
  });
});

test('an achievement counting a card’s plays along a river counts each one aimed at a tile a river runs along, and none aimed elsewhere', () => {
  const [banked, bent] = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const dry = { q: -1, r: 0 };
  const city = reaching([], {
    tiles: field(2),
    held: [CITY, banked, bent, dry],
    rivers: [riverBetween(banked, { q: 2, r: -1 }), riverBetween(bent, { q: 1, r: 1 })],
    units: [banked, dry, bent].map(worker),
    hand: ['PH_Farm', 'PH_Farm', 'PH_Farm'],
    resources: { food: 0, production: 9, military: 0, money: 0, science: 0, culture: 0 },
  });

  const first = apply(CATALOGUE, city, aimedAt(banked));
  const elsewhere = apply(CATALOGUE, outcome(first), aimedAt(dry));
  const second = apply(CATALOGUE, outcome(elsewhere), aimedAt(bent));

  expect(achievementIn(outcome(first), RIVERSIDE)).toEqual({
    id: RIVERSIDE,
    reached: false,
    tally: { plays: 1 },
  });
  expect(tileAt(outcome(elsewhere).tiles, dry)?.building).toBe('PH_Farm');
  expect(namesOf(elsewhere)).not.toContain('tallied');
  expect(second.slice(-2).map(({ name }) => name)).toEqual(['tallied', 'reached']);
  expect(achievementIn(outcome(second), RIVERSIDE)).toEqual({
    id: RIVERSIDE,
    reached: true,
    tally: { plays: 2 },
  });
});

test('an achievement counting a card’s plays on a feature counts one on a tile carrying it as the tile stood when the card was played, and none on a tile carrying another', () => {
  const [carrying, other] = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const hunting = achieved({
    [HOARD]: {
      ...achievementOf(CATALOGUE, AGE, HOARD),
      ...playsOn('PH_Hunt', { on: 'feature', feature: 'PH_Fertile' }),
      need: 2,
    },
  });
  const city = reaching([], {
    tiles: field(2).map((tile): Tile => {
      if (tileKey(tile) === tileKey(carrying)) return { ...tile, feature: 'PH_Fertile' };
      if (tileKey(tile) === tileKey(other))
        return { ...tile, terrain: 'forest', feature: 'PH_Game' };
      return tile;
    }),
    units: [other, carrying].map(worker),
    hand: ['PH_Hunt', 'PH_Hunt'],
  });

  const elsewhere = apply(hunting, city, aimedAt(other));
  const hunted = apply(hunting, outcome(elsewhere), aimedAt(carrying));

  expect(tileAt(outcome(elsewhere).tiles, other)?.feature).toBeUndefined();
  expect(namesOf(elsewhere)).not.toContain('tallied');
  expect(tileAt(outcome(hunted).tiles, carrying)?.feature).toBeUndefined();
  expect(achievementIn(outcome(hunted), HOARD)).toEqual({
    id: HOARD,
    reached: false,
    tally: { plays: 1 },
  });
});

test('an achievement counting the enemies a kind of unit kills counts each enemy the attack of a unit of the player’s of that kind kills, and nothing for a kill by another kind, damaged by that kind first or not, nor for a unit of the player’s killed', () => {
  const killing = achieved({
    [HOARD]: {
      ...achievementOf(CATALOGUE, AGE, HOARD),
      ...enemiesKilledBy('PH_Slinger'),
      need: 2,
    },
  });
  const slinger = { type: 'PH_Slinger', damage: 2 };
  const city = reaching([], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, slinger),
      standing('player', { q: -1, r: 0 }, { damage: 2 }),
      standing('player', { q: 0, r: 1 }, { ...slinger, damage: 1 }),
      standing('player', { q: 1, r: 1 }, { damage: 2 }),
      standing('enemy', { q: 2, r: 0 }, { health: 2 }),
      standing('enemy', { q: -2, r: 0 }, { health: 2 }),
      standing('enemy', { q: 0, r: 2 }, { health: 2 }),
    ],
  });
  const attacked = (chronicle: Chronicle, unit: number, at: TileCoords): Chronicle =>
    outcome(apply(killing, chronicle, attackOn(unit, at)));

  const killed = attacked(city, 1, { q: 2, r: 0 });
  const byAnother = attacked(killed, 2, { q: -2, r: 0 });
  const damaged = attacked(byAnother, 3, { q: 0, r: 2 });
  const finished = attacked(damaged, 4, { q: 0, r: 2 });

  expect(achievementIn(killed, HOARD).tally).toEqual({ killed: 1 });
  expect([byAnother, damaged, finished].map((chronicle) => chronicle.units.length)).toEqual([
    5, 5, 4,
  ]);
  expect(achievementIn(finished, HOARD).tally).toEqual({ killed: 1 });

  const raided = reaching([], {
    tiles: field(2),
    units: [
      standing('player', CITY, { ...slinger, health: 1 }),
      standing('enemy', { q: 1, r: 0 }, slinger),
    ],
  });
  const ended = endedTurn(raided, undefined, killing);

  expect(ended.units.map(({ faction }) => faction)).toEqual(['enemy']);
  expect(achievementIn(ended, HOARD).tally).toEqual({});
});

test('an achievement counting the turns on which that many cards were played counts a turn once, at the play that brings it to the number, a hazard paid for among them, and nothing played on the settle phase', () => {
  const cards = 2;
  const need = 2;
  const counting = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), ...turnsPlaying(cards), need },
  });
  const { count } = achievementOf(counting, AGE, HOARD);
  const countOn = (chronicle: Chronicle): number =>
    count(counting, chronicle, achievementIn(chronicle, HOARD).tally);
  const played = (chronicle: Chronicle, index = 0): Chronicle =>
    outcome(apply(counting, chronicle, { type: 'play', index, aim: 'none' }));

  const settling = opening(plains(3), {
    age: AGE,
    civilization: { ...CIVILIZATION, cards: [], settle: ['PH_Stores', 'PH_Stores'] },
  });
  const settled = played(played(settling, 1), 1);
  const city = reaching([], {
    hand: ['PH_Harvest', 'PH_Hunger', 'PH_Harvest'],
    drawPile: ['PH_Harvest', 'PH_Harvest', 'PH_Harvest', 'PH_Harvest', 'PH_Harvest'],
    resources: { food: 0, production: 3, military: 0, money: 0, science: 10, culture: 0 },
  });
  const first = played(city);
  const paid = played(first);
  const third = played(paid);
  const next = endedTurn(third, undefined, counting);
  const once = played(next);
  const twice = played(once);

  expect(idsOf(settled.hand)).toEqual([CIVILIZATION.city.card]);
  expect(settled.turn).toBe(0);
  expect(countOn(settled)).toBe(0);
  expect([first, paid, third].map(countOn)).toEqual([0, 1, 1]);
  expect(idsOf(third.hand)).toEqual([]);
  expect(next.turn).toBe(city.turn + 1);
  expect([once, twice].map(countOn)).toEqual([1, need]);
  expect(achievementIn(once, HOARD).reached).toBe(false);
  expect(achievementIn(twice, HOARD).reached).toBe(true);
});

test('an achievement counting a resource gained from the tiles of a terrain counts what they yield at income and through a card gaining a tile’s yield, and nothing gained from a tile of another terrain or from no tile', () => {
  const [plain, forest, out] = [
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 3, r: 0 },
  ];
  const gathering = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), ...gainedFrom('food', 'plain') },
  });
  const city = reaching([], {
    ...NO_GROWTH,
    tiles: madeOf(field(3), 'forest', [forest]),
    held: [CITY, plain, forest],
    assigned: [CITY, plain, forest],
    units: [worker(out)],
    hand: ['PH_Forage', 'PH_Harvest'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });
  const food = (terrain: string): number => terrainKind(CATALOGUE, terrain).yields.food ?? 0;

  const foraged = apply(gathering, city, aimedAt(out));
  const harvested = apply(gathering, outcome(foraged), { type: 'play', index: 0, aim: 'none' });
  const ended = endedTurn(outcome(harvested), undefined, gathering);

  expect(food('forest')).toBeGreaterThan(0);
  expect(achievementIn(outcome(foraged), HOARD).tally).toEqual({ gained: food('plain') });
  expect(outcome(harvested).resources.food).toBeGreaterThan(outcome(foraged).resources.food);
  expect(namesOf(harvested)).not.toContain('tallied');
  expect(achievementIn(ended, HOARD).tally).toEqual({ gained: 2 * food('plain') });
});

test('an achievement counting the times the draw pile is emptied counts each draw that takes its last card, a shuffle after it or not, and none for a draw that leaves a card or a dry pile with nothing to draw', () => {
  const counting = achieved({
    [HOARD]: { ...achievementOf(CATALOGUE, AGE, HOARD), ...drawPileEmptied() },
  });
  const { count } = achievementOf(counting, AGE, HOARD);
  const countAfter = (piles: Carrying): number => {
    const ended = endedTurn(reaching([], { ...NO_GROWTH, ...piles }), undefined, counting);
    return count(counting, ended, achievementIn(ended, HOARD).tally);
  };
  const harvests = (cards: number): CardId[] => Array.from({ length: cards }, () => 'PH_Harvest');

  expect(countAfter({ drawPile: harvests(6) })).toBe(0);
  expect(countAfter({ drawPile: harvests(5) })).toBe(1);
  expect(countAfter({ drawPile: harvests(1), discardPile: harvests(2) })).toBe(2);
  expect(countAfter({})).toBe(0);
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
