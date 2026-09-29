// First, before any import that can throw as it is evaluated: the watch is only as early as it is.
import './failed-boot';
import Phaser from 'phaser';
import { booted } from './failed-boot';
import { CampaignScreen } from './ui/campaign-screen';
import { ChronicleScene, openChronicle } from './ui/chronicle-scene';
import { CollectionScreen } from './ui/collection-screen';
import { DebugConsole } from './ui/debug-console';
import { backingSize, followPointer, followWindow, releaseOnBlur } from './ui/design-space';
import { readMouseKeys } from './ui/keys';
import { LaunchScreen } from './ui/launch-screen';
import { css, LOOK } from './ui/look';
import { MapScene } from './ui/map-scene';
import { MenuScene } from './ui/menu-scene';
import { OverlayScene, overlayAhead } from './ui/overlay-scene';
import { type Opening, savedOpening } from './ui/save-entry';

// The e2e suite and browser-console debugging observe the running game through this handle;
// it is optional because the window exists before the game does.
declare global {
  interface Window {
    game?: Phaser.Game;
  }
}

/** The screen the boot opens: the campaign screen, or the chronicle screen on an opening. */
type FirstScreen =
  | { readonly on: 'campaign' }
  | { readonly on: 'chronicle'; readonly opening: Opening };

/**
 * What the address asks for: the chronicle the save holds, which it must hold, where it names
 * `continue`; and the campaign screen otherwise.
 */
function firstScreen(): FirstScreen {
  const asked = new URLSearchParams(window.location.search).get('continue');
  if (asked === null || asked.trim() === '') return { on: 'campaign' };
  const saved = savedOpening();
  if (saved === undefined) throw new Error('the save holds no chronicle to continue');
  return { on: 'chronicle', opening: saved };
}

const first = firstScreen();

/** The first screen started, over the console and the menu. */
function startFirst(screen: FirstScreen): void {
  switch (screen.on) {
    case 'campaign':
      overlayAhead(game.scene);
      game.scene.start('campaign');
      return;
    case 'chronicle':
      openChronicle(game.scene, screen.opening);
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
game.scene.add('launch', LaunchScreen);
game.scene.add('collection', CollectionScreen);
game.scene.add('map', MapScene);
game.scene.add('ui', ChronicleScene);
game.scene.add('overlay', OverlayScene);
game.scene.add('menu', MenuScene);
game.scene.add('console', DebugConsole);
// The screen the boot opens reaches into the scenes started ahead of it as it is created: one started
// after it has no handle yet to be reached by, and the boot throws.
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
