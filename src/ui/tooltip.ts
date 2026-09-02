import type Phaser from 'phaser';
import { addText, DESIGN_WIDTH, drawBubble, MARGIN, type Surface, UI_FONT } from './design-space';

/** The clear water between a tooltip and what it points at; its tail crosses most of that. */
const STANDOFF = 8;

/** Over every surface a hover can be raised from, under the overlay. */
const DEPTH = 30;

/** How long the pointer rests still on a source before its tooltip appears. */
const REST_MS = 500;

/** How long after a tooltip goes down a move straight onto another source still shows at once. */
const HANDOVER_MS = 120;

/** The travel a rest tolerates, in design pixels: less than this and the hand is holding still. */
const JITTER = 3;

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
  /**
   * Stands beside what was hovered, level with `y`, its tail pointing horizontally back at it. The
   * bubble goes where the box is, off the table included; only which side it takes reads the frame.
   */
  beside(message: string, box: Beside): void;
  /**
   * Stands the bubble a `beside` raised beside its box again, wherever that box has moved to; one
   * already up moves at once, one still waiting out its rest comes up at the new box. Does nothing
   * when what stands came from anywhere else.
   */
  restand(box: Beside): void;
  hide(): void;
};

/**
 * The one bubble every hover on the table raises, under what was hovered or beside it — one per
 * scene, so the hand-over holds between any two sources. It waits for the pointer to rest: a hover
 * crossed on the way somewhere else raises nothing, and only a hover taken straight off the bubble
 * skips the wait.
 */
export function createTooltip(scene: Phaser.Scene, on: Surface): Tooltip {
  const bubble = scene.add.graphics();
  const label = addText(scene, 10, 7, '', STYLE);
  const tooltip = scene.add
    .container(0, 0, [bubble, label])
    .setDepth(DEPTH)
    .setName('tooltip')
    .setVisible(false);

  const measure = (message: string): { width: number; height: number } => {
    label.setText(message);
    return { width: label.width + 20, height: label.height + 14 };
  };

  let resting: Phaser.Time.TimerEvent | undefined;
  let paint: (() => void) | undefined;
  /** How to paint what a `beside` last asked for, at whatever box it is asked for again. */
  let standing: ((box: Beside) => void) | undefined;
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

  const paintBeside = (message: string, box: Beside): void => {
    const { width, height } = measure(message);
    const fitsRight = box.right + STANDOFF + width <= DESIGN_WIDTH - MARGIN;
    const fitsLeft = box.left - STANDOFF - width >= MARGIN;
    const onRight = box.prefer === 'right' ? fitsRight || !fitsLeft : !fitsLeft && fitsRight;

    const x = onRight ? box.right + STANDOFF : box.left - STANDOFF - width;
    drawBubble(bubble, width, height, { edge: onRight ? 'left' : 'right', at: height / 2 });
    tooltip.setPosition(x, box.y - height / 2).setVisible(true);
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
      standing = undefined;
      raise(() => {
        const { width, height } = measure(message);
        const x = Math.min(left, DESIGN_WIDTH - MARGIN - width);
        drawBubble(bubble, width, height, { edge: 'top', at: tip - x });
        tooltip.setPosition(x, top).setVisible(true);
      });
    },

    beside(message: string, box: Beside): void {
      standing = (moved) => paintBeside(message, moved);
      raise(() => paintBeside(message, box));
    },

    restand(box: Beside): void {
      const again = standing;
      if (again === undefined) return;
      paint = () => again(box);
      if (tooltip.visible) paint();
    },

    hide(): void {
      standing = undefined;
      drop();
      if (tooltip.visible) wentDown = scene.time.now;
      tooltip.setVisible(false);
    },
  };
}
