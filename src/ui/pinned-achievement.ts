import type Phaser from 'phaser';
import { achievementOf, type Catalogue } from '../rules/catalogue';
import { countOn } from '../rules/chronicle';
import type { Chronicle, ChronicleAchievement } from '../rules/state';
import type { Name, SmallCards } from './card-face';
import {
  createChromeButton,
  createChromePanel,
  PANEL_RIMS,
  PAST_THE_EDGE,
  standChromePanel,
} from './chrome';
import {
  addText,
  type Box,
  inked,
  onClick,
  onHover,
  ownBoxOf,
  type Stratum,
  UI_FONT,
} from './design-space';
import { glyphOf } from './glyphs';
import { css, LOOK } from './look';
import { LEDGER } from './pinned-layout';
import {
  drawRun,
  linesOf,
  NAME_LINE,
  NAME_STYLE,
  PAD_X,
  PAD_Y,
  TEXT_LINE,
  TEXT_STYLE,
} from './plate';
import { achievementGoal, technologyName, text } from './text';
import { STANDOFF, type Tooltip } from './tooltip';

/**
 * The ledger's tab: its drop under the ledger's top, its body hidden past what shows, its sign's side
 * and step toward the edge, what shows of it, and folded, its height, its room round the tally, its
 * least width and how far the tally and the sign stand off its middle.
 */
const LEDGER_TAB = {
  drop: 8,
  hidden: 10,
  sign: 30,
  toward: 1,
  shows: { width: 24, height: 48 },
  folded: { height: 54, past: 12, least: 34, apart: 9.5 },
};

const TALLY_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  fontStyle: 'bold',
  color: css(LOOK.metalInk),
};

/** An achievement the ledger reads, and the technology it earns. */
type Pinned = { readonly id: string; readonly technology: string; readonly need: number };

/** A row of the ledger: everything it draws, and its laying at a top as the chronicle stands. */
type Row = {
  readonly root: Phaser.GameObjects.Container;
  /** The row laid at `top`, its stop as tall as it; how tall it stands. */
  lay(standing: Chronicle, top: number): number;
  /** The row's stop reaching down to `foot`, past the row's own. */
  reach(foot: number): void;
};

/** The chronicle's row of the achievement; one it does not hold throws. */
function rowIn(standing: Chronicle, id: string): ChronicleAchievement {
  const row = standing.achievements.find((achievement) => achievement.id === id);
  if (row === undefined) throw new Error(`the chronicle's row holds no ${id}`);
  return row;
}

/**
 * The achievements earning the pinned technologies the chronicle reads, a row to each in one ledger
 * against the screen's left edge, and the tab folding it; nothing where it reads none.
 */
export function createPinnedAchievements(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  chronicle: Chronicle,
  pins: readonly string[],
  {
    small,
    inspect,
    tooltip,
    unaim,
  }: {
    small: SmallCards;
    inspect: (name: Name) => void;
    tooltip: Tooltip;
    /**
     * Whatever is being aimed let go, as a left click on a thing lets it go: the tab a left click
     * moves is gone from under the pointer before the screen reads what the click was let go on.
     */
    unaim: () => void;
  },
): { render(chronicle: Chronicle): void } {
  const read = chronicle.achievements.flatMap(({ id }): Pinned[] => {
    const { technology, need } = achievementOf(catalogue, chronicle.age, id);
    return pins.includes(technology) ? [{ id, technology, need }] : [];
  });
  if (read.length === 0) return { render: () => undefined };

  // Made before the panel, which is drawn over the tab's inner end.
  const tab = createChromeButton(
    scene,
    'silver',
    { x: 0, y: 0, width: 1, height: 1 },
    'pinned-achievements-tab',
  );
  const sign = glyphOf(scene, 'pinned-achievements-tab', LEDGER_TAB.sign).setName(
    'pinned-achievements-tab-sign',
  );
  const tally = addText(scene, 0, 0, '', TALLY_STYLE)
    .setOrigin(0.5)
    .setName('pinned-achievements-tally');
  const panel = createChromePanel(scene, PANEL_RIMS.strip).setName('pinned-achievements');
  on.layer.add([tab.face, sign, tally, panel]);
  const rows = read.map((each, at) =>
    createRow(scene, on, catalogue, each, at > 0, small, inspect),
  );

  let standing = chronicle;
  let folded = false;
  /** What shows of the tab as it is laid now. */
  let showing: Box = { x: 0, y: 0, width: 0, height: 0 };

  const lay = (): void => {
    let top = LEDGER.top;
    for (const row of rows) {
      row.root.setVisible(!folded);
      top += row.lay(standing, top);
    }
    const foot = Math.max(
      top + LEDGER.foot,
      LEDGER.top + LEDGER_TAB.drop + LEDGER_TAB.shows.height + LEDGER_TAB.drop,
    );
    // The last row's stop covers the ledger under the rows, so a press there reaches no tile.
    rows[rows.length - 1].reach(foot);
    standChromePanel(panel, {
      x: -PAST_THE_EDGE,
      y: LEDGER.top,
      width: LEDGER.width + PAST_THE_EDGE,
      height: foot - LEDGER.top,
    }).setVisible(!folded);

    const reached = read.filter(({ id }) => rowIn(standing, id).reached).length;
    tally.setText(text('achievement.tally', { reached, pinned: read.length })).setVisible(folded);
    const tabTop = LEDGER.top + LEDGER_TAB.drop;
    const { folded: closed } = LEDGER_TAB;
    showing = folded
      ? {
          x: 0,
          y: tabTop,
          width: Math.max(closed.least, ownBoxOf(tally).width + closed.past),
          height: closed.height,
        }
      : { x: LEDGER.width, y: tabTop, ...LEDGER_TAB.shows };
    tab.place({
      x: showing.x - LEDGER_TAB.hidden,
      y: showing.y,
      width: showing.width + LEDGER_TAB.hidden,
      height: showing.height,
    });
    const across = showing.x + showing.width / 2;
    const middle = showing.y + showing.height / 2;
    if (folded) {
      tally.setPosition(across, middle - closed.apart);
      sign.setPosition(across, middle + closed.apart).setAngle(180);
    } else {
      sign.setPosition(across - LEDGER_TAB.toward, middle).setAngle(0);
    }
  };
  lay();

  onHover(
    tab.face,
    () => {
      tooltip.under(
        text('button.pinned-achievements'),
        showing.x,
        showing.y + showing.height + STANDOFF,
      );
    },
    () => {
      tooltip.hide();
    },
  );
  onClick(tab.face, () => {
    unaim();
    folded = !folded;
    lay();
  });

  return {
    render(next: Chronicle): void {
      standing = next;
      lay();
    },
  };
}

/**
 * One row of the ledger: its name, its count and its goal while the achievement is not reached, its
 * name line alone in the reached ink once it is, and the rule along its top where `ruled`.
 */
function createRow(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  { id, technology, need }: Pinned,
  ruled: boolean,
  small: SmallCards,
  inspect: (name: Name) => void,
): Row {
  const plate = `pinned-achievement-${technology}`;
  const name = technologyName(technology);
  const goal = achievementGoal(id, need);

  const inner = LEDGER.width - 2 * PAD_X;
  const nameHeight = 2 * PAD_Y + NAME_LINE;
  const fullHeight = nameHeight + TEXT_LINE * linesOf(scene, goal, inner);
  const root = scene.add.container(0, 0).setName(plate);
  // Interactive, so no press reaches the map under it, and never marked as reacting to one.
  const stop = scene.add
    .zone(0, 0, LEDGER.width, fullHeight)
    .setOrigin(0, 0)
    .setInteractive()
    .setName(`${plate}-stop`);
  const rule = scene.add
    .rectangle(0, 0, LEDGER.width - LEDGER.ruleShort, 1, LOOK.paleInk, LOOK.rowRule)
    .setOrigin(0, 0)
    .setVisible(ruled)
    .setName(`${plate}-rule`);
  const content = scene.add.container(0, 0).setName(`${plate}-face`);
  const goalRun = scene.add.container(0, 0).setName(`${plate}-goal-run`);
  root.add([stop, rule, content]);
  on.layer.add(root);

  const ink = css(LOOK.charcoalInk);
  const nameLine = PAD_Y + NAME_LINE / 2;
  const named = addText(scene, PAD_X, nameLine, name, { ...NAME_STYLE, color: ink })
    .setOrigin(0, 0.5)
    .setName(`${plate}-name`);
  const count = addText(scene, LEDGER.width - PAD_X, nameLine, '', { ...TEXT_STYLE, color: ink })
    .setOrigin(1, 0.5)
    .setName(`${plate}-count`);
  content.add([named, count, goalRun]);
  const run = drawRun(
    scene,
    goalRun,
    goal,
    { x: PAD_X, y: PAD_Y + NAME_LINE + TEXT_LINE / 2 },
    inner,
    LOOK.charcoalInk,
    { over: (raiser, over) => small.over(over ? raiser : undefined), inspect },
  );
  run.label.setName(`${plate}-goal`);

  return {
    root,
    lay(standing, top) {
      const row = rowIn(standing, id);
      const { reached } = row;
      const height = reached ? nameHeight : fullHeight;
      root.setY(top);
      stop.setSize(LEDGER.width, height);
      goalRun.setVisible(!reached);
      content.setData('names', reached ? [] : run.names);
      inked(named, reached ? LOOK.reachedAchievementInk : LOOK.charcoalInk);
      named.setText(reached ? text('achievement.reached', { achievement: name }) : name);
      count
        .setText(text('achievement.count', { count: countOn(catalogue, standing, row), need }))
        .setVisible(!reached && need > 1);
      return height;
    },
    reach(foot) {
      stop.setSize(LEDGER.width, foot - root.y);
    },
  };
}
