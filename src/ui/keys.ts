import type Phaser from 'phaser';
import { type Bind, boundTo, CONTROLS, keyPressed, mouseCode, PRESSES } from './bindings';
import { whileUp } from './design-space';

/** The two the game reads its controls from, wherever the press came from. */
const DOWN = 'key-down';
const UP = 'key-up';

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
 * Every mouse button but the two that press the chronicle screen, as a key. Preventing the press is
 * what keeps it off Phaser (docs/PHASER.md), so it is prevented ahead of a chord's drop; a release
 * is heard wherever it lands, so a button let go of off the canvas still comes up.
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
}

/** Every whole notch of the wheel Phaser hands the scene, told as how many, up below zero. */
export function onWheelNotches(scene: Phaser.Scene, notched: (notches: number) => void): void {
  /** How far the wheel has turned towards its next notch, and when it last turned. */
  let rolled = 0;
  let turned = 0;
  scene.input.on(
    'wheel',
    (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      const event = pointer.event as WheelEvent;
      if (dy === 0 || chorded(event)) return;
      const lapsed = event.timeStamp - turned > NOTCH_WINDOW;
      turned = event.timeStamp;
      if (lapsed || Math.sign(dy) !== Math.sign(rolled)) rolled = 0;
      rolled += dy;

      const notches = Math.trunc(rolled / NOTCH);
      rolled -= notches * NOTCH;
      if (notches !== 0) notched(notches);
    },
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
 * Every mouse key pressed while the scene is up, offered to be taken: one taken reaches no scene
 * that started later. A release is never offered. The keyboard's own keys come through the scene's
 * keyboard plugin, which stops them itself.
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
