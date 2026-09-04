import type Phaser from 'phaser';
import { MAP_FRAME } from './band';
import { ACCENT, addText, onClick, UI_FONT } from './design-space';
import { text } from './text';

/** Over the band and the map under it, under the cards that stand up into the map's frame. */
const DEPTH = 2;

/** How wide the frame's stroke is; Phaser centres a stroke on its path, hence the half-width inset. */
const STROKE = 8;

const CHIP = { x: 24, y: 60, width: 118, height: 30 };

const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: '#0d1014' };

/** The two marks city mode is known by; both stand only while the mode is on. */
export type CityMode = { show(on: boolean): void };

/**
 * What the chronicle screen shows while city mode is on: the map's frame drawn in the accent, and
 * the chip naming the mode, which leaves it. Both are laid out once and shown or hidden; the mode
 * itself is the scene's.
 */
export function createCityMode(scene: Phaser.Scene, leave: () => void): CityMode {
  const frame = scene.add
    .rectangle(
      MAP_FRAME.x + STROKE / 2,
      MAP_FRAME.y + STROKE / 2,
      MAP_FRAME.width - STROKE,
      MAP_FRAME.height - STROKE,
    )
    .setOrigin(0, 0)
    .setStrokeStyle(STROKE, ACCENT)
    .setName('city-frame')
    .setDepth(DEPTH)
    .setVisible(false);

  const chip = scene.add
    .rectangle(CHIP.x, CHIP.y, CHIP.width, CHIP.height, ACCENT)
    .setOrigin(0, 0)
    .setName('city-chip')
    .setDepth(DEPTH)
    .setVisible(false);
  // Added after the chip: equal depths draw in the order they were added.
  const label = addText(
    scene,
    CHIP.x + CHIP.width / 2,
    CHIP.y + CHIP.height / 2,
    text('button.city-mode'),
    LABEL_STYLE,
  )
    .setOrigin(0.5, 0.5)
    .setName('city-chip-label')
    .setDepth(DEPTH)
    .setVisible(false);

  onClick(chip, leave);

  return {
    show(on: boolean): void {
      frame.setVisible(on);
      chip.setVisible(on);
      label.setVisible(on);
      if (on) chip.setInteractive({ useHandCursor: true });
      else chip.disableInteractive();
    },
  };
}
