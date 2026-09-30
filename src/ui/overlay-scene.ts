import Phaser from 'phaser';
import { type Bind, keyPressed } from './bindings';
import { holdDesignSpace, type Stratum, stopsThePointer, stratumOf } from './design-space';
import { onScrollKeys, onWheel, readsKeys, takesMouseKeys } from './keys';

/** What the overlay asks of the menu scene, and all it ever holds of it: whether a window of it stands. */
export type CoversOverlay = Phaser.Scene & { covered(): boolean };

/** What scrolls on the overlay, handed a frame of a key held and a turn of the wheel, down above zero. */
export type Scroller = {
  pan(way: number, delta: number): void;
  wheel(by: number): void;
};

/** The overlay's strata, in the order they stand, all painted by its one camera. */
export type Strata = {
  readonly scrim: Stratum;
  readonly large: Stratum;
  readonly note: Stratum;
  readonly smallCard: Stratum;
  readonly tooltip: Stratum;
};

/**
 * The scrim and what it carries, started through `overlayAhead` and never put to sleep: while
 * nothing stands, the pointer falls through it.
 */
export class OverlayScene extends Phaser.Scene {
  /** Where whatever the screen under it raises on the overlay is added. */
  strata!: Strata;

  /** What the widget drawn here answers a key or a mouse key with, and nothing while none is built. */
  private taker: ((press: Bind) => boolean) | undefined;

  /** What the widget drawn here scrolls with, and nothing while none is built. */
  private scroller: Scroller | undefined;

  constructor() {
    super('overlay');
  }

  create(): void {
    const camera = this.cameras.main;
    this.strata = {
      scrim: stratumOf(this.add.layer().setName('scrim'), camera),
      large: stratumOf(this.add.layer().setName('large'), camera),
      note: stratumOf(this.add.layer().setName('note'), camera),
      smallCard: stratumOf(this.add.layer().setName('small-card'), camera),
      tooltip: stratumOf(this.add.layer().setName('tooltip'), camera),
    };
    // A restart keeps the instance and its fields (docs/PHASER.md), so the widget of the screen that
    // has just gone down would answer keys and the wheel until the next one is built.
    this.taker = undefined;
    this.scroller = undefined;
    holdDesignSpace(this, camera);
    stopsThePointer(
      this,
      () => 'every',
      () => true,
    );
    // Ahead of the taker's: a mouse key it takes reaches no reader subscribed after it.
    onScrollKeys(this, (way, delta) => {
      if (!this.game.scene.getScene<CoversOverlay>('menu').covered())
        this.scroller?.pan(way, delta);
    });
    readsKeys(this, (event) => this.taker?.(keyPressed(event)) === true);
    takesMouseKeys(this, (press) => this.taker?.(press) === true);
    onWheel(this, (by) => {
      this.scroller?.wheel(by);
    });
  }

  /** The one widget drawn on this scene, offered every key and mouse key ahead of the screen under it. */
  takes(taker: (press: Bind) => boolean): void {
    this.taker = taker;
  }

  /**
   * The one widget drawn on this scene, handed wherever the pointer stands every frame the two keys
   * that pan the map up and down carry what scrolls, while no window of the menu stands over it, and
   * every turn of the wheel, which a window of the menu stops before it reaches here.
   */
  scrolls(scroller: Scroller): void {
    this.scroller = scroller;
  }
}

/**
 * The overlay started anew, before the screen about to open is started: its keyboard plugin then
 * hears a key first, and nothing the screen before built on it answers one (docs/PHASER.md).
 */
export function overlayAhead(scenes: Phaser.Scenes.ScenePlugin | Phaser.Scenes.SceneManager): void {
  // A scene's plugin queues the start, and its own `start` would stop the scene calling it.
  if (scenes instanceof Phaser.Scenes.ScenePlugin) scenes.launch('overlay');
  else scenes.start('overlay');
}

/** The overlay scene of the game, for whichever screen draws on it. */
export function overlayOf(scene: Phaser.Scene): OverlayScene {
  return scene.game.scene.getScene<OverlayScene>('overlay');
}
