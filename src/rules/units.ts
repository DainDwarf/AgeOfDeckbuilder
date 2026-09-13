import {
  distance,
  MOVE_POINT,
  movementCost,
  pathCosts,
  type River,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';

/** Who a unit acts for. The player commands theirs; an enemy attacks them. */
export type Faction = 'player' | 'enemy';

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type UnitTypeId = 'PH_Worker' | 'PH_Warrior';

/** `PH_` marks a stand-in: this script is not authored content, and it goes with the enemies it drives. */
export type EnemyScriptId = 'PH_Advance';

/**
 * What a unit is and what it can do. A unit carries its own copy, taken from `UNIT_STATS` when the
 * card resolves, so from then on the numbers are that unit's own and change with it. `move` counts
 * in `MOVE_POINT` hundredths, alone among these: every other stat here is a whole number.
 */
export type UnitStats = {
  readonly type: UnitTypeId;
  readonly health: number;
  readonly damage: number;
  readonly range: number;
  readonly move: number;
  readonly action: number;
  readonly sight: number;
};

/** The stats a unit of each kind enters the map with. */
export const UNIT_STATS: Record<UnitTypeId, UnitStats> = {
  PH_Worker: {
    type: 'PH_Worker',
    health: 2,
    damage: 0,
    range: 0,
    move: 2 * MOVE_POINT,
    action: 1,
    sight: 2,
  },
  PH_Warrior: {
    type: 'PH_Warrior',
    health: 5,
    damage: 2,
    range: 1,
    move: 2 * MOVE_POINT,
    action: 1,
    sight: 2,
  },
};

/**
 * A unit standing on the map, with the move points it has left to cross tiles on and the action it
 * has left to spend. An enemy is the one that carries a script — the enemy phase asks it where
 * to move and what to attack. `id` is the number the chronicle dealt it as it entered: what every
 * command names it by, whoever else enters or is killed around it.
 */
export type Unit = {
  readonly id: number;
  readonly stats: UnitStats;
  readonly tile: TileCoords;
  readonly movePoints: number;
  readonly action: number;
} & (
  | { readonly faction: 'player' }
  | { readonly faction: 'enemy'; readonly script: EnemyScriptId }
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

/** A unit with one of its action spent: what an attack spends, and a card played through a worker. */
export function spentAction<U extends Unit>(unit: U): U {
  return { ...unit, action: unit.action - 1 };
}

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => unit.tile.q === coord.q && unit.tile.r === coord.r);
}

/** Whether an enemy occupies a tile: what it stands on yields nothing and is no claim of the city's. */
export function occupied(units: readonly Unit[], coord: TileCoords): boolean {
  return unitAt(units, coord)?.faction === 'enemy';
}

/** The unit a number names, and nothing once that unit has left the map. */
export function unitOf(units: readonly Unit[], id: number): Unit | undefined {
  return units.find((unit) => unit.id === id);
}

/**
 * Whether a unit of these stats can stand on a tile at all: the tile names a movement cost, and the
 * unit's move covers it. Move points never run above the move, so the answer holds all turn.
 */
export function standsOn(stats: UnitStats, tile: Tile | undefined): boolean {
  const cost = movementCost(tile);
  return cost !== undefined && cost <= stats.move;
}

/**
 * What a path over the map is read from: the ground it runs over, the rivers cutting it, who stands
 * on it, and which of it has ever been in sight. The chronicle answers for all four.
 */
type Crossed = {
  readonly tiles: readonly Tile[];
  readonly rivers: readonly River[];
  readonly units: readonly Unit[];
  readonly snapshots: readonly TileCoords[];
};

/**
 * Where a unit can land on the move points it has left, and what each landing spends: entering a
 * tile spends its movement cost, a step over a river edge every point the unit has left, and a
 * landing costs the cheapest route to it. A tile one of its own holds is crossed but never offered.
 * A unit of the player's neither lands on an uncharted tile nor crosses one, while the enemies read
 * the whole map and cross it charted or not.
 */
export function reachable(chronicle: Crossed, unit: Unit): Landing[] {
  const standing = new Map(chronicle.units.map((other) => [tileKey(other.tile), other.faction]));
  const chartedTiles =
    unit.faction === 'player' ? new Set(chronicle.snapshots.map(tileKey)) : undefined;

  const spent = pathCosts(
    chronicle.tiles,
    chronicle.rivers,
    unit.tile,
    { kind: 'unit', points: unit.movePoints },
    (coord) => {
      const at = tileKey(coord);
      if (chartedTiles !== undefined && !chartedTiles.has(at)) return true;
      const held = standing.get(at);
      return held !== undefined && held !== unit.faction;
    },
  );

  return chronicle.tiles.flatMap(({ q, r }) => {
    const at = tileKey({ q, r });
    const cost = spent.get(at);
    if (cost === undefined || standing.has(at)) return [];
    return [{ tile: { q, r }, cost }];
  });
}

/**
 * What a unit an enemy script attacks: the unit of another faction within its range holding the
 * least health, and nothing when none is there or the unit has no damage to remove.
 */
export function leastHealth(units: readonly Unit[], attacker: Unit): Unit | undefined {
  if (attacker.stats.damage === 0) return undefined;

  let target: Unit | undefined;
  for (const other of units) {
    if (other.faction === attacker.faction) continue;
    if (distance(other.tile, attacker.tile) > attacker.stats.range) continue;
    if (target === undefined || other.stats.health < target.stats.health) target = other;
  }
  return target;
}

/**
 * What a unit can attack: every unit of another faction within its range, while it has the action an
 * attack spends. A unit with none attacks nothing.
 */
export function attackable(units: readonly Unit[], attacker: Unit): Unit[] {
  if (attacker.action <= 0) return [];

  const targets: Unit[] = [];
  for (const other of units) {
    if (other.faction === attacker.faction) continue;
    if (distance(other.tile, attacker.tile) > attacker.stats.range) continue;
    targets.push(other);
  }
  return targets;
}

/** The one attack there is: the target loses the attacker's damage, and at zero health it is killed. */
export function attacked(units: readonly Unit[], attacker: Unit, target: Unit): Unit[] {
  return units.flatMap((unit) => {
    if (unit.id !== target.id) return [unit];
    const health = unit.stats.health - attacker.stats.damage;
    if (health <= 0) return [];
    const hurt: Unit = { ...unit, stats: { ...unit.stats, health } };
    return [hurt];
  });
}
