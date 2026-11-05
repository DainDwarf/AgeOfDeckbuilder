import Phaser from 'phaser';
import { cornersOf, type TileCoords, tileKey } from '../rules/map';
import type { CityFaction } from '../rules/state';
import { borderLoops, type Point, type Stretch } from './border-loops';
import { css, LOOK } from './look';
import { CITY_COLOURS, CITY_FACTIONS, cornerAt, darkened } from './map-marks';

/** How wide a border's line is, and how deep its band reaches inside it. */
const LINE = 1.5;
const BAND_DEPTH = 10;

/** How many strokes of the loop lay the band, and how many points each stretch of the line is drawn through. */
const BAND_STROKES = 14;
const STRETCH_POINTS = 8;

const BAND_KEY = 'border-band';

/** A tile the map draws as held, and whether it draws it in fog. */
export type HeldAsDrawn = { readonly tile: TileCoords; readonly inFog: boolean };

export type BorderView = {
  /** Both cities' borders around the tiles the map draws as each one's, drawn again only where those changed. */
  paint(held: Readonly<Record<CityFaction, readonly HeldAsDrawn[]>>): void;
};

/**
 * The band's strokes, widest first: each its width and the strength it adds over the ones before it,
 * so the band rests at its strength at the line and fades to nothing at its depth.
 */
function bandStrokes(peak: number): { readonly width: number; readonly strength: number }[] {
  let before = 0;
  return Array.from({ length: BAND_STROKES }, (_, at) => {
    const outer = (BAND_DEPTH * (BAND_STROKES - at)) / BAND_STROKES;
    const inner = (BAND_DEPTH * (BAND_STROKES - at - 1)) / BAND_STROKES;
    const reached = peak * (1 - (outer + inner) / (2 * BAND_DEPTH));
    const strength = 1 - (1 - reached) / (1 - before);
    before = reached;
    return { width: 2 * outer, strength };
  });
}

const STROKES = bandStrokes(LOOK.borderBand);

/** A run of a loop's stretches in one colour, and whether it is the whole loop. */
type Run = { readonly colour: number; readonly stretches: Stretch[]; readonly closed: boolean };

/** A loop cut where its colour changes; a loop of one colour is one run, closed. */
function runsOf(loop: readonly Stretch[], colourOf: (stretch: Stretch) => number): Run[] {
  const turn = loop.findIndex(
    (stretch, at) => colourOf(stretch) !== colourOf(loop[(at + loop.length - 1) % loop.length]),
  );
  if (turn < 0) return [{ colour: colourOf(loop[0]), stretches: [...loop], closed: true }];
  const runs: Run[] = [];
  for (const stretch of [...loop.slice(turn), ...loop.slice(0, turn)]) {
    const colour = colourOf(stretch);
    const last = runs.at(-1);
    if (last?.colour === colour) last.stretches.push(stretch);
    else runs.push({ colour, stretches: [stretch], closed: false });
  }
  return runs;
}

function traced(
  context: CanvasRenderingContext2D,
  stretches: readonly Stretch[],
  closed: boolean,
): void {
  context.moveTo(stretches[0].from.x, stretches[0].from.y);
  for (const { control, to } of stretches)
    context.quadraticCurveTo(control.x, control.y, to.x, to.y);
  if (closed) context.closePath();
}

/** A holder's band: its loops stroked ever narrower, each stroke adding a little, inside the loops alone. */
function paintBand(
  context: CanvasRenderingContext2D,
  loops: readonly Stretch[][],
  colourOf: (stretch: Stretch) => number,
): void {
  if (loops.length === 0) return;
  context.save();
  context.beginPath();
  for (const loop of loops) traced(context, loop, true);
  context.clip('evenodd');
  for (const loop of loops) {
    for (const { colour, stretches, closed } of runsOf(loop, colourOf)) {
      context.beginPath();
      traced(context, stretches, closed);
      context.strokeStyle = css(colour);
      for (const { width, strength } of STROKES) {
        context.lineWidth = width;
        context.globalAlpha = strength;
        context.stroke();
      }
    }
  }
  context.restore();
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

// The band's texture is the game's and outlives the scene's restart (docs/PHASER.md).
/**
 * Both cities' borders on the map's own surface, on this layer: the band painted on one canvas the
 * size of a power of two over the disc, at a pixel to the unit, and each holder's line over it.
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
  // A power of two, or Phaser makes no mipmaps of it (docs/PHASER.md).
  const side = 2 ** Math.ceil(Math.log2(span));
  const origin = { x: middle.x - side / 2, y: middle.y - side / 2 };

  const texture = scene.textures.createCanvas(BAND_KEY, side, side);
  if (texture === null) throw new Error(`a texture stands under ${BAND_KEY} already`);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.textures.remove(BAND_KEY));
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
        paintBand(context, loops, colourOf);
        paintLine(lines[whose], loops, colourOf);
        standing ||= loops.length > 0;
      }
      band.setVisible(standing);
      texture.refresh();
    },
  };
}
