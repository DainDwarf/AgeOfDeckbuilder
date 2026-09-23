import Phaser from 'phaser';
import { CATALOGUES, catalogueOf } from './content/catalogues';
import { deckOf, scheduleOf } from './rules/catalogue';
import { regionOf } from './rules/map-kinds';
import { ChronicleScene } from './ui/chronicle-scene';
import { DebugConsole } from './ui/debug-console';
import { backingSize, followPointer, followWindow, releaseOnBlur } from './ui/design-space';
import { readMouseKeys } from './ui/keys';
import { type Choices, firstsOf, LaunchPage } from './ui/launch-page';
import { css, LOOK } from './ui/look';
import { MapScene } from './ui/map-scene';
import { MenuScene } from './ui/menu-scene';
import { OverlayScene } from './ui/overlay-scene';

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
  type: Phaser.WEBGL,
  width: backing.width,
  height: backing.height,
  backgroundColor: css(LOOK.page),
  disableContextMenu: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
// The tower's barriers rest on this; on, a stopped release strands a drag off the hand (docs/PHASER.md).
game.input.globalTopOnly = false;
// Added bottom up, started top down: render order is the add order, key order the start order (docs/PHASER.md).
game.scene.add('launch', LaunchPage);
game.scene.add('map', MapScene);
game.scene.add('ui', ChronicleScene);
game.scene.add('overlay', OverlayScene);
game.scene.add('menu', MenuScene);
game.scene.add('console', DebugConsole);
// The ui scene reaches into the console's, the menu's, the overlay's and the map's as it is created,
// so this order is load-bearing twice over: started last, none of them has the handle it is reached
// by yet and the chronicle throws on the address that opens straight.
game.events.once(Phaser.Core.Events.READY, () => {
  // A batch shader built for several textures tears a rotated Text (docs/PHASER.md). Not the config's
  // `maxTextures`: that caps the units every draw binds, and at one the browse's mask binds nothing.
  (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).renderNodes.setMaxParallelTextureUnits(1);
  game.scene.start('console');
  game.scene.start('menu');
  if (asked('deck') === undefined) {
    game.scene.start('launch', choices);
    return;
  }
  game.scene.start('overlay');
  game.scene.start('map');
  game.scene.start('ui', choices);
});
followWindow(game);
followPointer(game);
releaseOnBlur(game);
readMouseKeys(game);

window.game = game;
