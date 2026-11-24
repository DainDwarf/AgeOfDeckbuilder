import { preparedAs } from '../rules/enemies';
import { sameTile, type TileCoords, tileAt } from '../rules/map';
import { RESOURCES, type Resource } from '../rules/resources';
import { type Change, type Group, idInHand, type Stage } from '../rules/stages';
import { type CardId, type Chronicle, onSettlePhase } from '../rules/state';
import { type Faction, type Unit, unitAt, unitOf } from '../rules/units';
import type { SightOn } from './map-motion';

/** A unit a line of the log names: its faction, and its kind. */
export type Named = { readonly faction: Faction; readonly kind: string };

/** What a stock or the population moved by, read on a line of the log. */
export type Moved = { readonly symbol: Resource | 'population'; readonly count: number };

/** What a pillage removed: the building, or else the improvements. */
export type Removed = { readonly building: string } | { readonly improvements: readonly string[] };

/** What a line of the log reads, each kind its own entry. */
export type LogReading =
  | {
      readonly kind: 'attack';
      readonly attacker: Named;
      readonly target: Named;
      readonly damage: number;
    }
  | { readonly kind: 'kill'; readonly attacker: Named; readonly target: Named }
  | { readonly kind: 'attacked'; readonly target: Named; readonly damage: number }
  | { readonly kind: 'killed'; readonly target: Named }
  | { readonly kind: 'attacks'; readonly attacker: Named }
  | { readonly kind: 'enters'; readonly unit: Named }
  | { readonly kind: 'prepares-to-capture-your-city'; readonly unit: Named }
  | { readonly kind: 'prepares-to-capture'; readonly unit: Named; readonly building: string }
  | { readonly kind: 'prepares-to-pillage'; readonly unit: Named }
  | { readonly kind: 'pillages'; readonly unit: Named; readonly removed: Removed }
  | { readonly kind: 'captures'; readonly unit: Named; readonly building: string }
  | { readonly kind: 'income'; readonly moved: readonly Moved[] }
  | { readonly kind: 'strikes'; readonly card: CardId; readonly moved: readonly Moved[] }
  | { readonly kind: 'grows'; readonly moved: readonly Moved[] };

/**
 * How a stage may read on the log: the turn its line stands under, and what it reads once the map
 * says which tiles it plays the stage on, nothing where it plays no line there.
 */
export type LogReader = {
  readonly turn: number;
  read(sight: SightOn): LogReading | undefined;
};

/**
 * Every stage among these, however deep, that may read as a line of the log, and how, in the order
 * they play: none on the settle phase.
 */
export function logReaders(stages: readonly Stage[]): Map<Stage, LogReader> {
  const readers = new Map<Stage, LogReader>();
  const among = (held: readonly Stage[]): void => {
    for (const [at, stage] of held.entries()) {
      const read = onSettlePhase(stage.before) ? undefined : readerOf(stage, held[at + 1]);
      if (read !== undefined) readers.set(stage, { turn: stage.before.turn, read });
      if (stage.kind === 'group') among(stage.stages);
    }
  };
  among(stages);
  return readers;
}

/** A line of the log: the turn it stands under, and what it reads. */
export type LogLine = { readonly turn: number; readonly reads: LogReading };

/**
 * The lines of the stages `logReaders` read that a play-out cut short never played, in the order
 * they would have played, each where `sightOf` says the map would have played it.
 */
export function linesSkipped(
  readers: ReadonlyMap<Stage, LogReader>,
  played: ReadonlySet<Stage>,
  sightOf: (stage: Stage) => SightOn,
): LogLine[] {
  return [...readers].flatMap(([stage, { turn, read }]): LogLine[] => {
    if (played.has(stage)) return [];
    const reads = read(sightOf(stage));
    return reads === undefined ? [] : [{ turn, reads }];
  });
}

type Read = LogReader['read'];

/** How a stage reads, the one after it beside it where one is, and nothing for one that reads no line. */
function readerOf(stage: Stage, next: Stage | undefined): Read | undefined {
  switch (stage.kind) {
    case 'change':
      return changeRead(stage, next);
    case 'group':
      return groupRead(stage);
  }
}

function changeRead(stage: Change, next: Stage | undefined): Read | undefined {
  switch (stage.name) {
    case 'enter': {
      const unit = standing(unitOf(stage.chronicle.units, stage.before.nextUnit), 'entered');
      return inSightOf(stage.tile, { kind: 'enters', unit: namedOf(unit) });
    }
    case 'prepare':
      return preparedRead(stage.chronicle, stage.before, stage.tile);
    case 'retiled':
      return next === undefined ? undefined : pillageRead(stage, stage.tile, next);
    case 'move':
    case 'damaged':
    case 'healed':
    case 'killed':
    case 'charted':
    case 'refreshed':
    case 'action-spent':
    case 'wave-sent':
    case 'camp-joined':
    case 'held':
    case 'settled':
    case 'stock':
    case 'population':
    case 'assigned':
    case 'added':
    case 'drawn':
    case 'discarded':
    case 'exhausted':
    case 'shuffled':
    case 'counters-set':
    case 'banished':
    case 'turn':
    case 'rolled':
    case 'dealt':
    case 'taken':
    case 'ended':
    case 'tallied':
    case 'reached':
    case 'relations':
    case 'neutral-fallen':
    case 'runtime-error':
      return undefined;
  }
}

function groupRead(stage: Group): Read | undefined {
  switch (stage.name) {
    case 'attack':
      return attackRead(stage, stage.attacker, stage.target);
    case 'capture': {
      const unit = standing(unitAt(stage.before.units, stage.tile), 'capturing');
      const building = builtOn(stage.before, stage.tile);
      return inSightOf(stage.tile, { kind: 'captures', unit: namedOf(unit), building });
    }
    case 'income':
      return () => ({ kind: 'income', moved: movedBy(stage) });
    case 'strike':
      return () => ({ kind: 'strikes', card: idInHand(stage, stage.card), moved: movedBy(stage) });
    case 'grow': {
      const grown = stage.chronicle.population - stage.before.population;
      if (grown <= 0) return undefined;
      return () => ({ kind: 'grows', moved: [{ symbol: 'population', count: grown }] });
    }
    case 'capstone-landing':
    case 'capstone-continued':
    case 'answer':
    case 'played':
    case 'refused':
    case 'assign':
    case 'claim':
    case 'neutral-played':
    case 'turn':
    case 'enemy-phase':
    case 'deal':
    case 'reward':
    case 'choice':
      return undefined;
  }
}

/**
 * An attack: the attacker and the unit attacked each named where the map plays the attack on its
 * tile, and none where it plays it on neither; the damage where the unit attacked lives through it.
 */
function attackRead(stage: Group, from: TileCoords, on: TileCoords): Read {
  const attacker = namedOf(standing(unitAt(stage.before.units, from), 'attacking'));
  const hit = standing(unitAt(stage.before.units, on), 'attacked');
  const target = namedOf(hit);
  const left = unitOf(stage.chronicle.units, hit.id);
  return (sight): LogReading | undefined => {
    const seesAttacker = sight(from);
    const seesTarget = sight(on);
    if (!seesTarget) return seesAttacker ? { kind: 'attacks', attacker } : undefined;
    if (left === undefined) {
      return seesAttacker ? { kind: 'kill', attacker, target } : { kind: 'killed', target };
    }
    const damage = hit.stats.health - left.stats.health;
    return seesAttacker
      ? { kind: 'attack', attacker, target, damage }
      : { kind: 'attacked', target, damage };
  };
}

/** A unit preparing on the tile, where it carries a prepare now and carried none before. */
function preparedRead(chronicle: Chronicle, before: Chronicle, tile: TileCoords): Read | undefined {
  const unit = unitAt(chronicle.units, tile);
  const lands = unit === undefined ? undefined : preparedAs(chronicle, unit);
  if (unit === undefined || lands === undefined) return undefined;
  const was = unitOf(before.units, unit.id);
  if (was !== undefined && preparedAs(before, was) !== undefined) return undefined;
  const named = namedOf(unit);
  switch (lands) {
    case 'pillage':
      return inSightOf(tile, { kind: 'prepares-to-pillage', unit: named });
    case 'capture':
      return inSightOf(
        tile,
        chronicle.city !== undefined && sameTile(chronicle.city, tile)
          ? { kind: 'prepares-to-capture-your-city', unit: named }
          : { kind: 'prepares-to-capture', unit: named, building: builtOn(chronicle, tile) },
      );
  }
}

/**
 * A pillage: the tile retiled under a unit prepared to pillage it, the one change after it taking
 * that unit's prepare off; what it removed is read off the tile before and after.
 */
function pillageRead(stage: Change, tile: TileCoords, next: Stage): Read | undefined {
  // The pair is raised side by side by `preparesLanded` in src/rules/chronicle.ts.
  const pillager = unitAt(stage.before.units, tile);
  if (pillager === undefined || preparedAs(stage.before, pillager) !== 'pillage') return undefined;
  if (next.kind !== 'change' || next.name !== 'prepare' || !sameTile(next.tile, tile)) {
    return undefined;
  }
  const after = unitOf(next.chronicle.units, pillager.id);
  if (after === undefined || preparedAs(next.chronicle, after) !== undefined) return undefined;
  const was = standing(tileAt(stage.before.tiles, tile), 'pillaged');
  const is = standing(tileAt(stage.chronicle.tiles, tile), 'pillaged');
  const removed: Removed =
    was.building !== undefined && is.building !== was.building
      ? { building: was.building }
      : { improvements: was.improvements.filter((each) => !is.improvements.includes(each)) };
  return inSightOf(tile, { kind: 'pillages', unit: namedOf(pillager), removed });
}

/** The reading, where the map plays the stage on the tile. */
function inSightOf(tile: TileCoords, reading: LogReading): Read {
  return (sight) => (sight(tile) ? reading : undefined);
}

/**
 * What the group moved of the player's city's stocks, each in the resource bar's order, then the
 * population it took where it took any.
 */
function movedBy({ before, chronicle }: Group): Moved[] {
  const moved = RESOURCES.flatMap((symbol): Moved[] => {
    const count = chronicle.resources[symbol] - before.resources[symbol];
    return count === 0 ? [] : [{ symbol, count }];
  });
  const taken = chronicle.population - before.population;
  return taken < 0 ? [...moved, { symbol: 'population', count: taken }] : moved;
}

/** The building standing on the tile; a tile holding none is refused. */
function builtOn(chronicle: Chronicle, tile: TileCoords): string {
  const building = tileAt(chronicle.tiles, tile)?.building;
  if (building === undefined) throw new Error('a line names the building of a tile holding none');
  return building;
}

function namedOf(unit: Unit): Named {
  return { faction: unit.faction, kind: unit.stats.type };
}

/** What a stage read off its chronicles, which it holds; one it does not hold is refused. */
function standing<T>(found: T | undefined, what: string): T {
  if (found === undefined) throw new Error(`the stage the log reads holds no ${what} one`);
  return found;
}
