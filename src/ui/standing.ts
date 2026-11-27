import type Phaser from 'phaser';
import {
  createChromeFrame,
  createChromePanel,
  hangChromePanel,
  PANEL_RIMS,
  standChromeFrame,
  takesThePointer,
} from './chrome';
import type { ModeFrame } from './chrome-kit';
import { HUNG_NAME_STYLE } from './city-panel';
import {
  addText,
  BAR_HEIGHT,
  onResize,
  ownBoxOf,
  type Stratum,
  screenSize,
  UI_FONT,
} from './design-space';
import { css, LOOK } from './look';
import { text } from './text';

/** What the chronicle screen shows it is standing in, standing only while that is on. */
export type Standing = { show(on: boolean): void };

/** The frame round the screen the standing is drawn as, on the stratum, named `name`, hidden. */
export function createModeFrame(
  scene: Phaser.Scene,
  on: Stratum,
  stood: ModeFrame,
  name: string,
): Standing {
  const frame = createChromeFrame(scene, stood).setName(name).setVisible(false);
  on.layer.add(frame);
  onResize(scene, () => {
    standChromeFrame(frame, stood, screenSize());
  });
  return {
    show(on: boolean): void {
      frame.setVisible(on);
    },
  };
}

/** How far the settle phase's panel reaches past its longer line on each side. */
const PAST_THE_LINE = 24;

/** How far under the resource bar's foot the middle of the phase's name stands, the middle of its sentence, and the panel's foot. */
const UNDER_THE_BAR = { name: 18, sentence: 39, foot: 48 };

const SENTENCE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '14px',
  color: css(LOOK.panelPalerInk),
};

/**
 * The settle phase's panel on the stratum, named `settle-phase`, hidden: hung under the resource
 * bar's middle, the phase's name over what its end does to the hand.
 */
export function createSettlePanel(scene: Phaser.Scene, on: Stratum): Standing {
  // Taking the pointer, though it reacts to no press, so no press reaches the map under it.
  const panel = takesThePointer(createChromePanel(scene, PANEL_RIMS.plate)).setName(
    'settle-phase-panel',
  );
  const name = addText(scene, 0, UNDER_THE_BAR.name, text('settle-panel.name'), HUNG_NAME_STYLE)
    .setOrigin(0.5)
    .setName('settle-phase-name');
  const sentence = addText(
    scene,
    0,
    UNDER_THE_BAR.sentence,
    text('settle-panel.banished'),
    SENTENCE_STYLE,
  )
    .setOrigin(0.5)
    .setName('settle-phase-sentence');
  const width = Math.max(ownBoxOf(name).width, ownBoxOf(sentence).width) + 2 * PAST_THE_LINE;
  hangChromePanel(panel, -width / 2, width, UNDER_THE_BAR.foot);
  const root = scene.add
    .container(0, BAR_HEIGHT, [panel, name, sentence])
    .setName('settle-phase')
    .setVisible(false);
  on.layer.add(root);
  onResize(scene, () => {
    root.setX(screenSize().width / 2);
  });

  return {
    show(on: boolean): void {
      root.setVisible(on);
    },
  };
}
