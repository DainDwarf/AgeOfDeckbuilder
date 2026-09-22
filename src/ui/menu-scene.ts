import Phaser from 'phaser';
import { type Bind, boundTo, keyPressed } from './bindings';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  holdDesignSpace,
  onClick,
  stopsThePointer,
  whileUp,
} from './design-space';
import { readsKeys, takesMouseKeys } from './keys';
import { LOOK } from './look';
import { behind, createMenuButton, createWindow, type MenuWindow, type Opened } from './menu';

/** What the menu asks of the chronicle scene at the press, and all it ever holds of it. */
export type OpensChronicles = Phaser.Scene & { newChronicle(): void };

/** What the menu says on the game's emitter as its scrim rises and falls. */
const COVERED = 'menu-covered';

/**
 * The menu, on a scene of its own: started after the console and before every screen, so the console
 * takes a key ahead of it and it takes one ahead of whatever stands under it, and never stopped, so
 * it outlives every chronicle.
 */
export class MenuScene extends Phaser.Scene {
  /** The menu raised on its first window, over whatever stands. */
  raise!: () => void;

  /** The whole menu taken down, the scrim with it. */
  close!: () => void;

  constructor() {
    super('menu');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    createMenuButton(this, () => this.raise());

    // Added after the button, which it therefore covers: a press there is a press on the scrim.
    const scrim = this.add
      .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
      .setOrigin(0, 0)
      .setVisible(false)
      .setInteractive();

    /** The window standing, and nothing while the scrim is down. */
    let standing: { which: MenuWindow; laid: Opened } | undefined;

    /** The one place the scrim goes up and comes down, and the screen under it hears it. */
    const cover = (under: boolean): void => {
      if (scrim.visible === under) return;
      scrim.setVisible(under);
      this.game.events.emit(COVERED, under);
    };

    const raise = (which: MenuWindow): void => {
      standing?.laid.root.destroy();
      const laid = createWindow(this, which, {
        press: (press) => {
          switch (press) {
            case 'new-chronicle':
              this.game.scene.getScene<OpensChronicles>('ui').newChronicle();
              return;
            case 'settings':
            case 'controls':
              raise(press);
              return;
          }
        },
        back: () => back(),
      });
      standing = { which, laid };
      cover(true);
    };

    const close = (): void => {
      standing?.laid.root.destroy();
      standing = undefined;
      cover(false);
    };

    /** One step back: onto the window this one was opened from, or off the screen altogether. */
    const back = (): void => {
      if (standing === undefined) return;
      const step = behind(standing.which);
      if (step === undefined) close();
      else raise(step);
    };

    /** Every press taken while a window stands: a slot listening binds it, the back key steps back. */
    const takes = (press: Bind): void => {
      if (standing === undefined || standing.laid.binds(press)) return;
      if (boundTo(press, 'back')) back();
    };

    onClick(scrim, back);
    stopsThePointer(this, () => (standing === undefined ? 'no button held' : 'every'));

    readsKeys(this, (event) => {
      if (standing === undefined) return false;
      takes(keyPressed(event));
      return true;
    });
    takesMouseKeys(this, (press) => {
      if (standing === undefined) return false;
      takes(press);
      return true;
    });

    this.raise = () => raise('menu');
    this.close = close;
  }
}

/** The menu raised over whatever stands, for whichever screen asked for it. */
export function raiseMenu(scene: Phaser.Scene): void {
  scene.game.scene.getScene<MenuScene>('menu').raise();
}

/**
 * The menu taken down for the chronicle screen now rising, and its scrim announced while that screen
 * stands, for whatever that screen cannot swallow.
 */
export function resetMenu(scene: Phaser.Scene, covering: (covered: boolean) => void): void {
  scene.game.scene.getScene<MenuScene>('menu').close();
  whileUp(scene, scene.game.events, COVERED, covering);
}
