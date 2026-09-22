import Phaser from 'phaser';
import { followFactor, homeLayer, type Surface, surfaceOf } from './design-space';

/**
 * The map's surface, on a scene of its own under the chronicle screen's UI: started ahead of the
 * `ui` scene wherever a chronicle opens and restarted ahead of it. Its one camera is the map view's
 * to cut to the frame, zoom and pan, and nothing here holds it.
 */
export class MapScene extends Phaser.Scene {
  surface!: Surface;

  constructor() {
    super('map');
  }

  create(): void {
    this.surface = surfaceOf(homeLayer(this, 'map'), this.cameras.main);
    followFactor(this);
  }
}

export function mapOf(scene: Phaser.Scene): MapScene {
  return scene.game.scene.getScene<MapScene>('map');
}
