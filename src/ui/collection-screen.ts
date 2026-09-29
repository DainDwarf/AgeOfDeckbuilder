import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import {
  addedTo,
  type Campaign,
  type CampaignCivilization,
  priceOf,
  removedFrom,
} from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import { type CardId, NO_REFUSAL } from '../rules/state';
import {
  createCardFace,
  createKindBubble,
  drawCardSurface,
  heightOf,
  metricsOf,
} from './card-face';
import { createPile, PILE_SPAN } from './civilization-pile';
import { type CollectionStack, countsOf, deckRowsOf, heldIn, stacksOf } from './collection-layout';
import { offerEntries } from './debug-console';
import { deckPanelOf } from './deck-panel';
import {
  addText,
  answersPress,
  awayUnder,
  type Box,
  COVERED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  holdDesignSpace,
  MARGIN,
  onClick,
  stratumOf,
  TEXT_INSET,
  UI_FONT,
} from './design-space';
import { cardFaceAtStart } from './face';
import { isWheelNotch, takesMouseKeys } from './keys';
import { css, LOOK, overPage } from './look';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import { createCarrier, createPanel, type Filled, type Held, type Panel } from './panel';
import { chipAt } from './resource-bar';
import { campaignHeld, keepCampaign } from './save-entry';
import { createSmallCards } from './small-card';
import { answersOf, type Inspecting, standLarge } from './stack';
import { cardName, civilizationName, text } from './text';

const PANE_TOP = ROOM.y + MARGIN;
const WORD_GAP = 16;

const CARD_WIDTH = 110;
const UNDER_MOST = 3;
const UNDER_STEP = 4;
const STACK_WIDTH = CARD_WIDTH + UNDER_MOST * UNDER_STEP;
const STACKS_APART = 10;
const LINES_APART = 18;
const COPIES_GAP = 6;
const CHIP_TO_PRICE = 11;

const PILES_APART = 22;

const BUTTON_HEIGHT = 26;
const BUTTON_PAD = 10;

const WORD_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};
const COPIES_STYLE = { fontFamily: UI_FONT, fontSize: '14px', color: css(LOOK.deckCounts) };
const BUTTON_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '13px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};

/** The mode the screen stands in, and the civilization it edits where it edits one. */
type Mode =
  | { readonly shows: 'collection' }
  | { readonly shows: 'deck editing'; readonly civilization: string };

/** How wide the right panel stands in a mode, and how many stacks a line of the collection holds. */
function shapeOf(mode: Mode): { readonly right: number; readonly across: number } {
  switch (mode.shows) {
    case 'collection':
      return { right: 160, across: 6 };
    case 'deck editing':
      return { right: 400, across: 4 };
  }
}

/** What a stack reads under it, and whether it stands dimmed. */
type Reading = { readonly reads: string; readonly dimmed: boolean };

/** A colour as it stands on a dimmed stack: a container's alpha fades each child alone, so the cards under the face would show through it. */
function dimmed(colour: number): number {
  return overPage(colour, LOOK.whollyHeld);
}

/**
 * One stack from the left and the top handed: a card under its face for each copy past the first,
 * three at most, each a step further right and down, its reading under them, and on that line at
 * its right edge its price.
 */
function stackOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  { id, copies }: CollectionStack,
  { left, top }: { left: number; top: number },
  reading: Reading,
  price: number,
  inspecting: Inspecting,
  press: (() => void) | undefined,
  lands: Box | undefined,
): { root: Phaser.GameObjects.Container; held: Held; bottom: number } {
  const tone = reading.dimmed ? dimmed : (colour: number): number => colour;
  const height = heightOf(CARD_WIDTH);
  const place = { x: left + CARD_WIDTH / 2, y: top + height };
  const under = Math.min(copies - 1, UNDER_MOST);
  const unders = Array.from({ length: under }, (_, at) => {
    const step = (under - at) * UNDER_STEP;
    const surface = scene.add.graphics();
    drawCardSurface(surface, left + step, top + step, {
      width: CARD_WIDTH,
      face: tone(LOOK.affordableCard.face),
      edge: tone(LOOK.cardEdge),
    });
    return surface;
  });
  const shown = cardFaceAtStart(catalogue, id);
  const card = createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH, tone });
  const face = card.root
    .setPosition(place.x, place.y)
    .setName(`collection-card-${id}`)
    .setData('card', id);
  const count = addText(
    scene,
    left,
    top + height + UNDER_MOST * UNDER_STEP + COPIES_GAP,
    reading.reads,
    COPIES_STYLE,
  ).setName(`collection-card-${id}-copies`);
  const priced = addText(
    scene,
    left + STACK_WIDTH,
    count.y,
    text('collection.price', { price }),
    COPIES_STYLE,
  )
    .setOrigin(1, 0)
    .setName(`collection-card-${id}-price`);
  const chip = chipAt(
    scene,
    { x: priced.x - priced.width - CHIP_TO_PRICE, y: count.y + count.height / 2 },
    LOOK.influence,
  ).setName(`collection-card-${id}-price-chip`);
  return {
    root: scene.add
      .container(0, 0, [...unders, face, count, chip, priced])
      .setName(`collection-stack-${id}`)
      .setData('dimmed', reading.dimmed),
    held: {
      box: { x: left, y: top, width: CARD_WIDTH, height },
      answers: answersOf(card, shown, inspecting),
      press,
      carry:
        lands === undefined
          ? undefined
          : {
              copy: () =>
                createCardFace(scene, shown, NO_REFUSAL, { width: CARD_WIDTH })
                  .root.setPosition(place.x, place.y)
                  .setName('carried-card')
                  .setData('card', id),
              lands,
            },
    },
    bottom: count.y + count.height,
  };
}

/**
 * The campaign's collection as stacks from the top handed, `across` to a line, the lines centred
 * between the room's left and the panel's right handed, each reading what `readingOf` says, answering
 * a left click where `pressOf` hands a press, and a press held into `lands` where handed.
 */
function collectionOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  campaign: Campaign,
  { top, right, across, lands }: { top: number; right: number; across: number; lands?: Box },
  readingOf: (stack: CollectionStack) => Reading,
  pressOf: (stack: CollectionStack) => (() => void) | undefined,
  inspecting: Inspecting,
): Filled {
  const stacks = stacksOf(catalogue, campaign.collection, cardName);
  const span = across * STACK_WIDTH + (across - 1) * STACKS_APART;
  const first = (ROOM.x + right - span) / 2;
  const parts: Phaser.GameObjects.Container[] = [];
  const held: Held[] = [];
  let lineTop = top;
  let foot = top;
  for (let from = 0; from < stacks.length; from += across) {
    for (const [column, stack] of stacks.slice(from, from + across).entries()) {
      const left = first + column * (STACK_WIDTH + STACKS_APART);
      const drawn = stackOf(
        scene,
        catalogue,
        stack,
        { left, top: lineTop },
        readingOf(stack),
        priceOf(catalogue, campaign, stack.id),
        inspecting,
        pressOf(stack),
        lands,
      );
      parts.push(drawn.root);
      held.push(drawn.held);
      foot = Math.max(foot, drawn.bottom);
    }
    lineTop = foot + LINES_APART;
  }
  return { parts, held, foot };
}

/**
 * The campaign's civilizations top down from the top handed, each its pile, centred in the right
 * panel from its left handed; a press on a pile opens its civilization.
 */
function civilizationsOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  { top, frame }: { top: number; frame: Box },
  open: (civilization: string) => void,
  inspecting: Inspecting,
): Filled {
  const left = frame.x + (frame.width - PILE_SPAN) / 2;
  const parts: Phaser.GameObjects.Container[] = [];
  const held: Held[] = [];
  let pileTop = top;
  let foot = top;
  for (const [id, owned] of Object.entries(civilizations)) {
    const name = `collection-civilization-${id}`;
    const pile = createPile(
      scene,
      catalogue,
      owned,
      { left, top: pileTop, chosen: false },
      inspecting,
      name,
    );
    parts.push(scene.add.container(0, 0, [...pile.parts]).setName(name));
    held.push({ box: pile.box, answers: pile.answers, press: () => open(id) });
    foot = pile.bottom;
    pileTop = pile.bottom + PILES_APART;
  }
  return { parts, held, foot };
}

/**
 * A button of the collection screen's head, its label on an edge: one end of it at `x`, the button
 * reaching `to` the left or the right of it. The pointer on it is the hand.
 */
function modeButtonOf(
  scene: Phaser.Scene,
  label: string,
  { x, y, to }: { x: number; y: number; to: 'left' | 'right' },
  name: string,
): { face: Phaser.GameObjects.Rectangle; parts: Phaser.GameObjects.GameObject[] } {
  const words = addText(scene, 0, y, label, BUTTON_STYLE).setOrigin(0.5).setName(`${name}-label`);
  const width = words.width - 2 * TEXT_INSET.x + 2 * BUTTON_PAD + 2;
  const middle = to === 'left' ? x - width / 2 : x + width / 2;
  words.setX(middle);
  const face = scene.add
    .rectangle(middle, y, width, BUTTON_HEIGHT)
    .setStrokeStyle(1, LOOK.modeButtonEdge)
    .setName(name)
    .setInteractive();
  answersPress(face);
  return { face, parts: [face, words] };
}

/**
 * The collection screen: the collection on the left and the civilizations on the right, each panel
 * under its word, or in the deck editing mode the collection beside the civilization being edited.
 */
export class CollectionScreen extends Phaser.Scene {
  constructor() {
    super('collection');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    const { content, bubbles, tooltip } = wearNavbar(this, 'collection');
    // Ahead of `backRaisesMenu`: a notch taken here reaches none of the screen's readers after it.
    takesMouseKeys(this, isWheelNotch);
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
    const screen = this.add.container(0, 0).setName('collection');
    content.add(screen);
    const panels = stratumOf(content, this.cameras.main);
    const follow = (): void => {
      inspecting.small.follow();
      tooltip.follow();
    };
    const carrier = createCarrier(this, panels);

    let laid: { readonly head: Phaser.GameObjects.Container; readonly panels: Panel[] } | undefined;

    /** The screen laid in the mode, its panels at the offsets handed, in order, or at their tops. */
    const lay = (mode: Mode, offsets: readonly number[] = []): void => {
      inspecting.small.down();
      carrier.down();
      if (laid !== undefined) {
        for (const panel of laid.panels) panel.down();
        laid.head.destroy();
      }
      const campaign = campaignHeld();
      const [leftOffset, rightOffset] = offsets;
      const { right, across } = shapeOf(mode);
      const divide = DESIGN_WIDTH - right;
      const word = (label: string, x: number): Phaser.GameObjects.Text =>
        addText(this, x, PANE_TOP, label, WORD_STYLE).setOrigin(0.5, 0);
      const cards = word(text('collection.collection'), (ROOM.x + divide) / 2);
      const top = cards.y + cards.height + WORD_GAP;
      const middle = cards.y + cards.height / 2;
      const height = DESIGN_HEIGHT - MARGIN - top;
      const left: Box = { x: ROOM.x, y: top, width: divide - ROOM.x, height };
      const frame: Box = { x: divide + 1, y: top, width: right - 1, height };
      const edge = this.add.rectangle(divide, ROOM.y, 1, ROOM.height, LOOK.panelDivide);
      edge.setOrigin(0, 0);

      switch (mode.shows) {
        case 'collection': {
          const civilizations = word(text('collection.civilizations'), divide + right / 2);
          const head = this.add
            .container(0, 0, [edge, cards, civilizations])
            .setName('collection-mode');
          screen.add(head);
          const reading = ({ copies }: CollectionStack): Reading => ({
            reads: text('collection.copies', { copies }),
            dimmed: false,
          });
          laid = {
            head,
            panels: [
              createPanel(
                this,
                panels,
                {
                  name: 'collection-panel',
                  frame: left,
                  ...collectionOf(
                    this,
                    CATALOGUE,
                    campaign,
                    { top, right: divide, across },
                    reading,
                    () => undefined,
                    inspecting,
                  ),
                },
                follow,
                carrier,
                leftOffset,
              ),
              createPanel(
                this,
                panels,
                {
                  name: 'civilizations-panel',
                  frame,
                  ...civilizationsOf(
                    this,
                    CATALOGUE,
                    campaign.civilizations,
                    { top, frame },
                    (civilization) => {
                      lay({ shows: 'deck editing', civilization });
                    },
                    inspecting,
                  ),
                },
                follow,
                carrier,
                rightOffset,
              ),
            ],
          };
          return;
        }
        case 'deck editing': {
          const { civilization } = mode;
          const back = modeButtonOf(
            this,
            text('collection.to-collection'),
            { x: divide - MARGIN, y: middle, to: 'left' },
            'collection-to-collection',
          );
          onClick(back.face, () => {
            lay({ shows: 'collection' });
          });
          const onward = modeButtonOf(
            this,
            text('collection.to-civilization'),
            { x: frame.x + MARGIN, y: middle, to: 'right' },
            'collection-to-civilization',
          );
          const name = addText(
            this,
            DESIGN_WIDTH - MARGIN,
            PANE_TOP,
            civilizationName(civilization),
            WORD_STYLE,
          )
            .setOrigin(1, 0)
            .setName('deck-civilization');
          const head = this.add
            .container(0, 0, [edge, cards, ...back.parts, ...onward.parts, name])
            .setName('deck-editing-mode');
          screen.add(head);
          const deck = deckRowsOf(CATALOGUE, campaign, civilization, cardName);
          const reading = ({ id, copies }: CollectionStack): Reading => {
            const held = heldIn(deck, id);
            return { reads: text('collection.in-deck', { held, copies }), dimmed: held === copies };
          };
          const edit = (move: (held: Campaign) => Campaign): void => {
            keepCampaign(move(campaignHeld()));
            lay(
              mode,
              laid?.panels.map(({ offset }) => offset),
            );
          };
          const add = ({ id, copies }: CollectionStack): (() => void) | undefined =>
            heldIn(deck, id) < copies
              ? () => {
                  edit((held) => addedTo(CATALOGUE, held, civilization, id));
                }
              : undefined;
          const remove = (card: CardId): void => {
            edit((held) => removedFrom(CATALOGUE, held, civilization, card));
          };
          const owned = campaign.civilizations[civilization];
          const collectionSide: Box = { ...ROOM, width: divide - ROOM.x };
          const civilizationSide: Box = { ...ROOM, x: divide, width: DESIGN_WIDTH - divide };
          laid = {
            head,
            panels: [
              createPanel(
                this,
                panels,
                {
                  name: 'collection-panel',
                  frame: left,
                  ...collectionOf(
                    this,
                    CATALOGUE,
                    campaign,
                    { top, right: divide, across, lands: civilizationSide },
                    reading,
                    add,
                    inspecting,
                  ),
                },
                follow,
                carrier,
                leftOffset,
              ),
              createPanel(
                this,
                panels,
                {
                  name: 'civilization-panel',
                  frame,
                  ...deckPanelOf(
                    this,
                    CATALOGUE,
                    {
                      city: owned.city.card.id,
                      deck,
                      counts: countsOf(owned),
                      remove,
                      lands: collectionSide,
                    },
                    {
                      left: frame.x + MARGIN,
                      right: DESIGN_WIDTH - MARGIN,
                      top,
                      radius: metricsOf(CARD_WIDTH).radius,
                    },
                    inspecting,
                  ),
                },
                follow,
                carrier,
                rightOffset,
              ),
            ],
          };
          return;
        }
      }
      const unlisted: never = mode;
      throw new Error(`no mode of the collection screen is ${JSON.stringify(unlisted)}`);
    };

    lay({ shows: 'collection' });
  }
}
