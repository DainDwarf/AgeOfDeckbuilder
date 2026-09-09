import { distance, MAP_COMPOSITION, pathCosts, type Tile, type TileCoords, tileKey } from './map';
import { nextRng } from './rng';
import { type Chronicle, entered } from './state';
import {
  type EnemyScriptId,
  type Landing,
  leastHealth,
  reachable,
  standsOn,
  UNIT_STATS,
  type Unit,
  unitAt,
} from './units';

/**
 * What an enemy does in the enemy phase, asked of the enemy itself as the phase stands it. The phase
 * takes one enemy at a time — its move, then an attack for each of its action — and asks again on
 * the chronicle the last answer left; how either is chosen is the script's own business.
 */
export type EnemyScript = {
  /**
   * The landing it moves to, out of the tiles its move points reach and the one it already stands
   * on, which costs it nothing.
   */
  moveTo(chronicle: Chronicle, enemy: Unit): Landing;
  /** The unit it attacks now, and nothing when it attacks none. */
  attacks(chronicle: Chronicle, enemy: Unit): Unit | undefined;
};

/** Every script an enemy can carry. An enemy names one of these, and the enemy phase asks it. */
export const ENEMY_SCRIPTS: Record<EnemyScriptId, EnemyScript> = {
  PH_Advance: {
    moveTo(chronicle: Chronicle, enemy: Unit): Landing {
      const stay: Landing = { tile: enemy.tile, cost: 0 };
      const target = nearest(chronicle, enemy.tile);
      if (target === undefined) return stay;

      const away = costsFrom(chronicle.tiles, target);
      const landings = [stay, ...reachable(chronicle, enemy)];
      const spent = new Map(landings.map((landing) => [tileKey(landing.tile), landing.cost]));

      let chosen = stay;
      let cheapest = Number.POSITIVE_INFINITY;
      for (const tile of inTileOrder(
        chronicle.tiles,
        landings.map((landing) => landing.tile),
      )) {
        const left = away.get(tileKey(tile));
        if (left === undefined || left >= cheapest) continue;
        cheapest = left;
        chosen = { tile, cost: spent.get(tileKey(tile)) ?? 0 };
      }
      return chosen;
    },

    attacks(chronicle: Chronicle, enemy: Unit): Unit | undefined {
      if (tileKey(enemy.tile) === tileKey(chronicle.city)) return undefined;
      return leastHealth(chronicle.units, enemy);
    },
  },
};

/**
 * `PH_Arrival`, the one event the stand-in schedule holds: one enemy lands on a free tile of the
 * map's outer ring it can stand on, drawn from the seeded generator, with its move points and its
 * action full. With no such tile it places nothing.
 */
export function arrival(chronicle: Chronicle): Chronicle {
  const arriving = UNIT_STATS.PH_Warrior;
  const ring = chronicle.tiles.filter(
    (tile) =>
      distance(tile, chronicle.city) === MAP_COMPOSITION.radius &&
      standsOn(arriving, tile) &&
      unitAt(chronicle.units, tile) === undefined,
  );
  if (ring.length === 0) return chronicle;

  const step = nextRng(chronicle.rng);
  const { q, r } = ring[Math.floor(step.value * ring.length)];
  return entered(
    { ...chronicle, rng: step.rng },
    { type: arriving.type, faction: 'enemy', tile: { q, r }, script: 'PH_Advance' },
  );
}

/** What an enemy moves toward: the player's unit or the city it crosses to for the least it can. */
function nearest(chronicle: Chronicle, from: TileCoords): TileCoords | undefined {
  const costs = costsFrom(chronicle.tiles, from);
  const targets = chronicle.units
    .filter((unit) => unit.faction === 'player')
    .map((unit) => unit.tile);

  let chosen: TileCoords | undefined;
  let cheapest = Number.POSITIVE_INFINITY;
  for (const coord of inTileOrder(chronicle.tiles, [...targets, chronicle.city])) {
    const cost = costs.get(tileKey(coord));
    if (cost !== undefined && cost < cheapest) {
      cheapest = cost;
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
 * What crossing to every tile from a start costs, whatever stands on them and however far off they
 * lie: a script reads the whole map, so no move points cap the walk. A tile no route reaches is
 * absent.
 */
function costsFrom(tiles: readonly Tile[], from: TileCoords): Map<string, number> {
  return pathCosts(tiles, from, Number.POSITIVE_INFINITY, () => false);
}
