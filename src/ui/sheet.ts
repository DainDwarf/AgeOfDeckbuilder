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

/** Where a painting of a sheet lies: the canvas the sheet is, and the painting's box on it. */
export type InSheet = {
  readonly canvas: HTMLCanvasElement;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * A frame of a sheet drawn by code: its name, its size, and the way to paint it from its top-left
 * corner, a painting of its own sheet or of one drawn before it found by `paintingIn`.
 */
export type Made = {
  readonly frame: string;
  readonly width: number;
  readonly height: number;
  paint(
    context: CanvasRenderingContext2D,
    paintingIn: (sheet: string, painting: string) => InSheet,
  ): void;
};

/** One sheet of paintings: the key its texture stands under, the files drawn into it, and its side. */
export type Sheet = {
  readonly key: string;
  readonly files: readonly string[];
  readonly tinted?: readonly Tinted[];
  readonly made?: readonly Made[];
  /** How wide and how tall it is: a power of two, or Phaser makes no mipmaps of it (docs/PHASER.md). */
  readonly side: number;
};

/** Every file of a sheet queued on a scene's loader under its own name, for `drawSheet` to read. */
export function queueSheet(load: Phaser.Loader.LoaderPlugin, { files }: Sheet): void {
  for (const file of files) load.image(file, `${import.meta.env.BASE_URL}assets/${file}`);
}

/**
 * The files `queueSheet` loaded drawn into one canvas texture under the sheet's key, row by row, their
 * own textures let go, then each tinted painting, then each frame made by code; a file that did not
 * load, and a painting its sheet does not hold, are refused.
 */
export function drawSheet(
  textures: Phaser.Textures.TextureManager,
  { key, files, tinted = [], made = [], side }: Sheet,
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

  const paintingIn = (from: string, painting: string): InSheet => {
    const holds = textures.exists(from) && textures.get(from).has(painting);
    const canvas = holds ? textures.get(from).getSourceImage() : undefined;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`the sheet ${from} holds no painting ${painting}`);
    }
    const { cutX, cutY, cutWidth, cutHeight } = textures.getFrame(from, painting);
    return { canvas, x: cutX, y: cutY, width: cutWidth, height: cutHeight };
  };

  const scratch = document.createElement('canvas');
  const context = scratch.getContext('2d');
  if (context === null) throw new Error('no canvas of the page draws in two dimensions');
  for (const { sheet: from, painting, frame, wash, composite } of tinted) {
    const { canvas, x: cutX, y: cutY, width, height } = paintingIn(from, painting);
    const paint = (): void =>
      context.drawImage(canvas, cutX, cutY, width, height, 0, 0, width, height);
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

  for (const { frame, width, height, paint } of made) {
    const at = room(frame, width, height);
    sheet.context.save();
    sheet.context.translate(at.x, at.y);
    paint(sheet.context, paintingIn);
    sheet.context.restore();
  }
  sheet.refresh();
}
