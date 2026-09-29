import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import type { CampaignCivilization } from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { NO_REFUSAL } from '../rules/state';
import { createCardFace, createKindBubble, drawCardSurface, heightOf } from './card-face';
import { createPile, PILE_SPAN } from './civilization-pile';
import { type CollectionStack, stacksOf } from './collection-layout';
import { offerEntries } from './debug-console';
import {
  addText,
  awayUnder,
  COVERED,
  DESIGN_WIDTH,
  holdDesignSpace,
  MARGIN,
  UI_FONT,
} from './design-space';
import { cardFaceAtStart } from './face';
import { css, LOOK } from './look';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import { campaignHeld } from './save-entry';
import { createSmallCards } from './small-card';
import { type Inspecting, inspectedThrough, standLarge } from './stack';
import { cardName, type TextKey, text } from './text';

const PANEL_WIDTH = 160;
const PANEL_LEFT = DESIGN_WIDTH - PANEL_WIDTH;
const PANE_TOP = ROOM.y + MARGIN;
const WORD_GAP = 16;

const CARD_WIDTH = 110;
const UNDER_MOST = 3;
const UNDER_STEP = 4;
const STACK_WIDTH = CARD_WIDTH + UNDER_MOST * UNDER_STEP;
const ACROSS = 6;
const STACKS_APART = 10;
const LINES_APART = 18;
const COPIES_GAP = 6;

const PILES_APART = 22;

const WORD_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};
const COPIES_STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.deckCounts) };

/**
 * One stack from the left and the top handed: a card under its face for each copy past the first,
 * three at most, each a step further right and down, and the count of its copies under them.
 */
function stackOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  { id, copies }: CollectionStack,
  { left, top }: { left: number; top: number },
  inspecting: Inspecting,
): { root: Phaser.GameObjects.Container; bottom: number } {
  const height = heightOf(CARD_WIDTH);
  const under = Math.min(copies - 1, UNDER_MOST);
  const unders = Array.from({ length: under }, (_, at) => {
    const step = (under - at) * UNDER_STEP;
    const surface = scene.add.graphics();
    drawCardSurface(surface, left + step, top + step, { width: CARD_WIDTH });
    return surface;
  });
  const shown = cardFaceAtStart(catalogue, id);
  const card = createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH });
  const face = card.root
    .setPosition(left + CARD_WIDTH / 2, top + height)
    .setName(`collection-card-${id}`)
    .setData('card', id);
  const count = addText(
    scene,
    left,
    top + height + UNDER_MOST * UNDER_STEP + COPIES_GAP,
    text('collection.copies', { copies }),
    COPIES_STYLE,
  ).setName(`collection-card-${id}-copies`);
  const zone = scene.add
    .zone(left + CARD_WIDTH / 2, top + height / 2, CARD_WIDTH, height)
    .setInteractive();
  inspectedThrough(zone, card, shown, inspecting);
  return {
    root: scene.add
      .container(0, 0, [...unders, face, count, zone])
      .setName(`collection-stack-${id}`),
    bottom: count.y + count.height,
  };
}

/** The collection's stacks, six to a line from the top handed, the lines centred in the left panel. */
function collectionOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  stacks: readonly CollectionStack[],
  top: number,
  inspecting: Inspecting,
): Phaser.GameObjects.Container[] {
  const span = ACROSS * STACK_WIDTH + (ACROSS - 1) * STACKS_APART;
  const first = (ROOM.x + PANEL_LEFT - span) / 2;
  const drawn: Phaser.GameObjects.Container[] = [];
  let lineTop = top;
  for (let from = 0; from < stacks.length; from += ACROSS) {
    let bottom = lineTop;
    for (const [column, stack] of stacks.slice(from, from + ACROSS).entries()) {
      const left = first + column * (STACK_WIDTH + STACKS_APART);
      const { root, bottom: foot } = stackOf(
        scene,
        catalogue,
        stack,
        { left, top: lineTop },
        inspecting,
      );
      drawn.push(root);
      bottom = Math.max(bottom, foot);
    }
    lineTop = bottom + LINES_APART;
  }
  return drawn;
}

/** The campaign's civilizations top down from the top handed, each its pile, centred in the right panel. */
function civilizationsOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  top: number,
  inspecting: Inspecting,
): Phaser.GameObjects.Container[] {
  const left = PANEL_LEFT + 1 + (PANEL_WIDTH - 1 - PILE_SPAN) / 2;
  let pileTop = top;
  return Object.entries(civilizations).map(([id, owned]) => {
    const name = `collection-civilization-${id}`;
    const pile = createPile(
      scene,
      catalogue,
      owned,
      { left, top: pileTop, chosen: false },
      inspecting,
      name,
    );
    pileTop = pile.bottom + PILES_APART;
    return scene.add.container(0, 0, [...pile.parts]).setName(name);
  });
}

/**
 * The collection screen in its collection mode: the collection on the left and the civilizations on
 * the right, each panel under its word.
 */
export class CollectionScreen extends Phaser.Scene {
  constructor() {
    super('collection');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    const { content, bubbles, tooltip } = wearNavbar(this, 'collection');
    backRaisesMenu(this);
    const away = awayUnder(this);
    const overlay = overlayOf(this);
    const large = standLarge(
      overlay,
      CATALOGUE,
      (up) => {
        away('overlay', up);
      },
      () => false,
    );
    resetMenu(this, (under) => {
      away('menu', under);
      if (under) overlay.input.emit(COVERED);
    });
    offerEntries(this, { seed: undefined, veiled: undefined });
    const kinds = createKindBubble(tooltip);
    const inspecting: Inspecting = {
      on: bubbles,
      small: createSmallCards(this, bubbles, CATALOGUE, kinds, large.named),
      kinds,
      large,
    };
    const campaign = campaignHeld();

    const word = (key: TextKey, x: number): Phaser.GameObjects.Text =>
      addText(this, x, PANE_TOP, text(key), WORD_STYLE).setOrigin(0.5, 0);
    const cards = word('collection.collection', (ROOM.x + PANEL_LEFT) / 2);
    const civilizations = word('collection.civilizations', (PANEL_LEFT + DESIGN_WIDTH) / 2);
    const top = cards.y + cards.height + WORD_GAP;

    content.add(
      this.add
        .container(0, 0, [
          this.add.rectangle(PANEL_LEFT, ROOM.y, 1, ROOM.height, LOOK.panelDivide).setOrigin(0, 0),
          cards,
          civilizations,
          ...collectionOf(
            this,
            CATALOGUE,
            stacksOf(CATALOGUE, campaign.collection, cardName),
            top,
            inspecting,
          ),
          ...civilizationsOf(this, CATALOGUE, campaign.civilizations, top, inspecting),
        ])
        .setName('collection'),
    );
  }
}
