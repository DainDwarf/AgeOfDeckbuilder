import { expect, test } from 'vitest';
import { aimOf, refuses } from './cards';
import { type AimedCard, cardOf, type Deck } from './catalogue';
import { admitted, apply, type Command, launched, outcome } from './chronicle';
import { cityCommand, cityDrag, claimable, growthThreshold, tileCost, tileRefusal } from './city';
import {
  assignTo,
  CATALOGUE,
  type Carrying,
  CITY,
  camped,
  cityOf,
  claimOf,
  culture,
  DECK,
  everyCard,
  field,
  heldBy,
  NO_GROWTH,
  namesOf,
  opening,
  plains,
  REGION,
  ringed,
  SCHEDULE,
  settledLaunch,
  settledOn,
  stagedBy,
  standing,
  withTile,
} from './fixtures';
import {
  cornersOf,
  distance,
  neighbours,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { buildingKind, featureKind, improvementKind, regionOf, terrainKind } from './map-kinds';
import { RESOURCES } from './resources';
import { type Chronicle, idle } from './state';

/** The command a drag in city mode sends: the population off one tile and onto another. */
function reassignTo(from: TileCoords, to: TileCoords): Command {
  return { type: 'reassign', from, to };
}

/**
 * A city on a disc of plain out to three holding its own tile alone, one population on it and two
 * idle.
 */
function alone(carrying: Carrying = {}): Chronicle {
  return cityOf(['urban'], { tiles: field(3), population: 3, ...carrying });
}

/** The fixture's deck with this many free claims after the settle card in its settle section. */
function claiming(claims: number): Deck {
  return { cards: DECK.cards, settle: ['PH_Settle', ...Array<string>(claims).fill('PH_Claim')] };
}

/** The first card of the hand played at a tile: a free claim, on a hand the settle left holding them. */
function freeClaim(tile: TileCoords): Command {
  return { type: 'play', index: 0, aim: 'tile', tile };
}

/** The free claim's aim. */
function claimCard(): AimedCard {
  const card = aimOf(cardOf(CATALOGUE, 'PH_Claim'));
  if (card.aim !== 'tile') throw new Error('PH_Claim is aimed at no tile');
  return card;
}

/** The one reason the free claim refuses a tile of the map, and nothing on one it admits. */
function claimRefusal(chronicle: Chronicle, at: TileCoords): string | undefined {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) throw new Error(`${tileKey(at)} is no tile of the map`);
  return refuses(CATALOGUE, chronicle, claimCard(), tile);
}

/** A tile of a generated map that touches the border and has never been in sight. */
function unchartedTouching(chronicle: Chronicle): TileCoords | undefined {
  const seen = new Set(chronicle.snapshots.map(tileKey));
  const held = new Set(chronicle.held.map(tileKey));
  const found = chronicle.tiles.find(
    (tile) =>
      !seen.has(tileKey(tile)) && neighbours(tile).some((coord) => held.has(tileKey(coord))),
  );
  return found === undefined ? undefined : { q: found.q, r: found.r };
}

/**
 * The chronicle with a worker entered and stepped onto a tile between the city on `city` and
 * `tile`, from where it charts it; nothing where the hand enters no worker or the worker takes no
 * such step.
 */
function withWorkerBeside(
  chronicle: Chronicle,
  tile: TileCoords,
  city: TileCoords,
): Chronicle | undefined {
  const at = chronicle.hand.indexOf('PH_Worker');
  if (at === -1) return undefined;
  const entered = outcome(apply(CATALOGUE, chronicle, { type: 'play', index: at, aim: 'none' }));
  if (entered.units.length === chronicle.units.length) return undefined;
  const worker = entered.units[entered.units.length - 1];
  const between = neighbours(city).find((coord) => distance(coord, tile) === 1);
  if (between === undefined) return undefined;
  const stepped = outcome(
    apply(CATALOGUE, entered, { type: 'move', unit: worker.id, tile: between }),
  );
  return stepped === entered ? undefined : stepped;
}

/**
 * The centre part charts every tile nearer the centre, so a city settled any nearer has no dark
 * border to find.
 */
function darkBorder(): { opened: Chronicle; dark: TileCoords; city: TileCoords } {
  const reach = regionOf(CATALOGUE, REGION).centre;
  for (let seed = 0; seed < 1000; seed++) {
    const unsettled = launched(CATALOGUE, REGION, SCHEDULE, seed, claiming(6));
    for (const city of unsettled.centre) {
      if (distance(city, CITY) !== reach) continue;
      let settling = settledOn(unsettled, city);
      if (settling.city === undefined) continue;
      for (const tile of neighbours(city)) {
        settling = outcome(apply(CATALOGUE, settling, freeClaim(tile)));
      }
      const ended = outcome(apply(CATALOGUE, settling, { type: 'end-turn' }));
      const opened = outcome(apply(CATALOGUE, ended, { type: 'end-turn' }));
      const dark = unchartedTouching(opened);
      if (dark === undefined || withWorkerBeside(opened, dark, city) === undefined) continue;
      return {
        opened: { ...opened, resources: { ...opened.resources, culture: 20 } },
        dark,
        city,
      };
    }
  }
  throw new Error('no seed under a thousand leaves a dark border tile a worker can step beside');
}

test('the settle holds the city’s tile alone, one population on it and the city’s idle count besides', () => {
  for (const seed of [0, 1234, 0xdeadbeef | 0]) {
    const chronicle = settledLaunch(CATALOGUE, REGION, SCHEDULE, seed, DECK);

    expect(chronicle.held).toEqual([CITY]);
    expect(chronicle.assigned).toEqual([CITY]);
    expect(idle(chronicle)).toBe(CATALOGUE.city.idle);
  }
});

test('a free claim holds the tile, brings one population that stands on it, and asks no culture', () => {
  const settled = settledOn(opening(plains(3)), CITY);
  const [tile] = neighbours(CITY);

  const stages = apply(CATALOGUE, settled, freeClaim(tile));
  const after = outcome(stages);

  expect(settled.hand).toEqual(['PH_Claim']);
  expect(namesOf(stages)).toEqual(['played', 'left', 'population', 'held', 'assigned']);
  expect(after.held.map(tileKey)).toEqual([tileKey(CITY), tileKey(tile)]);
  expect(after.assigned.map(tileKey)).toContain(tileKey(tile));
  expect(after.population).toBe(settled.population + 1);
  expect(idle(after)).toBe(idle(settled));
  expect(after.resources).toEqual(settled.resources);
  expect(everyCard(after)).not.toContain('PH_Claim');
});

test('six free claims make the next claim cost fourteen culture', () => {
  let chronicle = settledOn(opening(plains(3), { deck: claiming(6) }), CITY);
  for (const tile of neighbours(CITY)) {
    chronicle = outcome(apply(CATALOGUE, chronicle, freeClaim(tile)));
  }
  const next = { q: 2, r: 0 };
  const paying: Chronicle = { ...chronicle, resources: culture(14) };

  expect(chronicle.held).toHaveLength(7);
  expect(tileCost(chronicle, next)).toEqual([{ resource: 'culture', amount: 14 }]);
  expect(outcome(apply(CATALOGUE, paying, claimOf(next))).resources.culture).toBe(0);
});

test('a free claim aimed at a tile the city holds, one the border does not touch, or a camp’s is refused as no claim of the city’s, and before the settle it admits no tile', () => {
  const camp = { q: 0, r: 1 };
  const opened = opening(camped(plains(3), [camp]));
  const settled = settledOn(opened, CITY);

  expect(admitted(CATALOGUE, opened, claimCard())).toEqual([]);
  for (const tile of [CITY, { q: 2, r: 0 }, camp]) {
    expect(claimRefusal(settled, tile)).toBe('no-claim');
    expect(stagedBy(settled, freeClaim(tile))).toEqual(['refused']);
  }
  expect(admitted(CATALOGUE, settled, claimCard()).map(tileKey).sort()).toEqual(
    claimable(CATALOGUE, settled).map(tileKey).sort(),
  );
  expect(admitted(CATALOGUE, settled, claimCard())).toHaveLength(5);
});

test('a claim costs twice the tiles the city holds, its own counted', () => {
  let chronicle = alone({ resources: culture(60), population: 40 });
  const tiles = [...neighbours(CITY), { q: 2, r: 0 }];

  const paid = tiles.map((tile) => {
    const before = chronicle.resources.culture;
    chronicle = outcome(apply(CATALOGUE, chronicle, claimOf(tile)));
    return before - chronicle.resources.culture;
  });

  expect(paid).toEqual([2, 4, 6, 8, 10, 12, 14]);
  expect(chronicle.held).toHaveLength(8);
});

test('income yields every tile inside the border, and nothing outside it', () => {
  const inside: Terrain[] = ['urban', 'plain', 'forest', 'hills', 'mountain', 'coast'];

  const after = outcome(apply(CATALOGUE, cityOf(inside, NO_GROWTH), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    const yielded = inside.reduce(
      (total, terrain) => total + (terrainKind(CATALOGUE, terrain).yields[resource] ?? 0),
      0,
    );
    expect(after.resources[resource]).toBe(yielded);
  }
});

test('a second tile of the same terrain yields as much again', () => {
  const once = outcome(apply(CATALOGUE, cityOf(['forest'], NO_GROWTH), { type: 'end-turn' }));
  const twice = outcome(
    apply(CATALOGUE, cityOf(['forest', 'forest'], NO_GROWTH), { type: 'end-turn' }),
  );

  for (const resource of RESOURCES) {
    expect(twice.resources[resource]).toBe(once.resources[resource] * 2);
  }
});

test('an assigned tile yields what all four of its layers declare, summed', () => {
  const layered: Tile = {
    q: 1,
    r: 0,
    terrain: featureKind(CATALOGUE, 'PH_Fertile').terrain,
    feature: 'PH_Fertile',
    improvements: ['PH_Mine'],
    building: 'PH_Farm',
  };
  const city = cityOf(['urban', layered.terrain], NO_GROWTH);

  const after = outcome(apply(CATALOGUE, withTile(city, layered), { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      (terrainKind(CATALOGUE, 'urban').yields[resource] ?? 0) +
        (buildingKind(CATALOGUE, 'PH_City').yields[resource] ?? 0) +
        (terrainKind(CATALOGUE, layered.terrain).yields[resource] ?? 0) +
        (featureKind(CATALOGUE, 'PH_Fertile').yields[resource] ?? 0) +
        (improvementKind(CATALOGUE, 'PH_Mine').yields[resource] ?? 0) +
        (buildingKind(CATALOGUE, 'PH_Farm').yields[resource] ?? 0),
    );
  }
});

test('a river running along a tile gives it one food at income, however many edges it runs along', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(
    apply(CATALOGUE, cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }),
  );

  for (const river of [around.slice(0, 2), around.slice(0, 4)]) {
    const city = cityOf(['urban', 'plain'], { ...NO_GROWTH, rivers: [river] });

    const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

    for (const resource of RESOURCES) {
      expect(after.resources[resource]).toBe(
        bare.resources[resource] + (terrainKind(CATALOGUE, 'plain').river?.[resource] ?? 0),
      );
    }
  }
});

test('two rivers meeting at a tile give it the one food between them', () => {
  const at = { q: 1, r: 0 };
  const around = cornersOf(at);
  const bare = outcome(
    apply(CATALOGUE, cityOf(['urban', 'plain'], NO_GROWTH), { type: 'end-turn' }),
  );
  const city = cityOf(['urban', 'plain'], {
    ...NO_GROWTH,
    rivers: [around.slice(1, 3), around.slice(2, 4)],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(
      bare.resources[resource] + (terrainKind(CATALOGUE, 'plain').river?.[resource] ?? 0),
    );
  }
});

test('a river running along a terrain it feeds nothing gives that tile nothing', () => {
  const at = { q: 1, r: 0 };
  const bare = outcome(
    apply(CATALOGUE, cityOf(['urban', 'hills'], NO_GROWTH), { type: 'end-turn' }),
  );
  const city = cityOf(['urban', 'hills'], { ...NO_GROWTH, rivers: [cornersOf(at).slice(0, 2)] });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(after.resources[resource]).toBe(bare.resources[resource]);
  }
});

test('resources accumulate over consecutive turns', () => {
  const city = cityOf(['urban', 'plain', 'hills'], NO_GROWTH);

  const first = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const second = outcome(apply(CATALOGUE, first, { type: 'end-turn' }));
  const third = outcome(apply(CATALOGUE, second, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(third.resources[resource]).toBe(first.resources[resource] * 3);
  }
});

test('the city in its slot adds nothing to what the tile it stands on yields', () => {
  const ended = outcome(
    apply(CATALOGUE, cityOf(['urban'], { tiles: field(1) }), { type: 'end-turn' }),
  );

  for (const resource of RESOURCES) {
    expect(ended.resources[resource]).toBe(terrainKind(CATALOGUE, 'urban').yields[resource] ?? 0);
  }
});

test('a food stock short of the growth threshold grows nobody, and the stock is kept', () => {
  const city = cityOf(['urban', 'plain', 'coast'], NO_GROWTH);

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population);
  expect(after.resources.food).toBe(3);
  expect(heldBy(apply(CATALOGUE, city, { type: 'end-turn' }), 'grow')).toEqual([]);
});

test('the food stock reaching the growth threshold grows as one grow group, the food spent and then the population', () => {
  const city = cityOf(['urban', 'plain'], {
    population: 3,
    resources: { food: 3, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const [spent, arrived, ...rest] = heldBy(apply(CATALOGUE, city, { type: 'end-turn' }), 'grow');

  expect([spent.name, arrived.name]).toEqual(['stock', 'population']);
  expect(rest).toEqual([]);
  expect(spent.chronicle.population).toBe(city.population);
  expect(arrived.chronicle.population).toBe(city.population + 1);
  expect(arrived.chronicle.resources.food).toBe(spent.chronicle.resources.food);
});

test('income is one stock per tile worked that yields, in tile order, each carrying its tile', () => {
  const city = cityOf(['urban', 'plain', 'plain'], {
    ...NO_GROWTH,
    assigned: [{ q: 2, r: 0 }, CITY],
  });

  const stocks = heldBy(apply(CATALOGUE, city, { type: 'end-turn' }), 'income');

  expect(stocks.map((stage) => stage.name)).toEqual(['stock', 'stock']);
  expect(stocks).toMatchObject([{ tile: CITY }, { tile: { q: 2, r: 0 } }]);
  expect(stocks[0].chronicle.resources.food).toBe(0);
  expect(stocks[1].chronicle.resources.food).toBe(2);
});

test('the food stock reaching the growth threshold is spent on one population, and that one is idle', () => {
  const city = cityOf(['urban'], {
    population: 3,
    resources: { food: 3, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(0);
  expect(after.assigned).toEqual(city.assigned);
  expect(idle(after)).toBe(idle(city) + 1);
});

test('the growth threshold is the food the next population needs: one short of it grows nobody', () => {
  const city = cityOf(['urban', 'plain'], { population: 5, assigned: [] });
  const stocked = (food: number): Chronicle => ({
    ...city,
    resources: { ...city.resources, food },
  });

  const short = outcome(apply(CATALOGUE, stocked(growthThreshold(city) - 1), { type: 'end-turn' }));
  const reached = outcome(apply(CATALOGUE, stocked(growthThreshold(city)), { type: 'end-turn' }));

  expect(short.population).toBe(city.population);
  expect(short.resources.food).toBe(growthThreshold(city) - 1);
  expect(reached.population).toBe(city.population + 1);
  expect(reached.resources.food).toBe(0);
});

test('a food stock worth several growth thresholds grows one population and no more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 9, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(7);
});

test('the growth threshold widens with the population: the next population costs one food more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 5, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const first = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const second = outcome(apply(CATALOGUE, first, { type: 'end-turn' }));

  expect(first.population).toBe(3);
  expect(first.resources.food).toBe(3);
  expect(second.population).toBe(4);
  expect(second.resources.food).toBe(0);
});

test('an assign takes the population off a tile, and a second one puts it back', () => {
  const city = cityOf(['urban', 'plain']);
  const tile = { q: 1, r: 0 };

  const off = outcome(apply(CATALOGUE, city, assignTo(tile)));
  const back = outcome(apply(CATALOGUE, off, assignTo(tile)));

  expect(stagedBy(city, assignTo(tile))).toEqual(['assign', 'assigned']);
  expect(stagedBy(off, assignTo(tile))).toEqual(['assign', 'assigned']);
  expect(heldBy(apply(CATALOGUE, city, assignTo(tile)), 'assign')).toMatchObject([{ tile }]);
  expect(off.assigned.map(tileKey)).toEqual(['0,0']);
  expect(idle(off)).toBe(1);
  expect(back.assigned.map(tileKey).sort()).toEqual(['0,0', '1,0']);
  expect(idle(back)).toBe(0);
});

test('an assign on a tile the city does not hold is refused', () => {
  const city = cityOf(['urban', 'plain'], { population: 4 });

  expect(stagedBy(city, assignTo({ q: 0, r: 5 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, assignTo({ q: 0, r: 5 })))).toBe(city);
  expect(stagedBy(city, assignTo({ q: 9, r: 9 }))).toEqual(['refused']);
});

test('an assign with no population idle is refused', () => {
  const spent = cityOf(['urban', 'plain', 'forest'], {
    population: 2,
    assigned: [CITY, { q: 1, r: 0 }],
  });

  expect(idle(spent)).toBe(0);
  expect(stagedBy(spent, assignTo({ q: 2, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, spent, assignTo({ q: 2, r: 0 })))).toBe(spent);
});

test('a drag takes the population off the tile it stands on and puts it on the tile it lands on', () => {
  const city = ringed(3);
  const [from, to] = neighbours(CITY);
  const freed = outcome(apply(CATALOGUE, city, assignTo(to)));

  const stages = apply(CATALOGUE, freed, reassignTo(from, to));
  const after = outcome(stages);

  expect(cityDrag(freed, from, to)).toEqual(reassignTo(from, to));
  expect(namesOf(stages)).toEqual(['assign', 'assigned', 'assigned']);
  const [left, worked] = heldBy(stages, 'assign');
  expect(left).toMatchObject({ tile: from });
  expect(left.chronicle.assigned.map(tileKey)).not.toContain(tileKey(from));
  expect(left.chronicle.assigned.map(tileKey)).not.toContain(tileKey(to));
  expect(worked).toMatchObject({ tile: to });
  expect(after.assigned.map(tileKey)).not.toContain(tileKey(from));
  expect(after.assigned.map(tileKey)).toContain(tileKey(to));
  expect(after.population).toBe(freed.population);
  expect(idle(after)).toBe(idle(freed));
});

test('a drag onto a tile the population stands on, onto one the city does not hold, or onto the tile it started from is refused', () => {
  const city = ringed(3);
  const [from, worked] = neighbours(CITY);
  const outside = claimable(CATALOGUE, city)[0];

  expect(cityDrag(city, from, worked)).toBeUndefined();
  expect(stagedBy(city, reassignTo(from, worked))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, reassignTo(from, worked)))).toBe(city);
  expect(stagedBy(city, reassignTo(from, outside))).toEqual(['refused']);
  expect(stagedBy(city, reassignTo(from, from))).toEqual(['refused']);
});

test('a drag from a tile nobody stands on is refused', () => {
  const city = ringed(3);
  const [bare, empty] = neighbours(CITY);
  const freed = outcome(
    apply(CATALOGUE, outcome(apply(CATALOGUE, city, assignTo(bare))), assignTo(empty)),
  );

  expect(cityDrag(freed, bare, empty)).toBeUndefined();
  expect(stagedBy(freed, reassignTo(bare, empty))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, freed, reassignTo(bare, empty)))).toBe(freed);
});

test('an assigned tile yields at income, and an unassigned one yields nothing', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(CATALOGUE, city, assignTo({ q: 1, r: 0 })));

  const worked = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const bare = outcome(apply(CATALOGUE, off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (terrainKind(CATALOGUE, 'plain').yields[resource] ?? 0),
    );
  }
});

test('the city’s own tile unassigned yields nothing at income, like any other', () => {
  const city = cityOf(['urban', 'plain'], NO_GROWTH);
  const off = outcome(apply(CATALOGUE, city, assignTo(CITY)));

  const worked = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const bare = outcome(apply(CATALOGUE, off, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(bare.resources[resource]).toBe(
      worked.resources[resource] - (terrainKind(CATALOGUE, 'urban').yields[resource] ?? 0),
    );
  }
});

test('a claim pays its culture, takes the tile inside the border, and puts one idle population on it', () => {
  const city = alone({ resources: culture(3) });
  const tile = { q: 1, r: 0 };

  const stages = apply(CATALOGUE, city, claimOf(tile));
  const after = outcome(stages);

  expect(namesOf(stages)).toEqual(['claim', 'stock', 'held', 'assigned']);
  const [paid, held, assigned] = heldBy(stages, 'claim');
  expect(paid.chronicle.resources.culture).toBe(1);
  expect(paid.chronicle.held.map(tileKey)).not.toContain('1,0');
  expect(held).toMatchObject({ tile });
  expect(assigned).toMatchObject({ tile });
  expect(after.held.map(tileKey)).toContain('1,0');
  expect(after.resources.culture).toBe(1);
  expect(after.assigned.map(tileKey)).toContain('1,0');
  expect(idle(after)).toBe(idle(city) - 1);
});

test('a claim made with nobody idle takes the tile with no population on it', () => {
  const full = alone({ resources: culture(2), population: 1 });

  const after = outcome(apply(CATALOGUE, full, claimOf({ q: 1, r: 0 })));

  expect(stagedBy(full, claimOf({ q: 1, r: 0 }))).toEqual(['claim', 'stock', 'held']);
  expect(idle(full)).toBe(0);
  expect(after.held.map(tileKey)).toContain('1,0');
  expect(after.assigned.map(tileKey)).not.toContain('1,0');
  expect(idle(after)).toBe(0);
});

test('a claimed tile the population stands on yields at the next income', () => {
  const city = alone({ ...NO_GROWTH, resources: culture(2) });
  const claimed = outcome(apply(CATALOGUE, city, claimOf({ q: 1, r: 0 })));

  const bare = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const wider = outcome(apply(CATALOGUE, claimed, { type: 'end-turn' }));

  expect(wider.resources.food).toBe(
    bare.resources.food + (terrainKind(CATALOGUE, 'plain').yields.food ?? 0),
  );
});

test('a claim on a tile the border does not touch, off the map, or already held is refused', () => {
  const city = ringed(3, { resources: culture(20) });

  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf({ q: 3, r: 0 })))).toBe(city);
  expect(stagedBy(city, claimOf({ q: 9, r: 9 }))).toEqual(['refused']);
  expect(stagedBy(city, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
});

test('a claim the city cannot pay for is refused, and one it can just pay for goes through', () => {
  const penniless = alone();
  const exact = alone({ resources: culture(2) });

  expect(stagedBy(penniless, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, penniless, claimOf({ q: 1, r: 0 })))).toBe(penniless);
  expect(stagedBy(exact, claimOf({ q: 1, r: 0 }))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, exact, claimOf({ q: 1, r: 0 }))).resources.culture).toBe(0);
});

test('the city may claim every tile touching the border, and no other', () => {
  const city = ringed(3);

  expect(claimable(CATALOGUE, city).map(tileKey).sort()).toEqual(
    field(3)
      .filter((tile) => distance(tile, CITY) === 2)
      .map(tileKey)
      .sort(),
  );
});

test('an uncharted tile touching the border is no claim of the city’s', () => {
  const { opened, dark } = darkBorder();

  expect(claimable(CATALOGUE, opened).map(tileKey)).not.toContain(tileKey(dark));
  expect(tileRefusal(CATALOGUE, opened, dark)).toBeUndefined();
  expect(cityCommand(CATALOGUE, opened, dark)).toBeUndefined();
  expect(stagedBy(opened, claimOf(dark))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, opened, claimOf(dark)))).toBe(opened);
});

test('a unit that charts that tile makes it a claim the city can make', () => {
  const { opened, dark, city } = darkBorder();
  const charting = withWorkerBeside(opened, dark, city);
  if (charting === undefined)
    throw new Error('the worker found for this tile no longer steps beside it');

  expect(claimable(CATALOGUE, charting).map(tileKey)).toContain(tileKey(dark));
  expect(cityCommand(CATALOGUE, charting, dark)).toEqual(claimOf(dark));
  expect(stagedBy(charting, claimOf(dark))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, charting, claimOf(dark))).held.map(tileKey)).toContain(
    tileKey(dark),
  );
});

test('a camp’s tile touching the border is no claim of the city’s', () => {
  const camp = { q: 2, r: 0 };
  const city = ringed(3, { tiles: camped(field(3), [camp]), resources: culture(20) });

  expect(claimable(CATALOGUE, city).map(tileKey)).not.toContain(tileKey(camp));
  expect(tileRefusal(CATALOGUE, city, camp)).toBeUndefined();
  expect(cityCommand(CATALOGUE, city, camp)).toBeUndefined();
  expect(stagedBy(city, claimOf(camp))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf(camp)))).toBe(city);
});

test('a tile an enemy occupies is no claim of the city’s, and a unit of the player’s refuses none', () => {
  const occupied = { q: 2, r: 0 };
  const stood = { q: 0, r: 2 };
  const city = ringed(3, {
    resources: culture(20),
    units: [standing('enemy', occupied), standing('player', stood)],
  });

  expect(claimable(CATALOGUE, city).map(tileKey)).not.toContain(tileKey(occupied));
  expect(tileRefusal(CATALOGUE, city, occupied)).toBeUndefined();
  expect(cityCommand(CATALOGUE, city, occupied)).toBeUndefined();
  expect(stagedBy(city, claimOf(occupied))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf(occupied)))).toBe(city);

  expect(claimable(CATALOGUE, city).map(tileKey)).toContain(tileKey(stood));
  expect(cityCommand(CATALOGUE, city, stood)).toEqual(claimOf(stood));
  expect(stagedBy(city, claimOf(stood))).toEqual(['claim', 'stock', 'held', 'assigned']);
});

test('a city-mode click assigns on a tile the city holds and claims on any other', () => {
  const city = alone({ resources: culture(2) });

  expect(cityCommand(CATALOGUE, city, CITY)).toEqual(assignTo(CITY));
  expect(cityCommand(CATALOGUE, city, { q: 1, r: 0 })).toEqual(claimOf({ q: 1, r: 0 }));
  expect(cityCommand(CATALOGUE, city, { q: 2, r: 0 })).toBeUndefined();
});

test('a city-mode click is refused for the culture it costs, and a tile off the border refuses nothing', () => {
  const city = alone();
  const paid = alone({ resources: culture(2) });

  expect(tileCost(city, { q: 1, r: 0 })).toEqual([{ resource: 'culture', amount: 2 }]);
  expect(tileRefusal(CATALOGUE, city, { q: 1, r: 0 })).toEqual({
    unaffordable: ['culture'],
    blocked: [],
  });
  expect(tileRefusal(CATALOGUE, paid, { q: 1, r: 0 })).toEqual({ unaffordable: [], blocked: [] });
  expect(tileCost(paid, CITY)).toEqual([]);
  expect(tileRefusal(CATALOGUE, paid, CITY)).toEqual({ unaffordable: [], blocked: [] });
});

test('a tile the city neither holds nor can claim is no act of the city’s, and refuses a claim', () => {
  const city = ringed(3, { resources: culture(20) });

  expect(tileRefusal(CATALOGUE, city, { q: 3, r: 0 })).toBeUndefined();
  expect(tileRefusal(CATALOGUE, city, { q: 9, r: 9 })).toBeUndefined();
  expect(cityCommand(CATALOGUE, city, { q: 3, r: 0 })).toBeUndefined();
  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
});

test('a city-mode click on a held tile nobody stands on is refused while nobody is idle', () => {
  const spent = ringed(3, { population: 6, assigned: [CITY, ...neighbours(CITY).slice(1)] });
  const empty = { q: 1, r: 0 };

  expect(idle(spent)).toBe(0);
  expect(tileRefusal(CATALOGUE, spent, empty)).toEqual({ unaffordable: [], blocked: ['idle'] });
  expect(cityCommand(CATALOGUE, spent, empty)).toBeUndefined();
  expect(stagedBy(spent, assignTo(empty))).toEqual(['refused']);

  const freed = outcome(apply(CATALOGUE, spent, assignTo(CITY)));

  expect(tileRefusal(CATALOGUE, freed, empty)).toEqual({ unaffordable: [], blocked: [] });
  expect(stagedBy(freed, assignTo(empty))).toEqual(['assign', 'assigned']);
});

test('the same claim on the same chronicle gives the same chronicle back', () => {
  const city = ringed(3, { resources: culture(20) });
  const untouched = structuredClone(city);

  expect(outcome(apply(CATALOGUE, city, claimOf({ q: 2, r: 0 })))).toEqual(
    outcome(apply(CATALOGUE, city, claimOf({ q: 2, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});
