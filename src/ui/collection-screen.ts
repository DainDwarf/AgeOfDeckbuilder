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
import { type CardId, NO_REFUSAL } from '../rules/state';
import { standBrowse } from './browse';
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
import { type Laying, layingOf } from './stack';
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

type ModeOf<Shows extends Mode['shows']> = Extract<Mode, { readonly shows: Shows }>;

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

/** What a mode of the collection screen is laid with: what its pieces are laid with, and the surface its panels stand on. */
type Screen = Laying &
  Surface & {
    /** The screen laid in the mode, its panels at the offsets handed, in order, or at their tops. */
    readonly lay: (mode: Mode, offsets?: readonly number[]) => void;
    /** The campaign moved and kept, and the screen laid again in the mode, its panels where they stood. */
    readonly edit: (mode: Mode, move: (held: Campaign) => Campaign) => void;
    /** The browse of the campaign's civilization of that name raised. */
    readonly browse: (civilization: string) => void;
  };

/** A mode as it stands: its head, and its panels in order. */
type Laid = { readonly head: Phaser.GameObjects.Container; readonly panels: readonly Panel[] };

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
  laying: Laying,
  campaign: Campaign,
  { top, right, across }: { top: number; right: number; across: number },
  readingOf: (stack: CollectionStack) => Reading,
  moves: Moves | undefined,
  buy: (card: CardId) => void,
): Filled {
  const { scene, catalogue } = laying;
  const stacks = stacksOf(catalogue, campaign.collection, cardName);
  const cells = stacks.map(
    (stack): Cell =>
      ({ left, top }) => {
        const { id } = stack;
        const laid = stackOf(laying, {
          stack,
          left,
          top,
          name: 'collection',
          reading: readingOf(stack),
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
  laying: Laying,
  civilizations: Readonly<Record<string, CampaignCivilization>>,
  { top, frame }: { top: number; frame: Box },
  {
    open,
    browse,
  }: { open: (civilization: string) => void; browse: (civilization: string) => void },
): Filled {
  const { scene } = laying;
  const left = frame.x + (frame.width - PILE_SPAN) / 2;
  const parts: Phaser.GameObjects.Container[] = [];
  const held: Held[] = [];
  let pileTop = top;
  let foot = top;
  for (const [id, owned] of Object.entries(civilizations)) {
    const name = `collection-civilization-${id}`;
    const pile = createPile(laying, owned, { left, top: pileTop, selected: false }, name, () => {
      browse(id);
    });
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

function wordOf(scene: Phaser.Scene, label: string, x: number): Phaser.GameObjects.Text {
  return addText(scene, x, PANE_TOP, label, WORD_STYLE).setOrigin(0.5, 0);
}

/** Where the panels start under a word of the head, how tall they stand, and the height of the word's middle. */
function underOf(shown: Phaser.GameObjects.Text): { top: number; height: number; middle: number } {
  const top = shown.y + shown.height + WORD_GAP;
  return { top, height: DESIGN_HEIGHT - MARGIN - top, middle: shown.y + shown.height / 2 };
}

/** The collection's word and the line between the panels, where they divide, and both panels' frames under them. */
type Sides = {
  readonly shared: Phaser.GameObjects.GameObject[];
  readonly top: number;
  readonly middle: number;
  readonly divide: number;
  readonly left: Box;
  readonly frame: Box;
};

/** The sides of a mode whose right panel stands `right` wide. */
function sidesOf(scene: Phaser.Scene, right: number): Sides {
  const divide = DESIGN_WIDTH - right;
  const cards = wordOf(scene, text('collection.collection'), (ROOM.x + divide) / 2);
  const { top, height, middle } = underOf(cards);
  const edge = scene.add
    .rectangle(divide, ROOM.y, 1, ROOM.height, LOOK.panelDivide)
    .setOrigin(0, 0);
  return {
    shared: [edge, cards],
    top,
    middle,
    divide,
    left: { x: ROOM.x, y: top, width: divide - ROOM.x, height },
    frame: { x: divide + 1, y: top, width: right - 1, height },
  };
}

/** What an affordable price in the collection panel runs: the card bought, the screen laid again in the mode. */
function buyIn(screen: Screen, mode: Mode): (card: CardId) => void {
  return (card) => {
    screen.edit(mode, (held) => bought(screen.catalogue, held, card));
  };
}

/** The collection mode: the collection on the left and the civilizations on the right, each panel under its word. */
function collectionModeOf(
  screen: Screen,
  mode: ModeOf<'collection'>,
  campaign: Campaign,
  [leftOffset, rightOffset]: readonly number[],
): Laid {
  const { scene } = screen;
  const { right, across } = shapeOf(mode);
  const { shared, top, divide, left, frame } = sidesOf(scene, right);
  const civilizations = wordOf(scene, text('collection.civilizations'), divide + right / 2);
  const head = scene.add.container(0, 0, [...shared, civilizations]).setName('collection-mode');
  const reading = ({ copies }: CollectionStack): Reading => ({
    reads: text('collection.copies', { copies }),
    dimmed: false,
  });
  return {
    head,
    panels: [
      createPanel(
        screen,
        {
          name: 'collection-panel',
          frame: left,
          ...collectionOf(
            screen,
            campaign,
            { top, right: divide, across },
            reading,
            undefined,
            buyIn(screen, mode),
          ),
        },
        leftOffset,
      ),
      createPanel(
        screen,
        {
          name: 'civilizations-panel',
          frame,
          ...civilizationsOf(
            screen,
            campaign.civilizations,
            { top, frame },
            {
              open: (civilization) => {
                screen.lay({ shows: 'deck editing', civilization });
              },
              browse: screen.browse,
            },
          ),
        },
        rightOffset,
      ),
    ],
  };
}

/**
 * The deck editing mode's head over its sides: the way back to the collection, the way on to the
 * civilization mode carrying the deck's rows as they stand, and the civilization's name.
 */
function deckEditingHeadOf(
  screen: Screen,
  { civilization, deck }: { readonly civilization: string; readonly deck: DeckRows },
  { shared, middle, divide, frame }: Sides,
): Phaser.GameObjects.Container {
  const { scene } = screen;
  const back = modeButtonOf(
    scene,
    text('collection.to-collection'),
    { x: divide - MARGIN, y: middle, to: 'left' },
    'collection-to-collection',
  );
  onClick(back.face, () => {
    screen.lay({ shows: 'collection' });
  });
  const onward = modeButtonOf(
    scene,
    text('collection.to-civilization'),
    { x: frame.x + MARGIN, y: middle, to: 'right' },
    'collection-to-civilization',
  );
  onClick(onward.face, () => {
    screen.lay({ shows: 'civilization', civilization, stood: deck });
  });
  const name = addText(
    scene,
    DESIGN_WIDTH - MARGIN,
    PANE_TOP,
    civilizationName(civilization),
    WORD_STYLE,
  )
    .setOrigin(1, 0)
    .setName('deck-civilization');
  return scene.add
    .container(0, 0, [...shared, ...back.parts, ...onward.parts, name])
    .setName('deck-editing-mode');
}

/** The deck editing mode: the collection beside the civilization being edited. */
function deckEditingModeOf(
  screen: Screen,
  mode: ModeOf<'deck editing'>,
  campaign: Campaign,
  [leftOffset, rightOffset]: readonly number[],
): Laid {
  const { scene, catalogue } = screen;
  const { civilization } = mode;
  const { right, across } = shapeOf(mode);
  const sides = sidesOf(scene, right);
  const { top, divide, left, frame } = sides;
  const deck = deckRowsOf(catalogue, campaign, civilization, cardName);
  const head = deckEditingHeadOf(screen, { civilization, deck }, sides);
  const reading = ({ id, copies }: CollectionStack): Reading => {
    const held = heldIn(deck, id);
    return { reads: text('collection.in-deck', { held, copies }), dimmed: held === copies };
  };
  const add = ({ id, copies }: CollectionStack): (() => void) | undefined =>
    heldIn(deck, id) < copies
      ? () => {
          screen.edit(mode, (held) => addedTo(catalogue, held, civilization, id));
        }
      : undefined;
  const remove = (card: CardId): void => {
    screen.edit(mode, (held) => removedFrom(catalogue, held, civilization, card));
  };
  const owned = campaign.civilizations[civilization];
  const collectionSide: Box = { ...ROOM, width: divide - ROOM.x };
  const civilizationSide: Box = { ...ROOM, x: divide, width: DESIGN_WIDTH - divide };
  return {
    head,
    panels: [
      createPanel(
        screen,
        {
          name: 'collection-panel',
          frame: left,
          ...collectionOf(
            screen,
            campaign,
            { top, right: divide, across },
            reading,
            { pressOf: add, lands: civilizationSide },
            buyIn(screen, mode),
          ),
        },
        leftOffset,
      ),
      createPanel(
        screen,
        {
          name: 'civilization-panel',
          frame,
          ...deckPanelOf(
            screen,
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
          ),
        },
        rightOffset,
      ),
    ],
  };
}

/** The civilization mode: the civilization alone, its deck's rows standing where the mode opened them. */
function civilizationModeOf(
  screen: Screen,
  mode: ModeOf<'civilization'>,
  campaign: Campaign,
  [offset]: readonly number[],
): Laid {
  const { scene, catalogue } = screen;
  const { civilization, stood } = mode;
  const { right, across } = shapeOf(mode);
  const title = wordOf(
    scene,
    text('collection.civilization-title', { civilization: civilizationName(civilization) }),
    ROOM.x + ROOM.width / 2,
  ).setName('civilization-title');
  const { top, height, middle } = underOf(title);
  const back = modeButtonOf(
    scene,
    text('collection.to-collection'),
    { x: ROOM.x + MARGIN, y: middle, to: 'right' },
    'collection-to-deck-editing',
  );
  onClick(back.face, () => {
    screen.lay({ shows: 'deck editing', civilization });
  });
  const head = scene.add.container(0, 0, [title, ...back.parts]).setName('civilization-mode');
  const owned = campaign.civilizations[civilization];
  return {
    head,
    panels: [
      createPanel(
        screen,
        {
          name: 'civilization-mode-panel',
          frame: { x: ROOM.x, y: top, width: right, height },
          ...civilizationPanelOf(
            screen,
            {
              city: owned.city.card.id,
              deck: standingIn(stood, deckRowsOf(catalogue, campaign, civilization, cardName)),
              counts: countsOf(owned),
              campaign,
              moves: {
                remove: (card) => {
                  screen.edit(mode, (held) => removedFrom(catalogue, held, civilization, card));
                },
                add: (card) => {
                  screen.edit(mode, (held) => addedTo(catalogue, held, civilization, card));
                },
                buy: (card) => {
                  screen.edit(mode, (held) =>
                    addedTo(catalogue, bought(catalogue, held, card), civilization, card),
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
          ),
        },
        offset,
      ),
    ],
  };
}

/** The mode laid on the campaign handed, its panels at the offsets handed. */
function modeLaid(
  screen: Screen,
  mode: Mode,
  campaign: Campaign,
  offsets: readonly number[],
): Laid {
  switch (mode.shows) {
    case 'collection':
      return collectionModeOf(screen, mode, campaign, offsets);
    case 'deck editing':
      return deckEditingModeOf(screen, mode, campaign, offsets);
    case 'civilization':
      return civilizationModeOf(screen, mode, campaign, offsets);
  }
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
    let laid: Laid | undefined;
    const laying = layingOf(this, CATALOGUE, {
      on: bubbles,
      smallOn: bubbles,
      kinds: createKindBubble(tooltip),
      large,
      rising: () => {
        for (const panel of laid?.panels ?? []) panel.holdStill();
      },
    });
    const { inspecting } = laying;
    const root = this.add.container(0, 0).setName('collection');
    content.add(root);
    const panels = stratumOf(content, this.cameras.main);
    const carrier = createCarrier(this, panels);

    onScrollKeys(this, (way, delta) => {
      for (const panel of laid?.panels ?? []) if (panel.pointed) panel.pan(way, delta);
    });
    onWheel(this, (by, over) => {
      for (const panel of laid?.panels ?? []) if (panel.under(over)) panel.wheel(by);
    });

    const screen: Screen = {
      ...laying,
      on: panels,
      follow: () => {
        inspecting.small.follow();
        tooltip.follow();
      },
      carrier,
      lay: (mode, offsets = []) => {
        inspecting.small.down();
        carrier.down();
        if (laid !== undefined) {
          for (const panel of laid.panels) panel.down();
          laid.head.destroy();
        }
        readInfluence();
        laid = modeLaid(screen, mode, campaignHeld(), offsets);
        root.add(laid.head);
      },
      edit: (mode, move) => {
        keepCampaign(move(campaignHeld()));
        screen.lay(
          mode,
          laid?.panels.map(({ offset }) => offset),
        );
      },
      browse: (civilization) => {
        browse(campaignHeld(), civilization);
      },
    };

    screen.lay({ shows: 'collection' });
  }
}
