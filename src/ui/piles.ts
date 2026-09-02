import type Phaser from 'phaser';
import { type Chronicle, NO_REFUSAL } from '../rules/chronicle';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  createCardBack,
  createCardFace,
  createEmptySlot,
} from './card-face';
import {
  ACCENT,
  addText,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  UI_FONT,
} from './design-space';
import type { PileKind } from './overlay';

export type Piles = { render(chronicle: Chronicle): void };

/** The draw pile face down on the left, the discard pile face up and worn on the right. */
export function createPiles(scene: Phaser.Scene, browse: (pile: PileKind) => void): Piles {
  const drawn = createPile(scene, 'draw-pile', MARGIN + CARD_WIDTH / 2, browse);
  const discarded = createPile(
    scene,
    'discard-pile',
    DESIGN_WIDTH - MARGIN - CARD_WIDTH / 2,
    browse,
  );

  return {
    render(chronicle: Chronicle): void {
      drawn.show(createCardBack(scene, chronicle.drawPile.length === 0), chronicle.drawPile.length);

      const top = chronicle.discardPile[chronicle.discardPile.length - 1];
      discarded.show(
        top === undefined
          ? createEmptySlot(scene)
          : createCardFace(scene, top, NO_REFUSAL, { faded: true }).root,
        chronicle.discardPile.length,
      );
    },
  };
}

type Pile = { show(card: Phaser.GameObjects.Container, count: number): void };

function createPile(
  scene: Phaser.Scene,
  pile: PileKind,
  x: number,
  browse: (pile: PileKind) => void,
): Pile {
  const y = DESIGN_HEIGHT - MARGIN;
  const pill = scene.add.graphics().setDepth(6);
  onClick(
    scene.add
      .zone(x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT)
      .setName(pile)
      .setDepth(8)
      .setInteractive({ useHandCursor: true }),
    () => browse(pile),
  );
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
