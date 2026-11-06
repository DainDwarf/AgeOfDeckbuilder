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

/** One stretch of a loop's line, run straight from corner to corner along one tile's edge. */
export type Straight = {
  readonly kind: 'straight';
  readonly tile: TileCoords;
  readonly from: Point;
  readonly to: Point;
};

/**
 * One stretch of a loop's line, a curve of its own: the half of the curve round a corner that runs
 * along one tile's edge, from the edge's middle to the corner or from the corner to the middle.
 */
export type Curved = {
  readonly kind: 'curved';
  readonly tile: TileCoords;
  readonly from: Point;
  readonly control: Point;
  readonly to: Point;
};

export type Stretch = Straight | Curved;

function halfway(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * One loop of edges curved: the line through the middle of each edge, each corner the control point
 * of the curve to the next middle, that curve cut where it comes nearest the corner.
 */
function curved(edges: readonly Straight[]): Curved[] {
  const middle = (edge: Straight): Point => halfway(edge.from, edge.to);
  return edges.flatMap((edge, at) => {
    const next = edges[(at + 1) % edges.length];
    const from = middle(edge);
    const corner = edge.to;
    const to = middle(next);
    const nearest = halfway(halfway(from, corner), halfway(corner, to));
    return [
      { kind: 'curved', tile: edge.tile, from, control: halfway(from, corner), to: nearest },
      { kind: 'curved', tile: next.tile, from: nearest, control: halfway(corner, to), to },
    ];
  });
}

/**
 * The loops of edges around these tiles, each the edges it runs along in order, corner to corner the
 * way its tiles' corners turn, a hole inside them a loop of its own; an edge is a loop's wherever the
 * tile beyond is not among them, off the map included, and the corners stand where `place` puts them.
 */
export function edgeLoops(
  held: readonly TileCoords[],
  place: (corner: Corner) => Point,
): Straight[][] {
  const holding = new Set(held.map(tileKey));
  const leaving = new Map<string, { tile: TileCoords; from: Corner; to: Corner }>();
  for (const tile of held) {
    const corners = cornersOf(tile);
    corners.forEach((from, at) => {
      const to = corners[(at + 1) % corners.length];
      const [one, other] = tilesOfEdge(from, to);
      const beyond = sameTile(one, tile) ? other : one;
      if (!holding.has(tileKey(beyond))) leaving.set(cornerKey(from), { tile, from, to });
    });
  }

  const loops: Straight[][] = [];
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
    loops.push(
      edges.map(({ tile, from, to }) => ({
        kind: 'straight',
        tile,
        from: place(from),
        to: place(to),
      })),
    );
  }
  return loops;
}

/** A city's border round the tiles it holds: their loops of edges, curved. */
export function borderLoops(
  held: readonly TileCoords[],
  place: (corner: Corner) => Point,
): Curved[][] {
  return edgeLoops(held, place).map(curved);
}
