import Phaser from 'phaser';
import { beginChronicle } from './rules/chronicle';
import { ChronicleScene } from './ui/chronicle-scene';
import { BACKING_HEIGHT, BACKING_WIDTH } from './ui/design-space';

// The one place entropy enters the game: `src/rules/` draws only from the seed it is handed.
const chronicle = beginChronicle((Math.random() * 2 ** 32) | 0);

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: BACKING_WIDTH,
  height: BACKING_HEIGHT,
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new ChronicleScene(chronicle)],
});
