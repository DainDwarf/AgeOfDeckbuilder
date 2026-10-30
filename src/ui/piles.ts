import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import type { Change, Group, Stage } from '../rules/stages';
import {
  type Chronicle,
  type ChronicleCard,
  cardKeyed,
  cardsOutOfHand,
  NO_REFUSAL,
} from '../rules/state';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardFace,
  createCardBack,
  createEmptySlot,
  type FootBubble,
  type FootLabel,
  type Name,
} from './card-face';
import { blockLength, SHUFFLE, stopMotion, TURN_OVER, travel, turnOver } from './card-motion';
import type { ChronicleFaces } from './chronicle-faces';
import {
  addText,
  answersPress,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  type Stratum,
  UI_FONT,
} from './design-space';
import { cardFace } from './face';
import { css, LOOK, unworn, worn } from './look';
import { asPainted } from './pool';
import { raiserOf, type SmallCards } from './small-card';
import { text } from './text';

export type PileKind = 'draw-pile' | 'discard-pile' | 'exhaust-pile';

/** The cards a pile holds, in pile order. */
export function pileOf(chronicle: Chronicle, pile: PileKind): readonly ChronicleCard[] {
  switch (pile) {
    case 'draw-pile':
      return chronicle.drawPile;
    case 'discard-pile':
      return chronicle.discardPile;
    case 'exhaust-pile':
      return chronicle.exhaustPile;
  }
}

const TAB_WIDTH = 32;

/** The exhaust pile's tab's left edge. */
export const TAB_EDGE = DESIGN_WIDTH - TAB_WIDTH;

/**
 * Where each pile's top card lies, about its own bottom centre, as a card is drawn; the exhaust
 * pile's is the tab's bottom centre, where a card flying to it lands.
 */
export const PILE_PLACE: Record<PileKind, { readonly x: number; readonly y: number }> = {
  'draw-pile': { x: MARGIN + CARD_WIDTH / 2, y: CARD_BASELINE },
  'discard-pile': { x: TAB_EDGE - MARGIN - CARD_WIDTH / 2, y: CARD_BASELINE },
  'exhaust-pile': { x: DESIGN_WIDTH - TAB_WIDTH / 2, y: CARD_BASELINE },
};

export type Piles = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/** What the presses on the piles are answered by. */
export type PilePresses = {
  /** The pile's browse raised. */
  browse(pile: PileKind): void;
  /** What a name on the discard pile's top card names, shown large. */
  inspectNamed(name: Name): void;
};

/**
 * The three piles. A pile takes the hand's cards only once the last of them has landed, and the
 * shuffle carries the discard pile over as one card, so no count ever reads ahead of what is on the way.
 */
export function createPiles(
  scene: Phaser.Scene,
  on: { readonly resting: Stratum; readonly flight: Stratum },
  catalogue: Catalogue,
  {
    footBubble,
    small,
    cards,
  }: {
    readonly footBubble: FootBubble;
    readonly small: SmallCards;
    readonly cards: ChronicleFaces;
  },
  presses: PilePresses,
): Piles {
  const answers = { small, footBubble, presses };
  const back = createCardBack(scene);
  const drawn = createPile(scene, on.resting, 'draw-pile', back.root, answers);
  const discarded = createPile(scene, on.resting, 'discard-pile', createEmptySlot(scene), answers);
  const exhausted = createTab(scene, on.resting, presses);

  /** What the shuffle flies: the face it takes off with comes to stand over this back. */
  const shuffledBack = createCardBack(scene).root.setVisible(false);
  const carrier = scene.add.container(0, 0, [shuffledBack]).setVisible(false);
  on.flight.layer.add(carrier);

  /** What the piles have in the air; a render owns both and takes them down. */
  let waiting: Phaser.Tweens.Tween | undefined;
  let carried: CardFace | undefined;

  const putCarrierAway = (): void => {
    if (carried === undefined) return;
    stopMotion(scene, carrier);
    // A Layer's `add` leaves its child in the Container (docs/PHASER.md, Scenes and stacking).
    carrier.remove(carried.root);
    on.resting.layer.add(carried.root.setVisible(false));
    shuffledBack.setVisible(false);
    carrier.setVisible(false);
    carried = undefined;
  };

  const wornFaceOf = (card: ChronicleCard, city: string): CardFace => {
    const face = cards.of(card.key);
    face.read(cardFace(catalogue, card, city), NO_REFUSAL, worn);
    return face;
  };

  const render = (chronicle: Chronicle): void => {
    // Whoever is waiting on the wait is let go, so a cancelled one leaves nothing hanging on it.
    waiting?.stop();
    waiting = undefined;
    putCarrierAway();

    const { drawPile, discardPile, exhaustPile } = chronicle;
    const lying = [...drawPile, ...discardPile, ...exhaustPile].map(
      ({ key }) => cards.of(key).root,
    );
    stopMotion(scene, lying);
    for (const root of lying) root.setVisible(false);

    back.wear(drawPile.length === 0 ? worn : unworn);
    drawn.show(undefined, drawPile.length);
    const top = discardPile.at(-1);
    discarded.show(
      top === undefined ? undefined : wornFaceOf(top, chronicle.citySection.building),
      discardPile.length,
    );
    exhausted.show(exhaustPile.length);
  };

  /** The shuffle: the discard pile's top is carried to the draw pile's place, turning over on the way. */
  const shuffle = async ({ before, chronicle }: Change): Promise<void> => {
    const face = cards.of(before.discardPile[before.discardPile.length - 1].key);
    const from = PILE_PLACE['discard-pile'];
    carried = face;
    carrier.add(face.root.setPosition(0, 0));
    asPainted(carrier).setPosition(from.x, from.y);
    discarded.show(undefined, 0);

    await Promise.all([
      travel(scene, carrier, { ...PILE_PLACE['draw-pile'], rotation: 0 }, 0, SHUFFLE),
      turnOver(scene, carrier, () => {
        face.root.setVisible(false);
        shuffledBack.setVisible(true);
        return carrier;
      }),
    ]);

    // A render while this was in the air took it down and painted the piles it stands on.
    if (carried === face) render(chronicle);
  };

  /**
   * The block of cards the hand no longer holds lands on its pile all at once, once the last card is
   * down, a card turning over on the way into what it lies there as holding the block up that long.
   */
  const landed = ({ before, chronicle }: Change, pile: PileKind): Promise<void> => {
    const leaving = cardsOutOfHand(before, chronicle);
    const lands = pileOf(chronicle, pile);
    const turning = leaving.some(({ key, id }) => cardKeyed(lands, key)?.id !== id);
    return new Promise((done) => {
      const length = blockLength(leaving.length) + (turning ? TURN_OVER : 0);
      // A tween and no timer event: the animation speed scales no clock (docs/PHASER.md).
      waiting = scene.tweens.addCounter({
        duration: length,
        onComplete: () => {
          waiting = undefined;
          render(chronicle);
          done();
        },
        onStop: () => done(),
      });
    });
  };

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'discarded':
        return landed(stage, 'discard-pile');
      case 'exhausted':
        return landed(stage, 'exhaust-pile');
      case 'shuffled':
        return shuffle(stage);
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
      case 'drawn':
      case 'counters-set':
      case 'banished':
      case 'turn':
      case 'rolled':
      case 'shown':
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
      case 'played':
      case 'refused':
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
      case 'attack':
      case 'capture':
        return undefined;
    }
  };

  return {
    render,
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

type Pile = {
  /** The face on top, or `blank` where none is, and the count the pile reads. */
  show(top: CardFace | undefined, count: number): void;
};

/**
 * One pile: a right click on it raises its browse, a name on its top card excepted, which answers
 * the rest and the right click as a name does anywhere, and the labels of the top card's foot answer
 * the rest. `blank` stands at its place under no face.
 */
function createPile(
  scene: Phaser.Scene,
  on: Stratum,
  pile: PileKind,
  blank: Phaser.GameObjects.Container,
  {
    small,
    footBubble,
    presses,
  }: {
    readonly small: SmallCards;
    readonly footBubble: FootBubble;
    readonly presses: PilePresses;
  },
): Pile {
  const { x, y } = PILE_PLACE[pile];
  const pill = scene.add.graphics();
  const count = addText(scene, 0, 0, '', {
    fontFamily: UI_FONT,
    fontSize: '15px',
    fontStyle: 'bold',
    color: css(LOOK.ink),
  })
    .setOrigin(0.5, 0.5)
    .setName(`${pile}-count`);
  const press = scene.add
    .zone(x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT)
    .setName(pile)
    .setInteractive();
  on.layer.add([blank.setPosition(x, y).setName(`${pile}-top`), pill, count, press]);

  let shown: CardFace | undefined;
  /** Whether the small cards standing were raised off a name of this pile's top, and not the hand's. */
  let chained = false;

  const nameUnder = (pointer: Phaser.Input.Pointer): Name | undefined => {
    const at = on.at(pointer.x, pointer.y);
    return shown?.nameAt(at.x, at.y);
  };
  const onFoot = (pointer: Phaser.Input.Pointer): FootLabel | undefined => {
    const at = on.at(pointer.x, pointer.y);
    return shown?.footAt(at.x, at.y);
  };

  answersPress(
    press,
    (pointer) => nameUnder(pointer) !== undefined || onFoot(pointer) !== undefined,
  );
  press.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (shown === undefined) return;
    const name = nameUnder(pointer);
    small.over(
      name === undefined
        ? undefined
        : {
            ...raiserOf(shown, name),
            hold: (on) => {
              chained = on;
            },
          },
    );
    footBubble.over(shown, onFoot(pointer));
  });
  onHover(
    press,
    () => {},
    () => {
      small.over(undefined);
      if (shown !== undefined) footBubble.over(shown, undefined);
    },
  );
  onClick(
    press,
    (pointer) => {
      const name = nameUnder(pointer);
      if (name === undefined) presses.browse(pile);
      else presses.inspectNamed(name);
    },
    'right',
  );

  /** What the top card's names and its foot raised, taken down as the card leaves the top. */
  const letGo = (): void => {
    if (shown === undefined) return;
    if (chained) small.down();
    footBubble.over(shown, undefined);
  };

  return {
    show(top: CardFace | undefined, remaining: number): void {
      letGo();
      shown = top;
      blank.setVisible(top === undefined);
      if (top !== undefined) {
        const root = asPainted(top.root)
          .setPosition(x, y)
          .setRotation(0)
          .setDepth(0)
          .setName(`${pile}-top`);
        // A list's `add` and `addAt` leave a child it already holds where it stands.
        on.layer.add(root);
        on.layer.moveBelow(root, pill);
      }

      count.setText(String(remaining));
      const width = Math.max(18, count.width) + 14;
      const height = count.height + 6;
      const centre = {
        x: x + CARD_WIDTH / 2 + 10 - width / 2,
        y: y - CARD_HEIGHT - 10 + height / 2,
      };
      count.setPosition(centre.x, centre.y);
      pill.clear();
      pill.fillStyle(LOOK.pileCount);
      pill.fillRoundedRect(centre.x - width / 2, centre.y - height / 2, width, height, height / 2);
    },
  };
}

/** The exhaust pile's tab, its label reading its count upwards: a right click on it raises its browse. */
function createTab(
  scene: Phaser.Scene,
  on: Stratum,
  presses: PilePresses,
): { show(count: number): void } {
  const x = PILE_PLACE['exhaust-pile'].x;
  const y = CARD_BASELINE - CARD_HEIGHT / 2;
  const paper = scene.add
    .rectangle(x, y, TAB_WIDTH, CARD_HEIGHT, LOOK.exhaustTab)
    .setStrokeStyle(1, LOOK.exhaustTabEdge);
  const label = addText(scene, x, y, '', {
    fontFamily: UI_FONT,
    fontSize: '15px',
    fontStyle: 'bold',
    color: css(LOOK.exhaustTabInk),
  })
    .setOrigin(0.5, 0.5)
    .setRotation(-Math.PI / 2)
    .setName('exhaust-pile-label');
  const press = scene.add
    .zone(x, y, TAB_WIDTH, CARD_HEIGHT)
    .setName('exhaust-pile')
    .setInteractive();
  on.layer.add([paper, label, press]);
  onClick(
    press,
    () => {
      presses.browse('exhaust-pile');
    },
    'right',
  );
  return {
    show(count: number): void {
      label.setText(text('tab.exhaust-pile', { count }));
    },
  };
}
