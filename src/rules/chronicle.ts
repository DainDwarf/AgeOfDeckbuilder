import { type AimedCard, CARDS, refuses } from './cards';
import { arrival, ENEMY_SCRIPTS } from './enemies';
import {
  CITY_TILE,
  generateMap,
  neighbours,
  type Tile,
  type TileCoords,
  tileKey,
  tileYield,
} from './map';
import { RESOURCES, type Resource } from './resources';
import { seedRng, shuffle as shuffleItems } from './rng';
import { charted } from './sight';
import {
  assignedTo,
  type Block,
  type CardId,
  type Chronicle,
  type DefeatCause,
  holds,
  idle,
  type Snapshot,
} from './state';
import {
  attackable,
  attacked,
  reachable,
  refreshedAction,
  refreshedMovePoints,
  unitAt,
  unitOf,
} from './units';

export type Command =
  | { readonly type: 'end-turn' }
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
  | { readonly type: 'assign'; readonly tile: TileCoords }
  | {
      readonly type: 'reassign';
      /** The tile the inhabitant stands on, and the tile it stands on once this has resolved. */
      readonly from: TileCoords;
      readonly to: TileCoords;
    }
  | { readonly type: 'claim'; readonly tile: TileCoords };

/**
 * What one unit of the player's, named by its number, is commanded by hand: crossing to a tile, or
 * attacking on one.
 */
export type UnitCommand = Extract<Command, { readonly unit: number }>;

/** One inhabitant taken off the tile it stands on and put on another, in the one gesture. */
export type ReassignCommand = Extract<Command, { readonly type: 'reassign' }>;

/** One card of the hand played, aimed the way the card is: at nothing, a tile, a unit or the discard pile. */
type PlayCommand = Extract<Command, { readonly type: 'play' }>;

/** A full hand. */
const HAND_SIZE = 5;

/** How many inhabitants the founding leaves on no tile, on top of one for each tile it holds. */
const IDLE_FOUNDED = 2;

/** What the founding holds: the city's own tile and the six around it. */
const FOUNDING_HELD: readonly TileCoords[] = [CITY_TILE, ...neighbours(CITY_TILE)];

/** What the first claim past the founding's tiles costs, and how many claims each rise lasts. */
const CLAIM_FIRST = 1;
const CLAIMS_PER_RISE = 3;

/**
 * A step that carries nothing but the chronicle it left. `played` is the card gone from the hand
 * with its cost paid, `refused` is the command the rules turned down, `assign` is an inhabitant put
 * on a tile, taken off one, or taken off one and put on another, `claim` is a tile bought with
 * culture and taken inside the border, `grow` is the food stock spent on one more inhabitant,
 * `turn` is the tick, where every unit's move points and action are refreshed, `events` is what
 * the schedule lands, and `capture` is the city falling to an enemy that stood on its tile.
 */
export type PlainStage =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
  | 'discard'
  | 'income'
  | 'grow'
  | 'capture'
  | 'turn'
  | 'events'
  | 'draw'
  | 'shuffle';

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one unit's attack, the player's by hand or an enemy's in the enemy phase, and a `move` is one unit
 * crossing, the player's or the enemy phase's alike; each names the tiles it happened between,
 * because what the chronicle after the step cannot say is carried on the step itself.
 */
export type Stage = { readonly chronicle: Chronicle } & (
  | { readonly name: PlainStage }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * The founding: the seed generates the map, the city fills the slot of the tile it stands on, it
 * holds that tile and the six around it with an inhabitant assigned to each and two idle besides,
 * the deck it is founded on is shuffled into its draw pile, and the map is charted of what the city
 * sees from the first turn.
 */
export function beginChronicle(seed: number, deck: readonly CardId[]): Chronicle {
  const map = generateMap(seedRng(seed));
  const shuffled = shuffleItems(map.rng, deck);
  const held = [...FOUNDING_HELD];
  const tiles: Tile[] = map.tiles.map((tile) =>
    tileKey(tile) === tileKey(CITY_TILE) ? { ...tile, building: 'PH_City' } : tile,
  );
  return charted(
    draw(
      shuffle(
        draw(
          events({
            seed,
            rng: shuffled.rng,
            tiles,
            snapshots: [],
            rivers: map.rivers,
            city: CITY_TILE,
            held,
            turn: 1,
            resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
            population: held.length + IDLE_FOUNDED,
            assigned: [...held],
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
 * every command, and a city left without population falls on the last stage whatever it was.
 */
function resolved(chronicle: Chronicle, command: Command): Stage[] {
  if (chronicle.defeat !== undefined) return [{ name: 'refused', chronicle }];

  const stages = stagesOf(chronicle, command);

  const last = stages[stages.length - 1];
  if (last.chronicle.defeat !== undefined || last.chronicle.population > 0) return stages;
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
    case 'play':
      return play(chronicle, command);
    case 'move':
      return move(chronicle, command.unit, command.tile);
    case 'attack':
      return attack(chronicle, command.unit, command.tile);
    case 'assign':
      return assign(chronicle, command.tile);
    case 'reassign':
      return reassign(chronicle, command.from, command.to);
    case 'claim':
      return claim(chronicle, command.tile);
  }
}

/**
 * One tile assigned or unassigned: the inhabitant already on it comes off, and an idle one goes on
 * a tile the city holds. Anything the city-mode click on that tile is not, or is refused for, is
 * one `refused` stage on the chronicle as it stood.
 */
function assign(chronicle: Chronicle, tile: TileCoords): Stage[] {
  if (cityCommand(chronicle, tile)?.type !== 'assign') return [{ name: 'refused', chronicle }];

  const at = tileKey(tile);
  const on = chronicle.assigned.filter((coord) => tileKey(coord) !== at);
  if (on.length < chronicle.assigned.length) {
    return [{ name: 'assign', chronicle: { ...chronicle, assigned: on } }];
  }
  return [
    { name: 'assign', chronicle: { ...chronicle, assigned: [...on, { q: tile.q, r: tile.r }] } },
  ];
}

/**
 * One inhabitant off the tile it stands on and onto another: the one drag in city mode is the one
 * `assign` stage, so the chronicle is left with the same population and the same idle count. A drag
 * the rules have no act of the city's for is one `refused` stage on the chronicle as it stood.
 */
function reassign(chronicle: Chronicle, from: TileCoords, to: TileCoords): Stage[] {
  if (cityDrag(chronicle, from, to) === undefined) return [{ name: 'refused', chronicle }];

  const off = tileKey(from);
  return [
    {
      name: 'assign',
      chronicle: {
        ...chronicle,
        assigned: [
          ...chronicle.assigned.filter((coord) => tileKey(coord) !== off),
          { q: to.q, r: to.r },
        ],
      },
    },
  ];
}

/**
 * One tile claimed: the culture is paid, the tile joins the tiles the city holds, and an idle
 * inhabitant stands on it at once when the city has one. Anything the city-mode click on that tile
 * is not, or is refused for, is one `refused` stage on the chronicle as it stood.
 */
function claim(chronicle: Chronicle, tile: TileCoords): Stage[] {
  if (cityCommand(chronicle, tile)?.type !== 'claim') return [{ name: 'refused', chronicle }];

  const taken = { q: tile.q, r: tile.r };
  const staffed = idle(chronicle) > 0;
  return [
    {
      name: 'claim',
      chronicle: {
        ...chronicle,
        resources: {
          ...chronicle.resources,
          culture: chronicle.resources.culture - cultureThreshold(chronicle),
        },
        held: [...chronicle.held, taken],
        assigned: staffed ? [...chronicle.assigned, taken] : chronicle.assigned,
      },
    },
  ];
}

/** The chronicle a command left: the last stage's, for whoever wants the state and not the play. */
export function outcome(stages: readonly Stage[]): Chronicle {
  return stages[stages.length - 1].chronicle;
}

/**
 * The end of turn, step by ordered step, each with the chronicle it leaves: a step that changed
 * nothing is absent, and the list ends at the capture when the city falls in the enemy phase. The
 * turn always ticks, so there is always a stage.
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

  staged('discard', discard(standing));
  staged('income', income(standing));
  staged('grow', grow(standing));
  raised(enemyPhase(standing));
  if (standing.defeat !== undefined) return stages;

  staged('turn', {
    ...standing,
    turn: standing.turn + 1,
    units: standing.units.map((unit) => refreshedAction(refreshedMovePoints(unit))),
  });
  staged('events', events(standing));
  staged('draw', draw(standing));
  staged('shuffle', shuffle(standing));
  staged('draw', draw(standing));
  return stages;
}

/** The city's fall: the chronicle records what took it and on which turn, and ends there. */
function fall(chronicle: Chronicle, cause: DefeatCause): Chronicle {
  return { ...chronicle, defeat: { cause, turn: chronicle.turn } };
}

/** What one thing asks for of one resource: a card's cost line by line, a claim's culture. */
export type Cost = { readonly resource: Resource; readonly amount: number };

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

/** Everything standing between the city and a card or a claim: what it cannot pay, and the map. */
export type Refusal = {
  readonly unaffordable: readonly Resource[];
  readonly blocked: readonly Block[];
};

/** What a card outside the hand is drawn as: nothing refuses it. */
export const NO_REFUSAL: Refusal = { unaffordable: [], blocked: [] };

export function refusalOf(chronicle: Chronicle, id: CardId): Refusal {
  return { unaffordable: unaffordable(chronicle, costOf(id)), blocked: blocked(chronicle, id) };
}

export function playable(refusal: Refusal): boolean {
  return refusal.unaffordable.length === 0 && refusal.blocked.length === 0;
}

/** The tiles the city may claim: charted, not held, and touching a tile it holds. */
export function claimable(chronicle: Chronicle): TileCoords[] {
  const held = new Set(chronicle.held.map(tileKey));
  const chartedTiles = new Set(chronicle.snapshots.map(tileKey));
  return chronicle.tiles
    .filter(
      (tile) =>
        chartedTiles.has(tileKey(tile)) &&
        !held.has(tileKey(tile)) &&
        neighbours(tile).some((coord) => held.has(tileKey(coord))),
    )
    .map(({ q, r }) => ({ q, r }));
}

/**
 * The culture threshold, what the next claim costs: one culture, and one more for every three tiles
 * claimed past the seven the founding holds.
 */
function cultureThreshold(chronicle: Chronicle): number {
  const claimed = Math.max(0, chronicle.held.length - FOUNDING_HELD.length);
  return CLAIM_FIRST + Math.floor(claimed / CLAIMS_PER_RISE);
}

/**
 * What the city's act on this tile costs, in the shape a card's cost comes in: the culture a claim
 * asks for, and nothing at all on a tile the city already holds.
 */
export function tileCost(chronicle: Chronicle, tile: TileCoords): Cost[] {
  return holds(chronicle, tile)
    ? []
    : [{ resource: 'culture', amount: cultureThreshold(chronicle) }];
}

/**
 * Everything standing between the city and its act on this tile: the idle population an assign has
 * none of, and the culture a claim falls short of. A tile the city neither holds nor may claim — an
 * uncharted one among them — is no act of the city's at all, and answers nothing.
 */
export function tileRefusal(chronicle: Chronicle, tile: TileCoords): Refusal | undefined {
  if (holds(chronicle, tile)) {
    const standing = assignedTo(chronicle, tile);
    return { unaffordable: [], blocked: standing || idle(chronicle) > 0 ? [] : ['idle'] };
  }
  if (!claimable(chronicle).some((coord) => tileKey(coord) === tileKey(tile))) return undefined;
  return { unaffordable: unaffordable(chronicle, tileCost(chronicle, tile)), blocked: [] };
}

/**
 * What the city's act on a tile sends — the second left click on the selection in city mode: an
 * assign on a tile the city holds, a claim on one it may claim, and nothing at all on a tile it has
 * no act on or when the rules refuse the act. The one decision both the chronicle screen and `apply`
 * answer that click by.
 */
export function cityCommand(chronicle: Chronicle, tile: TileCoords): Command | undefined {
  const refusal = tileRefusal(chronicle, tile);
  if (refusal === undefined || !playable(refusal)) return undefined;
  return { type: holds(chronicle, tile) ? 'assign' : 'claim', tile };
}

/**
 * What a drag in city mode sends — the press taken on one tile and let go on another: the
 * inhabitant off the tile it stands on and onto the tile it was let go on, which the city has to
 * hold with nobody standing on it. Nothing at all for any other pair of tiles, the same tile twice
 * among them. The one decision both the chronicle screen and `apply` answer that drag by.
 */
export function cityDrag(
  chronicle: Chronicle,
  from: TileCoords,
  to: TileCoords,
): ReassignCommand | undefined {
  if (!assignedTo(chronicle, from)) return undefined;
  if (!holds(chronicle, to) || assignedTo(chronicle, to)) return undefined;
  return { type: 'reassign', from, to };
}

/** The resources a cost outruns; empty means the city can pay it. */
function unaffordable(chronicle: Chronicle, costs: readonly Cost[]): Resource[] {
  return costs
    .filter(({ resource, amount }) => amount > chronicle.resources[resource])
    .map(({ resource }) => resource);
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
  const card = CARDS[id];
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
 * tiles from; then, on the one `played` stage, the card has left the hand for the discard pile, its
 * cost is paid and its effect has landed. A play the hand, the city, the map or the discard pile
 * refuses is one `refused` stage on the chronicle as it stood, nothing paid or discarded.
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
    discardPile: [...chronicle.discardPile, id],
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
  const card = CARDS[id];
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
 * unit that is not the player's, one with no action left, and a tile no unit of another faction
 * within range stands on are one `refused` stage.
 */
function attack(chronicle: Chronicle, attacker: number, at: TileCoords): Stage[] {
  const unit = unitOf(chronicle.units, attacker);
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const target = attackable(chronicle.units, unit).find(
    (other) => tileKey(other.tile) === tileKey(at),
  );
  if (target === undefined) return [{ name: 'refused', chronicle }];

  const struck = attacked(chronicle.units, unit, target).map((other) =>
    other.id === attacker ? { ...other, action: other.action - 1 } : other,
  );
  return [
    {
      name: 'attack',
      attacker: unit.tile,
      target: target.tile,
      chronicle: { ...chronicle, units: struck },
    },
  ];
}

/** The schedule stands in at one event: `PH_Arrival` brings an enemy to the outer ring every fifth turn. */
function events(chronicle: Chronicle): Chronicle {
  return chronicle.turn % 5 === 0 ? arrival(chronicle) : chronicle;
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
 * Income: an assigned tile yields what its layers and the river running along it give, the city's
 * own tile no exception.
 */
function income(chronicle: Chronicle): Chronicle {
  const assigned = new Set(chronicle.assigned.map(tileKey));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!assigned.has(tileKey(tile))) continue;
    if (unitAt(chronicle.units, tile)?.faction === 'enemy') continue;
    const yields = tileYield(tile, chronicle.rivers);
    for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  }
  return RESOURCES.every((resource) => resources[resource] === chronicle.resources[resource])
    ? chronicle
    : { ...chronicle, resources };
}

/** The growth threshold, what the next inhabitant costs: the population it joins. */
export function growthThreshold(chronicle: Chronicle): number {
  return chronicle.population;
}

/** Growth: the food stock that has reached the growth threshold is spent on one idle inhabitant. */
function grow(chronicle: Chronicle): Chronicle {
  const threshold = growthThreshold(chronicle);
  // A threshold of nothing every stock reaches: a city of nobody would grow one and undo its fall.
  if (threshold === 0 || chronicle.resources.food < threshold) return chronicle;
  return {
    ...chronicle,
    resources: { ...chronicle.resources, food: chronicle.resources.food - threshold },
    population: chronicle.population + 1,
  };
}

/**
 * The enemies' half of the turn: an enemy that stood on the city's tile through the whole turn
 * captures it and the chronicle ends there; otherwise every enemy acts in unit order, on the
 * chronicle the one before it left — it moves by its script on the move points it holds, spending
 * what the tiles it crosses cost, and then attacks the unit its script names while it holds action,
 * one attack a point. A stage each, and none for a move it did not make or an attack aimed at nobody.
 */
function enemyPhase(chronicle: Chronicle): Stage[] {
  if (unitAt(chronicle.units, chronicle.city)?.faction === 'enemy') {
    return [{ name: 'capture', chronicle: fall(chronicle, 'capture') }];
  }

  const stages: Stage[] = [];
  let units = chronicle.units;
  for (const enemy of chronicle.units) {
    if (enemy.faction !== 'enemy') continue;
    const script = ENEMY_SCRIPTS[enemy.script];
    let acting = enemy;

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
      const struck = attacked(units, acting, target);
      acting = { ...acting, action: acting.action - 1 };
      units = struck.map((other) => (other.id === acting.id ? acting : other));
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
