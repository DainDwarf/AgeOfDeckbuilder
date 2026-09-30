import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL, type Refusal } from '../rules/state';
import { type Bind, boundTo } from './bindings';
import {
  type CardFace,
  createCardFace,
  createKindBubble,
  heightOf,
  type KindBubble,
  type Name,
} from './card-face';
import {
  type Box,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  onClick,
  onHover,
  type Stratum,
} from './design-space';
import { type Face, namedCardFace } from './face';
import { createThingCard, type Thing } from './infopanel';
import { LOOK } from './look';
import type { OverlayScene } from './overlay-scene';
import { createSmallCards, raiserOf, type SmallCards } from './small-card';
import { createTooltip } from './tooltip';

const WIDTH = 380;

/** How far each card shown large peeks out, up and to the left, from under the card over it. */
const BAND = 14;

/** The most cards shown large that stand at once. */
const HOLDS = 12;

/** One card shown large: a face and what it is drawn refused by, or a thing a name names. */
type Inspected =
  | { readonly shows: 'face'; readonly face: Face; readonly refusal: Refusal }
  | { readonly shows: 'thing'; readonly thing: Thing };

/** What a name names, as it stands large: a card as its face, which nothing refuses. */
function inspectedOf(catalogue: Catalogue, { reference, reading }: Name): Inspected {
  switch (reference.kind) {
    case 'card':
      return {
        shows: 'face',
        face: namedCardFace(catalogue, reference.id, reading),
        refusal: NO_REFUSAL,
      };
    case 'terrain':
    case 'feature':
    case 'improvement':
    case 'building':
    case 'player':
    case 'enemy':
      return { shows: 'thing', thing: reference };
  }
}

export type Stack = {
  /** Whether a card stands large. */
  readonly standing: boolean;
  /** The face shown large alone, whatever stood. */
  show(face: Face, refusal: Refusal): void;
  /** What the name names on top of the stack, alone where none stands, and nothing more once it is full. */
  named(name: Name): void;
  /** The newest card taken down; whether a card still stands. */
  takeDownNewest(): boolean;
  /** Every card taken down at once. */
  down(): void;
};

/** The stack of cards shown large, on the overlay; the scrim it stands on is the caller's. */
export function createStack(scene: OverlayScene, catalogue: Catalogue, kinds: KindBubble): Stack {
  const small = createSmallCards(scene, scene.strata.smallCard, catalogue, kinds, (name) => {
    named(name);
  });
  let cards: readonly Inspected[] = [];
  let drawn: Phaser.GameObjects.GameObject[] = [];

  /** The stack centred on its whole extent, each card a band up and to the left of the one over it. */
  const lay = (next: readonly Inspected[]): void => {
    small.down();
    for (const object of drawn) object.destroy();
    cards = next;
    const height = heightOf(WIDTH);
    const newest = cards.length - 1;
    const left = (DESIGN_WIDTH - WIDTH - newest * BAND) / 2;
    const top = (DESIGN_HEIGHT - height - newest * BAND) / 2;
    const drawnOf = (inspected: Inspected, index: number): Phaser.GameObjects.Container => {
      switch (inspected.shows) {
        case 'face': {
          const face: CardFace = createCardFace(scene, inspected.face, inspected.refusal, {
            width: WIDTH,
            names:
              index === newest
                ? {
                    over: (name) => {
                      small.over(name === undefined ? undefined : raiserOf(face, name));
                    },
                    inspect: (name) => {
                      named(name);
                    },
                    kind: (over) => {
                      kinds.over(face, over);
                    },
                  }
                : undefined,
          });
          return face.root.setData('card', inspected.face.id);
        }
        case 'thing':
          return createThingCard(scene, catalogue, inspected.thing, WIDTH);
      }
    };
    drawn = cards.map((inspected, index) => {
      const root = drawnOf(inspected, index)
        .setName(index === newest ? 'inspection' : `inspection-${index}`)
        .setPosition(left + index * BAND + WIDTH / 2, top + index * BAND + height)
        // The card is interactive so that both presses on it reach nothing beneath, the scrim
        // included; only its names answer one.
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-WIDTH / 2, -height, WIDTH, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        });
      scene.strata.carried.layer.add(root);
      return root;
    });
  };

  const named = (name: Name): void => {
    if (cards.length < HOLDS) lay([...cards, inspectedOf(catalogue, name)]);
  };

  return {
    get standing() {
      return cards.length > 0;
    },
    show(face: Face, refusal: Refusal): void {
      lay([{ shows: 'face', face, refusal }]);
    },
    named,
    takeDownNewest(): boolean {
      lay(cards.slice(0, -1));
      return cards.length > 0;
    },
    down(): void {
      lay([]);
    },
  };
}

/** A screen of the meta's cards shown large. */
export type ShownLarge = {
  /** The face shown large alone. */
  show(face: Face): void;
  /** What the name names, on top of the stack. */
  named(name: Name): void;
};

/**
 * A window a screen of the meta stands on the overlay's scrim stratum, under its cards shown large,
 * the overlay's one kind bubble shared with them.
 */
export type Beneath = {
  readonly kinds: KindBubble;
  readonly standing: boolean;
  /** Whether it takes a key or a mouse key pressed while it stands and no card stands large. */
  takes(press: Bind): boolean;
};

/**
 * The stack of cards shown large on a scrim of the overlay's over the whole screen and the window
 * beneath, walked down by a press on the scrim and the back key; the screen hears no key but those
 * `passes` lets through while a card stands, and `covering` says it is covered while either stands.
 */
export function standLarge(
  overlay: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  passes: (press: Bind) => boolean,
  beneath: Beneath = {
    kinds: createKindBubble(createTooltip(overlay, overlay.strata.tooltip)),
    standing: false,
    takes: () => false,
  },
): ShownLarge {
  const scrim = overlay.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
    .setOrigin(0, 0)
    .setVisible(false)
    // Over the window beneath, whose pieces join this stratum later (docs/PHASER.md, Scenes and stacking).
    .setDepth(1);
  overlay.strata.scrim.layer.add(scrim);
  const stack = createStack(overlay, catalogue, beneath.kinds);

  const takeDownNewest = (): void => {
    if (stack.takeDownNewest()) return;
    scrim.setVisible(false).disableInteractive();
    if (!beneath.standing) covering(false);
  };
  onClick(scrim, takeDownNewest);
  onClick(scrim, takeDownNewest, 'right');

  overlay.takes((press) => {
    if (!stack.standing) return beneath.standing && beneath.takes(press);
    if (boundTo(press, 'back')) takeDownNewest();
    return !passes(press);
  });

  const stand = (): void => {
    if (stack.standing) return;
    scrim.setVisible(true).setInteractive();
    covering(true);
  };

  return {
    show(face) {
      stand();
      stack.show(face, NO_REFUSAL);
    },
    named(name) {
      stand();
      stack.named(name);
    },
  };
}

/** What a face on a screen of the meta answers the rest and the right click with. */
export type Inspecting = {
  /** The stratum the screen's small cards and bubble stand on. */
  readonly on: Stratum;
  readonly small: SmallCards;
  readonly kinds: KindBubble;
  readonly large: ShownLarge;
};

/** A point of the design space. */
export type Point = { readonly x: number; readonly y: number };

/** What a face on a screen of the meta answers the pointer with, read at a point of the design space. */
export type Answers = {
  /** The pointer on the face's ground at this point, or off it. */
  point(at: Point | undefined): void;
  /** Whether the pointer resting at this point raises anything. */
  rests(at: Point): boolean;
  /** The right click at this point. */
  inspect(at: Point): void;
};

/**
 * The rest on a name raises its small card, and on the kind label the kind's bubble; the right click
 * on a name shows the named thing large, and on the rest of the card the face itself.
 */
export function answersOf(
  card: CardFace,
  shown: Face,
  { small, kinds, large }: Inspecting,
): Answers {
  return {
    point(at) {
      const named = at === undefined ? undefined : card.nameAt(at.x, at.y);
      small.over(named === undefined ? undefined : raiserOf(card, named));
      kinds.over(card, at !== undefined && card.kindAt(at.x, at.y));
    },
    rests(at) {
      return card.nameAt(at.x, at.y) !== undefined || card.kindAt(at.x, at.y);
    },
    inspect(at) {
      const named = card.nameAt(at.x, at.y);
      if (named !== undefined) {
        large.named(named);
        return;
      }
      if (card.cardAt(at.x, at.y)) large.show(shown);
    },
  };
}

/**
 * The face's answers, a right click off its names doing what `elsewhere` does wherever it lands, on
 * the face and around it.
 */
export function answersAround(
  card: CardFace,
  shown: Face,
  inspecting: Inspecting,
  elsewhere: () => void,
): Answers {
  const { point, rests } = answersOf(card, shown, inspecting);
  return {
    point,
    rests,
    inspect(at) {
      const named = card.nameAt(at.x, at.y);
      if (named === undefined) elsewhere();
      else inspecting.large.named(named);
    },
  };
}

/** A zone laid over the box, answering the rest and the right click through it. */
export function inspectedThrough(
  scene: Phaser.Scene,
  box: Box,
  answers: Answers,
  on: Stratum,
): Phaser.GameObjects.Zone {
  const zone = scene.add
    .zone(box.x + box.width / 2, box.y + box.height / 2, box.width, box.height)
    .setInteractive();
  zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    answers.point(on.at(pointer.x, pointer.y));
  });
  onHover(
    zone,
    () => {},
    () => {
      answers.point(undefined);
    },
  );
  onClick(
    zone,
    (pointer) => {
      answers.inspect(on.at(pointer.x, pointer.y));
    },
    'right',
  );
  return zone;
}
