import Phaser from 'phaser';
import { cornersOf, type TileCoords, tileKey } from '../rules/map';
import type { Faction } from '../rules/units';
import {
  borderLoops,
  type Curved,
  edgeLoops,
  lineAlong,
  type Point,
  type Stretch,
} from './border-loops';
import { LOOK } from './look';
import { paintFaded, sceneCanvas, tracedPolygon } from './map-fade';
import { cornerAt, darkened, FACTION_COLOURS, hexagonOn, positionOf, TILE_SIZE } from './map-marks';

/** How wide a border's line is, and how deep its band fades inside it. */
const LINE = 1.5;
const BAND_DEPTH = 7;

/** How wide the reach's line is, and how deep its band fades inside it. */
const REACH_LINE = 1;
const REACH_DEPTH = 5;

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

/** A unit's landings and the tile it stands on. */
export type Reach = { readonly own: TileCoords; readonly landings: readonly TileCoords[] };

export type ReachView = {
  /** The region of a unit's landings and its own tile, carrying the landings' keys; hidden where it has no landing. */
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

/**
 * A canvas over the disc these tiles make, painted at a pixel to the unit, its image standing over
 * the disc; `wipe` clears it and answers its context set to paint on the map's own surface.
 */
function discCanvas(
  scene: Phaser.Scene,
  key: string,
  tiles: readonly TileCoords[],
): {
  texture: Phaser.Textures.CanvasTexture;
  image: Phaser.GameObjects.Image;
  wipe: () => CanvasRenderingContext2D;
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
  return {
    texture,
    image: scene.add.image(middle.x, middle.y, key),
    wipe: () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, side, side);
      context.setTransform(1, 0, 0, 1, -origin.x, -origin.y);
      return context;
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

      const context = canvas.wipe();
      let standing = false;
      for (const whose of WEARERS) {
        const fogged = new Set(
          worn[whose].filter(({ inFog }) => inFog).map(({ tile }) => tileKey(tile)),
        );
        const colourOf = (stretch: Stretch): number =>
          darkened(FACTION_COLOURS[whose], fogged.has(tileKey(stretch.tile)));
        const loops = loopsOf(
          whose,
          worn[whose].map(({ tile }) => tile),
        );
        paintBand(
          context,
          loops,
          [false, true].map((inFog) => ({
            tiles: worn[whose].filter((drawn) => drawn.inFog === inFog).map(({ tile }) => tile),
            colour: darkened(FACTION_COLOURS[whose], inFog),
          })),
        );
        paintLine(lines[whose], loops.flat(), LINE, colourOf, 1);
        standing ||= loops.length > 0;
      }
      band.setVisible(standing);
      canvas.texture.refresh();
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
      const landings = reach?.landings ?? [];
      layer.setData('landings', landings.map(tileKey));
      layer.setVisible(landings.length > 0);
      if (reach === undefined || landings.length === 0) return;
      const region = [reach.own, ...landings];
      const from = region.map(tileKey).join(' ');
      if (from === drawnFrom) return;
      drawnFrom = from;

      const loops = edgeLoops(region, cornerAt);
      paintFaded(
        canvas.wipe(),
        (context) => tracedLoops(context, loops),
        LOOK.selected,
        LOOK.reachBand,
        REACH_DEPTH,
      );
      canvas.texture.refresh();
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
      paintBand(
        canvas.wipe(),
        roundings.map((loop) => loop.flat()),
        [{ tiles: claimable, colour }],
      );
      canvas.texture.refresh();
      const along = lineAlong(roundings, (tile) => keys.has(tileKey(tile)));
      paintLine(line, along, LINE, () => colour, 1);
    },
  };
}
