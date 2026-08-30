import type Phaser from 'phaser';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

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

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, { ...style, resolution: factor });
}
