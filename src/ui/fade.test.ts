import { expect, test } from 'vitest';
import { fadedAt, grownOf, haloOf } from './fade';

/** A picture `side` wide and tall, a square of `inked` pixels in its middle held and every other pixel bare. */
function squareIn(side: number, inked: number): number[] {
  const from = (side - inked) / 2;
  const holds = (at: number): boolean => at >= from && at < from + inked;
  return Array.from({ length: side * side }, (_, at) =>
    holds(at % side) && holds(Math.floor(at / side)) ? 0xff : 0,
  );
}

const SIDE = 64;
const INKED = 8;
const MIDDLE_ROW = (SIDE / 2) * SIDE;
/** The first pixel of the middle row right of the square, and how far each pixel of that row stands from the square's edge. */
const OUTSIDE = (SIDE + INKED) / 2;
const away = (x: number): number => x - OUTSIDE + 0.5;

test('lays a halo at the fade’s strength on the picture, fading out from its outline and gone past two and a half depths', () => {
  const strength = 0.9;
  const depth = 4;
  const halo = haloOf(squareIn(SIDE, INKED), SIDE, SIDE, strength, depth);
  expect(halo[MIDDLE_ROW + SIDE / 2]).toBeCloseTo(fadedAt(strength, depth, 0));
  for (const x of [OUTSIDE, OUTSIDE + 3, OUTSIDE + 7]) {
    expect(halo[MIDDLE_ROW + x]).toBeCloseTo(fadedAt(strength, depth, away(x)));
  }
  expect(halo[MIDDLE_ROW + OUTSIDE + 3]).toBeLessThan(halo[MIDDLE_ROW + OUTSIDE]);
  expect(halo[MIDDLE_ROW + OUTSIDE + 2.5 * depth + 1]).toBe(0);
});

test('grows a picture’s outline by as many pixels as asked, and covers nothing past them', () => {
  const grown = grownOf(squareIn(SIDE, INKED), SIDE, SIDE, 2);
  expect(grown[MIDDLE_ROW + SIDE / 2]).toBe(1);
  expect(grown[MIDDLE_ROW + OUTSIDE + 1]).toBe(1);
  expect(grown[MIDDLE_ROW + OUTSIDE + 3]).toBe(0);
});
