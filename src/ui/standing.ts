import type Phaser from 'phaser';
import {
  addText,
  onClick,
  onResize,
  reactsToPress,
  type Stratum,
  screenSize,
  UI_FONT,
} from './design-space';
import { css, LOOK } from './look';
import { cornerNow } from './menu';

/** How wide the frame's stroke is; Phaser centres a stroke on its path, hence the half-width inset. */
const STROKE = 8;

/** How far the chip stands clear of the stroke's inner edge, to its right. */
const CLEAR = 16;

/** How far the chip stands in from the screen's right edge. */
export const CHIP_INSET = STROKE + CLEAR;

/** How far under the Menu button the chip stands. */
const UNDER_THE_MENU = 14;

/** How far the chip's fill reaches past its label, sideways and down. */
const PADDING = { x: 40, y: 10 };

const LABEL_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '16px',
  fontStyle: 'bold',
  color: css(LOOK.ink),
};

/** The frame and the chip, both standing only while what they name is on. */
export type Standing = { show(on: boolean): void };

/**
 * What one standing is drawn for: the name its objects take, its colour, the word on its chip, and
 * what a press on that chip leaves — nothing on a chip that reacts to none.
 */
export type Stood = {
  readonly name: string;
  readonly colour: number;
  readonly label: string;
  readonly leave?: () => void;
};

/**
 * What the chronicle screen shows it is standing in — city mode, the settle phase: a frame round the
 * screen in that colour and the chip naming it under the Menu button. What is on is the scene's.
 */
export function createStanding(
  scene: Phaser.Scene,
  on: { readonly frame: Stratum; readonly chip: Stratum },
  stood: Stood,
): Standing {
  const frame = scene.add
    .rectangle(0, 0, 1, 1)
    .setOrigin(0, 0)
    .setStrokeStyle(STROKE, stood.colour)
    .setName(`${stood.name}-frame`)
    .setVisible(false);

  const chip = scene.add
    .rectangle(0, 0, 1, 1, stood.colour)
    .setOrigin(0, 0)
    .setName(`${stood.name}-chip`)
    .setVisible(false);
  const label = addText(scene, 0, 0, stood.label, LABEL_STYLE)
    .setOrigin(0.5, 0.5)
    .setName(`${stood.name}-chip-label`)
    .setVisible(false);
  on.frame.layer.add(frame);
  on.chip.layer.add([chip, label]);

  const width = label.width + PADDING.x;
  const height = label.height + PADDING.y;
  chip.setSize(width, height);
  onResize(scene, () => {
    const screen = screenSize();
    frame
      .setPosition(STROKE / 2, STROKE / 2)
      .setSize(screen.width - STROKE, screen.height - STROKE);
    const { menu } = cornerNow();
    const x = screen.width - CHIP_INSET - width;
    const y = menu.y + menu.height + UNDER_THE_MENU;
    chip.setPosition(x, y);
    label.setPosition(x + width / 2, y + height / 2);
  });

  const leave = stood.leave;
  if (leave !== undefined) onClick(reactsToPress(chip), leave);

  return {
    show(on: boolean): void {
      frame.setVisible(on);
      chip.setVisible(on);
      label.setVisible(on);
      // Interactive while it stands, reacting to a press or not, so no press reaches the map under it.
      if (on) chip.setInteractive();
      else chip.disableInteractive();
    },
  };
}
