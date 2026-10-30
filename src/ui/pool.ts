import type Phaser from 'phaser';
import { stopMotion } from './card-motion';

/** What a paint keeps and hides rather than destroys. */
type Retained =
  | Phaser.GameObjects.Polygon
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Graphics
  | Phaser.GameObjects.Text;

/** An object as a paint finds it, whatever a motion left: shown, whole, at full strength. */
export function asPainted<T extends Retained>(object: T): T {
  object.setVisible(true);
  object.setAlpha(1);
  object.setScale(1);
  return object;
}

/** The objects of one kind a layer or a container keeps, as many as a paint has ever wanted at once. */
type Pool<T> = {
  /** Every object stopped where it stands and hidden, the next `take` starting over. */
  hide(): void;
  /** The next object as a paint finds it; its shape, colour, name and place are its last use's. */
  take(): T;
};

/** Where a pool stands what it makes. */
type Stand = {
  readonly scene: Phaser.Scene;
  add(object: Phaser.GameObjects.GameObject): unknown;
};

function pool<T extends Retained | Phaser.GameObjects.Zone>(
  on: Stand,
  make: () => T,
  shown: (object: T) => T,
): Pool<T> {
  const made: T[] = [];
  let taken = 0;
  return {
    hide(): void {
      stopMotion(on.scene, made);
      for (const object of made) object.setVisible(false);
      taken = 0;
    },
    take(): T {
      if (taken === made.length) {
        const object = make();
        on.add(object);
        made.push(object);
      }
      taken += 1;
      return shown(made[taken - 1]);
    },
  };
}

export function poolOf<T extends Retained>(on: Stand, make: () => T): Pool<T> {
  return pool<T>(on, make, asPainted);
}

/** A Zone has no strength to reset, and draws nothing a motion could have left. */
export function zonePoolOf(
  on: Stand,
  make: () => Phaser.GameObjects.Zone,
): Pool<Phaser.GameObjects.Zone> {
  return pool(on, make, (zone) => zone.setVisible(true));
}
