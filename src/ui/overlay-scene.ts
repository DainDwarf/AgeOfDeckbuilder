import Phaser from 'phaser';
import { type Bind, keyPressed } from './bindings';
import { holdDesignSpace, type Stratum, stopsThePointer, stratumOf } from './design-space';
import { readsKeys, takesMouseKeys } from './keys';

/** The overlay's strata, in the order they stand, all painted by its one camera. */
export type Strata = {
  readonly scrim: Stratum;
  readonly carried: Stratum;
  readonly note: Stratum;
  readonly smallCard: Stratum;
};

/**
 * The scrim and what it carries, on a scene of its own: started ahead of the chronicle screen
 * wherever a chronicle opens and restarted ahead of it, so its keyboard plugin hears a key first. It
 * is never put to sleep — while nothing stands it is awake and empty, and the pointer falls through.
 */
export class OverlayScene extends Phaser.Scene {
  /** Where whatever the chronicle screen raises on the overlay is added. */
  strata!: Strata;

  /** What the widget drawn here answers a key or a mouse key with, and nothing while none is built. */
  private taker: ((press: Bind) => boolean) | undefined;

  constructor() {
    super('overlay');
  }

  create(): void {
    const camera = this.cameras.main;
    this.strata = {
      scrim: stratumOf(this.add.layer().setName('scrim'), camera),
      carried: stratumOf(this.add.layer().setName('carried'), camera),
      note: stratumOf(this.add.layer().setName('note'), camera),
      smallCard: stratumOf(this.add.layer().setName('small-card'), camera),
    };
    // A restart keeps the instance and its fields (docs/PHASER.md), so the widget of the chronicle
    // that has just gone down would answer keys until the next one is built.
    this.taker = undefined;
    holdDesignSpace(this, camera);
    stopsThePointer(this, () => 'every');
    readsKeys(this, (event) => this.taker?.(keyPressed(event)) === true);
    takesMouseKeys(this, (press) => this.taker?.(press) === true);
  }

  /** The one widget drawn on this scene, offered every key and mouse key ahead of the screen under it. */
  takes(taker: (press: Bind) => boolean): void {
    this.taker = taker;
  }
}

/** The overlay scene of the game, for whichever screen draws on it. */
export function overlayOf(scene: Phaser.Scene): OverlayScene {
  return scene.game.scene.getScene<OverlayScene>('overlay');
}
