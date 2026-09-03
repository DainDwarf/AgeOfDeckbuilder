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

/**
 * The mouse as a set of keys: every button but the one that presses the table binds like a key and
 * presses nothing. Phaser's mouse manager passes over an event whose default is already prevented,
 * so preventing it here is what takes the press off the table — and it is only the press: the
 * browser's own menu comes of the `contextmenu` event, which the game's `disableContextMenu` kills.
 * Heard on the way down, ahead of Phaser's listeners on the canvas; the release is heard wherever it
 * lands, so a button pressed on the canvas and let go of off it still comes up.
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
