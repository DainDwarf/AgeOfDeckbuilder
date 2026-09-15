import type { Catalogue } from './catalogue';
import { neighbours, type TileCoords, tileKey, tileYield } from './map';
import { RESOURCES } from './resources';
import {
  assignedTo,
  type Chronicle,
  type Cost,
  holds,
  idle,
  playable,
  type Refusal,
  unaffordable,
} from './state';
import { occupied } from './units';

/** One idle inhabitant put on a tile the city holds, or the one standing on that tile taken off. */
type AssignCommand = { readonly type: 'assign'; readonly tile: TileCoords };

/** One inhabitant taken off the tile it stands on and put on another, in the one gesture. */
export type ReassignCommand = {
  readonly type: 'reassign';
  /** The tile the inhabitant stands on, and the tile it stands on once this has resolved. */
  readonly from: TileCoords;
  readonly to: TileCoords;
};

/** One tile outside the border bought with culture and taken inside it. */
type ClaimCommand = { readonly type: 'claim'; readonly tile: TileCoords };

/** Everything the player commands the city by: its inhabitants, and the border they stand inside. */
export type CityCommand = AssignCommand | ReassignCommand | ClaimCommand;

/** What the first claim costs, and how many tiles held beyond the city's own each rise lasts. */
const CLAIM_FIRST = 1;
const CLAIMS_PER_RISE = 3;

/**
 * Income: an assigned tile yields what its layers and the river running along it give, the city's
 * own tile no exception.
 */
export function income(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const assigned = new Set(chronicle.assigned.map(tileKey));
  const resources = { ...chronicle.resources };
  for (const tile of chronicle.tiles) {
    if (!assigned.has(tileKey(tile))) continue;
    if (occupied(chronicle.units, tile)) continue;
    const yields = tileYield(catalogue, tile, chronicle.rivers);
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

/** One inhabitant more for the city, arriving idle. */
export function arrived(chronicle: Chronicle): Chronicle {
  return { ...chronicle, population: chronicle.population + 1 };
}

/** Growth: the food stock that has reached the growth threshold is spent on one idle inhabitant. */
export function grow(chronicle: Chronicle): Chronicle {
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
 * The tiles the city may claim: charted, not held, touching a tile it holds, with no camp filling
 * the slot and no enemy occupying it.
 */
export function claimable(catalogue: Catalogue, chronicle: Chronicle): TileCoords[] {
  const held = new Set(chronicle.held.map(tileKey));
  const chartedTiles = new Set(chronicle.snapshots.map(tileKey));
  return chronicle.tiles
    .filter(
      (tile) =>
        chartedTiles.has(tileKey(tile)) &&
        !held.has(tileKey(tile)) &&
        tile.building !== catalogue.camp.building &&
        !occupied(chronicle.units, tile) &&
        neighbours(tile).some((coord) => held.has(tileKey(coord))),
    )
    .map(({ q, r }) => ({ q, r }));
}

/**
 * The culture threshold, what the next claim costs: one culture, and one more for every three tiles
 * held beyond the city's own.
 */
function cultureThreshold(chronicle: Chronicle): number {
  const beyond = Math.max(0, chronicle.held.length - 1);
  return CLAIM_FIRST + Math.floor(beyond / CLAIMS_PER_RISE);
}

/**
 * What the city's act on this tile costs, in the shape a card's cost comes in: the culture a claim
 * asks for, and nothing at all on a tile the city already holds.
 */
export function tileCost(_catalogue: Catalogue, chronicle: Chronicle, tile: TileCoords): Cost[] {
  return holds(chronicle, tile)
    ? []
    : [{ resource: 'culture', amount: cultureThreshold(chronicle) }];
}

/**
 * Everything standing between the city and its act on this tile: the idle population an assign has
 * none of, and the culture a claim falls short of. A tile the city neither holds nor may claim — an
 * uncharted one among them — is no act of the city's at all, and answers nothing.
 */
export function tileRefusal(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Refusal | undefined {
  if (holds(chronicle, tile)) {
    const standing = assignedTo(chronicle, tile);
    return { unaffordable: [], blocked: standing || idle(chronicle) > 0 ? [] : ['idle'] };
  }
  if (!claimable(catalogue, chronicle).some((coord) => tileKey(coord) === tileKey(tile))) {
    return undefined;
  }
  return {
    unaffordable: unaffordable(chronicle, tileCost(catalogue, chronicle, tile)),
    blocked: [],
  };
}

/**
 * What the city's act on a tile sends — the second left click on the selection in city mode: an
 * assign on a tile the city holds, a claim on one it may claim, and nothing at all on a tile it has
 * no act on or when the rules refuse the act. The one decision both the chronicle screen and `apply`
 * answer that click by.
 */
export function cityCommand(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): AssignCommand | ClaimCommand | undefined {
  const refusal = tileRefusal(catalogue, chronicle, tile);
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

/**
 * One tile assigned or unassigned: the inhabitant already on it comes off, and an idle one goes on
 * a tile the city holds. Anything the city-mode click on that tile is not, or is refused for,
 * answers nothing.
 */
export function assign(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Chronicle | undefined {
  if (cityCommand(catalogue, chronicle, tile)?.type !== 'assign') return undefined;

  const at = tileKey(tile);
  const on = chronicle.assigned.filter((coord) => tileKey(coord) !== at);
  if (on.length < chronicle.assigned.length) return { ...chronicle, assigned: on };
  return { ...chronicle, assigned: [...on, { q: tile.q, r: tile.r }] };
}

/**
 * One inhabitant off the tile it stands on and onto another: the chronicle is left with the same
 * population and the same idle count. A drag the rules have no act of the city's for answers
 * nothing.
 */
export function reassign(
  chronicle: Chronicle,
  from: TileCoords,
  to: TileCoords,
): Chronicle | undefined {
  if (cityDrag(chronicle, from, to) === undefined) return undefined;

  const off = tileKey(from);
  return {
    ...chronicle,
    assigned: [
      ...chronicle.assigned.filter((coord) => tileKey(coord) !== off),
      { q: to.q, r: to.r },
    ],
  };
}

/**
 * One tile claimed by hand: the culture is paid and the tile taken inside the border. Anything the
 * city-mode click on that tile is not, or is refused for, answers nothing.
 */
export function claim(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Chronicle | undefined {
  if (cityCommand(catalogue, chronicle, tile)?.type !== 'claim') return undefined;

  return bordered(
    {
      ...chronicle,
      resources: {
        ...chronicle.resources,
        culture: chronicle.resources.culture - cultureThreshold(chronicle),
      },
    },
    tile,
  );
}

/**
 * One tile taken inside the border, however it was claimed: it joins the tiles the city holds, and
 * an idle inhabitant stands on it at once when the city has one.
 */
export function bordered(chronicle: Chronicle, tile: TileCoords): Chronicle {
  const taken = { q: tile.q, r: tile.r };
  return {
    ...chronicle,
    held: [...chronicle.held, taken],
    assigned: idle(chronicle) > 0 ? [...chronicle.assigned, taken] : chronicle.assigned,
  };
}
