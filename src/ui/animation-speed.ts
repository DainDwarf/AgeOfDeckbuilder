import type Phaser from 'phaser';
import { store, stored } from './storage';

/** The speeds the chronicle screen's motions play at, each that many times the one they were designed at. */
export const ANIMATION_SPEEDS = [1, 2, 4] as const;

type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number];

/** Where the browser keeps the speed, apart from what the Controls window's Default puts back. */
const ANIMATION_SPEED_ENTRY = 'age-of-deckbuilder.animation-speed';

/** The speed kept: whatever is not one of the speeds stands at the designed one. */
export function parseAnimationSpeed(stored: string | null): AnimationSpeed {
  return ANIMATION_SPEEDS.find((speed) => String(speed) === stored) ?? 1;
}

export function serialiseAnimationSpeed(speed: AnimationSpeed): string {
  return String(speed);
}

/** The speed a press moves that one to, the fastest going back to the first. */
export function speedAfter(speed: AnimationSpeed): AnimationSpeed {
  return ANIMATION_SPEEDS[(ANIMATION_SPEEDS.indexOf(speed) + 1) % ANIMATION_SPEEDS.length];
}

/** What the chronicle screen plays at, read from the browser the first time it is asked for. */
let speedSet: AnimationSpeed | undefined;

export function animationSpeed(): AnimationSpeed {
  speedSet ??= parseAnimationSpeed(stored(ANIMATION_SPEED_ENTRY));
  return speedSet;
}

/**
 * Every tween of the chronicle screen's scenes set to the speed. Their clocks stay out of it: the hover
 * rests run on them (docs/PHASER.md). Written after all three have started: a start sets a scale back.
 */
export function chronicleScreenAtSpeed(scenes: Phaser.Scenes.SceneManager): void {
  for (const key of ['map', 'ui', 'overlay']) {
    scenes.getScene(key).tweens.timeScale = animationSpeed();
  }
}

/** The speed moved on and kept, and taken at once by a chronicle screen standing. */
export function pressAnimationSpeed(scenes: Phaser.Scenes.SceneManager): void {
  speedSet = speedAfter(animationSpeed());
  store(ANIMATION_SPEED_ENTRY, serialiseAnimationSpeed(speedSet));
  if (scenes.isActive('ui')) chronicleScreenAtSpeed(scenes);
}
