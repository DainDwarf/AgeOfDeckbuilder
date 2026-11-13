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

/** How far from the attacking unit's middle the attack's arrow starts, and how far short of the attacked unit's middle its point stops. */
const ARROW_START = 11;
const ARROW_STOP = 12;

/** How many pixels of the chevron's texture and of the arrow's make a unit. */
const CHEVRON_PIXELS = 8;

const CHEVRON_KEY = 'path-chevron';
const ARROW_KEY = 'attack-arrow';

/** How tall the chevron's texture and the arrow's are painted, in the map's units, across the way they point. */
const ACROSS = 2 * (ARM + EDGE / 2);

export type PathView = {
  /**
   * A unit's path over these tiles, from the one it stands on to the landing, and the move points it
   * would have left at the end, in place of the attack; the layer carries the tiles' keys.
   */
  showPath(tiles: readonly TileCoords[], left: number): void;
  /**
   * A unit's attack from its tile on the unit standing on the other, its arrow, in place of the path;
   * the layer carries the two tiles' keys.
   */
  showAttack(from: TileCoords, to: TileCoords): void;
  /**
   * A unit's path to the tile it would attack from with the move points it would have left there,
   * and its attack from that tile, as `showPath` and `showAttack` draw each.
   */
  showStepAndAttack(tiles: readonly TileCoords[], left: number, to: TileCoords): void;
  /** Neither the path nor the attack. */
  hide(): void;
  /** The number's text, which the map raises at its own zoom. */
  readonly number: Phaser.GameObjects.Text;
};

// A Graphics strokes 2 units wide or less without joins or caps (docs/PHASER.md): the chevron's and
// the arrow's round ends and round joins are a canvas's.
/**
 * Strokes what is traced on the context as the path's chevrons are stroked: the map's dark outline
 * under a line in that colour, round at its ends and joins, in one stroke each.
 */
function strokedAsPath(
  context: CanvasRenderingContext2D,
  trace: (context: CanvasRenderingContext2D) => void,
  colour: number,
): void {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  trace(context);
  const strokes = [
    { width: EDGE, colour: LOOK.mapOutline, strength: LOOK.pathEdge },
    { width: LINE, colour, strength: LOOK.pathChevron },
  ];
  for (const { width, colour, strength } of strokes) {
    context.lineWidth = width;
    context.strokeStyle = css(colour);
    context.globalAlpha = strength;
    context.stroke();
  }
}

/** A chevron's arms, pointing along x, its point at that x on the axis. */
function tracedChevron(context: CanvasRenderingContext2D, point: number): void {
  context.moveTo(point - ARM, -ARM);
  context.lineTo(point, 0);
  context.lineTo(point - ARM, ARM);
}

/** Paints the chevron once, pointing along x with its point on the texture's middle. */
function paintChevron(scene: Phaser.Scene): void {
  const texture = sceneCanvas(scene, CHEVRON_KEY, ACROSS * CHEVRON_PIXELS);
  const context = texture.getContext();
  const middle = texture.width / 2;
  context.setTransform(CHEVRON_PIXELS, 0, 0, CHEVRON_PIXELS, middle, middle);
  strokedAsPath(context, (on) => tracedChevron(on, 0), LOOK.selected);
  texture.refresh();
}

/**
 * The attack's arrow: an image of a canvas painted again for each length it is asked for, pointing
 * along x about the texture's middle, a chevron at its point.
 */
function createArrow(scene: Phaser.Scene): {
  readonly image: Phaser.GameObjects.Image;
  paint(length: number): void;
} {
  const texture = sceneCanvas(scene, ARROW_KEY, ACROSS * CHEVRON_PIXELS);
  const image = scene.add
    .image(0, 0, ARROW_KEY)
    .setName('attack-arrow')
    .setScale(1 / CHEVRON_PIXELS)
    .setVisible(false);
  /** The length the canvas holds an arrow of, and none until it holds one. */
  let painted: number | undefined;

  return {
    image,
    paint(length): void {
      if (length === painted) return;
      painted = length;
      // A power of two along both sides, or Phaser makes no mipmaps of it (docs/PHASER.md).
      const width = 2 ** Math.ceil(Math.log2((length + 2 * EDGE) * CHEVRON_PIXELS));
      if (width !== texture.width) {
        texture.setSize(width, texture.height);
        // The image takes its size from its frame only when it is handed one again.
        image.setTexture(ARROW_KEY);
      }
      const context = texture.getContext();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, texture.width, texture.height);
      context.setTransform(
        CHEVRON_PIXELS,
        0,
        0,
        CHEVRON_PIXELS,
        texture.width / 2,
        texture.height / 2,
      );
      strokedAsPath(
        context,
        (on) => {
          on.moveTo(-length / 2, 0);
          on.lineTo(length / 2, 0);
          tracedChevron(on, length / 2);
        },
        LOOK.attack,
      );
      texture.refresh();
    },
  };
}

/**
 * A unit's path and its attack on the map's own surface, on this layer: the path's chevrons pooled
 * and its number, and the attack's arrow.
 */
export function createPath(scene: Phaser.Scene, on: Phaser.GameObjects.Layer): PathView {
  paintChevron(scene);
  const left = movePointsLeftMark(scene);
  const arrow = createArrow(scene);
  // The depth alone keeps the number over the chevrons the pool adds after it.
  on.add([arrow.image, left.root.setDepth(1)]);
  const chevrons = poolOf(on, () => scene.add.image(0, 0, CHEVRON_KEY).setName('path-chevron'));

  const hide = (): void => {
    chevrons.hide();
    left.root.setVisible(false);
    arrow.image.setVisible(false);
    on.setData({ path: [], attack: [] });
  };
  hide();

  const drawPath = (tiles: readonly TileCoords[], points: number): void => {
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
    on.setData('path', tiles.map(tileKey));
  };

  const drawAttack = (from: TileCoords, to: TileCoords): void => {
    const start = unitStandsAt(from);
    const end = unitStandsAt(to);
    const span = Math.hypot(end.x - start.x, end.y - start.y);
    const way = { x: (end.x - start.x) / span, y: (end.y - start.y) / span };
    const tail = { x: start.x + way.x * ARROW_START, y: start.y + way.y * ARROW_START };
    const point = { x: end.x - way.x * ARROW_STOP, y: end.y - way.y * ARROW_STOP };
    arrow.paint(span - ARROW_START - ARROW_STOP);
    arrow.image
      .setPosition((tail.x + point.x) / 2, (tail.y + point.y) / 2)
      .setRotation(Math.atan2(way.y, way.x))
      .setVisible(true);
    on.setData('attack', [tileKey(from), tileKey(to)]);
  };

  return {
    showPath(tiles, points): void {
      hide();
      drawPath(tiles, points);
    },

    showAttack(from, to): void {
      hide();
      drawAttack(from, to);
    },

    showStepAndAttack(tiles, points, to): void {
      hide();
      drawPath(tiles, points);
      drawAttack(tiles[tiles.length - 1], to);
    },

    hide,

    number: left.number,
  };
}
