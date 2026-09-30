import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { offerEntries } from './debug-console';
import { awayUnder, COVERED, holdDesignSpace } from './design-space';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { wearNavbar } from './navbar';
import { overlayOf } from './overlay-scene';
import { campaignHeld } from './save-entry';
import { standLarge } from './stack';
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
    const away = awayUnder(this);
    const overlay = overlayOf(this);
    const large = standLarge(overlay, CATALOGUE, (up) => {
      tree.cover(away('overlay', up));
    });
    const tree = createTree(this, worn, CATALOGUE, campaignHeld().technologies, large.named);
    offerEntries(this, { seed: undefined, veiled: undefined });
    resetMenu(this, (under) => {
      tree.cover(away('menu', under));
      if (under) overlay.input.emit(COVERED);
    });
  }
}
