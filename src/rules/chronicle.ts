import {
  CITY_TILE,
  generateMap,
  neighbours,
  TERRAIN_YIELDS,
  type Tile,
  type TileCoords,
} from './map';
import type { Rng } from './rng';
import { seedRng } from './rng';

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
};

export type Command = { readonly type: 'end-turn' };

/** The founding: the seed generates the map, and the city holds its tile and the six around it. */
export function beginChronicle(seed: number): Chronicle {
  const { rng, tiles } = generateMap(seedRng(seed));
  const held = [CITY_TILE, ...neighbours(CITY_TILE)];
  return draw(
    events({
      seed,
      rng,
      tiles,
      city: CITY_TILE,
      held,
      turn: 1,
      resources: { food: 0, production: 0, military: 0, money: 0, science: 0, culture: 0 },
      population: held.length,
    }),
  );
}

/** The one way a chronicle changes: every command the player has goes through here. */
export function apply(chronicle: Chronicle, command: Command): Chronicle {
  switch (command.type) {
    case 'end-turn': {
      const closed = enemyPhase(income(end(chronicle)));
      return draw(events({ ...closed, turn: closed.turn + 1 }));
    }
  }
}

function events(chronicle: Chronicle): Chronicle {
  return chronicle;
}

function draw(chronicle: Chronicle): Chronicle {
  return chronicle;
}

function end(chronicle: Chronicle): Chronicle {
  return chronicle;
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
