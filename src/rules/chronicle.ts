import { aimOf, leavesChronicle, refuses, struck } from './cards';
import {
  type AimedCard,
  type Catalogue,
  cardOf,
  checkContent,
  type Deck,
  enemyScript,
  entered,
} from './catalogue';
import { assign, type CityCommand, claim, grow, income, reassign } from './city';
import { campUnit } from './enemies';
import { generateMap, type HexMap, type TileCoords, tileAt, tileKey } from './map';
import { refuse } from './map-kinds';
import { nextRng, seedRng, shuffle as shuffleItems } from './rng';
import {
  answered,
  answerOf,
  answerRefusal,
  continued,
  events,
  offered,
  passed,
  rewarded,
  timelineOf,
  unitDamaged,
} from './schedule';
import { charted, chartedAt, unitsGone } from './sight';
import {
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
  type Sequence,
  type Stage,
  unchanged,
} from './stages';
import {
  type Block,
  type CardId,
  type Chronicle,
  type Cost,
  costsOf,
  paid,
  playable,
  type Refusal,
  type Timeline,
  unaffordable,
} from './state';
import {
  attackable,
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
  | { readonly type: 'play'; readonly index: number; readonly aim: 'none' }
  | {
      readonly type: 'play';
      readonly index: number;
      readonly aim: 'tile';
      readonly tile: TileCoords;
    }
  | {
      readonly type: 'play';
      readonly index: number;
      readonly aim: 'unit';
      /** The tile the unit it is aimed at stands on: a unit is played at through the map. */
      readonly tile: TileCoords;
    }
  | {
      readonly type: 'play';
      readonly index: number;
      readonly aim: 'discard-pile';
      /**
       * Where in the discard pile the card aimed at it lies, in the pile as it stood before the
       * play: the play sends the card being played to the pile before the effect resolves.
       */
      readonly card: number;
    }
  | { readonly type: 'move'; readonly unit: number; readonly tile: TileCoords }
  | { readonly type: 'attack'; readonly unit: number; readonly tile: TileCoords }
  | CityCommand;

/**
 * What one unit of the player's, named by its number, is commanded by hand: crossing to a tile, or
 * attacking on one.
 */
export type UnitCommand = Extract<Command, { readonly unit: number }>;

/** One card of the hand played, aimed the way the card is: at nothing, a tile, a unit or the discard pile. */
type PlayCommand = Extract<Command, { readonly type: 'play' }>;

/** A full hand. */
const HAND_SIZE = 5;

/**
 * The opening, on the map and the timeline it is handed: turn 0, the city standing nowhere with no
 * population and no tile held, the deck's cards shuffled into the draw pile from the seed, its settle
 * cards in hand in the deck's order, and the map charted of its centre part. A map whose centre part
 * names a tile the map does not hold is refused. The chronicle names the version of the catalogue it
 * is begun on.
 */
export function beginChronicle(
  catalogue: Catalogue,
  seed: number,
  deck: Deck,
  map: HexMap,
  timeline: Timeline,
): Chronicle {
  for (const coord of map.centre) {
    if (tileAt(map.tiles, coord) !== undefined) continue;
    refuse(
      catalogue,
      `the map's centre part names ${tileKey(coord)}, a tile the map does not hold`,
    );
  }
  const shuffled = shuffleItems(seedRng(seed), deck.cards);
  return charted(catalogue, {
    content: catalogue.version,
    seed,
    rng: shuffled.rng,
    timeline,
    tiles: map.tiles,
    snapshots: [],
    rivers: map.rivers,
    centre: map.centre,
    held: [],
    turn: 0,
    deals: [],
    resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
    population: 0,
    assigned: [],
    units: [],
    nextUnit: 1,
    drawPile: shuffled.items,
    hand: [...deck.settle],
    discardPile: [],
  });
}

/**
 * A chronicle launched on a region and a schedule: the seed deals the region's map, the timeline
 * takes the generator the map left as its own, and the opening takes both from the same seed. The
 * one place a map, a timeline and a chronicle share one.
 */
export function launched(
  catalogue: Catalogue,
  region: string,
  schedule: string,
  seed: number,
  deck: Deck,
): Chronicle {
  const { tiles, rivers, centre, rng } = generateMap(catalogue, region, seedRng(seed));
  const timeline = timelineOf(catalogue, schedule, rng);
  return beginChronicle(catalogue, seed, deck, { tiles, rivers, centre }, timeline);
}

/**
 * The one way a chronicle changes: every command the player has goes through here, and answers the
 * stages it resolves as — never none, each of them charted of what stood in sight when it ended. A
 * chronicle begun on another version of the content than the catalogue's is refused first.
 */
export function apply(catalogue: Catalogue, chronicle: Chronicle, command: Command): Stage[] {
  checkContent(catalogue, chronicle);
  return charting(catalogue, chronicle, resolved(catalogue, chronicle, command));
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
    case 'killed':
    case 'refreshed':
    case 'action-spent':
    case 'retiled':
    case 'held':
    case 'settled':
    case 'stock':
    case 'population':
    case 'assigned':
    case 'laid':
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

/**
 * The end of turn: one `strike` for every hazard in hand, whatever it moved; what is left of the
 * hand discarded; `income`, `grow` and `enemy-phase`, each staged empty or not; one `camp-capture`
 * for every camp captured; then the opening, unless a camp's rewards stand — the rest waits on
 * their take. Turn 0's end is the opening alone. A turn ended while the city stands nowhere is
 * `refused`.
 */
function endOfTurn(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  if (chronicle.city === undefined) return refused(chronicle);
  if (chronicle.turn === 0) return opened(catalogue, chronicle);
  return course(chronicle, [
    (left) => struck(catalogue, left),
    discarded,
    (left) => grouped({ name: 'income' }, income(catalogue, left)),
    (left) => grouped({ name: 'grow' }, grow(left)),
    (left) => enemyPhase(catalogue, left),
    (left) => captures(catalogue, left),
    (left) => (left.deals.length > 0 ? unchanged(left) : opened(catalogue, left)),
  ]);
}

/**
 * The opening of the next turn: the bare `ended` of the victory, and nothing after it, when the
 * capstone is passed; else the `turn`, the capstone's second script, the events phase, and the draw
 * — or, while the events phase leaves a deal standing, nothing after it: the hand waits on the take.
 */
function opened(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  if (passed(catalogue, chronicle)) return landedAs(change('ended', victory(chronicle)));
  return course(chronicle, [
    ticked,
    (left) => continued(catalogue, left),
    (left) => events(catalogue, left),
    (left) => (left.deals.length > 0 ? unchanged(left) : drawn(left)),
  ]);
}

/**
 * The `turn` group: the turn ticked; the settle cards still in hand gone from the chronicle at the
 * end of turn 0; and every unit, in unit order, whose move points or action are short of full,
 * refreshed.
 */
function ticked(chronicle: Chronicle): Sequence<Group> {
  let tick = landedAs(change('turn', { ...chronicle, turn: chronicle.turn + 1 }));
  if (chronicle.turn === 0 && chronicle.hand.length > 0) {
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
        followed(taken, (left) => rewarded(left, id)),
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
function victory(chronicle: Chronicle): Chronicle {
  return { ...chronicle, ending: { outcome: 'victory', turn: chronicle.turn } };
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
 * on. A card that lands whole and one aimed at the discard pile answer with the blocks they declare,
 * in the order they declare them; a card aimed at a tile or at a unit answers with none, the map
 * being no part of what the hand judges it by.
 */
function blocked(catalogue: Catalogue, chronicle: Chronicle, id: CardId): Block[] {
  const card = aimOf(cardOf(catalogue, id));
  switch (card.aim) {
    case 'none':
      return card.blocked?.(catalogue, chronicle) ?? [];
    case 'discard-pile':
      return card.blocked(catalogue, chronicle);
    case 'tile':
    case 'unit':
      return [];
  }
}

/**
 * One card played: the aim is judged on the chronicle as it stands, the same one the map lit its
 * tiles from; then, in the one `played` group, the card leaves the hand for the discard pile — or
 * for nowhere at all, as a settle card, a single use card and a hazard do — its cost is paid, and
 * its effect lands. A play the hand, the city, the map or the discard pile refuses is `refused`,
 * nothing paid or discarded.
 */
function play(catalogue: Catalogue, chronicle: Chronicle, command: PlayCommand): Sequence {
  const id = chronicle.hand[command.index];
  if (id === undefined || !playable(refusalOf(catalogue, chronicle, id))) {
    return refused(chronicle);
  }
  const effect = aimedEffect(catalogue, chronicle, id, command);
  if (effect === undefined) return refused(chronicle);

  const hand = chronicle.hand.filter((_, at) => at !== command.index);
  const leaving = leavesChronicle(cardOf(catalogue, id))
    ? changeFrom('left', [command.index], { ...chronicle, hand })
    : changeFrom('discarded', [command.index], {
        ...chronicle,
        hand,
        discardPile: [...chronicle.discardPile, id],
      });
  const costs = costOf(catalogue, id);
  const cost = (left: Chronicle): Landed =>
    costs.length === 0 ? unchanged(left) : landedAs(change('stock', paid(left, costs)));
  return grouped({ name: 'played' }, followed(followed(landedAs(leaving), cost), effect));
}

/**
 * The card's effect with what the play aimed it at, judged on the chronicle before anything is paid,
 * ready for the chronicle its cost is paid on. A play aimed another way than the card is aimed lands
 * nowhere. A card aimed at a tile or at a unit takes one the aim admits and no other; one aimed at
 * the discard pile takes a place the pile holds as it stands; a card that lands whole takes nothing
 * at all. `undefined` refuses the play.
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
    case 'tile':
    case 'unit': {
      const tile = aimedTile(command, card.aim);
      if (tile === undefined) return undefined;
      const at = tileKey(tile);
      if (!admitted(catalogue, chronicle, card).some((coord) => tileKey(coord) === at)) {
        return undefined;
      }
      return (paid) => card.effect(catalogue, paid, tile);
    }
    case 'discard-pile': {
      if (command.aim !== 'discard-pile') return undefined;
      const at = command.card;
      if (at < 0 || at >= chronicle.discardPile.length) return undefined;
      return (paid) => card.effect(catalogue, paid, at);
    }
  }
}

/**
 * The tile a play sent a card to, and nothing at all when the play named another aim than the card's
 * own: the two aims the map answers each take the play that names them and no other.
 */
function aimedTile(command: PlayCommand, aim: AimedCard['aim']): TileCoords | undefined {
  switch (command.aim) {
    case 'none':
    case 'discard-pile':
      return undefined;
    case 'tile':
    case 'unit':
      return command.aim === aim ? command.tile : undefined;
  }
}

/**
 * What a unit of the player's may do by hand: the landings its move points reach and the units its
 * attack reaches, and nothing at all on turn 0. The one answer the move, the attack and the map
 * lighting a unit all read.
 */
export function byHand(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
): { readonly landings: Landing[]; readonly targets: Unit[] } {
  if (chronicle.turn === 0) return { landings: [], targets: [] };
  return {
    landings: reachable(catalogue, chronicle, unit),
    targets: attackable(chronicle.units, unit),
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
 * phase raises. A unit that is not the player's, a move on turn 0, or a tile it cannot land on — an
 * uncharted one among them — is `refused`.
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
 * left, an attack on turn 0, and a tile no unit of another faction within range stands on are
 * `refused`.
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

/** The end of the turn: what is left of the hand goes to the discard pile, and nothing where none is. */
function discarded(chronicle: Chronicle): Landed {
  if (chronicle.hand.length === 0) return unchanged(chronicle);
  return landedAs(
    changeFrom('discarded', everyPlace(chronicle.hand), {
      ...chronicle,
      hand: [],
      discardPile: [...chronicle.discardPile, ...chronicle.hand],
    }),
  );
}

/** Every place of a pile, in pile order. */
function everyPlace(pile: readonly CardId[]): number[] {
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
 * point. Nothing for a move it did not make or an attack aimed at nobody.
 */
function enemyActs(catalogue: Catalogue, chronicle: Chronicle, id: number): Sequence {
  const found = unitOf(chronicle.units, id);
  if (found?.faction !== 'enemy') return unchanged(chronicle);
  const script = enemyScript(catalogue, found.script);
  const landing = script.moveTo(catalogue, chronicle, found);
  const moving =
    tileKey(landing.tile) === tileKey(found.tile)
      ? unchanged(chronicle)
      : crossed(chronicle, found, landing);

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
 * The camps rolling their own warriors, in tile order: each camp whose tile no unit stands on draws
 * once from the seeded generator whatever its odds, and its unit enters on it where the draw falls
 * under them. A draw that entered nothing raises no stage and rides on the chronicle handed back.
 */
function campsRolled(catalogue: Catalogue, chronicle: Chronicle): Sequence {
  let rolling: Sequence = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    rolling = followed(rolling, (left) => {
      if (unitAt(left.units, { q, r }) !== undefined) return unchanged(left);
      const step = nextRng(left.rng);
      const drawn = { ...left, rng: step.rng };
      if (step.value >= catalogue.camp.odds) return unchanged(drawn);
      return entered(catalogue, drawn, campUnit(catalogue, { q, r }));
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
  let capturing: Sequence = unchanged(chronicle);
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
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
  const at = tileKey(tile);
  const cleared = landedAs(
    changeOn('retiled', tile, {
      ...chronicle,
      tiles: chronicle.tiles.map((other) =>
        tileKey(other) === at ? { ...other, building: undefined } : other,
      ),
    }),
  );
  return grouped(
    { name: 'camp-capture', tile },
    followed(cleared, (left) =>
      landedAs(
        change('dealt', {
          ...left,
          deals: [...left.deals, { of: 'camp', rewards: catalogue.camp.rewards }],
        }),
      ),
    ),
  );
}
