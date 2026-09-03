import type Phaser from 'phaser';
import type { CardId } from '../rules/cards';
import { costOf, type Refusal } from '../rules/chronicle';
import { ended } from './card-motion';
import { addText, DESIGN_WIDTH, drawBubble, MARGIN, UI_FONT } from './design-space';
import { text } from './text';

/** Over the hand's lifted cards, under the overlay. */
const DEPTH = 50;

/** The clear water between the note and the point it was raised at; its tail reaches into it. */
const STANDOFF = 20;

/** How far the note drifts up while it fades, and how long it takes to go. */
const FLOAT = 24;
const LIFETIME = 1600;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: '#0d1014' };

export type RefusalNote = {
  /** Says, above the point the card was let go of, every reason the rules refuse it. */
  raise(id: CardId, refusal: Refusal, x: number, y: number): void;
  hide(): void;
};

/** Every reason, one sentence each: what the city cannot pay first, then what stands in the way. */
function reasons(id: CardId, refusal: Refusal): string[] {
  return [
    ...costOf(id)
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map((block) => text(`refusal.${block}`)),
  ];
}

/**
 * The bubble the refused play answers with, standing on the UI in the panel language with its tail
 * pointing down at where the card was released, and floating off on its own. One stands at a time: a
 * second refusal replaces the first, and any press on the table takes down whichever is up.
 */
export function createRefusalNote(scene: Phaser.Scene): RefusalNote {
  let note: Phaser.GameObjects.Container | undefined;

  const hide = (): void => {
    if (note === undefined) return;
    scene.tweens.killTweensOf(note);
    note.destroy();
    note = undefined;
  };

  scene.input.on('pointerdown', hide);

  return {
    raise(id: CardId, refusal: Refusal, x: number, y: number): void {
      hide();
      const bubble = scene.add.graphics();
      const labels = reasons(id, refusal).map((reason) => addText(scene, 0, 0, reason, STYLE));

      let line = 7;
      for (const label of labels) {
        label.setPosition(10, line);
        line += label.height;
      }
      const width = Math.max(...labels.map((label) => label.width)) + 20;
      const height = line + 7;

      const left = Math.min(Math.max(x - width / 2, MARGIN), DESIGN_WIDTH - MARGIN - width);
      const top = y - STANDOFF - height;
      drawBubble(bubble, width, height, { edge: 'bottom', at: x - left });

      const raised = scene.add
        .container(left, top, [bubble, ...labels])
        .setDepth(DEPTH)
        .setName('refusal');
      note = raised;

      const drift = scene.tweens.add({
        targets: raised,
        y: top - FLOAT,
        alpha: 0,
        duration: LIFETIME,
        ease: 'Sine.easeIn',
      });
      void ended(scene, drift).then(() => {
        if (note === raised) hide();
      });
    },

    hide,
  };
}
