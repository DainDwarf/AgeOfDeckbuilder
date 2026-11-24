import type Phaser from 'phaser';
import { achievementOf, type Catalogue } from '../rules/catalogue';
import { countOn } from '../rules/chronicle';
import type { Chronicle, ChronicleAchievement } from '../rules/state';
import { type Name, namedAt, type SmallCards, spotOn } from './card-face';
import {
  createChromePanel,
  createVeil,
  PANEL_RIMS,
  PAST_THE_EDGE,
  standChromePanel,
  veilOverStripRow,
} from './chrome';
import { addText, type Box, faintRule, inked, type Stratum } from './design-space';
import { capstoneName } from './event-text';
import { createFoldTab, TAB_ROOM } from './fold-tab';
import { css, LOOK } from './look';
import { createPanel, type Held, type Panel } from './panel';
import { LEDGER, LOG } from './pinned-layout';
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
import type { Tooltip } from './tooltip';

/** An achievement the ledger reads, and the technology it earns. */
type Pinned = { readonly id: string; readonly technology: string; readonly need: number };

/** A row of the ledger: what of it reacts to the pointer, and its laying at a top as the chronicle stands. */
type Row = {
  readonly held: Held;
  /** The row laid at `top`; how tall it stands. */
  lay(standing: Chronicle, top: number): number;
};

/** How tall a row reading its name line alone stands. */
const NAME_ROW = 2 * PAD_Y + NAME_LINE;

/** The chronicle's row of the achievement; one it does not hold throws. */
function rowIn(standing: Chronicle, id: string): ChronicleAchievement {
  const row = standing.achievements.find((achievement) => achievement.id === id);
  if (row === undefined) throw new Error(`the chronicle's row holds no ${id}`);
  return row;
}

/**
 * The ledger against the screen's left edge, a row to the capstone at its top, then a row to each
 * achievement earning a pinned technology the chronicle reads, and the tab folding it; past its
 * lowest foot its rows scroll as a browse's.
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
    capstone,
  }: {
    small: SmallCards;
    inspect: (name: Name) => void;
    tooltip: Tooltip;
    /**
     * Whatever is being aimed let go, as a left click on a thing lets it go: the tab a left click
     * moves, and the capstone's row a window covers, are gone from under the pointer before the
     * screen reads what the click was let go on.
     */
    unaim: () => void;
    /** The capstone's window raised. */
    capstone: () => void;
  },
): { render(chronicle: Chronicle): void; readonly scrolls: Pick<Panel, 'under' | 'wheel'> } {
  const read = chronicle.achievements.flatMap(({ id }): Pinned[] => {
    const { technology, need } = achievementOf(catalogue, chronicle.age, id);
    return pins.includes(technology) ? [{ id, technology, need }] : [];
  });

  const tab = createFoldTab(scene, on, {
    name: 'pinned-achievements',
    reads: text('button.pinned-achievements'),
    tooltip,
    unaim,
    fold: () => {
      lay();
    },
  });
  const back = createChromePanel(scene, PANEL_RIMS.strip).setName('pinned-achievements');
  on.layer.add(back);
  const held = scene.add.container(0, 0).setName('pinned-rows');
  const rows = [
    createCapstoneRow(scene, held, chronicle.timeline.capstone.id, { unaim, capstone }),
    ...read.map((each) => createRow(scene, held, catalogue, each, small, inspect)),
  ];
  const panel = createPanel(
    { scene, on, follow: small.follow },
    {
      name: 'pinned-achievements-rows',
      frame: { x: 0, y: LEDGER.top, width: LEDGER.width, height: TAB_ROOM },
      parts: [held],
      held: rows.map((row) => row.held),
      foot: LEDGER.top + TAB_ROOM,
    },
  );

  let standing = chronicle;
  /** The ledger's foot and its rows' as last laid. */
  let laid = { foot: 0, rows: 0 };

  const lay = (): void => {
    let top = LEDGER.top;
    for (const row of rows) top += row.lay(standing, top);
    const under = top + LEDGER.foot;
    const foot = Math.min(Math.max(under, LEDGER.top + TAB_ROOM), LOG.top - LEDGER.overTheLog);
    if (laid.foot !== foot || laid.rows !== under) {
      laid = { foot, rows: under };
      standChromePanel(back, {
        x: -PAST_THE_EDGE,
        y: LEDGER.top,
        width: LEDGER.width + PAST_THE_EDGE,
        height: foot - LEDGER.top,
      });
      panel.place(
        { x: 0, y: LEDGER.top, width: LEDGER.width, height: foot - LEDGER.top },
        0,
        under,
      );
    }
    back.setVisible(!tab.folded);
    panel.show(!tab.folded);

    const reached = read.filter(({ id }) => rowIn(standing, id).reached).length;
    tab.lay(
      LEDGER.top,
      read.length > 0 ? text('achievement.tally', { reached, pinned: read.length }) : undefined,
    );
  };
  lay();

  return {
    render(next: Chronicle): void {
      standing = next;
      lay();
    },
    scrolls: panel,
  };
}

/**
 * A row's form, named `plate`: the rule along its top where `ruled`, and its face holding its name at
 * the left end of its name line and `end` at the right end, `<plate>-<end>`.
 */
type RowForm = {
  readonly root: Phaser.GameObjects.Container;
  readonly face: Phaser.GameObjects.Container;
  readonly named: Phaser.GameObjects.Text;
  readonly end: Phaser.GameObjects.Text;
  /** The box the row covers, as last laid. */
  box(): Box;
  /** The row laid at `top`, this tall. */
  standAt(top: number, height: number): void;
};

function rowFormOf(
  scene: Phaser.Scene,
  held: Phaser.GameObjects.Container,
  { plate, name, end, ruled }: { plate: string; name: string; end: string; ruled: boolean },
): RowForm {
  const root = scene.add.container(0, 0).setName(plate);
  const rule = faintRule(scene, 0, 0, LEDGER.width - LEDGER.ruleShort)
    .setVisible(ruled)
    .setName(`${plate}-rule`);
  const face = scene.add.container(0, 0).setName(`${plate}-face`);
  root.add([rule, face]);
  held.add(root);
  let tall = NAME_ROW;

  const ink = css(LOOK.charcoalInk);
  const nameLine = PAD_Y + NAME_LINE / 2;
  const named = addText(scene, PAD_X, nameLine, name, { ...NAME_STYLE, color: ink })
    .setOrigin(0, 0.5)
    .setName(`${plate}-name`);
  const ended = addText(scene, LEDGER.width - PAD_X, nameLine, '', { ...TEXT_STYLE, color: ink })
    .setOrigin(1, 0.5)
    .setName(`${plate}-${end}`);
  face.add([named, ended]);
  return {
    root,
    face,
    named,
    end: ended,
    box: () => ({ x: 0, y: root.y, width: LEDGER.width, height: tall }),
    standAt(top, height) {
      root.setY(top);
      tall = height;
    },
  };
}

/**
 * The capstone's row: its name, and the word naming it the capstone at its line's right end; lighter
 * under the pointer, and either click on it raises the capstone's window, a left click letting go of
 * whatever is being aimed first.
 */
function createCapstoneRow(
  scene: Phaser.Scene,
  held: Phaser.GameObjects.Container,
  id: string,
  presses: { readonly unaim: () => void; readonly capstone: () => void },
): Row {
  const plate = 'pinned-capstone';
  const { root, face, end, box, standAt } = rowFormOf(scene, held, {
    plate,
    name: capstoneName(id),
    end: 'word',
    ruled: false,
  });
  end.setText(text('capstone.word'));
  const veil = veilOverStripRow(createVeil(scene, `${plate}-veil`), LEDGER.width, NAME_ROW);
  root.addAt(veil, root.list.indexOf(face));

  return {
    held: {
      get box() {
        return box();
      },
      reactions: {
        point(at) {
          veil.setVisible(at !== undefined);
        },
        rests: () => false,
        inspect: presses.capstone,
      },
      press: () => {
        presses.unaim();
        presses.capstone();
      },
    },
    lay(_standing, top) {
      standAt(top, NAME_ROW);
      return NAME_ROW;
    },
  };
}

/**
 * One achievement's row: its name, its count and its goal while the achievement is not reached, its
 * name line alone in the reached ink once it is, and the rule along its top; a name in the goal
 * reacts to the rest and the right click.
 */
function createRow(
  scene: Phaser.Scene,
  held: Phaser.GameObjects.Container,
  catalogue: Catalogue,
  { id, technology, need }: Pinned,
  small: SmallCards,
  inspect: (name: Name) => void,
): Row {
  const plate = `pinned-achievement-${technology}`;
  const name = technologyName(technology);
  const goal = achievementGoal(id, need);
  const {
    face,
    named,
    end: count,
    box,
    standAt,
  } = rowFormOf(scene, held, {
    plate,
    name,
    end: 'count',
    ruled: true,
  });

  const inner = LEDGER.width - 2 * PAD_X;
  const fullHeight = NAME_ROW + TEXT_LINE * linesOf(scene, goal, inner);
  const goalRun = scene.add.container(0, 0).setName(`${plate}-goal-run`);
  face.add(goalRun);
  const run = drawRun(
    scene,
    goalRun,
    goal,
    { x: PAD_X, y: PAD_Y + NAME_LINE + TEXT_LINE / 2 },
    inner,
    LOOK.charcoalInk,
    undefined,
  );
  run.label.setName(`${plate}-goal`);

  /** The names the goal reads as the row stands: none once the achievement is reached. */
  let names: readonly Name[] = run.names;
  const nameAt = (x: number, y: number): Name | undefined => namedAt(goalRun, names, x, y);

  return {
    held: {
      get box() {
        return box();
      },
      reactions: {
        point(at) {
          const under = at === undefined ? undefined : nameAt(at.x, at.y);
          small.over(
            under === undefined ? undefined : { name: under, where: () => spotOn(goalRun, under) },
          );
        },
        rests: (at) => nameAt(at.x, at.y) !== undefined,
        inspect(at) {
          const under = nameAt(at.x, at.y);
          if (under !== undefined) inspect(under);
        },
      },
    },
    lay(standing, top) {
      const row = rowIn(standing, id);
      const { reached } = row;
      const height = reached ? NAME_ROW : fullHeight;
      standAt(top, height);
      goalRun.setVisible(!reached);
      names = reached ? [] : run.names;
      face.setData('names', names);
      inked(named, reached ? LOOK.reachedAchievementInk : LOOK.charcoalInk);
      named.setText(reached ? text('achievement.reached', { achievement: name }) : name);
      count
        .setText(text('achievement.count', { count: countOn(catalogue, standing, row), need }))
        .setVisible(!reached && need > 1);
      return height;
    },
  };
}
