import { describe, expect, it } from 'vitest';
import { CENTRE, type Corner, cornersOf, neighbours, type TileCoords, tileKey } from '../rules/map';
import {
  borderLoops,
  type EdgePiece,
  edgeLoops,
  edgePieces,
  lineAlong,
  type Point,
  type Rounding,
  type Stretch,
} from './border-loops';

/** The lattice's own corners, standing where the lattice names them. */
const onLattice = ({ x, y }: Corner): Point => ({ x, y });

/** How many stretches of the loops each tile wears, by its key. */
function wornBy(loops: readonly Stretch[][]): Record<string, number> {
  const worn: Record<string, number> = {};
  for (const { tile } of loops.flat()) worn[tileKey(tile)] = (worn[tileKey(tile)] ?? 0) + 1;
  return worn;
}

/** Whether each stretch of a loop starts where the one before it ends, the first where the last ends. */
function closes(loop: readonly Stretch[]): boolean {
  return loop.every(({ from }, at) => {
    const before = loop[(at + loop.length - 1) % loop.length].to;
    return from.x === before.x && from.y === before.y;
  });
}

/** Each loop's stretches in its order, its corners' halves one after the other. */
function stretchesOf(loops: readonly (readonly Rounding[])[]): Stretch[][] {
  return loops.map((loop) => loop.flat());
}

describe('a city’s border', () => {
  it('runs round a lone tile as one closed line through the middle of its six edges, two stretches of it along each edge', () => {
    const roundings = borderLoops([CENTRE], onLattice);
    const loops = stretchesOf(roundings);
    const corners = cornersOf(CENTRE);
    const middles = corners.map((corner, at) => {
      const next = corners[(at + 1) % corners.length];
      return `${(corner.x + next.x) / 2},${(corner.y + next.y) / 2}`;
    });

    expect(loops).toHaveLength(1);
    expect(closes(loops[0])).toBe(true);
    expect(wornBy(loops)).toEqual({ [tileKey(CENTRE)]: 12 });
    const met = roundings[0].map(([{ from }]) => `${from.x},${from.y}`);
    expect(new Set(met)).toEqual(new Set(middles));
  });

  it('runs round a tile and the six beside it as one line, which the tile inside wears nothing of', () => {
    const held = [CENTRE, ...neighbours(CENTRE)];
    const loops = stretchesOf(borderLoops(held, onLattice));

    expect(loops).toHaveLength(1);
    expect(closes(loops[0])).toBe(true);
    expect(wornBy(loops)).toEqual(
      Object.fromEntries(neighbours(CENTRE).map((tile) => [tileKey(tile), 6])),
    );
  });

  it('runs round a hole of ground it does not hold as a line of its own, inside the line round the tiles', () => {
    const ring: TileCoords[] = neighbours(CENTRE);
    const loops = stretchesOf(borderLoops(ring, onLattice));

    expect(loops.map((loop) => loop.length).sort((a, b) => a - b)).toEqual([12, 36]);
    expect(loops.every(closes)).toBe(true);
    expect(wornBy(loops)).toEqual(Object.fromEntries(ring.map((tile) => [tileKey(tile), 8])));
  });
});

describe('a line along some of a border’s tiles', () => {
  it('runs along every edge of theirs on the loops, and on to the middle of the edge of each other tile it turns onto', () => {
    const [claimed] = neighbours(CENTRE);
    const loops = borderLoops([CENTRE, claimed], onLattice);
    const line = lineAlong(loops, (tile) => tileKey(tile) === tileKey(claimed));
    const middles = cornersOf(CENTRE).map((corner, at, corners) => {
      const next = corners[(at + 1) % corners.length];
      return `${(corner.x + next.x) / 2},${(corner.y + next.y) / 2}`;
    });
    const ends = line.flatMap(({ from, to }) => [`${from.x},${from.y}`, `${to.x},${to.y}`]);
    const loose = ends.filter((end) => ends.indexOf(end) === ends.lastIndexOf(end));

    expect(wornBy([line])).toEqual({ [tileKey(claimed)]: 10, [tileKey(CENTRE)]: 2 });
    expect(loose).toHaveLength(2);
    expect(loose.every((end) => middles.includes(end))).toBe(true);
  });
});

/** The lattice's corners squashed down as the test's own map draws them, its hexagons no longer regular. */
const squashed = ({ x, y }: Corner): Point => ({ x: x * 0.9, y: y * 0.4 });

/** A tile and the six beside it: inner corners where three edges meet, corners on the rim where two or three do. */
const FLOWER = [CENTRE, ...neighbours(CENTRE)];

/** The line's width the tests draw. */
const WIDTH = 0.2;

const keyOf = ({ x, y }: Point): string => `${x},${y}`;

/** How far a point stands from the line through two others. */
function offLine(point: Point, a: Point, b: Point): number {
  const run = { x: b.x - a.x, y: b.y - a.y };
  return Math.abs(run.x * (point.y - a.y) - run.y * (point.x - a.x)) / Math.hypot(run.x, run.y);
}

/** The pieces holding a corner, each with its two points beside the corner, before and after it. */
function aroundCorner(pieces: readonly EdgePiece[], corner: Point): [Point, Point][] {
  return pieces.flatMap(({ points }) => {
    const at = points.findIndex((point) => keyOf(point) === keyOf(corner));
    if (at < 0) return [];
    return [[points[(at + points.length - 1) % points.length], points[(at + 1) % points.length]]];
  });
}

describe('the line along every edge of some tiles', () => {
  it('runs one piece along each edge, between the tiles the edge lies between, one alone on the rim', () => {
    const pieces = edgePieces(FLOWER, squashed, WIDTH);
    const between = pieces.map(({ tiles }) => tiles.length);

    expect(pieces).toHaveLength(30);
    expect(between.filter((count) => count === 2)).toHaveLength(12);
    expect(between.filter((count) => count === 1)).toHaveLength(18);
    expect(edgePieces([CENTRE], squashed, WIDTH)).toHaveLength(6);
  });

  it('stands each piece as wide as the line, its side points half the width off its edge', () => {
    for (const { points } of edgePieces(FLOWER, squashed, WIDTH)) {
      const [from, , , to] = points;
      for (const side of [points[1], points[2], points[4], points[5]]) {
        expect(offLine(side, from, to)).toBeCloseTo(WIDTH / 2, 9);
      }
    }
  });

  it('closes the pieces meeting at a corner on it, each sharing its sides there with its neighbours and none lying over another', () => {
    const pieces = edgePieces(FLOWER, squashed, WIDTH);
    const corners = new Map(
      FLOWER.flatMap(cornersOf).map((corner) => [keyOf(squashed(corner)), squashed(corner)]),
    );

    for (const corner of corners.values()) {
      const flanks = aroundCorner(pieces, corner);
      const sides = flanks.flat().map(keyOf);
      const turned = flanks.reduce((sum, [before, after]) => {
        const one = { x: before.x - corner.x, y: before.y - corner.y };
        const other = { x: after.x - corner.x, y: after.y - corner.y };
        return (
          sum +
          Math.abs(Math.atan2(one.x * other.y - one.y * other.x, one.x * other.x + one.y * other.y))
        );
      }, 0);

      expect(flanks.length).toBeGreaterThanOrEqual(2);
      expect(sides.every((side) => sides.filter((one) => one === side).length === 2)).toBe(true);
      expect(turned).toBeCloseTo(2 * Math.PI, 9);
    }
  });
});

describe('a region’s edges', () => {
  it('run round a ring of tiles straight from corner to corner, the hole inside it a loop of its own', () => {
    const ring: TileCoords[] = neighbours(CENTRE);
    const loops = edgeLoops(ring, onLattice);
    const lattice = new Set(ring.flatMap(cornersOf).map(({ x, y }) => `${x},${y}`));

    expect(loops.map((loop) => loop.length).sort((a, b) => a - b)).toEqual([6, 18]);
    expect(loops.every(closes)).toBe(true);
    expect(wornBy(loops)).toEqual(Object.fromEntries(ring.map((tile) => [tileKey(tile), 4])));
    expect(
      loops
        .flat()
        .every(
          ({ from, to }) => lattice.has(`${from.x},${from.y}`) && lattice.has(`${to.x},${to.y}`),
        ),
    ).toBe(true);
  });
});
