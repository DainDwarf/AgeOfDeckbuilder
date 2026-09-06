import type { EnemyScriptId } from './enemies';
import { distance, neighbours, passable, type Tile, type TileCoords, tileKey } from './map';

/** Who a unit acts for. The player commands theirs; an enemy attacks them. */
export type Faction = 'player' | 'enemy';

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type UnitTypeId = 'PH_Worker' | 'PH_Warrior';

/**
 * What a unit is and what it can do. A unit carries its own copy, taken from `UNIT_STATS` when the
 * card resolves, so from then on the numbers are that unit's own and change with it.
 */
export type UnitStats = {
  readonly id: UnitTypeId;
  readonly health: number;
  readonly damage: number;
  readonly range: number;
  readonly move: number;
};

/** The stats a unit of each kind enters the map with. */
export const UNIT_STATS: Record<UnitTypeId, UnitStats> = {
  PH_Worker: { id: 'PH_Worker', health: 2, damage: 0, range: 0, move: 2 },
  PH_Warrior: { id: 'PH_Warrior', health: 5, damage: 2, range: 1, move: 2 },
};

/**
 * A unit standing on the map, with the move points it has left to cross tiles on. An enemy is the
 * one that carries a script — the enemy phase asks it where to move and what to aim at — and the
 * intent that phase left on it.
 */
export type Unit = {
  readonly stats: UnitStats;
  readonly tile: TileCoords;
  readonly movePoints: number;
} & (
  | { readonly faction: 'player' }
  | {
      readonly faction: 'enemy';
      readonly script: EnemyScriptId;
      readonly intent?: TileCoords;
    }
);

/** A tile a unit can land on, and the move points crossing to it spends. */
export type Landing = { readonly tile: TileCoords; readonly cost: number };

/**
 * A unit refreshed: its move points back to its move, whatever it had left of them. The one way a
 * spendable stat comes back to full — the turn's tick does it to every unit, the plain order to one.
 */
export function refreshed(unit: Unit): Unit {
  return { ...unit, movePoints: unit.stats.move };
}

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => unit.tile.q === coord.q && unit.tile.r === coord.r);
}

/**
 * Where a unit can land on the move points it has left, and what each landing spends: a tile one of
 * its own holds is crossed but never offered.
 */
export function reachable(tiles: readonly Tile[], units: readonly Unit[], unit: Unit): Landing[] {
  const terrain = new Map(tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const standing = new Map(units.map((other) => [tileKey(other.tile), other.faction]));

  const seen = new Set([tileKey(unit.tile)]);
  const landings: Landing[] = [];
  let front: TileCoords[] = [unit.tile];

  for (let cost = 1; cost <= unit.movePoints; cost++) {
    const next: TileCoords[] = [];
    for (const from of front) {
      for (const coord of neighbours(from)) {
        const at = tileKey(coord);
        if (seen.has(at)) continue;
        if (!passable(terrain.get(at))) continue;
        const held = standing.get(at);
        if (held !== undefined && held !== unit.faction) continue;
        seen.add(at);
        next.push(coord);
        if (held === undefined) landings.push({ tile: coord, cost });
      }
    }
    front = next;
  }

  return landings;
}

/**
 * Who a unit attacks: the target of another faction within its range holding the least health, and
 * nothing when none is there or the unit has no damage to remove.
 */
export function leastHealth(units: readonly Unit[], attacker: number): number | undefined {
  const acting = units[attacker];
  if (acting.stats.damage === 0) return undefined;

  let target: number | undefined;
  for (let index = 0; index < units.length; index++) {
    const other = units[index];
    if (other.faction === acting.faction) continue;
    if (distance(other.tile, acting.tile) > acting.stats.range) continue;
    if (target === undefined || other.stats.health < units[target].stats.health) target = index;
  }
  return target;
}

/** The one attack there is: the target loses the attacker's damage, and at zero health it is killed. */
export function attack(units: readonly Unit[], attacker: number, target: number): Unit[] {
  const targeted = units[target];
  const health = targeted.stats.health - units[attacker].stats.damage;
  if (health <= 0) return units.filter((_, index) => index !== target);

  const hurt: Unit = { ...targeted, stats: { ...targeted.stats, health } };
  return units.map((unit, index) => (index === target ? hurt : unit));
}
