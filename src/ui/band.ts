import type Phaser from 'phaser';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { createChromePanel, PANEL_RIMS, PAST_THE_EDGE, standChromePanel } from './chrome';
import { BAR_HEIGHT, DESIGN_HEIGHT, DESIGN_WIDTH, type Stratum } from './design-space';

/** How far the resting cards' tops rise above the band: they stand in it as in a tray. */
const CLEARED = 24;

/** The band's top edge, and with it the bottom of everything the map is drawn in. */
const BAND_TOP = CARD_BASELINE - CARD_HEIGHT + CLEARED;

/** In design units: whoever cuts the camera to it applies the render factor. */
export const MAP_FRAME = {
  x: 0,
  y: BAR_HEIGHT,
  width: DESIGN_WIDTH,
  height: BAND_TOP - BAR_HEIGHT,
};

/** The band the hand and the piles stand in, so no tile is ever held under a card. */
export function createBand(scene: Phaser.Scene, on: Stratum): void {
  on.layer.add(
    standChromePanel(createChromePanel(scene, PANEL_RIMS.strip), {
      x: -PAST_THE_EDGE,
      y: BAND_TOP,
      width: DESIGN_WIDTH + 2 * PAST_THE_EDGE,
      height: DESIGN_HEIGHT - BAND_TOP + PAST_THE_EDGE,
    }).setName('band'),
  );
}
