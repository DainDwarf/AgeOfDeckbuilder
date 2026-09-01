import Phaser from 'phaser';
import { beginChronicle } from './rules/chronicle';
import { ChronicleScene } from './ui/chronicle-scene';
import { BACKING_HEIGHT, BACKING_WIDTH } from './ui/design-space';

// The e2e suite and browser-console debugging observe the running game through this handle;
// it is optional because the window exists before the game does.
declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

/** The seed asked for in the address, so a chronicle can be replayed and a spec can be written. */
function askedSeed(): number | undefined {
  const asked = new URLSearchParams(window.location.search).get('seed');
  if (asked === null || asked.trim() === '') return undefined;
  const seed = Number(asked);
  return Number.isInteger(seed) ? seed : undefined;
}

// The one place entropy enters the game: `src/rules/` draws only from the seed it is handed.
const chronicle = beginChronicle(askedSeed() ?? (Math.random() * 2 ** 32) | 0);

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: BACKING_WIDTH,
  height: BACKING_HEIGHT,
  backgroundColor: '#0d1117',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new ChronicleScene(chronicle)],
});
