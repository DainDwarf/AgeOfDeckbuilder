import { aimOf } from '../src/rules/cards';
import { type Catalogue, captureOf, cardOf, fullHealth } from '../src/rules/catalogue';
import { byHand, type Command, refusalOf } from '../src/rules/chronicle';
import { cityCommand } from '../src/rules/city';
import { distance, routesFrom, routesToward, type TileCoords, tileKey } from '../src/rules/map';
import { type Chronicle, idle, playable } from '../src/rules/state';
import { passageFor, type Unit, unitOf } from '../src/rules/units';
import { worthOf } from '../src/rules/yields';
import {
  attackersOf,
  CITY_SETTLED,
  CLAIMED,
  chartingWalks,
  DEAL_TAKEN,
  declaringNoWar,
  enemyAttacked,
  GAIN_PLAYED,
  GAINED_THROUGH_WORKER,
  garrisonRested,
  garrisonWalkedHome,
  HAND_CYCLED,
  HAZARD_PAID,
  IDLE_ASSIGNED,
  moveCommand,
  PLACED,
  REASSIGNED,
  ranked,
  STRIKING_DISCARDED,
  seenYields,
  tileOrder,
  trial,
  UNIT_SETTLED,
  unitCardPlayed,
  unitCardsEntering,
  type Weighing,
  WORKER_SENT_OUT,
  WORKER_SENT_TO_PLAY,
  WORKER_WITHDRAWN,
} from './builder';
import { TURN_ENDED } from './idle';
import type { Gambit, Persona } from './sim-driver';

export const WARLORD: Persona = [
  staying(DEAL_TAKEN),
  staying(CITY_SETTLED),
  staying(UNIT_SETTLED),
  staying(HAZARD_PAID),
  staying({
    sentence:
      'While a population is idle and more than three stand, play a unit card whose trial enters a unit that attacks',
    candidates: (catalogue, chronicle) =>
      idle(chronicle) > 0 && chronicle.population > 3
        ? unitCardsEntering(catalogue, chronicle, false)
        : [],
  }),
  staying({
    sentence:
      'While none is idle, more than three stand and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals',
    candidates: unassignedForUnit,
  }),
  staying(IDLE_ASSIGNED),
  staying(REASSIGNED),
  staying(CLAIMED),
  staying(WORKER_WITHDRAWN),
  staying(WORKER_SENT_TO_PLAY),
  staying(PLACED),
  staying(GAINED_THROUGH_WORKER),
  staying(WORKER_SENT_OUT),
  staying({
    sentence:
      'While no worker stands, a population is idle and no held tile is free, play a unit card whose trial enters a worker',
    candidates: (catalogue, chronicle) => unitCardPlayed(catalogue, chronicle, true, 1),
  }),
  staying({
    sentence:
      'A unit that attacks, attacks the enemy of least health within its range, walking to the tile it attacks from first, the cheapest of equals',
    candidates: (catalogue, chronicle) => enemyAttacked(catalogue, chronicle, () => true),
  }),
  staying({
    sentence:
      'While no camp and no site is charted, a unit that attacks walks to the cheapest reachable tile whose trial charts a tile, the one charting most of equals',
    candidates: campSought,
  }),
  staying({
    sentence:
      "While at least three units that attack stand, a unit that attacks not the nearest the city's tile walks toward the nearest charted camp or site by the cheapest way over charted tiles, to the reachable tile that way weighs least from",
    candidates: marched,
  }),
  staying({
    sentence:
      "A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the cheapest reachable tile within five tiles of the city whose trial charts a tile, the one charting most of equals",
    candidates: (catalogue, chronicle) =>
      chartingWalks(catalogue, chronicle, notMarching(chronicle), 5),
  }),
  staying({
    sentence:
      "A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands",
    candidates: (catalogue, chronicle) =>
      garrisonRested(catalogue, chronicle, notMarching(chronicle)),
  }),
  staying({
    sentence:
      "A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, outside the border and off the tiles the city may claim walks to the reachable unheld tile nearest the city's tile, where that is nearer than where it stands",
    candidates: (catalogue, chronicle) =>
      garrisonWalkedHome(catalogue, chronicle, notMarching(chronicle)),
  }),
  staying({
    sentence:
      "Play a card aimed at a unit whose trial refreshes a unit's move points, on the unit that attacks furthest from the city that has spent them and stands on no camp or site",
    candidates: movePointsRefreshed,
  }),
  staying({
    sentence:
      "Play a card aimed at a unit whose trial raises a unit's health, on the unit that attacks that has lost the most",
    candidates: healthRaised,
  }),
  staying(GAIN_PLAYED),
  staying(STRIKING_DISCARDED),
  staying(HAND_CYCLED),
  TURN_ENDED,
];

/**
 * The gambit answering the first of its candidates that declares no war and moves no unit of the
 * player's off a camp or a site.
 */
function staying({ sentence, candidates }: Weighing): Gambit {
  return declaringNoWar({
    sentence,
    candidates: function* (catalogue, chronicle) {
      for (const command of candidates(catalogue, chronicle)) {
        if (!movedOffCampOrSite(catalogue, chronicle, command)) yield command;
      }
    },
  });
}

/** Whether the building is a camp or a site of the chronicle's age. */
function campOrSite(
  catalogue: Catalogue,
  chronicle: Chronicle,
  building: string | undefined,
): boolean {
  if (building === undefined) return false;
  const capture = captureOf(catalogue, chronicle.age, building);
  if (capture === undefined) return false;
  switch (capture.takes) {
    case 'camp':
    case 'site':
      return true;
    case 'neutral-city':
      return false;
  }
}

/** Whether the tile's snapshot holds a camp or a site: the tile as the player last saw it. */
function campOrSiteSeenOn(catalogue: Catalogue, chronicle: Chronicle, tile: TileCoords): boolean {
  const snapshot = chronicle.snapshots.find((each) => tileKey(each) === tileKey(tile));
  return campOrSite(catalogue, chronicle, snapshot?.tile.building);
}

function movedOffCampOrSite(catalogue: Catalogue, chronicle: Chronicle, command: Command): boolean {
  if (command.type !== 'move') return false;
  const unit = unitOf(chronicle.units, command.unit);
  return unit?.faction === 'player' && campOrSiteSeenOn(catalogue, chronicle, unit.tile);
}

/** The unit that attacks standing nearest the city's tile, ties in tile order. */
function garrisonOf(chronicle: Chronicle, attackers: readonly Unit[]): Unit | undefined {
  const { city } = chronicle;
  if (city === undefined) return undefined;
  const order = tileOrder(chronicle);
  const [garrison] = ranked(
    attackers.map((unit) => ({ item: unit, rank: [distance(unit.tile, city), order(unit.tile)] })),
  );
  return garrison;
}

/** The units that attack the march leaves home: every one while fewer than three stand, else the garrison. */
function notMarching(chronicle: Chronicle): Unit[] {
  const attackers = attackersOf(chronicle);
  if (attackers.length < 3) return attackers;
  const garrison = garrisonOf(chronicle, attackers);
  return garrison === undefined ? [] : [garrison];
}

function* unassignedForUnit(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  if (idle(chronicle) > 0 || chronicle.population <= 3) return;
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
    if (after !== undefined && unitCardsEntering(catalogue, after, false).length > 0) {
      yield command;
    }
  }
}

function* campSought(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  if (chronicle.snapshots.some(({ tile }) => campOrSite(catalogue, chronicle, tile.building))) {
    return;
  }
  yield* chartingWalks(catalogue, chronicle, attackersOf(chronicle));
}

function* marched(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const home = new Set(notMarching(chronicle).map(({ id }) => id));
  const order = tileOrder(chronicle);
  const targets = chronicle.snapshots
    .filter(({ tile }) => campOrSite(catalogue, chronicle, tile.building))
    .map(({ q, r }) => ({ q, r }));
  const passage = passageFor(chronicle, 'player');
  const { tiles, rivers } = chronicle;
  for (const unit of attackersOf(chronicle)) {
    if (home.has(unit.id) || unit.movePoints <= 0) continue;
    const moves = { ashore: unit.stats.move };
    const from = routesFrom(catalogue, tiles, rivers, unit.tile, unit.embarked, moves, passage);
    const [nearest] = ranked(
      targets.flatMap((tile) => {
        const weight = from.ashore.get(tileKey(tile));
        return weight === undefined ? [] : [{ item: tile, rank: [weight, order(tile)] }];
      }),
    );
    if (nearest === undefined) continue;
    const toward = routesToward(catalogue, tiles, rivers, nearest, false, moves, passage).ashore;
    const own = toward.get(tileKey(unit.tile));
    if (own === undefined) continue;
    yield* ranked(
      byHand(catalogue, chronicle, unit).landings.flatMap(({ tile, cost }) => {
        const weight = toward.get(tileKey(tile));
        if (weight === undefined || weight >= own) return [];
        return [{ item: moveCommand(unit, tile), rank: [weight, cost, order(tile)] }];
      }),
    );
  }
}

/**
 * The plays of the cards in hand aimed at a unit that the refusal lets through, on each of the units
 * in turn, in hand order, whose trial leaves that unit raised as `raised` reads it.
 */
function* playedOnUnits(
  catalogue: Catalogue,
  chronicle: Chronicle,
  units: readonly Unit[],
  raised: (before: Unit, after: Unit) => boolean,
): Generator<Command> {
  const cards = chronicle.hand.flatMap(({ id }, index) =>
    aimOf(cardOf(catalogue, id)).aim === 'unit' && playable(refusalOf(catalogue, chronicle, id))
      ? [index]
      : [],
  );
  for (const unit of units) {
    for (const index of cards) {
      const command: Command = {
        type: 'play',
        index,
        aim: 'unit',
        tile: { q: unit.tile.q, r: unit.tile.r },
      };
      const after = trial(catalogue, chronicle, command);
      const left = after && unitOf(after.units, unit.id);
      if (left !== undefined && raised(unit, left)) yield command;
    }
  }
}

function movePointsRefreshed(catalogue: Catalogue, chronicle: Chronicle): Iterable<Command> {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  const spent = ranked(
    attackersOf(chronicle).flatMap((unit) =>
      unit.movePoints < unit.stats.move && !campOrSiteSeenOn(catalogue, chronicle, unit.tile)
        ? [{ item: unit, rank: [-distance(unit.tile, city), order(unit.tile)] }]
        : [],
    ),
  );
  return playedOnUnits(
    catalogue,
    chronicle,
    spent,
    (before, after) => after.movePoints > before.movePoints,
  );
}

function healthRaised(catalogue: Catalogue, chronicle: Chronicle): Iterable<Command> {
  const order = tileOrder(chronicle);
  const hurt = ranked(
    attackersOf(chronicle).flatMap((unit) => {
      const lost = fullHealth(catalogue, unit.stats) - unit.stats.health;
      return lost > 0 ? [{ item: unit, rank: [-lost, order(unit.tile)] }] : [];
    }),
  );
  return playedOnUnits(
    catalogue,
    chronicle,
    hurt,
    (before, after) => after.stats.health > before.stats.health,
  );
}
