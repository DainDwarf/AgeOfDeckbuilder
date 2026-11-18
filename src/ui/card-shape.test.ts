import { describe, expect, it } from 'vitest';
import { BACK, BADGES, BODY, BODY_RADIUS, CARD_WIDTH, FRONTS } from './card-frames';
import {
  BADGE_AT,
  cardDrawsAt,
  costAt,
  discScaleOf,
  downOf,
  heightOf,
  inRoundedBox,
  type Laid,
  type Silhouettes,
  type Solid,
  solidOf,
  unitOf,
} from './card-shape';

/** A picture that wide and tall, solid where `solid` says and see-through everywhere else. */
function pictured(width: number, height: number, solid: (x: number, y: number) => boolean): Solid {
  const colours = new Uint8ClampedArray(4 * width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (solid(x + 0.5, y + 0.5)) colours[4 * (y * width + x) + 3] = 0xff;
    }
  }
  return solidOf(colours, width, height);
}

/** Whether a point lies in the ellipse about that middle, that wide and tall either side of it. */
function inEllipse(
  x: number,
  y: number,
  middle: { x: number; y: number },
  across: number,
  down: number,
) {
  return ((x - middle.x) / across) ** 2 + ((y - middle.y) / down) ** 2 <= 1;
}

/** A front laid as the pack's oval one: its rounded body, and a rim rising round its window above it. */
const OVAL = FRONTS.oval;
const ovalFront = pictured(OVAL.width, OVAL.height, (x, y) => {
  const body = { x: OVAL.body.x, y: OVAL.body.y, width: BODY.width, height: BODY.height };
  const rim = { x: OVAL.body.x + BODY.width / 2, y: OVAL.body.y + 200 };
  return inRoundedBox({ x, y }, body, BODY_RADIUS) || inEllipse(x, y, rim, 160, 200 + OVAL.rises);
});

/** A disc filling the middle of its picture, and a badge filling the box its picture is painted in. */
const DISC_PICTURE = { width: 305, height: 298 };
const badgeOf = ({ painted }: (typeof BADGES)[keyof typeof BADGES]): Solid =>
  pictured(304, 298, (x, y) =>
    inEllipse(
      x,
      y,
      { x: painted.x + painted.width / 2, y: painted.y + painted.height / 2 },
      painted.width / 2,
      painted.height / 2,
    ),
  );

const SILHOUETTES: Silhouettes = {
  fronts: { oval: ovalFront, arched: ovalFront },
  disc: pictured(DISC_PICTURE.width, DISC_PICTURE.height, (x, y) =>
    inEllipse(x, y, { x: DISC_PICTURE.width / 2, y: DISC_PICTURE.height / 2 }, 110, 110),
  ),
  badges: { damage: badgeOf(BADGES.damage), health: badgeOf(BADGES.health) },
  back: pictured(BACK.body.x + BODY.width, BACK.body.y + BODY.height, () => false),
};

/** A face through the oval window, laying the discs handed, and its badges where told. */
function laidAs(discs: Laid['discs'], badged: boolean): Laid {
  return { front: { front: 'plain', colour: 'unit', window: 'oval' }, discs, badged };
}

const BADGED = laidAs([], true);
const BARE = laidAs([], false);

const WIDTH = CARD_WIDTH;
const HEIGHT = heightOf(WIDTH);

/** A point of a face's own space at a point of the pack's pixels, from its body's top-left corner. */
function at(x: number, y: number): { x: number; y: number } {
  return { x: -WIDTH / 2 + x * unitOf(WIDTH), y: -HEIGHT + y * downOf(WIDTH) };
}

describe('a card’s face', () => {
  it('takes the pointer on the rim rising above its top, and not beside it', () => {
    const rim = at(BODY.width / 2, -OVAL.rises / 2);
    const beside = at(BODY.width - 30, -OVAL.rises / 4);

    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, rim)).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, beside)).toBe(false);
  });

  it('takes the pointer on its body and not in the cut-off of a rounded corner', () => {
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, at(BODY.width / 2, BODY.height / 2))).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, at(2, BODY.height - 2))).toBe(false);
  });

  it('takes the pointer on a disc it lays rising above its top, and not where it lays none', () => {
    const first = costAt(BARE.front, 0);
    const over = at(first.x, -OVAL.rises / 4);

    expect(cardDrawsAt(SILHOUETTES, laidAs([first], false), WIDTH, over)).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, over)).toBe(false);
  });

  it('takes the pointer on the swords past its left edge where it shows its badges, and not where it shows none', () => {
    const swords = BADGES.damage;
    const middle = swords.painted.y + swords.painted.height / 2 - swords.number.y;
    const scale = discScaleOf(WIDTH, DISC_PICTURE.width) / downOf(WIDTH);
    const pastEdge = at(-6, BADGE_AT.damage.y + middle * scale);

    expect(pastEdge.x).toBeLessThan(-WIDTH / 2);
    expect(cardDrawsAt(SILHOUETTES, BADGED, WIDTH, pastEdge)).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, pastEdge)).toBe(false);
  });

  it('takes the pointer under its foot as far as its body is made to reach, and no further', () => {
    const under = at(BODY.width / 2, BODY.height + 10);

    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, under)).toBe(false);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, under, 4)).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, at(BODY.width / 2, BODY.height + 30), 4)).toBe(
      false,
    );
  });

  it('takes the pointer over its top beside its rim as far as its body is made to reach up, and no further', () => {
    const over = at(BODY.width / 2 + 200, -10);

    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, over)).toBe(false);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, over, -4)).toBe(true);
    expect(cardDrawsAt(SILHOUETTES, BARE, WIDTH, at(BODY.width / 2 + 200, -30), -4)).toBe(false);
  });
});
