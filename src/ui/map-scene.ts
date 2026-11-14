import Phaser from 'phaser';
import { followFactor, type Stratum, stratumOf } from './design-space';

/** The map's strata, in the order they stand, all painted by its one camera. */
export type MapStrata = {
  readonly terrain: Stratum;
  /** The buildings and the discs. */
  readonly buildings: Stratum;
  readonly cityMarks: Stratum;
  /** The yield overlay's dim. */
  readonly dim: Stratum;
  /** The marks of the selection and the aim. */
  readonly selection: Stratum;
  /** The units, and over them a city's bars and its badge. */
  readonly units: Stratum;
  /** The yield glyphs, and over them the culture threshold and what an aimed card would give. */
  readonly yields: Stratum;
  readonly infopanel: Stratum;
  readonly note: Stratum;
  readonly tooltip: Stratum;
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
    const stratum = (): Stratum => stratumOf(this.add.layer(), camera);
    this.strata = {
      terrain: stratum(),
      buildings: stratum(),
      cityMarks: stratum(),
      dim: stratum(),
      selection: stratum(),
      units: stratum(),
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
