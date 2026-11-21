import type Phaser from 'phaser';
import { CARD_HEIGHT } from './card-face';
import {
  createChromePanel,
  PANEL_RIMS,
  PAST_THE_EDGE,
  standChromePanel,
  takesThePointer,
} from './chrome';
import { DESIGN_WIDTH, onResize, type Stratum, screenSize } from './design-space';
import { layOutTray, type TrayLayout } from './tray-layout';

/** The hand's lane, the tray, the piles and the frame the map is held in, as the screen now stands. */
export function trayNow(): TrayLayout {
  return layOutTray(screenSize(), DESIGN_WIDTH, CARD_HEIGHT);
}

/** The band the hand and the piles stand in. */
export type Band = {
  /** Whether the object is the band's panel, which is beside the things. */
  isPaper(object: Phaser.GameObjects.GameObject): boolean;
};

/**
 * The band, a tray in the middle of the screen's bottom edge, running on past it and past a side that
 * reaches the screen's edge. It takes the pointer, so no press reaches the map under it.
 */
export function createBand(scene: Phaser.Scene, on: Stratum): Band {
  const band = takesThePointer(createChromePanel(scene, PANEL_RIMS.strip).setName('band'));
  on.layer.add(band);
  onResize(scene, () => {
    const { width, height } = screenSize();
    const { tray } = trayNow();
    const left = tray.x <= 0 ? -PAST_THE_EDGE : tray.x;
    const right = tray.x + tray.width >= width ? width + PAST_THE_EDGE : tray.x + tray.width;
    standChromePanel(band, {
      x: left,
      y: tray.y,
      width: right - left,
      height: height - tray.y + PAST_THE_EDGE,
    });
  });
  return {
    isPaper(object: Phaser.GameObjects.GameObject): boolean {
      return object === band;
    },
  };
}
