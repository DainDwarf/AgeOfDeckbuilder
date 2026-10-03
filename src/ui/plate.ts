import type Phaser from 'phaser';
import type { Name } from './card-face';
import { addText, answersPress, onClick, onHover, ownBoxOf, UI_FONT } from './design-space';
import { css, LOOK } from './look';
import type { Raiser } from './small-card';
import { referenceName } from './text';
import { layOutRun, type Run } from './text-run';

const INK = css(LOOK.ink);
const TEXT_SIZE = 14;
/** A glyph a run marks, corner to corner. */
const GLYPH = (2 / 3) * TEXT_SIZE;
export const NAME_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };
export const TEXT_STYLE = { fontFamily: UI_FONT, fontSize: `${TEXT_SIZE}px`, color: INK };

/** A plate's inside: the padding round its lines, and how far apart they stand. */
export const PAD_X = 12;
export const PAD_Y = 8;
export const NAME_LINE = 22;
export const TEXT_LINE = 18;

/** A plate's paper of that fill, its top left at its origin. */
export function paperOf(
  scene: Phaser.Scene,
  width: number,
  height: number,
  fill: number,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(0, 0, width, height, fill)
    .setOrigin(0, 0)
    .setStrokeStyle(1, LOOK.panelEdge);
}

/** An entry drawn as a run wrapped at that width, its names and glyphs where the run stands them. */
function addRun(
  scene: Phaser.Scene,
  entry: string,
  width: number,
): { label: Phaser.GameObjects.Text; run: Run } {
  // Phaser runs the callback from inside updateText, on a context whose font it has just synced.
  let run!: Run;
  const label = addText(scene, 0, 0, entry, {
    ...TEXT_STYLE,
    wordWrap: {
      callback: (content, textObject) => {
        const measure = (drawn: string): number => textObject.context.measureText(drawn).width;
        run = layOutRun(
          content,
          measure,
          {
            width,
            glyph: GLYPH,
            bearing: TEXT_SIZE / 4,
            space: measure(' '),
          },
          referenceName,
        );
        return run.content.split('\n');
      },
    },
  });
  return { label, run };
}

/** How many lines an entry takes drawn as a run wrapped at that width. */
export function linesOf(scene: Phaser.Scene, entry: string, width: number): number {
  const { label, run } = addRun(scene, entry, width);
  label.destroy();
  return run.widths.length;
}

/**
 * What the names of a run answer: the pointer coming onto one and leaving it, the right click, and
 * the left click where they answer one.
 */
export type RunNames = {
  over(raiser: Raiser, on: boolean): void;
  inspect(name: Name): void;
  click?(): void;
};

/**
 * An entry drawn on the face as a run wrapped at that width, from the middle of its first line at
 * that point down, its glyphs where the run stands them and a zone over each of its names; the names
 * are answered.
 */
export function drawRun(
  scene: Phaser.Scene,
  face: Phaser.GameObjects.Container,
  entry: string,
  first: { readonly x: number; readonly y: number },
  width: number,
  answers: RunNames,
): { label: Phaser.GameObjects.Text; lines: number; names: Name[] } {
  const { label, run } = addRun(scene, entry, width);
  const lines = run.widths.length;
  const pitch = ownBoxOf(label).height / lines;
  const middleOf = (at: number): number => first.y + at * pitch;
  label.setOrigin(0, 0.5).setPosition(first.x, middleOf((lines - 1) / 2));
  face.add(label);
  const { x: start } = ownBoxOf(label);
  const centreOf = (at: number): number => start + run.widths[at] / 2;
  for (const glyph of run.glyphs) {
    const side = GLYPH / Math.SQRT2;
    face.add(
      scene.add
        .rectangle(
          centreOf(glyph.line) + glyph.x,
          middleOf(glyph.line),
          side,
          side,
          LOOK.reading[glyph.resource],
        )
        .setAngle(45),
    );
  }
  const names: Name[] = [];
  for (const { reference, from, to, line } of run.names) {
    const each: Name = {
      reference,
      reading: {},
      x: centreOf(line) + (from + to) / 2,
      y: middleOf(line),
      width: to - from,
      height: pitch,
    };
    names.push(each);
    const raiser: Raiser = {
      name: each,
      where: () => {
        const at = face.getWorldTransformMatrix().transformPoint(each.x, each.y);
        return { x: at.x, top: at.y - each.height / 2, bottom: at.y + each.height / 2 };
      },
    };
    const zone = answersPress(
      scene.add.zone(each.x, each.y, each.width, each.height).setInteractive(),
    );
    onHover(
      zone,
      () => answers.over(raiser, true),
      () => answers.over(raiser, false),
    );
    // A press that dragged what the face stands on is released on the name.
    onClick(zone, () => answers.inspect(each), 'right', 'within slack');
    const { click } = answers;
    if (click !== undefined) onClick(zone, click, 'left', 'within slack');
    face.add(zone);
  }
  return { label, lines, names };
}
