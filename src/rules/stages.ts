import type { TileCoords } from './map';
import type { CardId, Chronicle } from './state';

/**
 * One row of the chronicle moved, and the chronicle it leaves. On a unit: `enter` is one unit
 * entering on the tile, `move` one unit crossing, `damaged` the unit standing on the tile hurt by no
 * attacker, `killed` it gone at nought health or off a terrain it cannot stand on, `refreshed` its
 * move points brought back up, `action-spent` one of its action spent. On a tile: `retiled` is its
 * layers changed, `charted` it charted as it stands on this change, `held` its holder changed,
 * `settled` the city standing on it. `stock` is the city's stock moved, `population` its count, and
 * `assigned` a tile worked or left. On the piles: `laid` is a card laid on top of the draw pile,
 * `drawn` cards drawn into the hand, `discarded` cards gone into the discard pile, `recalled` a card
 * back out of it into the hand, `shuffled` the discard pile shuffled into the draw pile, `left` a
 * card gone from the chronicle. `rolled` is the timeline's next due turn rolled, `ended` the
 * chronicle's ending set, and `runtime-error` a landing followed through where the content should
 * never have called it and nothing moved.
 */
export type Change = { readonly kind: 'change'; readonly chronicle: Chronicle } & (
  | { readonly name: PlainChange }
  | { readonly name: TiledChange; readonly tile: TileCoords }
  | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
);

/**
 * A name for why, over the stages it holds, and the chronicle it leaves: its last stage's, or the one
 * it was handed or left where it holds none. `played` is a card played, `refused` a command the rules
 * turned down, `assign` a population put on a tile, taken off one, or both, `claim` a tile bought
 * with culture, `strike` one hazard in hand striking, `income` the tiles worked yielding, `grow` the
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
  | { readonly name: 'strike'; readonly card: CardId }
  | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
  | { readonly name: 'camp-capture'; readonly tile: TileCoords }
);

/** The one step a command resolves as, a change or a group, each carrying the chronicle it leaves. */
export type Stage = Change | Group;

/** The changes that carry nothing but the chronicle they leave. */
type PlainChange =
  | 'laid'
  | 'stock'
  | 'population'
  | 'discarded'
  | 'drawn'
  | 'recalled'
  | 'shuffled'
  | 'left'
  | 'rolled'
  | 'ended'
  | 'runtime-error';

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
  | 'capstone'
  | 'deal'
  | 'answer'
  | 'reward';

export function change(name: PlainChange, chronicle: Chronicle): Change {
  return { kind: 'change', name, chronicle };
}

export function changeOn(name: TiledChange, tile: TileCoords, chronicle: Chronicle): Change {
  return { kind: 'change', name, tile, chronicle };
}

export function holdingNothing(name: PlainGroup, chronicle: Chronicle): Group {
  return { kind: 'group', name, chronicle, stages: [] };
}

/** A group over what a landing raised, leaving the chronicle the landing left. */
export function grouped(name: PlainGroup, landing: Landed): Group {
  return { kind: 'group', name, chronicle: landing.chronicle, stages: landing.stages };
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
