import type Phaser from 'phaser';
import type { AimedCard } from '../rules/cards';
import type { CardId } from '../rules/state';
import { AIM_POINT_REACH, CARD_BASELINE, CARD_EDGE, CARD_HEIGHT, CARD_LIFT } from './card-face';
import { ACCENT, addText, css, DESIGN_WIDTH, type Surface, UI_FONT } from './design-space';
import { text } from './text';

/** Over the hand's lifted cards, under the note a refusal raises. */
const DEPTH = 45;

/** The clear water between the line and the point of the card being aimed under it. */
const STANDOFF = 8;

/** The line's bottom edge: clear of the point on a card lifted out of the hand. */
const BOTTOM = CARD_BASELINE - CARD_HEIGHT - CARD_LIFT - AIM_POINT_REACH - STANDOFF;

/** The slab the sentence is written on, and how far the sentence stands off its edges. */
const FILL = 0x232833;
const PAD_X = 10;
const PAD_Y = 7;

const STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  fontStyle: 'bold',
  color: css(ACCENT),
};

export type AimLine = {
  /** Says what the card being aimed is played at, over the hand, until it is taken down. */
  show(id: CardId, aim: AimedCard['aim']): void;
  hide(): void;
};

/**
 * The one line over the hand: what the card being aimed is played at. It stands and falls with the
 * point that card wears, so one card being aimed is one sentence, and none standing is none.
 */
export function createAimLine(scene: Phaser.Scene, on: Surface): AimLine {
  let line: Phaser.GameObjects.Container | undefined;

  const hide = (): void => {
    line?.destroy();
    line = undefined;
  };

  return {
    show(id: CardId, aim: AimedCard['aim']): void {
      hide();
      const label = addText(scene, PAD_X, PAD_Y, sentence(id, aim), STYLE);
      const width = label.width + 2 * PAD_X;
      const height = label.height + 2 * PAD_Y;

      const slab = scene.add.graphics();
      slab.fillStyle(FILL);
      slab.fillRect(0, 0, width, height);
      slab.lineStyle(1, CARD_EDGE);
      slab.strokeRect(0.5, 0.5, width - 1, height - 1);

      line = scene.add
        .container((DESIGN_WIDTH - width) / 2, BOTTOM - height, [slab, label])
        .setDepth(DEPTH)
        .setName('aim-line');
      on.layer.add(line);
    },

    hide,
  };
}

/** The sentence one aim is said in, the card named by its own name. */
function sentence(id: CardId, aim: AimedCard['aim']): string {
  const card = text(`card.${id}`);
  switch (aim) {
    case 'tile':
      return text('aim.tile', { card });
    case 'unit':
      return text('aim.unit', { card });
  }
}
