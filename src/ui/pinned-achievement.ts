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

/**
 * The achievement that earns the pinned technology, in the map's top left corner, where the
 * chronicle reads it, and nothing where it does not or nothing is pinned. A name in its goal raises
 * its small card on the chain handed and is inspected through `inspect`.
 */
export function createPinnedAchievement(
  scene: Phaser.Scene,
  on: Stratum,
  catalogue: Catalogue,
  chronicle: Chronicle,
  pin: string | undefined,
  small: SmallCards,
  inspect: (name: Name) => void,
): { render(chronicle: Chronicle): void } {
  const held = chronicle.achievements.find(
    ({ id }) => achievementOf(catalogue, chronicle.age, id).technology === pin,
  );
  if (pin === undefined || held === undefined) return { render: () => {} };
  const { id } = held;
  const { need } = achievementOf(catalogue, chronicle.age, id);
  const name = technologyName(pin);
  const goal = achievementGoal(id, need);

  const inner = PLATE_WIDTH - 2 * PAD_X;
  const height = 2 * PAD_Y + NAME_LINE + TEXT_LINE * linesOf(scene, goal, inner);
  const root = scene.add
    .container(MAP_FRAME.x + CHIP_INSET, MAP_FRAME.y + CHIP_INSET)
    .setName('pinned-achievement');
  // Interactive, so no press reaches the map under it, and never marked as answering one.
  const stop = scene.add.zone(0, 0, PLATE_WIDTH, height).setOrigin(0, 0).setInteractive();
  const paper = paperOf(scene, PLATE_WIDTH, height, LOOK.panelFill);
  const { well } = createWell(scene, 'pinned-achievement');
  placeWell(well, { x: 0, y: 0, width: PLATE_WIDTH, height });
  const content = scene.add.container(0, 0);
  root.add([stop, paper, well, content]);
  on.layer.add(root);

  const nameLine = PAD_Y + NAME_LINE / 2;
  const named = addText(scene, PAD_X, nameLine, name, NAME_STYLE)
    .setOrigin(0, 0.5)
    .setName('pinned-achievement-name');
  const count = addText(scene, PLATE_WIDTH - PAD_X, nameLine, '', TEXT_STYLE)
    .setOrigin(1, 0.5)
    .setName('pinned-achievement-count');
  content.add([named, count]);
  const run = drawRun(
    scene,
    content,
    goal,
    { x: PAD_X, y: PAD_Y + NAME_LINE + TEXT_LINE / 2 },
    inner,
    { over: (raiser, over) => small.over(over ? raiser : undefined), inspect },
  );
  run.label.setName('pinned-achievement-goal');

  return {
    render(standing: Chronicle): void {
      const row = standing.achievements.find((achievement) => achievement.id === id);
      if (row === undefined) throw new Error(`the chronicle's row holds no ${id}`);
      const { reached } = row;
      paper.setVisible(!reached);
      well.setVisible(reached);
      content.setPosition(reached ? SUNK : 0, reached ? SUNK : 0);
      named.setText(reached ? text('achievement.reached', { achievement: name }) : name);
      count
        .setText(text('achievement.count', { count: countOn(catalogue, standing, row), need }))
        .setVisible(!reached && need > 1);
    },
  };
}
