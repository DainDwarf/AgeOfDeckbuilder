import { type Catalogue, captureOf } from '../src/rules/catalogue';
import { byHand, type Command } from '../src/rules/chronicle';
import { distance, routesFrom, routesToward, type TileCoords, tileKey } from '../src/rules/map';
import { type Chronicle, idle } from '../src/rules/state';
import { passageFor, type Unit, unitOf } from '../src/rules/units';
import {
  ATTACKER_WITHDRAWN,
  attackersHoldingAction,
  attackersOf,
  CITY_SETTLED,
  CLAIMED,
  chartingWalks,
  DEAL_TAKEN,
  declaringNoWar,
  ENTERED_EARLY,
  enemyAttacked,
  GAIN_PLAYED,
  GAINED_THROUGH_WORKER,
  garrisonPursued,
  garrisonRested,
  garrisonWalkedHome,
  goalGambits,
  HAND_CYCLED,
  HAZARD_PAID,
  HEALED,
  IDLE_ASSIGNED,
  leastHealthAmong,
  moveCommand,
  movePointsRaisedOn,
  onceTwoStand,
  PLACED,
  PULLED_BACK,
  playedOnUnits,
  REASSIGNED,
  ranked,
  refreshedAway,
  STRIKING_DISCARDED,
  tileOrder,
  UNIT_SETTLED,
  unassignedForUnit,
  unitCardPlayed,
  unitCardsEntering,
  type Weighing,
  WORKER_SENT_OUT,
  WORKER_SENT_TO_PLAY,
  WORKER_WITHDRAWN,
} from './builder';
import { TURN_ENDED } from './idle';
import type { Gambit, Persona } from './sim-driver';

/** The warlord, its goal gambits going for the goal of the technology named. */
export function warlord(goal?: string): Persona {
  return [
    staying(DEAL_TAKEN),
    staying(CITY_SETTLED),
    staying(UNIT_SETTLED),
    staying(HAZARD_PAID),
    ...goalGambits(goal).map(staying),
    staying(ENTERED_EARLY),
    staying({
      sentence:
        'While a population is idle and more stand than the tiles the city holds, three at most, play a unit card whose trial enters a unit that attacks',
      candidates: (catalogue, chronicle) =>
        idle(chronicle) > 0 && populationAboveFloor(chronicle)
          ? unitCardsEntering(catalogue, chronicle, false)
          : [],
    }),
    staying({
      sentence:
        'While none is idle, more stand than the tiles the city holds, three at most, and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals',
      candidates: (catalogue, chronicle) =>
        unassignedForUnit(catalogue, chronicle, (_catalogue, read) => populationAboveFloor(read)),
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
    staying(PULLED_BACK),
    staying(HEALED),
    staying({
      sentence:
        'A unit that attacks, attacks the enemy of least health within its range, walking to the tile it attacks from first, the furthest from that enemy within its range, the cheapest of equals',
      candidates: (catalogue, chronicle) =>
        enemyAttacked(
          catalogue,
          chronicle,
          leastHealthAmong(chronicle, () => true),
        ),
    }),
    staying({
      sentence:
        'Play a card aimed at a unit whose trial refreshes the move points of a unit that attacks that has spent its action, that stands on no camp or site and that an enemy the map shows could attack next turn, where that unit then reaches a tile no such enemy could attack',
      candidates: (catalogue, chronicle) =>
        refreshedAway(
          catalogue,
          chronicle,
          (unit) => !campOrSiteSeenOn(catalogue, chronicle, unit.tile),
        ),
    }),
    staying(ATTACKER_WITHDRAWN),
    staying({
      sentence:
        "A unit that attacks holding its action that is not marching, the nearest the city's tile or any while fewer than three stand, walks toward the enemy the map shows within three tiles of the city, the nearest the city first, of least health of equals, to the reachable tile nearest that enemy, nearest the city of equals, where that is nearer the enemy than where it stands",
      candidates: (catalogue, chronicle) =>
        garrisonPursued(catalogue, chronicle, notMarching(chronicle), 3),
    }),
    staying({
      sentence:
        'While at least two units that attack stand and no camp and no site is charted, a unit that attacks holding its action walks to the cheapest reachable tile whose trial charts a tile, the one charting most of equals',
      candidates: onceTwoStand(campSought),
    }),
    staying({
      sentence:
        "While at least three units that attack stand, a unit that attacks holding its action not the nearest the city's tile walks toward the nearest charted camp or site by the cheapest way over charted tiles, to the reachable tile that way weighs least from",
      candidates: marched,
    }),
    staying({
      sentence:
        "While at least two units that attack stand, a unit that attacks holding its action that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the cheapest reachable tile within five tiles of the city whose trial charts a tile, the one charting most of equals",
      candidates: onceTwoStand((catalogue, chronicle) =>
        chartingWalks(catalogue, chronicle, notMarching(chronicle), 5),
      ),
    }),
    staying({
      sentence:
        "A unit that attacks holding its action that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands",
      candidates: (catalogue, chronicle) =>
        garrisonRested(catalogue, chronicle, notMarching(chronicle)),
    }),
    staying({
      sentence:
        "A unit that attacks holding its action that is not marching, the nearest the city's tile or any while fewer than three stand, off the tiles the city may claim walks to the reachable tile nearest that ring, the nearest the city's tile of equals, where that is nearer the ring than where it stands",
      candidates: (catalogue, chronicle) =>
        garrisonWalkedHome(catalogue, chronicle, notMarching(chronicle)),
    }),
    staying({
      sentence:
        "Play a card aimed at a unit whose trial refreshes a unit's move points, on the unit that attacks holding its action furthest from the city that has spent them and stands on no camp or site",
      candidates: movePointsRefreshed,
    }),
    staying(GAIN_PLAYED),
    staying(STRIKING_DISCARDED),
    staying(HAND_CYCLED),
    TURN_ENDED,
  ];
}

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

/**
 * The numbers of the units that attack the march leaves home, whether they hold their action or not:
 * every one while fewer than three stand, else the garrison.
 */
function leftHome(chronicle: Chronicle): Set<number> {
  const attackers = attackersOf(chronicle);
  if (attackers.length < 3) return new Set(attackers.map(({ id }) => id));
  const garrison = garrisonOf(chronicle, attackers);
  return new Set(garrison === undefined ? [] : [garrison.id]);
}

/** The units that attack holding their action that the march leaves home. */
function notMarching(chronicle: Chronicle): Unit[] {
  const home = leftHome(chronicle);
  return attackersHoldingAction(chronicle).filter(({ id }) => home.has(id));
}

function populationAboveFloor(chronicle: Chronicle): boolean {
  return chronicle.population > Math.min(chronicle.held.length, 3);
}

function* campSought(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  if (chronicle.snapshots.some(({ tile }) => campOrSite(catalogue, chronicle, tile.building))) {
    return;
  }
  yield* chartingWalks(catalogue, chronicle, attackersHoldingAction(chronicle));
}

function* marched(catalogue: Catalogue, chronicle: Chronicle): Generator<Command> {
  const home = leftHome(chronicle);
  const order = tileOrder(chronicle);
  const targets = chronicle.snapshots
    .filter(({ tile }) => campOrSite(catalogue, chronicle, tile.building))
    .map(({ q, r }) => ({ q, r }));
  const passage = passageFor(chronicle, 'player');
  const { tiles, rivers } = chronicle;
  for (const unit of attackersHoldingAction(chronicle)) {
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

function movePointsRefreshed(catalogue: Catalogue, chronicle: Chronicle): Iterable<Command> {
  const { city } = chronicle;
  if (city === undefined) return [];
  const order = tileOrder(chronicle);
  const spent = ranked(
    attackersHoldingAction(chronicle).flatMap((unit) =>
      unit.movePoints < unit.stats.move && !campOrSiteSeenOn(catalogue, chronicle, unit.tile)
        ? [{ item: unit, rank: [-distance(unit.tile, city), order(unit.tile)] }]
        : [],
    ),
  );
  return playedOnUnits(
    catalogue,
    chronicle,
    spent,
    (unit, after) => movePointsRaisedOn(unit, after) !== undefined,
  );
}
