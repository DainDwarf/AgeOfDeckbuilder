import { expect, test } from 'vitest';
import { aimOf, built, refuses } from './cards';
import {
  type AimedCard,
  ageOf,
  type Catalogue,
  type Civilization,
  cardOf,
  catalogued,
  type NeutralScript,
  neutralOf,
  type ScriptAct,
  unitKind,
} from './catalogue';
import { admitted, apply, type Command, incomeOf, launched, outcome, reckoned } from './chronicle';
import {
  arrived,
  assignWaiting,
  bordered,
  cityCommand,
  cityDrag,
  claimable,
  claimWaiting,
  cultureThreshold,
  growthThreshold,
  tileCost,
  tileRefusal,
} from './city';
import {
  AGE,
  aimedAt,
  assignTo,
  attacksOf,
  besideTheNeutral,
  builtOn,
  CATALOGUE,
  type Carrying,
  CITY,
  CIVILIZATION,
  CLEARING,
  camped,
  changed,
  cityOf,
  claimOf,
  EMBARKED_MOVE,
  endedTurn,
  enemyPhaseOf,
  enemyStanding,
  everyCard,
  FALLOW,
  field,
  gainedBetween,
  heldBy,
  idsOf,
  madeOf,
  NEUTRAL,
  NEUTRAL_TILE,
  NO_DEALS,
  NO_GROWTH,
  namesOf,
  neutralStanding,
  onlyStocks,
  onTheNeutralCity,
  opening,
  plains,
  QUIET,
  REGION,
  ringed,
  SHRINE,
  type Standing,
  settledLaunch,
  settledOn,
  stagedBy,
  standing,
  WELL,
  WELL_GIVES,
  WORKER_SCRIPT,
  WORKER_STATS,
  WORKING,
  withTile,
  withUnits,
  worker,
} from './fixtures';
import {
  distance,
  neighbours,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from './map';
import { buildingKind, featureKind, improvementKind, regionOf, terrainKind } from './map-kinds';
import { RESOURCES, type Resources, withNone } from './resources';
import { inSight } from './sight';
import { followed, type Stage } from './stages';
import { type Chronicle, type CityRows, idle, type Snapshot, withCityRows } from './state';
import { FIRST_UNIT_NUMBER, type Unit, unitAt } from './units';
import { tileYield } from './yields';

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

/** The chronicle with the neutral's city holding the tile beyond its own, a shrine built on it. */
function shrinedByTheNeutral(chronicle: Chronicle): Chronicle {
  const theirs = { q: 2, r: 0 };
  return followed(bordered(chronicle, 'neutral', theirs), (left) =>
    built(CATALOGUE, left, theirs, SHRINE),
  ).chronicle;
}

/** The fixture's civilization with this many free claims in its settle section. */
function claiming(claims: number): Civilization {
  return { ...CIVILIZATION, settle: Array<string>(claims).fill('PH_Claim') };
}

/** The free claim's aim. */
function claimCard(): AimedCard {
  const card = aimOf(cardOf(CATALOGUE, 'PH_Claim'));
  if (card.aim !== 'tile') throw new Error('PH_Claim is aimed at no tile');
  return card;
}

/** The one reason the free claim refuses a tile of the map, and nothing on one it admits. */
function claimRefusal(chronicle: Chronicle, at: TileCoords): string | undefined {
  return refuses(CATALOGUE, chronicle, claimCard(), tileOn(chronicle, at));
}

/** The tile of the chronicle's map at those coordinates; a map reaching none there throws. */
function tileOn(chronicle: Chronicle, at: TileCoords): Tile {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) throw new Error(`${tileKey(at)} is no tile of the map`);
  return tile;
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
  const at = idsOf(chronicle.hand).indexOf('PH_Worker');
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
  const reach = regionOf(CATALOGUE, ageOf(CATALOGUE, AGE), REGION).centre;
  for (let seed = 0; seed < 1000; seed++) {
    const unsettled = launched(CATALOGUE, AGE, REGION, seed, claiming(6), []).chronicle;
    for (const city of unsettled.centre) {
      if (distance(city, CITY) !== reach) continue;
      let settling = settledOn(unsettled, city);
      if (settling.city === undefined) continue;
      for (const tile of neighbours(city)) {
        settling = outcome(apply(CATALOGUE, settling, aimedAt(tile)));
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

test('the settle holds the city’s tile alone, one population on it and the idle population the city section names besides', () => {
  for (const seed of [0, 1234, 0xdeadbeef | 0]) {
    const chronicle = settledLaunch(CATALOGUE, AGE, REGION, seed, CIVILIZATION, []);

    expect(chronicle.held).toEqual([CITY]);
    expect(chronicle.assigned).toEqual([CITY]);
    expect(idle(chronicle)).toBe(CIVILIZATION.city.idle);
  }
});

test('a free claim holds the tile, brings one population that stands on it, and asks no culture', () => {
  const settled = settledOn(opening(plains(3)), CITY);
  const [tile] = neighbours(CITY);

  const stages = apply(CATALOGUE, settled, aimedAt(tile));
  const after = outcome(stages);

  expect(idsOf(settled.hand)).toEqual(['PH_Claim']);
  expect(namesOf(stages)).toEqual(['played', 'banished', 'population', 'held', 'assigned']);
  expect(after.held.map(tileKey)).toEqual([tileKey(CITY), tileKey(tile)]);
  expect(after.assigned.map(tileKey)).toContain(tileKey(tile));
  expect(after.population).toBe(settled.population + 1);
  expect(idle(after)).toBe(idle(settled));
  expect(after.resources).toEqual(settled.resources);
  expect(everyCard(after)).not.toContain('PH_Claim');
});

test('six free claims make the next claim cost fourteen culture', () => {
  let chronicle = settledOn(opening(plains(3), { civilization: claiming(6) }), CITY);
  for (const tile of neighbours(CITY)) {
    chronicle = outcome(apply(CATALOGUE, chronicle, aimedAt(tile)));
  }
  const next = { q: 2, r: 0 };
  const paying: Chronicle = { ...chronicle, resources: onlyStocks({ culture: 14 }) };

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
    expect(stagedBy(settled, aimedAt(tile))).toEqual(['refused']);
  }
  expect(admitted(CATALOGUE, settled, claimCard()).map(tileKey).sort()).toEqual(
    claimable(CATALOGUE, settled, 'player').map(tileKey).sort(),
  );
  expect(admitted(CATALOGUE, settled, claimCard())).toHaveLength(5);
});

test('a claim costs twice the tiles the city holds, its own counted', () => {
  let chronicle = alone({ resources: onlyStocks({ culture: 60 }) });
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

/** What these yields come to together, every resource named. */
function together(...yields: Partial<Resources>[]): Resources {
  return Object.fromEntries(
    RESOURCES.map((resource) => [
      resource,
      yields.reduce((total, part) => total + (part[resource] ?? 0), 0),
    ]),
  ) as Resources;
}

test('a building that gives beside it gives every tile of its terrain beside it, and its own, once from its kind, at income and through a card gaining a tile’s yield', () => {
  const wells = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ];
  const out = { q: 1, r: 1 };
  const city = cityOf(['urban', 'plain', 'plain', 'plain'], {
    ...NO_GROWTH,
    tiles: builtOn(field(4), WELL, wells),
    units: [worker(out)],
    hand: ['PH_Forage'],
  });
  const ground = (terrain: Terrain) => terrainKind(CATALOGUE, terrain).yields;
  const own = buildingKind(CATALOGUE, WELL).yields;

  const income = heldBy(apply(CATALOGUE, city, { type: 'end-turn' }), 'income');
  const foraged = outcome(apply(CATALOGUE, city, aimedAt(out)));

  // The city's urban tile stands beside a well, each well beside the other, and the tile foraged
  // outside the border beside both.
  expect(
    income.map((stock, at) =>
      gainedBetween(at === 0 ? city : income[at - 1].chronicle, stock.chronicle),
    ),
  ).toEqual([
    together(ground('urban'), buildingKind(CATALOGUE, 'PH_City').yields),
    together(ground('plain'), own, WELL_GIVES.yields),
    together(ground('plain'), own, WELL_GIVES.yields),
    together(ground('plain'), WELL_GIVES.yields),
  ]);
  expect(gainedBetween(city, foraged)).toEqual(together(ground('plain'), WELL_GIVES.yields));
});

test('from the landing of a capstone ruling the yield, the terrain’s and the feature’s food are nothing at the income of either city and through a card gaining a tile’s yield, the building’s and the improvement’s kept, and before it the yield is the layers’', () => {
  const landingOn = (turn: number): Pick<Chronicle, 'timeline'> => ({
    timeline: { ...NO_DEALS, capstone: { id: FALLOW, turn } },
  });
  const layered = { terrain: 'plain', feature: 'PH_Fertile', improvements: ['PH_Ditch'] };
  const farmed: Tile = { q: 1, r: 0, ...layered, building: 'PH_Farm' };
  const out: Tile = { q: 0, r: 5, ...layered };
  const city = (turn: number): Chronicle =>
    withTile(
      withTile(
        cityOf(['urban', 'plain'], {
          ...NO_GROWTH,
          ...landingOn(turn),
          units: [worker(out)],
          hand: ['PH_Forage'],
        }),
        farmed,
      ),
      out,
    );
  const neutral = (turn: number): Chronicle => {
    const opened = besideTheNeutral(landingOn(turn));
    return withTile(opened, { ...tileOn(opened, NEUTRAL_TILE), ...layered });
  };
  const layers = (tile: Tile, landed: boolean): Resources => {
    const ground = [terrainKind(CATALOGUE, tile.terrain).yields];
    if (tile.feature !== undefined) ground.push(featureKind(CATALOGUE, tile.feature).yields);
    const laid = tile.improvements.map((kind) => improvementKind(CATALOGUE, kind).yields);
    if (tile.building !== undefined) laid.push(buildingKind(CATALOGUE, tile.building).yields);
    return together(
      ...ground.map((yields) => (landed ? withNone(yields, 'food') : yields)),
      ...laid,
    );
  };

  for (const landed of [false, true]) {
    const landing = landed ? 1 : 2;
    const player = city(landing);
    const income = heldBy(apply(CATALOGUE, player, { type: 'end-turn' }), 'income');
    const foraged = outcome(apply(CATALOGUE, player, aimedAt(out)));
    const theirs = neutral(landing);
    const theirIncome = heldBy(apply(CATALOGUE, theirs, { type: 'end-turn' }), 'income').at(-1);

    expect(
      income.map((stock, at) =>
        gainedBetween(at === 0 ? player : income[at - 1].chronicle, stock.chronicle),
      ),
    ).toEqual([layers(tileOn(player, CITY), landed), layers(farmed, landed)]);
    expect(gainedBetween(player, foraged)).toEqual(layers(out, landed));
    expect(theirIncome).toMatchObject({ name: 'stock', tile: NEUTRAL_TILE });
    expect(theirIncome?.chronicle.neutral?.resources).toEqual(
      layers(tileOn(theirs, NEUTRAL_TILE), landed),
    );
  }
  expect(layers(farmed, true).food).toBeGreaterThan(0);
  expect(layers(farmed, true).food).toBeLessThan(layers(farmed, false).food);
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
    resources: { food: 6, production: 0, military: 0, money: 0, science: 0, culture: 0 },
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
    resources: { food: 6, production: 0, military: 0, money: 0, science: 0, culture: 0 },
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

  const threshold = growthThreshold(city, 'player');
  const short = outcome(apply(CATALOGUE, stocked(threshold - 1), { type: 'end-turn' }));
  const reached = outcome(apply(CATALOGUE, stocked(threshold), { type: 'end-turn' }));

  expect(short.population).toBe(city.population);
  expect(short.resources.food).toBe(threshold - 1);
  expect(reached.population).toBe(city.population + 1);
  expect(reached.resources.food).toBe(0);
});

test('a food stock worth several growth thresholds grows one population and no more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 11, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(after.population).toBe(city.population + 1);
  expect(after.resources.food).toBe(7);
});

test('the growth threshold widens with the population: the next population costs two food more', () => {
  const city = cityOf(['urban'], {
    population: 2,
    resources: { food: 10, production: 0, military: 0, money: 0, science: 0, culture: 0 },
  });

  const first = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const second = outcome(apply(CATALOGUE, first, { type: 'end-turn' }));

  expect(first.population).toBe(3);
  expect(first.resources.food).toBe(6);
  expect(second.population).toBe(4);
  expect(second.resources.food).toBe(0);
});

test("a unit of the player's on the map raises the growth threshold, and an enemy's does not", () => {
  const stocked = (food: number, units: Standing[]): Chronicle =>
    cityOf(['urban'], {
      population: 2,
      resources: { food, production: 0, military: 0, money: 0, science: 0, culture: 0 },
      units,
    });
  const fielding = stocked(4, [worker(CITY)]);
  const fed = stocked(6, [worker(CITY)]);
  const watching = stocked(4, [standing('enemy', { q: 0, r: 5 })]);

  const short = outcome(apply(CATALOGUE, fielding, { type: 'end-turn' }));
  const paid = outcome(apply(CATALOGUE, fed, { type: 'end-turn' }));
  const watched = outcome(apply(CATALOGUE, watching, { type: 'end-turn' }));

  expect(short.population).toBe(fielding.population);
  expect(short.resources.food).toBe(4);
  expect(paid.population).toBe(fed.population + 1);
  expect(paid.resources.food).toBe(0);
  expect(watched.population).toBe(watching.population + 1);
  expect(watched.resources.food).toBe(0);
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
  const outside = claimable(CATALOGUE, city, 'player')[0];

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
  const city = alone({ resources: onlyStocks({ culture: 3 }) });
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
  const full = alone({ resources: onlyStocks({ culture: 2 }), population: 1 });

  const after = outcome(apply(CATALOGUE, full, claimOf({ q: 1, r: 0 })));

  expect(stagedBy(full, claimOf({ q: 1, r: 0 }))).toEqual(['claim', 'stock', 'held']);
  expect(idle(full)).toBe(0);
  expect(after.held.map(tileKey)).toContain('1,0');
  expect(after.assigned.map(tileKey)).not.toContain('1,0');
  expect(idle(after)).toBe(0);
});

test('a claimed tile the population stands on yields at the next income', () => {
  const city = alone({ ...NO_GROWTH, resources: onlyStocks({ culture: 2 }) });
  const claimed = outcome(apply(CATALOGUE, city, claimOf({ q: 1, r: 0 })));

  const bare = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  const wider = outcome(apply(CATALOGUE, claimed, { type: 'end-turn' }));

  expect(wider.resources.food).toBe(
    bare.resources.food + (terrainKind(CATALOGUE, 'plain').yields.food ?? 0),
  );
});

test('a claim on a tile the border does not touch, off the map, or already held is refused', () => {
  const city = ringed(3, { resources: onlyStocks({ culture: 20 }) });

  expect(stagedBy(city, claimOf({ q: 3, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf({ q: 3, r: 0 })))).toBe(city);
  expect(stagedBy(city, claimOf({ q: 9, r: 9 }))).toEqual(['refused']);
  expect(stagedBy(city, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
});

test('a claim the city cannot pay for is refused, and one it can just pay for goes through', () => {
  const penniless = alone();
  const exact = alone({ resources: onlyStocks({ culture: 2 }) });

  expect(stagedBy(penniless, claimOf({ q: 1, r: 0 }))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, penniless, claimOf({ q: 1, r: 0 })))).toBe(penniless);
  expect(stagedBy(exact, claimOf({ q: 1, r: 0 }))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, exact, claimOf({ q: 1, r: 0 }))).resources.culture).toBe(0);
});

test('the city may claim every tile touching the border, and no other', () => {
  const city = ringed(3);

  expect(claimable(CATALOGUE, city, 'player').map(tileKey).sort()).toEqual(
    field(3)
      .filter((tile) => distance(tile, CITY) === 2)
      .map(tileKey)
      .sort(),
  );
});

test('an uncharted tile touching the border is no claim of the city’s', () => {
  const { opened, dark } = darkBorder();

  expect(claimable(CATALOGUE, opened, 'player').map(tileKey)).not.toContain(tileKey(dark));
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

  expect(claimable(CATALOGUE, charting, 'player').map(tileKey)).toContain(tileKey(dark));
  expect(cityCommand(CATALOGUE, charting, dark)).toEqual(claimOf(dark));
  expect(stagedBy(charting, claimOf(dark))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, charting, claimOf(dark))).held.map(tileKey)).toContain(
    tileKey(dark),
  );
});

test('a camp’s tile touching the border is no claim of the city’s', () => {
  const camp = { q: 2, r: 0 };
  const city = ringed(3, {
    tiles: camped(field(3), [camp]),
    resources: onlyStocks({ culture: 20 }),
  });

  expect(claimable(CATALOGUE, city, 'player').map(tileKey)).not.toContain(tileKey(camp));
  expect(tileRefusal(CATALOGUE, city, camp)).toBeUndefined();
  expect(cityCommand(CATALOGUE, city, camp)).toBeUndefined();
  expect(stagedBy(city, claimOf(camp))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf(camp)))).toBe(city);
});

test('a tile an enemy occupies is no claim of the city’s, and a unit of the player’s refuses none', () => {
  const occupied = { q: 2, r: 0 };
  const stood = { q: 0, r: 2 };
  const city = ringed(3, {
    resources: onlyStocks({ culture: 20 }),
    units: [standing('enemy', occupied), standing('player', stood)],
  });

  expect(claimable(CATALOGUE, city, 'player').map(tileKey)).not.toContain(tileKey(occupied));
  expect(tileRefusal(CATALOGUE, city, occupied)).toBeUndefined();
  expect(cityCommand(CATALOGUE, city, occupied)).toBeUndefined();
  expect(stagedBy(city, claimOf(occupied))).toEqual(['refused']);
  expect(outcome(apply(CATALOGUE, city, claimOf(occupied)))).toBe(city);

  expect(claimable(CATALOGUE, city, 'player').map(tileKey)).toContain(tileKey(stood));
  expect(cityCommand(CATALOGUE, city, stood)).toEqual(claimOf(stood));
  expect(stagedBy(city, claimOf(stood))).toEqual(['claim', 'stock', 'held', 'assigned']);
});

test('a city-mode click assigns on a tile the city holds and claims on any other', () => {
  const city = alone({ resources: onlyStocks({ culture: 2 }) });

  expect(cityCommand(CATALOGUE, city, CITY)).toEqual(assignTo(CITY));
  expect(cityCommand(CATALOGUE, city, { q: 1, r: 0 })).toEqual(claimOf({ q: 1, r: 0 }));
  expect(cityCommand(CATALOGUE, city, { q: 2, r: 0 })).toBeUndefined();
});

test('a city-mode click is refused for the culture it costs, and a tile off the border refuses nothing', () => {
  const city = alone();
  const paid = alone({ resources: onlyStocks({ culture: 2 }) });

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
  const city = ringed(3, { resources: onlyStocks({ culture: 20 }) });

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

test('a claim waits while the city can pay for a tile it may claim, and none waits where the border touches nothing', () => {
  const penniless = alone();
  const paying = alone({ resources: onlyStocks({ culture: 2 }) });
  const boxedIn = cityOf(['urban'], { resources: onlyStocks({ culture: 20 }) });

  expect(claimWaiting(CATALOGUE, penniless)).toBe(false);
  expect(claimWaiting(CATALOGUE, paying)).toBe(true);
  expect(claimable(CATALOGUE, boxedIn, 'player')).toEqual([]);
  expect(claimWaiting(CATALOGUE, boxedIn)).toBe(false);
});

test('an assign waits while one population is idle and the city holds a tile nobody stands on', () => {
  const working = ringed(3);
  const empty = { q: 1, r: 0 };
  const freed = outcome(apply(CATALOGUE, working, assignTo(empty)));
  const spent = ringed(3, { population: 6, assigned: [CITY, ...neighbours(CITY).slice(1)] });

  expect(idle(working)).toBe(2);
  expect(assignWaiting(working)).toBe(false);
  expect(assignWaiting(freed)).toBe(true);
  expect(idle(spent)).toBe(0);
  expect(assignWaiting(spent)).toBe(false);
});

test('a chronicle launched on a region dealing the neutral’s city opens with it standing on its building’s tile, that tile held with one population on it, every stock at nought and at peace with the player; one on a region dealing none opens with no neutral', () => {
  for (const seed of [0, 1234]) {
    const { chronicle } = launched(CATALOGUE, AGE, CLEARING, seed, CIVILIZATION, []);
    const [city, ...others] = chronicle.tiles
      .filter((tile) => tile.building === NEUTRAL)
      .map(({ q, r }) => ({ q, r }));

    expect(others).toEqual([]);
    expect(chronicle.neutral).toEqual({
      city,
      held: [city],
      population: 1,
      assigned: [city],
      resources: together(),
    });
    expect(chronicle.relations).toBe('peace');
    const bare = launched(CATALOGUE, AGE, REGION, seed, CIVILIZATION, []).chronicle;
    expect(bare.neutral).toBeUndefined();
    expect(bare.relations).toBeUndefined();
  }
});

test('at income the neutral’s assigned tile yields into its own stocks, after the player’s tiles in the same income group, one stock carrying the tile; occupied by an enemy, it yields nothing', () => {
  const chronicle = besideTheNeutral();
  const tile = tileAt(chronicle.tiles, NEUTRAL_TILE);
  if (tile === undefined) throw new Error('the neutral’s city stands on no tile of the map');
  const gives = tileYield(CATALOGUE, chronicle, tile, tilesBeside(chronicle.tiles));
  const occupied = withUnits(chronicle, [standing('enemy', NEUTRAL_TILE)]);

  const income = heldBy(apply(CATALOGUE, chronicle, { type: 'end-turn' }), 'income');
  const [last, before] = [income.at(-1), income.at(-2)];
  const blocked = heldBy(apply(CATALOGUE, occupied, { type: 'end-turn' }), 'income');

  expect(income.length).toBeGreaterThan(1);
  expect(last).toMatchObject({ name: 'stock', tile: NEUTRAL_TILE });
  expect(last?.chronicle.resources).toEqual(before?.chronicle.resources);
  expect(last?.chronicle.neutral?.resources).toEqual(together(gives));
  expect(outcome(blocked).neutral?.resources).toEqual(together());
});

test('at income each city pays out of what its tiles yielded, as one stock after them, the upkeep the buildings on every tile it holds declare, summed; each stock it takes past nothing is emptied and takes one population besides, the neutral’s as the player’s, and the reckoning reads the player’s alone', () => {
  const upkeep = buildingKind(CATALOGUE, SHRINE).upkeep ?? {};
  const owed = together(upkeep, upkeep);
  const shrines = [
    { q: 1, r: 0 },
    { q: 2, r: 0 },
  ];
  const city = (resources: Resources): Chronicle =>
    cityOf(['urban', 'plain', 'plain'], {
      ...NO_GROWTH,
      tiles: builtOn(field(3), SHRINE, [...shrines, { q: 1, r: 1 }]),
      assigned: [CITY, shrines[0]],
      resources,
    });
  /** What the income ending the turn raises after its last tile yields, and what that yield left. */
  const paying = (chronicle: Chronicle): { yielded: Chronicle; after: readonly Stage[] } => {
    const income = heldBy(apply(CATALOGUE, chronicle, { type: 'end-turn' }), 'income');
    const last = income
      .map((stage) => stage.kind === 'change' && stage.name === 'stock' && stage.tile !== undefined)
      .lastIndexOf(true);
    return { yielded: income[last].chronicle, after: income.slice(last + 1) };
  };
  const covered = city(owed);
  const short = city(together());

  const paid = paying(covered);
  const fell = paying(short);

  expect(namesOf(paid.after)).toEqual(['stock']);
  expect(together(gainedBetween(paid.yielded, paid.after[0].chronicle), owed)).toEqual(together());
  expect(namesOf(fell.after)).toEqual(['stock', 'population', 'population']);
  expect(fell.after[0].chronicle.resources).toMatchObject({ production: 0, culture: 0 });
  expect(fell.after.slice(1)).toMatchObject(
    (['production', 'culture'] as const).map((resource) => ({
      uncovered: { resource, amount: owed[resource] - fell.yielded.resources[resource] },
    })),
  );
  expect(fell.after[2].chronicle.population).toBe(short.population - 2);
  expect(reckoned(CATALOGUE, short)?.pastNothing).toEqual(new Set(['production', 'culture']));

  const opened = besideTheNeutral();
  const shrined = shrinedByTheNeutral(arrived(opened, 'neutral').chronicle);
  const neutral = paying(shrined);

  expect(namesOf(neutral.after)).toEqual(['stock', 'assigned', 'population']);
  expect(neutral.after[0].chronicle.neutral?.resources.production).toBe(0);
  expect(neutral.after[2]).toMatchObject({
    uncovered: {
      resource: 'production',
      amount: (upkeep.production ?? 0) - (neutral.yielded.neutral?.resources.production ?? 0),
    },
  });
  expect(neutral.after[2].chronicle.neutral?.population).toBe(
    (shrined.neutral?.population ?? 0) - 1,
  );
  expect(neutral.after[2].chronicle.population).toBe(shrined.population);
  expect(reckoned(CATALOGUE, shrined)).toEqual(reckoned(CATALOGUE, opened));
});

test('a city’s income is what its worked tiles yield less its upkeep, the upkeep read past a stock at nothing', () => {
  const shrine = { q: 1, r: 0 };
  const city = cityOf(['urban', 'plain'], {
    tiles: builtOn(field(1), SHRINE, [shrine]),
    assigned: [shrine],
  });

  expect(city.resources.production).toBe(0);
  expect(incomeOf(CATALOGUE, city, 'player').production).toBe(
    -(buildingKind(CATALOGUE, SHRINE).upkeep?.production ?? 0),
  );
});

test('the neutral’s upkeep taking its last population, its city falls inside the income group: the population, then its building off its tile, then the fall carrying the population as its cause; its slot empty, its rows gone, its relations as they were, nothing dealt, nothing of its city after, and the player’s rows untouched', () => {
  const shrined = shrinedByTheNeutral(besideTheNeutral());
  const stages = apply(CATALOGUE, shrined, { type: 'end-turn' });
  const income = heldBy(stages, 'income');
  const paid = income.slice(-5);
  const after = outcome(stages);
  const playerRows = ({ resources, population, held, assigned }: Chronicle) => ({
    resources,
    population,
    held,
    assigned,
  });

  expect(shrined.neutral?.population).toBe(1);
  expect(namesOf(paid)).toEqual(['stock', 'assigned', 'population', 'retiled', 'neutral-fallen']);
  expect(paid[2].chronicle.neutral?.population).toBe(0);
  expect(paid[3]).toMatchObject({ tile: NEUTRAL_TILE });
  expect(paid[4]).toMatchObject({ cause: 'population' });
  expect(playerRows(paid[4].chronicle)).toEqual(playerRows(paid[0].before));
  expect(tileAt(after.tiles, NEUTRAL_TILE)?.building).toBeUndefined();
  expect(after.neutral).toBeUndefined();
  expect(after.relations).toBe(shrined.relations);
  expect(after.deals).toEqual([]);
  expect(after.ending).toBeUndefined();
});

test('hostile, a unit of the player’s occupies the tile of the neutral’s it stands on, which yields nothing at income', () => {
  const income = heldBy(apply(CATALOGUE, onTheNeutralCity(), { type: 'end-turn' }), 'income');
  const yielding = income.flatMap((stage) =>
    stage.kind === 'change' && stage.name === 'stock' && stage.tile !== undefined
      ? [tileKey(stage.tile)]
      : [],
  );

  expect(yielding).toEqual([tileKey(CITY)]);
});

test('at the growth phase the neutral’s food at its growth threshold is spent on one idle population, after the player’s growth in the same grow group, its threshold counting no unit of the player’s', () => {
  const opened = besideTheNeutral();
  const growing = {
    ...opened,
    resources: { ...opened.resources, food: growthThreshold(opened, 'player') },
  };

  const stages = apply(CATALOGUE, growing, { type: 'end-turn' });
  const fed = stages.find((stage) => stage.name === 'income')?.chronicle;
  const neutral = fed?.neutral;
  if (fed === undefined || neutral === undefined) throw new Error('the chronicle holds no neutral');
  const threshold = growthThreshold(fed, 'neutral');
  const grow = heldBy(stages, 'grow');

  expect(neutral.resources.food).toBeGreaterThanOrEqual(threshold);
  expect(growthThreshold(withUnits(fed, [worker(CITY)]), 'neutral')).toBe(threshold);
  expect(namesOf(grow)).toEqual(['stock', 'population', 'stock', 'population']);
  expect(grow[1].chronicle.population).toBe(fed.population + 1);
  expect(grow[1].chronicle.neutral).toEqual(neutral);
  expect(grow[3].chronicle.population).toBe(fed.population + 1);
  expect(grow[3].chronicle.neutral).toEqual({
    ...neutral,
    population: neutral.population + 1,
    resources: { ...neutral.resources, food: neutral.resources.food - threshold },
  });
});

test('a tile the neutral holds is no claim of the city’s, though it touches the border', () => {
  const opened = besideTheNeutral();
  const city = { ...opened, resources: onlyStocks({ culture: 20 }) };

  expect(claimable(CATALOGUE, city, 'player').map(tileKey)).not.toContain(tileKey(NEUTRAL_TILE));
  expect(tileRefusal(CATALOGUE, city, NEUTRAL_TILE)).toBeUndefined();
  expect(stagedBy(city, claimOf(NEUTRAL_TILE))).toEqual(['refused']);
});

/** `besideTheNeutral` as the test opens it, the neutral's city carrying the rows the test names. */
function neutralHolding(
  rows: Partial<CityRows>,
  named: Parameters<typeof besideTheNeutral>[0] = {},
  ground?: Tile[],
): Chronicle {
  return withCityRows(besideTheNeutral(named, ground), 'neutral', rows);
}

/** The neutral's city on a tile that yields no food. */
const NO_NEUTRAL_GROWTH = madeOf(plains(3), 'hills', [NEUTRAL_TILE]);

test('at the enemy phase, after the waves and before any enemy acts, the neutral’s city claims tile after tile while its culture pays the threshold as it then stands, each its own claim group taking the tile its script chooses, its idle population standing on the first and the second left with none', () => {
  const chronicle = withUnits(
    neutralHolding({ population: 2, resources: onlyStocks({ culture: 5 }) }),
    [standing('enemy', { q: -3, r: 0 })],
  );

  const stages = apply(CATALOGUE, chronicle, { type: 'end-turn' });
  const phase = heldBy(stages, 'enemy-phase');
  const before = heldBy(stages, 'income').at(-1)?.chronicle;
  const after = outcome(stages);
  if (before?.neutral === undefined || after.neutral === undefined) {
    throw new Error('the chronicle holds no neutral');
  }
  const [firstClaim, secondClaim, acting] = phase;
  const first = claimable(CATALOGUE, before, 'neutral')[0];
  const second = claimable(CATALOGUE, firstClaim.chronicle, 'neutral')[0];

  expect(namesOf([firstClaim, secondClaim])).toEqual([
    'claim',
    'stock',
    'held',
    'assigned',
    'claim',
    'stock',
    'held',
  ]);
  expect(acting).toMatchObject({ name: 'move' });
  expect(after.neutral.held).toEqual([NEUTRAL_TILE, first, second]);
  expect(after.neutral.assigned).toEqual([NEUTRAL_TILE, first]);
  expect(after.neutral.resources.culture).toBe(before.neutral.resources.culture - 2 - 4);
  expect(after.neutral.resources.culture).toBeLessThan(cultureThreshold(after, 'neutral'));
  expect(after.resources).toEqual(before.resources);
  expect(after.held).toEqual(before.held);
});

/** What the neutral pays for a unit and takes nothing more: the stocks of the fixture's warrior card. */
function military(amount: number): Resources {
  return onlyStocks({ military: amount });
}

test('where the neutral acts, after the waves, its units act first in unit order, then its city claims, then it enters one unit, all before any enemy acts', () => {
  const chronicle = withUnits(
    neutralHolding({ population: 3, resources: { ...military(2), culture: 2 } }),
    [neutralStanding({ q: 2, r: 0 }), standing('enemy', { q: 3, r: 0 }, { move: 0 })],
  );

  const phase = heldBy(apply(CATALOGUE, chronicle, { type: 'end-turn' }), 'enemy-phase');

  expect(phase.map((stage) => stage.name)).toEqual([
    'attack',
    'claim',
    'stock',
    'population',
    'enter',
    'attack',
  ]);
  expect(phase[0]).toMatchObject({ attacker: { q: 2, r: 0 }, target: { q: 3, r: 0 } });
});

test('the neutral enters a unit as the player’s city plays a unit card: the card its script names, its cost paid out of the neutral’s stocks, one idle population taken, the unit of the neutral’s on its city’s tile under its guard’s script', () => {
  const chronicle = neutralHolding({ population: 2, resources: military(2) });
  const { cost } = cardOf(CATALOGUE, 'PH_Warrior');

  const phase = heldBy(apply(CATALOGUE, chronicle, { type: 'end-turn' }), 'enemy-phase');
  const after = phase.at(-1)?.chronicle;

  expect(namesOf(phase)).toEqual(['stock', 'population', 'enter']);
  expect(after?.neutral).toMatchObject({
    population: 1,
    resources: { military: 2 - (cost.military ?? 0) },
  });
  expect(after?.units).toEqual([
    expect.objectContaining({
      faction: 'neutral',
      script: neutralOf(CATALOGUE, QUIET).scripts.guard,
      tile: NEUTRAL_TILE,
      stats: unitKind(CATALOGUE, 'PH_Warrior'),
    }),
  ]);
});

test('the neutral enters nothing where it would take its last population, where none is idle, where a unit stands on its city’s tile or where its stocks fall short, and raises no stage', () => {
  const holding = (rows: Partial<CityRows>): Chronicle =>
    neutralHolding(rows, {}, NO_NEUTRAL_GROWTH);
  const blocked = [
    holding({ population: 1, resources: military(2) }),
    holding({
      population: 2,
      held: [NEUTRAL_TILE, { q: 2, r: 0 }],
      assigned: [NEUTRAL_TILE, { q: 2, r: 0 }],
      resources: military(2),
    }),
    withUnits(holding({ population: 2, resources: military(2) }), [neutralStanding(NEUTRAL_TILE)]),
    holding({ population: 2, resources: military(1) }),
  ];

  for (const chronicle of blocked) {
    expect(
      namesOf(heldBy(apply(CATALOGUE, chronicle, { type: 'end-turn' }), 'enemy-phase')),
    ).toEqual([]);
  }
});

test('the neutral enters one unit where it acts, however many it could pay for, and its claim takes the idle population ahead of its entry', () => {
  const plenty = neutralHolding({ population: 4, resources: military(10) });
  const claiming = neutralHolding({ population: 2, resources: { ...military(2), culture: 2 } });

  expect(namesOf(heldBy(apply(CATALOGUE, plenty, { type: 'end-turn' }), 'enemy-phase'))).toEqual([
    'stock',
    'population',
    'enter',
  ]);
  expect(
    heldBy(apply(CATALOGUE, claiming, { type: 'end-turn' }), 'enemy-phase').map(
      (stage) => stage.name,
    ),
  ).toEqual(['claim']);
});

test('a unit the neutral enters waits for the next enemy phase to act, and acts at it', () => {
  const chronicle = withUnits(neutralHolding({ population: 2, resources: military(2) }), [
    standing('enemy', { q: 2, r: 0 }, { move: 0, damage: 0 }),
  ]);

  const entered = endedTurn(chronicle);

  expect(attacksOf(chronicle)).toEqual([['2,0', '1,0']]);
  expect(attacksOf(entered)).toEqual([
    ['1,0', '2,0'],
    ['2,0', '1,0'],
  ]);
});

/** The fixture's content, its quiet age's neutral choosing as the test lays over its script. */
function neutralScripted(script: Partial<NeutralScript>): Catalogue {
  const quiet = ageOf(CATALOGUE, QUIET);
  const neutral = neutralOf(CATALOGUE, QUIET);
  return catalogued(
    changed({
      ages: {
        ...CATALOGUE.ages,
        [QUIET]: { ...quiet, neutral: { ...neutral, script: { ...neutral.script, ...script } } },
      },
    }),
  );
}

test('where the neutral acts, after its claims and before its entry, its script lays its population over the tiles its city holds as one assign group, each population off a tile it leaves out and onto one it names, the rest idle for the entry; an answer naming a tile it does not hold, a tile twice or more tiles than its population is a runtime error, nothing moved, and the entry lands', () => {
  const [named, left, unworked] = [
    { q: 2, r: 0 },
    { q: 2, r: -1 },
    { q: 1, r: 1 },
  ];
  const chronicle = neutralHolding({
    population: 3,
    held: [NEUTRAL_TILE, named, left, unworked],
    assigned: [NEUTRAL_TILE, left],
    resources: military(2),
  });
  const phaseOn = (catalogue: Catalogue) =>
    heldBy(apply(catalogue, chronicle, { type: 'end-turn' }), 'enemy-phase');
  const entered = ['stock', 'population', 'enter'];

  const laid = phaseOn(neutralScripted({ assigns: () => [named] }));

  expect(namesOf(laid)).toEqual(['assign', 'assigned', 'assigned', 'assigned', ...entered]);
  expect(heldBy(laid, 'assign')).toMatchObject([
    { tile: NEUTRAL_TILE },
    { tile: left },
    { tile: named },
  ]);
  expect(laid.at(-1)?.chronicle.neutral).toMatchObject({ population: 2, assigned: [named] });
  expect(namesOf(phaseOn(neutralScripted({ assigns: () => [left, NEUTRAL_TILE] })))).toEqual(
    entered,
  );
  for (const assigns of [
    () => [CITY],
    () => [named, named],
    () => [NEUTRAL_TILE, named, left, unworked],
  ]) {
    const straying = phaseOn(neutralScripted({ assigns }));
    expect(namesOf(straying)).toEqual(['runtime-error', ...entered]);
    expect(straying.at(-1)?.chronicle.neutral?.assigned).toEqual([NEUTRAL_TILE, left]);
  }
});

test('a neutral’s script naming a card its ratio does not name raises a runtime error at the enemy phase and enters nothing', () => {
  const straying = neutralScripted({ enters: () => 'PH_Worker' });
  const chronicle = neutralHolding({ population: 2, resources: military(2) });

  expect(namesOf(heldBy(apply(straying, chronicle, { type: 'end-turn' }), 'enemy-phase'))).toEqual([
    'runtime-error',
  ]);
});

test('a chronicle launched on a region dealing the neutral’s city opens with one worker of the neutral’s standing on its city’s tile under its workers’ script, the first unit dealt, its city as it stands without; a neutral keeping no worker kind opens with none', () => {
  for (const seed of [0, 1234]) {
    const working = launched(WORKING, AGE, CLEARING, seed, CIVILIZATION, []).chronicle;
    const bare = launched(CATALOGUE, AGE, CLEARING, seed, CIVILIZATION, []).chronicle;
    const neutralsOf = (chronicle: Chronicle) =>
      chronicle.units.filter((unit) => unit.faction === 'neutral');

    expect(neutralsOf(working)).toEqual([
      expect.objectContaining({
        id: FIRST_UNIT_NUMBER,
        script: WORKER_SCRIPT,
        tile: working.neutral?.city,
        stats: unitKind(WORKING, 'PH_Worker'),
      }),
    ]);
    expect(working.neutral).toEqual(bare.neutral);
    expect(neutralsOf(bare)).toEqual([]);
  }
});

/** What the neutral pays for the fixture's farm, and nothing besides. */
const FARM_COST: Resources = onlyStocks(cardOf(WORKING, 'PH_Farm').cost);

/**
 * `besideTheNeutral` in the first age as the fixture's own content opens it, no worker standing, the
 * neutral's city carrying the rows named and the units named standing: the ground `WORKING` plays on.
 */
function workingBeside(
  rows: Partial<CityRows>,
  units: readonly Standing[],
  ground: Tile[] = plains(3),
): Chronicle {
  return withUnits(withCityRows(besideTheNeutral({ age: AGE }, ground), 'neutral', rows), units);
}

/** A worker of the neutral's standing on the tile under `WORKER_SCRIPT`. */
function neutralWorker(tile: TileCoords): Standing {
  return neutralStanding(tile, { script: WORKER_SCRIPT, stats: WORKER_STATS });
}

/** `WORKING`, its workers' script staying where it stands and answering the act named. */
function workersAnswering(act: (unit: Unit) => ScriptAct): Catalogue {
  return catalogued({
    ...WORKING,
    scripts: {
      ...WORKING.scripts,
      [WORKER_SCRIPT]: {
        moveTo: (_catalogue, chronicle, unit) => ({
          landing: { tile: unit.tile, cost: 0 },
          rng: chronicle.rng,
        }),
        acts: (_catalogue, _chronicle, unit) => act(unit),
      },
    },
  });
}

test('where the neutral’s units act, a worker of its plays the card its script names on the tile it stands on as the player plays one through a worker: one neutral-played group, the cost out of the neutral’s stocks, the worker’s action and move points spent, and the tile relaid', () => {
  const plain = { q: 2, r: 0 };
  const chronicle = workingBeside({ held: [NEUTRAL_TILE, plain], resources: FARM_COST }, [
    neutralWorker(plain),
  ]);

  const phase = heldBy(apply(WORKING, chronicle, { type: 'end-turn' }), 'enemy-phase');
  const after = outcome(phase);

  expect(namesOf(phase)).toEqual(['neutral-played', 'stock', 'action-spent', 'retiled']);
  expect(after.neutral?.resources.production).toBe(0);
  expect(unitAt(after.units, plain)).toMatchObject({ action: 0, movePoints: 0 });
  expect(tileAt(after.tiles, plain)?.building).toBe('PH_Farm');
});

/** `WORKING`, its workers answering the card named on the tile each stands on. */
function everyWorkerPlays(card: string): Catalogue {
  return workersAnswering((unit) => ({ act: 'play', card, tile: unit.tile }));
}

test('a worker of the neutral’s plays nothing, and acts no more that phase, where the neutral cannot pay for the card or the card refuses the tile its city holds for the neutral', () => {
  const [plain, hills] = [
    { q: 2, r: 0 },
    { q: 2, r: -1 },
  ];
  const ground = madeOf(plains(3), 'hills', [hills]);
  const plenty = { ...FARM_COST, production: 10 };
  const holding = (resources: Resources, tile: TileCoords): Chronicle =>
    workingBeside({ held: [NEUTRAL_TILE, tile], resources }, [neutralWorker(tile)], ground);

  expect(enemyPhaseOf(holding(onlyStocks({}), plain), everyWorkerPlays('PH_Farm'))).toEqual([]);
  expect(enemyPhaseOf(holding(plenty, plain), everyWorkerPlays('PH_Mine'))).toEqual([]);
  expect(enemyPhaseOf(holding(plenty, hills), everyWorkerPlays('PH_Mine'))).toEqual([
    'neutral-played',
    'stock',
    'action-spent',
    'retiled',
  ]);
});

test('a play answered with a card the neutral’s workers do not play, by an enemy, by an embarked worker of the neutral’s, on a tile the worker does not stand on or on one the neutral’s city does not hold is a runtime error and plays nothing', () => {
  const [plain, coast, unheld] = [
    { q: 2, r: 0 },
    { q: 2, r: -1 },
    { q: 2, r: 1 },
  ];
  const resources = { ...FARM_COST, production: 10 };
  const rows = { held: [NEUTRAL_TILE, plain, coast], resources };
  const afloat = neutralWorker(coast);
  const embarked = { ...afloat, entering: { ...afloat.entering, embarkedMove: EMBARKED_MOVE } };

  expect(
    enemyPhaseOf(workingBeside(rows, [neutralWorker(plain)]), everyWorkerPlays('PH_Lodge')),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      workingBeside(
        rows,
        [enemyStanding(plain, undefined, { script: WORKER_SCRIPT, stats: WORKER_STATS })],
        NO_NEUTRAL_GROWTH,
      ),
      everyWorkerPlays('PH_Farm'),
    ),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      workingBeside(rows, [embarked], madeOf(plains(3), 'coast', [coast])),
      everyWorkerPlays('PH_Farm'),
    ),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      workingBeside(rows, [neutralWorker(unheld)]),
      workersAnswering(() => ({ act: 'play', card: 'PH_Farm', tile: plain })),
    ),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      workingBeside(rows, [neutralWorker(unheld)], madeOf(plains(3), 'hills', [unheld])),
      everyWorkerPlays('PH_Mine'),
    ),
  ).toEqual(['runtime-error']);
});

test('the neutral enters a unit of a worker kind under its workers’ script', () => {
  const neutral = neutralOf(WORKING, AGE);
  const entering = catalogued(
    changed({
      ages: {
        ...WORKING.ages,
        [AGE]: {
          ...ageOf(WORKING, AGE),
          neutral: { ...neutral, script: { ...neutral.script, enters: () => 'PH_Worker' } },
        },
      },
    }),
  );
  const chronicle = workingBeside(
    { population: 2, resources: onlyStocks(cardOf(WORKING, 'PH_Worker').cost) },
    [],
    NO_NEUTRAL_GROWTH,
  );

  const after = outcome(apply(entering, chronicle, { type: 'end-turn' }));

  expect(after.units).toEqual([
    expect.objectContaining({
      faction: 'neutral',
      script: WORKER_SCRIPT,
      tile: NEUTRAL_TILE,
      stats: unitKind(WORKING, 'PH_Worker'),
    }),
  ]);
});

test('a neutral’s script choosing a tile it was not offered raises a runtime error at the enemy phase, its city claiming nothing more that phase, and the enemies act on', () => {
  const straying = neutralScripted({ claims: () => CITY });
  const chronicle = withUnits(neutralHolding({ resources: onlyStocks({ culture: 5 }) }), [
    standing('enemy', { q: -3, r: 0 }),
  ]);

  const stages = apply(straying, chronicle, { type: 'end-turn' });
  const phase = heldBy(stages, 'enemy-phase');
  const after = outcome(stages);

  expect(claimable(straying, chronicle, 'neutral')).not.toEqual([]);
  expect(namesOf(phase).slice(0, 2)).toEqual(['runtime-error', 'move']);
  expect(namesOf(phase)).not.toContain('claim');
  expect(after.neutral?.held).toEqual(chronicle.neutral?.held);
  expect(after.turn).toBe(chronicle.turn + 1);
});

test('the neutral’s city claims no tile the player holds nor one a unit of another faction stands on, the player’s or an enemy, and with none left to claim, or no culture to pay with, it claims nothing', () => {
  const [enemyOn, ...playersOn] = neighbours(NEUTRAL_TILE).filter(
    (tile) => tileKey(tile) !== tileKey(CITY),
  );
  const boxedIn = withUnits(neutralHolding({ resources: onlyStocks({ culture: 20 }) }), [
    standing('enemy', enemyOn, { move: 0 }),
    ...playersOn.map((tile) => standing('player', tile)),
  ]);
  const penniless = besideTheNeutral();

  expect(claimable(CATALOGUE, boxedIn, 'neutral')).toEqual([]);
  expect(
    namesOf(heldBy(apply(CATALOGUE, boxedIn, { type: 'end-turn' }), 'enemy-phase')),
  ).not.toContain('claim');
  expect(claimable(CATALOGUE, penniless, 'neutral')).not.toEqual([]);
  expect(namesOf(heldBy(apply(CATALOGUE, penniless, { type: 'end-turn' }), 'enemy-phase'))).toEqual(
    [],
  );
});

/**
 * The tiles the neutral's city claimed through the turn that chronicle ends, in sight of the player,
 * in fog, and never charted, each with the snapshot the turn left of it.
 */
function neutralClaimed(
  chronicle: Chronicle,
): Record<'inSight' | 'inFog' | 'uncharted', (Snapshot | undefined)[]> {
  const after = endedTurn(chronicle);
  const seen = inSight(CATALOGUE, after);
  const kept = new Map(after.snapshots.map((snapshot) => [tileKey(snapshot), snapshot]));
  const claimed = (after.neutral?.held ?? []).filter(
    (tile) => !(chronicle.neutral?.held ?? []).some((held) => tileKey(held) === tileKey(tile)),
  );
  const where = (tile: TileCoords): 'inSight' | 'inFog' | 'uncharted' =>
    seen.has(tileKey(tile)) ? 'inSight' : kept.has(tileKey(tile)) ? 'inFog' : 'uncharted';
  const sorted: Record<'inSight' | 'inFog' | 'uncharted', (Snapshot | undefined)[]> = {
    inSight: [],
    inFog: [],
    uncharted: [],
  };
  for (const tile of claimed) sorted[where(tile)].push(kept.get(tileKey(tile)));
  return sorted;
}

test('the neutral’s city claims tiles the player never charted, and its claims chart nothing', () => {
  const { uncharted } = neutralClaimed(neutralHolding({ resources: onlyStocks({ culture: 100 }) }));

  expect(uncharted).not.toEqual([]);
});

test('a tile the neutral’s city claims in the player’s sight is charted inside its border, and one in fog keeps the border it was last seen inside', () => {
  const { inSight: seen, inFog } = neutralClaimed(
    neutralHolding({ resources: onlyStocks({ culture: 100 }) }, { reach: 3 }),
  );

  expect(seen).not.toEqual([]);
  expect(inFog).not.toEqual([]);
  for (const snapshot of seen) expect(snapshot?.holder).toBe('neutral');
  for (const snapshot of inFog) expect(snapshot?.holder).toBeUndefined();
});

test('the same claim on the same chronicle gives the same chronicle back', () => {
  const city = ringed(3, { resources: onlyStocks({ culture: 20 }) });
  const untouched = structuredClone(city);

  expect(outcome(apply(CATALOGUE, city, claimOf({ q: 2, r: 0 })))).toEqual(
    outcome(apply(CATALOGUE, city, claimOf({ q: 2, r: 0 }))),
  );
  expect(city).toEqual(untouched);
});
