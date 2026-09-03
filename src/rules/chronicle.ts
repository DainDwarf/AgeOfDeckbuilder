import { CARDS, type CardId } from './cards';
import { arrival, ENEMY_SCRIPTS } from './enemies';
import {
  BUILDINGS,
  type BuildingTypeId,
  CITY_TILE,
  generateMap,
  neighbours,
  TERRAIN_YIELDS,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import type { Rng } from './rng';
import { seedRng, shuffle as shuffleItems } from './rng';
import { arrive, attack, leastHealth, reachable, UNIT_STATS, type Unit, unitAt } from './units';

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

/** One step of the end of turn. `turn` is the tick alone; `events` is what the schedule lands. */
export type StageName =
  | 'discard'
  | 'combat'
  | 'income'
  | 'enemy-phase'
  | 'turn'
  | 'events'
  | 'draw'
  | 'shuffle';

/** A step of the end of turn, and the chronicle it leaves behind. */
export type Stage = { readonly name: StageName; readonly chronicle: Chronicle };

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
 * The one way a chronicle changes: every command the player has goes through here. A chronicle
 * that has ended takes none of them, and a city left without population falls whatever the
 * command was.
 */
export function apply(chronicle: Chronicle, command: Command): Chronicle {
  if (chronicle.defeat !== undefined) return chronicle;

  const after = perform(chronicle, command);
  if (after.defeat !== undefined || after.population > 0) return after;
  return fall(after, 'population');
}

function perform(chronicle: Chronicle, command: Command): Chronicle {
  switch (command.type) {
    case 'play':
      return play(chronicle, command.index, command.target);
    case 'end-turn': {
      const stages = endOfTurn(chronicle);
      return stages[stages.length - 1]?.chronicle ?? chronicle;
    }
  }
}

/**
 * The end of turn, step by ordered step, each with the chronicle it leaves: a step that changed
 * nothing is absent, and the list ends at the enemy phase when the city falls there. The chronicle
 * after the last stage is what the `end-turn` command answers.
 */
export function endOfTurn(chronicle: Chronicle): Stage[] {
  const stages: Stage[] = [];
  let standing = chronicle;
  const staged = (name: StageName, next: Chronicle): void => {
    if (next === standing) return;
    standing = next;
    stages.push({ name, chronicle: next });
  };

  staged('discard', discard(standing));
  staged('combat', combat(standing));
  staged('income', income(standing));
  staged('enemy-phase', enemyPhase(standing));
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

/** Everything standing between a card and being played: what the city cannot pay, and the map. */
export type Refusal = {
  readonly unaffordable: readonly Resource[];
  readonly blocked: boolean;
};

/** What a card outside the hand is drawn as: nothing refuses it. */
export const NO_REFUSAL: Refusal = { unaffordable: [], blocked: false };

export function refusalOf(chronicle: Chronicle, id: CardId): Refusal {
  return { unaffordable: unaffordable(chronicle, id), blocked: blocked(chronicle, id) };
}

export function playable(refusal: Refusal): boolean {
  return refusal.unaffordable.length === 0 && !refusal.blocked;
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

/** A card the city can pay for that the map still refuses: there is nothing for it to resolve on. */
function blocked(chronicle: Chronicle, id: CardId): boolean {
  const card = CARDS[id];
  switch (card.kind) {
    case 'unit':
      return chronicle.population <= 1 || unitAt(chronicle.units, chronicle.city) !== undefined;
    case 'building':
      return buildable(chronicle, card.building).length === 0;
    case 'order':
      return !chronicle.units.some(
        (unit) =>
          unit.faction === 'player' && reachable(chronicle.tiles, chronicle.units, unit).length > 0,
      );
    case 'action':
      return false;
  }
}

function play(chronicle: Chronicle, index: number, target: Target | undefined): Chronicle {
  const id = chronicle.hand[index];
  if (id === undefined || !playable(refusalOf(chronicle, id))) return chronicle;

  const resolved = resolve(chronicle, id, target);
  if (resolved === undefined) return chronicle;

  const resources = { ...resolved.resources };
  for (const { resource, amount } of costOf(id)) resources[resource] -= amount;
  return {
    ...resolved,
    resources,
    hand: resolved.hand.filter((_, at) => at !== index),
    discardPile: [...resolved.discardPile, id],
  };
}

/** What the card does. `undefined` refuses the play, and nothing is paid or discarded. */
function resolve(
  chronicle: Chronicle,
  id: CardId,
  target: Target | undefined,
): Chronicle | undefined {
  const card = CARDS[id];
  switch (card.kind) {
    case 'unit':
      return {
        ...chronicle,
        population: chronicle.population - 1,
        units: [
          ...chronicle.units,
          { stats: { ...UNIT_STATS[card.unitType] }, faction: 'player', tile: chronicle.city },
        ],
      };
    case 'building':
      return build(chronicle, card.building, target);
    case 'order':
      return order(chronicle, target);
    case 'action': {
      const resources = { ...chronicle.resources };
      for (const resource of RESOURCES) resources[resource] += card.gain[resource] ?? 0;
      return { ...chronicle, resources };
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

/** The plain order: the unit crosses to a tile within its move, and its nature acts where it lands. */
function order(chronicle: Chronicle, target: Target | undefined): Chronicle | undefined {
  if (target?.type !== 'unit-tile') return undefined;
  const mover = target.unit;
  const to = target.tile;
  const unit = chronicle.units[mover];
  if (unit === undefined || unit.faction !== 'player') return undefined;

  const landings = reachable(chronicle.tiles, chronicle.units, unit);
  if (!landings.some((coord) => tileKey(coord) === tileKey(to))) return undefined;

  const moved = chronicle.units.map((other, at) => (at === mover ? { ...other, tile: to } : other));
  return { ...chronicle, units: arrive(moved, mover) };
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
 * Combat: the player's fighting units attack in unit order, each by the one attack rule, and then
 * every enemy still standing executes the intent it declared.
 */
function combat(chronicle: Chronicle): Chronicle {
  let units = chronicle.units;
  // Combat moves nobody, so the tile a unit stands on names it as the killed leave the list.
  const standing = (at: TileCoords): number =>
    units.findIndex((unit) => tileKey(unit.tile) === tileKey(at));

  for (const unit of chronicle.units) {
    if (unit.faction !== 'player') continue;
    const attacker = standing(unit.tile);
    if (attacker === -1) continue;
    const target = leastHealth(units, attacker);
    if (target !== undefined) units = attack(units, attacker, target);
  }

  for (const unit of chronicle.units) {
    if (unit.faction !== 'enemy' || unit.intent === undefined) continue;
    const attacker = standing(unit.tile);
    const target = standing(unit.intent);
    if (attacker === -1 || target === -1) continue;
    if (units[target].faction !== unit.faction) units = attack(units, attacker, target);
  }

  return units === chronicle.units ? chronicle : { ...chronicle, units };
}

function income(chronicle: Chronicle): Chronicle {
  const held = new Set(chronicle.held.map(tileKey));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!held.has(tileKey(tile))) continue;
    if (unitAt(chronicle.units, tile)?.faction === 'enemy') continue;
    const yields = TERRAIN_YIELDS[tile.terrain];
    const built: Partial<Resources> =
      tile.building === undefined ? {} : BUILDINGS[tile.building].yields;
    for (const resource of RESOURCES) {
      resources[resource] += (yields[resource] ?? 0) + (built[resource] ?? 0);
    }
  }
  return RESOURCES.every((resource) => resources[resource] === chronicle.resources[resource])
    ? chronicle
    : { ...chronicle, resources };
}

/**
 * The enemies' half of the turn: an enemy that stood on the city's tile through the whole turn
 * captures it and the chronicle ends there; otherwise every enemy moves by its script, and then every
 * enemy declares the intent it executes in the next combat.
 */
function enemyPhase(chronicle: Chronicle): Chronicle {
  if (unitAt(chronicle.units, chronicle.city)?.faction === 'enemy') {
    return fall(chronicle, 'capture');
  }

  const units = [...chronicle.units];
  for (const [index, unit] of units.entries()) {
    if (unit.faction !== 'enemy') continue;
    const to = ENEMY_SCRIPTS[unit.script].moveTo({ ...chronicle, units }, index);
    units[index] = { ...unit, tile: to };
  }
  for (const [index, unit] of units.entries()) {
    if (unit.faction !== 'enemy') continue;
    const intent = ENEMY_SCRIPTS[unit.script].intentOf({ ...chronicle, units }, index);
    units[index] = { ...unit, intent };
  }

  const stirred = units.some(
    (unit, index) => tileAndIntent(unit) !== tileAndIntent(chronicle.units[index]),
  );
  return stirred ? { ...chronicle, units } : chronicle;
}

/** All an enemy phase can leave changed on a unit: the tile it stands on, the tile it aims at. */
function tileAndIntent(unit: Unit): string {
  const intent = unit.faction === 'enemy' && unit.intent !== undefined ? tileKey(unit.intent) : '';
  return `${tileKey(unit.tile)}>${intent}`;
}
