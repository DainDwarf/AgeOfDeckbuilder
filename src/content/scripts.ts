import { ageOf, type Catalogue, type EnemyAct, type EnemyScript } from '../rules/catalogue';
import {
  attackOrNone,
  enemyMoves,
  leastHealth,
  nearestCamp,
  pillaged,
  standsAs,
  stepMove,
  targetsInOwnSight,
} from '../rules/enemies';
import {
  distance,
  routesFrom,
  routesToward,
  type Tile,
  type TileCoords,
  type Toward,
  tileAt,
  tileKey,
} from '../rules/map';
import { nextRng } from '../rules/rng';
import type { Chronicle } from '../rules/state';
import { canAttack, type Landing, reachable, type Unit, unitAt } from '../rules/units';

export const RAIDER: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    const { city } = chronicle;
    if (city === undefined) return { landing: { tile: enemy.tile, cost: 0 }, rng: chronicle.rng };
    return { ...walkedTo(catalogue, chronicle, enemy, city), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): EnemyAct {
    if (onCity(chronicle, enemy.tile)) return { act: 'prepare' };
    return weakest(catalogue, chronicle, enemy);
  },
};

/**
 * The pillager, going for the nearest of the player's workers and of what they built, and raiding
 * with nothing to go for.
 */
export const PILLAGER: EnemyScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    const target = goesFor(catalogue, chronicle, enemy);
    if (target === undefined) return RAIDER.moveTo(catalogue, chronicle, enemy);
    return { ...walkedTo(catalogue, chronicle, enemy, target), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): EnemyAct {
    if (onCity(chronicle, enemy.tile) && goesFor(catalogue, chronicle, enemy) === undefined) {
      return RAIDER.acts(catalogue, chronicle, enemy);
    }
    const act = weakest(catalogue, chronicle, enemy);
    if (act.act !== 'none' || enemy.embarked) return act;
    const tile = tileAt(chronicle.tiles, enemy.tile);
    return tile !== undefined && pillaged(catalogue, chronicle, tile) !== undefined
      ? { act: 'prepare' }
      : act;
  },
};

/**
 * The guard, keeping the nearest camp standing within `radius` of it while it stands ashore, and
 * raiding without one or embarked.
 */
export function guarding(radius: number): EnemyScript {
  return {
    moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
      const camp = nearestCamp(catalogue, chronicle, enemy, radius);
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

    acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): EnemyAct {
      if (nearestCamp(catalogue, chronicle, enemy, radius) === undefined) {
        return RAIDER.acts(catalogue, chronicle, enemy);
      }
      return weakest(catalogue, chronicle, enemy);
    },
  };
}

/** Whether the tile is the city's. */
function onCity(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.city !== undefined && tileKey(tile) === tileKey(chronicle.city);
}

/**
 * What a pillager goes for: of the tiles a worker of the player's stands on and those a pillage takes
 * something from, the city's and a camp's never, the one it stands on ashore that its own walk weighs
 * the least to, ties in tile order; nothing where there is none.
 */
function goesFor(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): TileCoords | undefined {
  const moves = enemyMoves(catalogue, chronicle, enemy);
  const { ashore } = routesFrom(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    enemy.tile,
    enemy.embarked,
    moves,
  );
  const { building: camp } = ageOf(catalogue, chronicle.age).camp;
  const sought = (tile: Tile): boolean => {
    if (onCity(chronicle, tile) || tile.building === camp) return false;
    const standing = unitAt(chronicle.units, tile);
    const worked = standing?.faction === 'player' && standing.stats.worker;
    return worked || pillaged(catalogue, chronicle, tile) !== undefined;
  };

  let chosen: TileCoords | undefined;
  let least = Number.POSITIVE_INFINITY;
  for (const tile of chronicle.tiles) {
    const weight = ashore.get(tileKey(tile));
    if (weight === undefined || weight >= least) continue;
    if (!sought(tile) || !standsAs(catalogue, { stats: enemy.stats, moves }, tile, false)) continue;
    least = weight;
    chosen = { q: tile.q, r: tile.r };
  }
  return chosen;
}

/**
 * Where an enemy walking to the tile moves, and the tile it then embarks or disembarks onto, if any:
 * onto the tile where it lands on it, else in range of a unit it can attack, on the landing nearest
 * the tile, else toward the tile by the cheapest way.
 */
function walkedTo(
  catalogue: Catalogue,
  chronicle: Chronicle,
  enemy: Unit,
  to: TileCoords,
): { readonly landing: Landing; readonly step?: TileCoords } {
  const stay: Landing = { tile: enemy.tile, cost: 0 };
  if (tileKey(enemy.tile) === tileKey(to)) return { landing: stay };
  const landings = [stay, ...reachable(catalogue, chronicle, enemy)];

  const onto = landings.find((landing) => tileKey(landing.tile) === tileKey(to));
  if (onto !== undefined) return { landing: onto };
  const striking = landingsWithTarget(catalogue, chronicle, enemy, landings, chronicle.units);
  if (striking.length > 0) return { landing: nearestTo(chronicle, striking, to) };

  const moves = enemyMoves(catalogue, chronicle, enemy);
  const toward = routesToward(catalogue, chronicle.tiles, chronicle.rivers, to, false, moves);
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

/** An attack on the unit it can attack holding the least health, ties in tile order; nothing for none. */
function weakest(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): EnemyAct {
  return attackOrNone(
    leastHealth(catalogue, chronicle.tiles, inTileOrder(chronicle.tiles, chronicle.units), enemy),
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

/** The landing the cheapest route to the walk's end weighs the least from, ties in tile order. */
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
