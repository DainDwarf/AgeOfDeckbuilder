import Phaser from 'phaser';
import type { Campaign } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { type Bind, boundTo } from './bindings';
import { CARD_WIDTH, createKindBubble, metricsOf } from './card-face';
import { stopMotion } from './card-motion';
import { browseOf } from './collection-layout';
import { type Cell, linesOf, spanOf, stackedCardsOf } from './collection-stack';
import { cityEdgeOf } from './deck-panel';
import {
  addText,
  type Box,
  createScrim,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  headingOf,
  MARGIN,
  ownBoxOf,
  UI_FONT,
} from './design-space';
import { cardFaceAtStart, type Face } from './face';
import { css, LOOK } from './look';
import type { OverlayScene } from './overlay-scene';
import { createPanel, type Panel, type PanelOf, type Surface } from './panel';
import { answersAround, type Inspecting, layingOf, type ShownLarge, standLarge } from './stack';
import { cardName, civilizationName, text } from './text';
import { createTooltip } from './tooltip';

const CIVILIZATION_BROWSE = 'civilization-browse';

const ACROSS = 8;

const BADGE_HEIGHT = 22;
const BADGE_LEAST = 30;
const BADGE_PAD = 6;
/** How far a badge's bottom right corner stands out past its face's, right and down. */
const BADGE_OUT = 6;

const BADGE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};

/**
 * One stack of a browse: the face its front card shows, the copies its badge reads, and whether a
 * pale edge stands around it.
 */
export type BrowseStack = {
  readonly shown: Face;
  readonly copies: number;
  readonly edged: boolean;
};

/**
 * The badge reading the copies, named `name`, its bottom right corner at the point handed, as wide
 * as its count needs and never narrower than its least: it widens leftwards.
 */
function badgeOf(
  scene: Phaser.Scene,
  { right, bottom }: { readonly right: number; readonly bottom: number },
  copies: number,
  name: string,
): { parts: Phaser.GameObjects.GameObject[]; box: Box } {
  const count = addText(scene, 0, 0, text('collection.row-copies', { copies }), BADGE_STYLE)
    .setOrigin(0.5)
    .setName(name);
  const width = Math.max(BADGE_LEAST, ownBoxOf(count).width + 2 * BADGE_PAD);
  const box = { x: right - width, y: bottom - BADGE_HEIGHT, width, height: BADGE_HEIGHT };
  const radius = BADGE_HEIGHT / 2;
  const ground = scene.add
    .graphics()
    .fillStyle(LOOK.cardBack)
    .fillRoundedRect(box.x, box.y, width, BADGE_HEIGHT, radius)
    .lineStyle(1, LOOK.cardEdge)
    .strokeRoundedRect(box.x + 0.5, box.y + 0.5, width - 1, BADGE_HEIGHT - 1, radius - 0.5);
  count.setPosition(box.x + width / 2, box.y + BADGE_HEIGHT / 2);
  return { parts: [ground, count], box };
}

/**
 * The stack in the `name` browse's `at`th place, its copies on its badge: the right click anywhere on
 * it off a name shows its card large.
 */
function stackCellOf(
  { scene, inspecting }: Browser,
  name: string,
  { stack, at }: { readonly stack: BrowseStack; readonly at: number },
): Cell {
  return ({ left, top }) => {
    const card = `${name}-card-${at}`;
    const stacked = stackedCardsOf(scene, {
      shown: stack.shown,
      copies: stack.copies,
      left,
      top,
      width: CARD_WIDTH,
      name: card,
    });
    const { face, box } = stacked;
    const badge = badgeOf(
      scene,
      { right: face.x + face.width + BADGE_OUT, bottom: face.y + face.height + BADGE_OUT },
      stack.copies,
      `${card}-copies`,
    );
    const edge = stack.edged ? [cityEdgeOf(scene, face, metricsOf(CARD_WIDTH).radius)] : [];
    const root = scene.add
      .container(0, 0, [...edge, ...stacked.unders, stacked.card.root, ...badge.parts])
      .setName(`${name}-stack-${at}`);
    return {
      parts: [root],
      held: [
        {
          box: Phaser.Geom.Rectangle.Union(
            new Phaser.Geom.Rectangle(box.x, box.y, box.width, box.height),
            new Phaser.Geom.Rectangle(badge.box.x, badge.box.y, badge.box.width, badge.box.height),
          ),
          answers: answersAround(stacked.card, stacked.shown, inspecting, () => {
            inspecting.large.show(stacked.shown);
          }),
        },
      ],
      bottom: stacked.foot,
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

/**
 * The kit a screen stands on the overlay: the scrim and what stands on it, one panel among it, the
 * small cards and the kind bubble its faces raise, and the cards shown large over it; no carrier.
 */
export type Browser = Surface & {
  readonly inspecting: Inspecting;
  readonly scrim: Phaser.GameObjects.Rectangle;
  readonly large: ShownLarge;
  /** What stands taken down, and the scrim up for what is raised next. */
  raise(): void;
  /** One thing raised on the scrim, which goes with what stands. */
  carries<T extends Phaser.GameObjects.GameObject>(object: T): T;
  /**
   * The panel laid on the scrim, which goes with what stands: the wheel and the two keys that pan up
   * and down scroll it, a card rising large holds it still, and a press beside what it holds steps back.
   */
  lay(of: Omit<PanelOf, 'beside'>): Panel;
  /** A browse raised under its title, its stacks eight to a line from the frame's top left. */
  browse(of: BrowseOf): void;
  /** What stands taken down, and the scrim with it. */
  close(): void;
};

/** The browser of a screen, on the overlay. */
export function standBrowser(
  overlay: OverlayScene,
  catalogue: Catalogue,
  screen: OnScrim,
): Browser {
  const on = overlay.strata.scrim;
  const scrim = createScrim(overlay, () => {
    screen.back();
  });
  on.layer.add(scrim);
  const tooltip = createTooltip(overlay, overlay.strata.tooltip);
  const kinds = createKindBubble(tooltip);
  /** Whether the scrim stands, from the raise to the close. */
  let up = false;
  let panel: Panel | undefined;
  let shown: Phaser.GameObjects.GameObject[] = [];

  // The overlay holds one taker and this is it: whatever stands hears a key only through `takes`.
  const large = standLarge(overlay, catalogue, screen.covering, {
    kinds,
    get standing() {
      return up;
    },
    takes: (press) => screen.takes(press),
  });
  const { inspecting } = layingOf(overlay, catalogue, {
    on,
    smallOn: overlay.strata.smallCard,
    kinds,
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

  /** What stands taken down, the cards shown large among it, the scrim itself left as it is. */
  const wipe = (): void => {
    inspecting.small.down();
    large.down();
    panel?.down();
    panel = undefined;
    for (const object of shown) object.destroy();
    shown = [];
    screen.down?.();
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
    scrim,
    large,
    raise() {
      // Ahead of the wipe: a card shown large over nothing then comes down without uncovering the screen.
      up = true;
      wipe();
      // A screen may fade the scrim in from nothing, so every raise stands it whole.
      stopMotion(overlay, scrim);
      scrim.setAlpha(1).setVisible(true);
      screen.covering(true);
    },
    carries(object) {
      on.layer.add(object);
      shown.push(object);
      return object;
    },
    lay(of) {
      panel = createPanel(browser, {
        ...of,
        beside: () => {
          screen.back();
        },
      });
      return panel;
    },
    browse({ name, heading, stacks }) {
      browser.raise();
      const title = browser.carries(headingOf(overlay, name, heading));
      const top = title.y + title.height + MARGIN;
      const cells = stacks.map((stack, at) => stackCellOf(browser, name, { stack, at }));
      browser.lay({
        name,
        frame: {
          x: MARGIN,
          y: top,
          width: DESIGN_WIDTH - 2 * MARGIN,
          height: DESIGN_HEIGHT - MARGIN - top,
        },
        ...linesOf(cells, {
          left: (DESIGN_WIDTH - spanOf(ACROSS, CARD_WIDTH)) / 2,
          top,
          across: ACROSS,
          card: CARD_WIDTH,
        }),
      });
    },
    close() {
      wipe();
      up = false;
      scrim.setVisible(false);
      screen.covering(false);
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
  const browser = standBrowser(overlay, catalogue, {
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
      browser.browse({
        name: CIVILIZATION_BROWSE,
        heading: text('browse.civilization', {
          civilization: civilizationName(civilization),
          count,
        }),
        stacks: stacks.map(({ id, copies }, at) => ({
          shown: cardFaceAtStart(catalogue, id),
          copies,
          edged: at === 0,
        })),
      });
    },
  };
}
