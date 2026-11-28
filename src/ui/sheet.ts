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
export function blankCanvas(
  width: number,
  height: number,
  settings?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', settings);
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

/** The files of sheets decoded as images of the page, by file; one that did not load is missing. */
export type Decoded = Map<string, HTMLImageElement>;

/** The file at an address decoded as an image of the page, or nothing where it cannot be fetched or decoded. */
async function imageAt(address: string): Promise<HTMLImageElement | undefined> {
  const image = new Image();
  image.src = address;
  try {
    await image.decode();
    return image;
  } catch {
    return undefined;
  }
}

/**
 * The SVG file at an address decoded as a square image of that side, or nothing where it cannot be
 * fetched or decoded: its root is sized to the side, so the browser rasterises it once, at that side.
 */
async function svgImageAt(address: string, side: number): Promise<HTMLImageElement | undefined> {
  try {
    const response = await fetch(address);
    if (!response.ok) return undefined;
    const svg = new DOMParser()
      .parseFromString(await response.text(), 'text/xml')
      .getElementsByTagName('svg')[0];
    svg.setAttribute('width', `${side}px`);
    svg.setAttribute('height', `${side}px`);
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const image = await imageAt(url);
    URL.revokeObjectURL(url);
    return image;
  } catch {
    return undefined;
  }
}

/**
 * Every file of the sheets decoded as an image of the page, never made a texture, for `drawSheets` to
 * draw: a file two sheets name is decoded once, and a rasterised file made a square of its side.
 */
export async function decodedFiles(sheets: readonly Sheet[]): Promise<Decoded> {
  const decoding = new Map<string, Promise<HTMLImageElement | undefined>>();
  for (const { files, rasterised } of sheets) {
    for (const file of files) {
      if (!decoding.has(file)) decoding.set(file, imageAt(assetAt(file)));
    }
    if (rasterised === undefined) continue;
    for (const file of rasterised.files) {
      if (!decoding.has(file)) decoding.set(file, svgImageAt(assetAt(file), rasterised.side));
    }
  }
  const decoded: Decoded = new Map();
  for (const [file, image] of decoding) {
    const done = await image;
    if (done !== undefined) decoded.set(file, done);
  }
  return decoded;
}

/** A frame of a sheet: its name and its box on the sheet's canvas. */
type FrameCut = {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A sheet as it is painted: the context of its canvas, and its frames in the order they were cut. */
type SheetCanvas = {
  readonly sheet: Sheet;
  readonly context: CanvasRenderingContext2D;
  readonly cuts: FrameCut[];
};

/**
 * A frame that wide and tall cut from a sheet where its frames leave room, row by row after the last
 * of them and the sheet's column gap, its row gap under a full row; a sheet with no room left is
 * refused.
 */
function roomIn(
  { sheet, cuts }: SheetCanvas,
  name: string,
  width: number,
  height: number,
): FrameCut {
  const { key, side, rowGap = 0, columnGap = 0 } = sheet;
  let x = 0;
  let y = 0;
  if (cuts.length > 0) {
    const last = cuts[cuts.length - 1];
    let row = 0;
    for (let at = cuts.length - 1; at >= 0; at--) {
      if (cuts[at].y !== last.y) break;
      row = Math.max(row, cuts[at].height);
    }
    x = last.x + last.width + columnGap;
    y = last.y;
    if (x + width > side) {
      x = 0;
      y += row + rowGap;
    }
  }
  if (y + height > side) throw new Error(`the sheet ${key} has no room left for ${name}`);
  const cut = { name, x, y, width, height };
  cuts.push(cut);
  return cut;
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
 * Where a painting lies, read off the sheet being painted for its own and off the textures for a
 * sheet drawn before it; one no sheet holds is refused.
 */
function paintingsWith(
  textures: Phaser.Textures.TextureManager,
  { sheet, context, cuts }: SheetCanvas,
): PaintingIn {
  const drawn = paintingsIn(textures);
  return (from, painting) => {
    if (from !== sheet.key) return drawn(from, painting);
    const cut = cuts.find(({ name }) => name === painting);
    if (cut === undefined) throw new Error(`the sheet ${from} holds no painting ${painting}`);
    const { x, y, width, height } = cut;
    return { canvas: context.canvas, x, y, width, height };
  };
}

/** A frame made by code painted onto a sheet's canvas after the frames cut from it, the sheet's gaps. */
function paintOn(
  canvas: SheetCanvas,
  { frame, width, height, paint }: Made,
  paintingIn: PaintingIn,
): FrameCut {
  const cut = roomIn(canvas, frame, width, height);
  const { context } = canvas;
  context.save();
  context.translate(cut.x, cut.y);
  paint(context, paintingIn);
  context.restore();
  return cut;
}

/**
 * A frame made by code painted into a sheet's canvas texture after the frames it holds, the sheet's
 * gaps, uploaded only by the canvas's `refresh`.
 */
export function paintMade(
  textures: Phaser.Textures.TextureManager,
  sheet: Sheet,
  texture: Phaser.Textures.CanvasTexture,
  made: Made,
): void {
  const cuts = texture.getFrameNames().map((name): FrameCut => {
    const { cutX, cutY, cutWidth, cutHeight } = texture.get(name);
    return { name, x: cutX, y: cutY, width: cutWidth, height: cutHeight };
  });
  const { name, x, y, width, height } = paintOn(
    { sheet, context: texture.context, cuts },
    made,
    paintingsIn(textures),
  );
  texture.add(name, 0, x, y, width, height);
}

/**
 * The images of a sheet's files drawn into one canvas, row by row, each retouched file retouched,
 * then each tinted painting, then each frame made by code, and the canvas then made a texture under
 * the sheet's key; a file that did not load, and a painting its sheet does not hold, are refused.
 */
function drawSheet(textures: Phaser.Textures.TextureManager, decoded: Decoded, drawn: Sheet): void {
  const { key, files, rasterised, retouched = [], tinted = [], made = [], side } = drawn;
  // A canvas keeps the settings of its first context. Without `willReadFrequently`, which the canvas
  // texture's own context asks for (`src/textures/CanvasTexture.js:86`), the sheet paints and reads
  // back different pixels.
  const context = blankCanvas(side, side, { willReadFrequently: true });
  const sheetCanvas: SheetCanvas = { sheet: drawn, context, cuts: [] };

  for (const file of [...files, ...(rasterised?.files ?? [])]) {
    const image = decoded.get(file);
    if (image === undefined) throw new Error(`the file ${file} could not be loaded`);
    const { naturalWidth: width, naturalHeight: height } = image;
    const cut = roomIn(sheetCanvas, file, width, height);
    context.drawImage(image, 0, 0, width, height, cut.x, cut.y, width, height);
  }

  for (const { file, retouch } of retouched) {
    if (!files.includes(file)) throw new Error(`the sheet ${key} draws no file ${file} to retouch`);
    const { x, y, width, height } = sheetCanvas.cuts.find(({ name }) => name === file) as FrameCut;
    const pixels = context.getImageData(x, y, width, height);
    retouch(pixels);
    context.putImageData(pixels, x, y);
  }

  const paintingIn = paintingsWith(textures, sheetCanvas);
  const tinting = blankCanvas(0, 0);
  for (const { sheet: from, painting, frame, wash, composite } of tinted) {
    const under = paintingIn(from, painting);
    paintUnder(tinting, under, wash, composite);
    const cut = roomIn(sheetCanvas, frame, under.width, under.height);
    context.drawImage(tinting.canvas, cut.x, cut.y);
  }

  for (const one of made) paintOn(sheetCanvas, one, paintingIn);

  // Only once painted: making a texture uploads its canvas, mipmaps and all (docs/PHASER.md).
  const texture = textures.addCanvas(key, context.canvas);
  if (texture === null) throw new Error(`a texture stands under ${key} already`);
  for (const { name, x, y, width, height } of sheetCanvas.cuts)
    texture.add(name, 0, x, y, width, height);
}

/**
 * Each sheet drawn in turn off the decoded files, none for sheets that draw no file, as `drawSheet`
 * draws one, then the decoded files let go: a file two sheets name is drawn into both.
 */
export function drawSheets(
  textures: Phaser.Textures.TextureManager,
  sheets: readonly Sheet[],
  decoded: Decoded = new Map(),
): void {
  for (const sheet of sheets) drawSheet(textures, decoded, sheet);
  decoded.clear();
}
