import Phaser from 'phaser';
import { cornersOf, type TileCoords, tileKey } from '../rules/map';
import type { Faction } from '../rules/units';
import {
  borderLoops,
  type Curved,
  type EdgePiece,
  edgeLoops,
  edgePieces,
  lineAlong,
  type Point,
  type Stretch,
} from './border-loops';
import { LOOK } from './look';
import { paintFaded, sceneCanvas, tracedPolygon } from './map-fade';
import { cornerAt, darkened, FACTION_COLOURS, fogDark, hexagonOn, positionOf } from './map-marks';
import { TILE_SIZE } from './marks';

/** How wide a border's line is, and how deep its band fades inside it. */
const LINE = 1.5;
const BAND_DEPTH = 7;

/** How wide the reach's line is, and how deep its band fades inside it. */
const REACH_LINE = 1;
const REACH_DEPTH = 5;

/** How wide the hex grid's line is, and the dark edge under it. */
const HEX_GRID_LINE = 1.5;
const HEX_GRID_EDGE = 3;

/** How many segments each curved stretch of a line is drawn as. */
const STRETCH_SEGMENTS = 8;

/** How far past its hexagon a tile's share of the band is kept, so no seam shows where the fog meets the sight. */
const SEAM = 0.5;

const BAND_KEY = 'border-band';
const REACH_KEY = 'reach-band';
const CLAIM_KEY = 'claim-band';

/** A tile the map draws wearing a border, and whether it draws it in fog. */
export type WornAsDrawn = { readonly tile: TileCoords; readonly inFog: boolean };

export type BorderView = {
  /**
   * Each faction's border around the tiles the map draws wearing it: each city's round the tiles it
   * holds, the enemies' round their camps; drawn again only where those changed.
   */
  paint(worn: Readonly<Record<Faction, readonly WornAsDrawn[]>>): void;
};

/** The tiles a unit's reach lights, its landings and its steps, and the tile it stands on. */
export type Reach = { readonly own: TileCoords; readonly lit: readonly TileCoords[] };

export type ReachView = {
  /** The region of the tiles a unit's reach lights and its own tile, carrying the lit tiles' keys; hidden where it lights none. */
  paint(reach: Reach | undefined): void;
};

/** The tiles a city holds and the tiles it may claim. */
export type Claiming = {
  readonly held: readonly TileCoords[];
  readonly claimable: readonly TileCoords[];
};

export type ClaimMarksView = {
  /** The claim marks, carrying the claimable tiles' keys; hidden where none may be claimed. */
  paint(claiming: Claiming | undefined): void;
};

export type HexGridView = {
  /**
   * The hex grid's line on every edge, darkened by the fog where no tile along the edge is among
   * these, by key; drawn again only where that changed.
   */
  paint(inSight: ReadonlySet<string>): void;
};

function traced(context: CanvasRenderingContext2D, stretch: Stretch): void {
  switch (stretch.kind) {
    case 'straight':
      context.lineTo(stretch.to.x, stretch.to.y);
      return;
    case 'curved':
      context.quadraticCurveTo(stretch.control.x, stretch.control.y, stretch.to.x, stretch.to.y);
      return;
  }
  const unlisted: never = stretch;
  throw new Error(`no stretch runs ${JSON.stringify(unlisted)}`);
}

function tracedLoops(context: CanvasRenderingContext2D, loops: readonly Stretch[][]): void {
  for (const loop of loops) {
    context.moveTo(loop[0].from.x, loop[0].from.y);
    for (const stretch of loop) traced(context, stretch);
    context.closePath();
  }
}

/** Tiles a band is painted over, and the colour it is painted in there. */
type BandShare = { readonly tiles: readonly TileCoords[]; readonly colour: number };

/** A band: these loops faded inward, over each share's tiles in that share's colour. */
function paintBand(
  context: CanvasRenderingContext2D,
  loops: readonly Stretch[][],
  shares: readonly BandShare[],
): void {
  for (const { tiles, colour } of shares) {
    if (tiles.length === 0) continue;
    context.save();
    context.beginPath();
    for (const tile of tiles) tracedPolygon(context, hexagonOn(tile, TILE_SIZE + SEAM));
    context.clip();
    paintFaded(context, (on) => tracedLoops(on, loops), colour, LOOK.borderBand, BAND_DEPTH);
    context.restore();
  }
}

const vector = ({ x, y }: Point): Phaser.Math.Vector2 => new Phaser.Math.Vector2(x, y);

/** The points a curved stretch is drawn through: each of the curve's moved `by` along its normal, onto its tile's side. */
function movedOntoTile({ tile, from, control, to }: Curved, by: number): Phaser.Math.Vector2[] {
  const curve = new Phaser.Curves.QuadraticBezier(vector(from), vector(control), vector(to));
  const normalAt = (t: number): Phaser.Math.Vector2 => curve.getTangent(t).normalizeRightHand();
  // The tile's middle picks the side alone: the lattice is squashed, so the way to it is no normal.
  const towardTile = vector(positionOf(tile)).subtract(curve.getPoint(0.5));
  const side = Math.sign(normalAt(0.5).dot(towardTile));
  return curve.getPoints(STRETCH_SEGMENTS).map((point, at) =>
    normalAt(at / STRETCH_SEGMENTS)
      .scale(side * by)
      .add(point),
  );
}

/** A stretch stroked: a straight one on its edge, a curved one half the line's width onto its tile's side. */
function stroked(line: Phaser.GameObjects.Graphics, stretch: Stretch, width: number): void {
  switch (stretch.kind) {
    case 'straight':
      line.lineBetween(stretch.from.x, stretch.from.y, stretch.to.x, stretch.to.y);
      return;
    case 'curved':
      line.strokePoints(movedOntoTile(stretch, width / 2));
      return;
  }
  const unlisted: never = stretch;
  throw new Error(`no stretch runs ${JSON.stringify(unlisted)}`);
}

/** A line along these stretches, that wide, each stretch stroked in its own colour at that strength. */
function paintLine(
  line: Phaser.GameObjects.Graphics,
  stretches: readonly Stretch[],
  width: number,
  colourOf: (stretch: Stretch) => number,
  strength: number,
): void {
  line.clear();
  for (const stretch of stretches) {
    // One `lineStyle` per stretch: `borderColours` in `e2e/chronicle-screen.ts` counts them.
    line.lineStyle(width, colourOf(stretch), strength);
    stroked(line, stretch, width);
  }
  line.setVisible(stretches.length > 0);
}

// A Graphics strokes 2 units wide or less with neither joins nor caps (docs/PHASER.md), and below
// full strength two strokes over one point stand stronger than one: each edge's piece is filled.
/** An edge's piece filled, in triangles fanned from its first point. */
function filledPiece(graphics: Phaser.GameObjects.Graphics, { points }: EdgePiece): void {
  const [from, ...rest] = points;
  for (let at = 1; at < rest.length; at++) {
    const [one, other] = [rest[at - 1], rest[at]];
    graphics.fillTriangle(from.x, from.y, one.x, one.y, other.x, other.y);
  }
}

/**
 * The hex grid on the map's own surface, on this layer, along every edge of these tiles: the dark
 * edge, the same on every edge, and over it the line.
 */
export function createHexGrid(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
  tiles: readonly TileCoords[],
): HexGridView {
  const edge = scene.add.graphics().fillStyle(LOOK.mapOutline, LOOK.hexGridEdge);
  for (const piece of edgePieces(tiles, cornerAt, HEX_GRID_EDGE)) filledPiece(edge, piece);
  const line = scene.add.graphics();
  on.add([edge, line]);
  const pieces = edgePieces(tiles, cornerAt, HEX_GRID_LINE).map((piece) => ({
    piece,
    keys: piece.tiles.map(tileKey),
  }));

  /** What the line was last drawn from: whether each piece's edge has a tile in sight along it. */
  let drawnFrom: string | undefined;

  return {
    paint(inSight): void {
      const lit = pieces.map(({ keys }) => keys.some((key) => inSight.has(key)));
      const from = lit.map((one) => (one ? '1' : '0')).join('');
      if (from === drawnFrom) return;
      drawnFrom = from;
      line.clear();
      pieces.forEach(({ piece }, at) => {
        line.fillStyle(darkened(LOOK.selected, fogDark(!lit[at])), LOOK.hexGridLine);
        filledPiece(line, piece);
      });
    },
  };
}

/** Every point a stretch of these loops is traced through, a curved one's control among them. */
function pointsOf(loops: readonly Stretch[][]): Point[] {
  return loops.flat().flatMap((stretch): Point[] => {
    switch (stretch.kind) {
      case 'straight':
        return [stretch.from, stretch.to];
      case 'curved':
        return [stretch.from, stretch.control, stretch.to];
    }
    const unlisted: never = stretch;
    throw new Error(`no stretch runs ${JSON.stringify(unlisted)}`);
  });
}

/**
 * A canvas over the disc these tiles make, painted at a pixel to the unit, its image standing over
 * the disc; `paint` clears it, hands `draw` its context set to paint on the map's own surface, and
 * cuts the image to the box round the loops handed, inside which `draw` paints all it paints.
 */
function discCanvas(
  scene: Phaser.Scene,
  key: string,
  tiles: readonly TileCoords[],
): {
  readonly image: Phaser.GameObjects.Image;
  paint(loops: readonly Stretch[][], draw: (context: CanvasRenderingContext2D) => void): void;
} {
  const corners = tiles.flatMap(cornersOf).map(cornerAt);
  const xs = corners.map(({ x }) => x);
  const ys = corners.map(({ y }) => y);
  const middle = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const texture = sceneCanvas(scene, key, span);
  const side = texture.width;
  const origin = { x: middle.x - side / 2, y: middle.y - side / 2 };
  const context = texture.getContext();
  const image = scene.add.image(middle.x, middle.y, key);
  return {
    image,
    paint(loops, draw) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, side, side);
      context.setTransform(1, 0, 0, 1, -origin.x, -origin.y);
      draw(context);
      texture.refresh();
      const points = pointsOf(loops);
      const across = points.map(({ x }) => x - origin.x);
      const down = points.map(({ y }) => y - origin.y);
      // Drawn small, the image is read through its mipmaps, whose level-n texel spans 2^n pixels from
      // a multiple of 2^n: snapped out to 16 and 16 more, no texel up to level 4 straddles the box,
      // which the map's least zoom reaches on a window down to about 110 by 60.
      const texel = 16;
      const left = Math.max(0, texel * Math.floor(Math.min(...across) / texel) - texel);
      const top = Math.max(0, texel * Math.floor(Math.min(...down) / texel) - texel);
      const right = Math.min(side, texel * Math.ceil(Math.max(...across) / texel) + texel);
      const bottom = Math.min(side, texel * Math.ceil(Math.max(...down) / texel) + texel);
      image.setCrop(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
    },
  };
}

/** How high each faction's border is painted: the enemies' over both cities'. */
const RISE: Record<Faction, number> = { player: 0, neutral: 0, enemy: 1 };

/** Every faction, in the order its border is painted. */
const WEARERS = (Object.keys(RISE) as Faction[]).sort((one, other) => RISE[one] - RISE[other]);

/** The loops a faction's border runs round its tiles: a city's rounding every corner, the enemies' straight. */
function loopsOf(whose: Faction, tiles: readonly TileCoords[]): Stretch[][] {
  switch (whose) {
    case 'player':
    case 'neutral':
      return borderLoops(tiles, cornerAt).map((loop) => loop.flat());
    case 'enemy':
      return edgeLoops(tiles, cornerAt);
  }
}

/**
 * Every faction's border on the map's own surface, on this layer: the bands painted on one canvas
 * over the disc, at a pixel to the unit, and each faction's line over them.
 */
export function createBorder(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
  tiles: readonly TileCoords[],
): BorderView {
  const canvas = discCanvas(scene, BAND_KEY, tiles);
  const band = canvas.image.setVisible(false);
  const lines = Object.fromEntries(
    WEARERS.map((whose) => [whose, scene.add.graphics().setVisible(false)]),
  ) as Record<Faction, Phaser.GameObjects.Graphics>;
  on.add([band, ...WEARERS.map((whose) => lines[whose])]);

  /** What the border was last drawn from: each faction's tiles as the map drew them. */
  let drawnFrom: string | undefined;

  return {
    paint(worn): void {
      const from = WEARERS.map((whose) =>
        worn[whose].map(({ tile, inFog }) => `${tileKey(tile)}${inFog ? '~' : ''}`).join(' '),
      ).join('|');
      if (from === drawnFrom) return;
      drawnFrom = from;

      const loops = Object.fromEntries(
        WEARERS.map((whose) => [
          whose,
          loopsOf(
            whose,
            worn[whose].map(({ tile }) => tile),
          ),
        ]),
      ) as Record<Faction, Stretch[][]>;
      canvas.paint(
        WEARERS.flatMap((whose) => loops[whose]),
        (context) => {
          for (const whose of WEARERS) {
            paintBand(
              context,
              loops[whose],
              [false, true].map((inFog) => ({
                tiles: worn[whose].filter((drawn) => drawn.inFog === inFog).map(({ tile }) => tile),
                colour: darkened(FACTION_COLOURS[whose], fogDark(inFog)),
              })),
            );
          }
        },
      );
      for (const whose of WEARERS) {
        const fogged = new Set(
          worn[whose].filter(({ inFog }) => inFog).map(({ tile }) => tileKey(tile)),
        );
        const colourOf = (stretch: Stretch): number =>
          darkened(FACTION_COLOURS[whose], fogDark(fogged.has(tileKey(stretch.tile))));
        paintLine(lines[whose], loops[whose].flat(), LINE, colourOf, 1);
      }
      band.setVisible(WEARERS.some((whose) => loops[whose].length > 0));
    },
  };
}

/**
 * The reach on the map's own surface, in a layer of its own on this one: the band painted on one
 * canvas over the disc, at a pixel to the unit, and the line over it, straight along the region's
 * edges.
 */
export function createReach(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
  tiles: readonly TileCoords[],
): ReachView {
  const canvas = discCanvas(scene, REACH_KEY, tiles);
  const line = scene.add.graphics();
  const layer = scene.add.layer([canvas.image, line]).setVisible(false);
  on.add(layer);

  /** What the region was last drawn from: its tiles' keys. */
  let drawnFrom: string | undefined;

  return {
    paint(reach): void {
      const lit = reach?.lit ?? [];
      layer.setData('lit', lit.map(tileKey));
      layer.setVisible(lit.length > 0);
      if (reach === undefined || lit.length === 0) return;
      const region = [reach.own, ...lit];
      const from = region.map(tileKey).join(' ');
      if (from === drawnFrom) return;
      drawnFrom = from;

      const loops = edgeLoops(region, cornerAt);
      canvas.paint(loops, (context) => {
        paintFaded(
          context,
          (on) => tracedLoops(on, loops),
          LOOK.selected,
          LOOK.reachBand,
          REACH_DEPTH,
        );
      });
      paintLine(line, loops.flat(), REACH_LINE, () => LOOK.selected, LOOK.reachLine);
    },
  };
}

/**
 * The claim marks on the map's own surface, in a layer of its own on this one: the border's band
 * painted on one canvas over the disc, at a pixel to the unit, and the border's line over it, both
 * run round the tiles held and the tiles claimable together and kept to the claimable ones.
 */
export function createClaimMarks(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
  tiles: readonly TileCoords[],
): ClaimMarksView {
  const canvas = discCanvas(scene, CLAIM_KEY, tiles);
  const line = scene.add.graphics();
  const layer = scene.add.layer([canvas.image, line]).setVisible(false);
  on.add(layer);

  /** What the marks were last drawn from: the held tiles' keys and the claimable tiles'. */
  let drawnFrom: string | undefined;

  return {
    paint(claiming): void {
      const claimable = claiming?.claimable ?? [];
      layer.setData('claimable', claimable.map(tileKey));
      layer.setVisible(claimable.length > 0);
      if (claiming === undefined || claimable.length === 0) return;
      const from = [claiming.held, claimable]
        .map((group) => group.map(tileKey).join(' '))
        .join('|');
      if (from === drawnFrom) return;
      drawnFrom = from;

      const keys = new Set(claimable.map(tileKey));
      const roundings = borderLoops([...claiming.held, ...claimable], cornerAt);
      const colour = LOOK.reading.culture;
      const loops = roundings.map((loop) => loop.flat());
      canvas.paint(loops, (context) => {
        paintBand(context, loops, [{ tiles: claimable, colour }]);
      });
      const along = lineAlong(roundings, (tile) => keys.has(tileKey(tile)));
      paintLine(line, along, LINE, () => colour, 1);
    },
  };
}
