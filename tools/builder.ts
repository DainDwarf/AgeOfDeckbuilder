import { aimOf } from '../src/rules/cards';
import { type Catalogue, cardOf, strikeOf, workerAim } from '../src/rules/catalogue';
import {
  admitted,
  apply,
  byHand,
  type Command,
  declaresWar,
  outcome,
  refusalOf,
} from '../src/rules/chronicle';
import { cityCommand, cityDrag, claimable } from '../src/rules/city';
import { leastHealth } from '../src/rules/enemies';
import {
  CENTRE,
  distance,
  neighbours,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import type { Resources } from '../src/rules/resources';
import { offered } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import {
  assignedTo,
  type Chronicle,
  cardsInPiles,
  holds,
  idle,
  onSettlePhase,
  playable,
} from '../src/rules/state';
import {
  actsAsEnemy,
  canAttack,
  type Landing,
  reachable,
  relationsOf,
  type Unit,
} from '../src/rules/units';
import { tileYield, worthOf } from '../src/rules/yields';
import { refusedEntry, TURN_ENDED } from './idle';
import type { Gambit, Persona } from './sim-driver';

/** A gambit's sentence and its candidate commands, best first, before a persona's checks pick its answer. */
export type Weighing = {
  readonly sentence: string;
  readonly candidates: (catalogue: Catalogue, chronicle: Chronicle) => Iterable<Command>;
};

export const DEAL_TAKEN: Weighing = {
  sentence:
    'While a deal stands, take the entry whose trial brings no defeat, no unit acting as an enemy and no card that strikes, of those the one losing the least population and then leaving the most stock together, and where none qualifies the first not refused, one bringing defeat last',
  candidates: dealTaken,
};

export const CITY_SETTLED: Weighing = {
  sentence:
    "On the settle phase, settle on the charted tile the city's building stands on whose yield summed with its six neighbours' is the most, the nearest the centre of equals",
  candidates: citySettled,
};

export const UNIT_SETTLED: Weighing = {
  sentence:
    'On the settle phase, play a settle card that enters a unit on the free tile beside the city that yields most',
  candidates: unitSettled,
};

export const HAZARD_PAID: Weighing = {
  sentence: 'Pay a hazard in hand the stocks cover',
  candidates: hazardPaid,
};

export const IDLE_ASSIGNED: Weighing = {
  sentence:
    'While a population is idle and the city holds a tile nobody works, assign it to the free held tile that yields the most food, the most of everything together of equals',
  candidates: idleAssigned,
};

export const REASSIGNED: Weighing = {
  sentence:
    'While a worked tile yields less than a free held tile, reassign the population onto it',
  candidates: reassigned,
};

export const CLAIMED: Weighing = {
  sentence:
    'While culture covers a claim, claim the tile that yields most among those the city may claim, the nearest a charted tile that yields more of equals',
  candidates: claimed,
};

export const WORKER_WITHDRAWN: Weighing = {
  sentence:
    'A worker an enemy in sight could reach next turn walks to the reachable tile nearest the city',
  candidates: workerWithdrawn,
};

export const WORKER_SENT_TO_PLAY: Weighing = {
  sentence:
    'Move a worker holding its move points to the reachable tile where the best play in hand lands the most, where that beats where it stands',
  candidates: workerSentToPlay,
};

export const PLACED: Weighing = {
  sentence:
    'Play through a worker the card that places something, on the tile where it adds the most food to the yield, the most of everything of equals, the nearest the city of equals, one adding nothing still played, never one lowering it',
  candidates: placed,
};

export const GAINED_THROUGH_WORKER: Weighing = {
  sentence:
    "Play through a worker the card whose trial raises the stocks the most, never one whose trial lowers a tile's yield",
  candidates: gainedThroughWorker,
};

export const WORKER_SENT_OUT: Weighing = {
  sentence:
    'Move a worker with nothing to play to the reachable tile outside the border that yields most',
  candidates: workerSentOut,
};

export const GAIN_PLAYED: Weighing = {
  sentence: "Play a card aimed at nothing whose trial raises the stocks' sum or the population",
  candidates: gainPlayed,
};

export const HAND_DISCARDED: Weighing = {
  sentence: 'Play a card aimed at the hand on a hazard in hand, else on its first other card',
  candidates: handDiscarded,
};

export const BUILDER: Persona = [
  declaringNoWar(DEAL_TAKEN),
  declaringNoWar(CITY_SETTLED),
  declaringNoWar(UNIT_SETTLED),
  declaringNoWar(HAZARD_PAID),
  declaringNoWar(IDLE_ASSIGNED),
  declaringNoWar(REASSIGNED),
  declaringNoWar(CLAIMED),
  declaringNoWar(WORKER_WITHDRAWN),
  declaringNoWar(WORKER_SENT_TO_PLAY),
  declaringNoWar(PLACED),
  declaringNoWar(GAINED_THROUGH_WORKER),
  declaringNoWar(WORKER_SENT_OUT),
  declaringNoWar({
    sentence:
      'While fewer than three workers stand, a population is idle and no held tile is free, play a unit card whose trial enters a worker',
    candidates: (catalogue, chronicle) => unitCardPlayed(catalogue, chronicle, true, 3),
  }),
  declaringNoWar({
    sentence:
      'While fewer than two units that attack stand, a population is idle and no held tile is free, play a unit card whose trial enters a unit that attacks',
    candidates: (catalogue, chronicle) => unitCardPlayed(catalogue, chronicle, false, 2),
  }),
  declaringNoWar({
    sentence:
      'A unit that attacks, attacks the enemy of least health within its reach from a held tile, walking to that tile first',
    candidates: (catalogue, chronicle) =>
      enemyAttacked(catalogue, chronicle, (tile) => holds(chronicle, tile)),
  }),
  declaringNoWar({
    sentence:
      "A unit that attacks with nothing to attack walks to the reachable tile within five tiles of the city whose trial charts the most tiles, and charting none, to the free held tile nearest the city's own, never onto it",
    candidates: (catalogue, chronicle) =>
      garrisonWalked(catalogue, chronicle, attackersOf(chronicle)),
  }),
  declaringNoWar(GAIN_PLAYED),
  declaringNoWar(HAND_DISCARDED),
  TURN_ENDED,
];

/** The gambit answering the first of its candidates whose command declares no war. */
export function declaringNoWar({ sentence, candidates }: Weighing): Gambit {
  return {
    sentence,
    command: (catalogue, chronicle) => {
      for (const command of candidates(catalogue, chronicle)) {
        if (!declaresWar(catalogue, chronicle, command)) return command;
      }
      return undefined;
    },
  };
}

/** A candidate and its rank, read number by number, the lowest first. */
type Ranked<Item> = { readonly item: Item; readonly rank: readonly number[] };

/** Whether one rank reads lower than the other: below it at the first number they differ by. */
function ranksBelow(one: readonly number[], other: readonly number[]): boolean {
  for (let at = 0; at < Math.min(one.length, other.length); at++) {
    if (one[at] !== other[at]) return one[at] < other[at];
  }
  return false;
}

/** The candidates' items, the lowest rank first, equals in the order handed in. */
export function ranked<Item>(candidates: readonly Ranked<Item>[]): Item[] {
  return [...candidates]
    .sort((one, other) =>
      ranksBelow(one.rank, other.rank) ? -1 : ranksBelow(other.rank, one.rank) ? 1 : 0,
    )
    .map(({ item }) => item);
}

/** Where a tile stands in the order the map lists its tiles in, which every tie falls back on. */
export function tileOrder(chronicle: Chronicle): (tile: TileCoords) => number {
  const order = new Map(chronicle.tiles.map((tile, at) => [tileKey(tile), at]));
  return (tile) => order.get(tileKey(tile)) ?? 0;
}

/** What each of the tiles yields, resource by resource, and nothing for a tile not among them. */
function yieldsAmong(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tiles: readonly Tile[],
): (tile: TileCoords) => Partial<Resources> {
  const beside = tilesBeside(tiles);
  return (coord) => {
    const tile = beside(coord);
    return tile === undefined ? {} : tileYield(catalogue, chronicle, tile, beside);
  };
}

/**
 * What each tile yields as the player last saw it, read off its snapshot, which every stage keeps as
 * the tile stands while it is in sight; nothing for a tile never charted.
 */
export function seenYields(
  catalogue: Catalogue,
  chronicle: Chronicle,
): (tile: TileCoords) => Partial<Resources> {
  return yieldsAmong(
    catalogue,
    chronicle,
    chronicle.snapshots.map(({ tile }) => tile),
  );
}

/** What each tile of the map yields as it stands: what a trial leaves on the tile played on. */
function yieldsOn(
  catalogue: Catalogue,
  chronicle: Chronicle,
): (tile: TileCoords) => Partial<Resources> {
  return yieldsAmong(catalogue, chronicle, chronicle.tiles);
}

/** A yield ranked food first, then every resource together, the most first. */
function foodFirst(yields: Partial<Resources>): number[] {
  return [-(yields.food ?? 0), -worthOf(yields)];
}

/** The chronicle the command leaves, and nothing where it drew from the chronicle's generator. */
export function trial(
  catalogue: Catalogue,
  chronicle: Chronicle,
  command: Command,
): Chronicle | undefined {
  const after = outcome(apply(catalogue, chronicle, command));
  return after.rng.every((word, at) => word === chronicle.rng[at]) ? after : undefined;
}

function playersUnits(chronicle: Chronicle): Unit[] {
  return chronicle.units.filter((unit) => unit.faction === 'player');
}

/** The units of the player's that attack. */
export function attackersOf(chronicle: Chronicle): Unit[] {
  return playersUnits(chronicle).filter((unit) => !unit.stats.worker);
}

/** The unit of the player's the trial entered, and nothing where it entered none. */
function unitEnteredBetween(before: Chronicle, after: Chronicle): Unit | undefined {
  const standing = new Set(before.units.map(({ id }) => id));
  return playersUnits(after).find(({ id }) => !standing.has(id));
}

export function moveCommand(unit: Unit, tile: TileCoords): Command {
  return { type: 'move', unit: unit.id, tile: { q: tile.q, r: tile.r } };
}

function actingAsEnemies(chronicle: Chronicle): number {
  const relations = relationsOf(chronicle);
  return chronicle.units.filter((unit) => actsAsEnemy(unit, relations)).length;
}

function strikingCards(catalogue: Catalogue, chronicle: Chronicle): number {
  return cardsInPiles(chronicle).filter(({ id }) => strikeOf(cardOf(catalogue, id)) !== undefined)
    .length;
}

function* dealTaken(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const [deal] = chronicle.deals;
  if (deal === undefined) return;
  const enemies = actingAsEnemies(chronicle);
  const striking = strikingCards(catalogue, chronicle);
  const entries = offered(catalogue, deal).flatMap((id, at) => {
    if (refusedEntry(catalogue, chronicle, deal, id)) return [];
    const command: Command = { type: 'take', at };
    return [{ command, after: trial(catalogue, chronicle, command) }];
  });
  yield* ranked(
    entries.flatMap(({ command, after }): Ranked<Command>[] =>
      after === undefined ||
      after.ending?.outcome === 'defeat' ||
      actingAsEnemies(after) > enemies ||
      strikingCards(catalogue, after) > striking
        ? []
        : [{ item: command, rank: [-after.population, -worthOf(after.resources)] }],
    ),
  );
  yield* ranked(
    entries.map(({ command, after }) => ({
      item: command,
      rank: [after?.ending?.outcome === 'defeat' ? 1 : 0],
    })),
  );
}

function citySettled(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  if (!onSettlePhase(chronicle) || chronicle.city !== undefined) return [];
  const aim = aimOf(cardOf(catalogue, chronicle.hand[0].id));
  if (aim.aim !== 'tile') return [];
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  return ranked(
    admitted(catalogue, chronicle, aim).map((tile): Ranked<Command> => {
      const ring = [tile, ...neighbours(tile)].reduce((sum, at) => sum + worthOf(yields(at)), 0);
      return {
        item: { type: 'play', index: 0, aim: 'tile', tile },
        rank: [-ring, distance(tile, CENTRE), order(tile)],
      };
    }),
  );
}

function* unitSettled(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const { city } = chronicle;
  if (!onSettlePhase(chronicle) || city === undefined) return;
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  for (const [index, held] of chronicle.hand.entries()) {
    const card = cardOf(catalogue, held.id);
    const aim = aimOf(card);
    if (card.kind !== 'settle' || aim.aim !== 'tile') continue;
    const beside = admitted(catalogue, chronicle, aim).filter((tile) => distance(tile, city) === 1);
    const tiles = ranked(
      beside.map((tile) => ({ item: tile, rank: [-worthOf(yields(tile)), order(tile)] })),
    );
    for (const tile of tiles) {
      const command: Command = { type: 'play', index, aim: 'tile', tile };
      const after = trial(catalogue, chronicle, command);
      if (after !== undefined && unitEnteredBetween(chronicle, after) !== undefined) yield command;
    }
  }
}

function hazardPaid(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  return chronicle.hand.flatMap((held, index): Command[] =>
    cardOf(catalogue, held.id).kind === 'hazard' &&
    playable(refusalOf(catalogue, chronicle, held.id))
      ? [{ type: 'play', index, aim: 'none' }]
      : [],
  );
}

/** The tiles the city holds that nobody works and an idle population can be assigned to now. */
function assignable(catalogue: Catalogue, chronicle: Chronicle): TileCoords[] {
  return chronicle.held.filter(
    (tile) =>
      !assignedTo(chronicle, tile) && cityCommand(catalogue, chronicle, tile)?.type === 'assign',
  );
}

function idleAssigned(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  return ranked(
    assignable(catalogue, chronicle).map(
      (tile): Ranked<Command> => ({
        item: { type: 'assign', tile },
        rank: [...foodFirst(yields(tile)), order(tile)],
      }),
    ),
  );
}

function reassigned(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  const byYield = (tiles: readonly TileCoords[]): TileCoords[] =>
    ranked(tiles.map((tile) => ({ item: tile, rank: [...foodFirst(yields(tile)), order(tile)] })));
  const worst = byYield(chronicle.assigned).at(-1);
  const [best] = byYield(chronicle.held.filter((tile) => !assignedTo(chronicle, tile)));
  if (worst === undefined || best === undefined) return [];
  if (!ranksBelow(foodFirst(yields(best)), foodFirst(yields(worst)))) return [];
  const command = cityDrag(chronicle, worst, best);
  return command === undefined ? [] : [command];
}

function claimed(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  const unheld = chronicle.snapshots
    .filter((snapshot) => snapshot.holder === undefined)
    .map((snapshot) => ({ tile: snapshot, worth: worthOf(yields(snapshot)) }));
  return ranked(
    claimable(catalogue, chronicle, 'player')
      .filter((tile) => cityCommand(catalogue, chronicle, tile)?.type === 'claim')
      .map((tile): Ranked<Command> => {
        const worth = worthOf(yields(tile));
        const toward = unheld
          .filter((richer) => richer.worth > worth)
          .reduce((nearest, richer) => Math.min(nearest, distance(richer.tile, tile)), Infinity);
        return { item: { type: 'claim', tile }, rank: [-worth, toward, order(tile)] };
      }),
  );
}

/**
 * Whether the enemy could attack the unit next turn: from its own tile, or from a tile it reaches
 * with its move points at its move, walking over `known`.
 */
function threatens(catalogue: Catalogue, known: Chronicle, enemy: Unit, unit: Unit): boolean {
  const relations = relationsOf(known);
  const walking = { ...enemy, movePoints: enemy.stats.move };
  return [{ tile: enemy.tile }, ...reachable(catalogue, known, walking)].some(({ tile }) =>
    canAttack({ ...enemy, tile }, unit, distance(tile, unit.tile), relations),
  );
}

function workerWithdrawn(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const relations = relationsOf(chronicle);
  const seen = inSight(catalogue, chronicle);
  const enemies = chronicle.units.filter(
    (unit) => actsAsEnemy(unit, relations) && seen.has(tileKey(unit.tile)),
  );
  // Not the chronicle: its tiles are the snapshots', so `reachable` never reads the map unseen.
  const known: Chronicle = {
    ...chronicle,
    tiles: chronicle.snapshots.map(({ tile }) => tile),
    units: chronicle.units.filter((unit) => seen.has(tileKey(unit.tile))),
  };
  const order = tileOrder(chronicle);
  return playersUnits(chronicle).flatMap((worker) => {
    if (!worker.stats.worker) return [];
    if (!enemies.some((enemy) => threatens(catalogue, known, enemy, worker))) return [];
    const standsAt = distance(worker.tile, city);
    return ranked(
      byHand(catalogue, chronicle, worker)
        .landings.filter(({ tile }) => distance(tile, city) < standsAt)
        .map(({ tile }) => ({
          item: moveCommand(worker, tile),
          rank: [distance(tile, city), order(tile)],
        })),
    );
  });
}

/**
 * One card of the hand played through the worker on the tile, ranked by its first number ahead of a
 * card that gains: placing, by the yield it adds, food first; gaining, by the stocks' sum it raises.
 */
function workerPlay(
  catalogue: Catalogue,
  chronicle: Chronicle,
  index: number,
  tile: Tile,
): Ranked<Command> | undefined {
  const { id } = chronicle.hand[index];
  const aim = workerAim(cardOf(catalogue, id));
  if (
    aim === undefined ||
    aim.refuses(catalogue, chronicle, tile, 'player') !== undefined ||
    !playable(refusalOf(catalogue, chronicle, id))
  ) {
    return undefined;
  }
  const command: Command = { type: 'play', index, aim: 'tile', tile: { q: tile.q, r: tile.r } };
  const after = trial(catalogue, chronicle, command);
  if (after === undefined || after === chronicle) return undefined;
  if (aim.places === true) {
    const was = yieldsOn(catalogue, chronicle)(tile);
    const is = yieldsOn(catalogue, after)(tile);
    if (worthOf(is) < worthOf(was)) return undefined;
    return {
      item: command,
      rank: [0, (was.food ?? 0) - (is.food ?? 0), worthOf(was) - worthOf(is)],
    };
  }
  const raised = worthOf(after.resources) - worthOf(chronicle.resources);
  if (raised <= 0 || yieldLowered(catalogue, chronicle, after)) return undefined;
  return { item: command, rank: [1, -raised] };
}

/** Whether any tile of the map yields less after than before. */
function yieldLowered(catalogue: Catalogue, before: Chronicle, after: Chronicle): boolean {
  const was = yieldsOn(catalogue, before);
  const is = yieldsOn(catalogue, after);
  return before.tiles.some((tile) => worthOf(is(tile)) < worthOf(was(tile)));
}

/** The best play of the hand through the worker read as standing on the tile, and nothing for none. */
function bestPlayFrom(
  catalogue: Catalogue,
  chronicle: Chronicle,
  worker: Unit,
  at: TileCoords,
): readonly number[] | undefined {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) return undefined;
  const there: Chronicle = {
    ...chronicle,
    units: chronicle.units.map((unit) => (unit.id === worker.id ? { ...unit, tile: at } : unit)),
  };
  const [best] = ranked(
    chronicle.hand.flatMap((_, index) => {
      const play = workerPlay(catalogue, there, index, tile);
      return play === undefined ? [] : [{ item: play.rank, rank: play.rank }];
    }),
  );
  return best;
}

function* workerSentToPlay(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const order = tileOrder(chronicle);
  for (const worker of playersUnits(chronicle)) {
    if (!worker.stats.worker || worker.movePoints <= 0 || worker.action <= 0) continue;
    const own = bestPlayFrom(catalogue, chronicle, worker, worker.tile);
    yield* ranked(
      byHand(catalogue, chronicle, worker).landings.flatMap(({ tile, cost }) => {
        const best = bestPlayFrom(catalogue, chronicle, worker, tile);
        if (best === undefined || (own !== undefined && !ranksBelow(best, own))) return [];
        return [{ item: moveCommand(worker, tile), rank: [...best, cost, order(tile)] }];
      }),
    );
  }
}

/** Each play through a worker of the cards that place something, or of those that place nothing. */
function workerPlays(
  catalogue: Catalogue,
  chronicle: Chronicle,
  places: boolean,
  after: (tile: TileCoords) => number[],
): Command[] {
  return ranked(
    chronicle.hand.flatMap((held, index) => {
      const aim = workerAim(cardOf(catalogue, held.id));
      if (aim === undefined || (aim.places === true) !== places) return [];
      return admitted(catalogue, chronicle, aim).flatMap((at) => {
        const tile = tileAt(chronicle.tiles, at);
        const play = tile && workerPlay(catalogue, chronicle, index, tile);
        return play === undefined ? [] : [{ item: play.item, rank: [...play.rank, ...after(at)] }];
      });
    }),
  );
}

function placed(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  return workerPlays(catalogue, chronicle, true, (tile) => [distance(tile, city), order(tile)]);
}

function gainedThroughWorker(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const order = tileOrder(chronicle);
  return workerPlays(catalogue, chronicle, false, (tile) => [order(tile)]);
}

function workerSentOut(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  return playersUnits(chronicle).flatMap((worker) => {
    if (!worker.stats.worker || worker.movePoints <= 0 || worker.action <= 0) return [];
    const own = worthOf(yields(worker.tile));
    return ranked(
      byHand(catalogue, chronicle, worker).landings.flatMap(({ tile, cost }) => {
        const worth = worthOf(yields(tile));
        if (holds(chronicle, tile) || worth <= own) return [];
        return [{ item: moveCommand(worker, tile), rank: [-worth, cost, order(tile)] }];
      }),
    );
  });
}

/** The plays of the unit cards in hand whose trial enters a worker, or a unit that attacks, as `worker` says. */
export function unitCardsEntering(
  catalogue: Catalogue,
  chronicle: Chronicle,
  worker: boolean,
): Command[] {
  return chronicle.hand.flatMap((held, index): Command[] => {
    if (cardOf(catalogue, held.id).kind !== 'unit') return [];
    const command: Command = { type: 'play', index, aim: 'none' };
    const after = trial(catalogue, chronicle, command);
    const entered = after && unitEnteredBetween(chronicle, after);
    return entered?.stats.worker === worker ? [command] : [];
  });
}

/**
 * The unit cards entering a worker, or a unit that attacks, as `worker` says, while fewer of those
 * stand, a population is idle and no held tile is free.
 */
export function unitCardPlayed(
  catalogue: Catalogue,
  chronicle: Chronicle,
  worker: boolean,
  fewerThan: number,
): Command[] {
  const standing = playersUnits(chronicle).filter((unit) => unit.stats.worker === worker);
  if (
    standing.length >= fewerThan ||
    idle(chronicle) <= 0 ||
    assignable(catalogue, chronicle).length > 0
  ) {
    return [];
  }
  return unitCardsEntering(catalogue, chronicle, worker);
}

/**
 * Each unit that attacks attacking the enemy of least health it reaches from the tiles `from`
 * admits, its own or a landing, walking to the cheapest of those first.
 */
export function* enemyAttacked(
  catalogue: Catalogue,
  chronicle: Chronicle,
  from: (tile: TileCoords) => boolean,
): Generator<Command> {
  const relations = relationsOf(chronicle);
  const order = tileOrder(chronicle);
  for (const unit of attackersOf(chronicle)) {
    if (unit.action <= 0) continue;
    const own: Landing = { tile: unit.tile, cost: 0 };
    const reaching = [own, ...byHand(catalogue, chronicle, unit).landings]
      .filter(({ tile }) => from(tile))
      .flatMap(({ tile, cost }) => {
        const there = { ...unit, tile };
        const enemies = byHand(catalogue, chronicle, there)
          .targets.filter((target) => actsAsEnemy(target, relations))
          .sort((one, other) => order(one.tile) - order(other.tile));
        const target = leastHealth(catalogue, chronicle, enemies, there);
        return target === undefined ? [] : [{ tile, cost, target }];
      });
    const [weakest] = ranked(
      reaching.map(({ target }) => ({
        item: target,
        rank: [target.stats.health, order(target.tile)],
      })),
    );
    if (weakest === undefined) continue;
    const at = ranked(
      reaching
        .filter(({ target }) => target.id === weakest.id)
        .map(({ tile, cost }) => ({ item: tile, rank: [cost, order(tile)] })),
    );
    for (const tile of at) {
      yield tileKey(tile) === tileKey(unit.tile)
        ? { type: 'attack', unit: unit.id, tile: weakest.tile }
        : moveCommand(unit, tile);
    }
  }
}

/**
 * The unit's moves whose trial charts tiles never charted, the most first, then the cheapest; only
 * onto landings within `radius` tiles of the city where a radius is named.
 */
export function chartingWalks(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
  radius?: number,
): Command[] {
  const { city } = chronicle;
  const order = tileOrder(chronicle);
  return ranked(
    byHand(catalogue, chronicle, unit).landings.flatMap(({ tile, cost }) => {
      if (radius !== undefined && (city === undefined || distance(tile, city) > radius)) return [];
      const command = moveCommand(unit, tile);
      const after = trial(catalogue, chronicle, command);
      const grown = after === undefined ? 0 : after.snapshots.length - chronicle.snapshots.length;
      return grown > 0 ? [{ item: command, rank: [-grown, cost, order(tile)] }] : [];
    }),
  );
}

/**
 * Each of the units governed holding its move points charting within five tiles of the city, and
 * charting none, resting on the free held tile nearest the city's own.
 */
export function* garrisonWalked(
  catalogue: Catalogue,
  chronicle: Chronicle,
  governed: readonly Unit[],
): Generator<Command> {
  const { city } = chronicle;
  if (city === undefined) return;
  const order = tileOrder(chronicle);
  for (const unit of governed) {
    if (unit.movePoints <= 0) continue;
    yield* chartingWalks(catalogue, chronicle, unit, 5);

    const { landings } = byHand(catalogue, chronicle, unit);
    const standsAt = distance(unit.tile, city);
    const onCity = tileKey(unit.tile) === tileKey(city);
    const outside = !holds(chronicle, unit.tile);
    const nearest = (tiles: readonly TileCoords[]): Command[] =>
      ranked(
        tiles.map((tile) => ({
          item: moveCommand(unit, tile),
          rank: [distance(tile, city), order(tile)],
        })),
      );
    const held = landings
      .map(({ tile }) => tile)
      .filter((tile) => holds(chronicle, tile) && tileKey(tile) !== tileKey(city));
    if (held.length > 0) {
      yield* nearest(held.filter((tile) => distance(tile, city) < standsAt || onCity || outside));
    } else if (outside) {
      yield* nearest(
        landings.map(({ tile }) => tile).filter((tile) => distance(tile, city) < standsAt),
      );
    }
  }
}

function* gainPlayed(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  for (const [index, held] of chronicle.hand.entries()) {
    const card = cardOf(catalogue, held.id);
    if (card.kind === 'hazard' || aimOf(card).aim !== 'none') continue;
    if (!playable(refusalOf(catalogue, chronicle, held.id))) continue;
    const command: Command = { type: 'play', index, aim: 'none' };
    const after = trial(catalogue, chronicle, command);
    if (after === undefined) continue;
    if (
      worthOf(after.resources) > worthOf(chronicle.resources) ||
      after.population > chronicle.population
    ) {
      yield command;
    }
  }
}

function handDiscarded(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const hazard = chronicle.hand.findIndex(({ id }) => cardOf(catalogue, id).kind === 'hazard');
  return chronicle.hand.flatMap((held, index): Command[] => {
    if (aimOf(cardOf(catalogue, held.id)).aim !== 'hand') return [];
    if (!playable(refusalOf(catalogue, chronicle, held.id))) return [];
    const card = hazard === -1 ? (index === 0 ? 1 : 0) : hazard;
    return [{ type: 'play', index, aim: 'hand', card }];
  });
}
