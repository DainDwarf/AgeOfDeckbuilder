import type Phaser from 'phaser';
import { bindings, CONTROLS, type Control, keyLabel, rebind, restoreDefaults } from './bindings';
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
 * menu closes back to nothing, which is the chronicle screen. Controls lists the bindings instead
 * of buttons.
 */
const WINDOWS: Record<
  MenuWindow,
  { readonly buttons: readonly MenuPress[]; readonly from?: MenuWindow }
> = {
  menu: { buttons: ['settings', 'new-chronicle'] },
  settings: { buttons: ['controls'], from: 'menu' },
  controls: { buttons: [], from: 'settings' },
};

/** The window this one closes back to; nothing for the one that closes back to the chronicle screen. */
export function behind(which: MenuWindow): MenuWindow | undefined {
  return WINDOWS[which].from;
}

const WIDTH = 480;
const PADDING = 30;
const BUTTON_WIDTH = 320;
const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 12;

/** One control's row: its two slots, and how far the next row stands below it. */
const SLOT_WIDTH = 120;
const SLOT_HEIGHT = 34;
const SLOT_GAP = 10;
const ROW_GAP = 8;

/** How far the rows of slots reach below the top of the Controls window's body. */
const ROWS_HEIGHT = CONTROLS.length * SLOT_HEIGHT + (CONTROLS.length - 1) * ROW_GAP;

/** The panel's own dark ink: a window stands in the panel language, not on the scrim. */
const INK = '#0d1014';

const TITLE_STYLE = { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: INK };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const SLOT_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };

/** A window standing on the scrim, and the keyboard's one way into it. */
export type Opened = {
  readonly root: Phaser.GameObjects.Container;
  /** A key pressed while a slot listens binds there and is taken; nothing listens, nothing taken. */
  binds(key: string): boolean;
};

/** What a window is pressed for: a button of its own, or the step back the Back button takes. */
export type Presses = {
  press(press: MenuPress): void;
  back(): void;
};

/** An accent face carrying a label: the one shape everything pressable in a window is drawn as. */
function pressable(
  scene: Phaser.Scene,
  at: { x: number; y: number; width: number; height: number },
  name: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  pressed: () => void,
): { face: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const face = scene.add
    .rectangle(at.x, at.y, at.width, at.height, ACCENT)
    .setName(name)
    .setInteractive({ useHandCursor: true });
  onClick(face, pressed);
  const label = addText(scene, at.x, at.y, '', style).setOrigin(0.5).setName(`${name}-label`);
  return { face, label };
}

/** How far below the title a window's own content reaches, the padding above it included. */
function bodyHeight(which: MenuWindow): number {
  if (which === 'controls') return PADDING + ROWS_HEIGHT + PADDING + BUTTON_HEIGHT;
  const { buttons } = WINDOWS[which];
  if (buttons.length === 0) return 0;
  return PADDING + buttons.length * BUTTON_HEIGHT + (buttons.length - 1) * BUTTON_GAP;
}

/**
 * The Controls window's body: one row per control, its label on the left and its two slots on the
 * right, and the two buttons under them. A slot pressed listens for the key that binds it, and the
 * next press of anything else lets go of the listen without binding.
 */
function layControls(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  top: number,
  back: () => void,
): (key: string) => boolean {
  const middle = DESIGN_WIDTH / 2;
  /** The slot waiting for a key, and nothing while none waits. */
  let listening: { control: Control; slot: number } | undefined;
  const slots: { control: Control; slot: number; label: Phaser.GameObjects.Text }[] = [];

  const paint = (): void => {
    const held = bindings();
    for (const each of slots) {
      const key = held[each.control][each.slot];
      const waiting = listening?.control === each.control && listening.slot === each.slot;
      each.label.setText(
        waiting
          ? text('controls.press')
          : key === undefined
            ? text('controls.empty')
            : keyLabel(key),
      );
    }
  };

  CONTROLS.forEach((control, index) => {
    const y = top + index * (SLOT_HEIGHT + ROW_GAP) + SLOT_HEIGHT / 2;
    root.add(
      addText(
        scene,
        middle - WIDTH / 2 + PADDING,
        y,
        text(`control.${control}`),
        LABEL_STYLE,
      ).setOrigin(0, 0.5),
    );
    for (const slot of [0, 1]) {
      const { face, label } = pressable(
        scene,
        {
          x: middle + WIDTH / 2 - PADDING - (1 - slot) * (SLOT_WIDTH + SLOT_GAP) - SLOT_WIDTH / 2,
          y,
          width: SLOT_WIDTH,
          height: SLOT_HEIGHT,
        },
        `controls-${control}-${slot}`,
        SLOT_STYLE,
        () => {
          listening = { control, slot };
          paint();
        },
      );
      slots.push({ control, slot, label });
      root.add([face, label]);
    }
  });

  const width = (WIDTH - 2 * PADDING - BUTTON_GAP) / 2;
  const y = top + ROWS_HEIGHT + PADDING + BUTTON_HEIGHT / 2;
  const buttons: [string, string, () => void][] = [
    [
      'controls-default',
      text('controls.default'),
      () => {
        listening = undefined;
        restoreDefaults();
        paint();
      },
    ],
    [
      'controls-back',
      text('control.back'),
      () => {
        listening = undefined;
        back();
      },
    ],
  ];
  buttons.forEach(([name, reads, pressed], index) => {
    const { face, label } = pressable(
      scene,
      {
        x: middle + ((index === 0 ? -1 : 1) * (BUTTON_GAP + width)) / 2,
        y,
        width,
        height: BUTTON_HEIGHT,
      },
      name,
      LABEL_STYLE,
      pressed,
    );
    root.add([face, label.setText(reads)]);
  });

  paint();
  return (key: string): boolean => {
    if (listening === undefined) return false;
    rebind(listening.control, listening.slot, key);
    listening = undefined;
    paint();
    return true;
  };
}

/**
 * One window, centred on the design space: the box in the panel language, its title, and what it
 * lists. The box takes the pointer so that a press on it is not a press on the scrim behind, which
 * backs the window out. The caller sets the depth and takes the window down.
 */
export function createWindow(scene: Phaser.Scene, which: MenuWindow, on: Presses): Opened {
  const { buttons } = WINDOWS[which];
  const title = addText(scene, 0, 0, text(`menu.${which}`), TITLE_STYLE).setOrigin(0.5, 0);

  const height = 2 * PADDING + title.height + bodyHeight(which);
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;
  const body = top + PADDING + title.height + PADDING;

  const box = scene.add
    .rectangle(middle, top + height / 2, WIDTH, height, PANEL_FILL)
    .setStrokeStyle(1, PANEL_EDGE)
    .setInteractive();
  title.setPosition(middle, top + PADDING);

  const root = scene.add.container(0, 0, [box, title]).setName(which);
  buttons.forEach((press, index) => {
    const { face, label } = pressable(
      scene,
      {
        x: middle,
        y: body + index * (BUTTON_HEIGHT + BUTTON_GAP) + BUTTON_HEIGHT / 2,
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
      },
      `${which}-${press}`,
      LABEL_STYLE,
      () => on.press(press),
    );
    root.add([face, label.setText(text(`menu.${press}`))]);
  });

  const binds = which === 'controls' ? layControls(scene, root, body, on.back) : () => false;
  return { root, binds };
}
