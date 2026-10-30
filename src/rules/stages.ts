import type { TileCoords } from './map';
import {
  type CardId,
  type Chronicle,
  type Cost,
  cardKeyed,
  type DefeatCause,
  type NeutralFallCause,
} from './state';

/** One row of the chronicle moved, on the chronicle it was raised on, leaving the one it carries. */
export type Change = {
  readonly kind: 'change';
  readonly before: Chronicle;
  readonly chronicle: Chronicle;
} & (
  | { readonly name: PlainChange }
  | {
      readonly name: 'stock';
      /** The tile that yielded it, where one did. */
      readonly tile?: TileCoords;
    }
  | {
      readonly name: 'population';
      /**
       * Where it pays for a stock taken past nothing: the resource and what the stock did not cover;
       * on the city's last population, every stock still uncovered.
       */
      readonly uncovered?: readonly Cost[];
    }
  | { readonly name: 'neutral-fallen'; readonly cause: NeutralFallCause }
  | { readonly name: TiledChange; readonly tile: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * A name for why over the stages it holds, raised on its first stage's `before` and leaving its last
 * stage's chronicle, or, holding none, the one it was handed for both; a draw of the generator that
 * raised no stage rides on the one it leaves either way.
 */
export type Group = {
  readonly kind: 'group';
  readonly before: Chronicle;
  readonly chronicle: Chronicle;
  readonly stages: readonly Stage[];
} & GroupHead;

/** What a group is named and carries, a card by its key, before the stages it holds. */
type GroupHead =
  | { readonly name: PlainGroup }
  | { readonly name: 'played'; readonly card: number; readonly aimed: Aimed }
  | { readonly name: 'strike'; readonly card: number }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'capture'; readonly tile: TileCoords };

/** The one step a command resolves as, a change or a group, each on a chronicle and leaving one. */
export type Stage = Change | Group;

/** What a card is played at: nothing, a tile, a unit or a card of the hand. */
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
      readonly aim: 'hand';
      /** The key of the card aimed at. */
      readonly card: number;
    };

/** One card played: the group carrying the card's key and what it was aimed at. */
export type Play = Extract<Group, { readonly name: 'played' }>;

/** Every card the stages played, in the order the walk plays them. */
export function plays(stages: readonly Stage[]): Play[] {
  return [...walked(stages)].filter(
    (stage): stage is Play => stage.kind === 'group' && stage.name === 'played',
  );
}

/** The id of the card of that key in the hand the group was raised on. A key it does not hold throws. */
export function idInHand({ before }: Group, key: number): CardId {
  const card = cardKeyed(before.hand, key);
  if (card === undefined) {
    throw new Error(`a group named the key ${key}, which the hand it was raised on did not hold`);
  }
  return card.id;
}

/** The changes that carry nothing but the chronicle they leave. */
type PlainChange =
  | 'added'
  | 'drawn'
  | 'discarded'
  | 'exhausted'
  | 'banished'
  | 'shuffled'
  | 'counters-set'
  | 'turn'
  | 'rolled'
  | 'shown'
  | 'dealt'
  | 'taken'
  | 'ended'
  | 'tallied'
  | 'reached'
  | 'relations'
  | 'runtime-error';

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

export function change(
  name: PlainChange | 'stock' | 'population',
  chronicle: Chronicle,
  before: Chronicle,
): Change {
  return { kind: 'change', name, before, chronicle };
}

export function changeOn(
  name: TiledChange | 'stock',
  tile: TileCoords,
  chronicle: Chronicle,
  before: Chronicle,
): Change {
  return { kind: 'change', name, tile, before, chronicle };
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

/** A `runtime-error` among stages, and the group holding it nearest, where one does. */
export type RuntimeError = { readonly during: Group['name'] | undefined };

/** Every `runtime-error` among the stages, in the order the walk plays them. */
export function runtimeErrors(stages: readonly Stage[]): RuntimeError[] {
  const among = (stage: Stage, during: Group['name'] | undefined): RuntimeError[] => {
    switch (stage.kind) {
      case 'change':
        return stage.name === 'runtime-error' ? [{ during }] : [];
      case 'group':
        return stage.stages.flatMap((held) => among(held, stage.name));
    }
  };
  return stages.flatMap((stage) => among(stage, undefined));
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

/** A landing that made the one change: the one place a change joins what a command resolves as. */
export function landedAs(stage: Change): Landed {
  return { stages: [stage], chronicle: stage.chronicle };
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
  const group: Group = {
    kind: 'group',
    before: over.stages[0]?.before ?? over.chronicle,
    chronicle: over.chronicle,
    stages: over.stages,
    ...head,
  };
  return { stages: [group], chronicle: group.chronicle };
}

/**
 * The stages with every one raised on the chronicle the leaf before it left, the first on `started`,
 * once a pass has rebuilt the chronicles they leave; a draw of the generator that raised no stage
 * rides on no stage's `before`.
 */
export function raisedOn(started: Chronicle, stages: readonly Stage[]): Stage[] {
  let left = started;
  const atLeaf = <Leaf extends Stage>(stage: Leaf): Leaf => {
    const before = left;
    left = stage.chronicle;
    return stage.before === before ? stage : { ...stage, before };
  };
  const raise = (stage: Stage): Stage => {
    switch (stage.kind) {
      case 'change':
        return atLeaf(stage);
      case 'group': {
        if (stage.stages.length === 0) return atLeaf(stage);
        const held = stage.stages.map(raise);
        const before = held[0].before;
        if (before === stage.before && held.every((child, at) => child === stage.stages[at])) {
          return stage;
        }
        return { ...stage, before, stages: held };
      }
    }
  };
  return stages.map(raise);
}

/** A defeat, the one `ended` of it: the chronicle records what ended it and on which turn. */
export function fall(chronicle: Chronicle, cause: DefeatCause): Landed {
  return landedAs(
    change(
      'ended',
      { ...chronicle, ending: { outcome: 'defeat', cause, turn: chronicle.turn } },
      chronicle,
    ),
  );
}
