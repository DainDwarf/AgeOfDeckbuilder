import type Phaser from 'phaser';
import { keyOf } from './bindings';
import { whileUp } from './design-space';

/** The two the game reads its controls from, wherever the press came from. */
const DOWN = 'key-down';
const UP = 'key-up';

/** How a mouse button reads as a key: the button, by the number the browser gives it. */
function mouseKey(button: number): string {
  return `Mouse${button}`;
}

/** How a wheel notch reads as a key: the way the wheel turned. */
const WHEEL_UP = 'WheelUp';
const WHEEL_DOWN = 'WheelDown';

/** What the browser measures one notch of the wheel as. */
const NOTCH = 100;

/**
 * How long a part of a notch stands, in milliseconds. A trackpad sends a stream of small deltas
 * that add up to a notch; a remainder left from a stream that ended long ago is not part of the
 * next one.
 */
const NOTCH_WINDOW = 200;

/**
 * The mouse as a set of keys: every button but the one that presses the table binds like a key and
 * presses nothing, and a notch of the wheel either way binds like a key too. Phaser's mouse manager
 * passes over an event whose default is already prevented, so preventing it here is what takes the
 * press off the table — and it is only the press: the browser's own menu comes of the `contextmenu`
 * event, which the game's `disableContextMenu` kills. The wheel's own default is left standing, so
 * Phaser still hears the wheel that scrolls a pile being browsed.
 *
 * Heard on the way down, ahead of Phaser's listeners on the canvas; a button's release is heard
 * wherever it lands, so one pressed on the canvas and let go of off it still comes up. A notch has
 * no release of its own and is pressed and let go of at once — a notch left held would carry
 * whatever it binds for ever.
 */
export function readMouseKeys(game: Phaser.Game): void {
  const held = new Set<number>();
  window.addEventListener(
    'mousedown',
    (event) => {
      if (event.button === 0 || event.target !== game.canvas) return;
      event.preventDefault();
      held.add(event.button);
      game.events.emit(DOWN, mouseKey(event.button));
    },
    true,
  );
  window.addEventListener(
    'mouseup',
    (event) => {
      if (!held.delete(event.button)) return;
      event.preventDefault();
      game.events.emit(UP, mouseKey(event.button));
    },
    true,
  );

  /** How far the wheel has turned towards its next notch, and when it last turned. */
  let rolled = 0;
  let turned = 0;
  window.addEventListener(
    'wheel',
    (event) => {
      if (event.target !== game.canvas || event.deltaY === 0) return;
      const lapsed = event.timeStamp - turned > NOTCH_WINDOW;
      turned = event.timeStamp;
      if (lapsed || Math.sign(event.deltaY) !== Math.sign(rolled)) rolled = 0;
      rolled += event.deltaY;

      const notches = Math.trunc(rolled / NOTCH);
      rolled -= notches * NOTCH;
      const key = notches < 0 ? WHEEL_UP : WHEEL_DOWN;
      for (let notch = Math.abs(notches); notch > 0; notch--) {
        game.events.emit(DOWN, key);
        game.events.emit(UP, key);
      }
    },
    true,
  );
}

/** Every key pressed while the scene is up, from the keyboard and from the mouse alike. */
export function onKeyDown(scene: Phaser.Scene, pressed: (key: string) => void): void {
  scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => pressed(keyOf(event.key)));
  whileUp(scene, scene.game.events, DOWN, pressed);
}

/** Every key released while the scene is up; one held as the scene goes down is never released. */
export function onKeyUp(scene: Phaser.Scene, released: (key: string) => void): void {
  scene.input.keyboard?.on('keyup', (event: KeyboardEvent) => released(keyOf(event.key)));
  whileUp(scene, scene.game.events, UP, released);
}
