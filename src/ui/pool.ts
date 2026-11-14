import type Phaser from 'phaser';
import { stopMotion } from './card-motion';

/** What a paint keeps and hides rather than destroys. */
type Retained =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Polygon
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Text;

/** An object as a paint finds it, whatever a motion left: shown, whole, at full strength. */
export function asPainted<T extends Retained>(object: T): T {
  object.setVisible(true);
  object.setAlpha(1);
  object.setScale(1);
  return object;
}

/** The objects of one kind a layer or a container keeps, as many as a paint has ever wanted at once. */
export type Pool<T> = {
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

function pool<T>(
  on: Stand,
  make: () => T,
  rootOf: (made: T) => Retained | Phaser.GameObjects.Zone,
  shown: (made: T) => T,
): Pool<T> {
  const made: T[] = [];
  let taken = 0;
  return {
    hide(): void {
      const roots = made.map(rootOf);
      stopMotion(on.scene, roots);
      for (const root of roots) root.setVisible(false);
      taken = 0;
    },
    take(): T {
      if (taken === made.length) {
        const object = make();
        on.add(rootOf(object));
        made.push(object);
      }
      taken += 1;
      return shown(made[taken - 1]);
    },
  };
}

export function poolOf<T extends Retained>(on: Stand, make: () => T): Pool<T> {
  return pool<T>(on, make, (object) => object, asPainted);
}

/** A Zone has no strength to reset, and draws nothing a motion could have left. */
export function zonePoolOf(
  on: Stand,
  make: () => Phaser.GameObjects.Zone,
): Pool<Phaser.GameObjects.Zone> {
  return pool(
    on,
    make,
    (zone) => zone,
    (zone) => zone.setVisible(true),
  );
}

/** Marks of several parts in one container each, kept, hidden and shown by that container. */
export function rootedPoolOf<T extends { readonly root: Phaser.GameObjects.Container }>(
  on: Stand,
  make: () => T,
): Pool<T> {
  return pool<T>(
    on,
    make,
    (mark) => mark.root,
    (mark) => {
      asPainted(mark.root);
      return mark;
    },
  );
}
