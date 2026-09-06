import Phaser from 'phaser';
import { type AimedCard, CARDS } from '../rules/cards';
import { costOf, playable, type Refusal, refusalOf, type Stage } from '../rules/chronicle';
import type { CardId, Chronicle } from '../rules/state';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardFace,
  createCardBack,
  createCardFace,
} from './card-face';
import { ended, IN_FLIGHT, STAGGER, stopMotion, travel, turnOver } from './card-motion';
import {
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  releasedOffCanvas,
  type Surface,
} from './design-space';
import { PILE_PLACE } from './piles';
import { createRefusalNote } from './refusal-note';

/** The clear water between a pile and the lane the hand fans out in. */
const LANE_PAD = 28;
const GAP = 12;
const FAN = 0.5;
const LIFT = 32;

/** How far up a card has to come out of the hand before releasing it plays it. */
const PLAY_HEIGHT = 110;

type Slot = {
  readonly face: CardFace;
  readonly id: CardId;
  readonly index: number;
  readonly home: { x: number; y: number };
  readonly refusal: Refusal;
  readonly playable: boolean;
  hovered: boolean;
};

/** Where the card was taken hold of, and where it stood at that moment. */
type Drag = {
  readonly grabbed: { x: number; y: number };
  readonly lifted: { x: number; y: number };
};

export type Hand = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** The one gate on the hand's pointer: no hover, no click and no drag while it is shut. */
  live(on: boolean): void;
  /** Lets go of the card that is armed and aiming, and answers whether one was. */
  cancelAim(): boolean;
};

/**
 * The hand between the two piles. Cards keep their fixed gap until the lane runs out, then
 * compress evenly onto one another; the one under the pointer comes to the front. While a card is
 * aimed the hand is click-only: the armed card cancels, every other card zooms.
 */
export function createHand(
  scene: Phaser.Scene,
  on: Surface,
  play: (index: number) => void,
  aim: (index: number, card: AimedCard, released: () => void) => () => void,
  zoom: (id: CardId, refusal: Refusal) => void,
): Hand {
  const laneLeft = MARGIN + CARD_WIDTH + LANE_PAD;
  const laneWidth = DESIGN_WIDTH - 2 * laneLeft;
  const note = createRefusalNote(scene, on);

  let slots: Slot[] = [];
  /** What the hand has in the air and no slot holds; a render owns it and takes it down. */
  let flying: Phaser.GameObjects.Container[] = [];
  let dragged: Drag | undefined;
  let aiming: { readonly slot: Slot; readonly cancel: () => void } | undefined;
  /** The card the hand has let go of, waiting on the stages its play resolves as. */
  let letGo: Slot | undefined;
  /** Whether the hand takes the pointer at all; a play-out puts it down for as long as it runs. */
  let taking = true;

  const live = (on: boolean): void => {
    taking = on;
    for (const slot of slots) {
      if (on) slot.face.root.setInteractive();
      else slot.face.root.disableInteractive();
    }
  };

  const restingY = (slot: Slot): number => slot.home.y - (slot.hovered ? LIFT : 0);

  /** The card back where it rests, at once or over that long; the promise settles when it is home. */
  const settle = (slot: Slot, duration: number): Promise<void> => {
    stopMotion(scene, slot.face.root);
    slot.face.root.setDepth(slot.hovered ? 40 : 5 + slot.index);
    if (duration === 0) {
      slot.face.root.setPosition(slot.home.x, restingY(slot));
      return Promise.resolve();
    }
    return ended(
      scene.tweens.add({
        targets: slot.face.root,
        x: slot.home.x,
        y: restingY(slot),
        duration,
        ease: 'Sine.easeInOut',
      }),
    );
  };

  const render = (chronicle: Chronicle): void => {
    note.hide();
    for (const face of [...flying, ...slots.map((slot) => slot.face.root)]) {
      stopMotion(scene, face);
      face.destroy();
    }
    flying = [];
    dragged = undefined;
    aiming = undefined;
    letGo = undefined;

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
          y: CARD_BASELINE + off * off * FAN * 1.6,
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
          draggable: true,
        })
        .on('dragstart', (pointer: Phaser.Input.Pointer) => {
          if (aiming !== undefined) return;
          slot.hovered = true;
          settle(slot, 0);
          dragged = {
            grabbed: on.at(pointer.downX, pointer.downY),
            lifted: { x: slot.home.x, y: restingY(slot) },
          };
        })
        .on('drag', (pointer: Phaser.Input.Pointer) => {
          if (dragged === undefined) return;
          const { grabbed, lifted } = dragged;
          const at = on.at(pointer.x, pointer.y);
          slot.face.root.setPosition(lifted.x + at.x - grabbed.x, lifted.y + at.y - grabbed.y);
          slot.face.arm(grabbed.y - at.y > PLAY_HEIGHT);
        })
        .on('dragend', (pointer: Phaser.Input.Pointer) => {
          if (dragged === undefined) return;
          const { grabbed } = dragged;
          dragged = undefined;
          slot.face.arm(false);

          if (releasedOffCanvas(pointer)) {
            slot.hovered = false;
            settle(slot, 150);
            return;
          }
          const at = on.at(pointer.x, pointer.y);
          if (grabbed.y - at.y > PLAY_HEIGHT) {
            // Nothing has changed since the render, so the refusal the slot holds is still the
            // rules' answer and no play is sent for one they would only refuse again.
            if (!slot.playable) {
              slot.hovered = false;
              settle(slot, 150);
              note.overCard(
                costOf(slot.id),
                slot.refusal,
                slot.home.x,
                slot.home.y - LIFT - CARD_HEIGHT,
              );
              return;
            }
            // A card that takes a target is not played by the release: it waits, in its slot and
            // armed, while the map is aimed at, and comes down only when the card is clicked.
            const card = CARDS[slot.id];
            if (card.aim !== 'none') {
              settle(slot, 150);
              slot.face.arm(true);
              letGo = slot;
              const cancel = aim(slot.index, card, () => {
                aiming = undefined;
                letGo = undefined;
                slot.face.arm(false);
                slot.hovered = false;
                settle(slot, 150);
              });
              aiming = { slot, cancel };
              return;
            }
            letGo = slot;
            play(slot.index);
            return;
          }
          settle(slot, 150);
        });

      onHover(
        slot.face.root,
        () => {
          if (dragged !== undefined) return;
          slot.hovered = true;
          settle(slot, 120);
        },
        () => {
          if (dragged !== undefined) return;
          slot.hovered = false;
          settle(slot, 120);
        },
      );

      onClick(slot.face.root, () => {
        settle(slot, 0);
        if (aiming !== undefined && slot === aiming.slot) aiming.cancel();
        else zoom(slot.id, slot.refusal);
      });

      return slot;
    });
    live(taking);
  };

  /**
   * The hand leaving for the discard pile: every card straightens as it goes, the last one landing
   * a stagger behind the one before it, and the emptied hand is laid out where they all land.
   */
  const toDiscardPile = async (chronicle: Chronicle): Promise<void> => {
    const leaving = slots.map((slot) => slot.face.root);
    flying = leaving;
    slots = [];
    await Promise.all(
      leaving.map((face, index) => {
        stopMotion(scene, face);
        face.setDepth(IN_FLIGHT + index);
        const to = { ...PILE_PLACE['discard-pile'], rotation: 0 };
        return travel(scene, face, to, index * STAGGER);
      }),
    );
    // A render while these were in the air took them down and painted the hand it stands on.
    if (flying === leaving) render(chronicle);
  };

  /**
   * The block off the draw pile: a back leaves the pile for every slot the hand gains and turns
   * face up where it lands, while the cards already held slide to the homes the wider fan gives
   * them.
   */
  const fromDrawPile = async (chronicle: Chronicle): Promise<void> => {
    const standing = slots.map((slot) => ({
      x: slot.face.root.x,
      y: slot.face.root.y,
      rotation: slot.face.root.rotation,
    }));
    render(chronicle);

    await Promise.all(
      slots.map((slot, index) => {
        const home = { ...slot.home, rotation: slot.face.root.rotation };
        const was = standing[index];
        if (was !== undefined) {
          slot.face.root.setPosition(was.x, was.y).setRotation(was.rotation);
          return travel(scene, slot.face.root, home);
        }

        const face = slot.face.root.setVisible(false);
        const back = createCardBack(scene)
          .setPosition(PILE_PLACE['draw-pile'].x, PILE_PLACE['draw-pile'].y)
          .setDepth(IN_FLIGHT + index);
        flying.push(back);
        return travel(scene, back, home, (index - standing.length) * STAGGER).then(() =>
          turnOver(scene, back, face),
        );
      }),
    );
  };

  /** The play the rules refused: the card the hand let go of comes back down into its slot. */
  const comeHome = (): Promise<void> | undefined => {
    const slot = letGo;
    letGo = undefined;
    if (slot === undefined) return undefined;
    slot.face.arm(false);
    slot.hovered = false;
    return settle(slot, 150);
  };

  return {
    render,
    live,
    cancelAim(): boolean {
      if (aiming === undefined) return false;
      // The cancel runs the aim's own release: the card comes home exactly as clicking it does.
      aiming.cancel();
      return true;
    },
    play(stage: Stage): Promise<void> | undefined {
      switch (stage.name) {
        case 'discard':
          return toDiscardPile(stage.chronicle);
        case 'draw':
          return fromDrawPile(stage.chronicle);
        case 'refused':
          return comeHome();
        default:
          return undefined;
      }
    },
  };
}
