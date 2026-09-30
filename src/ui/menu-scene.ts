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
  createWarning,
  createWindow,
  type MenuPress,
  type MenuWindow,
  type Opened,
  type Opens,
  type Said,
  type Warning,
} from './menu';
import { META_SCREENS } from './navbar';
import { type CoversOverlay, overlayAhead } from './overlay-scene';
import { clearSave, keepSave, readSaveFileText, saveFileText } from './save-entry';
import { onRefused } from './storage';

/** What the menu asks of the chronicle scene at the press, and all it ever holds of it. */
export type LeavesChronicles = Phaser.Scene & { leave(): void };

/** A window of the menu standing. */
type Standing = { readonly which: MenuWindow; readonly laid: Opened };

/** What the menu says on the game's emitter as the first of its scrims rises and the last falls. */
const COVERED = 'menu-covered';

/**
 * The menu and the window a refused save raises over it, on a scene of their own: started after the
 * console and before every screen, so the console takes a key ahead of it and it takes one ahead of
 * whatever stands under it, and never stopped, so it outlives every chronicle.
 */
export class MenuScene extends Phaser.Scene implements CoversOverlay {
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
    let standing: Standing | undefined;

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

    const presses = { press: (press: MenuPress) => pressed(press), back: () => back() };

    /** The window laid in place of the one standing, and standing from now on. */
    const stand = (which: MenuWindow, lay: () => Opened): Standing => {
      standing?.laid.root.destroy();
      standing = { which, laid: lay() };
      cover();
      return standing;
    };

    const raise = (which: Opens, said: Said = {}): Standing =>
      stand(which, () => createWindow(this, which, presses, said));

    /** The warning raised, whose press goes through with what `through` does, and the campaign screen after. */
    const warn = (which: Warning, through: () => void, said: Said = {}): Standing =>
      stand(which, () =>
        createWarning(
          this,
          which,
          presses,
          () => {
            through();
            campaignStands();
          },
          said,
        ),
      );

    /** The campaign screen started anew in place of whatever screen stands, on the save as it now is. */
    const campaignStands = (): void => {
      const scenes = this.game.scene;
      if (scenes.isActive('ui')) {
        scenes.getScene<LeavesChronicles>('ui').leave();
        return;
      }
      for (const key of META_SCREENS) {
        if (!scenes.isActive(key)) continue;
        const screen = scenes.getScene(key);
        overlayAhead(screen.scene);
        screen.scene.start('campaign');
      }
    };

    /** A save file's text, arriving for the window it was chosen from: refused on it, or warned of. */
    const chosen = (asked: Standing, text: string): void => {
      if (standing !== asked) return;
      const { save, dropped } = readSaveFileText(text);
      if (save === undefined) raise('manage-save', { under: 'manage-save.refused' });
      else
        warn(
          'import-warning',
          () => keepSave(save),
          dropped.length > 0 ? { over: 'manage-save.dropped' } : {},
        );
    };

    const pressed = (press: MenuPress): void => {
      switch (press) {
        case 'campaign':
          campaignStands();
          return;
        case 'manage-save':
        case 'settings':
        case 'controls':
          raise(press);
          return;
        case 'back':
          back();
          return;
        case 'export':
          raise('manage-save');
          download(saveFileName(new Date()), saveFileText());
          return;
        case 'import': {
          const asked = raise('manage-save');
          chooseFile((text) => chosen(asked, text));
          return;
        }
        case 'clear':
          warn('clear-warning', clearSave);
          return;
      }
      const unlisted: never = press;
      throw new Error(`no menu press is ${JSON.stringify(unlisted)}`);
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
    // The Menu button answers no wheel, and the chronicle screen zooms under it.
    stopsThePointer(
      this,
      () => (covered ? 'every' : 'no button held'),
      () => covered,
    );

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

/** The save file's name, dated the player's own day. */
function saveFileName(day: Date): string {
  const two = (count: number): string => String(count).padStart(2, '0');
  const date = `${day.getFullYear()}-${two(day.getMonth() + 1)}-${two(day.getDate())}`;
  return `age-of-deckbuilder-save-${date}.adbsave`;
}

/** The text handed to the player as a file of that name, through the browser's own download. */
function download(name: string, text: string): void {
  const address = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = address;
  link.download = name;
  link.click();
  // A browser may fetch the address after the click has returned.
  setTimeout(() => URL.revokeObjectURL(address), 60_000);
}

// The browser opens its file window only inside a press of the player's: a button's release is
// answered from inside the DOM's own mouseup (phaser/src/input/mouse/MouseManager.js:412,
// phaser/src/input/InputPlugin.js:2041), so nothing between the release and the click may await.
/** The browser's own file window, and the text of the file chosen in it once read; none chosen, nothing. */
function chooseFile(chosen: (text: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file !== undefined) void file.text().then(chosen);
  });
  input.click();
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

/**
 * The menu taken down for the screen now rising, which hears every scrim of the menu scene rise and
 * fall from then on, and at once the refused-save window's, which may stand already.
 */
export function resetMenu(scene: Phaser.Scene, covering: (covered: boolean) => void): void {
  const menu = scene.game.scene.getScene<MenuScene>('menu');
  menu.close();
  whileUp(scene, scene.game.events, COVERED, covering);
  if (menu.covered()) covering(true);
}
