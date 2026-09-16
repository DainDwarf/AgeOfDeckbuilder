import { expect, test } from 'vitest';
import { type Catalogue, catalogued, entered } from './catalogue';
import { apply, outcome } from './chronicle';
import { CATALOGUE, NO_DEALS, opening, plains, settledOn } from './fixtures';
import {
  distance,
  MOVE_POINT,
  neighbours,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { seedRng } from './rng';
import { charted, inSight } from './sight';
import type { Chronicle, Snapshot } from './state';
import type { UnitStats } from './units';

const CITY: TileCoords = { q: 0, r: 0 };

/** The city's own tile and the six around it. */
const RING: readonly TileCoords[] = [CITY, ...neighbours(CITY)];

/** How far the ground below reaches: enough that every tile these tests name lies on it. */
const RADIUS = 8;

/** Where the unit under test stands, far enough out that the city sees none of the tiles around it. */
const WATCHER: TileCoords = { q: 0, r: 5 };

/** How far the unit under test sees: the fixture's own number, not a unit of content's. */
const SIGHT = 2;

/** How far the fixture's city sees. */
const CITY_SIGHT = CATALOGUE.city.sight;

/** A tile so many steps off the watcher. */
function off(q: number, r: number): TileCoords {
  return { q: WATCHER.q + q, r: WATCHER.r + r };
}

/** What terrain a stretch of the ground is made of: the tiles, and what they are. */
type Relief = readonly [Terrain, readonly TileCoords[]];

/**
 * A disc of plain out to `RADIUS` with the city on its urban tile at the middle, and the terrain
 * each relief names on the tiles it names.
 */
function ground(...relief: readonly Relief[]): Tile[] {
  const named = new Map<string, Terrain>();
  for (const [terrain, coords] of relief) {
    for (const coord of coords) named.set(tileKey(coord), terrain);
  }

  const tiles: Tile[] = [];
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = Math.max(-RADIUS, -q - RADIUS); r <= Math.min(RADIUS, -q + RADIUS); r++) {
      if (q === 0 && r === 0) {
        tiles.push({ q, r, terrain: 'urban', improvements: [], building: 'PH_City' });
        continue;
      }
      tiles.push({ q, r, terrain: named.get(tileKey({ q, r })) ?? 'plain', improvements: [] });
    }
  }
  return tiles;
}

/**
 * A city on that ground holding these tiles — its ring unless the test names others — with an
 * inhabitant on each.
 */
function cityOn(
  tiles: Tile[],
  holding: readonly TileCoords[] = RING,
  catalogue: Catalogue = CATALOGUE,
): Chronicle {
  const held = [...holding];
  return charted(catalogue, {
    content: catalogue.version,
    seed: 7,
    rng: seedRng(7),
    timeline: NO_DEALS,
    tiles,
    snapshots: [],
    rivers: [],
    centre: [],
    city: CITY,
    held,
    turn: 1,
    deals: [],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: held.length,
    assigned: [...held],
    units: [],
    nextUnit: 1,
    drawPile: [],
    hand: [],
    discardPile: [],
  });
}

/**
 * The chronicle with a unit of the player's entered on a tile through the rules, carrying the stats
 * the test names on top of its kind's, its move points full from them.
 */
function watching(chronicle: Chronicle, tile: TileCoords, carried: Partial<UnitStats>): Chronicle {
  const dealt = entered(CATALOGUE, chronicle, { type: 'PH_Warrior', tile, faction: 'player' });
  const last = dealt.units[dealt.units.length - 1];
  const stats = { ...last.stats, ...carried };
  return charted(CATALOGUE, {
    ...dealt,
    units: [...dealt.units.slice(0, -1), { ...last, stats, movePoints: stats.move }],
  });
}

/** The chronicle with an enemy entered on a tile through the rules, on the one script there is. */
function raiding(chronicle: Chronicle, tile: TileCoords): Chronicle {
  return charted(
    CATALOGUE,
    entered(CATALOGUE, chronicle, {
      type: 'PH_Warrior',
      tile,
      faction: 'enemy',
      script: 'advance',
    }),
  );
}

/** Whether a tile is in sight. */
function sees(chronicle: Chronicle, coord: TileCoords): boolean {
  return inSight(CATALOGUE, chronicle).has(tileKey(coord));
}

/** What the chronicle's snapshot of a tile holds, and nothing at all while the tile is uncharted. */
function snapshotOf(chronicle: Chronicle, coord: TileCoords): Snapshot | undefined {
  return chronicle.snapshots.find((snapshot) => tileKey(snapshot) === tileKey(coord));
}

test('over flat ground a unit sees every tile within its sight, and none beyond it', () => {
  const chronicle = watching(cityOn(ground()), WATCHER, { sight: SIGHT });

  for (const tile of chronicle.tiles) {
    if (distance(WATCHER, tile) > SIGHT) continue;
    expect(sees(chronicle, tile)).toBe(true);
  }
  expect(sees(chronicle, off(SIGHT + 1, 0))).toBe(false);
});

test('a forest hides the tile behind it from a unit standing on the plain', () => {
  const chronicle = watching(cityOn(ground(['forest', [off(1, 0)]])), WATCHER, { sight: SIGHT });

  expect(sees(chronicle, off(2, 0))).toBe(false);
  expect(sees(chronicle, off(1, 0))).toBe(true);
});

test('a unit on the hills sees over a forest, and no further than the next hills', () => {
  const over = watching(cityOn(ground(['hills', [WATCHER]], ['forest', [off(1, 0)]])), WATCHER, {
    sight: SIGHT,
  });
  const stopped = watching(cityOn(ground(['hills', [WATCHER, off(1, 0)]])), WATCHER, {
    sight: SIGHT,
  });

  expect(sees(over, off(2, 0))).toBe(true);
  expect(sees(stopped, off(2, 0))).toBe(false);
});

test("a mountain within a unit's sight is seen: what a tile is made of never hides the tile", () => {
  const chronicle = watching(cityOn(ground(['mountain', [off(2, 0)]])), WATCHER, { sight: SIGHT });

  expect(sees(chronicle, off(2, 0))).toBe(true);
});

test('a tile the line reaches two ways is seen when either way is clear', () => {
  const one = watching(cityOn(ground(['forest', [off(1, -1)]])), WATCHER, { sight: SIGHT });
  const other = watching(cityOn(ground(['forest', [off(1, 0)]])), WATCHER, { sight: SIGHT });
  const both = watching(cityOn(ground(['forest', [off(1, -1), off(1, 0)]])), WATCHER, {
    sight: SIGHT,
  });

  expect(sees(one, off(2, -1))).toBe(true);
  expect(sees(other, off(2, -1))).toBe(true);
  expect(sees(both, off(2, -1))).toBe(false);
});

test('two units on the same ground see each other alike, whichever way the line runs', () => {
  const there = off(2, -1);
  const half: Relief = ['forest', [off(1, -1)]];
  const whole: Relief = ['forest', [off(1, -1), off(1, 0)]];

  expect(sees(watching(cityOn(ground(half)), WATCHER, { sight: SIGHT }), there)).toBe(true);
  expect(sees(watching(cityOn(ground(half)), there, { sight: SIGHT }), WATCHER)).toBe(true);
  expect(sees(watching(cityOn(ground(whole)), WATCHER, { sight: SIGHT }), there)).toBe(false);
  expect(sees(watching(cityOn(ground(whole)), there, { sight: SIGHT }), WATCHER)).toBe(false);
});

test('a tile the city holds is in sight, however far out it lies and whatever stands before it', () => {
  const claimed = [
    { q: 0, r: -CITY_SIGHT },
    { q: 0, r: -CITY_SIGHT - 1 },
  ];
  const chronicle = cityOn(ground(['mountain', claimed]), [...RING, ...claimed]);

  for (const coord of claimed) expect(sees(chronicle, coord)).toBe(true);
  expect(sees(chronicle, { q: 0, r: -CITY_SIGHT - 2 })).toBe(false);
});

test('the city sees over the ground as a unit does: a forest beside it hides what is behind', () => {
  const behind = { q: CITY_SIGHT, r: 0 };
  const open = cityOn(ground());
  const hidden = cityOn(ground(['forest', [{ q: 1, r: 0 }]]));

  expect(sees(open, behind)).toBe(true);
  expect(sees(hidden, behind)).toBe(false);
});

test('a city of sight one sees the six tiles around it, and none beyond them', () => {
  const narrow = catalogued({ ...CATALOGUE, city: { ...CATALOGUE.city, sight: 1 } });
  const tiles = ground();
  const chronicle = cityOn(tiles, [CITY], narrow);
  const seen = inSight(narrow, chronicle);

  for (const tile of tiles) {
    if (distance(CITY, tile) > 2) continue;
    expect(seen.has(tileKey(tile))).toBe(distance(CITY, tile) <= 1);
  }
});

test('the centre part stands in sight through turn 0, and from turn 1 falls into fog wherever the city does not see it', () => {
  const at = { q: 3, r: 0 };
  const far = { q: -3, r: 0 };
  const beyond = { q: -4, r: 0 };
  const opened = opening(plains(RADIUS), { reach: 3 });
  const settled = settledOn(opened, at);
  const ticked = outcome(apply(CATALOGUE, settled, { type: 'end-turn' }));

  expect(sees(opened, far)).toBe(true);
  expect(sees(opened, beyond)).toBe(false);
  expect(sees(settled, far)).toBe(true);
  expect(ticked.turn).toBe(1);
  expect(sees(ticked, at)).toBe(true);
  expect(sees(ticked, far)).toBe(false);
  expect(snapshotOf(ticked, far)).toBeDefined();
  expect(snapshotOf(ticked, beyond)).toBeUndefined();
});

test('the snapshot keeps a tile as it was last seen once the unit that saw it has left', () => {
  const seen = off(2, 0);
  const away = off(0, -2);
  const watched = watching(cityOn(ground(['hills', [seen]])), WATCHER, { sight: SIGHT });
  expect(sees(watched, seen)).toBe(true);

  const left = outcome(apply(CATALOGUE, watched, { type: 'move', unit: 1, tile: away }));

  expect(sees(left, seen)).toBe(false);
  expect(snapshotOf(left, seen)?.tile.terrain).toBe('hills');
  expect(snapshotOf(left, off(3, 0))).toBeUndefined();
});

test('a killed unit charts nothing more: what it alone saw stands as it stood when it died', () => {
  const stood = off(0, 1);
  const raided = raiding(
    watching(cityOn(ground()), WATCHER, { sight: SIGHT, health: 1 }),
    off(0, 3),
  );

  const killed = outcome(apply(CATALOGUE, raided, { type: 'end-turn' }));
  expect(killed.units.every((unit) => unit.faction === 'enemy')).toBe(true);
  // The enemy crossed in sight, so the tile it landed on was charted with it standing there.
  expect(snapshotOf(killed, stood)?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy' });
  expect(snapshotOf(killed, off(0, 3))).toBeUndefined();

  const on = outcome(apply(CATALOGUE, killed, { type: 'end-turn' }));

  expect(tileKey(on.units[0].tile)).toBe(tileKey(off(0, -1)));
  expect(snapshotOf(on, off(0, -1))?.unit).toBeUndefined();
  expect(snapshotOf(on, stood)?.unit).toEqual({ type: 'PH_Warrior', faction: 'enemy' });
});

test('a unit of the player’s neither lands on an uncharted tile nor crosses one to reach past it', () => {
  const uncharted = off(2, 0);
  const beyond = off(3, 0);
  const chronicle = watching(cityOn(ground(['forest', [off(1, 0)]]), [...RING, beyond]), WATCHER, {
    sight: SIGHT,
    move: 3 * MOVE_POINT,
  });
  expect(snapshotOf(chronicle, uncharted)).toBeUndefined();
  expect(snapshotOf(chronicle, beyond)).toBeDefined();

  const onto = apply(CATALOGUE, chronicle, { type: 'move', unit: 1, tile: uncharted });
  const past = apply(CATALOGUE, chronicle, { type: 'move', unit: 1, tile: beyond });

  expect(onto.map((stage) => stage.name)).toEqual(['refused']);
  expect(past.map((stage) => stage.name)).toEqual(['refused']);
  // The charting is the whole of the refusal: the same distance over charted ground is crossed.
  expect(
    apply(CATALOGUE, chronicle, { type: 'move', unit: 1, tile: off(0, -3) }).map(
      (stage) => stage.name,
    ),
  ).toEqual(['move']);
});
