import { type AimedCard, aimOf, CARDS, leavesChronicle, refuses, struck } from './cards';
import { assign, type CityCommand, claim, founding, grow, income, reassign } from './city';
import { ENEMY_SCRIPTS } from './enemies';
import { CITY_TILE, generateMap, type Tile, type TileCoords, tileKey } from './map';
import { RESOURCES } from './resources';
import { seedRng, shuffle as shuffleItems } from './rng';
import { events, reinforced, scheduled, survived, taken } from './schedule';
import { charted } from './sight';
import {
  type Block,
  type CardId,
  type Chronicle,
  type Cost,
  type DefeatCause,
  type EventId,
  playable,
  type Refusal,
  type Snapshot,
  unaffordable,
} from './state';
import {
  attackable,
  attacked,
  occupied,
  reachable,
  refreshedAction,
  refreshedMovePoints,
  spentAction,
  unitAt,
  unitOf,
} from './units';

export type Command =
  | { readonly type: 'end-turn' }
  /** One entry of the deal the events phase left standing, taken to land. */
  | { readonly type: 'take'; readonly event: EventId }
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
 * with its cost paid, `refused` is the command the rules turned down, `assign` is an inhabitant put
 * on a tile, taken off one, or taken off one and put on another, `claim` is a tile bought with
 * culture and taken inside the border, `grow` is the food stock spent on one more inhabitant,
 * `turn` is the tick, where every unit's move points and action are refreshed, `reinforce` is the
 * capstone's warriors entering on the camps, `deal` is what the schedule offers on a due turn,
 * `events` is the entry taken landing, `strike` is every hazard the hand still holds striking,
 * `capture` is the city falling to an enemy that stood on its tile, and `victory` is the city still
 * standing at the end of the capstone's last turn.
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
  | 'deal'
  | 'events'
  | 'draw'
  | 'shuffle';

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one unit's attack, the player's by hand or an enemy's in the enemy phase, a `move` is one unit
 * crossing, the player's or the enemy phase's alike, and a `camp-capture` is one camp taken by the
 * unit standing on it; each names the tiles it happened between or on, because what the chronicle
 * after the step cannot say is carried on the step itself.
 */
export type Stage = { readonly chronicle: Chronicle } & (
  | { readonly name: PlainStage }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
  | { readonly name: 'camp-capture'; readonly tile: TileCoords }
);

/**
 * The founding: the seed generates the map, the city fills the slot of the tile it stands on, the
 * border and the inhabitants inside it are what a founding starts on, the deck it is founded on is
 * shuffled into its draw pile, and the map is charted of what the city sees from the first turn.
 */
export function beginChronicle(seed: number, deck: readonly CardId[]): Chronicle {
  const map = generateMap(seedRng(seed));
  const shuffled = shuffleItems(map.rng, deck);
  const tiles: Tile[] = map.tiles.map((tile) =>
    tileKey(tile) === tileKey(CITY_TILE) ? { ...tile, building: 'PH_City' } : tile,
  );
  return charted(
    draw(
      shuffle(
        draw(
          events({
            seed,
            ...scheduled(shuffled.rng),
            tiles,
            snapshots: [],
            rivers: map.rivers,
            city: CITY_TILE,
            ...founding(),
            turn: 1,
            deal: [],
            resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
            units: [],
            nextUnit: 1,
            drawPile: shuffled.items,
            hand: [],
            discardPile: [],
          }),
        ),
      ),
    ),
  );
}

/**
 * The one way a chronicle changes: every command the player has goes through here, and answers the
 * stages it resolves as — never none, each of them charted of what stood in sight when it ended.
 */
export function apply(chronicle: Chronicle, command: Command): Stage[] {
  return charting(chronicle.snapshots, resolved(chronicle, command));
}

/**
 * The stages a command resolves as before the map is charted. A chronicle that has ended refuses
 * every command and one waiting on a deal every command but the take, and a city left without
 * population falls on the last stage whatever it was.
 */
function resolved(chronicle: Chronicle, command: Command): Stage[] {
  if (chronicle.ending !== undefined) return [{ name: 'refused', chronicle }];
  if (chronicle.deal.length > 0 && command.type !== 'take') {
    return [{ name: 'refused', chronicle }];
  }

  const stages = stagesOf(chronicle, command);

  const last = stages[stages.length - 1];
  if (last.chronicle.ending !== undefined || last.chronicle.population > 0) return stages;
  return [...stages.slice(0, -1), { ...last, chronicle: fall(last.chronicle, 'population') }];
}

/**
 * Every stage with its own chronicle charted, each carrying on from the snapshots the stage before
 * it left. Every stage a command resolves as is built off the chronicle the command started on, so
 * the snapshots the first of them carries are already the ones it started with, and a command that
 * charted nothing hands back the very stage it was given.
 */
function charting(taken: Snapshot[], stages: readonly Stage[]): Stage[] {
  let standing = taken;
  return stages.map((stage) => {
    const carried =
      stage.chronicle.snapshots === standing
        ? stage.chronicle
        : { ...stage.chronicle, snapshots: standing };
    const seen = charted(carried);
    standing = seen.snapshots;
    return seen === stage.chronicle ? stage : { ...stage, chronicle: seen };
  });
}

/** What each command resolves as, before the fall the city may have come to on the last of them. */
function stagesOf(chronicle: Chronicle, command: Command): Stage[] {
  switch (command.type) {
    case 'end-turn':
      return endOfTurn(chronicle);
    case 'take':
      return take(chronicle, command.event);
    case 'play':
      return play(chronicle, command);
    case 'move':
      return move(chronicle, command.unit, command.tile);
    case 'attack':
      return attack(chronicle, command.unit, command.tile);
    case 'assign':
      return acted(chronicle, 'assign', assign(chronicle, command.tile));
    case 'reassign':
      return acted(chronicle, 'assign', reassign(chronicle, command.from, command.to));
    case 'claim':
      return acted(chronicle, 'claim', claim(chronicle, command.tile));
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
 * nothing is absent, and the list ends at the capture when the city falls in the enemy phase, at the
 * victory when the city is still standing once the capstone's last turn is over, or at the deal a due
 * turn's events phase leaves standing — the hand waits on the take. The turn always ticks, so there
 * is always a stage.
 */
function endOfTurn(chronicle: Chronicle): Stage[] {
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

  staged('strike', struck(standing));
  staged('discard', discard(standing));
  staged('income', income(standing));
  staged('grow', grow(standing));
  raised(enemyPhase(standing));
  if (standing.ending !== undefined) return stages;
  raised(captures(standing));
  if (survived(standing)) {
    staged('victory', victory(standing));
    return stages;
  }

  staged('turn', {
    ...standing,
    turn: standing.turn + 1,
    units: standing.units.map((unit) => refreshedAction(refreshedMovePoints(unit))),
  });
  staged('reinforce', reinforced(standing));
  staged('deal', events(standing));
  if (standing.deal.length > 0) return stages;
  raised(drawn(standing));
  return stages;
}

/**
 * One dealt entry taken: it lands in the one `events` stage, and the hand is drawn on the chronicle
 * it leaves. An entry the deal does not hold, and a take made while no deal stands, are one
 * `refused` stage on the chronicle as it stood.
 */
function take(chronicle: Chronicle, event: EventId): Stage[] {
  if (!chronicle.deal.includes(event)) return [{ name: 'refused', chronicle }];

  const landed = taken(chronicle, event);
  return [{ name: 'events', chronicle: landed }, ...drawn(landed)];
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

/** The capstone stood out: the chronicle records the turn it ended on, and ends there. */
function victory(chronicle: Chronicle): Chronicle {
  return { ...chronicle, ending: { outcome: 'victory', turn: chronicle.turn } };
}

/** What a card costs, resource by resource, in the order the resource bar reads. */
export function costOf(id: CardId): Cost[] {
  const { cost } = CARDS[id];
  const entries: Cost[] = [];
  for (const resource of RESOURCES) {
    const amount = cost[resource];
    if (amount !== undefined) entries.push({ resource, amount });
  }
  return entries;
}

export function refusalOf(chronicle: Chronicle, id: CardId): Refusal {
  return { unaffordable: unaffordable(chronicle, costOf(id)), blocked: blocked(chronicle, id) };
}

/**
 * Every tile a card's aim admits, what the aim refuses the whole of the filter. The one list the
 * play and the map a card is aimed over both read.
 */
export function admitted(chronicle: Chronicle, card: AimedCard): TileCoords[] {
  return chronicle.tiles
    .filter((tile) => refuses(chronicle, card, tile) === undefined)
    .map(({ q, r }) => ({ q, r }));
}

/**
 * Every block a card the city can pay for still stands against: there is nothing for it to resolve
 * on. A card that lands whole and one aimed at the discard pile answer with the blocks they declare,
 * in the order they declare them; a card aimed at a tile or at a unit answers with none, the map
 * being no part of what the hand judges it by.
 */
function blocked(chronicle: Chronicle, id: CardId): Block[] {
  const card = aimOf(CARDS[id]);
  switch (card.aim) {
    case 'none':
      return card.blocked?.(chronicle) ?? [];
    case 'discard-pile':
      return card.blocked(chronicle);
    case 'tile':
    case 'unit':
      return [];
  }
}

/**
 * One card played: the aim is judged on the chronicle as it stands, the same one the map lit its
 * tiles from; then, on the one `played` stage, the card has left the hand for the discard pile — or
 * for nowhere at all, single use or hazard as it is — its cost is paid and its effect has landed. A
 * play the hand, the city, the map or the discard pile refuses is one `refused` stage on the
 * chronicle as it stood, nothing paid or discarded.
 */
function play(chronicle: Chronicle, command: PlayCommand): Stage[] {
  const id = chronicle.hand[command.index];
  if (id === undefined || !playable(refusalOf(chronicle, id))) {
    return [{ name: 'refused', chronicle }];
  }
  const effect = aimedEffect(chronicle, id, command);
  if (effect === undefined) return [{ name: 'refused', chronicle }];

  const resources = { ...chronicle.resources };
  for (const { resource, amount } of costOf(id)) resources[resource] -= amount;
  const paid: Chronicle = {
    ...chronicle,
    resources,
    hand: chronicle.hand.filter((_, at) => at !== command.index),
    discardPile: leavesChronicle(CARDS[id])
      ? chronicle.discardPile
      : [...chronicle.discardPile, id],
  };
  return [{ name: 'played', chronicle: effect(paid) }];
}

/**
 * The card's effect with what the play aimed it at, judged on the chronicle before anything is paid,
 * ready for the chronicle its cost is paid on. A play aimed another way than the card is aimed lands
 * nowhere. A card aimed at a tile or at a unit takes one the aim admits and no other; one aimed at
 * the discard pile takes a place the pile holds as it stands; a card that lands whole takes nothing
 * at all. `undefined` refuses the play.
 */
function aimedEffect(
  chronicle: Chronicle,
  id: CardId,
  command: PlayCommand,
): ((paid: Chronicle) => Chronicle) | undefined {
  const card = aimOf(CARDS[id]);
  switch (card.aim) {
    case 'none':
      return command.aim === 'none' ? card.effect : undefined;
    case 'tile':
    case 'unit': {
      const tile = aimedTile(command, card.aim);
      if (tile === undefined) return undefined;
      const at = tileKey(tile);
      if (!admitted(chronicle, card).some((coord) => tileKey(coord) === at)) return undefined;
      return (paid) => card.effect(paid, tile);
    }
    case 'discard-pile': {
      if (command.aim !== 'discard-pile') return undefined;
      const at = command.card;
      if (at < 0 || at >= chronicle.discardPile.length) return undefined;
      return (paid) => card.effect(paid, at);
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
 * One unit of the player's crossing to a tile its move points reach, in as many steps as the player
 * likes: the cheapest route there is spent, and the crossing is the same `move` stage the enemy
 * phase raises. A unit that is not the player's, or a tile it cannot land on — an uncharted one
 * among them — is one `refused` stage.
 */
function move(chronicle: Chronicle, mover: number, to: TileCoords): Stage[] {
  const unit = unitOf(chronicle.units, mover);
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const landing = reachable(chronicle, unit).find(
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
 * unit that is not the player's, a worker, one with no action left, and a tile no unit of another
 * faction within range stands on are one `refused` stage.
 */
function attack(chronicle: Chronicle, attacker: number, at: TileCoords): Stage[] {
  const unit = unitOf(chronicle.units, attacker);
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const target = attackable(chronicle.units, unit).find(
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
function enemyPhase(chronicle: Chronicle): Stage[] {
  if (occupied(chronicle.units, chronicle.city)) {
    return [{ name: 'capture', chronicle: fall(chronicle, 'capture') }];
  }

  const stages: Stage[] = [];
  let units = chronicle.units;
  for (const rostered of chronicle.units) {
    const found = units.find((unit) => unit.id === rostered.id);
    if (found?.faction !== 'enemy') continue;
    const script = ENEMY_SCRIPTS[found.script];
    let acting = found;

    const landing = script.moveTo({ ...chronicle, units }, acting);
    if (tileKey(landing.tile) !== tileKey(acting.tile)) {
      const from = acting.tile;
      acting = { ...acting, tile: landing.tile, movePoints: acting.movePoints - landing.cost };
      units = units.map((other) => (other.id === acting.id ? acting : other));
      stages.push({ name: 'move', from, to: acting.tile, chronicle: { ...chronicle, units } });
    }

    while (acting.action > 0) {
      const target = script.attacks({ ...chronicle, units }, acting);
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
 * The camps captured, in tile order: a camp a unit of the player's is still standing on once the
 * enemy phase is over leaves its tile's building slot, and its reward card is laid in the discard
 * pile. A stage each, carrying the tile the camp stood on.
 */
function captures(chronicle: Chronicle): Stage[] {
  const stages: Stage[] = [];
  let standing = chronicle;
  for (const { q, r, building } of chronicle.tiles) {
    if (building !== 'PH_Camp') continue;
    if (unitAt(chronicle.units, { q, r })?.faction !== 'player') continue;

    const at = tileKey({ q, r });
    standing = {
      ...standing,
      tiles: standing.tiles.map((tile) =>
        tileKey(tile) === at ? { ...tile, building: undefined } : tile,
      ),
      discardPile: [...standing.discardPile, 'PH_Spoils'],
    };
    stages.push({ name: 'camp-capture', tile: { q, r }, chronicle: standing });
  }
  return stages;
}
