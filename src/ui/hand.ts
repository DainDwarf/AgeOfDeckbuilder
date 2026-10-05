import Phaser from 'phaser';
import { aimOf } from '../rules/cards';
import { type AimedCard, type Catalogue, cardOf } from '../rules/catalogue';
import { costOf, refusalOf } from '../rules/chronicle';
import type { Aimed, Change, Group, Stage } from '../rules/stages';
import {
  type Chronicle,
  type ChronicleCard,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { createAimLine, type PointedAim } from './aim-line';
import { pressOf } from './bindings';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_LIFT,
  CARD_WIDTH,
  type CardFace,
  createCardBack,
  createCardFace,
  type KindBubble,
  type Name,
} from './card-face';
import { ended, SLIDE_HOME, STAGGER, stopMotion, travel, turnOver } from './card-motion';
import {
  answersPress,
  DESIGN_WIDTH,
  type Hover,
  MARGIN,
  onClick,
  onHover,
  onLetGoOffCanvas,
  type Stratum,
} from './design-space';
import { cardFace } from './face';
import { PILE_PLACE } from './piles';
import { refused } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import type { Raiser, SmallCards } from './small-card';

/** The clear water between a pile and the lane the hand fans out in. */
const LANE_PAD = 28;
const GAP = 12;
const FAN = 0.5;

/** How far up a card has to come out of the hand before releasing it plays it. */
const PLAY_HEIGHT = 110;

type Slot = {
  readonly face: CardFace;
  readonly card: ChronicleCard;
  readonly index: number;
  readonly home: { x: number; y: number };
  readonly refusal: Refusal;
  readonly playable: boolean;
  /** Where the pointer is on the card: its outline, and down to where it rests while it is hovered. */
  readonly hitArea: Phaser.Geom.Rectangle;
  /** Whether the pointer is on the card, the hand live or dead. */
  readonly hover: Hover;
  /** Whether the card stands lifted by the pointer on it. */
  hovered: boolean;
  /** Whether a small card raised off one of its names stands, which keeps it lifted. */
  held: boolean;
};

/** The card being dragged, where it was taken hold of, and where it stood at that moment. */
type Drag = {
  readonly slot: Slot;
  readonly grabbed: { x: number; y: number };
  readonly lifted: { x: number; y: number };
};

/**
 * The selected card, how the aim it is being aimed by is taken down while one stands, and whether it
 * is being aimed at the hand.
 */
type Selected = { readonly slot: Slot; cancel: (() => void) | undefined; atHand: boolean };

export type Hand = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** The one gate on the hand's pointer: no hover, no click and no drag while it is shut. */
  live(on: boolean): void;
  /** The card the hand has selected, for whoever shows it large; nothing while none is. */
  selection(): ChronicleCard | undefined;
  /** Lets the selected card go, the aim it stands on with it, and answers whether one was. */
  unselect(): boolean;
  /** Lets the card being aimed go as `unselect` does; a card selected and not being aimed stays. */
  unaim(): void;
  /** Whether the object is a card of the hand, every left click on which the hand answers itself. */
  owns(object: Phaser.GameObjects.GameObject): boolean;
};

/**
 * What the presses on the hand are answered by. Each aim is handed the card's place in the hand and
 * what to call when it comes down, and answers the way to take it down from outside.
 */
export type HandPresses = {
  /** Plays the card at this place in the hand, at nothing or at another card of the hand. */
  play(index: number, aimed: Extract<Aimed, { readonly aim: 'none' | 'hand' }>): void;
  /** The hand has taken the selection: whatever else the screen selects or inspects goes. */
  dismiss(): void;
  /**
   * The map lit for the card's aim; `released` says the aim is off it and the card let go of, and
   * `retargeted` that the card is being aimed at another kind of thing from then.
   */
  aimTile(
    index: number,
    card: AimedCard,
    released: () => void,
    retargeted: (aim: PointedAim) => void,
  ): () => void;
  /** The aim window raised on the discard pile; `closed` says it came down with nothing paid. */
  aimDiscardPile(index: number, closed: () => void): () => void;
  inspect(card: ChronicleCard): void;
  /** What a name on a card of the hand names, shown large. */
  inspectNamed(name: Name): void;
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
  on: {
    readonly resting: Stratum;
    readonly flight: Stratum;
    readonly lifted: Stratum;
    readonly aimLine: Stratum;
    readonly note: Stratum;
  },
  { kinds, small }: { readonly kinds: KindBubble; readonly small: SmallCards },
  catalogue: Catalogue,
  presses: HandPresses,
): Hand {
  const laneLeft = MARGIN + CARD_WIDTH + LANE_PAD;
  const laneWidth = DESIGN_WIDTH - 2 * laneLeft;
  const note = createRefusalNote(scene, on.note);
  const line = createAimLine(scene, on.aimLine);

  let slots: Slot[] = [];
  /** Whether the small cards standing were raised off a name of the hand's, and not the piles'. */
  let chained = false;
  /** What the hand has in the air and no slot holds; a render owns it and takes it down. */
  let flying: Phaser.GameObjects.Container[] = [];
  let dragged: Drag | undefined;
  /** The card the hand has selected, and the way to take down the aim it is being aimed by. */
  let selected: Selected | undefined;
  /** The card the hand has let go of, waiting on the stages its play resolves as. */
  let letGo: Slot | undefined;
  /** Whether the hand answers the pointer; a play-out puts it down for as long as it runs. */
  let taking = true;

  // A dead card stays interactive, so a press on it stops there, and no leave comes as the hand dies:
  // a bubble or a rest on a name the pointer on a card began is let go of here.
  const live = (on: boolean): void => {
    taking = on;
    if (on) return;
    for (const slot of slots) {
      kinds.over(slot.face, false);
      if (slot.hover.hovered) small.over(undefined);
    }
  };

  /** Whether a card stands out of the lane: the one under the pointer, one held, the selected one. */
  const raised = (slot: Slot): boolean => slot.hovered || slot.held || selected?.slot === slot;

  const restingY = (slot: Slot): number => slot.home.y - (raised(slot) ? CARD_LIFT : 0);

  /** The card back where it rests, at once or over that long; the promise settles when it is home. */
  const settle = (slot: Slot, duration: number): Promise<void> => {
    stopMotion(scene, slot.face.root);
    (raised(slot) ? on.lifted : on.resting).layer.add(slot.face.root);
    // Short of its resting place, a card lifted by a hover rises off a pointer holding still near its
    // bottom edge, is left and falls back onto it, frame after frame.
    slot.hitArea.height = CARD_HEIGHT + (slot.hovered ? CARD_LIFT : 0);
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
      refused(costOf(catalogue, slot.card.id), slot.refusal),
      slot.home.x,
      slot.home.y - CARD_LIFT - CARD_HEIGHT,
    );
  };

  /** The card being aimed says so: the point on its ring, the line over the hand. */
  const aiming = (slot: Slot, aim: PointedAim): void => {
    slot.face.aim(true);
    line.show(slot.card.id, aim);
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
    return settle(slot, SLIDE_HOME);
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

  const beingAimed = (): boolean => selected?.cancel !== undefined || selected?.atHand === true;

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
   * card aimed at the discard pile or at the hand waits for its second press.
   */
  const select = (slot: Slot): Selected => {
    unselect();
    presses.dismiss();
    const standing: Selected = { slot, cancel: undefined, atHand: false };
    selected = standing;
    slot.face.select(true);
    settle(slot, 120);

    const card = aimOf(cardOf(catalogue, slot.card.id));
    switch (card.aim) {
      case 'none':
      case 'discard-pile':
      case 'hand':
        break;
      case 'tile':
      case 'unit':
        standing.cancel = presses.aimTile(slot.index, card, releasing(slot), (aim) => {
          if (selected?.slot === slot) aiming(slot, aim);
        });
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
    const card = aimOf(cardOf(catalogue, slot.card.id));
    switch (card.aim) {
      case 'none':
        letGo = slot;
        presses.play(slot.index, { aim: 'none' });
        break;
      case 'discard-pile':
        standing.cancel = presses.aimDiscardPile(slot.index, closing(slot));
        break;
      case 'hand':
        standing.atHand = true;
        aiming(slot, card.aim);
        break;
      case 'tile':
      case 'unit':
        break;
    }
  };

  /**
   * No refusal is read here: the hand offers the aim to a playable card alone, and the rules admit
   * every other card of the hand.
   */
  const playAt = (standing: Selected, at: Slot): void => {
    letGo = standing.slot;
    presses.play(standing.slot.index, { aim: 'hand', card: at.index });
  };

  /** The card carried to where the pointer stands, ringed once it is clear of the play height. */
  const carry = (pointer: Phaser.Input.Pointer): void => {
    if (dragged === undefined) return;
    const { slot, grabbed, lifted } = dragged;
    const at = on.resting.at(pointer.x, pointer.y);
    slot.face.root.setPosition(lifted.x + at.x - grabbed.x, lifted.y + at.y - grabbed.y);
    slot.face.select(grabbed.y - at.y > PLAY_HEIGHT);
  };

  /** The one place a drag ends on the canvas: played past the play height, and home under it. */
  const resolve = (pointer: Phaser.Input.Pointer): void => {
    const carrying = dragged;
    if (carrying === undefined) return;
    dragged = undefined;
    carrying.slot.face.select(false);
    const at = on.resting.at(pointer.x, pointer.y);
    if (carrying.grabbed.y - at.y <= PLAY_HEIGHT) {
      settle(carrying.slot, SLIDE_HOME);
      return;
    }
    act(select(carrying.slot));
  };

  /** The drag let go of with nothing played: a scrim rose over the screen, or the release landed off it. */
  const abandonDrag = (): void => {
    const carrying = dragged;
    if (carrying === undefined) return;
    dragged = undefined;
    letGoOf(carrying.slot);
  };

  // Phaser ends a drag at any button's release (docs/PHASER.md): past its start, the card reads the
  // scene's own moves and releases.
  scene.input.on('pointermove', carry);
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pressOf(pointer) === 'left') resolve(pointer);
  });
  onLetGoOffCanvas(scene, (press) => {
    if (press === 'left') abandonDrag();
  });

  /** The name of this card under the pointer, handed over as the small cards take one. */
  const nameUnder = (slot: Slot, pointer: Phaser.Input.Pointer): Raiser | undefined => {
    const at = on.resting.at(pointer.x, pointer.y);
    const name = slot.face.nameAt(at.x, at.y);
    if (name === undefined) return undefined;
    return {
      name,
      where: () => slot.face.spotOf(name),
      hold: (held) => {
        chained = held;
        slot.held = held;
        if (dragged === undefined && slots.includes(slot)) settle(slot, 120);
      },
    };
  };

  /** Whether the pointer is on this card's kind label. */
  const onKind = (slot: Slot, pointer: Phaser.Input.Pointer): boolean => {
    const at = on.resting.at(pointer.x, pointer.y);
    return slot.face.kindAt(at.x, at.y);
  };

  const render = (chronicle: Chronicle): void => {
    if (chained) small.down();
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

    slots = chronicle.hand.map((card, index) => {
      const off = index - (held - 1) / 2;
      const refusal = refusalOf(catalogue, chronicle, card.id);
      const face = createCardFace(scene, cardFace(catalogue, card), refusal);
      const slot: Slot = {
        face,
        card,
        index,
        home: {
          x: first + CARD_WIDTH / 2 + index * advance,
          y: CARD_BASELINE + off * off * FAN * 1.6,
        },
        refusal,
        playable: playable(refusal),
        hitArea: new Phaser.Geom.Rectangle(-CARD_WIDTH / 2, -CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT),
        hover: onHover(
          face.root,
          () => {
            if (dragged !== undefined || !taking) return;
            slot.hovered = true;
            settle(slot, 120);
          },
          () => {
            small.over(undefined);
            kinds.over(face, false);
            if (dragged !== undefined || !taking) return;
            slot.hovered = false;
            settle(slot, 120);
          },
        ),
        hovered: false,
        held: false,
      };

      on.resting.layer.add(slot.face.root);
      slot.face.root
        .setName(`hand-${index}`)
        .setPosition(slot.home.x, slot.home.y)
        .setRotation(Phaser.Math.DegToRad(off * FAN))
        .setDepth(index)
        .setInteractive({
          hitArea: slot.hitArea,
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          draggable: true,
        })
        .on('dragstart', (pointer: Phaser.Input.Pointer) => {
          if (!taking) return;
          kinds.over(slot.face, false);
          unselect();
          slot.hovered = true;
          settle(slot, 0);
          dragged = {
            slot,
            grabbed: on.resting.at(pointer.downX, pointer.downY),
            lifted: { x: slot.home.x, y: restingY(slot) },
          };
        })
        .on('pointermove', (pointer: Phaser.Input.Pointer) => {
          const answering = taking && dragged === undefined;
          small.over(answering ? nameUnder(slot, pointer) : undefined);
          kinds.over(slot.face, answering && onKind(slot, pointer));
        });

      answersPress(slot.face.root, () => taking);

      onClick(slot.face.root, () => {
        if (!taking) return;
        const standing = selected;
        if (standing?.slot === slot) act(standing);
        else if (standing?.atHand === true) playAt(standing, slot);
        else select(slot);
      });

      onClick(
        slot.face.root,
        (pointer) => {
          if (!taking) return;
          const named = nameUnder(slot, pointer)?.name;
          if (named === undefined) presses.inspect(slot.card);
          else presses.inspectNamed(named);
        },
        'right',
      );

      return slot;
    });
  };

  /** A card in the air, over every card of its block that left before it. */
  const fly = (card: Phaser.GameObjects.Container, place: number): Phaser.GameObjects.Container => {
    on.flight.layer.add(card);
    return card.setDepth(place);
  };

  /**
   * The cards at the places the change names leaving for the discard pile, in the order named, each
   * first turned over into the card it lies there as; the hand is laid out anew where they all land.
   */
  const toDiscardPile = async (places: readonly number[], chronicle: Chronicle): Promise<void> => {
    // The change carries no ids: its cards are the top of the pile, in its places' order (`Change`).
    const lying = chronicle.discardPile.slice(chronicle.discardPile.length - places.length);
    const going: { readonly slot: Slot; readonly lies: ChronicleCard }[] = [];
    places.forEach((place, at) => {
      const slot = slots[place];
      if (slot === undefined) {
        console.error(`no card of the hand at place ${place}, the hand holding ${slots.length}`);
        return;
      }
      going.push({ slot, lies: lying[at] });
    });
    const flights = going.map(({ slot, lies }, index) => {
      const face = slot.face.root;
      stopMotion(scene, face);
      fly(face, index);
      if (lies.id === slot.card.id) return { faces: [face], shown: face, turned: undefined };
      const into = fly(
        createCardFace(scene, cardFace(catalogue, lies), NO_REFUSAL)
          .root.setPosition(face.x, face.y)
          .setRotation(face.rotation)
          .setVisible(false),
        index,
      );
      return { faces: [face, into], shown: into, turned: turnOver(scene, face, into) };
    });
    const leaving = flights.flatMap(({ faces }) => faces);
    flying = leaving;
    slots = slots.filter((slot) => !going.some((one) => one.slot === slot));
    await Promise.all(
      flights.map(async ({ shown, turned }, index) => {
        await turned;
        const to = { ...PILE_PLACE['discard-pile'], rotation: 0 };
        return travel(scene, shown, to, index * STAGGER);
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
        const place = index - standing.length;
        const back = fly(
          createCardBack(scene).setPosition(PILE_PLACE['draw-pile'].x, PILE_PLACE['draw-pile'].y),
          place,
        );
        flying.push(back);
        return travel(scene, back, home, place * STAGGER).then(() => turnOver(scene, back, face));
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
      case 'healed':
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
      case 'added':
      case 'recalled':
      case 'shuffled':
      case 'left':
      case 'turn':
      case 'rolled':
      case 'dealt':
      case 'taken':
      case 'ended':
      case 'tallied':
      case 'reached':
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
    selection(): ChronicleCard | undefined {
      return selected?.slot.card;
    },
    unselect,
    unaim(): void {
      if (beingAimed()) unselect();
    },
    owns(object: Phaser.GameObjects.GameObject): boolean {
      return slots.some((slot) => slot.face.root === object);
    },
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
