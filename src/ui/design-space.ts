import type Phaser from 'phaser';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const UI_FONT = 'system-ui, "Segoe UI", sans-serif';

/** How far anything laid against an edge of the screen stands off it. */
export const MARGIN = 24;

/** The one accent, on everything that is the player's: the border, the deck, the button. */
export const ACCENT = 0xd9a441;

// Phaser reads a polygon's corner list in min-(0, 0) space; corners about their own centre draw
// displaced by half the shape.
export function hexagon(size: number): number[] {
  const raw: number[] = [];
  for (let corner = 0; corner < 6; corner++) {
    const angle = (Math.PI / 3) * corner - Math.PI / 6;
    raw.push(size * Math.cos(angle), size * Math.sin(angle));
  }
  const minX = Math.min(...raw.filter((_, i) => i % 2 === 0));
  const minY = Math.min(...raw.filter((_, i) => i % 2 === 1));
  return raw.map((value, i) => (i % 2 === 0 ? value - minX : value - minY));
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
  return scene.add.text(x, y, content, { ...style, resolution: factor });
}
