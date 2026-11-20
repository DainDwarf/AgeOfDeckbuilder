import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL } from '../rules/state';
import {
  CARD_HEIGHT,
  type CardFace,
  createCardFace,
  type FootBubble,
  type Name,
  pressedOnFace,
  type Raiser,
  type SmallCards,
} from './card-face';
import { CARD_WIDTH } from './card-frames';
import {
  afterResize,
  COVERED,
  MARGIN,
  onClick,
  onHover,
  reactsToPress,
  type Stratum,
  screenSize,
} from './design-space';
import { type Face, namedFace } from './face';
import { HANDOVER_MS, JITTER, REST_MS } from './tooltip';

/** The clear water between a small card and the line of the name that raised it. */
const STANDOFF = 8;

/** One small card of the chain, the name that raised it, and what of it the pointer is on. */
type Link = {
  readonly raiser: Raiser;
  readonly root: Phaser.GameObjects.Container;
  /** Where the card stands from the middle of its name's top edge, as it was raised. */
  readonly off: { readonly x: number; readonly y: number };
  onCard: boolean;
  under: Raiser | undefined;
};

/** The name the pointer rests on, the rest's timer, and where the rest began. */
type Resting = { readonly raiser: Raiser; timer: Phaser.Time.TimerEvent; x: number; y: number };

/** A name of a face or an answer that holds nothing lifted while its small card stands. */
export function raiserOf(face: Pick<CardFace, 'spotOf'>, name: Name): Raiser {
  return { name, where: () => face.spotOf(name) };
}

/** The chain of small cards the names of one surface raise, on a stratum of that surface's scene. */
export function createSmallCards(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  footBubble: FootBubble,
  inspect: (name: Name) => void,
): SmallCards {
  let chain: Link[] = [];
  /** The name of the surface the pointer is on, and nothing while it is on none. */
  let surface: Raiser | undefined;
  let resting: Resting | undefined;
  let leaving: Phaser.Time.TimerEvent | undefined;
  let wentDown = Number.NEGATIVE_INFINITY;

  /** The deepest small card the pointer is on, -1 for none, and the name it is on there. */
  const pointer = (): { level: number; raiser: Raiser | undefined } => {
    for (let level = chain.length - 1; level >= 0; level--) {
      const link = chain[level];
      if (link.onCard || link.under !== undefined) return { level, raiser: link.under };
    }
    return { level: -1, raiser: surface };
  };

  /** How many small cards the pointer keeps standing where it is. */
  const kept = (): number => {
    const { level, raiser } = pointer();
    const next = chain[level + 1];
    return level + 1 + (next !== undefined && next.raiser.name === raiser?.name ? 1 : 0);
  };

  /** Every small card from this place in the chain on, taken down. */
  const cut = (count: number): void => {
    const gone = chain.slice(count);
    if (gone.length === 0) return;
    chain = chain.slice(0, count);
    for (const link of gone) link.root.destroy();
    wentDown = scene.time.now;
    if (count === 0) gone[0].raiser.hold?.(false);
  };

  const stopResting = (): void => {
    resting?.timer.remove();
    resting = undefined;
  };

  /** A face drawn small, whose own names raise the chain on. */
  const faceOf = (shown: Face, over: (under: Raiser | undefined) => void): CardFace => {
    const face = createCardFace(scene, shown, NO_REFUSAL, {
      names: {
        over: (name) => {
          over(name === undefined ? undefined : raiserOf(face, name));
        },
        inspect,
      },
    });
    return face;
  };

  const raise = (raiser: Raiser, level: number): void => {
    cut(level);
    const { reference, reading } = raiser.name;
    const face = faceOf(namedFace(catalogue, reference, reading), (under) => {
      link.under = under;
      settle();
    });
    const { root } = face;
    const spot = raiser.where();
    const half = CARD_WIDTH / 2;
    const above = spot.top - STANDOFF;
    const standsAbove = above - CARD_HEIGHT >= MARGIN;
    const screen = screenSize();
    const x = Math.min(Math.max(spot.x, MARGIN + half), screen.width - MARGIN - half);
    const y = standsAbove
      ? above
      : Math.min(spot.bottom + STANDOFF + CARD_HEIGHT, screen.height - MARGIN);
    const off = { x: x - spot.x, y: y - spot.top };
    const link: Link = { raiser, root, off, onCard: false, under: undefined };
    const toName = standsAbove ? spot.top - y : spot.bottom - (y - CARD_HEIGHT);

    pressedOnFace(face, { reach: () => toName })
      .setName(`small-card-${level}`)
      .setPosition(x, y);
    reactsToPress(root);
    onClick(root, () => inspect(raiser.name), 'right', 'within slack');
    onHover(
      root,
      () => {
        link.onCard = true;
        settle();
      },
      () => {
        link.onCard = false;
        footBubble.over(face, undefined);
        settle();
      },
    );
    // A zone over a label would take the root's hover and its right click: the small card would go
    // down under a pointer resting on its own label.
    root.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const at = on.at(pointer.x, pointer.y);
      footBubble.over(face, face.footAt(at.x, at.y));
    });
    on.layer.add(root);
    chain.push(link);
    if (level === 0) raiser.hold?.(true);
  };

  const rested = (): void => {
    const was = resting;
    resting = undefined;
    const { level, raiser } = pointer();
    if (was !== undefined && raiser?.name === was.raiser.name) raise(raiser, level + 1);
    settle();
  };

  /** The chain brought in line with where the pointer is. */
  const settle = (): void => {
    const { level, raiser } = pointer();
    const next = chain[level + 1];
    if (raiser === undefined || next?.raiser.name === raiser.name) stopResting();
    else if (resting?.raiser.name !== raiser.name) {
      stopResting();
      if (next !== undefined || scene.time.now - wentDown <= HANDOVER_MS) raise(raiser, level + 1);
      else {
        const at = on.at(scene.input.activePointer.x, scene.input.activePointer.y);
        resting = { raiser, timer: scene.time.delayedCall(REST_MS, rested), x: at.x, y: at.y };
      }
    }

    if (kept() === chain.length) {
      leaving?.remove();
      leaving = undefined;
      return;
    }
    leaving ??= scene.time.delayedCall(HANDOVER_MS, () => {
      leaving = undefined;
      cut(kept());
      settle();
    });
  };

  const down = (): void => {
    stopResting();
    leaving?.remove();
    leaving = undefined;
    surface = undefined;
    cut(0);
  };

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (resting === undefined) return;
    const at = on.at(pointer.x, pointer.y);
    if (Math.abs(at.x - resting.x) < JITTER && Math.abs(at.y - resting.y) < JITTER) return;
    resting.x = at.x;
    resting.y = at.y;
    resting.timer.remove();
    resting.timer = scene.time.delayedCall(REST_MS, rested);
  });
  scene.input.on(COVERED, down);

  // In chain order: a deeper card's name stands on the card before it, which has to move first.
  const follow = (): void => {
    for (const { raiser, root, off } of chain) {
      const { x, top } = raiser.where();
      root.setPosition(x + off.x, top + off.y);
    }
  };
  afterResize(scene, follow);

  return {
    over(raiser: Raiser | undefined): void {
      surface = raiser;
      settle();
    },
    follow,
    down,
  };
}
