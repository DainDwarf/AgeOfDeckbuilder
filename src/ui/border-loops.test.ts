import { describe, expect, it } from 'vitest';
import { CENTRE, type Corner, cornersOf, neighbours, type TileCoords, tileKey } from '../rules/map';
import { borderLoops, type Point, type Stretch } from './border-loops';

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

describe('a city’s border', () => {
  it('runs round a lone tile as one closed line through the middle of its six edges, two stretches of it along each edge', () => {
    const loops = borderLoops([CENTRE], onLattice);
    const corners = cornersOf(CENTRE);
    const middles = corners.map((corner, at) => {
      const next = corners[(at + 1) % corners.length];
      return `${(corner.x + next.x) / 2},${(corner.y + next.y) / 2}`;
    });

    expect(loops).toHaveLength(1);
    expect(closes(loops[0])).toBe(true);
    expect(wornBy(loops)).toEqual({ [tileKey(CENTRE)]: 12 });
    const met = loops[0].filter((_, at) => at % 2 === 0).map(({ from }) => `${from.x},${from.y}`);
    expect(new Set(met)).toEqual(new Set(middles));
  });

  it('runs round a tile and the six beside it as one line, which the tile inside wears nothing of', () => {
    const held = [CENTRE, ...neighbours(CENTRE)];
    const loops = borderLoops(held, onLattice);

    expect(loops).toHaveLength(1);
    expect(closes(loops[0])).toBe(true);
    expect(wornBy(loops)).toEqual(
      Object.fromEntries(neighbours(CENTRE).map((tile) => [tileKey(tile), 6])),
    );
  });

  it('runs round a hole of ground it does not hold as a line of its own, inside the line round the tiles', () => {
    const ring: TileCoords[] = neighbours(CENTRE);
    const loops = borderLoops(ring, onLattice);

    expect(loops.map((loop) => loop.length).sort((a, b) => a - b)).toEqual([12, 36]);
    expect(loops.every(closes)).toBe(true);
    expect(wornBy(loops)).toEqual(Object.fromEntries(ring.map((tile) => [tileKey(tile), 8])));
  });
});
