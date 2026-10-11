import {
  ageOf,
  type Catalogue,
  type NeutralScript,
  type ScriptAct,
  type UnitScript,
  type UnitShare,
} from '../rules/catalogue';
import {
  attackOrNone,
  campAshore,
  leastHealth,
  pillaged,
  standsAs,
  stepMove,
  targetsInOwnSight,
  walkMoves,
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
  tilesBeside,
  tileYield,
} from '../rules/map';
import { RESOURCES, type Resources } from '../rules/resources';
import { nextRng, type Rng } from '../rules/rng';
import { inOwnSight } from '../rules/sight';
import type { CardId, Chronicle } from '../rules/state';
import {
  canAttack,
  type Landing,
  passageFor,
  reachable,
  relationsOf,
  type Unit,
  unitAt,
} from '../rules/units';

export const RAIDER: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    const { city } = chronicle;
    if (city === undefined) return { landing: { tile: enemy.tile, cost: 0 }, rng: chronicle.rng };
    return { ...walkedTo(catalogue, chronicle, enemy, city), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): ScriptAct {
    if (onCity(chronicle, enemy.tile)) return { act: 'prepare' };
    return weakest(catalogue, chronicle, enemy);
  },
};

/**
 * The pillager, going for the nearest of the player's workers and of what they built, and raiding
 * with nothing to go for.
 */
export const PILLAGER: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    const target = goesFor(catalogue, chronicle, enemy);
    if (target === undefined) return RAIDER.moveTo(catalogue, chronicle, enemy);
    return { ...walkedTo(catalogue, chronicle, enemy, target), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): ScriptAct {
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
 * The guard, keeping its own camp while it stands ashore, inside `radius` of it while the camp is
 * held, and raiding embarked or with no camp.
 */
export function guarding(radius: number): UnitScript {
  return {
    moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
      const camp = campAshore(enemy);
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
      if (inside.length === 0) return kept(nearestTo(chronicle, landings, camp));
      const relations = relationsOf(chronicle);
      // The tile inside the radius nearest a unit stands the unit's distance from the camp less the
      // radius away from it, and none for a unit inside the radius.
      const targets = chronicle.units.filter((unit) =>
        canAttack(enemy, unit, Math.max(0, distance(unit.tile, camp) - radius), relations),
      );
      const attacking = landingsWithTarget(catalogue, chronicle, enemy, inside, targets);
      if (attacking.length > 0) return kept(nearestTo(chronicle, attacking, camp));
      if (targets.length > 0) {
        return kept(nearestTo(chronicle, inside, nearestTo(chronicle, targets, enemy.tile).tile));
      }

      return wanderedTo(chronicle, inside);
    },

    acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): ScriptAct {
      if (campAshore(enemy) === undefined) {
        return RAIDER.acts(catalogue, chronicle, enemy);
      }
      return weakest(catalogue, chronicle, enemy);
    },
  };
}

/**
 * The neutral's guard, raiding while hostile and at peace keeping the tiles its city holds: landing
 * where it attacks from inside them, else nearest a unit it sees, else wandering inside them, off
 * its city's tile while another is free; outside them it walks back.
 */
export const NEUTRAL_GUARD: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, unit: Unit) {
    if (relationsOf(chronicle) === 'hostile') return RAIDER.moveTo(catalogue, chronicle, unit);
    const kept = (landing: Landing) => ({ landing, rng: chronicle.rng });
    const stay: Landing = { tile: unit.tile, cost: 0 };
    const { neutral } = chronicle;
    if (neutral === undefined) return kept(stay);
    const { city } = neutral;
    const held = new Set(neutral.held.map(tileKey));
    const landings = [stay, ...reachable(catalogue, chronicle, unit)];
    const inside = landings.filter((landing) => held.has(tileKey(landing.tile)));
    if (inside.length === 0) return kept(nearestTo(chronicle, landings, city));

    const attacking = landingsWithTarget(catalogue, chronicle, unit, inside, chronicle.units);
    if (attacking.length > 0) return kept(nearestTo(chronicle, attacking, city));
    const seen = chronicle.units.filter(
      (other) =>
        canAttack(unit, other, 0, relationsOf(chronicle)) &&
        inOwnSight(catalogue, chronicle.tiles, unit, other.tile),
    );
    if (seen.length > 0) {
      return kept(nearestTo(chronicle, inside, nearestTo(chronicle, seen, unit.tile).tile));
    }

    const free = neutral.held
      .filter((tile) => {
        const there = unitAt(chronicle.units, tile);
        return tileKey(tile) !== tileKey(city) && (there === undefined || there.id === unit.id);
      })
      .map((tile) => ({ tile }));
    const resting =
      free.length === 0
        ? inside
        : inside.filter((landing) => tileKey(landing.tile) !== tileKey(city));
    if (resting.length === 0) {
      return kept(nearestTo(chronicle, inside, nearestTo(chronicle, free, unit.tile).tile));
    }
    return wanderedTo(chronicle, resting);
  },

  acts: raidingWhileHostile,
};

/**
 * The neutral's wave, going for the nearest camp by its own walk, crossing the water on its way and
 * attacking what it can; with no camp to go for it stands where it is. Hostile, it raids.
 */
export const NEUTRAL_WAVE: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, unit: Unit) {
    if (relationsOf(chronicle) === 'hostile') return RAIDER.moveTo(catalogue, chronicle, unit);
    const { building } = ageOf(catalogue, chronicle.age).camp;
    const camp = nearestByWalk(catalogue, chronicle, unit, (tile) => tile.building === building);
    if (camp === undefined) return { landing: { tile: unit.tile, cost: 0 }, rng: chronicle.rng };
    return { ...walkedTo(catalogue, chronicle, unit, camp), rng: chronicle.rng };
  },

  acts: raidingWhileHostile,
};

/** What a unit of the neutral's does with an action: the raider's while hostile, else the weakest it can attack. */
function raidingWhileHostile(catalogue: Catalogue, chronicle: Chronicle, unit: Unit): ScriptAct {
  if (relationsOf(chronicle) === 'hostile') return RAIDER.acts(catalogue, chronicle, unit);
  return weakest(catalogue, chronicle, unit);
}

/**
 * The villager: claiming the tile that yields most, the nearest to its city of equals, and working
 * the most food, the most together of equals, ties in tile order; entering the kind falling shortest
 * of the ratio.
 */
export const VILLAGER: NeutralScript = {
  claims(catalogue: Catalogue, chronicle: Chronicle, offered: readonly TileCoords[]): TileCoords {
    const beside = tilesBeside(chronicle.tiles);
    const among = new Set(offered.map(tileKey));
    const city = chronicle.neutral?.city;
    let chosen = offered[0];
    let most = Number.NEGATIVE_INFINITY;
    let nearest = Number.POSITIVE_INFINITY;
    for (const tile of chronicle.tiles) {
      if (!among.has(tileKey(tile))) continue;
      const worth = worthOf(tileYield(catalogue, tile, beside));
      const away = city === undefined ? 0 : distance(tile, city);
      if (worth < most || (worth === most && away >= nearest)) continue;
      most = worth;
      nearest = away;
      chosen = { q: tile.q, r: tile.r };
    }
    return chosen;
  },

  assigns(catalogue: Catalogue, chronicle: Chronicle, held: readonly TileCoords[]) {
    const beside = tilesBeside(chronicle.tiles);
    const among = new Set(held.map(tileKey));
    return chronicle.tiles
      .filter((tile) => among.has(tileKey(tile)))
      .map((tile) => ({
        tile: { q: tile.q, r: tile.r },
        yields: tileYield(catalogue, tile, beside),
      }))
      .sort(
        (a, b) =>
          (b.yields.food ?? 0) - (a.yields.food ?? 0) || worthOf(b.yields) - worthOf(a.yields),
      )
      .slice(0, chronicle.neutral?.population ?? 0)
      .map(({ tile }) => tile);
  },

  enters(_catalogue: Catalogue, chronicle: Chronicle, ratio: readonly UnitShare[]) {
    const units = chronicle.units.filter((unit) => unit.faction === 'neutral');
    const whole = ratio.reduce((sum, { share }) => sum + share, 0);
    let chosen: CardId | undefined;
    let shortest = Number.NEGATIVE_INFINITY;
    for (const { card, kind, share } of ratio) {
      const standing = units.filter((unit) => unit.stats.type === kind).length;
      // The ratio's share against the units' share, cross-multiplied to stay exact.
      const short = share * units.length - standing * whole;
      if (short <= shortest) continue;
      shortest = short;
      chosen = card;
    }
    return chosen;
  },
};

/** What a tile yields in every resource together. */
function worthOf(yields: Partial<Resources>): number {
  return RESOURCES.reduce((sum, resource) => sum + (yields[resource] ?? 0), 0);
}

/** Whether the tile is the city's. */
function onCity(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.city !== undefined && tileKey(tile) === tileKey(chronicle.city);
}

/**
 * What a pillager goes for: of the tiles a worker of the player's stands on and those a pillage takes
 * something from, the city's and a camp's never, the one its own walk weighs the least to.
 */
function goesFor(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): TileCoords | undefined {
  const { building: camp } = ageOf(catalogue, chronicle.age).camp;
  return nearestByWalk(catalogue, chronicle, enemy, (tile) => {
    if (onCity(chronicle, tile) || tile.building === camp) return false;
    const standing = unitAt(chronicle.units, tile);
    const worked = standing?.faction === 'player' && standing.stats.worker;
    return worked || pillaged(catalogue, chronicle, tile) !== undefined;
  });
}

/**
 * Of the tiles sought, the one the walker stands on ashore that its own walk, ashore and embarked,
 * weighs the least to, ties in tile order; nothing where its walk reaches none.
 */
function nearestByWalk(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Unit,
  sought: (tile: Tile) => boolean,
): TileCoords | undefined {
  const moves = walkMoves(catalogue, chronicle, walker);
  const { ashore } = routesFrom(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    walker.tile,
    walker.embarked,
    moves,
    passageFor(chronicle, walker.faction),
  );
  let chosen: TileCoords | undefined;
  let least = Number.POSITIVE_INFINITY;
  for (const tile of chronicle.tiles) {
    const weight = ashore.get(tileKey(tile));
    if (weight === undefined || weight >= least) continue;
    if (!sought(tile) || !standsAs(catalogue, { stats: walker.stats, moves }, tile, false))
      continue;
    least = weight;
    chosen = { q: tile.q, r: tile.r };
  }
  return chosen;
}

/** A landing drawn among these from the chronicle's generator, in tile order, and the generator left. */
function wanderedTo(
  chronicle: Chronicle,
  landings: readonly Landing[],
): { readonly landing: Landing; readonly rng: Rng } {
  const wandering = inTileOrder(chronicle.tiles, landings);
  const step = nextRng(chronicle.rng);
  return { landing: wandering[Math.floor(step.value * wandering.length)], rng: step.rng };
}

/**
 * Where a unit walking to the tile moves, and the tile it then embarks or disembarks onto, if any:
 * onto the tile where it lands on it, else in range of a unit it can attack, on the landing nearest
 * the tile, else toward the tile by the cheapest way.
 */
function walkedTo(
  catalogue: Catalogue,
  chronicle: Chronicle,
  walker: Unit,
  to: TileCoords,
): { readonly landing: Landing; readonly step?: TileCoords } {
  const stay: Landing = { tile: walker.tile, cost: 0 };
  if (tileKey(walker.tile) === tileKey(to)) return { landing: stay };
  const landings = [stay, ...reachable(catalogue, chronicle, walker)];

  const onto = landings.find((landing) => tileKey(landing.tile) === tileKey(to));
  if (onto !== undefined) return { landing: onto };
  const attacking = landingsWithTarget(catalogue, chronicle, walker, landings, chronicle.units);
  if (attacking.length > 0) return { landing: nearestTo(chronicle, attacking, to) };

  const moves = walkMoves(catalogue, chronicle, walker);
  const toward = routesToward(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    to,
    false,
    moves,
    passageFor(chronicle, walker.faction),
  );
  const landing = cheapestToward(chronicle, walker, landings, toward);
  return { landing, step: stepToward(catalogue, chronicle, walker, landing, toward) };
}

/** The landings it could attack one of the units from. */
function landingsWithTarget(
  catalogue: Catalogue,
  chronicle: Chronicle,
  attacker: Unit,
  landings: readonly Landing[],
  units: readonly Unit[],
): Landing[] {
  return landings.filter((landing) => {
    const landed = { ...attacker, tile: landing.tile };
    return targetsInOwnSight(catalogue, chronicle, units, landed).length > 0;
  });
}

/** An attack on the unit it can attack holding the least health, ties in tile order; nothing for none. */
function weakest(catalogue: Catalogue, chronicle: Chronicle, attacker: Unit): ScriptAct {
  return attackOrNone(
    leastHealth(catalogue, chronicle, inTileOrder(chronicle.tiles, chronicle.units), attacker),
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
