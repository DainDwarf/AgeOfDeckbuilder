import { blankCanvas, type Made, type Sheet } from './sheet';

/** The folder DRStudios' metal kit stands in, under the assets folder, at the scale the game loads. */
const KIT = 'store/uiforge-metal-ui-kit/png/2x';

/** The key of the sheet the kit's pieces are drawn into. */
export const CHROME_SHEET_KEY = 'chrome';

/** How far every file of the kit reaches past its piece on each side, for the piece's shadow, in its pixels. */
export const SHADOW_MARGIN = 10;

/** Where a file of the kit is cut: its corners stand outside these lines, in its pixels from each edge. */
export type Cuts = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

/** One drawing of the kit: its frame of the sheet, and where it is cut. */
export type Piece = { readonly frame: string; readonly cuts: Cuts };

/** A piece drawn at the height something stands, fitted to it by its own height under its shadow. */
export type Fitted = Piece & { readonly height: number };

const BUTTON_LOOKS = ['normal', 'hover', 'pressed'] as const;

/** The looks a button of the kit wears. */
export type ButtonLook = (typeof BUTTON_LOOKS)[number];

/** The kit's buttons the chrome draws: its gold, and its bright silver. */
export type ButtonPiece = 'gold' | 'silver';

/**
 * A button of the kit: its file in each look, and the frame each look is drawn from on a box as wide
 * as tall, cut alike.
 */
type Button = {
  readonly looks: Readonly<Record<ButtonLook, string>>;
  readonly squares: Readonly<Record<ButtonLook, string>>;
  readonly cuts: Cuts;
  readonly height: number;
};

/** How many columns a frame keeps of a middle every draw of it stretches. */
const SLAB = 2;

/**
 * What a frame made off a file of the kit holds between its corners: a slab of the file's flat
 * middle, or the whole middle squeezed so the frame stands as wide as tall.
 */
type Middle = 'slab' | 'square';

/**
 * A frame of the sheet made off a file of the kit, as tall as the file: its corners copied as cut,
 * and its middle between them.
 */
function madeOff(
  file: string,
  frame: string,
  { cuts, height }: Pick<Fitted, 'cuts' | 'height'>,
  middle: Middle,
): Made {
  const tall = height + 2 * SHADOW_MARGIN;
  /** How many columns the middle stands across, and how many of the file's middle it is read off. */
  const { across, read } = ((): { across: number; read: (between: number) => number } => {
    switch (middle) {
      case 'slab':
        return { across: SLAB, read: () => SLAB };
      case 'square':
        return { across: tall - cuts.left - cuts.right, read: (between) => between };
    }
  })();
  const width = cuts.left + across + cuts.right;
  return {
    frame,
    width,
    height: tall,
    paint: (context, paintingIn) => {
      const from = paintingIn(CHROME_SHEET_KEY, file);
      // A squeeze reads past its source's edges, so it is read off the file alone, not the sheet round it.
      const own = blankCanvas(from.width, tall);
      own.drawImage(from.canvas, from.x, from.y, from.width, tall, 0, 0, from.width, tall);
      const right = from.width - cuts.right;
      const on = blankCanvas(width, tall);
      on.imageSmoothingQuality = 'high';
      on.drawImage(own.canvas, 0, 0, cuts.left, tall, 0, 0, cuts.left, tall);
      on.drawImage(
        own.canvas,
        cuts.left,
        0,
        read(right - cuts.left),
        tall,
        cuts.left,
        0,
        across,
        tall,
      );
      on.drawImage(own.canvas, right, 0, cuts.right, tall, cuts.left + across, 0, cuts.right, tall);
      context.drawImage(on.canvas, 0, 0);
    },
  };
}

/** A button of the kit in those files, its frame for a square named after each. */
function buttonOf(looks: Readonly<Record<ButtonLook, string>>, cuts: Cuts, height: number): Button {
  const square = (look: ButtonLook): string => `${looks[look]}#square`;
  return {
    looks,
    squares: { normal: square('normal'), hover: square('hover'), pressed: square('pressed') },
    cuts,
    height,
  };
}

export const PANEL: Piece = {
  frame: `${KIT}/panel_normal.png`,
  cuts: { left: 68, top: 68, right: 68, bottom: 68 },
};

const TAB_FILE = `${KIT}/tab_inactive.png`;

/** The kit's inactive tab, a well, drawn off a slab of its flat middle. */
export const TAB: Fitted = {
  frame: `${TAB_FILE}#slab`,
  cuts: { left: 44, top: 44, right: 44, bottom: 52 },
  height: 92,
};

const COUNTER_FILE = `${KIT}/currency_normal.png`;

/**
 * The kit's counter chip, drawn off a slab of its flat middle, its cuts meeting in its middle: a box
 * as wide as tall draws it round.
 */
export const COUNTER: Fitted = {
  frame: `${COUNTER_FILE}#slab`,
  cuts: { left: 62, top: 62, right: 62, bottom: 62 },
  height: 104,
};

export const BUTTONS: Readonly<Record<ButtonPiece, Button>> = {
  gold: buttonOf(
    {
      normal: `${KIT}/btn_cta_normal.png`,
      hover: `${KIT}/btn_cta_hover.png`,
      pressed: `${KIT}/btn_cta_pressed.png`,
    },
    { left: 54, top: 54, right: 54, bottom: 62 },
    164,
  ),
  silver: buttonOf(
    {
      normal: `${KIT}/btn_primary_normal.png`,
      hover: `${KIT}/btn_primary_hover.png`,
      pressed: `${KIT}/btn_primary_pressed.png`,
    },
    { left: 46, top: 46, right: 46, bottom: 54 },
    108,
  ),
};

/** The kit's window, whose gold band a window of the menu wears. */
const MODAL = `${KIT}/modal_normal.png`;

/**
 * The window's gold band in the kit's window file: the column it is read down and how wide, the row
 * it starts on, how many rows reach the dark line under it, and how many more that line takes.
 */
const MODAL_BAND = { column: 420, across: 4, top: 21, rows: 118, line: 8 };

/** How many design units a pixel of the kit's files is drawn across on a window of the menu. */
export const WINDOW_RIM = 0.24;

/**
 * How far under a window's top the gold band is painted to reach, the dark line left out; a window
 * whose title takes the band further or less stretches its middle to that.
 */
const PAINTED_FOOT = 66;

/** How far inside a piece's edge its rim reaches, and the radius of the rim's inner corners, in its file's pixels. */
export const RIM = { breadth: 11.5, corner: 23 };

/** How tall the kit's dark line under the band is drawn, in units, and in the band's pixels. */
const LINE_UNDER = 4;
const LINE_PIXELS = Math.round(LINE_UNDER / WINDOW_RIM);

/** How tall the gold band is painted inside the rim, at a window's rim, in the kit's pixels. */
const BAND_PIXELS = Math.round((PAINTED_FOOT - RIM.breadth * WINDOW_RIM) / WINDOW_RIM);

/**
 * The gold band laid inside a window's top edge, the dark line under it: the kit window's band read
 * down one column, its top corners rounded as the rim's inner corner, cut above the line.
 */
export const WINDOW_BAND: Piece & { readonly width: number; readonly height: number } = {
  frame: 'window-band',
  cuts: { left: RIM.corner, top: RIM.corner, right: RIM.corner, bottom: LINE_PIXELS },
  width: 2 * RIM.corner + SLAB,
  height: BAND_PIXELS + LINE_PIXELS,
};

export const CHROME_SHEET: Sheet = {
  key: CHROME_SHEET_KEY,
  files: [
    PANEL.frame,
    MODAL,
    ...Object.values(BUTTONS).flatMap(({ looks }) => Object.values(looks)),
    TAB_FILE,
    COUNTER_FILE,
  ],
  made: [
    madeOff(TAB_FILE, TAB.frame, TAB, 'slab'),
    madeOff(COUNTER_FILE, COUNTER.frame, COUNTER, 'slab'),
    ...Object.values(BUTTONS).flatMap((button) =>
      BUTTON_LOOKS.map((look) =>
        madeOff(button.looks[look], button.squares[look], button, 'square'),
      ),
    ),
    {
      frame: WINDOW_BAND.frame,
      width: WINDOW_BAND.width,
      height: WINDOW_BAND.height,
      paint: (context, paintingIn) => {
        const modal = paintingIn(CHROME_SHEET_KEY, MODAL);
        const { width, height } = WINDOW_BAND;
        const { column, across, top, rows, line } = MODAL_BAND;
        const pitch = BAND_PIXELS / rows;
        context.beginPath();
        context.roundRect(0, 0, width, height, [RIM.corner, RIM.corner, 0, 0]);
        context.clip();
        context.drawImage(
          modal.canvas,
          modal.x + column,
          modal.y + top,
          across,
          rows + line,
          0,
          0,
          width,
          (rows + line) * pitch,
        );
      },
    },
  ],
  side: 2048,
  rowGap: 16,
  columnGap: 16,
};
