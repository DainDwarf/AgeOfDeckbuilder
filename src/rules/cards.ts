import {
  type Aim,
  type AimedCard,
  type Card,
  type Catalogue,
  cardOf,
  entered,
  unitKind,
} from './catalogue';
import { claimable } from './city';
import { type Tile, type TileCoords, tileAt, tileKey } from './map';
import { buildingKind, improvementKind, refuse, terrainKind } from './map-kinds';
import { RESOURCES, type Resource, type Resources } from './resources';
import { change, changeOn, followed, type Group, type Landed, landedAs, unchanged } from './stages';
import { type Block, type Chronicle, costsOf, holds, idle, type TileBlock } from './state';
import { refreshedMovePoints, spentAction, standsOn, unitAt } from './units';

/** The declared order of the kinds, which is the order a sorted list of cards reads in. */
export const CARD_KINDS = ['settle', 'unit', 'building', 'instant', 'hazard'] as const;

export type CardKind = (typeof CARD_KINDS)[number];

/**
 * How a card is played, whatever its kind: what it is aimed at, and what it does with what it was
 * aimed at. A hazard is aimed at nothing and does nothing when it is played.
 */
export function aimOf(card: Card): Aim {
  switch (card.kind) {
    case 'settle':
      return charted(card);
    case 'unit':
    case 'building':
    case 'instant':
      return card;
    case 'hazard':
      return { aim: 'none', effect: (_catalogue, paid) => unchanged(paid) };
  }
}

/** A settle card's aim: aimed at a tile, it asks for the tile charted before its own reasons. */
function charted(aim: Aim): Aim {
  switch (aim.aim) {
    case 'tile':
      return {
        aim: 'tile',
        refuses: (catalogue, chronicle, tile) =>
          firstRefusal(chartedTile(chronicle, tile), aim.refuses(catalogue, chronicle, tile)),
        effect: aim.effect,
      };
    case 'none':
    case 'unit':
    case 'discard-pile':
      return aim;
  }
}

/**
 * Whether a card played leaves the chronicle instead of going to the discard pile: what single use
 * says of the card carrying it, and what playing a settle card or paying a hazard is.
 */
export function leavesChronicle(card: Card): boolean {
  switch (card.kind) {
    case 'unit':
    case 'building':
    case 'instant':
      return card.singleUse === true;
    case 'settle':
    case 'hazard':
      return true;
  }
}

/**
 * The hazards of the hand striking, in hand order, each on the chronicle the one before it left: one
 * `strike` each, over what its strike raised, and none where the hand holds no hazard.
 */
export function struck(catalogue: Catalogue, chronicle: Chronicle): Group[] {
  const strikes: Group[] = [];
  let standing = chronicle;
  for (const id of chronicle.hand) {
    const card = cardOf(catalogue, id);
    switch (card.kind) {
      case 'settle':
      case 'unit':
      case 'building':
      case 'instant':
        break;
      case 'hazard': {
        const { stages, chronicle: left } = card.strikes(catalogue, standing);
        strikes.push({ kind: 'group', name: 'strike', card: id, chronicle: left, stages });
        standing = left;
        break;
      }
    }
  }
  return strikes;
}

/**
 * The one reason a card aimed at a tile refuses this one, and nothing at all on a tile it admits:
 * what the aim's kind asks of the tile, then what the card's own aim does. Every path that lights a
 * tile, plays on one or says why it was turned down asks here.
 */
export function refuses(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: AimedCard,
  tile: Tile,
): TileBlock | undefined {
  switch (card.aim) {
    case 'tile':
      return card.refuses(catalogue, chronicle, tile);
    case 'unit':
      return firstRefusal(unitThere(chronicle, tile), card.refuses(catalogue, chronicle, tile));
  }
}

/** The first check that refuses, in the order the aim hands them over: the one reason it answers. */
export function firstRefusal(...checks: readonly (TileBlock | undefined)[]): TileBlock | undefined {
  return checks.find((reason) => reason !== undefined);
}

/**
 * A tile that has been in sight, in sight now or in fog: what a settle card aimed at a tile is
 * aimed at.
 */
export function chartedTile(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const at = tileKey(tile);
  return chronicle.snapshots.some((snapshot) => tileKey(snapshot) === at) ? undefined : 'uncharted';
}

/** A worker of the player's standing on the tile, with action left to spend. */
export function worked(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  if (standing?.faction !== 'player' || !standing.stats.worker) return 'worker';
  return standing.action > 0 ? undefined : 'action';
}

/**
 * How a card played through a worker is aimed, the check and the spend as one pair so neither is
 * written without the other: the worker's reasons come before the tile's, and the worker standing on
 * the tile spends one of its action as the card's own effect lands.
 */
export function throughWorker(
  refusesTile: (catalogue: Catalogue, chronicle: Chronicle, tile: Tile) => TileBlock | undefined,
  effect: (catalogue: Catalogue, paid: Chronicle, at: TileCoords) => Landed,
): Aim & { readonly aim: 'tile' } {
  return {
    aim: 'tile',
    refuses: (catalogue, chronicle, tile) =>
      firstRefusal(worked(chronicle, tile), refusesTile(catalogue, chronicle, tile)),
    effect: (catalogue, paid, at) =>
      followed(acted(paid, at), (left) => effect(catalogue, left, at)),
  };
}

/** The unit standing on the tile with one of its action spent, and nothing where none stands there. */
function acted(paid: Chronicle, at: TileCoords): Landed {
  const acting = unitAt(paid.units, at);
  if (acting === undefined) return unchanged(paid);
  return landedAs(
    changeOn('action-spent', at, {
      ...paid,
      units: paid.units.map((unit) => (unit.id === acting.id ? spentAction(unit) : unit)),
    }),
  );
}

/** The tile inside the city's border: what a building card asks for and an instant does not. */
export function inside(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return holds(chronicle, tile) ? undefined : 'border';
}

/** A tile the city may claim: the one list city mode marks. */
export function claimableTile(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): TileBlock | undefined {
  const at = tileKey(tile);
  return claimable(catalogue, chronicle).some((coord) => tileKey(coord) === at)
    ? undefined
    : 'claim';
}

/** The terrains a building stands on, an improvement lies on, or a terraform starts from. */
export function made(
  catalogue: Catalogue,
  tile: Tile,
  terrains: readonly string[],
): TileBlock | undefined {
  for (const terrain of terrains) terrainKind(catalogue, terrain);
  return terrains.includes(tile.terrain) ? undefined : 'terrain';
}

/** A tile's one building slot, free: what a building fills and a settle needs empty. */
export function slotFree(tile: Tile): TileBlock | undefined {
  return tile.building === undefined ? undefined : 'slot';
}

/**
 * What a terraform of the player's into `to` asks of the tile besides the terrains it starts from: no
 * camp's tile until the camp is captured, and the city's tile only into a terrain the city's building
 * stands on.
 */
export function terraformable(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: Tile,
  to: string,
): TileBlock | undefined {
  if (tile.building === catalogue.camp.building) return 'faction';
  return reaches(catalogue, chronicle, tile, to) ? undefined : 'terrain';
}

/**
 * Whether a terraform into `to` reaches the tile: every tile but the city's, and the city's into a
 * terrain its building stands on alone.
 */
function reaches(catalogue: Catalogue, chronicle: Chronicle, at: TileCoords, to: string): boolean {
  return (
    chronicle.city === undefined ||
    tileKey(chronicle.city) !== tileKey(at) ||
    buildingKind(catalogue, catalogue.city.building).terrains.includes(to)
  );
}

/** No copy of this improvement on the tile: distinct ones stack, the same one never twice. */
export function unimproved(
  catalogue: Catalogue,
  tile: Tile,
  improvement: string,
): TileBlock | undefined {
  improvementKind(catalogue, improvement);
  return tile.improvements.includes(improvement) ? 'improvement' : undefined;
}

/** A unit of the player's standing on the tile: the whole of what a card aimed at a unit admits. */
export function unitThere(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return unitAt(chronicle.units, tile)?.faction === 'player' ? undefined : 'unit';
}

/** Move points a refresh has room to bring back up: a unit that has spent none is already full. */
export function movePointsSpent(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  return standing !== undefined && standing.movePoints < standing.stats.move ? undefined : 'move';
}

/**
 * How a unit card enters its unit, the block and the effect as one pair so neither is written
 * without the other: the city keeps its last population, needs one idle to turn into the unit, and
 * needs its own tile free; then one idle population becomes the unit, on the city's tile.
 */
export function enters(type: string): Aim & { readonly aim: 'none' } {
  return {
    aim: 'none',
    blocked: (_catalogue, chronicle) => {
      const blocks: Block[] = [];
      if (chronicle.population <= 1) blocks.push('population');
      if (idle(chronicle) <= 0) blocks.push('idle');
      if (chronicle.city !== undefined && unitAt(chronicle.units, chronicle.city) !== undefined)
        blocks.push('city');
      return blocks;
    },
    effect: (catalogue, paid) => {
      const { city } = paid;
      if (city === undefined) refuse(catalogue, `a ${type} entered while the city stands nowhere`);
      return followed(
        landedAs(change('population', { ...paid, population: paid.population - 1 })),
        (left) => entered(catalogue, left, { type, faction: 'player', tile: city }),
      );
    },
  };
}

/**
 * How a settle card enters its unit, the refusal and the effect as one pair so neither is written
 * without the other: aimed at a tile the unit can stand on with no unit standing there, the unit
 * enters on it, the player's, and takes no population.
 */
export function entersOn(type: string): Aim & { readonly aim: 'tile' } {
  return {
    aim: 'tile',
    refuses: (catalogue, chronicle, tile) =>
      firstRefusal(
        standsOn(catalogue, unitKind(catalogue, type), tile) ? undefined : 'terrain',
        unitAt(chronicle.units, tile) === undefined ? undefined : 'standing',
      ),
    effect: (catalogue, paid, at) =>
      entered(catalogue, paid, { type, faction: 'player', tile: { q: at.q, r: at.r } }),
  };
}

/**
 * The settle: the city stands on the tile from now on, its building in the tile's slot, holding that
 * tile alone with one population on it and the city's idle count besides.
 */
export function settled(catalogue: Catalogue, paid: Chronicle, at: TileCoords): Landed {
  const city = { q: at.q, r: at.r };
  let landing = built(catalogue, paid, city, catalogue.city.building);
  landing = followed(landing, (left) => landedAs(changeOn('settled', city, { ...left, city })));
  landing = followed(landing, (left) =>
    landedAs(changeOn('held', city, { ...left, held: [city] })),
  );
  landing = followed(landing, (left) =>
    landedAs(change('population', { ...left, population: 1 + catalogue.city.idle })),
  );
  return followed(landing, (left) =>
    landedAs(changeOn('assigned', city, { ...left, assigned: [city] })),
  );
}

/** One tile of the map layered over, every other tile left as it stands: the one `retiled` change. */
function retiled(paid: Chronicle, at: TileCoords, after: (tile: Tile) => Tile): Landed {
  const key = tileKey(at);
  return landedAs(
    changeOn('retiled', at, {
      ...paid,
      tiles: paid.tiles.map((tile) => (tileKey(tile) === key ? after(tile) : tile)),
    }),
  );
}

/** The building a building card builds: it fills the slot of the tile the card was aimed at. */
export function built(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  building: string,
): Landed {
  buildingKind(catalogue, building);
  return retiled(paid, at, (tile) => ({ ...tile, building }));
}

/** The improvement an instant lays: the tile carries it from now on, and the worker stays put. */
export function improved(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  improvement: string,
): Landed {
  improvementKind(catalogue, improvement);
  return retiled(paid, at, (tile) => ({
    ...tile,
    improvements: [...tile.improvements, improvement],
  }));
}

/**
 * The terrain a tile is terraformed into: the feature that lay on the old terrain goes with it, and
 * so does every improvement and the building whose kind does not name the new terrain; the ones
 * whose kind names it stay. A unit standing on the tile that cannot stand on the new terrain is
 * killed. The city's tile, into a terrain the city's building does not stand on, is left as it
 * stands, and nothing is raised.
 */
export function terraformed(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  to: string,
): Landed {
  terrainKind(catalogue, to);
  if (!reaches(catalogue, paid, at, to)) return unchanged(paid);
  const relayered = retiled(paid, at, (tile) => ({
    ...tile,
    terrain: to,
    feature: undefined,
    improvements: tile.improvements.filter((improvement) =>
      improvementKind(catalogue, improvement).terrains.includes(to),
    ),
    building:
      tile.building !== undefined && buildingKind(catalogue, tile.building).terrains.includes(to)
        ? tile.building
        : undefined,
  }));
  return followed(relayered, (left) => {
    const standing = unitAt(left.units, at);
    if (standing === undefined || standsOn(catalogue, standing.stats, tileAt(left.tiles, at))) {
      return unchanged(left);
    }
    return landedAs(
      changeOn('killed', at, {
        ...left,
        units: left.units.filter((unit) => unit.id !== standing.id),
      }),
    );
  });
}

/**
 * The move points an instant refreshes, on the unit standing on the tile it was aimed at, and
 * nothing where they were already full.
 */
export function refreshed(paid: Chronicle, at: TileCoords): Landed {
  const marching = unitAt(paid.units, at);
  if (marching === undefined || marching.movePoints === marching.stats.move) {
    return unchanged(paid);
  }
  return landedAs(
    changeOn('refreshed', at, {
      ...paid,
      units: paid.units.map((unit) => (unit.id === marching.id ? refreshedMovePoints(unit) : unit)),
    }),
  );
}

/** The card a recall brings back: it leaves the discard pile for the back of the hand. */
export function recalled(paid: Chronicle, at: number): Landed {
  return landedAs(
    change('recalled', {
      ...paid,
      hand: [...paid.hand, paid.discardPile[at]],
      discardPile: paid.discardPile.filter((_, index) => index !== at),
    }),
  );
}

/** The resources gained into the city's stock, and nothing where it gains none. */
export function gained(paid: Chronicle, gain: Partial<Resources>): Landed {
  if (costsOf(gain).length === 0) return unchanged(paid);
  const resources = { ...paid.resources };
  for (const resource of RESOURCES) resources[resource] += gain[resource] ?? 0;
  return landedAs(change('stock', { ...paid, resources }));
}

/**
 * A resource shocked: the city's stock of it loses the amount, and never falls below nothing; nothing
 * where the stock stands where it did.
 */
export function shocked(chronicle: Chronicle, resource: Resource, amount: number): Landed {
  const left = Math.max(0, chronicle.resources[resource] - amount);
  if (left === chronicle.resources[resource]) return unchanged(chronicle);
  return landedAs(
    change('stock', { ...chronicle, resources: { ...chronicle.resources, [resource]: left } }),
  );
}
