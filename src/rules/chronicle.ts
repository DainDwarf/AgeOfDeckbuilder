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
} from './schedule';
import { charted, chartedAt, unitsGone } from './sight';
import {
  type Change,
  change,
  followed,
  grouped,
  holdingNothing,
  type Landed,
  landedAs,
  type Stage,
  unchanged,
} from './stages';
import {
  type Block,
  type CardId,
  type Chronicle,
  type Cost,
  costsOf,
  type DefeatCause,
  paid,
  playable,
  type Refusal,
  type Timeline,
  unaffordable,
} from './state';
import {
  attackable,
  attacked,
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
 * every command and one waiting on a deal every command but the take, and a standing city left
 * without population falls on the first stage that leaves it so, whatever that stage was, with
 * every stage the command resolved after it dropped.
 */
function resolved(catalogue: Catalogue, chronicle: Chronicle, command: Command): Stage[] {
  if (chronicle.ending !== undefined) return [holdingNothing('refused', chronicle)];
  if (chronicle.deals.length > 0 && command.type !== 'take') {
    return [holdingNothing('refused', chronicle)];
  }

  const stages = stagesOf(catalogue, chronicle, command);
  const at = stages.findIndex(({ chronicle: left }) => falling(left));
  if (at < 0) return stages;
  return [...stages.slice(0, at), fallenOn(stages[at])];
}

/**
 * The stage the city falls on, with the fall set on it; a group holding stages is cut after the
 * first of them the city falls on, and closes on it.
 */
function fallenOn(stage: Stage): Stage {
  if (stage.kind === 'change' || stage.stages.length === 0) {
    return { ...stage, chronicle: fall(stage.chronicle, 'population') };
  }
  const at = stage.stages.findIndex(({ chronicle }) => falling(chronicle));
  const held = [...stage.stages.slice(0, at), fallenOn(stage.stages[at])];
  return { ...stage, stages: held, chronicle: held[held.length - 1].chronicle };
}

/** Whether the chronicle stands on a city with no population left: the fall by population. */
function falling(chronicle: Chronicle): boolean {
  return (
    chronicle.ending === undefined && chronicle.city !== undefined && chronicle.population <= 0
  );
}

/**
 * Every leaf of the tree with its own chronicle charted, in the order the walk plays them, each
 * carrying on from the snapshots the leaf before it left: every stage a command resolves as is built
 * off the chronicle the command started on, so the snapshots its own chronicle carries are that
 * one's. A `charted` change has its tile's snapshot taken here, as the change's chronicle stands. The
 * units leave the snapshots here, on the leaf the turn ticks on, because the snapshots a leaf's own
 * chronicle carries are stale by a turn. A group holding stages leaves its last stage's charted
 * chronicle. A command that charted nothing hands back the very stages it was given.
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
    case 'rolled':
    case 'ended':
    case 'runtime-error':
      return undefined;
  }
}

/** What each command resolves as, before the fall the city may have come to on any of them. */
function stagesOf(catalogue: Catalogue, chronicle: Chronicle, command: Command): Stage[] {
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
 * One act of the city's staged: the chronicle the rules answered with under the name the act is
 * staged as, and one `refused` stage on the chronicle as it stood where they answered nothing.
 */
function acted(
  chronicle: Chronicle,
  name: 'assign' | 'claim',
  left: Chronicle | undefined,
): Stage[] {
  if (left === undefined) return [holdingNothing('refused', chronicle)];
  return [holdingNothing(name, left)];
}

/** The chronicle a command left: the last stage's, for whoever wants the state and not the play. */
export function outcome(stages: readonly Stage[]): Chronicle {
  return stages[stages.length - 1].chronicle;
}

/**
 * The end of turn, step by ordered step, each with the chronicle it leaves: one `strike` for every
 * hazard in hand, whatever it moved, then the steps after it, one that changed nothing absent; the
 * list ends at the capture when the city falls in the enemy phase, or at
 * the last camp captured while a camp's rewards stand — the rest of the end of turn waits on their
 * take. Otherwise the turn opens as `turnOpened` has it. Turn 0's end runs none of the cycle and
 * opens on the tick, which takes the settle cards left in hand. There is always a stage. A turn ended
 * while the city stands nowhere is one `refused` stage.
 */
function endOfTurn(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  if (chronicle.city === undefined) return [holdingNothing('refused', chronicle)];
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (stage: Stage): void => {
    if (stage.chronicle === standing) return;
    standing = stage.chronicle;
    stages.push(stage);
  };
  /** The steps that resolve unit by unit hand their stages over already made. */
  const raised = (sequence: readonly Stage[]): void => {
    for (const stage of sequence) {
      standing = stage.chronicle;
      stages.push(stage);
    }
  };

  if (standing.turn > 0) {
    raised(struck(catalogue, standing));
    staged(change('discarded', discard(standing)));
    staged(holdingNothing('income', income(catalogue, standing)));
    staged(holdingNothing('grow', grow(standing)));
    raised(enemyPhase(catalogue, standing));
    if (standing.ending !== undefined) return stages;
    const rolled = campsRolled(catalogue, standing);
    raised(rolled.stages);
    standing = rolled.chronicle;
    raised(captures(catalogue, standing));
    if (standing.deals.length > 0) return stages;
  }
  raised(turnOpened(catalogue, standing));
  return stages;
}

/**
 * What the end of turn resolves after the captures, each step with the chronicle it leaves and one
 * that changed nothing absent: the victory, ending the list, when the capstone is passed; else the
 * tick, the capstone's second script, the events phase, and the draw — or, while the events phase
 * leaves a deal standing, nothing after it: the hand waits on the take. The turn always ticks where
 * the victory does not end it, and the capstone's turn is staged even where its landing changed
 * nothing.
 */
function turnOpened(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  if (passed(catalogue, chronicle)) return [change('ended', victory(chronicle))];
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (stage: Stage): void => {
    if (stage.chronicle === standing) return;
    standing = stage.chronicle;
    stages.push(stage);
  };
  const raised = (sequence: readonly Stage[]): void => {
    for (const stage of sequence) {
      standing = stage.chronicle;
      stages.push(stage);
    }
  };

  staged(
    holdingNothing('turn', {
      ...standing,
      turn: standing.turn + 1,
      hand: standing.turn === 0 ? [] : standing.hand,
      units: standing.units.map((unit) => refreshedAction(refreshedMovePoints(unit))),
    }),
  );
  raised(continued(catalogue, standing).stages);
  const phase = events(catalogue, standing);
  switch (phase.phase) {
    case 'capstone':
      raised(phase.stages);
      break;
    case 'deal':
      staged(holdingNothing('deal', phase.chronicle));
      if (standing.deals.length > 0) return stages;
      break;
    case 'no-deal':
      staged(change('rolled', phase.chronicle));
      break;
  }
  return [...stages, ...drawn(standing)];
}

/**
 * One entry of the deal standing taken, by its place in the order dealt, and the deal popped: an
 * answer pays its cost in the one `answer` stage and lands in its landing's stages after it, a
 * reward is laid in the discard pile in the one `reward` stage and the rewards beside it are gone. While a deal still stands nothing more
 * resolves; once none does, the last reward taken resumes the end of turn where the captures left
 * it, and the last answer taken draws the hand. A take made while no deal stands, one at a place the
 * deal does not offer, and one of an answer the city cannot pay for are one `refused` stage on the
 * chronicle as it stood.
 */
function take(catalogue: Catalogue, chronicle: Chronicle, at: number): Stage[] {
  const [deal, ...waiting] = chronicle.deals;
  if (deal === undefined) return [holdingNothing('refused', chronicle)];
  const id = offered(catalogue, deal)[at];
  if (id === undefined) return [holdingNothing('refused', chronicle)];

  const popped: Chronicle = { ...chronicle, deals: waiting };
  switch (deal.of) {
    case 'event': {
      if (!playable(answerRefusal(catalogue, chronicle, deal.event, id))) {
        return [holdingNothing('refused', chronicle)];
      }
      const stages = answered(catalogue, popped, answerOf(catalogue, deal.event, id));
      return [...stages, ...resumed(outcome(stages), drawn)];
    }
    case 'camp': {
      const landed = rewarded(popped, id);
      return [
        holdingNothing('reward', landed),
        ...resumed(landed, (left) => turnOpened(catalogue, left)),
      ];
    }
  }
}

/** What a take goes on to resolve: nothing while a deal still stands, and the rest where none does. */
function resumed(chronicle: Chronicle, rest: (left: Chronicle) => Stage[]): Stage[] {
  return chronicle.deals.length > 0 ? [] : rest(chronicle);
}

/**
 * The steps that fill the hand, each with the chronicle it leaves: the draw, the shuffle a dry draw
 * pile needs, and the draw that follows it. A step that changed nothing is absent.
 */
function drawn(chronicle: Chronicle): Stage[] {
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (stage: Stage): void => {
    if (stage.chronicle === standing) return;
    standing = stage.chronicle;
    stages.push(stage);
  };

  staged(change('drawn', draw(standing)));
  staged(change('shuffled', shuffle(standing)));
  staged(change('drawn', draw(standing)));
  return stages;
}

/** The city's fall: the chronicle records what took it and on which turn, and ends there. */
function fall(chronicle: Chronicle, cause: DefeatCause): Chronicle {
  return { ...chronicle, ending: { outcome: 'defeat', cause, turn: chronicle.turn } };
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
 * its effect lands. A play the hand, the city, the map or the discard pile refuses is one `refused`
 * stage on the chronicle as it stood, nothing paid or discarded.
 */
function play(catalogue: Catalogue, chronicle: Chronicle, command: PlayCommand): Stage[] {
  const id = chronicle.hand[command.index];
  if (id === undefined || !playable(refusalOf(catalogue, chronicle, id))) {
    return [holdingNothing('refused', chronicle)];
  }
  const effect = aimedEffect(catalogue, chronicle, id, command);
  if (effect === undefined) return [holdingNothing('refused', chronicle)];

  const hand = chronicle.hand.filter((_, at) => at !== command.index);
  const leaving = leavesChronicle(cardOf(catalogue, id))
    ? change('left', { ...chronicle, hand })
    : change('discarded', { ...chronicle, hand, discardPile: [...chronicle.discardPile, id] });
  const costs = costOf(catalogue, id);
  const cost = (left: Chronicle): Landed =>
    costs.length === 0 ? unchanged(left) : landedAs(change('stock', paid(left, costs)));
  return [grouped('played', followed(followed(landedAs(leaving), cost), effect))];
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

/**
 * One unit of the player's crossing to a tile its move points reach, in as many steps as the player
 * likes: the cheapest route there is spent, and the crossing is the same `move` stage the enemy
 * phase raises. A unit that is not the player's, a move on turn 0, or a tile it cannot land on — an
 * uncharted one among them — is one `refused` stage.
 */
function move(catalogue: Catalogue, chronicle: Chronicle, mover: number, to: TileCoords): Stage[] {
  const unit = unitOf(chronicle.units, mover);
  if (unit === undefined || unit.faction !== 'player')
    return [holdingNothing('refused', chronicle)];

  const landing = byHand(catalogue, chronicle, unit).landings.find(
    (reached) => tileKey(reached.tile) === tileKey(to),
  );
  if (landing === undefined) return [holdingNothing('refused', chronicle)];

  const crossed = chronicle.units.map((other) =>
    other.id === mover
      ? { ...other, tile: landing.tile, movePoints: other.movePoints - landing.cost }
      : other,
  );
  return [
    {
      kind: 'change',
      name: 'move',
      from: unit.tile,
      to: landing.tile,
      chronicle: { ...chronicle, units: crossed },
    },
  ];
}

/**
 * One unit of the player's attacking what stands on a tile its range reaches: the attacker spends
 * one of its action, and the target loses the attacker's damage or is killed by it. Nobody moves. A
 * unit that is not the player's, a worker, one with no action left, an attack on turn 0, and a tile
 * no unit of another faction within range stands on are one `refused` stage.
 */
function attack(
  catalogue: Catalogue,
  chronicle: Chronicle,
  attacker: number,
  at: TileCoords,
): Stage[] {
  const unit = unitOf(chronicle.units, attacker);
  if (unit === undefined || unit.faction !== 'player')
    return [holdingNothing('refused', chronicle)];

  const target = byHand(catalogue, chronicle, unit).targets.find(
    (other) => tileKey(other.tile) === tileKey(at),
  );
  if (target === undefined) return [holdingNothing('refused', chronicle)];

  const damaged = attacked(chronicle.units, unit, target).map((other) =>
    other.id === attacker ? spentAction(other) : other,
  );
  return [
    {
      kind: 'group',
      name: 'attack',
      attacker: unit.tile,
      target: target.tile,
      chronicle: { ...chronicle, units: damaged },
      stages: [],
    },
  ];
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

/** The end of the turn: what is left of the hand goes to the discard pile. */
function discard(chronicle: Chronicle): Chronicle {
  if (chronicle.hand.length === 0) return chronicle;
  return {
    ...chronicle,
    hand: [],
    discardPile: [...chronicle.discardPile, ...chronicle.hand],
  };
}

/**
 * The enemies' half of the turn: an enemy that stood on the city's tile through the whole turn
 * captures it and the chronicle ends there; otherwise every enemy acts in unit order, on the
 * chronicle the one before it left, as it stands there; one killed before its turn acts no more —
 * it moves by its script on the move points it holds, spending what the tiles it crosses cost, and
 * then attacks the unit its script names while it holds action, one attack a point. A stage each,
 * and none for a move it did not make or an attack aimed at nobody.
 */
function enemyPhase(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  if (chronicle.city !== undefined && occupied(chronicle.units, chronicle.city)) {
    return [change('ended', fall(chronicle, 'capture'))];
  }

  const stages: Stage[] = [];
  let units = chronicle.units;
  for (const rostered of chronicle.units) {
    const found = units.find((unit) => unit.id === rostered.id);
    if (found?.faction !== 'enemy') continue;
    const script = enemyScript(catalogue, found.script);
    let acting = found;

    const landing = script.moveTo(catalogue, { ...chronicle, units }, acting);
    if (tileKey(landing.tile) !== tileKey(acting.tile)) {
      const from = acting.tile;
      acting = { ...acting, tile: landing.tile, movePoints: acting.movePoints - landing.cost };
      units = units.map((other) => (other.id === acting.id ? acting : other));
      stages.push({
        kind: 'change',
        name: 'move',
        from,
        to: acting.tile,
        chronicle: { ...chronicle, units },
      });
    }

    while (acting.action > 0) {
      const target = script.attacks(catalogue, { ...chronicle, units }, acting);
      if (target === undefined) break;
      const damaged = attacked(units, acting, target);
      acting = spentAction(acting);
      units = damaged.map((other) => (other.id === acting.id ? acting : other));
      stages.push({
        kind: 'group',
        name: 'attack',
        attacker: acting.tile,
        target: target.tile,
        chronicle: { ...chronicle, units },
        stages: [],
      });
    }
  }

  return stages;
}

/**
 * The camps rolling their own warriors, in tile order: each camp whose tile no unit stands on draws
 * once from the seeded generator whatever its odds, and its unit enters on it where the draw falls
 * under them. A stage each warrior entered, carrying the camp's tile. A draw that entered nothing
 * raises no stage, so the chronicle the last draw left is handed back beside the stages.
 */
function campsRolled(
  catalogue: Catalogue,
  chronicle: Chronicle,
): { readonly stages: Change[]; readonly chronicle: Chronicle } {
  const stages: Change[] = [];
  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(standing.units, { q, r }) !== undefined) continue;

    const step = nextRng(standing.rng);
    standing = { ...standing, rng: step.rng };
    if (step.value >= catalogue.camp.odds) continue;
    const entering = entered(catalogue, standing, campUnit(catalogue, { q, r }));
    standing = entering.chronicle;
    stages.push(...entering.stages);
  }
  return { stages, chronicle: standing };
}

/**
 * The camps captured, in tile order: a camp a unit of the player's is still standing on once the
 * enemy phase is over leaves its tile's building slot, and the camp's rewards are dealt behind the
 * deals already standing. A stage each, carrying the tile the camp stood on.
 */
function captures(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  const stages: Stage[] = [];
  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(chronicle.units, { q, r })?.faction !== 'player') continue;

    const at = tileKey({ q, r });
    standing = {
      ...standing,
      tiles: standing.tiles.map((tile) =>
        tileKey(tile) === at ? { ...tile, building: undefined } : tile,
      ),
      deals: [...standing.deals, { of: 'camp', rewards: catalogue.camp.rewards }],
    };
    stages.push({
      kind: 'group',
      name: 'camp-capture',
      tile: { q, r },
      chronicle: standing,
      stages: [],
    });
  }
  return stages;
}
