import type Phaser from 'phaser';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { DEPTH } from './depths';
import { BAR_HEIGHT, DESIGN_HEIGHT, DESIGN_WIDTH } from './design-space';
import { LOOK } from './look';

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

/** The flat band the hand and the piles stand in, so no tile is ever held under a card. */
export function createBand(scene: Phaser.Scene): void {
  scene.add
    .rectangle(0, BAND_TOP, DESIGN_WIDTH, DESIGN_HEIGHT - BAND_TOP, LOOK.panelFill)
    .setOrigin(0, 0)
    .setName('band')
    .setDepth(DEPTH.band);
  scene.add
    .rectangle(0, BAND_TOP, DESIGN_WIDTH, 1, LOOK.panelEdge)
    .setOrigin(0, 0)
    .setName('band-edge')
    .setDepth(DEPTH.band);
}
