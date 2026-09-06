import { CARDS, type CardId, type InstantCard } from './cards';
import { arrival, ENEMY_SCRIPTS } from './enemies';
import {
  BUILDINGS,
  type BuildingTypeId,
  CITY_TILE,
  generateMap,
  IMPROVEMENTS,
  type ImprovementId,
  neighbours,
  type River,
  type Terrain,
  type Tile,
  type TileCoords,
  tileKey,
  tileYield,
} from './map';
import type { Rng } from './rng';
import { seedRng, shuffle as shuffleItems } from './rng';
import {
  attackable,
  attacked,
  reachable,
  refreshedAction,
  refreshedMovePoints,
  UNIT_STATS,
  type Unit,
  unitAt,
} from './units';

/** The five core resources, then culture. Population is inhabitants, not a store. */
export const RESOURCES = ['food', 'production', 'military', 'money', 'science', 'culture'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;

/** What took the city: an enemy captured it, or it was left without population. */
export type DefeatCause = 'capture' | 'population';

/** The city's fall, recorded on the chronicle it ended: what took it, and the turn it fell on. */
export type Defeat = { readonly cause: DefeatCause; readonly turn: number };

/** Everything one city's story is made of, and the generator every later draw comes from. */
export type Chronicle = {
  readonly seed: number;
  readonly rng: Rng;
  readonly tiles: Tile[];
  /** The rivers the generator ran, each the corners it passes through along the edges between tiles. */
  readonly rivers: River[];
  readonly city: TileCoords;
  readonly held: TileCoords[];
  readonly turn: number;
  readonly resources: Resources;
  readonly population: number;
  /** The tiles an inhabitant stands on, at most one to a tile; every other inhabitant is idle. */
  readonly assigned: TileCoords[];
  readonly units: Unit[];
  readonly drawPile: CardId[];
  readonly hand: CardId[];
  readonly discardPile: CardId[];
  readonly defeat?: Defeat;
};

/**
 * What a play was aimed at, in the type the card declares: the tile a building card builds on, or
 * the unit an instant acts on, by its place in `units`.
 */
export type Target =
  | { readonly type: 'tile'; readonly tile: TileCoords }
  | { readonly type: 'unit'; readonly unit: number };

export type Command =
  | { readonly type: 'end-turn' }
  | { readonly type: 'play'; readonly index: number; readonly target?: Target }
  | { readonly type: 'move'; readonly unit: number; readonly tile: TileCoords }
  | { readonly type: 'attack'; readonly unit: number; readonly tile: TileCoords }
  | { readonly type: 'assign'; readonly tile: TileCoords }
  | { readonly type: 'claim'; readonly tile: TileCoords };

/** What one unit of the player's is commanded by hand: crossing to a tile, or attacking on one. */
export type UnitCommand = Extract<Command, { readonly unit: number }>;

/** The inhabitants on no tile: what a unit card takes, and what an assign has to give a tile. */
export function idle(chronicle: Chronicle): number {
  return chronicle.population - chronicle.assigned.length;
}

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
 * on a tile or taken off one, `claim` is a tile bought with culture and taken inside the border,
 * `grow` is the food stock spent on one more inhabitant, `turn` is the tick, where every unit's move
 * points and action are refreshed, `events` is what the schedule lands, `intents` is the enemy
 * phase's declarations, and `capture` is the city falling to an enemy that stood on its tile.
 */
export type PlainStage =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
  | 'discard'
  | 'income'
  | 'grow'
  | 'intents'
  | 'capture'
  | 'turn'
  | 'events'
  | 'draw'
  | 'shuffle';

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one unit's attack, the player's by hand or an enemy's intent executed in combat, and a `move` is
 * one unit crossing, the player's or the enemy phase's alike; each names the tiles it happened
 * between, because what the chronicle after the step cannot say is carried on the step itself.
 */
export type Stage = { readonly chronicle: Chronicle } & (
  | { readonly name: PlainStage }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * The founding: the seed generates the map, the city fills the slot of the tile it stands on, it
 * holds that tile and the six around it with an inhabitant assigned to each and two idle besides,
 * and the deck it is founded on is shuffled into its draw pile.
 */
export function beginChronicle(seed: number, deck: readonly CardId[]): Chronicle {
  const map = generateMap(seedRng(seed));
  const shuffled = shuffleItems(map.rng, deck);
  const held = [...FOUNDING_HELD];
  const tiles: Tile[] = map.tiles.map((tile) =>
    tileKey(tile) === tileKey(CITY_TILE) ? { ...tile, building: 'PH_City' } : tile,
  );
  return draw(
    shuffle(
      draw(
        events({
          seed,
          rng: shuffled.rng,
          tiles,
          rivers: map.rivers,
          city: CITY_TILE,
          held,
          turn: 1,
          resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
          population: held.length + IDLE_FOUNDED,
          assigned: [...held],
          units: [],
          drawPile: shuffled.items,
          hand: [],
          discardPile: [],
        }),
      ),
    ),
  );
}

/**
 * The one way a chronicle changes: every command the player has goes through here, and answers the
 * stages it resolves as — never none. A chronicle that has ended refuses them all, and a city left
 * without population falls on the last stage whatever the command was.
 */
export function apply(chronicle: Chronicle, command: Command): Stage[] {
  if (chronicle.defeat !== undefined) return [{ name: 'refused', chronicle }];

  const stages = stagesOf(chronicle, command);

  const last = stages[stages.length - 1];
  if (last.chronicle.defeat !== undefined || last.chronicle.population > 0) return stages;
  return [...stages.slice(0, -1), { ...last, chronicle: fall(last.chronicle, 'population') }];
}

/** What each command resolves as, before the fall the city may have come to on the last of them. */
function stagesOf(chronicle: Chronicle, command: Command): Stage[] {
  switch (command.type) {
    case 'end-turn':
      return endOfTurn(chronicle);
    case 'play':
      return play(chronicle, command.index, command.target);
    case 'move':
      return move(chronicle, command.unit, command.tile);
    case 'attack':
      return attack(chronicle, command.unit, command.tile);
    case 'assign':
      return assign(chronicle, command.tile);
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
  raised(combat(standing));
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

/**
 * What the city or the map has against a card or a claim the cost alone would let through: the city
 * down to the last inhabitant it keeps, no inhabitant idle to turn into a unit or to stand on a
 * tile, a unit already on the city tile, no tile to aim at, no unit to refresh.
 */
export type Block = 'population' | 'idle' | 'city' | 'tile' | 'unit';

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

function holds(chronicle: Chronicle, tile: TileCoords): boolean {
  return chronicle.held.some((coord) => tileKey(coord) === tileKey(tile));
}

/** The tiles the city may claim: on the map, not held, and touching a tile it holds. */
export function claimable(chronicle: Chronicle): TileCoords[] {
  const held = new Set(chronicle.held.map(tileKey));
  return chronicle.tiles
    .filter(
      (tile) =>
        !held.has(tileKey(tile)) && neighbours(tile).some((coord) => held.has(tileKey(coord))),
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
 * What a city-mode click on this tile costs, in the shape a card's cost comes in: the culture a
 * claim asks for, and nothing at all on a tile the city already holds.
 */
export function tileCost(chronicle: Chronicle, tile: TileCoords): Cost[] {
  return holds(chronicle, tile)
    ? []
    : [{ resource: 'culture', amount: cultureThreshold(chronicle) }];
}

/**
 * Everything standing between the city and the tile a city-mode click lands on: the idle population
 * an assign has none of, and the culture a claim falls short of. A tile the city neither holds nor
 * may claim is no act of the city's at all, and answers nothing.
 */
export function tileRefusal(chronicle: Chronicle, tile: TileCoords): Refusal | undefined {
  if (holds(chronicle, tile)) {
    const standing = chronicle.assigned.some((coord) => tileKey(coord) === tileKey(tile));
    return { unaffordable: [], blocked: standing || idle(chronicle) > 0 ? [] : ['idle'] };
  }
  if (!claimable(chronicle).some((coord) => tileKey(coord) === tileKey(tile))) return undefined;
  return { unaffordable: unaffordable(chronicle, tileCost(chronicle, tile)), blocked: [] };
}

/**
 * What a city-mode click on a tile sends: an assign on a tile the city holds, a claim on one it may
 * claim, and nothing at all on a tile it has no act on or when the rules refuse the act. The one
 * decision both the chronicle screen and `apply` answer that click by.
 */
export function cityCommand(chronicle: Chronicle, tile: TileCoords): Command | undefined {
  const refusal = tileRefusal(chronicle, tile);
  if (refusal === undefined || !playable(refusal)) return undefined;
  return { type: holds(chronicle, tile) ? 'assign' : 'claim', tile };
}

/** The resources a cost outruns; empty means the city can pay it. */
function unaffordable(chronicle: Chronicle, costs: readonly Cost[]): Resource[] {
  return costs
    .filter(({ resource, amount }) => amount > chronicle.resources[resource])
    .map(({ resource }) => resource);
}

/** The one thing every card aimed at a tile asks of it: a worker of the player's standing there. */
function worked(chronicle: Chronicle, tile: TileCoords): boolean {
  const standing = unitAt(chronicle.units, tile);
  return standing?.faction === 'player' && standing.stats.id === 'PH_Worker';
}

/**
 * Where a building can be built: a tile inside the border, of the terrain that building stands on,
 * whose building slot is free and where a worker of the player's stands.
 */
export function buildable(chronicle: Chronicle, building: BuildingTypeId): TileCoords[] {
  const held = new Set(chronicle.held.map(tileKey));
  return chronicle.tiles
    .filter(
      (tile) =>
        held.has(tileKey(tile)) &&
        tile.building === undefined &&
        tile.terrain === BUILDINGS[building].terrain &&
        worked(chronicle, tile),
    )
    .map(({ q, r }) => ({ q, r }));
}

/**
 * Where an improvement can be improved: a tile of the terrain that improvement goes on, inside the
 * border or not, where a worker of the player's stands and which does not carry it already.
 */
export function improvable(chronicle: Chronicle, improvement: ImprovementId): TileCoords[] {
  return chronicle.tiles
    .filter(
      (tile) =>
        tile.terrain === IMPROVEMENTS[improvement].terrain &&
        !tile.improvements.includes(improvement) &&
        worked(chronicle, tile),
    )
    .map(({ q, r }) => ({ q, r }));
}

/**
 * Where a terrain can be terraformed: a tile of that terrain, inside the border or not, whose
 * building slot is empty and where a worker of the player's stands.
 */
export function terraformable(chronicle: Chronicle, from: Terrain): TileCoords[] {
  return chronicle.tiles
    .filter(
      (tile) => tile.terrain === from && tile.building === undefined && worked(chronicle, tile),
    )
    .map(({ q, r }) => ({ q, r }));
}

/** The tiles an instant can be aimed at; one that lands whole is aimed at none. */
function instantTiles(chronicle: Chronicle, card: InstantCard): TileCoords[] {
  switch (card.effect) {
    case 'gain':
    case 'refresh':
      return [];
    case 'improve':
      return improvable(chronicle, card.improvement);
    case 'terraform':
      return terraformable(chronicle, card.from);
  }
}

/** The units an instant can be aimed at, each by its place in `units`. */
function instantUnits(chronicle: Chronicle, card: InstantCard): number[] {
  switch (card.effect) {
    case 'gain':
    case 'improve':
    case 'terraform':
      return [];
    case 'refresh':
      return chronicle.units.flatMap((unit, at) =>
        unit.faction === 'player' && unit.movePoints < unit.stats.move ? [at] : [],
      );
  }
}

/** The tiles a card of the `tile` target type can be aimed at. */
export function targetTiles(chronicle: Chronicle, id: CardId): TileCoords[] {
  const card = CARDS[id];
  switch (card.kind) {
    case 'building':
      return buildable(chronicle, card.building);
    case 'instant':
      return instantTiles(chronicle, card);
    case 'unit':
      return [];
  }
}

/** The units a card of the `unit` target type can be aimed at, each by its place in `units`. */
export function targetUnits(chronicle: Chronicle, id: CardId): number[] {
  const card = CARDS[id];
  switch (card.kind) {
    case 'instant':
      return instantUnits(chronicle, card);
    case 'building':
    case 'unit':
      return [];
  }
}

/**
 * Every block a card the city can pay for still stands against: there is nothing for it to resolve
 * on. A unit card can be held up by all three of its at once, and answers them in that order.
 */
function blocked(chronicle: Chronicle, id: CardId): Block[] {
  const card = CARDS[id];
  switch (card.kind) {
    case 'unit': {
      const blocks: Block[] = [];
      if (chronicle.population <= 1) blocks.push('population');
      if (idle(chronicle) <= 0) blocks.push('idle');
      if (unitAt(chronicle.units, chronicle.city) !== undefined) blocks.push('city');
      return blocks;
    }
    case 'building':
    case 'instant':
      switch (card.target) {
        case 'none':
          return [];
        case 'tile':
          return targetTiles(chronicle, id).length === 0 ? ['tile'] : [];
        case 'unit':
          return targetUnits(chronicle, id).length === 0 ? ['unit'] : [];
      }
  }
}

/**
 * One card played: the play opens on the `played` stage, where the card has left the hand for the
 * discard pile and its cost is paid, and what the card does follows. A play the hand, the city or
 * the map refuses is one `refused` stage on the chronicle as it stood.
 */
function play(chronicle: Chronicle, index: number, target: Target | undefined): Stage[] {
  const id = chronicle.hand[index];
  if (id === undefined || !playable(refusalOf(chronicle, id))) {
    return [{ name: 'refused', chronicle }];
  }

  const resources = { ...chronicle.resources };
  for (const { resource, amount } of costOf(id)) resources[resource] -= amount;
  const paid: Chronicle = {
    ...chronicle,
    resources,
    hand: chronicle.hand.filter((_, at) => at !== index),
    discardPile: [...chronicle.discardPile, id],
  };

  return resolve(paid, id, target) ?? [{ name: 'refused', chronicle }];
}

/**
 * What the card does, on the chronicle its cost is already paid on: the stages it resolves as,
 * opening with the `played` one. An effect that lands whole is inside that stage and raises no
 * other. `undefined` refuses the play, and nothing is paid or discarded.
 */
function resolve(paid: Chronicle, id: CardId, target: Target | undefined): Stage[] | undefined {
  const card = CARDS[id];
  switch (card.kind) {
    case 'unit': {
      const entered: Chronicle = {
        ...paid,
        population: paid.population - 1,
        units: [
          ...paid.units,
          {
            stats: { ...UNIT_STATS[card.unitType] },
            faction: 'player',
            tile: paid.city,
            movePoints: UNIT_STATS[card.unitType].move,
            action: UNIT_STATS[card.unitType].action,
          },
        ],
      };
      return [{ name: 'played', chronicle: entered }];
    }
    case 'building': {
      const built = build(paid, card.building, target);
      return built === undefined ? undefined : [{ name: 'played', chronicle: built }];
    }
    case 'instant': {
      const landed = instant(paid, card, target);
      return landed === undefined ? undefined : [{ name: 'played', chronicle: landed }];
    }
  }
}

/**
 * The instant card's one effect: the resources it gains land in the stores, the unit it was aimed at
 * has its move points refreshed, and the improvement or the terraform lands on the tile it was aimed
 * at — the worker that stands there stays where it is, and a terraformed tile loses the feature that
 * lay on the terrain it was.
 */
function instant(
  paid: Chronicle,
  card: InstantCard,
  target: Target | undefined,
): Chronicle | undefined {
  if (card.effect === 'gain') {
    const resources = { ...paid.resources };
    for (const resource of RESOURCES) resources[resource] += card.gain[resource] ?? 0;
    return { ...paid, resources };
  }

  if (card.effect === 'refresh') {
    if (target?.type !== 'unit') return undefined;
    const aimed = target.unit;
    if (!instantUnits(paid, card).includes(aimed)) return undefined;
    return {
      ...paid,
      units: paid.units.map((unit, at) => (at === aimed ? refreshedMovePoints(unit) : unit)),
    };
  }

  if (target?.type !== 'tile') return undefined;
  const at = tileKey(target.tile);
  if (!instantTiles(paid, card).some((coord) => tileKey(coord) === at)) return undefined;

  const after = (tile: Tile): Tile =>
    card.effect === 'improve'
      ? { ...tile, improvements: [...tile.improvements, card.improvement] }
      : { ...tile, terrain: card.to, feature: undefined };
  return { ...paid, tiles: paid.tiles.map((tile) => (tileKey(tile) === at ? after(tile) : tile)) };
}

/** The building card: the building fills the slot of the tile it is aimed at. */
function build(
  chronicle: Chronicle,
  building: BuildingTypeId,
  target: Target | undefined,
): Chronicle | undefined {
  if (target?.type !== 'tile') return undefined;
  const at = tileKey(target.tile);
  if (!buildable(chronicle, building).some((coord) => tileKey(coord) === at)) return undefined;

  return {
    ...chronicle,
    tiles: chronicle.tiles.map((tile) => (tileKey(tile) === at ? { ...tile, building } : tile)),
  };
}

/**
 * One unit of the player's crossing to a tile its move points reach, in as many steps as the player
 * likes: the tiles crossed are spent, and the crossing is the same `move` stage the enemy phase
 * raises. A unit that is not the player's, or a tile it cannot land on, is one `refused` stage.
 */
function move(chronicle: Chronicle, mover: number, to: TileCoords): Stage[] {
  const unit = chronicle.units[mover];
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const landing = reachable(chronicle.tiles, chronicle.units, unit).find(
    (reached) => tileKey(reached.tile) === tileKey(to),
  );
  if (landing === undefined) return [{ name: 'refused', chronicle }];

  const crossed = chronicle.units.map((other, at) =>
    at === mover
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
  const unit = chronicle.units[attacker];
  if (unit === undefined || unit.faction !== 'player') return [{ name: 'refused', chronicle }];

  const target = attackable(chronicle.units, unit).find(
    (index) => tileKey(chronicle.units[index].tile) === tileKey(at),
  );
  if (target === undefined) return [{ name: 'refused', chronicle }];

  // The attacker's action is spent before the blow, because a killed target leaves the list and
  // carries every place after it one down — the attacker's own among them.
  const spending = chronicle.units.map((other, index) =>
    index === attacker ? { ...other, action: other.action - 1 } : other,
  );
  return [
    {
      name: 'attack',
      attacker: unit.tile,
      target: chronicle.units[target].tile,
      chronicle: { ...chronicle, units: attacked(spending, attacker, target) },
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
 * Combat, one stage per attack: every enemy still standing executes the intent it declared, in unit
 * order. Executing an intent spends it, whether or not anything was still standing on the tile it
 * was aimed at. The player's own attacks are made by hand during the turn and none is made here.
 */
function combat(chronicle: Chronicle): Stage[] {
  const stages: Stage[] = [];
  let units = chronicle.units;
  // Combat moves nobody, so the tile a unit stands on names it as the killed leave the list.
  const standing = (at: TileCoords): number =>
    units.findIndex((unit) => tileKey(unit.tile) === tileKey(at));

  const landed = (attacker: TileCoords, target: TileCoords, after: Unit[]): void => {
    units = after;
    stages.push({ name: 'attack', attacker, target, chronicle: { ...chronicle, units } });
  };

  for (const unit of chronicle.units) {
    if (unit.faction !== 'enemy' || unit.intent === undefined) continue;
    const attacker = standing(unit.tile);
    if (attacker === -1) continue;
    const target = standing(unit.intent);
    const hit = target !== -1 && units[target].faction !== unit.faction;
    landed(
      unit.tile,
      unit.intent,
      spent(hit ? attacked(units, attacker, target) : units, unit.tile),
    );
  }

  return stages;
}

/** An intent executed is an intent gone: the enemy on that tile carries none into the next turn. */
function spent(units: readonly Unit[], at: TileCoords): Unit[] {
  return units.map((unit) =>
    unit.faction === 'enemy' && tileKey(unit.tile) === tileKey(at)
      ? { ...unit, intent: undefined }
      : unit,
  );
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
 * captures it and the chronicle ends there; otherwise every enemy moves by its script on the move
 * points it holds, spending the tiles it crosses — one stage each, and none for an enemy that
 * stayed — and then every enemy declares the intent it executes in the next combat, all of them in
 * the one stage that closes the phase.
 */
function enemyPhase(chronicle: Chronicle): Stage[] {
  if (unitAt(chronicle.units, chronicle.city)?.faction === 'enemy') {
    return [{ name: 'capture', chronicle: fall(chronicle, 'capture') }];
  }

  const stages: Stage[] = [];
  const units = [...chronicle.units];
  for (const [index, unit] of units.entries()) {
    if (unit.faction !== 'enemy') continue;
    const landing = ENEMY_SCRIPTS[unit.script].moveTo({ ...chronicle, units }, index);
    if (tileKey(landing.tile) === tileKey(unit.tile)) continue;
    units[index] = {
      ...unit,
      tile: landing.tile,
      movePoints: unit.movePoints - landing.cost,
    };
    stages.push({
      name: 'move',
      from: unit.tile,
      to: landing.tile,
      chronicle: { ...chronicle, units: [...units] },
    });
  }

  const declared = [...units];
  for (const [index, unit] of declared.entries()) {
    if (unit.faction !== 'enemy') continue;
    const intent = ENEMY_SCRIPTS[unit.script].intentOf({ ...chronicle, units: declared }, index);
    declared[index] = { ...unit, intent };
  }

  const stirred = declared.some((unit, index) => aimKey(unit) !== aimKey(units[index]));
  if (stirred) stages.push({ name: 'intents', chronicle: { ...chronicle, units: declared } });
  return stages;
}

/** All the declarations can leave changed on a unit: the tile its attack is aimed at. */
function aimKey(unit: Unit): string {
  return unit.faction === 'enemy' && unit.intent !== undefined ? tileKey(unit.intent) : '';
}
