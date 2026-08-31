import type Phaser from 'phaser';
import type { Chronicle } from '../rules/chronicle';
import { CARD_HEIGHT, CARD_WIDTH, createCardBack, createCardFace } from './card-face';
import { ACCENT, addText, DESIGN_HEIGHT, DESIGN_WIDTH, MARGIN, UI_FONT } from './design-space';

const EMPTY_EDGE = 0x4a5058;

export type Piles = { render(chronicle: Chronicle): void };

/** The draw pile face down on the left, the discard pile face up and worn on the right. */
export function createPiles(scene: Phaser.Scene): Piles {
  const drawn = createPile(scene, MARGIN + CARD_WIDTH / 2);
  const discarded = createPile(scene, DESIGN_WIDTH - MARGIN - CARD_WIDTH / 2);

  return {
    render(chronicle: Chronicle): void {
      drawn.show(createCardBack(scene), chronicle.drawPile.length);

      const top = chronicle.discardPile[chronicle.discardPile.length - 1];
      discarded.show(
        top === undefined ? emptySlot(scene) : createCardFace(scene, top, [], true).root,
        chronicle.discardPile.length,
      );
    },
  };
}

type Pile = { show(card: Phaser.GameObjects.Container, count: number): void };

function createPile(scene: Phaser.Scene, x: number): Pile {
  const y = DESIGN_HEIGHT - MARGIN;
  const pill = scene.add.graphics().setDepth(6);
  const count = addText(scene, 0, 0, '', {
    fontFamily: UI_FONT,
    fontSize: '15px',
    fontStyle: 'bold',
    color: '#0d1014',
  })
    .setOrigin(0.5, 0.5)
    .setDepth(7);

  let shown: Phaser.GameObjects.Container | undefined;
  return {
    show(card: Phaser.GameObjects.Container, remaining: number): void {
      shown?.destroy();
      shown = card.setPosition(x, y).setDepth(4);

      count.setText(String(remaining));
      const width = Math.max(18, count.width) + 14;
      const height = count.height + 6;
      const centre = {
        x: x + CARD_WIDTH / 2 + 10 - width / 2,
        y: y - CARD_HEIGHT - 10 + height / 2,
      };
      count.setPosition(centre.x, centre.y);
      pill.clear();
      pill.fillStyle(ACCENT);
      pill.fillRoundedRect(centre.x - width / 2, centre.y - height / 2, width, height, height / 2);
    },
  };
}

/** Where the discard pile's top card would be, before anything has been played or discarded. */
function emptySlot(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const outline = scene.add.graphics();
  outline.lineStyle(2, EMPTY_EDGE);

  const left = -CARD_WIDTH / 2;
  const right = CARD_WIDTH / 2;
  const top = -CARD_HEIGHT;
  const edges: [number, number, number, number][] = [
    [left, top, right, top],
    [right, top, right, 0],
    [right, 0, left, 0],
    [left, 0, left, top],
  ];
  for (const [x1, y1, x2, y2] of edges) dash(outline, x1, y1, x2, y2);

  return scene.add.container(0, 0, [outline]);
}

/** Dashes of six on, five off, stretched so a whole number of them spans the edge. */
function dash(
  outline: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(1, Math.round(length / 11));
  const step = length / count;
  const towards = { x: (x2 - x1) / length, y: (y2 - y1) / length };

  for (let i = 0; i < count; i++) {
    const from = i * step;
    const to = from + (step * 6) / 11;
    outline.lineBetween(
      x1 + towards.x * from,
      y1 + towards.y * from,
      x1 + towards.x * to,
      y1 + towards.y * to,
    );
  }
}
