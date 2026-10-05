import { expect, test } from 'vitest';
import {
  aimOf,
  built,
  discarded,
  embarks,
  featurePlaced,
  featureRemoved,
  improvementPlaced,
  made,
  outside,
  playedThrough,
  refuses,
  terraformable,
  terraformed,
  throughWorker,
} from './cards';
import {
  type AimedCard,
  type Catalogue,
  type Civilization,
  cardOf,
  catalogued,
  civilizationOf,
  unitKind,
} from './catalogue';
import { admitted, apply, byHand, type Command, outcome, refusalOf } from './chronicle';
import { yielded } from './city';
import {
  AGE,
  actionOf,
  aimedAt,
  aimedAtUnit,
  assignTo,
  attackOn,
  buildingAt,
  builtOn,
  CAMP,
  CATALOGUE,
  type Carrying,
  CITY,
  CIVILIZATION,
  CIVILIZATION_ID,
  camped,
  changed,
  cityOf,
  DROUGHT,
  dealing,
  EMBARKED_MOVE,
  endedTurn,
  everyCard,
  FOOD,
  FREEZE,
  FROST,
  field,
  fullDraw,
  HUNGER,
  idsOf,
  madeOf,
  NO_GROWTH,
  namesOf,
  opening,
  plains,
  pointsOf,
  REGION,
  ringed,
  riverBetween,
  settledLaunch,
  stagedBy,
  standing,
  UPHEAVAL,
  unitNamed,
  WORKER_STATS,
  withTile,
  withUnits,
  worker,
} from './fixtures';
import {
  cornersOf,
  type FeatureId,
  MOVE_POINT,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { terrainKind } from './map-kinds';
import { RESOURCES, type Resources } from './resources';
import { plays, walked } from './stages';
import { type CardId, type Chronicle, idle, playable, type TileBlock } from './state';
import { standsOn } from './units';

/** A card aimed at where a card lies in the discard pile, ready to hand to `apply`. */
function aimedAtPile(card: number): Command {
  return { type: 'play', index: 0, aim: 'discard-pile', card };
}

/** The card at `index` of the hand aimed at where another card lies in it, ready to hand to `apply`. */
function aimedAtHand(index: number, card: number): Command {
  return { type: 'play', index, aim: 'hand', card };
}

/** The named card, for a fixture that expects it to be aimed at a tile or at a unit. */
function aimedCard(id: CardId, catalogue: Catalogue = CATALOGUE): AimedCard {
  const card = aimOf(cardOf(catalogue, id));
  if (card.aim !== 'tile' && card.aim !== 'unit')
    throw new Error(`${id} is aimed at neither a tile nor a unit`);
  return card;
}

/** The tiles the named card's aim admits, for a card aimed at a tile or at a unit. */
function admittedTiles(chronicle: Chronicle, id: CardId): TileCoords[] {
  return admitted(CATALOGUE, chronicle, aimedCard(id));
}

/**
 * The one reason the named card's aim refuses this tile of the map, and nothing when it admits it: on
 * the fixture's content unless the test hands in its own.
 */
function refusedFor(
  chronicle: Chronicle,
  id: CardId,
  at: TileCoords,
  catalogue: Catalogue = CATALOGUE,
): TileBlock | undefined {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) throw new Error(`${tileKey(at)} is no tile of the map`);
  return refuses(catalogue, chronicle, aimedCard(id, catalogue), tile);
}

/** What the city holds to build and to work tiles with, and nothing besides. */
function production(amount: number): Resources {
  return { food: 0, production: amount, military: 0, money: 0, science: 0, culture: 0 };
}

/** What the city holds to play a science instant with, and nothing besides. */
function science(amount: number): Resources {
  return { food: 0, production: 0, military: 0, money: 0, science: amount, culture: 0 };
}

/** A food stock for a hazard to empty, and the production to pay one with. */
const STOCKED: Resources = {
  food: HUNGER,
  production: 3,
  military: 0,
  money: 0,
  science: 0,
  culture: 0,
};

/**
 * A city holding its ring on a disc out to two, with the tile at `at` made of `terrain` and a worker
 * of the player's standing on it wherever a worker can stand at all: ground no worker enters holds
 * nobody. The seven tiles the city holds reach out to one, so a tile further out lies outside the
 * border.
 */
function workedTile(
  at: TileCoords,
  terrain: Terrain,
  carrying: Carrying = {},
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  const tiles = madeOf(field(2), terrain, [at]);
  return ringed(
    2,
    {
      tiles,
      units: standsOn(CATALOGUE, WORKER_STATS, false, tileAt(tiles, at)) ? [worker(at)] : [],
      ...carrying,
    },
    catalogue,
  );
}

test('playing a card pays its cost and sends it to the discard pile', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest', 'PH_March'],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 3, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(idsOf(after.hand)).toEqual(['PH_March']);
  expect(idsOf(after.discardPile)).toEqual(['PH_Harvest']);
  expect(after.resources.science).toBe(2);
});

test('playing the harvest card gains its two food, on top of what the city already holds', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Harvest'],
    resources: { food: 1, production: 0, military: 0, money: 0, science: 1, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(after.resources.food).toBe(3);
});

test('a card the city cannot pay for stays in the hand and costs nothing', () => {
  const penniless = cityOf(['urban'], { hand: ['PH_Warrior'] });
  const halfway = cityOf(['urban'], {
    hand: ['PH_Farm'],
    resources: { food: 0, production: 2, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(outcome(apply(CATALOGUE, penniless, { type: 'play', index: 0, aim: 'none' }))).toEqual(
    penniless,
  );
  expect(outcome(apply(CATALOGUE, halfway, { type: 'play', index: 0, aim: 'none' }))).toEqual(
    halfway,
  );
});

test('a card played through a worker whose effect is called on a tile no worker stands on raises a runtime error, and its effect lands after it', () => {
  const at = { q: 1, r: 0 };
  const city = cityOf(['urban', 'plain']);
  const card = aimOf(cardOf(CATALOGUE, 'PH_Farm'));
  if (card.aim !== 'tile') throw new Error('the farm is aimed at no tile');

  const landing = card.effect(CATALOGUE, city, at);

  expect(landing.stages.map(({ name }) => name)).toEqual(['runtime-error', 'retiled']);
  expect(landing.stages[0].chronicle).toBe(city);
  expect(buildingAt(landing.chronicle, at)).toBe('PH_Farm');
});

test('the refresh instant refreshes one unit of the player’s that has spent move points', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, 0),
      standing('player', { q: 1, r: 1 }, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  const stages = apply(CATALOGUE, city, aimedAtUnit(CITY));

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'refreshed']);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
  expect(pointsOf(outcome(stages), 2)).toBe(MOVE_POINT);
  expect(idsOf(outcome(stages).discardPile)).toEqual(['PH_March']);
});

test('the refresh instant is refused on a unit whose move points are full, on an enemy, on a tile nobody stands on and at nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [
      standing('player', CITY, { move: 2 * MOVE_POINT }, MOVE_POINT),
      standing('player', { q: 1, r: 1 }, { move: 2 * MOVE_POINT }),
      standing('enemy', { q: 2, r: 0 }, { move: 2 * MOVE_POINT }, 0),
    ],
  });

  expect(stagedBy(city, aimedAtUnit({ q: 1, r: 1 }))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtUnit({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtUnit({ q: 0, r: 1 }))).toEqual(['refused']);
  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, aimedAtUnit({ q: 1, r: 1 })))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, aimedAtUnit({ q: 2, r: 0 })))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, aimedAtUnit({ q: 0, r: 1 })))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }))).toBe(city);
});

test('the recall instant takes the card it is aimed at out of the discard pile and into the hand', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm', 'PH_Harvest', 'PH_Mine'],
    resources: science(2),
  });

  const stages = apply(CATALOGUE, city, aimedAtPile(1));
  const after = outcome(stages);

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'stock', 'recalled']);
  expect(idsOf(after.hand)).toEqual(['PH_Harvest']);
  expect(idsOf(after.discardPile)).toEqual(['PH_Farm', 'PH_Mine', 'PH_Recall']);
  expect(after.resources.science).toBe(0);
  expect(everyCard(after)).toEqual(everyCard(city));
});

test('the recall instant is refused at a card the discard pile does not hold, and at nothing', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm', 'PH_Harvest'],
    resources: science(2),
  });

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual(['refused']);
  expect(stagedBy(city, aimedAtPile(-1))).toEqual(['refused']);
  expect(stagedBy(city, aimedAtPile(2))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, aimedAtPile(-1)))).toBe(city);
  expect(outcome(apply(CATALOGUE, city, aimedAtPile(2)))).toBe(city);
});

test('the recall instant never brings back the card it sent to the discard pile itself', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(2),
  });

  expect(stagedBy(city, aimedAtPile(1))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, aimedAtPile(1)))).toBe(city);
  expect(idsOf(outcome(apply(CATALOGUE, city, aimedAtPile(0))).hand)).toEqual(['PH_Farm']);
});

test('an empty discard pile blocks the recall instant in the hand', () => {
  const empty = cityOf(['urban'], { hand: ['PH_Recall'], resources: science(2) });
  const holding = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(2),
  });

  expect(refusalOf(CATALOGUE, empty, 'PH_Recall').blocked).toEqual(['discard-pile']);
  expect(playable(refusalOf(CATALOGUE, empty, 'PH_Recall'))).toBe(false);
  expect(stagedBy(empty, aimedAtPile(0))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, empty, aimedAtPile(0)))).toBe(empty);
  expect(playable(refusalOf(CATALOGUE, holding, 'PH_Recall'))).toBe(true);
});

test('a recall the city cannot pay for stays in the hand and costs nothing', () => {
  const short = cityOf(['urban'], {
    hand: ['PH_Recall'],
    discardPile: ['PH_Farm'],
    resources: science(1),
  });

  expect(stagedBy(short, aimedAtPile(0))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, short, aimedAtPile(0)))).toBe(short);
});

test('the discard instant discards the card of the hand it is played at, before it or after it, over itself on the discard pile', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Farm', 'PH_Discard', 'PH_Harvest', 'PH_Mine'],
    discardPile: ['PH_Road'],
    resources: science(1),
  });

  const before = apply(CATALOGUE, city, aimedAtHand(1, 0));
  const after = apply(CATALOGUE, city, aimedAtHand(1, 2));

  expect(namesOf(after)).toEqual(['played', 'discarded', 'stock', 'discarded']);
  expect(plays(after)[0].aimed).toEqual({ aim: 'hand', card: 2 });
  expect(idsOf(outcome(before).hand)).toEqual(['PH_Harvest', 'PH_Mine']);
  expect(idsOf(outcome(before).discardPile)).toEqual(['PH_Road', 'PH_Discard', 'PH_Farm']);
  expect(idsOf(outcome(after).hand)).toEqual(['PH_Farm', 'PH_Mine']);
  expect(idsOf(outcome(after).discardPile)).toEqual(['PH_Road', 'PH_Discard', 'PH_Harvest']);
  expect(outcome(after).resources.science).toBe(0);
  expect(everyCard(outcome(before))).toEqual(everyCard(city));
  expect(everyCard(outcome(after))).toEqual(everyCard(city));
});

test('the discard instant is refused at itself, at a card the hand does not hold, and at nothing', () => {
  const city = cityOf(['urban'], {
    hand: ['PH_Farm', 'PH_Discard'],
    resources: science(1),
  });

  const refusedPlays: Command[] = [
    aimedAtHand(1, 1),
    aimedAtHand(1, 2),
    aimedAtHand(1, -1),
    { type: 'play', index: 1, aim: 'none' },
  ];
  for (const command of refusedPlays) {
    expect(stagedBy(city, command)).toEqual(['refused']);
    expect(outcome(apply(CATALOGUE, city, command))).toBe(city);
  }
});

test('a hand holding no other card blocks the discard instant in it', () => {
  const alone = cityOf(['urban'], { hand: ['PH_Discard'], resources: science(1) });

  expect(refusalOf(CATALOGUE, alone, 'PH_Discard').blocked).toEqual(['hand']);
  expect(playable(refusalOf(CATALOGUE, alone, 'PH_Discard'))).toBe(false);
});

test('a discard of a place the hand does not hold raises a runtime error and discards nothing', () => {
  const city = cityOf(['urban'], { hand: ['PH_Farm'] });

  const landing = discarded(city, [0, 1]);

  expect(landing.stages.map(({ name }) => name)).toEqual(['runtime-error']);
  expect(landing.chronicle).toBe(city);
});

test('the refresh instant refreshes move points alone, and leaves a spent action spent', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, action: 1 }, 0, 0)],
  });

  const refreshed = outcome(apply(CATALOGUE, city, aimedAtUnit(CITY)));

  expect(pointsOf(refreshed, 1)).toBe(2 * MOVE_POINT);
  expect(actionOf(refreshed, 1)).toBe(0);
});

test('the refresh instant is refused on a unit whose move points are full, its action spent', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_March'],
    units: [standing('player', CITY, { move: 2 * MOVE_POINT, action: 1 }, 2 * MOVE_POINT, 0)],
  });

  expect(stagedBy(city, aimedAtUnit(CITY))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, aimedAtUnit(CITY)))).toBe(city);
});

test('the heal instant heals one unit of the player’s to its kind’s health, and leaves its move points and its action as they stand', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_Heal'],
    units: [
      standing('player', CITY, { type: 'PH_Warrior', health: 1 }, MOVE_POINT, 0),
      standing('player', { q: 1, r: 1 }, { type: 'PH_Warrior', health: 1 }),
    ],
  });

  const stages = apply(CATALOGUE, city, aimedAtUnit(CITY));

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'healed']);
  expect(unitNamed(outcome(stages), 1).stats.health).toBe(unitKind(CATALOGUE, 'PH_Warrior').health);
  expect(unitNamed(outcome(stages), 2).stats.health).toBe(1);
  expect(pointsOf(outcome(stages), 1)).toBe(MOVE_POINT);
  expect(actionOf(outcome(stages), 1)).toBe(0);
});

test('the heal instant is refused on a unit at its kind’s health or above it, and its effect there changes nothing', () => {
  const full = unitKind(CATALOGUE, 'PH_Warrior').health;
  const above = { q: 1, r: 1 };
  const city = cityOf(['urban'], {
    tiles: field(3),
    hand: ['PH_Heal'],
    units: [
      standing('player', CITY, { type: 'PH_Warrior', health: full }),
      standing('player', above, { type: 'PH_Warrior', health: full + 1 }),
    ],
  });
  const card = aimedCard('PH_Heal');
  if (card.aim !== 'unit') throw new Error('the heal is aimed at no unit');

  expect(refusedFor(city, 'PH_Heal', CITY)).toBe('health-full');
  expect(refusedFor(city, 'PH_Heal', above)).toBe('health-full');
  expect(stagedBy(city, aimedAtUnit(CITY))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, aimedAtUnit(CITY)))).toBe(city);
  expect(card.effect(CATALOGUE, city, above)).toEqual({ stages: [], chronicle: city });
});

test('a chronicle begun on a civilization of the catalogue holds its cards and opens turn 1 on a full hand of them', () => {
  const civilization = civilizationOf(CATALOGUE, CIVILIZATION_ID);
  const chronicle = settledLaunch(CATALOGUE, AGE, REGION, 2026, civilization, []);

  expect(chronicle.hand).toHaveLength(5);
  expect(everyCard(chronicle)).toEqual([...civilization.cards].sort());
});

test('a settle card is refused on an uncharted tile, on a terrain its content takes no city on, and on a filled slot', () => {
  const rough = { q: 1, r: 0 };
  const camp = { q: 0, r: 1 };
  const out = { q: 3, r: 0 };
  const opened = opening(camped(madeOf(plains(3), 'mountain', [rough]), [camp]));

  expect(refusedFor(opened, 'PH_Settle', out)).toBe('tile-uncharted');
  expect(refusedFor(opened, 'PH_Settle', rough)).toBe('wrong-terrain');
  expect(refusedFor(opened, 'PH_Settle', camp)).toBe('slot-filled');
  expect(refusedFor(opened, 'PH_Settle', CITY)).toBeUndefined();
  for (const tile of [out, rough, camp]) {
    expect(admittedTiles(opened, 'PH_Settle').map(tileKey)).not.toContain(tileKey(tile));
    expect(stagedBy(opened, aimedAt(tile))).toEqual(['refused']);
  }
});

test('a settle card aimed at nothing is refused on a tile', () => {
  const opened = opening(plains(3), {
    civilization: { ...CIVILIZATION, cards: [], settle: ['PH_Stores'] },
  });

  expect(idsOf(opened.hand)).toEqual([CIVILIZATION.city.card, 'PH_Stores']);
  expect(stagedBy(opened, aimedAt(CITY, 1))).toEqual(['refused']);
});

/** A civilization whose settle section enters two workers beside the city section's card, and holds no card besides. */
const BANDS: Civilization = { ...CIVILIZATION, cards: [], settle: ['PH_Band', 'PH_Band'] };

test('a settle card entering a unit admits every charted tile the unit stands on with no unit on it, and no camp, a guard standing on each from the opening', () => {
  const rough = { q: 1, r: 0 };
  const camp = { q: 0, r: 1 };
  const out = { q: 3, r: 0 };
  const taken = { q: -1, r: 1 };
  const opened = opening(camped(madeOf(plains(3), 'mountain', [rough]), [camp]), {
    civilization: BANDS,
  });
  const entered = outcome(apply(CATALOGUE, opened, aimedAt(taken, 1)));

  expect(refusedFor(entered, 'PH_Band', out)).toBe('tile-uncharted');
  expect(refusedFor(entered, 'PH_Band', rough)).toBe('wrong-terrain');
  expect(refusedFor(entered, 'PH_Band', taken)).toBe('unit-standing');
  expect(refusedFor(entered, 'PH_Band', camp)).toBe('unit-standing');
  expect(admittedTiles(entered, 'PH_Band').map(tileKey).sort()).toEqual(
    entered.snapshots
      .filter((snapshot) => standsOn(CATALOGUE, CATALOGUE.units.PH_Worker, false, snapshot.tile))
      .filter((snapshot) => ![taken, camp].some((tile) => tileKey(snapshot) === tileKey(tile)))
      .map(tileKey)
      .sort(),
  );
  for (const tile of [out, rough, taken, camp]) {
    expect(stagedBy(entered, aimedAt(tile, 1))).toEqual(['refused']);
  }
});

test('a settle card entering a unit puts it on its tile full, takes no population and leaves the chronicle, before the settle and after it', () => {
  const at = { q: 1, r: 1 };
  const opened = opening(plains(3), { civilization: BANDS });

  const stages = apply(CATALOGUE, opened, aimedAt(at, 1));
  const before = outcome(stages);
  const settled = outcome(apply(CATALOGUE, before, aimedAt(CITY)));
  const after = outcome(apply(CATALOGUE, settled, aimedAt(CITY)));

  expect(namesOf(stages)).toEqual(['played', 'left', 'enter']);
  expect(before.units).toHaveLength(1);
  const [band] = before.units;
  expect(band.faction).toBe('player');
  expect(band.tile).toEqual(at);
  expect(band.stats).toEqual(CATALOGUE.units.PH_Worker);
  expect(band.movePoints).toBe(band.stats.move);
  expect(band.action).toBe(band.stats.action);
  expect(before.population).toBe(0);
  expect(idsOf(before.hand)).toEqual(['PH_Settle', 'PH_Band']);
  expect(before.discardPile).toEqual([]);

  expect(settled.city).toEqual(CITY);
  expect(after.units).toHaveLength(2);
  expect(after.units[1].tile).toEqual(CITY);
  expect(after.population).toBe(settled.population);
  expect(after.hand).toEqual([]);
  expect(after.discardPile).toEqual([]);
});

test('a unit entered on the settle phase neither moves nor attacks, and nothing is offered for it, until turn 1', () => {
  const warrior = { q: 1, r: 0 };
  const enemy = { q: 2, r: 0 };
  const onto = { q: 1, r: -1 };
  const opened = withUnits(opening(plains(3), { civilization: BANDS }), [
    standing('player', warrior),
    standing('enemy', enemy),
  ]);
  const entered = outcome(apply(CATALOGUE, opened, aimedAt({ q: 0, r: 1 }, 1)));

  for (const id of [1, 3]) {
    expect(byHand(CATALOGUE, entered, unitNamed(entered, id))).toEqual({
      landings: [],
      targets: [],
    });
    expect(stagedBy(entered, { type: 'move', unit: id, tile: onto })).toEqual(['refused']);
  }
  expect(stagedBy(entered, attackOn(1, enemy))).toEqual(['refused']);

  const settled = outcome(apply(CATALOGUE, entered, aimedAt({ q: -1, r: 0 })));
  const ticked = outcome(apply(CATALOGUE, settled, { type: 'end-turn' }));

  expect(ticked.turn).toBe(1);
  expect(byHand(CATALOGUE, ticked, unitNamed(ticked, 3)).landings.length).toBeGreaterThan(0);
  expect(stagedBy(ticked, { type: 'move', unit: 3, tile: onto })).toEqual(['move']);
  expect(stagedBy(ticked, attackOn(1, enemy))).toEqual(['attack', 'action-spent', 'damaged']);
});

test('a card whose effect names a building, an improvement or a terrain the catalogue lacks is refused where it lands', () => {
  const at = { q: 1, r: 0 };
  const onPlain = (catalogue: Catalogue, _chronicle: Chronicle, tile: Tile) =>
    made(catalogue, tile, ['plain']);
  const lacking = catalogued({
    ...CATALOGUE,
    cards: {
      ...CATALOGUE.cards,
      PH_Keep: {
        kind: 'building',
        cost: {},
        ...throughWorker(onPlain, (catalogue, paid, on) => built(catalogue, paid, on, 'PH_Keep')),
      },
      PH_Well: {
        kind: 'instant',
        cost: {},
        ...throughWorker(onPlain, (catalogue, paid, on) =>
          improvementPlaced(catalogue, paid, on, 'PH_Well'),
        ),
      },
      PH_Drain: {
        kind: 'instant',
        cost: {},
        ...throughWorker(onPlain, (catalogue, paid, on) =>
          terraformed(catalogue, paid, on, 'marsh'),
        ),
      },
    },
    cardAges: { ...CATALOGUE.cardAges, PH_Keep: AGE, PH_Well: AGE, PH_Drain: AGE },
  });

  for (const id of ['PH_Keep', 'PH_Well', 'PH_Drain']) {
    const city = workedTile(at, 'plain', { hand: [id] }, lacking);
    const card = aimOf(cardOf(lacking, id));
    if (card.aim !== 'tile') throw new Error(`${id} is aimed at no tile`);

    expect(admitted(lacking, city, card)).toContainEqual(at);
    expect(() => apply(lacking, city, aimedAt(at))).toThrow(/^fixture: /);
  }
});

test('a unit card turns one population into a unit on the city tile', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(after.population).toBe(city.population - 1);
  expect(after.units).toHaveLength(1);
  expect(after.units[0].tile).toEqual(CITY);
  expect(after.units[0].faction).toBe('player');
  expect(after.resources.food).toBe(0);
  expect(after.hand).toEqual([]);
  expect(idsOf(after.discardPile)).toEqual(['PH_Worker']);
});

test('a unit card is refused while a unit already stands on the city tile', () => {
  const crowded = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 2,
    units: [standing('player', CITY)],
    resources: { food: 2, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  expect(outcome(apply(CATALOGUE, crowded, { type: 'play', index: 0, aim: 'none' }))).toEqual(
    crowded,
  );
});

test('a building card builds its building on a tile inside the border where a worker stands', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  const after = outcome(apply(CATALOGUE, city, aimedAt({ q: 1, r: 0 })));

  expect(buildingAt(after, { q: 1, r: 0 })).toBe('PH_Farm');
  expect(after.resources.production).toBe(0);
  expect(after.hand).toEqual([]);
  expect(idsOf(after.discardPile)).toEqual(['PH_Farm']);
  expect(unitNamed(after, 1).tile).toEqual({ q: 1, r: 0 });
  expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
});

test('a building card is refused on a tile no worker stands on, and with no tile at all', () => {
  const city = cityOf(['urban', 'plain', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  expect(outcome(apply(CATALOGUE, city, aimedAt({ q: 2, r: 0 })))).toEqual(city);
  expect(outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }))).toEqual(city);
});

test('a building card is refused on a tile outside the border, worker standing or not', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  expect(outcome(apply(CATALOGUE, city, aimedAt({ q: 1, r: 0 })))).toEqual(city);
});

test('a building card cannot be played with no worker of the player’s inside the border', () => {
  const alone = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    resources: production(3),
  });
  const fighting = withUnits(alone, [standing('player', { q: 1, r: 0 })]);

  expect(refusedFor(alone, 'PH_Farm', { q: 1, r: 0 })).toBe('no-worker');
  expect(refusedFor(fighting, 'PH_Farm', { q: 1, r: 0 })).toBe('no-worker');
  expect(outcome(apply(CATALOGUE, alone, aimedAt({ q: 1, r: 0 })))).toEqual(alone);
});

test('a tile’s building slot takes one building and no more', () => {
  const city = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm', 'PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(6),
  });

  const once = endedTurn(outcome(apply(CATALOGUE, city, aimedAt({ q: 1, r: 0 }))));

  expect(outcome(apply(CATALOGUE, once, aimedAt({ q: 1, r: 0 })))).toEqual(once);
  expect(refusedFor(once, 'PH_Farm', { q: 1, r: 0 })).toBe('slot-filled');
});

test('the city fills its own tile’s slot, worker or no worker', () => {
  const bare = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Farm'],
    resources: production(3),
  });
  const city = withUnits(bare, [worker(CITY)]);
  const overOne = withUnits(bare, [worker({ q: 1, r: 0 })]);

  expect(buildingAt(city, CITY)).toBe('PH_City');
  expect(admittedTiles(city, 'PH_Farm')).toEqual([]);
  expect(outcome(apply(CATALOGUE, city, aimedAt(CITY)))).toEqual(city);
  // The city's own tile is urban, so the farm names the terrain before it ever reaches the slot.
  expect(refusedFor(city, 'PH_Farm', CITY)).toBe('wrong-terrain');
  expect(admittedTiles(overOne, 'PH_Farm')).toEqual([{ q: 1, r: 0 }]);
});

test('a farm stands on a plain and on no other terrain a worker reaches', () => {
  for (const terrain of ['forest', 'hills', 'urban'] as Terrain[]) {
    const city = cityOf(['urban', terrain], {
      hand: ['PH_Farm'],
      units: [worker({ q: 1, r: 0 })],
      resources: production(3),
    });

    expect(admittedTiles(city, 'PH_Farm')).toEqual([]);
    expect(refusedFor(city, 'PH_Farm', { q: 1, r: 0 })).toBe('wrong-terrain');
    expect(outcome(apply(CATALOGUE, city, aimedAt({ q: 1, r: 0 })))).toEqual(city);
  }
});

test('a farm standing on a tile adds its food to what that tile yields at income', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    tiles: field(2),
    hand: ['PH_Farm'],
    units: [worker({ q: 1, r: 0 })],
    resources: production(3),
  });

  const bare = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const built = outcome(apply(CATALOGUE, city, aimedAt({ q: 1, r: 0 })));
  const farmed = outcome(apply(CATALOGUE, built, { type: 'end-turn' }));

  expect(farmed.resources.food).toBe(bare.resources.food + 1);
});

test('the mine card places a mine on the hills a worker stands on, inside the border and outside it', () => {
  for (const at of [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]) {
    const city = workedTile(at, 'hills', { hand: ['PH_Mine'], resources: production(3) });

    const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

    expect(tileAt(after.tiles, at)?.improvements).toEqual(['PH_Mine']);
    expect(after.resources.production).toBe(0);
    expect(after.hand).toEqual([]);
    expect(idsOf(after.discardPile)).toEqual(['PH_Mine']);
    expect(unitNamed(after, 1).tile).toEqual(at);
    expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
  }
});

test('the mine card is refused on a tile no worker of the player’s stands on', () => {
  const at = { q: 1, r: 0 };
  const bare = workedTile(at, 'hills', {
    hand: ['PH_Mine'],
    resources: production(3),
    units: [],
  });
  const fighting = withUnits(bare, [standing('player', at)]);

  expect(admittedTiles(bare, 'PH_Mine')).toEqual([]);
  expect(refusedFor(bare, 'PH_Mine', at)).toBe('no-worker');
  expect(refusedFor(fighting, 'PH_Mine', at)).toBe('no-worker');
  expect(outcome(apply(CATALOGUE, bare, aimedAt(at)))).toEqual(bare);
  expect(outcome(apply(CATALOGUE, fighting, aimedAt(at)))).toEqual(fighting);
});

test('a unit that is not a worker, with action left, is refused every card played through a worker', () => {
  const at = { q: 1, r: 0 };
  const cards: [CardId, Terrain][] = [
    ['PH_Farm', 'plain'],
    ['PH_Mine', 'hills'],
    ['PH_Road', 'plain'],
    ['PH_Urbanisation', 'plain'],
  ];
  for (const [id, terrain] of cards) {
    const tiles = madeOf(field(2), terrain, [at]);
    const fighting = ringed(2, { tiles, units: [standing('player', at)] });
    const worked = ringed(2, { tiles, units: [worker(at)] });

    expect(actionOf(fighting, 1)).toBeGreaterThan(0);
    expect(refusedFor(fighting, id, at)).toBe('no-worker');
    expect(refusedFor(worked, id, at)).toBeUndefined();
  }
});

test('the mine card is refused on every terrain but the hills it goes on', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['plain', 'forest', 'mountain', 'coast', 'deep', 'urban'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Mine'], resources: production(3) });

    expect(admittedTiles(city, 'PH_Mine')).toEqual([]);
    expect(refusedFor(city, 'PH_Mine', at)).toBe(
      standsOn(CATALOGUE, WORKER_STATS, false, tileAt(city.tiles, at))
        ? 'wrong-terrain'
        : 'no-worker',
    );
    expect(outcome(apply(CATALOGUE, city, aimedAt(at)))).toEqual(city);
  }
});

test('a tile takes the same improvement once and never a second time', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    hand: ['PH_Mine', 'PH_Mine'],
    resources: production(6),
  });

  const once = endedTurn(outcome(apply(CATALOGUE, city, aimedAt(at))));

  expect(admittedTiles(once, 'PH_Mine')).toEqual([]);
  expect(refusedFor(once, 'PH_Mine', at)).toBe('improvement-placed');
  expect(outcome(apply(CATALOGUE, once, aimedAt(at)))).toEqual(once);
});

test('a mine placed on a tile adds its production to what that tile yields at income', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    ...NO_GROWTH,
    hand: ['PH_Mine'],
    resources: production(3),
  });

  const bare = outcome(
    apply(CATALOGUE, { ...city, resources: production(0) }, { type: 'end-turn' }),
  );
  const mined = outcome(
    apply(CATALOGUE, outcome(apply(CATALOGUE, city, aimedAt(at))), { type: 'end-turn' }),
  );

  expect(mined.resources.production).toBe(bare.resources.production + 1);
});

test('the road card places a road on every terrain a worker of the player’s stands on', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['plain', 'forest', 'hills', 'urban'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Road'], resources: production(2) });

    const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

    expect(admittedTiles(city, 'PH_Road')).toEqual([at]);
    expect(tileAt(after.tiles, at)?.improvements).toEqual(['PH_Road']);
    expect(after.resources.production).toBe(0);
    expect(idsOf(after.discardPile)).toEqual(['PH_Road']);
    expect(unitNamed(after, 1).tile).toEqual(at);
    expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
  }
});

test('the road card is refused on the ground no worker of the player’s stands on', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['mountain', 'coast', 'deep'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Road'], resources: production(2) });

    expect(admittedTiles(city, 'PH_Road')).toEqual([]);
    expect(refusedFor(city, 'PH_Road', at)).toBe('no-worker');
    expect(outcome(apply(CATALOGUE, city, aimedAt(at)))).toEqual(city);
  }
});

test('the urbanisation card terraforms the plain a worker stands on, inside the border and outside it', () => {
  for (const at of [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]) {
    const city = workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) });

    const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

    expect(tileAt(after.tiles, at)?.terrain).toBe('urban');
    expect(after.resources.production).toBe(0);
    expect(idsOf(after.discardPile)).toEqual(['PH_Urbanisation']);
    expect(unitNamed(after, 1).tile).toEqual(at);
    expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
  }
});

test('a terraformed tile loses its feature and every improvement not naming the new terrain, and keeps the ones that do', () => {
  const at = { q: 1, r: 0 };
  const city = withTile(
    workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) }),
    { ...at, terrain: 'plain', feature: 'PH_Fertile', improvements: ['PH_Mine', 'PH_Road'] },
  );

  const after = tileAt(outcome(apply(CATALOGUE, city, aimedAt(at))).tiles, at);

  expect(after?.terrain).toBe('urban');
  expect(after?.feature).toBeUndefined();
  expect(after?.improvements).toEqual(['PH_Road']);
});

test('an event’s terraform removes the building that does not stand on the new terrain, and keeps the one that does', () => {
  const upheaval = dealing({ turn: 2, event: 'PH_Upheaval' });
  const farmed = cityOf(['urban', 'plain'], {
    ...upheaval,
    tiles: builtOn(field(2), 'PH_Farm', [UPHEAVAL]),
  });
  const camp = cityOf(['urban', 'plain'], { ...upheaval, tiles: camped(field(2), [UPHEAVAL]) });

  const razed = tileAt(endedTurn(farmed, 'PH_Quake').tiles, UPHEAVAL);
  const kept = tileAt(endedTurn(camp, 'PH_Quake').tiles, UPHEAVAL);

  expect(buildingAt(farmed, UPHEAVAL)).toBe('PH_Farm');
  expect(razed?.terrain).toBe('forest');
  expect(razed?.building).toBeUndefined();
  expect(kept?.terrain).toBe('forest');
  expect(kept?.building).toBe(CAMP.building);
});

test('a terraform leaves the rivers where they run: a river lies on no tile', () => {
  const at = { q: 1, r: 0 };
  /** A river along the edges of the tile that is terraformed: five corners of its own hexagon. */
  const river = cornersOf(at).slice(0, 5);
  const city = workedTile(at, 'plain', {
    hand: ['PH_Urbanisation'],
    resources: production(5),
    rivers: [river],
  });

  const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

  expect(tileAt(after.tiles, at)?.terrain).toBe('urban');
  expect(after.rivers).toEqual([river]);
});

test('a worker’s terraform removes the building that does not stand on the new terrain', () => {
  const at = { q: 1, r: 0 };
  const city = withTile(
    workedTile(at, 'plain', { hand: ['PH_Urbanisation'], resources: production(5) }),
    { ...at, terrain: 'plain', improvements: [], building: 'PH_Farm' },
  );

  const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

  expect(admittedTiles(city, 'PH_Urbanisation')).toEqual([at]);
  expect(tileAt(after.tiles, at)?.terrain).toBe('urban');
  expect(buildingAt(after, at)).toBeUndefined();
});

test('a worker’s terraform is refused for the faction on a camp’s tile until the camp is captured', () => {
  const at = { q: 2, r: 0 };
  const camp = ringed(2, {
    tiles: camped(field(2), [at]),
    hand: ['PH_Urbanisation'],
    resources: production(5),
    units: [worker(at)],
  });

  const captured = endedTurn(camp);

  expect(refusedFor(camp, 'PH_Urbanisation', at)).toBe('other-faction');
  expect(outcome(apply(CATALOGUE, camp, aimedAt(at)))).toEqual(camp);
  expect(buildingAt(captured, at)).toBeUndefined();
  expect(refusedFor(captured, 'PH_Urbanisation', at)).toBeUndefined();
});

/**
 * The fixture's content with the city's building standing on forest besides urban, and a terraform
 * into `to` three ways: a card played through a worker, a card aimed at any tile and refusing none,
 * and the upheaval's quake landing on the city's tile.
 */
function reshaping(to: Terrain): Catalogue {
  const { PH_Upheaval } = CATALOGUE.events;
  return catalogued({
    ...CATALOGUE,
    cards: {
      ...CATALOGUE.cards,
      PH_Sink: {
        kind: 'instant',
        cost: {},
        ...throughWorker(
          (catalogue, chronicle, tile) => terraformable(catalogue, chronicle, tile, to),
          (catalogue, paid, at) => terraformed(catalogue, paid, at, to),
        ),
      },
      PH_Collapse: {
        kind: 'instant',
        cost: {},
        aim: 'tile',
        refuses: () => undefined,
        effect: (catalogue, paid, at) => terraformed(catalogue, paid, at, to),
      },
    },
    cardAges: { ...CATALOGUE.cardAges, PH_Sink: AGE, PH_Collapse: AGE },
    events: {
      ...CATALOGUE.events,
      PH_Upheaval: {
        answers: {
          ...PH_Upheaval.answers,
          PH_Quake: {
            ...PH_Upheaval.answers.PH_Quake,
            lands: (catalogue, chronicle) => terraformed(catalogue, chronicle, CITY, to),
          },
        },
      },
    },
    buildings: {
      ...CATALOGUE.buildings,
      PH_City: { ...CATALOGUE.buildings.PH_City, terrains: ['urban', 'forest'] },
    },
  });
}

/** A city on a disc out to two, dealt the upheaval at the end of its turn. */
function upheaved(carrying: Carrying = {}): Chronicle {
  return cityOf(['urban', 'plain'], {
    tiles: field(2),
    ...dealing({ turn: 2, event: 'PH_Upheaval' }),
    ...carrying,
  });
}

test('an event’s terraform reaches the city’s tile into a terrain the city’s building stands on, building and all', () => {
  const catalogue = reshaping('forest');
  const city = upheaved();

  const after = endedTurn(city, 'PH_Quake', catalogue);

  expect(tileAt(after.tiles, CITY)?.terrain).toBe('forest');
  expect(buildingAt(after, CITY)).toBe('PH_City');
  expect(after.city).toEqual(CITY);
});

test('an event’s terraform into a terrain the city’s building does not stand on passes the city’s tile over, and kills nobody there', () => {
  const catalogue = reshaping('coast');
  const bare = upheaved({ units: [standing('player', CITY)] });
  const city = withTile(bare, {
    ...CITY,
    terrain: 'urban',
    improvements: ['PH_Road'],
    building: 'PH_City',
  });

  const after = endedTurn(city, 'PH_Quake', catalogue);

  expect(tileAt(after.tiles, CITY)).toEqual(tileAt(city.tiles, CITY));
  expect(after.units).toEqual(city.units);
});

test('a worker’s terraform of the city’s tile is admitted into a terrain the city’s building stands on, and refused for the terrain into one it does not', () => {
  const forest = reshaping('forest');
  const plain = reshaping('plain');
  const city = cityOf(
    ['urban'],
    { tiles: field(2), hand: ['PH_Sink'], units: [worker(CITY)] },
    forest,
  );

  const forested = outcome(apply(forest, city, aimedAt(CITY)));

  expect(refusedFor(city, 'PH_Sink', CITY, forest)).toBeUndefined();
  expect(tileAt(forested.tiles, CITY)?.terrain).toBe('forest');
  expect(buildingAt(forested, CITY)).toBe('PH_City');
  expect(unitNamed(forested, 1).tile).toEqual(CITY);
  expect(refusedFor(city, 'PH_Sink', CITY, plain)).toBe('wrong-terrain');
  expect(outcome(apply(plain, city, aimedAt(CITY)))).toEqual(city);
});

test('a unit standing on a tile terraformed into a terrain it cannot stand on is killed, whatever its faction', () => {
  const at = { q: 1, r: 0 };
  const catalogue = reshaping('mountain');
  for (const faction of ['player', 'enemy'] as const) {
    const city = ringed(2, { hand: ['PH_Collapse'], units: [standing(faction, at)] }, catalogue);

    const after = outcome(apply(catalogue, city, aimedAt(at)));

    expect(tileAt(after.tiles, at)?.terrain).toBe('mountain');
    expect(after.units).toEqual([]);
    expect(after.population).toBe(city.population);
  }
});

test('a unit standing on a tile terraformed into a terrain it can stand on stays standing', () => {
  const at = { q: 1, r: 0 };
  const catalogue = reshaping('mountain');
  const city = ringed(
    2,
    { hand: ['PH_Collapse'], units: [standing('player', at, { move: 6 * MOVE_POINT })] },
    catalogue,
  );

  const after = outcome(apply(catalogue, city, aimedAt(at)));

  expect(tileAt(after.tiles, at)?.terrain).toBe('mountain');
  expect(after.units).toEqual(city.units);
});

test('an embarked unit standing on a tile terraformed into one embarked units do not enter is killed, ground it stands on ashore included', () => {
  const at = { q: 1, r: 0 };
  const catalogue = reshaping('plain');
  const city = ringed(
    2,
    {
      tiles: field(2, [at]),
      hand: ['PH_Embark', 'PH_Collapse'],
      units: [standing('player', CITY)],
    },
    catalogue,
  );
  const embarked = outcome(apply(catalogue, city, aimedAt(at)));

  const after = outcome(apply(catalogue, embarked, aimedAt(at)));

  expect(unitNamed(embarked, 1).tile).toEqual(at);
  expect(tileAt(after.tiles, at)?.terrain).toBe('plain');
  expect(after.units).toEqual([]);
});

test('the worker that terraforms its own tile into a terrain it cannot stand on is killed', () => {
  const at = { q: 1, r: 0 };
  const catalogue = reshaping('coast');
  const city = ringed(2, { hand: ['PH_Sink'], units: [worker(at)] }, catalogue);

  const after = outcome(apply(catalogue, city, aimedAt(at)));

  expect(tileAt(after.tiles, at)?.terrain).toBe('coast');
  expect(after.units).toEqual([]);
  expect(idsOf(after.discardPile)).toEqual(['PH_Sink']);
});

test('the urbanisation card is refused on every terrain but the plain it terraforms', () => {
  const at = { q: 1, r: 0 };
  for (const terrain of ['forest', 'hills', 'mountain', 'coast', 'deep', 'urban'] as Terrain[]) {
    const city = workedTile(at, terrain, { hand: ['PH_Urbanisation'], resources: production(5) });

    expect(admittedTiles(city, 'PH_Urbanisation')).toEqual([]);
    expect(refusedFor(city, 'PH_Urbanisation', at)).toBe(
      standsOn(CATALOGUE, WORKER_STATS, false, tileAt(city.tiles, at))
        ? 'wrong-terrain'
        : 'no-worker',
    );
    expect(outcome(apply(CATALOGUE, city, aimedAt(at)))).toEqual(city);
  }
});

test('a terraformed tile yields its new terrain at the next income', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'plain', {
    ...NO_GROWTH,
    hand: ['PH_Urbanisation'],
    resources: production(5),
  });

  const bare = outcome(
    apply(CATALOGUE, { ...city, resources: production(0) }, { type: 'end-turn' }),
  );
  const urban = outcome(
    apply(CATALOGUE, outcome(apply(CATALOGUE, city, aimedAt(at))), { type: 'end-turn' }),
  );

  for (const resource of RESOURCES) {
    expect(urban.resources[resource]).toBe(
      bare.resources[resource] -
        (terrainKind(CATALOGUE, 'plain').yields[resource] ?? 0) +
        (terrainKind(CATALOGUE, 'urban').yields[resource] ?? 0),
    );
  }
});

test('a unit card never takes the city’s last population', () => {
  const last = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    population: 1,
    resources: FOOD,
  });
  const idling = { ...last, population: 2 };

  expect(playable(refusalOf(CATALOGUE, last, 'PH_Worker'))).toBe(false);
  expect(outcome(apply(CATALOGUE, last, { type: 'play', index: 0, aim: 'none' }))).toEqual(last);
  expect(
    outcome(apply(CATALOGUE, idling, { type: 'play', index: 0, aim: 'none' })).population,
  ).toBe(1);
});

test('a unit card is refused for the population when only the city’s last population is left', () => {
  const last = cityOf(['urban'], { tiles: field(2), population: 1, assigned: [] });

  expect(idle(last)).toBe(1);
  expect(refusalOf(CATALOGUE, last, 'PH_Worker').blocked).toEqual(['population']);
});

test('a unit card refused for the population and for the idle population names both', () => {
  const last = cityOf(['urban'], { tiles: field(2), population: 1 });

  expect(idle(last)).toBe(0);
  expect(refusalOf(CATALOGUE, last, 'PH_Worker').blocked).toEqual(['population', 'idle']);
});

test('a unit card is refused for the city while a unit of the player’s stands on it', () => {
  const held = cityOf(['urban', 'plain'], {
    tiles: field(2),
    population: 3,
    units: [worker(CITY)],
  });

  expect(refusalOf(CATALOGUE, held, 'PH_Worker').blocked).toEqual(['city']);
});

test('a unit card refused for the population and for the city names both', () => {
  const both = cityOf(['urban'], {
    tiles: field(2),
    population: 1,
    assigned: [],
    units: [worker(CITY)],
  });

  expect(refusalOf(CATALOGUE, both, 'PH_Worker').blocked).toEqual(['population', 'city']);
});

test('a unit card takes one idle population, and is refused while every one is assigned', () => {
  const full = cityOf(['urban', 'plain'], {
    tiles: field(2),
    hand: ['PH_Worker'],
    resources: FOOD,
  });
  const freed = outcome(apply(CATALOGUE, full, assignTo({ q: 1, r: 0 })));

  expect(idle(full)).toBe(0);
  expect(refusalOf(CATALOGUE, full, 'PH_Worker').blocked).toEqual(['idle']);
  expect(outcome(apply(CATALOGUE, full, { type: 'play', index: 0, aim: 'none' }))).toEqual(full);

  const entered = outcome(apply(CATALOGUE, freed, { type: 'play', index: 0, aim: 'none' }));

  expect(entered.population).toBe(freed.population - 1);
  expect(entered.assigned).toEqual(freed.assigned);
  expect(entered.units).toHaveLength(1);
});

test('a building card with nowhere to stand is playable all the same, and every tile refuses it', () => {
  const at = { q: 1, r: 0 };
  const alone = cityOf(['urban', 'plain'], { tiles: field(2) });
  const worked = withUnits(alone, [worker(at)]);

  expect(admittedTiles(alone, 'PH_Farm')).toEqual([]);
  expect(refusalOf(CATALOGUE, alone, 'PH_Farm').blocked).toEqual([]);
  expect(refusedFor(alone, 'PH_Farm', at)).toBe('no-worker');
  expect(admittedTiles(worked, 'PH_Farm')).toEqual([at]);
  expect(refusalOf(CATALOGUE, worked, 'PH_Farm').blocked).toEqual([]);
});

test('every card the map answers for is playable whatever the map holds, and blocked only by its cost', () => {
  const empty = cityOf(['urban'], { tiles: field(2), resources: production(3) });

  for (const id of ['PH_Farm', 'PH_March', 'PH_Mine', 'PH_Road', 'PH_Urbanisation']) {
    expect(admittedTiles(empty, id)).toEqual([]);
    expect(refusalOf(CATALOGUE, empty, id).blocked).toEqual([]);
  }
  expect(playable(refusalOf(CATALOGUE, empty, 'PH_Farm'))).toBe(true);
  expect(playable(refusalOf(CATALOGUE, empty, 'PH_March'))).toBe(true);
  expect(playable(refusalOf(CATALOGUE, empty, 'PH_Urbanisation'))).toBe(false);
});

test('a card played through a worker spends one of that worker’s action, whichever card it is', () => {
  const at = { q: 1, r: 0 };
  const plays: [CardId, Terrain, number][] = [
    ['PH_Farm', 'plain', 3],
    ['PH_Mine', 'hills', 3],
    ['PH_Road', 'plain', 2],
    ['PH_Urbanisation', 'plain', 5],
  ];
  for (const [id, terrain, cost] of plays) {
    const city = workedTile(at, terrain, { hand: [id], resources: production(cost) });

    const after = outcome(apply(CATALOGUE, city, aimedAt(at)));

    expect(idsOf(after.discardPile)).toEqual([id]);
    expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
  }
});

test('a card played through a worker spends the move points that worker has left, and a step after it is refused', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'plain', { hand: ['PH_Road'], resources: production(2) });

  const paved = outcome(apply(CATALOGUE, city, aimedAt(at)));

  expect(pointsOf(city, 1)).toBeGreaterThan(0);
  expect(pointsOf(paved, 1)).toBe(0);
  expect(stagedBy(paved, { type: 'move', unit: 1, tile: CITY })).toEqual(['refused']);
});

test('a worker with no action left refuses the next card played through it, and lights no tile for it', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    hand: ['PH_Mine', 'PH_Road'],
    resources: production(5),
  });

  const mined = outcome(apply(CATALOGUE, city, aimedAt(at)));

  expect(actionOf(mined, 1)).toBe(0);
  expect(refusedFor(mined, 'PH_Road', at)).toBe('worker-spent');
  expect(admittedTiles(mined, 'PH_Road')).toEqual([]);
  expect(stagedBy(mined, aimedAt(at))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, mined, aimedAt(at)))).toBe(mined);
});

test('the turn refreshes a worker’s action, and the card it refused lands on the next turn', () => {
  const at = { q: 1, r: 0 };
  const city = workedTile(at, 'hills', {
    ...NO_GROWTH,
    hand: ['PH_Mine', 'PH_Road'],
    resources: production(5),
  });

  const ticked = endedTurn(outcome(apply(CATALOGUE, city, aimedAt(at))));
  const road = idsOf(ticked.hand).indexOf('PH_Road');

  expect(road).not.toBe(-1);
  expect(actionOf(ticked, 1)).toBe(actionOf(city, 1));
  expect(refusedFor(ticked, 'PH_Road', at)).toBeUndefined();

  const after = outcome(apply(CATALOGUE, ticked, aimedAt(at, road)));

  expect(tileAt(after.tiles, at)?.improvements).toEqual(['PH_Mine', 'PH_Road']);
});

test('the refresh instant leaves a worker’s spent action spent, and the card refused on it refused', () => {
  const at = { q: 1, r: 0 };
  const city = ringed(2, {
    tiles: madeOf(field(2), 'hills', [at]),
    hand: ['PH_Mine', 'PH_March', 'PH_Road'],
    resources: production(5),
    units: [worker(CITY)],
  });

  const moved = outcome(apply(CATALOGUE, city, { type: 'move', unit: 1, tile: at }));
  const mined = outcome(apply(CATALOGUE, moved, aimedAt(at)));
  const refreshed = outcome(apply(CATALOGUE, mined, aimedAtUnit(at)));

  expect(pointsOf(moved, 1)).toBeLessThan(WORKER_STATS.move);
  expect(pointsOf(mined, 1)).toBe(0);
  expect(pointsOf(refreshed, 1)).toBe(WORKER_STATS.move);
  expect(idsOf(refreshed.discardPile)).toEqual(['PH_Mine', 'PH_March']);
  expect(actionOf(refreshed, 1)).toBe(0);
  expect(refusedFor(refreshed, 'PH_Road', at)).toBe('worker-spent');
});

test('the farm card names the first of its five reasons: worker, action, terrain, border, then slot', () => {
  const at = { q: 1, r: 0 };
  const out = { q: 2, r: 0 };
  const hilly = ringed(2, {
    tiles: madeOf(field(2), 'hills', [at, out]),
    hand: ['PH_Road'],
    resources: production(2),
  });
  const flat = ringed(2, { tiles: madeOf(field(2), 'plain', [at, out]) });
  const worked = withUnits(flat, [worker(at)]);
  const filled = withTile(worked, {
    ...at,
    terrain: 'plain',
    improvements: [],
    building: 'PH_Farm',
  });

  expect(refusedFor(hilly, 'PH_Farm', out)).toBe('no-worker');
  expect(refusedFor(withUnits(hilly, [worker(out)]), 'PH_Farm', out)).toBe('wrong-terrain');
  expect(refusedFor(withUnits(hilly, [worker(at)]), 'PH_Farm', at)).toBe('wrong-terrain');
  expect(
    refusedFor(
      outcome(apply(CATALOGUE, withUnits(hilly, [worker(at)]), aimedAt(at))),
      'PH_Farm',
      at,
    ),
  ).toBe('worker-spent');
  expect(refusedFor(withUnits(flat, [worker(out)]), 'PH_Farm', out)).toBe('outside-border');
  expect(refusedFor(filled, 'PH_Farm', at)).toBe('slot-filled');
  expect(refusedFor(worked, 'PH_Farm', at)).toBeUndefined();
});

/** The fixture's content with a card that works the map: through a worker, outside the border. */
const FORAGING: Catalogue = catalogued({
  ...CATALOGUE,
  cards: {
    ...CATALOGUE.cards,
    PH_Forage: {
      kind: 'instant',
      cost: {},
      ...throughWorker(
        (_catalogue, chronicle, tile) => outside(chronicle, tile),
        (catalogue, paid, on) => yielded(catalogue, paid, on),
      ),
    },
  },
  cardAges: { ...CATALOGUE.cardAges, PH_Forage: AGE },
});

test('the forage card names the first of its three reasons: worker, action, then held', () => {
  const at = { q: 1, r: 0 };
  const out = { q: 2, r: 0 };
  const bare = ringed(2, { hand: ['PH_Road'], resources: production(2) });
  const held = withUnits(bare, [worker(at)]);
  const beyond = withUnits(bare, [worker(out)]);

  expect(refusedFor(bare, 'PH_Forage', at, FORAGING)).toBe('no-worker');
  expect(refusedFor(bare, 'PH_Forage', out, FORAGING)).toBe('no-worker');
  expect(refusedFor(held, 'PH_Forage', at, FORAGING)).toBe('inside-border');
  expect(
    refusedFor(outcome(apply(FORAGING, beyond, aimedAt(out))), 'PH_Forage', out, FORAGING),
  ).toBe('worker-spent');
  expect(refusedFor(beyond, 'PH_Forage', out, FORAGING)).toBeUndefined();
});

test('the forage card played on a tile that gives nothing spends the worker’s action and gains nothing', () => {
  const out = { q: 2, r: 0 };
  const barren = catalogued({
    ...FORAGING,
    terrains: { ...FORAGING.terrains, hills: { ...FORAGING.terrains.hills, yields: {} } },
  });
  const city = workedTile(out, 'hills', { hand: ['PH_Forage'] }, barren);

  const after = outcome(apply(barren, city, aimedAt(out)));

  expect(idsOf(after.discardPile)).toEqual(['PH_Forage']);
  expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
  expect(after.resources).toEqual(city.resources);
});

test('the mine card names the first of its four reasons: worker, action, terrain, then improvement', () => {
  const at = { q: 1, r: 0 };
  const plain = ringed(2, { hand: ['PH_Road'], resources: production(2) });
  const hills = ringed(2, { tiles: madeOf(field(2), 'hills', [at]) });
  const worked = withUnits(hills, [worker(at)]);
  const mined = withTile(worked, { ...at, terrain: 'hills', improvements: ['PH_Mine'] });

  expect(refusedFor(plain, 'PH_Mine', at)).toBe('no-worker');
  expect(
    refusedFor(
      withTile(hills, { ...at, terrain: 'hills', improvements: ['PH_Mine'] }),
      'PH_Mine',
      at,
    ),
  ).toBe('no-worker');
  expect(refusedFor(withUnits(plain, [worker(at)]), 'PH_Mine', at)).toBe('wrong-terrain');
  expect(
    refusedFor(
      outcome(apply(CATALOGUE, withUnits(plain, [worker(at)]), aimedAt(at))),
      'PH_Mine',
      at,
    ),
  ).toBe('worker-spent');
  expect(refusedFor(mined, 'PH_Mine', at)).toBe('improvement-placed');
  expect(refusedFor(worked, 'PH_Mine', at)).toBeUndefined();
});

test('a card removing a feature takes it off the tile the worker stands on, inside the border and outside it, and leaves every other layer standing', () => {
  for (const at of [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ]) {
    const city = withTile(workedTile(at, 'plain', { hand: ['PH_Hunt'] }), {
      ...at,
      terrain: 'plain',
      feature: 'PH_Fertile',
      improvements: ['PH_Road'],
    });
    const others = (chronicle: Chronicle): Tile[] =>
      chronicle.tiles.filter((tile) => tileKey(tile) !== tileKey(at));

    const stages = apply(CATALOGUE, city, aimedAt(at));
    const after = outcome(stages);

    expect(namesOf(stages)).toEqual(['played', 'discarded', 'action-spent', 'retiled']);
    expect(tileAt(after.tiles, at)).toEqual({ ...at, terrain: 'plain', improvements: ['PH_Road'] });
    expect(others(after)).toEqual(others(city));
    expect(unitNamed(after, 1).tile).toEqual(at);
    expect(actionOf(after, 1)).toBe(actionOf(city, 1) - 1);
    expect(featureRemoved(CATALOGUE, after, at).stages).toEqual([]);
  }
});

test('a card asking for one feature of several names the first of its reasons: worker, action, then feature', () => {
  const at = { q: 1, r: 0 };
  const bare = ringed(2);
  const carrying = (terrain: Terrain, feature?: FeatureId): Chronicle =>
    withTile(bare, { ...at, terrain, feature, improvements: [] });
  const worked = (terrain: Terrain, feature?: FeatureId): Chronicle =>
    withUnits(carrying(terrain, feature), [worker(at)]);
  const spent = withUnits(carrying('plain', 'PH_Fertile'), [
    standing('player', at, WORKER_STATS, 0, 0),
  ]);

  expect(refusedFor(carrying('plain', 'PH_Fertile'), 'PH_Hunt', at)).toBe('no-worker');
  expect(refusedFor(spent, 'PH_Hunt', at)).toBe('worker-spent');
  expect(refusedFor(worked('plain'), 'PH_Hunt', at)).toBe('wrong-feature');
  expect(refusedFor(worked('hills', 'PH_Flint'), 'PH_Hunt', at)).toBe('wrong-feature');
  expect(refusedFor(worked('plain', 'PH_Fertile'), 'PH_Hunt', at)).toBeUndefined();
  expect(refusedFor(worked('forest', 'PH_Game'), 'PH_Hunt', at)).toBeUndefined();
});

test('an improvement naming a feature names the first of its reasons: worker, action, the feature whatever the terrain, then improvement', () => {
  const at = { q: 2, r: 0 };
  const bare = ringed(2);
  const carrying = (
    terrain: Terrain,
    feature?: FeatureId,
    improvements: string[] = [],
  ): Chronicle => withTile(bare, { ...at, terrain, feature, improvements });
  const worked = (terrain: Terrain, feature?: FeatureId, improvements?: string[]): Chronicle =>
    withUnits(carrying(terrain, feature, improvements), [worker(at)]);
  const spent = withUnits(carrying('forest', 'PH_Game'), [
    standing('player', at, WORKER_STATS, 0, 0),
  ]);

  expect(refusedFor(carrying('forest', 'PH_Game'), 'PH_Snare', at)).toBe('no-worker');
  expect(refusedFor(spent, 'PH_Snare', at)).toBe('worker-spent');
  expect(refusedFor(worked('forest'), 'PH_Snare', at)).toBe('wrong-feature');
  expect(refusedFor(worked('plain'), 'PH_Snare', at)).toBe('wrong-feature');
  expect(refusedFor(worked('plain', 'PH_Fertile'), 'PH_Snare', at)).toBe('wrong-feature');
  expect(refusedFor(worked('forest', 'PH_Game', ['PH_Snare']), 'PH_Snare', at)).toBe(
    'improvement-placed',
  );
  expect(refusedFor(worked('forest', 'PH_Game'), 'PH_Snare', at)).toBeUndefined();
});

test('the snare card places a snare on the game the worker stands on, and the game stays', () => {
  const at = { q: 2, r: 0 };
  const city = withTile(
    workedTile(at, 'forest', { hand: ['PH_Snare'], resources: production(2) }),
    {
      ...at,
      terrain: 'forest',
      feature: 'PH_Game',
      improvements: [],
    },
  );

  const after = tileAt(outcome(apply(CATALOGUE, city, aimedAt(at))).tiles, at);

  expect(after).toEqual({
    ...at,
    terrain: 'forest',
    feature: 'PH_Game',
    improvements: ['PH_Snare'],
  });
});

test('a building naming a feature names the first of its reasons: worker, action, the feature whatever the terrain, border, then slot', () => {
  const inside = { q: 1, r: 0 };
  const out = { q: 2, r: 0 };
  const worked = (at: TileCoords, terrain: Terrain, feature?: FeatureId, building?: string) =>
    withUnits(withTile(ringed(2), { ...at, terrain, feature, improvements: [], building }), [
      worker(at),
    ]);

  expect(refusedFor(worked(inside, 'forest'), 'PH_Lodge', inside)).toBe('wrong-feature');
  expect(refusedFor(worked(inside, 'plain', 'PH_Fertile'), 'PH_Lodge', inside)).toBe(
    'wrong-feature',
  );
  expect(refusedFor(worked(out, 'forest', 'PH_Game'), 'PH_Lodge', out)).toBe('outside-border');
  expect(refusedFor(worked(inside, 'forest', 'PH_Game', CAMP.building), 'PH_Lodge', inside)).toBe(
    'slot-filled',
  );
  expect(refusedFor(worked(inside, 'forest', 'PH_Game'), 'PH_Lodge', inside)).toBeUndefined();
});

test('a building naming two features is built on a tile carrying either, refused on one carrying neither, and removed with the one it stands on', () => {
  const at = { q: 1, r: 0 };
  const carrying = (terrain: Terrain, hand: CardId[], feature?: FeatureId, building?: string) =>
    withTile(workedTile(at, terrain, { hand, resources: production(3) }), {
      ...at,
      terrain,
      feature,
      improvements: [],
      building,
    });

  expect(refusedFor(carrying('forest', ['PH_Smokehouse']), 'PH_Smokehouse', at)).toBe(
    'wrong-feature',
  );
  expect(refusedFor(carrying('hills', ['PH_Smokehouse'], 'PH_Flint'), 'PH_Smokehouse', at)).toBe(
    'wrong-feature',
  );
  for (const [terrain, feature] of [
    ['forest', 'PH_Game'],
    ['plain', 'PH_Fertile'],
  ] as const) {
    const city = carrying(terrain, ['PH_Smokehouse'], feature);
    const smoked = carrying(terrain, ['PH_Hunt'], feature, 'PH_Smokehouse');

    expect(tileAt(outcome(apply(CATALOGUE, city, aimedAt(at))).tiles, at)).toEqual({
      ...at,
      terrain,
      feature,
      improvements: [],
      building: 'PH_Smokehouse',
    });
    expect(tileAt(outcome(apply(CATALOGUE, smoked, aimedAt(at))).tiles, at)).toEqual({
      ...at,
      terrain,
      improvements: [],
    });
  }
});

test('an improvement naming the river names the first of its reasons: worker, action, the river whatever the terrain, terrain, then improvement', () => {
  const at = { q: 2, r: 0 };
  const along = [riverBetween(at, { q: 2, r: -1 })];
  const away = [riverBetween({ q: -2, r: 0 }, { q: -2, r: 1 })];
  const carrying = (terrain: Terrain, rivers: River[], improvements: string[] = []): Chronicle =>
    withTile(ringed(2, { rivers }), { ...at, terrain, improvements });
  const worked = (terrain: Terrain, rivers: River[], improvements?: string[]): Chronicle =>
    withUnits(carrying(terrain, rivers, improvements), [worker(at)]);
  const spent = withUnits(carrying('plain', along), [standing('player', at, WORKER_STATS, 0, 0)]);

  expect(refusedFor(carrying('plain', along), 'PH_Ditch', at)).toBe('no-worker');
  expect(refusedFor(spent, 'PH_Ditch', at)).toBe('worker-spent');
  expect(refusedFor(worked('plain', away), 'PH_Ditch', at)).toBe('no-river');
  expect(refusedFor(worked('hills', away), 'PH_Ditch', at)).toBe('no-river');
  expect(refusedFor(worked('hills', along), 'PH_Ditch', at)).toBe('wrong-terrain');
  expect(refusedFor(worked('plain', along, ['PH_Ditch']), 'PH_Ditch', at)).toBe(
    'improvement-placed',
  );
  expect(refusedFor(worked('plain', along), 'PH_Ditch', at)).toBeUndefined();
  expect(refusedFor(worked('forest', along), 'PH_Ditch', at)).toBeUndefined();
});

test('the ditch card places a ditch on the tile a river runs along that the worker stands on', () => {
  const at = { q: 2, r: 0 };
  const city = workedTile(at, 'plain', {
    hand: ['PH_Ditch'],
    resources: production(2),
    rivers: [riverBetween(at, { q: 2, r: -1 })],
  });

  const after = tileAt(outcome(apply(CATALOGUE, city, aimedAt(at))).tiles, at);

  expect(after).toEqual({ ...at, terrain: 'plain', improvements: ['PH_Ditch'] });
});

test('a building naming the river names the first of its reasons: the river whatever the terrain, terrain, border, then slot', () => {
  const inside = { q: 1, r: 0 };
  const out = { q: 2, r: 0 };
  const along = [riverBetween(inside, { q: 1, r: -1 }), riverBetween(out, { q: 2, r: -1 })];
  const worked = (at: TileCoords, terrain: Terrain, rivers: River[], building?: string) =>
    withUnits(withTile(ringed(2, { rivers }), { ...at, terrain, improvements: [], building }), [
      worker(at),
    ]);

  expect(refusedFor(worked(inside, 'plain', []), 'PH_Mill', inside)).toBe('no-river');
  expect(refusedFor(worked(inside, 'hills', []), 'PH_Mill', inside)).toBe('no-river');
  expect(refusedFor(worked(inside, 'hills', along), 'PH_Mill', inside)).toBe('wrong-terrain');
  expect(refusedFor(worked(out, 'plain', along), 'PH_Mill', out)).toBe('outside-border');
  expect(refusedFor(worked(inside, 'plain', along, CAMP.building), 'PH_Mill', inside)).toBe(
    'slot-filled',
  );
  expect(refusedFor(worked(inside, 'plain', along), 'PH_Mill', inside)).toBeUndefined();
});

/**
 * A tile carrying the game, the snare and the lodge that go with it and the road that does not,
 * with a worker of the player's standing on it.
 */
function trapped(at: TileCoords, carrying: Carrying = {}, catalogue = CATALOGUE): Chronicle {
  return withTile(workedTile(at, 'forest', carrying, catalogue), {
    ...at,
    terrain: 'forest',
    feature: 'PH_Game',
    improvements: ['PH_Snare', 'PH_Road'],
    building: 'PH_Lodge',
  });
}

test('a card removing a feature removes every layer naming it in the one change of its tile, and leaves the others', () => {
  const at = { q: 1, r: 0 };
  const city = trapped(at, { hand: ['PH_Hunt'] });

  const stages = apply(CATALOGUE, city, aimedAt(at));

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'action-spent', 'retiled']);
  expect(tileAt(outcome(stages).tiles, at)).toEqual({
    ...at,
    terrain: 'forest',
    improvements: ['PH_Road'],
  });
});

test('a terraform into a terrain a layer naming a feature names removes that layer with the feature', () => {
  const quaked = endedTurn(
    trapped(UPHEAVAL, dealing({ turn: 2, event: 'PH_Upheaval' })),
    'PH_Quake',
  );

  expect(tileAt(quaked.tiles, UPHEAVAL)).toEqual({
    ...UPHEAVAL,
    terrain: 'forest',
    improvements: ['PH_Road'],
  });
});

test('a feature placed over another removes every layer naming the one it replaces', () => {
  const at = { q: 1, r: 0 };
  const swarming = catalogued({
    ...CATALOGUE,
    features: { ...CATALOGUE.features, PH_Hive: { terrain: 'forest', yields: {} } },
    cards: {
      ...CATALOGUE.cards,
      PH_Swarm: {
        kind: 'instant',
        cost: {},
        ...throughWorker(
          () => undefined,
          (catalogue, paid, on) => featurePlaced(catalogue, paid, on, 'PH_Hive'),
        ),
      },
    },
    cardAges: { ...CATALOGUE.cardAges, PH_Swarm: AGE },
  });
  const city = trapped(at, { hand: ['PH_Swarm'] }, swarming);

  const after = tileAt(outcome(apply(swarming, city, aimedAt(at))).tiles, at);

  expect(after).toEqual({
    ...at,
    terrain: 'forest',
    feature: 'PH_Hive',
    improvements: ['PH_Road'],
  });
});

test('the urbanisation card names the first of its four reasons: worker, action, terrain, then faction', () => {
  const at = { q: 1, r: 0 };
  const plain = ringed(2);
  const forest = ringed(2, {
    tiles: madeOf(field(2), 'forest', [at]),
    hand: ['PH_Road'],
    resources: production(2),
  });
  const built = withTile(plain, { ...at, terrain: 'plain', improvements: [], building: 'PH_Farm' });
  const worked = withUnits(plain, [worker(at)]);
  const wooded = withUnits(forest, [worker(at)]);
  const filled = withUnits(built, [worker(at)]);
  const camp = withUnits(
    withTile(plain, {
      ...at,
      terrain: 'plain',
      improvements: [],
      building: CAMP.building,
    }),
    [worker(at)],
  );

  expect(refusedFor(plain, 'PH_Urbanisation', at)).toBe('no-worker');
  expect(refusedFor(forest, 'PH_Urbanisation', at)).toBe('no-worker');
  expect(refusedFor(wooded, 'PH_Urbanisation', at)).toBe('wrong-terrain');
  expect(refusedFor(outcome(apply(CATALOGUE, wooded, aimedAt(at))), 'PH_Urbanisation', at)).toBe(
    'worker-spent',
  );
  expect(refusedFor(built, 'PH_Urbanisation', at)).toBe('no-worker');
  expect(refusedFor(camp, 'PH_Urbanisation', at)).toBe('other-faction');
  expect(refusedFor(filled, 'PH_Urbanisation', at)).toBeUndefined();
  expect(refusedFor(worked, 'PH_Urbanisation', at)).toBeUndefined();
});

test('a card aimed at a unit admits the tiles the player’s units stand on, and no others', () => {
  const spent = { q: 1, r: 0 };
  const held = { q: 2, r: 0 };
  const city = ringed(2, {
    units: [
      standing('player', spent, { move: 2 * MOVE_POINT }, MOVE_POINT),
      standing('enemy', held, { move: 2 * MOVE_POINT }, MOVE_POINT),
    ],
  });

  expect(admittedTiles(city, 'PH_March')).toEqual([spent]);
  expect(refusedFor(city, 'PH_March', held)).toBe('no-unit');
  expect(refusedFor(city, 'PH_March', { q: 0, r: 1 })).toBe('no-unit');
  expect(admittedTiles(ringed(2), 'PH_March')).toEqual([]);
});

test('a card aimed at a unit lands on the play that aims at a unit, and nowhere on one that aims at a tile', () => {
  const at = { q: 1, r: 0 };
  const city = ringed(2, {
    hand: ['PH_March'],
    units: [standing('player', at, { move: 2 * MOVE_POINT }, MOVE_POINT)],
  });

  expect(stagedBy(city, aimedAt(at))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, aimedAt(at)))).toBe(city);
  expect(stagedBy(city, aimedAtUnit(at))).toEqual(['played', 'discarded', 'refreshed']);
  expect(pointsOf(outcome(apply(CATALOGUE, city, aimedAtUnit(at))), 1)).toBe(2 * MOVE_POINT);
});

test('the refresh instant names the first of its two reasons: the unit, then its move points', () => {
  const at = { q: 1, r: 0 };
  const bare = ringed(2);
  const enemy = withUnits(bare, [standing('enemy', at)]);
  const full = withUnits(bare, [worker(at)]);
  const spent = withUnits(bare, [standing('player', at, { move: 2 * MOVE_POINT }, MOVE_POINT)]);

  expect(refusedFor(bare, 'PH_March', at)).toBe('no-unit');
  expect(refusedFor(enemy, 'PH_March', at)).toBe('no-unit');
  expect(refusedFor(full, 'PH_March', at)).toBe('move-full');
  expect(refusedFor(spent, 'PH_March', at)).toBeUndefined();
});

test('a card’s aim admits exactly the tiles of the map it names no reason for', () => {
  const worked = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const city = ringed(2, { units: worked.map(worker) });

  const lit = admittedTiles(city, 'PH_Farm');

  expect(lit.map(tileKey).sort()).toEqual(worked.map(tileKey).sort());
  for (const tile of city.tiles) {
    expect(refusedFor(city, 'PH_Farm', tile) === undefined).toBe(
      lit.some((coord) => tileKey(coord) === tileKey(tile)),
    );
  }
});

test('a play aimed at a tile the aim refuses, or at nothing, lands nowhere', () => {
  const at = { q: 1, r: 0 };
  const city = ringed(2, { hand: ['PH_Farm'], resources: production(3) });

  const aimed = apply(CATALOGUE, city, aimedAt(at));
  const nowhere = apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' });

  expect(refusedFor(city, 'PH_Farm', at)).toBe('no-worker');
  expect(namesOf(aimed)).toEqual(['refused']);
  expect(outcome(aimed)).toEqual(city);
  expect(namesOf(nowhere)).toEqual(['refused']);
  expect(outcome(nowhere)).toEqual(city);
});

test('a hazard strikes at the end of a turn it is still in the hand, before the income and the discard', () => {
  const stocked = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Hunger', 'PH_Harvest'],
    drawPile: fullDraw(),
    resources: STOCKED,
  });
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);

  const ended = outcome(apply(CATALOGUE, stocked, { type: 'end-turn' }));
  const yielded = outcome(apply(CATALOGUE, bare, { type: 'end-turn' })).resources.food;

  expect(stagedBy(stocked, { type: 'end-turn' })[0]).toBe('strike');
  expect(yielded).toBeGreaterThan(0);
  expect(ended.resources.food).toBe(yielded);
  expect(idsOf(ended.hand)).toEqual(fullDraw());
  expect(idsOf(ended.discardPile)).toEqual(['PH_Hunger', 'PH_Harvest']);
});

test('a hazard discarded unplayed comes around and strikes again', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Hunger'],
    resources: { ...STOCKED, food: 3 * HUNGER },
  });
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);

  const cycled = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const again = outcome(apply(CATALOGUE, cycled, { type: 'end-turn' }));
  const yielded = outcome(apply(CATALOGUE, bare, { type: 'end-turn' })).resources.food;

  expect(idsOf(cycled.hand)).toEqual(['PH_Hunger']);
  expect(idsOf(again.hand)).toEqual(['PH_Hunger']);
  expect(cycled.resources.food).toBe(3 * HUNGER - HUNGER + yielded);
  expect(again.resources.food).toBe(cycled.resources.food - HUNGER + yielded);
});

test('a hazard played for its cost leaves the chronicle, and strikes nothing that turn', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Hunger'],
    resources: STOCKED,
  });
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);

  const played = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));
  const ended = outcome(apply(CATALOGUE, played, { type: 'end-turn' }));
  const yielded = outcome(apply(CATALOGUE, bare, { type: 'end-turn' })).resources.food;

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual([
    'played',
    'left',
    'stock',
  ]);
  expect(played.resources.production).toBe(0);
  expect(everyCard(played)).toEqual([]);
  expect(stagedBy(played, { type: 'end-turn' })).not.toContain('strike');
  expect(ended.resources.food).toBe(STOCKED.food + yielded);
});

test('a hazard strikes from the hand alone, and never from a pile', () => {
  const piled = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    drawPile: ['PH_Hunger'],
    discardPile: ['PH_Hunger'],
    resources: STOCKED,
  });
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);

  const ended = outcome(apply(CATALOGUE, piled, { type: 'end-turn' }));
  const yielded = outcome(apply(CATALOGUE, bare, { type: 'end-turn' })).resources.food;

  expect(stagedBy(piled, { type: 'end-turn' })).not.toContain('strike');
  expect(ended.resources.food).toBe(STOCKED.food + yielded);
});

test('a hazard’s strike takes what it names off the stock, and a strike that outruns the stock leaves nothing', () => {
  const stockOf = (food: number): Chronicle =>
    cityOf(['urban', 'plain'], {
      ...NO_GROWTH,
      hand: ['PH_Hunger'],
      resources: { ...STOCKED, food },
    });
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);

  const outrun = outcome(apply(CATALOGUE, stockOf(HUNGER - 1), { type: 'end-turn' }));
  const spared = outcome(apply(CATALOGUE, stockOf(HUNGER + 1), { type: 'end-turn' }));
  const yielded = outcome(apply(CATALOGUE, bare, { type: 'end-turn' })).resources.food;

  expect(outrun.resources.food).toBe(yielded);
  expect(spared.resources.food).toBe(1 + yielded);
});

/** Turn 2 of a city dealt the cold, `answer` taken: the frost it added drawn into the hand. */
function chilled(answer: string): Chronicle {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    resources: { ...STOCKED, food: 3 * FREEZE },
    ...dealing({ turn: 2, event: 'PH_Cold' }),
  });
  return endedTurn(city, answer);
}

test('a card added with its counter set carries the value set, and its strike takes that value', () => {
  const frozen = chilled('PH_Freeze');
  const [strike] = strikesOf(frozen);

  expect(frozen.hand).toEqual([{ id: 'PH_Frost', counters: { amount: FREEZE } }]);
  expect(strike.left.resources.food).toBe(frozen.resources.food - FREEZE);
});

test('a card added with no counter set carries the value its content starts it at, and its strike takes that value', () => {
  const chill = chilled('PH_Chill');
  const [strike] = strikesOf(chill);

  expect(chill.hand).toEqual([{ id: 'PH_Frost', counters: { amount: FROST } }]);
  expect(strike.left.resources.food).toBe(chill.resources.food - FROST);
});

test('a card added with a counter its content does not declare is refused', () => {
  expect(() => chilled('PH_Thaw')).toThrow('fixture: the card PH_Frost declares no counter thaw');
});

test('a hazard whose strike reads a counter its card does not declare is refused when it strikes', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Squall'],
    resources: STOCKED,
  });

  expect(() => apply(CATALOGUE, city, { type: 'end-turn' })).toThrow(
    'fixture: the card PH_Squall declares no counter amount',
  );
});

/** The `strike` groups the end of turn opens on: the hazard each carries, and what it holds. */
function strikesOf(city: Chronicle): { card: CardId; holds: string[]; left: Chronicle }[] {
  return apply(CATALOGUE, city, { type: 'end-turn' }).flatMap((stage) =>
    stage.kind === 'group' && stage.name === 'strike'
      ? [{ card: stage.card, holds: namesOf(stage.stages), left: stage.chronicle }]
      : [],
  );
}

test('every hazard in hand strikes as one strike of its own, in hand order, each on what the one before it left', () => {
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Drought', 'PH_Warrior', 'PH_Hunger'],
    resources: { ...STOCKED, food: HUNGER + DROUGHT },
  });

  const strikes = strikesOf(city);

  expect(strikes.map(({ card, holds }) => ({ card, holds }))).toEqual([
    { card: 'PH_Drought', holds: ['stock'] },
    { card: 'PH_Hunger', holds: ['stock'] },
  ]);
  expect(strikes.map(({ left }) => left.resources.food)).toEqual([HUNGER, 0]);
  expect(stagedBy(city, { type: 'end-turn' }).slice(0, 5)).toEqual([
    'strike',
    'stock',
    'strike',
    'stock',
    'discarded',
  ]);
});

test('a hazard whose strike moves nothing still strikes, holding nothing', () => {
  const bare = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Hunger'],
    resources: { ...STOCKED, food: 0 },
  });

  const [strike] = strikesOf(bare);

  expect(strike.card).toBe('PH_Hunger');
  expect(strike.holds).toEqual([]);
  expect(strike.left.resources).toEqual(bare.resources);
  expect(stagedBy(bare, { type: 'end-turn' })[0]).toBe('strike');
});

/** A city with the drought in its hand and that much food for it to strike. */
function droughty(food: number, carrying: Carrying = {}): Chronicle {
  return cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    hand: ['PH_Drought'],
    resources: { ...STOCKED, food },
    ...carrying,
  });
}

/** The chronicle the city's hazards left on striking at the end of its turn. A turn striking nothing throws. */
function stricken(city: Chronicle): Chronicle {
  const strike = [...walked(apply(CATALOGUE, city, { type: 'end-turn' }))].find(
    (stage) => stage.name === 'strike',
  );
  if (strike === undefined) throw new Error('the end of turn strikes nothing');
  return strike.chronicle;
}

test('a strike the stock covers takes no population, the stock covering it exactly no exception', () => {
  const exact = droughty(DROUGHT);
  const spared = droughty(DROUGHT + 1);

  expect(stricken(exact).resources.food).toBe(0);
  expect(stricken(exact).population).toBe(exact.population);
  expect(stricken(spared).resources.food).toBe(1);
  expect(stricken(spared).population).toBe(spared.population);
});

test('a strike the stock cannot cover empties the stock and takes one population besides', () => {
  const short = droughty(DROUGHT - 1);

  expect(stricken(short).resources.food).toBe(0);
  expect(stricken(short).population).toBe(short.population - 1);
});

test('a strike taking the city’s last population falls on the strike, and no step of the end of turn follows it', () => {
  const last = droughty(DROUGHT - 1, { population: 1, assigned: [CITY], drawPile: fullDraw() });
  const ended = outcome(apply(CATALOGUE, last, { type: 'end-turn' }));

  expect(stagedBy(last, { type: 'end-turn' })).toEqual([
    'strike',
    'stock',
    'assigned',
    'population',
    'ended',
  ]);
  const [strike] = apply(CATALOGUE, last, { type: 'end-turn' });
  if (strike.kind !== 'group') throw new Error('the end of turn opens on no strike');
  const fell = strike.stages[strike.stages.length - 1];
  expect(fell.chronicle.ending).toEqual(ended.ending);
  expect(strike.chronicle).toBe(fell.chronicle);
  expect(ended.population).toBe(0);
  expect(ended.resources.food).toBe(0);
  expect(idsOf(ended.hand)).toEqual(['PH_Drought']);
  expect(ended.ending).toEqual({ outcome: 'defeat', cause: 'population', turn: last.turn });
});

test('a card the city falls short for is refused for the resource it is short of', () => {
  const short = cityOf(['urban', 'plain'], { resources: production(2) });
  const paid = { ...short, resources: production(3) };

  expect(refusalOf(CATALOGUE, short, 'PH_Farm').unaffordable).toEqual(['production']);
  expect(refusalOf(CATALOGUE, paid, 'PH_Farm')).toEqual({ unaffordable: [], blocked: [] });
});

test('a card embarks a unit of the player’s ashore beside a charted, free tile embarked units enter, the unit spending its action and moving on the card’s move: refused for each of those in that order', () => {
  const coast = { q: 1, r: 0 };
  const onward = { q: 2, r: 0 };
  const far = { q: 6, r: 0 };
  const deep = { q: 0, r: 1 };
  const lonely = { q: -2, r: 2 };
  const spent = { q: -2, r: 0 };
  const shore = { q: -3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: madeOf(field(6, [coast, onward, far, lonely, shore]), 'deep', [deep]),
    hand: ['PH_Embark', 'PH_Embark'],
    units: [standing('player', CITY), standing('player', spent, {}, undefined, 0)],
  });
  const shallow = changed({
    cards: { ...CATALOGUE.cards, PH_Embark: { kind: 'instant', cost: {}, ...embarks(0) } },
  });

  expect(refusedFor(city, 'PH_Embark', far)).toBe('tile-uncharted');
  expect(refusedFor(city, 'PH_Embark', { q: 1, r: 1 })).toBe('wrong-terrain');
  expect(refusedFor(city, 'PH_Embark', deep)).toBe('wrong-terrain');
  expect(refusedFor(city, 'PH_Embark', lonely)).toBe('no-unit-beside');
  expect(refusedFor(city, 'PH_Embark', coast, shallow)).toBe('wrong-terrain');
  expect(refusedFor(city, 'PH_Embark', shore)).toBe('unit-spent');
  expect(refusedFor(city, 'PH_Embark', coast)).toBeUndefined();

  const stages = apply(CATALOGUE, city, aimedAt(coast));
  const embarked = outcome(stages);

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'action-spent', 'move']);
  expect(unitNamed(embarked, 1)).toEqual({
    ...unitNamed(city, 1),
    tile: coast,
    embarked: true,
    stats: { ...unitNamed(city, 1).stats, move: EMBARKED_MOVE },
    action: 0,
    movePoints: 0,
  });
  expect(refusedFor(embarked, 'PH_Embark', coast)).toBe('unit-standing');
  expect(refusedFor(embarked, 'PH_Embark', onward)).toBe('no-unit-beside');
});

test('a card disembarks an embarked unit of the player’s beside a charted, free tile it stands on ashore, spending its action: refused for each of those in that order, and the unit’s move is its own again, its damage, range and health as they were', () => {
  const coast = { q: 1, r: 0 };
  const ashore = { q: 2, r: 0 };
  const wet = { q: 2, r: -1 };
  const held = { q: 1, r: -1 };
  const peak = { q: 1, r: 1 };
  const slinger = standing('enemy', { q: 3, r: 0 }, { move: 0, range: 2, damage: 1 });
  const city = cityOf(['urban'], {
    tiles: madeOf(field(6, [coast, wet]), 'mountain', [peak]),
    hand: ['PH_Embark'],
    drawPile: ['PH_Disembark'],
    units: [standing('player', CITY), standing('player', held, {}, undefined, 0), slinger],
  });
  const before = unitNamed(city, 1);
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(coast)));
  const ticked = outcome(apply(CATALOGUE, embarked, { type: 'end-turn' }));

  expect(refusedFor(embarked, 'PH_Disembark', ashore)).toBe('unit-spent');
  expect(refusedFor(ticked, 'PH_Disembark', { q: -6, r: 0 })).toBe('tile-uncharted');
  expect(refusedFor(ticked, 'PH_Disembark', wet)).toBe('wrong-terrain');
  expect(refusedFor(ticked, 'PH_Disembark', held)).toBe('unit-standing');
  expect(refusedFor(ticked, 'PH_Disembark', { q: -1, r: 0 })).toBe('no-embarked-beside');
  expect(refusedFor(ticked, 'PH_Disembark', peak)).toBe('wrong-terrain');
  expect(refusedFor(ticked, 'PH_Disembark', ashore)).toBeUndefined();

  const stages = apply(CATALOGUE, ticked, aimedAt(ashore));
  const disembarked = unitNamed(outcome(stages), 1);

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'action-spent', 'move']);
  expect(disembarked.tile).toEqual(ashore);
  expect(disembarked.embarked).toBe(false);
  expect(disembarked.stats).toEqual({
    ...before.stats,
    move: CATALOGUE.units.PH_Warrior.move,
    health: before.stats.health - 1,
  });
  expect(disembarked.action).toBe(0);
});

test('a worker embarked plays a card through itself where the card’s own reasons admit its tile', () => {
  const coast = { q: 1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(2, [coast]),
    hand: ['PH_Embark'],
    drawPile: ['PH_Weir'],
    units: [worker(CITY)],
  });
  const embarked = outcome(apply(CATALOGUE, city, aimedAt(coast)));
  const ticked = outcome(apply(CATALOGUE, embarked, { type: 'end-turn' }));

  const stages = apply(CATALOGUE, ticked, aimedAt(coast));

  expect(namesOf(stages)).toEqual(['played', 'discarded', 'action-spent', 'retiled']);
  expect(tileAt(outcome(stages).tiles, coast)?.improvements).toEqual(['PH_Weir']);
});

test('a tile several units could embark onto is lit and refused with no unit named, and played through the one of them named', () => {
  const coast = { q: 1, r: 0 };
  const other = { q: 1, r: -1 };
  const away = { q: -1, r: 0 };
  const city = cityOf(['urban'], {
    tiles: field(2, [coast]),
    hand: ['PH_Embark'],
    units: [standing('player', CITY), standing('player', other), standing('player', away)],
  });
  const through = (tile: TileCoords): Command => ({
    type: 'play',
    index: 0,
    aim: 'tile',
    tile: coast,
    through: tile,
  });
  const tile = tileAt(city.tiles, coast);
  if (tile === undefined) throw new Error('the coast is no tile of the map');

  expect(refusedFor(city, 'PH_Embark', coast)).toBeUndefined();
  expect(playedThrough(CATALOGUE, city, aimedCard('PH_Embark'), tile).map(({ id }) => id)).toEqual([
    1, 2,
  ]);
  expect(stagedBy(city, aimedAt(coast))).toEqual(['refused']);
  expect(stagedBy(city, through(away))).toEqual(['refused']);

  const played = outcome(apply(CATALOGUE, city, through(other)));

  expect(unitNamed(played, 2)).toMatchObject({ tile: coast, embarked: true });
  expect(unitNamed(played, 1)).toEqual(unitNamed(city, 1));
});
