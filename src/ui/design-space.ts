import type Phaser from 'phaser';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const UI_FONT = 'system-ui, "Segoe UI", sans-serif';

/** How far anything laid against an edge of the screen stands off it. */
export const MARGIN = 24;

/** The one accent, on everything that is the player's: the border, the deck, the button. */
export const ACCENT = 0xd9a441;

/** The panel language: the tooltip bubbles and the resource bar are this fill inside this edge. */
export const PANEL_FILL = 0xd4d7db;
export const PANEL_EDGE = 0x6f757d;

// Phaser reads a polygon's corner list in min-(0, 0) space; corners about their own centre draw
// displaced by half the shape.
export function corners(raw: number[]): number[] {
  const minX = Math.min(...raw.filter((_, i) => i % 2 === 0));
  const minY = Math.min(...raw.filter((_, i) => i % 2 === 1));
  return raw.map((value, i) => (i % 2 === 0 ? value - minX : value - minY));
}

export function hexagon(size: number): number[] {
  const raw: number[] = [];
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 6;
    raw.push(size * Math.cos(angle), size * Math.sin(angle));
  }
  return corners(raw);
}

const TAIL_LENGTH = 7;
const TAIL_HALF = 6;

/** The edge a bubble's tail leaves by, and how far along that edge it points. */
export type Tail = { edge: 'top' | 'left' | 'right'; at: number };

/**
 * A bubble in the panel language: the box and its tail as one closed path, so the fill is
 * continuous and the stroke never crosses the seam. The tail reaches out of the edge nearer what
 * the bubble belongs to, and stays clear of both corners.
 */
export function drawBubble(
  bubble: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  tail: Tail,
): void {
  const span = tail.edge === 'top' ? width : height;
  const at = Math.min(Math.max(tail.at, TAIL_HALF + 4), span - TAIL_HALF - 4);

  bubble.clear();
  bubble.fillStyle(PANEL_FILL);
  bubble.lineStyle(1, PANEL_EDGE);
  bubble.beginPath();
  bubble.moveTo(0, 0);
  if (tail.edge === 'top') {
    bubble.lineTo(at - TAIL_HALF, 0);
    bubble.lineTo(at, -TAIL_LENGTH);
    bubble.lineTo(at + TAIL_HALF, 0);
  }
  bubble.lineTo(width, 0);
  if (tail.edge === 'right') {
    bubble.lineTo(width, at - TAIL_HALF);
    bubble.lineTo(width + TAIL_LENGTH, at);
    bubble.lineTo(width, at + TAIL_HALF);
  }
  bubble.lineTo(width, height);
  bubble.lineTo(0, height);
  if (tail.edge === 'left') {
    bubble.lineTo(0, at + TAIL_HALF);
    bubble.lineTo(-TAIL_LENGTH, at);
    bubble.lineTo(0, at - TAIL_HALF);
  }
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
}

// `Phaser.Scale.FIT` in main.ts fits the canvas by this same min, which is what makes the backing
// store equal the canvas's on-screen size in device pixels. Read once: a window resized after boot
// is not re-applied.
const factor =
  window.devicePixelRatio *
  Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);

export const BACKING_WIDTH = Math.round(DESIGN_WIDTH * factor);
export const BACKING_HEIGHT = Math.round(DESIGN_HEIGHT * factor);

// A scene's `scale.width` / `scale.height` report the backing store in device pixels, and a
// pointer's `x` / `y` arrive in that same space; lay out against DESIGN_WIDTH and DESIGN_HEIGHT,
// and read `pointer.worldX` / `pointer.worldY` for the design-space pointer.
export function applyDesignSpace(scene: Phaser.Scene): void {
  scene.cameras.main.setZoom(factor).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
}

/** A view of one design-space rectangle: what a scrolling object has outside it is not drawn. */
export type Clip = {
  /** Draws `only`, and nothing else the scene holds, inside the rectangle in design units. */
  show(
    only: Phaser.GameObjects.GameObject,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  hide(): void;
};

/**
 * A clip is a camera of its own, its viewport the rectangle: Phaser 4's geometry mask clips under
 * the canvas renderer alone, and this game renders through WebGL. Every camera draws the whole
 * scene, so `show` hands this one everything on the display list but the object it is for — which
 * is also why the camera is kept and re-pointed: a camera's ignore is never lifted, and an object
 * the scene gains while the clip stands open would draw inside the rectangle.
 */
export function createClip(scene: Phaser.Scene): Clip {
  const camera = scene.cameras.add(0, 0, 1, 1).setZoom(factor).setVisible(false);
  return {
    show(only, x, y, width, height): void {
      camera
        .setViewport(x * factor, y * factor, width * factor, height * factor)
        .centerOn(x + width / 2, y + height / 2)
        .setVisible(true);
      camera.ignore(scene.children.list.filter((child) => child !== only));
      scene.cameras.main.ignore(only);
    },
    hide(): void {
      camera.setVisible(false);
    },
  };
}

/**
 * A click: pressed and released on the same object. Phaser delivers `pointerup` to whatever lies
 * under the pointer however far it travelled since the press, so a bare `pointerup` also fires on
 * a card dragged onto the object from elsewhere, and on the release half of a click whose press
 * dismissed something above it.
 */
export function onClick(target: Phaser.GameObjects.GameObject, handler: () => void): void {
  let pressed = false;
  target.on('pointerdown', () => {
    pressed = true;
  });
  target.on('pointerup', () => {
    if (pressed) handler();
  });
  // The scene sees every release, and after the target does. A press the target never sees
  // released — it was hidden, disabled or removed meanwhile — would otherwise stay armed.
  target.scene.input.on('pointerup', () => {
    pressed = false;
  });
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  // Phaser sizes a Text's backing canvas from a box it measures at 1× — sideways from the advance
  // width rather than the ink box — but rasterises the glyphs at `resolution`, and a hinted outline
  // is not proportional, so ink falls outside the canvas on every side, further sideways than
  // vertically. The padding holds that overflow; being symmetric per axis, a centred text does not
  // move. A fractional resolution would truncate the canvas to whole pixels, hence the ceiling.
  return scene.add.text(x, y, content, {
    ...style,
    resolution: Math.ceil(factor),
    padding: { x: 2, y: 1 },
  });
}
