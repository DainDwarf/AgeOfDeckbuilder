import Phaser from 'phaser';
import type { Campaign } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { boundTo } from './bindings';
import { CARD_WIDTH, createKindBubble, heightOf, metricsOf } from './card-face';
import { browseOf, type CollectionStack } from './collection-layout';
import { type Cell, linesOf, spanOf, stackedCardsOf } from './collection-stack';
import { cityEdgeOf } from './deck-panel';
import {
  addText,
  type Box,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  ownBoxOf,
  UI_FONT,
} from './design-space';
import { isWheelNotch } from './keys';
import { css, LOOK } from './look';
import { headingOf } from './overlay';
import type { OverlayScene } from './overlay-scene';
import { createCarrier, createPanel, type Panel } from './panel';
import { createSmallCards } from './small-card';
import { answersAround, type Inspecting, type ShownLarge, standLarge } from './stack';
import { cardName, civilizationName, text } from './text';
import { createTooltip } from './tooltip';

const NAME = 'civilization-browse';

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

/** A screen of the meta's cards shown large, and the browse of its civilizations they stand over. */
export type Browsing = {
  readonly large: ShownLarge;
  /** The browse of the campaign's civilization of that name raised. */
  open(campaign: Campaign, civilization: string): void;
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
 * The stack in the browse's `at`th place, its copies on its badge, the city section's in a pale
 * edge: the right click anywhere on it off a name shows its card large.
 */
function stackCellOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  {
    stack,
    at,
    city,
  }: { readonly stack: CollectionStack; readonly at: number; readonly city: boolean },
  inspecting: Inspecting,
): Cell {
  return ({ left, top }) => {
    const name = `${NAME}-card-${at}`;
    const { unders, card, shown, box, foot } = stackedCardsOf(scene, catalogue, {
      stack,
      left,
      top,
      width: CARD_WIDTH,
      name,
    });
    const face: Box = { x: left, y: top, width: CARD_WIDTH, height: heightOf(CARD_WIDTH) };
    const badge = badgeOf(
      scene,
      { right: face.x + face.width + BADGE_OUT, bottom: face.y + face.height + BADGE_OUT },
      stack.copies,
      `${name}-copies`,
    );
    const edge = city ? [cityEdgeOf(scene, face, metricsOf(CARD_WIDTH).radius)] : [];
    const root = scene.add
      .container(0, 0, [...edge, ...unders, card.root, ...badge.parts])
      .setName(`${NAME}-stack-${at}`);
    return {
      parts: [root],
      held: [
        {
          box: Phaser.Geom.Rectangle.Union(
            new Phaser.Geom.Rectangle(box.x, box.y, box.width, box.height),
            new Phaser.Geom.Rectangle(badge.box.x, badge.box.y, badge.box.width, badge.box.height),
          ),
          answers: answersAround(card, shown, inspecting, () => {
            inspecting.large.show(shown);
          }),
        },
      ],
      bottom: foot,
    };
  };
}

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
  const tooltip = createTooltip(overlay, overlay.strata.tooltip);
  const kinds = createKindBubble(tooltip);
  let standing:
    | { readonly parts: readonly Phaser.GameObjects.GameObject[]; readonly panel: Panel }
    | undefined;

  const close = (): void => {
    if (standing === undefined) return;
    small.down();
    standing.panel.down();
    for (const part of standing.parts) part.destroy();
    standing = undefined;
    covering(false);
  };

  const large = standLarge(overlay, catalogue, covering, () => false, {
    kinds,
    get standing() {
      return standing !== undefined;
    },
    takes(press) {
      // A notch scrolls the browse through Phaser's own wheel, whatever it is bound to.
      if (!isWheelNotch(press) && boundTo(press, 'back')) close();
      return true;
    },
  });
  const small = createSmallCards(overlay, overlay.strata.smallCard, catalogue, kinds, (name) => {
    over.named(name);
  });
  /** A card shown large over the browse: the small cards its names raised go down under it. */
  const over: ShownLarge = {
    show(face) {
      small.down();
      large.show(face);
    },
    named(name) {
      small.down();
      large.named(name);
    },
  };
  const inspecting: Inspecting = { on, small, kinds, large: over };
  const carrier = createCarrier(overlay, on);
  const follow = (): void => {
    small.follow();
    tooltip.follow();
  };

  return {
    large,
    open(campaign, civilization) {
      const { count, stacks } = browseOf(catalogue, campaign, civilization, cardName);
      const scrim = overlay.add
        .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
        .setOrigin(0, 0)
        .setInteractive();
      onClick(scrim, close);
      onClick(scrim, close, 'right');
      const title = headingOf(
        overlay,
        NAME,
        text('browse.civilization', { civilization: civilizationName(civilization), count }),
      );
      on.layer.add([scrim, title]);
      const top = title.y + title.height + MARGIN;
      const cells = stacks.map((stack, at) =>
        stackCellOf(overlay, catalogue, { stack, at, city: at === 0 }, inspecting),
      );
      const panel = createPanel(
        overlay,
        on,
        {
          name: NAME,
          frame: {
            x: MARGIN,
            y: top,
            width: DESIGN_WIDTH - 2 * MARGIN,
            height: DESIGN_HEIGHT - MARGIN - top,
          },
          beside: close,
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
      standing = { parts: [scrim, title], panel };
      covering(true);
    },
  };
}
