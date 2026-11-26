import type Phaser from 'phaser';
import { addText, onResize, type Stratum, screenSize, UI_FONT } from './design-space';
import { css, LOOK } from './look';
import { cornerNow } from './menu';

/** How wide the frame's stroke is; Phaser centres a stroke on its path, hence the half-width inset. */
const STROKE = 8;

/** How far the chip's fill reaches past its label, sideways and down. */
const PADDING = { x: 40, y: 10 };

const LABEL_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '16px',
  fontStyle: 'bold',
  color: css(LOOK.ink),
};

/** The frame, and the chip where it wears one, standing only while what they name is on. */
export type Standing = { show(on: boolean): void };

/** What one standing is drawn for: the name its objects take, its colour, and the word on its chip where it wears one. */
export type Stood = {
  readonly name: string;
  readonly colour: number;
  readonly label?: string;
};

/**
 * What the chronicle screen shows it is standing in — city mode, the settle phase: a frame round the
 * screen in that colour, and the chip naming it under the summary's place where it wears one, reacting
 * to no press. What is on is the scene's.
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
  on.frame.layer.add(frame);
  onResize(scene, () => {
    const screen = screenSize();
    frame
      .setPosition(STROKE / 2, STROKE / 2)
      .setSize(screen.width - STROKE, screen.height - STROKE);
  });
  const { label } = stood;
  const chip = label === undefined ? undefined : createChip(scene, on.chip, { ...stood, label });

  return {
    show(on: boolean): void {
      frame.setVisible(on);
      chip?.show(on);
    },
  };
}

/** The chip naming a standing under the summary's place, standing only while it is on. */
function createChip(scene: Phaser.Scene, on: Stratum, stood: Required<Stood>): Standing {
  const chip = scene.add
    .rectangle(0, 0, 1, 1, stood.colour)
    .setOrigin(0, 0)
    .setName(`${stood.name}-chip`)
    .setVisible(false);
  const label = addText(scene, 0, 0, stood.label, LABEL_STYLE)
    .setOrigin(0.5, 0.5)
    .setName(`${stood.name}-chip-label`)
    .setVisible(false);
  on.layer.add([chip, label]);

  const width = label.width + PADDING.x;
  const height = label.height + PADDING.y;
  chip.setSize(width, height);
  onResize(scene, () => {
    const { right, top } = cornerNow().chip;
    chip.setPosition(right - width, top);
    label.setPosition(right - width / 2, top + height / 2);
  });

  return {
    show(on: boolean): void {
      chip.setVisible(on);
      label.setVisible(on);
      // Interactive while it stands, reacting to no press, so no press reaches the map under it.
      if (on) chip.setInteractive();
      else chip.disableInteractive();
    },
  };
}
