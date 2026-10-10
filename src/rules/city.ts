import { ageOf, type Catalogue } from './catalogue';
import { neighbours, type TileCoords, tileAt, tileKey, tileYield } from './map';
import { refuse } from './map-kinds';
import { RESOURCES } from './resources';
import {
  change,
  changeOn,
  followed,
  grouped,
  type Landed,
  landedAs,
  type Sequence,
  type Stage,
  unchanged,
} from './stages';
import {
  assignedTo,
  type Chronicle,
  type CityFaction,
  type Cost,
  cityRows,
  costsOf,
  holderOf,
  holds,
  idle,
  playable,
  type Refusal,
  unaffordable,
  withCityRows,
} from './state';
import { occupied, unitAt } from './units';

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
 * Income of the faction's city: an assigned tile no enemy occupies yields, the city's own tile no
 * exception, tile by tile in tile order.
 */
export function income(catalogue: Catalogue, chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  const assigned = new Set(city.assigned.map(tileKey));
  let yielding = unchanged(chronicle);
  for (const { q, r } of chronicle.tiles) {
    if (!assigned.has(tileKey({ q, r }))) continue;
    if (occupied(chronicle.units, { q, r })) continue;
    yielding = followed(yielding, (left) => yielded(catalogue, left, whose, { q, r }));
  }
  return yielding;
}

/**
 * A tile's yield gained: the faction's city's stock of each resource rises by what the tile yields,
 * one `stock` carrying the tile, and nothing where it yields nothing or that city is none.
 */
export function yielded(
  catalogue: Catalogue,
  chronicle: Chronicle,
  whose: CityFaction,
  at: TileCoords,
): Landed {
  const tile = tileAt(chronicle.tiles, at);
  if (tile === undefined) refuse(catalogue, `no tile of the map yields at ${tileKey(at)}`);
  const city = cityRows(chronicle, whose);
  const yields = tileYield(catalogue, tile, (coord) => tileAt(chronicle.tiles, coord));
  if (city === undefined || costsOf(yields).length === 0) return unchanged(chronicle);
  const resources = { ...city.resources };
  for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  return landedAs(
    changeOn('stock', { q: at.q, r: at.r }, withCityRows(chronicle, whose, { resources })),
  );
}

/**
 * What the faction's city's growth spends: twice its population and its own units counted together.
 * The neutral's on a chronicle holding none has neither.
 */
export function growthThreshold(chronicle: Chronicle, whose: CityFaction): number {
  const population = cityRows(chronicle, whose)?.population ?? 0;
  const fielded = chronicle.units.filter((unit) => unit.faction === whose).length;
  return 2 * (population + fielded);
}

/** One population more for the faction's city, arriving idle, and nothing where that city is none. */
export function arrived(chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  return landedAs(
    change('population', withCityRows(chronicle, whose, { population: city.population + 1 })),
  );
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
 * Growth of the faction's city: the food stock that has reached the growth threshold is spent, and
 * one idle population arrives on what that leaves.
 */
export function grow(chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  const threshold = growthThreshold(chronicle, whose);
  if (city === undefined || city.resources.food < threshold) return unchanged(chronicle);
  const spent = landedAs(
    change(
      'stock',
      withCityRows(chronicle, whose, {
        resources: { ...city.resources, food: city.resources.food - threshold },
      }),
    ),
  );
  return followed(spent, (left) => arrived(left, whose));
}

/**
 * The tiles the faction's city may claim: held by no city, touching a tile it holds, with no camp
 * filling the slot and no unit of another faction standing on it; the player's charted besides.
 */
export function claimable(
  catalogue: Catalogue,
  chronicle: Chronicle,
  whose: CityFaction,
): TileCoords[] {
  const held = new Set(cityRows(chronicle, whose)?.held.map(tileKey));
  const known = knownTo(chronicle, whose);
  const { building } = ageOf(catalogue, chronicle.age).camp;
  return chronicle.tiles
    .filter((tile) => {
      const standing = unitAt(chronicle.units, tile);
      return (
        known(tile) &&
        holderOf(chronicle, tile) === undefined &&
        tile.building !== building &&
        (standing === undefined || standing.faction === whose) &&
        neighbours(tile).some((coord) => held.has(tileKey(coord)))
      );
    })
    .map(({ q, r }) => ({ q, r }));
}

/** Whether the faction's city knows of a tile to claim it: the player's a charted one, the neutral's any. */
function knownTo(chronicle: Chronicle, whose: CityFaction): (tile: TileCoords) => boolean {
  switch (whose) {
    case 'player': {
      const charted = new Set(chronicle.snapshots.map(tileKey));
      return (tile) => charted.has(tileKey(tile));
    }
    case 'neutral':
      return () => true;
  }
}

/**
 * What a claim of the faction's city asks of its culture stock, whichever tile it takes: twice the
 * tiles that city holds.
 */
export function cultureThreshold(chronicle: Chronicle, whose: CityFaction): number {
  return 2 * (cityRows(chronicle, whose)?.held.length ?? 0);
}

/**
 * What the city's act on this tile costs, in the shape a card's cost comes in: the culture a claim
 * asks for, and nothing at all on a tile the city already holds.
 */
export function tileCost(chronicle: Chronicle, tile: TileCoords): Cost[] {
  return holds(chronicle, tile)
    ? []
    : [{ resource: 'culture', amount: cultureThreshold(chronicle, 'player') }];
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
  if (
    !claimable(catalogue, chronicle, 'player').some((coord) => tileKey(coord) === tileKey(tile))
  ) {
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

/** Whether one of the tiles the city may claim is one it can pay for. */
export function claimWaiting(catalogue: Catalogue, chronicle: Chronicle): boolean {
  return claimable(catalogue, chronicle, 'player').some(
    (tile) => cityCommand(catalogue, chronicle, tile) !== undefined,
  );
}

/** Whether the city has one population idle and holds a tile nobody stands on to put it to. */
export function assignWaiting(chronicle: Chronicle): boolean {
  return idle(chronicle) > 0 && chronicle.held.some((tile) => !assignedTo(chronicle, tile));
}

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
 * One tile claimed by the faction's city: the culture threshold is paid, one `stock`, and the tile
 * taken inside the border. A tile that city may not claim, or one it cannot pay for, answers nothing.
 */
export function claim(
  catalogue: Catalogue,
  chronicle: Chronicle,
  whose: CityFaction,
  tile: TileCoords,
): Landed | undefined {
  const city = cityRows(chronicle, whose);
  const threshold = cultureThreshold(chronicle, whose);
  if (
    city === undefined ||
    city.resources.culture < threshold ||
    !claimable(catalogue, chronicle, whose).some((coord) => tileKey(coord) === tileKey(tile))
  ) {
    return undefined;
  }

  const paid = landedAs(
    change(
      'stock',
      withCityRows(chronicle, whose, {
        resources: { ...city.resources, culture: city.resources.culture - threshold },
      }),
    ),
  );
  return followed(paid, (left) => bordered(left, whose, tile));
}

/**
 * One tile taken inside the faction's city's border, however it was claimed: it joins the tiles that
 * city holds, and an idle population of its stands on it at once when it has one. Nothing where that
 * city is none.
 */
export function bordered(chronicle: Chronicle, whose: CityFaction, tile: TileCoords): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  const taken = { q: tile.q, r: tile.r };
  const held = landedAs(
    changeOn('held', taken, withCityRows(chronicle, whose, { held: [...city.held, taken] })),
  );
  if (idle(city) <= 0) return held;
  return followed(held, (left) =>
    landedAs(
      changeOn(
        'assigned',
        taken,
        withCityRows(left, whose, { assigned: [...city.assigned, taken] }),
      ),
    ),
  );
}

/**
 * The neutral's city claiming tile after tile while it may claim one and pay for it, one `claim`
 * group each, the tile its script chooses; a choice outside those offered is a `runtime-error`.
 */
export function neutralClaims(catalogue: Catalogue, chronicle: Chronicle): Sequence<Stage> {
  const { neutral } = ageOf(catalogue, chronicle.age);
  if (neutral === undefined) return unchanged(chronicle);
  let claiming: Sequence<Stage> = unchanged(chronicle);
  for (;;) {
    const left = claiming.chronicle;
    const city = left.neutral;
    const offered = claimable(catalogue, left, 'neutral');
    if (
      city === undefined ||
      offered.length === 0 ||
      city.resources.culture < cultureThreshold(left, 'neutral')
    ) {
      return claiming;
    }
    const landing = claim(
      catalogue,
      left,
      'neutral',
      neutral.script.claims(catalogue, left, offered),
    );
    if (landing === undefined) {
      return followed<Stage>(claiming, (standing) => landedAs(change('runtime-error', standing)));
    }
    claiming = followed<Stage>(claiming, () => grouped({ name: 'claim' }, landing));
  }
}
