import {
  type Aim,
  type AimedCard,
  ageOf,
  type Card,
  type Catalogue,
  cardMade,
  cardOf,
  counterOf,
  entered,
  fullHealth,
  unitKind,
} from './catalogue';
import { claimable, populationTaken } from './city';
import {
  distance,
  type FeatureId,
  movementCost,
  runsAlong,
  type Tile,
  type TileCoords,
  tileAt,
  tileKey,
} from './map';
import {
  buildingKind,
  featureKind,
  improvementKind,
  type LayerKind,
  refuse,
  terrainKind,
} from './map-kinds';
import { RESOURCES, type Resource, type Resources } from './resources';
import {
  change,
  changeFrom,
  changeOn,
  followed,
  type Group,
  grouped,
  type Landed,
  landedAs,
  type Sequence,
  unchanged,
} from './stages';
import {
  type Block,
  type Chronicle,
  type ChronicleCard,
  costsOf,
  holds,
  idle,
  type TileBlock,
} from './state';
import { refreshedMovePoints, spentAction, standsOn, type Unit, unitAt } from './units';

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
        ...aim,
        refuses: (catalogue, chronicle, tile) =>
          firstRefusal(chartedTile(chronicle, tile), aim.refuses(catalogue, chronicle, tile)),
      };
    case 'none':
    case 'unit':
    case 'discard-pile':
    case 'hand':
      return aim;
  }
}

/**
 * What a card played lies on the discard pile as: the card it becomes, made as its content makes it,
 * or itself; nothing where it leaves the chronicle instead.
 */
export function lyingAs(catalogue: Catalogue, played: ChronicleCard): ChronicleCard | undefined {
  const card = cardOf(catalogue, played.id);
  if (leavesChronicle(card)) return undefined;
  return card.becomes === undefined ? played : cardMade(catalogue, card.becomes);
}

/**
 * Whether a card played leaves the chronicle instead of going to the discard pile: what single use
 * says of the card carrying it, and what playing a settle card or paying a hazard is.
 */
function leavesChronicle(card: Card): boolean {
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
export function struck(catalogue: Catalogue, chronicle: Chronicle): Sequence<Group> {
  let strikes = unchanged<Group>(chronicle);
  for (const held of chronicle.hand) {
    const card = cardOf(catalogue, held.id);
    switch (card.kind) {
      case 'settle':
      case 'unit':
      case 'building':
      case 'instant':
        break;
      case 'hazard':
        strikes = followed(strikes, (left) =>
          grouped(
            { name: 'strike', card: held.id },
            card.strikes(catalogue, left, counterOf(catalogue, held)),
          ),
        );
        break;
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

/**
 * The units a card aimed at this tile could be played through, one of them named on the play where
 * there are several: those beside it that can be the one, for a card played through a unit beside
 * its tile, and none for any other card.
 */
export function playedThrough(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: AimedCard,
  tile: Tile,
): Unit[] {
  return chronicle.units.filter(
    (unit) => throughRefusal(catalogue, chronicle, card, tile, unit.tile) === undefined,
  );
}

/**
 * What a card aimed at this tile has against being played through the unit standing on `on`: a unit
 * of the player's there first, then one beside the tile, then the card's own reasons against it. A
 * card played through no unit refuses every one as not beside.
 */
export function throughRefusal(
  catalogue: Catalogue,
  chronicle: Chronicle,
  card: AimedCard,
  tile: Tile,
  on: TileCoords,
): TileBlock | undefined {
  const unit = unitAt(chronicle.units, on);
  if (unit?.faction !== 'player') return 'no-unit';
  const through = card.aim === 'tile' ? card.through : undefined;
  if (through === undefined || distance(on, tile) !== 1) return 'not-beside';
  return through(catalogue, chronicle, tile, unit);
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
  return chronicle.snapshots.some((snapshot) => tileKey(snapshot) === at)
    ? undefined
    : 'tile-uncharted';
}

/** A worker of the player's standing on the tile, with action left to spend. */
export function worked(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  if (standing?.faction !== 'player' || !standing.stats.worker) return 'no-worker';
  return standing.action > 0 ? undefined : 'worker-spent';
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

/**
 * The unit standing on the tile with one of its action spent; a `runtime-error` where none stands
 * there.
 */
function acted(paid: Chronicle, at: TileCoords): Landed {
  const acting = unitAt(paid.units, at);
  if (acting === undefined) return landedAs(change('runtime-error', paid));
  return landedAs(
    changeOn('action-spent', at, {
      ...paid,
      units: paid.units.map((unit) => (unit.id === acting.id ? spentAction(unit) : unit)),
    }),
  );
}

/** How a card embarks a unit of the player's ashore beside its tile: embarked, its move is `move`. */
export function embarks(move: number): Aim & { readonly aim: 'tile' } {
  return stepped(true, () => move);
}

/** How a card disembarks an embarked unit of the player's beside its tile: its move is its own again. */
export function disembarks(): Aim & { readonly aim: 'tile' } {
  return stepped(false, (catalogue, unit) => unitKind(catalogue, unit.stats.type).move);
}

/**
 * A unit of the player's beside the tile stepping onto it, embarking or disembarking, played through
 * that unit: the tile charted, of a terrain the step enters, and free; a unit beside it to step; one
 * of those standing on it once stepped, and holding action. It spends one, and moves on `move`.
 */
function stepped(
  embarking: boolean,
  move: (catalogue: Catalogue, unit: Unit) => number,
): Aim & { readonly aim: 'tile' } {
  const onto = (catalogue: Catalogue, unit: Unit): Unit => ({
    ...unit,
    embarked: embarking,
    stats: { ...unit.stats, move: move(catalogue, unit) },
  });
  /**
   * What a unit beside the tile passes to step onto it, in order: the reason refusing a unit that
   * fails it, and the tile's where no unit beside passes it, when that one differs.
   */
  const checks: readonly {
    readonly passes: (catalogue: Catalogue, unit: Unit, tile: Tile) => boolean;
    readonly unit: TileBlock;
    readonly tile?: TileBlock;
  }[] = [
    {
      passes: (_catalogue, unit) => unit.embarked !== embarking,
      unit: embarking ? 'unit-embarked' : 'unit-not-embarked',
      tile: embarking ? 'no-unit-beside' : 'no-embarked-beside',
    },
    {
      passes: (catalogue, unit, tile) =>
        standsOn(catalogue, onto(catalogue, unit).stats, embarking, tile),
      unit: 'wrong-terrain',
    },
    { passes: (_catalogue, unit) => unit.action > 0, unit: 'unit-spent' },
  ];
  return {
    aim: 'tile',
    refuses: (catalogue, chronicle, tile) => {
      const reason = firstRefusal(
        chartedTile(chronicle, tile),
        movementCost(catalogue, tile, embarking) === undefined ? 'wrong-terrain' : undefined,
        unitAt(chronicle.units, tile) === undefined ? undefined : 'unit-standing',
      );
      if (reason !== undefined) return reason;
      let able = chronicle.units.filter(
        (unit) => unit.faction === 'player' && distance(unit.tile, tile) === 1,
      );
      for (const check of checks) {
        able = able.filter((unit) => check.passes(catalogue, unit, tile));
        if (able.length === 0) return check.tile ?? check.unit;
      }
      return undefined;
    },
    through: (catalogue, _chronicle, tile, unit) =>
      checks.find(({ passes }) => !passes(catalogue, unit, tile))?.unit,
    effect: (catalogue, paid, at, through) => {
      const stepping = through === undefined ? undefined : unitAt(paid.units, through);
      if (through === undefined || stepping === undefined) {
        return landedAs(change('runtime-error', paid));
      }
      const tile = { q: at.q, r: at.r };
      return followed(acted(paid, through), (left) =>
        landedAs({
          kind: 'change',
          name: 'move',
          from: through,
          to: tile,
          chronicle: {
            ...left,
            units: left.units.map((unit) =>
              unit.id === stepping.id ? { ...onto(catalogue, unit), tile } : unit,
            ),
          },
        }),
      );
    },
  };
}

/** The tile inside the city's border. */
export function inside(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return holds(chronicle, tile) ? undefined : 'outside-border';
}

/** The tile outside the city's border. */
export function outside(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return holds(chronicle, tile) ? 'inside-border' : undefined;
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
    : 'no-claim';
}

/** The terrains a building stands on, an improvement lies on, or a terraform starts from. */
export function made(
  catalogue: Catalogue,
  tile: Tile,
  terrains: readonly string[],
): TileBlock | undefined {
  for (const terrain of terrains) terrainKind(catalogue, terrain);
  return terrains.includes(tile.terrain) ? undefined : 'wrong-terrain';
}

/** The features a card asks the tile to carry, any one of them. */
export function featureAmong(
  catalogue: Catalogue,
  tile: Tile,
  features: readonly FeatureId[],
): TileBlock | undefined {
  for (const feature of features) featureKind(catalogue, feature);
  return tile.feature !== undefined && features.includes(tile.feature)
    ? undefined
    : 'wrong-feature';
}

/**
 * The ground a layer of that kind goes on: a river running along the tile, where it names the river,
 * then one of the features it names, carried, then one of its terrains.
 */
function groundFor(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: Tile,
  layer: LayerKind,
): TileBlock | undefined {
  return firstRefusal(
    layer.river === true && !runsAlong(chronicle.rivers, tile) ? 'no-river' : undefined,
    layer.features === undefined ? undefined : featureAmong(catalogue, tile, layer.features),
    made(catalogue, tile, layer.terrains),
  );
}

/** A tile's one building slot, free: what a building fills and a settle needs empty. */
export function slotFree(tile: Tile): TileBlock | undefined {
  return tile.building === undefined ? undefined : 'slot-filled';
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
  if (tile.building === ageOf(catalogue, chronicle.age).camp.building) return 'other-faction';
  return reaches(catalogue, chronicle, tile, to) ? undefined : 'wrong-terrain';
}

/**
 * Whether a terraform into `to` reaches the tile: every tile but the city's, and the city's into a
 * terrain its building stands on alone.
 */
function reaches(catalogue: Catalogue, chronicle: Chronicle, at: TileCoords, to: string): boolean {
  return (
    chronicle.city === undefined ||
    tileKey(chronicle.city) !== tileKey(at) ||
    buildingKind(catalogue, chronicle.citySection.building).terrains.includes(to)
  );
}

/** No copy of this improvement on the tile: distinct ones stack, the same one never twice. */
export function improvementAbsent(
  catalogue: Catalogue,
  tile: Tile,
  improvement: string,
): TileBlock | undefined {
  improvementKind(catalogue, improvement);
  return tile.improvements.includes(improvement) ? 'improvement-placed' : undefined;
}

/** A unit of the player's standing on the tile: the whole of what a card aimed at a unit admits. */
export function unitThere(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  return unitAt(chronicle.units, tile)?.faction === 'player' ? undefined : 'no-unit';
}

/** Move points a refresh has room to bring back up: a unit that has spent none is already full. */
export function movePointsSpent(chronicle: Chronicle, tile: TileCoords): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  return standing !== undefined && standing.movePoints < standing.stats.move
    ? undefined
    : 'move-full';
}

/** Health a heal has room to bring back up: a unit at its full health or above is already full. */
export function healthLost(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): TileBlock | undefined {
  const standing = unitAt(chronicle.units, tile);
  return standing !== undefined && standing.stats.health < fullHealth(catalogue, standing.stats)
    ? undefined
    : 'health-full';
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
      return followed(populationTaken(paid), (left) =>
        entered(catalogue, left, { type, faction: 'player', tile: city }),
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
        standsOn(catalogue, unitKind(catalogue, type), false, tile) ? undefined : 'wrong-terrain',
        unitAt(chronicle.units, tile) === undefined ? undefined : 'unit-standing',
      ),
    effect: (catalogue, paid, at) =>
      entered(catalogue, paid, { type, faction: 'player', tile: { q: at.q, r: at.r } }),
  };
}

/**
 * How a building card builds its building, the refusal and the effect as one pair so neither is
 * written without the other: aimed through a worker at a tile of the ground the building goes on,
 * inside the border, its slot free; then the building fills that slot.
 */
export function builds(building: string): Aim & { readonly aim: 'tile' } {
  return throughWorker(
    (catalogue, chronicle, tile) =>
      firstRefusal(
        groundFor(catalogue, chronicle, tile, buildingKind(catalogue, building)),
        inside(chronicle, tile),
        slotFree(tile),
      ),
    (catalogue, paid, at) => built(catalogue, paid, at, building),
  );
}

/**
 * How an improvement card places its improvement, the refusal and the effect as one pair so neither
 * is written without the other: aimed through a worker at a tile of the ground the improvement goes
 * on, not carrying it yet; then the tile carries it.
 */
export function placesImprovement(improvement: string): Aim & { readonly aim: 'tile' } {
  return throughWorker(
    (catalogue, chronicle, tile) =>
      firstRefusal(
        groundFor(catalogue, chronicle, tile, improvementKind(catalogue, improvement)),
        improvementAbsent(catalogue, tile, improvement),
      ),
    (catalogue, paid, at) => improvementPlaced(catalogue, paid, at, improvement),
  );
}

/**
 * The settle of the city section the chronicle carries: its building in the tile's slot, the city
 * holding that tile alone with one population on it and the section's idle besides, and then the
 * city standing on the tile from now on.
 */
export function settled(catalogue: Catalogue, paid: Chronicle, at: TileCoords): Landed {
  const city = { q: at.q, r: at.r };
  const key = tileKey(city);
  const alone = (tiles: readonly TileCoords[]): boolean =>
    tiles.length === 1 && tileKey(tiles[0]) === key;
  const population = 1 + paid.citySection.idle;
  let landing = built(catalogue, paid, city, paid.citySection.building);
  landing = followed(landing, (left) =>
    alone(left.held)
      ? unchanged(left)
      : landedAs(changeOn('held', city, { ...left, held: [city] })),
  );
  landing = followed(landing, (left) =>
    left.population === population
      ? unchanged(left)
      : landedAs(change('population', { ...left, population })),
  );
  landing = followed(landing, (left) =>
    alone(left.assigned)
      ? unchanged(left)
      : landedAs(changeOn('assigned', city, { ...left, assigned: [city] })),
  );
  return followed(landing, (left) =>
    left.city !== undefined && tileKey(left.city) === key
      ? unchanged(left)
      : landedAs(changeOn('settled', city, { ...left, city })),
  );
}

/** One tile of the map layered over, every other tile left as it stands: the one `retiled` change. */
export function retiled(paid: Chronicle, at: TileCoords, after: (tile: Tile) => Tile): Landed {
  const key = tileKey(at);
  return landedAs(
    changeOn('retiled', at, {
      ...paid,
      tiles: paid.tiles.map((tile) => (tileKey(tile) === key ? after(tile) : tile)),
    }),
  );
}

/** The building filling the building slot of a tile. */
export function built(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  building: string,
): Landed {
  buildingKind(catalogue, building);
  return retiled(paid, at, (tile) => ({ ...tile, building }));
}

/** The improvement an instant places: the tile carries it from now on, and the worker stays put. */
export function improvementPlaced(
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
 * A tile whose terrain or feature has just changed, keeping every layer whose kind names its terrain
 * and, where the kind names features, one of them it carries; every other layer is removed.
 */
function relayered(catalogue: Catalogue, tile: Tile): Tile {
  const keeps = ({ terrains, features }: LayerKind): boolean =>
    terrains.includes(tile.terrain) &&
    (features === undefined || featureAmong(catalogue, tile, features) === undefined);
  return {
    ...tile,
    improvements: tile.improvements.filter((improvement) =>
      keeps(improvementKind(catalogue, improvement)),
    ),
    building:
      tile.building !== undefined && keeps(buildingKind(catalogue, tile.building))
        ? tile.building
        : undefined,
  };
}

/**
 * The feature placed on a tile: the tile carries it from now on, and every layer that goes with the
 * one it replaces is removed with it.
 */
export function featurePlaced(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  feature: FeatureId,
): Landed {
  featureKind(catalogue, feature);
  return retiled(paid, at, (tile) => relayered(catalogue, { ...tile, feature }));
}

/**
 * The feature removed from a tile with every layer that goes with it: the tile carries none from now
 * on, and nothing where it carried none.
 */
export function featureRemoved(catalogue: Catalogue, paid: Chronicle, at: TileCoords): Landed {
  if (tileAt(paid.tiles, at)?.feature === undefined) return unchanged(paid);
  return retiled(paid, at, (tile) => relayered(catalogue, { ...tile, feature: undefined }));
}

/**
 * The terrain a tile is terraformed into: its feature goes, and so does every layer that goes with
 * the old terrain or the feature, and a unit that cannot stand on it is killed. The city's tile, into
 * a terrain the city's building does not stand on, is left as it stands.
 */
export function terraformed(
  catalogue: Catalogue,
  paid: Chronicle,
  at: TileCoords,
  to: string,
): Landed {
  terrainKind(catalogue, to);
  if (!reaches(catalogue, paid, at, to)) return unchanged(paid);
  const relaid = retiled(paid, at, (tile) =>
    relayered(catalogue, { ...tile, terrain: to, feature: undefined }),
  );
  return followed(relaid, (left) => {
    const standing = unitAt(left.units, at);
    if (
      standing === undefined ||
      standsOn(catalogue, standing.stats, standing.embarked, tileAt(left.tiles, at))
    ) {
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

/**
 * The unit standing on the tile, whatever its faction, healed to its full health, and nothing where
 * none stands there or its health is not below full.
 */
export function healed(catalogue: Catalogue, paid: Chronicle, at: TileCoords): Landed {
  const hurt = unitAt(paid.units, at);
  if (hurt === undefined) return unchanged(paid);
  const health = fullHealth(catalogue, hurt.stats);
  if (hurt.stats.health >= health) return unchanged(paid);
  return landedAs(
    changeOn('healed', at, {
      ...paid,
      units: paid.units.map((unit) =>
        unit.id === hurt.id ? { ...unit, stats: { ...unit.stats, health } } : unit,
      ),
    }),
  );
}

/** The card a recall brings back: it leaves the discard pile for the back of the hand. */
export function recalled(paid: Chronicle, at: number): Landed {
  return landedAs(
    changeFrom('recalled', [at], {
      ...paid,
      hand: [...paid.hand, paid.discardPile[at]],
      discardPile: paid.discardPile.filter((_, index) => index !== at),
    }),
  );
}

/**
 * The cards at those places of the hand gone to the discard pile, in hand order, and nothing where no
 * place is named; a place the hand does not hold is a `runtime-error` and discards nothing.
 */
export function discarded(chronicle: Chronicle, places: readonly number[]): Landed {
  if (places.length === 0) return unchanged(chronicle);
  if (places.some((at) => chronicle.hand[at] === undefined)) {
    return landedAs(change('runtime-error', chronicle));
  }
  const leaving = chronicle.hand.map((_, at) => at).filter((at) => places.includes(at));
  return landedAs(
    changeFrom('discarded', leaving, {
      ...chronicle,
      hand: chronicle.hand.filter((_, at) => !places.includes(at)),
      discardPile: [...chronicle.discardPile, ...leaving.map((at) => chronicle.hand[at])],
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
