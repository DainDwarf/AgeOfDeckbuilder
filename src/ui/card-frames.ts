import type { BadgeStat, CardFamily } from './face';
import { type FamilyColour, LOOK } from './look';
import { blankCanvas, type InSheet, type Made, type Sheet } from './sheet';

/** The folder chicogames' pack stands in, under the assets folder. */
const PACK = 'store/nice-card-game-template-2';

/** How wide and how tall a front's body is, the card itself, in the pack's pixels. */
export const BODY = { width: 560, height: 820 };

/** How wide a card is wherever it stands but large, in units. */
export const CARD_WIDTH = 124;

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

/**
 * The riveted plate the name stands on: its file, how wide it is drawn, and its middle's height; how
 * far down its file the wood's upper and lower edges stand, the shadow round it left out; and how far
 * across its file the inner rims of its two rivets stand.
 */
export const PLATE = {
  file: `${PACK}/0 - Icons and stuffs/Strip - 3.png`,
  width: 600,
  middle: 475,
  edges: { top: 27.5, bottom: 131.5 },
  rivets: { left: 90.5, right: 572 },
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

/**
 * One of the pack's badges a unit's card reads a stat on: its file and its size, the frame its turned
 * colours are drawn as, the box its picture is painted in, and the point its number's middle stands
 * on, in its file's pixels.
 */
type Badge = {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly frame: string;
  readonly painted: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly number: { readonly x: number; readonly y: number };
};

export const BADGES: Readonly<Record<BadgeStat, Badge>> = {
  damage: {
    file: `${PACK}/0 - Icons and stuffs/Spades.png`,
    width: 304,
    height: 298,
    frame: 'badge-damage',
    painted: { x: 18, y: 36, width: 268, height: 226 },
    number: { x: 152, y: 150 },
  },
  health: {
    file: `${PACK}/0 - Icons and stuffs/Health.png`,
    width: 304,
    height: 298,
    frame: 'badge-health',
    painted: { x: 36, y: 32, width: 230, height: 236 },
    number: { x: 151, y: 142 },
  },
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

/**
 * The front a card of the family wears, the frame of the cards sheet it is drawn from, and the frame
 * its shadow is.
 */
export function frontOf(
  family: CardFamily,
): Front & { readonly frame: string; readonly shadow: string } {
  const window = windowOf(family);
  return { ...FRONTS[window], frame: `front-${family}`, shadow: shadowFrameOf(window) };
}

/** The frame of the cards sheet the shadow of a front of that window is. */
function shadowFrameOf(window: FrontWindow): string {
  return `shadow-${window}`;
}

/** How many of a shadow's pixels make one of the pack's. */
const SHADOW_PIXELS = 0.5;

/** How many of a shadow's pixels make a unit, on a card at its own size. */
const SHADOW_UNIT = (SHADOW_PIXELS * BODY.width) / CARD_WIDTH;

/**
 * A front's shadow: how many of its pixels make one of the pack's, and how many it reaches past the
 * front on every side, its fall and three deviations of its blur, a canvas's blur being two of them.
 */
export const SHADOW = {
  pixels: SHADOW_PIXELS,
  room: Math.ceil((1.5 * LOOK.liftedShadow.blur + LOOK.liftedShadow.fall) * SHADOW_UNIT) + 1,
};

/** The shadow of each front, laid from the pack's file at `SHADOW.pixels`, its body where the front's is. */
function shadowsMade(): Made[] {
  const { pixels, room } = SHADOW;
  const { colour, strength, blur, fall } = LOOK.liftedShadow;
  return (Object.keys(FRONTS) as FrontWindow[]).map((window) => {
    const { file, width, height } = FRONTS[window];
    const drawn = { width: Math.ceil(width * pixels), height: Math.ceil(height * pixels) };
    const across = drawn.width + 2 * room;
    const down = drawn.height + 2 * room;
    return {
      frame: shadowFrameOf(window),
      width: across,
      height: down,
      paint: (context, paintingIn) => {
        const from = paintingIn(CARDS_SHEET_KEY, file);
        // The front is drawn in the canvas's right half and its shadow cast into the left, the half kept.
        const on = blankCanvas(2 * across, down);
        on.shadowColor = `rgba(${(colour >> 16) & 0xff}, ${(colour >> 8) & 0xff}, ${colour & 0xff}, ${strength})`;
        on.shadowBlur = blur * SHADOW_UNIT;
        on.shadowOffsetX = -across;
        on.shadowOffsetY = fall * SHADOW_UNIT;
        on.drawImage(
          from.canvas,
          from.x,
          from.y,
          from.width,
          from.height,
          across + room,
          room,
          drawn.width,
          drawn.height,
        );
        context.drawImage(on.canvas, 0, 0, across, down, 0, 0, across, down);
      },
    };
  });
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

/** The key of the sheet every front, the back, the plate, the disc and the badges are drawn into. */
export const CARDS_SHEET_KEY = 'cards';

/** A painting of a sheet drawn from the context's top-left corner, its pixels changed by `change` first. */
function paintChanged(
  context: CanvasRenderingContext2D,
  from: InSheet,
  change: (pixels: Uint8ClampedArray) => void,
): void {
  const on = blankCanvas(from.width, from.height);
  on.drawImage(from.canvas, from.x, from.y, from.width, from.height, 0, 0, from.width, from.height);
  const image = on.getImageData(0, 0, from.width, from.height);
  change(image.data);
  on.putImageData(image, 0, 0);
  context.drawImage(on.canvas, 0, 0);
}

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
        paintChanged(context, from, (pixels) => {
          const paper = papers.get(file) ?? paperOf(pixels, from.width, from.height, body);
          papers.set(file, paper);
          turned(pixels, paper, LOOK.cardFamily[family]);
        });
      },
    };
  });
}

/**
 * Every pixel's hue turned round by that many degrees, as SVG's `hueRotate` colour matrix turns it, on
 * the values as they are stored.
 */
function hueTurned(pixels: Uint8ClampedArray, degrees: number): void {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const matrix = [
    [
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
    ],
    [
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
    ],
    [
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ],
  ];
  for (let at = 0; at < pixels.length; at += 4) {
    const rgb = [pixels[at], pixels[at + 1], pixels[at + 2]];
    for (const [channel, [red, green, blue]] of matrix.entries()) {
      pixels[at + channel] = red * rgb[0] + green * rgb[1] + blue * rgb[2];
    }
  }
}

/** Each badge a unit's card reads a stat on, its hue turned as the look turns it off the pack's file. */
function badgesMade(): Made[] {
  return (Object.keys(BADGES) as BadgeStat[]).map((stat) => {
    const { file, width, height, frame } = BADGES[stat];
    return {
      frame,
      width,
      height,
      paint: (context, paintingIn) => {
        paintChanged(context, paintingIn(CARDS_SHEET_KEY, file), (pixels) =>
          hueTurned(pixels, LOOK.cardStatBadge[stat]),
        );
      },
    };
  });
}

/** The sheet the pack's files, every family's front and the badges are drawn into. */
export const CARDS_SHEET: Sheet = {
  key: CARDS_SHEET_KEY,
  files: [
    FRONTS.arched.file,
    FRONTS.oval.file,
    BACK.file,
    PLATE.file,
    DISC.file,
    ...Object.values(BADGES).map(({ file }) => file),
  ],
  made: [...frontsMade(), ...shadowsMade(), ...badgesMade()],
  side: 4096,
};
