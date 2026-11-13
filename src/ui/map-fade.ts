import Phaser from 'phaser';
import { CENTRE } from '../rules/map';
import type { Point } from './border-loops';
import { fadedAt } from './fade';
import { css, LOOK } from './look';
import { hexagonOn, positionOf, SQUASH, TILE_SIZE } from './map-marks';

/** How deep the selection's rim fades in from the tile's edge, how many pixels of its texture make a unit, and how wide the texture is. */
const RIM_DEPTH = 5;
const RIM_PIXELS = 4;
const RIM_SIDE = 256;

const RIM_KEY = 'selection-rim';

/** How far to either side of a unit's painting its ring reaches, in the map's units. */
const RING_REACH = 15;

const RING_KEY = 'unit-ring';

// A texture is the game's and outlives the scene's restart (docs/PHASER.md).
/**
 * A canvas texture under `key` until the scene's shutdown, at least `span` wide and tall and a power
 * of two, or Phaser makes no mipmaps of it (docs/PHASER.md).
 */
export function sceneCanvas(
  scene: Phaser.Scene,
  key: string,
  span: number,
): Phaser.Textures.CanvasTexture {
  const side = 2 ** Math.ceil(Math.log2(span));
  const texture = scene.textures.createCanvas(key, side, side);
  if (texture === null) throw new Error(`a texture stands under ${key} already`);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.textures.remove(key));
  return texture;
}

// Not the context's `filter`: Safari ships it disabled.
/**
 * A path faded inward from its line, bell-shaped, kept inside the path alone: strokes of it widest
 * first, one to each pixel out to two and a half depths, each adding to the ones before it what
 * brings the fade to `fadedAt` there. `depth` is in the canvas's pixels.
 */
export function paintFaded(
  context: CanvasRenderingContext2D,
  trace: (context: CanvasRenderingContext2D) => void,
  colour: number,
  strength: number,
  depth: number,
): void {
  const extent = 2.5 * depth;
  const steps = Math.ceil(extent);
  context.save();
  context.beginPath();
  trace(context);
  context.clip('evenodd');
  context.beginPath();
  trace(context);
  context.lineJoin = 'round';
  context.strokeStyle = css(colour);
  let before = 0;
  for (let at = 0; at < steps; at++) {
    const outer = (extent * (steps - at)) / steps;
    const inner = (extent * (steps - at - 1)) / steps;
    const reached = fadedAt(strength, depth, (outer + inner) / 2);
    context.lineWidth = 2 * outer;
    context.globalAlpha = 1 - (1 - reached) / (1 - before);
    context.stroke();
    before = reached;
  }
  context.restore();
}

export function tracedPolygon(context: CanvasRenderingContext2D, points: readonly Point[]): void {
  context.moveTo(points[0].x, points[0].y);
  for (const { x, y } of points.slice(1)) context.lineTo(x, y);
  context.closePath();
}

/**
 * Paints the selection's rim once, the tile's hexagon faded in from its edge in the selection's
 * white at four pixels to the unit, and answers the way to make a rim of it on no tile, shown at a
 * quarter of its painting.
 */
export function selectionRims(scene: Phaser.Scene): () => Phaser.GameObjects.Image {
  const texture = sceneCanvas(scene, RIM_KEY, RIM_SIDE);
  const context = texture.getContext();
  const middle = positionOf(CENTRE);
  context.setTransform(1, 0, 0, 1, RIM_SIDE / 2 - middle.x, RIM_SIDE / 2 - middle.y);
  const hexagon = hexagonOn(CENTRE, TILE_SIZE * RIM_PIXELS);
  paintFaded(
    context,
    (on) => tracedPolygon(on, hexagon),
    LOOK.selected,
    LOOK.selectionRim,
    RIM_DEPTH * RIM_PIXELS,
  );
  texture.refresh();
  return () => scene.add.image(0, 0, RIM_KEY).setScale(1 / RIM_PIXELS);
}

/**
 * Paints a unit's ring once at four pixels to the unit, in white so a tint gives it its colour, and
 * answers the way to make one about no point, shown at a quarter of its painting.
 */
export function unitRings(scene: Phaser.Scene): () => Phaser.GameObjects.Image {
  const texture = sceneCanvas(scene, RING_KEY, 2 * RING_REACH * RIM_PIXELS);
  const context = texture.getContext();
  const middle = texture.width / 2;
  const traced = (on: CanvasRenderingContext2D): void => {
    on.ellipse(
      middle,
      middle,
      RING_REACH * RIM_PIXELS,
      RING_REACH * SQUASH * RIM_PIXELS,
      0,
      0,
      2 * Math.PI,
    );
  };
  paintFaded(context, traced, 0xffffff, LOOK.selectionRim, RIM_DEPTH * RIM_PIXELS);
  context.save();
  context.beginPath();
  traced(context);
  context.clip();
  context.beginPath();
  traced(context);
  context.lineWidth = 2 * RIM_PIXELS;
  context.strokeStyle = css(0xffffff);
  context.globalAlpha = LOOK.selectionLine;
  context.stroke();
  context.restore();
  texture.refresh();
  return () => scene.add.image(0, 0, RING_KEY).setScale(1 / RIM_PIXELS);
}
