import { available } from './campaign';
import {
  aimOf,
  discarded,
  lyingAs,
  playedThrough,
  refuses,
  retiled,
  struck,
  throughRefusal,
} from './cards';
import {
  type Achievement,
  type AimedCard,
  achievementOf,
  ageOf,
  type Catalogue,
  type Civilization,
  capstoneOf,
  cardMade,
  cardOf,
  checkContent,
  enemyScript,
  entered,
  technologyOf,
  unitKind,
} from './catalogue';
import { assign, type CityCommand, claim, grow, income, reassign } from './city';
import { campUnit, guardEntered } from './enemies';
import {
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
import type { Resource } from './resources';
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
import { charted, chartedAt, inSight, unitsGone } from './sight';
import {
  type Aimed,
  type Change,
  change,
  changeFrom,
  changeOn,
  fall,
  falls,
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
  type Cost,
  costsOf,
  onSettlePhase,
  paid,
  playable,
  type Refusal,
  type Tally,
  type Timeline,
  unaffordable,
} from './state';
import {
  attackable,
  FIRST_UNIT_NUMBER,
  type Landing,
  occupied,
  reachable,
  refreshedAction,
  refreshedMovePoints,
  spentAction,
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
type PlayCommand = Extract<Command, { readonly type: 'play' }>;

/** A full hand. */
const HAND_SIZE = 5;

export function beginChronicle(
  catalogue: Catalogue,
  age: string,
  seed: number,
  civilization: Civilization,
  map: HexMap,
  timeline: Timeline,
  learned: readonly string[],
): Chronicle {
  const { camp } = ageOf(catalogue, age);
  for (const coord of map.centre) {
    if (tileAt(map.tiles, coord) !== undefined) continue;
    refuse(
      catalogue,
      `the map's centre part names ${tileKey(coord)}, a tile the map does not hold`,
    );
  }
  const made = (id: CardId): ChronicleCard => cardMade(catalogue, id);
  const shuffled = shuffleItems(seedRng(seed), civilization.cards.map(made));
  const begun: Chronicle = {
    content: catalogue.version,
    age,
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
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: 0,
    assigned: [],
    units: [],
    nextUnit: FIRST_UNIT_NUMBER,
    drawPile: shuffled.items,
    hand: [civilization.city.card, ...civilization.settle].map(made),
    discardPile: [],
    achievements: achievementsOfAvailableTechnologies(catalogue, age, learned),
  };
  let guarded = begun;
  for (const { q, r, building } of map.tiles) {
    if (building !== camp.building) continue;
    guarded = entered(
      catalogue,
      guarded,
      campUnit(catalogue, guarded, { q, r }, 'guard'),
    ).chronicle;
  }
  const seen = charted(catalogue, guarded);
  const raised = reachedOn(catalogue, seen, () => true);
  return raised.length === 0 ? seen : outcome(raised);
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
 * timeline rolled from the age's schedule takes the generator the map left as its own, and the
 * opening takes both from the same seed. The one place a map, a timeline and a chronicle share one.
 */
export function launched(
  catalogue: Catalogue,
  age: string,
  region: string,
  seed: number,
  civilization: Civilization,
  learned: readonly string[],
): Chronicle {
  const map = generateMap(catalogue, ageOf(catalogue, age), region, seedRng(seed));
  const timeline = timelineOf(catalogue, age, map.rng);
  const { tiles, rivers, centre } = map;
  return beginChronicle(
    catalogue,
    age,
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
  const stages = charting(catalogue, chronicle, resolved(catalogue, chronicle, command));
  return conditionsRead(catalogue, chronicle, stages);
}

/** The capstone is never read on a chronicle whose city falls on it. */
function conditionsRead(
  catalogue: Catalogue,
  started: Chronicle,
  stages: readonly Stage[],
): Stage[] {
  if (started.ending !== undefined) return [...stages];
  const { id, turn } = started.timeline.capstone;
  const { passes } = capstoneOf(catalogue, id);
  // The events phase lands the capstone in the command whose tick reaches its turn, so a command
  // started on that turn or after starts past the landing.
  let landed = started.turn >= turn;
  const passesNow = (chronicle: Chronicle): boolean =>
    landed && chronicle.ending === undefined && !falls(chronicle) && passes(catalogue, chronicle);

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

  let over = false;
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
            case 'strike':
            case 'income':
            case 'grow':
            case 'turn':
            case 'enemy-phase':
            case 'deal':
            case 'answer':
            case 'reward':
            case 'attack':
            case 'camp-capture':
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
 * An achievement's tally and count for the enemies the attacks of the player's units of a kind kill,
 * the attacker read as it stood when the attack began. A kind the catalogue does not hold is refused.
 */
export function enemiesKilledBy(kind: string): Required<Pick<Achievement, 'tallies' | 'count'>> {
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

/**
 * The stages a command resolves as before the map is charted. A chronicle that has ended refuses
 * every command, and one waiting on a deal every command but the take.
 */
function resolved(catalogue: Catalogue, chronicle: Chronicle, command: Command): readonly Stage[] {
  if (chronicle.ending !== undefined) return refused(chronicle).stages;
  if (chronicle.deals.length > 0 && command.type !== 'take') return refused(chronicle).stages;
  return stagesOf(catalogue, chronicle, command).stages;
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
    case 'retiled':
    case 'held':
    case 'settled':
    case 'stock':
    case 'population':
    case 'assigned':
    case 'added':
    case 'drawn':
    case 'discarded':
    case 'recalled':
    case 'shuffled':
    case 'left':
    case 'turn':
    case 'rolled':
    case 'dealt':
    case 'taken':
    case 'ended':
    case 'tallied':
    case 'reached':
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
      return move(catalogue, chronicle, command.unit, command.tile);
    case 'attack':
      return attack(catalogue, chronicle, command.unit, command.tile);
    case 'assign':
      return acted(chronicle, 'assign', assign(catalogue, chronicle, command.tile));
    case 'reassign':
      return acted(chronicle, 'assign', reassign(chronicle, command.from, command.to));
    case 'claim':
      return acted(chronicle, 'claim', claim(catalogue, chronicle, command.tile));
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
  if (chronicle.city === undefined) return refused(chronicle);
  if (onSettlePhase(chronicle)) return opened(catalogue, chronicle);
  return course(chronicle, [
    (left) => struck(catalogue, left),
    (left) => discarded(left, everyPlace(left.hand)),
    (left) => grouped({ name: 'grow' }, grow(left)),
    (left) => grouped({ name: 'income' }, income(catalogue, left)),
    (left) => enemyPhase(catalogue, left),
    (left) => captures(catalogue, left),
    (left) => (left.deals.length > 0 ? unchanged(left) : opened(catalogue, left)),
  ]);
}

/**
 * The opening of the next turn: the `turn`, the capstone's second script, the events phase, and the
 * draw — or, while the events phase leaves a deal standing, nothing after it: the hand waits on the
 * take.
 */
function opened(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  return course(chronicle, [
    ticked,
    (left) => continued(catalogue, left),
    (left) => events(catalogue, left),
    (left) => (left.deals.length > 0 ? unchanged(left) : drawn(left)),
  ]);
}

function ticked(chronicle: Chronicle): Sequence<Group> {
  let tick = landedAs(change('turn', { ...chronicle, turn: chronicle.turn + 1 }));
  if (onSettlePhase(chronicle) && chronicle.hand.length > 0) {
    tick = followed(tick, (left) =>
      landedAs(changeFrom('left', everyPlace(left.hand), { ...left, hand: [] })),
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
 * One entry of the deal standing taken, by its place in the order dealt, and the deal popped: an
 * answer is the one `answer` group over the deal `taken`, its cost and its landing; a reward is the
 * one `reward` group over the deal `taken` and the card `discarded`, the rewards beside it gone.
 * While a deal still stands nothing more resolves; once none does, the last reward taken resumes the
 * end of turn at its opening, and the last answer taken draws the hand. A take made while no deal
 * stands, one at a place the deal does not offer, and one of an answer the city cannot pay for are
 * `refused`.
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
      const answering = grouped(
        { name: 'answer' },
        followed(taken, (left) => answered(catalogue, left, answer)),
      );
      return followed<Stage>(answering, (left) => resumed(left, drawn));
    }
    case 'camp': {
      const rewarding = grouped(
        { name: 'reward' },
        followed(taken, (left) => rewarded(catalogue, left, id)),
      );
      return followed<Stage>(rewarding, (left) =>
        resumed(left, (standing) => opened(catalogue, standing)),
      );
    }
  }
}

/** What a take goes on to resolve: nothing while a deal still stands, and the rest where none does. */
function resumed(chronicle: Chronicle, rest: (left: Chronicle) => Sequence): Sequence {
  return chronicle.deals.length > 0 ? unchanged(chronicle) : rest(chronicle);
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

/** What a card costs, resource by resource, in the order the resource bar reads. */
export function costOf(catalogue: Catalogue, id: CardId): Cost[] {
  return costsOf(cardOf(catalogue, id).cost);
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

  const hand = chronicle.hand.filter((_, at) => at !== command.index);
  const lying = lyingAs(catalogue, held);
  const leaving =
    lying === undefined
      ? changeFrom('left', [command.index], { ...chronicle, hand })
      : changeFrom('discarded', [command.index], {
          ...chronicle,
          hand,
          discardPile: [...chronicle.discardPile, lying],
        });
  const costs = costOf(catalogue, held.id);
  const cost = (left: Chronicle): Landed =>
    costs.length === 0 ? unchanged(left) : landedAs(change('stock', paid(left, costs)));
  return grouped(
    { name: 'played', card: held.id, aimed: aimedBy(command) },
    followed(followed(landedAs(leaving), cost), effect),
  );
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
  return {
    landings: reachable(catalogue, chronicle, unit),
    targets: attackable(chronicle.units, unit).filter((target) => seen.has(tileKey(target.tile))),
  };
}

/** One unit crossing to a landing, spending what the crossing costs: the one `move` change. */
function crossed(chronicle: Chronicle, unit: Unit, landing: Landing): Landed {
  return landedAs({
    kind: 'change',
    name: 'move',
    from: unit.tile,
    to: landing.tile,
    chronicle: {
      ...chronicle,
      units: chronicle.units.map((other) =>
        other.id === unit.id
          ? { ...other, tile: landing.tile, movePoints: other.movePoints - landing.cost }
          : other,
      ),
    },
  });
}

/**
 * One unit of the player's crossing to a tile its move points reach, in as many steps as the player
 * likes: the cheapest route there is spent, and the crossing is the same `move` change the enemy
 * phase raises. A unit that is not the player's, a move on the settle phase, or a tile it cannot
 * land on — an uncharted one among them — is `refused`.
 */
function move(catalogue: Catalogue, chronicle: Chronicle, mover: number, to: TileCoords): Sequence {
  const unit = unitOf(chronicle.units, mover);
  if (unit === undefined || unit.faction !== 'player') return refused(chronicle);

  const landing = byHand(catalogue, chronicle, unit).landings.find(
    (reached) => tileKey(reached.tile) === tileKey(to),
  );
  if (landing === undefined) return refused(chronicle);
  return crossed(chronicle, unit, landing);
}

/**
 * One unit of the player's attacking what stands on a tile its range reaches, as the one `attack`
 * group the enemy phase raises too. A unit that is not the player's, a worker, one with no action
 * left, an attack on the settle phase, a tile no unit of another faction within range stands on, and
 * a tile out of sight are `refused`.
 */
function attack(
  catalogue: Catalogue,
  chronicle: Chronicle,
  attacker: number,
  at: TileCoords,
): Sequence {
  const unit = unitOf(chronicle.units, attacker);
  if (unit === undefined || unit.faction !== 'player') return refused(chronicle);

  const target = byHand(catalogue, chronicle, unit).targets.find(
    (other) => tileKey(other.tile) === tileKey(at),
  );
  if (target === undefined) return refused(chronicle);
  return blow(chronicle, unit, target);
}

/**
 * One attack, whoever makes it: the `attack` group carrying both tiles, over the attacker's action
 * spent and then the target losing the attacker's damage or killed by it. Nobody moves.
 */
function blow(chronicle: Chronicle, attacker: Unit, target: Unit): Sequence<Group> {
  const spent = landedAs(
    changeOn('action-spent', attacker.tile, {
      ...chronicle,
      units: chronicle.units.map((unit) => (unit.id === attacker.id ? spentAction(unit) : unit)),
    }),
  );
  return grouped(
    { name: 'attack', attacker: attacker.tile, target: target.tile },
    followed(spent, (left) => unitDamaged(left, target.tile, attacker.stats.damage)),
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
 * The enemies' half of the turn, the one `enemy-phase` group: an enemy that stood on the city's tile
 * through the whole turn captures it, the capture's `ended` alone in the group; otherwise every
 * enemy acts in unit order, then the camps roll their warriors.
 */
function enemyPhase(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  if (chronicle.city !== undefined && occupied(chronicle.units, chronicle.city)) {
    return grouped({ name: 'enemy-phase' }, landedAs(change('ended', fall(chronicle, 'capture'))));
  }
  let phase: Sequence = unchanged(chronicle);
  for (const { id } of chronicle.units) {
    phase = followed(phase, (left) => enemyActs(catalogue, left, id));
  }
  return grouped(
    { name: 'enemy-phase' },
    followed(phase, (left) => campsRolled(catalogue, left)),
  );
}

/**
 * One enemy acting on the chronicle the one before it left, as it stands there; one killed before
 * its turn acts no more. It moves by its script on the move points it holds, spending what the tiles
 * it crosses cost, and then attacks the unit its script names while it holds action, one attack a
 * point. Nothing for a move it did not make or an attack aimed at nobody; the draws its script made
 * ride on the chronicle all the same.
 */
function enemyActs(catalogue: Catalogue, chronicle: Chronicle, id: number): Sequence {
  const found = unitOf(chronicle.units, id);
  if (found?.faction !== 'enemy') return unchanged(chronicle);
  const script = enemyScript(catalogue, found.script);
  const { landing, rng } = script.moveTo(catalogue, chronicle, found);
  const drawn = rng === chronicle.rng ? chronicle : { ...chronicle, rng };
  const moving =
    tileKey(landing.tile) === tileKey(found.tile)
      ? unchanged(drawn)
      : crossed(drawn, found, landing);

  const attacks = (standing: Chronicle): Sequence => {
    const acting = unitOf(standing.units, id);
    if (acting === undefined || acting.action <= 0) return unchanged(standing);
    const target = script.attacks(catalogue, standing, acting);
    if (target === undefined) return unchanged(standing);
    return followed<Stage>(blow(standing, acting, target), attacks);
  };
  return followed<Stage>(moving, attacks);
}

/**
 * The camps rolling their own guards, in tile order: each camp draws once from the seeded generator
 * whatever its odds, and where the draw falls under them one guard enters around it. A draw that
 * entered nothing raises no stage and rides on the chronicle handed back.
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
      return guardEntered(catalogue, drawn, { q, r });
    });
  }
  return rolling;
}

/**
 * The camps captured, in tile order: a camp a unit of the player's is still standing on once the
 * enemy phase is over is one `camp-capture` group carrying its tile, over the camp leaving the tile's
 * building slot and its rewards dealt behind the deals already standing.
 */
function captures(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  const { building } = ageOf(catalogue, chronicle.age).camp;
  let capturing: Sequence = unchanged(chronicle);
  for (const { q, r, building: slot } of chronicle.tiles) {
    if (slot !== building) continue;
    if (unitAt(chronicle.units, { q, r })?.faction !== 'player') continue;
    capturing = followed(capturing, (left) => campCaptured(catalogue, left, { q, r }));
  }
  return capturing;
}

function campCaptured(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Sequence<Group> {
  const removed = retiled(chronicle, tile, (camp) => ({ ...camp, building: undefined }));
  return grouped(
    { name: 'camp-capture', tile },
    followed(removed, (left) =>
      landedAs(
        change('dealt', {
          ...left,
          deals: [...left.deals, { of: 'camp', rewards: ageOf(catalogue, left.age).camp.rewards }],
        }),
      ),
    ),
  );
}
