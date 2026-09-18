import type { TileCoords } from './map';
import type { Chronicle } from './state';

/**
 * A step that carries nothing but the chronicle it left. `played` is the card gone from the hand
 * with its cost paid, `refused` is the command the rules turned down, `assign` is one population put
 * on a tile, taken off one, or taken off one and put on another, `claim` is a tile bought with
 * culture and taken inside the border, `grow` is the food stock spent on one more population,
 * `turn` is the tick, where every unit's move points and action are refreshed, `capstone` is the
 * capstone's turn come with its timeline rolled on and nothing of it landed yet, `deal` is what the
 * timeline offers on a due turn, `no-deal` is a due turn dealing nothing and the next deal rolled
 * from it, `answer` is the answer taken with the deal popped and its cost paid and nothing of it
 * landed yet, `reward` is the reward taken laid in the discard pile, `strike` is every hazard the
 * hand still holds striking, `capture` is the city falling to an enemy that stood on its tile, and
 * `victory` is the capstone passed at the end of a turn.
 */
export type PlainStage =
  | 'played'
  | 'refused'
  | 'assign'
  | 'claim'
  | 'strike'
  | 'discard'
  | 'income'
  | 'grow'
  | 'capture'
  | 'victory'
  | 'turn'
  | 'capstone'
  | 'deal'
  | 'no-deal'
  | 'answer'
  | 'reward'
  | 'draw'
  | 'shuffle';

/**
 * One change a landing makes. `laid` is a card laid on top of the draw pile, `gained` is resources
 * into the city's stock, `population-lost` is the city one population fewer with the tile it worked
 * unassigned, `runtime-error` is a landing followed through where the content should never have
 * called it and nothing changed; `enter` is one unit entering on the tile by anything but a card play, `retiled` is the
 * tile's layers changed, `charted` is the tile charted as it stands on this stage, and `damaged` is
 * the unit standing on the tile hurt or killed by no attacker.
 */
export type LandingStage = { readonly chronicle: Chronicle } & (
  | { readonly name: 'laid' | 'gained' | 'population-lost' | 'runtime-error' }
  | { readonly name: 'enter' | 'retiled' | 'charted' | 'damaged'; readonly tile: TileCoords }
);

/**
 * The shape every command resolves as: one step, and the chronicle it leaves behind. An `attack` is
 * one unit's attack, the player's by hand or an enemy's in the enemy phase, a `move` is one unit
 * crossing, the player's or the enemy phase's alike, and a `camp-capture` is one camp taken by the
 * unit standing on it; each names the tiles it happened between or on, because what the chronicle
 * after the step cannot say is carried on the step itself.
 */
export type Stage =
  | LandingStage
  | ({ readonly chronicle: Chronicle } & (
      | { readonly name: PlainStage }
      | { readonly name: 'attack'; readonly attacker: TileCoords; readonly target: TileCoords }
      | { readonly name: 'move'; readonly from: TileCoords; readonly to: TileCoords }
      | { readonly name: 'camp-capture'; readonly tile: TileCoords }
    ));

/**
 * What a landing answers: one stage per change it made, in the order it made them, and the chronicle
 * it leaves — the last stage's, or the very chronicle it was handed where it raised none. A draw of
 * the generator rides on the stage it drew for, so a landing that raised nothing drew nothing.
 */
export type Landed = { readonly stages: readonly LandingStage[]; readonly chronicle: Chronicle };

/** A landing that changed nothing. */
export function unchanged(chronicle: Chronicle): Landed {
  return { stages: [], chronicle };
}

/** A landing that made the one change the stage stands for. */
export function landedAs(stage: LandingStage): Landed {
  return { stages: [stage], chronicle: stage.chronicle };
}

/** One landing and then another on the chronicle the first left, their stages in that order. */
export function followed(first: Landed, next: (chronicle: Chronicle) => Landed): Landed {
  const second = next(first.chronicle);
  return { stages: [...first.stages, ...second.stages], chronicle: second.chronicle };
}
