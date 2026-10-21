import { aimOf } from '../src/rules/cards';
import {
  ageOf,
  type Catalogue,
  cardOf,
  type Entering,
  entered,
  strikeOf,
  workerAim,
} from '../src/rules/catalogue';
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
  elevation,
  neighbours,
  type Tile,
  type TileCoords,
  type TilesBeside,
  tileAt,
  tileKey,
  tilesBeside,
} from '../src/rules/map';
import type { Resources } from '../src/rules/resources';
import { offered } from '../src/rules/schedule';
import {
  assignedTo,
  type Chronicle,
  type ChronicleCard,
  cardsInPiles,
  holds,
  idle,
  onSettlePhase,
  playable,
  type SnapshotUnit,
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
    'A worker an enemy the map shows could attack next turn walks to the reachable tile no such enemy could attack, the nearest the city of those, else the reachable tile nearest the city',
  candidates: workerWithdrawn,
};

export const WORKER_SENT_TO_PLAY: Weighing = {
  sentence:
    'Move a worker holding its move points to the reachable tile no enemy the map shows could attack next turn where the best play in hand lands the most, where that beats where it stands',
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
    'Move a worker with nothing to play to the reachable tile outside the border no enemy the map shows could attack next turn that yields most',
  candidates: workerSentOut,
};

export const GAIN_PLAYED: Weighing = {
  sentence: "Play a card aimed at nothing whose trial raises the stocks' sum or the population",
  candidates: gainPlayed,
};

export const STRIKING_DISCARDED: Weighing = {
  sentence: 'Play a card aimed at the hand on the first card in hand that strikes',
  candidates: strikingDiscarded,
};

export const HAND_CYCLED: Weighing = {
  sentence: 'Play a card aimed at the hand on its first other card',
  candidates: handCycled,
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
      'A unit that attacks walks to the cheapest reachable tile within five tiles of the city whose trial charts a tile, the one charting most of equals',
    candidates: (catalogue, chronicle) =>
      chartingWalks(catalogue, chronicle, attackersOf(chronicle), 5),
  }),
  declaringNoWar({
    sentence:
      "A unit that attacks walks to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands",
    candidates: (catalogue, chronicle) =>
      garrisonRested(catalogue, chronicle, attackersOf(chronicle)),
  }),
  declaringNoWar({
    sentence:
      "A unit that attacks outside the border and off the tiles the city may claim walks to the reachable unheld tile nearest the city's tile, where that is nearer than where it stands",
    candidates: (catalogue, chronicle) =>
      garrisonWalkedHome(catalogue, chronicle, attackersOf(chronicle)),
  }),
  declaringNoWar(GAIN_PLAYED),
  declaringNoWar(STRIKING_DISCARDED),
  declaringNoWar(HAND_CYCLED),
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
  beside: TilesBeside,
): (tile: TileCoords) => Partial<Resources> {
  return (coord) => {
    const tile = beside(coord);
    return tile === undefined ? {} : tileYield(catalogue, chronicle, tile, beside);
  };
}

/**
 * Each tile as the player last saw it, read off its snapshot, which every stage keeps as the tile
 * stands while it is in sight; nothing for a tile never charted.
 */
function seenTiles(chronicle: Chronicle): TilesBeside {
  return tilesBeside(chronicle.snapshots.map(({ tile }) => tile));
}

/** What each tile yields as the player last saw it; nothing for a tile never charted. */
export function seenYields(
  catalogue: Catalogue,
  chronicle: Chronicle,
): (tile: TileCoords) => Partial<Resources> {
  return yieldsAmong(catalogue, chronicle, seenTiles(chronicle));
}

/** What each tile of the map yields as it stands: what a trial leaves on the tile played on. */
function yieldsOn(
  catalogue: Catalogue,
  chronicle: Chronicle,
): (tile: TileCoords) => Partial<Resources> {
  return yieldsAmong(catalogue, chronicle, tilesBeside(chronicle.tiles));
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

function carriesStrike(catalogue: Catalogue, { id }: ChronicleCard): boolean {
  return strikeOf(cardOf(catalogue, id)) !== undefined;
}

function strikingCards(catalogue: Catalogue, chronicle: Chronicle): number {
  return cardsInPiles(chronicle).filter((card) => carriesStrike(catalogue, card)).length;
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
 * How a unit a snapshot carries enters the map: as one of its kind, embarked on its age's embarked
 * move where it stands embarked.
 */
function shownEntering(
  tile: TileCoords,
  { type, faction, embarked }: SnapshotUnit,
  embarkedMove: number | undefined,
): Entering {
  const carried = { type, tile, embarkedMove: embarked ? embarkedMove : undefined };
  switch (faction) {
    case 'player':
      return { ...carried, faction };
    case 'enemy':
    case 'neutral':
      // The map shows no script: the walk and the attack the unit is handed to read none.
      return { ...carried, faction, script: '' };
  }
}

/**
 * Whether an enemy the map shows, in sight or in fog this turn, could attack the unit next turn
 * standing on the tile: from the enemy's own tile, or from a tile it reaches at its move, walking
 * over the charted tiles among the units the map shows.
 */
function attackedNextTurn(
  catalogue: Catalogue,
  chronicle: Chronicle,
): (unit: Unit, tile: TileCoords) => boolean {
  const relations = relationsOf(chronicle);
  const { embarkedMove } = ageOf(catalogue, chronicle.age).camp;
  // Not the chronicle: its tiles are the snapshots', so `reachable` never reads the map unseen.
  let known: Chronicle = {
    ...chronicle,
    tiles: chronicle.snapshots.map(({ tile }) => tile),
    units: playersUnits(chronicle),
  };
  for (const { q, r, unit } of chronicle.snapshots) {
    if (unit === undefined) continue;
    known = entered(catalogue, known, shownEntering({ q, r }, unit, embarkedMove)).chronicle;
  }
  const stands = known.units
    .filter((enemy) => actsAsEnemy(enemy, relations))
    .flatMap((enemy) =>
      [{ tile: enemy.tile }, ...reachable(catalogue, known, enemy)].map(({ tile }) => ({
        ...enemy,
        tile,
      })),
    );
  return (unit, tile) =>
    stands.some((enemy) =>
      canAttack(enemy, { ...unit, tile }, distance(enemy.tile, tile), relations),
    );
}

function workerWithdrawn(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const { city } = chronicle;
  const workers = playersUnits(chronicle).filter((unit) => unit.stats.worker);
  if (city === undefined || workers.length === 0) return [];
  const attacked = attackedNextTurn(catalogue, chronicle);
  const order = tileOrder(chronicle);
  return workers.flatMap((worker) => {
    if (!attacked(worker, worker.tile)) return [];
    const { landings } = byHand(catalogue, chronicle, worker);
    const kept = landings.filter(({ tile }) => !attacked(worker, tile));
    return [
      ...nearestTheCity(worker, city, order, kept),
      ...walksHome(worker, city, order, landings),
    ];
  });
}

/** The unit's moves onto the landings, the nearest the city's tile first. */
function nearestTheCity(
  unit: Unit,
  city: TileCoords,
  order: (tile: TileCoords) => number,
  landings: readonly Landing[],
): Command[] {
  return ranked(
    landings.map(({ tile }) => ({
      item: moveCommand(unit, tile),
      rank: [distance(tile, city), order(tile)],
    })),
  );
}

/** The unit's moves onto those of the landings nearer the city's tile than it stands, the nearest first. */
function walksHome(
  unit: Unit,
  city: TileCoords,
  order: (tile: TileCoords) => number,
  landings: readonly Landing[],
): Command[] {
  const standsAt = distance(unit.tile, city);
  return nearestTheCity(
    unit,
    city,
    order,
    landings.filter(({ tile }) => distance(tile, city) < standsAt),
  );
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

/** The workers of the player's holding both move points and action. */
function workersToWalk(chronicle: Chronicle): Unit[] {
  return playersUnits(chronicle).filter(
    (unit) => unit.stats.worker && unit.movePoints > 0 && unit.action > 0,
  );
}

function* workerSentToPlay(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const workers = workersToWalk(chronicle);
  if (workers.length === 0) return;
  const order = tileOrder(chronicle);
  const attacked = attackedNextTurn(catalogue, chronicle);
  for (const worker of workers) {
    const own = bestPlayFrom(catalogue, chronicle, worker, worker.tile);
    yield* ranked(
      byHand(catalogue, chronicle, worker).landings.flatMap(({ tile, cost }) => {
        if (attacked(worker, tile)) return [];
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
  const workers = workersToWalk(chronicle);
  if (workers.length === 0) return [];
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  const attacked = attackedNextTurn(catalogue, chronicle);
  return workers.flatMap((worker) => {
    const own = worthOf(yields(worker.tile));
    return ranked(
      byHand(catalogue, chronicle, worker).landings.flatMap(({ tile, cost }) => {
        const worth = worthOf(yields(tile));
        if (holds(chronicle, tile) || attacked(worker, tile) || worth <= own) return [];
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
 * Each unit's moves whose trial charts tiles never charted, unit by unit, the cheapest first, the
 * most charted of equals; only onto landings within `radius` tiles of the city where a radius is
 * named.
 */
export function* chartingWalks(
  catalogue: Catalogue,
  chronicle: Chronicle,
  units: readonly Unit[],
  radius?: number,
): Generator<Command> {
  const { city } = chronicle;
  const order = tileOrder(chronicle);
  for (const unit of units) {
    if (unit.movePoints <= 0) continue;
    yield* ranked(
      byHand(catalogue, chronicle, unit).landings.flatMap(({ tile, cost }) => {
        if (radius !== undefined && (city === undefined || distance(tile, city) > radius)) {
          return [];
        }
        const command = moveCommand(unit, tile);
        const after = trial(catalogue, chronicle, command);
        const grown = after === undefined ? 0 : after.snapshots.length - chronicle.snapshots.length;
        return grown > 0 ? [{ item: command, rank: [cost, -grown, order(tile)] }] : [];
      }),
    );
  }
}

/**
 * Each of the units governed resting on the landing the city may claim that stands highest, yields
 * least of equals, nearest the city's tile of equals, where that beats where it stands.
 */
export function garrisonRested(
  catalogue: Catalogue,
  chronicle: Chronicle,
  governed: readonly Unit[],
): Command[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  const seen = seenTiles(chronicle);
  const yields = yieldsAmong(catalogue, chronicle, seen);
  const ring = new Set(claimable(catalogue, chronicle, 'player').map(tileKey));
  const resting = (tile: TileCoords): number[] => [
    -elevation(catalogue, seen(tile)?.terrain),
    worthOf(yields(tile)),
    distance(tile, city),
  ];
  return governed.flatMap((unit) => {
    if (unit.movePoints <= 0) return [];
    const own = ring.has(tileKey(unit.tile)) ? resting(unit.tile) : undefined;
    return ranked(
      byHand(catalogue, chronicle, unit).landings.flatMap(({ tile }) => {
        if (!ring.has(tileKey(tile))) return [];
        const rank = resting(tile);
        if (own !== undefined && !ranksBelow(rank, own)) return [];
        return [{ item: moveCommand(unit, tile), rank: [...rank, order(tile)] }];
      }),
    );
  });
}

/**
 * Each of the units governed standing outside the border and off the tiles the city may claim
 * walking to its unheld landing nearest the city's tile, where that is nearer.
 */
export function garrisonWalkedHome(
  catalogue: Catalogue,
  chronicle: Chronicle,
  governed: readonly Unit[],
): Command[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  const ring = new Set(claimable(catalogue, chronicle, 'player').map(tileKey));
  return governed.flatMap((unit) => {
    if (unit.movePoints <= 0 || ring.has(tileKey(unit.tile)) || holds(chronicle, unit.tile)) {
      return [];
    }
    const unheld = byHand(catalogue, chronicle, unit).landings.filter(
      ({ tile }) => !holds(chronicle, tile),
    );
    return walksHome(unit, city, order, unheld);
  });
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

/**
 * The plays of the cards in hand aimed at the hand that the refusal lets through, in hand order,
 * each on the card of the hand `target` names for the slot it is played from.
 */
function playedOnHand(
  catalogue: Catalogue,
  chronicle: Chronicle,
  target: (index: number) => number,
): Command[] {
  return chronicle.hand.flatMap((held, index): Command[] => {
    if (aimOf(cardOf(catalogue, held.id)).aim !== 'hand') return [];
    if (!playable(refusalOf(catalogue, chronicle, held.id))) return [];
    return [{ type: 'play', index, aim: 'hand', card: target(index) }];
  });
}

function strikingDiscarded(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  const striking = chronicle.hand.findIndex((card) => carriesStrike(catalogue, card));
  return striking === -1 ? [] : playedOnHand(catalogue, chronicle, () => striking);
}

function handCycled(catalogue: Catalogue, chronicle: Chronicle): Command[] {
  return playedOnHand(catalogue, chronicle, (index) => (index === 0 ? 1 : 0));
}
