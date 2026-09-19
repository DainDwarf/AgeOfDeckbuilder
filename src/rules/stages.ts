import type { TileCoords } from './map';
import type { CardId, Chronicle, DefeatCause } from './state';

/**
 * One row of the chronicle moved, and the chronicle it leaves. On a unit: `enter` is one unit
 * entering on the tile, `move` one unit crossing, `damaged` the unit standing on the tile hurt by no
 * attacker, `killed` it gone at nought health or off a terrain it cannot stand on, `refreshed` its
 * move points or its action brought back up, `action-spent` one of its action spent and its move points with it. On a tile:
 * `retiled` is its layers changed, `charted` it charted as it stands on this change, `held` its
 * holder changed, `settled` the city standing on it. `stock` is the city's stock moved, carrying the
 * tile where a tile yielded it, `population` its count, and `assigned` a tile worked or left. On the
 * piles: `laid` is a card laid on top of the draw pile, `drawn` cards drawn into the hand,
 * `discarded` cards gone into the discard pile, `recalled` a card back out of it into the hand,
 * `shuffled` the discard pile shuffled into the draw pile, `left` a card gone from the chronicle;
 * `discarded`, `recalled` and `left` carry the places their cards came out of, each an index into
 * that pile as it stood before the change — the hand for `discarded` and `left`, the discard pile
 * for `recalled` — and none for a card that came out of no pile. `turn` is the turn ticked,
 * `rolled` the timeline's next due turn rolled, `dealt` a deal dealt behind the ones standing,
 * `taken` the deal standing taken, `ended` the chronicle's ending set, and `runtime-error` a content
 * defect met in play, followed through where nothing could move.
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
 * it either way. `played` is a card played, `refused` a command the rules turned down, `assign` a
 * population put on a tile, taken off one, or both, `claim` a tile bought with culture, `strike` one
 * hazard in hand striking, `income` the tiles worked yielding, `grow` the food stock spent on one
 * more population, `turn` the turn ticked and the units refreshed, `enemy-phase` the enemies' half of
 * the turn, `capstone-landing` the capstone's turn come, `capstone-continued` its second script on a
 * turn after, `deal` what the timeline offers on a due turn, `answer` an answer taken, `reward` a
 * reward taken, `attack` one unit's attack, and `camp-capture` one camp taken by the unit standing on
 * it.
 */
export type Group = {
  readonly kind: 'group';
  readonly chronicle: Chronicle;
  readonly stages: readonly Stage[];
} & GroupHead;

/** What a group is named and carries, before the stages it holds. */
type GroupHead =
  | { readonly name: PlainGroup }
  | { readonly name: 'strike'; readonly card: CardId }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'camp-capture'; readonly tile: TileCoords };

/** The one step a command resolves as, a change or a group, each carrying the chronicle it leaves. */
export type Stage = Change | Group;

/** The changes that carry nothing but the chronicle they leave. */
type PlainChange =
  | 'laid'
  | 'population'
  | 'drawn'
  | 'shuffled'
  | 'turn'
  | 'rolled'
  | 'dealt'
  | 'taken'
  | 'ended'
  | 'runtime-error';

type PlacedChange = 'discarded' | 'recalled' | 'left';

/** The changes that carry the tile they moved a row on. */
type TiledChange =
  | 'enter'
  | 'damaged'
  | 'killed'
  | 'refreshed'
  | 'action-spent'
  | 'retiled'
  | 'charted'
  | 'held'
  | 'settled'
  | 'assigned';

/** The groups that carry nothing but the stages they hold and the chronicle they leave. */
type PlainGroup =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
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
 * A landing that made the one change: the one place a change joins what a command resolves as.
 * Where it leaves a standing city at no population the city falls on it, an `ended` right after it.
 */
export function landedAs(stage: Change): Landed {
  const { chronicle } = stage;
  if (!falls(chronicle)) return { stages: [stage], chronicle };
  const ended = change('ended', fall(chronicle, 'population'));
  return { stages: [stage, ended], chronicle: ended.chronicle };
}

/** Whether the city falls for its population on this chronicle: it stands at none and has not ended. */
export function falls(chronicle: Chronicle): boolean {
  return (
    chronicle.ending === undefined && chronicle.city !== undefined && chronicle.population <= 0
  );
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
