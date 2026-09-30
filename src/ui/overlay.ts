import Phaser from 'phaser';
import type { Payment } from '../rules/campaign';
import { CARD_KINDS } from '../rules/cards';
import { achievementOf, ageOf, type Catalogue, cardOf } from '../rules/catalogue';
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
import { type CardFace, createCardFace, createKindBubble, heightOf, type Name } from './card-face';
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
import { answerFace, capstoneFace, cardFace, cardFaceAtStart, type Face } from './face';
import { isWheelNotch } from './keys';
import { css, LOOK } from './look';
import { campLore, capstoneLore, eventLore, type Raising } from './lore';
import { BUTTON_HEIGHT, createButton } from './menu';
import { raiseMenu } from './menu-scene';
import type { OverlayScene } from './overlay-scene';
import { refused } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { chipAt } from './resource-bar';
import { createScroll, reachOf } from './scroll';
import { createSmallCards, type Raiser, raiserOf } from './small-card';
import { createStack } from './stack';
import { buildingName, cardName, eventName, technologyName, text, victoryLine } from './text';
import { createTooltip } from './tooltip';

const TITLE_INK = css(LOOK.paleInk);

const BROWSE_WIDTH = 180;
const BROWSE_GAP = 26;

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
  inspectNamed(name: Name): void;
  /**
   * Raises the capstone's window on the first render; after it, the deal window while the chronicle
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

/** The heading a window's cards stand under, named after the window it heads. */
export function headingOf(
  scene: Phaser.Scene,
  name: string,
  heading: string,
): Phaser.GameObjects.Text {
  return addText(scene, DESIGN_WIDTH / 2, BAR_HEIGHT + MARGIN, heading, {
    fontFamily: UI_FONT,
    fontSize: '26px',
    fontStyle: 'bold',
    color: TITLE_INK,
  })
    .setName(`${name}-title`)
    .setOrigin(0.5, 0);
}

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
 * capstone, and whether the opening raised it or the landing did, which picks its lore and is told
 * when it closes. It offers its one card to be read and nothing to be taken, so it holds no selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle } & {
  [R in Raising]: { readonly raised: R } & RaisedWith[R];
}[Raising];

/** What the capstone's window carries beside each raising: the landing's is told when it closes. */
type RaisedWith = { readonly opening: object; readonly landing: { readonly closed: () => void } };

/** The windows that lay out cards, which a card shown large is taken off. */
type Offering = Browsing | AimWindow | Dealing | Capstone;

/** The two windows that ring one of the cards they offer. */
type Ringing = Browsing | Dealing;

/** The cards shown large, over what the first of them was taken off. */
type Inspection = { readonly stands: 'inspection'; readonly over: Offering | undefined };

/**
 * What the scrim carries: a pile's cards, the aim window, the deal window, the capstone's window,
 * the cards shown large over what they were taken off, or the ending screen.
 */
type Carried = Offering | Inspection | { readonly stands: 'ending' };

/** The ending screen raised, and its button. */
type Raised = {
  readonly screen: Phaser.GameObjects.Container;
  readonly button: Phaser.GameObjects.Rectangle;
};

/**
 * The scrim and what stands on it, on the overlay scene: nothing beneath answers a pointer while
 * anything stands, and `covering` is told as the scrim goes up and comes down. The ending screen
 * reads what `paid` answers once the chronicle has ended, and its button leaves through `leave`.
 */
export function createOverlay(
  scene: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  take: (at: number) => void,
  paid: () => Payment | undefined,
  leave: () => void,
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
  const small = createSmallCards(scene, scene.strata.smallCard, catalogue, kinds, (name) => {
    inspectNamed(name);
  });
  const stack = createStack(scene, catalogue, kinds);

  let shown: Phaser.GameObjects.GameObject[] = [];
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  let grid: Grid | undefined;
  /** Whether the grid has moved since the name and the label under the pointer were read off it. */
  let moved = false;
  /** How far the grid is scrolled, kept while a card taken off it is inspected. */
  const scroll = createScroll((offset) => {
    grid?.root.setY(-offset);
    small.follow();
    tooltip.follow();
    moved = true;
  });
  /** The chronicle the ending screen was raised on: a render raises the screen once and no more. */
  let raisedOn: Ended | undefined;
  /** The deal standing, so no render raises its window twice; the take lets it go. */
  let standingDeal: Dealing | undefined;
  /** Whether the first render has opened the screen on the capstone's window. */
  let opened = false;
  /** The ending screen still coming up, its button dead until `risen`; a render may cut the rise short. */
  let rising: Raised | undefined;

  /** One thing raised on the scrim: it stands on the `carried` stratum and goes at the next wipe. */
  const carries = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
    on.layer.add(object);
    shown.push(object);
    return object;
  };

  /** What the scrim carries taken down, the scrim itself left up: every raise replaces through here. */
  const wipe = (): void => {
    small.down();
    stack.down();
    note.hide();
    for (const object of shown) object.destroy();
    shown = [];
    rising = undefined;
    grid = undefined;
    scroll.stand(scroll.offset);
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

  /** The scrim cleared for the stack, over what its first card is taken off. */
  const standStack = (over: Offering | undefined): void => {
    wipe();
    cover();
    carried = { stands: 'inspection', over };
  };

  const showInspection = (face: Face, refusal: Refusal, over: Offering | undefined): void => {
    standStack(over);
    stack.show(face, refusal);
  };

  /**
   * What a name names, on top of the stack while a card stands large; shown large alone over the
   * window standing otherwise.
   */
  const inspectNamed = (name: Name): void => {
    if (carried === undefined) {
      standStack(undefined);
      stack.named(name);
      return;
    }
    switch (carried.stands) {
      case 'inspection':
        stack.named(name);
        return;
      case 'browse':
      case 'aim-window':
      case 'deal':
      case 'capstone':
        standStack(carried);
        stack.named(name);
        return;
      case 'ending':
        standStack(undefined);
        stack.named(name);
        return;
    }
  };

  const raiseTitle = (name: string, heading: string): Phaser.GameObjects.Text =>
    carries(headingOf(scene, name, heading));

  /** A window's lore, named after the window it stands in, just over the row its grid laid. */
  const raiseLore = (name: string, lore: string, laid: Grid): void => {
    const rowTop = laid.placed[0].y - laid.height;
    const line = addText(scene, DESIGN_WIDTH / 2, rowTop - 16, lore, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: TITLE_INK,
      align: 'center',
      wordWrap: { width: 600 },
    })
      .setName(`${name}-lore`)
      .setOrigin(0.5, 1);
    carries(line);
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
    small.over(scroll.dragged ? undefined : nameUnder(pointer));
    overKind(scroll.dragged ? undefined : kindUnder(pointer));
  };

  /**
   * Every card face is named `<name>-card-<n>` after its place on the screen, the first drawn first,
   * and carries its card and the number it was offered as in its data.
   */
  const layGrid = (
    name: string,
    cards: readonly Offered[],
    top: number,
    pressed: (card: Placed, press: Press) => void,
  ): Grid => {
    const height = heightOf(BROWSE_WIDTH);
    const frameHeight = DESIGN_HEIGHT - MARGIN - top;
    const columns = Math.max(
      1,
      Math.floor((DESIGN_WIDTH - 2 * MARGIN + BROWSE_GAP) / (BROWSE_WIDTH + BROWSE_GAP)),
    );
    const rows = Math.max(1, Math.ceil(cards.length / columns));
    const spanY = rows * height + (rows - 1) * BROWSE_GAP;
    const overflow = reachOf(frameHeight, spanY);
    const firstY = top + Math.max(0, (frameHeight - spanY) / 2);

    const frame = scene.add
      .zone(DESIGN_WIDTH / 2, top + frameHeight / 2, DESIGN_WIDTH - 2 * MARGIN, frameHeight)
      .setName(`${name}-frame`)
      .setInteractive({ draggable: true });
    answersPress(frame);
    carries(frame);

    frame.on('pointerdown', () => {
      scroll.press();
    });
    frame.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      scroll.grab(on.at(pointer.downX, pointer.downY).y);
    });
    frame.on('drag', (pointer: Phaser.Input.Pointer) => {
      scroll.drag(on.at(pointer.x, pointer.y).y, scene.time.now);
    });
    frame.on('dragend', (pointer: Phaser.Input.Pointer) => {
      scroll.release(scene.time.now, !releasedOffCanvas(pointer));
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
    const press = (pointer: Phaser.Input.Pointer, button: Press): void => {
      const card = under(pointer);
      if (card === undefined) back();
      else pressed(card, button);
    };
    onClick(frame, (pointer) => {
      press(pointer, 'left');
    });
    onClick(
      frame,
      (pointer) => {
        const named = nameUnder(pointer)?.name;
        if (named === undefined) press(pointer, 'right');
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

    const laid = { root, frame, placed, height };
    grid = laid;
    scroll.reach(overflow);
    root.setY(-scroll.offset);
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
      (card, press) => {
        switch (press) {
          case 'left':
            ring(browsing, card.at);
            return;
          case 'right':
            showInspection(card.face, NO_REFUSAL, browsing);
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

    const { heading, lore, entries } = dealt(catalogue, dealing.on, dealing.deal);
    const title = raiseTitle('deal', heading);
    const laid = layGrid('deal', entries, title.y + title.height + MARGIN, (card, press) => {
      switch (press) {
        case 'left': {
          if (card.at !== dealing.selected) {
            ring(dealing, card.at);
            return;
          }
          if (!playable(card.refusal)) {
            const over = card.y + laid.root.y - laid.height;
            note.overCard(refused(card.costs, card.refusal), card.x, over);
            return;
          }
          standingDeal = undefined;
          close();
          take(card.at);
          return;
        }
        case 'right':
          showInspection(card.face, card.refusal, dealing);
          return;
      }
    });
    raiseLore('deal', lore, laid);
    ring(dealing, dealing.selected);
  };

  /**
   * The capstone's window closed: it is read once, and nothing brings it back on this screen but the
   * landing. The opening's closes onto the screen as the chronicle stands; the landing's is told it
   * closed once the scrim is down.
   */
  const closeCapstone = (closing: Capstone): void => {
    close();
    switch (closing.raised) {
      case 'opening':
        standAs(closing.on);
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

    const { id } = announcement.on.timeline.capstone;
    const face = capstoneFace(id);
    const title = raiseTitle('capstone', text('capstone.title'));
    const laid = layGrid(
      'capstone',
      [{ face, costs: [], refusal: NO_REFUSAL, at: 0 }],
      title.y + title.height + MARGIN,
      (_card, press) => {
        switch (press) {
          case 'left':
            closeCapstone(announcement);
            return;
          case 'right':
            showInspection(face, NO_REFUSAL, announcement);
            return;
        }
      },
    );
    raiseLore('capstone', capstoneLore(id, announcement.raised), laid);
  };

  /** The aim window raised, and raised again where the back from a card shown large brings it. */
  const showAim = (aim: Aiming): void => {
    wipe();
    cover();
    const raised: AimWindow = { stands: 'aim-window', aim };
    carried = raised;

    const title = raiseTitle('aim-window', text('aim.discard-pile', { card: cardName(aim.aimed) }));
    layGrid('aim-window', aim.cards, title.y + title.height + MARGIN, (card, press) => {
      switch (press) {
        case 'left':
          // The aim landed, so the window closes without saying it closed with nothing paid.
          close();
          aim.chosen(card.at);
          return;
        case 'right':
          showInspection(card.face, NO_REFUSAL, raised);
          return;
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

  /**
   * The chronicle ended, on the screen that says so: the outcome, under it the ledger of what it
   * paid and under that its button, one block centred on the screen.
   */
  const showEnding = (on: Ended): Raised => {
    wipe();
    cover();
    carried = { stands: 'ending' };
    raisedOn = on;

    const said = says(on);
    const reached = on.payment.achievements.map((id) => achievementOf(catalogue, on.age, id));
    const width = 340;
    const pitch = 34;
    const gap = 44;
    const ruleRoom = 0.4 * pitch;
    const style = (bold: boolean): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: UI_FONT,
      fontSize: '22px',
      fontStyle: bold ? 'bold' : 'normal',
      color: TITLE_INK,
    });
    const title = addText(scene, DESIGN_WIDTH / 2, 0, said.title, {
      fontFamily: UI_FONT,
      fontSize: '72px',
      fontStyle: 'bold',
      color: TITLE_INK,
    }).setOrigin(0.5, 0);
    const line = addText(scene, DESIGN_WIDTH / 2, title.height + 24, said.line, style(false));
    line.setOrigin(0.5, 0);

    const left = (DESIGN_WIDTH - width) / 2;
    const right = left + width;
    const diamond = (x: number, y: number): Phaser.GameObjects.Rectangle =>
      chipAt(scene, { x, y }, LOOK.influence);
    const parts: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform)[] = [
      title,
      line,
    ];
    let y = line.y + line.height + gap + pitch / 2;
    reached.forEach(({ technology, influence }, at) => {
      const achievement = technologyName(technology);
      parts.push(
        addText(scene, left, y, text('ending.reached', { achievement }), style(false))
          .setOrigin(0, 0.5)
          .setName(`ending-row-${at}`),
      );
      if (influence > 0) {
        const number = addText(scene, right, y, String(influence), style(false))
          .setOrigin(1, 0.5)
          .setName(`ending-row-${at}-influence`);
        parts.push(diamond(number.x - number.width - 18, y), number);
      }
      y += pitch;
    });
    if (reached.length > 0) {
      parts.push(
        scene.add.rectangle(left, y - pitch / 2 + 4, width, 1, LOOK.panelEdge).setOrigin(0, 0),
      );
      y += ruleRoom;
    }
    const total = addText(scene, left + 22, y, text('label.influence'), style(true))
      .setOrigin(0, 0.5)
      .setName('ending-total-label');
    parts.push(
      diamond(left + 7, y),
      total,
      addText(scene, right, y, String(on.payment.influence), style(true))
        .setOrigin(1, 0.5)
        .setName('ending-total'),
    );

    const buttonY = y + total.height / 2 + gap + BUTTON_HEIGHT / 2;
    const button = createButton(
      scene,
      DESIGN_WIDTH / 2,
      buttonY,
      'end-chronicle',
      text('ending.end-chronicle'),
      leave,
    );
    button.face.disableInteractive();
    parts.push(button.face, button.label);

    const lowered = (DESIGN_HEIGHT - (buttonY + BUTTON_HEIGHT / 2)) / 2;
    for (const part of parts) part.y += lowered;
    const screen = carries(scene.add.container(0, 0, parts).setName(on.ending.outcome));
    return { screen, button: button.face };
  };

  /** The rise over, however it ended: the button answers from here. */
  const risen = (): void => {
    const raised = rising;
    if (raised === undefined) return;
    rising = undefined;
    raised.button.setInteractive();
  };

  /** The ending as it lands: the scrim and the screen rise together, out of nothing and a little low. */
  const raiseEnding = (on: Ended): Promise<void> => {
    const raised = showEnding(on);
    raised.screen.setAlpha(0).setY(12);
    rising = raised;
    scrim.setAlpha(0);

    const climb = { duration: 1200, ease: EASE };
    return Promise.all([
      ended(scene.tweens.add({ targets: scrim, alpha: LOOK.scrim.strength, ...climb })),
      ended(scene.tweens.add({ targets: raised.screen, alpha: 1, y: 0, ...climb })),
    ]).then(() => {
      if (rising === raised) risen();
    });
  };

  /** The rise cut short and stood up where it was going: a render leaves the screen full. */
  const stand = (): void => {
    const raised = rising;
    if (raised === undefined) return;
    stopMotion(scene, scrim);
    stopMotion(scene, raised.screen);
    scrim.setAlpha(LOOK.scrim.strength);
    raised.screen.setAlpha(1).setY(0);
    risen();
  };

  /** What the ending screen reads of the chronicle that has ended, and what it paid. */
  const endedOf = (chronicle: Chronicle, ending: Ending): Ended => {
    const payment = paid();
    if (payment === undefined) throw new Error('the chronicle ended with no payment held');
    return { ending, timeline: chronicle.timeline, age: chronicle.age, payment };
  };

  /** What stands over the chronicle as it stands: its ending screen, else the deal it waits on. */
  const standAs = (chronicle: Chronicle): void => {
    if (chronicle.ending !== undefined && raisedOn === undefined)
      void raiseEnding(endedOf(chronicle, chronicle.ending));
    else if (chronicle.deals[0] !== undefined && standingDeal === undefined)
      showDeal({ stands: 'deal', on: chronicle, deal: chronicle.deals[0], selected: undefined });
    else stand();
  };

  /**
   * The newest card shown large taken down, and the last of them onto what it was taken off: the one
   * path, whichever way.
   */
  const takeDownNewest = ({ over }: Inspection): void => {
    if (stack.takeDownNewest()) return;
    if (over === undefined) close();
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

  onClick(scrim, back);
  onClick(scrim, back, 'right');

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
      if (grid !== undefined) scroll.wheel(dy);
    },
  );

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    // Here and not in the scroll's move: the wheel scrolls from inside Phaser's dispatch, where a hit
    // test refills the list being walked (docs/PHASER.md).
    if (moved) {
      moved = false;
      if (grid !== undefined && thingUnder(scene.game) === grid.frame) {
        pointOnGrid(scene.input.activePointer);
      }
    }
    if (grid !== undefined) scroll.step(delta);
  });

  return {
    browse(pile: PileKind, chronicle: Chronicle): void {
      scroll.stand(0);
      showBrowse({
        stands: 'browse',
        pile,
        cards: cardsOf(catalogue, pile, chronicle),
        selected: undefined,
      });
    },
    aimDiscardPile(chronicle, aimed, chosen, closed): () => void {
      scroll.stand(0);
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
      if (opened) {
        standAs(chronicle);
        return;
      }
      opened = true;
      showCapstone({ stands: 'capstone', on: chronicle, raised: 'opening' });
    },
    play(stage: Stage): Promise<void> | undefined {
      switch (stage.kind) {
        case 'change':
          break;
        case 'group':
          if (stage.stages.length > 0) return grouped(stage);
          break;
      }
      const { ending, deals } = stage.chronicle;
      if (ending !== undefined && raisedOn === undefined)
        return raiseEnding(endedOf(stage.chronicle, ending));
      // Every camp captured deals before the camps after it are captured: the window waits for the
      // render the play-out ends on, which a render of this stage would pre-empt.
      return deals.length > 0 ? Promise.resolve() : undefined;
    },
  };
}

/**
 * What of an ended chronicle its ending screen reads: how it ended, the capstone it was on, and what
 * it paid, its achievements read in its age.
 */
type Ended = Pick<Chronicle, 'timeline' | 'age'> & {
  readonly ending: Ending;
  readonly payment: Payment;
};

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
 * What the deal window reads of a deal: the event's name and lore or the camp's over it, and its
 * entries in the order dealt — an answer drawn unaffordable where the chronicle cannot pay it, a
 * reward as the card of the deck it is.
 */
function dealt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  deal: Deal,
): { heading: string; lore: string; entries: readonly Offered[] } {
  const ids = offered(catalogue, deal);
  switch (deal.of) {
    case 'event':
      return {
        heading: eventName(deal.event),
        lore: eventLore(deal.event),
        entries: ids.map(
          (id, at): Offered => ({
            face: answerFace(catalogue, chronicle, deal.event, id),
            costs: answerCost(catalogue, chronicle, answerOf(catalogue, deal.event, id)),
            refusal: answerRefusal(catalogue, chronicle, deal.event, id),
            at,
          }),
        ),
      };
    case 'camp': {
      const { building } = ageOf(catalogue, chronicle.age).camp;
      return {
        heading: buildingName(building),
        lore: campLore(building),
        entries: ids.map((id, at) => offeredCard(cardFaceAtStart(catalogue, id), at)),
      };
    }
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
