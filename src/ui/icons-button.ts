import type Phaser from 'phaser';
import { MAP_FRAME } from './band';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { inked, type Stratum } from './design-space';
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
  const x = MAP_FRAME.x + CHIP_INSET + width / 2;
  const y = CARD_BASELINE - CARD_HEIGHT - OVER_THE_PILE - height / 2;
  const { button, label } = createSilverButton(scene, 'icons-button', reads, { x, y }, pressed);
  on.layer.add([button.face, label]);

  const icons = {
    sink(sunk: boolean): void {
      button.latch(sunk);
      inked(label, sunk ? LOOK.charcoalInk : LOOK.metalInk);
      const step = sunk ? SUNK : 0;
      label.setPosition(x + step, y + step);
    },
  };
  icons.sink(true);
  return icons;
}
