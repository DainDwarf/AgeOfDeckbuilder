import { expect, test } from 'vitest';
import { chartedTile } from './cards';
import { type Catalogue, catalogued, type EnemyScript, unitKind, type Wave } from './catalogue';
import { apply, outcome } from './chronicle';
import { cityCommand, claimable } from './city';
import { attackOrNone, enteredAround, enteredOnCamp, raided } from './enemies';
import {
  aimedAt,
  attackOn,
  attacksOf,
  buildingAt,
  CAMP,
  CAMP_KIND,
  CAMPS,
  CATALOGUE,
  CITY,
  CIVILIZATION,
  camped,
  camping,
  cityOf,
  claimOf,
  culture,
  dealing,
  EMBARKED_MOVE,
  endedTurn,
  enemiesOf,
  enemyStanding,
  everyCard,
  field,
  fullDraw,
  heldBy,
  idsOf,
  madeOf,
  movesOf,
  NO_GROWTH,
  namesOf,
  only,
  opening,
  plains,
  pointsOf,
  preparing,
  RAIDER_ROW,
  REGION,
  REGIONS,
  raidingFrom,
  ringed,
  SCRIPT,
  SLOW_SLINGER,
  type Standing,
  stagedBy,
  standing,
  unitNamed,
  WORKER_STATS,
  withUnits,
  worker,
} from './fixtures';
import {
  CENTRE,
  distance,
  MOVE_POINT,
  neighbours,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { terrainKind } from './map-kinds';
import { RESOURCES } from './resources';
import { nextRng, seedRng } from './rng';
import { type Stage, walked } from './stages';
import type { Chronicle } from './state';
import { attackable, type Unit, unitAt } from './units';

/** An age and a timeline dealing the raid on the second turn, and no other deal. */
const RAID_ON_SECOND = dealing({ turn: 2, event: 'PH_Hardship' });

/** A stage carrying the one tile it happened on. */
type Tiled = Extract<Stage, { readonly tile: TileCoords }>;

/** Every stage of that name the end of turn stages, as the tile each carries. */
function tilesStaged(
  name: Tiled['name'],
  chronicle: Chronicle,
  catalogue: Catalogue = CATALOGUE,
): string[] {
  const named = (stage: Stage): stage is Tiled => stage.name === name;
  return [...walked(apply(catalogue, chronicle, { type: 'end-turn' }))]
    .filter(named)
    .map((stage) => tileKey(stage.tile));
}

test('a capture ends the end of turn on its own stage, with the ending set', () => {
  const overrun = cityOf(['urban'], {
    tiles: field(2),
    hand: ['PH_Harvest'],
    drawPile: ['PH_Worker', 'PH_Warrior'],
    units: [preparing(standing('enemy', CITY))],
  });

  const stages = apply(CATALOGUE, overrun, { type: 'end-turn' });
  const last = stages[stages.length - 1];

  expect(namesOf(stages)).toEqual(['discarded', 'grow', 'income', 'enemy-phase', 'ended']);
  expect(heldBy(stages, 'enemy-phase').map(({ name }) => name)).toEqual(['ended']);
  expect(last.chronicle.ending).toEqual({
    outcome: 'defeat',
    cause: 'capture',
    turn: overrun.turn,
  });
  expect(last.chronicle.turn).toBe(overrun.turn);
  expect(last.chronicle.hand).toEqual([]);
});

test('a camp captured at the end of the turn leaves its tile claimed like any other', () => {
  const camp = { q: 2, r: 0 };
  const besieging = ringed(3, {
    ...NO_GROWTH,
    tiles: camped(field(3), [camp]),
    resources: culture(20),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = endedTurn(besieging);

  expect(tilesStaged('camp-capture', besieging)).toEqual([tileKey(camp)]);
  expect(claimable(CATALOGUE, taken).map(tileKey)).toContain(tileKey(camp));
  expect(cityCommand(CATALOGUE, taken, camp)).toEqual(claimOf(camp));
  expect(stagedBy(taken, claimOf(camp))).toEqual(['claim', 'stock', 'held', 'assigned']);
  expect(outcome(apply(CATALOGUE, taken, claimOf(camp))).held.map(tileKey)).toContain(
    tileKey(camp),
  );
});

test('a unit of the player’s standing on a camp when the turn ends captures it', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });

  const taken = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));

  expect(stagedBy(besieging, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'camp-capture',
    'retiled',
    'dealt',
  ]);
  expect(tilesStaged('camp-capture', besieging)).toEqual([tileKey(camp)]);
  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(taken.discardPile).toEqual([]);
});

test('a capture deals the camp’s rewards and stops the end of turn before the tick, and the take resumes it: the one taken is added to the discard pile, the other added nowhere', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('player', camp)],
  });
  const dealt = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));
  const cache = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 1 }));

  expect(dealt.deals).toEqual([{ of: 'camp', rewards: ['PH_Spoils', 'PH_Cache'] }]);
  expect(dealt.turn).toBe(besieging.turn);
  expect(dealt.hand).toEqual([]);
  expect(stagedBy(dealt, { type: 'take', at: 1 })).toEqual([
    'reward',
    'taken',
    'added',
    'turn',
    'turn',
    'drawn',
  ]);
  expect(cache.turn).toBe(besieging.turn + 1);
  expect(cache.deals).toEqual([]);
  expect(idsOf(cache.discardPile)).toEqual(['PH_Cache']);
  expect(idsOf(cache.hand)).toEqual(fullDraw());
  expect(everyCard(cache)).not.toContain('PH_Spoils');
});

test('a worker of the player’s captures a camp as any unit does', () => {
  const camp = { q: 4, r: 0 };
  const worked = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [worker(camp)],
  });

  const taken = endedTurn(worked, 'PH_Spoils');

  expect(buildingAt(taken, camp)).toBeUndefined();
  expect(idsOf(taken.discardPile)).toEqual(['PH_Spoils']);
});

test('a unit killed in the enemy phase captures the camp it stood on no longer', () => {
  const camp = { q: 4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    units: [
      worker(camp),
      standing('enemy', { q: 3, r: 0 }, { move: 0, damage: WORKER_STATS.health }),
    ],
  });

  const taken = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));

  expect(taken.units.some((unit) => unit.faction === 'player')).toBe(false);
  expect(buildingAt(taken, camp)).toBe(CAMP.building);
  expect(taken.deals).toEqual([]);
});

test('a chronicle that fell in the enemy phase captures no camp', () => {
  const camp = { q: 4, r: 0 };
  const overrun = cityOf(['urban'], {
    tiles: camped(field(4), [camp]),
    units: [standing('player', camp), preparing(standing('enemy', CITY))],
  });

  const fallen = outcome(apply(CATALOGUE, overrun, { type: 'end-turn' }));

  expect(stagedBy(overrun, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'enemy-phase',
    'ended',
  ]);
  expect(buildingAt(fallen, camp)).toBe(CAMP.building);
  expect(fallen.deals).toEqual([]);
});

test('a captured camp is silent: the raid enters on a camp still standing', () => {
  const [kept, ...besieged] = CAMPS;
  const held = cityOf(['urban'], {
    tiles: camped(field(4), CAMPS),
    units: besieged.map(worker),
    ...RAID_ON_SECOND,
  });

  const raided = endedTurn(held, 'PH_Raid');

  for (const camp of besieged) expect(buildingAt(raided, camp)).toBeUndefined();
  expect(buildingAt(raided, kept)).toBe(CAMP.building);
  expect(raided.units.find((unit) => unit.faction === 'enemy')?.tile).toEqual(kept);
});

// the fixture's raid enters three warriors from turn 20
const RAID_OF_THREE = dealing({ turn: 20, event: 'PH_Hardship' });

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function enteredSince(before: Chronicle, after: Chronicle): TileCoords[] {
  return enemiesOf(after)
    .filter((unit) => unit.id >= before.nextUnit)
    .map((unit) => unit.tile);
}

test('a raid of three enters on its camp’s tile, then on the nearest free tile around it, ring by ring', () => {
  const camp = { q: 3, r: 0 };
  const [open, ...taken] = neighbours(camp);
  const city = cityOf(['urban'], {
    tiles: camped(field(5), [camp]),
    units: taken.map(worker),
    turn: 19,
    ...RAID_OF_THREE,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const [first, second, third, ...more] = enteredSince(seeded, endedTurn(seeded, 'PH_Raid'));

    expect(first).toEqual(camp);
    expect(second).toEqual(open);
    expect(distance(third, camp)).toBe(2);
    expect(more).toEqual([]);
  }
});

test('a raid through a camp a unit stands on enters beside the camp’s tile', () => {
  const camp = { q: 3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(5), [camp]),
    units: [standing('enemy', camp, { move: 0 })],
    ...RAID_ON_SECOND,
  });

  const entered = enteredSince(city, endedTurn(city, 'PH_Raid'));

  expect(entered).toHaveLength(1);
  expect(distance(entered[0], camp)).toBe(1);
});

test('a raid drawn through the outer ring enters on a tile of the disc farthest from its centre, camps standing', () => {
  const city = cityOf(['urban'], { tiles: camped(field(5), CAMPS), ...RAID_ON_SECOND });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const entered = enteredSince(
      seeded,
      endedTurn(seeded, 'PH_Raid', camping({ raidCampOdds: 0 })),
    );

    expect(entered).toHaveLength(1);
    expect(distance(entered[0], CENTRE)).toBe(5);
  }
});

test('a chronicle whose every camp is captured takes its raid on the outer ring', () => {
  const held = cityOf(['urban'], {
    tiles: camped(field(5), CAMPS),
    units: CAMPS.map(worker),
    ...RAID_ON_SECOND,
  });

  const raided = endedTurn(held, 'PH_Raid');
  const entered = enteredSince(held, raided);

  expect(raided.turn).toBe(2);
  expect(raided.tiles.some((tile) => tile.building === CAMP.building)).toBe(false);
  expect(entered).toHaveLength(1);
  expect(distance(entered[0], CENTRE)).toBe(5);
});

test('a raid never enters on the city’s tile, and one larger than the tiles left to it enters what it can', () => {
  const camp = { q: 1, r: 0 };
  const beyond = { q: 2, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(only(4, [CITY, camp, beyond]), [camp]),
    turn: 19,
    ...RAID_OF_THREE,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };

    expect(enteredSince(seeded, endedTurn(seeded, 'PH_Raid'))).toEqual([camp, beyond]);
  }
});

/** The fixture's camps in the order the map lists their tiles. */
function campsInTileOrder(chronicle: Chronicle): string[] {
  return chronicle.tiles.filter((tile) => tile.building === CAMP.building).map(tileKey);
}

test('at odds of one every camp enters a guard of its own once the enemies have acted, a stage each in tile order ahead of the captures: on the camp where its tile is free, and beside it where a unit stands on it', () => {
  const held = { q: 4, r: 0 };
  const guarded = { q: 0, r: -4 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), CAMPS),
    drawPile: fullDraw(),
    units: [
      standing('player', held),
      standing('enemy', guarded, { move: 0 }),
      standing('enemy', { q: 3, r: 0 }, { move: 0 }),
    ],
  });
  const camps = campsInTileOrder(city);
  const stages = apply(camping({ odds: 1 }), city, { type: 'end-turn' });
  const entries = [...walked(stages)].flatMap((stage) =>
    stage.name === 'enter' ? [stage.tile] : [],
  );
  const rolled = heldBy(stages, 'enemy-phase').at(-1)?.chronicle;
  if (rolled === undefined) throw new Error('the enemy phase staged nothing');

  expect(namesOf(stages)).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'attack',
    'action-spent',
    'damaged',
    ...camps.map(() => 'enter'),
    'camp-capture',
    'retiled',
    'dealt',
  ]);
  for (const [at, camp] of camps.entries()) {
    const taken = camp === tileKey(held) || camp === tileKey(guarded);
    const [q, r] = camp.split(',').map(Number);
    expect(distance(entries[at], { q, r })).toBe(taken ? 1 : 0);
  }
  expect(
    enemiesOf(outcome(stages))
      .filter((unit) => unit.id >= city.nextUnit)
      .map((unit) => (unit.faction === 'enemy' ? unit.script : undefined)),
  ).toEqual(camps.map(() => CAMP.roll[0].script));
  expect(campsNamed(rolled).slice(-camps.length)).toEqual(camps);
});

/** A camp across the water, on an island of two tiles at the edge of a disc of five, coast all around. */
function island(): { camp: TileCoords; beside: TileCoords; tiles: Tile[] } {
  const camp = { q: 4, r: 0 };
  const beside = { q: 5, r: 0 };
  const shore = new Set([camp, beside].map(tileKey));
  const coast = [...neighbours(camp), ...neighbours(beside)].filter(
    (coord) => !shore.has(tileKey(coord)),
  );
  return { camp, beside, tiles: camped(field(5, coast), [camp]) };
}

test('a camp across the water enters its guard on the nearest free tile of its island, never on the city’s ground, and nowhere where none of its island is free', () => {
  const { camp, beside, tiles } = island();
  const held = (...on: TileCoords[]): Chronicle =>
    cityOf(['urban'], {
      ...NO_GROWTH,
      tiles,
      drawPile: fullDraw(),
      units: on.map((tile) => standing('enemy', tile, { move: 0 })),
    });

  expect(tilesStaged('enter', held(camp), camping({ odds: 1 }))).toEqual([tileKey(beside)]);
  expect(tilesStaged('enter', held(camp, beside), camping({ odds: 1 }))).toEqual([]);
});

test('a raid through a camp across the water enters on the camp’s island, never on the city’s ground, and the ones its island has no free tile for enter nowhere', () => {
  const { camp, beside, tiles } = island();
  const city = cityOf(['urban'], { tiles, turn: 19, ...RAID_OF_THREE });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };

    expect(enteredSince(seeded, endedTurn(seeded, 'PH_Raid'))).toEqual([camp, beside]);
  }
});

test('a raid never draws a camp whose island has no free tile: it enters through the outer ring', () => {
  const { camp, beside, tiles } = island();
  const city = cityOf(['urban'], {
    tiles,
    units: [camp, beside].map((tile) => standing('enemy', tile, { move: 0 })),
    ...RAID_ON_SECOND,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const entered = enteredSince(seeded, endedTurn(seeded, 'PH_Raid'));

    expect(entered).toHaveLength(1);
    expect(distance(entered[0], CENTRE)).toBe(5);
  }
});

test('a raid never draws a ring door whose ground has no free tile: it enters through the camp, however its odds lean to the ring', () => {
  const corridor = [1, 2, 3, 4, 5].map((q) => ({ q, r: 0 }));
  const camp = { q: -4, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(only(5, [CITY, ...corridor, camp, { q: -5, r: 0 }]), [camp]),
    units: corridor.map((tile) => standing('enemy', tile, { move: 0 })),
    ...RAID_ON_SECOND,
  });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const raided = endedTurn(seeded, 'PH_Raid', camping({ raidCampOdds: 0 }));

    expect(enteredSince(seeded, raided)).toEqual([camp]);
  }
});

/** A city on an island of two tiles, coast to the disc's edge all around it, no camp standing. */
const MAROONED = only(5, [CITY, { q: 1, r: 0 }]);

test('a raid with no camp standing whose city no ground of the outer ring is reached from has no door where the enemies do not embark: it enters nobody and is a runtime-error', () => {
  const city = cityOf(['urban'], { tiles: MAROONED, ...RAID_ON_SECOND });
  const dealt = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'runtime-error']);
});

test('where the enemies embark, a raid finds a door on the coast of the outer ring and enters embarked there, on the camp’s embarked move, its move points and its action full', () => {
  const rowing = camping({ embarkedMove: EMBARKED_MOVE });
  const city = cityOf(['urban'], { tiles: MAROONED, ...RAID_ON_SECOND });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const [raider, ...more] = enemiesOf(endedTurn(seeded, 'PH_Raid', rowing));

    expect(more).toEqual([]);
    expect(distance(raider.tile, CENTRE)).toBe(5);
    expect(raider).toMatchObject({
      embarked: true,
      stats: { move: EMBARKED_MOVE },
      movePoints: EMBARKED_MOVE,
      action: unitKind(rowing, CAMP_KIND).action,
    });
  }
});

test('a raid of three through a coast door enters every enemy embarked, on the water around the door, ring by ring', () => {
  const rowing = camping({ embarkedMove: EMBARKED_MOVE });
  const city = cityOf(['urban'], { tiles: MAROONED, turn: 19, ...RAID_OF_THREE });

  for (const seed of SEEDS) {
    const seeded = { ...city, rng: seedRng(seed) };
    const raided = endedTurn(seeded, 'PH_Raid', rowing);
    const [door, ...after] = enemiesOf(raided);

    expect(after).toHaveLength(2);
    expect(distance(door.tile, CENTRE)).toBe(5);
    for (const enemy of after) expect(distance(enemy.tile, door.tile)).toBe(1);
    for (const enemy of [door, ...after]) {
      expect(enemy.embarked).toBe(true);
      expect(tileAt(raided.tiles, enemy.tile)?.terrain).toBe('coast');
    }
  }
});

test('the chronicle opens with one guard of each camp the map was dealt standing on it, in tile order, ahead of every unit the settle enters', () => {
  const opened = opening(camped(plains(5), CAMPS), {
    civilization: { ...CIVILIZATION, cards: [], settle: ['PH_Band'] },
  });
  const camps = campsInTileOrder(opened);
  const banded = outcome(apply(CATALOGUE, opened, aimedAt(CITY, 1)));

  expect(
    opened.units.map((unit) => ({
      id: unit.id,
      tile: tileKey(unit.tile),
      script: unit.faction === 'enemy' ? unit.script : undefined,
    })),
  ).toEqual(camps.map((tile, at) => ({ id: at + 1, tile, script: CAMP.opening[0].script })));
  expect(campsNamed(opened)).toEqual(camps);
  expect(unitAt(banded.units, CITY)?.id).toBe(camps.length + 1);
});

/** The kinds of the enemies standing on the chronicle, in the order they entered. */
function kindsOf(chronicle: Chronicle): string[] {
  return enemiesOf(chronicle).map((unit) => unit.stats.type);
}

/** A city on a disc out to four with a camp on each of `CAMPS`, its turn ending with nothing grown. */
function rollingCity(): Chronicle {
  return cityOf(['urban'], { ...NO_GROWTH, tiles: camped(field(4), CAMPS), drawPile: fullDraw() });
}

test('a table of two rows draws each enemy’s row by their weights from the seeded generator, the heavier the likelier, and a raid of several comes as a mix', () => {
  const [row] = CAMP.roll;
  const rows = [
    { ...row, weight: 2 },
    { ...row, kind: 'PH_Slinger', weight: 1 },
  ];
  const city = rollingCity();
  const rolledOn = (seed: number): string[] =>
    kindsOf(
      endedTurn({ ...city, rng: seedRng(seed) }, undefined, camping({ roll: rows, odds: 1 })),
    );
  const rolled = SEEDS.flatMap(rolledOn);
  const count = (kind: string): number => rolled.filter((type) => type === kind).length;

  expect(rolled).toHaveLength(SEEDS.length * CAMPS.length);
  expect(count('PH_Slinger')).toBeGreaterThan(0);
  expect(count(CAMP_KIND)).toBeGreaterThan(count('PH_Slinger'));
  expect(count(CAMP_KIND) + count('PH_Slinger')).toBe(rolled.length);
  expect(new Set(SEEDS.map((seed) => rolledOn(seed).join(' '))).size).toBeGreaterThan(1);

  const raiding = cityOf(['urban'], {
    tiles: camped(field(5), [{ q: 3, r: 0 }]),
    turn: 19,
    ...RAID_OF_THREE,
  });
  const mixed = raidingFrom(rows.map((drawn) => ({ ...drawn, script: SCRIPT })));
  const raids = SEEDS.map((seed) =>
    kindsOf(endedTurn({ ...raiding, rng: seedRng(seed) }, 'PH_Raid', mixed)),
  );
  expect(raids.some((raid) => new Set(raid).size === 2)).toBe(true);
});

test('a roll table of two rows of one kind draws each enemy’s script with its row, by their weights from the seeded generator: the heavier the likelier, and the same seed draws the same', () => {
  const [row] = CAMP.roll;
  const rows = [
    { ...row, weight: 2 },
    { ...row, script: SCRIPT, weight: 1 },
  ];
  const city = rollingCity();
  const rolledOn = (seed: number): string[] =>
    scriptsOf(
      endedTurn({ ...city, rng: seedRng(seed) }, undefined, camping({ roll: rows, odds: 1 })),
    );
  const rolled = SEEDS.flatMap(rolledOn);
  const count = (script: string): number => rolled.filter((drawn) => drawn === script).length;

  expect(rolled).toHaveLength(SEEDS.length * CAMPS.length);
  expect(count(SCRIPT)).toBeGreaterThan(0);
  expect(count(row.script)).toBeGreaterThan(count(SCRIPT));
  expect(count(row.script) + count(SCRIPT)).toBe(rolled.length);
  for (const seed of SEEDS) expect(rolledOn(seed)).toEqual(rolledOn(seed));
  expect(new Set(SEEDS.map((seed) => rolledOn(seed).join(' '))).size).toBeGreaterThan(1);
});

test('a table whose two rows differ in kind and in script enters every enemy as one of its rows, its kind and its script drawn together', () => {
  const [row] = CAMP.roll;
  const rows = [row, { kind: 'PH_Slinger', script: SCRIPT, weight: 1 }];
  const city = rollingCity();
  const entered = SEEDS.flatMap((seed) =>
    enemiesOf(
      endedTurn({ ...city, rng: seedRng(seed) }, undefined, camping({ roll: rows, odds: 1 })),
    ).map((unit) => `${unit.stats.type} ${unit.faction === 'enemy' ? unit.script : ''}`),
  );

  expect(new Set(entered)).toEqual(new Set(rows.map(({ kind, script }) => `${kind} ${script}`)));
});

test('a table of one row draws nothing for an enemy’s row, and one of two rows draws once for each enemy', () => {
  const city = cityOf(['urban'], {
    tiles: camped(field(5), [{ q: 3, r: 0 }]),
    turn: 19,
    ...RAID_OF_THREE,
  });
  const raidedOn = (
    catalogue: Catalogue,
  ): { dealt: Chronicle['rng']; entered: Chronicle['rng'][] } => {
    const dealt = outcome(apply(catalogue, city, { type: 'end-turn' }));
    const entries = [...walked(apply(catalogue, dealt, { type: 'take', at: 0 }))].filter(
      (stage) => stage.name === 'enter',
    );
    return { dealt: dealt.rng, entered: entries.map((entry) => entry.chronicle.rng) };
  };
  const stepped = (rng: Chronicle['rng'], steps: number): Chronicle['rng'] =>
    steps === 0 ? rng : stepped(nextRng(rng).rng, steps - 1);

  const one = raidedOn(CATALOGUE);
  const two = raidedOn(raidingFrom([RAIDER_ROW, { ...RAIDER_ROW, kind: 'PH_Slinger' }]));

  // The side and the door, then the camp's own tile drawing nothing and one draw for each enemy
  // entering beside it.
  expect(one.entered).toEqual([2, 3, 4].map((steps) => stepped(one.dealt, steps)));
  expect(two.entered).toEqual([5, 6, 7].map((steps) => stepped(two.dealt, steps)));
});

test('the opening draws each camp’s enemy among the rows of its table whose kind stands on the camp’s tile: where one row alone stands, that row, drawn from nothing', () => {
  const [row] = CAMP.opening;
  const mixed = camping({ opening: [row, { ...row, kind: 'PH_Slinger' }] }, SLOW_SLINGER);
  const forests = camped(madeOf(plains(5), 'forest', CAMPS), CAMPS);
  const plain = camped(plains(5), CAMPS);

  expect(kindsOf(opening(forests, { catalogue: mixed }))).toEqual(CAMPS.map(() => CAMP_KIND));
  expect(opening(forests, { catalogue: mixed })).toEqual(opening(forests));
  expect(opening(plain, { catalogue: mixed }).rng).not.toEqual(opening(plain).rng);
});

test('a raid’s door is read on its first enemy’s kind: a camp no tile around which that kind stands on is no door for it, and it enters on the outer ring', () => {
  const { camp, beside, tiles } = island();
  const city = cityOf(['urban'], {
    tiles: madeOf(tiles, 'forest', [camp, beside]),
    turn: 19,
    ...RAID_OF_THREE,
  });
  const mixed = raidingFrom([RAIDER_ROW, { ...RAIDER_ROW, kind: 'PH_Slinger' }], SLOW_SLINGER);
  const firsts = SEEDS.map((seed) => {
    const seeded = { ...city, rng: seedRng(seed) };
    const [first] = enemiesOf(endedTurn(seeded, 'PH_Raid', mixed));
    return first;
  });

  for (const first of firsts) {
    if (first.stats.type === CAMP_KIND) expect(first.tile).toEqual(camp);
    else expect(distance(first.tile, CENTRE)).toBe(5);
  }
  expect(new Set(firsts.map((first) => first.stats.type)).size).toBe(2);
});

test('a raid enters each enemy under its row’s script and of no camp, whatever door it comes through', () => {
  const city = cityOf(['urban'], { tiles: camped(field(5), CAMPS), ...RAID_ON_SECOND });
  const [guard] = CAMP.roll;

  for (const raidCampOdds of [0, 1]) {
    const catalogue = raidingFrom([guard], camping({ raidCampOdds }));
    const raided = endedTurn(city, 'PH_Raid', catalogue);
    const entered = enemiesOf(raided).filter((unit) => unit.id >= city.nextUnit);

    expect(entered).toHaveLength(1);
    expect(entered.map((unit) => (unit.faction === 'enemy' ? unit.script : undefined))).toEqual([
      guard.script,
    ]);
    expect(campsNamed(raided)).toEqual([undefined]);
  }
});

test('an enemy’s move draws from the seeded generator where its script draws, and the phase carries on from the generator the script leaves', () => {
  const drawing: Catalogue = catalogued({
    ...CATALOGUE,
    scripts: {
      ...CATALOGUE.scripts,
      [SCRIPT]: {
        moveTo: (_catalogue, chronicle, enemy) => ({
          landing: { tile: enemy.tile, cost: 0 },
          rng: nextRng(chronicle.rng).rng,
        }),
        acts: () => ({ act: 'none' }),
      },
    },
  });
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('enemy', { q: 3, r: 0 }, { move: 0 }),
      standing('enemy', { q: -3, r: 0 }, { move: 0 }),
    ],
  });
  const phaseOf = (catalogue: Catalogue): Chronicle => {
    const stages = apply(catalogue, city, { type: 'end-turn' });
    const phase = stages.find((stage) => stage.name === 'enemy-phase');
    if (phase === undefined) throw new Error('the end of turn staged no phase');
    return phase.chronicle;
  };

  expect(phaseOf(CATALOGUE).rng).toEqual(city.rng);
  expect(phaseOf(drawing).rng).toEqual(nextRng(nextRng(city.rng).rng).rng);
  expect(outcome(apply(drawing, city, { type: 'end-turn' })).rng).toEqual(phaseOf(drawing).rng);
});

test('a warrior a camp rolls stands on the camp with its kind’s stats, its move points and its action full when the turn ends', () => {
  const city = rollingCity();
  const stats = unitKind(CATALOGUE, CAMP_KIND);

  const after = outcome(apply(camping({ odds: 1 }), city, { type: 'end-turn' }));

  expect(after.turn).toBe(city.turn + 1);
  expect(
    after.units.map((unit) => ({
      tile: tileKey(unit.tile),
      stats: unit.stats,
      movePoints: unit.movePoints,
      action: unit.action,
      script: unit.faction === 'enemy' ? unit.script : undefined,
    })),
  ).toEqual(
    campsInTileOrder(city).map((tile) => ({
      tile,
      stats,
      movePoints: stats.move,
      action: stats.action,
      script: CAMP.roll[0].script,
    })),
  );
});

test('a camp its warrior walked off in the enemy phase rolls at the same phase', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [standing('enemy', camp)],
  });

  const after = outcome(apply(camping({ odds: 1 }), city, { type: 'end-turn' }));

  expect(tilesStaged('enter', city, camping({ odds: 1 }))).toEqual([tileKey(camp)]);
  expect(enemiesOf(after).filter((unit) => tileKey(unit.tile) === tileKey(camp))).toHaveLength(1);
  expect(enemiesOf(after)).toHaveLength(2);
});

test('at odds of nought no camp enters a warrior and no stage is raised, and every camp draws all the same', () => {
  const city = rollingCity();
  const empty = cityOf(['urban'], { ...NO_GROWTH, drawPile: fullDraw(), tiles: field(4) });
  const rngAt = (odds: number): Chronicle['rng'] =>
    outcome(apply(camping({ odds }), city, { type: 'end-turn' })).rng;

  const after = outcome(apply(camping({ odds: 0 }), city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual(stagedBy(empty, { type: 'end-turn' }));
  expect(enemiesOf(after)).toEqual([]);
  expect(rngAt(0)).toEqual(rngAt(0.5));
  expect(rngAt(0)).toEqual(rngAt(1));
  expect(rngAt(0)).not.toEqual(
    outcome(apply(camping({ odds: 0 }), empty, { type: 'end-turn' })).rng,
  );
});

test('the enemy phase holds nothing at odds of nought, and its chronicle carries the draws every camp made', () => {
  const city = rollingCity();

  const stages = apply(camping({ odds: 0 }), city, { type: 'end-turn' });
  const phase = stages.find((stage) => stage.name === 'enemy-phase');
  const grow = stages.find((stage) => stage.name === 'grow');
  if (phase === undefined || grow === undefined) throw new Error('the end of turn staged no phase');

  expect(heldBy(stages, 'enemy-phase')).toEqual([]);
  expect(phase.chronicle.rng).not.toEqual(grow.chronicle.rng);
  expect(outcome(stages).rng).toEqual(
    outcome(apply(camping({ odds: 0.5 }), city, { type: 'end-turn' })).rng,
  );
});

test('the enemy phase holds each enemy’s move and attacks, then the warriors the camps roll, each entering on its camp', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp]),
    drawPile: fullDraw(),
    units: [worker({ q: 2, r: 0 }), standing('enemy', { q: 3, r: -1 }, { move: MOVE_POINT })],
  });

  const held = heldBy(apply(camping({ odds: 1 }), city, { type: 'end-turn' }), 'enemy-phase');

  expect(held.map(({ name }) => name)).toEqual(['move', 'attack', 'enter']);
  const [crossed, attack, entered] = held;
  if (attack.kind !== 'group' || attack.name !== 'attack') throw new Error('no attack staged');
  expect(attack.stages.map(({ name }) => name)).toEqual(['action-spent', 'damaged']);
  expect(attack.stages).toMatchObject([{ tile: attack.attacker }, { tile: attack.target }]);
  expect(attack.target).toEqual({ q: 2, r: 0 });
  expect(crossed).toMatchObject({ to: attack.attacker });
  expect(entered).toMatchObject({ tile: camp });
});

/** `enemyStanding`'s options for a guard of the fixture camp's. */
const GUARD = { script: CAMP.scripts.guard };

/** The camp each enemy names, in unit order, and nothing for one of no camp. */
function campsNamed(chronicle: Chronicle): (string | undefined)[] {
  return chronicle.units.flatMap((unit) =>
    unit.faction === 'enemy' ? [unit.camp === undefined ? undefined : tileKey(unit.camp)] : [],
  );
}

/** The fixture's wave: three guards of their camp send two off as raiders. */
const WAVE: Wave = { gathered: 3, sent: 2 };

const WAVING = camping({ wave: WAVE });

/** The camp the wave tests gather their guards around. */
const GATHERING = { q: 4, r: 0 };

/** The guards of `GATHERING` the wave tests count: three, the one on the camp entered first. */
const GATHERED = [
  enemyStanding(GATHERING, GATHERING, GUARD),
  enemyStanding({ q: 4, r: -1 }, GATHERING, GUARD),
  enemyStanding({ q: 3, r: 0 }, GATHERING, GUARD),
];

/** A city on a disc out to four, the camps named and the units standing on it. */
function gatheredAround(units: readonly Standing[], camps = [GATHERING]): Chronicle {
  return cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4, [{ q: 3, r: 1 }]), camps),
    drawPile: fullDraw(),
    units,
  });
}

/** The scripts the enemies carry, in unit order. */
function scriptsOf(chronicle: Chronicle): string[] {
  return chronicle.units.flatMap((unit) => (unit.faction === 'enemy' ? [unit.script] : []));
}

test('a camp whose guards counted are as many as its wave names sends as many as it names off as its raiders before any enemy acts, the one on its tile last, and they act as raiders on that phase', () => {
  const city = gatheredAround(GATHERED);

  const phase = heldBy(apply(WAVING, city, { type: 'end-turn' }), 'enemy-phase');
  const [sent] = phase;
  const moves = phase.flatMap((stage) =>
    stage.kind === 'change' && stage.name === 'move' ? [stage] : [],
  );

  expect(sent).toMatchObject({ name: 'wave-sent', tile: GATHERING });
  expect(scriptsOf(city)).toEqual(GATHERED.map(() => CAMP.scripts.guard));
  expect(sent.chronicle.units).toEqual(
    city.units.map((unit, at) => (at === 0 ? unit : { ...unit, script: CAMP.scripts.raider })),
  );
  expect(moves.map(({ from }) => from)).toEqual([
    { q: 4, r: -1 },
    { q: 3, r: 0 },
  ]);
  for (const { from, to } of moves) expect(distance(to, CITY)).toBeLessThan(distance(from, CITY));
});

test('a camp whose guards counted fall short of its wave sends none and raises no stage', () => {
  const city = gatheredAround(GATHERED.slice(0, 2));

  const stages = apply(WAVING, city, { type: 'end-turn' });

  expect(heldBy(stages, 'enemy-phase')).toEqual([]);
  expect(scriptsOf(outcome(stages))).toEqual(scriptsOf(city));
});

test('a camp’s wave counts its own guards standing ashore wherever they stand, and none embarked, none another camp’s, none of no camp, no enemy under another script and no unit of the player’s', () => {
  const other = { q: 4, r: -3 };
  const [onCamp, beside] = GATHERED;
  const third = (unit: Standing): string[] =>
    tilesStaged('wave-sent', gatheredAround([onCamp, beside, unit], [GATHERING, other]), WAVING);
  const sent = [tileKey(GATHERING)];

  const embarked = { ...GUARD, embarkedMove: EMBARKED_MOVE };

  expect(third(enemyStanding({ q: 3, r: 0 }, GATHERING, GUARD))).toEqual(sent);
  expect(third(enemyStanding({ q: -3, r: 0 }, GATHERING, GUARD))).toEqual(sent);
  expect(third(enemyStanding({ q: 3, r: 1 }, GATHERING, embarked))).toEqual([]);
  expect(third(enemyStanding({ q: 3, r: 0 }, other, GUARD))).toEqual([]);
  expect(third(enemyStanding({ q: 3, r: 0 }, undefined, GUARD))).toEqual([]);
  expect(third(enemyStanding({ q: 3, r: 0 }, GATHERING))).toEqual([]);
  expect(third(standing('player', { q: 3, r: 0 }))).toEqual([]);
});

test('a guard the player’s warrior killed on its turn leaves the count short, and no wave goes', () => {
  const city = gatheredAround([standing('player', { q: 2, r: 0 }, { damage: 4 }), ...GATHERED]);

  const killed = outcome(apply(WAVING, city, attackOn(1, { q: 3, r: 0 })));

  expect(tilesStaged('wave-sent', city, WAVING)).toEqual([tileKey(GATHERING)]);
  expect(enemiesOf(killed)).toHaveLength(GATHERED.length - 1);
  expect(tilesStaged('wave-sent', killed, WAVING)).toEqual([]);
});

test('a camp captured is one camp-capture carrying its tile, over the camp leaving the tile, its enemies no camp’s with it, and its rewards dealt', () => {
  const camp = { q: 4, r: 0 };
  const other = { q: -4, r: 0 };
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [camp, other]),
    drawPile: fullDraw(),
    units: [
      standing('player', camp),
      enemyStanding({ q: 0, r: 4 }, camp, GUARD),
      enemyStanding(other, other, GUARD),
    ],
  });

  const stages = apply(CATALOGUE, besieging, { type: 'end-turn' });
  const capture = stages.find((stage) => stage.name === 'camp-capture');
  if (capture?.kind !== 'group' || capture.name !== 'camp-capture') {
    throw new Error('no camp was captured');
  }
  const [retiled, dealt] = capture.stages;

  expect(capture.tile).toEqual(camp);
  expect(retiled).toMatchObject({ name: 'retiled', tile: camp });
  expect(buildingAt(retiled.chronicle, camp)).toBeUndefined();
  expect(campsNamed(retiled.chronicle)).toEqual([undefined, tileKey(other)]);
  expect(retiled.chronicle.deals).toEqual([]);
  expect(dealt.name).toBe('dealt');
  expect(dealt.chronicle.deals).toEqual([{ of: 'camp', rewards: CAMP.rewards }]);
  expect(outcome(stages)).toBe(capture.chronicle);
});

test('at odds of a half a seed enters on the same camps every time, and seeds differ in the camps they enter on', () => {
  const rolledOn = (seed: number): string =>
    tilesStaged('enter', { ...rollingCity(), rng: seedRng(seed) }, camping({ odds: 0.5 })).join(
      ' ',
    );
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const seed of seeds) expect(rolledOn(seed)).toBe(rolledOn(seed));
  expect(new Set(seeds.map(rolledOn)).size).toBeGreaterThan(1);
});

test('a city fallen in the enemy phase rolls no camp', () => {
  const overrun = cityOf(['urban'], {
    tiles: camped(field(4), CAMPS),
    units: [preparing(standing('enemy', CITY))],
  });

  const fallen = outcome(apply(camping({ odds: 1 }), overrun, { type: 'end-turn' }));

  expect(tilesStaged('enter', overrun, camping({ odds: 1 }))).toEqual([]);
  expect(enemiesOf(fallen)).toHaveLength(1);
  expect(fallen.rng).toEqual(overrun.rng);
});

test('the settle phase’s end rolls no camp', () => {
  const opening = cityOf(['urban'], { turn: 0, tiles: camped(field(4), CAMPS) });

  const opened = outcome(apply(camping({ odds: 1 }), opening, { type: 'end-turn' }));

  expect(tilesStaged('enter', opening, camping({ odds: 1 }))).toEqual([]);
  expect(enemiesOf(opened)).toEqual([]);
});

test('two camps captured the turn before an event is due deal two deals of rewards, and the last take opens the turn on the event, taken in turn, the draw after the last', () => {
  const camps = [
    { q: 4, r: 0 },
    { q: 0, r: 4 },
  ];
  const besieging = cityOf(['urban'], {
    ...NO_GROWTH,
    tiles: camped(field(4), [...camps, { q: -4, r: 0 }]),
    drawPile: fullDraw(),
    units: camps.map((camp) => standing('player', camp)),
    ...RAID_ON_SECOND,
  });
  const rewards = { of: 'camp', rewards: CAMP.rewards };

  const dealt = outcome(apply(CATALOGUE, besieging, { type: 'end-turn' }));
  const first = outcome(apply(CATALOGUE, dealt, { type: 'take', at: 0 }));
  const second = outcome(apply(CATALOGUE, first, { type: 'take', at: 1 }));

  expect(tilesStaged('camp-capture', besieging)).toEqual(
    besieging.tiles
      .filter((tile) => camps.some((camp) => tileKey(camp) === tileKey(tile)))
      .map(tileKey),
  );
  for (const camp of camps) expect(buildingAt(dealt, camp)).toBeUndefined();
  expect(dealt.deals).toEqual([rewards, rewards]);
  expect(dealt.turn).toBe(besieging.turn);
  expect(stagedBy(dealt, { type: 'take', at: 0 })).toEqual(['reward', 'taken', 'added']);
  expect(first.turn).toBe(besieging.turn);
  expect(stagedBy(first, { type: 'take', at: 1 })).toEqual([
    'reward',
    'taken',
    'added',
    'turn',
    'turn',
    'deal',
    'rolled',
    'dealt',
  ]);
  expect(second.deals).toEqual([{ of: 'event', event: 'PH_Hardship' }]);
  expect(idsOf(second.discardPile)).toEqual(['PH_Spoils', 'PH_Cache']);
  expect(second.hand).toEqual([]);
  expect(stagedBy(second, { type: 'take', at: 0 })).toEqual(['answer', 'taken', 'enter', 'drawn']);
  expect(outcome(apply(CATALOGUE, second, { type: 'take', at: 0 })).deals).toEqual([]);
});

test('the camp’s reward carries banish: played, it gains and is banished', () => {
  const city = cityOf(['urban'], { hand: ['PH_Spoils'] });

  const played = outcome(apply(CATALOGUE, city, { type: 'play', index: 0, aim: 'none' }));

  expect(stagedBy(city, { type: 'play', index: 0, aim: 'none' })).toEqual([
    'played',
    'banished',
    'stock',
  ]);
  expect(played.resources).toEqual({
    food: 10,
    production: 10,
    military: 10,
    money: 10,
    science: 10,
    culture: 0,
  });
  expect(everyCard(played)).toEqual([]);
});

test('the camp’s reward discarded unplayed comes around like any card', () => {
  const city = cityOf(['urban'], { ...NO_GROWTH, hand: ['PH_Spoils'], drawPile: fullDraw() });

  const ended = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(idsOf(ended.discardPile)).toEqual(['PH_Spoils']);
  expect(everyCard(outcome(apply(CATALOGUE, ended, { type: 'end-turn' })))).toContain('PH_Spoils');
});

test('an enemy moves its move toward the city, turn after turn', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const moved = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(distance(moved.units[0].tile, CITY)).toBe(2);
  expect(distance(outcome(apply(CATALOGUE, moved, { type: 'end-turn' })).units[0].tile, CITY)).toBe(
    0,
  );
});

test('an enemy spends the move points it crosses on, and carries them into the turn refreshed', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [standing('enemy', { q: 4, r: 0 }, { move: 2 * MOVE_POINT })],
  });

  const stages = apply(CATALOGUE, city, { type: 'end-turn' });
  const crossed = [...walked(stages)].find((stage) => stage.name === 'move');
  if (crossed === undefined) throw new Error('the enemy phase staged no move');

  expect(pointsOf(crossed.chronicle, 1)).toBe(0);
  expect(pointsOf(outcome(stages), 1)).toBe(2 * MOVE_POINT);
});

test('an enemy moves within range of a unit and attacks it in the same enemy phase', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 2, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
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
  expect(movesOf(city)).toEqual([['4,0', '3,0']]);
  expect(attacksOf(city)).toEqual([['3,0', '2,0']]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health - 2);
});

test('an enemy its move leaves out of range attacks nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(4),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 4, r: 0 }, { move: MOVE_POINT, damage: 2 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'move',
    'turn',
    'turn',
    'refreshed',
  ]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

/** The fixture's content, its enemies staying where they stand and doing what `acts` names. */
function naming(acts: EnemyScript['acts']): Catalogue {
  return catalogued({
    ...CATALOGUE,
    scripts: {
      ...CATALOGUE.scripts,
      [SCRIPT]: {
        moveTo: (_catalogue, chronicle, enemy) => ({
          landing: { tile: enemy.tile, cost: 0 },
          rng: chronicle.rng,
        }),
        acts,
      },
    },
  });
}

/** The fixture's content, its enemies staying where they stand and attacking the player's first unit. */
const RECKLESS = naming((_catalogue, chronicle) =>
  attackOrNone(chronicle.units.find((unit) => unit.faction === 'player')),
);

/** The names of the stages the enemy phase of the end of turn holds. */
function enemyPhaseOf(chronicle: Chronicle, catalogue: Catalogue): string[] {
  return namesOf(heldBy(apply(catalogue, chronicle, { type: 'end-turn' }), 'enemy-phase'));
}

test('an enemy attacks only a unit its own sight reaches: one its script names behind a forest from the plain is a runtime-error and no attack, and from the hills the attack lands', () => {
  const blind = naming((_catalogue, chronicle, enemy) =>
    attackOrNone(attackable(chronicle.units, enemy)[0]),
  );
  const archerOn = (terrain: Terrain): Chronicle =>
    cityOf(['urban'], {
      tiles: madeOf(madeOf(field(3), 'forest', [{ q: 2, r: 0 }]), terrain, [{ q: 3, r: 0 }]),
      units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 3, r: 0 }, { move: 0, range: 2 })],
    });

  expect(enemyPhaseOf(archerOn('plain'), blind)).toEqual(['runtime-error']);
  expect(attacksOf(archerOn('hills'), blind)).toEqual([['3,0', '1,0']]);
});

test('an enemy attacks only a unit within its range: one its script names beyond it is a runtime-error and no attack, and within it the attack lands', () => {
  const ranging = (range: number): Chronicle =>
    cityOf(['urban'], {
      tiles: field(3),
      units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 3, r: 0 }, { move: 0, range })],
    });

  expect(enemyPhaseOf(ranging(1), RECKLESS)).toEqual(['runtime-error']);
  expect(attacksOf(ranging(2), RECKLESS)).toEqual([['3,0', '1,0']]);
});

test('an enemy whose range is one attacks no embarked unit: one its script names beside it is a runtime-error and no attack, and ashore the attack lands', () => {
  const coast = { q: 1, r: 0 };
  const enemy = standing('enemy', { q: 2, r: 0 }, { move: 0, range: 1 });
  const embarked = outcome(
    apply(
      CATALOGUE,
      cityOf(['urban'], {
        tiles: field(3, [coast]),
        hand: ['PH_Embark'],
        units: [standing('player', CITY), enemy],
      }),
      aimedAt(coast),
    ),
  );
  const ashore = cityOf(['urban'], {
    tiles: field(3),
    units: [standing('player', coast), enemy],
  });

  expect(enemyPhaseOf(embarked, RECKLESS)).toEqual(['runtime-error']);
  expect(attacksOf(ashore, RECKLESS)).toEqual([['2,0', '1,0']]);
});

/**
 * The fixture's content, its camp naming `embarkedMove`, its enemies staying where they stand and
 * stepping onto the tile `step` names them, and asked an attack, the player's first unit.
 */
function stepping(step: (enemy: Unit) => TileCoords, embarkedMove?: number): Catalogue {
  return camping(
    { embarkedMove },
    {
      ...CATALOGUE,
      scripts: {
        ...CATALOGUE.scripts,
        [SCRIPT]: {
          moveTo: (_catalogue, chronicle, enemy) => ({
            landing: { tile: enemy.tile, cost: 0 },
            step: step(enemy),
            rng: chronicle.rng,
          }),
          acts: (_catalogue, chronicle) =>
            attackOrNone(chronicle.units.find((unit) => unit.faction === 'player')),
        },
      },
    },
  );
}

/** What the enemy phase of the end of turn leaves. */
function afterEnemyPhase(chronicle: Chronicle, catalogue: Catalogue): Chronicle {
  const phase = heldBy(apply(catalogue, chronicle, { type: 'end-turn' }), 'enemy-phase');
  return phase[phase.length - 1].chronicle;
}

test('an enemy embarks onto a free tile beside it that embarked units enter, charted or not, through the step the card takes, on its camp’s embarked move: a step its camp names no embarked move for, onto a tile it cannot stand on embarked or onto one not beside it, is a runtime-error and no step', () => {
  const shore = { q: 4, r: 0 };
  const coast = { q: 4, r: -1 };
  const far = { q: 4, r: -2 };
  const deep = { q: 3, r: 1 };
  const city = cityOf(['urban'], {
    tiles: madeOf(field(4, [coast, far]), 'deep', [deep]),
    units: [standing('enemy', shore, { action: 2 })],
  });
  const rowing = stepping(() => coast, EMBARKED_MOVE);

  expect(chartedTile(city, coast)).toBe('tile-uncharted');
  expect(enemyPhaseOf(city, rowing)).toEqual(['action-spent', 'move']);
  expect(unitNamed(afterEnemyPhase(city, rowing), 1)).toMatchObject({
    tile: coast,
    embarked: true,
    stats: { move: EMBARKED_MOVE },
    action: 1,
    movePoints: 0,
  });
  expect(
    enemyPhaseOf(
      city,
      stepping(() => coast),
    ),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      city,
      stepping(() => deep, EMBARKED_MOVE),
    ),
  ).toEqual(['runtime-error']);
  expect(
    enemyPhaseOf(
      city,
      stepping(() => far, EMBARKED_MOVE),
    ),
  ).toEqual(['runtime-error']);
});

test('an embarked enemy disembarks onto a free tile beside it that it stands on ashore, its move its kind’s own again, and attacks nothing after it though it holds action and a unit stands within its range; onto a tile a unit holds it is a runtime-error and no step', () => {
  const shore = { q: 4, r: 0 };
  const coast = { q: 4, r: -1 };
  const rowing = stepping((enemy) => (enemy.embarked ? shore : coast), EMBARKED_MOVE);
  const embarked = endedTurn(
    cityOf(['urban'], {
      tiles: field(4, [coast]),
      units: [worker({ q: 3, r: 0 }), standing('enemy', shore, { move: MOVE_POINT, action: 2 })],
    }),
    undefined,
    rowing,
  );
  const held = outcome(apply(rowing, embarked, { type: 'move', unit: 1, tile: shore }));

  expect(unitNamed(embarked, 2)).toMatchObject({ tile: coast, embarked: true });
  expect(enemyPhaseOf(embarked, rowing)).toEqual(['action-spent', 'move']);
  expect(unitNamed(afterEnemyPhase(embarked, rowing), 2)).toMatchObject({
    tile: shore,
    embarked: false,
    stats: { move: unitKind(CATALOGUE, 'PH_Warrior').move },
    action: 1,
  });
  expect(enemyPhaseOf(held, rowing)).toEqual(['runtime-error']);
});

test('an enemy attacks once for each of its action, and one with none attacks nothing', () => {
  const beset = (action: number): Chronicle =>
    cityOf(['urban'], {
      tiles: field(2),
      units: [
        worker({ q: 1, r: 0 }),
        standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 1, action }),
      ],
    });

  expect(attacksOf(beset(0))).toEqual([]);
  expect(attacksOf(beset(1))).toEqual([['2,0', '1,0']]);
  expect(attacksOf(beset(2))).toEqual([
    ['2,0', '1,0'],
    ['2,0', '1,0'],
  ]);
  for (const action of [0, 1, 2]) {
    const city = beset(action);
    const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
    expect(after.units[0].stats.health).toBe(city.units[0].stats.health - action);
  }
});

test('each enemy acts on the chronicle the enemy before it left, and no unit of the player’s acts at all', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      standing('player', { q: 1, r: 0 }, { health: 4, damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { move: 0 * MOVE_POINT, damage: 4 }),
      standing('enemy', { q: 1, r: 1 }, { move: 0 * MOVE_POINT, damage: 4 }),
    ],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units.map((unit) => unit.id)).toEqual([2, 3]);
});

test('an enemy with no damage attacks all the same, and removes nothing', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 }, { move: 0, damage: 0 })],
  });

  const after = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));

  expect(attacksOf(city)).toEqual([['2,0', '1,0']]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy that is a worker attacks nothing, whatever its range and damage', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [
      worker({ q: 1, r: 0 }),
      standing('enemy', { q: 2, r: 0 }, { worker: true, move: 0, damage: 2, range: 2 }),
    ],
  });

  expect(attacksOf(city)).toEqual([]);
});

test('a killed enemy attacks no more', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      standing('player', { q: 1, r: 0 }, { damage: 3 }),
      standing('enemy', { q: 2, r: 0 }, { health: 3, damage: 2 }),
    ],
  });

  const killed = outcome(apply(CATALOGUE, city, attackOn(1, { q: 2, r: 0 })));
  expect(killed.units).toHaveLength(1);

  const after = outcome(apply(CATALOGUE, killed, { type: 'end-turn' }));

  expect(attacksOf(killed)).toEqual([]);
  expect(after.units[0].stats.health).toBe(city.units[0].stats.health);
});

test('an enemy that moves stages the tile it left and the one it reached; a stuck one stages nothing', () => {
  const moat: TileCoords[] = [
    { q: 2, r: 0 },
    { q: 3, r: -1 },
    { q: 2, r: 1 },
  ];
  const city = cityOf(['urban'], {
    tiles: field(3, moat),
    units: [
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT }),
    ],
  });

  expect(movesOf(city)).toEqual([['0,3', '0,2']]);
});

test('each enemy stages its own move and its own attacks, before the next enemy acts', () => {
  const city = cityOf(['urban'], {
    tiles: field(3),
    units: [
      worker({ q: 1, r: 1 }),
      standing('enemy', { q: 3, r: 0 }, { move: MOVE_POINT, damage: 1 }),
      standing('enemy', { q: 0, r: 3 }, { move: MOVE_POINT, damage: 1 }),
    ],
  });

  expect(stagedBy(city, { type: 'end-turn' })).toEqual([
    'grow',
    'income',
    'stock',
    'enemy-phase',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'move',
    'attack',
    'action-spent',
    'damaged',
    'turn',
    'turn',
    'refreshed',
    'refreshed',
  ]);
});

test('a tile an enemy occupies yields nothing at income', () => {
  const bare = cityOf(['urban', 'plain'], NO_GROWTH);
  const occupied = withUnits(bare, [standing('enemy', { q: 1, r: 0 })]);

  const free = outcome(apply(CATALOGUE, bare, { type: 'end-turn' }));
  const held = outcome(apply(CATALOGUE, occupied, { type: 'end-turn' }));

  for (const resource of RESOURCES) {
    expect(held.resources[resource]).toBe(
      free.resources[resource] - (terrainKind(CATALOGUE, 'plain').yields[resource] ?? 0),
    );
  }
});

test('an enemy that reaches the city’s tile stands there, and captures the city the turn after', () => {
  const city = cityOf(['urban'], {
    tiles: field(2),
    units: [standing('enemy', { q: 1, r: 0 }, { move: MOVE_POINT })],
  });

  const stood = outcome(apply(CATALOGUE, city, { type: 'end-turn' }));
  expect(stood.units[0].tile).toEqual(CITY);
  expect(stood.ending).toBeUndefined();

  const fallen = outcome(apply(CATALOGUE, stood, { type: 'end-turn' }));
  expect(fallen.ending).toEqual({ outcome: 'defeat', cause: 'capture', turn: stood.turn });
  expect(fallen.turn).toBe(stood.turn);
});

test('an enemy that prepares spends its action as an attack does, and carries the prepare through the end of turn', () => {
  const city = cityOf(['urban'], { tiles: field(2), units: [standing('enemy', CITY)] });

  const stages = apply(CATALOGUE, city, { type: 'end-turn' });
  const phase = heldBy(stages, 'enemy-phase');
  const after = outcome(stages);

  expect(namesOf(phase)).toEqual(['action-spent', 'prepare']);
  expect(phase).toMatchObject([{ tile: CITY }, { tile: CITY }]);
  expect(phase[1].chronicle.units[0]).toMatchObject({ prepared: true, action: 0 });
  expect(after.units[0]).toMatchObject({ prepared: true, action: city.units[0].action });
  expect(after.ending).toBeUndefined();
});

/** A plain two tiles off the city with a farm built on it and a road and a trail placed on it. */
const FARMED: TileCoords = { q: 2, r: 0 };

/** A city on a disc of plain with `FARMED` built on, and these units standing. */
function farmed(units: readonly Standing[]): Chronicle {
  const built = field(3).map((tile) =>
    tileKey(tile) === tileKey(FARMED)
      ? { ...tile, building: 'PH_Farm', improvements: ['PH_Road', 'PH_Trail'] }
      : tile,
  );
  return cityOf(['urban'], { tiles: built, units });
}

test('a prepare off the city’s tile lands at the next enemy phase ahead of every act: the enemy pillages its tile, the building and every improvement removed at once, and its prepare is gone', () => {
  const pillaging = farmed([
    preparing(standing('enemy', FARMED, { move: 0 })),
    standing('enemy', { q: -2, r: 0 }, { move: MOVE_POINT }),
  ]);

  const phase = heldBy(apply(CATALOGUE, pillaging, { type: 'end-turn' }), 'enemy-phase');
  const [retiled, carried] = phase;

  expect(namesOf(phase)).toEqual(['retiled', 'prepare', 'move']);
  expect(retiled).toMatchObject({ tile: FARMED });
  expect(tileAt(retiled.chronicle.tiles, FARMED)).toMatchObject({
    building: undefined,
    improvements: [],
  });
  expect(carried).toMatchObject({ tile: FARMED });
  expect(carried.chronicle.units[0]).toMatchObject({ prepared: false });
});

test('an enemy prepared on the city’s tile captures the city ahead of every pillage', () => {
  const overrun = farmed([
    preparing(standing('enemy', FARMED)),
    preparing(standing('enemy', CITY)),
  ]);

  const stages = apply(CATALOGUE, overrun, { type: 'end-turn' });

  expect(namesOf(heldBy(stages, 'enemy-phase'))).toEqual(['ended']);
  expect(outcome(stages).ending).toEqual({ outcome: 'defeat', cause: 'capture', turn: 1 });
  expect(buildingAt(outcome(stages), FARMED)).toBe('PH_Farm');
});

test('a prepared enemy killed in the player’s turn takes nothing at the next enemy phase', () => {
  const beset = farmed([
    standing('player', { q: 1, r: 0 }, { damage: 4 }),
    preparing(standing('enemy', FARMED, { health: 4 })),
  ]);

  const killed = outcome(apply(CATALOGUE, beset, attackOn(1, FARMED)));
  const after = outcome(apply(CATALOGUE, killed, { type: 'end-turn' }));

  expect(enemiesOf(killed)).toEqual([]);
  expect(tileAt(after.tiles, FARMED)).toEqual(tileAt(beset.tiles, FARMED));
});

/** The fixture's content, its enemies staying where they stand and preparing there whatever the tile. */
const PREPARING = naming(() => ({ act: 'prepare' }));

test('a prepare on a tile with neither the city nor anything built on it, and one by an embarked enemy, are each a runtime-error and no prepare', () => {
  const coast = { q: 2, r: 0 };
  const weir = field(3, [coast]).map((tile) =>
    tileKey(tile) === tileKey(coast) ? { ...tile, improvements: ['PH_Weir'] } : tile,
  );
  const bare = cityOf(['urban'], { tiles: field(3), units: [standing('enemy', { q: 2, r: 0 })] });
  const embarked = cityOf(['urban'], {
    tiles: weir,
    units: [enemyStanding(coast, undefined, { embarkedMove: EMBARKED_MOVE })],
  });

  for (const city of [bare, embarked]) {
    const phase = heldBy(apply(PREPARING, city, { type: 'end-turn' }), 'enemy-phase');
    expect(namesOf(phase)).toEqual(['runtime-error']);
    expect(phase[0].chronicle.units).toEqual(city.units);
  }
  expect(embarked.units[0].embarked).toBe(true);
});

test('an entry handed a table holding no row, or a row at a weight not above nought, is refused where it lands', () => {
  const camp = { q: 4, r: 0 };
  const city = cityOf(['urban'], { tiles: camped(field(4), [camp]) });

  for (const table of [[], [RAIDER_ROW, { ...RAIDER_ROW, weight: 0 }]]) {
    for (const landing of [
      () => enteredOnCamp(CATALOGUE, city, camp, table),
      () => enteredAround(CATALOGUE, city, camp, 1, table),
      () => raided(CATALOGUE, city, 1, table),
    ]) {
      expect(landing).toThrow(/^fixture: a unit entry's table /);
    }
  }
});

test('the enemy that moves in from its camp reaches the city and captures it', () => {
  const radius = REGIONS[REGION].radius;
  let chronicle = cityOf(['urban'], {
    tiles: camped(field(radius), [{ q: radius, r: 0 }]),
    ...RAID_ON_SECOND,
  });
  for (let turn = 0; turn < 20 && chronicle.ending === undefined; turn++) {
    chronicle = endedTurn(chronicle, 'PH_Raid');
  }

  expect(chronicle.ending).toEqual({
    outcome: 'defeat',
    cause: 'capture',
    turn: chronicle.turn,
  });
});

test('a chronicle with enemies on the map, a camp’s among them, survives JSON', () => {
  const camp = { q: -3, r: 0 };
  const city = cityOf(['urban'], {
    tiles: camped(field(3), [camp]),
    units: [worker({ q: 1, r: 0 }), standing('enemy', { q: 2, r: 0 }), enemyStanding(camp, camp)],
  });

  expect(JSON.parse(JSON.stringify(city))).toEqual(city);
});
