import type Phaser from 'phaser';
import { CARDS, type CardId } from '../rules/cards';
import { costOf, type Resource } from '../rules/chronicle';
import { ACCENT, addText, hexagon, UI_FONT } from './design-space';
import { RESOURCE_COLOURS } from './resource-bar';
import { text } from './text';

export const CARD_WIDTH = 130;
export const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.4);

/** Every measure inside a card is a multiple of this, so one width scales the whole face. */
const EM = CARD_WIDTH * 0.13;
const PAD = 0.55 * EM;
const RADIUS = 0.45 * EM;

const EDGE = 0x6f757d;
const KIND_INK = 0x4a5058;
const SHORT = 0xc0392b;
const BACK = 0x232833;

const PAYABLE = { face: 0xd4d7db, art: 0xb6bbc2, artEdge: 0x9aa0a8, ink: 0x0d1014 };
const SHORT_OF = { face: 0xa7abb1, art: 0x8f959c, artEdge: 0x7c828a, ink: 0x3a3f45 };

export type CardFace = {
  readonly root: Phaser.GameObjects.Container;
  arm(armed: boolean): void;
};

/**
 * A card, drawn about its own bottom centre so a container's angle fans it from that corner.
 * `short` names the costs the city cannot pay; a card with any is drawn as the one it cannot play.
 */
export function createCardFace(
  scene: Phaser.Scene,
  id: CardId,
  short: readonly Resource[],
  faded = false,
): CardFace {
  const tone = faded ? dim : (colour: number): number => colour;
  const palette = short.length > 0 ? SHORT_OF : PAYABLE;

  const left = -CARD_WIDTH / 2 + 1 + PAD;
  const right = CARD_WIDTH / 2 - 1 - PAD;
  const top = -CARD_HEIGHT + 1 + PAD;

  const root = scene.add.container(0, 0);
  const paper = scene.add.graphics();
  paper.fillStyle(tone(palette.face));
  paper.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT, RADIUS);
  paper.lineStyle(1, tone(EDGE));
  paper.strokeRoundedRect(
    -CARD_WIDTH / 2 + 0.5,
    -CARD_HEIGHT + 0.5,
    CARD_WIDTH - 1,
    CARD_HEIGHT - 1,
    RADIUS,
  );
  root.add(paper);

  const middle = top + 0.55 * EM;
  let x = left;
  for (const { resource, amount } of costOf(id)) {
    const lacking = short.includes(resource);
    const chip = scene.add
      .rectangle(x + 0.4 * EM, middle, 0.8 * EM, 0.8 * EM, tone(RESOURCE_COLOURS[resource]))
      .setAngle(45);
    root.add(chip);
    if (lacking) {
      const ring = scene.add
        .rectangle(x + 0.4 * EM, middle, 0.8 * EM + 6, 0.8 * EM + 6)
        .setStrokeStyle(2, tone(SHORT))
        .setAngle(45);
      root.add(ring);
    }
    const value = addText(scene, x + 1.3 * EM, middle, String(amount), {
      fontFamily: UI_FONT,
      fontSize: `${EM}px`,
      fontStyle: 'bold',
      color: css(tone(lacking ? SHORT : palette.ink)),
    }).setOrigin(0, 0.5);
    root.add(value);
    x = value.x + value.width + 0.35 * EM;
  }

  const name = addText(scene, 0, top + 1.45 * EM, text(`card.${id}`), {
    fontFamily: UI_FONT,
    fontSize: `${1.05 * EM}px`,
    fontStyle: 'bold',
    color: css(tone(palette.ink)),
  }).setOrigin(0.5, 0);

  const kind = addText(scene, 0, -1 - PAD, text(`kind.${CARDS[id].kind}`).toUpperCase(), {
    fontFamily: UI_FONT,
    fontSize: `${0.65 * EM}px`,
    color: css(tone(KIND_INK)),
    letterSpacing: 0.14 * 0.65 * EM,
  }).setOrigin(0.5, 1);

  const artTop = name.y + name.height + 0.5 * EM;
  const artHeight = kind.y - kind.height - 0.4 * EM - artTop;
  const art = scene.add.graphics();
  art.fillStyle(tone(palette.art));
  art.fillRoundedRect(left, artTop, right - left, artHeight, 0.2 * EM);
  art.lineStyle(1, tone(palette.artEdge));
  art.strokeRoundedRect(left + 0.5, artTop + 0.5, right - left - 1, artHeight - 1, 0.2 * EM);

  const armed = scene.add.graphics().setVisible(false);
  armed.lineStyle(3, ACCENT);
  armed.strokeRoundedRect(
    -CARD_WIDTH / 2 - 3.5,
    -CARD_HEIGHT - 3.5,
    CARD_WIDTH + 7,
    CARD_HEIGHT + 7,
    RADIUS + 3.5,
  );

  root.add([art, name, kind, armed]);
  return {
    root,
    arm(on: boolean): void {
      armed.setVisible(on);
    },
  };
}

/** The face-down card the draw pile shows, about its own bottom centre. */
export function createCardBack(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const paper = scene.add.graphics();
  paper.fillStyle(BACK);
  paper.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT, RADIUS);
  paper.lineStyle(1, EDGE);
  paper.strokeRoundedRect(
    -CARD_WIDTH / 2 + 0.5,
    -CARD_HEIGHT + 0.5,
    CARD_WIDTH - 1,
    CARD_HEIGHT - 1,
    RADIUS,
  );

  const emblem = scene.add
    .polygon(0, -CARD_HEIGHT / 2, hexagon(CARD_WIDTH * 0.28 - 3), 0, 0)
    .setStrokeStyle(3, ACCENT);

  return scene.add.container(0, 0, [paper, emblem]);
}

function css(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

/** What the discard pile's top card is worn down to: CSS `grayscale(0.35) brightness(0.75)`. */
function dim(colour: number): number {
  const red = (colour >> 16) & 0xff;
  const green = (colour >> 8) & 0xff;
  const blue = colour & 0xff;
  const grey = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const worn = (channel: number): number => Math.round((channel * 0.65 + grey * 0.35) * 0.75);
  return (worn(red) << 16) | (worn(green) << 8) | worn(blue);
}
