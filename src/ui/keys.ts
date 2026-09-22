import type Phaser from 'phaser';
import { type Bind, boundTo, CONTROLS, keyPressed, mouseCode, PRESSES } from './bindings';
import { whileUp } from './design-space';

/** The two the game reads its controls from, wherever the press came from. */
const DOWN = 'key-down';
const UP = 'key-up';

/** The code of a wheel notch's place: the way the wheel turned. */
const WHEEL_UP = 'WheelUp';
const WHEEL_DOWN = 'WheelDown';

/** Whether the press is a notch of the wheel, for a reader whose rule for one differs. */
export function isWheelNotch(press: Bind): boolean {
  return press.code === WHEEL_UP || press.code === WHEEL_DOWN;
}

/** What the browser measures one notch of the wheel as. */
const NOTCH = 100;

/**
 * How long a part of a notch stands, in milliseconds. A trackpad sends a stream of small deltas
 * that add up to a notch; a remainder left from a stream that ended long ago is not part of the
 * next one.
 */
const NOTCH_WINDOW = 200;

/**
 * A press on the game's emitter, which has no stopping of its own: a scene that takes one marks it,
 * and every listener after it — every scene started later, the emitter running them in the order
 * they subscribed — leaves it alone. A release carries no mark, none ever being taken.
 */
type Taken = Bind & { taken: boolean };

/**
 * Whether the press is a chord, and so the browser's: Ctrl+S saves the page, Ctrl+wheel zooms it.
 * A modifier held reads on every event under it, the modifier key's own press included, so bare
 * Ctrl, Meta and Alt are chords too.
 */
function chorded(event: { ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

/**
 * The mouse as a set of keys: every button but the two that press the chronicle screen binds
 * like a key and presses nothing, and a notch of the wheel either way binds like a key too.
 * Phaser's mouse manager passes over an event whose default is already prevented, so preventing it
 * here — before a chord is dropped, or the chord would reach Phaser as a press — is what takes the
 * press off the chronicle screen, and it is only the press: the browser's own menu comes of the
 * `contextmenu` event, which the game's `disableContextMenu` kills. The wheel's own default is left
 * standing, so Phaser still hears the wheel that scrolls a pile being browsed.
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
      if (PRESSES.has(event.button) || event.target !== game.canvas) return;
      event.preventDefault();
      if (chorded(event)) return;
      held.add(event.button);
      const press: Taken = { code: mouseCode(event.button), taken: false };
      game.events.emit(DOWN, press);
    },
    true,
  );
  window.addEventListener(
    'mouseup',
    (event) => {
      if (!held.delete(event.button)) return;
      event.preventDefault();
      const press: Bind = { code: mouseCode(event.button) };
      game.events.emit(UP, press);
    },
    true,
  );

  /** How far the wheel has turned towards its next notch, and when it last turned. */
  let rolled = 0;
  let turned = 0;
  window.addEventListener(
    'wheel',
    (event) => {
      if (event.target !== game.canvas || event.deltaY === 0 || chorded(event)) return;
      const lapsed = event.timeStamp - turned > NOTCH_WINDOW;
      turned = event.timeStamp;
      if (lapsed || Math.sign(event.deltaY) !== Math.sign(rolled)) rolled = 0;
      rolled += event.deltaY;

      const notches = Math.trunc(rolled / NOTCH);
      rolled -= notches * NOTCH;
      const code = notches < 0 ? WHEEL_UP : WHEEL_DOWN;
      for (let notch = Math.abs(notches); notch > 0; notch--) {
        // A press of its own for each notch: one object would carry the first notch's mark to the rest.
        const turn: Taken = { code, taken: false };
        const released: Bind = { code };
        game.events.emit(DOWN, turn);
        game.events.emit(UP, released);
      }
    },
    true,
  );
}

/** Whether one of the controls stands on this key, and the browser is to be kept out of it. */
function carries(press: Bind): boolean {
  return CONTROLS.some((control) => boundTo(press, control));
}

/**
 * Every key pressed while the scene is up, from the keyboard and from the mouse alike. A key the
 * game binds keeps the browser out of it — Tab would move the focus off the canvas, the arrows and
 * the space bar would scroll the page. Read after the press has been answered: a slot of the
 * Controls window binds the very key that opened it, and that key is the game's from then on.
 */
export function onKeyDown(scene: Phaser.Scene, pressed: (press: Bind) => void): void {
  scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
    if (chorded(event)) return;
    const press = keyPressed(event);
    pressed(press);
    if (carries(press)) event.preventDefault();
  });
  whileUp(scene, scene.game.events, DOWN, (press: Taken) => {
    if (!press.taken) pressed(press);
  });
}

/**
 * Every mouse key and wheel notch pressed while the scene is up, offered to be taken: one taken
 * reaches no scene that started later. A release is never offered. The keyboard's own keys come
 * through the scene's keyboard plugin, which stops them itself.
 */
export function takesMouseKeys(scene: Phaser.Scene, takes: (press: Bind) => boolean): void {
  whileUp(scene, scene.game.events, DOWN, (press: Taken) => {
    if (!press.taken && takes(press)) press.taken = true;
  });
}

/**
 * Every key pressed in the raw, on the scene's own keyboard plugin: one the reader takes reaches
 * neither the browser nor a scene that started later, and a chord is the browser's and is never
 * offered. No release is read here, so a key held as this scene rose is let go of beneath it.
 */
export function readsKeys(scene: Phaser.Scene, reads: (event: KeyboardEvent) => boolean): void {
  scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
    if (chorded(event) || !reads(event)) return;
    event.stopPropagation();
    event.preventDefault();
  });
}

/**
 * Every key released while the scene is up; one held as the scene goes down is never released. A
 * release is never dropped for a chord: a key pressed bare and let go of under a modifier would
 * otherwise stay held, and the frame would pan on for ever.
 */
export function onKeyUp(scene: Phaser.Scene, released: (press: Bind) => void): void {
  scene.input.keyboard?.on('keyup', (event: KeyboardEvent) => released(keyPressed(event)));
  whileUp(scene, scene.game.events, UP, released);
}
