import type Phaser from 'phaser';
import type { Change, Group, Stage } from '../rules/stages';
import { type Chronicle, type ChronicleCard, cardKeyed, cardsOutOfHand } from '../rules/state';
import { trayNow } from './band';
import { CARD_HEIGHT, createCardBack } from './card-face';
import { blockLength, SHUFFLE, stopMotion, TURN_OVER, travel } from './card-motion';
import { inRoundedBox } from './card-shape';
import type { PileKind } from './cast';
import { createChromeCounter, placeChromeCounter } from './chrome';
import type { ChronicleFaces } from './chronicle-faces';
import {
  addText,
  type Box,
  onClick,
  onHover,
  onResize,
  ownBoxOf,
  pressedWhere,
  reactsToPress,
  type Stratum,
  UI_FONT,
} from './design-space';
import { asGlyph, glyphMark, SIGN_SHARE } from './glyphs';
import { css, darkeningOf, LOOK, multiplied, untoned } from './look';
import { asPainted } from './pool';
import { text } from './text';
import { STANDOFF, type Tooltip } from './tooltip';
import { ROUND } from './tray-layout';

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

/** How large a card stands at a pile's round, against its own size. */
const AT_PILE = 0.25;

/**
 * Where a card flying to or from a pile stands at the pile, about its own bottom centre as a card is
 * drawn: shrunk to its size there, centred on the pile's round.
 */
export function atPile(pile: PileKind): {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
} {
  const { x, y } = trayNow().piles[pile];
  return { x, y: y + (AT_PILE * CARD_HEIGHT) / 2, rotation: 0, scale: AT_PILE };
}

/**
 * How tall a pile's count stands, how much wider than its number and how narrow at the least, and how
 * far past the box it counts on it reaches, up and sideways.
 */
const COUNT_HEIGHT = 24;
const COUNT_PAD = 16;
const COUNT_LEAST = 30;
const COUNT_OVERHANG = 9;

const COUNT_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '15px',
  fontStyle: 'bold',
  color: css(LOOK.charcoalInk),
};

/** A number in a count's type, about its middle, reading nothing yet. */
export function countText(scene: Phaser.Scene): Phaser.GameObjects.Text {
  return addText(scene, 0, 0, '', COUNT_STYLE).setOrigin(0.5, 0.5);
}

/**
 * A count as a pile reads it, and a stack its copies: its number, named `name`, on the kit's counter
 * chip, `<name>-chip`.
 */
export type Count = {
  readonly chip: Phaser.GameObjects.NineSlice;
  readonly number: Phaser.GameObjects.Text;
  /**
   * The count laid at the top corner of the box on that side, its chip reaching past the box and as
   * wide as the number it now reads asks; answers the chip's box.
   */
  lay(on: Box, corner: 'left' | 'right'): Box;
  /** The count laid with its chip's right edge and its middle at the point, as `lay` widens it. */
  layAt(right: number, middle: number): Box;
};

/** A count drawing nothing yet: its chip and its number, named `name`, laid by `lay` or `layAt`. */
export function createCount(scene: Phaser.Scene, name: string): Count {
  const chip = createChromeCounter(scene).setName(`${name}-chip`);
  const number = countText(scene).setName(name);
  const widthNow = (): number => Math.max(COUNT_LEAST, ownBoxOf(number).width + COUNT_PAD);
  const stand = (counted: Box): Box => {
    placeChromeCounter(chip, counted);
    number.setPosition(counted.x + counted.width / 2, counted.y + COUNT_HEIGHT / 2);
    return counted;
  };
  return {
    chip,
    number,
    lay(on: Box, corner: 'left' | 'right'): Box {
      const width = widthNow();
      const left =
        corner === 'left' ? on.x - COUNT_OVERHANG : on.x + on.width + COUNT_OVERHANG - width;
      return stand({ x: left, y: on.y - COUNT_OVERHANG, width, height: COUNT_HEIGHT });
    },
    layAt(right: number, middle: number): Box {
      const width = widthNow();
      return stand({ x: right - width, y: middle - COUNT_HEIGHT / 2, width, height: COUNT_HEIGHT });
    },
  };
}

/** Whether a point of the surface lies on a count's chip laid on that box. */
export function onCount(counted: Box, x: number, y: number): boolean {
  return inRoundedBox({ x, y }, counted, COUNT_HEIGHT / 2);
}

/**
 * What a count stands on named over it on the surface's tooltip: its left edge on the thing's, its
 * bottom edge over the count's top, or over the thing's own where it wears no count.
 */
export function nameOver(tooltip: Tooltip, name: string, on: Box, counted?: Box): void {
  tooltip.over(name, on.x, (counted ?? on).y - STANDOFF);
}

export type Piles = {
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/** What the piles react to their presses with. */
export type PilePresses = {
  /** The pile's browse raised. */
  browse(pile: PileKind): void;
  /**
   * Whatever is being aimed let go, as a left click on a thing lets it go: the browse a left click
   * raises covers the pile before the screen reads what the click was let go on.
   */
  unaim(): void;
};

/**
 * The three piles. A pile takes the hand's cards only once the last of them has landed, and the
 * shuffle carries the discard pile over as one back, so no count ever reads ahead of what is on the
 * way.
 */
export function createPiles(
  scene: Phaser.Scene,
  on: { readonly resting: Stratum; readonly flight: Stratum },
  { tooltip, cards }: { readonly tooltip: Tooltip; readonly cards: ChronicleFaces },
  presses: PilePresses,
): Piles {
  const piles: Readonly<Record<PileKind, Pile>> = {
    'draw-pile': createPile(scene, on.resting, 'draw-pile', tooltip, presses),
    'discard-pile': createPile(scene, on.resting, 'discard-pile', tooltip, presses),
    'exhaust-pile': createPile(scene, on.resting, 'exhaust-pile', tooltip, presses),
  };

  /** What the shuffle flies. */
  const shuffled = createCardBack(scene).root.setVisible(false);
  on.flight.layer.add(shuffled);

  /** What the piles have in the air; a render owns both and takes them down. */
  let waiting: Phaser.Tweens.Tween | undefined;
  let carrying: object | undefined;

  const render = (chronicle: Chronicle): void => {
    // Whoever is waiting on the wait is let go, so a cancelled one leaves nothing hanging on it.
    waiting?.stop();
    waiting = undefined;
    carrying = undefined;
    stopMotion(scene, shuffled);
    shuffled.setVisible(false);

    const { drawPile, discardPile, exhaustPile } = chronicle;
    const lying = [...drawPile, ...discardPile, ...exhaustPile].map(
      ({ key }) => cards.of(key).root,
    );
    stopMotion(scene, lying);
    for (const root of lying) root.setVisible(false);

    for (const [pile, shown] of Object.entries(piles) as [PileKind, Pile][]) {
      shown.count(pileOf(chronicle, pile).length);
    }
  };

  /**
   * The shuffle: where the discard pile went into the draw pile, one back is carried from the one to
   * the other; a draw pile shuffled alone moves nothing.
   */
  const shuffle = ({ before, chronicle }: Change): Promise<void> | undefined =>
    chronicle.discardPile.length < before.discardPile.length ? shuffleIn(chronicle) : undefined;

  const shuffleIn = async (chronicle: Chronicle): Promise<void> => {
    const from = atPile('discard-pile');
    const flight = {};
    carrying = flight;
    asPainted(shuffled).setPosition(from.x, from.y).setScale(from.scale);
    piles['discard-pile'].count(0);

    await travel(scene, shuffled, atPile('draw-pile'), 0, SHUFFLE);

    // A render while this was in the air took it down and painted the piles it stands on.
    if (carrying === flight) render(chronicle);
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
      case 'choice':
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
  /** The count the pile reads, its sign darkened where it is nought. */
  count(cards: number): void;
};

/** A pile's sign as a pile holding no card wears it. */
function emptied(colour: number): number {
  return multiplied(colour, darkeningOf(LOOK.emptyPileSign));
}

/**
 * One pile: a round wearing its sign, its count on a chip at the round's top corner away from the
 * hand, a veil over the round under the pointer, and its name on the surface's tooltip after a rest.
 * Either click on the round or the count raises its browse.
 */
function createPile(
  scene: Phaser.Scene,
  on: Stratum,
  pile: PileKind,
  tooltip: Tooltip,
  presses: PilePresses,
): Pile {
  const round = createChromeCounter(scene).setName(`${pile}-round`);
  const veil = scene.add
    .circle(0, 0, ROUND / 2, LOOK.underPointer.colour, LOOK.underPointer.strength)
    .setVisible(false)
    .setName(`${pile}-veil`);
  const sign = glyphMark(scene).setName(`${pile}-sign`);
  const count = createCount(scene, `${pile}-count`);

  /** Where the round's box and the count's chip stand. */
  let rounded: Box = { x: 0, y: 0, width: ROUND, height: ROUND };
  let counted: Box = { x: 0, y: 0, width: 0, height: 0 };
  const press = pressedWhere(
    scene.add.zone(0, 0, ROUND, ROUND).setName(pile),
    (x, y) => inRoundedBox({ x, y }, rounded, ROUND / 2) || onCount(counted, x, y),
  );
  on.layer.add([round, veil, sign, count.chip, count.number, press]);

  const place = (): void => {
    const { x, y } = trayNow().piles[pile];
    rounded = { x: x - ROUND / 2, y: y - ROUND / 2, width: ROUND, height: ROUND };
    placeChromeCounter(round, rounded);
    veil.setPosition(x, y);
    sign.setPosition(x, y);
    press.setPosition(x, y);
    counted = count.lay(rounded, pile === 'draw-pile' ? 'left' : 'right');
  };
  onResize(scene, place);

  reactsToPress(press);
  onHover(
    press,
    () => {
      veil.setVisible(true);
      nameOver(tooltip, text(`tooltip.${pile}`), rounded, counted);
    },
    () => {
      veil.setVisible(false);
      tooltip.hide();
    },
  );
  onClick(press, () => {
    presses.unaim();
    presses.browse(pile);
  });
  onClick(
    press,
    () => {
      presses.browse(pile);
    },
    'right',
  );

  return {
    count(cards: number): void {
      count.number.setText(String(cards));
      asGlyph(sign, pile, SIGN_SHARE * ROUND, { tone: cards === 0 ? emptied : untoned });
      place();
    },
  };
}
