import Phaser from 'phaser';
import { CARD_KINDS } from '../rules/cards';
import { type Catalogue, cardOf } from '../rules/catalogue';
import { answerCost, answerOf, answerRefusal, offered } from '../rules/schedule';
import type { Group, Stage } from '../rules/stages';
import {
  type CardId,
  type Chronicle,
  type ChronicleCard,
  type Cost,
  type Deal,
  type Ending,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { type Bind, boundTo, type Press } from './bindings';
import {
  answerFace,
  type CardFace,
  capstoneFace,
  cardFace,
  createCardFace,
  createKindBubble,
  type Face,
  heightOf,
  namedCardFace,
} from './card-face';
import { EASE, ended, stopMotion } from './card-motion';
import {
  addText,
  answersPress,
  BAR_HEIGHT,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  onHover,
  releasedOffCanvas,
  thingUnder,
  UI_FONT,
  whileUp,
} from './design-space';
import { createThingCard, type Thing } from './infopanel';
import { isWheelNotch } from './keys';
import { css, LOOK } from './look';
import { raiseMenu } from './menu-scene';
import type { OverlayScene } from './overlay-scene';
import { createRefusalNote, refused } from './refusal-note';
import { createSmallCards, type Raiser, raiserOf } from './small-card';
import { buildingName, cardName, eventName, text, victoryLine } from './text';
import type { Reference } from './text-run';
import { createTooltip } from './tooltip';

const TITLE_INK = css(LOOK.paleInk);

const BROWSE_WIDTH = 180;
const BROWSE_GAP = 26;
const INSPECTION_WIDTH = 380;

/** How far each card shown large peeks out, up and to the left, from under the card over it. */
const BAND = 14;

/** The most cards shown large that stand at once. */
const STACK_HOLDS = 12;

/** The pointer's travel over these last milliseconds is the speed a release flings the grid at. */
const FLING_WINDOW = 80;

/** What is left of a fling's speed after a millisecond, and the speed it is dropped at. */
const FLING_DECAY = 0.994;
const FLING_STILL = 0.01;

export type PileKind = 'draw-pile' | 'discard-pile';

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  /**
   * The discard pile offered to a card aimed at it, newest card first as the browse offers it: a
   * press on one of its cards lands the aim where that card lies in the pile, a right click on one
   * shows it large, and a press beside them or the back key closes the window with nothing paid.
   * The card being aimed, which the window's title names, is in the hand, so the pile never holds
   * it and never offers it. Answers the way to close it from outside.
   */
  aimDiscardPile(
    chronicle: Chronicle,
    aimed: CardId,
    chosen: (at: number) => void,
    closed: () => void,
  ): () => void;
  inspect(card: ChronicleCard, refusal: Refusal): void;
  /** What a name names shown large, as a right click on a name shows it wherever the name stands. */
  inspectNamed(reference: Reference): void;
  /**
   * Raises the capstone's window on the opening's first render, the deal window while the chronicle
   * waits on a deal and the ending screen once it has ended, and nothing while it runs.
   */
  render(chronicle: Chronicle): void;
  /**
   * Raises the capstone's window at the cue of the `capstone-landing` group, over the screen as it
   * stood before the landing, and holds the play-out until the window closes; raises the ending
   * screen on the stage that ends the chronicle.
   */
  play(stage: Stage): Promise<void> | undefined;
};

/**
 * One face offered on the scrim, what the entry costs the city — which its note says, whether or not
 * the face wears a chip for it — what it is drawn refused by, and the number a press on it answers by.
 */
type Offered = {
  readonly face: Face;
  readonly costs: readonly Cost[];
  readonly refusal: Refusal;
  readonly at: number;
};

/** One card of the deck offered as it stands: nothing refuses it, and its face wears its own cost. */
function offeredCard(face: Face, at: number): Offered {
  return { face, costs: face.costs, refusal: NO_REFUSAL, at };
}

/** Where one offered face was laid out — about its own bottom centre, as a card is drawn — and its drawing. */
type Placed = Offered & {
  readonly x: number;
  readonly y: number;
  readonly drawn: CardFace;
};

/** The grid of cards a browse or an aim stands on, and how far it moves. */
type Grid = {
  readonly root: Phaser.GameObjects.Container;
  /** What the cards scroll within, and what the pointer is on while it is on the grid. */
  readonly frame: Phaser.GameObjects.Zone;
  readonly placed: readonly Placed[];
  readonly height: number;
  /** The furthest the cards scroll; zero when they all fit inside the frame. */
  readonly overflow: number;
};

/**
 * What the aim window stands on: the card being aimed, the cards it offers, and what a press on one
 * of them plays.
 */
type Aiming = {
  readonly aimed: CardId;
  readonly cards: readonly Offered[];
  readonly chosen: (at: number) => void;
  readonly closed: () => void;
};

/** A pile's cards on the scrim, and which of them the browse has selected. */
type Browsing = {
  readonly stands: 'browse';
  readonly pile: PileKind;
  readonly cards: readonly ChronicleCard[];
  /** The number the ringed card was offered as, and nothing while none is ringed. */
  selected: number | undefined;
};

/** The aim window on the scrim, over what it offers. */
type AimWindow = { readonly stands: 'aim-window'; readonly aim: Aiming };

/**
 * The deal window on the scrim: the chronicle whose first deal it stands, which its answers read
 * their numbers and their refusal off, and which of its entries is ringed. It closes on the take
 * alone.
 */
type Dealing = {
  readonly stands: 'deal';
  readonly on: Chronicle;
  readonly deal: Deal;
  /** The number the ringed entry was offered as, and nothing while none is ringed. */
  selected: number | undefined;
};

/**
 * The capstone's window on the scrim: the chronicle it was raised over, whose timeline names the
 * capstone, and whether the opening raised it or the landing did, which is told when it closes. It
 * offers its one card to be read and nothing to be taken, so it holds no selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle } & (
  | { readonly raised: 'opening' }
  | { readonly raised: 'landing'; readonly closed: () => void }
);

/** The windows that lay out cards, which a card shown large is taken off. */
type Offering = Browsing | AimWindow | Dealing | Capstone;

/** The two windows that ring one of the cards they offer. */
type Ringing = Browsing | Dealing;

/** One card shown large: a face and what it is drawn refused by, or a thing a name names. */
type Inspected =
  | { readonly shows: 'face'; readonly face: Face; readonly refusal: Refusal }
  | { readonly shows: 'thing'; readonly thing: Thing };

/** What a name names, as it stands large: a card as its face, which nothing refuses. */
function inspectedOf(catalogue: Catalogue, reference: Reference): Inspected {
  switch (reference.kind) {
    case 'card':
      return { shows: 'face', face: namedCardFace(catalogue, reference.id), refusal: NO_REFUSAL };
    case 'terrain':
    case 'feature':
    case 'improvement':
    case 'building':
    case 'player':
    case 'enemy':
      return { shows: 'thing', thing: reference };
  }
}

/**
 * The cards shown large, earliest first, over what the first of them was taken off: the stack a
 * name on the newest of them grows on top.
 */
type Inspection = {
  readonly stands: 'inspection';
  readonly stack: readonly Inspected[];
  readonly over: Offering | undefined;
};

/**
 * What the scrim carries: a pile's cards, the aim window, the deal window, the capstone's window,
 * the cards shown large over what they were taken off, or the ending screen.
 */
type Carried = Offering | Inspection | { readonly stands: 'ending' };

/** Where a drag of the grid was pressed, what the grid stood at, and where the pointer has been. */
type Scroll = {
  readonly y: number;
  readonly from: number;
  readonly trail: { time: number; y: number }[];
};

/**
 * The scrim and what stands on it, drawn on the overlay scene: the scrim covers the screen beneath
 * whenever anything stands, so nothing there answers a pointer, and `covering` is told as it goes up
 * and comes down.
 */
export function createOverlay(
  scene: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  take: (at: number) => void,
): Overlay {
  const on = scene.strata.carried;
  const scrim = scene.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
    .setOrigin(0, 0)
    .setVisible(false);
  scene.strata.scrim.layer.add(scrim);
  const note = createRefusalNote(scene, scene.strata.note);
  const tooltip = createTooltip(scene, scene.strata.tooltip);
  const kinds = createKindBubble(tooltip);
  const small = createSmallCards(scene, scene.strata.smallCard, catalogue, kinds, (reference) => {
    inspectNamed(reference);
  });

  let shown: Phaser.GameObjects.GameObject[] = [];
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  let grid: Grid | undefined;
  /** How far the grid is scrolled, kept while a card taken off it is inspected. */
  let offset = 0;
  let fling = 0;
  let scrolling: Scroll | undefined;
  /** Whether the grid has moved since the name and the label under the pointer were read off it. */
  let moved = false;
  /** The chronicle the ending screen was raised on: a render raises the screen once and no more. */
  let raisedOn: Ended | undefined;
  /** The deal standing, so no render raises its window twice; the take lets it go. */
  let standingDeal: Dealing | undefined;
  /** Whether the capstone has been announced: the first render raises its window, and no render after. */
  let announced = false;
  /** The ending screen still coming up; a render owns the rise and takes it down. */
  let rising: Phaser.GameObjects.Container | undefined;

  /** One thing raised on the scrim: it stands on the `carried` stratum and goes at the next wipe. */
  const carries = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
    on.layer.add(object);
    shown.push(object);
    return object;
  };

  /** What the scrim carries taken down, the scrim itself left up: every raise replaces through here. */
  const wipe = (): void => {
    small.down();
    note.hide();
    for (const object of shown) object.destroy();
    shown = [];
    grid = undefined;
    scrolling = undefined;
    fling = 0;
    moved = false;
  };

  const close = (): void => {
    wipe();
    carried = undefined;
    scrim.setVisible(false).disableInteractive();
    covering(false);
  };

  /** The aim window wherever it stands: on the scrim, or under a card it is showing large. */
  const aimStanding = (what: Carried | undefined): Aiming | undefined => {
    if (what === undefined) return undefined;
    switch (what.stands) {
      case 'aim-window':
        return what.aim;
      case 'inspection':
        return aimStanding(what.over);
      case 'browse':
      case 'deal':
      case 'capstone':
      case 'ending':
        return undefined;
    }
  };

  /** The aim window closed with nothing paid: the one path, whichever way it was closed. */
  const closeAim = (): void => {
    const aim = aimStanding(carried);
    if (aim === undefined) return;
    close();
    aim.closed();
  };

  // The ending's rise brings the scrim up from nothing, so every cover states the alpha it wants.
  const cover = (): void => {
    stopMotion(scene, scrim);
    scrim.setVisible(true).setAlpha(LOOK.scrim.strength).setInteractive();
    covering(true);
  };

  /**
   * The stack of cards shown large, centred on its whole extent: the newest whole at its bottom
   * right, each card beneath it a band up and to the left of the one over it.
   */
  const showStack = (stack: readonly Inspected[], over: Offering | undefined): void => {
    wipe();
    cover();
    carried = { stands: 'inspection', stack, over };
    const height = heightOf(INSPECTION_WIDTH);
    const newest = stack.length - 1;
    const left = (DESIGN_WIDTH - INSPECTION_WIDTH - newest * BAND) / 2;
    const top = (DESIGN_HEIGHT - height - newest * BAND) / 2;
    /** One card of the stack drawn large; only the newest face's names answer a press. */
    const drawnOf = (inspected: Inspected, index: number): Phaser.GameObjects.Container => {
      switch (inspected.shows) {
        case 'face': {
          const drawn: CardFace = createCardFace(scene, inspected.face, inspected.refusal, {
            width: INSPECTION_WIDTH,
            names:
              index === newest
                ? {
                    over: (name) => {
                      small.over(name === undefined ? undefined : raiserOf(drawn, name));
                    },
                    inspect: (name) => {
                      inspectNamed(name.reference);
                    },
                    kind: (over) => {
                      kinds.over(drawn, over);
                    },
                  }
                : undefined,
          });
          return drawn.root.setData('card', inspected.face.id);
        }
        case 'thing':
          return createThingCard(scene, catalogue, inspected.thing, INSPECTION_WIDTH);
      }
    };
    for (const [index, inspected] of stack.entries()) {
      const root = drawnOf(inspected, index);
      root
        .setName(index === newest ? 'inspection' : `inspection-${index}`)
        .setPosition(left + index * BAND + INSPECTION_WIDTH / 2, top + index * BAND + height)
        // The card is interactive so that both presses on it reach nothing beneath, the scrim
        // included; only its names answer one.
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(
            -INSPECTION_WIDTH / 2,
            -height,
            INSPECTION_WIDTH,
            height,
          ),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        });
      carries(root);
    }
  };

  const showInspection = (face: Face, refusal: Refusal, over: Offering | undefined): void => {
    showStack([{ shows: 'face', face, refusal }], over);
  };

  /**
   * What a name names, on top of the stack while a card stands large, and nothing more once the
   * stack is full; shown large alone over the window standing otherwise.
   */
  const inspectNamed = (reference: Reference): void => {
    const named = inspectedOf(catalogue, reference);
    if (carried === undefined) {
      showStack([named], undefined);
      return;
    }
    switch (carried.stands) {
      case 'inspection':
        if (carried.stack.length < STACK_HOLDS) showStack([...carried.stack, named], carried.over);
        return;
      case 'browse':
      case 'aim-window':
      case 'deal':
      case 'capstone':
        showStack([named], carried);
        return;
      case 'ending':
        showStack([named], undefined);
        return;
    }
  };

  /**
   * Moves the grid, never past either end of its cards, and whatever its cards raised with it; what
   * the pointer is on is read again at the next frame.
   */
  const scrollTo = (to: number): void => {
    if (grid === undefined) return;
    const was = offset;
    offset = Math.min(Math.max(to, 0), grid.overflow);
    grid.root.setY(-offset);
    if (offset === was) return;
    small.follow();
    tooltip.follow();
    moved = true;
  };

  /**
   * The heading a window's cards stand under, named after the window it heads; the caller stands
   * whatever else belongs beside it.
   */
  const raiseTitle = (name: string, heading: string): Phaser.GameObjects.Text => {
    const title = addText(scene, DESIGN_WIDTH / 2, BAR_HEIGHT + MARGIN, heading, {
      fontFamily: UI_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: TITLE_INK,
    })
      .setName(`${name}-title`)
      .setOrigin(0.5, 0);
    return carries(title);
  };

  /** The card of the standing grid a press landed on, and nothing where it landed between them. */
  const under = (pointer: Phaser.Input.Pointer): Placed | undefined => {
    if (grid === undefined) return undefined;
    const at = on.at(pointer.x, pointer.y);
    return cardAt(grid, at.x, at.y);
  };

  /** The name on a card of the standing grid under the pointer, and nothing where none lies. */
  const nameUnder = (pointer: Phaser.Input.Pointer): Raiser | undefined => {
    const card = under(pointer);
    if (card === undefined) return undefined;
    const at = on.at(pointer.x, pointer.y);
    const name = card.drawn.nameAt(at.x, at.y);
    return name === undefined ? undefined : raiserOf(card.drawn, name);
  };

  /** The card of the standing grid whose kind label lies under the pointer, and nothing where none does. */
  const kindUnder = (pointer: Phaser.Input.Pointer): CardFace | undefined => {
    const card = under(pointer);
    if (card === undefined) return undefined;
    const at = on.at(pointer.x, pointer.y);
    return card.drawn.kindAt(at.x, at.y) ? card.drawn : undefined;
  };

  /** Every card of the standing grid told whether the pointer is on its kind label. */
  const overKind = (face: CardFace | undefined): void => {
    for (const card of grid?.placed ?? []) kinds.over(card.drawn, card.drawn === face);
  };

  /** The grid's name and kind label under the pointer told what they raise; neither while it is dragged. */
  const pointOnGrid = (pointer: Phaser.Input.Pointer): void => {
    small.over(scrolling === undefined ? nameUnder(pointer) : undefined);
    overKind(scrolling === undefined ? kindUnder(pointer) : undefined);
  };

  /**
   * A pile's cards laid out below `top`, and the frame that scrolls and flings them: `pressed` takes
   * the press and the number the card under it was offered as, and nothing where it landed between
   * them. Every card face is named after the grid and its place on the screen, the first drawn
   * first, and carries the card it stands and the number it was offered as in its data.
   */
  const layGrid = (
    name: string,
    cards: readonly Offered[],
    top: number,
    pressed: (at: number | undefined, press: Press) => void,
  ): Grid => {
    const height = heightOf(BROWSE_WIDTH);
    const frameHeight = DESIGN_HEIGHT - MARGIN - top;
    const columns = Math.max(
      1,
      Math.floor((DESIGN_WIDTH - 2 * MARGIN + BROWSE_GAP) / (BROWSE_WIDTH + BROWSE_GAP)),
    );
    const rows = Math.max(1, Math.ceil(cards.length / columns));
    const spanY = rows * height + (rows - 1) * BROWSE_GAP;
    const overflow = Math.max(0, spanY - frameHeight);
    const firstY = top + Math.max(0, (frameHeight - spanY) / 2);

    const frame = scene.add
      .zone(DESIGN_WIDTH / 2, top + frameHeight / 2, DESIGN_WIDTH - 2 * MARGIN, frameHeight)
      .setName(`${name}-frame`)
      .setInteractive({ draggable: true });
    answersPress(frame);
    carries(frame);

    frame.on('pointerdown', () => {
      fling = 0;
    });
    frame.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      scrolling = { y: on.at(pointer.downX, pointer.downY).y, from: offset, trail: [] };
    });
    frame.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (scrolling === undefined) return;
      const at = on.at(pointer.x, pointer.y);
      scrolling.trail.push({ time: scene.time.now, y: at.y });
      if (scrolling.trail.length > 8) scrolling.trail.shift();
      scrollTo(scrolling.from - (at.y - scrolling.y));
    });
    frame.on('dragend', (pointer: Phaser.Input.Pointer) => {
      const dragged = scrolling;
      scrolling = undefined;
      if (dragged === undefined || releasedOffCanvas(pointer)) return;
      fling = -speedOf(dragged.trail, scene.time.now);
    });
    frame.on('pointermove', pointOnGrid);
    onHover(
      frame,
      () => {},
      () => {
        small.over(undefined);
        overKind(undefined);
      },
    );
    onClick(frame, (pointer) => {
      pressed(under(pointer)?.at, 'left');
    });
    onClick(
      frame,
      (pointer) => {
        const named = nameUnder(pointer)?.name.reference;
        if (named === undefined) pressed(under(pointer)?.at, 'right');
        else inspectNamed(named);
      },
      'right',
    );

    const root = carries(scene.add.container(0, 0).setName(name).setData('overflow', overflow));
    // Off every display list, or it paints; the mask's destroy leaves it standing (docs/PHASER.md).
    const stencil = new Phaser.GameObjects.Rectangle(
      scene,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0xffffff,
    );
    shown.push(stencil);
    root.enableFilters().filters?.external.addMask(stencil, false, on.camera);

    const placed = cards.map((offered, index): Placed => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * BROWSE_WIDTH + (inRow - 1) * BROWSE_GAP;
      const x =
        (DESIGN_WIDTH - spanX) / 2 + column * (BROWSE_WIDTH + BROWSE_GAP) + BROWSE_WIDTH / 2;
      const y = firstY + row * (height + BROWSE_GAP) + height;
      const drawn = createCardFace(scene, offered.face, offered.refusal, { width: BROWSE_WIDTH });
      root.add(
        drawn.root
          .setPosition(x, y)
          .setName(`${name}-card-${index}`)
          .setData({ at: offered.at, card: offered.face.id }),
      );
      return { ...offered, x, y, drawn };
    });

    const laid = { root, frame, placed, height, overflow };
    grid = laid;
    scrollTo(offset);
    return laid;
  };

  /** The one card of a window ringed, and none ringed at all where nothing is selected. */
  const ring = (ringing: Ringing, at: number | undefined): void => {
    ringing.selected = at;
    for (const card of grid?.placed ?? []) card.drawn.select(card.at === at);
  };

  /** A browse raised, and raised again where the back from a card shown large brings it. */
  const showBrowse = (browsing: Browsing): void => {
    wipe();
    cover();
    carried = browsing;

    const title = raiseTitle(
      'browse',
      text(`browse.${browsing.pile}`, { count: browsing.cards.length }),
    );
    layGrid(
      'browse',
      browsing.cards.map((card, at) => offeredCard(cardFace(catalogue, card), at)),
      title.y + title.height + MARGIN,
      (at, press) => {
        switch (press) {
          case 'left':
            if (at === undefined) back();
            else ring(browsing, at);
            return;
          case 'right':
            if (at !== undefined)
              showInspection(cardFace(catalogue, browsing.cards[at]), NO_REFUSAL, browsing);
            return;
        }
      },
    );
    ring(browsing, browsing.selected);
  };

  /**
   * The deal window raised, and raised again where the back from a card shown large brings it. It
   * closes on the take alone, and the landing plays out under the caller.
   */
  const showDeal = (dealing: Dealing): void => {
    wipe();
    cover();
    carried = dealing;
    standingDeal = dealing;

    const { heading, entries } = dealt(catalogue, dealing.on, dealing.deal);
    const title = raiseTitle('deal', heading);
    const laid = layGrid('deal', entries, title.y + title.height + MARGIN, (at, press) => {
      switch (press) {
        case 'left': {
          if (at === undefined || at !== dealing.selected) {
            ring(dealing, at);
            return;
          }
          const { costs, refusal } = entries[at];
          if (!playable(refusal)) {
            const card = laid.placed[at];
            note.overCard(refused(costs, refusal), card.x, card.y + laid.root.y - laid.height);
            return;
          }
          standingDeal = undefined;
          close();
          take(at);
          return;
        }
        case 'right':
          if (at !== undefined) showInspection(entries[at].face, entries[at].refusal, dealing);
          return;
      }
    });
    ring(dealing, dealing.selected);
  };

  /**
   * The capstone's window closed: it is read once, and nothing brings it back on this screen but the
   * landing. The landing's is told it closed once the scrim is down.
   */
  const closeCapstone = (closing: Capstone): void => {
    close();
    switch (closing.raised) {
      case 'opening':
        return;
      case 'landing':
        closing.closed();
        return;
    }
  };

  /**
   * The capstone's window raised, and raised again where the back from a card shown large brings it.
   * A left press on its card closes it for good, as a press beside it does.
   */
  const showCapstone = (announcement: Capstone): void => {
    wipe();
    cover();
    carried = announcement;

    const face = capstoneFace(announcement.on.timeline.capstone.id);
    const title = raiseTitle('capstone', text(capstoneTitle(announcement)));
    layGrid(
      'capstone',
      [{ face, costs: [], refusal: NO_REFUSAL, at: 0 }],
      title.y + title.height + MARGIN,
      (at, press) => {
        switch (press) {
          case 'left':
            if (at === undefined) back();
            else closeCapstone(announcement);
            return;
          case 'right':
            if (at !== undefined) showInspection(face, NO_REFUSAL, announcement);
            return;
        }
      },
    );
  };

  /** The aim window raised, and raised again where the back from a card shown large brings it. */
  const showAim = (aim: Aiming): void => {
    wipe();
    cover();
    const raised: AimWindow = { stands: 'aim-window', aim };
    carried = raised;

    const title = raiseTitle('aim-window', text('aim.discard-pile', { card: cardName(aim.aimed) }));
    layGrid('aim-window', aim.cards, title.y + title.height + MARGIN, (at, press) => {
      switch (press) {
        case 'left':
          if (at === undefined) {
            closeAim();
            return;
          }
          // The aim landed, so the window closes without saying it closed with nothing paid.
          close();
          aim.chosen(at);
          return;
        case 'right': {
          const card = aim.cards.find((offered) => offered.at === at);
          if (card !== undefined) showInspection(card.face, NO_REFUSAL, raised);
          return;
        }
      }
    });
  };

  /** A window raised again, as the card it was showing large is put back. */
  const raise = (what: Offering): void => {
    switch (what.stands) {
      case 'browse':
        showBrowse(what);
        return;
      case 'aim-window':
        showAim(what.aim);
        return;
      case 'deal':
        showDeal(what);
        return;
      case 'capstone':
        showCapstone(what);
        return;
    }
  };

  /** The chronicle ended, on the screen that says so; the caller decides whether it rises or stands. */
  const showEnding = (on: Ended): Phaser.GameObjects.Container => {
    wipe();
    cover();
    carried = { stands: 'ending' };
    raisedOn = on;

    const said = says(on);
    const title = addText(scene, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 12, said.title, {
      fontFamily: UI_FONT,
      fontSize: '72px',
      fontStyle: 'bold',
      color: TITLE_INK,
    }).setOrigin(0.5, 1);
    const line = addText(scene, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 12, said.line, {
      fontFamily: UI_FONT,
      fontSize: '22px',
      color: TITLE_INK,
    }).setOrigin(0.5, 0);

    return carries(scene.add.container(0, 0, [title, line]).setName(on.ending.outcome));
  };

  /** The ending as it lands: the scrim and the screen rise together, out of nothing and a little low. */
  const raiseEnding = (on: Ended): Promise<void> => {
    const screen = showEnding(on).setAlpha(0).setY(12);
    rising = screen;
    scrim.setAlpha(0);

    const climb = { duration: 1200, ease: EASE };
    return Promise.all([
      ended(scene.tweens.add({ targets: scrim, alpha: LOOK.scrim.strength, ...climb })),
      ended(scene.tweens.add({ targets: screen, alpha: 1, y: 0, ...climb })),
    ]).then(() => {
      if (rising === screen) rising = undefined;
    });
  };

  /** The rise cut short and stood up where it was going: a render leaves the screen full. */
  const stand = (): void => {
    const screen = rising;
    if (screen === undefined) return;
    rising = undefined;
    stopMotion(scene, scrim);
    stopMotion(scene, screen);
    scrim.setAlpha(LOOK.scrim.strength);
    screen.setAlpha(1).setY(0);
  };

  /**
   * The newest card shown large taken down, and the last of them onto what it was taken off: the one
   * path, whichever way.
   */
  const takeDownNewest = ({ stack, over }: Inspection): void => {
    if (stack.length > 1) showStack(stack.slice(0, -1), over);
    else if (over === undefined) close();
    else raise(over);
  };

  const back = (): boolean => {
    if (carried === undefined) return false;
    switch (carried.stands) {
      case 'inspection':
        takeDownNewest(carried);
        return true;
      case 'browse':
        if (carried.selected === undefined) close();
        else ring(carried, undefined);
        return true;
      case 'aim-window':
        closeAim();
        return true;
      case 'deal':
        if (carried.selected === undefined) return false;
        ring(carried, undefined);
        return true;
      case 'capstone':
        closeCapstone(carried);
        return true;
      case 'ending':
        return false;
    }
  };

  /**
   * A left press beside the things a window offers: it takes the window back one step, as the back
   * key does, and drops the ring and no more than that on the deal window.
   */
  const beside = (): void => {
    if (carried === undefined) return;
    switch (carried.stands) {
      case 'deal':
        ring(carried, undefined);
        return;
      case 'browse':
      case 'aim-window':
      case 'capstone':
      case 'inspection':
      case 'ending':
        back();
        return;
    }
  };

  /** The inspection key while a window stands: it shows the ringed card of one that rings large. */
  const inspectSelection = (): void => {
    if (carried === undefined) return;
    switch (carried.stands) {
      case 'browse': {
        const at = carried.selected;
        if (at !== undefined) {
          showInspection(cardFace(catalogue, carried.cards[at]), NO_REFUSAL, carried);
        }
        return;
      }
      case 'deal': {
        const entry =
          carried.selected === undefined
            ? undefined
            : dealt(catalogue, carried.on, carried.deal).entries[carried.selected];
        if (entry !== undefined) showInspection(entry.face, entry.refusal, carried);
        return;
      }
      case 'aim-window':
      case 'capstone':
      case 'inspection':
      case 'ending':
        return;
    }
  };

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'capstone-landing':
        return new Promise((closed) => {
          showCapstone({ stands: 'capstone', on: stage.chronicle, raised: 'landing', closed });
        });
      case 'capstone-continued':
      case 'played':
      case 'refused':
      case 'assign':
      case 'claim':
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'attack':
      case 'camp-capture':
        return undefined;
    }
  };

  onClick(scrim, beside);

  onClick(
    scrim,
    () => {
      if (carried === undefined) return;
      switch (carried.stands) {
        case 'inspection':
          takeDownNewest(carried);
          return;
        case 'browse':
        case 'aim-window':
        case 'deal':
        case 'capstone':
        case 'ending':
          return;
      }
    },
    'right',
  );

  /**
   * Every key and mouse key while anything stands on the scrim, and none at all while nothing does:
   * the city key and the yield key are swallowed, the inspection key shows a ringed card large, the
   * back key walks what stands back and raises the menu where it has nothing left to walk.
   */
  const takes = (press: Bind): boolean => {
    if (carried === undefined) return false;
    // What scrolls a standing grid is Phaser's own wheel, below, and never this press.
    if (isWheelNotch(press)) return true;
    if (boundTo(press, 'city') || boundTo(press, 'yields')) return true;
    if (boundTo(press, 'inspect')) {
      inspectSelection();
      return true;
    }
    if (!boundTo(press, 'back')) return false;
    if (!back()) raiseMenu(scene);
    return true;
  };
  scene.takes(takes);

  scene.input.on(
    'wheel',
    (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (grid === undefined) return;
      fling = 0;
      scrollTo(offset + dy);
    },
  );

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    // Here and not in `scrollTo`: the wheel scrolls from inside Phaser's dispatch, where a hit test
    // refills the list being walked (docs/PHASER.md).
    if (moved) {
      moved = false;
      if (grid !== undefined && thingUnder(scene.game) === grid.frame) {
        pointOnGrid(scene.input.activePointer);
      }
    }
    if (fling === 0 || grid === undefined) return;
    const to = offset + fling * delta;
    scrollTo(to);
    fling = to === offset && Math.abs(fling) > FLING_STILL ? fling * FLING_DECAY ** delta : 0;
  });

  return {
    browse(pile: PileKind, chronicle: Chronicle): void {
      offset = 0;
      showBrowse({
        stands: 'browse',
        pile,
        cards: cardsOf(catalogue, pile, chronicle),
        selected: undefined,
      });
    },
    aimDiscardPile(chronicle, aimed, chosen, closed): () => void {
      offset = 0;
      showAim({
        aimed,
        cards: chronicle.discardPile
          .map((card, at) => offeredCard(cardFace(catalogue, card), at))
          .reverse(),
        chosen,
        closed,
      });
      return closeAim;
    },
    inspect(card: ChronicleCard, refusal: Refusal): void {
      showInspection(cardFace(catalogue, card), refusal, undefined);
    },
    inspectNamed,
    render(chronicle: Chronicle): void {
      if (!announced) {
        announced = true;
        showCapstone({ stands: 'capstone', on: chronicle, raised: 'opening' });
      } else if (chronicle.ending !== undefined && raisedOn === undefined)
        void raiseEnding({ ending: chronicle.ending, timeline: chronicle.timeline });
      else if (chronicle.deals[0] !== undefined && standingDeal === undefined)
        showDeal({ stands: 'deal', on: chronicle, deal: chronicle.deals[0], selected: undefined });
      else stand();
    },
    play(stage: Stage): Promise<void> | undefined {
      switch (stage.kind) {
        case 'change':
          break;
        case 'group':
          if (stage.stages.length > 0) return grouped(stage);
          break;
      }
      const { ending, timeline, deals } = stage.chronicle;
      if (ending !== undefined && raisedOn === undefined) return raiseEnding({ ending, timeline });
      // Every camp captured deals before the camps after it are captured: the window waits for the
      // render the play-out ends on, which a render of this stage would pre-empt.
      return deals.length > 0 ? Promise.resolve() : undefined;
    },
  };
}

/** The title the capstone's window stands under: the age ending on it, or its landing. */
function capstoneTitle(capstone: Capstone): 'capstone.title' | 'capstone.lands' {
  switch (capstone.raised) {
    case 'opening':
      return 'capstone.title';
    case 'landing':
      return 'capstone.lands';
  }
}

/** What of an ended chronicle its ending screen reads: how it ended, and the capstone it was on. */
type Ended = Pick<Chronicle, 'timeline'> & { readonly ending: Ending };

/** What the ending screen reads: its title, and the one line under it. */
function says({ ending, timeline }: Ended): { title: string; line: string } {
  switch (ending.outcome) {
    case 'victory':
      return { title: text('victory.title'), line: victoryLine(timeline.capstone.id) };
    case 'defeat':
      return {
        title: text('defeat.title'),
        line: text(`defeat.${ending.cause}`, { turn: ending.turn }),
      };
  }
}

/**
 * What the deal window reads of a deal: the event's name or the camp's over it, and its entries in
 * the order dealt — an answer drawn unaffordable where the chronicle cannot pay it, a reward as the
 * card of the deck it is.
 */
function dealt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  deal: Deal,
): { heading: string; entries: readonly Offered[] } {
  const ids = offered(catalogue, deal);
  switch (deal.of) {
    case 'event':
      return {
        heading: eventName(deal.event),
        entries: ids.map(
          (id, at): Offered => ({
            face: answerFace(catalogue, chronicle, deal.event, id),
            costs: answerCost(catalogue, chronicle, answerOf(catalogue, deal.event, id)),
            refusal: answerRefusal(catalogue, chronicle, deal.event, id),
            at,
          }),
        ),
      };
    case 'camp':
      return {
        heading: buildingName(catalogue.camp.building),
        entries: ids.map((id, at) => offeredCard(namedCardFace(catalogue, id), at)),
      };
  }
}

/** The card lying under a design-space point, and nothing where the point falls between cards. */
function cardAt(grid: Grid, x: number, y: number): Placed | undefined {
  const local = y - grid.root.y;
  return grid.placed.find(
    (card) =>
      Math.abs(x - card.x) <= BROWSE_WIDTH / 2 && local <= card.y && local >= card.y - grid.height,
  );
}

/** How fast the pointer was travelling as it was released, in design units per millisecond. */
function speedOf(trail: readonly { time: number; y: number }[], now: number): number {
  const last = trail[trail.length - 1];
  const first = trail.find((sample) => now - sample.time <= FLING_WINDOW);
  if (last === undefined || first === undefined || now - last.time > FLING_WINDOW) return 0;
  if (last.time === first.time) return 0;
  return (last.y - first.y) / (last.time - first.time);
}

/** The draw pile gives its draw order away to no one: it reads by kind, then by name. */
function cardsOf(
  catalogue: Catalogue,
  pile: PileKind,
  chronicle: Chronicle,
): readonly ChronicleCard[] {
  if (pile === 'discard-pile') return [...chronicle.discardPile].reverse();
  return [...chronicle.drawPile].sort(
    (a, b) =>
      CARD_KINDS.indexOf(cardOf(catalogue, a.id).kind) -
        CARD_KINDS.indexOf(cardOf(catalogue, b.id).kind) ||
      cardName(a.id).localeCompare(cardName(b.id)),
  );
}
