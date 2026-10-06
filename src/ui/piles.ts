import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import type { Change, Group, Stage } from '../rules/stages';
import { type Chronicle, type ChronicleCard, NO_REFUSAL } from '../rules/state';
import {
  CARD_BASELINE,
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardFace,
  createCardBack,
  createCardFace,
  createEmptySlot,
  type KindBubble,
  type Name,
} from './card-face';
import { blockLength, EASE, ended, SHUFFLE, stopMotion, travel } from './card-motion';
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
import { css, LOOK, worn } from './look';
import type { PileKind } from './overlay';
import { raiserOf, type SmallCards } from './small-card';

/** Where each pile's top card lies, about its own bottom centre, as a card is drawn. */
export const PILE_PLACE: Record<PileKind, { readonly x: number; readonly y: number }> = {
  'draw-pile': { x: MARGIN + CARD_WIDTH / 2, y: CARD_BASELINE },
  'discard-pile': { x: DESIGN_WIDTH - MARGIN - CARD_WIDTH / 2, y: CARD_BASELINE },
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
 * The draw pile face down on the left, the discard pile face up and worn on the right. The discard
 * pile takes the hand's cards only once the last of them has landed, and the shuffle carries the
 * discard pile over as one card, so neither count ever reads ahead of what is on the way.
 */
export function createPiles(
  scene: Phaser.Scene,
  on: { readonly resting: Stratum; readonly flight: Stratum },
  catalogue: Catalogue,
  { kinds, small }: { readonly kinds: KindBubble; readonly small: SmallCards },
  presses: PilePresses,
): Piles {
  const answers = { small, kinds, presses };
  const drawn = createPile(scene, on.resting, 'draw-pile', answers);
  const discarded = createPile(scene, on.resting, 'discard-pile', answers);

  /** What the piles have in the air; a render owns both and takes them down. */
  let waiting: { readonly event: Phaser.Time.TimerEvent; readonly done: () => void } | undefined;
  let carrier: Phaser.GameObjects.Container | undefined;

  const topOf = (card: ChronicleCard | undefined): Top => {
    if (card === undefined) return { card: createEmptySlot(scene) };
    const face = createCardFace(scene, cardFace(catalogue, card), NO_REFUSAL, { tone: worn });
    return { card: face.root.setData('card', card.id), face };
  };

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
    drawn.show(
      { card: createCardBack(scene, { faded: chronicle.drawPile.length === 0 }) },
      chronicle.drawPile.length,
    );
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
    const carrying = scene.add.container(from.x, from.y, [carried, back]);
    on.flight.layer.add(carrying);
    carrier = carrying;
    discarded.show({ card: createEmptySlot(scene) }, 0);

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
  const landed = (cards: number, chronicle: Chronicle): Promise<void> =>
    new Promise((done) => {
      const event = scene.time.delayedCall(blockLength(cards), () => {
        waiting = undefined;
        render(chronicle);
        done();
      });
      waiting = { event, done };
    });

  const changed = (stage: Change): Promise<void> | undefined => {
    switch (stage.name) {
      case 'discarded':
        return landed(stage.places.length, stage.chronicle);
      case 'shuffled':
        return shuffle(stage.chronicle);
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
      case 'drawn':
      case 'recalled':
      case 'left':
      case 'turn':
      case 'rolled':
      case 'shown':
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

/** A pile's top: what is drawn there, and its face where it is a card face up. */
type Top = { readonly card: Phaser.GameObjects.Container; readonly face?: CardFace };

type Pile = {
  show(top: Top, count: number): void;
  /** Hands the shown card over: the pile forgets it, and the next `show` leaves it standing. */
  lift(): Phaser.GameObjects.Container | undefined;
};

/**
 * One pile: a right click on it raises its browse, a name on its top card excepted, which answers
 * the rest and the right click as a name does anywhere, and the top card's kind label answers the
 * rest.
 */
function createPile(
  scene: Phaser.Scene,
  on: Stratum,
  pile: PileKind,
  {
    small,
    kinds,
    presses,
  }: { readonly small: SmallCards; readonly kinds: KindBubble; readonly presses: PilePresses },
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
  on.layer.add([pill, count, press]);

  let shown: Top | undefined;
  /** Whether the small cards standing were raised off a name of this pile's top, and not the hand's. */
  let chained = false;

  const nameUnder = (pointer: Phaser.Input.Pointer): Name | undefined => {
    const at = on.at(pointer.x, pointer.y);
    return shown?.face?.nameAt(at.x, at.y);
  };
  const onKind = (pointer: Phaser.Input.Pointer): boolean => {
    const at = on.at(pointer.x, pointer.y);
    return shown?.face?.kindAt(at.x, at.y) === true;
  };

  answersPress(press, (pointer) => nameUnder(pointer) !== undefined || onKind(pointer));
  press.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    const face = shown?.face;
    if (face === undefined) return;
    const name = nameUnder(pointer);
    small.over(
      name === undefined
        ? undefined
        : {
            ...raiserOf(face, name),
            hold: (on) => {
              chained = on;
            },
          },
    );
    kinds.over(face, onKind(pointer));
  });
  onHover(
    press,
    () => {},
    () => {
      small.over(undefined);
      if (shown?.face !== undefined) kinds.over(shown.face, false);
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

  /** What the top card's names and its label raised, taken down as the card leaves the top. */
  const letGo = (): void => {
    if (shown?.face === undefined) return;
    if (chained) small.down();
    kinds.over(shown.face, false);
  };

  return {
    show(top: Top, remaining: number): void {
      letGo();
      shown?.card.destroy();
      shown = top;
      const { card } = top;
      card.setPosition(x, y).setName(`${pile}-top`);
      on.layer.addAt(card, on.layer.getIndex(pill));

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
    lift(): Phaser.GameObjects.Container | undefined {
      letGo();
      const lifted = shown?.card;
      shown = undefined;
      return lifted;
    },
  };
}
