import { distance, neighbours, passable, type Tile, type TileCoords, tileKey } from './map';

/** Who a unit acts for. The player commands theirs; an enemy attacks them. */
export type Faction = 'player' | 'enemy';

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type UnitTypeId = 'PH_Worker' | 'PH_Warrior';

/** `PH_` marks a stand-in: this script is not authored content, and it goes with the enemies it drives. */
export type EnemyScriptId = 'PH_Advance';

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
  readonly action: number;
};

/** The stats a unit of each kind enters the map with. */
export const UNIT_STATS: Record<UnitTypeId, UnitStats> = {
  PH_Worker: { id: 'PH_Worker', health: 2, damage: 0, range: 0, move: 2, action: 0 },
  PH_Warrior: { id: 'PH_Warrior', health: 5, damage: 2, range: 1, move: 2, action: 1 },
};

/**
 * A unit standing on the map, with the move points it has left to cross tiles on and the action it
 * has left to attack on. An enemy is the one that carries a script — the enemy phase asks it where
 * to move and what to aim at — and the intent that phase left on it. `id` is the number the
 * chronicle dealt it as it entered: what every command and every finder names it by, whoever else
 * enters or is killed around it.
 */
export type Unit = {
  readonly id: number;
  readonly stats: UnitStats;
  readonly tile: TileCoords;
  readonly movePoints: number;
  readonly action: number;
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

/** A unit's move points refreshed to its move, whatever it had left of them. */
export function refreshedMovePoints(unit: Unit): Unit {
  return { ...unit, movePoints: unit.stats.move };
}

/** A unit's action refreshed to its own action, whatever it had left of it. */
export function refreshedAction(unit: Unit): Unit {
  return { ...unit, action: unit.stats.action };
}

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => unit.tile.q === coord.q && unit.tile.r === coord.r);
}

/** The unit a number names, and nothing once that unit has left the map. */
export function unitOf(units: readonly Unit[], id: number): Unit | undefined {
  return units.find((unit) => unit.id === id);
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
 * What a unit an enemy script aims at, by its number: the unit of another faction within its range
 * holding the least health, and nothing when none is there or the unit has no damage to remove.
 */
export function leastHealth(units: readonly Unit[], attacker: Unit): number | undefined {
  if (attacker.stats.damage === 0) return undefined;

  let target: Unit | undefined;
  for (const other of units) {
    if (other.faction === attacker.faction) continue;
    if (distance(other.tile, attacker.tile) > attacker.stats.range) continue;
    if (target === undefined || other.stats.health < target.stats.health) target = other;
  }
  return target?.id;
}

/**
 * What a unit can attack, each by its number: every unit of another faction within its range, while
 * it has the action an attack spends. A unit with none attacks nothing.
 */
export function attackable(units: readonly Unit[], attacker: Unit): number[] {
  if (attacker.action <= 0) return [];

  const targets: number[] = [];
  for (const other of units) {
    if (other.faction === attacker.faction) continue;
    if (distance(other.tile, attacker.tile) > attacker.stats.range) continue;
    targets.push(other.id);
  }
  return targets;
}

/** The one attack there is: the target loses the attacker's damage, and at zero health it is killed. */
export function attacked(units: readonly Unit[], attacker: Unit, target: number): Unit[] {
  return units.flatMap((unit) => {
    if (unit.id !== target) return [unit];
    const health = unit.stats.health - attacker.stats.damage;
    if (health <= 0) return [];
    const hurt: Unit = { ...unit, stats: { ...unit.stats, health } };
    return [hurt];
  });
}
