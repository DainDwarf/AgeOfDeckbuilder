// First, before any import that can throw as it is evaluated: the watch is only as early as it is.
import './failed-boot';
import Phaser from 'phaser';
import { CATALOGUE } from './content/catalogue';
import { booted } from './failed-boot';
import { ageOf, deckOf, firstRegion } from './rules/catalogue';
import { regionOf } from './rules/map-kinds';
import { CampaignScreen } from './ui/campaign-screen';
import { ChronicleScene } from './ui/chronicle-scene';
import { DebugConsole } from './ui/debug-console';
import { backingSize, followPointer, followWindow, releaseOnBlur } from './ui/design-space';
import { readMouseKeys } from './ui/keys';
import { firstsOf, LaunchPage } from './ui/launch-page';
import { css, LOOK } from './ui/look';
import { MapScene } from './ui/map-scene';
import { MenuScene } from './ui/menu-scene';
import { OverlayScene } from './ui/overlay-scene';
import { type Choices, type Opening, savedOpening } from './ui/save-entry';

// The e2e suite and browser-console debugging observe the running game through this handle;
// it is optional because the window exists before the game does.
declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

const address = new URLSearchParams(window.location.search);

/** What the address names under that key, and nothing where it names nothing. */
function asked(key: 'continue' | 'age' | 'region' | 'deck' | 'seed'): string | undefined {
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

/**
 * What the address names, each id resolved through the catalogue — a region through the named age's
 * regions, or the first age's — and the firsts for the rest.
 */
function askedChoices(): Choices {
  const firsts = firstsOf(askedSeed());
  const age = asked('age') ?? firsts.age;
  const region = asked('region');
  const deck = asked('deck');
  if (region !== undefined) regionOf(CATALOGUE, ageOf(CATALOGUE, age), region);
  if (deck !== undefined) deckOf(CATALOGUE, deck);
  return {
    ...firsts,
    age,
    region: region ?? firstRegion(CATALOGUE, age),
    deck: deck ?? firsts.deck,
  };
}

/** The screen the boot opens: the campaign screen, or the chronicle screen on an opening. */
type FirstScreen =
  | { readonly on: 'campaign' }
  | { readonly on: 'chronicle'; readonly opening: Opening };

/**
 * What the address asks for: the chronicle the save holds, which it must hold; a chronicle launched
 * straight on the choices, where it names a deck; and the campaign screen otherwise.
 */
function firstScreen(): FirstScreen {
  if (asked('continue') !== undefined) {
    const saved = savedOpening();
    if (saved === undefined) throw new Error('the save holds no chronicle to continue');
    return { on: 'chronicle', opening: saved };
  }
  if (asked('deck') === undefined) return { on: 'campaign' };
  return { on: 'chronicle', opening: askedChoices() };
}

const first = firstScreen();

/** The first screen started, over the console and the menu. */
function startFirst(screen: FirstScreen): void {
  switch (screen.on) {
    case 'campaign':
      game.scene.start('campaign');
      return;
    case 'chronicle':
      game.scene.start('overlay');
      game.scene.start('map');
      game.scene.start('ui', screen.opening);
      return;
  }
  const unlisted: never = screen;
  throw new Error(`no first screen is ${JSON.stringify(unlisted)}`);
}

const backing = backingSize();
const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: backing.width,
  height: backing.height,
  backgroundColor: css(LOOK.page),
  disableContextMenu: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
// At once: a boot failing from here on is destroyed through this handle.
window.game = game;
// The tower's barriers rest on this; on, a stopped release strands a drag off the hand (docs/PHASER.md).
game.input.globalTopOnly = false;
// Added bottom up, started top down: render order is the add order, key order the start order (docs/PHASER.md).
game.scene.add('campaign', CampaignScreen);
game.scene.add('launch', LaunchPage);
game.scene.add('map', MapScene);
game.scene.add('ui', ChronicleScene);
game.scene.add('overlay', OverlayScene);
game.scene.add('menu', MenuScene);
game.scene.add('console', DebugConsole);
// The ui scene reaches into the console's, the menu's, the overlay's and the map's as it is created,
// and the campaign screen and the page into the menu's, so this order is load-bearing twice over:
// started last, none of them has the handle it is reached by yet and the screen the boot opens throws.
game.events.once(Phaser.Core.Events.READY, () => {
  // A batch shader built for several textures tears a rotated Text (docs/PHASER.md). Not the config's
  // `maxTextures`: that caps the units every draw binds, and at one the browse's mask binds nothing.
  (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).renderNodes.setMaxParallelTextureUnits(1);
  game.scene.start('console');
  game.scene.start('menu');
  startFirst(first);
  booted();
});
followWindow(game);
followPointer(game);
releaseOnBlur(game);
readMouseKeys(game);
