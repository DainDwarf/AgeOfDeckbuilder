import {
  ageOf,
  type Catalogue,
  cardOf,
  costOf,
  type NeutralScript,
  type ScriptAct,
  type UnitScript,
  type UnitShare,
  workerAim,
} from '../rules/catalogue';
import {
  attackOrNone,
  campAshore,
  leastHealth,
  otherCityOn,
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
import { pickUniform, type Rng } from '../rules/rng';
import { inOwnSight } from '../rules/sight';
import {
  type CardId,
  type Chronicle,
  cityOn,
  type NeutralCity,
  unaffordable,
} from '../rules/state';
import {
  canAttack,
  type Landing,
  passageFor,
  reachable,
  relationsOf,
  type Unit,
  unitAt,
} from '../rules/units';

/**
 * The raider, going for the nearest by its own walk of the cities not its own, the player's where
 * its walk reaches none, and preparing the capture on that city's tile.
 */
export const RAIDER: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, raider: Unit) {
    const { city } = chronicle;
    if (city === undefined) return { landing: { tile: raider.tile, cost: 0 }, rng: chronicle.rng };
    const target =
      nearestByWalk(
        catalogue,
        chronicle,
        raider,
        (tile) => otherCityOn(chronicle, tile, raider.faction) !== undefined,
      ) ?? city;
    return { ...walkedTo(catalogue, chronicle, raider, target), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, raider: Unit): ScriptAct {
    if (otherCityOn(chronicle, raider.tile, raider.faction) !== undefined) {
      return { act: 'prepare' };
    }
    return weakest(catalogue, chronicle, raider);
  },
};

/**
 * The pillager, going for the nearest of either city's workers and of what they built, and raiding
 * with nothing to go for.
 */
export const PILLAGER: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit) {
    const target = goesFor(catalogue, chronicle, enemy);
    if (target === undefined) return RAIDER.moveTo(catalogue, chronicle, enemy);
    return { ...walkedTo(catalogue, chronicle, enemy, target), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): ScriptAct {
    if (
      otherCityOn(chronicle, enemy.tile, enemy.faction) !== undefined &&
      goesFor(catalogue, chronicle, enemy) === undefined
    ) {
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
    const { neutral } = chronicle;
    if (neutral === undefined) return { landing: { tile: unit.tile, cost: 0 }, rng: chronicle.rng };
    return keptInside(catalogue, chronicle, unit, neutral, (inside) => {
      const attacking = landingsWithTarget(catalogue, chronicle, unit, inside, chronicle.units);
      if (attacking.length > 0) return nearestTo(chronicle, attacking, neutral.city);
      const seen = chronicle.units.filter(
        (other) =>
          canAttack(unit, other, 0, relationsOf(chronicle)) &&
          inOwnSight(catalogue, chronicle.tiles, unit, other.tile),
      );
      if (seen.length === 0) return undefined;
      return nearestTo(chronicle, inside, nearestTo(chronicle, seen, unit.tile).tile);
    });
  },

  acts: raidingWhileHostile,
};

/**
 * The neutral's worker, at peace and hostile alike: going for the tile its city holds where one of
 * its cards adds the most to the yield and playing it there, else resting as the guard does; of no
 * city it stands where it is.
 */
export const NEUTRAL_WORKER: UnitScript = {
  moveTo(catalogue: Catalogue, chronicle: Chronicle, unit: Unit) {
    const { neutral } = chronicle;
    if (neutral === undefined) return { landing: { tile: unit.tile, cost: 0 }, rng: chronicle.rng };
    const build = buildOf(catalogue, chronicle, unit);
    if (build === undefined)
      return keptInside(catalogue, chronicle, unit, neutral, () => undefined);
    return { ...walkedTo(catalogue, chronicle, unit, build.tile), rng: chronicle.rng };
  },

  acts(catalogue: Catalogue, chronicle: Chronicle, unit: Unit): ScriptAct {
    const build = buildOf(catalogue, chronicle, unit);
    if (unit.embarked || build === undefined || tileKey(build.tile) !== tileKey(unit.tile)) {
      return { act: 'none' };
    }
    return { act: 'play', card: build.card, tile: build.tile };
  },
};

/**
 * What a worker of the neutral's builds, and nothing where it can build nothing: the free tile its
 * city holds and the card the neutral can pay for that adds the most to the tile's yield there.
 */
function buildOf(
  catalogue: Catalogue,
  chronicle: Chronicle,
  worker: Unit,
): { readonly tile: TileCoords; readonly card: CardId } | undefined {
  const { neutral } = chronicle;
  if (neutral === undefined) return undefined;
  const cards = ageOf(catalogue, chronicle.age).neutral?.workers?.cards ?? [];
  const held = new Set(neutral.held.map(tileKey));
  const beside = tilesBeside(chronicle.tiles);
  let chosen: { readonly tile: TileCoords; readonly card: CardId } | undefined;
  let most = { food: Number.NEGATIVE_INFINITY, worth: Number.NEGATIVE_INFINITY };
  let nearest = Number.POSITIVE_INFINITY;
  for (const tile of chronicle.tiles) {
    const at = { q: tile.q, r: tile.r };
    const standing = unitAt(chronicle.units, at);
    if (!held.has(tileKey(at)) || (standing !== undefined && standing.id !== worker.id)) continue;
    const there = {
      ...chronicle,
      units: chronicle.units.map((unit) => (unit.id === worker.id ? { ...unit, tile: at } : unit)),
    };
    const before = tileYield(catalogue, tile, beside);
    const away = distance(at, neutral.city);
    for (const card of cards) {
      const aim = workerAim(cardOf(catalogue, card));
      if (
        aim === undefined ||
        aim.refuses(catalogue, there, tile, 'neutral') !== undefined ||
        unaffordable(neutral, costOf(catalogue, card)).length > 0
      ) {
        continue;
      }
      const after = aim.effect(catalogue, there, at).chronicle.tiles;
      const relaid = tileAt(after, at);
      if (relaid === undefined) continue;
      const yields = tileYield(catalogue, relaid, tilesBeside(after));
      const added = {
        food: (yields.food ?? 0) - (before.food ?? 0),
        worth: worthOf(yields) - worthOf(before),
      };
      const better =
        added.food > most.food ||
        (added.food === most.food &&
          (added.worth > most.worth || (added.worth === most.worth && away < nearest)));
      if (!better) continue;
      chosen = { tile: at, card };
      most = added;
      nearest = away;
    }
  }
  return chosen;
}

/**
 * Where a unit of the neutral's keeping the tiles its city holds lands: back toward its city from
 * outside them, where `keeping` chooses inside them, and else wandering among them, off its city's
 * tile while another is free.
 */
function keptInside(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
  neutral: NeutralCity,
  keeping: (inside: readonly Landing[]) => Landing | undefined,
): { readonly landing: Landing; readonly rng: Rng } {
  const kept = (landing: Landing) => ({ landing, rng: chronicle.rng });
  const { city } = neutral;
  const held = new Set(neutral.held.map(tileKey));
  const landings = [{ tile: unit.tile, cost: 0 }, ...reachable(catalogue, chronicle, unit)];
  const inside = landings.filter((landing) => held.has(tileKey(landing.tile)));
  if (inside.length === 0) return kept(nearestTo(chronicle, landings, city));
  const chosen = keeping(inside);
  if (chosen !== undefined) return kept(chosen);

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
}

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

/**
 * What a pillager goes for: of the tiles a worker of either city's stands on and those a pillage
 * takes something from, a city's own and a camp's never, the one its own walk weighs the least to.
 */
function goesFor(catalogue: Catalogue, chronicle: Chronicle, enemy: Unit): TileCoords | undefined {
  const { building: camp } = ageOf(catalogue, chronicle.age).camp;
  return nearestByWalk(catalogue, chronicle, enemy, (tile) => {
    if (cityOn(chronicle, tile) !== undefined || tile.building === camp) return false;
    return (
      cityWorker(unitAt(chronicle.units, tile)) ||
      pillaged(catalogue, chronicle, tile) !== undefined
    );
  });
}

/** Whether the unit is a worker of either city's. */
function cityWorker(unit: Unit | undefined): boolean {
  if (unit === undefined || !unit.stats.worker) return false;
  switch (unit.faction) {
    case 'player':
    case 'neutral':
      return true;
    case 'enemy':
      return false;
  }
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
  const { picked, rng } = pickUniform(chronicle.rng, inTileOrder(chronicle.tiles, landings));
  return { landing: picked, rng };
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
