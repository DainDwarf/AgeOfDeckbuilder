import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type CardId, NO_REFUSAL } from '../rules/state';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardFace,
  cardFace,
  createCardFace,
  type Name,
  type Spot,
} from './card-face';
import {
  COVERED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onHover,
  type Stratum,
} from './design-space';
import { HANDOVER_MS, JITTER, REST_MS } from './tooltip';

/** The clear water between a small card and the line of the name that raised it. */
const STANDOFF = 8;

/** A name the pointer is on, as whoever drew it hands it over. */
export type Raiser = {
  readonly name: Name;
  /** Where the name stands on the stratum the small cards stand on, as it stands when asked. */
  where(): Spot;
  /** Told a chain raised off the name stands, and that it has come down. */
  hold?(on: boolean): void;
};

export type SmallCards = {
  /** The pointer is on this name of the surface under the chain, or on none of its names. */
  over(raiser: Raiser | undefined): void;
  /** The whole chain taken down at once. */
  down(): void;
};

/** One small card of the chain, the name that raised it, and what of it the pointer is on. */
type Link = {
  readonly raiser: Raiser;
  readonly face: CardFace;
  onCard: boolean;
  under: Raiser | undefined;
};

/** The name the pointer rests on, the rest's timer, and where the rest began. */
type Resting = { readonly raiser: Raiser; timer: Phaser.Time.TimerEvent; x: number; y: number };

/** A name of a face that holds nothing lifted while its small card stands. */
export function raiserOf(face: CardFace, name: Name): Raiser {
  return { name, where: () => face.spotOf(name) };
}

/** The chain of small cards the names of one surface raise, on a stratum of that surface's scene. */
export function createSmallCards(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  inspect: (card: CardId) => void,
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
    for (const link of gone) link.face.root.destroy();
    wentDown = scene.time.now;
    if (count === 0) gone[0].raiser.hold?.(false);
  };

  const stopResting = (): void => {
    resting?.timer.remove();
    resting = undefined;
  };

  const raise = (raiser: Raiser, level: number): void => {
    cut(level);
    const face = createCardFace(scene, cardFace(catalogue, raiser.name.card), NO_REFUSAL, {
      names: {
        over: (name) => {
          link.under = name === undefined ? undefined : raiserOf(face, name);
          settle();
        },
        inspect: (name) => inspect(name.card),
      },
    });
    const link: Link = { raiser, face, onCard: false, under: undefined };

    const { x, top, bottom } = raiser.where();
    const half = CARD_WIDTH / 2;
    const above = top - STANDOFF;
    face.root
      .setName(`small-card-${level}`)
      .setData('card', raiser.name.card)
      .setPosition(
        Math.min(Math.max(x, MARGIN + half), DESIGN_WIDTH - MARGIN - half),
        above - CARD_HEIGHT >= MARGIN
          ? above
          : Math.min(bottom + STANDOFF + CARD_HEIGHT, DESIGN_HEIGHT - MARGIN),
      )
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-half, -CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
    onHover(
      face.root,
      () => {
        link.onCard = true;
        settle();
      },
      () => {
        link.onCard = false;
        settle();
      },
    );
    on.layer.add(face.root);
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

  return {
    over(raiser: Raiser | undefined): void {
      surface = raiser;
      settle();
    },
    down,
  };
}
