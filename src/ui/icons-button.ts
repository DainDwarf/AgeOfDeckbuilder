import type Phaser from 'phaser';
import { mapFrame } from './band';
import { CARD_HEIGHT, cardBaseline } from './card-face';
import { inked, onResize, type Stratum } from './design-space';
import { LOOK } from './look';
import { createSilverButton, silverButtonSize } from './menu';
import { SUNK } from './resource-bar';
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
    x = mapFrame().x + CHIP_INSET + width / 2;
    y = cardBaseline() - CARD_HEIGHT - OVER_THE_PILE - height / 2;
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
