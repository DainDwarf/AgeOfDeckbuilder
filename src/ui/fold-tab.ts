import type Phaser from 'phaser';
import { createChromeButton } from './chrome';
import {
  addText,
  type Box,
  onClick,
  onHover,
  ownBoxOf,
  type Stratum,
  UI_FONT,
} from './design-space';
import { glyphOf } from './glyphs';
import { css, LOOK } from './look';
import { LEDGER } from './pinned-layout';
import { STANDOFF, type Tooltip } from './tooltip';

/**
 * A tab: its drop under its panel's top, its body hidden past what shows, its sign's side and step
 * toward the edge, what shows of it, and folded, its height, its room round the tally, its least
 * width and how far the tally and the sign stand off its middle.
 */
const TAB = {
  drop: 8,
  hidden: 10,
  sign: 30,
  toward: 1,
  shows: { width: 24, height: 48 },
  folded: { height: 54, past: 12, least: 34, apart: 9.5 },
};

/** How tall a panel a tab stands on stands at the least: the tab, and its drop over and under it. */
export const TAB_ROOM = TAB.drop + TAB.shows.height + TAB.drop;

const TALLY_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  fontStyle: 'bold',
  color: css(LOOK.metalInk),
};

export type FoldTab = {
  /** Whether what it folds stands folded into the screen's edge. */
  readonly folded: boolean;
  /**
   * The tab laid on its panel's outer edge, the panel's top standing that far down the screen, or
   * folded on the screen's edge at that height reading the tally where one is handed.
   */
  lay(top: number, tally: string | undefined): void;
  /** The tab standing, or gone with what it folds. */
  show(on: boolean): void;
};

/**
 * The tab, `<name>-tab`, of a panel as wide as the ledger against the screen's left edge: a left click
 * lets go of what is being aimed and folds the panel or brings it back, telling `fold`. Made before the
 * panel, which is drawn over its inner end.
 */
export function createFoldTab(
  scene: Phaser.Scene,
  on: Stratum,
  {
    name,
    reads,
    tooltip,
    unaim,
    fold,
  }: {
    name: string;
    reads: string;
    tooltip: Tooltip;
    unaim: () => void;
    fold: () => void;
  },
): FoldTab {
  const tab = createChromeButton(
    scene,
    'silver',
    { x: 0, y: 0, width: 1, height: 1 },
    `${name}-tab`,
  );
  const sign = glyphOf(scene, 'fold-tab', TAB.sign).setName(`${name}-tab-sign`);
  const tally = addText(scene, 0, 0, '', TALLY_STYLE).setOrigin(0.5).setName(`${name}-tally`);
  on.layer.add([tab.face, sign, tally]);

  let folded = false;
  /** What shows of the tab as it is laid now. */
  let showing: Box = { x: 0, y: 0, width: 0, height: 0 };

  onHover(
    tab.face,
    () => {
      tooltip.under(reads, showing.x, showing.y + showing.height + STANDOFF);
    },
    () => {
      tooltip.hide();
    },
  );
  onClick(tab.face, () => {
    unaim();
    folded = !folded;
    fold();
  });

  return {
    get folded() {
      return folded;
    },
    lay(top, tallied) {
      const tabTop = top + TAB.drop;
      const { folded: closed } = TAB;
      tally.setText(tallied ?? '').setVisible(folded && tallied !== undefined);
      showing = folded
        ? {
            x: 0,
            y: tabTop,
            width:
              tallied === undefined
                ? closed.least
                : Math.max(closed.least, ownBoxOf(tally).width + closed.past),
            height: closed.height,
          }
        : { x: LEDGER.width, y: tabTop, ...TAB.shows };
      tab.place({
        x: showing.x - TAB.hidden,
        y: showing.y,
        width: showing.width + TAB.hidden,
        height: showing.height,
      });
      const across = showing.x + showing.width / 2;
      const middle = showing.y + showing.height / 2;
      if (folded) {
        tally.setPosition(across, middle - closed.apart);
        sign
          .setPosition(across, tallied === undefined ? middle : middle + closed.apart)
          .setAngle(180);
      } else {
        sign.setPosition(across - TAB.toward, middle).setAngle(0);
      }
    },
    show(shown) {
      tab.face.setVisible(shown);
      sign.setVisible(shown);
      tally.setVisible(shown && folded && tally.text !== '');
    },
  };
}
