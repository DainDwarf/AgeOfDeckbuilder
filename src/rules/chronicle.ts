import { CARDS, type CardId } from './cards';
import { arrival, ENEMY_SCRIPTS } from './enemies';
import {
  BUILDINGS,
  type BuildingTypeId,
  CITY_TILE,
  generateMap,
  neighbours,
  type Tile,
  type TileCoords,
  tileKey,
  tileYield,
} from './map';
import type { Rng } from './rng';
import { seedRng, shuffle as shuffleItems } from './rng';
import { attack, leastHealth, reachable, UNIT_STATS, type Unit, unitAt } from './units';

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
  readonly city: TileCoords;
  readonly held: TileCoords[];
  readonly turn: number;
  readonly resources: Resources;
  readonly population: number;
  readonly units: Unit[];
  readonly drawPile: CardId[];
  readonly hand: CardId[];
  readonly discardPile: CardId[];
  readonly defeat?: Defeat;
};

/**
 * What a play was aimed at, in the type the card declares: the tile a building card builds on, or
 * the unit an order acts on — by its place in `units` — and the tile it is sent to.
 */
export type Target =
  | { readonly type: 'tile'; readonly tile: TileCoords }
  | { readonly type: 'unit-tile'; readonly unit: number; readonly tile: TileCoords };

export type Command =
  | { readonly type: 'end-turn' }
  | { readonly type: 'play'; readonly index: number; readonly target?: Target };

/** A full hand. */
const HAND_SIZE = 5;

/**
 * A step that carries nothing but the chronicle it left. `played` is the card gone from the hand
 * with its cost paid, `refused` is the play the rules turned down, `turn` is the tick alone,
 * `events` is what the schedule lands, `intents` is the enemy phase's declarations, and `capture`
 * is the city falling to an enemy that stood on its tile.
 */
export type PlainStage =
  | 'played'
  | 'refused'
  | 'discard'
  | 'income'
  | 'intents'
  | 'capture'
  | 'turn'
  | 'events'
  | 'draw'
  | 'shuffle';

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one attack, combat's or an order's arrival alike, and a `move` is one unit crossing, the enemy
 * phase's or an order's alike; each names the tiles it happened between, because what the chronicle
 * after the step cannot say is carried on the step itself.
 */
export type Stage = { readonly chronicle: Chronicle } & (
  | { readonly name: PlainStage }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * The founding: the seed generates the map, the city fills the slot of the tile it stands on, it
 * holds that tile and the six around it, and the deck it is founded on is shuffled into its draw
 * pile.
 */
export function beginChronicle(seed: number, deck: readonly CardId[]): Chronicle {
  const map = generateMap(seedRng(seed));
  const shuffled = shuffleItems(map.rng, deck);
  const held = [CITY_TILE, ...neighbours(CITY_TILE)];
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
          city: CITY_TILE,
          held,
          turn: 1,
          resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
          population: held.length,
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

  const stages =
    command.type === 'end-turn'
      ? endOfTurn(chronicle)
      : play(chronicle, command.index, command.target);

  const last = stages[stages.length - 1];
  if (last.chronicle.defeat !== undefined || last.chronicle.population > 0) return stages;
  return [...stages.slice(0, -1), { ...last, chronicle: fall(last.chronicle, 'population') }];
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
  raised(enemyPhase(standing));
  if (standing.defeat !== undefined) return stages;

  staged('turn', { ...standing, turn: standing.turn + 1 });
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

/** What a card costs, resource by resource, in the order the resource bar reads. */
export function costOf(id: CardId): { resource: Resource; amount: number }[] {
  const { cost } = CARDS[id];
  const entries: { resource: Resource; amount: number }[] = [];
  for (const resource of RESOURCES) {
    const amount = cost[resource];
    if (amount !== undefined) entries.push({ resource, amount });
  }
  return entries;
}

/**
 * What the city or the map has against a card the cost alone would let through: no population to
 * turn into a unit, a unit already on the city tile, no tile to build on, no unit to move.
 */
export type Block = 'population' | 'city' | 'tile' | 'unit';

/** Everything standing between a card and being played: what the city cannot pay, and the map. */
export type Refusal = {
  readonly unaffordable: readonly Resource[];
  readonly blocked: readonly Block[];
};

/** What a card outside the hand is drawn as: nothing refuses it. */
export const NO_REFUSAL: Refusal = { unaffordable: [], blocked: [] };

export function refusalOf(chronicle: Chronicle, id: CardId): Refusal {
  return { unaffordable: unaffordable(chronicle, id), blocked: blocked(chronicle, id) };
}

export function playable(refusal: Refusal): boolean {
  return refusal.unaffordable.length === 0 && refusal.blocked.length === 0;
}

/** The resources this card's cost outruns; empty means the city can pay for it. */
function unaffordable(chronicle: Chronicle, id: CardId): Resource[] {
  return costOf(id)
    .filter(({ resource, amount }) => amount > chronicle.resources[resource])
    .map(({ resource }) => resource);
}

/**
 * Where a building can be built: a tile inside the border, of the terrain that building stands on,
 * whose building slot is free and where a worker of the player's stands.
 */
export function buildable(chronicle: Chronicle, building: BuildingTypeId): TileCoords[] {
  const held = new Set(chronicle.held.map(tileKey));
  return chronicle.tiles
    .filter((tile) => {
      if (!held.has(tileKey(tile)) || tile.building !== undefined) return false;
      if (tile.terrain !== BUILDINGS[building].terrain) return false;
      const standing = unitAt(chronicle.units, tile);
      return standing?.faction === 'player' && standing.stats.id === 'PH_Worker';
    })
    .map(({ q, r }) => ({ q, r }));
}

/** The tiles a card of the `tile` target type can be aimed at. */
export function targetTiles(chronicle: Chronicle, id: CardId): TileCoords[] {
  const card = CARDS[id];
  switch (card.kind) {
    case 'building':
      return buildable(chronicle, card.building);
    case 'unit':
    case 'order':
    case 'action':
      return [];
  }
}

/**
 * Every block a card the city can pay for still stands against: there is nothing for it to resolve
 * on. A unit card can be held up by both of its at once, and answers them in that order.
 */
function blocked(chronicle: Chronicle, id: CardId): Block[] {
  const card = CARDS[id];
  switch (card.kind) {
    case 'unit': {
      const blocks: Block[] = [];
      if (chronicle.population <= 1) blocks.push('population');
      if (unitAt(chronicle.units, chronicle.city) !== undefined) blocks.push('city');
      return blocks;
    }
    case 'building':
      return buildable(chronicle, card.building).length === 0 ? ['tile'] : [];
    case 'order':
      return chronicle.units.some(
        (unit) =>
          unit.faction === 'player' && reachable(chronicle.tiles, chronicle.units, unit).length > 0,
      )
        ? []
        : ['unit'];
    case 'action':
      return [];
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
          { stats: { ...UNIT_STATS[card.unitType] }, faction: 'player', tile: paid.city },
        ],
      };
      return [{ name: 'played', chronicle: entered }];
    }
    case 'building': {
      const built = build(paid, card.building, target);
      return built === undefined ? undefined : [{ name: 'played', chronicle: built }];
    }
    case 'order':
      return order(paid, target);
    case 'action': {
      const resources = { ...paid.resources };
      for (const resource of RESOURCES) resources[resource] += card.gain[resource] ?? 0;
      return [{ name: 'played', chronicle: { ...paid, resources } }];
    }
  }
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
 * The plain order: the unit crosses to a tile within its move, and its nature acts where it lands.
 * The crossing is the same `move` stage the enemy phase raises, the arrival the same `attack` stage
 * combat raises; a unit with no damage, or with none of the other faction in range, lands and does
 * nothing.
 */
function order(paid: Chronicle, target: Target | undefined): Stage[] | undefined {
  if (target?.type !== 'unit-tile') return undefined;
  const mover = target.unit;
  const to = target.tile;
  const unit = paid.units[mover];
  if (unit === undefined || unit.faction !== 'player') return undefined;

  const landings = reachable(paid.tiles, paid.units, unit);
  if (!landings.some((coord) => tileKey(coord) === tileKey(to))) return undefined;

  const moved = paid.units.map((other, at) => (at === mover ? { ...other, tile: to } : other));
  const stages: Stage[] = [
    { name: 'played', chronicle: paid },
    { name: 'move', from: unit.tile, to, chronicle: { ...paid, units: moved } },
  ];

  const struck = leastHealth(moved, mover);
  if (struck === undefined) return stages;
  return [
    ...stages,
    {
      name: 'attack',
      attacker: to,
      target: moved[struck].tile,
      chronicle: { ...paid, units: attack(moved, mover, struck) },
    },
  ];
}

/** The schedule stands in at one event: `PH_Arrival` brings an enemy to the rim every fifth turn. */
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
 * Combat, one stage per attack: the player's fighting units attack in unit order, each by the one
 * attack rule, and then every enemy still standing executes the intent it declared. Executing an
 * intent spends it, whether or not anything was still standing on the tile it was aimed at.
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
    if (unit.faction !== 'player') continue;
    const attacker = standing(unit.tile);
    if (attacker === -1) continue;
    const target = leastHealth(units, attacker);
    if (target === undefined) continue;
    landed(unit.tile, units[target].tile, attack(units, attacker, target));
  }

  for (const unit of chronicle.units) {
    if (unit.faction !== 'enemy' || unit.intent === undefined) continue;
    const attacker = standing(unit.tile);
    if (attacker === -1) continue;
    const target = standing(unit.intent);
    const hit = target !== -1 && units[target].faction !== unit.faction;
    landed(unit.tile, unit.intent, spent(hit ? attack(units, attacker, target) : units, unit.tile));
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

function income(chronicle: Chronicle): Chronicle {
  const held = new Set(chronicle.held.map(tileKey));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!held.has(tileKey(tile))) continue;
    if (unitAt(chronicle.units, tile)?.faction === 'enemy') continue;
    const yields = tileYield(tile);
    for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  }
  return RESOURCES.every((resource) => resources[resource] === chronicle.resources[resource])
    ? chronicle
    : { ...chronicle, resources };
}

/**
 * The enemies' half of the turn: an enemy that stood on the city's tile through the whole turn
 * captures it and the chronicle ends there; otherwise every enemy moves by its script — one stage
 * each, and none for an enemy that stayed — and then every enemy declares the intent it executes in
 * the next combat, all of them in the one stage that closes the phase.
 */
function enemyPhase(chronicle: Chronicle): Stage[] {
  if (unitAt(chronicle.units, chronicle.city)?.faction === 'enemy') {
    return [{ name: 'capture', chronicle: fall(chronicle, 'capture') }];
  }

  const stages: Stage[] = [];
  const units = [...chronicle.units];
  for (const [index, unit] of units.entries()) {
    if (unit.faction !== 'enemy') continue;
    const to = ENEMY_SCRIPTS[unit.script].moveTo({ ...chronicle, units }, index);
    if (tileKey(to) === tileKey(unit.tile)) continue;
    units[index] = { ...unit, tile: to };
    stages.push({
      name: 'move',
      from: unit.tile,
      to,
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
