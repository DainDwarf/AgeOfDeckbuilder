import Phaser from 'phaser';
import { grownOf } from './fade';
import { LOOK, type Tone, unworn } from './look';
import { type CastSymbol, GLYPH_PIXELS, GLYPH_SHEET, glyphFileOf } from './marks';
import { aroundPicture, paintMade, washed } from './sheet';

/** How wide the dark outline round a glyph is, in the units of the surface it is drawn on. */
const OUTLINE = 0.5;

/** The colour a symbol is known by. */
function colourOf(symbol: CastSymbol): number {
  switch (symbol) {
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
      return LOOK.reading[symbol];
    case 'population':
      return LOOK.population;
    case 'influence':
      return LOOK.influence;
    case 'health':
      return LOOK.heart;
    case 'killed':
      return LOOK.skull;
    case 'pillage':
    case 'capture':
      return LOOK.unitBadgeInk;
  }
}

/** The sheets painted into since the last frame was drawn, each waiting for its one upload. */
const uploading = new WeakSet<Phaser.Textures.CanvasTexture>();

/**
 * The frame of the glyphs sheet a symbol's outline stands in at that square, painted into it the first
 * time it is asked for: the glyph's shape grown by the outline, white for a tint to colour.
 */
function outlineOf(scene: Phaser.Scene, symbol: CastSymbol, square: number): string {
  const file = glyphFileOf(symbol);
  const frame = `${file}#outline-${square.toFixed(3)}`;
  const sheet = scene.textures.get(GLYPH_SHEET.key);
  if (!(sheet instanceof Phaser.Textures.CanvasTexture)) {
    throw new Error(`the sheet ${GLYPH_SHEET.key} is drawn on no canvas`);
  }
  if (sheet.has(frame)) return frame;
  const picture = {
    sheet: GLYPH_SHEET.key,
    file,
    side: GLYPH_PIXELS,
    pixels: GLYPH_PIXELS / square,
  };
  paintMade(
    scene.textures,
    sheet,
    aroundPicture(picture, frame, OUTLINE, (on, alpha, pixels) => {
      const { width, height } = on.canvas;
      washed(on, 0xffffff, grownOf(alpha, width, height, OUTLINE * pixels));
    }),
  );
  if (!uploading.has(sheet)) {
    uploading.add(sheet);
    // A canvas texture's refresh uploads the whole of it (docs/PHASER.md): once for every outline
    // a frame asks for, before that frame is drawn.
    scene.game.events.once(Phaser.Core.Events.PRE_RENDER, () => {
      uploading.delete(sheet);
      sheet.refresh();
    });
  }
  return frame;
}

/**
 * How a glyph is drawn beside its symbol and its square: what its colours go through, the colour it
 * is drawn in where it is not its symbol's, and whether it wears its outline.
 */
export type GlyphPaint = {
  readonly tone?: Tone;
  readonly colour?: number;
  readonly outlined?: boolean;
};

/** A glyph drawing nothing yet, about its middle: its outline, then the glyph itself. */
export function glyphMark(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.add.container(0, 0, [
    scene.add.image(0, 0, GLYPH_SHEET.key).setVisible(false),
    scene.add.image(0, 0, GLYPH_SHEET.key).setVisible(false),
  ]);
}

/**
 * A `glyphMark` made to draw a symbol's glyph `square` units a side, in its colour over its outline
 * in the outline's, both through the tone; a glyph asked to wear no outline stands bare.
 */
export function asGlyph(
  mark: Phaser.GameObjects.Container,
  symbol: CastSymbol,
  square: number,
  { tone = unworn, colour = colourOf(symbol), outlined = true }: GlyphPaint = {},
): Phaser.GameObjects.Container {
  const [outline, glyph] = mark.list as Phaser.GameObjects.Image[];
  const scale = square / GLYPH_PIXELS;
  glyph
    .setTexture(GLYPH_SHEET.key, glyphFileOf(symbol))
    .setScale(scale)
    .setTint(tone(colour))
    .setVisible(true);
  outline.setVisible(outlined);
  if (outlined) {
    outline
      .setTexture(GLYPH_SHEET.key, outlineOf(mark.scene, symbol, square))
      .setScale(scale)
      .setTint(tone(LOOK.glyphOutline));
  }
  return mark;
}

/** A symbol's glyph `square` units a side, drawn as `asGlyph` draws one. */
export function glyphOf(
  scene: Phaser.Scene,
  symbol: CastSymbol,
  square: number,
  paint?: GlyphPaint,
): Phaser.GameObjects.Container {
  return asGlyph(glyphMark(scene), symbol, square, paint);
}
