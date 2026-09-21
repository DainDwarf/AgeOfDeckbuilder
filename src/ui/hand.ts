import Phaser from 'phaser';
import { aimOf } from '../rules/cards';
import { type AimedCard, type Catalogue, cardOf } from '../rules/catalogue';
import { costOf, refusalOf } from '../rules/chronicle';
import type { Change, Group, Stage } from '../rules/stages';
import { type CardId, type Chronicle, playable, type Refusal } from '../rules/state';
import { createAimLine } from './aim-line';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_LIFT,
  CARD_WIDTH,
  type CardFace,
  cardFace,
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
import { createRefusalNote, refused } from './refusal-note';

/** The clear water between a pile and the lane the hand fans out in. */
const LANE_PAD = 28;
const GAP = 12;
const FAN = 0.5;

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

/** The selected card, and how the aim it is being aimed by is taken down while one stands. */
type Selected = { readonly slot: Slot; cancel: (() => void) | undefined };

export type Hand = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** The one gate on the hand's pointer: no hover, no click and no drag while it is shut. */
  live(on: boolean): void;
  /** The card the hand has selected, for whoever shows it large; nothing while none is. */
  selection(): { readonly id: CardId; readonly refusal: Refusal } | undefined;
  /** Lets the selected card go, the aim it stands on with it, and answers whether one was. */
  unselect(): boolean;
};

/**
 * What the presses on the hand are answered by. Each aim is handed the card's place in the hand and
 * what to call when it comes down, and answers the way to take it down from outside.
 */
export type HandPresses = {
  /** Plays the card at this place in the hand, which aims at nothing. */
  play(index: number): void;
  /** The hand has taken the selection: whatever else the screen selects or inspects goes. */
  dismiss(): void;
  /** The map lit for the card's aim; `released` says the aim is off it and the card let go of. */
  aimTile(index: number, card: AimedCard, released: () => void): () => void;
  /** The aim window raised on the discard pile; `closed` says it came down with nothing paid. */
  aimDiscardPile(index: number, closed: () => void): () => void;
  inspect(id: CardId, refusal: Refusal): void;
};

/**
 * The hand between the two piles. Cards keep their fixed gap until the lane runs out, then
 * compress evenly onto one another; the one under the pointer comes to the front. A left click
 * takes a card as the selection, lifted out of the lane and ringed, and a second one on it is that
 * card's own act; a drag is the two clicks in one gesture. A right click on a card shows it large,
 * whatever else stands. While a card is aimed at the discard pile the hand lies under the window's
 * scrim.
 */
export function createHand(
  scene: Phaser.Scene,
  on: Surface,
  catalogue: Catalogue,
  presses: HandPresses,
): Hand {
  const laneLeft = MARGIN + CARD_WIDTH + LANE_PAD;
  const laneWidth = DESIGN_WIDTH - 2 * laneLeft;
  const note = createRefusalNote(scene, on);
  const line = createAimLine(scene, on);

  let slots: Slot[] = [];
  /** What the hand has in the air and no slot holds; a render owns it and takes it down. */
  let flying: Phaser.GameObjects.Container[] = [];
  let dragged: Drag | undefined;
  /** The card the hand has selected, and the way to take down the aim it is being aimed by. */
  let selected: Selected | undefined;
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

  /** Whether a card stands out of the lane: the one under the pointer, and the selected one. */
  const raised = (slot: Slot): boolean => slot.hovered || selected?.slot === slot;

  const restingY = (slot: Slot): number => slot.home.y - (raised(slot) ? CARD_LIFT : 0);

  /** The card back where it rests, at once or over that long; the promise settles when it is home. */
  const settle = (slot: Slot, duration: number): Promise<void> => {
    stopMotion(scene, slot.face.root);
    slot.face.root.setDepth(raised(slot) ? 40 : 5 + slot.index);
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

  /** Every reason the rules refuse this card, over it and clear of the lift a selection gives it. */
  const refuse = (slot: Slot): void => {
    note.overCard(
      refused(costOf(catalogue, slot.id), slot.refusal),
      slot.home.x,
      slot.home.y - CARD_LIFT - CARD_HEIGHT,
    );
  };

  /** The card aimed at a tile or at a unit says so: the point on its ring, the line over the hand. */
  const aiming = (slot: Slot, aim: AimedCard['aim']): void => {
    slot.face.aim(true);
    line.show(slot.id, aim);
  };

  /** The card is being aimed no longer: the point comes off its ring and the line goes with it. */
  const aimedNoMore = (slot: Slot): void => {
    slot.face.aim(false);
    line.hide();
  };

  /** The card let go of: it comes down into the lane, unringed, whatever it was doing out of it. */
  const letGoOf = (slot: Slot): Promise<void> => {
    aimedNoMore(slot);
    slot.face.select(false);
    slot.hovered = false;
    return settle(slot, 150);
  };

  /**
   * How the aim on the map says it was let go of where it stands — a press beside the tiles, the
   * back key: the card comes home, unless the hand let it go and took the aim down itself.
   */
  const releasing =
    (slot: Slot): (() => void) =>
    () => {
      if (selected?.slot !== slot) return;
      selected = undefined;
      letGoOf(slot);
    };

  /**
   * How the aim window says it closed with nothing paid: the card keeps the selection it was aimed
   * from, so the next press on it raises the window again, and the way to close it goes with it.
   */
  const closing =
    (slot: Slot): (() => void) =>
    () => {
      const standing = selected;
      if (standing === undefined || standing.slot !== slot) return;
      standing.cancel = undefined;
    };

  const unselect = (): boolean => {
    const standing = selected;
    if (standing === undefined) return false;
    selected = undefined;
    standing.cancel?.();
    letGoOf(standing.slot);
    return true;
  };

  /**
   * The card the hand takes as the selection: whatever it held comes home, the card lifts out of the
   * lane and takes the ring, and one that aims at a tile or at a unit is being aimed from here. A
   * card aimed at the discard pile waits for its second press to raise the window.
   */
  const select = (slot: Slot): Selected => {
    unselect();
    presses.dismiss();
    const standing: Selected = { slot, cancel: undefined };
    selected = standing;
    slot.face.select(true);
    settle(slot, 120);

    const card = aimOf(cardOf(catalogue, slot.id));
    switch (card.aim) {
      case 'none':
      case 'discard-pile':
        break;
      case 'tile':
      case 'unit':
        standing.cancel = presses.aimTile(slot.index, card, releasing(slot));
        aiming(slot, card.aim);
        break;
    }
    return standing;
  };

  /**
   * The press on the selection, the selected card's own act; one already being aimed stays as it
   * stands. Nothing has changed since the render, so the refusal the slot holds is still the rules'
   * answer.
   */
  const act = (standing: Selected): void => {
    const { slot } = standing;
    if (!slot.playable) {
      refuse(slot);
      return;
    }
    const card = aimOf(cardOf(catalogue, slot.id));
    switch (card.aim) {
      case 'none':
        letGo = slot;
        presses.play(slot.index);
        break;
      case 'discard-pile':
        standing.cancel = presses.aimDiscardPile(slot.index, closing(slot));
        break;
      case 'tile':
      case 'unit':
        break;
    }
  };

  const render = (chronicle: Chronicle): void => {
    note.hide();
    unselect();
    for (const face of [...flying, ...slots.map((slot) => slot.face.root)]) {
      stopMotion(scene, face);
      face.destroy();
    }
    flying = [];
    dragged = undefined;
    letGo = undefined;

    const held = chronicle.hand.length;
    const advance =
      held > 1 ? Math.min(CARD_WIDTH + GAP, (laneWidth - CARD_WIDTH) / (held - 1)) : 0;
    const first = laneLeft + (laneWidth - (CARD_WIDTH + (held - 1) * advance)) / 2;

    slots = chronicle.hand.map((id, index) => {
      const off = index - (held - 1) / 2;
      const refusal = refusalOf(catalogue, chronicle, id);
      const slot: Slot = {
        face: createCardFace(scene, cardFace(catalogue, id), refusal),
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
          unselect();
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
          slot.face.select(grabbed.y - at.y > PLAY_HEIGHT);
        })
        .on('dragend', (pointer: Phaser.Input.Pointer) => {
          if (dragged === undefined) return;
          const { grabbed } = dragged;
          dragged = undefined;
          slot.face.select(false);

          if (releasedOffCanvas(pointer)) {
            slot.hovered = false;
            settle(slot, 150);
            return;
          }
          const at = on.at(pointer.x, pointer.y);
          if (grabbed.y - at.y <= PLAY_HEIGHT) {
            settle(slot, 150);
            return;
          }
          act(select(slot));
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
        const standing = selected;
        if (standing?.slot === slot) act(standing);
        else select(slot);
      });

      onClick(
        slot.face.root,
        () => {
          presses.inspect(slot.id, slot.refusal);
        },
        'right',
      );

      return slot;
    });
    live(taking);
  };

  /**
   * The cards at the places the change names leaving for the discard pile, in the order named: every
   * one straightens as it goes, the last one landing a stagger behind the one before it, and the
   * hand is laid out anew where they all land.
   */
  const toDiscardPile = async (places: readonly number[], chronicle: Chronicle): Promise<void> => {
    const going: Slot[] = [];
    for (const place of places) {
      const slot = slots[place];
      if (slot === undefined) {
        console.error(`no card of the hand at place ${place}, the hand holding ${slots.length}`);
        continue;
      }
      going.push(slot);
    }
    const leaving = going.map((slot) => slot.face.root);
    flying = leaving;
    slots = slots.filter((slot) => !going.includes(slot));
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
    return letGoOf(slot);
  };

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'discarded':
        return toDiscardPile(stage.places, stage.chronicle);
      case 'drawn':
        return fromDrawPile(stage.chronicle);
      case 'enter':
      case 'move':
      case 'damaged':
      case 'killed':
      case 'refreshed':
      case 'action-spent':
      case 'retiled':
      case 'charted':
      case 'held':
      case 'settled':
      case 'stock':
      case 'population':
      case 'assigned':
      case 'laid':
      case 'recalled':
      case 'shuffled':
      case 'left':
      case 'turn':
      case 'rolled':
      case 'dealt':
      case 'taken':
      case 'ended':
      case 'runtime-error':
        return undefined;
    }
  };

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'refused':
        return comeHome();
      case 'played':
      case 'assign':
      case 'claim':
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'capstone-landing':
      case 'capstone-continued':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'attack':
      case 'camp-capture':
        return undefined;
    }
  };

  return {
    render,
    live,
    selection(): { readonly id: CardId; readonly refusal: Refusal } | undefined {
      if (selected === undefined) return undefined;
      return { id: selected.slot.id, refusal: selected.slot.refusal };
    },
    unselect,
    play(stage: Stage): Promise<void> | undefined {
      switch (stage.kind) {
        case 'change':
          return changed(stage);
        case 'group':
          return grouped(stage);
      }
    },
  };
}
