import type Phaser from 'phaser';
import { addText, DESIGN_HEIGHT, DESIGN_WIDTH, drawBubble, MARGIN, UI_FONT } from './design-space';

/** The clear water between a tooltip and what it points at; its tail crosses most of that. */
const STANDOFF = 8;

/** Over every surface a hover can be raised from, under the overlay. */
const DEPTH = 30;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: '#0d1014' };

/** The box a tooltip stands beside, and the side of it the bubble takes where the screen allows. */
export type Beside = {
  left: number;
  right: number;
  y: number;
  prefer: 'left' | 'right';
};

export type Tooltip = {
  /** Hangs under what was hovered: `left` where the bubble wants its left edge, `tip` the x its tail points up at. */
  under(message: string, left: number, tip: number, top: number): void;
  /** Stands beside what was hovered, level with `y`, its tail pointing horizontally back at it. */
  beside(message: string, box: Beside): void;
  hide(): void;
};

/** The one bubble every hover on the table raises, under what was hovered or beside it. */
export function createTooltip(scene: Phaser.Scene): Tooltip {
  const bubble = scene.add.graphics();
  const label = addText(scene, 10, 7, '', STYLE);
  const tooltip = scene.add.container(0, 0, [bubble, label]).setDepth(DEPTH).setVisible(false);

  const measure = (message: string): { width: number; height: number } => {
    label.setText(message);
    return { width: label.width + 20, height: label.height + 14 };
  };

  return {
    under(message: string, left: number, tip: number, top: number): void {
      const { width, height } = measure(message);
      const x = Math.min(left, DESIGN_WIDTH - MARGIN - width);
      drawBubble(bubble, width, height, { edge: 'top', at: tip - x });
      tooltip.setPosition(x, top).setVisible(true);
    },

    beside(message: string, box: Beside): void {
      const { width, height } = measure(message);
      const fitsRight = box.right + STANDOFF + width <= DESIGN_WIDTH - MARGIN;
      const fitsLeft = box.left - STANDOFF - width >= MARGIN;
      const onRight = box.prefer === 'right' ? fitsRight || !fitsLeft : !fitsLeft && fitsRight;

      const x = Math.min(
        Math.max(onRight ? box.right + STANDOFF : box.left - STANDOFF - width, MARGIN),
        DESIGN_WIDTH - MARGIN - width,
      );
      const top = Math.min(Math.max(box.y - height / 2, MARGIN), DESIGN_HEIGHT - MARGIN - height);
      drawBubble(bubble, width, height, { edge: onRight ? 'left' : 'right', at: box.y - top });
      tooltip.setPosition(x, top).setVisible(true);
    },

    hide(): void {
      tooltip.setVisible(false);
    },
  };
}
