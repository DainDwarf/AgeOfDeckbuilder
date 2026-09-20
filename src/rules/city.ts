import type { Catalogue } from './catalogue';
import { neighbours, type TileCoords, tileAt, tileKey, tileYield } from './map';
import { refuse } from './map-kinds';
import { RESOURCES } from './resources';
import { change, changeOn, followed, type Landed, landedAs, unchanged } from './stages';
import {
  assignedTo,
  type Chronicle,
  type Cost,
  costsOf,
  holds,
  idle,
  playable,
  type Refusal,
  unaffordable,
} from './state';
import { occupied } from './units';

/** One idle population put on a tile the city holds, or the one standing on that tile taken off. */
type AssignCommand = { readonly type: 'assign'; readonly tile: TileCoords };

/** One population taken off the tile it stands on and put on another, in the one gesture. */
export type ReassignCommand = {
  readonly type: 'reassign';
  /** The tile the population stands on, and the tile it stands on once this has resolved. */
  readonly from: TileCoords;
  readonly to: TileCoords;
};

/** One tile outside the border bought with culture and taken inside it. */
type ClaimCommand = { readonly type: 'claim'; readonly tile: TileCoords };

/** Everything the player commands the city by: its population, and the border it stands inside. */
export type CityCommand = AssignCommand | ReassignCommand | ClaimCommand;

/**
 * Income: an assigned tile no enemy occupies yields what its layers and the river running along it
 * give, the city's own tile no exception, tile by tile in tile order.
 */
export function income(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const assigned = new Set(chronicle.assigned.map(tileKey));
  let yielding = unchanged(chronicle);
  for (const { q, r } of chronicle.tiles) {
    if (!assigned.has(tileKey({ q, r }))) continue;
    if (occupied(chronicle.units, { q, r })) continue;
    yielding = followed(yielding, (left) => yielded(catalogue, left, { q, r }));
  }
  return yielding;
}

/**
 * A tile's yield gained: the city's stock of each resource rises by what the tile yields, one `stock`
 * carrying the tile, and nothing where it yields nothing.
 */
export function yielded(catalogue: Catalogue, chronicle: Chronicle, at: TileCoords): Landed {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) refuse(catalogue, `no tile of the map yields at ${tileKey(at)}`);
  const yields = tileYield(catalogue, tile, chronicle.rivers);
  if (costsOf(yields).length === 0) return unchanged(chronicle);
  const resources = { ...chronicle.resources };
  for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  return landedAs(changeOn('stock', { q: at.q, r: at.r }, { ...chronicle, resources }));
}

export function growthThreshold(chronicle: Chronicle): number {
  const fielded = chronicle.units.filter((unit) => unit.faction === 'player').length;
  return 2 * (chronicle.population + fielded);
}

/** One population more for the city, arriving idle. */
export function arrived(chronicle: Chronicle): Landed {
  return landedAs(change('population', { ...chronicle, population: chronicle.population + 1 }));
}

/** The population off the tile and then one fewer. */
function populationLeaving(chronicle: Chronicle, at: TileCoords): Landed {
  const key = tileKey(at);
  return followed(
    landedAs(
      changeOn('assigned', at, {
        ...chronicle,
        assigned: chronicle.assigned.filter((coord) => tileKey(coord) !== key),
      }),
    ),
    (left) => landedAs(change('population', { ...left, population: left.population - 1 })),
  );
}

/**
 * The population working the tile killed: the tile unassigned and the city's population one fewer,
 * and nothing where nobody works it.
 */
export function populationKilled(chronicle: Chronicle, at: TileCoords): Landed {
  const key = tileKey(at);
  const working = chronicle.assigned.find((coord) => tileKey(coord) === key);
  if (working === undefined) return unchanged(chronicle);
  return populationLeaving(chronicle, working);
}

/**
 * One population of the city taken, whichever it is: an idle one where one is idle, and where none
 * is the last assigned tile unassigned first, the city's last no exception; the population one fewer.
 * Nothing where the city has no population at all.
 */
export function populationTaken(chronicle: Chronicle): Landed {
  if (chronicle.population <= 0) return unchanged(chronicle);
  const last = chronicle.assigned[chronicle.assigned.length - 1];
  if (idle(chronicle) > 0 || last === undefined) {
    return landedAs(change('population', { ...chronicle, population: chronicle.population - 1 }));
  }
  return populationLeaving(chronicle, last);
}

/**
 * Growth: the food stock that has reached the growth threshold is spent, and one idle population
 * arrives on what that leaves.
 */
export function grow(chronicle: Chronicle): Landed {
  const threshold = growthThreshold(chronicle);
  if (chronicle.resources.food < threshold) return unchanged(chronicle);
  const spent = landedAs(
    change('stock', {
      ...chronicle,
      resources: { ...chronicle.resources, food: chronicle.resources.food - threshold },
    }),
  );
  return followed(spent, arrived);
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

/** The culture threshold, what the next claim costs. */
function cultureThreshold(chronicle: Chronicle): number {
  return 2 * chronicle.held.length;
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
    unaffordable: unaffordable(chronicle, tileCost(chronicle, tile)),
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
 * population off the tile it stands on and onto the tile it was let go on, which the city has to
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
 * One tile assigned or unassigned: the population already on it comes off, and an idle one goes on
 * a tile the city holds, one `assigned` either way. Anything the city-mode click on that tile is not,
 * or is refused for, answers nothing.
 */
export function assign(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Landed | undefined {
  if (cityCommand(catalogue, chronicle, tile)?.type !== 'assign') return undefined;
  return assigned(chronicle, tile);
}

/**
 * One population off the tile it stands on and onto another: the tile left, then the tile worked,
 * and the chronicle left with the same population and the same idle count. A drag the rules have no
 * act of the city's for answers nothing.
 */
export function reassign(
  chronicle: Chronicle,
  from: TileCoords,
  to: TileCoords,
): Landed | undefined {
  if (cityDrag(chronicle, from, to) === undefined) return undefined;
  return followed(assigned(chronicle, from), (left) => assigned(left, to));
}

/** The population on the tile taken off it, or an idle one put on it where none stands there. */
function assigned(chronicle: Chronicle, tile: TileCoords): Landed {
  const at = { q: tile.q, r: tile.r };
  const key = tileKey(at);
  const off = chronicle.assigned.filter((coord) => tileKey(coord) !== key);
  return landedAs(
    changeOn('assigned', at, {
      ...chronicle,
      assigned: off.length < chronicle.assigned.length ? off : [...off, at],
    }),
  );
}

/**
 * One tile claimed by hand: the culture is paid, one `stock`, and the tile taken inside the border.
 * Anything the city-mode click on that tile is not, or is refused for, answers nothing.
 */
export function claim(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Landed | undefined {
  if (cityCommand(catalogue, chronicle, tile)?.type !== 'claim') return undefined;

  const paid = landedAs(
    change('stock', {
      ...chronicle,
      resources: {
        ...chronicle.resources,
        culture: chronicle.resources.culture - cultureThreshold(chronicle),
      },
    }),
  );
  return followed(paid, (left) => bordered(left, tile));
}

/**
 * One tile taken inside the border, however it was claimed: it joins the tiles the city holds, and
 * an idle population stands on it at once when the city has one.
 */
export function bordered(chronicle: Chronicle, tile: TileCoords): Landed {
  const taken = { q: tile.q, r: tile.r };
  const held = landedAs(
    changeOn('held', taken, { ...chronicle, held: [...chronicle.held, taken] }),
  );
  if (idle(chronicle) <= 0) return held;
  return followed(held, (left) =>
    landedAs(changeOn('assigned', taken, { ...left, assigned: [...left.assigned, taken] })),
  );
}
