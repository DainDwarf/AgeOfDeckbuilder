import type Phaser from 'phaser';
import {
  ACCENT,
  addText,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  onClick,
  PANEL_EDGE,
  PANEL_FILL,
  UI_FONT,
} from './design-space';
import { text } from './text';

/** Every window the menu opens. */
export type MenuWindow = 'menu' | 'settings' | 'controls';

/** What pressing a window's button does: opens the window it names, or begins a fresh chronicle. */
export type MenuPress = Exclude<MenuWindow, 'menu'> | 'new-chronicle';

/**
 * The windows: what each one lists, in the order it lists them, and the one it closes back to. The
 * menu closes back to nothing, which is the table.
 */
const WINDOWS: Record<
  MenuWindow,
  { readonly buttons: readonly MenuPress[]; readonly from?: MenuWindow }
> = {
  menu: { buttons: ['settings', 'new-chronicle'] },
  settings: { buttons: ['controls'], from: 'menu' },
  controls: { buttons: [], from: 'settings' },
};

/** The window this one closes back to, and nothing for the one that closes back to the table. */
export function behind(which: MenuWindow): MenuWindow | undefined {
  return WINDOWS[which].from;
}

const WIDTH = 480;
const PADDING = 30;
const BUTTON_WIDTH = 320;
const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 12;

/** The panel's own dark ink: a window stands in the panel language, not on the scrim. */
const INK = '#0d1014';

const TITLE_STYLE = { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: INK };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };

/**
 * One window, centred on the design space: the box in the panel language, its title, and the
 * buttons it lists. The box takes the pointer so that a press on it is not a press on the scrim
 * behind, which backs the window out. The caller sets the depth and takes the window down.
 */
export function createWindow(
  scene: Phaser.Scene,
  which: MenuWindow,
  pressed: (press: MenuPress) => void,
): Phaser.GameObjects.Container {
  const { buttons } = WINDOWS[which];
  const title = addText(scene, 0, 0, text(`menu.${which}`), TITLE_STYLE).setOrigin(0.5, 0);

  const stacked =
    buttons.length === 0
      ? 0
      : PADDING + buttons.length * BUTTON_HEIGHT + (buttons.length - 1) * BUTTON_GAP;
  const height = 2 * PADDING + title.height + stacked;
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;

  const box = scene.add
    .rectangle(middle, top + height / 2, WIDTH, height, PANEL_FILL)
    .setStrokeStyle(1, PANEL_EDGE)
    .setInteractive();
  title.setPosition(middle, top + PADDING);

  const root = scene.add.container(0, 0, [box, title]).setName(which);
  buttons.forEach((press, index) => {
    const y =
      top +
      PADDING +
      title.height +
      PADDING +
      index * (BUTTON_HEIGHT + BUTTON_GAP) +
      BUTTON_HEIGHT / 2;
    const face = scene.add
      .rectangle(middle, y, BUTTON_WIDTH, BUTTON_HEIGHT, ACCENT)
      .setName(`${which}-${press}`)
      .setInteractive({ useHandCursor: true });
    onClick(face, () => pressed(press));
    root.add([face, addText(scene, middle, y, text(`menu.${press}`), LABEL_STYLE).setOrigin(0.5)]);
  });

  return root;
}
