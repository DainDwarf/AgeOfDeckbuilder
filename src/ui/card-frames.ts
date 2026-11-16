import type { CardFamily } from './face';
import { type FamilyColour, LOOK } from './look';
import { blankCanvas, type Made, type Sheet } from './sheet';

/** The folder chicogames' pack stands in, under the assets folder. */
const PACK = 'store/nice-card-game-template-2';

/** How wide and how tall a front's body is, the card itself, in the pack's pixels. */
export const BODY = { width: 560, height: 820 };

/** A box in the pack's pixels, from the top-left corner of a front's body. */
type PackBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A point in the pack's pixels, from the top-left corner of a front's body. */
export type PackPoint = { readonly x: number; readonly y: number };

/**
 * One of the pack's plain fronts: its file and its size; where its body's corner lies in it; how far
 * its frame rises above the body; its window, its paper and the middle of its first cost's disc.
 */
type Front = {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly body: PackPoint;
  readonly rises: number;
  readonly window: PackBox;
  readonly paper: PackBox;
  readonly cost: PackPoint;
};

/** The two windows a front is drawn with. */
type FrontWindow = 'arched' | 'oval';

const FRONTS: Readonly<Record<FrontWindow, Front>> = {
  arched: {
    file: `${PACK}/0 - Front/Card - Classic.png`,
    width: 596,
    height: 841,
    body: { x: 18, y: 10 },
    rises: 0,
    window: { x: 68, y: 87, width: 419, height: 310 },
    paper: { x: 94, y: 487, width: 354, height: 256 },
    cost: { x: 60, y: 28 },
  },
  oval: {
    file: `${PACK}/0 - Front/Card 2 - Classic.png`,
    width: 596,
    height: 882,
    body: { x: 18, y: 50 },
    rises: 40,
    window: { x: 113, y: 9, width: 325, height: 428 },
    paper: { x: 94, y: 530, width: 372, height: 208 },
    cost: { x: 60, y: 34 },
  },
};

/** The back, and where its body's corner lies in its file. */
export const BACK = { file: `${PACK}/0 - Back/Back - 2.png`, body: { x: 17, y: 15 } };

/** The riveted plate the name stands on: its file, how wide it is drawn, and its middle's height. */
export const PLATE = {
  file: `${PACK}/0 - Icons and stuffs/Strip - 3.png`,
  width: 600,
  middle: 475,
};

/**
 * The steel disc a cost and the influence stand on: its file, how wide it is drawn, how wide the disc
 * painted in it is drawn, how far under the first a second cost's stands, and the influence's middle.
 */
export const DISC = {
  file: `${PACK}/0 - Icons and stuffs/Circle.png`,
  width: 168,
  painted: 121,
  below: 101,
  influence: { x: 500, y: 758 },
};

/** How far the highest-rising front's rim rises above its body. */
export const HIGHEST_RIM = Math.max(...Object.values(FRONTS).map(({ rises }) => rises));

/** How far a front's rim or its first cost's disc rises above its body, at the most. */
export const HIGHEST_RISE = Math.max(
  HIGHEST_RIM,
  ...Object.values(FRONTS).map(({ cost }) => DISC.painted / 2 - cost.y),
);

/** How far a front's body corners are rounded. */
export const BODY_RADIUS = 33;

/** The window a card of the family wears: the oval on one that places a thing, the arched on the rest. */
function windowOf(family: CardFamily): FrontWindow {
  switch (family) {
    case 'unit':
    case 'building':
    case 'improvement':
      return 'oval';
    case 'thing-done':
    case 'hazard':
    case 'challenge':
    case 'trophy':
      return 'arched';
  }
}

/** The front a card of the family wears, and the frame of the cards sheet it is drawn from. */
export function frontOf(family: CardFamily): Front & { readonly frame: string } {
  return { ...FRONTS[windowOf(family)], frame: `front-${family}` };
}

/** A colour of hue, saturation and lightness, each of the last two out of one. */
function fromHsl(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const [red, green, blue] =
    sector < 1
      ? [chroma, second, 0]
      : sector < 2
        ? [second, chroma, 0]
        : sector < 3
          ? [0, chroma, second]
          : sector < 4
            ? [0, second, chroma]
            : sector < 5
              ? [second, 0, chroma]
              : [chroma, 0, second];
  const floor = lightness - chroma / 2;
  return [red + floor, green + floor, blue + floor];
}

/** A colour's hue in degrees, its saturation and its lightness, its channels each out of one. */
function toHsl(red: number, green: number, blue: number): [number, number, number] {
  const most = Math.max(red, green, blue);
  const least = Math.min(red, green, blue);
  const lightness = (most + least) / 2;
  const spread = most - least;
  if (spread === 0) return [0, 0, lightness];
  const saturation = spread / (1 - Math.abs(2 * lightness - 1));
  const sector =
    most === red
      ? ((green - blue) / spread + 6) % 6
      : most === green
        ? (blue - red) / spread + 2
        : (red - green) / spread + 4;
  return [sector * 60, saturation, lightness];
}

/** The colour a window holding no painting shows: its family's hue, pale. */
export function paleOf(family: CardFamily): number {
  const { hue, saturation } = LOOK.cardFamily[family];
  const [red, green, blue] = fromHsl(hue, Math.min(0.45, saturation * 0.55), 0.82);
  const channel = (value: number): number => Math.round(value * 0xff);
  return (channel(red) << 16) | (channel(green) << 8) | channel(blue);
}

/**
 * Whether a pixel is part of a rim the body's paper stops at: see-through, near black, the rims'
 * blue-grey, or a pale highlight.
 */
function rimAt(pixels: Uint8ClampedArray, at: number): boolean {
  if (pixels[4 * at + 3] < 0xff) return true;
  const [hue, saturation, lightness] = toHsl(
    pixels[4 * at] / 0xff,
    pixels[4 * at + 1] / 0xff,
    pixels[4 * at + 2] / 0xff,
  );
  return (
    lightness < 0.1 ||
    (hue >= 165 && hue <= 265 && saturation > 0.06) ||
    (saturation < 0.1 && lightness > 0.5)
  );
}

/**
 * The pixels of a front's paper: those a walk from the body's edges reaches without crossing a rim,
 * which leaves the inside of the text box out.
 */
function paperOf(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  body: PackPoint,
): Uint8Array {
  const paper = new Uint8Array(width * height);
  const walk: number[] = [];
  const reach = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const at = y * width + x;
    if (paper[at] === 1 || rimAt(pixels, at)) return;
    paper[at] = 1;
    walk.push(at);
  };
  for (let x = body.x; x < body.x + BODY.width; x++) {
    reach(x, body.y);
    reach(x, body.y + BODY.height - 1);
  }
  for (let y = body.y; y < body.y + BODY.height; y++) {
    reach(body.x, y);
    reach(body.x + BODY.width - 1, y);
  }
  for (let at = walk.pop(); at !== undefined; at = walk.pop()) {
    const x = at % width;
    const y = (at - x) / width;
    reach(x - 1, y);
    reach(x + 1, y);
    reach(x, y - 1);
    reach(x, y + 1);
  }
  return paper;
}

/** Every pixel of the paper turned to the family's colour, its grain kept. */
function turned(pixels: Uint8ClampedArray, paper: Uint8Array, colour: FamilyColour): void {
  paper.forEach((onPaper, at) => {
    if (onPaper === 0) return;
    const [, saturation, lightness] = toHsl(
      pixels[4 * at] / 0xff,
      pixels[4 * at + 1] / 0xff,
      pixels[4 * at + 2] / 0xff,
    );
    const rgb = fromHsl(
      colour.hue,
      Math.min(1, colour.saturation * (0.75 + saturation)),
      Math.min(1, lightness * colour.darkness),
    );
    for (const [channel, value] of rgb.entries())
      pixels[4 * at + channel] = Math.round(value * 0xff);
  });
}

/** The key of the sheet every front, the back, the plate and the disc are drawn into. */
export const CARDS_SHEET_KEY = 'cards';

/** The plain front of each family, its paper turned to the family's colour off the pack's file. */
function frontsMade(): Made[] {
  const papers = new Map<string, Uint8Array>();
  return (Object.keys(LOOK.cardFamily) as CardFamily[]).map((family) => {
    const { file, width, height, body, frame } = frontOf(family);
    return {
      frame,
      width,
      height,
      paint: (context, paintingIn) => {
        const from = paintingIn(CARDS_SHEET_KEY, file);
        const on = blankCanvas(from.width, from.height);
        on.drawImage(
          from.canvas,
          from.x,
          from.y,
          from.width,
          from.height,
          0,
          0,
          from.width,
          from.height,
        );
        const image = on.getImageData(0, 0, from.width, from.height);
        const paper = papers.get(file) ?? paperOf(image.data, from.width, from.height, body);
        papers.set(file, paper);
        turned(image.data, paper, LOOK.cardFamily[family]);
        on.putImageData(image, 0, 0);
        context.drawImage(on.canvas, 0, 0);
      },
    };
  });
}

/** The sheet the pack's files and every family's front are drawn into. */
export const CARDS_SHEET: Sheet = {
  key: CARDS_SHEET_KEY,
  files: [FRONTS.arched.file, FRONTS.oval.file, BACK.file, PLATE.file, DISC.file],
  made: frontsMade(),
  side: 4096,
};
