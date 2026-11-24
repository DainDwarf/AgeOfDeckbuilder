import Phaser from 'phaser';
import { animationSpeed, pressAnimationSpeed } from './animation-speed';
import { balancedWrap } from './balanced-wrap';
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
  WHEELED,
  type Wheeled,
} from './bindings';
import type { ButtonSign } from './cast';
import {
  createChromeButton,
  createChromeWindow,
  createPressableWell,
  createSignButton,
  type PressableWell,
  type SignButton,
  WINDOW_GOLD_MIDDLE,
  WINDOW_TITLE,
} from './chrome';
import { type ButtonPiece, WINDOW_BAND_FOOT } from './chrome-kit';
import { type CornerLayout, layOutCorner } from './corner-layout';
import {
  addText,
  BAR_HEIGHT,
  type Box,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  faintRule,
  MARGIN,
  offMiddle,
  onClick,
  onHover,
  placedWhileUp,
  type SizedStyle,
  type Stratum,
  screenSize,
  UI_FONT,
  whileUp,
} from './design-space';
import { interfaceSize, pressInterfaceSize, sizeRead } from './interface-size';
import { css, LOOK } from './look';
import { type TextKey, text } from './text';
import { STANDOFF, type Tooltip } from './tooltip';

/** A warning: a window of its own, whose first button is the press it warns of, going through. */
export type Warning =
  | 'import-warning'
  | 'clear-warning'
  | 'launch-warning'
  | 'move-warning'
  | 'attack-warning';

/** Every window the menu opens. */
export type MenuWindow = 'menu' | 'settings' | 'controls' | 'graphics' | 'manage-save' | Warning;

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
  | 'graphics'
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
  graphics: 'menu.graphics',
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
  'launch-warning': 'launch.button',
  'move-warning': 'declare-war.move',
  'attack-warning': 'declare-war.attack',
};

/**
 * The windows: the title each one reads, the lines under it, the buttons it lists in order, and the
 * one it closes back to, none closing onto the screen standing. Controls and a warning lay a pair of
 * their own instead of buttons, and Graphics its rows over them.
 */
const WINDOWS: Record<
  MenuWindow,
  {
    readonly title: TextKey;
    readonly lines?: readonly TextKey[];
    readonly buttons?: readonly MenuPress[];
    readonly from?: Opens;
  }
> = {
  menu: { title: 'menu.menu', buttons: ['manage-save', 'settings', 'campaign'] },
  settings: { title: 'menu.settings', buttons: ['controls', 'graphics'], from: 'menu' },
  controls: { title: 'menu.controls', from: 'settings' },
  graphics: { title: 'menu.graphics', buttons: ['back'], from: 'settings' },
  'manage-save': {
    title: 'menu.manage-save',
    lines: ['manage-save.line'],
    buttons: ['export', 'import', 'clear', 'back'],
    from: 'menu',
  },
  'import-warning': {
    title: 'menu.manage-save',
    lines: ['manage-save.line', 'manage-save.import-warning'],
    from: 'manage-save',
  },
  'clear-warning': {
    title: 'menu.manage-save',
    lines: ['manage-save.line', 'manage-save.clear-warning'],
    from: 'manage-save',
  },
  'launch-warning': { title: 'navbar.chronicle', lines: ['launch.warning'] },
  'move-warning': { title: 'declare-war.title', lines: ['declare-war.warning'] },
  'attack-warning': { title: 'declare-war.title', lines: ['declare-war.warning'] },
};

/** A line read, and the copies of a card it names, read after it where they are several. */
export type CountedLine = { readonly reads: string; readonly copies?: number };

/** A counted line laid: its texts, how wide and how tall it stands, and where its top left stands. */
export type LaidLine = {
  readonly parts: readonly Phaser.GameObjects.Text[];
  readonly width: number;
  readonly height: number;
  place(left: number, top: number): void;
};

/** The line laid, named `name`, and its copies, where several, `${name}-copies`. */
export function laidLine(
  scene: Phaser.Scene,
  { reads, copies }: CountedLine,
  style: SizedStyle,
  name: string,
): LaidLine {
  const gap = 8;
  const read = addText(scene, 0, 0, reads, style).setName(name);
  const after =
    copies !== undefined && copies > 1
      ? addText(scene, 0, 0, text('collection.row-copies', { copies }), style).setName(
          `${name}-copies`,
        )
      : undefined;
  return {
    parts: after === undefined ? [read] : [read, after],
    width: read.width + (after === undefined ? 0 : gap + after.width),
    height: read.height,
    place(left, top) {
      read.setPosition(left, top);
      after?.setPosition(left + read.width + gap, top);
    },
  };
}

/** Lines stacked tight under the line heading them. */
export type Listed = { readonly heading: TextKey; readonly lines: readonly CountedLine[] };

/**
 * What a window reads besides what it always does: a line after its own, a list after that, and a
 * line under its buttons.
 */
export type Said = { readonly over?: TextKey; readonly listed?: Listed; readonly under?: TextKey };

/** The window this one closes back to; nothing for one that closes onto the screen standing. */
export function behind(which: MenuWindow): Opens | undefined {
  return WINDOWS[which].from;
}

/** What a window lists on the screen standing: Campaign stands over a chronicle and its ending screen alone. */
function listed(scene: Phaser.Scene, which: MenuWindow): readonly MenuPress[] {
  return (WINDOWS[which].buttons ?? []).filter(
    (press) => press !== 'campaign' || scene.scene.isActive('ui'),
  );
}

const WIDTH = 480;
const PADDING = 30;

/** How wide what a window reads stands, its padding on either side. */
const ROOM = WIDTH - 2 * PADDING;

/** How far under a window's top what it reads under its title starts: a little over the band's foot. */
const READ_FROM = WINDOW_BAND_FOOT - 4;

/** A button standing alone across a window, its height, and how far two buttons stand apart. */
const BUTTON_WIDTH = 320;
export const BUTTON_HEIGHT = 40;
const BUTTON_GAP = 14;

/** A row of Controls and of Graphics: its height, and how far the next row stands below it. */
const ROW_HEIGHT = 32;
const ROW_GAP = 5;

/** A key's slot: how wide it stands, and how far apart a key's two stand. */
const SLOT_WIDTH = 120;
const SLOT_GAP = 10;

/** How far apart the last key's row and the first wheel's stand, the rule in the middle of that. */
const RULE_ROOM = 13;

/** Where a row's wells start and end, across the window. */
const ROW_LEFT = DESIGN_WIDTH / 2 - WIDTH / 2 + PADDING;
const ROW_RIGHT = DESIGN_WIDTH / 2 + WIDTH / 2 - PADDING;

/** A row of the Controls window: a control's two slots, or one of the wheel's two rows. */
type Row =
  | { readonly kind: 'control'; readonly control: Control }
  | { readonly kind: 'wheel'; readonly wheeled: Wheeled };

/** The Controls window's rows, top down: the keys', then the wheel's two under the rule. */
const ROWS: readonly Row[] = [
  ...CONTROLS.map((control): Row => ({ kind: 'control', control })),
  ...WHEELED.map((wheeled): Row => ({ kind: 'wheel', wheeled })),
];

/** What a wheel's row reads, and what its button reads with the wheel turning each way. */
const WHEEL_READS: Record<
  Wheeled,
  { readonly row: TextKey; readonly upright: TextKey; readonly inverted: TextKey }
> = {
  zoom: { row: 'wheel.zoom', upright: 'wheel.up-zooms-in', inverted: 'wheel.up-zooms-out' },
  scroll: {
    row: 'wheel.scroll',
    upright: 'wheel.up-scrolls-up',
    inverted: 'wheel.up-scrolls-down',
  },
};

/** How far that many rows reach, stacked top down. */
function rowsHeight(rows: number): number {
  return rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;
}

/**
 * Where the middle of the row at that place stands, in rows stacked top down from `top`, the rule's
 * room standing over the row at `ruled` where one is named.
 */
function rowAt(top: number, index: number, ruled?: number): number {
  const past = ruled !== undefined && index >= ruled ? RULE_ROOM - ROW_GAP : 0;
  return top + index * (ROW_HEIGHT + ROW_GAP) + past + ROW_HEIGHT / 2;
}

/** How far the Controls window's rows reach below the top of its body, the rule's room among them. */
const ROWS_HEIGHT = rowsHeight(ROWS.length) + RULE_ROOM - ROW_GAP;

/** A window's words on its charcoal and in its wells, and on its gold band and its buttons. */
const INK = css(LOOK.charcoalInk);
const METAL_INK = css(LOOK.metalInk);

const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };
const BUTTON_STYLE = { ...LABEL_STYLE, color: METAL_INK };
const WELL_STYLE = { fontFamily: UI_FONT, fontSize: '16px', fontStyle: 'bold', color: INK };
const LINE_STYLE: SizedStyle = {
  fontFamily: UI_FONT,
  fontSize: '18px',
  color: INK,
  align: 'center',
  wordWrap: balancedWrap(ROOM),
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

/** A button of a window: its name, what it reads, the kit's button it is drawn as, and what pressing it does. */
type Button = {
  readonly name: string;
  readonly reads: string;
  readonly piece: ButtonPiece;
  readonly pressed: () => void;
};

/** The kit's button a window draws for a press: Back's gold, every other's bright silver. */
function pieceOf(press: MenuPress): ButtonPiece {
  return press === 'back' ? 'gold' : 'silver';
}

/** A button of a window on the box, its label on its middle. */
function buttonOn(
  scene: Phaser.Scene,
  { name, reads, piece, pressed }: Button,
  box: Box,
): { face: Phaser.GameObjects.NineSlice; label: Phaser.GameObjects.Text } {
  const { face } = createChromeButton(scene, piece, box, name);
  onClick(face, pressed);
  const label = addText(scene, box.x + box.width / 2, box.y + box.height / 2, reads, BUTTON_STYLE)
    .setOrigin(0.5)
    .setName(`${name}-label`);
  return { face, label };
}

/** A button standing alone across a window, in the kit's gold or its bright silver, centred on `x` and `y`. */
export function createButton(
  scene: Phaser.Scene,
  piece: ButtonPiece,
  x: number,
  y: number,
  name: string,
  reads: string,
  pressed: () => void,
): { face: Phaser.GameObjects.NineSlice; label: Phaser.GameObjects.Text } {
  const box = {
    x: x - BUTTON_WIDTH / 2,
    y: y - BUTTON_HEIGHT / 2,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  };
  return buttonOn(scene, { name, reads, piece, pressed }, box);
}

/** Two buttons side by side across a window's room, their middles on `y`. */
function pairOn(
  scene: Phaser.Scene,
  y: number,
  pair: readonly [Button, Button],
): Phaser.GameObjects.GameObject[] {
  const width = (ROOM - BUTTON_GAP) / 2;
  return pair.flatMap((button, index) => {
    const box = {
      x: ROW_LEFT + index * (width + BUTTON_GAP),
      y: y - BUTTON_HEIGHT / 2,
      width,
      height: BUTTON_HEIGHT,
    };
    const { face, label } = buttonOn(scene, button, box);
    return [face, label];
  });
}

/** How a window's buttons stand: one under the other, or a pair side by side. */
type Laid =
  | { readonly kind: 'column'; readonly buttons: readonly Button[] }
  | { readonly kind: 'pair'; readonly pair: readonly [Button, Button] };

/** A window's buttons laid in its body, from `body` down. */
function buttonsLaid(
  scene: Phaser.Scene,
  which: MenuWindow,
  laid: Laid,
  body: number,
): Phaser.GameObjects.GameObject[] {
  switch (laid.kind) {
    case 'column':
      return laid.buttons.flatMap((button, index) => {
        const { face, label } = buttonOn(scene, button, {
          x: (DESIGN_WIDTH - BUTTON_WIDTH) / 2,
          y: body + rowsAbove(which) + index * (BUTTON_HEIGHT + BUTTON_GAP),
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        });
        return [face, label];
      });
    case 'pair':
      return pairOn(scene, body + BUTTON_HEIGHT / 2, laid.pair);
  }
}

/** How far down a window's body its buttons stand: Graphics holds its rows over them. */
function rowsAbove(which: MenuWindow): number {
  return which === 'graphics' ? rowsHeight(GRAPHICS_ROWS.length) + PADDING : 0;
}

/** How far below the title a window's own content reaches, the padding above it included. */
function bodyHeight(which: MenuWindow, laid: Laid): number {
  if (which === 'controls') return PADDING + ROWS_HEIGHT + PADDING + BUTTON_HEIGHT;
  switch (laid.kind) {
    case 'pair':
      return PADDING + BUTTON_HEIGHT;
    case 'column': {
      const count = laid.buttons.length;
      if (count === 0) return 0;
      return PADDING + rowsAbove(which) + count * BUTTON_HEIGHT + (count - 1) * BUTTON_GAP;
    }
  }
}

/** A row's label, on the left of the window. */
function rowLabel(scene: Phaser.Scene, reads: string, y: number): Phaser.GameObjects.Text {
  return addText(scene, ROW_LEFT, y, reads, LABEL_STYLE).setOrigin(0, 0.5);
}

/** A well a press turns on the box, named `name`, its words on its middle. */
function wellOn(
  scene: Phaser.Scene,
  box: Box,
  name: string,
  pressed: () => void,
): { well: PressableWell; label: Phaser.GameObjects.Text; parts: Phaser.GameObjects.GameObject[] } {
  const well = createPressableWell(scene, box, name);
  onClick(well.face, pressed);
  const label = addText(scene, box.x + box.width / 2, box.y + box.height / 2, '', WELL_STYLE)
    .setOrigin(0.5)
    .setName(`${name}-label`);
  return { well, label, parts: [well.face, well.veil, label] };
}

/** A row a press turns: its label, and its one well right of it, as wide as a control's two slots. */
function turningRow(
  scene: Phaser.Scene,
  y: number,
  name: string,
  reads: string,
  pressed: () => void,
): { parts: Phaser.GameObjects.GameObject[]; label: Phaser.GameObjects.Text } {
  const width = 2 * SLOT_WIDTH + SLOT_GAP;
  const box = { x: ROW_RIGHT - width, y: y - ROW_HEIGHT / 2, width, height: ROW_HEIGHT };
  const { parts, label } = wellOn(scene, box, name, pressed);
  return { parts: [rowLabel(scene, reads, y), ...parts], label };
}

/**
 * The Controls window's body: its rows, each its label on the left, the rule over the wheel's two, and
 * the two buttons under them. A slot pressed listens for the key that binds it, standing as the kit's
 * field while it does, and the next press of anything else lets go of it.
 */
function layControls(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  top: number,
  back: () => void,
): (press: Bind) => boolean {
  /** The slot waiting for a key, and nothing while none waits. */
  let listening: { control: Control; slot: number } | undefined;
  const slots: {
    control: Control;
    slot: number;
    well: PressableWell;
    label: Phaser.GameObjects.Text;
  }[] = [];
  const wheels: { wheeled: Wheeled; label: Phaser.GameObjects.Text }[] = [];

  const paint = (): void => {
    const held = bindings();
    for (const each of slots) {
      const bind = held[each.control][each.slot];
      const waiting = listening?.control === each.control && listening.slot === each.slot;
      each.well.field(waiting);
      each.label.setText(
        waiting ? text('controls.press') : bind === undefined ? '' : keyLabel(bind),
      );
    }
    for (const { wheeled, label } of wheels) {
      const reads = WHEEL_READS[wheeled];
      label.setText(text(inverted()[wheeled] ? reads.inverted : reads.upright));
    }
  };

  const rowOf = (row: Row, y: number): Phaser.GameObjects.GameObject[] => {
    switch (row.kind) {
      case 'control': {
        const { control } = row;
        return [
          rowLabel(scene, text(`control.${control}`), y),
          ...[0, 1].flatMap((slot) => {
            const box = {
              x: ROW_RIGHT - (2 - slot) * SLOT_WIDTH - (1 - slot) * SLOT_GAP,
              y: y - ROW_HEIGHT / 2,
              width: SLOT_WIDTH,
              height: ROW_HEIGHT,
            };
            const { well, label, parts } = wellOn(scene, box, `controls-${control}-${slot}`, () => {
              listening = { control, slot };
              paint();
            });
            slots.push({ control, slot, well, label });
            return parts;
          }),
        ];
      }
      case 'wheel': {
        const { wheeled } = row;
        const { parts, label } = turningRow(
          scene,
          y,
          `controls-wheel-${wheeled}`,
          text(WHEEL_READS[wheeled].row),
          () => {
            listening = undefined;
            invert(wheeled);
            paint();
          },
        );
        wheels.push({ wheeled, label });
        return parts;
      }
    }
  };

  ROWS.forEach((row, index) => {
    root.add(rowOf(row, rowAt(top, index, CONTROLS.length)));
  });
  const ruleTop = rowAt(top, CONTROLS.length - 1) + ROW_HEIGHT / 2 + (RULE_ROOM - 1) / 2;
  root.add(faintRule(scene, ROW_LEFT, ruleTop, ROOM).setName('controls-rule'));

  root.add(
    pairOn(scene, top + ROWS_HEIGHT + PADDING + BUTTON_HEIGHT / 2, [
      {
        name: 'controls-default',
        reads: text('controls.default'),
        piece: 'silver',
        pressed: () => {
          listening = undefined;
          restoreDefaults();
          paint();
        },
      },
      {
        name: 'controls-back',
        reads: text('control.back'),
        piece: pieceOf('back'),
        pressed: () => {
          listening = undefined;
          back();
        },
      },
    ]),
  );

  paint();
  return (press: Bind): boolean => {
    if (listening === undefined) return false;
    rebind(listening.control, listening.slot, press);
    listening = undefined;
    paint();
    return true;
  };
}

/** A row of a setting the game keeps, reading it, a press turning it and the row reading it again. */
function keptRow(
  scene: Phaser.Scene,
  y: number,
  name: string,
  row: string,
  reads: () => string,
  press: () => void,
): Phaser.GameObjects.GameObject[] {
  const { parts, label } = turningRow(scene, y, name, row, () => {
    press();
    label.setText(reads());
  });
  label.setText(reads());
  return parts;
}

/** The Animation speed row, reading the speed, a press moving it to the next. */
function speedRow(scene: Phaser.Scene, y: number): Phaser.GameObjects.GameObject[] {
  return keptRow(
    scene,
    y,
    'graphics-animation-speed',
    text('graphics.animation-speed'),
    () => text('graphics.speed', { speed: animationSpeed() }),
    () => {
      pressAnimationSpeed(scene.game.scene);
    },
  );
}

/** The Interface size row, reading the size, a press moving it to the next. */
function sizeRow(scene: Phaser.Scene, y: number): Phaser.GameObjects.GameObject[] {
  return keptRow(
    scene,
    y,
    'graphics-interface-size',
    text('graphics.interface-size'),
    () => sizeRead(interfaceSize()),
    () => {
      pressInterfaceSize(scene.scale);
    },
  );
}

/** The Fullscreen row, a press asking the browser and the row reading what it did. */
function fullscreenRow(scene: Phaser.Scene, y: number): Phaser.GameObjects.GameObject[] {
  const { parts, label } = turningRow(
    scene,
    y,
    'graphics-fullscreen',
    text('graphics.fullscreen'),
    () => {
      scene.scale.toggleFullscreen();
    },
  );
  const read = (): void => {
    label.setText(text(scene.scale.isFullscreen ? 'graphics.on' : 'graphics.off'));
  };
  read();
  const unheard = [Phaser.Scale.Events.ENTER_FULLSCREEN, Phaser.Scale.Events.LEAVE_FULLSCREEN].map(
    (event) => whileUp(scene, scene.scale, event, read),
  );
  // The menu's scene never shuts down: the window going is what has to take these off.
  label.once('destroy', () => {
    for (const off of unheard) off();
  });
  return parts;
}

/** The Graphics window's rows, top down. */
const GRAPHICS_ROWS = [fullscreenRow, sizeRow, speedRow];

function layGraphics(scene: Phaser.Scene, root: Phaser.GameObjects.Container, top: number): void {
  GRAPHICS_ROWS.forEach((row, index) => {
    root.add(row(scene, rowAt(top, index)));
  });
}

/** A line a window reads, its lines balanced across the window, named `name`. */
function lineOf(scene: Phaser.Scene, reads: string, name: string): Phaser.GameObjects.Text {
  return addText(scene, 0, 0, reads, LINE_STYLE).setOrigin(0.5, 0).setName(name);
}

/** A line a window reads of an entry, named after the entry. */
function entryLine(scene: Phaser.Scene, key: TextKey): Phaser.GameObjects.Text {
  return lineOf(scene, text(key), key);
}

/** How far a run of lines reaches, the padding above each included. */
function linesHeight(lines: readonly Phaser.GameObjects.Text[]): number {
  return lines.reduce((sum, line) => sum + PADDING + line.height, 0);
}

/** The window's button for a press, reacting with the window's presses. */
function buttonOf(which: MenuWindow, press: MenuPress, on: Presses): Button {
  return {
    name: `${which}-${press}`,
    reads: text(LABELS[press]),
    piece: pieceOf(press),
    pressed: () => on.press(press),
  };
}

/** The buttons a window lists on the screen standing. */
function buttonsOf(scene: Phaser.Scene, which: MenuWindow, on: Presses): Button[] {
  return listed(scene, which).map((press) => buttonOf(which, press, on));
}

/** A window of the menu other than a warning, centred on the design space. */
export function createWindow(
  scene: Phaser.Scene,
  which: Opens,
  on: Presses,
  said: Said = {},
): Opened {
  return layWindow(
    scene,
    which,
    { kind: 'column', buttons: buttonsOf(scene, which, on) },
    on,
    said,
  );
}

/** A warning, centred on the design space, the press it warns of, `through`, beside its Back. */
export function createWarning(
  scene: Phaser.Scene,
  which: Warning,
  on: Presses,
  through: () => void,
  said: Said = {},
): Opened {
  const going: Button = {
    name: `${which}-through`,
    reads: text(THROUGH[which]),
    piece: 'silver',
    pressed: through,
  };
  const pair = [going, buttonOf(which, 'back', on)] as const;
  return layWindow(scene, which, { kind: 'pair', pair }, on, said);
}

/**
 * One window: its panel with the gold band, its title on the gold, its lines, the list said, its
 * buttons, and the line said under them. The caller takes the window down.
 */
function layWindow(
  scene: Phaser.Scene,
  which: MenuWindow,
  laid: Laid,
  on: Presses,
  said: Said,
): Opened {
  const shape = WINDOWS[which];
  const title = addText(scene, 0, 0, text(shape.title), WINDOW_TITLE)
    .setOrigin(0.5)
    .setName(`${which}-title`);
  const over = [...(shape.lines ?? []), ...(said.over === undefined ? [] : [said.over])].map(
    (key) => entryLine(scene, key),
  );
  const heading = said.listed === undefined ? undefined : entryLine(scene, said.listed.heading);
  const list = (said.listed?.lines ?? []).map((line, index) =>
    laidLine(scene, line, LINE_STYLE, `${which}-listed-${index}`),
  );
  const listHeight =
    heading === undefined
      ? 0
      : PADDING + heading.height + list.reduce((sum, line) => sum + line.height, 0);
  const under = said.under === undefined ? [] : [entryLine(scene, said.under)];

  const height =
    READ_FROM +
    linesHeight(over) +
    listHeight +
    bodyHeight(which, laid) +
    linesHeight(under) +
    PADDING;
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;

  const chrome = titledWindow(scene, title, top, height);
  let y = top + READ_FROM;
  for (const line of over) {
    line.setPosition(middle, y + PADDING);
    y += PADDING + line.height;
  }
  if (heading !== undefined) {
    heading.setPosition(middle, y + PADDING);
    y += PADDING + heading.height;
  }
  for (const line of list) {
    line.place(middle - line.width / 2, y);
    y += line.height;
  }
  const body = y + PADDING;
  y += bodyHeight(which, laid);
  for (const line of under) {
    line.setPosition(middle, y + PADDING);
    y += PADDING + line.height;
  }

  const root = scene.add
    .container(0, 0, [
      ...chrome,
      title,
      ...over,
      ...(heading === undefined ? [] : [heading]),
      ...list.flatMap(({ parts }) => parts),
      ...under,
    ])
    .setName(which);
  root.add(buttonsLaid(scene, which, laid, body));

  if (which === 'graphics') layGraphics(scene, root, body);
  const binds = which === 'controls' ? layControls(scene, root, body, on.back) : () => false;
  return { root: aboutTheMiddle(root), binds };
}

/** A window laid out about the middle of 1280 by 720, standing about the middle of the screen. */
function aboutTheMiddle(root: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
  return placedWhileUp(root, () => {
    const { x, y } = offMiddle();
    root.setPosition(x, y);
  });
}

/**
 * The window a refused save raises, centred on the design space: its title, the line under it, and
 * Back, which reacts with `back`, drawn as a window of the menu is.
 */
export function createRefusedSaveWindow(
  scene: Phaser.Scene,
  back: () => void,
): Phaser.GameObjects.Container {
  const title = addText(scene, 0, 0, text('refused-save.title'), WINDOW_TITLE)
    .setOrigin(0.5)
    .setName('refused-save-title');
  const line = lineOf(scene, text('refused-save.line'), 'refused-save-line');

  const height = READ_FROM + PADDING + line.height + PADDING + BUTTON_HEIGHT + PADDING;
  const top = Math.round((DESIGN_HEIGHT - height) / 2);
  const middle = DESIGN_WIDTH / 2;
  const chrome = titledWindow(scene, title, top, height);
  line.setPosition(middle, top + READ_FROM + PADDING);

  const { face, label } = createButton(
    scene,
    pieceOf('back'),
    middle,
    top + height - PADDING - BUTTON_HEIGHT / 2,
    'refused-save-back',
    text('control.back'),
    back,
  );
  return aboutTheMiddle(
    scene.add.container(0, 0, [...chrome, title, line, face, label]).setName('refused-save'),
  );
}

/**
 * A window as wide as every window, centred across the design space, that tall from `top` down, its
 * title's middle on the middle of its gold band.
 */
function titledWindow(
  scene: Phaser.Scene,
  title: Phaser.GameObjects.Text,
  top: number,
  height: number,
): Phaser.GameObjects.NineSlice[] {
  title.setPosition(DESIGN_WIDTH / 2, top + WINDOW_GOLD_MIDDLE);
  return createChromeWindow(scene, { x: (DESIGN_WIDTH - WIDTH) / 2, y: top, width: WIDTH, height });
}

/** The buttons at the screen's top right corner, as the screen now stands. */
export function cornerNow(): CornerLayout {
  return layOutCorner(screenSize().width, MARGIN, BAR_HEIGHT);
}

/** A square of `createSquareButton`'s. */
export type SquareButton = SignButton & {
  /** The button laid again on the box its `laid` answers now. */
  lay(): void;
};

/**
 * A square of the kit's bright silver on the stratum wearing the symbol's sign, its face named `name`,
 * on the box `laid` answers after every change of window; the rest on it raises `reads` under it on
 * the tooltip, and a left click on it does what `pressed` does while `live` holds.
 */
export function createSquareButton(
  scene: Phaser.Scene,
  on: Stratum,
  {
    symbol,
    name,
    laid,
    live = () => true,
  }: {
    readonly symbol: ButtonSign;
    readonly name: string;
    readonly laid: () => Box;
    readonly live?: () => boolean;
  },
  { tooltip, reads }: { readonly tooltip: Tooltip; readonly reads: string },
  pressed: () => void,
): SquareButton {
  const button = createSignButton(scene, 'silver', symbol, laid(), name, { live });
  on.layer.add([button.face, button.sign]);
  onClick(button.face, () => {
    if (live()) pressed();
  });
  const lay = (): void => {
    button.place(laid());
  };
  placedWhileUp(button.face, lay);
  onHover(
    button.face,
    () => {
      const { x, y, height } = laid();
      tooltip.under(reads, x, y + height + STANDOFF);
    },
    () => {
      tooltip.hide();
    },
  );
  return { ...button, lay };
}

/** The Menu button at the top right corner of whatever screen stands under it, naming itself on the tooltip. */
export function createMenuButton(
  scene: Phaser.Scene,
  on: Stratum,
  tooltip: Tooltip,
  pressed: () => void,
): void {
  createSquareButton(
    scene,
    on,
    { symbol: 'menu-button', name: 'menu-button', laid: () => cornerNow().menu },
    { tooltip, reads: text('menu.menu') },
    pressed,
  );
}
