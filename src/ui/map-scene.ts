import Phaser from 'phaser';
import { followFactor, type Surface, surfaceOf } from './design-space';

/** The map's strata, in the order they stand, all painted by its one camera. */
export type MapStrata = {
  readonly terrain: Surface;
  /** The tiles lit and the units glowed, while no yield dim stands to lift them over. */
  readonly lit: Surface;
  readonly buildings: Surface;
  readonly units: Surface;
  readonly fog: Surface;
  readonly cityMarks: Surface;
  /** The yield overlay's dim, and what stays at full strength through it. */
  readonly dim: Surface;
  readonly ring: Surface;
  /** The yield glyphs and the culture threshold. */
  readonly yields: Surface;
  readonly infopanel: Surface;
  readonly note: Surface;
  readonly tooltip: Surface;
};

/**
 * The map's surface, on a scene of its own under the chronicle screen's UI: started ahead of the
 * `ui` scene wherever a chronicle opens and restarted ahead of it. Its one camera is the map view's
 * to cut to the frame, zoom and pan, and nothing here holds it.
 */
export class MapScene extends Phaser.Scene {
  /** Where whatever the chronicle screen draws on the map is added. */
  strata!: MapStrata;

  constructor() {
    super('map');
  }

  create(): void {
    const camera = this.cameras.main;
    const stratum = (): Surface => surfaceOf(this.add.layer(), camera);
    this.strata = {
      terrain: stratum(),
      lit: stratum(),
      buildings: stratum(),
      units: stratum(),
      fog: stratum(),
      cityMarks: stratum(),
      dim: stratum(),
      ring: stratum(),
      yields: stratum(),
      infopanel: stratum(),
      note: stratum(),
      tooltip: stratum(),
    };
    followFactor(this);
  }
}

export function mapOf(scene: Phaser.Scene): MapScene {
  return scene.game.scene.getScene<MapScene>('map');
}
