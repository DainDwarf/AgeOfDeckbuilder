import { expect, test } from 'vitest';
import {
  apply,
  beginChronicle,
  type Command,
  cityCommand,
  cityDrag,
  claimable,
  growthThreshold,
  outcome,
  tileCost,
  tileRefusal,
} from './chronicle';
import {
  assignTo,
  buildingAt,
  CITY,
  camped,
  cityOf,
  claimOf,
  culture,
  everyCard,
  field,
  founded,
  fullDraw,
  NO_GROWTH,
  stagedBy,
  standing,
  withTile,
  worker,
} from './fixtures';
import {
  BUILDINGS,
  cornersOf,
  distance,
  FEATURES,
  IMPROVEMENTS,
  MOVE_POINT,
  neighbours,
  RIVER_YIELDS,
  TERRAIN_YIELDS,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { RESOURCES } from './resources';
import { seedRng } from './rng';
import { type CardId, type Chronicle, idle } from './state';

/** The deck the foundings below are played on: two of each card, enough to draw a hand and cycle. */
const DECK: readonly CardId[] = [
  'PH_Worker',
  'PH_Worker',
  'PH_Warrior',
  'PH_Warrior',
  'PH_Farm',
  'PH_Farm',
  'PH_March',
  'PH_March',
  'PH_Harvest',
  'PH_Harvest',
];

/** The command a drag in city mode sends: the inhabitant off one tile and onto another. */
function reassignTo(from: TileCoords, to: TileCoords): Command {
  return { type: 'reassign', from, to };
}

/** A tile of a generated map that touches the border and has never been in sight. */
function unchartedTouching(chronicle: Chronicle): TileCoords {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  const found = chronicle.tiles.find(
    (tile) => distance(tile, chronicle.city) === 2 && !seen.has(tileKey(tile)),
  );
  if (found === undefined) throw new Error('every tile touching this border has been in sight');
  return { q: found.q, r: found.r };
}

/**
 * The chronicle with a worker entered and stepped onto a tile between the city and `tile`, from
 * where it charts it.
 */
function withWorkerBeside(chronicle: Chronicle, tile: TileCoords): Chronicle {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1) throw new Error('this hand holds no worker to enter');
  const entered = outcome(apply(chronicle, { type: 'play', index: at, aim: 'none' }));
  const worker = entered.units[entered.units.length - 1];
  const between = neighbours(entered.city).find((coord) => distance(coord, tile) === 1);
  if (between === undefined) throw new Error(`no tile of the border touches ${tileKey(tile)}`);
  return outcome(apply(entered, { type: 'move', unit: worker.id, tile: between }));
}

test('the same seed founds the same chronicle', () => {
  expect(beginChronicle(1234, DECK)).toEqual(beginChronicle(1234, DECK));
  expect(beginChronicle(1235, DECK)).not.toEqual(beginChronicle(1234, DECK));
});

test('a chronicle survives JSON and carries its generator on', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(JSON.parse(JSON.stringify(chronicle))).toEqual(chronicle);
  expect(chronicle.rng).not.toEqual(seedRng(chronicle.seed));
});

test('the city holds its own tile and every tile touching it', () => {
  for (const seed of [0, 1234, 0xdeadbeef | 0]) {
    const chronicle = beginChronicle(seed, DECK);
    const held = new Set(chronicle.held.map(tileKey));

    expect(held.size).toBe(7);
    for (const tile of chronicle.tiles) {
      expect(held.has(tileKey(tile))).toBe(distance(tile, chronicle.city) <= 1);
    }
  }
});

test('a chronicle opens on turn one, with empty stores and more inhabitants than tiles', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect(chronicle.turn).toBe(1);
  for (const resource of RESOURCES) expect(chronicle.resources[resource]).toBe(0);
  expect(chronicle.population).toBe(chronicle.held.length + 2);
});

test('income yields every tile inside the border, and nothing outside it', () => {
  const inside: Terrain[] = ['urban', 'plain', 'forest', 'hills', 'mountain', 'coast'];

  const after = outcome(apply(cityOf(inside, NO_GROWTH), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    const yielded = inside.reduce(
      (total, terrain) => total + (TERRAIN_YIELDS[terrain][resource] ?? 0),
      0,
    );
    expect(after.resources[resource]).toBe(yielded);
  }
});

test('a second tile of the same terrain yields as much again', () => {
  const once = outcome(apply(cityOf(['forest'], NO_GROWTH), { type: 'end-turn' }));
  const twice = outcome(apply(cityOf(['forest', 'forest'], NO_GROWTH), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(twice.resources[resource]).toBe(once.resources[resource] * 2);
  }
});

test('an assigned tile yields what all four of its layers declare, summed', () => {
  const layered: Tile = {
    q: 1,
    r: 0,
    terrain: FEATURES.PH_Fertile.terrain,
    feature: 'PH_Fertile',
    improvements: ['PH_Mine'],
    building: 'PH_Farm',
  };
  const city = cityOf(['urban', layered.terrain], NO_GROWTH);

  const after = outcome(apply(withTile(city, layered), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      (TERRAIN_YIELDS.urban[resource] ?? 0) +
        (BUILDINGS.PH_City.yields[resource] ?? 0) +
        (TERRAIN_YIELDS[layered.terrain][resource] ?? 0) +
        (FEATURES.PH_Fertile.yields[resource] ?? 0) +
        (IMPROVEMENTS.PH_Mine.yields[resource] ?? 0) +
        (BUILDINGS.PH_Farm.yields[resource] ?? 0),
    );
  }
});

test('a river running along a tile gives it one food at income, however many edges it runs along', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(apply(cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }));

  for (const river of [around.slice(0, 2), around.slice(0, 4)]) {
    const city = cityOf(['urban', 'plain'], { ...NO_GROWTH, rivers: [river] });

    const after = outcome(apply(city, { type: 'end-turn' }));

    for (const resource of RESOURCES) {
      expect(after.resources[resource]).toBe(
        bare.resources[resource] + (RIVER_YIELDS.plain?.[resource] ?? 0),
      );
    }
  }
});

test('two rivers meeting at a tile give it the one food between them', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(apply(cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }));
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    rivers: [around.slice(1, 3), around.slice(2, 4)],
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      bare.resources[resource] + (RIVER_YIELDS.plain?.[resource] ?? 0),
    );
  }
});

test('a river running along a terrain it feeds nothing gives that tile nothing', () => {
  const at = { q: 1, r: 0 };
  const bare = outcome(apply(cityOf(['urban', 'hills'], NO_GROWTH), { type: 'end-turn' }));
  const city = cityOf(['urban', 'hills'], { ...NO_GROWTH, rivers: [cornersOf(at).slice(0, 2)] });

  const after = outcome(apply(city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(bare.resources[resource]);
  }
});

test('resources accumulate over consecutive turns', () => {
  const city = cityOf(['urban', 'plain', 'hills'], NO_GROWTH);

  const first = outcome(apply(city, { type: 'end-turn' }));
  const second = outcome(apply(first, { type: 'end-turn' }));
  const third = outcome(apply(second, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(third.resources[resource]).toBe(first.resources[resource] * 3);
  }
});

test('ending the turn moves the chronicle on to the next one', () => {
  const city = cityOf(['urban']);
  const second = outcome(apply(city, { type: 'end-turn' }));

  expect(second.turn).toBe(2);
  expect(outcome(apply(second, { type: 'end-turn' })).turn).toBe(3);
});

test('a food stock short of the growth threshold grows nobody, and the stock is kept', () => {
  const city = cityOf(['urban', 'plain', 'coast'], NO_GROWTH);

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population);
  expect(after.resources.food).toBe(3);
  expect(stagedBy(city, { type: 'end-turn' })).not.toContain('grow');
});

test('the food stock reaching the growth threshold is spent on one inhabitant, and that one is idle', () => {
  const city = cityOf(['urban', 'plain'], {
    population: 3,
    resources: { food: 1, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(0);
  expect(after.assigned).toEqual(city.assigned);
  expect(idle(after)).toBe(idle(city) + 1);
});

test('the growth threshold is the food the next inhabitant needs: one short of it grows nobody', () => {
  const city = cityOf(['urban', 'plain'], { population: 5, assigned: [] });
  const stocked = (food: number): Chronicle => ({
    ...city,
    resources: { ...city.resources, food },
  });

  const short = outcome(apply(stocked(growthThreshold(city) - 1), { type: 'end-turn' }));
  const reached = outcome(apply(stocked(growthThreshold(city)), { type: 'end-turn' }));

  expect(short.population).toBe(city.population);
  expect(short.resources.food).toBe(growthThreshold(city) - 1);
  expect(reached.population).toBe(city.population + 1);
  expect(reached.resources.food).toBe(0);
});

test('a food stock worth several growth thresholds grows one inhabitant and no more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 9, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(7);
});

test('the growth threshold widens with the population: the next inhabitant costs one food more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 5, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const first = outcome(apply(city, { type: 'end-turn' }));
  const second = outcome(apply(first, { type: 'end-turn' }));

  expect(first.population).toBe(3);
  expect(first.resources.food).toBe(3);
  expect(second.population).toBe(4);
  expect(second.resources.food).toBe(0);
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

test('the city in its slot adds nothing to what the tile it stands on yields', () => {
  const founded = outcome(apply(cityOf(['urban'], { tiles: field(1) }), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(founded.resources[resource]).toBe(TERRAIN_YIELDS.urban[resource] ?? 0);
  }
});

test('the founding puts an inhabitant on every tile the city holds, and leaves two idle', () => {
  const chronicle = beginChronicle(1234, DECK);

  expect([...chronicle.assigned].map(tileKey).sort()).toEqual(
    [...chronicle.held].map(tileKey).sort(),
  );
  expect(idle(chronicle)).toBe(2);
});

test('an assign takes the inhabitant off a tile, and a second one puts it back', () => {
  const city = cityOf(['urban', 'plain']);
  const tile = { q: 1, r: 0 };

  const off = outcome(apply(city, assignTo(tile)));
  const back = outcome(apply(off, assignTo(tile)));

  expect(stagedBy(city, assignTo(tile))).toEqual(['assign']);
  expect(off.assigned.map(tileKey)).toEqual(['0,0']);
  expect(idle(off)).toBe(1);
  expect(back.assigned.map(tileKey).sort()).toEqual(['0,0', '1,0']);
  expect(idle(back)).toBe(0);
});

test('an assign on a tile the city does not hold is refused', () => {
  const city = cityOf(['urban', 'plain'], { population: 4 });

  expect(stagedBy(city, assignTo({ q: 0, r: 5 }))).toEqual(['refused']);
  expect(outcome(apply(city, assignTo({ q: 0, r: 5 })))).toBe(city);
  expect(stagedBy(city, assignTo({ q: 9, r: 9 }))).toEqual(['refused']);
});

test('an assign with no inhabitant idle is refused', () => {
  const spent = cityOf(['urban', 'plain', 'forest'], {
    population: 2,
    assigned: [CITY, { q: 1, r: 0 }],
  });

  expect(idle(spent)).toBe(0);
  expect(stagedBy(spent, assignTo({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(spent, assignTo({ q: 2, r: 0 })))).toBe(spent);
});

test('a drag takes the inhabitant off the tile it stands on and puts it on the tile it lands on', () => {
  const founding = beginChronicle(1, DECK);
  const [from, to] = neighbours(founding.city);
  const freed = outcome(apply(founding, assignTo(to)));

  const stages = apply(freed, reassignTo(from, to));
  const after = outcome(stages);

  expect(cityDrag(freed, from, to)).toEqual(reassignTo(from, to));
  expect(stages.map((stage) => stage.name)).toEqual(['assign']);
  expect(after.assigned.map(tileKey)).not.toContain(tileKey(from));
  expect(after.assigned.map(tileKey)).toContain(tileKey(to));
  expect(after.population).toBe(freed.population);
  expect(idle(after)).toBe(idle(freed));
});

test('a drag onto a tile an inhabitant stands on, onto one the city does not hold, or onto the tile it started from is refused', () => {
  const founding = beginChronicle(1, DECK);
  const [from, worked] = neighbours(founding.city);
  const outside = claimable(founding)[0];

  expect(cityDrag(founding, from, worked)).toBeUndefined();
  expect(stagedBy(founding, reassignTo(from, worked))).toEqual(['refused']);
  expect(outcome(apply(founding, reassignTo(from, worked)))).toBe(founding);
  expect(stagedBy(founding, reassignTo(from, outside))).toEqual(['refused']);
  expect(stagedBy(founding, reassignTo(from, from))).toEqual(['refused']);
});

test('a drag from a tile nobody stands on is refused', () => {
  const founding = beginChronicle(1, DECK);
  const [bare, empty] = neighbours(founding.city);
  const freed = outcome(apply(outcome(apply(founding, assignTo(bare))), assignTo(empty)));

  expect(cityDrag(freed, bare, empty)).toBeUndefined();
  expect(stagedBy(freed, reassignTo(bare, empty))).toEqual(['refused']);
  expect(outcome(apply(freed, reassignTo(bare, empty)))).toBe(freed);
});

test('an assigned tile yields at income, and an unassigned one yields nothing', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(city, assignTo({ q: 1, r: 0 })));

  const worked = outcome(apply(city, { type: 'end-turn' }));
  const bare = outcome(apply(off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (TERRAIN_YIELDS.plain[resource] ?? 0),
    );
  }
});

test('the city’s own tile unassigned yields nothing at income, like any other', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(city, assignTo(CITY)));

  const worked = outcome(apply(city, { type: 'end-turn' }));
  const bare = outcome(apply(off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (TERRAIN_YIELDS.urban[resource] ?? 0),
    );
  }
});

test('a claim pays its culture, takes the tile inside the border, and puts an idle inhabitant on it', () => {
  const city = founded(3, { resources: culture(2) });
  const tile = { q: 2, r: 0 };

  const stages = apply(city, claimOf(tile));
  const after = outcome(stages);

  expect(stages.map((stage) => stage.name)).toEqual(['claim']);
  expect(after.held.map(tileKey)).toContain('2,0');
  expect(after.resources.culture).toBe(1);
  expect(after.assigned.map(tileKey)).toContain('2,0');
  expect(idle(after)).toBe(idle(city) - 1);
});

test('a claim made with nobody idle takes the tile with no inhabitant on it', () => {
  const full = founded(3, { resources: culture(2), population: 7 });

  const after = outcome(apply(full, claimOf({ q: 2, r: 0 })));

  expect(idle(full)).toBe(0);
  expect(after.held.map(tileKey)).toContain('2,0');
  expect(after.assigned.map(tileKey)).not.toContain('2,0');
  expect(idle(after)).toBe(0);
});

test('a claimed tile an inhabitant stands on yields at the next income', () => {
  const city = founded(3, { ...NO_GROWTH, resources: culture(1) });
  const claimed = outcome(apply(city, claimOf({ q: 2, r: 0 })));

  const bare = outcome(apply(city, { type: 'end-turn' }));
  const wider = outcome(apply(claimed, { type: 'end-turn' }));

  expect(wider.resources.food).toBe(bare.resources.food + (TERRAIN_YIELDS.plain.food ?? 0));
});

test('a claim on a tile the border does not touch, off the map, or already held is refused', () => {
  const city = founded(3, { resources: culture(9) });

  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(city, claimOf({ q: 3, r: 0 })))).toBe(city);
  expect(stagedBy(city, claimOf({ q: 9, r: 9 }))).toEqual(['refused']);
  expect(stagedBy(city, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
});

test('a claim the city cannot pay for is refused, and one it can just pay for goes through', () => {
  const penniless = founded(3);
  const exact = founded(3, { resources: culture(1) });

  expect(stagedBy(penniless, claimOf({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(penniless, claimOf({ q: 2, r: 0 })))).toBe(penniless);
  expect(stagedBy(exact, claimOf({ q: 2, r: 0 }))).toEqual(['claim']);
  expect(outcome(apply(exact, claimOf({ q: 2, r: 0 }))).resources.culture).toBe(0);
});

test('a claim costs one culture, and one more for every three tiles claimed', () => {
  let chronicle = founded(4, { resources: culture(20), population: 40 });
  const touching = field(4)
    .filter((tile) => distance(tile, CITY) === 2)
    .slice(0, 7);

  const paid = touching.map((tile) => {
    const before = chronicle.resources.culture;
    chronicle = outcome(apply(chronicle, claimOf(tile)));
    return before - chronicle.resources.culture;
  });

  expect(paid).toEqual([1, 1, 1, 2, 2, 2, 3]);
  expect(chronicle.held).toHaveLength(14);
});

test('the city may claim every tile touching the border, and no other', () => {
  const city = founded(3);

  expect(claimable(city).map(tileKey).sort()).toEqual(
    field(3)
      .filter((tile) => distance(tile, CITY) === 2)
      .map(tileKey)
      .sort(),
  );
});

test('an uncharted tile touching the border is no claim of the city’s', () => {
  const opened = outcome(apply(beginChronicle(4, DECK), { type: 'end-turn' }));
  const dark = unchartedTouching(opened);

  expect(opened.resources.culture).toBeGreaterThanOrEqual(1);
  expect(claimable(opened).map(tileKey)).not.toContain(tileKey(dark));
  expect(tileRefusal(opened, dark)).toBeUndefined();
  expect(cityCommand(opened, dark)).toBeUndefined();
  expect(stagedBy(opened, claimOf(dark))).toEqual(['refused']);
  expect(outcome(apply(opened, claimOf(dark)))).toBe(opened);
});

test('a unit that charts that tile makes it a claim the city can make', () => {
  const opened = outcome(apply(beginChronicle(4, DECK), { type: 'end-turn' }));
  const dark = unchartedTouching(opened);
  const charting = withWorkerBeside(opened, dark);

  expect(claimable(charting).map(tileKey)).toContain(tileKey(dark));
  expect(cityCommand(charting, dark)).toEqual(claimOf(dark));
  expect(stagedBy(charting, claimOf(dark))).toEqual(['claim']);
  expect(outcome(apply(charting, claimOf(dark))).held.map(tileKey)).toContain(tileKey(dark));
});

test('a camp’s tile touching the border is no claim of the city’s', () => {
  const camp = { q: 2, r: 0 };
  const city = founded(3, { tiles: camped(field(3), [camp]), resources: culture(9) });

  expect(claimable(city).map(tileKey)).not.toContain(tileKey(camp));
  expect(tileRefusal(city, camp)).toBeUndefined();
  expect(cityCommand(city, camp)).toBeUndefined();
  expect(stagedBy(city, claimOf(camp))).toEqual(['refused']);
  expect(outcome(apply(city, claimOf(camp)))).toBe(city);
});

test('a tile an enemy occupies is no claim of the city’s, and a unit of the player’s refuses none', () => {
  const occupied = { q: 2, r: 0 };
  const stood = { q: 0, r: 2 };
  const city = founded(3, {
    resources: culture(9),
    units: [standing('enemy', occupied), standing('player', stood)],
  });

  expect(claimable(city).map(tileKey)).not.toContain(tileKey(occupied));
  expect(tileRefusal(city, occupied)).toBeUndefined();
  expect(cityCommand(city, occupied)).toBeUndefined();
  expect(stagedBy(city, claimOf(occupied))).toEqual(['refused']);
  expect(outcome(apply(city, claimOf(occupied)))).toBe(city);

  expect(claimable(city).map(tileKey)).toContain(tileKey(stood));
  expect(cityCommand(city, stood)).toEqual(claimOf(stood));
  expect(stagedBy(city, claimOf(stood))).toEqual(['claim']);
});

test('a city-mode click assigns on a tile the city holds and claims on any other', () => {
  const city = founded(3, { resources: culture(1) });

  expect(cityCommand(city, { q: 1, r: 0 })).toEqual(assignTo({ q: 1, r: 0 }));
  expect(cityCommand(city, { q: 2, r: 0 })).toEqual(claimOf({ q: 2, r: 0 }));
  expect(cityCommand(city, { q: 3, r: 0 })).toBeUndefined();
});

test('a city-mode click is refused for the culture it costs, and a tile off the border refuses nothing', () => {
  const city = founded(3);
  const paid = founded(3, { resources: culture(1) });

  expect(tileCost(city, { q: 2, r: 0 })).toEqual([{ resource: 'culture', amount: 1 }]);
  expect(tileRefusal(city, { q: 2, r: 0 })).toEqual({ unaffordable: ['culture'], blocked: [] });
  expect(tileRefusal(paid, { q: 2, r: 0 })).toEqual({ unaffordable: [], blocked: [] });
  expect(tileCost(paid, CITY)).toEqual([]);
  expect(tileRefusal(paid, CITY)).toEqual({ unaffordable: [], blocked: [] });
});

test('a tile the city neither holds nor can claim is no act of the city’s, and refuses a claim', () => {
  const city = founded(3, { resources: culture(9) });

  expect(tileRefusal(city, { q: 3, r: 0 })).toBeUndefined();
  expect(tileRefusal(city, { q: 9, r: 9 })).toBeUndefined();
  expect(cityCommand(city, { q: 3, r: 0 })).toBeUndefined();
  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
});

test('a city-mode click on a held tile nobody stands on is refused while nobody is idle', () => {
  const spent = founded(3, { population: 6, assigned: [CITY, ...neighbours(CITY).slice(1)] });
  const empty = { q: 1, r: 0 };

  expect(idle(spent)).toBe(0);
  expect(tileRefusal(spent, empty)).toEqual({ unaffordable: [], blocked: ['idle'] });
  expect(cityCommand(spent, empty)).toBeUndefined();
  expect(stagedBy(spent, assignTo(empty))).toEqual(['refused']);

  const freed = outcome(apply(spent, assignTo(CITY)));

  expect(tileRefusal(freed, empty)).toEqual({ unaffordable: [], blocked: [] });
  expect(stagedBy(freed, assignTo(empty))).toEqual(['assign']);
});

test('the same claim on the same chronicle gives the same chronicle back', () => {
  const city = founded(3, { resources: culture(3) });
  const untouched = structuredClone(city);

  expect(outcome(apply(city, claimOf({ q: 2, r: 0 })))).toEqual(
    outcome(apply(city, claimOf({ q: 2, r: 0 }))),
  );
  expect(city).toEqual(untouched);
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
