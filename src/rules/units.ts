import {
  distance,
  movementCost,
  type Passage,
  pathCosts,
  type River,
  sameTile,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import type { MapContent } from './map-kinds';

/** Who a unit acts for: the player, the enemies, or the neutral. */
export type Faction = 'player' | 'enemy' | 'neutral';

/** The factions whose units act by a script. */
export type ScriptedFaction = Exclude<Faction, 'player'>;

/** A faction's relations with the player: at peace, or hostile. */
export type Relations = 'peace' | 'hostile';

/** The neutral's relations with the player, and peace on a chronicle holding no neutral. */
export function relationsOf(chronicle: { readonly relations?: Relations }): Relations {
  return chronicle.relations ?? 'peace';
}

/**
 * What a unit is and what it can do. A unit carries its own copy, taken from its kind in the
 * catalogue as it enters, so from then on the numbers are that unit's own and change with it. `move`
 * counts in `MOVE_POINT` hundredths, alone among these: every other stat here is a whole number.
 */
export type UnitStats = {
  readonly type: string;
  readonly worker: boolean;
  readonly health: number;
  readonly damage: number;
  readonly range: number;
  readonly move: number;
  readonly action: number;
  readonly sight: number;
};

/**
 * A unit standing on the map, with the move points and the action it has left. `id` is the number
 * dealt it as it entered: what every command names it by, whoever else enters or is killed around
 * it.
 */
export type Unit = {
  readonly id: number;
  readonly stats: UnitStats;
  readonly tile: TileCoords;
  readonly movePoints: number;
  readonly action: number;
  readonly embarked: boolean;
} & (
  | { readonly faction: 'player' }
  | {
      readonly faction: 'enemy';
      readonly script: string;
      readonly prepared: boolean;
      readonly camp?: TileCoords;
    }
  | { readonly faction: 'neutral'; readonly script: string; readonly prepared: boolean }
);

/** The least each number of a unit's stats may stand at. */
export const LEAST_STATS: Readonly<Record<Exclude<keyof UnitStats, 'type' | 'worker'>, number>> = {
  health: 1,
  damage: 0,
  range: 0,
  move: 0,
  action: 0,
  sight: 0,
};

/** The number a chronicle's first unit is dealt. */
export const FIRST_UNIT_NUMBER = 1;

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

/**
 * A unit with one of its action spent, and the move points it had left with it: what an attack
 * spends, and a card played through a worker.
 */
export function spentAction<U extends Unit>(unit: U): U {
  return { ...unit, action: unit.action - 1, movePoints: 0 };
}

/** The one unit standing on a tile, if one does. */
export function unitAt(units: readonly Unit[], coord: TileCoords): Unit | undefined {
  return units.find((unit) => sameTile(unit.tile, coord));
}

/** Whether a unit acts against the player as an enemy does: an enemy, or the neutral's while hostile. */
export function actsAsEnemy(unit: Unit, relations: Relations): boolean {
  switch (unit.faction) {
    case 'player':
      return false;
    case 'enemy':
      return true;
    case 'neutral':
      return relations === 'hostile';
  }
}

/** The unit a number names, and nothing once that unit has left the map. */
export function unitOf(units: readonly Unit[], id: number): Unit | undefined {
  return units.find((unit) => unit.id === id);
}

/**
 * Whether a unit of these stats, embarked or ashore, can stand on a tile at all: the tile names it a
 * movement cost its move covers. Move points never run above the move, so the answer holds all turn.
 */
export function standsOn(
  catalogue: MapContent,
  stats: UnitStats,
  embarked: boolean,
  tile: Tile | undefined,
): boolean {
  const cost = movementCost(catalogue, tile, embarked);
  return cost !== undefined && cost <= stats.move;
}

/**
 * What a path over the map is read from: the ground it runs over, the rivers cutting it, who stands
 * on it, which of it has ever been in sight, the tiles the player's city holds, the neutral's, and
 * its relations.
 */
type Crossed = {
  readonly tiles: readonly Tile[];
  readonly rivers: readonly River[];
  readonly units: readonly Unit[];
  readonly snapshots: readonly TileCoords[];
  readonly held: readonly TileCoords[];
  readonly neutral?: { readonly held: readonly TileCoords[] };
  readonly relations?: Relations;
};

/**
 * What a unit of the faction's walk does at a tile: the player's keeps off the uncharted and, at
 * peace, ends on a tile the neutral holds; the neutral's at peace keeps off a tile the player holds.
 */
export function passageFor(chronicle: Crossed, faction: Faction): (coord: TileCoords) => Passage {
  const atPeace = relationsOf(chronicle) === 'peace';
  switch (faction) {
    case 'player': {
      const charted = new Set(chronicle.snapshots.map(tileKey));
      const theirs = new Set(atPeace ? (chronicle.neutral?.held ?? []).map(tileKey) : []);
      return (coord) => {
        const key = tileKey(coord);
        if (!charted.has(key)) return 'shut';
        return theirs.has(key) ? 'end' : 'open';
      };
    }
    case 'neutral': {
      const held = new Set(atPeace ? chronicle.held.map(tileKey) : []);
      return (coord) => (held.has(tileKey(coord)) ? 'shut' : 'open');
    }
    case 'enemy':
      return () => 'open';
  }
}

/**
 * Where a unit can land on the move points it has left, each at the cheapest route there, a step
 * over a river edge spending every point it has left. A tile one of its own holds is crossed but
 * never offered; the faction's passage says the rest.
 */
export function reachable(catalogue: MapContent, chronicle: Crossed, unit: Unit): Landing[] {
  const standing = new Map(chronicle.units.map((other) => [tileKey(other.tile), other.faction]));
  const passage = passageFor(chronicle, unit.faction);

  const spent = pathCosts(
    catalogue,
    chronicle.tiles,
    chronicle.rivers,
    unit.tile,
    { points: unit.movePoints, embarked: unit.embarked },
    (coord) => {
      const held = standing.get(tileKey(coord));
      return held !== undefined && held !== unit.faction ? 'shut' : passage(coord);
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
 * Whether a unit can attack another that many tiles away, action and sight aside: a worker and an
 * embarked unit attack nothing, no unit its own faction, the neutral's at peace none of the player's,
 * and a unit whose range is one no embarked unit; any other attack lands within its range.
 */
export function canAttack(
  attacker: Unit,
  target: Unit,
  away: number,
  relations: Relations,
): boolean {
  if (attacker.stats.worker || attacker.embarked) return false;
  if (target.faction === attacker.faction) return false;
  if (attacker.faction === 'neutral' && target.faction === 'player' && relations === 'peace') {
    return false;
  }
  if (target.embarked && attacker.stats.range <= 1) return false;
  return away <= attacker.stats.range;
}

/**
 * Every unit a unit can attack from where it stands, while it has the action an attack spends.
 * Range alone: sight is not read here.
 */
export function attackable(units: readonly Unit[], attacker: Unit, relations: Relations): Unit[] {
  if (attacker.action <= 0) return [];
  return units.filter((other) =>
    canAttack(attacker, other, distance(other.tile, attacker.tile), relations),
  );
}

/** A unit losing health by an amount, whatever took it: at zero health or below it is killed. */
export function damaged(units: readonly Unit[], target: Unit, amount: number): Unit[] {
  return units.flatMap((unit) => {
    if (unit.id !== target.id) return [unit];
    const health = unit.stats.health - amount;
    if (health <= 0) return [];
    const hurt: Unit = { ...unit, stats: { ...unit.stats, health } };
    return [hurt];
  });
}
