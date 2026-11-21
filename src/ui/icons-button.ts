import type Phaser from 'phaser';
import type { Stratum } from './design-space';
import { LOOK } from './look';
import { createCornerButton } from './menu';
import { SUNK } from './resource-bar';
import { text } from './text';
import type { Tooltip } from './tooltip';

/** The button sunk in its well, or standing on its face. */
export type IconsButton = { sink(sunk: boolean): void };

/**
 * The Icons button left of the Menu button, drawn as it is, naming itself on the tooltip; a press on
 * it is `pressed`.
 */
export function createIconsButton(
  scene: Phaser.Scene,
  on: Stratum,
  tooltip: Tooltip,
  pressed: () => void,
): IconsButton {
  const button = createCornerButton(
    scene,
    on,
    { symbol: 'icons-button', name: 'icons-button', at: 'icons' },
    { tooltip, reads: text('button.icons') },
    pressed,
  );

  const icons = {
    sink(sunk: boolean): void {
      button.latch(sunk);
      if (sunk) button.ink(LOOK.charcoalInk, SUNK);
      else button.ink();
    },
  };
  icons.sink(true);
  return icons;
}
