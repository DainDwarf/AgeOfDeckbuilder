import Phaser from 'phaser';
import { BootScene } from './ui/boot-scene';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
});
