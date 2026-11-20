import type Phaser from 'phaser';
import { playable, type Refusal } from '../rules/state';
import {
  addRun,
  centredMarks,
  GLYPH_SHARE,
  type Name,
  namedAt,
  type Spot,
  spotOn,
} from './card-face';
import { createChromePanel, PANEL_RIMS, standChromePanel } from './chrome';
import { addText, ownBoxOf, UI_FONT } from './design-space';
import type { AnswerShown } from './event-text';
import { glyphOf } from './glyphs';
import { css, darkeningOf, LOOK, multiplied } from './look';

export const ANSWER_WIDTH = 220;

/** The padding over and under an answer's name and text. */
const PAD_Y = 12;
const TEXT_SIZE = 16;

/**
 * An answer drawn, its top left at its root's origin: how tall it stands alone, and its names, about
 * that origin.
 */
export type AnswerPlate = {
  readonly root: Phaser.GameObjects.Container;
  readonly height: number;
  /** Its panel stood this tall, its name and its text where they stand from its top. */
  standTall(height: number): void;
  /** The name lying under a point of the surface the answer is drawn on, and nothing where none does. */
  nameAt(x: number, y: number): Name | undefined;
  /** Where one of its names stands on the surface the answer is drawn on. */
  spotOf(name: Name): Spot;
};

/**
 * An answer as its name over its text on a panel, both centred, the text's names made at the
 * answer's numbers; any refusal at all darkens its panel and its words.
 */
export function createAnswerPlate(
  scene: Phaser.Scene,
  shown: AnswerShown,
  refusal: Refusal,
): AnswerPlate {
  const darkening = playable(refusal) ? 0xffffff : darkeningOf(LOOK.refusedAnswer);
  const ink = css(multiplied(LOOK.charcoalInk, darkening));
  const middle = ANSWER_WIDTH / 2;
  const inner = ANSWER_WIDTH - 2 * 16;

  const name = addText(scene, middle, 0, shown.name, {
    fontFamily: UI_FONT,
    fontSize: '20px',
    fontStyle: 'bold',
    color: ink,
    align: 'center',
    wordWrap: { width: inner },
  })
    .setOrigin(0.5, 0)
    .setName('name');
  name.setY(PAD_Y + name.y - ownBoxOf(name).y);
  const named = ownBoxOf(name);

  const texted = addRun(
    scene,
    shown.text,
    { fontFamily: UI_FONT, fontSize: `${TEXT_SIZE}px`, color: ink, align: 'center' },
    inner,
  );
  const text = texted.label.setOrigin(0.5, 0).setPosition(middle, 0).setName('text');
  text.setY(named.y + named.height + 4 + text.y - ownBoxOf(text).y);
  const own = ownBoxOf(text);
  const height = own.y + own.height + PAD_Y;

  const marks = centredMarks(texted, shown.reading);
  const glyphs = marks.glyphs.map(({ symbol, x, y }) =>
    glyphOf(scene, symbol, GLYPH_SHARE * TEXT_SIZE).setPosition(x, y),
  );
  const panel = createChromePanel(scene, PANEL_RIMS.plate).setTint(darkening);
  const standTall = (tall: number): void => {
    standChromePanel(panel, { x: 0, y: 0, width: ANSWER_WIDTH, height: tall });
  };
  standTall(height);
  const root = scene.add
    .container(0, 0, [panel, name, text, ...glyphs])
    .setData({ card: shown.id, names: marks.names });

  return {
    root,
    height,
    standTall,
    nameAt(x: number, y: number): Name | undefined {
      return namedAt(root, marks.names, x, y);
    },
    spotOf(each: Name): Spot {
      return spotOn(root, each);
    },
  };
}
