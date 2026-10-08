import { ageOf, type Catalogue, type EnemyScript } from '../rules/catalogue';
import { enemyMoves, leastHealth, stepMove, targetsInOwnSight } from '../rules/enemies';
import {
  distance,
  routesToward,
  type Tile,
  type TileCoords,
  type Toward,
  tileKey,
} from '../rules/map';
import { nextRng } from '../rules/rng';
import type { Chronicle } from '../rules/state';
import { canAttack, type Landing, reachable, type Unit, unitAt } from '../rules/units';

export const RAIDER: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    return { ...raiding(catalogue, chronicle, enemy), rng: chronicle.rng };
  },

  attacks(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
    if (chronicle.city !== undefined && tileKey(enemy.tile) === tileKey(chronicle.city)) {
      return undefined;
    }
    return weakest(catalogue, chronicle, enemy);
  },
};

/**
 * The guard, keeping the nearest camp standing within `radius` of it while it stands ashore, and
 * raiding without one or embarked.
 */
export function guarding(radius: number): EnemyScript {
  return {
    moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
      const camp = campKept(catalogue, chronicle, enemy, radius);
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
      // The tile inside the radius nearest a unit stands the unit's distance from the camp less the
      // radius away from it, and none for a unit inside the radius.
      const targets = chronicle.units.filter((unit) =>
        canAttack(enemy, unit, Math.max(0, distance(unit.tile, camp) - radius)),
      );
      const striking = landingsWithTarget(catalogue, chronicle, enemy, inside, targets);
      if (striking.length > 0) return kept(nearestTo(chronicle, striking, camp));
      if (targets.length > 0) {
        return kept(nearestTo(chronicle, inside, nearestTo(chronicle, targets, enemy.tile).tile));
      }

      const wandering = inTileOrder(chronicle.tiles, inside);
      const step = nextRng(chronicle.rng);
      return { landing: wandering[Math.floor(step.value * wandering.length)], rng: step.rng };
    },

    attacks(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
      if (campKept(catalogue, chronicle, enemy, radius) === undefined) {
        return RAIDER.attacks(catalogue, chronicle, enemy);
      }
      return weakest(catalogue, chronicle, enemy);
    },
  };
}

/**
 * The camp a guard keeps: the nearest one standing within `radius` of it, and none while it stands
 * embarked.
 */
function campKept(
  catalogue: Catalogue,
  chronicle: Chronicle,
  guard: Unit,
  radius: number,
): TileCoords | undefined {
  if (guard.embarked) return undefined;
  const { building } = ageOf(catalogue, chronicle.age).camp;
  const camps = chronicle.tiles
    .filter((tile) => tile.building === building && distance(tile, guard.tile) <= radius)
    .map(({ q, r }) => ({ tile: { q, r } }));
  return camps.length === 0 ? undefined : nearestTo(chronicle, camps, guard.tile).tile;
}

/** Where the raider moves, and the tile it then embarks or disembarks onto, if any. */
function raiding(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemy: Unit,
): { readonly landing: Landing; readonly step?: TileCoords } {
  const stay: Landing = { tile: enemy.tile, cost: 0 };
  const { city } = chronicle;
  if (city === undefined || tileKey(enemy.tile) === tileKey(city)) return { landing: stay };
  const landings = [stay, ...reachable(catalogue, chronicle, enemy)];

  const onCity = landings.find((landing) => tileKey(landing.tile) === tileKey(city));
  if (onCity !== undefined) return { landing: onCity };
  const striking = landingsWithTarget(catalogue, chronicle, enemy, landings, chronicle.units);
  if (striking.length > 0) return { landing: nearestTo(chronicle, striking, city) };

  const moves = enemyMoves(catalogue, chronicle, enemy);
  const toward = routesToward(catalogue, chronicle.tiles, chronicle.rivers, city, false, moves);
  const landing = cheapestToward(chronicle, enemy, landings, toward);
  return { landing, step: stepToward(catalogue, chronicle, enemy, landing, toward) };
}

/** The landings it could attack one of the units from. */
function landingsWithTarget(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemy: Unit,
  landings: readonly Landing[],
  units: readonly Unit[],
): Landing[] {
  return landings.filter(
    (landing) =>
      targetsInOwnSight(catalogue, chronicle.tiles, units, { ...enemy, tile: landing.tile })
        .length > 0,
  );
}

/** The unit it can attack holding the least health, ties in tile order. */
function weakest(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): Unit | undefined {
  return leastHealth(
    catalogue,
    chronicle.tiles,
    inTileOrder(chronicle.tiles, chronicle.units),
    enemy,
  );
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

/** The landing the cheapest route to the city weighs the least from, ties in tile order. */
function cheapestToward(
  chronicle: Chronicle,
  walker: Unit,
  landings: readonly Landing[],
  toward: Toward,
): Landing {
  const weighs = walker.embarked ? toward.embarked : toward.ashore;
  let chosen = landings[0];
  let cheapest = Number.POSITIVE_INFINITY;
  for (const landing of inTileOrder(chronicle.tiles, landings)) {
    const away = weighs.get(tileKey(landing.tile));
    if (away === undefined || away >= cheapest) continue;
    cheapest = away;
    chosen = landing;
  }
  return chosen;
}

/**
 * The tile beside the landing the walker embarks or disembarks onto: of the tiles a cheapest route
 * from the landing takes its first step to by embarking or disembarking, the first in tile order it
 * can step onto, and none where it can step onto none.
 */
function stepToward(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Unit,
  landing: Landing,
  toward: Toward,
): TileCoords | undefined {
  const landed = { ...walker, tile: landing.tile };
  const steps = toward
    .next(landing.tile, walker.embarked)
    .filter(
      (step) =>
        step.embarked !== walker.embarked &&
        stepMove(catalogue, chronicle, landed, step.tile) !== undefined,
    );
  return inTileOrder(chronicle.tiles, steps)[0]?.tile;
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
