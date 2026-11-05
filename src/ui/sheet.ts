import type Phaser from 'phaser';
import { css, type Wash } from './look';

/** A painting of a sheet drawn before this one, re-painted under a colour as a frame of this one. */
export type Tinted = {
  readonly sheet: string;
  readonly painting: string;
  /** The name it stands under in this sheet. */
  readonly frame: string;
  readonly wash: Wash;
  readonly composite: GlobalCompositeOperation;
};

/** One sheet of paintings: the key its texture stands under, the files drawn into it, and its side. */
export type Sheet = {
  readonly key: string;
  readonly files: readonly string[];
  readonly tinted?: readonly Tinted[];
  /** How wide and how tall it is: a power of two, or Phaser makes no mipmaps of it (docs/PHASER.md). */
  readonly side: number;
};

/** Every file of a sheet queued on a scene's loader under its own name, for `drawSheet` to read. */
export function queueSheet(load: Phaser.Loader.LoaderPlugin, { files }: Sheet): void {
  for (const file of files) load.image(file, `${import.meta.env.BASE_URL}assets/${file}`);
}

/**
 * The files `queueSheet` loaded drawn into one canvas texture under the sheet's key, row by row, each
 * a frame named by its file, their own textures let go, then each tinted painting cut to its own
 * pixels; a file that did not load, and a painting its sheet does not hold, are refused.
 */
export function drawSheet(
  textures: Phaser.Textures.TextureManager,
  { key, files, tinted = [], side }: Sheet,
): void {
  const sheet = textures.createCanvas(key, side, side);
  if (sheet === null) throw new Error(`a texture stands under ${key} already`);
  let x = 0;
  let y = 0;
  let row = 0;
  const room = (name: string, width: number, height: number): { x: number; y: number } => {
    if (x + width > side) {
      x = 0;
      y += row;
      row = 0;
    }
    if (y + height > side) throw new Error(`the sheet ${key} has no room left for ${name}`);
    const at = { x, y };
    sheet.add(name, 0, x, y, width, height);
    x += width;
    row = Math.max(row, height);
    return at;
  };

  for (const file of files) {
    // A texture the manager does not hold draws as Phaser's missing one and throws nothing (docs/PHASER.md).
    if (!textures.exists(file)) throw new Error(`the texture ${file} could not be loaded`);
    const { width, height } = textures.getFrame(file);
    const at = room(file, width, height);
    sheet.drawFrame(file, undefined, at.x, at.y, false);
    textures.remove(file);
  }

  const scratch = document.createElement('canvas');
  const context = scratch.getContext('2d');
  if (context === null) throw new Error('no canvas of the page draws in two dimensions');
  for (const { sheet: from, painting, frame, wash, composite } of tinted) {
    const holds = textures.exists(from) && textures.get(from).has(painting);
    const image = holds ? textures.get(from).getSourceImage() : undefined;
    if (!(image instanceof HTMLCanvasElement)) {
      throw new Error(`the sheet ${from} holds no painting ${painting} to tint`);
    }
    const { cutX, cutY, cutWidth: width, cutHeight: height } = textures.getFrame(from, painting);
    const paint = (): void =>
      context.drawImage(image, cutX, cutY, width, height, 0, 0, width, height);
    scratch.width = width;
    scratch.height = height;
    paint();
    context.globalCompositeOperation = composite;
    context.globalAlpha = wash.strength;
    context.fillStyle = css(wash.colour);
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.globalAlpha = 1;
    paint();
    const at = room(frame, width, height);
    sheet.context.drawImage(scratch, at.x, at.y);
  }
  sheet.refresh();
}
