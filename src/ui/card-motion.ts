import Phaser from 'phaser';

/** How long one card takes to travel the table, and how far behind the one before it leaves. */
export const TRAVEL = 250;
export const STAGGER = 20;

/** How long the shuffle takes: the discard pile's top carried to the draw pile. */
export const SHUFFLE = 300;

/** How long a card takes to turn over where it lands. */
export const TURN_OVER = 120;

export const EASE = 'Sine.easeInOut';

/** Above the piles, the button and everything else the table lays out. */
export const IN_FLIGHT = 30;

/** How long a block of that many cards is in the air, from the first leaving to the last landing. */
export function blockLength(cards: number): number {
  return cards === 0 ? 0 : TRAVEL + (cards - 1) * STAGGER;
}

/**
 * A tween as a promise, settling however the tween ended: at its own completion, or at the stop
 * that takes it off its target early. Those two are the only ends a tween announces — Phaser's
 * `killTweensOf` destroys one where it stands, listeners removed and nothing dispatched, so a
 * motion taken down that way would leave whoever waits here waiting for ever. `stopMotion` is the
 * one way this game takes a motion down.
 */
export function ended(tween: Phaser.Tweens.Tween): Promise<void> {
  return new Promise((done) => {
    const over = (): void => done();
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, over);
    tween.once(Phaser.Tweens.Events.TWEEN_STOP, over);
  });
}

/**
 * The motion on these targets ended where it stands, leaving them exactly where it carried them.
 * A stopped tween announces itself and writes nothing more; the manager takes it off the next frame.
 */
export function stopMotion(scene: Phaser.Scene, targets: object | object[]): void {
  for (const tween of scene.tweens.getTweensOf(targets)) tween.stop();
}

/**
 * Every motion the scene has in the air ended: what a table being taken down owes whoever waits on
 * it, since the shutdown that follows destroys them all in silence.
 */
export function stopAllMotion(scene: Phaser.Scene): void {
  for (const tween of scene.tweens.getTweens()) tween.stop();
}

/** A card carried to a place at an angle, resolving where it settles. */
export function travel(
  scene: Phaser.Scene,
  card: Phaser.GameObjects.Container,
  to: { x: number; y: number; rotation: number },
  delay = 0,
  duration = TRAVEL,
): Promise<void> {
  return ended(
    scene.tweens.add({
      targets: card,
      x: to.x,
      y: to.y,
      rotation: to.rotation,
      delay,
      duration,
      ease: EASE,
    }),
  );
}

/**
 * A card turning over where it lies: `hides` narrows to an edge and `shows` widens from it. `hides`
 * is destroyed at the turn, and `shows` is left visible at its full width however either half
 * ended.
 */
export async function turnOver(
  scene: Phaser.Scene,
  hides: Phaser.GameObjects.Container,
  shows: Phaser.GameObjects.Container,
): Promise<void> {
  const half = { duration: TURN_OVER / 2, ease: EASE };
  await ended(scene.tweens.add({ targets: hides, scaleX: 0, ...half }));
  hides.destroy();
  shows.setScale(0, 1).setVisible(true);
  await ended(scene.tweens.add({ targets: shows, scaleX: 1, ...half }));
  shows.setScale(1, 1);
}
