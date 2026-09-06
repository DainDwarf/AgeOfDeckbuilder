import {
  distance,
  MAP_COMPOSITION,
  neighbours,
  passable,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import { nextRng } from './rng';
import type { Chronicle } from './state';
import {
  type EnemyScriptId,
  type Landing,
  leastHealth,
  reachable,
  UNIT_STATS,
  unitAt,
} from './units';

/**
 * What an enemy does in the enemy phase, asked of it by its place in `chronicle.units`. The phase
 * takes every enemy's move first and every enemy's intent after; how either is chosen is the
 * script's own business.
 */
export type EnemyScript = {
  /**
   * The landing it moves to, out of the tiles its move points reach and the one it already stands
   * on, which costs it nothing.
   */
  moveTo(chronicle: Chronicle, enemy: number): Landing;
  /** The tile it aims its attack at, or nothing when it declares no intent. */
  intentOf(chronicle: Chronicle, enemy: number): TileCoords | undefined;
};

/** Every script an enemy can carry. An enemy names one of these, and the enemy phase asks it. */
export const ENEMY_SCRIPTS: Record<EnemyScriptId, EnemyScript> = {
  PH_Advance: {
    moveTo(chronicle: Chronicle, enemy: number): Landing {
      const unit = chronicle.units[enemy];
      const stay: Landing = { tile: unit.tile, cost: 0 };
      const target = nearest(chronicle, unit.tile);
      if (target === undefined) return stay;

      const away = pathDistances(chronicle.tiles, target);
      const landings = [stay, ...reachable(chronicle.tiles, chronicle.units, unit)];
      const spent = new Map(landings.map((landing) => [tileKey(landing.tile), landing.cost]));

      let chosen = stay;
      let shortest = Number.POSITIVE_INFINITY;
      for (const tile of inTileOrder(
        chronicle.tiles,
        landings.map((landing) => landing.tile),
      )) {
        const gap = away.get(tileKey(tile));
        if (gap === undefined || gap >= shortest) continue;
        shortest = gap;
        chosen = { tile, cost: spent.get(tileKey(tile)) ?? 0 };
      }
      return chosen;
    },

    intentOf(chronicle: Chronicle, enemy: number): TileCoords | undefined {
      const unit = chronicle.units[enemy];
      if (tileKey(unit.tile) === tileKey(chronicle.city)) return undefined;
      const target = leastHealth(chronicle.units, enemy);
      return target === undefined ? undefined : chronicle.units[target].tile;
    },
  },
};

/**
 * `PH_Arrival`, the one event the stand-in schedule holds: one enemy lands on a free tile of the
 * map's outer ring it can stand on, drawn from the seeded generator, with its move points and its
 * action full. With no such tile it places nothing.
 */
export function arrival(chronicle: Chronicle): Chronicle {
  const ring = chronicle.tiles.filter(
    (tile) =>
      distance(tile, chronicle.city) === MAP_COMPOSITION.radius &&
      passable(tile.terrain) &&
      unitAt(chronicle.units, tile) === undefined,
  );
  if (ring.length === 0) return chronicle;

  const step = nextRng(chronicle.rng);
  const { q, r } = ring[Math.floor(step.value * ring.length)];
  return {
    ...chronicle,
    rng: step.rng,
    units: [
      ...chronicle.units,
      {
        stats: { ...UNIT_STATS.PH_Warrior },
        faction: 'enemy',
        tile: { q, r },
        movePoints: UNIT_STATS.PH_Warrior.move,
        action: UNIT_STATS.PH_Warrior.action,
        script: 'PH_Advance',
      },
    ],
  };
}

/** What an enemy moves toward: the player's unit or the city the fewest tiles away it can cross to. */
function nearest(chronicle: Chronicle, from: TileCoords): TileCoords | undefined {
  const gaps = pathDistances(chronicle.tiles, from);
  const targets = chronicle.units
    .filter((unit) => unit.faction === 'player')
    .map((unit) => unit.tile);

  let chosen: TileCoords | undefined;
  let shortest = Number.POSITIVE_INFINITY;
  for (const coord of inTileOrder(chronicle.tiles, [...targets, chronicle.city])) {
    const gap = gaps.get(tileKey(coord));
    if (gap !== undefined && gap < shortest) {
      shortest = gap;
      chosen = coord;
    }
  }
  return chosen;
}

/** The one order every tie in a script falls back on: the order the map lists its tiles in. */
function inTileOrder(tiles: readonly Tile[], coords: readonly TileCoords[]): TileCoords[] {
  const wanted = new Set(coords.map(tileKey));
  return tiles.filter((tile) => wanted.has(tileKey(tile))).map(({ q, r }) => ({ q, r }));
}

/**
 * How many tiles every tile lies from a start over ground a unit crosses, whatever stands on them.
 * A tile no such path reaches is absent, and so is every impassable one.
 */
function pathDistances(tiles: readonly Tile[], from: TileCoords): Map<string, number> {
  const ground = new Map(tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const gaps = new Map([[tileKey(from), 0]]);

  let front = [from];
  for (let step = 1; front.length > 0; step++) {
    const next: TileCoords[] = [];
    for (const at of front) {
      for (const coord of neighbours(at)) {
        const key = tileKey(coord);
        if (gaps.has(key)) continue;
        if (!passable(ground.get(key))) continue;
        gaps.set(key, step);
        next.push(coord);
      }
    }
    front = next;
  }
  return gaps;
}
