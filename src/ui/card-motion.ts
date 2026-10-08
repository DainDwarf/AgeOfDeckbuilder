import Phaser from 'phaser';

/** How long one card takes to cross the chronicle screen, and how far behind the one before it leaves. */
export const TRAVEL = 250;
export const STAGGER = 20;

/** How long the shuffle takes: the discard pile's top carried to the draw pile. */
export const SHUFFLE = 300;

/** How long a card takes to turn over where it lands. */
export const TURN_OVER = 120;

export const EASE = 'Sine.easeInOut';

/** How long a card let go of with nothing done takes to slide back to where it was lifted from. */
export const SLIDE_HOME = 150;

/** How long a block of that many cards is in the air, from the first leaving to the last landing. */
export function blockLength(cards: number): number {
  return cards === 0 ? 0 : TRAVEL + (cards - 1) * STAGGER;
}

/** Every tween made a promise of by `ended`: the motions someone may be waiting on. */
const waitedOn = new WeakSet<Phaser.Tweens.Tween>();

/**
 * A tween as a promise, settling at its completion or at the stop that takes it off early, the only
 * two ends a tween announces: one destroyed (`dropWaitedMotion`, Phaser's `killTweensOf`) leaves
 * whoever waits here waiting for ever.
 */
export function ended(tween: Phaser.Tweens.Tween): Promise<void> {
  waitedOn.add(tween);
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
 * Every motion the scene has in the air ended: what a chronicle screen being taken down owes
 * whoever waits on it, since the shutdown that follows destroys them all in silence.
 */
export function stopAllMotion(scene: Phaser.Scene): void {
  for (const tween of scene.tweens.getTweens()) tween.stop();
}

/**
 * Every motion of the scene's made a promise of destroyed where it stands, announcing nothing: whoever
 * waits on one waits for ever, so nothing chained after it runs. A motion nobody waits on runs on.
 */
export function dropWaitedMotion(scene: Phaser.Scene): void {
  for (const tween of scene.tweens.getTweens()) if (waitedOn.has(tween)) tween.destroy();
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
