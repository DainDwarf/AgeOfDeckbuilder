import {
  BACK,
  BADGES,
  BODY,
  BODY_RADIUS,
  DISC,
  FRONTS,
  frontOf,
  type PackPoint,
  pixelsOf,
  walkedFrom,
} from './card-frames';
import type { Box } from './design-space';
import {
  BADGE_STATS,
  type BadgeStat,
  type CardFront,
  type FrontWindow,
  frontWindowOf,
} from './face';
import type { PaintingIn } from './sheet';

/** How many units one of the pack's pixels is across a card that wide. */
export function unitOf(width: number): number {
  return width / BODY.width;
}

/** The card's height at that width: the one aspect a card is drawn at, wherever it is drawn. */
export function heightOf(width: number): number {
  return Math.round(BODY.height * unitOf(width));
}

/** How many units one of the pack's pixels is down a card that wide, its body drawn `heightOf` tall. */
export function downOf(width: number): number {
  return heightOf(width) / BODY.height;
}

/** Where a point of the pack's pixels, from a body's top-left corner, stands on a face that wide, about its bottom centre. */
export function onFace(width: number, { x, y }: PackPoint): { x: number; y: number } {
  return { x: -width / 2 + x * unitOf(width), y: -heightOf(width) + y * downOf(width) };
}

/** Where the middle of a face's cost's disc stands, the `at`th down from the first. */
export function costAt(front: CardFront, at: number): PackPoint {
  const { cost } = frontOf(front);
  return { x: cost.x, y: cost.y + at * DISC.below };
}

/** Where the middle of each badge's number stands on a unit's card, the damage's mirroring the health's. */
export const BADGE_AT: Readonly<Record<BadgeStat, PackPoint>> = {
  damage: { x: BODY.width - DISC.influence.x, y: DISC.influence.y },
  health: DISC.influence,
};

/**
 * The pixels a picture draws solid, by their index in it, row by row: every one a walk from its
 * edges through the pixels short of fully solid does not reach, what its rims close in among them.
 */
export type Solid = {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
};

/** The solid pixels of a picture of that width and height, its colours handed four channels to a pixel. */
export function solidOf(colours: Uint8ClampedArray, width: number, height: number): Solid {
  const edges: PackPoint[] = [];
  for (let x = 0; x < width; x++) edges.push({ x, y: 0 }, { x, y: height - 1 });
  for (let y = 0; y < height; y++) edges.push({ x: 0, y }, { x: width - 1, y });
  const outside = walkedFrom(width, height, edges, (at) => colours[4 * at + 3] < 0xff);
  return { width, height, pixels: outside.map((reached) => 1 - reached) };
}

/** Whether a point of a picture, in its pixels from its top-left corner, lands on a solid one. */
function solidAt({ width, height, pixels }: Solid, x: number, y: number): boolean {
  const across = Math.floor(x);
  const down = Math.floor(y);
  if (across < 0 || down < 0 || across >= width || down >= height) return false;
  return pixels[down * width + across] === 1;
}

/** The solid pixels of every picture a face and a back are drawn from. */
export type Silhouettes = {
  readonly fronts: Readonly<Record<FrontWindow, Solid>>;
  readonly disc: Solid;
  readonly badges: Readonly<Record<BadgeStat, Solid>>;
  readonly back: Solid;
};

/** The silhouettes read off the pack's files as the cards sheet holds them. */
export function silhouettesIn(paintingIn: PaintingIn): Silhouettes {
  const read = (file: string): Solid => {
    const { data, width, height } = pixelsOf(paintingIn, file);
    return solidOf(data, width, height);
  };
  return {
    fronts: { arched: read(FRONTS.arched.file), oval: read(FRONTS.oval.file) },
    disc: read(DISC.file),
    badges: { damage: read(BADGES.damage.file), health: read(BADGES.health.file) },
    back: read(BACK.file),
  };
}

/** A point, its two coordinates. */
type Point = { readonly x: number; readonly y: number };

/** Whether a point lies in the box, its corners rounded that far, its edges included. */
export function inRoundedBox({ x, y }: Point, box: Box, radius: number): boolean {
  if (x < box.x || y < box.y || x > box.x + box.width || y > box.y + box.height) return false;
  const across = Math.max(0, box.x + radius - x, x - (box.x + box.width - radius));
  const down = Math.max(0, box.y + radius - y, y - (box.y + box.height - radius));
  return across * across + down * down <= radius * radius;
}

/**
 * Whether a point of a picture of a card's front or back, in its pixels, lands on what it draws: its
 * body, the corner handed, reaching that many pixels further down, or up where the reach is negative,
 * or the rest of what it draws solid.
 */
function pictureDrawsAt(solid: Solid, body: PackPoint, at: Point, reach: number): boolean {
  const box = {
    x: body.x,
    y: body.y + Math.min(reach, 0),
    width: BODY.width,
    height: BODY.height + Math.abs(reach),
  };
  return inRoundedBox(at, box, BODY_RADIUS) || solidAt(solid, at.x, at.y);
}

/** Whether a point of a front's picture, in its pixels, lands on what it draws. */
export function frontDrawsAt(silhouettes: Silhouettes, front: CardFront, at: Point): boolean {
  const window = frontWindowOf(front);
  return pictureDrawsAt(silhouettes.fronts[window], FRONTS[window].body, at, 0);
}

/**
 * A point of a card's own space, about its bottom centre at a card that wide, in the pixels of the
 * picture its front or back is drawn off, that picture's body's top-left corner at `body`.
 */
function inPicture(width: number, body: PackPoint, { x, y }: Point): Point {
  return {
    x: (x + width / 2) / unitOf(width) + body.x,
    y: (y + heightOf(width)) / downOf(width) + body.y,
  };
}

/** Whether a point of a back's own space, about its bottom centre at a card that wide, lands on what it draws. */
export function backDrawsAt(silhouettes: Silhouettes, width: number, at: Point): boolean {
  return pictureDrawsAt(silhouettes.back, BACK.body, inPicture(width, BACK.body, at), 0);
}

/** How much the pack's disc, and a badge with it, is scaled by on a card that wide, the disc's picture that wide. */
export function discScaleOf(width: number, pictured: number): number {
  return (DISC.width * unitOf(width)) / pictured;
}

/**
 * What a face has laid that reaches past its body: the front it wears, the middle of each disc it
 * shows, and whether it shows its badges.
 */
export type Laid = {
  readonly front: CardFront;
  readonly discs: readonly PackPoint[];
  readonly badged: boolean;
};

/**
 * Whether a point of a face's own space, about its bottom centre at a card that wide, lands on what
 * it has laid: its body, reaching that much further down, or up where the reach is negative, its
 * front, each disc and each badge.
 */
export function cardDrawsAt(
  silhouettes: Silhouettes,
  { front, discs, badged }: Laid,
  width: number,
  at: Point,
  reach = 0,
): boolean {
  const unit = unitOf(width);
  const down = downOf(width);
  const window = frontWindowOf(front);
  const { body } = FRONTS[window];
  const inFront = inPicture(width, body, at);
  if (pictureDrawsAt(silhouettes.fronts[window], body, inFront, reach / down)) return true;

  const { disc } = silhouettes;
  const scale = discScaleOf(width, disc.width);
  const pictured = (solid: Solid, middle: PackPoint, origin: Point): boolean =>
    solidAt(
      solid,
      (at.x + width / 2 - middle.x * unit) / scale + origin.x,
      (at.y + heightOf(width) - middle.y * down) / scale + origin.y,
    );
  const discMiddle = { x: disc.width / 2, y: disc.height / 2 };
  if (discs.some((middle) => pictured(disc, middle, discMiddle))) return true;
  return (
    badged &&
    BADGE_STATS.some((stat) =>
      pictured(silhouettes.badges[stat], BADGE_AT[stat], BADGES[stat].number),
    )
  );
}
