import Phaser from 'phaser';
import { boundTo, keyPressed } from './bindings';
import { holdDesignSpace } from './design-space';
import { readsKeys, takesMouseKeys } from './keys';
import { closeMenu, raiseMenu } from './menu-scene';
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

    readsKeys(this, (event) => {
      if (!boundTo(keyPressed(event), 'back')) return false;
      raiseMenu(this);
      return true;
    });
    takesMouseKeys(this, (press) => {
      if (!boundTo(press, 'back')) return false;
      raiseMenu(this);
      return true;
    });
  }
}
