import { ageOf, type Catalogue, cardOf, costOf, unitCardOf, workerAim } from './catalogue';
import { neighbours, type Tile, type TileCoords, tileAt, tileKey } from './map';
import { buildingKind, refuse } from './map-kinds';
import { RESOURCES, type Resources, summed } from './resources';
import {
  change,
  changeOn,
  fall,
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
  type Block,
  type CardId,
  type Chronicle,
  type CityFaction,
  type Cost,
  cityOn,
  cityRows,
  cityTileOf,
  costsOf,
  holderOf,
  holds,
  idle,
  type NeutralFallCause,
  playable,
  type Refusal,
  unaffordable,
  withCityRows,
} from './state';
import { type Relations, relationsOf, type Unit, unitAt } from './units';
import { tileYield } from './yields';

/**
 * The neutral turned hostile, for the rest of the chronicle: the one `relations` change, and nothing
 * where it is hostile already or the chronicle holds no neutral.
 */
export function warDeclared(chronicle: Chronicle): Landed {
  if (chronicle.relations !== 'peace') return unchanged(chronicle);
  return landedAs(change('relations', { ...chronicle, relations: 'hostile' }, chronicle));
}

/**
 * What a unit landing on a tile raises ahead of the landing, however it lands: the declaration of war
 * where a unit of the player's lands on a tile the neutral holds, and nothing for any other.
 */
export function declaredByLanding(chronicle: Chronicle, unit: Unit, to: TileCoords): Landed {
  if (unit.faction !== 'player' || holderOf(chronicle, to) !== 'neutral') {
    return unchanged(chronicle);
  }
  return warDeclared(chronicle);
}

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
 * Income of the faction's city: an assigned tile nobody occupies yields, the city's own tile no
 * exception, tile by tile in tile order; and then the city pays its upkeep out of what they left.
 */
export function income(catalogue: Catalogue, chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  const assigned = new Set(city.assigned.map(tileKey));
  const relations = relationsOf(chronicle);
  let yielding = unchanged(chronicle);
  for (const { q, r } of chronicle.tiles) {
    if (!assigned.has(tileKey({ q, r }))) continue;
    if (occupied(chronicle.units, { q, r }, whose, relations)) continue;
    yielding = followed(yielding, (left) => yielded(catalogue, left, whose, { q, r }));
  }
  return followed(yielding, (left) => shocked(left, whose, upkeepOf(catalogue, left, whose)));
}

/** The faction's city's upkeep: what the buildings on the tiles it holds declare, summed. */
export function upkeepOf(
  catalogue: Catalogue,
  chronicle: Chronicle,
  whose: CityFaction,
): Partial<Resources> {
  const declared = (cityRows(chronicle, whose)?.held ?? []).flatMap((coord) => {
    const building = tileAt(chronicle.tiles, coord)?.building;
    return building === undefined ? [] : [buildingKind(catalogue, building).upkeep ?? {}];
  });
  return summed(declared);
}

/**
 * The stocks shocked: each of the faction's city's stocks loses what is named of it, never below
 * nothing, one `stock`; then one population taken for each stock it does not cover, carrying how
 * far past it falls. Nothing where nothing is named or that city is none.
 */
export function shocked(
  chronicle: Chronicle,
  whose: CityFaction,
  taken: Partial<Resources>,
): Landed {
  const city = cityRows(chronicle, whose);
  const costs = costsOf(taken);
  if (city === undefined || costs.length === 0) return unchanged(chronicle);
  const resources = { ...city.resources };
  const uncovered: Cost[] = [];
  for (const { resource, amount } of costs) {
    const stock = resources[resource];
    resources[resource] = Math.max(0, stock - amount);
    if (stock < amount) uncovered.push({ resource, amount: amount - stock });
  }
  let shocking = RESOURCES.every((resource) => resources[resource] === city.resources[resource])
    ? unchanged(chronicle)
    : landedAs(change('stock', withCityRows(chronicle, whose, { resources }), chronicle));
  for (const past of uncovered) {
    shocking = followed(shocking, (left) => populationTaken(left, whose, past));
  }
  return shocking;
}

/**
 * Whether a tile of the faction's city is occupied, so it yields nothing: by an enemy, and while
 * hostile by a unit of the other city's.
 */
function occupied(
  units: readonly Unit[],
  coord: TileCoords,
  whose: CityFaction,
  relations: Relations,
): boolean {
  const there = unitAt(units, coord);
  if (there === undefined) return false;
  switch (there.faction) {
    case 'enemy':
      return true;
    case 'player':
    case 'neutral':
      return there.faction !== whose && relations === 'hostile';
  }
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
  const yields = tileYield(catalogue, chronicle, tile, (coord) => tileAt(chronicle.tiles, coord));
  if (city === undefined || costsOf(yields).length === 0) return unchanged(chronicle);
  const resources = { ...city.resources };
  for (const resource of RESOURCES) resources[resource] += yields[resource] ?? 0;
  return landedAs(
    changeOn(
      'stock',
      { q: at.q, r: at.r },
      withCityRows(chronicle, whose, { resources }),
      chronicle,
    ),
  );
}

/**
 * A cost paid out of the faction's city's stocks, one `stock`, and nothing for a cost of nothing or
 * where that city is none.
 */
export function costPaid(chronicle: Chronicle, whose: CityFaction, costs: readonly Cost[]): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined || costs.length === 0) return unchanged(chronicle);
  const resources = { ...city.resources };
  for (const { resource, amount } of costs) resources[resource] -= amount;
  return landedAs(change('stock', withCityRows(chronicle, whose, { resources }), chronicle));
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
    change(
      'population',
      withCityRows(chronicle, whose, { population: city.population + 1 }),
      chronicle,
    ),
  );
}

/**
 * The faction's city's population one fewer, its `population` carrying what a stock taken past
 * nothing did not cover where it pays for one, and nothing where that city is none. A city's last
 * taken, it falls: the player's on the spot, the neutral's by its building taken off its tile.
 */
function populationFewer(chronicle: Chronicle, whose: CityFaction, uncovered?: Cost): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  const fewer = withCityRows(chronicle, whose, { population: city.population - 1 });
  const taken = landedAs(
    uncovered === undefined
      ? change('population', fewer, chronicle)
      : { kind: 'change', name: 'population', uncovered, before: chronicle, chronicle: fewer },
  );
  if (city.population > 1) return taken;
  switch (whose) {
    case 'player':
      return followed(taken, (left) => fall(left, 'population'));
    case 'neutral': {
      const tile = cityTileOf(chronicle, 'neutral');
      if (tile === undefined) return taken;
      return followed(taken, (left) => buildingTakenOff(left, tile, 'population'));
    }
  }
}

/** The building taken off the tile, its slot empty. */
export function buildingTakenOff(
  paid: Chronicle,
  at: TileCoords,
  cause?: NeutralFallCause,
): Landed {
  return retiled(paid, at, (tile) => ({ ...tile, building: undefined }), cause);
}

/**
 * One tile of the map layered over, every other tile left as it stands: the one `retiled` change. A
 * city's tile coming out without its building, that city falls on the spot, the neutral's to the
 * cause named, its building being the one the tile held before.
 */
export function retiled(
  paid: Chronicle,
  at: TileCoords,
  after: (tile: Tile) => Tile,
  cause: NeutralFallCause = 'removal',
): Landed {
  const key = tileKey(at);
  const laid = landedAs(
    changeOn(
      'retiled',
      at,
      {
        ...paid,
        tiles: paid.tiles.map((tile) => (tileKey(tile) === key ? after(tile) : tile)),
      },
      paid,
    ),
  );
  return followed(laid, (left) => {
    const building = tileAt(left.tiles, at)?.building;
    switch (cityOn(left, at)) {
      case 'player':
        return building === left.citySection.building ? unchanged(left) : fall(left, 'removal');
      case 'neutral':
        if (building === tileAt(paid.tiles, at)?.building) return unchanged(left);
        return landedAs({
          kind: 'change',
          name: 'neutral-fallen',
          cause,
          before: left,
          chronicle: { ...left, neutral: undefined },
        });
      case undefined:
        return unchanged(left);
    }
  });
}

/**
 * One population of the faction's city taken, whichever it is: an idle one where one is idle, and
 * where none is the last assigned tile unassigned first, the city's last no exception; the
 * population one fewer, as `populationFewer` takes it. Nothing where that city has none at all.
 */
export function populationTaken(
  chronicle: Chronicle,
  whose: CityFaction,
  uncovered?: Cost,
): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined || city.population <= 0) return unchanged(chronicle);
  const last = city.assigned[city.assigned.length - 1];
  if (idle(city) > 0 || last === undefined) return populationFewer(chronicle, whose, uncovered);
  // `assigned` toggles: on a tile nobody works it would put one on.
  return followed(assigned(chronicle, whose, last), (left) =>
    populationFewer(left, whose, uncovered),
  );
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
      chronicle,
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

/** The chronicle screen and `apply` both answer the city-mode click by this, and by nothing else. */
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
  return assigned(chronicle, 'player', tile);
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
  return followed(assigned(chronicle, 'player', from), (left) => assigned(left, 'player', to));
}

/**
 * The faction's city's population on the tile taken off it, or an idle one put on it where none
 * stands there, and nothing where that city is none.
 */
function assigned(chronicle: Chronicle, whose: CityFaction, tile: TileCoords): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  const at = { q: tile.q, r: tile.r };
  const key = tileKey(at);
  const off = city.assigned.filter((coord) => tileKey(coord) !== key);
  return landedAs(
    changeOn(
      'assigned',
      at,
      withCityRows(chronicle, whose, {
        assigned: off.length < city.assigned.length ? off : [...off, at],
      }),
      chronicle,
    ),
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
      chronicle,
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
    changeOn(
      'held',
      taken,
      withCityRows(chronicle, whose, { held: [...city.held, taken] }),
      chronicle,
    ),
  );
  if (idle(city) <= 0) return held;
  return followed(held, (left) => assigned(left, whose, taken));
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
      return followed<Stage>(claiming, (standing) =>
        landedAs(change('runtime-error', standing, standing)),
      );
    }
    claiming = followed<Stage>(claiming, () => grouped({ name: 'claim' }, landing));
  }
}

/**
 * The neutral's population laid over the tiles its script chooses among those its city holds, one
 * `assigned` per population moved under one `assign` group; a choice naming a tile not held, a tile
 * twice or more tiles than its population is a `runtime-error`.
 */
export function neutralAssigns(catalogue: Catalogue, chronicle: Chronicle): Sequence<Stage> {
  const { neutral } = ageOf(catalogue, chronicle.age);
  const city = chronicle.neutral;
  if (neutral === undefined || city === undefined) return unchanged(chronicle);
  const chosen = neutral.script.assigns(catalogue, chronicle, city.held);
  const named = new Set(chosen.map(tileKey));
  const held = new Set(city.held.map(tileKey));
  if (
    named.size < chosen.length ||
    chosen.length > city.population ||
    chosen.some((tile) => !held.has(tileKey(tile)))
  ) {
    return landedAs(change('runtime-error', chronicle, chronicle));
  }
  const worked = new Set(city.assigned.map(tileKey));
  const moving = [
    ...city.assigned.filter((tile) => !named.has(tileKey(tile))),
    ...chosen.filter((tile) => !worked.has(tileKey(tile))),
  ];
  if (moving.length === 0) return unchanged(chronicle);
  let laying = unchanged(chronicle);
  for (const tile of moving) laying = followed(laying, (left) => assigned(left, 'neutral', tile));
  return grouped({ name: 'assign' }, laying);
}

/**
 * The neutral entering one unit through the unit card its script names: a card it cannot pay for or
 * one blocked enters nothing, and one its ratio does not name is a `runtime-error`.
 */
export function neutralEntered(catalogue: Catalogue, chronicle: Chronicle): Landed {
  const { neutral } = ageOf(catalogue, chronicle.age);
  if (neutral === undefined || chronicle.neutral === undefined) return unchanged(chronicle);
  const id = neutral.script.enters(catalogue, chronicle, neutral.ratio);
  if (id === undefined) return unchanged(chronicle);
  if (!neutral.ratio.some(({ card }) => card === id)) {
    return landedAs(change('runtime-error', chronicle, chronicle));
  }
  const card = unitCardOf(catalogue, id);
  return (
    neutralPaid(catalogue, chronicle, id, card.blocked(catalogue, chronicle, 'neutral'), (left) =>
      card.effect(catalogue, left, 'neutral'),
    ) ?? unchanged(chronicle)
  );
}

/**
 * A card a worker of the neutral's plays on the tile it stands on, one `neutral-played` group; a play
 * the neutral's workers cannot make there is a `runtime-error`, one refused or unpaid plays nothing.
 */
export function neutralPlayed(
  catalogue: Catalogue,
  chronicle: Chronicle,
  unit: Unit,
  id: CardId,
  at: TileCoords,
): Sequence<Stage> {
  const tile = tileAt(chronicle.tiles, at);
  const named = ageOf(catalogue, chronicle.age).neutral?.workers?.cards.includes(id) === true;
  const aim = workerAim(cardOf(catalogue, id));
  if (
    !named ||
    aim === undefined ||
    unit.faction !== 'neutral' ||
    unit.embarked ||
    tile === undefined ||
    tileKey(unit.tile) !== tileKey(at) ||
    holderOf(chronicle, at) !== 'neutral'
  ) {
    return landedAs(change('runtime-error', chronicle, chronicle));
  }
  if (aim.refuses(catalogue, chronicle, tile, 'neutral') !== undefined) return unchanged(chronicle);
  const playing = neutralPaid(catalogue, chronicle, id, [], (left) =>
    aim.effect(catalogue, left, at),
  );
  return playing === undefined
    ? unchanged(chronicle)
    : grouped({ name: 'neutral-played' }, playing);
}

/**
 * A card the neutral plays out of its stocks, its cost one `stock` and then what it resolves as, and
 * nothing where the chronicle holds no neutral, where it cannot pay for the card or where a block
 * stands against it.
 */
function neutralPaid(
  catalogue: Catalogue,
  chronicle: Chronicle,
  id: CardId,
  blocked: readonly Block[],
  resolves: (paid: Chronicle) => Landed,
): Landed | undefined {
  const city = chronicle.neutral;
  if (city === undefined) return undefined;
  const costs = costOf(catalogue, id);
  if (!playable({ unaffordable: unaffordable(city, costs), blocked })) return undefined;
  return followed(costPaid(chronicle, 'neutral', costs), resolves);
}
