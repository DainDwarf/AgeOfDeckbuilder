import type Phaser from 'phaser';
import type { Payment } from '../rules/campaign';
import { achievementOf, ageOf, type Catalogue } from '../rules/catalogue';
import { answerCost, answerOf, answerRefusal, offered } from '../rules/schedule';
import type { Group, Stage } from '../rules/stages';
import {
  type CardId,
  type Chronicle,
  type ChronicleCard,
  type Cost,
  type Deal,
  type Ending,
  NO_REFUSAL,
  playable,
  type Refusal,
} from '../rules/state';
import { type Bind, boundTo } from './bindings';
import { standBrowser } from './browse';
import { type CardFace, createCardFace, heightOf, type Name } from './card-face';
import { EASE, ended, stopMotion } from './card-motion';
import { pileStacksOf } from './collection-layout';
import {
  addText,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  headingOf,
  MARGIN,
  TITLE_INK,
  UI_FONT,
} from './design-space';
import { answerFace, capstoneFace, cardFace, cardFaceAtStart, type Face } from './face';
import { LOOK } from './look';
import { campLore, capstoneLore, eventLore, type Raising } from './lore';
import { BUTTON_HEIGHT, createButton } from './menu';
import { raiseMenu } from './menu-scene';
import type { OverlayScene } from './overlay-scene';
import type { Held, Panel } from './panel';
import { refused } from './refusal-lines';
import { createRefusalNote } from './refusal-note';
import { chipAt } from './resource-bar';
import { answersOf } from './stack';
import { buildingName, cardName, eventName, technologyName, text, victoryLine } from './text';

const GRID_WIDTH = 180;
const GRID_GAP = 26;

export type PileKind = 'draw-pile' | 'discard-pile';

export type Overlay = {
  browse(pile: PileKind, chronicle: Chronicle): void;
  /**
   * The discard pile offered to a card aimed at it, newest card first; `chosen` is told where in the
   * pile the card pressed lies. The card being aimed is in the hand, so the pile never offers it.
   * Answers the way to close it from outside.
   */
  aimDiscardPile(
    chronicle: Chronicle,
    aimed: CardId,
    chosen: (at: number) => void,
    closed: () => void,
  ): () => void;
  inspect(card: ChronicleCard): void;
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
 * One face offered on the scrim, what the entry costs the city — which its note says, whether or not
 * the face wears a chip for it — what it is drawn refused by, and the number a press on it answers by.
 */
type Offered = {
  readonly face: Face;
  readonly costs: readonly Cost[];
  readonly refusal: Refusal;
  readonly at: number;
};

/** One card of the deck offered as it stands: nothing refuses it, and its face wears its own cost. */
function offeredCard(face: Face, at: number): Offered {
  return { face, costs: face.costs, refusal: NO_REFUSAL, at };
}

/** Where one offered face was laid out — about its own bottom centre, as a card is drawn — and its drawing. */
type Placed = Offered & {
  readonly x: number;
  readonly y: number;
  readonly drawn: CardFace;
};

/** A window's cards laid on its panel, and how tall one of them stands. */
type Laid = {
  readonly panel: Panel;
  readonly placed: readonly Placed[];
  readonly height: number;
};

/**
 * What the aim window stands on: the card being aimed, the cards it offers, and what a press on one
 * of them plays.
 */
type Aiming = {
  readonly aimed: CardId;
  readonly cards: readonly Offered[];
  readonly chosen: (at: number) => void;
  readonly closed: () => void;
};

/** A pile's browse on the scrim, which selects nothing. */
type Browsing = { readonly stands: 'browse' };

/** The aim window on the scrim, over what it offers. */
type AimWindow = { readonly stands: 'aim-window'; readonly aim: Aiming };

/**
 * The deal window on the scrim: the chronicle whose first deal it stands, which its answers read
 * their numbers and their refusal off, and which of its entries is ringed. It closes on the take
 * alone.
 */
type Dealing = {
  readonly stands: 'deal';
  readonly on: Chronicle;
  readonly deal: Deal;
  /** The number the ringed entry was offered as, and nothing while none is ringed. */
  selected: number | undefined;
};

/**
 * The capstone's window on the scrim: the chronicle it was raised over, whose timeline names the
 * capstone, and whether the opening raised it or the landing did, which picks its lore and is told
 * when it closes. It offers its one card to be read and nothing to be taken, so it holds no selection.
 */
type Capstone = { readonly stands: 'capstone'; readonly on: Chronicle } & {
  [R in Raising]: { readonly raised: R } & RaisedWith[R];
}[Raising];

/** What the capstone's window carries beside each raising: the landing's is told when it closes. */
type RaisedWith = { readonly opening: object; readonly landing: { readonly closed: () => void } };

/**
 * What the scrim carries: a pile's browse, the aim window, the deal window, the capstone's window, or
 * the ending screen.
 */
type Carried = Browsing | AimWindow | Dealing | Capstone | { readonly stands: 'ending' };

/** The ending screen raised, and its button. */
type Raised = {
  readonly screen: Phaser.GameObjects.Container;
  readonly button: Phaser.GameObjects.Rectangle;
};

/**
 * The scrim and what stands on it, on the overlay scene: nothing beneath answers a pointer while
 * anything stands, and `covering` is told as the scrim goes up and comes down. The ending screen
 * reads what `paid` answers once the chronicle has ended, and its button leaves through `leave`.
 */
export function createOverlay(
  scene: OverlayScene,
  catalogue: Catalogue,
  covering: (covered: boolean) => void,
  take: (at: number) => void,
  paid: () => Payment | undefined,
  leave: () => void,
): Overlay {
  const note = createRefusalNote(scene, scene.strata.note);
  /** What stands on the scrim, and nothing while the scrim is down. */
  let carried: Carried | undefined;
  /** The cards of the window standing, and none while no window stands. */
  let onWindow: readonly Placed[] = [];
  /** The chronicle the ending screen was raised on: a render raises the screen once and no more. */
  let raisedOn: Ended | undefined;
  /** The deal standing, so no render raises its window twice; the take lets it go. */
  let standingDeal: Dealing | undefined;
  /** Whether the first render has opened the screen on the capstone's window. */
  let opened = false;
  /** The ending screen still coming up, its button dead until `risen`; a render may cut the rise short. */
  let rising: Raised | undefined;

  const browser = standBrowser(scene, catalogue, {
    covering,
    takes: (press) => takes(press),
    back: () => {
      back();
    },
    down: () => {
      onWindow = [];
      note.hide();
      rising = undefined;
    },
    risingLarge: () => {
      note.hide();
    },
  });
  const { inspecting, scrim, carries } = browser;

  const close = (): void => {
    browser.close();
    carried = undefined;
  };

  /** The aim window closed with nothing paid: the one path, whichever way it was closed. */
  const closeAim = (): void => {
    if (carried?.stands !== 'aim-window') return;
    const { aim } = carried;
    close();
    aim.closed();
  };

  /** What the scrim carries replaced, the scrim up for what is raised on it. */
  const raiseOnScrim = (what: Carried): void => {
    carried = what;
    browser.raise();
  };

  /** What a name names, shown large on top of the stack, over whatever stands. */
  const inspectNamed = (name: Name): void => {
    inspecting.large.named(name);
  };

  const raiseTitle = (name: string, heading: string): Phaser.GameObjects.Text =>
    carries(headingOf(scene, name, heading));

  /** A window's lore, named after the window it stands in, just over the first row its cards laid. */
  const raiseLore = (name: string, lore: string, laid: Laid): void => {
    const rowTop = laid.placed[0].y - laid.height;
    const line = addText(scene, DESIGN_WIDTH / 2, rowTop - 16, lore, {
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
   * A window's cards on its panel, centred in its frame while they fit, a left click on one running
   * `pressed`: each face is named `<name>-card-<n>`, the first drawn first, and carries its card and
   * the number it was offered as in its data.
   */
  const layWindow = (
    name: string,
    cards: readonly Offered[],
    top: number,
    pressed: (card: Placed) => void,
  ): Laid => {
    const height = heightOf(GRID_WIDTH);
    const frame = {
      x: MARGIN,
      y: top,
      width: DESIGN_WIDTH - 2 * MARGIN,
      height: DESIGN_HEIGHT - MARGIN - top,
    };
    const columns = Math.max(1, Math.floor((frame.width + GRID_GAP) / (GRID_WIDTH + GRID_GAP)));
    const rows = Math.max(1, Math.ceil(cards.length / columns));
    const spanY = rows * height + (rows - 1) * GRID_GAP;
    const firstY = top + Math.max(0, (frame.height - spanY) / 2);

    const placed = cards.map((offered, index): Placed => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const inRow = Math.min(columns, cards.length - row * columns);
      const spanX = inRow * GRID_WIDTH + (inRow - 1) * GRID_GAP;
      const x = (DESIGN_WIDTH - spanX) / 2 + column * (GRID_WIDTH + GRID_GAP) + GRID_WIDTH / 2;
      const y = firstY + row * (height + GRID_GAP) + height;
      const drawn = createCardFace(scene, offered.face, offered.refusal, { width: GRID_WIDTH });
      drawn.root
        .setPosition(x, y)
        .setName(`${name}-card-${index}`)
        .setData({ at: offered.at, card: offered.face.id });
      return { ...offered, x, y, drawn };
    });

    const panel = browser.lay({
      name,
      frame,
      parts: placed.map(({ drawn }) => drawn.root),
      held: placed.map(
        (card): Held => ({
          box: { x: card.x - GRID_WIDTH / 2, y: card.y - height, width: GRID_WIDTH, height },
          answers: answersOf(card.drawn, card.face, inspecting),
          press: () => {
            pressed(card);
          },
        }),
      ),
      foot: firstY + spanY,
    });
    onWindow = placed;
    return { panel, placed, height };
  };

  /** The one entry of the deal ringed, and none ringed at all where nothing is selected. */
  const ring = (dealing: Dealing, at: number | undefined): void => {
    dealing.selected = at;
    for (const card of onWindow) card.drawn.select(card.at === at);
  };

  /** A pile's browse raised, laid out as the civilization's browse lays out a civilization. */
  const showBrowse = (pile: PileKind, chronicle: Chronicle): void => {
    const cards = pileOf(chronicle, pile);
    carried = { stands: 'browse' };
    browser.browse({
      name: 'browse',
      heading: text(`browse.${pile}`, { count: cards.length }),
      stacks: pileStacksOf(catalogue, cards, cardName).map(({ card, copies }) => ({
        shown: cardFace(catalogue, card),
        copies,
        edged: false,
      })),
    });
  };

  /** The deal window raised. It closes on the take alone, and the landing plays out under the caller. */
  const showDeal = (dealing: Dealing): void => {
    raiseOnScrim(dealing);
    standingDeal = dealing;

    const { heading, lore, entries } = dealt(catalogue, dealing.on, dealing.deal);
    const title = raiseTitle('deal', heading);
    const laid = layWindow('deal', entries, title.y + title.height + MARGIN, (card) => {
      if (card.at !== dealing.selected) {
        ring(dealing, card.at);
        return;
      }
      if (!playable(card.refusal)) {
        const over = card.y - laid.panel.offset - laid.height;
        note.overCard(refused(card.costs, card.refusal), card.x, over);
        return;
      }
      standingDeal = undefined;
      close();
      take(card.at);
    });
    raiseLore('deal', lore, laid);
    ring(dealing, dealing.selected);
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

  /** The capstone's window raised. A left press on its card closes it for good, as a press beside it does. */
  const showCapstone = (announcement: Capstone): void => {
    raiseOnScrim(announcement);

    const { id } = announcement.on.timeline.capstone;
    const face = capstoneFace(id);
    const title = raiseTitle('capstone', text('capstone.title'));
    const laid = layWindow(
      'capstone',
      [{ face, costs: [], refusal: NO_REFUSAL, at: 0 }],
      title.y + title.height + MARGIN,
      () => {
        closeCapstone(announcement);
      },
    );
    raiseLore('capstone', capstoneLore(id, announcement.raised), laid);
  };

  /** The aim window raised. */
  const showAim = (aim: Aiming): void => {
    raiseOnScrim({ stands: 'aim-window', aim });

    const title = raiseTitle('aim-window', text('aim.discard-pile', { card: cardName(aim.aimed) }));
    layWindow('aim-window', aim.cards, title.y + title.height + MARGIN, (card) => {
      // The aim landed, so the window closes without saying it closed with nothing paid.
      close();
      aim.chosen(card.at);
    });
  };

  /**
   * The chronicle ended, on the screen that says so: the outcome, under it the ledger of what it
   * paid and under that its button, one block centred on the screen.
   */
  const showEnding = (on: Ended): Raised => {
    raiseOnScrim({ stands: 'ending' });
    raisedOn = on;

    const said = says(on);
    const reached = on.payment.achievements.map((id) => achievementOf(catalogue, on.age, id));
    const width = 340;
    const pitch = 34;
    const gap = 44;
    const ruleRoom = 0.4 * pitch;
    const style = (bold: boolean): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: UI_FONT,
      fontSize: '22px',
      fontStyle: bold ? 'bold' : 'normal',
      color: TITLE_INK,
    });
    const title = addText(scene, DESIGN_WIDTH / 2, 0, said.title, {
      fontFamily: UI_FONT,
      fontSize: '72px',
      fontStyle: 'bold',
      color: TITLE_INK,
    }).setOrigin(0.5, 0);
    const line = addText(scene, DESIGN_WIDTH / 2, title.height + 24, said.line, style(false));
    line.setOrigin(0.5, 0);

    const left = (DESIGN_WIDTH - width) / 2;
    const right = left + width;
    const diamond = (x: number, y: number): Phaser.GameObjects.Rectangle =>
      chipAt(scene, { x, y }, LOOK.influence);
    const parts: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform)[] = [
      title,
      line,
    ];
    let y = line.y + line.height + gap + pitch / 2;
    reached.forEach(({ technology, influence }, at) => {
      const achievement = technologyName(technology);
      parts.push(
        addText(scene, left, y, text('ending.reached', { achievement }), style(false))
          .setOrigin(0, 0.5)
          .setName(`ending-row-${at}`),
      );
      if (influence > 0) {
        const number = addText(scene, right, y, String(influence), style(false))
          .setOrigin(1, 0.5)
          .setName(`ending-row-${at}-influence`);
        parts.push(diamond(number.x - number.width - 18, y), number);
      }
      y += pitch;
    });
    if (reached.length > 0) {
      parts.push(
        scene.add.rectangle(left, y - pitch / 2 + 4, width, 1, LOOK.panelEdge).setOrigin(0, 0),
      );
      y += ruleRoom;
    }
    const total = addText(scene, left + 22, y, text('label.influence'), style(true))
      .setOrigin(0, 0.5)
      .setName('ending-total-label');
    parts.push(
      diamond(left + 7, y),
      total,
      addText(scene, right, y, String(on.payment.influence), style(true))
        .setOrigin(1, 0.5)
        .setName('ending-total'),
    );

    const buttonY = y + total.height / 2 + gap + BUTTON_HEIGHT / 2;
    const button = createButton(
      scene,
      DESIGN_WIDTH / 2,
      buttonY,
      'end-chronicle',
      text('ending.end-chronicle'),
      leave,
    );
    button.face.disableInteractive();
    parts.push(button.face, button.label);

    const lowered = (DESIGN_HEIGHT - (buttonY + BUTTON_HEIGHT / 2)) / 2;
    for (const part of parts) part.y += lowered;
    const screen = carries(scene.add.container(0, 0, parts).setName(on.ending.outcome));
    return { screen, button: button.face };
  };

  /** The rise over, however it ended: the button answers from here. */
  const risen = (): void => {
    const raised = rising;
    if (raised === undefined) return;
    rising = undefined;
    raised.button.setInteractive();
  };

  /** The ending as it lands: the scrim and the screen rise together, out of nothing and a little low. */
  const raiseEnding = (on: Ended): Promise<void> => {
    const raised = showEnding(on);
    raised.screen.setAlpha(0).setY(12);
    rising = raised;
    scrim.setAlpha(0);

    const climb = { duration: 1200, ease: EASE };
    return Promise.all([
      ended(scene.tweens.add({ targets: scrim, alpha: 1, ...climb })),
      ended(scene.tweens.add({ targets: raised.screen, alpha: 1, y: 0, ...climb })),
    ]).then(() => {
      if (rising === raised) risen();
    });
  };

  /** The rise cut short and stood up where it was going: a render leaves the screen full. */
  const stand = (): void => {
    const raised = rising;
    if (raised === undefined) return;
    stopMotion(scene, scrim);
    stopMotion(scene, raised.screen);
    scrim.setAlpha(1);
    raised.screen.setAlpha(1).setY(0);
    risen();
  };

  /** What the ending screen reads of the chronicle that has ended, and what it paid. */
  const endedOf = (chronicle: Chronicle, ending: Ending): Ended => {
    const payment = paid();
    if (payment === undefined) throw new Error('the chronicle ended with no payment held');
    return { ending, timeline: chronicle.timeline, age: chronicle.age, payment };
  };

  /** What stands over the chronicle as it stands: its ending screen, else the deal it waits on. */
  const standAs = (chronicle: Chronicle): void => {
    if (chronicle.ending !== undefined && raisedOn === undefined)
      void raiseEnding(endedOf(chronicle, chronicle.ending));
    else if (chronicle.deals[0] !== undefined && standingDeal === undefined)
      showDeal({ stands: 'deal', on: chronicle, deal: chronicle.deals[0], selected: undefined });
    else stand();
  };

  const back = (): boolean => {
    if (carried === undefined) return false;
    switch (carried.stands) {
      case 'browse':
        close();
        return true;
      case 'aim-window':
        closeAim();
        return true;
      case 'deal':
        if (carried.selected === undefined) return false;
        ring(carried, undefined);
        return true;
      case 'capstone':
        closeCapstone(carried);
        return true;
      case 'ending':
        return false;
    }
  };

  /** The inspection key while a window stands: it shows the ringed entry of the deal large. */
  const inspectSelection = (): void => {
    if (carried === undefined) return;
    switch (carried.stands) {
      case 'deal': {
        const entry =
          carried.selected === undefined
            ? undefined
            : dealt(catalogue, carried.on, carried.deal).entries[carried.selected];
        if (entry !== undefined) inspecting.large.show(entry.face);
        return;
      }
      case 'browse':
      case 'aim-window':
      case 'capstone':
      case 'ending':
        return;
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
      case 'strike':
      case 'income':
      case 'grow':
      case 'turn':
      case 'enemy-phase':
      case 'deal':
      case 'answer':
      case 'reward':
      case 'attack':
      case 'camp-capture':
        return undefined;
    }
  };

  /**
   * Every press the scrim holds while anything stands on it and no card stands large over it: the
   * inspection key shows a ringed card large, the back key walks what stands back and raises the
   * menu where it has nothing left to walk, and every other key is swallowed.
   */
  const takes = (press: Bind): boolean => {
    if (carried === undefined) return false;
    if (boundTo(press, 'inspect')) inspectSelection();
    else if (boundTo(press, 'back') && !back()) raiseMenu(scene);
    return true;
  };

  return {
    browse: showBrowse,
    aimDiscardPile(chronicle, aimed, chosen, closed): () => void {
      showAim({
        aimed,
        cards: chronicle.discardPile
          .map((card, at) => offeredCard(cardFace(catalogue, card), at))
          .reverse(),
        chosen,
        closed,
      });
      return closeAim;
    },
    inspect(card: ChronicleCard): void {
      inspecting.large.show(cardFace(catalogue, card));
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
      if (ending !== undefined && raisedOn === undefined)
        return raiseEnding(endedOf(stage.chronicle, ending));
      // Every camp captured deals before the camps after it are captured: the window waits for the
      // render the play-out ends on, which a render of this stage would pre-empt.
      return deals.length > 0 ? Promise.resolve() : undefined;
    },
  };
}

/**
 * What of an ended chronicle its ending screen reads: how it ended, the capstone it was on, and what
 * it paid, its achievements read in its age.
 */
type Ended = Pick<Chronicle, 'timeline' | 'age'> & {
  readonly ending: Ending;
  readonly payment: Payment;
};

/** What the ending screen reads: its title, and the one line under it. */
function says({ ending, timeline }: Ended): { title: string; line: string } {
  switch (ending.outcome) {
    case 'victory':
      return { title: text('victory.title'), line: victoryLine(timeline.capstone.id) };
    case 'defeat':
      return {
        title: text('defeat.title'),
        line: text(`defeat.${ending.cause}`, { turn: ending.turn }),
      };
  }
}

/**
 * What the deal window reads of a deal: the event's name and lore or the camp's over it, and its
 * entries in the order dealt — an answer drawn unaffordable where the chronicle cannot pay it, a
 * reward as the card of the deck it is.
 */
function dealt(
  catalogue: Catalogue,
  chronicle: Chronicle,
  deal: Deal,
): { heading: string; lore: string; entries: readonly Offered[] } {
  const ids = offered(catalogue, deal);
  switch (deal.of) {
    case 'event':
      return {
        heading: eventName(deal.event),
        lore: eventLore(deal.event),
        entries: ids.map(
          (id, at): Offered => ({
            face: answerFace(catalogue, chronicle, deal.event, id),
            costs: answerCost(catalogue, chronicle, answerOf(catalogue, deal.event, id)),
            refusal: answerRefusal(catalogue, chronicle, deal.event, id),
            at,
          }),
        ),
      };
    case 'camp': {
      const { building } = ageOf(catalogue, chronicle.age).camp;
      return {
        heading: buildingName(building),
        lore: campLore(building),
        entries: ids.map((id, at) => offeredCard(cardFaceAtStart(catalogue, id), at)),
      };
    }
  }
}

function pileOf(chronicle: Chronicle, pile: PileKind): readonly ChronicleCard[] {
  switch (pile) {
    case 'draw-pile':
      return chronicle.drawPile;
    case 'discard-pile':
      return chronicle.discardPile;
  }
}
