import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import type { Change, Group, Stage } from '../rules/stages';
import { type CardId, type Chronicle, NO_REFUSAL } from '../rules/state';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_WIDTH,
  cardFace,
  createCardBack,
  createCardFace,
  createEmptySlot,
} from './card-face';
import { blockLength, EASE, ended, SHUFFLE, stopMotion, travel } from './card-motion';
import { DEPTH } from './depths';
import { addText, DESIGN_WIDTH, MARGIN, onClick, UI_FONT } from './design-space';
import { css, LOOK } from './look';
import type { PileKind } from './overlay';

/** Where each pile's top card lies, about its own bottom centre, as a card is drawn. */
export const PILE_PLACE: Record<PileKind, { readonly x: number; readonly y: number }> = {
  'draw-pile': { x: MARGIN + CARD_WIDTH / 2, y: CARD_BASELINE },
  'discard-pile': { x: DESIGN_WIDTH - MARGIN - CARD_WIDTH / 2, y: CARD_BASELINE },
};

export type Piles = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/**
 * The draw pile face down on the left, the discard pile face up and worn on the right. The discard
 * pile takes the hand's cards only once the last of them has landed, and the shuffle carries the
 * discard pile over as one card, so neither count ever reads ahead of what is on the way.
 */
export function createPiles(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  browse: (pile: PileKind) => void,
): Piles {
  const drawn = createPile(scene, 'draw-pile', browse);
  const discarded = createPile(scene, 'discard-pile', browse);

  /** The chronicle the piles stand on: how many cards are in the air is read from it. */
  let shown: Chronicle | undefined;
  /** What the piles have in the air; a render owns both and takes them down. */
  let waiting: { readonly event: Phaser.Time.TimerEvent; readonly done: () => void } | undefined;
  let carrier: Phaser.GameObjects.Container | undefined;

  const topOf = (id: CardId | undefined): Phaser.GameObjects.Container =>
    id === undefined
      ? createEmptySlot(scene)
      : createCardFace(scene, cardFace(catalogue, id), NO_REFUSAL, { faded: true }).root;

  const render = (chronicle: Chronicle): void => {
    // Whoever is waiting on the wait is let go, so a cancelled one leaves nothing hanging on it.
    waiting?.event.remove();
    waiting?.done();
    waiting = undefined;
    if (carrier !== undefined) {
      stopMotion(scene, carrier);
      carrier.destroy();
      carrier = undefined;
    }
    shown = chronicle;
    drawn.show(createCardBack(scene, chronicle.drawPile.length === 0), chronicle.drawPile.length);
    discarded.show(
      topOf(chronicle.discardPile[chronicle.discardPile.length - 1]),
      chronicle.discardPile.length,
    );
  };

  /** The shuffle: the discard pile's top is carried to the draw pile's place, turning over on the way. */
  const shuffle = async (chronicle: Chronicle): Promise<void> => {
    const carried = (discarded.lift() ?? createEmptySlot(scene)).setPosition(0, 0);
    const back = createCardBack(scene).setVisible(false);
    const from = PILE_PLACE['discard-pile'];
    const carrying = scene.add.container(from.x, from.y, [carried, back]).setDepth(DEPTH.inFlight);
    carrier = carrying;
    discarded.show(createEmptySlot(scene), 0);

    await Promise.all([
      travel(scene, carrying, { ...PILE_PLACE['draw-pile'], rotation: 0 }, 0, SHUFFLE),
      ended(
        scene.tweens.add({
          targets: carrying,
          scaleX: 0,
          duration: SHUFFLE / 2,
          ease: EASE,
          yoyo: true,
          onYoyo: () => {
            carried.setVisible(false);
            back.setVisible(true);
          },
        }),
      ),
    ]);

    // A render while this was in the air took it down and painted the piles it stands on.
    if (carrier === carrying) render(chronicle);
  };

  /**
   * The block of cards the hand no longer holds lands on the discard pile all at once, once the last
   * card is down.
   */
  const landed = (chronicle: Chronicle): Promise<void> =>
    new Promise((done) => {
      const left = (shown?.hand.length ?? 0) - chronicle.hand.length;
      const event = scene.time.delayedCall(blockLength(Math.max(0, left)), () => {
        waiting = undefined;
        render(chronicle);
        done();
      });
      waiting = { event, done };
    });

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'discarded':
        return landed(stage.chronicle);
      case 'shuffled':
        return shuffle(stage.chronicle);
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
      case 'drawn':
      case 'recalled':
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
      case 'played':
      case 'refused':
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
  show(card: Phaser.GameObjects.Container, count: number): void;
  /** Hands the shown card over: the pile forgets it, and the next `show` leaves it standing. */
  lift(): Phaser.GameObjects.Container | undefined;
};

function createPile(scene: Phaser.Scene, pile: PileKind, browse: (pile: PileKind) => void): Pile {
  const { x, y } = PILE_PLACE[pile];
  const pill = scene.add.graphics().setDepth(DEPTH.piles + 1);
  onClick(
    scene.add
      .zone(x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT)
      .setName(pile)
      .setDepth(DEPTH.piles + 3)
      .setInteractive({ useHandCursor: true }),
    () => browse(pile),
  );
  const count = addText(scene, 0, 0, '', {
    fontFamily: UI_FONT,
    fontSize: '15px',
    fontStyle: 'bold',
    color: css(LOOK.ink),
  })
    .setOrigin(0.5, 0.5)
    .setName(`${pile}-count`)
    .setDepth(DEPTH.piles + 2);

  let shown: Phaser.GameObjects.Container | undefined;
  return {
    show(card: Phaser.GameObjects.Container, remaining: number): void {
      shown?.destroy();
      shown = card.setPosition(x, y).setDepth(DEPTH.piles);

      count.setText(String(remaining));
      const width = Math.max(18, count.width) + 14;
      const height = count.height + 6;
      const centre = {
        x: x + CARD_WIDTH / 2 + 10 - width / 2,
        y: y - CARD_HEIGHT - 10 + height / 2,
      };
      count.setPosition(centre.x, centre.y);
      pill.clear();
      pill.fillStyle(LOOK.accent);
      pill.fillRoundedRect(centre.x - width / 2, centre.y - height / 2, width, height, height / 2);
    },
    lift(): Phaser.GameObjects.Container | undefined {
      const lifted = shown;
      shown = undefined;
      return lifted;
    },
  };
}
