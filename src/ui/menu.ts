import type Phaser from 'phaser';
import { menuZone } from './bar-layout';
import {
  type Bind,
  bindings,
  CONTROLS,
  type Control,
  invert,
  inverted,
  keyLabel,
  rebind,
  restoreDefaults,
  WHEELS,
  type Wheel,
} from './bindings';
import {
  addText,
  answersPress,
  BAR_HEIGHT,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  UI_FONT,
} from './design-space';
import { css, LOOK } from './look';
import { type TextKey, text } from './text';

/** A warning: a window of its own, whose first button is the press it warns of, going through. */
export type Warning = 'import-warning' | 'clear-warning';

/** Every window the menu opens. */
export type MenuWindow = 'menu' | 'settings' | 'controls' | 'manage-save' | Warning;

/** A window a press or a step back opens: every one but a warning. */
export type Opens = Exclude<MenuWindow, Warning>;

/**
 * What pressing a window's button does: opens the window it names, leaves the chronicle for the
 * campaign screen, steps back, or one of the save's doors.
 */
export type MenuPress =
  | 'manage-save'
  | 'settings'
  | 'controls'
  | 'campaign'
  | 'export'
  | 'import'
  | 'clear'
  | 'back';

/** What each press's button reads. */
const LABELS: Record<MenuPress, TextKey> = {
  'manage-save': 'menu.manage-save',
  settings: 'menu.settings',
  controls: 'menu.controls',
  campaign: 'menu.campaign',
  export: 'manage-save.export',
  import: 'manage-save.import',
  clear: 'manage-save.clear',
  back: 'control.back',
};

/** What each warning's press, going through, reads. */
const THROUGH: Record<Warning, TextKey> = {
  'import-warning': 'manage-save.import',
  'clear-warning': 'manage-save.clear',
};

/**
 * The windows: the title each one reads, the lines under it, what it lists, in the order it lists
 * them, and the one it closes back to. The menu closes back to nothing, which is the chronicle
 * screen. Controls lists the bindings instead of buttons.
 */
const WINDOWS: Record<
  MenuWindow,
  {
    readonly title: TextKey;
    readonly lines?: readonly TextKey[];
    readonly buttons: readonly MenuPress[];
    readonly from?: Opens;
  }
> = {
  menu: { title: 'menu.menu', buttons: ['manage-save', 'settings', 'campaign'] },
  settings: { title: 'menu.settings', buttons: ['controls'], from: 'menu' },
  controls: { title: 'menu.controls', buttons: [], from: 'settings' },
  'manage-save': {
    title: 'menu.manage-save',
    lines: ['manage-save.line'],
    buttons: ['export', 'import', 'clear', 'back'],
    from: 'menu',
  },
  'import-warning': {
    title: 'menu.manage-save',
    lines: ['manage-save.line', 'manage-save.import-warning'],
    buttons: ['back'],
    from: 'manage-save',
  },
  'clear-warning': {
    title: 'menu.manage-save',
    lines: ['manage-save.line', 'manage-save.clear-warning'],
    buttons: ['back'],
    from: 'manage-save',
  },
};

/** What a window reads besides what it always does: a line after its own, and one under its buttons. */
export type Said = { readonly over?: TextKey; readonly under?: TextKey };

/** The window this one closes back to; nothing for the one that closes back to the chronicle screen. */
export function behind(which: MenuWindow): Opens | undefined {
  return WINDOWS[which].from;
}

/** What a window lists on the screen standing: Campaign stands over a chronicle and its ending screen alone. */
function listed(scene: Phaser.Scene, which: MenuWindow): readonly MenuPress[] {
  return WINDOWS[which].buttons.filter(
    (press) => press !== 'campaign' || scene.scene.isActive('ui'),
  );
}

const WIDTH = 480;
const PADDING = 30;
const BUTTON_WIDTH = 320;
export const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 12;

/** One control's row: its two slots, and how far the next row stands below it. */
const SLOT_WIDTH = 120;
const SLOT_HEIGHT = 34;
const SLOT_GAP = 10;
const ROW_GAP = 8;

/** A row of the Controls window: a control's two slots, or one of the wheel's two buttons. */
type Row =
  | { readonly kind: 'control'; readonly control: Control }
  | { readonly kind: 'wheel'; readonly wheel: Wheel };

/** The Controls window's rows, top down: the wheel's two stand under the zoom-out row. */
const ROWS: readonly Row[] = CONTROLS.flatMap((control): Row[] => [
  { kind: 'control', control },
  ...(control === 'zoom-out' ? WHEELS.map((wheel): Row => ({ kind: 'wheel', wheel })) : []),
]);

/** What a wheel's row reads, and what its button reads with the wheel turning each way. */
const WHEEL_READS: Record<
  Wheel,
  { readonly row: TextKey; readonly upright: TextKey; readonly inverted: TextKey }
> = {
  zoom: { row: 'wheel.zoom', upright: 'wheel.up-zooms-in', inverted: 'wheel.up-zooms-out' },
  scroll: {
    row: 'wheel.scroll',
    upright: 'wheel.up-scrolls-up',
    inverted: 'wheel.up-scrolls-down',
  },
};

/** How far the rows reach below the top of the Controls window's body. */
const ROWS_HEIGHT = ROWS.length * SLOT_HEIGHT + (ROWS.length - 1) * ROW_GAP;

/** The panel's own dark ink: a window stands in the panel language, not on the scrim. */
const INK = css(LOOK.ink);

const TITLE_STYLE = { fontFamily: UI_FONT, fontSize: '26px', fontStyle: 'bold', color: INK };
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const SLOT_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };
const LINE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  color: INK,
  align: 'center',
  wordWrap: { width: WIDTH - 2 * PADDING },
};

/** A window standing on the scrim, and the keyboard's one way into it. */
export type Opened = {
  readonly root: Phaser.GameObjects.Container;
  /** A key pressed while a slot listens binds there and is taken; nothing listens, nothing taken. */
  binds(press: Bind): boolean;
};

/** What a window is pressed for: a button of its own, or the step back the Back button takes. */
export type Presses = {
  press(press: MenuPress): void;
  back(): void;
};

/** An accent face carrying a label: the one shape every button of a window is drawn as. */
function pressable(
  scene: Phaser.Scene,
  at: { x: number; y: number; width: number; height: number },
  name: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  pressed: () => void,
): { face: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const face = scene.add
    .rectangle(at.x, at.y, at.width, at.height, LOOK.accent)
    .setName(name)
    .setInteractive();
  answersPress(face);
  onClick(face, pressed);
  const label = addText(scene, at.x, at.y, '', style).setOrigin(0.5).setName(`${name}-label`);
  return { face, label };
}

/** A button as the menu draws one, centred on `x` and `y`, reading `reads`. */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  reads: string,
  pressed: () => void,
): { face: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
  const { face, label } = pressable(
    scene,
    { x, y, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
    name,
    LABEL_STYLE,
    pressed,
  );
  return { face, label: label.setText(reads) };
}

/** How far below the title a window's own content reaches, the padding above it included. */
function bodyHeight(which: MenuWindow, buttons: number): number {
  if (which === 'controls') return PADDING + ROWS_HEIGHT + PADDING + BUTTON_HEIGHT;
  if (buttons === 0) return 0;
  return PADDING + buttons * BUTTON_HEIGHT + (buttons - 1) * BUTTON_GAP;
}

/**
 * The Controls window's body: its rows, each its label on the left, and the two buttons under them. A
 * slot pressed listens for the key that binds it, and the next press of anything else lets go of it.
 */
function layControls(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  top: number,
  back: () => void,
): (press: Bind) => boolean {
  const middle = DESIGN_WIDTH / 2;
  const right = middle + WIDTH / 2 - PADDING;
  /** The slot waiting for a key, and nothing while none waits. */
  let listening: { control: Control; slot: number } | undefined;
  const slots: { control: Control; slot: number; label: Phaser.GameObjects.Text }[] = [];
  const wheels: { wheel: Wheel; label: Phaser.GameObjects.Text }[] = [];

  const paint = (): void => {
    const held = bindings();
    for (const each of slots) {
      const bind = held[each.control][each.slot];
      const waiting = listening?.control === each.control && listening.slot === each.slot;
      each.label.setText(
        waiting
          ? text('controls.press')
          : bind === undefined
            ? text('controls.empty')
            : keyLabel(bind),
      );
    }
    for (const { wheel, label } of wheels) {
      const reads = WHEEL_READS[wheel];
      label.setText(text(inverted()[wheel] ? reads.inverted : reads.upright));
    }
  };

  const rowLabel = (reads: string, y: number): Phaser.GameObjects.Text =>
    addText(scene, middle - WIDTH / 2 + PADDING, y, reads, LABEL_STYLE).setOrigin(0, 0.5);

  const rowOf = (row: Row, y: number): Phaser.GameObjects.GameObject[] => {
    switch (row.kind) {
      case 'control': {
        const { control } = row;
        return [
          rowLabel(text(`control.${control}`), y),
          ...[0, 1].flatMap((slot) => {
            const { face, label } = pressable(
              scene,
              {
                x: right - (1 - slot) * (SLOT_WIDTH + SLOT_GAP) - SLOT_WIDTH / 2,
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
            return [face, label];
          }),
        ];
      }
      case 'wheel': {
        const { wheel } = row;
        const width = 2 * SLOT_WIDTH + SLOT_GAP;
        const { face, label } = pressable(
          scene,
          { x: right - width / 2, y, width, height: SLOT_HEIGHT },
          `controls-wheel-${wheel}`,
          SLOT_STYLE,
          () => {
            listening = undefined;
            invert(wheel);
            paint();
          },
        );
        wheels.push({ wheel, label });
        return [rowLabel(text(WHEEL_READS[wheel].row), y), face, label];
      }
    }
  };

  ROWS.forEach((row, index) => {
    root.add(rowOf(row, top + index * (SLOT_HEIGHT + ROW_GAP) + SLOT_HEIGHT / 2));
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
  return (press: Bind): boolean => {
    if (listening === undefined) return false;
    rebind(listening.control, listening.slot, press);
    listening = undefined;
    paint();
    return true;
  };
}

/** A line a window reads, wrapped to the window and named after its entry. */
function lineOf(scene: Phaser.Scene, key: TextKey): Phaser.GameObjects.Text {
  return addText(scene, 0, 0, text(key), LINE_STYLE).setOrigin(0.5, 0).setName(key);
}

/** How far a run of lines reaches, the padding above each included. */
function linesHeight(lines: readonly Phaser.GameObjects.Text[]): number {
  return lines.reduce((sum, line) => sum + PADDING + line.height, 0);
}

/** A button of a window: its name, what it reads, and what pressing it does. */
type Button = { readonly name: string; readonly reads: string; readonly pressed: () => void };

/** The buttons a window lists on the screen standing, each answered by the window's presses. */
function buttonsOf(scene: Phaser.Scene, which: MenuWindow, on: Presses): Button[] {
  return listed(scene, which).map((press) => ({
    name: `${which}-${press}`,
    reads: text(LABELS[press]),
    pressed: () => on.press(press),
  }));
}

/** A window of the menu other than a warning, centred on the design space. */
export function createWindow(
  scene: Phaser.Scene,
  which: Opens,
  on: Presses,
  said: Said = {},
): Opened {
  return layWindow(scene, which, buttonsOf(scene, which, on), on, said);
}

/** A warning, centred on the design space, its first button the press it warns of, `through`. */
export function createWarning(
  scene: Phaser.Scene,
  which: Warning,
  on: Presses,
  through: () => void,
  said: Said = {},
): Opened {
  const going = { name: `${which}-through`, reads: text(THROUGH[which]), pressed: through };
  return layWindow(scene, which, [going, ...buttonsOf(scene, which, on)], on, said);
}

/**
 * One window: the box in the panel language, its title, its lines, its buttons, and the line said
 * under them. The box takes the pointer so that a press on it is not a press on the scrim behind,
 * which backs the window out. The caller takes the window down.
 */
function layWindow(
  scene: Phaser.Scene,
  which: MenuWindow,
  buttons: readonly Button[],
  on: Presses,
  said: Said,
): Opened {
  const shape = WINDOWS[which];
  const title = addText(scene, 0, 0, text(shape.title), TITLE_STYLE)
    .setOrigin(0.5, 0)
    .setName(`${which}-title`);
  const over = [...(shape.lines ?? []), ...(said.over === undefined ? [] : [said.over])].map(
    (key) => lineOf(scene, key),
  );
  const under = said.under === undefined ? [] : [lineOf(scene, said.under)];

  const height =
    2 * PADDING +
    title.height +
    linesHeight(over) +
    bodyHeight(which, buttons.length) +
    linesHeight(under);
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;

  const box = scene.add
    .rectangle(middle, top + height / 2, WIDTH, height, LOOK.panelFill)
    .setStrokeStyle(1, LOOK.panelEdge)
    .setInteractive();
  title.setPosition(middle, top + PADDING);
  let y = top + PADDING + title.height;
  for (const line of over) {
    line.setPosition(middle, y + PADDING);
    y += PADDING + line.height;
  }
  const body = y + PADDING;
  y += bodyHeight(which, buttons.length);
  for (const line of under) {
    line.setPosition(middle, y + PADDING);
    y += PADDING + line.height;
  }

  const root = scene.add.container(0, 0, [box, title, ...over, ...under]).setName(which);
  buttons.forEach(({ name, reads, pressed }, index) => {
    const { face, label } = createButton(
      scene,
      middle,
      body + index * (BUTTON_HEIGHT + BUTTON_GAP) + BUTTON_HEIGHT / 2,
      name,
      reads,
      pressed,
    );
    root.add([face, label]);
  });

  const binds = which === 'controls' ? layControls(scene, root, body, on.back) : () => false;
  return { root, binds };
}

/**
 * The window a refused save raises, centred on the design space: its title, the line under it, and
 * Back, which `back` answers. The box takes the pointer as a menu window's does.
 */
export function createRefusedSaveWindow(
  scene: Phaser.Scene,
  back: () => void,
): Phaser.GameObjects.Container {
  const title = addText(scene, 0, 0, text('refused-save.title'), TITLE_STYLE)
    .setOrigin(0.5, 0)
    .setName('refused-save-title');
  const line = addText(scene, 0, 0, text('refused-save.line'), LINE_STYLE)
    .setOrigin(0.5, 0)
    .setName('refused-save-line');

  const height = PADDING + title.height + PADDING + line.height + PADDING + BUTTON_HEIGHT + PADDING;
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;
  const box = scene.add
    .rectangle(middle, top + height / 2, WIDTH, height, LOOK.panelFill)
    .setStrokeStyle(1, LOOK.panelEdge)
    .setInteractive();
  title.setPosition(middle, top + PADDING);
  line.setPosition(middle, top + PADDING + title.height + PADDING);

  const { face, label } = createButton(
    scene,
    middle,
    top + height - PADDING - BUTTON_HEIGHT / 2,
    'refused-save-back',
    text('control.back'),
    back,
  );
  return scene.add.container(0, 0, [box, title, line, face, label]).setName('refused-save');
}

/** How tall the Menu button stands in the bar's strip, and how far it reaches around its label. */
const MENU_HEIGHT = 32;
const MENU_PADDING = 12;

const MENU_STYLE = { fontFamily: UI_FONT, fontSize: '18px', color: INK };

function menuLabel(scene: Phaser.Scene): Phaser.GameObjects.Text {
  return addText(scene, 0, 0, text('menu.menu'), MENU_STYLE).setOrigin(0.5, 0.5);
}

/**
 * The room the Menu button takes at the right end of the strip along the top: the button stands on the
 * menu scene and the flow of whichever bar stands there ends before it, so both measure it here.
 */
export function menuRoom(scene: Phaser.Scene): number {
  const label = menuLabel(scene);
  const room = label.width + 2 * MENU_PADDING;
  label.destroy();
  return room;
}

/** The Menu button where the bar leaves it room, on whatever screen stands under it. */
export function createMenuButton(scene: Phaser.Scene, pressed: () => void): void {
  const zone = menuZone(menuRoom(scene), DESIGN_WIDTH, MARGIN);
  const x = zone.x + zone.width / 2;
  const y = BAR_HEIGHT / 2;
  const button = scene.add
    .rectangle(x, y, zone.width, MENU_HEIGHT, LOOK.panelFill)
    .setStrokeStyle(1, LOOK.panelEdge)
    .setName('menu-button')
    .setInteractive();
  answersPress(button);
  // Added after the fill: the display list paints in add order, so a label added first would be hidden.
  menuLabel(scene).setPosition(x, y);
  onClick(button, pressed);
}
