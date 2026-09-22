import Phaser from 'phaser';
import { CATALOGUES, catalogueOf } from './content/catalogues';
import { deckOf, scheduleOf } from './rules/catalogue';
import { regionOf } from './rules/map-kinds';
import { ChronicleScene } from './ui/chronicle-scene';
import { DebugConsole } from './ui/debug-console';
import { backingSize, followWindow, releaseOnBlur } from './ui/design-space';
import { readMouseKeys } from './ui/keys';
import { type Choices, firstsOf, LaunchPage } from './ui/launch-page';
import { css, LOOK } from './ui/look';

// The e2e suite and browser-console debugging observe the running game through this handle;
// it is optional because the window exists before the game does.
declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

const address = new URLSearchParams(window.location.search);

/** What the address names under that key, and nothing where it names nothing. */
function asked(key: string): string | undefined {
  const value = address.get(key);
  return value === null || value.trim() === '' ? undefined : value;
}

/** The seed asked for in the address, so a chronicle can be replayed and a spec can be written. */
function askedSeed(): number | undefined {
  const value = asked('seed');
  if (value === undefined) return undefined;
  const seed = Number(value);
  return Number.isInteger(seed) ? seed : undefined;
}

/** What the address names, each id resolved through the catalogue, and the firsts for the rest. */
function askedChoices(): Choices {
  const content = asked('content');
  const catalogue = content === undefined ? CATALOGUES[0] : catalogueOf(content);
  const firsts = firstsOf(catalogue, askedSeed());
  const region = asked('region');
  const schedule = asked('schedule');
  const deck = asked('deck');
  if (region !== undefined) regionOf(catalogue, region);
  if (schedule !== undefined) scheduleOf(catalogue, schedule);
  if (deck !== undefined) deckOf(catalogue, deck);
  return {
    ...firsts,
    region: region ?? firsts.region,
    schedule: schedule ?? firsts.schedule,
    deck: deck ?? firsts.deck,
  };
}

const choices = askedChoices();
const backing = backingSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: backing.width,
  height: backing.height,
  backgroundColor: css(LOOK.page),
  disableContextMenu: true,
  // Phaser 4.2.1 picks a batch's sampler by exact float equality on an interpolated varying, so a
  // rotated Text tears (phaserjs/phaser#7372). One texture per batch skips the comparison; the
  // line goes when a release fixes the shader.
  maxTextures: 1,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
// The render order is the add order, bottom first; the key order is the start order, first started
// first heard, a scene restarted going to the back. The two run opposite ways, so the console is
// added last and started first, which neither the config's own array nor a start before boot can do.
game.scene.add('launch', LaunchPage);
game.scene.add('chronicle', ChronicleScene);
game.scene.add('console', DebugConsole);
// The chronicle scene reaches into the console's as it is created, so this order is load-bearing
// twice over: started second, the console has no `reset` yet and the chronicle throws on the
// address that opens straight.
game.events.once(Phaser.Core.Events.READY, () => {
  game.scene.start('console');
  game.scene.start(asked('deck') === undefined ? 'launch' : 'chronicle', choices);
});
followWindow(game);
releaseOnBlur(game);
readMouseKeys(game);

window.game = game;
