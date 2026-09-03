import type Phaser from 'phaser';
import type { CardId } from '../rules/cards';
import { costOf, type Refusal } from '../rules/chronicle';
import { addText, DESIGN_WIDTH, drawBubble, MARGIN, UI_FONT } from './design-space';
import { text } from './text';

/** Over the hand's lifted cards, under the overlay. */
const DEPTH = 50;

/** The clear water between the note and the card it points at; its tail crosses most of that. */
const STANDOFF = 8;

const STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: '#0d1014' };

export type RefusalNote = {
  /**
   * Says every reason the rules refuse the card, standing over it: `x` is where the card is at home
   * and `top` the edge the note keeps clear of — the card's top once a hover has lifted it.
   */
  raise(id: CardId, refusal: Refusal, x: number, top: number): void;
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
 * pointing down at the card in its slot, and staying up until it is taken down. One stands at a
 * time: a second refusal replaces the first, and any press on the chronicle screen takes down
 * whichever is up.
 */
export function createRefusalNote(scene: Phaser.Scene): RefusalNote {
  let note: Phaser.GameObjects.Container | undefined;

  const hide = (): void => {
    if (note === undefined) return;
    note.destroy();
    note = undefined;
  };

  scene.input.on('pointerdown', hide);

  return {
    raise(id: CardId, refusal: Refusal, x: number, top: number): void {
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
      drawBubble(bubble, width, height, { edge: 'bottom', at: x - left });

      note = scene.add
        .container(left, top - STANDOFF - height, [bubble, ...labels])
        .setDepth(DEPTH)
        .setName('refusal');
    },

    hide,
  };
}
