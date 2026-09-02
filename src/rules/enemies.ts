import type { Chronicle } from './chronicle';
import { distance, MAP_COMPOSITION, neighbours, type Tile, type TileCoords, tileKey } from './map';
import { nextRng } from './rng';
import { leastHealth, reachable, UNIT_STATS, unitAt } from './units';

/** `PH_` marks a stand-in: this script is not authored content, and it goes with the enemies it drives. */
export type EnemyScriptId = 'PH_Advance';

/**
 * What an enemy does in the enemy phase, asked of it by its place in `chronicle.units`. The phase
 * takes every enemy's move first and every enemy's intent after; how either is chosen is the
 * script's own business.
 */
export type EnemyScript = {
  /** The tile it walks to, out of the tiles its move reaches and the one it already stands on. */
  moveTo(chronicle: Chronicle, enemy: number): TileCoords;
  /** The tile it aims its attack at, or nothing when it declares no intent. */
  intentOf(chronicle: Chronicle, enemy: number): TileCoords | undefined;
};

/** Every script an enemy can carry. An enemy names one of these, and the enemy phase asks it. */
export const ENEMY_SCRIPTS: Record<EnemyScriptId, EnemyScript> = {
  PH_Advance: {
    moveTo(chronicle: Chronicle, enemy: number): TileCoords {
      const unit = chronicle.units[enemy];
      const target = nearest(chronicle, unit.tile);
      if (target === undefined) return unit.tile;

      const away = landDistances(chronicle.tiles, target);
      const landings = [unit.tile, ...reachable(chronicle.tiles, chronicle.units, unit)];
      let chosen = unit.tile;
      let shortest = Number.POSITIVE_INFINITY;
      for (const coord of inTileOrder(chronicle.tiles, landings)) {
        const gap = away.get(tileKey(coord));
        if (gap !== undefined && gap < shortest) {
          shortest = gap;
          chosen = coord;
        }
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
 * `PH_Arrival`, the one event the stand-in schedule holds: one enemy lands on a free land tile of
 * the map's rim, drawn from the seeded generator. With no rim tile free it places nothing.
 */
export function arrival(chronicle: Chronicle): Chronicle {
  const rim = chronicle.tiles.filter(
    (tile) =>
      distance(tile, chronicle.city) === MAP_COMPOSITION.radius &&
      tile.terrain !== 'water' &&
      unitAt(chronicle.units, tile) === undefined,
  );
  if (rim.length === 0) return chronicle;

  const step = nextRng(chronicle.rng);
  const { q, r } = rim[Math.floor(step.value * rim.length)];
  return {
    ...chronicle,
    rng: step.rng,
    units: [
      ...chronicle.units,
      {
        stats: { ...UNIT_STATS.PH_Warrior },
        faction: 'enemy',
        tile: { q, r },
        script: 'PH_Advance',
      },
    ],
  };
}

/** What an enemy walks at: the player's unit or the city the fewest tiles of land away. */
function nearest(chronicle: Chronicle, from: TileCoords): TileCoords | undefined {
  const gaps = landDistances(chronicle.tiles, from);
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
 * How many tiles of land every tile lies from a start, whatever stands on them. A tile no land path
 * reaches is absent, and so is water.
 */
function landDistances(tiles: readonly Tile[], from: TileCoords): Map<string, number> {
  const ground = new Map(tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const gaps = new Map([[tileKey(from), 0]]);

  let edge = [from];
  for (let step = 1; edge.length > 0; step++) {
    const next: TileCoords[] = [];
    for (const at of edge) {
      for (const coord of neighbours(at)) {
        const key = tileKey(coord);
        if (gaps.has(key)) continue;
        const terrain = ground.get(key);
        if (terrain === undefined || terrain === 'water') continue;
        gaps.set(key, step);
        next.push(coord);
      }
    }
    edge = next;
  }
  return gaps;
}
