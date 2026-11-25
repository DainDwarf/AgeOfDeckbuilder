import type Phaser from 'phaser';
import { WINDOW_RIBBON } from './browse';
import { createRibbon, takesThePointer, WINDOW_TITLE } from './chrome';
import {
  type Box,
  CLICKS,
  onClick,
  onResize,
  reactsTo,
  type Stratum,
  screenSize,
} from './design-space';
import { sink } from './display-button';
import { createSquareButton, type SquareButton } from './menu';
import { text } from './text';
import type { Tooltip } from './tooltip';

/** How wide the Minimize button's square stands, and how far right of its ribbon's painted right end. */
const SQUARE = 32;
const PAST_THE_RIBBON = 8;

/** Where the Minimize button stands beside a ribbon painted on that box: past its right end, its middle on the ribbon's. */
function besideRibbon({ x, y, width, height }: Box): Box {
  return {
    x: x + width + PAST_THE_RIBBON,
    y: y + (height - SQUARE) / 2,
    width: SQUARE,
    height: SQUARE,
  };
}

/**
 * The Minimize button on the stratum beside the ribbon painted on the box `ribbon` answers, its face
 * named `name`, standing or sunk: the rest on it raises its name under it on the tooltip, and a left
 * click on it does what `pressed` does while `live` holds.
 */
export function createMinimizeButton(
  scene: Phaser.Scene,
  on: Stratum,
  tooltip: Tooltip,
  {
    name,
    ribbon,
    sunk,
    live,
  }: {
    readonly name: string;
    readonly ribbon: () => Box;
    readonly sunk: boolean;
    readonly live?: () => boolean;
  },
  pressed: () => void,
): SquareButton {
  const button = createSquareButton(
    scene,
    on,
    { symbol: 'minimize-button', name, laid: () => besideRibbon(ribbon()), live },
    { tooltip, reads: text('button.minimize') },
    pressed,
  );
  sink(button, sunk);
  return button;
}

/** The deal window minimized: its ribbon and its title where the window stood them, and its Minimize button sunk beside them. */
export type Minimized = {
  /** Raised, the title reading the heading. */
  show(heading: string): void;
  hide(): void;
};

/**
 * The minimized deal window on the stratum, its ribbon's middle that far under the screen's top and
 * centred across it, named `minimized-deal-…`: a click on the ribbon, left or right, and a left click
 * on the button do what `bringBack` does.
 */
export function createMinimized(
  on: Stratum,
  tooltip: Tooltip,
  middle: number,
  bringBack: () => void,
): Minimized {
  const { scene } = on.layer;
  const titling = createRibbon(scene, '', WINDOW_TITLE, WINDOW_RIBBON, 'minimized-deal');
  const ribbon = reactsTo(takesThePointer(titling.ribbon), () => CLICKS);
  on.layer.add([ribbon, titling.title]);
  onClick(ribbon, bringBack);
  onClick(ribbon, bringBack, 'right');

  const across = (): number => screenSize().width / 2;
  const lay = (): void => {
    titling.place(across(), middle);
  };
  onResize(scene, lay);
  const button = createMinimizeButton(
    scene,
    on,
    tooltip,
    {
      name: 'minimized-deal-minimize',
      ribbon: () => titling.boxAt(across(), middle),
      sunk: true,
    },
    bringBack,
  );

  const parts = [ribbon, titling.title, button.face, button.sign];
  const shown = (standing: boolean): void => {
    for (const part of parts) part.setVisible(standing);
  };
  shown(false);

  return {
    show(heading) {
      titling.title.setText(heading);
      lay();
      button.lay();
      shown(true);
    },
    hide() {
      shown(false);
    },
  };
}
