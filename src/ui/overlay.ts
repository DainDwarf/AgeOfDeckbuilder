import Phaser from 'phaser';
import { CARD_KINDS, CARDS } from '../rules/cards';
import { NO_REFUSAL, type Refusal, type Stage } from '../rules/chronicle';
import type { CardId, Chronicle, Defeat } from '../rules/state';
import type { Bind, Press } from './bindings';
import { type CardFace, createCardFace } from './card-face';
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
import { text } from './text';

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
   * The aimed card is in the hand, so the pile never holds it and never offers it. Answers the way
   * to close it from outside.
   */
  aimDiscardPile(
    chronicle: Chronicle,
    chosen: (at: number) => void,
    closed: () => void,
  ): () => void;
  inspect(id: CardId, refusal: Refusal): void;
  /** The inspection key, pressed while the scrim covers: shows a browse's selection large. */
  inspectSelection(): void;
  /** The Menu button: raises the menu over whatever stands, and takes the whole menu back down. */
  menu(): void;
  /** Takes what stands on the scrim back one step, and answers whether anything stood. */
  back(): boolean;
  /** A key pressed while a slot of the Controls window listens binds there, and is taken. */
  binds(press: Bind): boolean;
  /** Raises the defeat screen once the chronicle has ended, and nothing while it runs. */
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/** One card offered on the scrim, and the number a press on it answers by. */
type Offered = { readonly id: CardId; readonly at: number };

/** Where one offered card was laid out — about its own bottom centre, as a card is drawn — and its face. */
type Placed = Offered & {
  readonly x: number;
  readonly y: number;
  readonly face: CardFace;
};

/** The grid of cards a browse or an aim stands on, and how far it moves. */
type Grid = {
  readonly root: Phaser.GameObjects.Container;
  readonly placed: readonly Placed[];
  readonly height: number;
  /** The furthest the cards scroll; zero when they all fit inside the frame. */
  readonly overflow: number;
};

/** What the aim window stands on: the cards it offers, and what a press on one of them plays. */
type Aiming = {
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

/** What a card shown large was taken off, and nothing when it came from the hand. */
type Under = Browsing | AimWindow;

/**
 * What the scrim carries: a pile's cards, the aim window, one card shown large over what it was
 * taken off, a window of the menu, or the defeat screen.
 */
type Carried =
  | Under
  | { readonly stands: 'inspection'; readonly over: Under | undefined }
  | { readonly stands: 'window'; readonly which: MenuWindow; readonly laid: Opened }
  | { readonly stands: 'defeat' };

/** Where a drag of the grid was pressed, what the grid stood at, and where the pointer has been. */
type Scroll = {
  readonly y: number;
  readonly from: number;
  readonly trail: { time: number; y: number }[];
};

/**
 * The scrim and what stands on it. The scrim swallows every pointer beneath it, so the chronicle
 * screen is inert while anything is up, and only the menu comes up over the defeat screen — the city
 * that fell is left behind by a new chronicle alone. `covering` is told as the scrim goes up and
 * comes down, for whatever it cannot swallow: the wheel and the keyboard reach past it.
 */
export function createOverlay(
  scene: Phaser.Scene,
  on: Surface,
  covering: (covered: boolean) => void,
  newChronicle: () => void,
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
  /** The fall the defeat screen was raised on, kept so the menu can close back onto it. */
  let fallen: Defeat | undefined;
  /** The defeat screen still coming up; a render owns the rise and takes it down. */
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
      case 'window':
      case 'defeat':
        return undefined;
    }
  };

  /** The browse wherever it stands: on the scrim, or under a card it is showing large. */
  const browseStanding = (what: Carried | undefined): Browsing | undefined => {
    if (what === undefined) return undefined;
    switch (what.stands) {
      case 'browse':
        return what;
      case 'inspection':
        return browseStanding(what.over);
      case 'aim-window':
      case 'window':
      case 'defeat':
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
      case 'inspection':
      case 'defeat':
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

  // The defeat's rise brings the scrim up from nothing, so every cover states the alpha it wants.
  const cover = (): void => {
    stopMotion(scene, scrim);
    scrim.setVisible(true).setAlpha(SCRIM_ALPHA).setInteractive();
    covering(true);
  };

  const showInspection = (id: CardId, refusal: Refusal, over: Under | undefined): void => {
    wipe();
    cover();
    carried = { stands: 'inspection', over };
    const { root } = createCardFace(scene, id, refusal, { width: INSPECTION_WIDTH });
    root
      .setName('inspection')
      .setData('card', id)
      .setPosition(DESIGN_WIDTH / 2, (DESIGN_HEIGHT + Math.round(INSPECTION_WIDTH * 1.4)) / 2)
      .setDepth(SCRIM_DEPTH + 1);
    shown.push(root);
  };

  /** Moves the grid, never past either end of its cards. */
  const scrollTo = (to: number): void => {
    if (grid === undefined) return;
    offset = Math.min(Math.max(to, 0), grid.overflow);
    grid.root.setY(-offset);
  };

  /** The heading a pile's cards stand under; the caller stands whatever else belongs beside it. */
  const raiseTitle = (heading: string): Phaser.GameObjects.Text => {
    const title = addText(scene, DESIGN_WIDTH / 2, BAR_HEIGHT + MARGIN, heading, {
      fontFamily: UI_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: TITLE_INK,
    })
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
    const height = Math.round(BROWSE_WIDTH * 1.4);
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

    const placed = cards.map((card, index): Placed => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * BROWSE_WIDTH + (inRow - 1) * BROWSE_GAP;
      const x =
        (DESIGN_WIDTH - spanX) / 2 + column * (BROWSE_WIDTH + BROWSE_GAP) + BROWSE_WIDTH / 2;
      const y = firstY + row * (height + BROWSE_GAP) + height;
      const face = createCardFace(scene, card.id, NO_REFUSAL, { width: BROWSE_WIDTH });
      root.add(
        face.root
          .setPosition(x, y)
          .setName(`${name}-card-${index}`)
          .setData({ at: card.at, card: card.id }),
      );
      return { ...card, x, y, face };
    });
    shown.push(frame, root);

    grid = { root, placed, height, overflow };
    scrollTo(offset);
    clip.show(root, MARGIN, top, DESIGN_WIDTH - 2 * MARGIN, frameHeight);
  };

  /** The one card of a browse ringed, and none ringed at all where nothing is selected. */
  const ring = (browsing: Browsing, at: number | undefined): void => {
    browsing.selected = at;
    for (const card of grid?.placed ?? []) card.face.select(card.at === at);
  };

  /** A browse raised, and raised again where the back from a card shown large brings it. */
  const showBrowse = (browsing: Browsing): void => {
    wipe();
    cover();
    carried = browsing;

    const title = raiseTitle(text(`browse.${browsing.pile}`, { count: browsing.cards.length }));
    layGrid(
      'browse',
      browsing.cards.map((id, at): Offered => ({ id, at })),
      title.y + title.height + MARGIN,
      (at, press) => {
        switch (press) {
          case 'left':
            if (at === undefined) back();
            else ring(browsing, at);
            return;
          case 'right':
            if (at !== undefined) showInspection(browsing.cards[at], NO_REFUSAL, browsing);
            return;
        }
      },
    );
    ring(browsing, browsing.selected);
  };

  /** The aim window raised, and raised again where the back from a card shown large brings it. */
  const showAim = (aim: Aiming): void => {
    wipe();
    cover();
    const raised: AimWindow = { stands: 'aim-window', aim };
    carried = raised;

    const title = raiseTitle(text('browse.discard-pile', { count: aim.cards.length }));
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
          if (card !== undefined) showInspection(card.id, NO_REFUSAL, raised);
          return;
        }
      }
    });
  };

  /** A browse or the aim window raised again, as the card it was showing large is put back. */
  const raise = (what: Under): void => {
    switch (what.stands) {
      case 'browse':
        showBrowse(what);
        return;
      case 'aim-window':
        showAim(what.aim);
        return;
    }
  };

  /** The city fallen, on the screen that says so; the caller decides whether it rises or stands. */
  const showDefeat = (defeat: Defeat): Phaser.GameObjects.Container => {
    wipe();
    cover();
    carried = { stands: 'defeat' };
    fallen = defeat;

    const title = addText(scene, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 12, text('defeat.title'), {
      fontFamily: UI_FONT,
      fontSize: '72px',
      fontStyle: 'bold',
      color: TITLE_INK,
    }).setOrigin(0.5, 1);
    const cause = addText(
      scene,
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2 + 12,
      text(`defeat.${defeat.cause}`, { turn: defeat.turn }),
      { fontFamily: UI_FONT, fontSize: '22px', color: TITLE_INK },
    ).setOrigin(0.5, 0);

    const screen = scene.add
      .container(0, 0, [title, cause])
      .setDepth(SCRIM_DEPTH + 1)
      .setName('defeat');
    shown.push(screen);
    return screen;
  };

  /** The fall as it lands: the scrim and the screen rise together, out of nothing and a little low. */
  const raiseDefeat = (defeat: Defeat): Promise<void> => {
    const screen = showDefeat(defeat).setAlpha(0).setY(12);
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

  /** The menu gone: back to the chronicle screen, or onto the defeat screen that stood under it. */
  const shut = (): void => {
    if (fallen === undefined) close();
    else showDefeat(fallen);
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
      case 'inspection': {
        const over = carried.over;
        if (over === undefined) close();
        else raise(over);
        return true;
      }
      case 'browse':
        if (carried.selected === undefined) close();
        else ring(carried, undefined);
        return true;
      case 'aim-window':
        closeAim();
        return true;
      case 'defeat':
        return false;
    }
  };

  onClick(scrim, () => {
    back();
  });

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
        cards: cardsOf(pile, chronicle),
        selected: undefined,
      });
    },
    aimDiscardPile(chronicle, chosen, closed): () => void {
      offset = 0;
      showAim({
        cards: chronicle.discardPile.map((id, at): Offered => ({ id, at })).reverse(),
        chosen,
        closed,
      });
      return closeAim;
    },
    inspect(id: CardId, refusal: Refusal): void {
      showInspection(id, refusal, undefined);
    },
    inspectSelection(): void {
      const browsing = browseStanding(carried);
      const at = browsing?.selected;
      if (browsing === undefined || at === undefined) return;
      showInspection(browsing.cards[at], NO_REFUSAL, browsing);
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
      if (chronicle.defeat !== undefined && fallen === undefined)
        void raiseDefeat(chronicle.defeat);
      else stand();
    },
    play(stage: Stage): Promise<void> | undefined {
      if (stage.chronicle.defeat === undefined || fallen !== undefined) return undefined;
      return raiseDefeat(stage.chronicle.defeat);
    },
  };
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
function cardsOf(pile: PileKind, chronicle: Chronicle): readonly CardId[] {
  if (pile === 'discard-pile') return [...chronicle.discardPile].reverse();
  return [...chronicle.drawPile].sort(
    (a, b) =>
      CARD_KINDS.indexOf(CARDS[a].kind) - CARD_KINDS.indexOf(CARDS[b].kind) ||
      text(`card.${a}`).localeCompare(text(`card.${b}`)),
  );
}
