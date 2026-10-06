import type Phaser from 'phaser';
import { type Chronicle, turnShown } from '../rules/state';
import { addText, type Box, type Stratum } from './design-space';
import { LOOK } from './look';
import { paperOf, TEXT_STYLE } from './plate';
import { text } from './text';

const HEIGHT = 28;
const CLEAR = 2;

/**
 * The turn of the next landing a card has shown, on a strip of the panel's paper just over a box and
 * as wide as it, and nothing while no turn is shown.
 */
export function createShownEvent(
  scene: Phaser.Scene,
  on: Stratum,
  over: Box,
): { render(chronicle: Chronicle): void } {
  const { width } = over;
  const root = scene.add
    .container(over.x, over.y - CLEAR - HEIGHT)
    .setName('shown-event')
    .setVisible(false);
  // Interactive, so no press reaches the map under it, and never marked as answering one.
  const stop = scene.add.zone(0, 0, width, HEIGHT).setOrigin(0, 0).setInteractive();
  const paper = paperOf(scene, width, HEIGHT, LOOK.panelFill);
  const line = addText(scene, width / 2, HEIGHT / 2, '', TEXT_STYLE)
    .setOrigin(0.5, 0.5)
    .setName('shown-event-turn');
  root.add([stop, paper, line]);
  on.layer.add(root);

  return {
    render(chronicle: Chronicle): void {
      const turn = turnShown(chronicle);
      root.setVisible(turn !== undefined);
      if (turn !== undefined) line.setText(text('shown-event.turn', { turn }));
    },
  };
}
