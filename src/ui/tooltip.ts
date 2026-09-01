import type Phaser from 'phaser';
import { addText, DESIGN_WIDTH, MARGIN, PANEL_EDGE, PANEL_FILL, UI_FONT } from './design-space';

const TAIL_HEIGHT = 7;
const TAIL_HALF = 6;

/** Over every surface a hover can be raised from, under the overlay. */
const DEPTH = 30;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: '#0d1014' };

export type Tooltip = {
  /** `left` is where the bubble wants its left edge, `tip` the x its tail points up at. */
  show(message: string, left: number, tip: number, top: number): void;
  hide(): void;
};

/** The one bubble every hover on the table raises, hanging under what was hovered. */
export function createTooltip(scene: Phaser.Scene): Tooltip {
  const bubble = scene.add.graphics();
  const label = addText(scene, 10, 7, '', STYLE);
  const tooltip = scene.add.container(0, 0, [bubble, label]).setDepth(DEPTH).setVisible(false);

  return {
    show(message: string, left: number, tip: number, top: number): void {
      label.setText(message);
      const width = label.width + 20;
      const x = Math.min(left, DESIGN_WIDTH - MARGIN - width);
      drawBubble(bubble, width, label.height + 14, tip - x);
      tooltip.setPosition(x, top).setVisible(true);
    },
    hide(): void {
      tooltip.setVisible(false);
    },
  };
}

/**
 * The box and its tail as one closed path, so the fill is continuous and the stroke never crosses
 * the seam. The tail rises into the gap above the box, and stays clear of both corners.
 */
function drawBubble(
  bubble: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  at: number,
): void {
  const tip = Math.min(Math.max(at, TAIL_HALF + 4), width - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(PANEL_FILL);
  bubble.lineStyle(1, PANEL_EDGE);
  bubble.beginPath();
  bubble.moveTo(0, 0);
  bubble.lineTo(tip - TAIL_HALF, 0);
  bubble.lineTo(tip, -TAIL_HEIGHT);
  bubble.lineTo(tip + TAIL_HALF, 0);
  bubble.lineTo(width, 0);
  bubble.lineTo(width, height);
  bubble.lineTo(0, height);
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
}
