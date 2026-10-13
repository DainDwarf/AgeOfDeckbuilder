import { type TileCoords, tileAt, tileKey } from './map';
import { RESOURCES } from './resources';
import {
  type CardId,
  type Chronicle,
  CITY_FACTIONS,
  type CityFaction,
  cityRows,
  type DefeatCause,
  idle,
  withCityRows,
} from './state';

/**
 * One row of the chronicle moved, and the chronicle it leaves. `stock` carries the tile if one
 * yielded it; `discarded`, `exhausted`, `recalled` and `banished` carry where their cards came out
 * of, indices into the pile as it stood before — the hand, the discard pile for `recalled` — and a
 * `discarded` or an `exhausted` card lies on top of its pile in the chronicle the change leaves, in
 * the order of the places.
 */
export type Change = { readonly kind: 'change'; readonly chronicle: Chronicle } & (
  | { readonly name: PlainChange }
  | { readonly name: PlacedChange; readonly places: readonly number[] }
  | { readonly name: 'stock'; readonly tile?: TileCoords }
  | { readonly name: TiledChange; readonly tile: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * A name for why, over the stages it holds, and the chronicle it leaves: its last stage's, or the one
 * it was handed or left where it holds none, a draw of the generator that raised no stage riding on
 * it either way.
 */
export type Group = {
  readonly kind: 'group';
  readonly chronicle: Chronicle;
  readonly stages: readonly Stage[];
} & GroupHead;

/** What a group is named and carries, before the stages it holds. */
type GroupHead =
  | { readonly name: PlainGroup }
  | { readonly name: 'played'; readonly card: CardId; readonly aimed: Aimed }
  | { readonly name: 'strike'; readonly card: CardId }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'capture'; readonly tile: TileCoords };

/** The one step a command resolves as, a change or a group, each carrying the chronicle it leaves. */
export type Stage = Change | Group;

/** What a card is played at: nothing, a tile, a unit, a card of the discard pile or of the hand. */
export type Aimed =
  | { readonly aim: 'none' }
  | {
      readonly aim: 'tile';
      readonly tile: TileCoords;
      /** The tile of the unit a card played through a unit beside its tile names, among several. */
      readonly through?: TileCoords;
    }
  | {
      readonly aim: 'unit';
      /** The tile the unit it is aimed at stands on: a unit is played at through the map. */
      readonly tile: TileCoords;
    }
  | {
      readonly aim: 'discard-pile';
      /**
       * Where in the discard pile the card aimed at it lies, in the pile as it stood before the
       * play: the play sends the card being played to the pile before the effect resolves.
       */
      readonly card: number;
    }
  | {
      readonly aim: 'hand';
      /**
       * Where in the hand the card aimed at lies, in the hand as it stood before the play: the play
       * takes the card being played out of the hand before the effect resolves.
       */
      readonly card: number;
    };

/** One card played: the group carrying the card and what it was aimed at. */
export type Play = Extract<Group, { readonly name: 'played' }>;

/** Every card the stages played, in the order the walk plays them. */
export function plays(stages: readonly Stage[]): Play[] {
  return [...walked(stages)].filter(
    (stage): stage is Play => stage.kind === 'group' && stage.name === 'played',
  );
}

/** The changes that carry nothing but the chronicle they leave. */
type PlainChange =
  | 'added'
  | 'population'
  | 'drawn'
  | 'shuffled'
  | 'turn'
  | 'rolled'
  | 'shown'
  | 'dealt'
  | 'taken'
  | 'ended'
  | 'tallied'
  | 'reached'
  | 'relations'
  | 'neutral-fallen'
  | 'runtime-error';

type PlacedChange = 'discarded' | 'exhausted' | 'recalled' | 'banished';

/** The changes that carry the tile they moved a row on. */
type TiledChange =
  | 'enter'
  | 'damaged'
  | 'healed'
  | 'killed'
  | 'refreshed'
  | 'action-spent'
  | 'prepare'
  | 'wave-sent'
  | 'camp-joined'
  | 'retiled'
  | 'charted'
  | 'held'
  | 'settled'
  | 'assigned';

/** The groups that carry nothing but the stages they hold and the chronicle they leave. */
type PlainGroup =
  | 'refused'
  | 'assign'
  | 'claim'
  | 'neutral-played'
  | 'income'
  | 'grow'
  | 'turn'
  | 'enemy-phase'
  | 'capstone-landing'
  | 'capstone-continued'
  | 'deal'
  | 'answer'
  | 'reward';

export function change(name: PlainChange | 'stock', chronicle: Chronicle): Change {
  return { kind: 'change', name, chronicle };
}

export function changeOn(
  name: TiledChange | 'stock',
  tile: TileCoords,
  chronicle: Chronicle,
): Change {
  return { kind: 'change', name, tile, chronicle };
}

export function changeFrom(
  name: PlacedChange,
  places: readonly number[],
  chronicle: Chronicle,
): Change {
  return { kind: 'change', name, places, chronicle };
}

/** Every stage of the tree in order, a group before the stages it holds. */
export function* walked(stages: readonly Stage[]): Generator<Stage> {
  for (const stage of stages) {
    yield stage;
    switch (stage.kind) {
      case 'change':
        break;
      case 'group':
        yield* walked(stage.stages);
        break;
    }
  }
}

/** Whether a stage settles its chronicle as it plays: a change, or a group holding nothing. */
export function leaf(stage: Stage): boolean {
  switch (stage.kind) {
    case 'change':
      return true;
    case 'group':
      return stage.stages.length === 0;
  }
}

/**
 * Stages in the order they were raised, and the chronicle they leave: the last stage's, or the very
 * chronicle the sequence was handed where it raised none, apart from a draw of the generator that
 * raised no stage. Once a stage of it ends the chronicle, nothing follows it.
 */
export type Sequence<S extends Stage = Stage> = {
  readonly stages: readonly S[];
  readonly chronicle: Chronicle;
};

/**
 * What a landing answers: one change per row it moved, in the order it moved them, and the chronicle
 * it leaves. A draw of the generator rides on the change it drew for, so a landing that raised
 * nothing drew nothing.
 */
export type Landed = Sequence<Change>;

/** A landing, or any sequence, that changed nothing. */
export function unchanged<S extends Stage = Change>(chronicle: Chronicle): Sequence<S> {
  return { stages: [], chronicle };
}

/**
 * A landing that made the one change: the one place a change joins what a command resolves as. A
 * stock it leaves below nothing stands at nothing, one population of that city taken after it for
 * each such stock; where a standing city is left fallen, an `ended` last.
 */
export function landedAs(stage: Change): Landed {
  const paying: CityFaction[] = [];
  let { chronicle } = stage;
  for (const whose of CITY_FACTIONS) {
    const city = cityRows(chronicle, whose);
    if (city === undefined) continue;
    const below = RESOURCES.filter((resource) => city.resources[resource] < 0);
    if (below.length === 0) continue;
    const resources = { ...city.resources };
    for (const resource of below) resources[resource] = 0;
    chronicle = withCityRows(chronicle, whose, { resources });
    paying.push(...below.map(() => whose));
  }
  let landed: Landed = {
    stages: [paying.length === 0 ? stage : { ...stage, chronicle }],
    chronicle,
  };
  for (const whose of paying) landed = followed(landed, (left) => populationTaken(left, whose));
  return followed(landed, fallen);
}

/** An `ended` where the chronicle leaves a standing city fallen, and nothing where it stands. */
function fallen(chronicle: Chronicle): Landed {
  const cause = fallsFor(chronicle);
  if (cause === undefined) return unchanged(chronicle);
  const ended = change('ended', fall(chronicle, cause));
  return { stages: [ended], chronicle: ended.chronicle };
}

/**
 * One population of the faction's city taken, whichever it is: an idle one where one is idle, and
 * where none is the last assigned tile unassigned first, the city's last no exception; the
 * population one fewer. Nothing where that city has no population at all.
 */
export function populationTaken(chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined || city.population <= 0) return unchanged(chronicle);
  const last = city.assigned[city.assigned.length - 1];
  if (idle(city) > 0 || last === undefined) return populationFewer(chronicle, whose);
  return populationLeaving(chronicle, whose, last);
}

/**
 * The population of the faction's city off the tile and then one fewer. The tile must be one its
 * population works: `assigned` toggles, and on an unworked tile it would put one on.
 */
export function populationLeaving(
  chronicle: Chronicle,
  whose: CityFaction,
  at: TileCoords,
): Landed {
  return followed(assigned(chronicle, whose, at), (left) => populationFewer(left, whose));
}

/** The faction's city's population one fewer, and nothing where that city is none. */
function populationFewer(chronicle: Chronicle, whose: CityFaction): Landed {
  const city = cityRows(chronicle, whose);
  if (city === undefined) return unchanged(chronicle);
  return landedAs(
    change('population', withCityRows(chronicle, whose, { population: city.population - 1 })),
  );
}

/**
 * The faction's city's population on the tile taken off it, or an idle one put on it where none
 * stands there, and nothing where that city is none.
 */
export function assigned(chronicle: Chronicle, whose: CityFaction, tile: TileCoords): Landed {
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
    ),
  );
}

/**
 * What the player's city falls for on this chronicle, settled and not ended: no population left, or
 * its building gone from its tile; nothing where it stands.
 */
export function fallsFor(chronicle: Chronicle): DefeatCause | undefined {
  const { city, ending } = chronicle;
  if (ending !== undefined || city === undefined) return undefined;
  if (chronicle.population <= 0) return 'population';
  const standing = tileAt(chronicle.tiles, city)?.building;
  return standing === chronicle.citySection.building ? undefined : 'removal';
}

/**
 * One sequence and then another on the chronicle the first left, their stages in that order; where
 * the first ends the chronicle, the second is never resolved.
 */
export function followed<S extends Stage>(
  first: Sequence<S>,
  next: (chronicle: Chronicle) => Sequence<S>,
): Sequence<S> {
  if (first.chronicle.ending !== undefined) return first;
  const second = next(first.chronicle);
  return { stages: [...first.stages, ...second.stages], chronicle: second.chronicle };
}

/** A group over what a sequence raised, leaving the chronicle it left: the one stage it answers. */
export function grouped(head: GroupHead, over: Sequence): Sequence<Group> {
  const group: Group = { kind: 'group', chronicle: over.chronicle, stages: over.stages, ...head };
  return { stages: [group], chronicle: group.chronicle };
}

/** The city's fall: the chronicle records what took it and on which turn, and ends there. */
export function fall(chronicle: Chronicle, cause: DefeatCause): Chronicle {
  return { ...chronicle, ending: { outcome: 'defeat', cause, turn: chronicle.turn } };
}
