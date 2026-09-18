import type { TileCoords } from './map';
import type { Chronicle } from './state';

/**
 * One row of the chronicle moved, and the chronicle it leaves. `laid` is a card laid on top of the
 * draw pile, `stock` is the city's stock moved, `discarded` is cards gone into the discard pile,
 * `drawn` is cards drawn into the hand, `shuffled` is the discard pile shuffled into the draw pile,
 * `rolled` is the timeline's next due turn rolled, `ended` is the chronicle's ending set,
 * `population-lost` is the city one population fewer with the tile it worked unassigned, and
 * `runtime-error` is a landing followed through where the content should never have called it and
 * nothing moved. `enter` is one unit entering on the tile, `retiled` is the tile's layers changed,
 * `charted` is the tile charted as it stands on this change, `damaged` is the unit standing on the
 * tile hurt or killed by no attacker, and `move` is one unit crossing.
 */
export type Change = { readonly kind: 'change'; readonly chronicle: Chronicle } & (
  | { readonly name: PlainChange }
  | { readonly name: 'enter' | 'retiled' | 'charted' | 'damaged'; readonly tile: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * A name for why, over the stages it holds, and the chronicle it leaves: its last stage's, or the one
 * it was handed or left where it holds none. `played` is a card played, `refused` a command the rules
 * turned down, `assign` a population put on a tile, taken off one, or both, `claim` a tile bought
 * with culture, `strike` the hazards in hand striking, `income` the tiles worked yielding, `grow` the
 * food stock spent on one more population, `turn` the tick, `capstone` the capstone's turn come,
 * `deal` what the timeline offers on a due turn, `answer` an answer taken, `reward` a reward taken,
 * `attack` one unit's attack, and `camp-capture` one camp taken by the unit standing on it.
 */
export type Group = {
  readonly kind: 'group';
  readonly chronicle: Chronicle;
  readonly stages: readonly Stage[];
} & (
  | { readonly name: PlainGroup }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'camp-capture'; readonly tile: TileCoords }
);

/** The one step a command resolves as, a change or a group, each carrying the chronicle it leaves. */
export type Stage = Change | Group;

/** The changes that carry nothing but the chronicle they leave. */
type PlainChange =
  | 'laid'
  | 'stock'
  | 'discarded'
  | 'drawn'
  | 'shuffled'
  | 'rolled'
  | 'ended'
  | 'population-lost'
  | 'runtime-error';

/** The groups that carry nothing but the stages they hold and the chronicle they leave. */
type PlainGroup =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
  | 'strike'
  | 'income'
  | 'grow'
  | 'turn'
  | 'capstone'
  | 'deal'
  | 'answer'
  | 'reward';

export function change(name: PlainChange, chronicle: Chronicle): Change {
  return { kind: 'change', name, chronicle };
}

export function holdingNothing(name: PlainGroup, chronicle: Chronicle): Group {
  return { kind: 'group', name, chronicle, stages: [] };
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
 * What a landing answers: one change per row it moved, in the order it moved them, and the chronicle
 * it leaves — the last change's, or the very chronicle it was handed where it raised none. A draw of
 * the generator rides on the change it drew for, so a landing that raised nothing drew nothing.
 */
export type Landed = { readonly stages: readonly Change[]; readonly chronicle: Chronicle };

/** A landing that changed nothing. */
export function unchanged(chronicle: Chronicle): Landed {
  return { stages: [], chronicle };
}

/** A landing that made the one change. */
export function landedAs(stage: Change): Landed {
  return { stages: [stage], chronicle: stage.chronicle };
}

/** One landing and then another on the chronicle the first left, their changes in that order. */
export function followed(first: Landed, next: (chronicle: Chronicle) => Landed): Landed {
  const second = next(first.chronicle);
  return { stages: [...first.stages, ...second.stages], chronicle: second.chronicle };
}
