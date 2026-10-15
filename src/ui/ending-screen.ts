import type Phaser from 'phaser';
import type { HeldCopies, Payment } from '../rules/campaign';
import { achievementOf, type Catalogue } from '../rules/catalogue';
import type { Chronicle, DefeatCause, Ending } from '../rules/state';
import type { Browser } from './browse';
import { EASE, ended, stopMotion } from './card-motion';
import { inCollectionOrder } from './collection-layout';
import { addText, DESIGN_HEIGHT, DESIGN_WIDTH, TITLE_INK, UI_FONT } from './design-space';
import { css, LOOK } from './look';
import { BUTTON_HEIGHT, type CountedLine, createButton, laidLine } from './menu';
import { chipAt } from './resource-bar';
import { cardName, defeatLine, technologyName, text, victoryLine } from './text';

/** What the ending screen is handed: what the chronicle paid once it has ended, and the way out. */
export type EndingOf = {
  readonly paid: () => Payment | undefined;
  readonly leave: () => void;
};

/** The ending screen of the chronicle screen, standing on the browser's scrim. */
export type EndingScreen = {
  /** Whether it has been raised: a chronicle raises it once and no more. */
  readonly raised: boolean;
  /**
   * The screen raised over the chronicle that has ended, rising with the scrim out of nothing and a
   * little low; settles once it has risen, however the rise ended.
   */
  raise(chronicle: Chronicle, ending: Ending): Promise<void>;
  /** The rise cut short and stood up where it was going. */
  stand(): void;
};

/**
 * What of an ended chronicle its ending screen reads: how it ended, the capstone it was on, and what
 * it paid, its achievements read in its age.
 */
type Ended = Pick<Chronicle, 'timeline' | 'age'> & {
  readonly ending: Ending;
  readonly payment: Payment;
};

/** The ending screen drawn, and its button. */
type Drawn = {
  readonly screen: Phaser.GameObjects.Container;
  readonly button: Phaser.GameObjects.Rectangle;
};

type Part = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/** The ending screen on the browser: its button dead until it has risen. */
export function standEnding(
  browser: Browser,
  catalogue: Catalogue,
  { paid, leave }: EndingOf,
): EndingScreen {
  const { scene } = browser;
  let raisedYet = false;
  /** The screen still coming up, its button dead until `risen`. */
  let rising: Drawn | undefined;

  /** The rise over, however it ended: the button answers from here. */
  const risen = (): void => {
    const drawn = rising;
    if (drawn === undefined) return;
    rising = undefined;
    drawn.button.setInteractive();
  };

  const endedOf = (chronicle: Chronicle, ending: Ending): Ended => {
    const payment = paid();
    if (payment === undefined) throw new Error('the chronicle ended with no payment held');
    return { ending, timeline: chronicle.timeline, age: chronicle.age, payment };
  };

  return {
    get raised() {
      return raisedYet;
    },
    raise(chronicle, ending) {
      const on = endedOf(chronicle, ending);
      const climb = { duration: 1200, ease: EASE };
      const scrimRisen = browser.raise(climb);
      raisedYet = true;
      const drawn = drawEnding(scene, catalogue, on, leave);
      browser.carries(drawn.screen.setAlpha(0).setY(12));
      rising = drawn;
      // A wipe destroys the screen mid-rise, and a destroyed button throws at `setInteractive`.
      drawn.screen.once('destroy', () => {
        if (rising === drawn) rising = undefined;
      });
      return Promise.all([
        scrimRisen,
        ended(scene.tweens.add({ targets: drawn.screen, alpha: 1, y: 0, ...climb })),
      ]).then(() => {
        if (rising === drawn) risen();
      });
    },
    stand() {
      const drawn = rising;
      if (drawn === undefined) return;
      browser.standWhole();
      stopMotion(scene, drawn.screen);
      drawn.screen.setAlpha(1).setY(0);
      risen();
    },
  };
}

const style = (bold: boolean): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: UI_FONT,
  fontSize: '22px',
  fontStyle: bold ? 'bold' : 'normal',
  color: TITLE_INK,
});

/**
 * The chronicle ended, on the screen that says so: the outcome, under it the ledger of what it paid
 * and under that its button, one block centred on the screen. The button is drawn dead.
 */
function drawEnding(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  on: Ended,
  leave: () => void,
): Drawn {
  const said = says(on);
  const gap = 44;
  const title = addText(scene, DESIGN_WIDTH / 2, 0, said.title, {
    fontFamily: UI_FONT,
    fontSize: '72px',
    fontStyle: 'bold',
    color: TITLE_INK,
  }).setOrigin(0.5, 0);
  const line = addText(scene, DESIGN_WIDTH / 2, title.height + 24, said.line, style(false));
  line.setOrigin(0.5, 0).setName('ending-line');
  const ledger = ledgerOf(scene, catalogue, on, line.y + line.height + gap);

  const buttonY = ledger.bottom + gap + BUTTON_HEIGHT / 2;
  const button = createButton(
    scene,
    DESIGN_WIDTH / 2,
    buttonY,
    'end-chronicle',
    text('ending.end-chronicle'),
    leave,
  );
  button.face.disableInteractive();
  const parts: Part[] = [title, line, ...ledger.parts, button.face, button.label];

  const lowered = (DESIGN_HEIGHT - (buttonY + BUTTON_HEIGHT / 2)) / 2;
  for (const part of parts) part.y += lowered;
  const screen = scene.add.container(0, 0, parts).setName(on.ending.outcome);
  return { screen, button: button.face };
}

/** One row of the ledger: what it reads, the influence it paid, and whether it reads greyed. */
export type LedgerRow = CountedLine & { readonly influence: number; readonly greyed: boolean };

/**
 * An influence card a ledger row reads: its copies, and, on a chronicle that has ended, whether that
 * ending paid it and what its copies paid.
 */
export type LedgerCard = HeldCopies &
  (
    | { readonly ended: false }
    | { readonly ended: true; readonly paid: boolean; readonly influence: number }
  );

/**
 * The ledger's rows: one per achievement of the age reached, then one per influence card kept in
 * the collection's order, one an ending did not pay greyed.
 */
export function ledgerRowsOf(
  catalogue: Catalogue,
  age: string,
  achievements: readonly string[],
  cards: readonly LedgerCard[],
): LedgerRow[] {
  const reached = achievements.map((id): LedgerRow => {
    const { technology, influence } = achievementOf(catalogue, age, id);
    const achievement = technologyName(technology);
    return { reads: text('achievement.reached', { achievement }), influence, greyed: false };
  });
  const kept = inCollectionOrder(catalogue, cards, cardName).map(
    (card): LedgerRow => ({
      reads: cardName(card.id),
      copies: card.copies,
      influence: card.ended ? card.influence : 0,
      greyed: card.ended && !card.paid,
    }),
  );
  return [...reached, ...kept];
}

/**
 * The ledger of what the chronicle paid, from `top` down: its rows, each with the influence it paid
 * at its end where it paid any, then the influence paid in all, under a rule where a row stands over
 * it.
 */
function ledgerOf(
  scene: Phaser.Scene,
  catalogue: Catalogue,
  on: Ended,
  top: number,
): { parts: Part[]; bottom: number } {
  const rows = ledgerRowsOf(
    catalogue,
    on.age,
    on.payment.achievements,
    on.payment.cards.map((card) => ({ ...card, ended: true as const })),
  );
  const width = 340;
  const pitch = 34;
  const left = (DESIGN_WIDTH - width) / 2;
  const right = left + width;
  const diamond = (x: number, y: number): Phaser.GameObjects.Rectangle =>
    chipAt(scene, { x, y }, LOOK.influence);
  const parts: Part[] = [];
  let y = top + pitch / 2;
  rows.forEach((row, at) => {
    const ink = row.greyed ? { ...style(false), color: css(LOOK.unpaidInk) } : style(false);
    const line = laidLine(scene, row, ink, `ending-row-${at}`);
    line.place(left, y - line.height / 2);
    parts.push(...line.parts);
    const { influence } = row;
    if (influence > 0) {
      const number = addText(scene, right, y, String(influence), ink)
        .setOrigin(1, 0.5)
        .setName(`ending-row-${at}-influence`);
      parts.push(diamond(number.x - number.width - 18, y), number);
    }
    y += pitch;
  });
  if (rows.length > 0) {
    parts.push(
      scene.add.rectangle(left, y - pitch / 2 + 4, width, 1, LOOK.panelEdge).setOrigin(0, 0),
    );
    y += 0.4 * pitch;
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
  return { parts, bottom: y + total.height / 2 };
}

/** What the ending screen reads: its title, and the one line under it. */
function says({ ending, timeline }: Ended): { title: string; line: string } {
  switch (ending.outcome) {
    case 'victory':
      return { title: text('victory.title'), line: victoryLine(timeline.capstone.id) };
    case 'defeat':
      return { title: text('defeat.title'), line: defeatSaid(ending, timeline.capstone.id) };
  }
}

/** The line the defeat screen reads: its cause's, or the capstone's where its trial was failed. */
function defeatSaid(
  { cause, turn }: { cause: DefeatCause; turn: number },
  capstone: string,
): string {
  switch (cause) {
    case 'capture':
    case 'population':
    case 'removal':
      return text(`defeat.${cause}`, { turn });
    case 'capstone':
      return defeatLine(capstone, turn);
  }
}
