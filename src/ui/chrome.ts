import type Phaser from 'phaser';
import { pressOf } from './bindings';
import type { ButtonSign } from './cast';
import {
  BUTTONS,
  type ButtonLook,
  type ButtonPiece,
  CHROME_SHEET_KEY,
  COUNTER,
  FIELD,
  type Fitted,
  FRAME_MARGIN,
  FRAME_SCALE,
  INACTIVE_TAB,
  MODE_FRAMES,
  type ModeFrame,
  PANEL,
  type Piece,
  RIBBON,
  RIM,
  SHADOW_MARGIN,
  STEEL,
  WINDOW_BAND,
  WINDOW_BAND_FOOT,
  WINDOW_RIM,
} from './chrome-kit';
import {
  addText,
  type Box,
  CLICKS,
  hitPointInWorld,
  NO_REACTION,
  onHover,
  onLetGoOffCanvas,
  ownBoxOf,
  reactsTo,
  type SizedStyle,
  UI_FONT,
} from './design-space';
import { asGlyph, glyphMark, SIGN_SHARE } from './glyphs';
import { css, LOOK } from './look';

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
 * The piece laid so its own box is the box handed, its shadow round it reaching `margin` of its
 * pixels past the box, each of its pixels drawn `scale` units across.
 */
function lay(
  slice: Phaser.GameObjects.NineSlice,
  { frame, cuts }: Piece,
  box: Box,
  scale: number,
  margin = SHADOW_MARGIN,
): Phaser.GameObjects.NineSlice {
  if (slice.frame.name !== frame) slice.setFrame(frame);
  const { left, top, right, bottom } = cuts;
  const room = 2 * margin;
  slice.setSlices(box.width / scale + room, box.height / scale + room, left, right, top, bottom);
  // `setSlices` leaves the display origin a hit test reads where the old size put it
  // (phaser/src/gameobjects/nineslice/NineSlice.js:428-502, phaser/src/input/InputManager.js:966).
  slice.updateDisplayOrigin();
  return slice.setScale(scale).setPosition(box.x + box.width / 2, box.y + box.height / 2);
}

/** How many units a pixel of the piece's file is drawn across, fitted to the box's narrower measure. */
function fittedScale(piece: Fitted, box: Box): number {
  return Math.min(box.width, box.height) / piece.height;
}

/** A piece fitted to the box's narrower measure. */
function fit(slice: Phaser.GameObjects.NineSlice, piece: Fitted, box: Box): void {
  lay(slice, piece, box, fittedScale(piece, box));
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

/** How far a panel hung from the resource bar's foot runs up behind it, its top corners with it. */
const BEHIND_THE_BAR = 10;

/**
 * The panel hung from the resource bar's foot, in the room of a point on the foot: `width` across
 * from `left`, reaching `height` under the foot.
 */
export function hangChromePanel(
  panel: Phaser.GameObjects.NineSlice,
  left: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  return standChromePanel(panel, {
    x: left,
    y: -BEHIND_THE_BAR,
    width,
    height: height + BEHIND_THE_BAR,
  });
}

/** The frame round the screen a standing is drawn as, drawn nowhere until `standChromeFrame` lays it. */
export function createChromeFrame(
  scene: Phaser.Scene,
  stood: ModeFrame,
): Phaser.GameObjects.NineSlice {
  return sliceOf(scene, MODE_FRAMES[stood]);
}

/** The frame laid round a screen that large, its rim's outer edge on the screen's edge. */
export function standChromeFrame(
  frame: Phaser.GameObjects.NineSlice,
  stood: ModeFrame,
  screen: { readonly width: number; readonly height: number },
): void {
  lay(frame, MODE_FRAMES[stood], { x: 0, y: 0, ...screen }, FRAME_SCALE, FRAME_MARGIN);
}

/** How far under a window's top the middle of its gold band stands, between the rim's inner edge and the band's foot. */
export const WINDOW_GOLD_MIDDLE = (RIM.breadth * WINDOW_RIM + WINDOW_BAND_FOOT) / 2;

/** The type and the ink a window's title reads in, on its gold band or on a ribbon. */
export const WINDOW_TITLE: SizedStyle = {
  fontFamily: UI_FONT,
  fontSize: '26px',
  fontStyle: 'bold',
  color: css(LOOK.metalInk),
};

/** How far a ribbon reaches past its words on each side, as a share of its height. */
const RIBBON_PAST = 0.9;

/** How far over a ribbon's middle its words' middle stands, as a share of its height. */
const RIBBON_LIFT = 0.04;

/** Words on the kit's ribbon: the ribbon, the words, and their laying. */
export type Ribbon = {
  readonly ribbon: Phaser.GameObjects.NineSlice;
  readonly title: Phaser.GameObjects.Text;
  /** The box the ribbon is painted on laid with its middle on the point, as long as its words now ask. */
  boxAt(x: number, y: number): Box;
  /** The ribbon laid on `boxAt`'s box, its words on it. */
  place(x: number, y: number): void;
};

/**
 * The words in that style on the kit's ribbon that tall, as long as the words ask, the words named
 * `<name>-title` and the ribbon `<name>-ribbon`; drawn nowhere until `place` lays them.
 */
export function createRibbon(
  scene: Phaser.Scene,
  reads: string,
  style: SizedStyle,
  height: number,
  name: string,
): Ribbon {
  const title = addText(scene, 0, 0, reads, style).setOrigin(0.5).setName(`${name}-title`);
  const ribbon = sliceOf(scene, RIBBON).setName(`${name}-ribbon`);
  const boxAt = (x: number, y: number): Box => {
    const width = ownBoxOf(title).width + 2 * RIBBON_PAST * height;
    return { x: x - width / 2, y: y - height / 2, width, height };
  };
  return {
    ribbon,
    title,
    boxAt,
    place(x, y) {
      fit(ribbon, RIBBON, boxAt(x, y));
      title.setPosition(x, y - RIBBON_LIFT * height);
    },
  };
}

/**
 * A window of the menu on the box: a panel at the window's rim, taking the pointer so that a press on
 * it is no press on what stands under it, and the gold band laid inside its top edge, the dark line
 * under it.
 */
export function createChromeWindow(scene: Phaser.Scene, box: Box): Phaser.GameObjects.NineSlice[] {
  const panel = takesThePointer(standChromePanel(createChromePanel(scene, WINDOW_RIM), box));
  const inset = RIM.breadth * WINDOW_RIM;
  const { frame, cuts } = WINDOW_BAND;
  const { left, top, right, bottom } = cuts;
  const across = (box.width - 2 * inset) / WINDOW_RIM;
  const down = (WINDOW_BAND_FOOT - inset) / WINDOW_RIM + bottom;
  const band = scene.add
    .nineslice(0, 0, CHROME_SHEET_KEY, frame, across, down, left, right, top, bottom)
    .setOrigin(0, 0)
    .setScale(WINDOW_RIM)
    .setPosition(box.x + inset, box.y + inset);
  return [panel, band];
}

/** What a well is drawn as: the kit's inactive tab, a button's gold, or the kit's field. */
export type WellPiece = 'inactive-tab' | 'gold' | 'field';

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
    case 'field':
      return FIELD;
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

/** The veil a thing a press lands on wears under the pointer, named `name`, hidden; `veilOver` lays it. */
export function createVeil(scene: Phaser.Scene, name: string): Phaser.GameObjects.Rectangle {
  const { colour, strength } = LOOK.underPointer;
  return scene.add
    .rectangle(0, 0, 1, 1, colour, strength)
    .setOrigin(0, 0)
    .setVisible(false)
    .setName(name);
}

/** The veil laid over the box, its corners rounded that far. */
export function veilOver(
  veil: Phaser.GameObjects.Rectangle,
  box: Box,
  corner: number,
): Phaser.GameObjects.Rectangle {
  return veil.setRounded(corner).setSize(box.width, box.height).setPosition(box.x, box.y);
}

/**
 * The veil laid over a row of a strip against the screen's left edge, from past the edge to the row's
 * right end, `width` from the edge and `height` tall, its corners the strip's.
 */
export function veilOverStripRow(
  veil: Phaser.GameObjects.Rectangle,
  width: number,
  height: number,
): Phaser.GameObjects.Rectangle {
  return veilOver(
    veil,
    { x: -PAST_THE_EDGE, y: 0, width: width + PAST_THE_EDGE, height },
    PANEL.corner * PANEL_RIMS.strip,
  );
}

/** A well a press lands on: its face, and the veil it wears under the pointer. */
export type PressableWell = {
  readonly face: Phaser.GameObjects.NineSlice;
  readonly veil: Phaser.GameObjects.Rectangle;
  /** The well standing as the kit's field in its place, wearing nothing under the pointer; or as a well again. */
  field(on: boolean): void;
};

/**
 * A well on the box, its face named `name`, reacting to a left click, lighter under the pointer
 * through a veil fitted to its rounded box; it wears no pressed look.
 */
export function createPressableWell(scene: Phaser.Scene, box: Box, name: string): PressableWell {
  const face = reactsTo(takesThePointer(createChromeWell(scene, name)), () => CLICKS);
  placeChromeWell(face, 'inactive-tab', box);
  const veil = veilOver(
    createVeil(scene, `${name}-veil`),
    box,
    INACTIVE_TAB.corner * fittedScale(INACTIVE_TAB, box),
  );
  let fielded = false;
  const dress = (): void => {
    veil.setVisible(hover.hovered && !fielded);
  };
  const hover = onHover(face, dress, dress);
  return {
    face,
    veil,
    field(on: boolean): void {
      if (on === fielded) return;
      fielded = on;
      placeChromeWell(face, on ? 'field' : 'inactive-tab', box);
      dress();
    },
  };
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
 * Whether a button is live, whether it wears the kit's steel in its piece's place and in no look, and
 * where else on its surface its face takes the pointer than on its own box.
 */
export type ButtonReach = {
  // Read while the button is built, so whatever it reads is declared before the button is made.
  readonly live?: () => boolean;
  readonly steel?: () => boolean;
  readonly reaches?: (x: number, y: number) => boolean;
};

/**
 * A button of the kit on the box, its face named `name`, fitted to the box. Live, it reacts to a left
 * click, wears the hover look under the pointer, and the pressed look while a left press that landed
 * on it is held on it; dead, it wears neither, and the pointer on it is the arrow whatever a rest raises.
 */
export function createChromeButton(
  scene: Phaser.Scene,
  piece: ButtonPiece,
  laidOn: Box,
  name: string,
  { live = () => true, steel = () => false, reaches }: ButtonReach = {},
): ChromeButton {
  let box = laidOn;
  const face = takesThePointer(sliceOf(scene, buttonIn(piece, 'normal')).setName(name), reaches);
  reactsTo(face, () => (live() ? CLICKS : NO_REACTION));
  let latched = false;
  let held = false;

  const worn = (): ButtonLook =>
    !live() || !hover.hovered ? 'normal' : held ? 'pressed' : 'hover';
  /** The piece the button stands as: its well while latched, else the steel or its piece in the look worn. */
  const wornPiece = (): Fitted => {
    if (latched) return INACTIVE_TAB;
    return steel() ? STEEL : buttonIn(piece, worn());
  };
  const dress = (): void => {
    const fitted = wornPiece();
    if (face.frame.name !== fitted.frame) fit(face, fitted, box);
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
    fit(face, wornPiece(), box);
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
  /** The sign drawn as that symbol's glyph. */
  wear(symbol: ButtonSign): void;
};

/**
 * A button of the kit on the box, its face named `name`, wearing the symbol's sign on its middle, in
 * the symbol's colour, or the steel's greyed ink while it wears the steel, with no outline, as wide a
 * share of the box as a pile's sign is of its round.
 */
export function createSignButton(
  scene: Phaser.Scene,
  piece: ButtonPiece,
  wornFirst: ButtonSign,
  laidOn: Box,
  name: string,
  reach: ButtonReach = {},
): SignButton {
  const button = createChromeButton(scene, piece, laidOn, name, reach);
  const { steel = () => false } = reach;
  const sign = glyphMark(scene).setName(`${name}-sign`);
  let symbol = wornFirst;
  let box = laidOn;
  let colour: number | undefined;
  let step = 0;
  const draw = (): void => {
    const inked = steel() ? LOOK.greyedInk : colour;
    asGlyph(sign, symbol, SIGN_SHARE * box.height, inked === undefined ? {} : { colour: inked });
    sign.setPosition(box.x + box.width / 2 + step, box.y + box.height / 2 + step);
  };
  draw();
  return {
    ...button,
    sign,
    dress(): void {
      button.dress();
      draw();
    },
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
    wear(next: ButtonSign): void {
      symbol = next;
      draw();
    },
  };
}
