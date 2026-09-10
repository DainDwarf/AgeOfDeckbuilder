import { movementCost, pathCosts, type Tile, type TileCoords, tileAt, tileKey } from './map';
import { nextRng } from './rng';
import { type Chronicle, entered } from './state';
import {
  type EnemyScriptId,
  type Landing,
  leastHealth,
  reachable,
  UNIT_STATS,
  type Unit,
  unitAt,
} from './units';

/**
 * The enemy a camp enters. Every terrain a camp names has to be ground this unit stands on, or a
 * camp lands where its own enemy cannot: nothing holds the two together, and the test in
 * `map.test.ts` is what raises a list that has drifted.
 */
export const CAMP_ENEMY = UNIT_STATS.PH_Warrior;

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
      const target = nearest(chronicle, enemy);
      if (target === undefined) return stay;

      const outward = costsFrom(chronicle, target, enemy);
      const landings = [stay, ...reachable(chronicle, enemy)];
      const spent = new Map(landings.map((landing) => [tileKey(landing.tile), landing.cost]));

      let chosen = stay;
      let cheapest = Number.POSITIVE_INFINITY;
      for (const tile of inTileOrder(
        chronicle.tiles,
        landings.map((landing) => landing.tile),
      )) {
        const at = tileKey(tile);
        const reached = outward.get(at);
        const own = movementCost(tileAt(chronicle.tiles, tile));
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

    attacks(chronicle: Chronicle, enemy: Unit): Unit | undefined {
      if (tileKey(enemy.tile) === tileKey(chronicle.city)) return undefined;
      return leastHealth(chronicle.units, enemy);
    },
  },
};

/**
 * One enemy entering the map from a camp: it stands on a camp whose tile no unit stands on, drawn
 * from the seeded generator, with its move points and its action full. With no such camp it enters
 * nowhere and draws nothing.
 */
export function enteredFromCamp(chronicle: Chronicle): Chronicle {
  const camps = chronicle.tiles.filter(
    (tile) => tile.building === 'PH_Camp' && unitAt(chronicle.units, tile) === undefined,
  );
  if (camps.length === 0) return chronicle;

  const step = nextRng(chronicle.rng);
  const { q, r } = camps[Math.floor(step.value * camps.length)];
  return entered(
    { ...chronicle, rng: step.rng },
    { type: CAMP_ENEMY.type, faction: 'enemy', tile: { q, r }, script: 'PH_Advance' },
  );
}

/** What an enemy moves toward: the player's unit or the city it crosses to for the least it can. */
function nearest(chronicle: Chronicle, walker: Unit): TileCoords | undefined {
  const costs = costsFrom(chronicle, walker.tile, walker);
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
 * What crossing to every tile from a start costs the walking unit, whatever stands on them and
 * however far off they lie: a script reads the whole map, so no move points cap the walk and a river
 * edge weighs the walker's whole move, what a crossing drains at worst. A tile no route reaches is
 * absent.
 */
function costsFrom(chronicle: Chronicle, from: TileCoords, walker: Unit): Map<string, number> {
  return pathCosts(
    chronicle.tiles,
    chronicle.rivers,
    from,
    { kind: 'whole-map', move: walker.stats.move },
    () => false,
  );
}
