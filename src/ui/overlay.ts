import Phaser from 'phaser';
import { CARD_KINDS } from '../rules/cards';
import { type Catalogue, cardOf } from '../rules/catalogue';
import type { Stage } from '../rules/chronicle';
import { dealsCapstone } from '../rules/schedule';
import { type CardId, type Chronicle, type Ending, NO_REFUSAL, type Refusal } from '../rules/state';
import type { Bind, Press } from './bindings';
import {
  type CardFace,
  cardFace,
  createCardFace,
  eventFace,
  type Face,
  heightOf,
} from './card-face';
import { EASE, ended, stopMotion } from './card-motion';
import {
  addText,
  createClip,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  releasedOffCanvas,
  SCRIM_DEPTH,
  type Surface,
  UI_FONT,
  whileUp,
} from './design-space';
import { behind, createWindow, type MenuWindow, type Opened } from './menu';
import { BAR_HEIGHT } from './resource-bar';
import { cardName, text, victoryLine } from './text';

const SCRIM = 0x0d1014;
const SCRIM_ALPHA = 0.82;

const TITLE_INK = '#d4d7db';

const BROWSE_WIDTH = 180;
const BROWSE_GAP = 26;
const INSPECTION_WIDTH = 380;

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
  inspect(id: CardId, refusal: Refusal): void;
  /** The inspection key, pressed while the scrim covers: shows the ringed card of a window large. */
  inspectSelection(): void;
  /** The Menu button: raises the menu over whatever stands, and takes the whole menu back down. */
  menu(): void;
  /** Takes what stands on the scrim back one step, and answers whether anything stood. */
  back(): boolean;
  /** A key pressed while a slot of the Controls window listens binds there, and is taken. */
  binds(press: Bind): boolean;
  /**
   * Raises the capstone's window on the founding's first render, the deal window while the chronicle
   * waits on a deal and the ending screen once it has ended, and nothing while it runs.
   */
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/** One face offered on the scrim, and the number a press on it answers by. */
type Offered = { readonly face: Face; readonly at: number };

/** Where one offered face was laid out — about its own bottom centre, as a card is drawn — and its drawing. */
type Placed = Offered & {
  readonly x: number;
  readonly y: number;
  readonly drawn: CardFace;
};

/** The grid of cards a browse or an aim stands on, and how far it moves. */
type Grid = {
  readonly root: Phaser.GameObjects.Container;
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
  readonly cards: readonly CardId[];
  /** The number the ringed card was offered as, and nothing while none is ringed. */
  selected: number | undefined;
};

/** The aim window on the scrim, over what it offers. */
type AimWindow = { readonly stands: 'aim-window'; readonly aim: Aiming };

/**
 * The deal window on the scrim: the chronicle the events phase dealt on, which its entries read
 * their numbers off, and which of them is ringed. It closes on the take alone.
 */
type Dealing = {
  readonly stands: 'deal';
  readonly on: Chronicle;
  /** The number the ringed entry was offered as, and nothing while none is ringed. */
  selected: number | undefined;
};

/**
 * The capstone's window on the scrim: the chronicle it was raised over, which the capstone's card
 * reads its numbers off. It offers its one card to be read and nothing to be taken, so it holds no
 * selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle };

/** The windows that lay out cards, which a card shown large is taken off. */
type Offering = Browsing | AimWindow | Dealing | Capstone;

/** The two windows that ring one of the cards they offer. */
type Ringing = Browsing | Dealing;

/**
 * What the scrim carries: a pile's cards, the aim window, the deal window, the capstone's window,
 * one card shown large over what it was taken off, a window of the menu, or the ending screen.
 */
type Carried =
  | Offering
  | { readonly stands: 'inspection'; readonly over: Offering | undefined }
  | { readonly stands: 'window'; readonly which: MenuWindow; readonly laid: Opened }
  | { readonly stands: 'ending' };

/** Where a drag of the grid was pressed, what the grid stood at, and where the pointer has been. */
type Scroll = {
  readonly y: number;
  readonly from: number;
  readonly trail: { time: number; y: number }[];
};

/**
 * The scrim and what stands on it. The scrim swallows every pointer beneath it, so the chronicle
 * screen is inert while anything is up, and only the menu comes up over the ending screen — a
 * chronicle that has ended is left behind by a new one alone. `covering` is told as the scrim goes up
 * and comes down, for whatever it cannot swallow: the wheel and the keyboard reach past it.
 */
export function createOverlay(
  scene: Phaser.Scene,
  on: Surface,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  newChronicle: () => void,
  take: (event: string) => void,
): Overlay {
  const scrim = scene.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, SCRIM, SCRIM_ALPHA)
    .setOrigin(0, 0)
    .setDepth(SCRIM_DEPTH)
    .setVisible(false);
  const clip = createClip(scene, on);

  let shown: Phaser.GameObjects.GameObject[] = [];
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  let grid: Grid | undefined;
  /** How far the grid is scrolled, kept while a card taken off it is inspected. */
  let offset = 0;
  let fling = 0;
  let scrolling: Scroll | undefined;
  /** The chronicle the ending screen was raised on, kept so the menu can close back onto it. */
  let raisedOn: Ended | undefined;
  /** The deal standing, kept so the menu can close back onto its window; the take lets it go. */
  let dealing: Dealing | undefined;
  /** Whether the capstone has been announced: the first render raises its window, and no render after. */
  let announced = false;
  /** The capstone's window standing, kept so the menu can close back onto it; closing it lets it go. */
  let capstone: Capstone | undefined;
  /** The ending screen still coming up; a render owns the rise and takes it down. */
  let rising: Phaser.GameObjects.Container | undefined;

  /** What the scrim carries taken down, the scrim itself left up: every raise replaces through here. */
  const wipe = (): void => {
    for (const object of shown) object.destroy();
    shown = [];
    grid = undefined;
    scrolling = undefined;
    fling = 0;
    clip.hide();
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
      case 'window':
      case 'ending':
        return undefined;
    }
  };

  /** The window of the menu standing, and nothing while anything else stands, or nothing at all. */
  const windowStanding = (): { which: MenuWindow; laid: Opened } | undefined => {
    if (carried === undefined) return undefined;
    switch (carried.stands) {
      case 'window':
        return carried;
      case 'browse':
      case 'aim-window':
      case 'deal':
      case 'capstone':
      case 'inspection':
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
    scrim.setVisible(true).setAlpha(SCRIM_ALPHA).setInteractive();
    covering(true);
  };

  const showInspection = (face: Face, refusal: Refusal, over: Offering | undefined): void => {
    wipe();
    cover();
    carried = { stands: 'inspection', over };
    const height = heightOf(INSPECTION_WIDTH);
    const { root } = createCardFace(scene, face, refusal, { width: INSPECTION_WIDTH });
    root
      .setName('inspection')
      .setData('card', face.id)
      .setPosition(DESIGN_WIDTH / 2, (DESIGN_HEIGHT + height) / 2)
      .setDepth(SCRIM_DEPTH + 1)
      // The card is interactive so that both presses on it reach nothing beneath, the scrim
      // included; it answers neither.
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -INSPECTION_WIDTH / 2,
          -height,
          INSPECTION_WIDTH,
          height,
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      });
    shown.push(root);
  };

  /** Moves the grid, never past either end of its cards. */
  const scrollTo = (to: number): void => {
    if (grid === undefined) return;
    offset = Math.min(Math.max(to, 0), grid.overflow);
    grid.root.setY(-offset);
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
      .setOrigin(0.5, 0)
      .setDepth(SCRIM_DEPTH + 1);
    shown.push(title);
    return title;
  };

  /** The card of the standing grid a press landed on, and nothing where it landed between them. */
  const under = (pointer: Phaser.Input.Pointer): Placed | undefined => {
    if (grid === undefined) return undefined;
    const at = on.at(pointer.x, pointer.y);
    return cardAt(grid, at.x, at.y);
  };

  /**
   * A pile's cards laid out below `top`, and the frame that scrolls and flings them: `pressed` takes
   * the press and the number the card under it was offered as, and nothing where it landed between
   * them. Every card face is named after the grid and its place on the screen, the first drawn
   * first, and carries the card it stands and the number it was offered as in its data. Nothing may
   * be added to the scene after this: the clip's camera draws whatever it was not told to ignore
   * inside the frame.
   */
  const layGrid = (
    name: string,
    cards: readonly Offered[],
    top: number,
    pressed: (at: number | undefined, press: Press) => void,
  ): void => {
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
      .setDepth(SCRIM_DEPTH + 2)
      .setInteractive({ cursor: 'pointer', draggable: true });

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
    onClick(frame, (pointer) => {
      pressed(under(pointer)?.at, 'left');
    });
    onClick(
      frame,
      (pointer) => {
        pressed(under(pointer)?.at, 'right');
      },
      'right',
    );

    const root = scene.add
      .container(0, 0)
      .setName(name)
      .setDepth(SCRIM_DEPTH + 1)
      .setData('overflow', overflow);

    const placed = cards.map((offered, index): Placed => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * BROWSE_WIDTH + (inRow - 1) * BROWSE_GAP;
      const x =
        (DESIGN_WIDTH - spanX) / 2 + column * (BROWSE_WIDTH + BROWSE_GAP) + BROWSE_WIDTH / 2;
      const y = firstY + row * (height + BROWSE_GAP) + height;
      const drawn = createCardFace(scene, offered.face, NO_REFUSAL, { width: BROWSE_WIDTH });
      root.add(
        drawn.root
          .setPosition(x, y)
          .setName(`${name}-card-${index}`)
          .setData({ at: offered.at, card: offered.face.id }),
      );
      return { ...offered, x, y, drawn };
    });
    shown.push(frame, root);

    grid = { root, placed, height, overflow };
    scrollTo(offset);
    clip.show(root, MARGIN, top, DESIGN_WIDTH - 2 * MARGIN, frameHeight);
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
      browsing.cards.map((id, at): Offered => ({ face: cardFace(catalogue, id), at })),
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
   * The deal window raised, and raised again where the back from a card shown large or from the menu
   * brings it. A press on an entry rings it and a press on the ringed entry takes it: the window
   * closes on the take, and the landing plays out under the caller.
   */
  const showDeal = (deal: Dealing): void => {
    wipe();
    cover();
    carried = deal;
    dealing = deal;

    const title = raiseTitle('deal', text(dealsCapstone(deal.on) ? 'deal.capstone' : 'deal.title'));
    layGrid(
      'deal',
      deal.on.deal.map((id, at): Offered => ({ face: eventFace(catalogue, deal.on, id), at })),
      title.y + title.height + MARGIN,
      (at, press) => {
        switch (press) {
          case 'left':
            if (at === undefined || at !== deal.selected) {
              ring(deal, at);
              return;
            }
            dealing = undefined;
            close();
            take(deal.on.deal[at]);
            return;
          case 'right':
            if (at !== undefined) {
              showInspection(eventFace(catalogue, deal.on, deal.on.deal[at]), NO_REFUSAL, deal);
            }
            return;
        }
      },
    );
    ring(deal, deal.selected);
  };

  /** The capstone's window closed: it is read once, and nothing brings it back on this screen. */
  const closeCapstone = (): void => {
    capstone = undefined;
    close();
  };

  /**
   * The capstone's window raised, and raised again where the back from a card shown large or from
   * the menu brings it. A left press on its card closes it for good, as a press beside it does.
   */
  const showCapstone = (announcement: Capstone): void => {
    wipe();
    cover();
    carried = announcement;
    capstone = announcement;

    const face = eventFace(catalogue, announcement.on, announcement.on.timeline.capstone.event);
    const title = raiseTitle('capstone', text('capstone.title'));
    layGrid('capstone', [{ face, at: 0 }], title.y + title.height + MARGIN, (at, press) => {
      switch (press) {
        case 'left':
          if (at === undefined) back();
          else closeCapstone();
          return;
        case 'right':
          if (at !== undefined) showInspection(face, NO_REFUSAL, announcement);
          return;
      }
    });
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

    const screen = scene.add
      .container(0, 0, [title, line])
      .setDepth(SCRIM_DEPTH + 1)
      .setName(on.ending.outcome);
    shown.push(screen);
    return screen;
  };

  /** The ending as it lands: the scrim and the screen rise together, out of nothing and a little low. */
  const raiseEnding = (on: Ended): Promise<void> => {
    const screen = showEnding(on).setAlpha(0).setY(12);
    rising = screen;
    scrim.setAlpha(0);

    const climb = { duration: 1200, ease: EASE };
    return Promise.all([
      ended(scene.tweens.add({ targets: scrim, alpha: SCRIM_ALPHA, ...climb })),
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
    scrim.setAlpha(SCRIM_ALPHA);
    screen.setAlpha(1).setY(0);
  };

  const showWindow = (which: MenuWindow): void => {
    wipe();
    cover();
    const laid = createWindow(scene, which, {
      press: (press) => {
        if (press === 'new-chronicle') newChronicle();
        else showWindow(press);
      },
      back: () => {
        back();
      },
    });
    carried = { stands: 'window', which, laid };
    shown.push(laid.root.setDepth(SCRIM_DEPTH + 1));
  };

  /**
   * The menu gone: back to the chronicle screen, or onto the deal window, the capstone's window or
   * the ending screen that stood under it.
   */
  const shut = (): void => {
    if (raisedOn !== undefined) showEnding(raisedOn);
    else if (dealing !== undefined) showDeal(dealing);
    else if (capstone !== undefined) showCapstone(capstone);
    else close();
  };

  /** The card shown large taken down, onto what it was taken off: the one path, whichever way. */
  const dropInspection = (over: Offering | undefined): void => {
    if (over === undefined) close();
    else raise(over);
  };

  const back = (): boolean => {
    if (carried === undefined) return false;
    switch (carried.stands) {
      case 'window': {
        const step = behind(carried.which);
        if (step === undefined) shut();
        else showWindow(step);
        return true;
      }
      case 'inspection':
        dropInspection(carried.over);
        return true;
      case 'browse':
        if (carried.selected === undefined) close();
        else ring(carried, undefined);
        return true;
      case 'aim-window':
        closeAim();
        return true;
      case 'deal':
        // The menu is raised here and not left to the chronicle screen's own back: the window
        // stands until the take, so nothing under it may answer this key.
        if (carried.selected === undefined) showWindow('menu');
        else ring(carried, undefined);
        return true;
      case 'capstone':
        closeCapstone();
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
      case 'window':
      case 'ending':
        back();
        return;
    }
  };

  onClick(scrim, beside);

  onClick(
    scrim,
    () => {
      if (carried === undefined) return;
      switch (carried.stands) {
        case 'inspection':
          dropInspection(carried.over);
          return;
        case 'browse':
        case 'aim-window':
        case 'deal':
        case 'capstone':
        case 'window':
        case 'ending':
          return;
      }
    },
    'right',
  );

  scene.input.on(
    'wheel',
    (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (grid === undefined) return;
      fling = 0;
      scrollTo(offset + dy);
    },
  );

  whileUp(scene, scene.events, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
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
          .map((id, at): Offered => ({ face: cardFace(catalogue, id), at }))
          .reverse(),
        chosen,
        closed,
      });
      return closeAim;
    },
    inspect(id: CardId, refusal: Refusal): void {
      showInspection(cardFace(catalogue, id), refusal, undefined);
    },
    inspectSelection(): void {
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
          const at = carried.selected;
          if (at !== undefined) {
            showInspection(
              eventFace(catalogue, carried.on, carried.on.deal[at]),
              NO_REFUSAL,
              carried,
            );
          }
          return;
        }
        case 'aim-window':
        case 'capstone':
        case 'inspection':
        case 'window':
        case 'ending':
          return;
      }
    },
    menu(): void {
      if (windowStanding() === undefined) showWindow('menu');
      else shut();
    },
    back,
    binds(press: Bind): boolean {
      return windowStanding()?.laid.binds(press) ?? false;
    },
    render(chronicle: Chronicle): void {
      if (!announced) {
        announced = true;
        showCapstone({ stands: 'capstone', on: chronicle });
      } else if (chronicle.ending !== undefined && raisedOn === undefined)
        void raiseEnding({ ending: chronicle.ending, timeline: chronicle.timeline });
      else if (chronicle.deal.length > 0 && dealing === undefined)
        showDeal({ stands: 'deal', on: chronicle, selected: undefined });
      else stand();
    },
    play(stage: Stage): Promise<void> | undefined {
      const { ending, timeline } = stage.chronicle;
      if (ending === undefined || raisedOn !== undefined) return undefined;
      return raiseEnding({ ending, timeline });
    },
  };
}

/** What of an ended chronicle its ending screen reads: how it ended, and the capstone it was on. */
type Ended = Pick<Chronicle, 'timeline'> & { readonly ending: Ending };

/** What the ending screen reads: its title, and the one line under it. */
function says({ ending, timeline }: Ended): { title: string; line: string } {
  switch (ending.outcome) {
    case 'victory':
      return { title: text('victory.title'), line: victoryLine(timeline.capstone.event) };
    case 'defeat':
      return {
        title: text('defeat.title'),
        line: text(`defeat.${ending.cause}`, { turn: ending.turn }),
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
function cardsOf(catalogue: Catalogue, pile: PileKind, chronicle: Chronicle): readonly CardId[] {
  if (pile === 'discard-pile') return [...chronicle.discardPile].reverse();
  return [...chronicle.drawPile].sort(
    (a, b) =>
      CARD_KINDS.indexOf(cardOf(catalogue, a).kind) -
        CARD_KINDS.indexOf(cardOf(catalogue, b).kind) || cardName(a).localeCompare(cardName(b)),
  );
}
