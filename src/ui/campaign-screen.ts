import Phaser from 'phaser';
import { holdDesignSpace } from './design-space';
import { backRaisesMenu, closeMenu } from './menu-scene';
import { wearNavbar } from './navbar';

/** The campaign screen: the navbar and the bar, and the room they leave. */
export class CampaignScreen extends Phaser.Scene {
  constructor() {
    super('campaign');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    closeMenu(this);
    wearNavbar(this, 'campaign');
    backRaisesMenu(this);
  }
}
