import { CARDS, type CardId, DECK } from './cards';
import {
  CITY_TILE,
  generateMap,
  neighbours,
  TERRAIN_YIELDS,
  type Tile,
  type TileCoords,
} from './map';
import type { Rng } from './rng';
import { seedRng, shuffle } from './rng';

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
  readonly drawPile: CardId[];
  readonly hand: CardId[];
  readonly discardPile: CardId[];
};

export type Command =
  | { readonly type: 'end-turn' }
  | { readonly type: 'play'; readonly index: number };

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
      return play(chronicle, command.index);
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

/** The resources this card's cost outruns; empty means the city can play it. */
export function unpayable(chronicle: Chronicle, id: CardId): Resource[] {
  return costOf(id)
    .filter(({ resource, amount }) => amount > chronicle.resources[resource])
    .map(({ resource }) => resource);
}

function play(chronicle: Chronicle, index: number): Chronicle {
  const id = chronicle.hand[index];
  if (id === undefined || unpayable(chronicle, id).length > 0) return chronicle;

  const resources = { ...chronicle.resources };
  for (const { resource, amount } of costOf(id)) resources[resource] -= amount;
  return {
    ...chronicle,
    resources,
    hand: chronicle.hand.filter((_, at) => at !== index),
    discardPile: [...chronicle.discardPile, id],
  };
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
  const held = new Set(chronicle.held.map(({ q, r }) => `${q},${r}`));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!held.has(`${tile.q},${tile.r}`)) continue;
    const yields = TERRAIN_YIELDS[tile.terrain];
    for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  }
  return { ...chronicle, resources };
}

function enemyPhase(chronicle: Chronicle): Chronicle {
  return chronicle;
}
