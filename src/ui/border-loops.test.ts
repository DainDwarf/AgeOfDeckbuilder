import { describe, expect, it } from 'vitest';
import { CENTRE, type Corner, cornersOf, neighbours, type TileCoords, tileKey } from '../rules/map';
import {
  borderLoops,
  edgeLoops,
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
