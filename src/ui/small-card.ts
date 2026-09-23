import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { type CardId, NO_REFUSAL } from '../rules/state';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardFace,
  cardFace,
  createCardFace,
  type KindBubble,
  type Name,
  type Spot,
} from './card-face';
import {
  answersPress,
  COVERED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  type Stratum,
} from './design-space';
import { createThingCard } from './infopanel';
import type { Reference } from './text-run';
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
  readonly root: Phaser.GameObjects.Container;
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
  kinds: KindBubble,
  inspect: (reference: Reference) => void,
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

  /** A card named, drawn small as its face, whose own names raise the chain on. */
  const faceOf = (card: CardId, over: (under: Raiser | undefined) => void): CardFace => {
    const face = createCardFace(scene, cardFace(catalogue, card), NO_REFUSAL, {
      names: {
        over: (name) => {
          over(name === undefined ? undefined : raiserOf(face, name));
        },
        inspect: (name) => inspect(name.reference),
      },
    });
    face.root.setData('card', card);
    return face;
  };

  /**
   * What a name names, drawn small: a card as its face, anything else as its infopanel card, which
   * wears no kind label.
   */
  const drawnOf = (
    reference: Reference,
    over: (under: Raiser | undefined) => void,
  ): { root: Phaser.GameObjects.Container; face: CardFace | undefined } => {
    switch (reference.kind) {
      case 'card': {
        const face = faceOf(reference.id, over);
        return { root: face.root, face };
      }
      case 'terrain':
      case 'feature':
      case 'improvement':
      case 'building':
      case 'player':
      case 'enemy':
        return {
          root: createThingCard(scene, catalogue, reference, CARD_WIDTH),
          face: undefined,
        };
    }
  };

  const raise = (raiser: Raiser, level: number): void => {
    cut(level);
    const { root, face } = drawnOf(raiser.name.reference, (under) => {
      link.under = under;
      settle();
    });
    const link: Link = { raiser, root, onCard: false, under: undefined };

    const { x, top, bottom } = raiser.where();
    const half = CARD_WIDTH / 2;
    const above = top - STANDOFF;
    root
      .setName(`small-card-${level}`)
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
    answersPress(root);
    onClick(root, () => inspect(raiser.name.reference), 'right');
    onHover(
      root,
      () => {
        link.onCard = true;
        settle();
      },
      () => {
        link.onCard = false;
        if (face !== undefined) kinds.over(face, false);
        settle();
      },
    );
    // A zone over the label would take the root's hover and its right click: the small card would go
    // down under a pointer resting on its own label.
    if (face !== undefined) {
      root.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        const at = on.at(pointer.x, pointer.y);
        kinds.over(face, face.kindAt(at.x, at.y));
      });
    }
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

  return {
    over(raiser: Raiser | undefined): void {
      surface = raiser;
      settle();
    },
    down,
  };
}
