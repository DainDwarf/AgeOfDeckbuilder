import Phaser from 'phaser';
import { CARDS, type CardId, type TargetSort } from '../rules/cards';
import { type Chronicle, playable, type Refusal, refusalOf } from '../rules/chronicle';
import { CARD_HEIGHT, CARD_WIDTH, type CardFace, createCardFace } from './card-face';
import { DESIGN_HEIGHT, DESIGN_WIDTH, MARGIN } from './design-space';

/** The clear water between a pile and the lane the hand fans out in. */
const LANE_PAD = 28;
const GAP = 12;
const FAN = 0.5;
const LIFT = 32;

/** How far up a card has to come out of the hand before releasing it plays it. */
const PLAY_HEIGHT = 110;

/** Under this much travel the pointer was clicking, not dragging, and nothing is played. */
const CLICK_SLACK = 8;

type Slot = {
  readonly face: CardFace;
  readonly id: CardId;
  readonly index: number;
  readonly home: { x: number; y: number };
  readonly refusal: Refusal;
  readonly playable: boolean;
  hovered: boolean;
};

type Drag = {
  readonly slot: Slot;
  readonly grabbed: { x: number; y: number };
  readonly lifted: { x: number; y: number };
  moved: number;
};

export type Hand = { render(chronicle: Chronicle): void };

/**
 * The hand between the two piles. Cards keep their fixed gap until the lane runs out, then
 * compress evenly onto one another; the one under the pointer comes to the front. While a card is
 * aimed the hand is click-only: the armed card cancels, every other card zooms.
 */
export function createHand(
  scene: Phaser.Scene,
  play: (index: number) => void,
  aim: (index: number, sort: Exclude<TargetSort, 'none'>, released: () => void) => () => void,
  zoom: (id: CardId, refusal: Refusal) => void,
): Hand {
  const laneLeft = MARGIN + CARD_WIDTH + LANE_PAD;
  const laneWidth = DESIGN_WIDTH - 2 * laneLeft;
  const baseline = DESIGN_HEIGHT - MARGIN;

  let slots: Slot[] = [];
  let dragged: Drag | undefined;
  let aiming: { readonly slot: Slot; readonly cancel: () => void } | undefined;

  const restingY = (slot: Slot): number => slot.home.y - (slot.hovered && slot.playable ? LIFT : 0);

  const settle = (slot: Slot, duration: number): void => {
    scene.tweens.killTweensOf(slot.face.root);
    slot.face.root.setDepth(slot.hovered ? 40 : 5 + slot.index);
    if (duration === 0) {
      slot.face.root.setPosition(slot.home.x, restingY(slot));
      return;
    }
    scene.tweens.add({
      targets: slot.face.root,
      x: slot.home.x,
      y: restingY(slot),
      duration,
      ease: 'Sine.easeInOut',
    });
  };

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (dragged === undefined) return;
    const { slot, grabbed, lifted } = dragged;
    const away = { x: pointer.worldX - grabbed.x, y: pointer.worldY - grabbed.y };
    dragged.moved = Math.max(dragged.moved, Math.abs(away.x) + Math.abs(away.y));
    // Measured before the return: the release reads the travel to tell a click from a drag.
    if (aiming !== undefined) return;

    const budge = slot.playable ? 1 : 0.1;
    slot.face.root.setPosition(lifted.x + away.x * budge, lifted.y + away.y * budge);
    slot.face.arm(slot.playable && -away.y > PLAY_HEIGHT);
  });

  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (dragged === undefined) return;
    const { slot, grabbed, moved } = dragged;
    dragged = undefined;

    if (moved < CLICK_SLACK) {
      settle(slot, 0);
      if (aiming !== undefined && slot === aiming.slot) aiming.cancel();
      else zoom(slot.id, slot.refusal);
      return;
    }
    if (aiming !== undefined) return;
    slot.face.arm(false);

    if (slot.playable && grabbed.y - pointer.worldY > PLAY_HEIGHT) {
      // A card that takes a target is not played by the release: it waits, in its slot and armed,
      // while the map is aimed at, and comes back down only when the card itself is clicked.
      const sort = CARDS[slot.id].target;
      if (sort !== 'none') {
        settle(slot, 150);
        slot.face.arm(true);
        const cancel = aim(slot.index, sort, () => {
          aiming = undefined;
          slot.face.arm(false);
          slot.hovered = false;
          settle(slot, 150);
        });
        aiming = { slot, cancel };
        return;
      }
      play(slot.index);
      return;
    }
    settle(slot, 150);
  });

  return {
    render(chronicle: Chronicle): void {
      for (const slot of slots) {
        scene.tweens.killTweensOf(slot.face.root);
        slot.face.root.destroy();
      }
      dragged = undefined;
      aiming = undefined;

      const held = chronicle.hand.length;
      const advance =
        held > 1 ? Math.min(CARD_WIDTH + GAP, (laneWidth - CARD_WIDTH) / (held - 1)) : 0;
      const first = laneLeft + (laneWidth - (CARD_WIDTH + (held - 1) * advance)) / 2;

      slots = chronicle.hand.map((id, index) => {
        const off = index - (held - 1) / 2;
        const refusal = refusalOf(chronicle, id);
        const slot: Slot = {
          face: createCardFace(scene, id, refusal),
          id,
          index,
          home: {
            x: first + CARD_WIDTH / 2 + index * advance,
            y: baseline + off * off * FAN * 1.6,
          },
          refusal,
          playable: playable(refusal),
          hovered: false,
        };

        slot.face.root
          .setName(`hand-${index}`)
          .setPosition(slot.home.x, slot.home.y)
          .setRotation(Phaser.Math.DegToRad(off * FAN))
          .setDepth(5 + index)
          .setInteractive({
            hitArea: new Phaser.Geom.Rectangle(
              -CARD_WIDTH / 2,
              -CARD_HEIGHT,
              CARD_WIDTH,
              CARD_HEIGHT,
            ),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            cursor: 'pointer',
          })
          .on('pointerover', () => {
            if (dragged !== undefined) return;
            slot.hovered = true;
            settle(slot, 120);
          })
          .on('pointerout', () => {
            if (dragged !== undefined) return;
            slot.hovered = false;
            settle(slot, 120);
          })
          .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            slot.hovered = true;
            settle(slot, 0);
            dragged = {
              slot,
              grabbed: { x: pointer.worldX, y: pointer.worldY },
              lifted: { x: slot.home.x, y: restingY(slot) },
              moved: 0,
            };
          });

        return slot;
      });
    },
  };
}
