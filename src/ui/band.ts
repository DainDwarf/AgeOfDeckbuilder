import type Phaser from 'phaser';
import { CARD_HEIGHT, cardBaseline } from './card-face';
import { createChromePanel, PANEL_RIMS, PAST_THE_EDGE, standChromePanel } from './chrome';
import { BAR_HEIGHT, type Box, onResize, type Stratum, screenSize } from './design-space';

/** How far the resting cards' tops rise above the band: they stand in it as in a tray. */
const CLEARED = 24;

/** The band's top edge, and with it the bottom of everything the map is drawn in. */
function bandTop(): number {
  return cardBaseline() - CARD_HEIGHT + CLEARED;
}

/** In design units: whoever cuts the camera to it applies the render factor. */
export function mapFrame(): Box {
  return { x: 0, y: BAR_HEIGHT, width: screenSize().width, height: bandTop() - BAR_HEIGHT };
}

/** The band the hand and the piles stand in, so no tile is ever held under a card. */
export function createBand(scene: Phaser.Scene, on: Stratum): void {
  const band = createChromePanel(scene, PANEL_RIMS.strip).setName('band');
  on.layer.add(band);
  onResize(scene, () => {
    const { width, height } = screenSize();
    const top = bandTop();
    standChromePanel(band, {
      x: -PAST_THE_EDGE,
      y: top,
      width: width + 2 * PAST_THE_EDGE,
      height: height - top + PAST_THE_EDGE,
    });
  });
}
