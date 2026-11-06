import Phaser from 'phaser';
import { cornersOf, type TileCoords, tileKey } from '../rules/map';
import type { CityFaction } from '../rules/state';
import { borderLoops, edgeLoops, type Point, type Stretch } from './border-loops';
import { LOOK } from './look';
import { paintFaded, sceneCanvas, tracedPolygon } from './map-fade';
import { CITY_COLOURS, CITY_FACTIONS, cornerAt, darkened, hexagonOn, TILE_SIZE } from './map-marks';

/** How wide a border's line is, and how deep its band fades inside it. */
const LINE = 1.5;
const BAND_DEPTH = 7;

/** How wide the reach's line is, and how deep its band fades inside it. */
const REACH_LINE = 1;
const REACH_DEPTH = 5;

/** How many points each curved stretch of a line is drawn through. */
const STRETCH_POINTS = 8;

/** How far past its hexagon a tile's share of the band is kept, so no seam shows where the fog meets the sight. */
const SEAM = 0.5;

const BAND_KEY = 'border-band';
const REACH_KEY = 'reach-band';

/** A tile the map draws as held, and whether it draws it in fog. */
export type HeldAsDrawn = { readonly tile: TileCoords; readonly inFog: boolean };

export type BorderView = {
  /** Both cities' borders around the tiles the map draws as each one's, drawn again only where those changed. */
  paint(held: Readonly<Record<CityFaction, readonly HeldAsDrawn[]>>): void;
};

/** A unit's landings and the tile it stands on. */
export type Reach = { readonly own: TileCoords; readonly landings: readonly TileCoords[] };

export type ReachView = {
  /** The region of a unit's landings and its own tile, carrying the landings' keys; hidden where it has no landing. */
  paint(reach: Reach | undefined): void;
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

/**
 * A holder's band: its loops faded inward in its colour, once over the tiles it holds in sight and
 * once, darkened, over the ones it holds in fog.
 */
function paintBand(
  context: CanvasRenderingContext2D,
  loops: readonly Stretch[][],
  held: readonly HeldAsDrawn[],
  colour: number,
): void {
  for (const inFog of [false, true]) {
    const tiles = held.filter((drawn) => drawn.inFog === inFog);
    if (tiles.length === 0) continue;
    context.save();
    context.beginPath();
    for (const { tile } of tiles) tracedPolygon(context, hexagonOn(tile, TILE_SIZE + SEAM));
    context.clip();
    paintFaded(
      context,
      (on) => tracedLoops(on, loops),
      darkened(colour, inFog),
      LOOK.borderBand,
      BAND_DEPTH,
    );
    context.restore();
  }
}

const vector = ({ x, y }: Point): Phaser.Math.Vector2 => new Phaser.Math.Vector2(x, y);

function stroked(line: Phaser.GameObjects.Graphics, stretch: Stretch): void {
  switch (stretch.kind) {
    case 'straight':
      line.lineBetween(stretch.from.x, stretch.from.y, stretch.to.x, stretch.to.y);
      return;
    case 'curved': {
      const { from, control, to } = stretch;
      new Phaser.Curves.QuadraticBezier(vector(from), vector(control), vector(to)).draw(
        line,
        STRETCH_POINTS,
      );
      return;
    }
  }
  const unlisted: never = stretch;
  throw new Error(`no stretch runs ${JSON.stringify(unlisted)}`);
}

/** A line along every stretch of these loops, that wide, each stretch stroked in its own colour at that strength. */
function paintLine(
  line: Phaser.GameObjects.Graphics,
  loops: readonly Stretch[][],
  width: number,
  colourOf: (stretch: Stretch) => number,
  strength: number,
): void {
  line.clear();
  for (const stretch of loops.flat()) {
    // One `lineStyle` per stretch: `borderColours` in `e2e/chronicle-screen.ts` counts them.
    line.lineStyle(width, colourOf(stretch), strength);
    stroked(line, stretch);
  }
  line.setVisible(loops.length > 0);
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

/**
 * Both cities' borders on the map's own surface, on this layer: the band painted on one canvas over
 * the disc, at a pixel to the unit, and each holder's line over it.
 */
export function createBorder(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
  tiles: readonly TileCoords[],
): BorderView {
  const canvas = discCanvas(scene, BAND_KEY, tiles);
  const band = canvas.image.setVisible(false);
  const lines = Object.fromEntries(
    CITY_FACTIONS.map((whose) => [whose, scene.add.graphics().setVisible(false)]),
  ) as Record<CityFaction, Phaser.GameObjects.Graphics>;
  on.add([band, ...CITY_FACTIONS.map((whose) => lines[whose])]);

  /** What the border was last drawn from: each holder's tiles as the map drew them. */
  let drawnFrom: string | undefined;

  return {
    paint(held): void {
      const from = CITY_FACTIONS.map((whose) =>
        held[whose].map(({ tile, inFog }) => `${tileKey(tile)}${inFog ? '~' : ''}`).join(' '),
      ).join('|');
      if (from === drawnFrom) return;
      drawnFrom = from;

      const context = canvas.wipe();
      let standing = false;
      for (const whose of CITY_FACTIONS) {
        const fogged = new Set(
          held[whose].filter(({ inFog }) => inFog).map(({ tile }) => tileKey(tile)),
        );
        const colourOf = (stretch: Stretch): number =>
          darkened(CITY_COLOURS[whose], fogged.has(tileKey(stretch.tile)));
        const loops = borderLoops(
          held[whose].map(({ tile }) => tile),
          cornerAt,
        );
        paintBand(context, loops, held[whose], CITY_COLOURS[whose]);
        paintLine(lines[whose], loops, LINE, colourOf, 1);
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
      paintLine(line, loops, REACH_LINE, () => LOOK.selected, LOOK.reachLine);
    },
  };
}
