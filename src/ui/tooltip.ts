import type Phaser from 'phaser';
import { addText, DESIGN_WIDTH, drawBubble, MARGIN, type Surface, UI_FONT } from './design-space';
import { css, LOOK } from './look';

/** The clear water between a tooltip and what it points at; its tail crosses most of that. */
const STANDOFF = 8;

/** How long the pointer rests still on a source before its tooltip appears. */
const REST_MS = 500;

/** How long after a tooltip goes down a move straight onto another source still shows at once. */
const HANDOVER_MS = 120;

/** The travel a rest tolerates, in design pixels: less than this and the hand is holding still. */
const JITTER = 3;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.ink) };

export type Tooltip = {
  /**
   * Hangs under what was hovered, held inside the frame: `left` where the bubble wants its left
   * edge, `tip` the x its tail points up at.
   */
  under(message: string, left: number, tip: number, top: number): void;
  /**
   * Stands to the right of `x`, level with `y`, its tail pointing left back at them. The bubble
   * goes wherever they are, off the frame included.
   */
  beside(message: string, x: number, y: number): void;
  hide(): void;
};

/**
 * The one bubble every hover on a surface raises, under what was hovered or beside it — one per
 * surface, so the hand-over holds between any two sources on it, and a bubble is carried by the
 * camera that painted what raised it. Every coordinate is that surface's own, and the bubble keeps
 * the size it was laid out at however far the surface has zoomed. It waits for the pointer to rest:
 * a hover crossed on the way somewhere else raises nothing, and only a hover taken straight off the
 * bubble skips the wait.
 */
export function createTooltip(scene: Phaser.Scene, on: Surface): Tooltip {
  const bubble = scene.add.graphics();
  const label = addText(scene, 10, 7, '', STYLE);
  const tooltip = scene.add
    .container(0, 0, [bubble, label])
    .setName(`tooltip-${scene.scene.key}`)
    .setVisible(false);
  on.layer.add(tooltip);

  const measure = (message: string): { width: number; height: number } => {
    label.setText(message);
    return { width: label.width + 20, height: label.height + 14 };
  };

  let resting: Phaser.Time.TimerEvent | undefined;
  let paint: (() => void) | undefined;
  let restX = 0;
  let restY = 0;
  let wentDown = Number.NEGATIVE_INFINITY;

  const drop = (): void => {
    if (resting !== undefined) scene.time.removeEvent(resting);
    resting = undefined;
  };

  const rest = (): void => {
    drop();
    resting = scene.time.delayedCall(REST_MS, () => {
      resting = undefined;
      paint?.();
    });
  };

  /** A hover asks for its bubble here; whether it gets one now, later or never is decided here. */
  const raise = (draw: () => void): void => {
    paint = draw;
    if (scene.time.now - wentDown <= HANDOVER_MS) {
      drop();
      draw();
      return;
    }
    const pointer = scene.input.activePointer;
    const at = on.at(pointer.x, pointer.y);
    restX = at.x;
    restY = at.y;
    rest();
  };

  const hide = (): void => {
    drop();
    if (tooltip.visible) wentDown = scene.time.now;
    tooltip.setVisible(false);
  };

  const paintBeside = (message: string, x: number, y: number): void => {
    const { width, height } = measure(message);
    const unit = on.unit();
    drawBubble(bubble, width, height, { edge: 'left', at: height / 2 });
    tooltip
      .setScale(unit)
      .setPosition(x + STANDOFF * unit, y - (height / 2) * unit)
      .setVisible(true);
  };

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (resting === undefined) return;
    const at = on.at(pointer.x, pointer.y);
    if (Math.abs(at.x - restX) < JITTER && Math.abs(at.y - restY) < JITTER) return;
    restX = at.x;
    restY = at.y;
    rest();
  });

  return {
    under(message: string, left: number, tip: number, top: number): void {
      raise(() => {
        const { width, height } = measure(message);
        const x = Math.min(left, DESIGN_WIDTH - MARGIN - width);
        drawBubble(bubble, width, height, { edge: 'top', at: tip - x });
        tooltip.setScale(on.unit()).setPosition(x, top).setVisible(true);
      });
    },

    beside(message: string, x: number, y: number): void {
      raise(() => paintBeside(message, x, y));
    },

    hide,
  };
}
