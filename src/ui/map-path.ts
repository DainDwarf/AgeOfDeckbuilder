import type Phaser from 'phaser';
import { type TileCoords, tileKey } from '../rules/map';
import { css, LOOK } from './look';
import { sceneCanvas } from './map-fade';
import { movePointsLeftMark, showMovePointsLeft, unitStandsAt } from './map-marks';
import { poolOf } from './pool';

/**
 * How far a chevron's arms reach back from its point and to either side, how wide it is stroked, and
 * how wide its dark edge is, in the map's units.
 */
const ARM = 3.75;
const LINE = 1.5;
const EDGE = 3;

/** Where along each step its chevrons stand, from the tile the step leaves. */
const ALONG = [0.3, 0.7];

/** How many pixels of the chevron's texture make a unit. */
const CHEVRON_PIXELS = 8;

const CHEVRON_KEY = 'path-chevron';

export type PathView = {
  /**
   * A unit's path over these tiles, from the one it stands on to the landing, and the move points it
   * would have left at the end; the layer carries the tiles' keys.
   */
  show(tiles: readonly TileCoords[], left: number): void;
  hide(): void;
  /** The number's text, which the map raises at its own zoom. */
  readonly number: Phaser.GameObjects.Text;
};

// A Graphics strokes 2 units wide or less without joins or caps (docs/PHASER.md): the chevron's
// round ends and round point are a canvas's.
/** Paints the chevron once, pointing along x with its point on the texture's middle. */
function paintChevron(scene: Phaser.Scene): void {
  const span = 2 * (ARM + EDGE / 2) * CHEVRON_PIXELS;
  const texture = sceneCanvas(scene, CHEVRON_KEY, span);
  const context = texture.getContext();
  const middle = texture.width / 2;
  context.setTransform(CHEVRON_PIXELS, 0, 0, CHEVRON_PIXELS, middle, middle);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(-ARM, -ARM);
  context.lineTo(0, 0);
  context.lineTo(-ARM, ARM);
  const strokes = [
    { width: EDGE, colour: LOOK.mapOutline, strength: LOOK.pathEdge },
    { width: LINE, colour: LOOK.selected, strength: LOOK.pathChevron },
  ];
  for (const { width, colour, strength } of strokes) {
    context.lineWidth = width;
    context.strokeStyle = css(colour);
    context.globalAlpha = strength;
    context.stroke();
  }
  texture.refresh();
}

/** A unit's path on the map's own surface, on this layer: its chevrons pooled, and its number. */
export function createPath(scene: Phaser.Scene, on: Phaser.GameObjects.Layer): PathView {
  paintChevron(scene);
  const left = movePointsLeftMark(scene);
  // The depth alone keeps the number over the chevrons the pool adds after it.
  on.add(left.root.setDepth(1));
  const chevrons = poolOf(on, () => scene.add.image(0, 0, CHEVRON_KEY).setName('path-chevron'));
  on.setVisible(false);

  return {
    show(tiles, points): void {
      chevrons.hide();
      for (let step = 1; step < tiles.length; step++) {
        const from = unitStandsAt(tiles[step - 1]);
        const to = unitStandsAt(tiles[step]);
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        for (const along of ALONG) {
          chevrons
            .take()
            .setScale(1 / CHEVRON_PIXELS)
            .setRotation(angle)
            .setPosition(from.x + (to.x - from.x) * along, from.y + (to.y - from.y) * along);
        }
      }
      showMovePointsLeft(left, tiles[tiles.length - 1], points);
      on.setData('path', tiles.map(tileKey)).setVisible(true);
    },

    hide(): void {
      on.setData('path', []).setVisible(false);
    },

    number: left.number,
  };
}
