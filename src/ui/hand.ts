import Phaser from 'phaser';
import { aimOf, playedByNothing } from '../rules/cards';
import { type AimedCard, type Catalogue, cardOf, costOf } from '../rules/catalogue';
import { refusalOf } from '../rules/chronicle';
import type { Aimed, Change, Group, Stage } from '../rules/stages';
import {
  type Chronicle,
  type ChronicleCard,
  cardKeyed,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { createAimLine } from './aim-line';
import { trayNow } from './band';
import { pressOf } from './bindings';
import {
  CARD_HEIGHT,
  type CardFace,
  createCardBack,
  type FootBubble,
  type FootLabel,
  type Name,
  pressedOnFace,
  type Raiser,
  type SmallCards,
} from './card-face';
import { CARD_WIDTH } from './card-frames';
import { ended, SLIDE_HOME, STAGGER, stopMotion, travel, turnOver } from './card-motion';
import type { ChronicleFaces } from './chronicle-faces';
import {
  type Hover,
  NO_REACTION,
  onClick,
  onHover,
  onLetGoOffCanvas,
  onResize,
  type Pointing,
  reactsTo,
  type Stratum,
  tookHold,
} from './design-space';
import { cardFace } from './face';
import { LOOK } from './look';
import { atPile, pileOf } from './piles';
import { asPainted, poolOf } from './pool';
import { refused } from './refusal-lines';
import { createRefusalNote } from './refusal-note';

const GAP = 12;
const FAN = 0.5;

/** How far up a card has to come out of the hand before releasing it plays it. */
const PLAY_HEIGHT = 110;

/**
 * What the hand keeps of a card's face from the first render that meets it: what the last render
 * wrote of its card, and what the pointer is doing to it.
 */
type CardRecord = {
  readonly face: CardFace;
  card: ChronicleCard;
  home: { x: number; y: number; rotation: number };
  refusal: Refusal;
  /** Whether the pointer is on the card, the hand live or dead. */
  readonly hover: Hover;
  /** Whether the card stands lifted by the pointer on it. */
  hovered: boolean;
  /** Whether a small card raised off one of its names stands, which keeps it lifted. */
  held: boolean;
};

/** The card being dragged, where it was taken hold of, and where it stood at that moment. */
type Drag = {
  readonly record: CardRecord;
  readonly grabbed: { x: number; y: number };
  readonly lifted: { x: number; y: number };
};

/**
 * The selected card, how the aim it is being aimed by is taken down while one stands, and whether it
 * is being aimed at the hand.
 */
type Selected = {
  readonly record: CardRecord;
  cancel: (() => void) | undefined;
  atHand: boolean;
};

/**
 * How much of the pointer the hand takes: every press; the hover, the rest and the right click, and
 * no left click and no drag; or nothing.
 */
export type HandLive = 'live' | 'read' | 'dead';

export type Hand = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
  /** The one gate on the hand's pointer. */
  live(state: HandLive): void;
  /** The card the hand has selected, for whoever shows it large; nothing while none is. */
  selection(): ChronicleCard | undefined;
  /** Lets the selected card go, the aim it stands on with it, and answers whether one was. */
  unselect(): boolean;
  /** Lets the card being aimed go as `unselect` does; a card selected and not being aimed stays. */
  unaim(): void;
  /** Whether the object is a card of the hand: the hand itself reacts to every left click on it. */
  owns(object: Phaser.GameObjects.GameObject): boolean;
};

/**
 * What the hand reacts to its presses with. Each aim is handed the card and what to call when
 * it comes down, and answers the way to take it down from outside.
 */
export type HandPresses = {
  /** Plays the card of this key, at nothing or at another card of the hand. */
  play(key: number, aimed: Extract<Aimed, { readonly aim: 'none' | 'hand' }>): void;
  /** The hand has taken the selection: whatever else the screen selects or inspects goes. */
  dismiss(): void;
  /** The map lit for the card's aim; `released` says the aim is off it and the card let go of. */
  aimTile(held: ChronicleCard, card: AimedCard, released: () => void): () => void;
  inspect(card: ChronicleCard): void;
  /** What a name on a card of the hand names, shown large. */
  inspectNamed(name: Name): void;
};

/**
 * The hand in the lane between the draw pile and the discard pile, its cards compressing evenly onto
 * one another once the lane runs out.
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
  {
    footBubble,
    small,
    cards,
  }: {
    readonly footBubble: FootBubble;
    readonly small: SmallCards;
    readonly cards: ChronicleFaces;
  },
  catalogue: Catalogue,
  presses: HandPresses,
): Hand {
  const note = createRefusalNote(scene, on.note);
  const line = createAimLine(scene, on.aimLine);
  /** The backs the cards drawn ride on. */
  const backs = poolOf(on.flight.layer, () => createCardBack(scene).root);

  /** Every card the hand has met whose face still stands, by key. */
  const records = new Map<number, CardRecord>();
  /** The cards lying in the hand, in hand order; one leaving for a pile is out of it from take-off. */
  let laidOut: CardRecord[] = [];
  /** How many renders have run: a motion stopped by one reads this and stops short of what it chains. */
  let renders = 0;
  /** Whether the small cards standing were raised off a name of the hand's, and not the piles'. */
  let chained = false;
  let dragged: Drag | undefined;
  /** The card the hand has selected, and the way to take down the aim it is being aimed by. */
  let selected: Selected | undefined;
  /** The card the hand has let go of, waiting on the stages its play resolves as. */
  let letGo: CardRecord | undefined;
  /** How much of the pointer the hand takes; a play-out puts it dead for as long as it runs. */
  let taking: HandLive = 'live';

  /** Whether the hand lifts the card under the pointer and raises what a rest on it raises. */
  const reads = (): boolean => {
    switch (taking) {
      case 'live':
      case 'read':
        return true;
      case 'dead':
        return false;
    }
  };

  /** Whether the hand takes a left click and a drag. */
  const takes = (): boolean => taking === 'live';

  // A dead card stays interactive, so a press on it stops there, and no leave comes as the hand dies:
  // a bubble or a rest on a name the pointer on a card began is let go of here.
  const live = (state: HandLive): void => {
    taking = state;
    if (reads()) {
      // A card kept through a render while dead heard its enter ignored, and no other comes.
      for (const record of laidOut.filter((one) => one.hover.hovered && !one.hovered)) {
        record.hovered = true;
        settle(record, 120);
      }
      return;
    }
    for (const record of laidOut) {
      footBubble.over(record.face, undefined);
      if (record.hover.hovered) small.over(undefined);
    }
  };

  /** Whether a card stands out of the lane: the one under the pointer, one held, the selected one. */
  const raised = (record: CardRecord): boolean =>
    record.hovered || record.held || selected?.record === record;

  const restingY = (record: CardRecord): number =>
    raised(record) ? trayNow().liftedBottom : record.home.y;

  /** How far a card lifted out of the lane has risen off where it rests: more at the fan's ends. */
  const riseOf = (record: CardRecord): number => record.home.y - trayNow().liftedBottom;

  /** Where the card at that place of a hand holding that many rests, in the lane between the piles. */
  const homeOf = (index: number, held: number): CardRecord['home'] => {
    const { lane, baseline } = trayNow();
    const laneWidth = lane.right - lane.left;
    const advance =
      held > 1 ? Math.min(CARD_WIDTH + GAP, (laneWidth - CARD_WIDTH) / (held - 1)) : 0;
    const first = lane.left + (laneWidth - (CARD_WIDTH + (held - 1) * advance)) / 2;
    const off = index - (held - 1) / 2;
    return {
      x: first + CARD_WIDTH / 2 + index * advance,
      y: baseline + off * off * FAN * 1.6,
      rotation: Phaser.Math.DegToRad(off * FAN),
    };
  };

  /**
   * The card back where it rests, lifted or lying, at once or over that long; the promise settles
   * when it is home.
   */
  const settle = (record: CardRecord, duration: number): Promise<void> => {
    stopMotion(scene, record.face.root);
    const lifted = raised(record);
    (lifted ? on.lifted : on.resting).layer.add(record.face.root);
    record.face.lift(lifted);
    record.face.root.setRotation(lifted ? 0 : record.home.rotation);
    if (duration === 0) {
      record.face.root.setPosition(record.home.x, restingY(record));
      return Promise.resolve();
    }
    return ended(
      scene.tweens.add({
        targets: record.face.root,
        x: record.home.x,
        y: restingY(record),
        duration,
        ease: 'Sine.easeInOut',
      }),
    );
  };

  /** Every reason the rules refuse this card, over the top of it as a selection lifts it. */
  const refuse = (record: CardRecord): void => {
    note.overCard(
      refused(costOf(catalogue, record.card.id), record.refusal),
      record.home.x,
      trayNow().liftedBottom - LOOK.liftedCard * CARD_HEIGHT,
    );
  };

  /** The card let go of: it comes down into the lane, whatever it was doing out of it, its aim's line gone. */
  const letGoOf = (record: CardRecord): Promise<void> => {
    line.hide();
    record.hovered = false;
    return settle(record, SLIDE_HOME);
  };

  /**
   * How the aim on the map says it was let go of where it stands — a press beside the tiles, the
   * back key: the card comes home, unless the hand let it go and took the aim down itself.
   */
  const releasing =
    (record: CardRecord): (() => void) =>
    () => {
      if (selected?.record !== record) return;
      selected = undefined;
      letGoOf(record);
    };

  const beingAimed = (): boolean => selected?.cancel !== undefined || selected?.atHand === true;

  /** Whether the card's face shows the rules refuse it: a cost the city cannot pay, or the sign of a card nothing plays. */
  const refusedOnFace = ({ card, refusal }: CardRecord): boolean =>
    refusal.unaffordable.length > 0 || playedByNothing(cardOf(catalogue, card.id));

  const unselect = (): boolean => {
    const standing = selected;
    if (standing === undefined) return false;
    selected = undefined;
    standing.cancel?.();
    letGoOf(standing.record);
    return true;
  };

  /**
   * The card the hand takes as the selection: whatever it held comes home, the card lifts out of the
   * lane, and one that aims at a tile or at a unit is being aimed from here. A card aimed at the hand
   * waits for its second press.
   */
  const select = (record: CardRecord): Selected => {
    unselect();
    presses.dismiss();
    const standing: Selected = { record, cancel: undefined, atHand: false };
    selected = standing;
    settle(record, 120);

    const card = aimOf(cardOf(catalogue, record.card.id));
    switch (card.aim) {
      case 'none':
      case 'hand':
        break;
      case 'tile':
      case 'unit':
        standing.cancel = presses.aimTile(record.card, card, releasing(record));
        line.show(record.card.id, card.aim);
        break;
    }
    return standing;
  };

  /**
   * The press on the selection, the selected card's own act; one already being aimed stays as it
   * stands. Nothing has changed since the render, so the refusal the record holds is still the
   * rules' answer.
   */
  const act = (standing: Selected): void => {
    const { record } = standing;
    if (!playable(record.refusal)) {
      refuse(record);
      return;
    }
    const card = aimOf(cardOf(catalogue, record.card.id));
    switch (card.aim) {
      case 'none':
        letGo = record;
        presses.play(record.card.key, { aim: 'none' });
        break;
      case 'hand':
        standing.atHand = true;
        line.show(record.card.id, card.aim);
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
  const playAt = (standing: Selected, at: CardRecord): void => {
    letGo = standing.record;
    presses.play(standing.record.card.key, { aim: 'hand', card: at.card.key });
  };

  /** The card carried to where the pointer stands. */
  const carry = (pointer: Phaser.Input.Pointer): void => {
    if (dragged === undefined) return;
    const { record, grabbed, lifted } = dragged;
    const at = on.resting.at(pointer.x, pointer.y);
    record.face.root.setPosition(lifted.x + at.x - grabbed.x, lifted.y + at.y - grabbed.y);
  };

  /** The one place a drag ends on the canvas: played past the play height, and home under it. */
  const resolve = (pointer: Phaser.Input.Pointer): void => {
    const carrying = dragged;
    if (carrying === undefined) return;
    dragged = undefined;
    const at = on.resting.at(pointer.x, pointer.y);
    if (carrying.grabbed.y - at.y <= PLAY_HEIGHT) {
      settle(carrying.record, SLIDE_HOME);
      return;
    }
    act(select(carrying.record));
  };

  /** The drag let go of with nothing played: a scrim rose over the screen, or the release landed off it. */
  const abandonDrag = (): void => {
    const carrying = dragged;
    if (carrying === undefined) return;
    dragged = undefined;
    letGoOf(carrying.record);
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
  // The scene's own cut at a resize, subscribed before this one, cuts every text for its own size
  // (followFactor), a lifted card's among them.
  onResize(scene, () => {
    laidOut.forEach((record, index) => {
      const was = record.home;
      record.home = homeOf(index, laidOut.length);
      if (dragged?.record !== record) {
        settle(record, 0);
        return;
      }
      const by = { x: record.home.x - was.x, y: record.home.y - was.y };
      const { grabbed, lifted } = dragged;
      dragged = {
        record,
        grabbed: { x: grabbed.x + by.x, y: grabbed.y + by.y },
        lifted: { x: lifted.x + by.x, y: lifted.y + by.y },
      };
      record.face.lift(true);
    });
  });

  /** The name of this card under the pointer, handed over as the small cards take one. */
  const nameUnder = (record: CardRecord, pointer: Phaser.Input.Pointer): Raiser | undefined => {
    const at = on.resting.at(pointer.x, pointer.y);
    const name = record.face.nameAt(at.x, at.y);
    if (name === undefined) return undefined;
    return {
      name,
      where: () => record.face.spotOf(name),
      hold: (held) => {
        chained = held;
        record.held = held;
        if (dragged === undefined && laidOut.includes(record)) settle(record, 120);
      },
    };
  };

  /** The label of this card's foot the pointer is on, and nothing where it is on none. */
  const onFoot = (record: CardRecord, pointer: Phaser.Input.Pointer): FootLabel | undefined => {
    const at = on.resting.at(pointer.x, pointer.y);
    return record.face.footAt(at.x, at.y);
  };

  /** The record of a card the hand holds for the first time, every press on its face bound. */
  const meet = (card: ChronicleCard): CardRecord => {
    const face = cards.of(card.key);
    const { root } = face;
    const record: CardRecord = {
      face,
      card,
      home: { x: 0, y: 0, rotation: 0 },
      refusal: NO_REFUSAL,
      hover: onHover(
        root,
        () => {
          if (dragged !== undefined || !reads()) return;
          record.hovered = true;
          settle(record, 120);
        },
        () => {
          small.over(undefined);
          footBubble.over(face, undefined);
          if (dragged !== undefined || !reads() || !laidOut.includes(record)) return;
          record.hovered = false;
          settle(record, 120);
        },
      ),
      hovered: false,
      held: false,
    };

    // Short of its resting place, a card lifted by a hover rises off a pointer holding still near its
    // bottom edge, is left and falls back onto it, frame after frame. The reach is in the card's own
    // space, so it grows with the lift.
    pressedOnFace(face, {
      reach: () => (record.hovered ? riseOf(record) / LOOK.liftedCard : 0),
      draggable: true,
    })
      .on('dragstart', (pointer: Phaser.Input.Pointer) => {
        if (!takes()) return;
        tookHold('left');
        footBubble.over(face, undefined);
        unselect();
        record.hovered = true;
        settle(record, 0);
        dragged = {
          record,
          grabbed: on.resting.at(pointer.downX, pointer.downY),
          lifted: { x: record.home.x, y: restingY(record) },
        };
      })
      .on('pointermove', (pointer: Phaser.Input.Pointer) => {
        const reacting = reads() && dragged === undefined;
        small.over(reacting ? nameUnder(record, pointer) : undefined);
        footBubble.over(face, reacting ? onFoot(record, pointer) : undefined);
      });

    reactsTo(root, (pointer): Pointing => {
      switch (taking) {
        case 'live':
          if (selected?.atHand === true && selected.record !== record) return { commands: 'aim' };
          return { refused: refusedOnFace(record), takesHold: true };
        case 'read':
          return {
            rests:
              nameUnder(record, pointer) !== undefined || onFoot(record, pointer) !== undefined,
          };
        case 'dead':
          return NO_REACTION;
      }
    });

    onClick(root, () => {
      if (!takes()) return;
      const standing = selected;
      if (standing?.record === record) act(standing);
      else if (standing?.atHand === true) playAt(standing, record);
      else select(record);
    });

    onClick(
      root,
      (pointer) => {
        if (!reads()) return;
        const named = nameUnder(record, pointer)?.name;
        if (named === undefined) presses.inspect(record.card);
        else presses.inspectNamed(named);
      },
      'right',
    );

    root.once('destroy', () => {
      records.delete(card.key);
    });
    records.set(card.key, record);
    return record;
  };

  /** The card out of the hand: it lies at its own size, reacts to the pointer no more, and its bubble comes down. */
  const letLeave = ({ face }: CardRecord): void => {
    stopMotion(scene, face.root);
    face.lift(false);
    footBubble.over(face, undefined);
    face.root.disableInteractive();
  };

  const render = (chronicle: Chronicle): void => {
    renders += 1;
    if (chained) small.down();
    note.hide();
    unselect();
    dragged = undefined;
    letGo = undefined;
    backs.hide();

    for (const record of laidOut) {
      if (cardKeyed(chronicle.hand, record.card.key) === undefined) letLeave(record);
    }

    laidOut = chronicle.hand.map((card, index) => {
      const record = records.get(card.key) ?? meet(card);
      const { face } = record;
      record.card = card;
      record.refusal = refusalOf(catalogue, chronicle, card.id);
      record.home = homeOf(index, chronicle.hand.length);
      face.read(cardFace(catalogue, card, chronicle.citySection.building), record.refusal);
      asPainted(face.root)
        .setRotation(record.home.rotation)
        .setName(`hand-${index}`)
        .setDepth(index)
        .setInteractive();
      record.hovered = reads() && record.hover.hovered;
      settle(record, 0);
      return record;
    });
  };

  /** A card in the air, over every card of its block that left before it. */
  const fly = (card: Phaser.GameObjects.Container, place: number): Phaser.GameObjects.Container => {
    on.flight.layer.add(card);
    return card.setDepth(place);
  };

  /**
   * The cards of the hand whose keys now lie in the pile leaving for it, in hand order, each first
   * turned over into the card it lies there as; the hand is laid out anew where they all land.
   */
  const toPile = async (
    pile: 'discard-pile' | 'exhaust-pile',
    chronicle: Chronicle,
  ): Promise<void> => {
    const going = laidOut.flatMap((record) => {
      const lies = cardKeyed(pileOf(chronicle, pile), record.card.key);
      return lies === undefined ? [] : [{ record, lies }];
    });
    laidOut = laidOut.filter((record) => !going.some((one) => one.record === record));
    const leftOn = renders;
    await Promise.all(
      going.map(async ({ record, lies }, index) => {
        const { face } = record;
        letLeave(record);
        fly(face.root.setName(''), index);
        if (lies.id !== record.card.id) {
          await turnOver(scene, face.root, () => {
            face.read(cardFace(catalogue, lies, chronicle.citySection.building), NO_REFUSAL);
            return face.root;
          });
          if (renders !== leftOn) return;
        }
        await travel(scene, face.root, atPile(pile), index * STAGGER);
        if (renders === leftOn) face.root.setVisible(false);
      }),
    );
    // A render while these were in the air took them down and painted the hand it stands on.
    if (renders === leftOn) render(chronicle);
  };

  /**
   * The block off the draw pile: a back leaves the pile for every card drawn and turns
   * face up where it lands, while the cards already held slide to the homes the wider fan gives
   * them.
   */
  const fromDrawPile = async (chronicle: Chronicle): Promise<void> => {
    const standing = laidOut.map(({ face: { root } }) => ({
      x: root.x,
      y: root.y,
      rotation: root.rotation,
    }));
    render(chronicle);
    const leftOn = renders;

    await Promise.all(
      laidOut.map(async ({ face: { root }, home }, index) => {
        const was = standing[index];
        if (was !== undefined) {
          root.setPosition(was.x, was.y).setRotation(was.rotation);
          await travel(scene, root, home);
          return;
        }

        root.setVisible(false);
        const place = index - standing.length;
        const from = atPile('draw-pile');
        const back = fly(
          backs.take().setPosition(from.x, from.y).setRotation(from.rotation).setScale(from.scale),
          place,
        );
        await travel(scene, back, { ...home, scale: 1 }, place * STAGGER);
        if (renders !== leftOn) return;
        await turnOver(scene, back, () => {
          back.setVisible(false);
          return root.setScale(0, 1).setVisible(true);
        });
      }),
    );
  };

  /** The play the rules refused: the card the hand let go of comes back down into its slot. */
  const comeHome = (): Promise<void> | undefined => {
    const record = letGo;
    letGo = undefined;
    if (record === undefined) return undefined;
    return letGoOf(record);
  };

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'discarded':
        return toPile('discard-pile', stage.chronicle);
      case 'exhausted':
        return toPile('exhaust-pile', stage.chronicle);
      case 'drawn':
        return fromDrawPile(stage.chronicle);
      case 'enter':
      case 'move':
      case 'damaged':
      case 'healed':
      case 'killed':
      case 'refreshed':
      case 'action-spent':
      case 'prepare':
      case 'wave-sent':
      case 'camp-joined':
      case 'retiled':
      case 'charted':
      case 'held':
      case 'settled':
      case 'stock':
      case 'population':
      case 'assigned':
      case 'added':
      case 'shuffled':
      case 'counters-set':
      case 'banished':
      case 'turn':
      case 'rolled':
      case 'dealt':
      case 'taken':
      case 'ended':
      case 'tallied':
      case 'reached':
      case 'relations':
      case 'neutral-fallen':
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
      case 'neutral-played':
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
      case 'choice':
      case 'attack':
      case 'capture':
        return undefined;
    }
  };

  return {
    render,
    live,
    selection(): ChronicleCard | undefined {
      return selected?.record.card;
    },
    unselect,
    unaim(): void {
      if (beingAimed()) unselect();
    },
    owns(object: Phaser.GameObjects.GameObject): boolean {
      return laidOut.some((record) => record.face.root === object);
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
