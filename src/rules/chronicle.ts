import { aimOf, leavesChronicle, refuses, struck } from './cards';
import {
  type AimedCard,
  type Catalogue,
  cardOf,
  checkContent,
  type Deck,
  enemyScript,
} from './catalogue';
import { assign, type CityCommand, claim, grow, income, reassign } from './city';
import { campUnitEntered } from './enemies';
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
import { carriedOver, charted, unitsGone } from './sight';
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
 * A step that carries nothing but the chronicle it left. `played` is the card gone from the hand
 * with its cost paid, `refused` is the command the rules turned down, `assign` is one population put
 * on a tile, taken off one, or taken off one and put on another, `claim` is a tile bought with
 * culture and taken inside the border, `grow` is the food stock spent on one more population,
 * `turn` is the tick, where every unit's move points and action are refreshed, `reinforce` is the
 * capstone's second script on a turn after its landing, `capstone` is the capstone landing on its
 * turn, `deal` is what the timeline offers on a due turn, `no-deal` is a due turn dealing nothing
 * and the next deal rolled from it, `events` is the answer taken landing,
 * `reward` is the reward taken laid in the discard pile, `strike` is every hazard the hand still
 * holds striking, `capture` is the city falling to an enemy that stood on its tile, and `victory` is
 * the capstone passed at the end of a turn.
 */
export type PlainStage =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
  | 'strike'
  | 'discard'
  | 'income'
  | 'grow'
  | 'capture'
  | 'victory'
  | 'turn'
  | 'reinforce'
  | 'capstone'
  | 'deal'
  | 'no-deal'
  | 'events'
  | 'reward'
  | 'draw'
  | 'shuffle';

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one unit's attack, the player's by hand or an enemy's in the enemy phase, a `move` is one unit
 * crossing, the player's or the enemy phase's alike, a `camp-enter` is one warrior a camp rolled
 * entering on it, and a `camp-capture` is one camp taken by the unit standing on it; each names the
 * tiles it happened between or on, because what the chronicle after the step cannot say is carried
 * on the step itself.
 */
export type Stage = { readonly chronicle: Chronicle } & (
  | { readonly name: PlainStage }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
  | { readonly name: 'camp-enter'; readonly tile: TileCoords }
  | { readonly name: 'camp-capture'; readonly tile: TileCoords }
);

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
  if (chronicle.ending !== undefined) return [{ name: 'refused', chronicle }];
  if (chronicle.deals.length > 0 && command.type !== 'take') {
    return [{ name: 'refused', chronicle }];
  }

  const stages = stagesOf(catalogue, chronicle, command);
  const at = stages.findIndex(({ chronicle: left }) => falling(left));
  if (at < 0) return stages;
  const fell = stages[at];
  return [...stages.slice(0, at), { ...fell, chronicle: fall(fell.chronicle, 'population') }];
}

/** Whether the chronicle stands on a city with no population left: the fall by population. */
function falling(chronicle: Chronicle): boolean {
  return (
    chronicle.ending === undefined && chronicle.city !== undefined && chronicle.population <= 0
  );
}

/**
 * Every stage with its own chronicle charted, each carrying on from the snapshots the stage before
 * it left and keeping whatever the stage charted itself. Every stage a command resolves as is built
 * off the chronicle the command started on, which is what tells the two apart, so the chronicle the
 * command stood on is handed to the carrying as the base. The units leave the snapshots here, on the
 * stage the turn ticks on, because the snapshots a stage's own chronicle carries are that base's,
 * stale by a turn. A command that charted nothing hands back the very stage it was given.
 */
function charting(catalogue: Catalogue, started: Chronicle, stages: readonly Stage[]): Stage[] {
  let standing = started.snapshots;
  let turn = started.turn;
  return stages.map((stage) => {
    if (stage.chronicle.turn !== turn) standing = unitsGone(standing);
    turn = stage.chronicle.turn;
    const snapshots = carriedOver(standing, {
      own: stage.chronicle.snapshots,
      builtOff: started.snapshots,
    });
    const carried =
      stage.chronicle.snapshots === snapshots ? stage.chronicle : { ...stage.chronicle, snapshots };
    const seen = charted(catalogue, carried);
    standing = seen.snapshots;
    return seen === stage.chronicle ? stage : { ...stage, chronicle: seen };
  });
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
  if (left === undefined) return [{ name: 'refused', chronicle }];
  return [{ name, chronicle: left }];
}

/** The chronicle a command left: the last stage's, for whoever wants the state and not the play. */
export function outcome(stages: readonly Stage[]): Chronicle {
  return stages[stages.length - 1].chronicle;
}

/**
 * The end of turn, step by ordered step, each with the chronicle it leaves: a step that changed
 * nothing is absent, and the list ends at the capture when the city falls in the enemy phase, or at
 * the last camp captured while a camp's rewards stand — the rest of the end of turn waits on their
 * take. Otherwise the turn opens as `turnOpened` has it. Turn 0's end runs none of the cycle and
 * opens on the tick, which takes the settle cards left in hand. There is always a stage. A turn ended
 * while the city stands nowhere is one `refused` stage.
 */
function endOfTurn(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  if (chronicle.city === undefined) return [{ name: 'refused', chronicle }];
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (name: PlainStage, next: Chronicle): void => {
    if (next === standing) return;
    standing = next;
    stages.push({ name, chronicle: next });
  };
  /** The steps that resolve unit by unit hand their stages over already made. */
  const raised = (sequence: readonly Stage[]): void => {
    for (const stage of sequence) {
      standing = stage.chronicle;
      stages.push(stage);
    }
  };

  if (standing.turn > 0) {
    staged('strike', struck(catalogue, standing));
    staged('discard', discard(standing));
    staged('income', income(catalogue, standing));
    staged('grow', grow(standing));
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
 * the victory does not end it, and the capstone's landing is staged on its turn even where it
 * changed nothing.
 */
function turnOpened(catalogue: Catalogue, chronicle: Chronicle): Stage[] {
  if (passed(catalogue, chronicle)) return [{ name: 'victory', chronicle: victory(chronicle) }];
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (name: PlainStage, next: Chronicle): void => {
    if (next === standing) return;
    standing = next;
    stages.push({ name, chronicle: next });
  };

  staged('turn', {
    ...standing,
    turn: standing.turn + 1,
    hand: standing.turn === 0 ? [] : standing.hand,
    units: standing.units.map((unit) => refreshedAction(refreshedMovePoints(unit))),
  });
  staged('reinforce', continued(catalogue, standing));
  const phase = events(catalogue, standing);
  switch (phase.phase) {
    case 'capstone':
      standing = phase.chronicle;
      stages.push({ name: 'capstone', chronicle: standing });
      break;
    case 'deal':
      staged('deal', phase.chronicle);
      if (standing.deals.length > 0) return stages;
      break;
    case 'no-deal':
      staged('no-deal', phase.chronicle);
      break;
  }
  return [...stages, ...drawn(standing)];
}

/**
 * One entry of the deal standing taken, by its place in the order dealt, and the deal popped: an
 * answer pays its cost and lands in the one `events` stage, a reward is laid in the discard pile in
 * the one `reward` stage and the rewards beside it are gone. While a deal still stands nothing more
 * resolves; once none does, the last reward taken resumes the end of turn where the captures left
 * it, and the last answer taken draws the hand. A take made while no deal stands, one at a place the
 * deal does not offer, and one of an answer the city cannot pay for are one `refused` stage on the
 * chronicle as it stood.
 */
function take(catalogue: Catalogue, chronicle: Chronicle, at: number): Stage[] {
  const [deal, ...waiting] = chronicle.deals;
  if (deal === undefined) return [{ name: 'refused', chronicle }];
  const id = offered(catalogue, deal)[at];
  if (id === undefined) return [{ name: 'refused', chronicle }];

  const popped: Chronicle = { ...chronicle, deals: waiting };
  switch (deal.of) {
    case 'event': {
      if (!playable(answerRefusal(catalogue, chronicle, deal.event, id))) {
        return [{ name: 'refused', chronicle }];
      }
      const landed = answered(catalogue, popped, answerOf(catalogue, deal.event, id));
      return [{ name: 'events', chronicle: landed }, ...resumed(landed, drawn)];
    }
    case 'camp': {
      const landed = rewarded(popped, id);
      return [
        { name: 'reward', chronicle: landed },
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
  const staged = (name: PlainStage, next: Chronicle): void => {
    if (next === standing) return;
    standing = next;
    stages.push({ name, chronicle: next });
  };

  staged('draw', draw(standing));
  staged('shuffle', shuffle(standing));
  staged('draw', draw(standing));
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
 * tiles from; then, on the one `played` stage, the card has left the hand for the discard pile — or
 * for nowhere at all, as a settle card, a single use card and a hazard do — its cost is paid and its
 * effect has landed. A play the hand, the city, the map or the discard pile refuses is one `refused`
 * stage on the chronicle as it stood, nothing paid or discarded.
 */
function play(catalogue: Catalogue, chronicle: Chronicle, command: PlayCommand): Stage[] {
  const id = chronicle.hand[command.index];
  if (id === undefined || !playable(refusalOf(catalogue, chronicle, id))) {
    return [{ name: 'refused', chronicle }];
  }
  const effect = aimedEffect(catalogue, chronicle, id, command);
  if (effect === undefined) return [{ name: 'refused', chronicle }];

  const left = paid(chronicle, costOf(catalogue, id));
  return [
    {
      name: 'played',
      chronicle: effect({
        ...left,
        hand: chronicle.hand.filter((_, at) => at !== command.index),
        discardPile: leavesChronicle(cardOf(catalogue, id))
          ? chronicle.discardPile
          : [...chronicle.discardPile, id],
      }),
    },
  ];
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
): ((paid: Chronicle) => Chronicle) | undefined {
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
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const landing = byHand(catalogue, chronicle, unit).landings.find(
    (reached) => tileKey(reached.tile) === tileKey(to),
  );
  if (landing === undefined) return [{ name: 'refused', chronicle }];

  const crossed = chronicle.units.map((other) =>
    other.id === mover
      ? { ...other, tile: landing.tile, movePoints: other.movePoints - landing.cost }
      : other,
  );
  return [
    {
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
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const target = byHand(catalogue, chronicle, unit).targets.find(
    (other) => tileKey(other.tile) === tileKey(at),
  );
  if (target === undefined) return [{ name: 'refused', chronicle }];

  const damaged = attacked(chronicle.units, unit, target).map((other) =>
    other.id === attacker ? spentAction(other) : other,
  );
  return [
    {
      name: 'attack',
      attacker: unit.tile,
      target: target.tile,
      chronicle: { ...chronicle, units: damaged },
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
    return [{ name: 'capture', chronicle: fall(chronicle, 'capture') }];
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
      stages.push({ name: 'move', from, to: acting.tile, chronicle: { ...chronicle, units } });
    }

    while (acting.action > 0) {
      const target = script.attacks(catalogue, { ...chronicle, units }, acting);
      if (target === undefined) break;
      const damaged = attacked(units, acting, target);
      acting = spentAction(acting);
      units = damaged.map((other) => (other.id === acting.id ? acting : other));
      stages.push({
        name: 'attack',
        attacker: acting.tile,
        target: target.tile,
        chronicle: { ...chronicle, units },
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
): { readonly stages: Stage[]; readonly chronicle: Chronicle } {
  const stages: Stage[] = [];
  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== catalogue.camp.building) continue;
    if (unitAt(standing.units, { q, r }) !== undefined) continue;

    const step = nextRng(standing.rng);
    standing = { ...standing, rng: step.rng };
    if (step.value >= catalogue.camp.odds) continue;
    standing = campUnitEntered(catalogue, standing, { q, r });
    stages.push({ name: 'camp-enter', tile: { q, r }, chronicle: standing });
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
    stages.push({ name: 'camp-capture', tile: { q, r }, chronicle: standing });
  }
  return stages;
}
