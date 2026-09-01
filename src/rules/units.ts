import { distance, neighbours, type Tile, type TileCoords, tileKey } from './map';

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

export type Unit = {
  readonly stats: UnitStats;
  readonly faction: Faction;
  readonly tile: TileCoords;
};

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => unit.tile.q === coord.q && unit.tile.r === coord.r);
}

/** Where a unit can land: a tile one of its own holds is crossed but never offered. */
export function reachable(
  tiles: readonly Tile[],
  units: readonly Unit[],
  unit: Unit,
): TileCoords[] {
  const terrain = new Map(tiles.map((tile) => [tileKey(tile), tile.terrain]));
  const standing = new Map(units.map((other) => [tileKey(other.tile), other.faction]));

  const seen = new Set([tileKey(unit.tile)]);
  const landings: TileCoords[] = [];
  let edge: TileCoords[] = [unit.tile];

  for (let step = 0; step < unit.stats.move; step++) {
    const next: TileCoords[] = [];
    for (const from of edge) {
      for (const coord of neighbours(from)) {
        const at = tileKey(coord);
        if (seen.has(at)) continue;
        const ground = terrain.get(at);
        if (ground === undefined || ground === 'water') continue;
        const held = standing.get(at);
        if (held !== undefined && held !== unit.faction) continue;
        seen.add(at);
        next.push(coord);
        if (held === undefined) landings.push(coord);
      }
    }
    edge = next;
  }

  return landings;
}

/** What a unit does where it lands. A unit with no damage — a worker — does nothing at all. */
export function arrive(units: readonly Unit[], mover: number): Unit[] {
  const acting = units[mover];
  if (acting.stats.damage === 0) return [...units];

  let struck = -1;
  for (let index = 0; index < units.length; index++) {
    const other = units[index];
    if (other.faction === acting.faction) continue;
    if (distance(other.tile, acting.tile) > acting.stats.range) continue;
    if (struck === -1 || other.stats.health < units[struck].stats.health) struck = index;
  }
  if (struck === -1) return [...units];

  const health = units[struck].stats.health - acting.stats.damage;
  if (health <= 0) return units.filter((_, index) => index !== struck);
  return units.map((unit, index) =>
    index === struck ? { ...unit, stats: { ...unit.stats, health } } : unit,
  );
}
