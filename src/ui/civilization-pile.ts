import Phaser from 'phaser';
import type { CampaignCivilization } from '../rules/campaign';
import { NO_REFUSAL } from '../rules/state';
import { createCardBack, createCardFace, metricsOf } from './card-face';
import { countsOf } from './collection-layout';
import { addText, type Box, UI_FONT } from './design-space';
import { cardFaceAtStart } from './face';
import { css, LOOK } from './look';
import { type Answers, answersAround, type Laying } from './stack';
import { text } from './text';

const PILE_WIDTH = 100;
const PILE_BACKS = 3;
const BACK_STEP = 5;
const PILE_LIFT = 10;
const COUNTS_GAP = 10;

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
  /** What the pile answers the rest and the right click with, over its whole box. */
  readonly answers: Answers;
  /** Where its counts end. */
  readonly bottom: number;
};

/**
 * A civilization's pile from the left and the top handed: card backs under its city section's card,
 * face up, raised and its card selected where it is selected, and under them its counts. A right
 * click on it runs `browse`, a name on its card excepted.
 */
export function createPile(
  { scene, catalogue, inspecting }: Laying,
  owned: CampaignCivilization,
  { left, top, selected }: { left: number; top: number; selected: boolean },
  name: string,
  browse: () => void,
): Pile {
  const { height } = metricsOf(PILE_WIDTH);
  const x = left + PILE_WIDTH / 2;
  const foot = top + height;
  const backs = Array.from({ length: PILE_BACKS }, (_, under) => {
    const step = (PILE_BACKS - under) * BACK_STEP;
    return createCardBack(scene, { width: PILE_WIDTH }).setPosition(x + step, foot + step);
  });
  const lift = selected ? PILE_LIFT : 0;
  const shown = cardFaceAtStart(catalogue, owned.city.card.id, owned.city.building);
  const card = createCardFace(scene, shown, NO_REFUSAL, { width: PILE_WIDTH });
  card.select(selected);
  const face = card.root
    .setPosition(x, foot - lift)
    .setName(`${name}-card`)
    .setData('card', shown.id);
  const counts = addText(
    scene,
    x,
    foot + PILE_BACKS * BACK_STEP + COUNTS_GAP,
    text('pile.counts', countsOf(owned)),
    COUNTS_STYLE,
  )
    .setOrigin(0.5, 0)
    .setName(`${name}-counts`);
  const bounds = Phaser.Geom.Rectangle.Union(
    new Phaser.Geom.Rectangle(left, top - lift, PILE_SPAN, height + lift + PILE_BACKS * BACK_STEP),
    counts.getBounds(),
  );
  return {
    parts: [...backs, face, counts],
    box: bounds,
    answers: answersAround(card, shown, inspecting, browse),
    bottom: bounds.bottom,
  };
}
