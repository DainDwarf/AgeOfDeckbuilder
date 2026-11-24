import type Phaser from 'phaser';
import { CENTRE, type TileCoords, tileKey } from '../rules/map';
import type { Faction } from '../rules/units';
import { LOOK } from './look';
import { sceneCanvas, tracedPolygon } from './map-fade';
import { hexagonOn, positionOf } from './map-marks';
import { type Stroke, strokedRound } from './map-path';
import { TILE_SIZE } from './marks';
import { rootedPoolOf } from './pool';

/** How wide the log's ring's line is stroked, and the dark edge under it, in the map's units. */
const LINE = 1.77;
const EDGE = 3.25;

/** How many pixels of the ring's textures make a unit. */
const RING_PIXELS = 8;

const LINE_KEY = 'log-ring-line';
const EDGE_KEY = 'log-ring-edge';

/** A tile the log's ring is worn on, and the faction whose tone it wears. */
export type Ringed = { readonly tile: TileCoords; readonly faction: Faction };

/** How far from a tile's middle the nearest of its edges stands, the lattice's squash taken in. */
function nearestEdge(): number {
  const middle = positionOf(CENTRE);
  const corners = hexagonOn(CENTRE, TILE_SIZE);
  return Math.min(
    ...corners.map((from, at) => {
      const to = corners[(at + 1) % corners.length];
      const across =
        (from.x - middle.x) * (to.y - middle.y) - (from.y - middle.y) * (to.x - middle.x);
      return Math.abs(across) / Math.hypot(to.x - from.x, to.y - from.y);
    }),
  );
}

/**
 * Paints one stroke of the ring once, round the tile's hexagon drawn in about its middle so the dark
 * edge's outer side stands on the nearest of the tile's edges.
 */
function paintRing(scene: Phaser.Scene, key: string, stroke: Stroke): void {
  const texture = sceneCanvas(scene, key, 2 * TILE_SIZE * RING_PIXELS);
  const context = texture.getContext();
  const middle = positionOf(CENTRE);
  context.setTransform(
    RING_PIXELS,
    0,
    0,
    RING_PIXELS,
    texture.width / 2 - middle.x * RING_PIXELS,
    texture.height / 2 - middle.y * RING_PIXELS,
  );
  const ring = hexagonOn(CENTRE, TILE_SIZE * (1 - EDGE / 2 / nearestEdge()));
  strokedRound(context, (on) => tracedPolygon(on, ring), [stroke]);
  texture.refresh();
}

/**
 * The log's rings on this layer, pooled: the answer rings each tile handed in its faction's tone, in
 * place of the tiles it rang before, and an empty list takes them all down.
 */
export function createLogRings(
  scene: Phaser.Scene,
  on: Phaser.GameObjects.Layer,
): (rings: readonly Ringed[]) => void {
  paintRing(scene, EDGE_KEY, { width: EDGE, colour: LOOK.mapOutline, strength: LOOK.logRingEdge });
  paintRing(scene, LINE_KEY, { width: LINE, colour: 0xffffff, strength: 1 });
  // In a container: a take sets the scale back to one, and the ring is painted larger than it shows.
  const pool = rootedPoolOf(on, () => {
    const line = scene.add.image(0, 0, LINE_KEY).setScale(1 / RING_PIXELS);
    const root = scene.add
      .container(0, 0, [scene.add.image(0, 0, EDGE_KEY).setScale(1 / RING_PIXELS), line])
      .setName('log-ring');
    return { root, line };
  });

  return (rings) => {
    pool.hide();
    for (const { tile, faction } of rings) {
      const { root, line } = pool.take();
      const { x, y } = positionOf(tile);
      root.setPosition(x, y).setData('tile', tileKey(tile));
      line.setTint(LOOK.logRing[faction]);
    }
  };
}
