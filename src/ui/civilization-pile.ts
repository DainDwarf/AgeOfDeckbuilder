import Phaser from 'phaser';
import type { CampaignCivilization } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL } from '../rules/state';
import { createCardBack, createCardFace, metricsOf } from './card-face';
import { addText, UI_FONT } from './design-space';
import { cardFaceAtStart } from './face';
import { css, LOOK } from './look';
import type { Box } from './scroll';
import { type Answers, answersOf, type Inspecting } from './stack';
import { text } from './text';

const PILE_WIDTH = 100;
const PILE_BACKS = 3;
const BACK_STEP = 5;
const PILE_LIFT = 10;
const COUNTS_GAP = 10;
const EDGE = 2;

/** How wide a pile stands, the steps of its backs included. */
export const PILE_SPAN = PILE_WIDTH + PILE_BACKS * BACK_STEP;

const COUNTS_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  color: css(LOOK.deckCounts),
  align: 'center',
};

export type Pile = {
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  /** Over the whole pile and its counts. */
  readonly box: Box;
  /** What the pile answers the rest and the right click with, on its card. */
  readonly answers: Answers;
  /** Where its counts end. */
  readonly bottom: number;
};

/**
 * A civilization's pile from the left and the top handed: card backs under its city section's card,
 * face up, raised in a pale edge where it is chosen, and under them the count of its cards over the
 * count of its settle cards.
 */
export function createPile(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  owned: CampaignCivilization,
  { left, top, chosen }: { left: number; top: number; chosen: boolean },
  inspecting: Inspecting,
  name: string,
): Pile {
  const { height, radius } = metricsOf(PILE_WIDTH);
  const x = left + PILE_WIDTH / 2;
  const foot = top + height;
  const backs = Array.from({ length: PILE_BACKS }, (_, under) => {
    const step = (PILE_BACKS - under) * BACK_STEP;
    return createCardBack(scene, { width: PILE_WIDTH }).setPosition(x + step, foot + step);
  });
  const lift = chosen ? PILE_LIFT : 0;
  const shown = cardFaceAtStart(catalogue, owned.city.card.id);
  const card = createCardFace(scene, shown, NO_REFUSAL, { width: PILE_WIDTH });
  const face = card.root
    .setPosition(x, foot - lift)
    .setName(`${name}-card`)
    .setData('card', shown.id);
  const edge = chosen
    ? [
        scene.add
          .graphics({ x, y: foot - lift })
          .lineStyle(EDGE, LOOK.chosenEdge)
          .strokeRoundedRect(-PILE_WIDTH / 2, -height, PILE_WIDTH, height, radius),
      ]
    : [];
  const counts = addText(
    scene,
    x,
    foot + PILE_BACKS * BACK_STEP + COUNTS_GAP,
    text('pile.counts', { cards: owned.cards.length, settle: owned.settle.length }),
    COUNTS_STYLE,
  )
    .setOrigin(0.5, 0)
    .setName(`${name}-counts`);
  const bounds = Phaser.Geom.Rectangle.Union(
    new Phaser.Geom.Rectangle(left, top - lift, PILE_SPAN, height + lift + PILE_BACKS * BACK_STEP),
    counts.getBounds(),
  );
  return {
    parts: [...backs, face, ...edge, counts],
    box: bounds,
    answers: answersOf(card, shown, inspecting),
    bottom: bounds.bottom,
  };
}
