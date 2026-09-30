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
const CHIP_TO_PRICE = 11;
const BUY_HEIGHT = 22;
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

/** A card's price, and what a press on it buys, where it buys. */
export type Priced = { readonly price: number; readonly buy: (() => void) | undefined };

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

/**
 * One stack from the left and the top handed, its parts named from `name`: a card under its face for
 * each copy past the first, three at most, stepped right and down, its reading under them, and where
 * it is priced its price at the line's right as a button that buys, greyed where no buy is handed.
 */
export function stackOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  { id, copies }: CollectionStack,
  { left, top }: { left: number; top: number },
  name: string,
  reading: Reading,
  priced: Priced | undefined,
  inspecting: Inspecting,
  press: (() => void) | undefined,
  lands: Box | undefined,
): Drawn {
  const tone = reading.dimmed ? dimmed : (colour: number): number => colour;
  const height = heightOf(CARD_WIDTH);
  const place = { x: left + CARD_WIDTH / 2, y: top + height };
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
    .setPosition(place.x, place.y)
    .setName(`${name}-card-${id}`)
    .setData('card', id);
  const lineTop = top + height + UNDER_MOST * UNDER_STEP + COPIES_GAP;
  const middle = lineTop + BUY_HEIGHT / 2;
  const count = addText(scene, left, middle, reading.reads, COPIES_STYLE)
    .setOrigin(0, 0.5)
    .setName(`${name}-card-${id}-copies`);
  const faceHeld: Held = {
    box: { x: left, y: top, width: CARD_WIDTH, height },
    answers: answersOf(card, shown, inspecting),
    press,
    carry:
      lands === undefined
        ? undefined
        : {
            copy: () =>
              createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH })
                .root.setPosition(place.x, place.y)
                .setName('carried-card')
                .setData('card', id),
            lands,
          },
  };
  const root = scene.add
    .container(0, 0, [...unders, face, count])
    .setName(`${name}-stack-${id}`)
    .setData('dimmed', reading.dimmed);
  if (priced === undefined) {
    return { parts: [root], held: [faceHeld], bottom: lineTop + BUY_HEIGHT };
  }

  const { price, buy } = priced;
  const right = left + STACK_WIDTH;
  const priceText = addText(
    scene,
    0,
    middle,
    text('collection.price', { price }),
    buy === undefined ? GREYED_PRICE_STYLE : PRICE_STYLE,
  )
    .setOrigin(1, 0.5)
    .setName(`${name}-card-${id}-price`);
  const unplaced = ownBoxOf(priceText);
  priceText.setX(right - BUY_PAD - (unplaced.x + unplaced.width));
  const chip = chipAt(
    scene,
    { x: ownBoxOf(priceText).x - CHIP_TO_PRICE, y: middle },
    buy === undefined ? LOOK.greyedInk : LOOK.influence,
  ).setName(`${name}-card-${id}-price-chip`);
  const buyLeft = chip.getBounds().left - BUY_PAD;
  const button: Box = { x: buyLeft, y: lineTop, width: right - buyLeft, height: BUY_HEIGHT };
  const ground = scene.add
    .rectangle(
      button.x,
      button.y,
      button.width,
      button.height,
      buy === undefined ? LOOK.greyedFill : LOOK.panelFill,
    )
    .setOrigin(0, 0)
    .setName(`${name}-card-${id}-buy`);
  root.add([ground, chip, priceText]);
  return {
    parts: [root],
    held: [faceHeld, { box: button, answers: ANSWERS_NOTHING, press: buy }],
    bottom: button.y + button.height,
  };
}
