import type Phaser from 'phaser';
import { CARD_BASELINE, CARD_HEIGHT } from './card-face';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PANEL_EDGE, PANEL_FILL } from './design-space';
import { BAR_HEIGHT } from './resource-bar';

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

/**
 * The flat band the hand and the piles stand in, so no tile is ever held under a card. Its depth is
 * under everything else the UI draws, all of which sets one of its own.
 */
export function createBand(scene: Phaser.Scene): void {
  scene.add
    .rectangle(0, BAND_TOP, DESIGN_WIDTH, DESIGN_HEIGHT - BAND_TOP, PANEL_FILL)
    .setOrigin(0, 0)
    .setName('band')
    .setDepth(1);
  scene.add
    .rectangle(0, BAND_TOP, DESIGN_WIDTH, 1, PANEL_EDGE)
    .setOrigin(0, 0)
    .setName('band-edge')
    .setDepth(1);
}
