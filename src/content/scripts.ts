import type { Catalogue, EnemyScript } from '../rules/catalogue';
import {
  distance,
  movementCost,
  pathCosts,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from '../rules/map';
import { nextRng } from '../rules/rng';
import type { Chronicle } from '../rules/state';
import { type Landing, leastHealth, reachable, type Unit, unitAt } from '../rules/units';

export const RAIDER: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    return { landing: raiding(catalogue, chronicle, enemy), rng: chronicle.rng };
  },

  attacks(_catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
    if (chronicle.city !== undefined && tileKey(enemy.tile) === tileKey(chronicle.city)) {
      return undefined;
    }
    return weakest(chronicle, enemy);
  },
};

/** The guard, keeping the nearest camp standing within `radius` of it, and raiding without one. */
export function guarding(radius: number): EnemyScript {
  return {
    moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
      const camp = campOf(catalogue, chronicle, enemy.tile, radius);
      if (camp === undefined) return RAIDER.moveTo(catalogue, chronicle, enemy);
      const kept = (landing: Landing) => ({ landing, rng: chronicle.rng });
      const stay: Landing = { tile: enemy.tile, cost: 0 };
      if (tileKey(enemy.tile) === tileKey(camp)) return kept(stay);
      const landings = [stay, ...reachable(catalogue, chronicle, enemy)];

      if (unitAt(chronicle.units, camp) === undefined) {
        const onCamp = landings.find((landing) => tileKey(landing.tile) === tileKey(camp));
        return kept(onCamp ?? nearestTo(chronicle, landings, camp));
      }

      const inside = landings.filter((landing) => distance(landing.tile, camp) <= radius);
      const { range, worker } = enemy.stats;
      const targets = worker
        ? []
        : chronicle.units.filter(
            (unit) => unit.faction !== enemy.faction && distance(unit.tile, camp) <= radius + range,
          );
      const striking = inside.filter((landing) =>
        targets.some((target) => distance(landing.tile, target.tile) <= range),
      );
      if (striking.length > 0) return kept(nearestTo(chronicle, striking, camp));
      if (targets.length > 0) {
        return kept(nearestTo(chronicle, inside, nearestTo(chronicle, targets, enemy.tile).tile));
      }

      const wandering = inTileOrder(chronicle.tiles, inside);
      const step = nextRng(chronicle.rng);
      return { landing: wandering[Math.floor(step.value * wandering.length)], rng: step.rng };
    },

    attacks(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
      if (campOf(catalogue, chronicle, enemy.tile, radius) === undefined) {
        return RAIDER.attacks(catalogue, chronicle, enemy);
      }
      return weakest(chronicle, enemy);
    },
  };
}

/** The camp a guard keeps: the nearest one standing within `radius` of the tile. */
function campOf(
  catalogue: Catalogue,
  chronicle: Chronicle,
  from: TileCoords,
  radius: number,
): TileCoords | undefined {
  const camps = chronicle.tiles
    .filter((tile) => tile.building === catalogue.camp.building && distance(tile, from) <= radius)
    .map(({ q, r }) => ({ tile: { q, r } }));
  return camps.length === 0 ? undefined : nearestTo(chronicle, camps, from).tile;
}

function raiding(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Landing {
  const stay: Landing = { tile: enemy.tile, cost: 0 };
  const { city } = chronicle;
  if (city === undefined || tileKey(enemy.tile) === tileKey(city)) return stay;
  const landings = [stay, ...reachable(catalogue, chronicle, enemy)];

  const onCity = landings.find((landing) => tileKey(landing.tile) === tileKey(city));
  if (onCity !== undefined) return onCity;
  const striking = landings.filter(
    (landing) => leastHealth(chronicle.units, { ...enemy, tile: landing.tile }) !== undefined,
  );
  if (striking.length > 0) return nearestTo(chronicle, striking, city);
  return cheapestToward(catalogue, chronicle, enemy, landings, city);
}

/** The unit of another faction within its range holding the least health, ties in tile order. */
function weakest(chronicle: Chronicle, enemy: Unit): Unit | undefined {
  return leastHealth(inTileOrder(chronicle.tiles, chronicle.units), enemy);
}

/** The one of them standing the fewest tiles from the target, ties in tile order. */
function nearestTo<Standing extends Placed>(
  chronicle: Chronicle,
  standing: readonly Standing[],
  target: TileCoords,
): Standing {
  let chosen = standing[0];
  let nearest = Number.POSITIVE_INFINITY;
  for (const one of inTileOrder(chronicle.tiles, standing)) {
    const away = distance(one.tile, target);
    if (away >= nearest) continue;
    nearest = away;
    chosen = one;
  }
  return chosen;
}

/** The landing the walk to the target costs the least from, ties in tile order. */
function cheapestToward(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Unit,
  landings: readonly Landing[],
  target: TileCoords,
): Landing {
  const outward = costsFrom(catalogue, chronicle, target, walker);
  let chosen = landings[0];
  let cheapest = Number.POSITIVE_INFINITY;
  for (const landing of inTileOrder(chronicle.tiles, landings)) {
    const reached = outward.get(tileKey(landing.tile));
    const own = movementCost(catalogue, tileAt(chronicle.tiles, landing.tile));
    if (reached === undefined || own === undefined) continue;
    // The walk out charges the landing's own cost and not the target's; crossing back charges
    // the other way about, and the target's cost is the same for every landing weighed here.
    const away = reached - own;
    if (away >= cheapest) continue;
    cheapest = away;
    chosen = landing;
  }
  return chosen;
}

type Placed = { readonly tile: TileCoords };

/** The one order every tie in a script falls back on: the order the map lists its tiles in. */
function inTileOrder<Standing extends Placed>(
  tiles: readonly Tile[],
  standing: readonly Standing[],
): Standing[] {
  const order = new Map(tiles.map((tile, at) => [tileKey(tile), at]));
  const at = (one: Standing): number => order.get(tileKey(one.tile)) ?? 0;
  return [...standing].sort((a, b) => at(a) - at(b));
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
