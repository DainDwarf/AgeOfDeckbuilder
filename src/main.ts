/// <reference types="vite/client" />
// First, before any import that can throw as it is evaluated: the watch is only as early as it is.
import './failed-boot';
import Phaser from 'phaser';
import { CATALOGUE } from './content/catalogue';
import { booted } from './failed-boot';
import { CampaignScreen } from './ui/campaign-screen';
import { ChronicleScene, openChronicle } from './ui/chronicle-scene';
import { CollectionScreen } from './ui/collection-screen';
import { DebugConsole } from './ui/debug-console';
import {
  backingSize,
  followPixelRatio,
  followPointer,
  followWindow,
  releaseOnBlur,
  UI_FAMILY,
} from './ui/design-space';
import { readMouseKeys } from './ui/keys';
import { LaunchScreen } from './ui/launch-screen';
import { css, LOOK } from './ui/look';
import { MapScene } from './ui/map-scene';
import { BUILDING_SHEET, FACE_SHEET, featureSheet, RIVER_SHEET, UNIT_SHEET } from './ui/marks';
import { MenuScene } from './ui/menu-scene';
import { OverlayScene, overlayAhead } from './ui/overlay-scene';
import { type Opening, savedOpening } from './ui/save-entry';
import { drawSheet, queueSheet, type Sheet } from './ui/sheet';

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
  if (asked === null) return { on: 'campaign' };
  const saved = savedOpening();
  if (saved === undefined) throw new Error('the save holds no chronicle to continue');
  return { on: 'chronicle', opening: saved };
}

const first = firstScreen();

/** One weight of the face fetched and in the document: a file that cannot be fetched rejects. */
async function loadFace(file: string, weight: string): Promise<void> {
  const source = `url(${import.meta.env.BASE_URL}assets/fonts/source-sans-3/${file})`;
  const face = new FontFace(UI_FAMILY, source, { weight });
  document.fonts.add(await face.load());
}

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

/** What the boot starts first: the textures loaded and drawn into their sheets, then the first screen. */
class LoadScene extends Phaser.Scene {
  /** The sheets the boot draws its paintings into, in the order it draws them. */
  private sheets: readonly Sheet[] = [];

  preload(): void {
    // The features sheet last: its tinted paintings, the river's cut and the deer in his net are
    // drawn off the others'.
    this.sheets = [FACE_SHEET, RIVER_SHEET, BUILDING_SHEET, UNIT_SHEET, featureSheet(CATALOGUE)];
    for (const sheet of this.sheets) queueSheet(this.load, sheet);
  }

  create(): void {
    for (const sheet of this.sheets) drawSheet(this.textures, sheet);
    // The screen the boot opens reaches into the scenes started ahead of it as it is created: one started
    // after it has no handle yet to be reached by, and the boot throws.
    game.scene.start('console');
    game.scene.start('menu');
    startFirst(first);
    booted();
    this.scene.stop();
  }
}

// Before the game: a Text keeps the fallback's measures for a face loaded after it (docs/PHASER.md).
await Promise.all([
  loadFace('SourceSans3-Regular.ttf.woff2', '400'),
  loadFace('SourceSans3-Bold.ttf.woff2', '700'),
]);

const backing = backingSize();
const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: backing.width,
  height: backing.height,
  backgroundColor: css(LOOK.page),
  disableContextMenu: true,
  // With it on, a scene's timers and held keys run slow under 60 frames a second (docs/PHASER.md).
  fps: { smoothStep: false },
  render: { mipmapFilter: 'LINEAR_MIPMAP_LINEAR' },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Left to itself Phaser sends a bare div of its own, and the browser's black shows around the design.
    fullscreenTarget: document.body,
  },
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
// Not the map scene: a scene with files to load creates only once they have, and the chronicle screen's
// create reaches into the map's (docs/PHASER.md).
game.scene.add('load', LoadScene);
game.events.once(Phaser.Core.Events.READY, () => {
  // A batch shader built for several textures tears a rotated Text (docs/PHASER.md). Not the config's
  // `maxTextures`: that caps the units every draw binds, and at one the browse's mask binds nothing.
  (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).renderNodes.setMaxParallelTextureUnits(1);
  game.scene.start('load');
});
followWindow(game);
followPixelRatio(game);
followPointer(game);
releaseOnBlur(game);
readMouseKeys(game);
