import Phaser from 'phaser';
import type { Campaign } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { boundTo } from './bindings';
import { CARD_WIDTH, createKindBubble, metricsOf } from './card-face';
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
import { type Carrier, createCarrier, createPanel, type Panel } from './panel';
import { createSmallCards } from './small-card';
import { answersAround, type Inspecting, type ShownLarge, standLarge } from './stack';
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
  scene: Phaser.Scene,
  name: string,
  { stack, at }: { readonly stack: BrowseStack; readonly at: number },
  inspecting: Inspecting,
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

/**
 * A browse named `name` on the stratum its faces answer on, under its title: its stacks eight to a
 * line from the frame's top left, scrolled as a panel is, and a press of either button beside them
 * running `beside`. Answers its title and its panel, which the caller hands the wheel and takes down.
 */
export function layBrowse(
  overlay: OverlayScene,
  {
    name,
    heading,
    stacks,
  }: {
    readonly name: string;
    readonly heading: string;
    readonly stacks: readonly BrowseStack[];
  },
  inspecting: Inspecting,
  {
    beside,
    follow,
    carrier,
  }: {
    readonly beside: () => void;
    readonly follow: () => void;
    readonly carrier: Carrier;
  },
): { readonly title: Phaser.GameObjects.Text; readonly panel: Panel } {
  const { on } = inspecting;
  const title = headingOf(overlay, name, heading);
  on.layer.add(title);
  const top = title.y + title.height + MARGIN;
  const cells = stacks.map((stack, at) => stackCellOf(overlay, name, { stack, at }, inspecting));
  const panel = createPanel(
    overlay,
    on,
    {
      name,
      frame: {
        x: MARGIN,
        y: top,
        width: DESIGN_WIDTH - 2 * MARGIN,
        height: DESIGN_HEIGHT - MARGIN - top,
      },
      beside,
      ...linesOf(cells, {
        left: (DESIGN_WIDTH - spanOf(ACROSS, CARD_WIDTH)) / 2,
        top,
        across: ACROSS,
        card: CARD_WIDTH,
      }),
    },
    follow,
    carrier,
  );
  return { title, panel };
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
  const on = overlay.strata.scrim;
  const scrim = createScrim(overlay, () => close());
  on.layer.add(scrim);
  const tooltip = createTooltip(overlay, overlay.strata.tooltip);
  const kinds = createKindBubble(tooltip);
  let standing: { readonly title: Phaser.GameObjects.Text; readonly panel: Panel } | undefined;

  const close = (): void => {
    if (standing === undefined) return;
    small.down();
    standing.panel.down();
    standing.title.destroy();
    standing = undefined;
    scrim.setVisible(false);
    covering(false);
  };

  const large = standLarge(overlay, catalogue, covering, {
    kinds,
    get standing() {
      return standing !== undefined;
    },
    takes(press) {
      if (boundTo(press, 'back')) close();
      return true;
    },
  });
  overlay.scrolls({
    pan(way, delta) {
      if (!large.standing) standing?.panel.pan(way, delta);
    },
    wheel(by) {
      if (!large.standing) standing?.panel.wheel(by);
    },
  });
  const small = createSmallCards(overlay, overlay.strata.smallCard, catalogue, kinds, (name) => {
    inspecting.large.named(name);
  });
  const inspecting = inspectingUnder(on, small, kinds, large, () => {
    standing?.panel.holdStill();
  });
  const carrier = createCarrier(overlay, on);
  const follow = (): void => {
    small.follow();
    tooltip.follow();
  };

  return {
    large,
    open(campaign, civilization) {
      const { count, stacks } = browseOf(catalogue, campaign, civilization, cardName);
      scrim.setVisible(true);
      const { title, panel } = layBrowse(
        overlay,
        {
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
        },
        inspecting,
        { beside: close, follow, carrier },
      );
      standing = { title, panel };
      covering(true);
    },
  };
}

/**
 * What a screen's faces answer with, on the stratum handed: a card shown large over them takes down
 * the small cards their names raised, `rising` told first.
 */
export function inspectingUnder(
  on: Inspecting['on'],
  small: Inspecting['small'],
  kinds: Inspecting['kinds'],
  large: ShownLarge,
  rising: () => void,
): Inspecting {
  return {
    on,
    small,
    kinds,
    large: {
      show(face) {
        rising();
        small.down();
        large.show(face);
      },
      named(name) {
        rising();
        small.down();
        large.named(name);
      },
    },
  };
}
