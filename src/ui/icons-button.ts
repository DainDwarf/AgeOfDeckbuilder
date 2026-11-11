import type Phaser from 'phaser';
import { MAP_FRAME } from './band';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { answersPress, onClick, type Stratum } from './design-space';
import { createPaperButton } from './menu';
import { createWell, placeWell, SUNK } from './resource-bar';
import { CHIP_INSET } from './standing';
import { text } from './text';

/** How far the button's bottom edge stands over the draw pile's top. */
const OVER_THE_PILE = 8;

/** The button sunk in its well, or standing on its face. */
export type IconsButton = { sink(sunk: boolean): void };

/** The Icons button in the map's bottom-left corner; a press on it is `pressed`. */
export function createIconsButton(
  scene: Phaser.Scene,
  on: Stratum,
  pressed: () => void,
): IconsButton {
  const { face, label } = createPaperButton(scene, 'icons-button-face', text('button.icons'));
  label.setName('icons-button-label');
  const { width, height } = face;
  const left = MAP_FRAME.x + CHIP_INSET;
  const top = CARD_BASELINE - CARD_HEIGHT - OVER_THE_PILE - height;
  const x = left + width / 2;
  const y = top + height / 2;
  face.setPosition(x, y);
  const { well } = createWell(scene, 'icons-button');
  placeWell(well, { x: left, y: top, width, height });
  // The face is hidden while the button is sunk, and a hidden object is never hit (docs/PHASER.md).
  const press = scene.add
    .zone(left, top, width, height)
    .setOrigin(0, 0)
    .setName('icons-button')
    .setInteractive();
  onClick(answersPress(press), pressed);
  on.layer.add([face, well, label, press]);

  const button = {
    sink(sunk: boolean): void {
      face.setVisible(!sunk);
      well.setVisible(sunk);
      const step = sunk ? SUNK : 0;
      label.setPosition(x + step, y + step);
    },
  };
  button.sink(true);
  return button;
}
