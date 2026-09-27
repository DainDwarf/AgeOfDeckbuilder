import Phaser from 'phaser';
import { COVERED, holdDesignSpace, letGoOfPress } from './design-space';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { wearNavbar } from './navbar';
import { campaignHeld } from './save-entry';
import { createTree } from './tree';

/** The campaign screen: the navbar and the bar, and the technology tree in the room they leave. */
export class CampaignScreen extends Phaser.Scene {
  constructor() {
    super('campaign');
  }

  create(): void {
    holdDesignSpace(this, this.cameras.main);
    const worn = wearNavbar(this, 'campaign');
    backRaisesMenu(this);
    const tree = createTree(this, worn, campaignHeld().technologies);
    // A press held as the menu's scrim rises is let go of after the pointer event that raised it:
    // Phaser's dispatch is synchronous, and a release inside it walks the plugin's lists mid-walk.
    resetMenu(this, (under) => {
      tree.cover(under);
      if (!under) return;
      this.input.emit(COVERED);
      queueMicrotask(() => letGoOfPress(this.game));
    });
  }
}
