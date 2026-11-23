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
import type { Named } from './text-run';

export const ANSWER_WIDTH = 220;

/** The padding over and under an answer's name and text. */
const PAD_Y = 12;
const TEXT_SIZE = 16;

/** What any refusal at all darkens an answer by, and nothing where none refuses it. */
function darkeningFor(refusal: Refusal): number {
  return playable(refusal) ? 0xffffff : darkeningOf(LOOK.refusedAnswer);
}

/**
 * An answer's name over its text, drawn `ANSWER_WIDTH` wide, its top left at its root's origin: how
 * tall it stands, its names about that origin, and every name its text reads, in its order.
 */
export type AnswerColumn = {
  readonly root: Phaser.GameObjects.Container;
  readonly height: number;
  readonly named: readonly Named[];
  /** The name lying under a point of the surface the column is drawn on, and nothing where none does. */
  nameAt(x: number, y: number): Name | undefined;
  /** Where one of its names stands on the surface the column is drawn on. */
  spotOf(name: Name): Spot;
};

/**
 * An answer's name over its text, both centred, the text's names made at the answer's numbers; any
 * refusal at all darkens its words and its glyphs, and the number of a cost the city cannot pay
 * reads in the unaffordable red.
 */
export function createAnswerColumn(
  scene: Phaser.Scene,
  shown: AnswerShown,
  refusal: Refusal,
): AnswerColumn {
  const tone = tintedBy(darkeningFor(refusal));
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
  const root = scene.add
    .container(0, 0, [name, text, ...unpaid, ...glyphs])
    .setData({ card: shown.id, names: marks.names });

  return {
    root,
    height: own.y + own.height + PAD_Y,
    named: texted.run.names,
    nameAt(x: number, y: number): Name | undefined {
      return namedAt(root, marks.names, x, y);
    },
    spotOf(each: Name): Spot {
      return spotOn(root, each);
    },
  };
}

/** A panel at an answer's rim, and the veil it wears under the pointer, made standing nowhere. */
export type LitPanel = {
  readonly panel: Phaser.GameObjects.NineSlice;
  readonly veil: Phaser.GameObjects.Rectangle;
  /** The panel and its veil stood on the box. */
  stand(box: Box): void;
};

/** A panel at an answer's rim, darkened by that much, and its veil. */
export function createLitPanel(scene: Phaser.Scene, darkening: number): LitPanel {
  const panel = createChromePanel(scene, PANEL_RIMS.plate).setTint(darkening);
  const veil = createVeil(scene, 'veil');
  return {
    panel,
    veil,
    stand(box) {
      standChromePanel(panel, box);
      veilOver(veil, box, PANEL.corner * PANEL_RIMS.plate);
    },
  };
}

/**
 * An answer drawn, its top left at its root's origin: how tall it stands alone, and its names, about
 * that origin.
 */
export type AnswerPlate = Pick<AnswerColumn, 'root' | 'height' | 'nameAt' | 'spotOf'> & {
  /** Its panel stood this tall, its name and its text where they stand from its top. */
  standTall(height: number): void;
  /** The pointer on it or off it: an answer nothing refuses is lighter under it. */
  pointed(on: boolean): void;
  /** Where its panel stands on the surface the answer is drawn on. */
  boxOnSurface(): Box;
};

/** An answer as its column on a panel of its own, the panel darkened by any refusal at all. */
export function createAnswerPlate(
  scene: Phaser.Scene,
  shown: AnswerShown,
  refusal: Refusal,
): AnswerPlate {
  const column = createAnswerColumn(scene, shown, refusal);
  const { root, height } = column;
  const lit = createLitPanel(scene, darkeningFor(refusal));
  root.addAt([lit.panel, lit.veil], 0);
  let tall = height;
  const standTall = (next: number): void => {
    tall = next;
    lit.stand({ x: 0, y: 0, width: ANSWER_WIDTH, height: next });
  };
  standTall(height);
  const takes = playable(refusal);

  return {
    root,
    height,
    standTall,
    nameAt: column.nameAt,
    spotOf: column.spotOf,
    pointed(on: boolean): void {
      lit.veil.setVisible(on && takes);
    },
    boxOnSurface(): Box {
      const { tx, ty } = root.getWorldTransformMatrix();
      return { x: tx, y: ty, width: ANSWER_WIDTH, height: tall };
    },
  };
}
