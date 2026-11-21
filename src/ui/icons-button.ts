import type Phaser from 'phaser';
import { trayNow } from './band';
import { inked, onResize, type Stratum } from './design-space';
import { LOOK } from './look';
import { createSilverButton, silverButtonSize } from './menu';
import { SUNK } from './resource-bar';
import { text } from './text';
import { ROUND } from './tray-layout';

/** How far the button's bottom edge stands over the resting cards' tops. */
const OVER_THE_HAND = 8;

/** The button sunk in its well, or standing on its face. */
export type IconsButton = { sink(sunk: boolean): void };

/** The Icons button over the draw pile, its left edge on the pile's; a press on it is `pressed`. */
export function createIconsButton(
  scene: Phaser.Scene,
  on: Stratum,
  pressed: () => void,
): IconsButton {
  const reads = text('button.icons');
  const { width, height } = silverButtonSize(scene, reads);
  const { button, label } = createSilverButton(
    scene,
    'icons-button',
    reads,
    { x: 0, y: 0 },
    pressed,
  );
  on.layer.add([button.face, label]);

  /** Where the button's middle stands, and how far its label is sunk with it. */
  let x = 0;
  let y = 0;
  let step = 0;
  onResize(scene, () => {
    const { piles, restingTop } = trayNow();
    x = piles['draw-pile'].x - ROUND / 2 + width / 2;
    y = restingTop - OVER_THE_HAND - height / 2;
    button.place({ x: x - width / 2, y: y - height / 2, width, height });
    label.setPosition(x + step, y + step);
  });

  const icons = {
    sink(sunk: boolean): void {
      button.latch(sunk);
      inked(label, sunk ? LOOK.charcoalInk : LOOK.metalInk);
      step = sunk ? SUNK : 0;
      label.setPosition(x + step, y + step);
    },
  };
  icons.sink(true);
  return icons;
}
