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

/** The curve rounding one corner of a loop, as its two halves in the loop's order. */
export type Rounding = readonly [Curved, Curved];

function halfway(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * One loop of edges curved: the line through the middle of each edge, each corner the control point
 * of the curve to the next middle, that curve cut where it comes nearest the corner.
 */
function curved(edges: readonly Straight[]): Rounding[] {
  const middle = (edge: Straight): Point => halfway(edge.from, edge.to);
  return edges.map((edge, at) => {
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

/**
 * One edge's share of a line along every edge of some tiles: the tiles it lies between, one alone on
 * their rim, and the convex polygon it covers, from one of the edge's corners round to the other and
 * back.
 */
export type EdgePiece = {
  readonly tiles: readonly TileCoords[];
  readonly points: readonly Point[];
};

/**
 * A line that wide along every edge of these tiles, straight on the edge itself, cut into one piece
 * to each edge: the lines meeting at a corner are joined there by mitres, and the pieces share their
 * sides, so none lies over another and none leaves a gap.
 */
export function edgePieces(
  tiles: readonly TileCoords[],
  place: (corner: Corner) => Point,
  width: number,
): EdgePiece[] {
  const half = width / 2;
  /** An edge: its two corners' points, its tiles, and the two points flanking it at each corner, its first corner's first. */
  type Edge = {
    readonly from: Point;
    readonly to: Point;
    readonly tiles: TileCoords[];
    readonly flanks: { readonly before: Point; readonly after: Point }[];
  };
  /** A corner's point, and each edge leaving it with the place in that edge's flanks this corner fills. */
  type Meeting = { at: Point; ways: { edge: Edge; toward: Point; side: number }[] };
  const edges = new Map<string, Edge>();
  const corners = new Map<string, Meeting>();
  const cornerOf = (corner: Corner): Meeting => {
    const key = cornerKey(corner);
    const kept = corners.get(key) ?? { at: place(corner), ways: [] };
    corners.set(key, kept);
    return kept;
  };
  for (const tile of tiles) {
    const around = cornersOf(tile);
    around.forEach((start, at) => {
      const end = around[(at + 1) % around.length];
      const key = [cornerKey(start), cornerKey(end)].sort().join('|');
      const kept = edges.get(key);
      if (kept !== undefined) {
        kept.tiles.push(tile);
        return;
      }
      const from = cornerOf(start);
      const to = cornerOf(end);
      const edge: Edge = { from: from.at, to: to.at, tiles: [tile], flanks: [] };
      edges.set(key, edge);
      from.ways.push({ edge, toward: to.at, side: 0 });
      to.ways.push({ edge, toward: from.at, side: 1 });
    });
  }

  for (const { at, ways } of corners.values()) {
    const turning = ways
      .map((way) => ({ ...way, angle: Math.atan2(way.toward.y - at.y, way.toward.x - at.x) }))
      .sort((one, other) => one.angle - other.angle);
    const mitres = turning.map(({ angle }, index) => {
      const next = turning[(index + 1) % turning.length].angle;
      const gap = (next - angle + 2 * Math.PI) % (2 * Math.PI);
      const reach = half / Math.sin(gap / 2);
      return {
        x: at.x + reach * Math.cos(angle + gap / 2),
        y: at.y + reach * Math.sin(angle + gap / 2),
      };
    });
    turning.forEach(({ edge, side }, index) => {
      edge.flanks[side] = {
        before: mitres[(index + turning.length - 1) % turning.length],
        after: mitres[index],
      };
    });
  }

  return [...edges.values()].map(({ from, to, tiles: between, flanks: [leaving, arriving] }) => ({
    tiles: between,
    points: [from, leaving.after, arriving.before, to, arriving.after, leaving.before],
  }));
}

/** A city's border round the tiles it holds: their loops of edges, curved, corner by corner. */
export function borderLoops(
  held: readonly TileCoords[],
  place: (corner: Corner) => Point,
): Rounding[][] {
  return edgeLoops(held, place).map(curved);
}

/**
 * The stretches of curved loops that run along a tile `along` admits, each with the other half of
 * its corner's curve, so the line runs on to the middle of the edge it turns onto.
 */
export function lineAlong(
  loops: readonly Rounding[][],
  along: (tile: TileCoords) => boolean,
): Curved[] {
  return loops
    .flat()
    .filter(([one, other]) => along(one.tile) || along(other.tile))
    .flat();
}
