import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL } from '../rules/state';
import { createCardFace, drawCardSurface, heightOf } from './card-face';
import type { CollectionStack } from './collection-layout';
import { addText, type Box, ownBoxOf, UI_FONT } from './design-space';
import { cardFaceAtStart } from './face';
import { css, LOOK, overPage } from './look';
import type { Filled, Held } from './panel';
import { chipAt } from './resource-bar';
import { type Answers, answersOf, type Inspecting } from './stack';
import { text } from './text';

/** How wide a card of the collection screen stands. */
export const CARD_WIDTH = 110;
const UNDER_MOST = 3;
const UNDER_STEP = 4;
const STACK_WIDTH = CARD_WIDTH + UNDER_MOST * UNDER_STEP;
const STACKS_APART = 10;
const LINES_APART = 18;
const COPIES_GAP = 6;
const LINE_HEIGHT = 22;
const CHIP_TO_PRICE = 11;
const BUY_PAD = 3;

const COPIES_STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.deckCounts) };
const PRICE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '13px',
  fontStyle: 'bold',
  color: css(LOOK.ink),
};
const GREYED_PRICE_STYLE = { ...PRICE_STYLE, color: css(LOOK.greyedInk) };

/** What a stack reads under it, and whether it stands dimmed. */
export type Reading = { readonly reads: string; readonly dimmed: boolean };

/** What a cell of a line draws, the things in it that answer, and where it ends. */
export type Drawn = {
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  readonly held: readonly Held[];
  readonly bottom: number;
};

/** A cell of a line, drawn from the left and the top handed. */
export type Cell = (at: { readonly left: number; readonly top: number }) => Drawn;

/** A colour as it stands on a dimmed stack: a container's alpha fades each child alone, so the cards under the face would show through it. */
function dimmed(colour: number): number {
  return overPage(colour, LOOK.whollyHeld);
}

/** What the button of a price answers: no rest and no right click. */
const ANSWERS_NOTHING: Answers = {
  point() {},
  rests() {
    return false;
  },
  inspect() {},
};

/** How wide this many stacks stand side by side. */
export function spanOf(across: number): number {
  return across * STACK_WIDTH + (across - 1) * STACKS_APART;
}

/** The cells `across` to a line from the left and the top handed, each line under the foot of the one before. */
export function linesOf(
  cells: readonly Cell[],
  { left, top, across }: { left: number; top: number; across: number },
): Filled {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const held: Held[] = [];
  let lineTop = top;
  let foot = top;
  for (let from = 0; from < cells.length; from += across) {
    for (const [column, cell] of cells.slice(from, from + across).entries()) {
      const drawn = cell({ left: left + column * (STACK_WIDTH + STACKS_APART), top: lineTop });
      parts.push(...drawn.parts);
      held.push(...drawn.held);
      foot = Math.max(foot, drawn.bottom);
    }
    lineTop = foot + LINES_APART;
  }
  return { parts, held, foot };
}

/** A stack laid: its container, its face's answers where the face stands, its reading line, and its foot. */
export type LaidStack = {
  /** What a piece laid on the stack joins. */
  readonly root: Phaser.GameObjects.Container;
  readonly face: Held;
  /** The reading line's top and middle, and the stack's right end. */
  readonly line: { readonly top: number; readonly middle: number; readonly right: number };
  readonly bottom: number;
};

/**
 * One stack, its parts named from `name`: a card under its face for each copy past the first, three
 * at most, stepped right and down, and its reading under them.
 */
export function stackOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  {
    stack: { id, copies },
    left,
    top,
    name,
    reading,
    inspecting,
  }: {
    readonly stack: CollectionStack;
    readonly left: number;
    readonly top: number;
    readonly name: string;
    readonly reading: Reading;
    readonly inspecting: Inspecting;
  },
): LaidStack {
  const tone = reading.dimmed ? dimmed : (colour: number): number => colour;
  const height = heightOf(CARD_WIDTH);
  const under = Math.min(copies - 1, UNDER_MOST);
  const unders = Array.from({ length: under }, (_, at) => {
    const step = (under - at) * UNDER_STEP;
    const surface = scene.add.graphics();
    drawCardSurface(surface, left + step, top + step, {
      width: CARD_WIDTH,
      face: tone(LOOK.affordableCard.face),
      edge: tone(LOOK.cardEdge),
    });
    return surface;
  });
  const shown = cardFaceAtStart(catalogue, id);
  const card = createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH, tone });
  const face = card.root
    .setPosition(left + CARD_WIDTH / 2, top + height)
    .setName(`${name}-card-${id}`)
    .setData('card', id);
  const lineTop = top + height + UNDER_MOST * UNDER_STEP + COPIES_GAP;
  const middle = lineTop + LINE_HEIGHT / 2;
  const count = addText(scene, left, middle, reading.reads, COPIES_STYLE)
    .setOrigin(0, 0.5)
    .setName(`${name}-card-${id}-copies`);
  return {
    root: scene.add
      .container(0, 0, [...unders, face, count])
      .setName(`${name}-stack-${id}`)
      .setData('dimmed', reading.dimmed),
    face: {
      box: { x: left, y: top, width: CARD_WIDTH, height },
      answers: answersOf(card, shown, inspecting),
    },
    line: { top: lineTop, middle, right: left + STACK_WIDTH },
    bottom: lineTop + LINE_HEIGHT,
  };
}

/**
 * The price as a button on the stack's reading line at its right end, joining the stack, its parts
 * named from `name`: greyed where no buy is handed, and a press on it runs the buy.
 */
export function priceButtonOf(
  scene: Phaser.Scene,
  { root, line, bottom }: LaidStack,
  {
    name,
    price,
    buy,
  }: { readonly name: string; readonly price: number; readonly buy: (() => void) | undefined },
): Held {
  const priced = addText(
    scene,
    0,
    line.middle,
    text('collection.price', { price }),
    buy === undefined ? GREYED_PRICE_STYLE : PRICE_STYLE,
  )
    .setOrigin(1, 0.5)
    .setName(`${name}-price`);
  const unplaced = ownBoxOf(priced);
  priced.setX(line.right - BUY_PAD - (unplaced.x + unplaced.width));
  const chip = chipAt(
    scene,
    { x: ownBoxOf(priced).x - CHIP_TO_PRICE, y: line.middle },
    buy === undefined ? LOOK.greyedInk : LOOK.influence,
  ).setName(`${name}-price-chip`);
  const buyLeft = chip.getBounds().left - BUY_PAD;
  const button: Box = {
    x: buyLeft,
    y: line.top,
    width: line.right - buyLeft,
    height: bottom - line.top,
  };
  const ground = scene.add
    .rectangle(
      button.x,
      button.y,
      button.width,
      button.height,
      buy === undefined ? LOOK.greyedFill : LOOK.panelFill,
    )
    .setOrigin(0, 0)
    .setName(`${name}-buy`);
  root.add([ground, chip, priced]);
  return { box: button, answers: ANSWERS_NOTHING, press: buy };
}
