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
import { createChromePanel, createVeil, PANEL_RIMS, standChromePanel, veilOver } from './chrome';
import { PANEL } from './chrome-kit';
import { addText, type Box, ownBoxOf, UI_FONT } from './design-space';
import type { AnswerShown } from './event-text';
import { glyphOf } from './glyphs';
import { css, darkeningOf, LOOK, tintedBy } from './look';

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
  /** The pointer on it or off it: an answer nothing refuses is lighter under it. */
  pointed(on: boolean): void;
  /** Where its panel stands on the surface the answer is drawn on. */
  boxOnSurface(): Box;
};

/**
 * An answer as its name over its text on a panel, both centred, the text's names made at the
 * answer's numbers; any refusal at all darkens its panel, its words and its glyphs, and the number of
 * a cost the city cannot pay reads in the unaffordable red.
 */
export function createAnswerPlate(
  scene: Phaser.Scene,
  shown: AnswerShown,
  refusal: Refusal,
): AnswerPlate {
  const takes = playable(refusal);
  const darkening = takes ? 0xffffff : darkeningOf(LOOK.refusedAnswer);
  const tone = tintedBy(darkening);
  const style = { fontFamily: UI_FONT, color: css(tone(LOOK.charcoalInk)) };
  const middle = ANSWER_WIDTH / 2;
  const inner = ANSWER_WIDTH - 2 * 16;

  const name = addText(scene, middle, 0, shown.name, {
    ...style,
    fontSize: '20px',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: inner },
  })
    .setOrigin(0.5, 0)
    .setName('name');
  name.setY(PAD_Y + name.y - ownBoxOf(name).y);
  const named = ownBoxOf(name);

  const runStyle = { ...style, fontSize: `${TEXT_SIZE}px`, align: 'center' };
  const texted = addRun(scene, shown.text, runStyle, inner);
  const text = texted.label.setOrigin(0.5, 0).setPosition(middle, 0).setName('text');
  text.setY(named.y + named.height + 4 + text.y - ownBoxOf(text).y);
  const own = ownBoxOf(text);
  const height = own.y + own.height + PAD_Y;

  const marks = centredMarks(texted, shown.reading);
  const glyphs = marks.glyphs.map(({ symbol, x, y }) =>
    glyphOf(scene, symbol, GLYPH_SHARE * TEXT_SIZE, { tone }).setPosition(x, y),
  );
  // A Text has one colour (docs/PHASER.md): the red number is a second Text over the first one's.
  const unpaid = marks.glyphs.flatMap(({ symbol, y, number }) => {
    if (number === undefined || !refusal.unaffordable.some((resource) => resource === symbol)) {
      return [];
    }
    const red = addText(scene, 0, y, number.reads, {
      ...runStyle,
      color: css(LOOK.unaffordable),
    })
      .setOrigin(0, 0.5)
      .setName('unaffordable');
    return [red.setX(number.left + red.x - ownBoxOf(red).x)];
  });
  const panel = createChromePanel(scene, PANEL_RIMS.plate).setTint(darkening);
  const veil = createVeil(scene, 'veil');
  let tall = height;
  const standTall = (next: number): void => {
    tall = next;
    const box = { x: 0, y: 0, width: ANSWER_WIDTH, height: next };
    standChromePanel(panel, box);
    veilOver(veil, box, PANEL.corner * PANEL_RIMS.plate);
  };
  standTall(height);
  const root = scene.add
    .container(0, 0, [panel, veil, name, text, ...unpaid, ...glyphs])
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
    pointed(on: boolean): void {
      veil.setVisible(on && takes);
    },
    boxOnSurface(): Box {
      const { tx, ty } = root.getWorldTransformMatrix();
      return { x: tx, y: ty, width: ANSWER_WIDTH, height: tall };
    },
  };
}
