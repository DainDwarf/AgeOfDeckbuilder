import Phaser from 'phaser';
import { CATALOGUE } from '../content/catalogue';
import { boundTo } from './bindings';
import { createKindBubble, type Name } from './card-face';
import {
  awayUnder,
  COVERED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  holdDesignSpace,
  onClick,
} from './design-space';
import { LOOK } from './look';
import { backRaisesMenu, resetMenu } from './menu-scene';
import { wearNavbar } from './navbar';
import { type OverlayScene, overlayOf } from './overlay-scene';
import { campaignHeld } from './save-entry';
import { createStack } from './stack';
import { createTooltip } from './tooltip';
import { createTree, movesTree } from './tree';

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
    const inspect = standLarge(overlay, (up) => {
      away('overlay', up);
    });
    const tree = createTree(this, worn, campaignHeld().technologies, inspect);
    resetMenu(this, (under) => {
      tree.cover(under);
      away('menu', under);
      if (under) overlay.input.emit(COVERED);
    });
  }
}

/**
 * The stack of cards shown large on a scrim of the overlay's over the whole screen, which a press on
 * the scrim and the back key walk down: answers what a right click on a name shows large.
 */
function standLarge(
  overlay: OverlayScene,
  covering: (covered: boolean) => void,
): (name: Name) => void {
  const scrim = overlay.add
    .rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, LOOK.scrim.colour, LOOK.scrim.strength)
    .setOrigin(0, 0)
    .setVisible(false);
  overlay.strata.scrim.layer.add(scrim);
  const stack = createStack(
    overlay,
    CATALOGUE,
    createKindBubble(createTooltip(overlay, overlay.strata.tooltip)),
  );

  const takeDownNewest = (): void => {
    if (stack.takeDownNewest()) return;
    scrim.setVisible(false).disableInteractive();
    covering(false);
  };
  onClick(scrim, takeDownNewest);
  onClick(scrim, takeDownNewest, 'right');

  overlay.takes((press) => {
    if (!stack.standing) return false;
    if (boundTo(press, 'back')) takeDownNewest();
    return !movesTree(press);
  });

  return (name) => {
    if (!stack.standing) {
      scrim.setVisible(true).setInteractive();
      covering(true);
    }
    stack.named(name);
  };
}
