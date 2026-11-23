import type Phaser from 'phaser';
import { pressOf } from './bindings';
import type { ButtonSign } from './cast';
import {
  BUTTONS,
  type ButtonLook,
  type ButtonPiece,
  CHROME_SHEET_KEY,
  COUNTER,
  type Fitted,
  INACTIVE_TAB,
  PANEL,
  type Piece,
  RIM,
  SHADOW_MARGIN,
  WINDOW_BAND,
  WINDOW_RIM,
} from './chrome-kit';
import {
  type Box,
  hitPointInWorld,
  onHover,
  onLetGoOffCanvas,
  reactsToPress,
} from './design-space';
import { asGlyph, glyphMark, SIGN_SHARE } from './glyphs';

/**
 * How many design units a pixel of the kit's files is drawn across on each kind of panel, which sets
 * how thin its rim stands: a strip along the screen's edge, and a plate.
 */
export const PANEL_RIMS = { strip: 0.16, plate: 0.12 } as const;

/** How far the resource bar's panel and the band's run on past the screen's edges, their corners off it. */
export const PAST_THE_EDGE = 30;

/** A piece of the kit made, drawn nowhere until it is laid over a box. */
function sliceOf(scene: Phaser.Scene, { frame, cuts }: Piece): Phaser.GameObjects.NineSlice {
  const { left, top, right, bottom } = cuts;
  return scene.add.nineslice(0, 0, CHROME_SHEET_KEY, frame, 1, 1, left, right, top, bottom);
}

/**
 * The piece laid so its own box is the box handed, its shadow round it, each of its pixels drawn
 * `scale` units across.
 */
function lay(
  slice: Phaser.GameObjects.NineSlice,
  { frame, cuts }: Piece,
  box: Box,
  scale: number,
): Phaser.GameObjects.NineSlice {
  if (slice.frame.name !== frame) slice.setFrame(frame);
  const { left, top, right, bottom } = cuts;
  const room = 2 * SHADOW_MARGIN;
  slice.setSlices(box.width / scale + room, box.height / scale + room, left, right, top, bottom);
  // `setSlices` leaves the display origin a hit test reads where the old size put it
  // (phaser/src/gameobjects/nineslice/NineSlice.js:428-502, phaser/src/input/InputManager.js:966).
  slice.updateDisplayOrigin();
  return slice.setScale(scale).setPosition(box.x + box.width / 2, box.y + box.height / 2);
}

/** A piece fitted to the box's narrower measure. */
function fit(slice: Phaser.GameObjects.NineSlice, piece: Fitted, box: Box): void {
  lay(slice, piece, box, Math.min(box.width, box.height) / piece.height);
}

/**
 * The piece taking the pointer on its own box, never on the shadow round it, and wherever else on its
 * surface `reaches` says it does.
 */
export function takesThePointer(
  slice: Phaser.GameObjects.NineSlice,
  reaches?: (x: number, y: number) => boolean,
): Phaser.GameObjects.NineSlice {
  return slice.setInteractive({
    hitArea: {},
    hitAreaCallback: (_area: object, x: number, y: number) => {
      if (
        x >= SHADOW_MARGIN &&
        y >= SHADOW_MARGIN &&
        x <= slice.width - SHADOW_MARGIN &&
        y <= slice.height - SHADOW_MARGIN
      ) {
        return true;
      }
      if (reaches === undefined) return false;
      const at = hitPointInWorld(slice, x, y);
      return reaches(at.x, at.y);
    },
  });
}

/** A panel of the kit, its rim drawn at that many units to a pixel of its file; `standChromePanel` lays it. */
export function createChromePanel(scene: Phaser.Scene, rim: number): Phaser.GameObjects.NineSlice {
  return sliceOf(scene, PANEL).setScale(rim);
}

/** The panel standing on the box, at the rim it was made at. */
export function standChromePanel(
  panel: Phaser.GameObjects.NineSlice,
  box: Box,
): Phaser.GameObjects.NineSlice {
  return lay(panel, PANEL, box, panel.scaleX);
}

/**
 * A window of the menu on the box: a panel at the window's rim, taking the pointer so that a press on
 * it is no press on what stands under it, and the gold band laid inside its top edge down to `foot`,
 * the dark line under it.
 */
export function createChromeWindow(
  scene: Phaser.Scene,
  box: Box,
  foot: number,
): Phaser.GameObjects.NineSlice[] {
  const panel = takesThePointer(standChromePanel(createChromePanel(scene, WINDOW_RIM), box));
  const inset = RIM.breadth * WINDOW_RIM;
  const { frame, cuts } = WINDOW_BAND;
  const { left, top, right, bottom } = cuts;
  const across = (box.width - 2 * inset) / WINDOW_RIM;
  const down = (foot - box.y - inset) / WINDOW_RIM + bottom;
  const band = scene.add
    .nineslice(0, 0, CHROME_SHEET_KEY, frame, across, down, left, right, top, bottom)
    .setOrigin(0, 0)
    .setScale(WINDOW_RIM)
    .setPosition(box.x + inset, box.y + inset);
  return [panel, band];
}

/** What a well is drawn as: the kit's inactive tab, or a button's gold. */
export type WellPiece = 'inactive-tab' | 'gold';

/** A button of the kit in one look, fitted to a box as the button is. */
function buttonIn(piece: ButtonPiece, look: ButtonLook): Fitted {
  const { looks, cuts, height } = BUTTONS[piece];
  return { frame: looks[look], cuts, height };
}

/** A well, named `name`, drawn nowhere until `placeChromeWell` lays it. */
export function createChromeWell(scene: Phaser.Scene, name: string): Phaser.GameObjects.NineSlice {
  return sliceOf(scene, INACTIVE_TAB).setName(name);
}

/** The piece a well is drawn as. */
function wellOf(piece: WellPiece): Fitted {
  switch (piece) {
    case 'inactive-tab':
      return INACTIVE_TAB;
    case 'gold':
      return buttonIn('gold', 'normal');
  }
}

/** The well drawn as the piece over the box, fitted to it. */
export function placeChromeWell(
  well: Phaser.GameObjects.NineSlice,
  piece: WellPiece,
  box: Box,
): void {
  fit(well, wellOf(piece), box);
}

/** The kit's counter chip, drawn nowhere until `placeChromeCounter` lays it. */
export function createChromeCounter(scene: Phaser.Scene): Phaser.GameObjects.NineSlice {
  return sliceOf(scene, COUNTER);
}

/** The counter chip over the box, fitted to it. */
export function placeChromeCounter(chip: Phaser.GameObjects.NineSlice, box: Box): void {
  fit(chip, COUNTER, box);
}

/** A button of the kit: its face, which a press lands on, and the look it wears. */
export type ChromeButton = {
  readonly face: Phaser.GameObjects.NineSlice;
  /** The look worn read again, for a button whose liveness has moved. */
  dress(): void;
  /** The button sunk in a well, the kit's inactive tab, wearing no look of its own; or standing again. */
  latch(on: boolean): void;
  /** The button laid on another box. */
  place(box: Box): void;
};

/**
 * Whether a button is live, and where else on its surface its face takes the pointer than on its own
 * box.
 */
export type ButtonReach = {
  readonly live?: () => boolean;
  readonly reaches?: (x: number, y: number) => boolean;
};

/**
 * A button of the kit on the box, its face named `name`, fitted to the box, the pointer the
 * hand on it. Live, it wears the hover look under the pointer, and the pressed look while a left press
 * that landed on it is held on it; dead, it wears neither.
 */
export function createChromeButton(
  scene: Phaser.Scene,
  piece: ButtonPiece,
  laidOn: Box,
  name: string,
  { live = () => true, reaches }: ButtonReach = {},
): ChromeButton {
  let box = laidOn;
  const face = takesThePointer(sliceOf(scene, buttonIn(piece, 'normal')).setName(name), reaches);
  reactsToPress(face);
  let latched = false;
  let held = false;

  const worn = (): ButtonLook =>
    !live() || !hover.hovered ? 'normal' : held ? 'pressed' : 'hover';
  const dress = (): void => {
    if (latched) return;
    const { frame } = buttonIn(piece, worn());
    if (face.frame.name !== frame) face.setFrame(frame);
  };
  const hover = onHover(face, dress, dress);

  face.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pressOf(pointer) !== 'left') return;
    held = true;
    dress();
  });
  const letGo = (): void => {
    held = false;
    dress();
  };
  const released = (pointer: Phaser.Input.Pointer): void => {
    if (pressOf(pointer) === 'left') letGo();
  };
  scene.input.on('pointerup', released);
  const unheard = onLetGoOffCanvas(scene, (press) => {
    if (press === 'left') letGo();
  });
  // The scene outlives the face: a window of the menu is laid again at every step.
  face.once('destroy', () => {
    scene.input.off('pointerup', released);
    unheard();
  });

  const stand = (): void => {
    fit(face, latched ? INACTIVE_TAB : buttonIn(piece, worn()), box);
  };
  stand();

  return {
    face,
    dress,
    latch(on: boolean): void {
      if (on === latched) return;
      latched = on;
      stand();
    },
    place(next: Box): void {
      box = next;
      stand();
    },
  };
}

/** A button of the kit wearing a sign and no word, the sign on its middle. */
export type SignButton = ChromeButton & {
  readonly sign: Phaser.GameObjects.Container;
  /** The sign drawn in that colour, its symbol's own where none is handed, `step` down and right of the middle. */
  ink(colour?: number, step?: number): void;
};

/**
 * A button of the kit on the box, its face named `name`, wearing the symbol's sign on its middle, in
 * the symbol's colour and with no outline, as wide a share of the box as a pile's sign is of its round.
 */
export function createSignButton(
  scene: Phaser.Scene,
  piece: ButtonPiece,
  symbol: ButtonSign,
  laidOn: Box,
  name: string,
  reach?: ButtonReach,
): SignButton {
  const button = createChromeButton(scene, piece, laidOn, name, reach);
  const sign = glyphMark(scene).setName(`${name}-sign`);
  let box = laidOn;
  let colour: number | undefined;
  let step = 0;
  const draw = (): void => {
    asGlyph(sign, symbol, SIGN_SHARE * box.height, colour === undefined ? {} : { colour });
    sign.setPosition(box.x + box.width / 2 + step, box.y + box.height / 2 + step);
  };
  draw();
  return {
    ...button,
    sign,
    place(next: Box): void {
      box = next;
      button.place(next);
      draw();
    },
    ink(next?: number, by = 0): void {
      colour = next;
      step = by;
      draw();
    },
  };
}
