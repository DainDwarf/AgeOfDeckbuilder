import Phaser from 'phaser';
import { BootScene } from './ui/boot-scene';
import { BACKING_HEIGHT, BACKING_WIDTH } from './ui/design-space';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: BACKING_WIDTH,
  height: BACKING_HEIGHT,
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
});
