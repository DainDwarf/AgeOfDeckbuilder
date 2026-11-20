import type Phaser from 'phaser';
import { createChromePanel, PANEL_RIMS, standChromePanel } from './chrome';
import { addText, afterResize, MARGIN, type Stratum, screenSize, UI_FONT } from './design-space';
import { css, LOOK } from './look';

/** The clear water between a tooltip and what it points at. */
const STANDOFF = 8;

/** How long the pointer rests still on a source before its tooltip appears. */
export const REST_MS = 500;

/** How long after a tooltip goes down a move straight onto another source still shows at once. */
export const HANDOVER_MS = 120;

/** The travel a rest tolerates, in design pixels: less than this and the hand is holding still. */
export const JITTER = 3;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.charcoalInk) };

export type Tooltip = {
  /** Hangs under what was hovered, held inside the frame: `left` where the bubble wants its left edge. */
  under(message: string, left: number, top: number): void;
  /**
   * Stands to the right of the point `at` answers as the bubble is painted and at every `follow`,
   * level with it, the message under `title` in bold where one is handed. The bubble goes wherever
   * that is, off the frame included.
   */
  beside(message: string, at: () => { x: number; y: number }, title?: string): void;
  /** The bubble standing beside a point moved to where that point now stands; one hung under stays. */
  follow(): void;
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
export function createTooltip(scene: Phaser.Scene, on: Stratum): Tooltip {
  const bubble = createChromePanel(scene, PANEL_RIMS.plate);
  const label = addText(scene, 10, 7, '', STYLE);
  const heading = addText(scene, 10, 7, '', { ...STYLE, fontStyle: 'bold' }).setVisible(false);
  const tooltip = scene.add
    .container(0, 0, [bubble, label, heading])
    .setName(`tooltip-${scene.scene.key}`)
    .setVisible(false);
  on.layer.add(tooltip);

  const measure = (message: string, title?: string): { width: number; height: number } => {
    heading.setVisible(title !== undefined);
    if (title !== undefined) heading.setText(title);
    const over = title === undefined ? 0 : heading.height;
    label.setText(message).setY(7 + over);
    const widest = Math.max(label.width, title === undefined ? 0 : heading.width);
    const size = { width: widest + 20, height: over + label.height + 14 };
    standChromePanel(bubble, { x: 0, y: 0, ...size });
    return size;
  };

  let resting: Phaser.Time.TimerEvent | undefined;
  let paint: (() => void) | undefined;
  /** Where the standing bubble is put beside its point, and nothing while none stands beside one. */
  let place: (() => void) | undefined;
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
    place = undefined;
    if (tooltip.visible) wentDown = scene.time.now;
    tooltip.setVisible(false);
  };

  const paintBeside = (
    message: string,
    at: () => { x: number; y: number },
    title?: string,
  ): void => {
    const { height } = measure(message, title);
    const unit = on.unit();
    place = () => {
      const { x, y } = at();
      tooltip.setPosition(x + STANDOFF * unit, y - (height / 2) * unit);
    };
    place();
    tooltip.setScale(unit).setVisible(true);
  };

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (resting === undefined) return;
    const at = on.at(pointer.x, pointer.y);
    if (Math.abs(at.x - restX) < JITTER && Math.abs(at.y - restY) < JITTER) return;
    restX = at.x;
    restY = at.y;
    rest();
  });
  afterResize(scene, () => {
    place?.();
  });

  return {
    under(message: string, left: number, top: number): void {
      raise(() => {
        const { width } = measure(message);
        const x = Math.min(left, screenSize().width - MARGIN - width);
        place = undefined;
        tooltip.setScale(on.unit()).setPosition(x, top).setVisible(true);
      });
    },

    beside(message: string, at: () => { x: number; y: number }, title?: string): void {
      raise(() => {
        paintBeside(message, at, title);
      });
    },

    follow(): void {
      place?.();
    },

    hide,
  };
}
