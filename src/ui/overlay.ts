import type Phaser from 'phaser';
import type { Catalogue } from '../rules/catalogue';
import { answerCost, answerOf, answerRefusal, offered } from '../rules/schedule';
import type { Group, Stage } from '../rules/stages';
import {
  type Chronicle,
  type ChronicleCard,
  type Cost,
  type Deal,
  dealingCard,
  dealtCards,
  type Ending,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { ANSWER_WIDTH, createAnswerPlate } from './answer-plate';
import { type Bind, boundTo } from './bindings';
import { badgedStackOf, standBrowser } from './browse';
import { CARD_HEIGHT, createCardFace, type Name } from './card-face';
import { CARD_WIDTH } from './card-frames';
import { EASE, ended } from './card-motion';
import { pileStacksOf } from './collection-layout';
import {
  addText,
  type Box,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  headingOf,
  MARGIN,
  TITLE_INK,
  UI_FONT,
} from './design-space';
import { type EndingOf, standEnding } from './ending-screen';
import { type AnswerShown, answerShown, capstoneShown, eventName } from './event-text';
import { cardFace, cardFaceAtStart, type Face } from './face';
import { capstoneLore, captureLore, eventLore, type Raising } from './lore';
import { raiseMenu } from './menu-scene';
import type { OverlayScene } from './overlay-scene';
import type { Held, Panel } from './panel';
import { type PileKind, pileOf } from './piles';
import { refused } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { type Reactions, reactionsOf, reactionsOfNames } from './stack';
import { buildingName, cardName, text } from './text';

const GRID_GAP = 26;

/** Where a window's lore ends and its row starts, from the screen's top, whatever it deals. */
const LORE_FOOT = 262;
const ROW_TOP = 278;

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  inspect(chronicle: Chronicle, card: ChronicleCard): void;
  /** What a name names shown large, as a right click on a name shows it wherever the name stands. */
  inspectNamed(name: Name): void;
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

/** A window's entries laid on its panel. */
type Laid = { readonly panel: Panel; readonly placed: readonly Placed[] };

/** A pile's browse on the scrim, which selects nothing. */
type Browsing = { readonly stands: 'browse' };

/**
 * The deal window on the scrim: the chronicle whose first deal it stands, which its answers read
 * their numbers and their refusal off, and whether it has risen whole. It closes on the take alone.
 */
type Dealing = {
  readonly stands: 'deal';
  readonly on: Chronicle;
  readonly deal: Deal;
  whole: boolean;
};

/**
 * The capstone's window on the scrim: the chronicle it was raised over, whose timeline names the
 * capstone, and whether the opening raised it or the landing did, which picks its lore and is told
 * when it closes. It offers the capstone to be read and nothing to be taken, so it holds no selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle } & {
  [R in Raising]: { readonly raised: R } & RaisedWith[R];
}[Raising];

/** What the capstone's window carries beside each raising: the landing's is told when it closes. */
type RaisedWith = { readonly opening: object; readonly landing: { readonly closed: () => void } };

/** What the scrim carries: a pile's browse, the deal window, the capstone's window, or the ending screen. */
type Carried = Browsing | Dealing | Capstone | { readonly stands: 'ending' };

/** What the chronicle screen hands its overlay. */
type OverlayOf = EndingOf & {
  readonly scene: OverlayScene;
  readonly catalogue: Catalogue;
  readonly covering: (covered: boolean) => void;
  readonly take: (at: number) => void;
};

/**
 * The scrim and what stands on it, on the overlay scene: nothing beneath reacts to a pointer while
 * anything stands, and `covering` is told as the scrim goes up and comes down. The ending screen
 * reads what `paid` answers once the chronicle has ended, and its button leaves through `leave`.
 */
export function createOverlay({
  scene,
  catalogue,
  covering,
  take,
  paid,
  leave,
}: OverlayOf): Overlay {
  const note = createRefusalNote(scene, scene.strata.note);
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  /** The deal standing, so no render raises its window twice; the take lets it go. */
  let standingDeal: Dealing | undefined;
  /** Whether the first render has opened the screen on the capstone's window. */
  let opened = false;

  const browser = standBrowser(scene, catalogue, {
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

  const raiseTitle = (name: string, heading: string): Phaser.GameObjects.Text =>
    carries(headingOf(scene, name, heading));

  /** A window's lore, named after the window it stands in, ending where its row starts. */
  const raiseLore = (name: string, lore: string): void => {
    const line = addText(scene, DESIGN_WIDTH / 2, LORE_FOOT, lore, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: TITLE_INK,
      align: 'center',
      wordWrap: { width: 600 },
    })
      .setName(`${name}-lore`)
      .setOrigin(0.5, 1);
    carries(line);
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
              reactions: reactionsOfNames(plate, inspecting),
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
              const { stacked, parts, box, liesUnder, reactions } = badgedStackOf(
                { scene, inspecting },
                {
                  shown: offered.face,
                  copies: offered.copies,
                  left,
                  top,
                  name: named,
                  refusal: offered.refusal,
                },
              );
              stacked.card.root.setData('at', offered.at);
              return {
                part: scene.add.container(0, 0, [...parts]).setName(`${name}-stack-${index}`),
                box,
                liesUnder,
                own: stacked.face,
                reactions,
              };
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
   * A window's entries on its panel in rows from `ROW_TOP`, each row centred, every entry of a row as
   * tall as its tallest, a left click on one running `pressed` while `live` holds; the first is drawn
   * first.
   */
  const layWindow = (
    name: string,
    entries: readonly Offered[],
    top: number,
    pressed: (entry: Placed) => void,
    live: () => boolean = () => true,
  ): Laid => {
    const frame = {
      x: MARGIN,
      y: top,
      width: DESIGN_WIDTH - 2 * MARGIN,
      height: DESIGN_HEIGHT - MARGIN - top,
    };
    const unlaid = entries.map((offered, index) => unlaidOf(offered, name, index));
    const width = Math.max(...unlaid.map((each) => each.width));
    const columns = Math.max(1, Math.floor((frame.width + GRID_GAP) / (width + GRID_GAP)));

    const placed: Placed[] = [];
    let rowTop = ROW_TOP;
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

    const panel = browser.lay({
      name,
      frame,
      parts: placed.map(({ part }) => part),
      held: placed.map(
        (entry): Held => ({
          box: entry.box,
          liesUnder: entry.liesUnder,
          reactions: entry.reactions,
          get press() {
            return live()
              ? () => {
                  pressed(entry);
                }
              : undefined;
          },
        }),
      ),
      foot: rowTop - GRID_GAP,
    });
    return { panel, placed };
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
  const riseWhole = (dealing: Dealing): void => {
    const { layer } = scene.strata.scrim;
    const fade = scene.tweens.add({
      targets: layer.setAlpha(0),
      alpha: 1,
      duration: 1000 / 3,
      ease: EASE,
    });
    // The overlay's tweens play at the animation speed (`chronicleScreenAtSpeed`), and the beat is
    // the wall clock's.
    fade.setTimeScale(1 / scene.tweens.timeScale);
    void ended(fade).then(() => {
      dealing.whole = true;
    });
  };

  /**
   * The deal window raised, taking a left click on an entry once it stands whole. It closes on the
   * take alone, and the landing plays out under the caller.
   */
  const showDeal = (dealing: Dealing): void => {
    raiseOnScrim(dealing);
    standingDeal = dealing;

    const { heading, lore, entries } = dealt(catalogue, dealing.on, dealing.deal);
    const title = raiseTitle('deal', heading);
    const laid = layWindow(
      'deal',
      entries,
      title.y + title.height + MARGIN,
      ({ costs, refusal, own, at }) => {
        if (!playable(refusal)) {
          const { x, y, width } = own;
          note.overCard(refused(costs, refusal), x + width / 2, y - laid.panel.offset);
          return;
        }
        standingDeal = undefined;
        close();
        take(at);
      },
      () => dealing.whole,
    );
    raiseLore('deal', lore);
    riseWhole(dealing);
  };

  /**
   * The capstone's window closed: it is read once, and nothing brings it back on this screen but the
   * landing. The opening's closes onto the screen as the chronicle stands; the landing's is told it
   * closed once the scrim is down.
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
    }
  };

  /**
   * The capstone's window raised, the capstone drawn as an answer is. A left press on it closes the
   * window for good, as a press beside it does.
   */
  const showCapstone = (announcement: Capstone): void => {
    raiseOnScrim(announcement);

    const answer = capstoneShown(catalogue, announcement.on);
    const title = raiseTitle('capstone', text('capstone.title'));
    const entry: Offered = { shows: 'answer', answer, costs: [], refusal: NO_REFUSAL, at: 0 };
    layWindow('capstone', [entry], title.y + title.height + MARGIN, () => {
      closeCapstone(announcement);
    });
    raiseLore('capstone', capstoneLore(answer.id, announcement.raised));
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
      showDeal({ stands: 'deal', on: chronicle, deal: chronicle.deals[0], whole: false });
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
      const { ending, deals } = stage.chronicle;
      if (ending !== undefined && !endingScreen.raised) return raiseEnding(stage.chronicle, ending);
      // A deal stands before its play-out ends — a capture's before the captures after it resolve, a
      // card's before what its play reads — so the window waits for the render the play-out ends
      // on, which a render of this stage would pre-empt.
      return deals.length > 0 ? Promise.resolve() : undefined;
    },
  };
}

/**
 * What the deal window reads of a deal: its title, what stands where the lore does, and its entries
 * in the order dealt — an answer as it reads on the chronicle, with what refuses it there, a reward as
 * the card of the deck it is, in its copies, a card dealt as the card of the pile it is.
 */
function dealt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  deal: Deal,
): { heading: string; lore: string; entries: readonly Offered[] } {
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
