import type Phaser from 'phaser';
import { runLine } from './console-line';
import {
  addText,
  DESIGN_WIDTH,
  MARGIN,
  OVER_SCRIM_DEPTH,
  PANEL_EDGE,
  PANEL_FILL,
} from './design-space';
import { readsKeyboard } from './keys';
import { LAYERS_ON, type Layers } from './map';
import { text } from './text';

/** The place the key that opens the console stands on: the one above Tab, whatever it prints. */
const CONSOLE_KEY = 'Backquote';

/** How many lines already run stand above the line being typed. */
const HISTORY = 4;

/** The panel's ink, the pale a line typed reads in, and the grey an answer reads in. */
const PANEL = 0x0d1014;
const PANEL_ALPHA = 0.9;
const TYPED_INK = '#d4d7db';
const ANSWER_INK = '#9aa1a9';

/** How tall one line stands, and how far the lines stand off the panel's top and bottom. */
const LINE = 18;
const PAD = 10;

const HEIGHT = 2 * PAD + (HISTORY + 1) * LINE;

const CONSOLE_STYLE = {
  fontFamily: 'ui-monospace, Consolas, "Courier New", monospace',
  fontSize: '14px',
  color: TYPED_INK,
};

/** Over everything the chronicle screen draws, the scrim and what stands over it included. */
const CONSOLE_DEPTH = OVER_SCRIM_DEPTH + 10;

/** One line the console has run: what it read, and whether it was the console's answer. */
type Line = { readonly line: string; readonly answer: boolean };

/**
 * The debug console: a panel the key above Tab drops over the top of the chronicle screen, the lines
 * last run standing over the line being typed. While it stands the keyboard is its and nothing the
 * game binds hears a key; the pointer is not its, so the map still pans and zooms under it. It goes
 * down with the chronicle screen it was raised on, and every layer stands again on the next.
 */
export function createDebugConsole(scene: Phaser.Scene, layered: (layers: Layers) => void): void {
  const root = scene.add.container(0, 0).setName('console').setDepth(CONSOLE_DEPTH);
  root.add([
    scene.add.rectangle(0, 0, DESIGN_WIDTH, HEIGHT, PANEL, PANEL_ALPHA).setOrigin(0, 0),
    scene.add.rectangle(0, HEIGHT - 1, DESIGN_WIDTH, 1, PANEL_EDGE).setOrigin(0, 0),
  ]);

  const lines: Phaser.GameObjects.Text[] = [];
  for (let at = 0; at < HISTORY; at++) {
    const label = addText(scene, MARGIN, PAD + at * LINE, '', CONSOLE_STYLE)
      .setOrigin(0, 0)
      .setName(`console-line-${at}`);
    lines.push(label);
    root.add(label);
  }

  const input = addText(scene, MARGIN, PAD + HISTORY * LINE, '', CONSOLE_STYLE)
    .setOrigin(0, 0)
    .setName('console-input');
  const caret = scene.add
    .rectangle(MARGIN, PAD + HISTORY * LINE + 3, 7, LINE - 8, PANEL_FILL)
    .setOrigin(0, 0)
    .setName('console-caret');
  root.add([input, caret]);

  /** Whether the console stands over the chronicle screen. */
  let open = false;
  /** What has been typed since the last line was run. */
  let typed = '';
  const history: Line[] = [];
  let layers = LAYERS_ON;

  const paint = (): void => {
    const first = HISTORY - history.length;
    lines.forEach((label, at) => {
      const line = history[at - first];
      label.setText(line?.line ?? '').setColor(line?.answer === true ? ANSWER_INK : TYPED_INK);
    });
    input.setText(text('console.line', { line: typed }));
    caret.setX(input.x + input.width - 1);
  };

  const keep = (line: string, answer: boolean): void => {
    history.push({ line, answer });
    if (history.length > HISTORY) history.shift();
  };

  /** The line entered: it and its answer stay in view, and the map hears whatever it switched. */
  const run = (): void => {
    const line = typed;
    typed = '';
    const ran = runLine(line, layers);
    if (ran.answer !== undefined) {
      keep(text('console.line', { line }), false);
      keep(ran.answer, true);
    }
    if (ran.layers !== layers) {
      layers = ran.layers;
      layered(layers);
    }
    paint();
  };

  const show = (on: boolean): void => {
    open = on;
    root.setVisible(on);
  };

  readsKeyboard(scene, (event) => {
    if (event.code === CONSOLE_KEY) {
      show(!open);
      return true;
    }
    if (!open) return false;
    if (event.key === 'Escape') show(false);
    else if (event.key === 'Enter') run();
    else if (event.key === 'Backspace') {
      typed = typed.slice(0, -1);
      paint();
    } else if (event.key.length === 1) {
      typed += event.key;
      paint();
    }
    return true;
  });

  paint();
  show(false);
}
