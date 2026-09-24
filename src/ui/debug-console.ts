import Phaser from 'phaser';
import { runLine } from './console-line';
import {
  addText,
  BAR_HEIGHT,
  DESIGN_WIDTH,
  holdDesignSpace,
  MARGIN,
  whileUp,
} from './design-space';
import { readsKeys } from './keys';
import { css, LOOK } from './look';
import { text } from './text';
import { VEILS_ON, type Veils } from './veils';

/** The place the key that opens the console stands on: the one above Tab, whatever it prints. */
const CONSOLE_KEY = 'Backquote';

/** What the console throws a veil's switch on, for whatever screen is drawn under it. */
const VEILED = 'veiled';

/** How many lines already run stand above the line being typed. */
const HISTORY = 4;

/** The pale a line typed reads in, and the grey an answer reads in. */
const TYPED_INK = css(LOOK.paleInk);
const ANSWER_INK = css(LOOK.answerInk);

/** How tall one line stands, and how far the lines stand off the panel's top and bottom. */
const LINE = 18;
const PAD = 10;

// The panel is not opaque: everything it drops over reads dimly through it, and the resource bar is
// a panel of words. The console writes below the strip the bar is drawn in, or its own lines and the
// bar's readings are painted through each other.
/** Where the console's own lines begin: under the whole of the resource bar. */
const LINES_TOP = BAR_HEIGHT + PAD;

const HEIGHT = LINES_TOP + PAD + (HISTORY + 1) * LINE;

/** The monospace stack the console types in. */
export const CONSOLE_FONT = 'ui-monospace, Consolas, "Courier New", monospace';

const CONSOLE_STYLE = {
  fontFamily: CONSOLE_FONT,
  fontSize: '14px',
  color: TYPED_INK,
};

/** One line the console has run: what it read, and whether it was the console's answer. */
type Line = { readonly line: string; readonly answer: boolean };

/**
 * The debug console, on a scene of its own: started first at boot, so every key reaches it ahead of
 * every other scene, and never stopped, so it outlives every chronicle. Nothing it holds is made
 * interactive, which is what lets the pointer fall through to the screen beneath.
 */
export class DebugConsole extends Phaser.Scene {
  /** The console closed, the lines it ran cleared, and both veils back on. */
  reset!: () => void;

  constructor() {
    super('console');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);

    const root = this.add.container(0, 0).setName('console');
    root.add([
      this.add
        .rectangle(0, 0, DESIGN_WIDTH, HEIGHT, LOOK.consolePanel.colour, LOOK.consolePanel.strength)
        .setOrigin(0, 0),
      this.add.rectangle(0, HEIGHT - 1, DESIGN_WIDTH, 1, LOOK.panelEdge).setOrigin(0, 0),
    ]);

    const lines: Phaser.GameObjects.Text[] = [];
    for (let at = 0; at < HISTORY; at++) {
      const label = addText(this, MARGIN, LINES_TOP + at * LINE, '', CONSOLE_STYLE)
        .setOrigin(0, 0)
        .setName(`console-line-${at}`);
      lines.push(label);
      root.add(label);
    }

    const input = addText(this, MARGIN, LINES_TOP + HISTORY * LINE, '', CONSOLE_STYLE)
      .setOrigin(0, 0)
      .setName('console-input');
    const caret = this.add
      .rectangle(MARGIN, LINES_TOP + HISTORY * LINE + 3, 7, LINE - 8, LOOK.panelFill)
      .setOrigin(0, 0)
      .setName('console-caret');
    root.add([input, caret]);

    /** Whether the console stands over the screen. */
    let open = false;
    /** What has been typed since the last line was run. */
    let typed = '';
    const history: Line[] = [];
    let veils = VEILS_ON;

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
      const ran = runLine(line, veils);
      if (ran.answer !== undefined) {
        keep(text('console.line', { line }), false);
        keep(ran.answer, true);
      }
      if (ran.veils !== veils) {
        veils = ran.veils;
        this.game.events.emit(VEILED, veils);
      }
      paint();
    };

    const show = (on: boolean): void => {
      open = on;
      root.setVisible(on);
    };

    readsKeys(this, (event) => {
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

    this.reset = (): void => {
      history.length = 0;
      typed = '';
      veils = VEILS_ON;
      paint();
      show(false);
    };
    this.reset();
  }
}

/**
 * The console put back where it began for the chronicle screen now rising, which therefore opens
 * under both veils, and every switch the console throws while that screen stands.
 */
export function resetConsole(scene: Phaser.Scene, veiled: (veils: Veils) => void): void {
  scene.game.scene.getScene<DebugConsole>('console').reset();
  whileUp(scene, scene.game.events, VEILED, veiled);
}
