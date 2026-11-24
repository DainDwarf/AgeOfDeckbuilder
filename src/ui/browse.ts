import Phaser from 'phaser';
import { type Campaign, civilizationIn } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import type { Refusal } from '../rules/state';
import { type Bind, boundTo } from './bindings';
import { createFootBubble } from './card-face';
import { ended, stopMotion } from './card-motion';
import { createRibbon, WINDOW_TITLE } from './chrome';
import { browseOf } from './collection-layout';
import { type Cell, linesOf, type StackedCards, spanOf, stackedCardsOf } from './collection-stack';
import { cityEdgeOf } from './deck-panel';
import {
  BAR_HEIGHT,
  type Box,
  createScrim,
  DESIGN_WIDTH,
  MARGIN,
  offMiddle,
  onResize,
  placedWhileUp,
  screenSize,
} from './design-space';
import { cardFaceAtStart, type Face, type SignsRead, UNSIGNED } from './face';
import type { OverlayScene } from './overlay-scene';
import { createPanel, type Panel, type PanelOf, type Surface } from './panel';
import { createCount, onCount } from './piles';
import {
  type Inspecting,
  layingOf,
  type Reactions,
  reactionsOf,
  type ShownLarge,
  standLarge,
} from './stack';
import { cardName, civilizationName, text } from './text';
import { createTooltip, type Tooltip } from './tooltip';

const CIVILIZATION_BROWSE = 'civilization-browse';

const ACROSS = 8;

/** How tall the ribbon a window on the scrim is titled on stands. */
export const WINDOW_RIBBON = 46;

/**
 * How far a stack's count's right edge stands past its front card's right edge, and its middle under
 * the card's bottom edge.
 */
const COPIES_PAST = 10;
const COPIES_UNDER = 4;

/**
 * One stack of a browse: the face its front card shows, the copies its count reads, and whether a
 * pale edge stands around it.
 */
export type BrowseStack = {
  readonly shown: Face;
  readonly copies: number;
  readonly edged: boolean;
};

/**
 * A stack laid with its count: its cards, the container holding them and the count, the box they
 * cover, whether they lie under a point of the surface, and what it reacts to the pointer with.
 */
export type CountedStack = {
  readonly stacked: StackedCards;
  readonly root: Phaser.GameObjects.Container;
  readonly box: Box;
  liesUnder(x: number, y: number): boolean;
  readonly reactions: Reactions;
};

/**
 * A stack of the face's copies from the left and the top, in a container named `holder`, drawn refused
 * as named, its front card named `name` and its count `<name>-copies` under that card's bottom right
 * corner: the right click anywhere on it off a name shows its card large.
 */
export function countedStackOf(
  { scene, inspecting }: { readonly scene: Phaser.Scene; readonly inspecting: Inspecting },
  of: {
    readonly shown: Face;
    readonly copies: number;
    readonly left: number;
    readonly top: number;
    readonly name: string;
    readonly holder: string;
    readonly refusal?: Refusal;
  },
): CountedStack {
  const stacked = stackedCardsOf(scene, of);
  const { face, box } = stacked;
  const count = createCount(scene, `${of.name}-copies`);
  count.number.setText(text('collection.row-copies', { copies: of.copies }));
  const counted = count.layAt(
    face.x + face.width + COPIES_PAST,
    face.y + face.height + COPIES_UNDER,
  );
  const root = scene.add
    .container(0, 0, [...stacked.unders, stacked.card.root, count.chip, count.number])
    .setName(of.holder);
  return {
    stacked,
    root,
    box: Phaser.Geom.Rectangle.Union(
      new Phaser.Geom.Rectangle(box.x, box.y, box.width, box.height),
      new Phaser.Geom.Rectangle(counted.x, counted.y, counted.width, counted.height),
    ),
    liesUnder: (x, y) => {
      const local = root.getLocalPoint(x, y);
      return stacked.liesUnder(x, y) || onCount(counted, local.x, local.y);
    },
    reactions: reactionsOf(stacked.card, stacked.shown, inspecting),
  };
}

/** The stack in the `name` browse's `at`th place, its copies on its count. */
function stackCellOf(
  browser: Browser,
  name: string,
  { stack, at }: { readonly stack: BrowseStack; readonly at: number },
): Cell {
  const { scene } = browser;
  return ({ left, top }) => {
    const { stacked, root, box, liesUnder, reactions } = countedStackOf(browser, {
      shown: stack.shown,
      copies: stack.copies,
      left,
      top,
      name: `${name}-card-${at}`,
      holder: `${name}-stack-${at}`,
    });
    if (stack.edged) root.addAt(cityEdgeOf(scene, stacked.face), 0);
    return {
      parts: [root],
      held: [{ box, liesUnder, reactions }],
      bottom: Math.max(stacked.foot, box.y + box.height),
    };
  };
}

/** A browse's name, its title, and its stacks in the order they stand. */
export type BrowseOf = {
  readonly name: string;
  readonly heading: string;
  readonly stacks: readonly BrowseStack[];
};

/** What a screen hands the browser it stands on the overlay. */
export type OnScrim = {
  /** Told the screen is covered from the first thing to rise on the overlay to the last to go. */
  readonly covering: (covered: boolean) => void;
  /** Whether it takes a key or a mouse key pressed while anything stands and no card stands large. */
  readonly takes: (press: Bind) => boolean;
  /** A press on the scrim, or beside what a panel on it holds. */
  readonly back: () => void;
  /** What the screen raised on the scrim beyond the browser's, taken down with what stands. */
  readonly down?: () => void;
  /** A card about to rise large over what stands. */
  readonly risingLarge?: () => void;
};

/** How long the scrim takes to fade in from nothing, and on what ease. */
type Fade = { readonly duration: number; readonly ease: string };

/**
 * The kit a screen stands on the overlay: the scrim and what stands on it, one panel among it, the
 * small cards and the kind bubble its faces raise, and the cards shown large over it; no carrier.
 */
export type Browser = Surface & {
  readonly inspecting: Inspecting;
  readonly large: ShownLarge;
  /** The one bubble every hover on the scrim raises. */
  readonly tooltip: Tooltip;
  /**
   * What stands taken down, and the scrim up for what is raised next: whole, or fading in from
   * nothing over `fade`, settling once it is whole however the fade ended.
   */
  raise(fade?: Fade): Promise<void>;
  /** The scrim whole, a fade in flight cut short. */
  standWhole(): void;
  /** One thing raised on the scrim, which goes with what stands. */
  carries<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>(
    object: T,
  ): T;
  /**
   * A window's title on the kit's ribbon raised on the scrim, named after the window: its words, and
   * the ribbon stood centred across the screen, its middle that far under the screen's top, answering
   * its foot and the box it is painted on as the screen stands at each asking.
   */
  raiseTitle(
    name: string,
    heading: string,
  ): {
    readonly title: Phaser.GameObjects.Text;
    standAt(middle: number): { readonly foot: number; readonly ribbon: () => Box };
  };
  /**
   * The panel laid on the scrim from `top` to the screen's foot, which goes with what stands: what it
   * holds is laid about the middle of 1280 units, the wheel and the two pan keys scroll it, a card
   * rising large holds it still, and a press beside what it holds steps back.
   */
  lay(of: Omit<PanelOf, 'beside' | 'frame'> & { readonly top: number }): Panel;
  /** A browse raised under its title, its stacks eight to a line from the frame's top left. */
  browse(of: BrowseOf): void;
  /** What stands taken down, and the scrim with it. */
  close(): void;
  /**
   * What stands kept hidden as it stands, out of what a raise or a close takes down, and the scrim
   * down with what the screen raised beside it, as at a close.
   */
  setAside(): SetAside;
};

/** What stood on the scrim, kept hidden as it stood. */
export type SetAside = {
  /** What stands taken down, the scrim up, and what was set aside standing on it again as it stood. */
  standAgain(): void;
};

/** The browser of a screen, on the overlay, a unit named wearing its sign as `signs` answers. */
export function standBrowser(
  overlay: OverlayScene,
  catalogue: Catalogue,
  signs: SignsRead,
  screen: OnScrim,
): Browser {
  const on = overlay.strata.scrim;
  const scrim = createScrim(overlay, () => {
    screen.back();
  });
  on.layer.add(scrim);
  const tooltip = createTooltip(overlay, overlay.strata.tooltip);
  const footBubble = createFootBubble(tooltip);
  /** Whether the scrim stands, from the raise to the close. */
  let up = false;
  let panel: Panel | undefined;
  /** Where the panel's frame starts down the screen. */
  let panelTop = 0;
  let shown: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible)[] = [];

  /** The panel's frame from its top to the screen's foot, a margin in from every edge. */
  const panelFrame = (): Box => {
    const { width, height } = screenSize();
    return {
      x: MARGIN,
      y: panelTop,
      width: width - 2 * MARGIN,
      height: height - MARGIN - panelTop,
    };
  };
  onResize(overlay, () => {
    panel?.place(panelFrame(), offMiddle().x);
  });

  // The overlay holds one taker and this is it: whatever stands hears a key only through `takes`.
  const large = standLarge(overlay, catalogue, signs, screen.covering, {
    footBubble,
    get standing() {
      return up;
    },
    takes: (press) => screen.takes(press),
  });
  const { inspecting } = layingOf(overlay, catalogue, signs, {
    on,
    smallOn: overlay.strata.smallCard,
    footBubble,
    large,
    rising: () => {
      panel?.holdStill();
      screen.risingLarge?.();
    },
  });
  const follow = (): void => {
    inspecting.small.follow();
    tooltip.follow();
  };

  /** The small cards, the cards shown large and what the screen raised beside what stands taken down. */
  const downAround = (): void => {
    inspecting.small.down();
    large.down();
    screen.down?.();
  };

  /** What stands taken down, the cards shown large among it, the scrim itself left as it is. */
  const wipe = (): void => {
    downAround();
    panel?.down();
    panel = undefined;
    for (const object of shown) object.destroy();
    shown = [];
  };

  /** The scrim down, and the screen told it is no longer covered. */
  const lower = (): void => {
    up = false;
    scrim.setVisible(false);
    screen.covering(false);
  };

  overlay.scrolls({
    pan(way, delta) {
      if (!large.standing) panel?.pan(way, delta);
    },
    wheel(by) {
      if (!large.standing) panel?.wheel(by);
    },
  });

  const browser: Browser = {
    scene: overlay,
    on,
    follow,
    inspecting,
    large,
    tooltip,
    raise(fade) {
      // Ahead of the wipe: a card shown large over nothing then comes down without uncovering the screen.
      up = true;
      wipe();
      stopMotion(overlay, scrim);
      scrim.setAlpha(fade === undefined ? 1 : 0).setVisible(true);
      screen.covering(true);
      if (fade === undefined) return Promise.resolve();
      return ended(overlay.tweens.add({ targets: scrim, alpha: 1, ...fade }));
    },
    standWhole() {
      stopMotion(overlay, scrim);
      scrim.setAlpha(1);
    },
    carries(object) {
      on.layer.add(object);
      shown.push(object);
      return object;
    },
    raiseTitle(name, heading) {
      const titling = createRibbon(overlay, heading, WINDOW_TITLE, WINDOW_RIBBON, name);
      browser.carries(titling.ribbon);
      browser.carries(titling.title);
      return {
        title: titling.title,
        standAt(middle) {
          const across = (): number => screenSize().width / 2;
          placedWhileUp(titling.title, () => {
            titling.place(across(), middle);
          });
          return {
            foot: middle + WINDOW_RIBBON / 2,
            ribbon: () => titling.boxAt(across(), middle),
          };
        },
      };
    },
    lay({ top, ...of }) {
      panelTop = top;
      const laid = createPanel(browser, {
        ...of,
        frame: panelFrame(),
        beside: () => {
          screen.back();
        },
      });
      laid.place(panelFrame(), offMiddle().x);
      panel = laid;
      return laid;
    },
    browse({ name, heading, stacks }) {
      void browser.raise();
      const { title, standAt } = browser.raiseTitle(name, heading);
      const titleTop = BAR_HEIGHT + MARGIN;
      standAt(titleTop + title.height / 2);
      const top = titleTop + title.height + MARGIN;
      const cells = stacks.map((stack, at) => stackCellOf(browser, name, { stack, at }));
      browser.lay({
        name,
        top,
        ...linesOf(cells, { left: (DESIGN_WIDTH - spanOf(ACROSS)) / 2, top, across: ACROSS }),
      });
    },
    close() {
      wipe();
      lower();
    },
    setAside() {
      downAround();
      const kept = { things: shown, panel, top: panelTop };
      for (const object of kept.things) object.setVisible(false);
      kept.panel?.show(false);
      shown = [];
      panel = undefined;
      lower();
      return {
        standAgain() {
          void browser.raise();
          shown = kept.things;
          for (const object of shown) object.setVisible(true);
          panel = kept.panel;
          panelTop = kept.top;
          panel?.place(panelFrame(), offMiddle().x);
          panel?.show(true);
        },
      };
    },
  };
  return browser;
}

/** A screen of the meta's cards shown large, and the browse of its civilizations they stand over. */
export type Browsing = {
  readonly large: ShownLarge;
  /** The browse of the campaign's civilization of that name raised. */
  open(campaign: Campaign, civilization: string): void;
};

/**
 * The cards shown large of a screen of the meta, and under them the browse of a civilization, on the
 * overlay: `covering` is told the screen is covered from the first of them to rise to the last to go.
 */
export function standBrowse(
  overlay: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
): Browsing {
  const browser = standBrowser(overlay, catalogue, UNSIGNED, {
    covering,
    takes(press) {
      if (boundTo(press, 'back')) browser.close();
      return true;
    },
    back() {
      browser.close();
    },
  });

  return {
    large: browser.large,
    open(campaign, civilization) {
      const { count, stacks } = browseOf(catalogue, campaign, civilization, cardName);
      const { building } = civilizationIn(catalogue, campaign, civilization).city;
      browser.browse({
        name: CIVILIZATION_BROWSE,
        heading: text('browse.civilization', {
          civilization: civilizationName(civilization),
          count,
        }),
        stacks: stacks.map(({ id, copies }, at) => ({
          shown: cardFaceAtStart(catalogue, id, building),
          copies,
          edged: at === 0,
        })),
      });
    },
  };
}
