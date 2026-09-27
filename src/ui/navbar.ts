import type Phaser from 'phaser';
import { layOutBar } from './bar-layout';
import {
  addText,
  answersPress,
  BAR_HEIGHT,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MARGIN,
  onClick,
  stratumOf,
  UI_FONT,
} from './design-space';
import { css, LOOK } from './look';
import { menuRoom } from './menu';
import {
  createReading,
  createWell,
  placeReading,
  placeWell,
  readingWidth,
  SUNK,
} from './resource-bar';
import { campaignHeld } from './save-entry';
import { type TextKey, text } from './text';
import { createTooltip } from './tooltip';

/** A screen of the meta, by the key of the scene it stands on. */
export type MetaScreen = 'campaign' | 'launch';

/** The navbar's buttons, top down: the screen each opens and its word. */
const BUTTONS: readonly { readonly screen: MetaScreen; readonly word: TextKey }[] = [
  { screen: 'campaign', word: 'navbar.campaign' },
  { screen: 'launch', word: 'navbar.chronicle' },
];

const NAVBAR_WIDTH = 240;
const BUTTON_WIDTH = NAVBAR_WIDTH - 2 * MARGIN;
const BUTTON_HEIGHT = 44;
const BUTTON_GAP = 12;

/** The room the navbar and the bar leave a screen of the meta, right of the one and under the other. */
export const ROOM = {
  x: NAVBAR_WIDTH,
  y: BAR_HEIGHT,
  width: DESIGN_WIDTH - NAVBAR_WIDTH,
  height: DESIGN_HEIGHT - BAR_HEIGHT,
};

const INK = css(LOOK.ink);
const TITLE_STYLE = {
  fontFamily: UI_FONT,
  fontSize: '26px',
  fontStyle: 'bold',
  color: INK,
  align: 'center',
};
const LABEL_STYLE = { fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold', color: INK };

/**
 * The navbar down the left edge, the button of the screen standing sunk in a well, and the bar along
 * the top reading the influence; answers the layer the screen's own content stands on.
 */
export function wearNavbar(scene: Phaser.Scene, standing: MetaScreen): Phaser.GameObjects.Layer {
  scene.add.rectangle(0, 0, NAVBAR_WIDTH, DESIGN_HEIGHT, LOOK.panelFill).setOrigin(0, 0);
  scene.add.rectangle(NAVBAR_WIDTH - 1, 0, 1, DESIGN_HEIGHT, LOOK.panelEdge).setOrigin(0, 0);
  const middle = NAVBAR_WIDTH / 2;
  const title = addText(scene, middle, MARGIN, text('navbar.title'), TITLE_STYLE)
    .setOrigin(0.5, 0)
    .setName('navbar-title');

  const first = MARGIN + title.height + MARGIN;
  BUTTONS.forEach(({ screen, word }, index) => {
    const y = first + index * (BUTTON_HEIGHT + BUTTON_GAP);
    const sunk = screen === standing;
    if (sunk) {
      const { well } = createWell(scene, `navbar-${screen}`);
      placeWell(well, { x: MARGIN, y, width: BUTTON_WIDTH, height: BUTTON_HEIGHT });
    } else {
      const face = scene.add
        .rectangle(middle, y + BUTTON_HEIGHT / 2, BUTTON_WIDTH, BUTTON_HEIGHT, LOOK.accent)
        .setName(`navbar-${screen}`)
        .setInteractive();
      answersPress(face);
      onClick(face, () => scene.scene.start(screen));
    }
    const pressed = sunk ? SUNK : 0;
    addText(scene, middle + pressed, y + BUTTON_HEIGHT / 2 + pressed, text(word), LABEL_STYLE)
      .setOrigin(0.5)
      .setName(`navbar-${screen}-label`);
  });

  scene.add.rectangle(ROOM.x, 0, ROOM.width, BAR_HEIGHT, LOOK.panelFill).setOrigin(0, 0);
  scene.add.rectangle(ROOM.x, BAR_HEIGHT - 1, ROOM.width, 1, LOOK.panelEdge).setOrigin(0, 0);

  const bubbles = scene.add.layer();
  const tooltip = createTooltip(scene, stratumOf(bubbles, scene.cameras.main));
  const influence = createReading(scene, tooltip, {
    name: 'influence',
    colour: LOOK.accent,
    word: text('label.influence'),
    tip: text('tooltip.influence'),
  });

  const read = (count: number): void => {
    influence.value.setText(String(count));
    const [{ at, zone }] = layOutBar({
      readings: [readingWidth(influence, influence.value.width)],
      menu: menuRoom(scene),
      width: ROOM.width,
      margin: MARGIN,
    }).readings;
    placeReading(influence, {
      at: ROOM.x + at,
      zone: { x: ROOM.x + zone.x, width: zone.width },
    });
  };
  read(campaignHeld().influence);

  const content = scene.add.layer();
  scene.children.bringToTop(bubbles);
  return content;
}
