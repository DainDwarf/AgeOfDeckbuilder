import Phaser from 'phaser';
import { type CastSymbol, glyphFileOf } from './cast';
import { grownOf } from './fade';
import { LOOK, type Tone, untoned } from './look';
import { GLYPH_PIXELS, GLYPH_SHEET } from './marks';
import { aroundPicture, paintMade, washed } from './sheet';

/** How wide the dark outline round a glyph is, in the units of the surface it is drawn on. */
const OUTLINE = 0.5;

/** How wide a pile's sign and a button's stand, as a share of the round or the square they stand on. */
export const SIGN_SHARE = 0.6;

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
    case 'sleep':
    case 'units':
      return LOOK.population;
    case 'turns-left':
      return LOOK.turnsLeftInk;
    case 'influence':
      return LOOK.influence;
    case 'health':
      return LOOK.heart;
    case 'killed':
      return LOOK.skull;
    case 'pillage':
    case 'capture':
      return LOOK.unitBadgeInk;
    case 'player':
      return LOOK.civilizationSignInk;
    case 'neutral':
      return LOOK.neutralSignInk;
    case 'enemy':
      return LOOK.enemySignInk;
    case 'site':
      return LOOK.siteSignInk;
    case 'range':
    case 'played-by-nothing':
      return LOOK.cardDiscInk;
    case 'move':
    case 'action':
    case 'sight':
    case 'damage':
    case 'hostile':
      return LOOK.cardTextInk;
    case 'draw-pile':
    case 'discard-pile':
    case 'exhaust-pile':
      return LOOK.charcoalInk;
    case 'end-turn-button':
    case 'menu-button':
    case 'icons-button':
    case 'faction-signs-button':
    case 'hex-grid-button':
    case 'minimize-button':
    case 'fold-tab':
      return LOOK.metalInk;
    case 'itch-io-link':
    case 'github-link':
    case 'discord-link':
      return LOOK.charcoalInk;
  }
}

/**
 * Whether a symbol's glyph wears its outline where it is not told: the hostile glyph and the turns'
 * hourglass, each read in an ink, wear none, and neither does a sign on its round or in its square.
 */
function outlinedOf(symbol: CastSymbol): boolean {
  switch (symbol) {
    case 'hostile':
    case 'turns-left':
    case 'draw-pile':
    case 'discard-pile':
    case 'exhaust-pile':
    case 'end-turn-button':
    case 'menu-button':
    case 'icons-button':
    case 'faction-signs-button':
    case 'hex-grid-button':
    case 'minimize-button':
    case 'fold-tab':
    case 'itch-io-link':
    case 'github-link':
    case 'discord-link':
      return false;
    case 'food':
    case 'production':
    case 'military':
    case 'money':
    case 'science':
    case 'culture':
    case 'population':
    case 'sleep':
    case 'units':
    case 'influence':
    case 'health':
    case 'killed':
    case 'pillage':
    case 'capture':
    case 'player':
    case 'neutral':
    case 'enemy':
    case 'site':
    case 'range':
    case 'played-by-nothing':
    case 'move':
    case 'action':
    case 'sight':
    case 'damage':
      return true;
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
    width: GLYPH_PIXELS,
    height: GLYPH_PIXELS,
    pixels: GLYPH_PIXELS / square,
  };
  paintMade(
    scene.textures,
    GLYPH_SHEET,
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
 * in the outline's, both through the tone; a glyph asked to wear no outline stands bare, and so does
 * one not asked whose symbol wears none.
 */
export function asGlyph(
  mark: Phaser.GameObjects.Container,
  symbol: CastSymbol,
  square: number,
  { tone = untoned, colour = colourOf(symbol), outlined = outlinedOf(symbol) }: GlyphPaint = {},
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
