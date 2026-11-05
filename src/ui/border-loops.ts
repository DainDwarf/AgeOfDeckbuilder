import {
  type Corner,
  cornerKey,
  cornersOf,
  sameTile,
  type TileCoords,
  tileKey,
  tilesOfEdge,
} from '../rules/map';

/** A point on the map's own surface. */
export type Point = { readonly x: number; readonly y: number };

/**
 * One stretch of a border's line, a curve of its own: the half of the curve round a corner that runs
 * along one tile's edge, from the edge's middle to the corner or from the corner to the middle.
 */
export type Stretch = {
  readonly tile: TileCoords;
  readonly from: Point;
  readonly control: Point;
  readonly to: Point;
};

/** An edge of a held tile against ground the border does not hold, from corner to corner the way its tile's corners turn. */
type Edge = { readonly tile: TileCoords; readonly from: Corner; readonly to: Corner };

function halfway(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * One loop's stretches, the edges it follows taken in order: the line through the middle of each
 * edge, each corner the control point of the curve to the next middle, that curve cut where it
 * comes nearest the corner.
 */
function curved(edges: readonly Edge[], place: (corner: Corner) => Point): Stretch[] {
  const middle = (edge: Edge): Point => halfway(place(edge.from), place(edge.to));
  return edges.flatMap((edge, at) => {
    const next = edges[(at + 1) % edges.length];
    const from = middle(edge);
    const corner = place(edge.to);
    const to = middle(next);
    const nearest = halfway(halfway(from, corner), halfway(corner, to));
    return [
      { tile: edge.tile, from, control: halfway(from, corner), to: nearest },
      { tile: next.tile, from: nearest, control: halfway(corner, to), to },
    ];
  });
}

/**
 * The border's loops around these tiles, each the stretches it runs through in order, a hole inside
 * them a loop of its own; an edge is the border's wherever the tile beyond is not among them, off
 * the map included, and the corners stand where `place` puts them.
 */
export function borderLoops(
  held: readonly TileCoords[],
  place: (corner: Corner) => Point,
): Stretch[][] {
  const holding = new Set(held.map(tileKey));
  const leaving = new Map<string, Edge>();
  for (const tile of held) {
    const corners = cornersOf(tile);
    corners.forEach((from, at) => {
      const to = corners[(at + 1) % corners.length];
      const [one, other] = tilesOfEdge(from, to);
      const beyond = sameTile(one, tile) ? other : one;
      if (!holding.has(tileKey(beyond))) leaving.set(cornerKey(from), { tile, from, to });
    });
  }

  const loops: Stretch[][] = [];
  for (const [key, start] of leaving) {
    leaving.delete(key);
    const edges = [start];
    for (
      let edge = leaving.get(cornerKey(start.to));
      edge !== undefined;
      edge = leaving.get(cornerKey(edge.to))
    ) {
      leaving.delete(cornerKey(edge.from));
      edges.push(edge);
    }
    loops.push(curved(edges, place));
  }
  return loops;
}
