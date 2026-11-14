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

/** Where a painting of a sheet drawn already lies; a painting no sheet holds is refused. */
type PaintingIn = (sheet: string, painting: string) => InSheet;

/**
 * A frame of a sheet drawn by code: its name, its size, and the way to paint it from its top-left
 * corner, a painting of its own sheet or of one drawn before it found by `paintingIn`.
 */
export type Made = {
  readonly frame: string;
  readonly width: number;
  readonly height: number;
  paint(context: CanvasRenderingContext2D, paintingIn: PaintingIn): void;
};

/** Files drawn in lines, each made a square of `side` pixels as it loads. */
export type Rasterised = { readonly files: readonly string[]; readonly side: number };

/** One sheet of paintings: the key its texture stands under, the files drawn into it, and its side. */
export type Sheet = {
  readonly key: string;
  readonly files: readonly string[];
  readonly rasterised?: Rasterised;
  readonly tinted?: readonly Tinted[];
  readonly made?: readonly Made[];
  /** How wide and how tall it is: a power of two, or Phaser makes no mipmaps of it (docs/PHASER.md). */
  readonly side: number;
};

/** A canvas of the page that wide and tall, holding nothing, and the context it draws in. */
export function blankCanvas(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('no canvas of the page draws in two dimensions');
  return context;
}

/** Every pixel of a canvas painted in a colour, as strong as `strengths` says, out of one. */
export function washed(
  on: CanvasRenderingContext2D,
  colour: number,
  strengths: Float64Array,
): void {
  const { width, height } = on.canvas;
  const image = on.createImageData(width, height);
  strengths.forEach((strength, at) => {
    image.data[4 * at] = (colour >> 16) & 0xff;
    image.data[4 * at + 1] = (colour >> 8) & 0xff;
    image.data[4 * at + 2] = colour & 0xff;
    image.data[4 * at + 3] = Math.round(0xff * strength);
  });
  on.putImageData(image, 0, 0);
}

/**
 * A square picture of a sheet: the sheet's key, its file, how many pixels a side it is, and how many
 * of them make one unit where it is drawn.
 */
export type Square = {
  readonly sheet: string;
  readonly file: string;
  readonly side: number;
  readonly pixels: number;
};

/**
 * The room a frame painted off a square picture keeps round it on every side to reach that many units
 * past it, in the picture's pixels, that many of them to the unit.
 */
export function roomFor(reach: number, pixels: number): number {
  return Math.ceil(reach * pixels) + 1;
}

/**
 * A frame a square picture is painted off, the picture in its middle with room round it to reach that
 * many units past it: `paint` is handed a canvas of the frame's size, the picture's alpha on it, how
 * many pixels a unit is, and the way to draw the picture onto it.
 */
export function aroundPicture(
  { sheet, file, side: pictured, pixels }: Square,
  frame: string,
  reach: number,
  paint: (
    on: CanvasRenderingContext2D,
    alpha: Uint8ClampedArray,
    pixels: number,
    picture: () => void,
  ) => void,
): Made {
  const room = roomFor(reach, pixels);
  const side = pictured + 2 * room;
  return {
    frame,
    width: side,
    height: side,
    paint: (context, paintingIn) => {
      const from = paintingIn(sheet, file);
      const on = blankCanvas(side, side);
      const picture = (): void =>
        on.drawImage(
          from.canvas,
          from.x,
          from.y,
          from.width,
          from.height,
          room,
          room,
          from.width,
          from.height,
        );
      picture();
      const { data } = on.getImageData(0, 0, side, side);
      const alpha = Uint8ClampedArray.from({ length: side * side }, (_, at) => data[4 * at + 3]);
      paint(on, alpha, pixels, picture);
      context.drawImage(on.canvas, 0, 0);
    },
  };
}

/** Every file of a sheet queued on a scene's loader under its own name, for `drawSheet` to read. */
export function queueSheet(load: Phaser.Loader.LoaderPlugin, { files, rasterised }: Sheet): void {
  const at = (file: string): string => `${import.meta.env.BASE_URL}assets/${file}`;
  for (const file of files) load.image(file, at(file));
  if (rasterised === undefined) return;
  // Phaser rasterises an SVG once, at the size handed here (`src/loader/filetypes/SVGFile.js:97-139`).
  const { side } = rasterised;
  for (const file of rasterised.files) load.svg(file, at(file), { width: side, height: side });
}

/**
 * A frame that wide and tall added to a sheet where its frames leave room, row by row after the last
 * of them; a sheet with no room left is refused.
 */
function roomIn(
  sheet: Phaser.Textures.CanvasTexture,
  name: string,
  width: number,
  height: number,
): { x: number; y: number } {
  const names = sheet.getFrameNames();
  let x = 0;
  let y = 0;
  if (names.length > 0) {
    const last = sheet.get(names[names.length - 1]);
    let row = 0;
    for (let at = names.length - 1; at >= 0; at--) {
      const frame = sheet.get(names[at]);
      if (frame.cutY !== last.cutY) break;
      row = Math.max(row, frame.cutHeight);
    }
    x = last.cutX + last.cutWidth;
    y = last.cutY;
    if (x + width > sheet.width) {
      x = 0;
      y += row;
    }
  }
  if (y + height > sheet.height)
    throw new Error(`the sheet ${sheet.key} has no room left for ${name}`);
  sheet.add(name, 0, x, y, width, height);
  return { x, y };
}

/** Where a painting of a sheet drawn already lies, read off the textures; one no sheet holds is refused. */
function paintingsIn(textures: Phaser.Textures.TextureManager): PaintingIn {
  return (from, painting) => {
    const holds = textures.exists(from) && textures.get(from).has(painting);
    const canvas = holds ? textures.get(from).getSourceImage() : undefined;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`the sheet ${from} holds no painting ${painting}`);
    }
    const { cutX, cutY, cutWidth, cutHeight } = textures.getFrame(from, painting);
    return { canvas, x: cutX, y: cutY, width: cutWidth, height: cutHeight };
  };
}

/** A frame made by code painted into a sheet after the frames it holds, uploaded only by the sheet's `refresh`. */
export function paintMade(
  textures: Phaser.Textures.TextureManager,
  sheet: Phaser.Textures.CanvasTexture,
  { frame, width, height, paint }: Made,
): void {
  const at = roomIn(sheet, frame, width, height);
  sheet.context.save();
  sheet.context.translate(at.x, at.y);
  paint(sheet.context, paintingsIn(textures));
  sheet.context.restore();
}

/**
 * The files `queueSheet` loaded drawn into one canvas texture under the sheet's key, row by row, their
 * own textures let go, then each tinted painting, then each frame made by code; a file that did not
 * load, and a painting its sheet does not hold, are refused.
 */
export function drawSheet(
  textures: Phaser.Textures.TextureManager,
  { key, files, rasterised, tinted = [], made = [], side }: Sheet,
): void {
  const sheet = textures.createCanvas(key, side, side);
  if (sheet === null) throw new Error(`a texture stands under ${key} already`);

  for (const file of [...files, ...(rasterised?.files ?? [])]) {
    // A texture the manager does not hold draws as Phaser's missing one and throws nothing (docs/PHASER.md).
    if (!textures.exists(file)) throw new Error(`the texture ${file} could not be loaded`);
    const { width, height } = textures.getFrame(file);
    const at = roomIn(sheet, file, width, height);
    sheet.drawFrame(file, undefined, at.x, at.y, false);
    textures.remove(file);
  }

  const paintingIn = paintingsIn(textures);
  const context = blankCanvas(0, 0);
  const scratch = context.canvas;
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
    const at = roomIn(sheet, frame, width, height);
    sheet.context.drawImage(scratch, at.x, at.y);
  }

  for (const one of made) paintMade(textures, sheet, one);
  sheet.refresh();
}
