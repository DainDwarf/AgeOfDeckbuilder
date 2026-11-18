import Phaser from 'phaser';
import type { CampaignCivilization } from '../rules/campaign';
import { NO_REFUSAL } from '../rules/state';
import { CARD_HEIGHT, cardGrown, createCardBack, createCardFace } from './card-face';
import { CARD_WIDTH } from './card-frames';
import { inRoundedBox } from './card-shape';
import { countsOf } from './collection-layout';
import { addText, type Box, UI_FONT } from './design-space';
import { cardFaceAtStart } from './face';
import { css, dimmedTo, LOOK, unworn } from './look';
import { type Laying, type Reactions, reactionsAround } from './stack';
import { text } from './text';

const PILE_BACKS = 3;
const BACK_STEP = 5;
const PILE_LIFT = 10;
const COUNTS_GAP = 10;

/**
 * The ring the selected pile's card wears: this far outside the card's own edge, stroked this wide
 * over an edge stroked this wide.
 */
const RING_STANDOFF = 3.5;
const RING_WEIGHT = 3;
const RING_EDGE = RING_WEIGHT + 2;

/** How wide a pile stands, the steps of its backs included. */
export const PILE_SPAN = CARD_WIDTH + PILE_BACKS * BACK_STEP;

export type Pile = {
  readonly parts: readonly Phaser.GameObjects.GameObject[];
  /** Over the whole pile and its counts. */
  readonly box: Box;
  /** Whether its card, its ring, its backs or its counts lie under a point of the surface. */
  liesUnder(x: number, y: number): boolean;
  /** What the pile reacts to the rest and the right click with, wherever it lies. */
  readonly reactions: Reactions;
  /** Where its counts end. */
  readonly bottom: number;
};

/** The ring round a card of the hand's size, about the card's bottom centre, hidden. */
function ringOf(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const ring = scene.add.graphics().setName('ring').setVisible(false);
  const { box, radius } = cardGrown(RING_STANDOFF);
  for (const [weight, colour] of [
    [RING_EDGE, LOOK.selectedEdge],
    [RING_WEIGHT, LOOK.selected],
  ] as const) {
    ring.lineStyle(weight, colour);
    ring.strokeRoundedRect(box.x, box.y, box.width, box.height, radius);
  }
  return ring;
}

/**
 * A civilization's pile from the left and the top handed: card backs under its city section's card,
 * face up, and under them its counts; raised, its card ringed under the frame, where it is selected,
 * and dimmed as one where it is not. A right click on it runs `browse`, a name on its card excepted.
 */
export function createPile(
  { scene, catalogue, inspecting }: Laying,
  owned: CampaignCivilization,
  { left, top, selected }: { left: number; top: number; selected: boolean },
  name: string,
  browse: () => void,
): Pile {
  const tone = selected ? unworn : dimmedTo(LOOK.unselected);
  const x = left + CARD_WIDTH / 2;
  const foot = top + CARD_HEIGHT;
  const backs = Array.from({ length: PILE_BACKS }, (_, under) => {
    const step = (PILE_BACKS - under) * BACK_STEP;
    const back = createCardBack(scene);
    back.wear(tone);
    back.root.setPosition(x + step, foot + step);
    return back;
  });
  const lift = selected ? PILE_LIFT : 0;
  const shown = cardFaceAtStart(catalogue, owned.city.card.id, owned.city.building);
  const card = createCardFace(scene, shown, NO_REFUSAL, { tone });
  const face = card.root.setPosition(x, foot - lift).setName(`${name}-card`);
  face.addAt(ringOf(scene).setVisible(selected), 0);
  const counts = addText(
    scene,
    x,
    foot + PILE_BACKS * BACK_STEP + COUNTS_GAP,
    text('pile.counts', countsOf(owned)),
    { fontFamily: UI_FONT, fontSize: '14px', color: css(tone(LOOK.deckCounts)), align: 'center' },
  )
    .setOrigin(0.5, 0)
    .setName(`${name}-counts`);
  const bounds = Phaser.Geom.Rectangle.Union(
    new Phaser.Geom.Rectangle(
      left,
      top - lift,
      PILE_SPAN,
      CARD_HEIGHT + lift + PILE_BACKS * BACK_STEP,
    ),
    counts.getBounds(),
  );
  const ringReach = cardGrown(RING_STANDOFF + RING_EDGE / 2);
  const ringed = (at: { x: number; y: number }): boolean =>
    selected && inRoundedBox(at, ringReach.box, ringReach.radius);
  const counted = (at: { x: number; y: number }): boolean =>
    at.x >= 0 && at.y >= 0 && at.x <= counts.width && at.y <= counts.height;
  return {
    parts: [...backs.map(({ root }) => root), face, counts],
    box: bounds,
    liesUnder: (atX, atY) =>
      card.cardAt(atX, atY) ||
      ringed(face.getLocalPoint(atX, atY)) ||
      backs.some((back) => back.cardAt(atX, atY)) ||
      counted(counts.getLocalPoint(atX, atY)),
    reactions: reactionsAround(card, inspecting, browse),
    bottom: bounds.bottom,
  };
}
