import { distance, neighbours, type Tile, type TileCoords, tileKey } from './map';

/** Whose a unit is. The player commands theirs; an enemy attacks them. */
export type Side = 'player' | 'enemy';

/** `PH_` marks a stand-in: neither of these is authored content, and both of them go. */
export type UnitTypeId = 'PH_Worker' | 'PH_Warrior';

/**
 * What a unit is and what it can do. A unit carries its own copy, taken from `UNIT_TYPES` when the
 * card resolves, so from then on the numbers are that unit's own and change with it.
 */
export type UnitType = {
  readonly id: UnitTypeId;
  readonly health: number;
  readonly damage: number;
  readonly range: number;
  readonly move: number;
};

/** The stats a unit of each kind enters the map with. */
export const UNIT_TYPES: Record<UnitTypeId, UnitType> = {
  PH_Worker: { id: 'PH_Worker', health: 2, damage: 0, range: 0, move: 2 },
  PH_Warrior: { id: 'PH_Warrior', health: 5, damage: 2, range: 1, move: 2 },
};

export type Unit = {
  readonly unitType: UnitType;
  readonly owner: Side;
  readonly tile: TileCoords;
};

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => unit.tile.q === coord.q && unit.tile.r === coord.r);
}

/**
 * Where a unit can land: every tile within its move, each tile crossed costing one. Water is
 * impassable, a unit passes through its own side and never through the other's, and it lands only
 * on a free tile — so a tile an ally holds is crossed but never offered.
 */
export function reachable(
  tiles: readonly Tile[],
  units: readonly Unit[],
  unit: Unit,
): TileCoords[] {
  const terrain = new Map(tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const standing = new Map(units.map((other) => [tileKey(other.tile), other.owner]));

  const seen = new Set([tileKey(unit.tile)]);
  const landings: TileCoords[] = [];
  let edge: TileCoords[] = [unit.tile];

  for (let step = 0; step < unit.unitType.move; step++) {
    const next: TileCoords[] = [];
    for (const from of edge) {
      for (const coord of neighbours(from)) {
        const at = tileKey(coord);
        if (seen.has(at)) continue;
        const ground = terrain.get(at);
        if (ground === undefined || ground === 'water') continue;
        const held = standing.get(at);
        if (held !== undefined && held !== unit.owner) continue;
        seen.add(at);
        next.push(coord);
        if (held === undefined) landings.push(coord);
      }
    }
    edge = next;
  }

  return landings;
}

/**
 * What a unit does where it lands: one with damage attacks the enemy within its range holding the
 * least health, once, and a unit brought to zero health is killed and leaves the map. There is no
 * retaliation, and a unit with no damage — a worker — does nothing at all.
 */
export function arrive(units: readonly Unit[], mover: number): Unit[] {
  const acting = units[mover];
  if (acting.unitType.damage === 0) return [...units];

  let struck = -1;
  for (let index = 0; index < units.length; index++) {
    const other = units[index];
    if (other.owner === acting.owner) continue;
    if (distance(other.tile, acting.tile) > acting.unitType.range) continue;
    if (struck === -1 || other.unitType.health < units[struck].unitType.health) struck = index;
  }
  if (struck === -1) return [...units];

  const health = units[struck].unitType.health - acting.unitType.damage;
  if (health <= 0) return units.filter((_, index) => index !== struck);
  return units.map((unit, index) =>
    index === struck ? { ...unit, unitType: { ...unit.unitType, health } } : unit,
  );
}
