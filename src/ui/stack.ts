import Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL } from '../rules/state';
import { type Bind, boundTo } from './bindings';
import {
  type CardFace,
  createCardFace,
  createFootBubble,
  type FootBubble,
  heightOf,
  type Name,
  type SmallCards,
} from './card-face';
import {
  type Box,
  createScrim,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  onClick,
  onHover,
  type Stratum,
} from './design-space';
import { buildingFace, type Face, freshUnitFace, namedCardFace } from './face';
import { createThingCard, paperMetricsOf, type Thing } from './infopanel';
import type { OverlayScene } from './overlay-scene';
import { createSmallCards, raiserOf } from './small-card';
import { createTooltip } from './tooltip';

const WIDTH = 380;

/** How far each card shown large peeks out, up and to the left, from under the card over it. */
const BAND = 14;

/** The most cards shown large that stand at once. */
const HOLDS = 12;

/** One card shown large: a face, or a thing a name names. */
type Inspected =
  | { readonly shows: 'face'; readonly face: Face }
  | { readonly shows: 'thing'; readonly thing: Thing };

/** What a name names, as it stands large: a card, a building and a unit kind as their faces. */
function inspectedOf(catalogue: Catalogue, { reference, reading }: Name): Inspected {
  switch (reference.kind) {
    case 'card':
      return { shows: 'face', face: namedCardFace(catalogue, reference.id, reading) };
    case 'building':
      return { shows: 'face', face: buildingFace(catalogue, reference.id) };
    case 'player':
    case 'enemy':
      return { shows: 'face', face: freshUnitFace(catalogue, reference.id, reference.kind) };
    case 'terrain':
    case 'feature':
    case 'improvement':
      return { shows: 'thing', thing: reference };
  }
}

type Stack = {
  /** Whether a card stands large. */
  readonly standing: boolean;
  /** The face shown large alone, whatever stood. */
  show(face: Face): void;
  /** What the name names on top of the stack, alone where none stands, and nothing more once it is full. */
  named(name: Name): void;
  /** The newest card taken down; whether a card still stands. */
  takeDownNewest(): boolean;
  /** Every card taken down at once. */
  down(): void;
};

/** The stack of cards shown large, on the overlay; the scrim it stands on is the caller's. */
function createStack(scene: OverlayScene, catalogue: Catalogue, footBubble: FootBubble): Stack {
  const small = createSmallCards(scene, scene.strata.smallCard, catalogue, footBubble, (name) => {
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
    const drawnOf = (
      inspected: Inspected,
      index: number,
    ): { readonly root: Phaser.GameObjects.Container; readonly height: number } => {
      switch (inspected.shows) {
        case 'face': {
          const face: CardFace = createCardFace(scene, inspected.face, NO_REFUSAL, {
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
                    footOver: (label) => {
                      footBubble.over(face, label);
                    },
                  }
                : undefined,
          });
          return { root: face.root, height };
        }
        case 'thing':
          return {
            root: createThingCard(scene, catalogue, inspected.thing, WIDTH),
            height: paperMetricsOf(WIDTH).height,
          };
      }
    };
    drawn = cards.map((inspected, index) => {
      const card = drawnOf(inspected, index);
      const root = card.root
        .setName(index === newest ? 'inspection' : `inspection-${index}`)
        .setPosition(left + index * BAND + WIDTH / 2, top + index * BAND + height)
        // The card is interactive so that both presses on it reach nothing beneath, the scrim
        // included; only its names react to one.
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(-WIDTH / 2, -card.height, WIDTH, card.height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        });
      scene.strata.large.layer.add(root);
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
    show(face: Face): void {
      lay([{ shows: 'face', face }]);
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

/** Cards shown large on the overlay. */
export type ShownLarge = {
  /** The face shown large alone. */
  show(face: Face): void;
  /** What the name names, on top of the stack. */
  named(name: Name): void;
};

/** The cards shown large of `standLarge`, which its caller may take down. */
export type StandingLarge = ShownLarge & {
  /** Whether a card stands large. */
  readonly standing: boolean;
  /** Every card taken down at once, and the scrim they stand on. */
  down(): void;
};

/**
 * What a screen stands on the overlay under its cards shown large, its windows on the scrim stratum,
 * the overlay's one foot bubble shared with them.
 */
export type Beneath = {
  readonly footBubble: FootBubble;
  readonly standing: boolean;
  /** Whether it takes a key or a mouse key pressed while it stands and no card stands large. */
  takes(press: Bind): boolean;
};

/**
 * The stack of cards shown large on a scrim of the overlay's over the whole screen and the window
 * beneath, walked down by a press on the scrim and the back key; the screen hears no key while a
 * card stands, and `covering` says it is covered while either stands.
 */
export function standLarge(
  overlay: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  beneath: Beneath = {
    footBubble: createFootBubble(createTooltip(overlay, overlay.strata.tooltip)),
    standing: false,
    takes: () => false,
  },
): StandingLarge {
  const scrim = createScrim(overlay, () => takeDownNewest())
    // Over the window beneath, whose pieces join this stratum later (docs/PHASER.md).
    .setDepth(1);
  overlay.strata.scrim.layer.add(scrim);
  const stack = createStack(overlay, catalogue, beneath.footBubble);

  const lower = (): void => {
    scrim.setVisible(false);
    if (!beneath.standing) covering(false);
  };

  const takeDownNewest = (): void => {
    if (!stack.takeDownNewest()) lower();
  };

  overlay.takes((press) => {
    if (!stack.standing) return beneath.standing && beneath.takes(press);
    if (boundTo(press, 'back')) takeDownNewest();
    return true;
  });

  const stand = (): void => {
    if (stack.standing) return;
    scrim.setVisible(true);
    covering(true);
  };

  return {
    get standing() {
      return stack.standing;
    },
    show(face) {
      stand();
      stack.show(face);
    },
    named(name) {
      stand();
      stack.named(name);
    },
    down() {
      if (!stack.standing) return;
      stack.down();
      lower();
    },
  };
}

/** What a face on a screen of the meta or in a browse reacts to the rest and the right click with. */
export type Inspecting = {
  /** The stratum the pointer is read on over the screen's faces. */
  readonly on: Stratum;
  readonly small: SmallCards;
  readonly footBubble: FootBubble;
  readonly large: ShownLarge;
};

/** What a screen lays its pieces with: its scene, the catalogue, and what their faces react with. */
export type Laying = {
  readonly scene: Phaser.Scene;
  readonly catalogue: Catalogue;
  readonly inspecting: Inspecting;
};

/**
 * What a screen lays its pieces with, their faces read on `on` and the small cards their names raise
 * standing on `smallOn`: a card shown large over them takes down those small cards, `rising` told
 * first.
 */
export function layingOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  {
    on,
    smallOn,
    footBubble,
    large,
    rising,
  }: {
    readonly on: Stratum;
    readonly smallOn: Stratum;
    readonly footBubble: FootBubble;
    readonly large: ShownLarge;
    readonly rising?: () => void;
  },
): Laying {
  const small = createSmallCards(scene, smallOn, catalogue, footBubble, (name) => {
    inspecting.large.named(name);
  });
  const inspecting: Inspecting = {
    on,
    small,
    footBubble,
    large: {
      show(face) {
        rising?.();
        small.down();
        large.show(face);
      },
      named(name) {
        rising?.();
        small.down();
        large.named(name);
      },
    },
  };
  return { scene, catalogue, inspecting };
}

/** A point of the design space. */
export type Point = { readonly x: number; readonly y: number };

/**
 * What a face on a screen of the meta or in a browse reacts to the pointer with, read at a point of
 * the design space.
 */
export type Reactions = {
  /** The pointer on the face's ground at this point, or off it. */
  point(at: Point | undefined): void;
  /** Whether the pointer resting at this point raises anything. */
  rests(at: Point): boolean;
  /** The right click at this point. */
  inspect(at: Point): void;
};

/**
 * The rest on a name raises its small card, and the right click on a name shows the named thing
 * large; nothing reacts off the names.
 */
export function reactionsOfNames(
  drawn: Pick<CardFace, 'nameAt' | 'spotOf'>,
  { small, large }: Inspecting,
): Reactions {
  return {
    point(at) {
      const named = at === undefined ? undefined : drawn.nameAt(at.x, at.y);
      small.over(named === undefined ? undefined : raiserOf(drawn, named));
    },
    rests(at) {
      return drawn.nameAt(at.x, at.y) !== undefined;
    },
    inspect(at) {
      const named = drawn.nameAt(at.x, at.y);
      if (named !== undefined) large.named(named);
    },
  };
}

/**
 * The names react as `reactionsOfNames` has them, the rest on a label of the foot raises that
 * label's bubble, and the right click on the rest of the card shows the face itself.
 */
export function reactionsOf(card: CardFace, shown: Face, inspecting: Inspecting): Reactions {
  const names = reactionsOfNames(card, inspecting);
  const { footBubble, large } = inspecting;
  return {
    point(at) {
      names.point(at);
      footBubble.over(card, at === undefined ? undefined : card.footAt(at.x, at.y));
    },
    rests(at) {
      return names.rests(at) || card.footAt(at.x, at.y) !== undefined;
    },
    inspect(at) {
      if (names.rests(at)) names.inspect(at);
      else if (card.cardAt(at.x, at.y)) large.show(shown);
    },
  };
}

/**
 * The face's reactions, a right click off its names doing what `elsewhere` does wherever it lands,
 * on the face and around it.
 */
export function reactionsAround(
  card: CardFace,
  shown: Face,
  inspecting: Inspecting,
  elsewhere: () => void,
): Reactions {
  const { point, rests } = reactionsOf(card, shown, inspecting);
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

/** A zone laid over the box, reacting to the rest and the right click through it. */
export function inspectedThrough(
  scene: Phaser.Scene,
  box: Box,
  reactions: Reactions,
  on: Stratum,
): Phaser.GameObjects.Zone {
  const zone = scene.add
    .zone(box.x + box.width / 2, box.y + box.height / 2, box.width, box.height)
    .setInteractive();
  zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    reactions.point(on.at(pointer.x, pointer.y));
  });
  onHover(
    zone,
    () => {},
    () => {
      reactions.point(undefined);
    },
  );
  onClick(
    zone,
    (pointer) => {
      reactions.inspect(on.at(pointer.x, pointer.y));
    },
    'right',
  );
  return zone;
}
