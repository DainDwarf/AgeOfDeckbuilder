import type { Catalogue, EnemyScript } from '../rules/catalogue';
import { movementCost, pathCosts, type Tile, type TileCoords, tileAt, tileKey } from '../rules/map';
import type { Chronicle } from '../rules/state';
import { type Landing, leastHealth, reachable, type Unit } from '../rules/units';

export const ADVANCE: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Landing {
    const stay: Landing = { tile: enemy.tile, cost: 0 };
    const target = nearest(catalogue, chronicle, enemy);
    if (target === undefined) return stay;

    const outward = costsFrom(catalogue, chronicle, target, enemy);
    const landings = [stay, ...reachable(catalogue, chronicle, enemy)];
    const spent = new Map(landings.map((landing) => [tileKey(landing.tile), landing.cost]));

    let chosen = stay;
    let cheapest = Number.POSITIVE_INFINITY;
    for (const tile of inTileOrder(
      chronicle.tiles,
      landings.map((landing) => landing.tile),
    )) {
      const at = tileKey(tile);
      const reached = outward.get(at);
      const own = movementCost(catalogue, tileAt(chronicle.tiles, tile));
      if (reached === undefined || own === undefined) continue;
      // The walk out charges the landing's own cost and not the target's; crossing back charges
      // the other way about, and the target's cost is the same for every landing weighed here.
      const away = reached - own;
      if (away >= cheapest) continue;
      cheapest = away;
      chosen = { tile, cost: spent.get(at) ?? 0 };
    }
    return chosen;
  },

  attacks(_catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
    if (chronicle.city !== undefined && tileKey(enemy.tile) === tileKey(chronicle.city)) {
      return undefined;
    }
    return leastHealth(chronicle.units, enemy);
  },
};

/** What an enemy moves toward: the player's unit or the city it crosses to for the least it can. */
function nearest(catalogue: Catalogue, chronicle: Chronicle, walker: Unit): TileCoords | undefined {
  const costs = costsFrom(catalogue, chronicle, walker.tile, walker);
  const targets = chronicle.units
    .filter((unit) => unit.faction === 'player')
    .map((unit) => unit.tile);
  if (chronicle.city !== undefined) targets.push(chronicle.city);

  let chosen: TileCoords | undefined;
  let cheapest = Number.POSITIVE_INFINITY;
  for (const coord of inTileOrder(chronicle.tiles, targets)) {
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
 * What crossing to every tile from a start costs the walking unit, whatever stands on them and
 * however far off they lie: a script reads the whole map, so no move points cap the walk and a river
 * edge weighs the walker's whole move, what a crossing drains at worst. A tile no route reaches is
 * absent.
 */
function costsFrom(
  catalogue: Catalogue,
  chronicle: Chronicle,
  from: TileCoords,
  walker: Unit,
): Map<string, number> {
  return pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    from,
    { kind: 'whole-map', move: walker.stats.move },
    () => false,
  );
}
