import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { answerCost, answerOf, answerRefusal, offered } from '../rules/schedule';
import type { Group, Stage } from '../rules/stages';
import {
  type Chronicle,
  type ChronicleCard,
  type Cost,
  capstoneLanded,
  type Deal,
  dealingCard,
  dealtCards,
  dealWaiting,
  type Ending,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { atWallClock } from './animation-speed';
import {
  ANSWER_WIDTH,
  type AnswerPlate,
  createAnswerColumn,
  createAnswerPlate,
  createLitPanel,
} from './answer-plate';
import { balancedWrap } from './balanced-wrap';
import { type Bind, boundTo } from './bindings';
import { countedStackOf, type SetAside, standBrowser, WINDOW_RIBBON } from './browse';
import { CARD_HEIGHT, createCardFace, type Name } from './card-face';
import { CARD_WIDTH } from './card-frames';
import { EASE, ended } from './card-motion';
import type { PileKind } from './cast';
import { pileStacksOf } from './collection-layout';
import {
  addText,
  type Box,
  DESIGN_WIDTH,
  MARGIN,
  ownBoxOf,
  placedWhileUp,
  type Stratum,
  screenSize,
  UI_FONT,
} from './design-space';
import { type EndingOf, standEnding } from './ending-screen';
import { type AnswerShown, answerShown, capstoneShown, eventName } from './event-text';
import { cardFace, cardFaceAtStart, type Face, namedFace, type SignsRead } from './face';
import { css, LOOK } from './look';
import { capstoneLore, captureLore, eventLore } from './lore';
import { raiseMenu } from './menu';
import { createMinimizeButton, createMinimized } from './minimize';
import type { OverlayScene } from './overlay-scene';
import type { Filled, Held, Panel } from './panel';
import { nameOver, pileOf } from './piles';
import { refused, type Said } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { type Reactions, reactionsOf, reactionsOfNames } from './stack';
import { buildingName, cardName, text } from './text';
import { namedOnce, type Reference } from './text-run';
import type { Tooltip } from './tooltip';

const GRID_GAP = 26;

/** How far the capstone's panel reaches over the cards its text names, under them and past them. */
const AROUND_CARDS = 16;

/**
 * How far under the screen's top the middle of the ribbon a deal's title and the capstone's stand on
 * stands, the deal window's minimized or not.
 */
const DEAL_RIBBON_MIDDLE = 113 + WINDOW_RIBBON / 2;

/**
 * How far under the ribbon's foot a window's lore starts, how wide it is broken, and how far under
 * its foot the row starts.
 */
const LORE_UNDER_RIBBON = 24;
const LORE_WIDTH = 600;
const ROW_UNDER_LORE = 32;

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  inspect(chronicle: Chronicle, card: ChronicleCard): void;
  /** What a name names shown large, as a right click on a name shows it wherever the name stands. */
  inspectNamed(name: Name): void;
  /** The capstone's window raised over the chronicle as it stands, closing onto the screen as it stood. */
  raiseCapstone(chronicle: Chronicle): void;
  /** Whether the deal window stands minimized. */
  minimized(): boolean;
  /** The minimized deal window brought back, whole at once and as it stood. */
  bringBack(): void;
  /**
   * Raises the capstone's window on the first render; after it, the deal window while the chronicle
   * waits on a deal and the ending screen once it has ended, and nothing while it runs.
   */
  render(chronicle: Chronicle): void;
  /**
   * Raises the capstone's window at the cue of the `capstone-landing` group, over the screen as it
   * stood before the landing, and holds the play-out until the window closes; raises the ending
   * screen on the stage that ends the chronicle.
   */
  play(stage: Stage): Promise<void> | undefined;
};

/**
 * One entry offered on the scrim — an answer, or copies of a card — what it costs the city, which its
 * note says, whether or not it wears a chip for it, what it is drawn refused by, and the number it
 * reacts to a press with.
 */
type Offered = {
  readonly costs: readonly Cost[];
  readonly refusal: Refusal;
  readonly at: number;
} & (
  | { readonly shows: 'answer'; readonly answer: AnswerShown }
  | { readonly shows: 'card'; readonly face: Face; readonly copies: number }
);

/** Copies of a card of the deck offered: nothing refuses them, and the face wears its own cost. */
function offeredCard(face: Face, at: number, copies: number): Offered {
  return { shows: 'card', face, copies, costs: face.costs, refusal: NO_REFUSAL, at };
}

/**
 * Where one offered entry was laid out: everything it draws, the box it reacts to the pointer over,
 * where a card says it lies, and how, and the box of the face or the answer itself, which a note
 * stands over.
 */
type Placed = Offered & {
  readonly part: Phaser.GameObjects.GameObject;
  readonly box: Box;
  readonly liesUnder?: (x: number, y: number) => boolean;
  readonly own: Box;
  readonly reactions: Reactions;
};

/**
 * An entry drawn and not yet laid: how wide and how tall it stands alone, and its laying from a top
 * left corner, as tall as its row.
 */
type Unlaid = {
  readonly width: number;
  readonly height: number;
  lay(left: number, top: number, height: number): Omit<Placed, keyof Offered>;
};

/** What a window on the scrim reads over what it holds: its title and its lore. */
type Titled = { readonly heading: string; readonly lore: string };

/** What the deal window reads: its title, its lore, and its entries in their order. */
type Dealt = Titled & { readonly entries: readonly Offered[] };

/** A pile's browse on the scrim, which selects nothing. */
type Browsing = { readonly stands: 'browse' };

/**
 * The deal window on the scrim: the chronicle whose first deal it stands, which its answers read
 * their numbers and their refusal off, whether it has risen whole, and the window set aside while it
 * stands minimized. It closes on the take alone.
 */
type Dealing = {
  readonly stands: 'deal';
  readonly on: Chronicle;
  readonly deal: Deal;
  whole: boolean;
  minimized: SetAside | undefined;
};

/**
 * The capstone's window on the scrim: the chronicle it was raised over, whose turn picks its lore,
 * and what raised it, which says where it closes onto. It holds no selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle } & {
  [R in Raising]: { readonly raised: R } & RaisedWith[R];
}[Raising];

/** What the capstone's window carries beside each raising: the landing's is told when it closes. */
type RaisedWith = {
  readonly opening: object;
  readonly landing: { readonly closed: () => void };
  readonly asked: object;
};

/** What raises the capstone's window: the screen opening, the capstone landing, or the player asking. */
type Raising = keyof RaisedWith;

/** What the scrim carries: a pile's browse, the deal window, the capstone's window, or the ending screen. */
type Carried = Browsing | Dealing | Capstone | { readonly stands: 'ending' };

/**
 * Where on the chronicle screen the deal window stands minimized, the bubble its button raises
 * there, and what is told each time the window is minimized or brought back.
 */
type Minimizing = {
  readonly on: Stratum;
  readonly tooltip: Tooltip;
  readonly switched: () => void;
};

/** What the chronicle screen hands its overlay. */
type OverlayOf = EndingOf & {
  readonly scene: OverlayScene;
  readonly catalogue: Catalogue;
  readonly signs: SignsRead;
  readonly covering: (covered: boolean) => void;
  readonly take: (at: number) => void;
  readonly minimizing: Minimizing;
};

/**
 * The scrim and what stands on it, on the overlay scene: nothing beneath reacts to a pointer while
 * anything stands, and `covering` is told as the scrim goes up and comes down. The ending screen
 * reads what `paid` answers once the chronicle has ended, and its button leaves through `leave`.
 */
export function createOverlay({
  scene,
  catalogue,
  signs,
  covering,
  take,
  paid,
  leave,
  minimizing,
}: OverlayOf): Overlay {
  const note = createRefusalNote(scene, scene.strata.note);
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  /** The deal standing, so no render raises its window twice; the take lets it go. */
  let standingDeal: Dealing | undefined;
  /** Whether the first render has opened the screen on the capstone's window. */
  let opened = false;

  const browser = standBrowser(scene, catalogue, signs, {
    covering,
    takes: (press) => takes(press),
    back: () => {
      back();
    },
    down: () => {
      note.hide();
    },
    risingLarge: () => {
      note.hide();
    },
  });
  const { inspecting, carries } = browser;
  const endingScreen = standEnding(browser, catalogue, { paid, leave });

  const close = (): void => {
    browser.close();
    carried = undefined;
  };

  /** What the scrim carries replaced, the scrim up for what is raised on it. */
  const raiseOnScrim = (what: Carried): void => {
    carried = what;
    void browser.raise();
  };

  /** What a name names, shown large on top of the stack, over whatever stands. */
  const inspectNamed = (name: Name): void => {
    inspecting.large.named(name);
  };

  /** What its names react with, and lighter under the pointer, as an answer is. */
  const litReactions = (plate: Pick<AnswerPlate, 'nameAt' | 'spotOf' | 'pointed'>): Reactions => {
    const names = reactionsOfNames(plate, inspecting);
    return {
      point(at) {
        names.point(at);
        plate.pointed(at !== undefined);
      },
      rests(at) {
        return names.rests(at);
      },
      inspect(at) {
        names.inspect(at);
      },
    };
  };

  /**
   * An answer's reactions: lit as `litReactions` has it, and, refused, what the note says of it in
   * the tooltip over it after a rest off its names.
   */
  const answerReactions = (plate: AnswerPlate, said: Said): Reactions => {
    const names = litReactions(plate);
    let saying = false;
    return {
      point(at) {
        names.point(at);
        const says = said.length > 0 && at !== undefined && !names.rests(at);
        if (says === saying) return;
        saying = says;
        if (says) nameOver(browser.tooltip, said.join('\n'), plate.boxOnSurface());
        else browser.tooltip.hide();
      },
      rests(at) {
        return said.length > 0 || names.rests(at);
      },
      inspect(at) {
        browser.tooltip.hide();
        names.inspect(at);
      },
    };
  };

  /**
   * An entry drawn, named `<name>-card-<n>` after its window and its place `n`, carrying what it
   * stands and the number it was offered as in its data: an answer as its plate, a card as its face,
   * several copies stacked.
   */
  const unlaidOf = (offered: Offered, name: string, index: number): Unlaid => {
    const named = `${name}-card-${index}`;
    switch (offered.shows) {
      case 'answer': {
        const plate = createAnswerPlate(scene, offered.answer, offered.refusal);
        plate.root.setName(named).setData('at', offered.at);
        return {
          width: ANSWER_WIDTH,
          height: plate.height,
          lay(left, top, height) {
            plate.root.setPosition(left, top);
            plate.standTall(height);
            const box = { x: left, y: top, width: ANSWER_WIDTH, height };
            return {
              part: plate.root,
              box,
              own: box,
              reactions: answerReactions(plate, refused(offered.costs, offered.refusal)),
            };
          },
        };
      }
      case 'card':
        return {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          lay(left, top) {
            if (offered.copies > 1) {
              const { stacked, root, box, liesUnder, reactions } = countedStackOf(
                { scene, inspecting },
                {
                  shown: offered.face,
                  copies: offered.copies,
                  left,
                  top,
                  name: named,
                  holder: `${name}-stack-${index}`,
                  refusal: offered.refusal,
                },
              );
              stacked.card.root.setData('at', offered.at);
              return { part: root, box, liesUnder, own: stacked.face, reactions };
            }
            const drawn = createCardFace(scene, offered.face, offered.refusal);
            drawn.root
              .setPosition(left + CARD_WIDTH / 2, top + CARD_HEIGHT)
              .setName(named)
              .setData('at', offered.at);
            const box = { x: left, y: top, width: CARD_WIDTH, height: CARD_HEIGHT };
            return {
              part: drawn.root,
              box,
              liesUnder: drawn.cardAt,
              own: box,
              reactions: reactionsOf(drawn, offered.face, inspecting),
            };
          },
        };
    }
  };

  /**
   * An entry laid, a left click on it running `press` where it answers one, and that click refused
   * where the rules refuse the entry, which darkens an answer.
   */
  const heldOf = (entry: Placed, press: () => (() => void) | undefined): Held => ({
    box: entry.box,
    liesUnder: entry.liesUnder,
    reactions: entry.reactions,
    get press() {
      return press();
    },
    refused: () => press() !== undefined && !playable(entry.refusal),
  });

  /**
   * A window laid from its title down: its title on the kit's ribbon, its lore, then what `body`
   * lays from the top it is handed, the deal row's under the lore; the lore stands over what scrolls
   * under it. Answers the panel, and the box the ribbon is painted on.
   */
  const layWindow = (
    name: string,
    { heading, lore }: Titled,
    body: (top: number) => Filled,
  ): { readonly panel: Panel; readonly ribbon: () => Box } => {
    const { foot: ribbonFoot, ribbon } = browser
      .raiseTitle(name, heading)
      .standAt(DEAL_RIBBON_MIDDLE);
    const told = addText(scene, 0, 0, lore, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: css(LOOK.paleInk),
      align: 'center',
      wordWrap: balancedWrap(LORE_WIDTH),
    })
      .setName(`${name}-lore`)
      .setOrigin(0.5, 0);
    told.setY(ribbonFoot + LORE_UNDER_RIBBON + told.y - ownBoxOf(told).y);

    const panel = browser.lay({
      name,
      top: ribbonFoot + MARGIN,
      ...body(told.y + told.height + ROW_UNDER_LORE),
    });
    carries(
      placedWhileUp(told, () => {
        told.setX(screenSize().width / 2);
      }),
    );
    return { panel, ribbon };
  };

  /**
   * The window's entries in centred rows from `top`, each as tall as its tallest, a left click on
   * one running `pressed` while `live` holds.
   */
  const rowsOf = (
    name: string,
    entries: readonly Offered[],
    top: number,
    pressed: (entry: Placed) => void,
    live: () => boolean,
  ): Filled => {
    const room = DESIGN_WIDTH - 2 * MARGIN;
    const unlaid = entries.map((offered, index) => unlaidOf(offered, name, index));
    const width = Math.max(...unlaid.map((each) => each.width));
    const columns = Math.max(1, Math.floor((room + GRID_GAP) / (width + GRID_GAP)));

    const placed: Placed[] = [];
    let rowTop = top;
    for (let first = 0; first < entries.length; first += columns) {
      const row = unlaid.slice(first, first + columns);
      const height = Math.max(...row.map((each) => each.height));
      const spanX = row.length * width + (row.length - 1) * GRID_GAP;
      for (const [column, each] of row.entries()) {
        const left = (DESIGN_WIDTH - spanX) / 2 + column * (width + GRID_GAP);
        placed.push({ ...entries[first + column], ...each.lay(left, rowTop, height) });
      }
      rowTop += height + GRID_GAP;
    }
    return {
      parts: placed.map(({ part }) => part),
      held: placed.map((entry) =>
        heldOf(entry, () =>
          live()
            ? () => {
                pressed(entry);
              }
            : undefined,
        ),
      ),
      foot: rowTop - GRID_GAP,
    };
  };

  /**
   * The capstone on one panel from `top`, its column beside a card to each thing its text names, a
   * left click anywhere on the panel running `closing`.
   */
  const capstoneOnPanel = (shown: AnswerShown, top: number, closing: () => void): Filled => {
    const column = createAnswerColumn(scene, shown, NO_REFUSAL);
    column.root.setName('capstone-card-0');
    const placed = namedOnce(column.named).map(({ reference, number }, at): Placed => {
      const face = namedFace(catalogue, reference, shown.reading, signs());
      const offered = offeredCard(face, at, copiesOf(reference, number));
      const left = ANSWER_WIDTH + GRID_GAP + at * (CARD_WIDTH + GRID_GAP);
      return {
        ...offered,
        ...unlaidOf(offered, 'capstone-named', at).lay(left, AROUND_CARDS, CARD_HEIGHT),
      };
    });
    const width =
      placed.length === 0
        ? ANSWER_WIDTH
        : Math.max(...placed.map(({ box }) => box.x + box.width)) + AROUND_CARDS;
    const height = Math.max(
      column.height,
      placed.length === 0 ? 0 : CARD_HEIGHT + 2 * AROUND_CARDS,
    );
    column.root.setY((height - column.height) / 2);
    const lit = createLitPanel(scene, 0xffffff);
    lit.panel.setName('capstone-plate');
    lit.stand({ x: 0, y: 0, width, height });

    const left = (DESIGN_WIDTH - width) / 2;
    const holder = scene.add.container(left, top, [
      lit.panel,
      lit.veil,
      column.root,
      ...placed.map(({ part }) => part),
    ]);
    const onPanel = (box: Box): Box => ({ ...box, x: left + box.x, y: top + box.y });
    const whole: Held = {
      box: onPanel({ x: 0, y: 0, width, height }),
      reactions: litReactions({
        nameAt: column.nameAt,
        spotOf: column.spotOf,
        pointed(on) {
          lit.veil.setVisible(on);
        },
      }),
      press: closing,
    };
    return {
      parts: [holder],
      held: [
        ...placed.map((entry) => heldOf({ ...entry, box: onPanel(entry.box) }, () => closing)),
        whole,
      ],
      foot: top + height,
    };
  };

  /** A pile's browse raised, laid out as the civilization's browse lays out a civilization. */
  const showBrowse = (pile: PileKind, chronicle: Chronicle): void => {
    const cards = pileOf(chronicle, pile);
    carried = { stands: 'browse' };
    browser.browse({
      name: 'browse',
      heading: text(`browse.${pile}`, { count: cards.length }),
      stacks: pileStacksOf(catalogue, cards, cardName).map(({ card, copies }) => ({
        shown: cardFace(catalogue, card, chronicle.citySection.building),
        copies,
        edged: false,
      })),
    });
  };

  /**
   * The deal window risen out of nothing, everything the scrim's stratum holds fading in together, and
   * whole once the fade has ended.
   */
  const riseWhole = (dealing: Dealing): Promise<void> => {
    const { layer } = scene.strata.scrim;
    const fade = atWallClock(
      scene,
      scene.tweens.add({
        targets: layer.setAlpha(0),
        alpha: 1,
        duration: 1000 / 3,
        ease: EASE,
      }),
    );
    return ended(fade).then(() => {
      dealing.whole = true;
    });
  };

  /**
   * The deal window raised, rising out of nothing, taking a left click on an entry and on its Minimize
   * button once it stands whole. It closes on the take alone, and the landing plays out under the
   * caller.
   */
  const showDeal = (dealing: Dealing): void => {
    raiseOnScrim(dealing);
    standingDeal = dealing;

    const { entries, ...titled } = dealt(catalogue, dealing.on, dealing.deal);
    const { panel, ribbon } = layWindow('deal', titled, (top) =>
      rowsOf(
        'deal',
        entries,
        top,
        ({ costs, refusal, own, at }) => {
          if (!playable(refusal)) {
            const { x, y, width } = own;
            const { across, offset } = panel;
            browser.tooltip.hide();
            note.overCard(refused(costs, refusal), x + width / 2 + across, y - offset);
            return;
          }
          standingDeal = undefined;
          close();
          take(at);
        },
        () => dealing.whole,
      ),
    );
    const button = createMinimizeButton(
      scene,
      scene.strata.scrim,
      browser.tooltip,
      { name: 'deal-minimize', ribbon, sunk: false, live: () => dealing.whole },
      () => {
        browser.tooltip.hide();
        dealing.minimized = browser.setAside();
        carried = undefined;
        minimizedDeal.show(titled.heading);
        minimizing.switched();
      },
    );
    carries(button.face);
    carries(button.sign);
    void riseWhole(dealing).then(() => {
      button.dress();
    });
  };

  const bringBack = (): void => {
    const dealing = standingDeal;
    const aside = dealing?.minimized;
    if (dealing === undefined || aside === undefined) {
      throw new Error('no deal window stands minimized');
    }
    dealing.minimized = undefined;
    minimizedDeal.hide();
    minimizing.switched();
    carried = dealing;
    aside.standAgain();
  };

  const minimizedDeal = createMinimized(
    minimizing.on,
    minimizing.tooltip,
    DEAL_RIBBON_MIDDLE,
    bringBack,
  );

  /**
   * The capstone's window closed: the opening's closes onto the screen as the chronicle stands, the
   * landing's is told it closed once the scrim is down, and the one the player asked for closes onto
   * the screen as it stood.
   */
  const closeCapstone = (closing: Capstone): void => {
    close();
    switch (closing.raised) {
      case 'opening':
        standAs(closing.on);
        return;
      case 'landing':
        closing.closed();
        return;
      case 'asked':
        return;
    }
    const unlisted: never = closing;
    throw new Error(`no raising is ${JSON.stringify(unlisted)}`);
  };

  /**
   * The capstone's window raised, reading the lore of the moment. A left press on its panel closes
   * the window, as a press beside it does.
   */
  const showCapstone = (announcement: Capstone): void => {
    raiseOnScrim(announcement);

    const { on } = announcement;
    const shown = capstoneShown(catalogue, on);
    const titled: Titled = {
      heading: text('capstone.word'),
      lore: capstoneLore(shown.id, capstoneLanded(on) ? 'landing' : 'opening'),
    };
    layWindow('capstone', titled, (top) =>
      capstoneOnPanel(shown, top, () => {
        closeCapstone(announcement);
      }),
    );
  };

  /** The ending screen raised as the chronicle ends: it stands on the scrim for good. */
  const raiseEnding = (chronicle: Chronicle, ending: Ending): Promise<void> => {
    carried = { stands: 'ending' };
    return endingScreen.raise(chronicle, ending);
  };

  /** What stands over the chronicle as it stands: its ending screen, else the deal it waits on. */
  const standAs = (chronicle: Chronicle): void => {
    if (chronicle.ending !== undefined && !endingScreen.raised)
      void raiseEnding(chronicle, chronicle.ending);
    else if (chronicle.deals[0] !== undefined && standingDeal === undefined)
      showDeal({
        stands: 'deal',
        on: chronicle,
        deal: chronicle.deals[0],
        whole: false,
        minimized: undefined,
      });
    else endingScreen.stand();
  };

  const back = (): boolean => {
    if (carried === undefined) return false;
    switch (carried.stands) {
      case 'browse':
        close();
        return true;
      case 'capstone':
        closeCapstone(carried);
        return true;
      case 'deal':
      case 'ending':
        return false;
    }
  };

  const grouped = (stage: Group): Promise<void> | undefined => {
    switch (stage.name) {
      case 'capstone-landing':
        return new Promise((closed) => {
          showCapstone({ stands: 'capstone', on: stage.chronicle, raised: 'landing', closed });
        });
      case 'capstone-continued':
      case 'played':
      case 'refused':
      case 'assign':
      case 'claim':
      case 'neutral-played':
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'choice':
      case 'attack':
      case 'capture':
        return undefined;
    }
  };

  /**
   * Every press the scrim holds while anything stands on it and no card stands large over it: the
   * back key walks what stands back and raises the menu where it has nothing left to walk, and every
   * other key is swallowed.
   */
  const takes = (press: Bind): boolean => {
    if (carried === undefined) return false;
    if (boundTo(press, 'back') && !back()) raiseMenu(scene);
    return true;
  };

  return {
    browse: showBrowse,
    inspect(chronicle: Chronicle, card: ChronicleCard): void {
      inspecting.large.show(cardFace(catalogue, card, chronicle.citySection.building));
    },
    inspectNamed,
    raiseCapstone(chronicle: Chronicle): void {
      showCapstone({ stands: 'capstone', on: chronicle, raised: 'asked' });
    },
    minimized(): boolean {
      return standingDeal?.minimized !== undefined;
    },
    bringBack,
    render(chronicle: Chronicle): void {
      if (opened) {
        standAs(chronicle);
        return;
      }
      opened = true;
      showCapstone({ stands: 'capstone', on: chronicle, raised: 'opening' });
    },
    play(stage: Stage): Promise<void> | undefined {
      switch (stage.kind) {
        case 'change':
          break;
        case 'group':
          if (stage.stages.length > 0) return grouped(stage);
          break;
      }
      const { ending } = stage.chronicle;
      if (ending !== undefined && !endingScreen.raised) return raiseEnding(stage.chronicle, ending);
      // A deal stands before its play-out ends — a capture's before the captures after it resolve, a
      // card's before what its play reads — so the window waits for the render the play-out ends
      // on, which a render of this stage would pre-empt.
      return dealWaiting(stage.chronicle) ? Promise.resolve() : undefined;
    },
  };
}

/** The copies a name stands for: a card's the number written before it, one where none is; anything else's one. */
function copiesOf(reference: Reference, number: string | undefined): number {
  return reference.kind === 'card' && number !== undefined ? Number(number) : 1;
}

/**
 * What the deal window reads of a deal: its title, what stands where the lore does, and its entries
 * in the order dealt — an answer as it reads on the chronicle, with what refuses it there, a reward as
 * the card of the deck it is, in its copies, a card dealt as the card of the pile it is.
 */
function dealt(catalogue: Catalogue, chronicle: Chronicle, deal: Deal): Dealt {
  const { building } = chronicle.citySection;
  switch (deal.of) {
    case 'event':
      return {
        heading: eventName(deal.event),
        lore: eventLore(deal.event),
        entries: offered(catalogue, chronicle, deal).map(
          (id, at): Offered => ({
            shows: 'answer',
            answer: answerShown(catalogue, chronicle, deal.event, id),
            costs: answerCost(catalogue, chronicle, answerOf(catalogue, deal.event, id)),
            refusal: answerRefusal(catalogue, chronicle, deal.event, id),
            at,
          }),
        ),
      };
    case 'capture':
      return {
        heading: buildingName(deal.building),
        lore: captureLore(deal.building),
        entries: offered(catalogue, chronicle, deal).map((id, at) =>
          offeredCard(cardFaceAtStart(catalogue, id, building), at, deal.rewards[id]),
        ),
      };
    case 'card':
      return {
        heading: cardName(dealingCard(chronicle, deal).id),
        lore: text('deal.card'),
        entries: dealtCards(chronicle, deal).map((card, at) =>
          offeredCard(cardFace(catalogue, card, building), at, 1),
        ),
      };
  }
}
