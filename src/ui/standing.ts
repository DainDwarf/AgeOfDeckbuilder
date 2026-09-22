import type Phaser from 'phaser';
import { MAP_FRAME } from './band';
import { addText, onClick, type Stratum, UI_FONT } from './design-space';
import { css, LOOK } from './look';

/** How wide the frame's stroke is; Phaser centres a stroke on its path, hence the half-width inset. */
const STROKE = 8;

/** How far the chip stands clear of the stroke's inner edge, above it and to its right. */
const CLEAR = 16;

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
 * what a press on that chip leaves — nothing on a chip that answers none.
 */
export type Stood = {
  readonly name: string;
  readonly colour: number;
  readonly label: string;
  readonly leave?: () => void;
};

/**
 * What the chronicle screen shows it is standing in — city mode, the settle phase: the map's frame
 * in that colour and the chip naming it in the frame's top-right corner, sized to its own word.
 * Both are laid out once and shown or hidden; what is on is the scene's.
 */
export function createStanding(scene: Phaser.Scene, on: Stratum, stood: Stood): Standing {
  const frame = scene.add
    .rectangle(
      MAP_FRAME.x + STROKE / 2,
      MAP_FRAME.y + STROKE / 2,
      MAP_FRAME.width - STROKE,
      MAP_FRAME.height - STROKE,
    )
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
  on.layer.add([frame, chip, label]);

  const width = label.width + PADDING.x;
  const height = label.height + PADDING.y;
  const x = MAP_FRAME.x + MAP_FRAME.width - STROKE - CLEAR - width;
  const y = MAP_FRAME.y + STROKE + CLEAR;
  chip.setPosition(x, y).setSize(width, height);
  label.setPosition(x + width / 2, y + height / 2);

  const leave = stood.leave;
  if (leave !== undefined) onClick(chip, leave);

  return {
    show(on: boolean): void {
      frame.setVisible(on);
      chip.setVisible(on);
      label.setVisible(on);
      if (on && leave !== undefined) chip.setInteractive({ useHandCursor: true });
      else chip.disableInteractive();
    },
  };
}
