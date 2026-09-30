import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import {
  addedTo,
  bought,
  type Campaign,
  type CampaignCivilization,
  priceOf,
  removedFrom,
  unaffordableIn,
} from '../rules/campaign';
import type { Catalogue } from '../rules/catalogue';
import type { CardId } from '../rules/state';
import { createKindBubble, metricsOf } from './card-face';
import { createPile, PILE_SPAN } from './civilization-pile';
import { type CollectionStack, countsOf, deckRowsOf, heldIn, stacksOf } from './collection-layout';
import { CARD_WIDTH, type Cell, linesOf, type Reading, spanOf, stackOf } from './collection-stack';
import { offerEntries } from './debug-console';
import { civilizationPanelOf, deckPanelOf } from './deck-panel';
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
  ownBoxOf,
  stratumOf,
  UI_FONT,
} from './design-space';
import { isWheelNotch, takesMouseKeys } from './keys';
import { css, LOOK } from './look';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import { createCarrier, createPanel, type Filled, type Held, type Panel } from './panel';
import { campaignHeld, keepCampaign } from './save-entry';
import { createSmallCards } from './small-card';
import { type Inspecting, standLarge } from './stack';
import { cardName, civilizationName, text } from './text';

const PANE_TOP = ROOM.y + MARGIN;
const WORD_GAP = 16;

const PILES_APART = 22;

const BUTTON_HEIGHT = 26;
const BUTTON_PAD = 10;

const WORD_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};
const BUTTON_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '13px',
  fontStyle: 'bold',
  color: css(LOOK.paleInk),
};

/** The mode the screen stands in, and the civilization it shows where it shows one. */
type Mode =
  | { readonly shows: 'collection' }
  | { readonly shows: 'deck editing'; readonly civilization: string }
  | { readonly shows: 'civilization'; readonly civilization: string };

/** How wide the right panel stands in a mode, and how many stacks a line of its stacks holds. */
function shapeOf(mode: Mode): { readonly right: number; readonly across: number } {
  switch (mode.shows) {
    case 'collection':
      return { right: 160, across: 6 };
    case 'deck editing':
      return { right: 400, across: 4 };
    case 'civilization':
      return { right: ROOM.width, across: 7 };
  }
}

/**
 * The campaign's collection as stacks from the top handed, `across` to a line, the lines centred
 * between the room's left and `right`, each reading what `readingOf` says, answering a left click
 * where `pressOf` hands one and a press held into `lands` where handed; an affordable price runs `buy`.
 */
function collectionOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  campaign: Campaign,
  { top, right, across, lands }: { top: number; right: number; across: number; lands?: Box },
  readingOf: (stack: CollectionStack) => Reading,
  pressOf: (stack: CollectionStack) => (() => void) | undefined,
  buy: (card: CardId) => void,
  inspecting: Inspecting,
): Filled {
  const stacks = stacksOf(catalogue, campaign.collection, cardName);
  const cells = stacks.map(
    (stack): Cell =>
      (at) =>
        stackOf(
          scene,
          catalogue,
          stack,
          at,
          'collection',
          readingOf(stack),
          {
            price: priceOf(catalogue, campaign, stack.id),
            buy: unaffordableIn(catalogue, campaign, stack.id)
              ? undefined
              : () => {
                  buy(stack.id);
                },
          },
          inspecting,
          pressOf(stack),
          lands,
        ),
  );
  return linesOf(cells, { left: (ROOM.x + right - spanOf(across)) / 2, top, across });
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
  const width = ownBoxOf(words).width + 2 * BUTTON_PAD + 2;
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
 * under its word, or in the deck editing mode the collection beside the civilization being edited,
 * or in the civilization mode that civilization alone.
 */
export class CollectionScreen extends Phaser.Scene {
  constructor() {
    super('collection');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    const { content, bubbles, tooltip, readInfluence } = wearNavbar(this, 'collection');
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

    /** The campaign moved and kept, and the screen laid again in the mode, its panels where they stood. */
    const edit = (mode: Mode, move: (held: Campaign) => Campaign): void => {
      keepCampaign(move(campaignHeld()));
      lay(
        mode,
        laid?.panels.map(({ offset }) => offset),
      );
    };

    /** The screen laid in the mode, its panels at the offsets handed, in order, or at their tops. */
    const lay = (mode: Mode, offsets: readonly number[] = []): void => {
      inspecting.small.down();
      carrier.down();
      if (laid !== undefined) {
        for (const panel of laid.panels) panel.down();
        laid.head.destroy();
      }
      readInfluence();
      const campaign = campaignHeld();
      const buy = (card: CardId): void => {
        edit(mode, (held) => bought(CATALOGUE, held, card));
      };
      const { right, across } = shapeOf(mode);
      const divide = DESIGN_WIDTH - right;
      const word = (label: string, x: number): Phaser.GameObjects.Text =>
        addText(this, x, PANE_TOP, label, WORD_STYLE).setOrigin(0.5, 0);
      /** Where the panels start under a word of the head, how tall they stand, and the height of the word's middle. */
      const under = (
        shown: Phaser.GameObjects.Text,
      ): { top: number; height: number; middle: number } => {
        const top = shown.y + shown.height + WORD_GAP;
        return { top, height: DESIGN_HEIGHT - MARGIN - top, middle: shown.y + shown.height / 2 };
      };
      /** The collection's word and the line between the panels, and both panels' frames under them. */
      const sides = (): {
        shared: Phaser.GameObjects.GameObject[];
        top: number;
        middle: number;
        left: Box;
        frame: Box;
      } => {
        const cards = word(text('collection.collection'), (ROOM.x + divide) / 2);
        const { top, height, middle } = under(cards);
        const edge = this.add
          .rectangle(divide, ROOM.y, 1, ROOM.height, LOOK.panelDivide)
          .setOrigin(0, 0);
        return {
          shared: [edge, cards],
          top,
          middle,
          left: { x: ROOM.x, y: top, width: divide - ROOM.x, height },
          frame: { x: divide + 1, y: top, width: right - 1, height },
        };
      };

      switch (mode.shows) {
        case 'collection': {
          const [leftOffset, rightOffset] = offsets;
          const { shared, top, left, frame } = sides();
          const civilizations = word(text('collection.civilizations'), divide + right / 2);
          const head = this.add
            .container(0, 0, [...shared, civilizations])
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
                    buy,
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
          const [leftOffset, rightOffset] = offsets;
          const { shared, top, middle, left, frame } = sides();
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
          onClick(onward.face, () => {
            lay({ shows: 'civilization', civilization });
          });
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
            .container(0, 0, [...shared, ...back.parts, ...onward.parts, name])
            .setName('deck-editing-mode');
          screen.add(head);
          const deck = deckRowsOf(CATALOGUE, campaign, civilization, cardName);
          const reading = ({ id, copies }: CollectionStack): Reading => {
            const held = heldIn(deck, id);
            return { reads: text('collection.in-deck', { held, copies }), dimmed: held === copies };
          };
          const add = ({ id, copies }: CollectionStack): (() => void) | undefined =>
            heldIn(deck, id) < copies
              ? () => {
                  edit(mode, (held) => addedTo(CATALOGUE, held, civilization, id));
                }
              : undefined;
          const remove = (card: CardId): void => {
            edit(mode, (held) => removedFrom(CATALOGUE, held, civilization, card));
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
                    buy,
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
        case 'civilization': {
          const { civilization } = mode;
          const [offset] = offsets;
          const title = word(
            text('collection.civilization-title', {
              civilization: civilizationName(civilization),
            }),
            ROOM.x + ROOM.width / 2,
          ).setName('civilization-title');
          const { top, height, middle } = under(title);
          const back = modeButtonOf(
            this,
            text('collection.to-collection'),
            { x: ROOM.x + MARGIN, y: middle, to: 'right' },
            'collection-to-deck-editing',
          );
          onClick(back.face, () => {
            lay({ shows: 'deck editing', civilization });
          });
          const head = this.add
            .container(0, 0, [title, ...back.parts])
            .setName('civilization-mode');
          screen.add(head);
          const owned = campaign.civilizations[civilization];
          laid = {
            head,
            panels: [
              createPanel(
                this,
                panels,
                {
                  name: 'civilization-mode-panel',
                  frame: { x: ROOM.x, y: top, width: right, height },
                  ...civilizationPanelOf(
                    this,
                    CATALOGUE,
                    {
                      city: owned.city.card.id,
                      deck: deckRowsOf(CATALOGUE, campaign, civilization, cardName),
                      counts: countsOf(owned),
                      collection: campaign.collection,
                    },
                    {
                      left: (ROOM.x + DESIGN_WIDTH - spanOf(across)) / 2,
                      top,
                      across,
                      radius: metricsOf(CARD_WIDTH).radius,
                    },
                    inspecting,
                  ),
                },
                follow,
                carrier,
                offset,
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
