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
import {
  behind,
  createMenuButton,
  createRefusedSaveWindow,
  createWindow,
  type MenuWindow,
  type Opened,
} from './menu';
import { onRefused } from './storage';

/** What the menu asks of the chronicle scene at the press, and all it ever holds of it. */
export type LeavesChronicles = Phaser.Scene & { leave(): void };

/** What the menu says on the game's emitter as the first of its scrims rises and the last falls. */
const COVERED = 'menu-covered';

/**
 * The menu and the window a refused save raises over it, on a scene of their own: started after the
 * console and before every screen, so the console takes a key ahead of it and it takes one ahead of
 * whatever stands under it, and never stopped, so it outlives every chronicle.
 */
export class MenuScene extends Phaser.Scene {
  /** The menu raised on its first window, over whatever stands. */
  raise!: () => void;

  /** The whole menu taken down, the scrim with it; the refused-save window stays. */
  close!: () => void;

  /** Whether either scrim stands. */
  covered!: () => boolean;

  constructor() {
    super('menu');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    createMenuButton(this, () => this.raise());

    // Added after the button, which they therefore cover: a press there is a press on a scrim.
    const scrim = createScrim(this);
    // Its depth and its window's keep them over a window of the menu raised after them.
    const refusedSaveScrim = createScrim(this).setDepth(1);

    /** The window standing, and nothing while the scrim is down. */
    let standing: { which: MenuWindow; laid: Opened } | undefined;

    /** The refused-save window standing, and nothing while its scrim is down. */
    let refusedSave: Phaser.GameObjects.Container | undefined;

    let covered = false;

    /** The one place either scrim goes up or comes down, and the screen under them hears it. */
    const cover = (): void => {
      scrim.setVisible(standing !== undefined);
      refusedSaveScrim.setVisible(refusedSave !== undefined);
      const under = standing !== undefined || refusedSave !== undefined;
      if (under === covered) return;
      covered = under;
      this.game.events.emit(COVERED, under);
    };

    const takeDownRefusedSave = (): void => {
      refusedSave?.destroy();
      refusedSave = undefined;
      cover();
    };

    onRefused(() => {
      refusedSave = createRefusedSaveWindow(this, takeDownRefusedSave).setDepth(1);
      cover();
    });

    const raise = (which: MenuWindow): void => {
      standing?.laid.root.destroy();
      const laid = createWindow(this, which, {
        press: (press) => {
          switch (press) {
            case 'campaign':
              this.game.scene.getScene<LeavesChronicles>('ui').leave();
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
      cover();
    };

    const close = (): void => {
      standing?.laid.root.destroy();
      standing = undefined;
      cover();
    };

    /** One step back: onto the window this one was opened from, or off the screen altogether. */
    const back = (): void => {
      if (standing === undefined) return;
      const step = behind(standing.which);
      if (step === undefined) close();
      else raise(step);
    };

    /**
     * Every press taken while a window stands: the back key takes the refused-save window down while
     * it stands; under a window of the menu alone a slot listening binds it, the back key steps back.
     */
    const takes = (press: Bind): void => {
      if (refusedSave !== undefined) {
        if (boundTo(press, 'back')) takeDownRefusedSave();
        return;
      }
      if (standing === undefined || standing.laid.binds(press)) return;
      if (boundTo(press, 'back')) back();
    };

    onClick(scrim, back);
    onClick(scrim, back, 'right');
    onClick(refusedSaveScrim, takeDownRefusedSave);
    onClick(refusedSaveScrim, takeDownRefusedSave, 'right');
    stopsThePointer(this, () => (covered ? 'every' : 'no button held'));

    readsKeys(this, (event) => {
      if (!covered) return false;
      takes(keyPressed(event));
      return true;
    });
    takesMouseKeys(this, (press) => {
      if (!covered) return false;
      takes(press);
      return true;
    });

    this.raise = () => raise('menu');
    this.close = close;
    this.covered = () => covered;
  }
}

/** A scrim over the whole design space, down until a window rises on it. */
function createScrim(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
    .setOrigin(0, 0)
    .setVisible(false)
    .setInteractive();
}

/** The menu raised over whatever stands, for whichever screen asked for it. */
export function raiseMenu(scene: Phaser.Scene): void {
  scene.game.scene.getScene<MenuScene>('menu').raise();
}

/**
 * The back key, from the keyboard and the mouse alike, raising the menu on a screen that holds nothing
 * to back out of. A key it takes still reaches every other reader on the scene's own keyboard.
 */
export function backRaisesMenu(scene: Phaser.Scene): void {
  readsKeys(scene, (event) => {
    if (!boundTo(keyPressed(event), 'back')) return false;
    raiseMenu(scene);
    return true;
  });
  takesMouseKeys(scene, (press) => {
    if (!boundTo(press, 'back')) return false;
    raiseMenu(scene);
    return true;
  });
}

/** The menu taken down for the screen now rising. */
export function closeMenu(scene: Phaser.Scene): void {
  scene.game.scene.getScene<MenuScene>('menu').close();
}

/**
 * The menu taken down for the screen now rising, which hears every scrim of the menu scene rise and
 * fall from then on, and at once the refused-save window's, which may stand already.
 */
export function resetMenu(scene: Phaser.Scene, covering: (covered: boolean) => void): void {
  closeMenu(scene);
  whileUp(scene, scene.game.events, COVERED, covering);
  if (scene.game.scene.getScene<MenuScene>('menu').covered()) covering(true);
}
