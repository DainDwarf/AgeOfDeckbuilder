import { CARD_KINDS } from '../rules/cards';
import type { BadgeStat, CardFront, DecoratedColour, FrontColour, FrontWindow } from './face';
import { type KindColour, LOOK } from './look';
import { blankCanvas, type InSheet, type Made, type PaintingIn, type Sheet } from './sheet';

/** The folder chicogames' pack stands in, under the assets folder. */
const PACK = 'store/nice-card-game-template-2';

/** How wide and how tall a front's body is, the card itself, in the pack's pixels. */
export const BODY = { width: 560, height: 820 };

/** How wide a card is wherever it stands but large, in units. */
export const CARD_WIDTH = 124;

/** How wide a card shown large is, in units. */
export const LARGE_WIDTH = 380;

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
 * One of the pack's fronts: its file and its size; where its body's corner lies in it; how far its
 * frame rises above the body; its window, the box its glass lies in, its paper and the middle of its
 * first cost's disc.
 */
type Front = {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly body: PackPoint;
  readonly rises: number;
  readonly window: PackBox;
  readonly glass: PackBox;
  readonly paper: PackBox;
  readonly cost: PackPoint;
};

/** The plain front of each window: an art box's shape and every placement in it are read off it. */
export const FRONTS: Readonly<Record<FrontWindow, Front>> = {
  arched: {
    file: `${PACK}/0 - Front/Card - Classic.png`,
    width: 596,
    height: 841,
    body: { x: 18, y: 10 },
    rises: 0,
    window: { x: 68, y: 87, width: 419, height: 310 },
    glass: { x: 66, y: 76, width: 423, height: 324 },
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
    glass: { x: 106, y: -7, width: 340, height: 447 },
    paper: { x: 94, y: 530, width: 372, height: 208 },
    cost: { x: 60, y: 34 },
  },
};

/** The decorated front, laid out as the plain oval one is, its outline the plain oval one's. */
const DECORATED: Front = { ...FRONTS.oval, file: `${PACK}/0 - Front/Card 2 - Blue.png` };

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

/** Every colour a plain front is turned to. */
const FRONT_COLOURS: readonly FrontColour[] = [...CARD_KINDS, 'terrain'];

/** Every colour the decorated front is turned to. */
const DECORATED_COLOURS: readonly DecoratedColour[] = ['settle', 'terrain'];

/**
 * The windows a plain front of the colour is drawn with: a unit card's play always places its unit, a
 * hazard's and a challenge's never place a thing, and a terrain's face holds its tile.
 */
function windowsOf(colour: FrontColour): readonly FrontWindow[] {
  switch (colour) {
    case 'unit':
    case 'terrain':
      return ['oval'];
    case 'hazard':
    case 'challenge':
      return ['arched'];
    case 'settle':
    case 'building':
    case 'improvement':
    case 'action':
    case 'instant':
    case 'trophy':
      return ['arched', 'oval'];
  }
}

/**
 * The pack's front a card's front is drawn off, the frame of the cards sheet it is drawn from, and
 * the frame its shadow is.
 */
export function frontOf(
  front: CardFront,
): Front & { readonly frame: string; readonly shadow: string } {
  switch (front.front) {
    case 'plain':
      return {
        ...FRONTS[front.window],
        frame: `front-${front.colour}-${front.window}`,
        shadow: shadowFrameOf(front.window),
      };
    case 'decorated':
      return {
        ...DECORATED,
        frame: `front-decorated-${front.colour}`,
        shadow: shadowFrameOf('oval'),
      };
  }
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

/** A colour of hue, saturation and lightness, each of the last two out of one, written into `rgb`. */
function fromHsl(hue: number, saturation: number, lightness: number, rgb: Float64Array): void {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const floor = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;
  if (sector < 1) {
    red = chroma;
    green = second;
  } else if (sector < 2) {
    red = second;
    green = chroma;
  } else if (sector < 3) {
    green = chroma;
    blue = second;
  } else if (sector < 4) {
    green = second;
    blue = chroma;
  } else if (sector < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }
  rgb[0] = red + floor;
  rgb[1] = green + floor;
  rgb[2] = blue + floor;
}

/**
 * The hue in degrees, the saturation and the lightness of the pixel at that index, written into
 * `hsl`, its channels each read out of one.
 */
function hslAt(pixels: Uint8ClampedArray, at: number, hsl: Float64Array): void {
  const red = pixels[4 * at] / 0xff;
  const green = pixels[4 * at + 1] / 0xff;
  const blue = pixels[4 * at + 2] / 0xff;
  const most = Math.max(red, green, blue);
  const least = Math.min(red, green, blue);
  const lightness = (most + least) / 2;
  const spread = most - least;
  hsl[2] = lightness;
  if (spread === 0) {
    hsl[0] = 0;
    hsl[1] = 0;
    return;
  }
  hsl[1] = spread / (1 - Math.abs(2 * lightness - 1));
  const sector =
    most === red
      ? ((green - blue) / spread + 6) % 6
      : most === green
        ? (blue - red) / spread + 2
        : (red - green) / spread + 4;
  hsl[0] = sector * 60;
}

/** The colour a front is turned to. */
function colourOf(front: CardFront): KindColour {
  return LOOK.cardFront[front.colour];
}

/** The colour a window holding no painting shows: its front's hue, pale. */
export function paleOf(front: CardFront): number {
  const { hue, saturation } = colourOf(front);
  const rgb = new Float64Array(3);
  fromHsl(hue, Math.min(0.45, saturation * 0.55), 0.82, rgb);
  const [red, green, blue] = rgb.map((value) => Math.round(value * 0xff));
  return (red << 16) | (green << 8) | blue;
}

/**
 * Whether a pixel is part of a rim the body's paper stops at: see-through, near black, the rims'
 * blue-grey, or a pale highlight; `hsl` is written over.
 */
function rimAt(pixels: Uint8ClampedArray, at: number, hsl: Float64Array): boolean {
  if (pixels[4 * at + 3] < 0xff) return true;
  hslAt(pixels, at, hsl);
  const hue = hsl[0];
  const saturation = hsl[1];
  const lightness = hsl[2];
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
  const edges: PackPoint[] = [];
  for (let x = body.x; x < body.x + BODY.width; x++) {
    edges.push({ x, y: body.y }, { x, y: body.y + BODY.height - 1 });
  }
  for (let y = body.y; y < body.y + BODY.height; y++) {
    edges.push({ x: body.x, y }, { x: body.x + BODY.width - 1, y });
  }
  const hsl = new Float64Array(3);
  return walkedFrom(width, height, edges, (at) => !rimAt(pixels, at, hsl));
}

/**
 * The pixels of a front's glass and the shadow at its rim: those a walk from its window's middle
 * reaches through pixels short of fully solid.
 */
function glassOf(pixels: Uint8ClampedArray, { width, height, body, window }: Front): Uint8Array {
  const middle = {
    x: body.x + window.x + Math.floor(window.width / 2),
    y: body.y + window.y + Math.floor(window.height / 2),
  };
  return walkedFrom(width, height, [middle], (at) => pixels[4 * at + 3] < 0xff);
}

/**
 * The pixels of a file that wide and tall a walk from the starts reaches, from each pixel to the four
 * beside it, through those `passes` lets through, by their index in the file.
 */
export function walkedFrom(
  width: number,
  height: number,
  starts: readonly PackPoint[],
  passes: (at: number) => boolean,
): Uint8Array {
  const reached = new Uint8Array(width * height);
  const walk: number[] = [];
  const reach = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const at = y * width + x;
    if (reached[at] === 1 || !passes(at)) return;
    reached[at] = 1;
    walk.push(at);
  };
  for (const { x, y } of starts) reach(x, y);
  for (let at = walk.pop(); at !== undefined; at = walk.pop()) {
    const x = at % width;
    const y = (at - x) / width;
    reach(x - 1, y);
    reach(x + 1, y);
    reach(x, y - 1);
    reach(x, y + 1);
  }
  return reached;
}

/** Every pixel the mask holds drawn at the strength a card's glass stands at. */
function thinned(pixels: Uint8ClampedArray, mask: Uint8Array): void {
  for (let at = 0; at < mask.length; at++) {
    if (mask[at] === 1) pixels[4 * at + 3] = Math.round(pixels[4 * at + 3] * LOOK.cardGlass);
  }
}

/**
 * The art box of a plain front of that window, the decorated front's being the oval one's: its glass,
 * opaque white, on a canvas the size of the box its glass lies in.
 */
export function artShapeOf(window: FrontWindow, paintingIn: PaintingIn): CanvasRenderingContext2D {
  const front = FRONTS[window];
  const { file, width, body, glass: box } = front;
  const { data } = pixelsOf(paintingIn, file);
  const on = blankCanvas(box.width, box.height);
  const shape = on.createImageData(box.width, box.height);
  glassOf(data, front).forEach((held, at) => {
    if (held === 0) return;
    const x = (at % width) - body.x - box.x;
    const y = Math.floor(at / width) - body.y - box.y;
    shape.data.fill(0xff, 4 * (y * box.width + x), 4 * (y * box.width + x) + 4);
  });
  on.putImageData(shape, 0, 0);
  return on;
}

/**
 * The decorated front's body, its flames and its outer rim with it: its blue, where its gold and its
 * paper lie far off in hue.
 */
function bodyOf(pixels: Uint8ClampedArray): Uint8Array {
  const body = new Uint8Array(pixels.length / 4);
  const hsl = new Float64Array(3);
  for (let at = 0; at < body.length; at++) {
    hslAt(pixels, at, hsl);
    if (hsl[1] >= 0.15 && hsl[0] >= 170 && hsl[0] <= 260) body[at] = 1;
  }
  return body;
}

/** Pixels of a file by their index, rising, each with the saturation and lightness it is turned with. */
type Turning = {
  readonly at: Uint32Array;
  readonly saturation: Float64Array;
  readonly lightness: Float64Array;
};

/** The pixels the mask holds, each with its own saturation and lightness. */
function turningOf(pixels: Uint8ClampedArray, mask: Uint8Array): Turning {
  const count = mask.reduce((sum, held) => sum + held, 0);
  const turning = {
    at: new Uint32Array(count),
    saturation: new Float64Array(count),
    lightness: new Float64Array(count),
  };
  const hsl = new Float64Array(3);
  let next = 0;
  for (let at = 0; at < mask.length; at++) {
    if (mask[at] === 0) continue;
    hslAt(pixels, at, hsl);
    turning.at[next] = at;
    turning.saturation[next] = hsl[1];
    turning.lightness[next] = hsl[2];
    next += 1;
  }
  return turning;
}

/** The mean saturation and lightness of a turning's pixels. */
function meanOf({ saturation, lightness }: Turning): {
  readonly saturation: number;
  readonly lightness: number;
} {
  let saturations = 0;
  let lightnesses = 0;
  for (let at = 0; at < saturation.length; at++) {
    saturations += saturation[at];
    lightnesses += lightness[at];
  }
  return { saturation: saturations / saturation.length, lightness: lightnesses / lightness.length };
}

/** Every pixel of the turning turned to the colour, its grain kept. */
function turned(
  pixels: Uint8ClampedArray,
  { at, saturation, lightness }: Turning,
  colour: KindColour,
): void {
  const rgb = new Float64Array(3);
  for (let one = 0; one < at.length; one++) {
    fromHsl(
      colour.hue,
      Math.min(1, colour.saturation * (0.75 + saturation[one])),
      Math.min(1, lightness[one] * colour.darkness),
      rgb,
    );
    const offset = 4 * at[one];
    pixels[offset] = Math.round(rgb[0] * 0xff);
    pixels[offset + 1] = Math.round(rgb[1] * 0xff);
    pixels[offset + 2] = Math.round(rgb[2] * 0xff);
  }
}

/** The key of the sheet every front, the back, the plate, the disc and the badges are drawn into. */
export const CARDS_SHEET_KEY = 'cards';

/** A painting of a sheet drawn alone on a canvas of its size. */
function drawnAlone(from: InSheet): CanvasRenderingContext2D {
  const on = blankCanvas(from.width, from.height);
  on.drawImage(from.canvas, from.x, from.y, from.width, from.height, 0, 0, from.width, from.height);
  return on;
}

/** The pixels of a painting of the cards sheet, its file's, as a canvas reads them. */
export function pixelsOf(paintingIn: PaintingIn, file: string): ImageData {
  const from = paintingIn(CARDS_SHEET_KEY, file);
  return drawnAlone(from).getImageData(0, 0, from.width, from.height);
}

/** Pixels drawn from the context's top-left corner, a copy of them changed by `change` first. */
function paintChanged(
  context: CanvasRenderingContext2D,
  { data, width, height }: ImageData,
  change: (pixels: Uint8ClampedArray) => void,
): void {
  const on = blankCanvas(width, height);
  const image = new ImageData(new Uint8ClampedArray(data), width, height);
  change(image.data);
  on.putImageData(image, 0, 0);
  context.drawImage(on.canvas, 0, 0);
}

/** What `make` makes for a file, made the first time it is asked for and kept. */
function keptByFile<T>(): (file: string, make: () => T) => T {
  const kept = new Map<string, T>();
  return (file, make) => {
    const known = kept.get(file);
    if (known !== undefined) return known;
    const made = make();
    kept.set(file, made);
    return made;
  };
}

/**
 * Every plain front a face can wear, its paper turned to its colour off the pack's file; and the
 * decorated front in each of its colours, its body turned to that colour as the plain oval paper is,
 * its lightness brought to where that paper's stands; each with its glass thinned.
 */
function frontsMade(): Made[] {
  const images = keptByFile<ImageData>();
  const imageOf = (paintingIn: PaintingIn, { file }: Front): ImageData =>
    images(file, () => pixelsOf(paintingIn, file));
  const glasses = keptByFile<Uint8Array>();
  const glassIn = (paintingIn: PaintingIn, front: Front): Uint8Array =>
    glasses(front.file, () => glassOf(imageOf(paintingIn, front).data, front));
  const papers = keptByFile<Turning>();
  const paperIn = (paintingIn: PaintingIn, front: Front): Turning =>
    papers(front.file, () => {
      const { data } = imageOf(paintingIn, front);
      return turningOf(data, paperOf(data, front.width, front.height, front.body));
    });
  const bodies = keptByFile<Turning>();
  const bodyIn = (paintingIn: PaintingIn, front: Front): Turning =>
    bodies(front.file, () => {
      const { data } = imageOf(paintingIn, front);
      const own = turningOf(data, bodyOf(data));
      const paper = meanOf(paperIn(paintingIn, FRONTS.oval));
      const { lightness } = meanOf(own);
      return {
        at: own.at,
        saturation: own.saturation.map(() => paper.saturation),
        lightness: own.lightness.map((one) => (one * paper.lightness) / lightness),
      };
    });
  const plain = FRONT_COLOURS.flatMap((colour) =>
    windowsOf(colour).map((window): Made => {
      const front: CardFront = { front: 'plain', colour, window };
      const shape = frontOf(front);
      return {
        frame: shape.frame,
        width: shape.width,
        height: shape.height,
        paint: (context, paintingIn) =>
          paintChanged(context, imageOf(paintingIn, shape), (pixels) => {
            turned(pixels, paperIn(paintingIn, shape), colourOf(front));
            thinned(pixels, glassIn(paintingIn, shape));
          }),
      };
    }),
  );
  const decorated = DECORATED_COLOURS.map((colour): Made => {
    const front: CardFront = { front: 'decorated', colour };
    const shape = frontOf(front);
    return {
      frame: shape.frame,
      width: shape.width,
      height: shape.height,
      paint: (context, paintingIn) =>
        paintChanged(context, imageOf(paintingIn, shape), (pixels) => {
          turned(pixels, bodyIn(paintingIn, shape), colourOf(front));
          thinned(pixels, glassIn(paintingIn, shape));
        }),
    };
  });
  return [...plain, ...decorated];
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
        paintChanged(context, pixelsOf(paintingIn, file), (pixels) =>
          hueTurned(pixels, LOOK.cardStatBadge[stat]),
        );
      },
    };
  });
}

/** The sheet the pack's files, every front a card wears and the badges are drawn into. */
export const CARDS_SHEET: Sheet = {
  key: CARDS_SHEET_KEY,
  files: [
    FRONTS.arched.file,
    FRONTS.oval.file,
    DECORATED.file,
    BACK.file,
    PLATE.file,
    DISC.file,
    ...Object.values(BADGES).map(({ file }) => file),
  ],
  made: [...frontsMade(), ...shadowsMade(), ...badgesMade()],
  side: 4096,
};
