import type Phaser from 'phaser';
import { achievementOf, type Catalogue } from '../rules/catalogue';
import { countOn } from '../rules/chronicle';
import type { Chronicle } from '../rules/state';
import { MAP_FRAME } from './band';
import type { Name } from './card-face';
import { addText, type Stratum } from './design-space';
import { LOOK } from './look';
import {
  drawRun,
  linesOf,
  NAME_LINE,
  NAME_STYLE,
  PAD_X,
  PAD_Y,
  paperOf,
  TEXT_LINE,
  TEXT_STYLE,
} from './plate';
import { createWell, placeWell, SUNK } from './resource-bar';
import type { SmallCards } from './small-card';
import { CHIP_INSET } from './standing';
import { achievementGoal, technologyName, text } from './text';
import { PLATE_WIDTH } from './tree-layout';

/** How far apart two pinned achievements stand. */
const GAP = 8;

/** A pinned achievement drawn at the top handed as the chronicle stands; how tall it stands. */
type Placed = (chronicle: Chronicle, top: number) => number;

/**
 * The achievements earning the pinned technologies the chronicle reads, stacked in the map's top left
 * corner in its order. A name in a goal raises its small card on the chain handed.
 */
export function createPinnedAchievements(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  chronicle: Chronicle,
  pins: readonly string[],
  small: SmallCards,
  inspect: (name: Name) => void,
): { render(chronicle: Chronicle): void } {
  const plates = chronicle.achievements.flatMap(({ id }) => {
    const { technology, need } = achievementOf(catalogue, chronicle.age, id);
    if (!pins.includes(technology)) return [];
    return [
      createPinnedAchievement(scene, on, catalogue, { id, technology, need }, small, inspect),
    ];
  });
  return {
    render(standing: Chronicle): void {
      let top = MAP_FRAME.y + CHIP_INSET;
      for (const placed of plates) top += placed(standing, top) + GAP;
    },
  };
}

/** One pinned achievement: its full plate while it is not reached, its name line once it is. */
function createPinnedAchievement(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  { id, technology, need }: { id: string; technology: string; need: number },
  small: SmallCards,
  inspect: (name: Name) => void,
): Placed {
  const plate = `pinned-achievement-${technology}`;
  const name = technologyName(technology);
  const goal = achievementGoal(id, need);

  const inner = PLATE_WIDTH - 2 * PAD_X;
  const nameHeight = 2 * PAD_Y + NAME_LINE;
  const fullHeight = nameHeight + TEXT_LINE * linesOf(scene, goal, inner);
  const root = scene.add.container(MAP_FRAME.x + CHIP_INSET, 0).setName(plate);
  // Interactive, so no press reaches the map under it, and never marked as answering one.
  const stop = scene.add
    .zone(0, 0, PLATE_WIDTH, fullHeight)
    .setOrigin(0, 0)
    .setInteractive()
    .setName(`${plate}-stop`);
  const paper = paperOf(scene, PLATE_WIDTH, fullHeight, LOOK.panelFill);
  const { well } = createWell(scene, plate);
  const content = scene.add.container(0, 0);
  const goalRun = scene.add.container(0, 0).setName(`${plate}-goal-run`);
  root.add([stop, paper, well, content]);
  on.layer.add(root);

  const nameLine = PAD_Y + NAME_LINE / 2;
  const named = addText(scene, PAD_X, nameLine, name, NAME_STYLE)
    .setOrigin(0, 0.5)
    .setName(`${plate}-name`);
  const count = addText(scene, PLATE_WIDTH - PAD_X, nameLine, '', TEXT_STYLE)
    .setOrigin(1, 0.5)
    .setName(`${plate}-count`);
  content.add([named, count, goalRun]);
  const run = drawRun(
    scene,
    goalRun,
    goal,
    { x: PAD_X, y: PAD_Y + NAME_LINE + TEXT_LINE / 2 },
    inner,
    { over: (raiser, over) => small.over(over ? raiser : undefined), inspect },
  );
  run.label.setName(`${plate}-goal`);
  content.setName(`${plate}-face`);

  return (standing, top) => {
    const row = standing.achievements.find((achievement) => achievement.id === id);
    if (row === undefined) throw new Error(`the chronicle's row holds no ${id}`);
    const { reached } = row;
    const height = reached ? nameHeight : fullHeight;
    root.setY(top);
    stop.setSize(PLATE_WIDTH, height);
    paper.setSize(PLATE_WIDTH, height).setVisible(!reached);
    placeWell(well, { x: 0, y: 0, width: PLATE_WIDTH, height });
    well.setVisible(reached);
    goalRun.setVisible(!reached);
    content
      .setPosition(reached ? SUNK : 0, reached ? SUNK : 0)
      .setData('names', reached ? [] : run.names);
    named.setText(reached ? text('achievement.reached', { achievement: name }) : name);
    count
      .setText(text('achievement.count', { count: countOn(catalogue, standing, row), need }))
      .setVisible(!reached && need > 1);
    return height;
  };
}
