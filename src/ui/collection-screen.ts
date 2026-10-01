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
import { type CardId, NO_REFUSAL } from '../rules/state';
import { inspectingUnder, standBrowse } from './browse';
import { createCardFace, createKindBubble, metricsOf } from './card-face';
import { createPile, PILE_SPAN } from './civilization-pile';
import {
  type CollectionStack,
  countsOf,
  type DeckRows,
  deckRowsOf,
  heldIn,
  stacksOf,
  standingIn,
} from './collection-layout';
import {
  type Cell,
  COLLECTION_CARD_WIDTH,
  linesOf,
  priceButtonOf,
  type Reading,
  spanOf,
  stackOf,
} from './collection-stack';
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
import { cardFaceAtStart } from './face';
import { onScrollKeys, onWheel } from './keys';
import { css, LOOK } from './look';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { ROOM, wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import {
  createCarrier,
  createPanel,
  type Filled,
  type Held,
  type Panel,
  type Surface,
} from './panel';
import { campaignHeld, keepCampaign } from './save-entry';
import { createSmallCards } from './small-card';
import type { Inspecting } from './stack';
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

/**
 * The mode the screen stands in, the civilization it shows where it shows one, and in the
 * civilization mode the rows its deck held as the mode opened, which stand until it is left.
 */
type Mode =
  | { readonly shows: 'collection' }
  | { readonly shows: 'deck editing'; readonly civilization: string }
  | { readonly shows: 'civilization'; readonly civilization: string; readonly stood: DeckRows };

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

/** What a stack of the collection answers a left click with, and the box a press held on it lands in. */
type Moves = {
  readonly pressOf: (stack: CollectionStack) => (() => void) | undefined;
  readonly lands: Box;
};

/**
 * The campaign's collection as stacks from the top handed, `across` to a line, the lines centred
 * between the room's left and `right`, each reading what `readingOf` says and moving where `moves`
 * are handed, its price a button; an affordable price runs `buy`.
 */
function collectionOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  campaign: Campaign,
  { top, right, across }: { top: number; right: number; across: number },
  readingOf: (stack: CollectionStack) => Reading,
  moves: Moves | undefined,
  buy: (card: CardId) => void,
  inspecting: Inspecting,
): Filled {
  const stacks = stacksOf(catalogue, campaign.collection, cardName);
  const cells = stacks.map(
    (stack): Cell =>
      ({ left, top }) => {
        const { id } = stack;
        const laid = stackOf(scene, catalogue, {
          stack,
          left,
          top,
          name: 'collection',
          reading: readingOf(stack),
          inspecting,
        });
        const price = priceButtonOf(scene, laid, {
          name: `collection-card-${id}`,
          price: priceOf(catalogue, campaign, id),
          buy: unaffordableIn(catalogue, campaign, id)
            ? undefined
            : () => {
                buy(id);
              },
        });
        const { box } = laid.face;
        const face: Held =
          moves === undefined
            ? laid.face
            : {
                ...laid.face,
                press: moves.pressOf(stack),
                carry: {
                  copy: () =>
                    createCardFace(scene, cardFaceAtStart(catalogue, id), NO_REFUSAL, {
                      width: COLLECTION_CARD_WIDTH,
                    })
                      .root.setPosition(box.x + box.width / 2, box.y + box.height)
                      .setName('carried-card')
                      .setData('card', id),
                  lands: moves.lands,
                },
              };
        return { parts: [laid.root], held: [face, price], bottom: laid.bottom };
      },
  );
  return linesOf(cells, { left: (ROOM.x + right - spanOf(across)) / 2, top, across });
}

/**
 * The campaign's civilizations top down from the top handed, each its pile, centred in the right
 * panel from its left handed; a press on a pile opens its civilization, a right click raises its
 * browse.
 */
function civilizationsOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  { top, frame }: { top: number; frame: Box },
  {
    open,
    browse,
  }: { open: (civilization: string) => void; browse: (civilization: string) => void },
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
      () => {
        browse(id);
      },
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
    backRaisesMenu(this);
    const away = awayUnder(this);
    const overlay = overlayOf(this);
    const { large, open: browse } = standBrowse(overlay, CATALOGUE, (up) => {
      away('overlay', up);
    });
    resetMenu(this, (under) => {
      away('menu', under);
      if (under) overlay.input.emit(COVERED);
    });
    offerEntries(this, { seed: undefined, veiled: undefined });
    let laid: { readonly head: Phaser.GameObjects.Container; readonly panels: Panel[] } | undefined;
    const kinds = createKindBubble(tooltip);
    const small = createSmallCards(this, bubbles, CATALOGUE, kinds, (name) => {
      inspecting.large.named(name);
    });
    const inspecting = inspectingUnder(bubbles, small, kinds, large, () => {
      for (const panel of laid?.panels ?? []) panel.holdStill();
    });
    const screen = this.add.container(0, 0).setName('collection');
    content.add(screen);
    const panels = stratumOf(content, this.cameras.main);
    const follow = (): void => {
      inspecting.small.follow();
      tooltip.follow();
    };
    const carrier = createCarrier(this, panels);
    const surface: Surface = { scene: this, on: panels, follow, carrier };

    onScrollKeys(this, (way, delta) => {
      for (const panel of laid?.panels ?? []) if (panel.pointed) panel.pan(way, delta);
    });
    onWheel(this, (by, over) => {
      for (const panel of laid?.panels ?? []) if (panel.under(over)) panel.wheel(by);
    });

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
                surface,
                {
                  name: 'collection-panel',
                  frame: left,
                  ...collectionOf(
                    this,
                    CATALOGUE,
                    campaign,
                    { top, right: divide, across },
                    reading,
                    undefined,
                    buy,
                    inspecting,
                  ),
                },
                leftOffset,
              ),
              createPanel(
                surface,
                {
                  name: 'civilizations-panel',
                  frame,
                  ...civilizationsOf(
                    this,
                    CATALOGUE,
                    campaign.civilizations,
                    { top, frame },
                    {
                      open: (civilization) => {
                        lay({ shows: 'deck editing', civilization });
                      },
                      browse: (civilization) => {
                        browse(campaignHeld(), civilization);
                      },
                    },
                    inspecting,
                  ),
                },
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
          const deck = deckRowsOf(CATALOGUE, campaign, civilization, cardName);
          const onward = modeButtonOf(
            this,
            text('collection.to-civilization'),
            { x: frame.x + MARGIN, y: middle, to: 'right' },
            'collection-to-civilization',
          );
          onClick(onward.face, () => {
            lay({ shows: 'civilization', civilization, stood: deck });
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
                surface,
                {
                  name: 'collection-panel',
                  frame: left,
                  ...collectionOf(
                    this,
                    CATALOGUE,
                    campaign,
                    { top, right: divide, across },
                    reading,
                    { pressOf: add, lands: civilizationSide },
                    buy,
                    inspecting,
                  ),
                },
                leftOffset,
              ),
              createPanel(
                surface,
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
                      radius: metricsOf(COLLECTION_CARD_WIDTH).radius,
                    },
                    inspecting,
                  ),
                },
                rightOffset,
              ),
            ],
          };
          return;
        }
        case 'civilization': {
          const { civilization, stood } = mode;
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
                surface,
                {
                  name: 'civilization-mode-panel',
                  frame: { x: ROOM.x, y: top, width: right, height },
                  ...civilizationPanelOf(
                    this,
                    CATALOGUE,
                    {
                      city: owned.city.card.id,
                      deck: standingIn(
                        stood,
                        deckRowsOf(CATALOGUE, campaign, civilization, cardName),
                      ),
                      counts: countsOf(owned),
                      campaign,
                      moves: {
                        remove: (card) => {
                          edit(mode, (held) => removedFrom(CATALOGUE, held, civilization, card));
                        },
                        add: (card) => {
                          edit(mode, (held) => addedTo(CATALOGUE, held, civilization, card));
                        },
                        buy: (card) => {
                          edit(mode, (held) =>
                            addedTo(CATALOGUE, bought(CATALOGUE, held, card), civilization, card),
                          );
                        },
                      },
                    },
                    {
                      left: (ROOM.x + DESIGN_WIDTH - spanOf(across)) / 2,
                      top,
                      across,
                      radius: metricsOf(COLLECTION_CARD_WIDTH).radius,
                    },
                    inspecting,
                  ),
                },
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
