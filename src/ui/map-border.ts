import Phaser from 'phaser';
import { cornersOf, type TileCoords, tileKey } from '../rules/map';
import type { CityFaction } from '../rules/state';
import { borderLoops, type Point, type Stretch } from './border-loops';
import { LOOK } from './look';
import { paintFaded, sceneCanvas, tracedPolygon } from './map-fade';
import { CITY_COLOURS, CITY_FACTIONS, cornerAt, darkened, hexagonOn, TILE_SIZE } from './map-marks';

/** How wide a border's line is, and how deep its band fades inside it. */
const LINE = 1.5;
const BAND_DEPTH = 7;

/** How many points each stretch of the line is drawn through. */
const STRETCH_POINTS = 8;

/** How far past its hexagon a tile's share of the band is kept, so no seam shows where the fog meets the sight. */
const SEAM = 0.5;

const BAND_KEY = 'border-band';

/** A tile the map draws as held, and whether it draws it in fog. */
export type HeldAsDrawn = { readonly tile: TileCoords; readonly inFog: boolean };

export type BorderView = {
  /** Both cities' borders around the tiles the map draws as each one's, drawn again only where those changed. */
  paint(held: Readonly<Record<CityFaction, readonly HeldAsDrawn[]>>): void;
};

function tracedLoops(context: CanvasRenderingContext2D, loops: readonly Stretch[][]): void {
  for (const loop of loops) {
    context.moveTo(loop[0].from.x, loop[0].from.y);
    for (const { control, to } of loop) context.quadraticCurveTo(control.x, control.y, to.x, to.y);
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

/** A holder's line: every stretch of its loops, each stroked in its own colour. */
function paintLine(
  line: Phaser.GameObjects.Graphics,
  loops: readonly Stretch[][],
  colourOf: (stretch: Stretch) => number,
): void {
  line.clear();
  for (const stretch of loops.flat()) {
    // One `lineStyle` per stretch: `borderColours` in `e2e/chronicle-screen.ts` counts them.
    line.lineStyle(LINE, colourOf(stretch));
    const { from, control, to } = stretch;
    new Phaser.Curves.QuadraticBezier(vector(from), vector(control), vector(to)).draw(
      line,
      STRETCH_POINTS,
    );
  }
  line.setVisible(loops.length > 0);
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
  const corners = tiles.flatMap(cornersOf).map(cornerAt);
  const xs = corners.map(({ x }) => x);
  const ys = corners.map(({ y }) => y);
  const middle = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const texture = sceneCanvas(scene, BAND_KEY, span);
  const side = texture.width;
  const origin = { x: middle.x - side / 2, y: middle.y - side / 2 };
  const context = texture.getContext();
  const band = scene.add.image(middle.x, middle.y, BAND_KEY).setVisible(false);
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

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, side, side);
      context.setTransform(1, 0, 0, 1, -origin.x, -origin.y);
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
        paintLine(lines[whose], loops, colourOf);
        standing ||= loops.length > 0;
      }
      band.setVisible(standing);
      texture.refresh();
    },
  };
}
