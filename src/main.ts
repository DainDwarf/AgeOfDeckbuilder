import Phaser from 'phaser';
import { CARDS, type CardId, DECKS, type DeckId } from './rules/cards';
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
  if (Object.hasOwn(DECKS, asked)) return DECKS[asked as DeckId];

  const cards = asked.split(',').map((id) => id.trim());
  for (const id of cards) {
    if (!Object.hasOwn(CARDS, id)) throw new Error(`${id} is neither a deck nor a card`);
  }
  return cards as CardId[];
}

const backing = backingSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: backing.width,
  height: backing.height,
  backgroundColor: '#0d1117',
  disableContextMenu: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new ChronicleScene(askedSeed(), askedDeck())],
});
followWindow(game);
releaseOnBlur(game);
readMouseKeys(game);

window.game = game;
