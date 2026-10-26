import { aimOf } from '../src/rules/cards';
import {
  ageOf,
  type Catalogue,
  capstoneOf,
  cardOf,
  costOf,
  type Entering,
  earningOf,
  entered,
  strikeOf,
  victoryTechnologyOf,
  workerAim,
} from '../src/rules/catalogue';
import {
  admitted,
  apply,
  byHand,
  type Command,
  countOn,
  declaresWar,
  incomeOf,
  outcome,
  refusalOf,
} from '../src/rules/chronicle';
import { cityCommand, cityDrag, claimable } from '../src/rules/city';
import { targetsInOwnSight } from '../src/rules/enemies';
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
import { RESOURCES, type Resources, takenBelowNothing } from '../src/rules/resources';
import { offered } from '../src/rules/schedule';
import { inSight } from '../src/rules/sight';
import {
  assignedTo,
  type CardId,
  type Chronicle,
  type ChronicleAchievement,
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
  unitAt,
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

export const ENTERED_EARLY: Weighing = {
  sentence:
    'While no unit that attacks stands within three tiles of the city and a population is idle, play a unit card whose trial enters a unit that attacks',
  candidates: (catalogue, chronicle) =>
    idle(chronicle) > 0 && attackersNear(chronicle).length === 0
      ? unitCardsEntering(catalogue, chronicle, false)
      : [],
};

export const IDLE_ASSIGNED: Weighing = guardingIncome({
  sentence:
    'While a population is idle and the city holds a tile nobody works, assign it to the free held tile that yields the most food, the most of everything together of equals',
  candidates: idleAssigned,
});

export const REASSIGNED: Weighing = guardingIncome({
  sentence:
    'While a worked tile yields less than a free held tile, reassign the population onto it',
  candidates: reassigned,
});

export const CLAIMED: Weighing = guardingIncome({
  sentence:
    'While culture covers a claim, claim the tile that yields most among those the city may claim, the nearest a charted tile that yields more of equals',
  candidates: claimed,
});

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

/** The goal gambits, going for the goal of the technology named, the capstone where none is. */
export function goalGambits(goal: string | undefined): Weighing[] {
  const counted = (catalogue: Catalogue, chronicle: Chronicle): GoalCount =>
    goalCount(catalogue, chronicle, goal);
  return [
    guardingIncome({
      sentence:
        "Claim the tile whose trial raises the goal's count the most, the nearest the city of equals",
      candidates: (catalogue, chronicle) =>
        goalClaimed(catalogue, chronicle, counted(catalogue, chronicle)),
    }),
    guardingIncome({
      sentence:
        "Play the card in hand whose trial raises the goal's count the most, through a worker on its tile, aimed at nothing, at a unit or at the hand",
      candidates: (catalogue, chronicle) =>
        goalPlayed(catalogue, chronicle, counted(catalogue, chronicle)),
    }),
    {
      sentence:
        "Move a worker holding its move points to the reachable tile no enemy the map shows could attack next turn from where a card in hand played through it raises the goal's count the most, where none does from where it stands",
      candidates: (catalogue, chronicle) => {
        const count = counted(catalogue, chronicle);
        return workersWalkedToPlay(
          catalogue,
          chronicle,
          (there, index, tile) => {
            const play = playedThroughWorker(catalogue, there, index, tile);
            if (play === undefined || incomeTakenBy(catalogue, there, play.command)) {
              return undefined;
            }
            const rise = goalRaised(catalogue, there, count, play.command);
            return rise === undefined ? undefined : [-rise];
          },
          (_best, own) => own === undefined,
        );
      },
    },
    {
      sentence:
        "A unit that attacks walks to the reachable tile whose trial raises the goal's count the most, the cheapest of equals",
      candidates: (catalogue, chronicle) => {
        const count = counted(catalogue, chronicle);
        return landingsRead(catalogue, chronicle, attackersOf(chronicle), ({ cost }, move) => {
          const rise = goalRaised(catalogue, chronicle, count, move);
          return rise === undefined ? undefined : [-rise, cost];
        });
      },
    },
    {
      sentence:
        "A unit that attacks, attacks the enemy whose trial raises the goal's count the most, walking to the tile it attacks from first, the cheapest of equals",
      candidates: (catalogue, chronicle) => {
        const count = counted(catalogue, chronicle);
        return enemyAttacked(catalogue, chronicle, (attacker, from, target) => {
          const there = movedByHand(chronicle, attacker, from);
          const rise = goalRaised(catalogue, there, count, attackCommand(attacker, target));
          return rise === undefined ? undefined : [-rise];
        });
      },
    },
  ];
}

/** The builder, its goal gambits going for the goal of the technology named. */
export function builder(goal?: string): Persona {
  return [
    declaringNoWar(DEAL_TAKEN),
    declaringNoWar(CITY_SETTLED),
    declaringNoWar(UNIT_SETTLED),
    declaringNoWar(HAZARD_PAID),
    ...goalGambits(goal).map(declaringNoWar),
    declaringNoWar(ENTERED_EARLY),
    declaringNoWar({
      sentence:
        'While more enemies the map shows stand within three tiles of the city than units that attack there, and a population is idle, play a unit card whose trial enters a unit that attacks',
      candidates: (catalogue, chronicle) =>
        idle(chronicle) > 0 && outnumbered(catalogue, chronicle)
          ? unitCardsEntering(catalogue, chronicle, false)
          : [],
    }),
    declaringNoWar({
      sentence:
        'While more enemies the map shows stand within three tiles of the city than units that attack there, none is idle, and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals',
      candidates: (catalogue, chronicle) => unassignedForUnit(catalogue, chronicle, outnumbered),
    }),
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
        'A unit that attacks, attacks the enemy of least health within three tiles of the city within its range, walking to the tile it attacks from first, the cheapest of equals',
      candidates: (catalogue, chronicle) => {
        const near = nearTheCity(chronicle, 3);
        return enemyAttacked(
          catalogue,
          chronicle,
          leastHealthAmong(chronicle, (enemy) => near(enemy.tile)),
        );
      },
    }),
    declaringNoWar({
      sentence:
        'A unit that attacks walks toward the enemy the map shows within three tiles of the city, the nearest the city first, of least health of equals, to the reachable tile nearest that enemy, nearest the city of equals, where that is nearer the enemy than where it stands',
      candidates: (catalogue, chronicle) =>
        garrisonPursued(catalogue, chronicle, attackersOf(chronicle), 3),
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
    declaringNoWar({
      sentence:
        'Play a card aimed at nothing whose trial raises a resource the income gives less of than each resource the card costs',
      candidates: lessGivenRaised,
    }),
    declaringNoWar(STRIKING_DISCARDED),
    declaringNoWar(HAND_CYCLED),
    TURN_ENDED,
  ];
}

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

/** The weighing with each candidate passed over whose command `incomeTakenBy` reads. */
function guardingIncome({ sentence, candidates }: Weighing): Weighing {
  return {
    sentence,
    candidates: function* (catalogue, chronicle) {
      for (const command of candidates(catalogue, chronicle)) {
        if (!incomeTakenBy(catalogue, chronicle, command)) yield command;
      }
    },
  };
}

/** Whether the command takes some resource's income below nothing, or lower while it is. */
function incomeTakenBy(catalogue: Catalogue, chronicle: Chronicle, command: Command): boolean {
  return incomeTaken(catalogue, chronicle, outcome(apply(catalogue, chronicle, command)));
}

/**
 * Whether some resource's income of the player's city reads below nothing on the chronicle after,
 * and lower than on the chronicle before.
 */
export function incomeTaken(catalogue: Catalogue, before: Chronicle, after: Chronicle): boolean {
  return takenBelowNothing(
    incomeOf(catalogue, before, 'player'),
    incomeOf(catalogue, after, 'player'),
  );
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

/** The goal's count, as one decision reads it on its chronicle and on each of its trials. */
type GoalCount = (chronicle: Chronicle) => number;

/**
 * The goal's count chosen on the chronicle a decision stands on: the count of the achievement earning
 * the technology named while it stands unreached there, and the capstone's otherwise.
 */
function goalCount(
  catalogue: Catalogue,
  chronicle: Chronicle,
  goal: string | undefined,
): GoalCount {
  const capstone = capstoneOf(catalogue, chronicle.timeline.capstone.id);
  const capstoneCount: GoalCount = (read) => capstone.count(catalogue, read);
  if (goal === undefined || goal === victoryTechnologyOf(catalogue, chronicle.age)) {
    return capstoneCount;
  }
  const { id } = earningOf(catalogue, goal);
  if (rowOf(chronicle, id).reached) return capstoneCount;
  return (read) => countOn(catalogue, read, rowOf(read, id));
}

/** The achievement of the chronicle's row that the id names; a row without it throws. */
function rowOf(chronicle: Chronicle, id: string): ChronicleAchievement {
  const held = chronicle.achievements.find((row) => row.id === id);
  if (held === undefined) throw new Error(`the chronicle's row holds no ${id}`);
  return held;
}

/** How much the command's trial raises the goal's count, and nothing where it raises none. */
function goalRaised(
  catalogue: Catalogue,
  chronicle: Chronicle,
  count: GoalCount,
  command: Command,
): number | undefined {
  const after = trial(catalogue, chronicle, command);
  const rise = after === undefined ? 0 : count(after) - count(chronicle);
  return rise > 0 ? rise : undefined;
}

function goalClaimed(catalogue: Catalogue, chronicle: Chronicle, count: GoalCount): Command[] {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  return rankedClaims(catalogue, chronicle, (tile, claim) => {
    const rise = goalRaised(catalogue, chronicle, count, claim);
    return rise === undefined ? undefined : [-rise, distance(tile, city), order(tile)];
  });
}

function goalPlayed(catalogue: Catalogue, chronicle: Chronicle, count: GoalCount): Command[] {
  const order = tileOrder(chronicle);
  return ranked(
    chronicle.hand.flatMap((held, index) => {
      if (!playable(refusalOf(catalogue, chronicle, held.id))) return [];
      return playsOfCard(catalogue, chronicle, index, order).flatMap(({ command, at }) => {
        const rise = goalRaised(catalogue, chronicle, count, command);
        return rise === undefined ? [] : [{ item: command, rank: [-rise, index, at] }];
      });
    }),
  );
}

/**
 * Every play of the card in that slot of the hand the rules admit: through a worker on its tile, at
 * nothing, at a unit of the player's, at another card of the hand; each with its tile's place in tile
 * order, or the slot of the card it is aimed at.
 */
function playsOfCard(
  catalogue: Catalogue,
  chronicle: Chronicle,
  index: number,
  order: (tile: TileCoords) => number,
): { readonly command: Command; readonly at: number }[] {
  const card = cardOf(catalogue, chronicle.hand[index].id);
  const aim = aimOf(card);
  switch (aim.aim) {
    case 'none':
      return [{ command: { type: 'play', index, aim: 'none' }, at: 0 }];
    case 'tile':
      if (workerAim(card) === undefined) return [];
      return admitted(catalogue, chronicle, aim).map((tile) => ({
        command: { type: 'play', index, aim: 'tile', tile },
        at: order(tile),
      }));
    case 'unit':
      return admitted(catalogue, chronicle, aim).map((tile) => ({
        command: { type: 'play', index, aim: 'unit', tile },
        at: order(tile),
      }));
    case 'hand':
      return chronicle.hand.flatMap((_, card) =>
        card === index ? [] : [{ command: { type: 'play', index, aim: 'hand', card }, at: card }],
      );
  }
}

/** The chronicle with the unit set on the tile by hand, past the rules: no move point spent, nothing charted. */
function movedByHand(chronicle: Chronicle, mover: Unit, at: TileCoords): Chronicle {
  return {
    ...chronicle,
    units: chronicle.units.map((unit) => (unit.id === mover.id ? { ...unit, tile: at } : unit)),
  };
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

function attackCommand(unit: Unit, target: Unit): Command {
  return { type: 'attack', unit: unit.id, tile: target.tile };
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
  return rankedClaims(catalogue, chronicle, (tile) => {
    const worth = worthOf(yields(tile));
    const toward = unheld
      .filter((richer) => richer.worth > worth)
      .reduce((nearest, richer) => Math.min(nearest, distance(richer.tile, tile)), Infinity);
    return [-worth, toward, order(tile)];
  });
}

/**
 * The claims of the tiles the city may claim now, ranked as `rank` reads each tile and its claim,
 * the lowest first; a tile it reads nothing for is passed over.
 */
function rankedClaims(
  catalogue: Catalogue,
  chronicle: Chronicle,
  rank: (tile: TileCoords, claim: Command) => readonly number[] | undefined,
): Command[] {
  return ranked(
    claimable(catalogue, chronicle, 'player')
      .filter((tile) => cityCommand(catalogue, chronicle, tile)?.type === 'claim')
      .flatMap((tile): Ranked<Command>[] => {
        const claim: Command = { type: 'claim', tile };
        const read = rank(tile, claim);
        return read === undefined ? [] : [{ item: claim, rank: read }];
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
 * The map the player knows: the charted tiles as last seen, the player's units, and each unit a
 * snapshot carries standing as one of its kind, in sight or in fog this turn.
 */
function shownMap(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
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
  return known;
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
  const known = shownMap(catalogue, chronicle);
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
  const play = playedThroughWorker(catalogue, chronicle, index, tile);
  if (play === undefined) return undefined;
  const { command, places } = play;
  const after = trial(catalogue, chronicle, command);
  if (after === undefined || after === chronicle) return undefined;
  if (places) {
    const was = yieldsOn(catalogue, chronicle)(tile);
    const is = yieldsOn(catalogue, after)(tile);
    if (worthOf(is) < worthOf(was) || incomeTaken(catalogue, chronicle, after)) return undefined;
    return {
      item: command,
      rank: [0, (was.food ?? 0) - (is.food ?? 0), worthOf(was) - worthOf(is)],
    };
  }
  const raised = worthOf(after.resources) - worthOf(chronicle.resources);
  if (raised <= 0 || yieldLowered(catalogue, chronicle, after)) return undefined;
  return { item: command, rank: [1, -raised] };
}

/**
 * The card in that slot of the hand played through the worker on the tile, and whether it places
 * something; nothing where the card is no such play or the tile or the stocks refuse it.
 */
function playedThroughWorker(
  catalogue: Catalogue,
  chronicle: Chronicle,
  index: number,
  tile: Tile,
): { readonly command: Command; readonly places: boolean } | undefined {
  const { id } = chronicle.hand[index];
  const aim = workerAim(cardOf(catalogue, id));
  if (
    aim === undefined ||
    aim.refuses(catalogue, chronicle, tile, 'player') !== undefined ||
    !playable(refusalOf(catalogue, chronicle, id))
  ) {
    return undefined;
  }
  return {
    command: { type: 'play', index, aim: 'tile', tile: { q: tile.q, r: tile.r } },
    places: aim.places === true,
  };
}

/** Whether any tile of the map yields less after than before. */
function yieldLowered(catalogue: Catalogue, before: Chronicle, after: Chronicle): boolean {
  const was = yieldsOn(catalogue, before);
  const is = yieldsOn(catalogue, after);
  return before.tiles.some((tile) => worthOf(is(tile)) < worthOf(was(tile)));
}

/**
 * A reading of the card in that slot of the hand played through a worker on the tile, on the
 * chronicle with the worker standing there: its rank, the lowest first, and nothing for no play.
 */
type PlayRead = (there: Chronicle, index: number, tile: Tile) => readonly number[] | undefined;

/** The best play of the hand through the worker read as standing on the tile, and nothing for none. */
function bestPlayFrom(
  chronicle: Chronicle,
  worker: Unit,
  at: TileCoords,
  read: PlayRead,
): readonly number[] | undefined {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) return undefined;
  const there = movedByHand(chronicle, worker, at);
  const [best] = ranked(
    chronicle.hand.flatMap((_, index) => {
      const rank = read(there, index, tile);
      return rank === undefined ? [] : [{ item: rank, rank }];
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

function workerSentToPlay(catalogue: Catalogue, chronicle: Chronicle): Iterable<Command> {
  return workersWalkedToPlay(
    catalogue,
    chronicle,
    (there, index, tile) => workerPlay(catalogue, there, index, tile)?.rank,
    (best, own) => own === undefined || ranksBelow(best, own),
  );
}

/**
 * Each worker holding its move points and its action walking to the landing no enemy the map shows
 * could attack next turn where its best play, as `read` ranks it, ranks lowest, the cheapest of
 * equals, where `walks` lets that best through against the best where it stands.
 */
function* workersWalkedToPlay(
  catalogue: Catalogue,
  chronicle: Chronicle,
  read: PlayRead,
  walks: (best: readonly number[], own: readonly number[] | undefined) => boolean,
): Generator<Command> {
  const workers = workersToWalk(chronicle);
  if (workers.length === 0) return;
  const order = tileOrder(chronicle);
  const attacked = attackedNextTurn(catalogue, chronicle);
  for (const worker of workers) {
    const own = bestPlayFrom(chronicle, worker, worker.tile, read);
    yield* ranked(
      byHand(catalogue, chronicle, worker).landings.flatMap(({ tile, cost }) => {
        if (attacked(worker, tile)) return [];
        const best = bestPlayFrom(chronicle, worker, tile, read);
        if (best === undefined || !walks(best, own)) return [];
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
 * While none is idle and `when` holds, the unassigns of the worked tiles, the one yielding the least
 * of everything together first, the least food of equals, for a unit card in hand entering a unit
 * that attacks that the idle alone holds back; one whose trial `incomeTaken` reads is passed over.
 */
export function* unassignedForUnit(
  catalogue: Catalogue,
  chronicle: Chronicle,
  when: (catalogue: Catalogue, chronicle: Chronicle) => boolean,
): Generator<Command> {
  if (idle(chronicle) > 0 || !when(catalogue, chronicle)) return;
  const heldBack = chronicle.hand.some(({ id }) => {
    if (cardOf(catalogue, id).kind !== 'unit') return false;
    const { unaffordable, blocked } = refusalOf(catalogue, chronicle, id);
    return unaffordable.length === 0 && blocked.length === 1 && blocked[0] === 'idle';
  });
  if (!heldBack) return;
  const yields = seenYields(catalogue, chronicle);
  const order = tileOrder(chronicle);
  const worked = ranked(
    chronicle.assigned.map((tile) => ({
      item: tile,
      rank: [worthOf(yields(tile)), yields(tile).food ?? 0, order(tile)],
    })),
  );
  for (const tile of worked) {
    if (cityCommand(catalogue, chronicle, tile)?.type !== 'assign') continue;
    const command: Command = { type: 'assign', tile };
    // The card is held back until the tile is unassigned, so what it enters is read past the unassign.
    const after = trial(catalogue, chronicle, command);
    if (
      after !== undefined &&
      !incomeTaken(catalogue, chronicle, after) &&
      unitCardsEntering(catalogue, after, false).length > 0
    ) {
      yield command;
    }
  }
}

/** Whether a tile stands within that many tiles of the city's tile; none does while no city stands. */
function nearTheCity(chronicle: Chronicle, radius: number): (tile: TileCoords) => boolean {
  const { city } = chronicle;
  return (tile) => city !== undefined && distance(tile, city) <= radius;
}

/**
 * An enemy's rank as the unit attacking it from the tile reads it, the lowest first, and nothing for
 * one it passes over.
 */
type TargetRank = (attacker: Unit, from: TileCoords, target: Unit) => readonly number[] | undefined;

/** The enemies `admits` lets through, the one of least health first, then in tile order. */
export function leastHealthAmong(
  chronicle: Chronicle,
  admits: (enemy: Unit) => boolean,
): TargetRank {
  const order = tileOrder(chronicle);
  return (_attacker, _from, target) =>
    admits(target) ? [target.stats.health, order(target.tile)] : undefined;
}

/**
 * Each unit that attacks attacking the enemy `rank` puts first among those it reaches from its own
 * tile or a landing, walking first to the tile it ranks it lowest from, the cheapest of equals.
 */
export function* enemyAttacked(
  catalogue: Catalogue,
  chronicle: Chronicle,
  rank: TargetRank,
): Generator<Command> {
  const relations = relationsOf(chronicle);
  const order = tileOrder(chronicle);
  for (const unit of attackersOf(chronicle)) {
    if (unit.action <= 0) continue;
    const own: Landing = { tile: unit.tile, cost: 0 };
    const reaching = ranked(
      [own, ...byHand(catalogue, chronicle, unit).landings].flatMap(({ tile, cost }) => {
        const there = { ...unit, tile };
        const enemies = byHand(catalogue, chronicle, there).targets.filter((target) =>
          actsAsEnemy(target, relations),
        );
        return targetsInOwnSight(catalogue, chronicle, enemies, there).flatMap((target) => {
          const read = rank(unit, tile, target);
          return read === undefined
            ? []
            : [{ item: { tile, target }, rank: [...read, cost, order(tile)] }];
        });
      }),
    );
    const [first] = reaching;
    if (first === undefined) continue;
    for (const { tile } of reaching.filter(({ target }) => target.id === first.target.id)) {
      yield tileKey(tile) === tileKey(unit.tile)
        ? attackCommand(unit, first.target)
        : moveCommand(unit, tile);
    }
  }
}

/**
 * The enemies the map shows within `radius` tiles of the city's tile, the nearest it first, of least
 * health of equals, each at the health the screen shows: its own in sight, its kind's in fog.
 */
function shownEnemiesNear(
  catalogue: Catalogue,
  chronicle: Chronicle,
  city: TileCoords,
  radius: number,
): Unit[] {
  const relations = relationsOf(chronicle);
  const seen = inSight(catalogue, chronicle);
  const near = nearTheCity(chronicle, radius);
  const order = tileOrder(chronicle);
  return ranked(
    shownMap(catalogue, chronicle).units.flatMap((shown) => {
      if (!actsAsEnemy(shown, relations) || !near(shown.tile)) return [];
      const enemy = seen.has(tileKey(shown.tile)) ? unitAt(chronicle.units, shown.tile) : shown;
      if (enemy === undefined) return [];
      return [
        { item: enemy, rank: [distance(enemy.tile, city), enemy.stats.health, order(enemy.tile)] },
      ];
    }),
  );
}

/**
 * Whether more enemies the map shows stand within three tiles of the city than units of the player's
 * that attack there.
 */
function outnumbered(catalogue: Catalogue, chronicle: Chronicle): boolean {
  const { city } = chronicle;
  if (city === undefined) return false;
  return shownEnemiesNear(catalogue, chronicle, city, 3).length > attackersNear(chronicle).length;
}

/** The units of the player's that attack standing within three tiles of the city's tile. */
function attackersNear(chronicle: Chronicle): Unit[] {
  const near = nearTheCity(chronicle, 3);
  return attackersOf(chronicle).filter((unit) => near(unit.tile));
}

/**
 * Each of the units governed walking toward the first of the enemies the map shows within `radius`
 * tiles of the city, to its landing nearest that enemy, nearest the city's tile of equals, where
 * that is nearer the enemy than where it stands.
 */
export function garrisonPursued(
  catalogue: Catalogue,
  chronicle: Chronicle,
  governed: readonly Unit[],
  radius: number,
): Command[] {
  const { city } = chronicle;
  if (city === undefined || governed.length === 0) return [];
  const [enemy] = shownEnemiesNear(catalogue, chronicle, city, radius);
  if (enemy === undefined) return [];
  const order = tileOrder(chronicle);
  return governed.flatMap((unit) => {
    const standsAt = distance(unit.tile, enemy.tile);
    return ranked(
      byHand(catalogue, chronicle, unit).landings.flatMap(({ tile }) => {
        const away = distance(tile, enemy.tile);
        if (away >= standsAt) return [];
        return [{ item: moveCommand(unit, tile), rank: [away, distance(tile, city), order(tile)] }];
      }),
    );
  });
}

/** The candidates, and none while fewer than two units of the player's that attack stand. */
export function onceTwoStand(candidates: Weighing['candidates']): Weighing['candidates'] {
  return (catalogue, chronicle) =>
    attackersOf(chronicle).length >= 2 ? candidates(catalogue, chronicle) : [];
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
  const near = radius === undefined ? () => true : nearTheCity(chronicle, radius);
  yield* landingsRead(catalogue, chronicle, units, ({ tile, cost }, move) => {
    if (!near(tile)) return undefined;
    const after = trial(catalogue, chronicle, move);
    const grown = after === undefined ? 0 : after.snapshots.length - chronicle.snapshots.length;
    return grown > 0 ? [cost, -grown] : undefined;
  });
}

/**
 * Each unit's moves onto its landings, unit by unit, ranked as `read` reads the landing and the move
 * onto it, the lowest first, then in tile order; a landing it reads nothing for is passed over.
 */
function* landingsRead(
  catalogue: Catalogue,
  chronicle: Chronicle,
  units: readonly Unit[],
  read: (landing: Landing, move: Command) => readonly number[] | undefined,
): Generator<Command> {
  const order = tileOrder(chronicle);
  for (const unit of units) {
    if (unit.movePoints <= 0) continue;
    yield* ranked(
      byHand(catalogue, chronicle, unit).landings.flatMap((landing) => {
        const move = moveCommand(unit, landing.tile);
        const rank = read(landing, move);
        return rank === undefined ? [] : [{ item: move, rank: [...rank, order(landing.tile)] }];
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

/**
 * The plays of the cards in hand aimed at nothing that the refusal lets through, hazards passed, in
 * hand order, each with the card it plays and the chronicle its trial leaves; one whose trial drew
 * is passed.
 */
function* trialsAtNothing(
  catalogue: Catalogue,
  chronicle: Chronicle,
): Generator<{ readonly command: Command; readonly id: CardId; readonly after: Chronicle }> {
  for (const [index, { id }] of chronicle.hand.entries()) {
    const card = cardOf(catalogue, id);
    if (card.kind === 'hazard' || aimOf(card).aim !== 'none') continue;
    if (!playable(refusalOf(catalogue, chronicle, id))) continue;
    const command: Command = { type: 'play', index, aim: 'none' };
    const after = trial(catalogue, chronicle, command);
    if (after !== undefined) yield { command, id, after };
  }
}

function* gainPlayed(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  for (const { command, after } of trialsAtNothing(catalogue, chronicle)) {
    if (
      worthOf(after.resources) > worthOf(chronicle.resources) ||
      after.population > chronicle.population
    ) {
      yield command;
    }
  }
}

function* lessGivenRaised(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const given = incomeOf(catalogue, chronicle, 'player');
  for (const { command, id, after } of trialsAtNothing(catalogue, chronicle)) {
    const costs = costOf(catalogue, id);
    const raised = RESOURCES.filter(
      (resource) => after.resources[resource] > chronicle.resources[resource],
    );
    if (raised.some((resource) => costs.every((cost) => given[resource] < given[cost.resource]))) {
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
