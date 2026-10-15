import { available } from './campaign';
import {
  actionSpent,
  aimOf,
  built,
  discarded,
  goesTo,
  lyingAs,
  playedThrough,
  refuses,
  retiled,
  steppedOnto,
  struck,
  throughRefusal,
} from './cards';
import {
  type Achievement,
  type AimedCard,
  achievementOf,
  ageOf,
  type Captured,
  type Catalogue,
  type Civilization,
  capstoneOf,
  captureOf,
  cardMade,
  cardOf,
  checkContent,
  costOf,
  entered,
  neutralScriptOf,
  neutralWorkerKind,
  technologyOf,
  unitKind,
  unitScript,
} from './catalogue';
import {
  assign,
  type CityCommand,
  cityCommand,
  claim,
  costPaid,
  declaredByLanding,
  grow,
  income,
  neutralAssigns,
  neutralClaims,
  neutralEntered,
  neutralPlayed,
  reassign,
  warDeclared,
} from './city';
import {
  enteredAround,
  enteredOnCamp,
  otherCityOn,
  pillaged,
  preparedAs,
  stepMove,
  wavesSent,
} from './enemies';
import {
  distance,
  type FeatureId,
  generateMap,
  type HexMap,
  runsAlong,
  type Terrain,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import { featureKind, refuse, terrainKind } from './map-kinds';
import { RESOURCES, type Resource, type Resources } from './resources';
import { nextRng, seedRng, shuffle as shuffleItems } from './rng';
import {
  answered,
  answerOf,
  answerRefusal,
  continued,
  events,
  offered,
  rewarded,
  timelineOf,
  unitDamaged,
} from './schedule';
import { charted, chartedAt, inOwnSight, inSight, unitsGone } from './sight';
import {
  type Aimed,
  type Change,
  change,
  changeFrom,
  changeOn,
  fall,
  followed,
  type Group,
  grouped,
  type Landed,
  landedAs,
  leaf,
  plays,
  type Sequence,
  type Stage,
  unchanged,
  walked,
} from './stages';
import {
  type Block,
  type CardId,
  type Chronicle,
  type ChronicleAchievement,
  type ChronicleCard,
  type CityFaction,
  capstoneLanded,
  onSettlePhase,
  playable,
  type Refusal,
  type Rewards,
  type Tally,
  type Timeline,
  unaffordable,
} from './state';
import {
  actsAsEnemy,
  attackable,
  canAttack,
  type Faction,
  FIRST_UNIT_NUMBER,
  type Landing,
  reachable,
  refreshedAction,
  refreshedMovePoints,
  relationsOf,
  type Unit,
  unitAt,
  unitOf,
} from './units';

export type Command =
  | { readonly type: 'end-turn' }
  /** One entry of the deal standing taken, named by its place in the order dealt. */
  | { readonly type: 'take'; readonly at: number }
  | ({ readonly type: 'play'; readonly index: number } & Aimed)
  | { readonly type: 'move'; readonly unit: number; readonly tile: TileCoords }
  | { readonly type: 'attack'; readonly unit: number; readonly tile: TileCoords }
  | CityCommand;

/**
 * What one unit of the player's, named by its number, is commanded by hand: crossing to a tile, or
 * attacking on one.
 */
export type UnitCommand = Extract<Command, { readonly unit: number }>;

/** One card of the hand played, aimed the way the card is: at nothing, a tile, a unit, the discard pile or the hand. */
export type PlayCommand = Extract<Command, { readonly type: 'play' }>;

/** A full hand. */
const HAND_SIZE = 5;

/** Nothing of every resource. */
const NOUGHT: Readonly<Resources> = {
  food: 0,
  production: 0,
  military: 0,
  money: 0,
  science: 0,
  culture: 0,
};

export function beginChronicle(
  catalogue: Catalogue,
  age: string,
  region: string,
  seed: number,
  civilization: Civilization,
  map: HexMap,
  timeline: Timeline,
  learned: readonly string[],
): Sequence {
  const { camp, neutral } = ageOf(catalogue, age);
  for (const coord of map.centre) {
    if (tileAt(map.tiles, coord) !== undefined) continue;
    refuse(
      catalogue,
      `the map's centre part names ${tileKey(coord)}, a tile the map does not hold`,
    );
  }
  const made = (id: CardId): ChronicleCard => cardMade(catalogue, id);
  const shuffled = shuffleItems(seedRng(seed), civilization.cards.map(made));
  const neutralTile =
    neutral === undefined
      ? undefined
      : map.tiles.find((tile) => tile.building === neutral.building);
  const neutralAt = neutralTile && { q: neutralTile.q, r: neutralTile.r };
  const begun: Chronicle = {
    content: catalogue.version,
    age,
    region,
    seed,
    rng: shuffled.rng,
    timeline,
    tiles: map.tiles,
    snapshots: [],
    rivers: map.rivers,
    centre: map.centre,
    citySection: { ...civilization.city },
    held: [],
    turn: 0,
    deals: [],
    resources: NOUGHT,
    population: 0,
    assigned: [],
    neutral: neutralAt && {
      city: neutralAt,
      held: [neutralAt],
      population: 1,
      assigned: [neutralAt],
      resources: NOUGHT,
    },
    relations: neutralAt && 'peace',
    units: [],
    nextUnit: FIRST_UNIT_NUMBER,
    drawPile: shuffled.items,
    hand: [civilization.city.card, ...civilization.settle].map(made),
    discardPile: [],
    exhaustPile: [],
    achievements: achievementsOfAvailableTechnologies(catalogue, age, learned),
  };
  const workerKind = neutral && neutralWorkerKind(catalogue, neutral);
  let guarded: Sequence =
    neutral === undefined || neutralAt === undefined || workerKind === undefined
      ? unchanged(begun)
      : entered(catalogue, begun, {
          type: workerKind,
          faction: 'neutral',
          script: neutralScriptOf(catalogue, neutral, workerKind),
          tile: neutralAt,
        });
  for (const { q, r, building } of map.tiles) {
    if (building !== camp.building) continue;
    guarded = followed(guarded, (left) => enteredOnCamp(catalogue, left, { q, r }, camp.opening));
  }
  const stood = charting(catalogue, begun, guarded.stages);
  const seen = stood.length === 0 ? charted(catalogue, guarded.chronicle) : outcome(stood);
  const raised = reachedOn(catalogue, seen, () => true);
  return {
    stages: [...stood, ...raised],
    chronicle: raised.length === 0 ? seen : outcome(raised),
  };
}

/** A technology the catalogue does not hold is refused, a learned one included. */
function achievementsOfAvailableTechnologies(
  catalogue: Catalogue,
  age: string,
  learned: readonly string[],
): ChronicleAchievement[] {
  for (const id of learned) technologyOf(catalogue, id);
  return Object.entries(ageOf(catalogue, age).achievements)
    .filter(([, { technology }]) => available(catalogue, technology, learned))
    .map(([id]) => ({ id, reached: false, tally: {} }));
}

/**
 * A chronicle launched in an age, on one of its regions: the seed deals the region's map, the
 * timeline rolled from the region's schedule takes the generator the map left as its own, and the
 * opening takes both from the same seed. The one place a map, a timeline and a chronicle share one.
 */
export function launched(
  catalogue: Catalogue,
  age: string,
  region: string,
  seed: number,
  civilization: Civilization,
  learned: readonly string[],
): Sequence {
  const map = generateMap(catalogue, ageOf(catalogue, age), region, seedRng(seed));
  const timeline = timelineOf(catalogue, age, region, map.rng);
  const { tiles, rivers, centre } = map;
  return beginChronicle(
    catalogue,
    age,
    region,
    seed,
    civilization,
    { tiles, rivers, centre },
    timeline,
    learned,
  );
}

/**
 * The one way a chronicle changes: every command the player has goes through here, and answers the
 * stages it resolves as — never none, each of them charted of what stood in sight when it ended. A
 * chronicle begun on another version of the content than the catalogue's is refused first.
 */
export function apply(catalogue: Catalogue, chronicle: Chronicle, command: Command): Stage[] {
  checkContent(catalogue, chronicle);
  return chartedAndRead(catalogue, chronicle, resolved(catalogue, chronicle, command));
}

/**
 * Stages built off the chronicle they started on, charted of what they see and read for what they
 * meet, as every command's are.
 */
export function chartedAndRead(
  catalogue: Catalogue,
  started: Chronicle,
  stages: readonly Stage[],
): Stage[] {
  return conditionsRead(catalogue, started, charting(catalogue, started, stages));
}

function conditionsRead(
  catalogue: Catalogue,
  started: Chronicle,
  stages: readonly Stage[],
): Stage[] {
  if (started.ending !== undefined) return [...stages];
  const { passes, fails } = capstoneOf(catalogue, started.timeline.capstone.id);
  // The events phase lands the capstone in the command whose tick reaches its turn, so a command
  // started on that turn or after starts past the landing.
  let landed = capstoneLanded(started);
  const passesNow = (chronicle: Chronicle): boolean =>
    landed && chronicle.ending === undefined && passes(catalogue, chronicle);
  const failsNow = (before: Chronicle, after: Chronicle): boolean =>
    landed && after.ending === undefined && fails?.(catalogue, before, after) === true;

  // Every stage was built off the chronicle the command started on, so the record a `reached` makes
  // is carried onto every stage after it here.
  let record = started.achievements;
  const carried = (chronicle: Chronicle): Chronicle =>
    chronicle.achievements === record ? chronicle : { ...chronicle, achievements: record };
  const keepsNoTally = ({ tallies }: Achievement): boolean => tallies === undefined;
  const recording = (chronicle: Chronicle): Change[] => {
    const raised = reachedOn(catalogue, chronicle, keepsNoTally);
    if (raised.length > 0) record = outcome(raised).achievements;
    return raised;
  };
  const ended = (chronicle: Chronicle): Stage[] => {
    const victorious = victory(chronicle);
    return [victorious, ...recording(victorious.chronicle)];
  };
  const failed = (chronicle: Chronicle): Stage[] => {
    const fallen = fall(chronicle, 'capstone');
    return [...fallen.stages, ...recording(fallen.chronicle)];
  };

  let over = false;
  let before = started;
  const walk = (held: readonly Stage[]): Stage[] => {
    const walked: Stage[] = [];
    for (const stage of held) {
      switch (stage.kind) {
        case 'change': {
          const own = carried(stage.chronicle);
          walked.push(own === stage.chronicle ? stage : { ...stage, chronicle: own });
          walked.push(...recording(own));
          const last = walked[walked.length - 1].chronicle;
          if (passesNow(last)) {
            over = true;
            return [...walked, ...ended(last)];
          }
          if (failsNow(before, last)) {
            over = true;
            return [...walked, ...failed(last)];
          }
          before = last;
          break;
        }
        case 'group': {
          const inner = walk(stage.stages);
          const trailing = stage.stages[stage.stages.length - 1];
          const chronicle =
            over || (trailing !== undefined && trailing.chronicle === stage.chronicle)
              ? inner[inner.length - 1].chronicle
              : carried(stage.chronicle);
          const same =
            chronicle === stage.chronicle &&
            inner.length === stage.stages.length &&
            inner.every((child, at) => child === stage.stages[at]);
          walked.push(same ? stage : { ...stage, stages: inner, chronicle });
          if (over) return walked;
          switch (stage.name) {
            case 'capstone-landing':
              landed = true;
              if (passesNow(chronicle)) {
                over = true;
                return [...walked, ...ended(chronicle)];
              }
              break;
            case 'capstone-continued':
            case 'played':
            case 'refused':
            case 'assign':
            case 'claim':
            case 'neutral-played':
            case 'strike':
            case 'income':
            case 'grow':
            case 'turn':
            case 'enemy-phase':
            case 'deal':
            case 'answer':
            case 'reward':
            case 'attack':
            case 'capture':
              break;
          }
          break;
        }
      }
    }
    return walked;
  };
  const read = walk(stages);
  const left = outcome(read);
  if (left.ending !== undefined) return read;

  const tallied: Change[] = [];
  let standing = left;
  for (const [at, held] of left.achievements.entries()) {
    const { tallies } = achievementOf(catalogue, left.age, held.id);
    if (held.reached || tallies === undefined) continue;
    const tally = tallies(catalogue, started, read, held.tally);
    if (sameTally(tally, held.tally)) continue;
    standing = {
      ...standing,
      achievements: standing.achievements.map((other, place) =>
        place === at ? { ...other, tally } : other,
      ),
    };
    tallied.push(change('tallied', standing));
  }
  const keepsTally = ({ tallies }: Achievement): boolean => tallies !== undefined;
  return [...read, ...tallied, ...reachedOn(catalogue, standing, keepsTally)];
}

/** The count of an achievement of the chronicle's row, read on the chronicle beside its tally. */
export function countOn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  { id, tally }: ChronicleAchievement,
): number {
  return achievementOf(catalogue, chronicle.age, id).count(catalogue, chronicle, tally);
}

/**
 * A `reached` for each achievement of the row not yet reached, among those `reads` admits, that its
 * count meets on the chronicle, in the order of the row, each carrying the record of the ones before
 * it.
 */
function reachedOn(
  catalogue: Catalogue,
  chronicle: Chronicle,
  reads: (achievement: Achievement) => boolean,
): Change[] {
  const raised: Change[] = [];
  let standing = chronicle;
  for (const [at, held] of chronicle.achievements.entries()) {
    if (held.reached) continue;
    const achievement = achievementOf(catalogue, standing.age, held.id);
    if (!reads(achievement)) continue;
    if (countOn(catalogue, standing, held) < achievement.need) continue;
    standing = {
      ...standing,
      achievements: standing.achievements.map((held, other) =>
        other === at ? { ...held, reached: true } : held,
      ),
    };
    raised.push(change('reached', standing));
  }
  return raised;
}

/**
 * An achievement's tally and count for the turns on which that many cards were played: a turn is
 * counted once, by the play that brings it to the number, and the settle phase never.
 */
export function turnsPlaying(cards: number): Required<Pick<Achievement, 'tallies' | 'count'>> {
  if (!Number.isInteger(cards) || cards < 1) {
    throw new Error(`a turn is counted at a whole number of cards, one at least, not ${cards}`);
  }
  return {
    tallies: (_catalogue, started, stages, tally) => {
      const played = plays(stages).length;
      if (played === 0 || onSettlePhase(started)) return tally;
      const before = tally.turn === started.turn ? (tally.played ?? 0) : 0;
      const after = before + played;
      const counted = before < cards && after >= cards ? 1 : 0;
      return { turn: started.turn, played: after, turns: (tally.turns ?? 0) + counted };
    },
    count: (_catalogue, _chronicle, tally) => tally.turns ?? 0,
  };
}

/**
 * An achievement's tally and count for the kinds of terrain a card was played on, each read as the
 * tile stood when the card was played; a play aimed at no tile counts none. A card the catalogue does
 * not hold is refused.
 */
export function terrainsPlayedOn(card: CardId): Required<Pick<Achievement, 'tallies' | 'count'>> {
  return {
    tallies: (catalogue, started, stages, tally) => {
      cardOf(catalogue, card);
      let kept = tally;
      for (const play of plays(stages)) {
        if (play.card !== card) continue;
        const aimedAt = tileAimed(play.aimed);
        if (aimedAt === undefined) continue;
        const terrain = tileAt(started.tiles, aimedAt)?.terrain;
        if (terrain === undefined) continue;
        kept = { ...kept, [terrain]: (kept[terrain] ?? 0) + 1 };
      }
      return kept;
    },
    count: (_catalogue, _chronicle, tally) => Object.keys(tally).length,
  };
}

/** The ground a card's plays are counted on. */
export type PlayedGround =
  | { readonly on: 'anywhere' }
  | { readonly on: 'river' }
  | { readonly on: 'feature'; readonly feature: FeatureId };

/**
 * An achievement's tally and count for the plays of a card on a ground, read on the tile as it stood
 * when the card was played, a play aimed at a unit on its unit's tile; a play aimed at no tile counts
 * on no ground naming a tile. A card or a feature the catalogue does not hold is refused.
 */
export function playsOn(
  card: CardId,
  ground: PlayedGround,
): Required<Pick<Achievement, 'tallies' | 'count'>> {
  return {
    tallies: (catalogue, started, stages, tally) => {
      cardOf(catalogue, card);
      if (ground.on === 'feature') featureKind(catalogue, ground.feature);
      const counted = plays(stages).filter(
        (play) => play.card === card && onGround(started, tileAimed(play.aimed), ground),
      ).length;
      return counted === 0 ? tally : { ...tally, plays: (tally.plays ?? 0) + counted };
    },
    count: (_catalogue, _chronicle, tally) => tally.plays ?? 0,
  };
}

/** Whether a play aimed at that tile, or at none, stands on the ground on the chronicle. */
function onGround(chronicle: Chronicle, at: TileCoords | undefined, ground: PlayedGround): boolean {
  switch (ground.on) {
    case 'anywhere':
      return true;
    case 'river':
      return at !== undefined && runsAlong(chronicle.rivers, at);
    case 'feature':
      return at !== undefined && tileAt(chronicle.tiles, at)?.feature === ground.feature;
  }
}

/**
 * An achievement's tally and count for the units the attacks of the player's units of a kind kill,
 * the attacker read as it stood when the attack began. A kind the catalogue does not hold is refused.
 */
export function unitsKilledBy(kind: string): Required<Pick<Achievement, 'tallies' | 'count'>> {
  return {
    tallies: (catalogue, started, stages, tally) => {
      unitKind(catalogue, kind);
      let before = started;
      let counted = 0;
      for (const stage of walked(stages)) {
        if (stage.kind === 'group' && stage.name === 'attack') {
          const attacker = unitAt(before.units, stage.attacker);
          const killed = stage.stages.some(
            (held) => held.kind === 'change' && held.name === 'killed',
          );
          if (killed && attacker?.faction === 'player' && attacker.stats.type === kind) {
            counted += 1;
          }
        }
        if (leaf(stage)) before = stage.chronicle;
      }
      return counted === 0 ? tally : { ...tally, killed: (tally.killed ?? 0) + counted };
    },
    count: (_catalogue, _chronicle, tally) => tally.killed ?? 0,
  };
}

/**
 * An achievement's tally and count for the amount of a resource gained from the tiles of a terrain:
 * what each `stock` carrying a tile of it raised, the tile read as it stood when it gave. A terrain
 * the catalogue does not hold is refused.
 */
export function gainedFrom(
  resource: Resource,
  terrain: Terrain,
): Required<Pick<Achievement, 'tallies' | 'count'>> {
  return {
    tallies: (catalogue, started, stages, tally) => {
      terrainKind(catalogue, terrain);
      let before = started;
      let gained = 0;
      for (const stage of walked(stages)) {
        if (
          stage.kind === 'change' &&
          stage.name === 'stock' &&
          stage.tile !== undefined &&
          tileAt(before.tiles, stage.tile)?.terrain === terrain
        ) {
          gained += stage.chronicle.resources[resource] - before.resources[resource];
        }
        if (leaf(stage)) before = stage.chronicle;
      }
      return gained === 0 ? tally : { ...tally, gained: (tally.gained ?? 0) + gained };
    },
    count: (_catalogue, _chronicle, tally) => tally.gained ?? 0,
  };
}

/**
 * An achievement's tally and count for the times the draw pile is emptied: each draw that takes its
 * last card, whether a shuffle follows it or not. A dry pile with nothing to draw counts nothing.
 */
export function drawPileEmptied(): Required<Pick<Achievement, 'tallies' | 'count'>> {
  return {
    tallies: (_catalogue, started, stages, tally) => {
      let before = started;
      let counted = 0;
      for (const stage of walked(stages)) {
        if (
          stage.kind === 'change' &&
          stage.name === 'drawn' &&
          before.drawPile.length > 0 &&
          stage.chronicle.drawPile.length === 0
        ) {
          counted += 1;
        }
        if (leaf(stage)) before = stage.chronicle;
      }
      return counted === 0 ? tally : { ...tally, emptied: (tally.emptied ?? 0) + counted };
    },
    count: (_catalogue, _chronicle, tally) => tally.emptied ?? 0,
  };
}

/** The tile a play was aimed at, the one its unit stands on for a play aimed at a unit. */
function tileAimed(aimed: Aimed): TileCoords | undefined {
  switch (aimed.aim) {
    case 'tile':
    case 'unit':
      return aimed.tile;
    case 'none':
    case 'discard-pile':
    case 'hand':
      return undefined;
  }
}

/** Whether two tallies hold the same numbers under the same names. */
function sameTally(one: Tally, other: Tally): boolean {
  const names = Object.keys(one);
  return (
    names.length === Object.keys(other).length &&
    names.every((name) => Object.hasOwn(other, name) && one[name] === other[name])
  );
}

/** The stages a command resolves as before the map is charted. */
function resolved(catalogue: Catalogue, chronicle: Chronicle, command: Command): readonly Stage[] {
  if (refusedAhead(chronicle, command)) return refused(chronicle).stages;
  return stagesOf(catalogue, chronicle, command).stages;
}

/**
 * Whether the chronicle refuses the command before anything of it resolves: an ended one every
 * command, and one waiting on a deal every command but the take.
 */
function refusedAhead(chronicle: Chronicle, command: Command): boolean {
  return chronicle.ending !== undefined || (chronicle.deals.length > 0 && command.type !== 'take');
}

/** A command the rules turned down: one `refused` group holding nothing, on the chronicle as it stood. */
function refused(chronicle: Chronicle): Sequence<Group> {
  return grouped({ name: 'refused' }, unchanged(chronicle));
}

/**
 * Every leaf of the tree with its own chronicle charted, in the order the walk plays them, each
 * carrying on from the snapshots the leaf before it left: every stage a command resolves as is built
 * off the chronicle the command started on, so the snapshots its own chronicle carries are that
 * one's. A `charted` change has its tile's snapshot taken here, as the change's chronicle stands. The
 * units leave the snapshots here, on the `turn` change, because the snapshots a leaf's own chronicle
 * carries are stale by a turn. A group holding stages leaves its last stage's charted chronicle, or
 * its own charted where a draw of the generator rode on it past its last stage. A command that
 * charted nothing hands back the very stages it was given.
 */
function charting(catalogue: Catalogue, started: Chronicle, stages: readonly Stage[]): Stage[] {
  let standing = started.snapshots;
  let turn = started.turn;
  const seen = <Settled extends Stage>(stage: Settled, at: TileCoords | undefined): Settled => {
    if (stage.chronicle.turn !== turn) standing = unitsGone(standing);
    turn = stage.chronicle.turn;
    const carried =
      stage.chronicle.snapshots === standing
        ? stage.chronicle
        : { ...stage.chronicle, snapshots: standing };
    const left = charted(catalogue, at === undefined ? carried : chartedAt(catalogue, carried, at));
    standing = left.snapshots;
    return left === stage.chronicle ? stage : { ...stage, chronicle: left };
  };
  const chart = (stage: Stage): Stage => {
    switch (stage.kind) {
      case 'change':
        return seen(stage, chartedOn(stage));
      case 'group': {
        if (stage.stages.length === 0) return seen(stage, undefined);
        const held = stage.stages.map(chart);
        if (held.every((child, at) => child === stage.stages[at])) return stage;
        const last = stage.stages[stage.stages.length - 1];
        if (stage.chronicle !== last.chronicle) return { ...seen(stage, undefined), stages: held };
        return { ...stage, stages: held, chronicle: held[held.length - 1].chronicle };
      }
    }
  };
  return stages.map(chart);
}

/** The tile a change charts whatever sees it, and nothing for every change but `charted`. */
function chartedOn(stage: Change): TileCoords | undefined {
  switch (stage.name) {
    case 'charted':
      return stage.tile;
    case 'enter':
    case 'move':
    case 'damaged':
    case 'healed':
    case 'killed':
    case 'refreshed':
    case 'action-spent':
    case 'prepare':
    case 'wave-sent':
    case 'camp-joined':
    case 'retiled':
    case 'held':
    case 'settled':
    case 'stock':
    case 'population':
    case 'assigned':
    case 'added':
    case 'drawn':
    case 'discarded':
    case 'exhausted':
    case 'recalled':
    case 'shuffled':
    case 'counters-set':
    case 'banished':
    case 'turn':
    case 'rolled':
    case 'shown':
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

/** What each command resolves as. */
function stagesOf(catalogue: Catalogue, chronicle: Chronicle, command: Command): Sequence {
  switch (command.type) {
    case 'end-turn':
      return endOfTurn(catalogue, chronicle);
    case 'take':
      return take(catalogue, chronicle, command.at);
    case 'play':
      return play(catalogue, chronicle, command);
    case 'move':
      return move(catalogue, chronicle, command);
    case 'attack':
      return attack(catalogue, chronicle, command);
    case 'assign':
      return acted(chronicle, 'assign', assign(catalogue, chronicle, command.tile));
    case 'reassign':
      return acted(chronicle, 'assign', reassign(chronicle, command.from, command.to));
    case 'claim':
      return acted(
        chronicle,
        'claim',
        cityCommand(catalogue, chronicle, command.tile)?.type === 'claim'
          ? claim(catalogue, chronicle, 'player', command.tile)
          : undefined,
      );
  }
}

/**
 * One act of the city's: the changes the rules answered with, grouped under the name the act is
 * staged as, and `refused` where they answered nothing.
 */
function acted(
  chronicle: Chronicle,
  name: 'assign' | 'claim',
  landing: Landed | undefined,
): Sequence<Group> {
  return landing === undefined ? refused(chronicle) : grouped({ name }, landing);
}

/** The chronicle a command left: the last stage's, for whoever wants the state and not the play. */
export function outcome(stages: readonly Stage[]): Chronicle {
  return stages[stages.length - 1].chronicle;
}

/** Steps resolved one after another, each on the chronicle the one before left. */
function course(chronicle: Chronicle, steps: readonly ((left: Chronicle) => Sequence)[]): Sequence {
  let resolving: Sequence = unchanged(chronicle);
  for (const step of steps) resolving = followed(resolving, step);
  return resolving;
}

/** One change where a step moved its row, and nothing where it left the chronicle as it stood. */
function moved(name: 'drawn' | 'shuffled', before: Chronicle, after: Chronicle): Landed {
  return after === before ? unchanged(before) : landedAs(change(name, after));
}

function endOfTurn(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  switch (endOfTurnAs(chronicle)) {
    case 'refused':
      return refused(chronicle);
    case 'opening':
      return opened(catalogue, chronicle);
    case 'cities':
      return course(chronicle, [
        (left) => citiesHalf(catalogue, left).growth,
        (left) => enemyPhase(catalogue, left),
        (left) => captures(catalogue, left),
        (left) => openedUnlessDealt(catalogue, left),
      ]);
  }
}

/**
 * How ending the turn resolves on the chronicle: refused where the chronicle refuses it ahead or no
 * city is settled, the opening alone on the settle phase, and from the cities' half on every turn
 * after it.
 */
function endOfTurnAs(chronicle: Chronicle): 'refused' | 'opening' | 'cities' {
  if (refusedAhead(chronicle, { type: 'end-turn' }) || chronicle.city === undefined) {
    return 'refused';
  }
  return onSettlePhase(chronicle) ? 'opening' : 'cities';
}

/**
 * The cities' half of the end of turn, income, the strikes, the discard and growth: what the strikes
 * leave, and what growth leaves after them.
 */
function citiesHalf(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly strikes: Sequence; readonly growth: Sequence } {
  const earned = grouped(
    { name: 'income' },
    everyCity(chronicle, (city, whose) => income(catalogue, city, whose)),
  );
  const strikes = followed(earned, (left) => struck(catalogue, left));
  const discarding = followed<Stage>(strikes, (left) => discarded(left, everyPlace(left.hand)));
  const growth = followed<Stage>(discarding, (left) =>
    grouped({ name: 'grow' }, everyCity(left, grow)),
  );
  return { strikes, growth };
}

/** What ending the turn now would do to the player's city, read off the end of turn's own steps. */
export type Reckoning = {
  /** Each stock's income less the whole of what the strikes asked of it, past nothing included. */
  readonly stocks: Resources;
  /** The stocks the strikes take past nothing. */
  readonly pastNothing: ReadonlySet<Resource>;
  /** The population growth brings, or the strikes take. */
  readonly population: number;
};

/**
 * The cities' half as ending the turn would run it on the chronicle: the stocks read as the strikes
 * leave them, before growth spends food, and the population after it; nothing where it runs none.
 */
export function reckoned(catalogue: Catalogue, chronicle: Chronicle): Reckoning | undefined {
  if (endOfTurnAs(chronicle) !== 'cities') return undefined;
  const { strikes, growth } = citiesHalf(catalogue, chronicle);
  const uncovered = { ...NOUGHT };
  for (const stage of walked(strikes.stages)) {
    if (stage.kind !== 'change' || stage.name !== 'population') continue;
    if (stage.uncovered === undefined) continue;
    uncovered[stage.uncovered.resource] += stage.uncovered.amount;
  }
  const stocks = { ...NOUGHT };
  for (const resource of RESOURCES) {
    stocks[resource] =
      strikes.chronicle.resources[resource] - chronicle.resources[resource] - uncovered[resource];
  }
  return {
    stocks,
    pastNothing: new Set(RESOURCES.filter((resource) => uncovered[resource] > 0)),
    population: growth.chronicle.population - chronicle.population,
  };
}

/** A step of the end of turn taken by every city in turn: the player's, then the neutral's. */
function everyCity(
  chronicle: Chronicle,
  step: (left: Chronicle, whose: CityFaction) => Landed,
): Landed {
  return followed(step(chronicle, 'player'), (left) => step(left, 'neutral'));
}

function opened(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  return course(chronicle, [
    ticked,
    drawn,
    (left) => continued(catalogue, left),
    (left) => events(catalogue, left),
  ]);
}

function openedUnlessDealt(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  return chronicle.deals.length > 0 ? unchanged(chronicle) : opened(catalogue, chronicle);
}

function ticked(chronicle: Chronicle): Sequence<Group> {
  let tick = landedAs(change('turn', { ...chronicle, turn: chronicle.turn + 1 }));
  if (onSettlePhase(chronicle) && chronicle.hand.length > 0) {
    tick = followed(tick, (left) =>
      landedAs(changeFrom('banished', everyPlace(left.hand), { ...left, hand: [] })),
    );
  }
  for (const unit of chronicle.units) {
    tick = followed(tick, (left) => refreshedUnit(left, unit));
  }
  return grouped({ name: 'turn' }, tick);
}

/** One unit's move points and action brought back up to full, and nothing where both are. */
function refreshedUnit(chronicle: Chronicle, unit: Unit): Landed {
  if (unit.movePoints === unit.stats.move && unit.action === unit.stats.action) {
    return unchanged(chronicle);
  }
  return landedAs(
    changeOn('refreshed', unit.tile, {
      ...chronicle,
      units: chronicle.units.map((other) =>
        other.id === unit.id ? refreshedAction(refreshedMovePoints(other)) : other,
      ),
    }),
  );
}

/**
 * One entry of the deal standing taken, by its place in the order dealt. The turn's event is dealt
 * behind every capture's rewards, so an answer resolves nothing after its landing, and the last
 * reward taken resumes the end of turn at its opening.
 */
function take(catalogue: Catalogue, chronicle: Chronicle, at: number): Sequence {
  const [deal, ...waiting] = chronicle.deals;
  if (deal === undefined) return refused(chronicle);
  const id = offered(catalogue, deal)[at];
  if (id === undefined) return refused(chronicle);

  const taken = landedAs(change('taken', { ...chronicle, deals: waiting }));
  switch (deal.of) {
    case 'event': {
      if (!playable(answerRefusal(catalogue, chronicle, deal.event, id))) {
        return refused(chronicle);
      }
      const answer = answerOf(catalogue, deal.event, id);
      return grouped(
        { name: 'answer' },
        followed(taken, (left) => answered(catalogue, left, answer)),
      );
    }
    case 'capture': {
      const rewarding = grouped(
        { name: 'reward' },
        followed(taken, (left) => rewarded(catalogue, left, id, deal.rewards[id])),
      );
      return followed<Stage>(rewarding, (left) => openedUnlessDealt(catalogue, left));
    }
  }
}

/**
 * What fills the hand: the draw, the shuffle a dry draw pile needs, and the draw that follows it,
 * each where it moved cards.
 */
function drawn(chronicle: Chronicle): Landed {
  return followed(
    followed(moved('drawn', chronicle, draw(chronicle)), (left) =>
      moved('shuffled', left, shuffle(left)),
    ),
    (left) => moved('drawn', left, draw(left)),
  );
}

/** The capstone passed: the chronicle records the turn it ended on, and ends there. */
function victory(chronicle: Chronicle): Change {
  return change('ended', { ...chronicle, ending: { outcome: 'victory', turn: chronicle.turn } });
}

export function refusalOf(catalogue: Catalogue, chronicle: Chronicle, id: CardId): Refusal {
  return {
    unaffordable: unaffordable(chronicle, costOf(catalogue, id)),
    blocked: blocked(catalogue, chronicle, id),
  };
}

/**
 * Every tile a card's aim admits, what the aim refuses the whole of the filter. The one list the
 * play and the map a card is aimed over both read.
 */
export function admitted(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: AimedCard,
): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => refuses(catalogue, chronicle, card, tile) === undefined)
    .map(({ q, r }) => ({ q, r }));
}

/**
 * Every block a card the city can pay for still stands against: there is nothing for it to resolve
 * on. A card aimed at the hand is judged as one the hand holds, so a hand of one card blocks it.
 */
function blocked(catalogue: Catalogue, chronicle: Chronicle, id: CardId): Block[] {
  const card = aimOf(cardOf(catalogue, id));
  switch (card.aim) {
    case 'none':
      return card.blocked?.(catalogue, chronicle) ?? [];
    case 'discard-pile':
      return chronicle.discardPile.length === 0 ? ['discard-pile'] : [];
    case 'hand':
      return chronicle.hand.length <= 1 ? ['hand'] : [];
    case 'tile':
    case 'unit':
      return [];
  }
}

/**
 * One card played: the aim is judged on the chronicle as it stands, the same one the map lit its
 * tiles from; then, in the one `played` group, the card leaves the hand, its cost is paid, and its
 * effect lands; a play refused is `refused`, nothing paid or discarded.
 */
function play(catalogue: Catalogue, chronicle: Chronicle, command: PlayCommand): Sequence {
  const held = chronicle.hand[command.index];
  if (held === undefined || !playable(refusalOf(catalogue, chronicle, held.id))) {
    return refused(chronicle);
  }
  const effect = aimedEffect(catalogue, chronicle, held.id, command);
  if (effect === undefined) return refused(chronicle);

  const costs = costOf(catalogue, held.id);
  const cost = (left: Chronicle): Landed => costPaid(left, 'player', costs);
  return grouped(
    { name: 'played', card: held.id, aimed: aimedBy(command) },
    followed(followed(landedAs(playedAway(catalogue, chronicle, command.index)), cost), effect),
  );
}

/** The card at that place of the hand leaving it played, for where it goes and as the card it goes as. */
function playedAway(catalogue: Catalogue, chronicle: Chronicle, index: number): Change {
  const hand = chronicle.hand.filter((_, at) => at !== index);
  const lying = lyingAs(catalogue, chronicle.hand[index]);
  switch (goesTo(cardOf(catalogue, lying.id))) {
    case 'discard-pile':
      return changeFrom('discarded', [index], {
        ...chronicle,
        hand,
        discardPile: [...chronicle.discardPile, lying],
      });
    case 'exhaust-pile':
      return changeFrom('exhausted', [index], {
        ...chronicle,
        hand,
        exhaustPile: [...chronicle.exhaustPile, lying],
      });
    case 'nowhere':
      return changeFrom('banished', [index], { ...chronicle, hand });
  }
}

/** What a play aimed its card at, the hand's place it played from aside. */
function aimedBy(command: PlayCommand): Aimed {
  switch (command.aim) {
    case 'none':
      return { aim: 'none' };
    case 'tile':
      return command.through === undefined
        ? { aim: 'tile', tile: command.tile }
        : { aim: 'tile', tile: command.tile, through: command.through };
    case 'unit':
      return { aim: 'unit', tile: command.tile };
    case 'discard-pile':
    case 'hand':
      return { aim: command.aim, card: command.card };
  }
}

/**
 * The card's effect with what the play aimed it at, judged before anything is paid; `undefined`
 * refuses the play, and so does a play aimed another way than the card. It takes a tile or a unit the
 * aim admits — through a unit beside the tile, the one that can be, or the one of several the play
 * names — a place the discard pile holds, or another card of the hand, which the effect takes one
 * place earlier when it lay after the card played.
 */
function aimedEffect(
  catalogue: Catalogue,
  chronicle: Chronicle,
  id: CardId,
  command: PlayCommand,
): ((paid: Chronicle) => Landed) | undefined {
  const card = aimOf(cardOf(catalogue, id));
  switch (card.aim) {
    case 'none':
      return command.aim === 'none' ? (paid) => card.effect(catalogue, paid) : undefined;
    case 'tile': {
      if (command.aim !== 'tile') return undefined;
      const { tile, through: named } = command;
      const at = admittedAt(catalogue, chronicle, card, tile);
      if (at === undefined) return undefined;
      if (card.through === undefined) {
        return named === undefined ? (paid) => card.effect(catalogue, paid, tile) : undefined;
      }
      if (named !== undefined) {
        if (throughRefusal(catalogue, chronicle, card, at, named) !== undefined) return undefined;
        return (paid) => card.effect(catalogue, paid, tile, named);
      }
      const units = playedThrough(catalogue, chronicle, card, at);
      if (units.length !== 1) return undefined;
      const through = units[0].tile;
      return (paid) => card.effect(catalogue, paid, tile, through);
    }
    case 'unit': {
      if (command.aim !== 'unit') return undefined;
      const { tile } = command;
      if (admittedAt(catalogue, chronicle, card, tile) === undefined) return undefined;
      return (paid) => card.effect(catalogue, paid, tile);
    }
    case 'discard-pile': {
      if (command.aim !== 'discard-pile') return undefined;
      const at = command.card;
      if (at < 0 || at >= chronicle.discardPile.length) return undefined;
      return (paid) => card.effect(catalogue, paid, at);
    }
    case 'hand': {
      if (command.aim !== 'hand') return undefined;
      const at = command.card;
      if (at === command.index || chronicle.hand[at] === undefined) return undefined;
      const left = at > command.index ? at - 1 : at;
      return (paid) => card.effect(catalogue, paid, left);
    }
  }
}

/** The tile of the map a card is played at, and nothing where its aim does not admit it. */
function admittedAt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: AimedCard,
  tile: TileCoords,
): Tile | undefined {
  const at = tileKey(tile);
  if (!admitted(catalogue, chronicle, card).some((coord) => tileKey(coord) === at)) {
    return undefined;
  }
  return tileAt(chronicle.tiles, tile);
}

export function byHand(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
): { readonly landings: Landing[]; readonly targets: Unit[] } {
  if (onSettlePhase(chronicle)) return { landings: [], targets: [] };
  const seen = inSight(catalogue, chronicle);
  const targets = attackable(chronicle.units, unit, relationsOf(chronicle));
  return {
    landings: reachable(catalogue, chronicle, unit),
    targets: targets.filter((target) => seen.has(tileKey(target.tile))),
  };
}

/** Whether a command declares war: whether what it resolves as raises the neutral's `relations`. */
export function declaresWar(catalogue: Catalogue, chronicle: Chronicle, command: Command): boolean {
  return [...walked(resolved(catalogue, chronicle, command))].some(
    (stage) => stage.name === 'relations',
  );
}

/**
 * One unit crossing to a landing, spending what the crossing costs: what its landing declares, then
 * the one `move` change.
 */
function crossed(chronicle: Chronicle, unit: Unit, landing: Landing): Landed {
  return followed(declaredByLanding(chronicle, unit, landing.tile), (left) =>
    landedAs({
      kind: 'change',
      name: 'move',
      from: unit.tile,
      to: landing.tile,
      chronicle: {
        ...left,
        units: left.units.map((other) =>
          other.id === unit.id
            ? { ...other, tile: landing.tile, movePoints: other.movePoints - landing.cost }
            : other,
        ),
      },
    }),
  );
}

/**
 * One unit of the player's crossing to a tile its move points reach at the cheapest route there;
 * any other unit's, or a move `byHand` does not offer, is `refused`.
 */
function move(catalogue: Catalogue, chronicle: Chronicle, command: UnitCommand): Sequence {
  const unit = unitOf(chronicle.units, command.unit);
  if (unit === undefined || unit.faction !== 'player') return refused(chronicle);

  const landing = byHand(catalogue, chronicle, unit).landings.find(
    (reached) => tileKey(reached.tile) === tileKey(command.tile),
  );
  if (landing === undefined) return refused(chronicle);
  return crossed(chronicle, unit, landing);
}

/**
 * One unit of the player's attacking what stands on a tile, the declaration of war the attack may
 * raise first in its `attack` group; any other unit's, or an attack `byHand` does not offer, is
 * `refused`.
 */
function attack(catalogue: Catalogue, chronicle: Chronicle, command: UnitCommand): Sequence {
  const unit = unitOf(chronicle.units, command.unit);
  if (unit === undefined || unit.faction !== 'player') return refused(chronicle);

  const target = byHand(catalogue, chronicle, unit).targets.find(
    (other) => tileKey(other.tile) === tileKey(command.tile),
  );
  if (target === undefined) return refused(chronicle);
  const opening = target.faction === 'neutral' ? warDeclared(chronicle) : unchanged(chronicle);
  return blow(opening, unit, target);
}

/**
 * One attack, whoever makes it, on what `opening` raised: the `attack` group carrying both tiles,
 * over those, the attacker's action spent and then the target losing the attacker's damage or killed
 * by it. Nobody moves.
 */
function blow(opening: Landed, attacker: Unit, target: Unit): Sequence<Group> {
  return grouped(
    { name: 'attack', attacker: attacker.tile, target: target.tile },
    followed(
      followed(opening, (left) => actionSpent(left, attacker.tile)),
      (left) => unitDamaged(left, target.tile, attacker.stats.damage),
    ),
  );
}

/** Cards off the draw pile into the hand, up to a full hand or as far as the pile goes. */
function draw(chronicle: Chronicle): Chronicle {
  const taken = Math.min(HAND_SIZE - chronicle.hand.length, chronicle.drawPile.length);
  if (taken <= 0) return chronicle;
  return {
    ...chronicle,
    hand: [...chronicle.hand, ...chronicle.drawPile.slice(0, taken)],
    drawPile: chronicle.drawPile.slice(taken),
  };
}

/** The discard pile shuffled into a draw pile that ran out, while the hand is still short. */
function shuffle(chronicle: Chronicle): Chronicle {
  if (chronicle.hand.length >= HAND_SIZE) return chronicle;
  if (chronicle.drawPile.length > 0 || chronicle.discardPile.length === 0) return chronicle;

  const shuffled = shuffleItems(chronicle.rng, chronicle.discardPile);
  return { ...chronicle, rng: shuffled.rng, drawPile: shuffled.items, discardPile: [] };
}

/** Every place of a pile, in pile order. */
function everyPlace(pile: readonly ChronicleCard[]): number[] {
  return pile.map((_, at) => at);
}

/**
 * The enemies' half of the turn, the one `enemy-phase` group, in the order `docs/CHRONICLE.md`'s
 * _The turn_ gives, the player's city's capture's `ended` alone in it; only the units standing as it
 * began act.
 */
function enemyPhase(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  let phase: Sequence = followed(preparesLanded(catalogue, chronicle), (left) =>
    wavesSent(catalogue, left),
  );
  const actingAs = (faction: ScriptedFaction): void => {
    for (const { id } of chronicle.units) {
      phase = followed(phase, (left) => scriptedActs(catalogue, left, id, faction));
    }
  };
  actingAs('neutral');
  phase = followed<Stage>(phase, (left) => neutralClaims(catalogue, left));
  phase = followed<Stage>(phase, (left) => neutralAssigns(catalogue, left));
  phase = followed(phase, (left) => neutralEntered(catalogue, left));
  actingAs('enemy');
  return grouped(
    { name: 'enemy-phase' },
    followed(phase, (left) => campsRolled(catalogue, left)),
  );
}

/**
 * Every unit still carrying a prepare landing it, the captures ahead of every pillage: one prepared
 * on the player's city's tile captures it, ending the chronicle there; one on the neutral's captures
 * that; and each of the rest pillages its tile in unit order, its prepare gone.
 */
function preparesLanded(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  const landingOn = (on: Chronicle, unit: Unit): CityFaction | undefined =>
    otherCityOn(on, unit.tile, unit.faction);
  const preparing = chronicle.units
    .filter((unit) => preparedAs(chronicle, unit) !== undefined)
    .sort(
      (one, other) =>
        landingOrder(landingOn(chronicle, one)) - landingOrder(landingOn(chronicle, other)),
    );
  let landing: Sequence = unchanged(chronicle);
  for (const unit of preparing) {
    landing = followed<Stage>(landing, (left) => {
      switch (landingOn(left, unit)) {
        case 'player':
          return fall(left, 'capture');
        case 'neutral':
          return capturedByTheEnemies(catalogue, left, unit);
        case undefined: {
          const tile = tileAt(left.tiles, unit.tile);
          const bare = tile === undefined ? undefined : pillaged(catalogue, left, tile);
          const taken = bare === undefined ? unchanged(left) : retiled(left, unit.tile, () => bare);
          return followed(taken, (after) => carriedPrepare(after, unit, false));
        }
      }
    });
  }
  return landing;
}

/** Where a prepare landing on a city's tile, or on none, lands among the phase's: the player's first. */
function landingOrder(city: CityFaction | undefined): number {
  switch (city) {
    case 'player':
      return 0;
    case 'neutral':
      return 1;
    case undefined:
      return 2;
  }
}

/** Whether the unit carries a prepare, set as named: the one `prepare` change. */
function carriedPrepare(chronicle: Chronicle, preparing: Unit, prepared: boolean): Landed {
  return landedAs(
    changeOn('prepare', preparing.tile, {
      ...chronicle,
      units: chronicle.units.map((unit) =>
        unit.id === preparing.id ? withPrepare(unit, prepared) : unit,
      ),
    }),
  );
}

/** The unit carrying a prepare as named, and a unit of the player's, which prepares nothing, as it stands. */
function withPrepare(unit: Unit, prepared: boolean): Unit {
  switch (unit.faction) {
    case 'player':
      return unit;
    case 'enemy':
    case 'neutral':
      return { ...unit, prepared };
  }
}

/** The factions whose units act by a script. */
type ScriptedFaction = Exclude<Faction, 'player'>;

/** The script a unit acts by, and nothing for a unit of the player's. */
function scriptOf(unit: Unit): string | undefined {
  switch (unit.faction) {
    case 'player':
      return undefined;
    case 'enemy':
    case 'neutral':
      return unit.script;
  }
}

/**
 * One unit of the faction acting by its script on the chronicle the one before it left: a unit that
 * steps acts no more after it, nor one that prepares, nor one whose play moved nothing. The draws its
 * script made ride on the chronicle even where it raised no stage.
 */
function scriptedActs(
  catalogue: Catalogue,
  chronicle: Chronicle,
  id: number,
  faction: ScriptedFaction,
): Sequence {
  const found = unitOf(chronicle.units, id);
  const named = found?.faction === faction ? scriptOf(found) : undefined;
  if (found === undefined || named === undefined) return unchanged(chronicle);
  const script = unitScript(catalogue, named);
  const { landing, step, rng } = script.moveTo(catalogue, chronicle, found);
  const drawn = rng === chronicle.rng ? chronicle : { ...chronicle, rng };
  const moving =
    tileKey(landing.tile) === tileKey(found.tile)
      ? unchanged(drawn)
      : crossed(drawn, found, landing);
  if (step !== undefined) {
    return followed<Stage>(moving, (left) => scriptedStepped(catalogue, left, id, step));
  }

  const acts = (standing: Chronicle): Sequence => {
    const acting = unitOf(standing.units, id);
    if (acting === undefined || acting.action <= 0) return unchanged(standing);
    const act = script.acts(catalogue, standing, acting);
    switch (act.act) {
      case 'none':
        return unchanged(standing);
      case 'prepare':
        return prepared(catalogue, standing, acting);
      case 'play': {
        const playing = neutralPlayed(catalogue, standing, acting, act.card, act.tile);
        return playing.chronicle === standing ? playing : followed<Stage>(playing, acts);
      }
      case 'attack': {
        const { target } = act;
        const away = distance(acting.tile, target.tile);
        if (
          !canAttack(acting, target, away, relationsOf(standing)) ||
          !inOwnSight(catalogue, standing.tiles, acting, target.tile)
        ) {
          return landedAs(change('runtime-error', standing));
        }
        return followed<Stage>(blow(unchanged(standing), acting, target), acts);
      }
    }
  };
  return followed<Stage>(moving, acts);
}

/**
 * A unit preparing on the tile it stands on, its action spent as an attack spends it and then its
 * prepare carried; a unit acting as no enemy, one embarked, or one on a tile with neither a city not
 * its own nor anything built on it, is a `runtime-error` and no prepare.
 */
function prepared(catalogue: Catalogue, chronicle: Chronicle, unit: Unit): Landed {
  const tile = tileAt(chronicle.tiles, unit.tile);
  if (
    !actsAsEnemy(unit, relationsOf(chronicle)) ||
    unit.embarked ||
    tile === undefined ||
    !(
      otherCityOn(chronicle, tile, unit.faction) !== undefined ||
      pillaged(catalogue, chronicle, tile) !== undefined
    )
  ) {
    return landedAs(change('runtime-error', chronicle));
  }
  return followed(actionSpent(chronicle, unit.tile), (left) => carriedPrepare(left, unit, true));
}

/**
 * A unit acting by its script embarking or disembarking onto the tile its script names, through the
 * step the cards take; a step the rules cannot take is a `runtime-error` and no step.
 */
function scriptedStepped(
  catalogue: Catalogue,
  chronicle: Chronicle,
  id: number,
  to: TileCoords,
): Landed {
  const stepping = unitOf(chronicle.units, id);
  const move = stepping === undefined ? undefined : stepMove(catalogue, chronicle, stepping, to);
  if (stepping === undefined || move === undefined) {
    return landedAs(change('runtime-error', chronicle));
  }
  return steppedOnto(chronicle, stepping, to, !stepping.embarked, move);
}

/**
 * The camps rolling their own enemies, in tile order: each camp draws once from the seeded generator
 * whatever its odds, and where the draw falls under them one enemy of its roll's table enters around
 * it. A draw that entered nothing raises no stage and rides on the chronicle handed back.
 */
function campsRolled(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  const { camp } = ageOf(catalogue, chronicle.age);
  let rolling: Sequence = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== camp.building) continue;
    rolling = followed(rolling, (left) => {
      const step = nextRng(left.rng);
      const drawn = { ...left, rng: step.rng };
      if (step.value >= camp.odds) return unchanged(drawn);
      return enteredAround(catalogue, drawn, { q, r }, 1, camp.roll);
    });
  }
  return rolling;
}

/**
 * The camps, the sites and the neutral's city a unit still stands on once the enemy phase is over,
 * each one the capture of the faction standing on it, in tile order.
 */
function captures(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  let capturing: Sequence = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building === undefined) continue;
    const capture = captureOf(catalogue, chronicle.age, building);
    if (capture === undefined) continue;
    const unit = unitAt(chronicle.units, { q, r });
    if (unit === undefined) continue;
    capturing = followed(capturing, (left) =>
      captured(left, { q, r }, unit.faction, building, capture),
    );
  }
  return capturing;
}

/**
 * The building on the tile captured by a unit of the faction standing on it: the player's captures
 * anything, and its capture deals the rewards under the building; the neutral's captures a camp or a
 * site, dealing nothing; an enemy captures nothing by standing.
 */
function captured(
  chronicle: Chronicle,
  tile: TileCoords,
  by: Faction,
  building: string,
  { takes, rewards }: { readonly takes: Captured; readonly rewards: Rewards },
): Sequence<Group> {
  switch (by) {
    case 'player':
      return grouped(
        { name: 'capture', tile },
        course(chronicle, [
          (left) => leftTheMap(left, tile),
          (left) => fallenWith(left, takes),
          (left) =>
            landedAs(
              change('dealt', {
                ...left,
                deals: [...left.deals, { of: 'capture', building, rewards }],
              }),
            ),
        ]),
      );
    case 'neutral':
      return capturedByTheNeutral(chronicle, tile, takes);
    case 'enemy':
      return unchanged(chronicle);
  }
}

/** What a unit of the neutral's standing on the building captures: a camp or a site, never its own city. */
function capturedByTheNeutral(
  chronicle: Chronicle,
  tile: TileCoords,
  takes: Captured,
): Sequence<Group> {
  switch (takes) {
    case 'camp':
    case 'site':
      return grouped({ name: 'capture', tile }, leftTheMap(chronicle, tile));
    case 'neutral-city':
      return unchanged(chronicle);
  }
}

/**
 * The neutral's city captured by the enemy prepared on its tile: the age's camp built in its slot,
 * the neutral fallen, and the enemy that took it that camp's guard, its prepare gone; nothing dealt.
 */
function capturedByTheEnemies(
  catalogue: Catalogue,
  chronicle: Chronicle,
  capturer: Unit,
): Sequence<Group> {
  const { building, scripts } = ageOf(catalogue, chronicle.age).camp;
  const { tile } = capturer;
  return grouped(
    { name: 'capture', tile },
    course(chronicle, [
      (left) => built(catalogue, left, tile, building),
      (left) => fallenWith(left, 'neutral-city'),
      (left) => campJoined(left, capturer, scripts.guard),
      (left) => carriedPrepare(left, capturer, false),
    ]),
  );
}

/** The enemy made the camp's on the tile it stands on, under the script named: the one `camp-joined`. */
function campJoined(chronicle: Chronicle, joining: Unit, script: string): Landed {
  return landedAs(
    changeOn('camp-joined', joining.tile, {
      ...chronicle,
      units: chronicle.units.map((unit) =>
        unit.id === joining.id && unit.faction === 'enemy'
          ? { ...unit, script, camp: joining.tile }
          : unit,
      ),
    }),
  );
}

/**
 * What leaves the chronicle with the building captured: with the neutral's city, the one
 * `neutral-fallen`, its border, population and stocks gone and its relations standing.
 */
function fallenWith(chronicle: Chronicle, takes: Captured): Landed {
  switch (takes) {
    case 'camp':
    case 'site':
      return unchanged(chronicle);
    case 'neutral-city':
      return landedAs(change('neutral-fallen', { ...chronicle, neutral: undefined }));
  }
}

/** A captured building leaving the map, its slot empty and a camp's enemies no camp's with it. */
function leftTheMap(chronicle: Chronicle, tile: TileCoords): Landed {
  const units = chronicle.units.map((unit) =>
    unit.faction === 'enemy' && unit.camp !== undefined && tileKey(unit.camp) === tileKey(tile)
      ? { ...unit, camp: undefined }
      : unit,
  );
  return retiled({ ...chronicle, units }, tile, (slot) => ({ ...slot, building: undefined }));
}
