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
export type PaintingIn = (sheet: string, painting: string) => InSheet;

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

/** A file of a sheet whose pixels are read and written where the sheet holds it, never scaled. */
export type Retouched = { readonly file: string; retouch(pixels: ImageData): void };

/** Files drawn in lines, each made a square of `side` pixels as it loads. */
export type Rasterised = { readonly files: readonly string[]; readonly side: number };

/** One sheet of paintings: the key its texture stands under, the files drawn into it, and its side. */
export type Sheet = {
  readonly key: string;
  readonly files: readonly string[];
  readonly rasterised?: Rasterised;
  readonly retouched?: readonly Retouched[];
  readonly tinted?: readonly Tinted[];
  readonly made?: readonly Made[];
  /** How wide and how tall it is: a power of two, or Phaser makes no mipmaps of it (docs/PHASER.md). */
  readonly side: number;
  /**
   * How many rows of nothing stand between two rows of its frames, so a frame read through a mipmap
   * level that coarse draws nothing of the frame above it.
   */
  readonly rowGap?: number;
  /**
   * How many columns of nothing stand between two frames side by side, for a sheet where a frame
   * paints to its edge: one beside it read through a mipmap level that coarse draws none of it.
   */
  readonly columnGap?: number;
  /** Whether the card reads it through its anisotropic filter, where the browser has one. */
  readonly anisotropic?: boolean;
};

/**
 * The side of a texture holding that span: the power of two at or past it, or Phaser makes no mipmaps
 * of it (docs/PHASER.md).
 */
export function mipmappedSide(span: number): number {
  return 2 ** Math.ceil(Math.log2(span));
}

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
 * A painting of a sheet re-painted under a wash on a canvas made its size, the wash kept to the
 * painting's own pixels.
 */
export function paintUnder(
  on: CanvasRenderingContext2D,
  { canvas, x, y, width, height }: InSheet,
  wash: Wash,
  composite: GlobalCompositeOperation,
): void {
  const paint = (): void => on.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  on.canvas.width = width;
  on.canvas.height = height;
  paint();
  on.globalCompositeOperation = composite;
  on.globalAlpha = wash.strength;
  on.fillStyle = css(wash.colour);
  on.fillRect(0, 0, width, height);
  on.globalCompositeOperation = 'destination-in';
  on.globalAlpha = 1;
  paint();
}

/**
 * A picture of a sheet: the sheet's key, its file, how many pixels wide and tall it is, and how many
 * of them make one unit where it is drawn.
 */
export type Picture = {
  readonly sheet: string;
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly pixels: number;
};

/**
 * The room a frame painted off a picture keeps round it on every side to reach that many units past
 * it, in the picture's pixels, that many of them to the unit.
 */
export function roomFor(reach: number, pixels: number): number {
  return Math.ceil(reach * pixels) + 1;
}

/**
 * A frame a picture is painted off, the picture in its middle with room round it to reach that many
 * units past it: `paint` is handed a canvas of the frame's size, the picture's alpha on it, how many
 * pixels a unit is, and the way to draw the picture onto it.
 */
export function aroundPicture(
  { sheet, file, width: pictured, height: tall, pixels }: Picture,
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
  const width = pictured + 2 * room;
  const height = tall + 2 * room;
  return {
    frame,
    width,
    height,
    paint: (context, paintingIn) => {
      const from = paintingIn(sheet, file);
      const on = blankCanvas(width, height);
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
      const { data } = on.getImageData(0, 0, width, height);
      const alpha = Uint8ClampedArray.from({ length: width * height }, (_, at) => data[4 * at + 3]);
      paint(on, alpha, pixels, picture);
      context.drawImage(on.canvas, 0, 0);
    },
  };
}

/** The address of a file under the assets folder. */
export function assetAt(file: string): string {
  return `${import.meta.env.BASE_URL}assets/${file}`;
}

/** Every file of a sheet queued on a scene's loader under its own name, for `drawSheet` to read. */
export function queueSheet(load: Phaser.Loader.LoaderPlugin, { files, rasterised }: Sheet): void {
  for (const file of files) load.image(file, assetAt(file));
  if (rasterised === undefined) return;
  // Phaser rasterises an SVG once, at the size handed here (`src/loader/filetypes/SVGFile.js:97-139`).
  const { side } = rasterised;
  for (const file of rasterised.files) load.svg(file, assetAt(file), { width: side, height: side });
}

/**
 * A frame that wide and tall added to a sheet where its frames leave room, row by row after the last
 * of them and the sheet's column gap, its row gap under a full row; a sheet with no room left is
 * refused.
 */
function roomIn(
  sheet: Phaser.Textures.CanvasTexture,
  name: string,
  width: number,
  height: number,
  { rowGap = 0, columnGap = 0 }: Pick<Sheet, 'rowGap' | 'columnGap'>,
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
    x = last.cutX + last.cutWidth + columnGap;
    y = last.cutY;
    if (x + width > sheet.width) {
      x = 0;
      y += row + rowGap;
    }
  }
  if (y + height > sheet.height)
    throw new Error(`the sheet ${sheet.key} has no room left for ${name}`);
  sheet.add(name, 0, x, y, width, height);
  return { x, y };
}

/** Where a painting of a sheet drawn already lies, read off the textures; one no sheet holds is refused. */
export function paintingsIn(textures: Phaser.Textures.TextureManager): PaintingIn {
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

/**
 * A frame made by code painted into a sheet, on the canvas it is drawn on, after the frames it holds,
 * the sheet's gaps, uploaded only by the canvas's `refresh`.
 */
export function paintMade(
  textures: Phaser.Textures.TextureManager,
  sheet: Sheet,
  canvas: Phaser.Textures.CanvasTexture,
  { frame, width, height, paint }: Made,
): void {
  const at = roomIn(canvas, frame, width, height, sheet);
  canvas.context.save();
  canvas.context.translate(at.x, at.y);
  paint(canvas.context, paintingsIn(textures));
  canvas.context.restore();
}

/**
 * The files `queueSheet` loaded drawn into one canvas texture under the sheet's key, row by row, each
 * retouched file retouched, then each tinted painting, then each frame made by code; a file that did
 * not load, and a painting its sheet does not hold, are refused.
 */
function drawSheet(textures: Phaser.Textures.TextureManager, drawn: Sheet): void {
  const { key, files, rasterised, retouched = [], tinted = [], made = [], side } = drawn;
  const sheet = textures.createCanvas(key, side, side);
  if (sheet === null) throw new Error(`a texture stands under ${key} already`);

  for (const file of [...files, ...(rasterised?.files ?? [])]) {
    // A texture the manager does not hold draws as Phaser's missing one and throws nothing (docs/PHASER.md).
    if (!textures.exists(file)) throw new Error(`the texture ${file} could not be loaded`);
    const { width, height } = textures.getFrame(file);
    const at = roomIn(sheet, file, width, height, drawn);
    sheet.drawFrame(file, undefined, at.x, at.y, false);
  }

  for (const { file, retouch } of retouched) {
    if (!files.includes(file)) throw new Error(`the sheet ${key} draws no file ${file} to retouch`);
    const { cutX, cutY, cutWidth, cutHeight } = sheet.get(file);
    const pixels = sheet.context.getImageData(cutX, cutY, cutWidth, cutHeight);
    retouch(pixels);
    sheet.context.putImageData(pixels, cutX, cutY);
  }

  const paintingIn = paintingsIn(textures);
  const context = blankCanvas(0, 0);
  for (const { sheet: from, painting, frame, wash, composite } of tinted) {
    const under = paintingIn(from, painting);
    paintUnder(context, under, wash, composite);
    const at = roomIn(sheet, frame, under.width, under.height, drawn);
    sheet.context.drawImage(context.canvas, at.x, at.y);
  }

  for (const one of made) paintMade(textures, drawn, sheet, one);
  sheet.refresh();
}

/**
 * Each sheet drawn in turn, as `drawSheet` draws one, then the textures of the files they loaded let
 * go: a file two sheets name is loaded once and drawn into both.
 */
export function drawSheets(
  textures: Phaser.Textures.TextureManager,
  sheets: readonly Sheet[],
): void {
  for (const sheet of sheets) drawSheet(textures, sheet);
  const loaded = sheets.flatMap(({ files, rasterised }) => [
    ...files,
    ...(rasterised?.files ?? []),
  ]);
  for (const file of new Set(loaded)) textures.remove(file);
}
