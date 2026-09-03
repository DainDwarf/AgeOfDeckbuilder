import Phaser from 'phaser';
import { CARD_KINDS, CARDS, type CardId } from '../rules/cards';
import {
  type Chronicle,
  type Defeat,
  NO_REFUSAL,
  type Refusal,
  type Stage,
} from '../rules/chronicle';
import { createCardFace } from './card-face';
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
import { behind, createWindow, type MenuWindow } from './menu';
import { BAR_HEIGHT } from './resource-bar';
import { text } from './text';

const SCRIM = 0x0d1014;
const SCRIM_ALPHA = 0.82;

const TITLE_INK = '#d4d7db';
const BROWSE_WIDTH = 180;
const BROWSE_GAP = 26;
const ZOOM_WIDTH = 380;

/** The pointer's travel over these last milliseconds is the speed a release flings the grid at. */
const FLING_WINDOW = 80;

/** What is left of a fling's speed after a millisecond, and the speed it is dropped at. */
const FLING_DECAY = 0.994;
const FLING_STILL = 0.01;

export type PileKind = 'draw-pile' | 'discard-pile';

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  zoom(id: CardId, refusal: Refusal): void;
  /** The Menu button: raises the menu over whatever stands, and takes the whole menu back down. */
  menu(): void;
  /** Takes what stands on the scrim back one step, and answers whether anything stood. */
  back(): boolean;
  /** Raises the defeat screen once the chronicle has ended, and nothing while it runs. */
  render(chronicle: Chronicle): void;
  play(stage: Stage): Promise<void> | undefined;
};

/** Where one card of a browse was laid out: about its own bottom centre, as a card is drawn. */
type Placed = { readonly id: CardId; readonly x: number; readonly y: number };

/** The grid of cards a browse stands on, and how far it moves. */
type Grid = {
  readonly root: Phaser.GameObjects.Container;
  readonly placed: readonly Placed[];
  readonly height: number;
  /** The furthest the cards scroll; zero when they all fit inside the frame. */
  readonly overflow: number;
};

/** Where a drag of the grid was pressed, what the grid stood at, and where the pointer has been. */
type Scroll = {
  readonly y: number;
  readonly from: number;
  readonly trail: { time: number; y: number }[];
};

/**
 * The scrim and what stands on it: a pile's cards laid out, one card large, a window of the menu,
 * or the defeat screen. The scrim swallows every pointer beneath it, so the table is inert while
 * any of them is open, and only the menu comes up over the defeat screen — the city that fell is
 * left behind by a new chronicle alone. `covering` is told as the scrim goes up and comes down, for
 * whatever it cannot swallow: the wheel and the keyboard reach past it.
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
  let browsing: { pile: PileKind; cards: readonly CardId[] } | undefined;
  let grid: Grid | undefined;
  /** How far the grid is scrolled, kept while a card taken off it is zoomed. */
  let offset = 0;
  let fling = 0;
  let scrolling: Scroll | undefined;
  let zoomed = false;
  /** The window of the menu that stands, and nothing while none does. */
  let opened: MenuWindow | undefined;
  /** The fall the defeat screen was raised on, kept so the menu can close back onto it. */
  let fallen: Defeat | undefined;
  /** The defeat screen still coming up; a render owns the rise and takes it down. */
  let rising: Phaser.GameObjects.Container | undefined;

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
    browsing = undefined;
    zoomed = false;
    opened = undefined;
    scrim.setVisible(false).disableInteractive();
    covering(false);
  };

  // The defeat's rise brings the scrim up from nothing, so every cover states the alpha it wants.
  const cover = (): void => {
    stopMotion(scene, scrim);
    scrim.setVisible(true).setAlpha(SCRIM_ALPHA).setInteractive();
    covering(true);
  };

  const showZoom = (id: CardId, refusal: Refusal): void => {
    wipe();
    cover();
    zoomed = true;
    opened = undefined;
    const { root } = createCardFace(scene, id, refusal, { width: ZOOM_WIDTH });
    root
      .setName('zoom')
      .setPosition(DESIGN_WIDTH / 2, (DESIGN_HEIGHT + Math.round(ZOOM_WIDTH * 1.4)) / 2)
      .setDepth(SCRIM_DEPTH + 1);
    shown.push(root);
  };

  /** Moves the grid, never past either end of its cards. */
  const scrollTo = (to: number): void => {
    if (grid === undefined) return;
    offset = Math.min(Math.max(to, 0), grid.overflow);
    grid.root.setY(-offset);
  };

  const showBrowse = (pile: PileKind, cards: readonly CardId[]): void => {
    wipe();
    cover();
    browsing = { pile, cards };
    zoomed = false;
    opened = undefined;

    const title = addText(
      scene,
      DESIGN_WIDTH / 2,
      BAR_HEIGHT + MARGIN,
      text(`browse.${pile}`, { count: cards.length }),
      { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: TITLE_INK },
    )
      .setOrigin(0.5, 0)
      .setDepth(SCRIM_DEPTH + 1);
    shown.push(title);

    const height = Math.round(BROWSE_WIDTH * 1.4);
    const top = title.y + title.height + MARGIN;
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
      .setName('browse-frame')
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
      if (grid === undefined) return;
      const at = on.at(pointer.x, pointer.y);
      const card = cardAt(grid, at.x, at.y);
      if (card === undefined) back();
      else showZoom(card, NO_REFUSAL);
    });

    const placed = cards.map((id, index): Placed => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * BROWSE_WIDTH + (inRow - 1) * BROWSE_GAP;
      return {
        id,
        x: (DESIGN_WIDTH - spanX) / 2 + column * (BROWSE_WIDTH + BROWSE_GAP) + BROWSE_WIDTH / 2,
        y: firstY + row * (height + BROWSE_GAP) + height,
      };
    });

    const root = scene.add
      .container(0, 0)
      .setName('browse')
      .setDepth(SCRIM_DEPTH + 1)
      .setData('overflow', overflow);
    for (const card of placed) {
      const face = createCardFace(scene, card.id, NO_REFUSAL, { width: BROWSE_WIDTH });
      root.add(face.root.setPosition(card.x, card.y));
    }
    shown.push(frame, root);

    grid = { root, placed, height, overflow };
    scrollTo(offset);
    clip.show(root, MARGIN, top, DESIGN_WIDTH - 2 * MARGIN, frameHeight);
  };

  /** The city fallen, on the screen that says so; the caller decides whether it rises or stands. */
  const showDefeat = (defeat: Defeat): Phaser.GameObjects.Container => {
    wipe();
    cover();
    browsing = undefined;
    zoomed = false;
    opened = undefined;
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
    browsing = undefined;
    zoomed = false;
    opened = which;
    shown.push(
      createWindow(scene, which, (press) => {
        if (press === 'new-chronicle') newChronicle();
        else showWindow(press);
      }).setDepth(SCRIM_DEPTH + 1),
    );
  };

  /** The menu gone: back to the table, or back onto the screen of the city that fell under it. */
  const shut = (): void => {
    if (fallen === undefined) close();
    else showDefeat(fallen);
  };

  const back = (): boolean => {
    if (opened !== undefined) {
      const step = behind(opened);
      if (step === undefined) shut();
      else showWindow(step);
      return true;
    }
    if (fallen !== undefined || !scrim.visible) return false;
    if (zoomed && browsing !== undefined) showBrowse(browsing.pile, browsing.cards);
    else close();
    return true;
  };

  onClick(scrim, back);

  scene.input.on(
    'wheel',
    (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (grid === undefined) return;
      fling = 0;
      scrollTo(offset + dy);
    },
  );

  whileUp(scene, Phaser.Scenes.Events.UPDATE, (_time: number, delta: number) => {
    if (fling === 0 || grid === undefined) return;
    const to = offset + fling * delta;
    scrollTo(to);
    fling = to === offset && Math.abs(fling) > FLING_STILL ? fling * FLING_DECAY ** delta : 0;
  });

  return {
    browse(pile: PileKind, chronicle: Chronicle): void {
      offset = 0;
      showBrowse(pile, cardsOf(pile, chronicle));
    },
    zoom: showZoom,
    menu(): void {
      if (opened === undefined) showWindow('menu');
      else shut();
    },
    back,
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
function cardAt(grid: Grid, x: number, y: number): CardId | undefined {
  const local = y - grid.root.y;
  return grid.placed.find(
    (card) =>
      Math.abs(x - card.x) <= BROWSE_WIDTH / 2 && local <= card.y && local >= card.y - grid.height,
  )?.id;
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
