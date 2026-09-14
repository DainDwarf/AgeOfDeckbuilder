import Phaser from 'phaser';
import { STAND_IN, STAND_IN_REGION, STAND_IN_SCHEDULE } from './content/stand-in';
import { cardOf, deckOf, scheduleOf } from './rules/catalogue';
import type { CardId } from './rules/state';
import { ChronicleScene } from './ui/chronicle-scene';
import { backingSize, followWindow, releaseOnBlur } from './ui/design-space';
import { readMouseKeys } from './ui/keys';

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

/**
 * The deck asked for in the address: a deck by its id, or a list of card ids. There is no deck to
 * fall back on, so anything else stops the boot.
 */
function askedDeck(): readonly CardId[] {
  const asked = new URLSearchParams(window.location.search).get('deck');
  if (asked === null || asked.trim() === '') {
    throw new Error('no deck on the address: ?deck= a deck id, or a list of card ids');
  }
  if (Object.hasOwn(STAND_IN.decks, asked)) return deckOf(STAND_IN, asked);

  const cards = asked.split(',').map((id) => id.trim());
  for (const id of cards) cardOf(STAND_IN, id);
  return cards;
}

/** The schedule asked for in the address by its id, and the stand-in's own where it names none. */
function askedSchedule(): string {
  const asked = new URLSearchParams(window.location.search).get('schedule');
  if (asked === null || asked.trim() === '') return STAND_IN_SCHEDULE;
  scheduleOf(STAND_IN, asked);
  return asked;
}

const backing = backingSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: backing.width,
  height: backing.height,
  backgroundColor: '#0d1117',
  disableContextMenu: true,
  // Phaser 4.2.1 picks a batch's sampler by exact float equality on an interpolated varying, so a
  // rotated Text tears (phaserjs/phaser#7372). One texture per batch skips the comparison; the
  // line goes when a release fixes the shader.
  maxTextures: 1,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new ChronicleScene(STAND_IN, STAND_IN_REGION, askedSchedule(), askedSeed(), askedDeck())],
});
followWindow(game);
releaseOnBlur(game);
readMouseKeys(game);

window.game = game;
