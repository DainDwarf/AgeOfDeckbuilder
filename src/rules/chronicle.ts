import { CARDS, type CardId, DECK } from './cards';
import {
  CITY_TILE,
  generateMap,
  neighbours,
  TERRAIN_YIELDS,
  type Tile,
  type TileCoords,
  tileKey,
} from './map';
import type { Rng } from './rng';
import { seedRng, shuffle } from './rng';
import { arrive, reachable, UNIT_STATS, type Unit, unitAt } from './units';

/** The five core resources, then culture. Population is inhabitants, not a store. */
export const RESOURCES = ['food', 'production', 'military', 'money', 'science', 'culture'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;

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
};

/** Which unit an order acts on, by its place in `units`, and the tile it is sent to. */
export type Target = { readonly unit: number; readonly to: TileCoords };

export type Command =
  | { readonly type: 'end-turn' }
  | { readonly type: 'play'; readonly index: number; readonly target?: Target };

/** The founding: the seed generates the map, and the city holds its tile and the six around it. */
export function beginChronicle(seed: number): Chronicle {
  const map = generateMap(seedRng(seed));
  const deck = shuffle(map.rng, DECK);
  const held = [CITY_TILE, ...neighbours(CITY_TILE)];
  return draw(
    events({
      seed,
      rng: deck.rng,
      tiles: map.tiles,
      city: CITY_TILE,
      held,
      turn: 1,
      resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
      population: held.length,
      units: [],
      drawPile: deck.items,
      hand: [],
      discardPile: [],
    }),
  );
}

/** The one way a chronicle changes: every command the player has goes through here. */
export function apply(chronicle: Chronicle, command: Command): Chronicle {
  switch (command.type) {
    case 'play':
      return play(chronicle, command.index, command.target);
    case 'end-turn': {
      const closed = enemyPhase(income(end(chronicle)));
      return draw(events({ ...closed, turn: closed.turn + 1 }));
    }
  }
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

/** A card the city can pay for that the map still refuses: there is nothing for it to resolve on. */
function blocked(chronicle: Chronicle, id: CardId): boolean {
  switch (CARDS[id].kind) {
    case 'unit':
      return chronicle.population === 0 || unitAt(chronicle.units, chronicle.city) !== undefined;
    case 'order':
      return !chronicle.units.some(
        (unit) =>
          unit.faction === 'player' && reachable(chronicle.tiles, chronicle.units, unit).length > 0,
      );
    default:
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
    case 'order':
      return order(chronicle, target);
    case 'action': {
      const resources = { ...chronicle.resources };
      for (const resource of RESOURCES) resources[resource] += card.gain[resource] ?? 0;
      return { ...chronicle, resources };
    }
    default:
      return chronicle;
  }
}

/** The plain order: the unit crosses to a tile within its move, and its nature acts where it lands. */
function order(chronicle: Chronicle, target: Target | undefined): Chronicle | undefined {
  if (target === undefined) return undefined;
  const unit = chronicle.units[target.unit];
  if (unit === undefined || unit.faction !== 'player') return undefined;

  const landings = reachable(chronicle.tiles, chronicle.units, unit);
  if (!landings.some((coord) => tileKey(coord) === tileKey(target.to))) return undefined;

  const moved = chronicle.units.map((other, at) =>
    at === target.unit ? { ...other, tile: target.to } : other,
  );
  return { ...chronicle, units: arrive(moved, target.unit) };
}

function events(chronicle: Chronicle): Chronicle {
  return chronicle;
}

function draw(chronicle: Chronicle): Chronicle {
  let { rng, drawPile, discardPile } = chronicle;
  const hand = [...chronicle.hand];

  while (hand.length < 5) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      const refilled = shuffle(rng, discardPile);
      rng = refilled.rng;
      drawPile = refilled.items;
      discardPile = [];
    }
    hand.push(drawPile[0]);
    drawPile = drawPile.slice(1);
  }

  return { ...chronicle, rng, drawPile, hand, discardPile };
}

function end(chronicle: Chronicle): Chronicle {
  return {
    ...chronicle,
    hand: [],
    discardPile: [...chronicle.discardPile, ...chronicle.hand],
  };
}

function income(chronicle: Chronicle): Chronicle {
  const held = new Set(chronicle.held.map(tileKey));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!held.has(tileKey(tile))) continue;
    const yields = TERRAIN_YIELDS[tile.terrain];
    for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  }
  return { ...chronicle, resources };
}

function enemyPhase(chronicle: Chronicle): Chronicle {
  return chronicle;
}
